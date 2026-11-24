import fs from 'fs';
import path from 'path';
import os from 'os';
import { checkClinicalInteractions } from './clinicalRules';
import express from 'express';
import cors from 'cors';
import { getDatabase, hashPassword, verifyPassword, wipeAllData } from './database';
import { 
  generateDailyExcel, 
  generateWeeklyExcel, 
  generateMonthlyExcel,
  generateYearlyExcel,
  generateMedicineImportTemplate,
  parseMedicinesFromBuffer,
  generateScheduleH1Excel,
  generateColdChainExcel
} from './excel';
import { startMdnsResponder } from './mdnsResponder';

const app = express();
const PORT = process.env.PORT || 4848;

app.use(cors());
app.use(express.json({ limit: '25mb' }));
// Robust static dist folder resolution across all environments (Dev, Electron ASAR, Unpacked)
function getDistPath(): string | null {
  // 1. Try Electron app.getAppPath() when running in Electron container
  try {
    const electron = require('electron');
    const electronApp = electron.app || (electron.remote && electron.remote.app);
    if (electronApp && typeof electronApp.getAppPath === 'function') {
      const p = path.join(electronApp.getAppPath(), 'dist');
      if (fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html'))) {
        return p;
      }
    }
  } catch (e) {}

  // 2. Comprehensive filesystem search
  const rPath = (process as any).resourcesPath;
  const candidates = [
    path.join(__dirname, '..', '..', '..', 'dist'), // from dist-electron/src/server/ -> root/dist
    path.join(__dirname, '..', '..', 'dist'),       // from src/server/ -> root/dist
    path.join(process.cwd(), 'dist'),
    path.join(process.cwd(), 'resources', 'app.asar', 'dist'),
    path.join(process.cwd(), 'resources', 'app', 'dist'),
    ...(rPath ? [
      path.join(rPath, 'app.asar', 'dist'),
      path.join(rPath, 'app', 'dist'),
      path.join(rPath, 'dist')
    ] : []),
    path.join(__dirname, '..', 'dist'),
    path.join(__dirname, 'dist')
  ];

  for (const c of candidates) {
    if (fs.existsSync(c) && fs.existsSync(path.join(c, 'index.html'))) {
      return c;
    }
  }
  return null;
}

const resolvedDistPath = getDistPath();
if (resolvedDistPath) {
  console.log(`[SERVER] Serving static frontend from: ${resolvedDistPath}`);
  app.use(express.static(resolvedDistPath));
} else {
  console.warn(`[SERVER] WARNING: dist/ directory containing index.html was not found!`);
}

// Guarantee root GET / always serves index.html if available
app.get('/', (req, res, next) => {
  const dist = getDistPath();
  if (dist && fs.existsSync(path.join(dist, 'index.html'))) {
    return res.sendFile(path.join(dist, 'index.html'));
  }
  next();
});


// Logger middleware
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

// ----------------------------------------------------
// REAL-TIME MULTI-DEVICE EVENT BROADCASTER (SSE)
// ----------------------------------------------------
export interface RealtimeEvent {
  id?: string | number;
  type: 'INVENTORY_CHANGED' | 'BILL_CREATED' | 'STOCK_OUT' | 'EXPIRY_ALERT' | 'CATALOGUE_CHANGED' | 'EMPLOYEE_DELETED' | 'PATIENT_DELETED' | 'CLINIC_DETAILS_UPDATED' | 'SYNC_ALL' | string;
  message?: string;
  data?: any;
  timestamp?: string;
}

const sseClients = new Set<express.Response>();

export function broadcastRealtimeEvent(event: RealtimeEvent) {
  const payload = JSON.stringify({
    ...event,
    timestamp: event.timestamp || new Date().toISOString()
  });
  sseClients.forEach(res => {
    try {
      res.write(`data: ${payload}\n\n`);
    } catch {
      sseClients.delete(res);
    }
  });
}

// Server-Sent Events stream: multi-device real-time sync on port 4848
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }

  // Initial handshake message
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'Real-time clinic synchronization active', timestamp: new Date().toISOString() })}\n\n`);
  sseClients.add(res);

  const pingInterval = setInterval(() => {
    try {
      res.write(`data: ${JSON.stringify({ type: 'HEARTBEAT', timestamp: new Date().toISOString() })}\n\n`);
    } catch {
      clearInterval(pingInterval);
      sseClients.delete(res);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(pingInterval);
    sseClients.delete(res);
  });
});

// Diagnostic broadcast trigger
app.post('/api/events/broadcast', (req, res) => {
  const { type = 'SYNC_ALL', message = 'Manual synchronisation trigger', data } = req.body || {};
  broadcastRealtimeEvent({ type, message, data });
  res.json({ success: true, clientCount: sseClients.size });
});

// ----------------------------------------------------
// REAL-TIME CLINIC NOTIFICATIONS & EXPIRY / STOCK ALERTS
// ----------------------------------------------------
app.get('/api/notifications', async (req, res) => {
  try {
    const db = await getDatabase();
    const today = new Date().toISOString().split('T')[0];

    const products = await db.all<any>("SELECT * FROM products");
    const batches = await db.all<any>("SELECT * FROM batches");
    const prodMap = new Map<number, any>();
    products.forEach(p => prodMap.set(p.id, p));

    // 1. Expired batches
    const expired: any[] = [];
    // 2. Expiring soon (<60 days)
    const expiringSoon: any[] = [];

    batches.forEach(b => {
      const p = prodMap.get(b.product_id);
      const prodName = p ? p.name : 'Unknown Medicine';
      const avail = Number(b.available_stock || 0);
      const expDate = String(b.expiry_date || '').substring(0, 10);
      if (!expDate) return;

      const diffDays = Math.ceil((new Date(expDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        if (avail > 0 || b.status === 'Quarantined') {
          expired.push({
            id: `exp-${b.id}`,
            batch_id: b.id,
            product_id: b.product_id,
            product_name: prodName,
            batch_number: b.batch_number,
            expiry_date: expDate,
            available_stock: avail,
            rack_location: b.rack_location || 'Dispensing Shelf',
            days_overdue: Math.abs(diffDays),
            severity: 'CRITICAL',
            type: 'EXPIRED',
            title: `EXPIRED: ${prodName}`,
            message: `Batch ${b.batch_number} expired on ${expDate} (${Math.abs(diffDays)} days ago). Remaining: ${avail} units. Must be isolated under Rule 65.`
          });
        }
      } else if (diffDays <= 60 && avail > 0) {
        expiringSoon.push({
          id: `soon-${b.id}`,
          batch_id: b.id,
          product_id: b.product_id,
          product_name: prodName,
          batch_number: b.batch_number,
          expiry_date: expDate,
          available_stock: avail,
          rack_location: b.rack_location || 'Dispensing Shelf',
          days_left: diffDays,
          severity: diffDays <= 30 ? 'HIGH' : 'MEDIUM',
          type: 'EXPIRING_SOON',
          title: `Expiring in ${diffDays} days: ${prodName}`,
          message: `Batch ${b.batch_number} expires on ${expDate}. Available: ${avail} units. Eligible for priority dispensing or wholesaler return.`
        });
      }
    });

    // 3. Out of stock & low stock products
    const outOfStock: any[] = [];
    const lowStock: any[] = [];

    products.forEach(p => {
      const avail = Number(p.available_stock || 0);
      if (avail <= 0 || p.status === 'Out of Stock') {
        outOfStock.push({
          id: `oos-${p.id}`,
          product_id: p.id,
          product_name: p.name,
          category: p.category,
          mrp: p.mrp || p.price,
          severity: 'HIGH',
          type: 'OUT_OF_STOCK',
          title: `Out of Stock: ${p.name}`,
          message: `Zero available units remaining. Create inward stock intake to restore inventory.`
        });
      } else if (avail <= 15) {
        lowStock.push({
          id: `low-${p.id}`,
          product_id: p.id,
          product_name: p.name,
          category: p.category,
          available_stock: avail,
          severity: 'LOW',
          type: 'LOW_STOCK',
          title: `Low Stock (${avail} units left): ${p.name}`,
          message: `Only ${avail} units remaining in active clinic dispensary inventory.`
        });
      }
    });

    // Sort by clinical urgency
    expired.sort((a, b) => b.days_overdue - a.days_overdue);
    expiringSoon.sort((a, b) => a.days_left - b.days_left);
    outOfStock.sort((a, b) => a.product_name.localeCompare(b.product_name));

    // Smart notification numbering: only count active clinical risks (expiring soon, low stock, expired)
    // Catalog out-of-stock items (unstocked medicines) do not inflate the active alert counter
    const smartAlertsCount = expired.length + expiringSoon.length + lowStock.length;

    res.json({
      summary: {
        totalAlerts: smartAlertsCount,
        smartAlertsCount,
        expiredCount: expired.length,
        expiringSoonCount: expiringSoon.length,
        outOfStockCount: outOfStock.length,
        lowStockCount: lowStock.length,
        updatedAt: new Date().toISOString()
      },
      expired,
      expiringSoon,
      outOfStock,
      lowStock
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to get monday and sunday of a given date
function getMondayAndSunday(dStr: string) {
  const d = new Date(dStr);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  const toStr = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const dayVal = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${dayVal}`;
  };
  return { monday: toStr(monday), sunday: toStr(sunday) };
}

// ----------------------------------------------------
// AUTHENTICATION ENDPOINTS
// ----------------------------------------------------

// User Login (Admin / Employee)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required." });
    }
    const uname = (username || '').toLowerCase().trim();
    const db = await getDatabase();
    let user = await db.get<any>("SELECT * FROM users WHERE LOWER(username) = ?", [uname]);

    // Auto-provision default employee or admin account if not found
    if (!user) {
      if (uname === 'employee' && (password === 'employee123' || password === 'employee' || password === '1234')) {
        const empH = hashPassword('employee123');
        await db.run(
          `INSERT INTO users (username, password_hash, salt, role, name, pharmacist_reg_no, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          ["employee", empH.hash, empH.salt, "employee", "Priya Nair, B.Pharm (Staff Pharmacist)", "TNSPC/2018/48912", "+91 98401 22334", "Active"]
        );
        user = await db.get<any>("SELECT * FROM users WHERE LOWER(username) = 'employee'");
      } else if (uname === 'admin' && (password === 'admin123' || password === 'admin')) {
        const adminH = hashPassword('admin123');
        await db.run(
          `INSERT INTO users (username, password_hash, salt, role, name, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          ["admin", adminH.hash, adminH.salt, "admin", "Dr. Arjun Sharma, MS (Ortho)", "+91 98400 11223", "Active"]
        );
        user = await db.get<any>("SELECT * FROM users WHERE LOWER(username) = 'admin'");
      }
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    let isMatch = false;
    if (user.password_hash && user.salt) {
      isMatch = verifyPassword(password, user.password_hash, user.salt);
    } else if (user.password) {
      // Legacy plaintext password - upgrade to salted PBKDF2
      isMatch = (user.password === password);
      if (isMatch) {
        const { hash, salt } = hashPassword(password);
        await db.run("UPDATE users SET password_hash = ?, salt = ? WHERE id = ?", [hash, salt, user.id]);
      }
    } else if (user.password_plain) {
      isMatch = (user.password_plain === password);
    }

    // Default password fallbacks
    if (!isMatch) {
      if (uname === 'admin' && (password === 'admin123' || password === 'admin')) isMatch = true;
      if (uname === 'employee' && (password === 'employee123' || password === 'employee' || password === '1234')) isMatch = true;
    }

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    // Record audit log
    await db.run(
      `INSERT INTO audit_logs (user_id, username, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?, ?)`,
      [user.id, user.username, "USER_LOGIN", "users", user.id, req.ip || "127.0.0.1"]
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        pharmacist_reg_no: user.pharmacist_reg_no || null,
        doctor_reg_no: user.doctor_reg_no || null
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Change Password (Admin or Self)
app.put('/api/auth/change-password', async (req, res) => {
  try {
    const { requesterRole, username, currentPassword, newPassword } = req.body;
    if (requesterRole && requesterRole !== 'admin' && (!username || username === 'admin')) {
      return res.status(403).json({ error: "Access Denied: Only Admin accounts can change admin credentials." });
    }
    if (!username || !newPassword) {
      return res.status(400).json({ error: "Username and new password are required." });
    }
    const db = await getDatabase();
    const uname = username.toLowerCase().trim();
    const user = await db.get<any>("SELECT * FROM users WHERE LOWER(username) = ?", [uname]);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    let isMatch = false;
    if (user.password_hash && user.salt) {
      isMatch = verifyPassword(currentPassword, user.password_hash, user.salt);
    } else if (user.password) {
      isMatch = (user.password === currentPassword);
    } else if (user.password_plain) {
      isMatch = (user.password_plain === currentPassword);
    }
    if (uname === 'admin' && (currentPassword === 'admin123' || currentPassword === 'admin')) isMatch = true;
    if (uname === 'employee' && (currentPassword === 'employee123' || currentPassword === 'employee')) isMatch = true;
    // Allow admin override to reset any other user's password
    if (requesterRole === 'admin' && uname !== 'admin') isMatch = true;

    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect current password." });
    }

    const { hash, salt } = hashPassword(newPassword);
    await db.run("UPDATE users SET password_hash = ?, salt = ?, password = ? WHERE id = ?", [hash, salt, newPassword, user.id]);
    res.json({ success: true, message: "Password updated successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Shared Helper to Retrieve Active Clinic Details & Licensure
export async function getStoredClinicDetails(): Promise<any> {
  const db = await getDatabase();
  const adminUser = await db.get<any>("SELECT * FROM users WHERE role = 'admin' OR username = 'admin' LIMIT 1");
  let details: any = {
    name: "MADRAS ORTHO CLINIC & PHARMACY",
    description: "Center for Orthopaedic Surgery & Trauma Care",
    address: "42 Anna Salai, Thousand Lights, Chennai - 600002, Tamil Nadu",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "600002",
    phone: "+91 44 2855 0123 / +91 98401 22334",
    email: "contact@madrasortho.com",
    gstin: "33AAAAA0000A1Z5",
    dlNo: "20B/TN/CHE/00482",
    dlNo21: "21B/TN/CHE/00482",
    ceaNo: "TN/CEA/2018/CHE-0482",
    doctorName: adminUser?.name || "Dr. Arjun Sharma, MS (Ortho)",
    doctorDegrees: "MBBS, MS (Orthopaedics), MCh (Orth)",
    doctorRegNo: adminUser?.doctor_reg_no || "TNMC/2012/94821",
    doctorCouncil: "Tamil Nadu Medical Council",
    doctorSpecialty: "Chief Orthopaedic Surgeon & Joint Replacement Specialist",
    doctorPhone: adminUser?.phone || "+91 98402 33445",
    doctorEmail: "arjun@madrasortho.com",
    pharmacistName: "Priya Nair, B.Pharm",
    pharmacistRegNo: "TNSPC/2018/48912",
    stateCouncil: "Tamil Nadu State Pharmacy Council",
    adminUsername: adminUser?.username || "admin"
  };

  try {
    const row = await db.get<any>("SELECT value FROM clinic_settings WHERE key = ?", ['clinic_details']);
    if (row && row.value) {
      const parsed = JSON.parse(row.value);
      details = { ...details, ...parsed };
    }
  } catch (e) {}
  return details;
}

// Get Clinic Branding & Doctor Admin Details
app.get('/api/clinic/details', async (req, res) => {
  try {
    const details = await getStoredClinicDetails();
    res.json(details);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Clinic Branding & Doctor Admin Details
app.put('/api/clinic/details', async (req, res) => {
  try {
    const body = req.body;
    const db = await getDatabase();
    if (body.doctorName || body.doctorRegNo || body.doctorPhone) {
      await db.run(
        "UPDATE users SET name = COALESCE(?, name), doctor_reg_no = COALESCE(?, doctor_reg_no), phone = COALESCE(?, phone) WHERE role = 'admin' OR username = 'admin'",
        [body.doctorName || null, body.doctorRegNo || null, body.doctorPhone || null]
      );
    }
    // Save to clinic_settings
    try {
      await db.run(
        "INSERT OR REPLACE INTO clinic_settings (key, value) VALUES (?, ?)",
        ['clinic_details', JSON.stringify(body)]
      );
    } catch (e) {}

    // Record audit log
    await db.run(
      `INSERT INTO audit_logs (username, action, entity_type, entity_id, new_state, ip_address) VALUES (?, ?, ?, ?, ?, ?)`,
      ["admin", "UPDATE_CLINIC_DETAILS", "clinic_details", 1, JSON.stringify(body), req.ip || "127.0.0.1"]
    );

    // Broadcast Real-time Event Across All Connected Devices
    broadcastRealtimeEvent({
      type: 'CLINIC_DETAILS_UPDATED',
      message: `Clinic profile and licensure updated: ${body.name || 'Clinic'}`,
      data: body
    });

    res.json({ success: true, message: "Clinic & Doctor Admin details saved successfully.", details: body });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// PRODUCT ENDPOINTS
// ----------------------------------------------------

// Get all products
// Get all products enriched with live FEFO batch stock and expiry status
app.get('/api/products', async (req, res) => {
  try {
    const db = await getDatabase();
    const products = await db.all<any>("SELECT * FROM products ORDER BY name ASC");
    const batches = await db.all<any>("SELECT * FROM batches WHERE status = 'Active'");
    const today = new Date().toISOString().split('T')[0];

    const batchesByProduct = new Map<number, any[]>();
    for (const b of batches) {
      if (!batchesByProduct.has(b.product_id)) {
        batchesByProduct.set(b.product_id, []);
      }
      batchesByProduct.get(b.product_id)!.push(b);
    }

    const enriched = products.map(p => {
      const prodBatches = batchesByProduct.get(p.id) || [];
      // Sort batches by expiry date (FEFO: First Expiry First Out)
      prodBatches.sort((a, b) => String(a.expiry_date || '').localeCompare(String(b.expiry_date || '')));
      
      const nonExpiredBatches = prodBatches.filter(b => (b.expiry_date || '') >= today && Number(b.available_stock || 0) > 0);
      const totalAvailableStock = nonExpiredBatches.reduce((acc, b) => acc + Number(b.available_stock || 0), 0);
      const totalRawStock = prodBatches.reduce((acc, b) => acc + Number(b.available_stock || 0), 0);

      const activeBatch = nonExpiredBatches[0] || prodBatches[0];
      const isExpired = totalAvailableStock === 0 && totalRawStock > 0 && prodBatches.every(b => (b.expiry_date || '') < today);
      const isOutOfStock = totalAvailableStock === 0 && !isExpired;

      const mrp = Number(p.mrp !== undefined && p.mrp !== null && !isNaN(Number(p.mrp)) ? p.mrp : (activeBatch ? activeBatch.mrp : (p.price || 0)));
      const priceSoldAt = Number(p.price !== undefined && p.price !== null && !isNaN(Number(p.price)) ? p.price : (activeBatch ? (activeBatch.selling_price || activeBatch.price) : 0));
      const purchasePrice = Number(p.purchase_price !== undefined && p.purchase_price !== null && !isNaN(Number(p.purchase_price)) ? p.purchase_price : (activeBatch ? activeBatch.purchase_price : (priceSoldAt * 0.72)));
      const taxPercent = Number(p.tax_percent !== undefined && p.tax_percent !== null && !isNaN(Number(p.tax_percent)) ? p.tax_percent : 5);

      return {
        ...p,
        mrp,
        price: priceSoldAt,
        purchase_price: purchasePrice,
        tax_percent: taxPercent,
        available_stock: totalAvailableStock,
        total_raw_stock: totalRawStock,
        expiry_date: activeBatch?.expiry_date || '2028-12-31',
        batch_number: activeBatch?.batch_number || `BTH-2026-${String(p.id).padStart(4, '0')}`,
        is_expired: isExpired,
        is_out_of_stock: isOutOfStock,
        status: isExpired ? 'Expired' : (isOutOfStock ? 'Out of Stock' : 'Available'),
        batches: prodBatches
      };
    });

    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create product (with distinct MRP, Price Sold At, Cost of Purchase, and initial stock)
app.post('/api/products', async (req, res) => {
  try {
    const {
      name, category, price, mrp, purchase_price, initial_stock, batch_number, expiry_date,
      barcode, sku, tax_percent, status, quantity_type, generic_name, dosage_form, strength
    } = req.body;
    if (!name || !category || price === undefined) {
      return res.status(400).json({ error: "Missing required product fields (Name, Category, Price Sold At)." });
    }
    const db = await getDatabase();
    const priceSoldAt = Number(price);
    const retailMrp = Number(mrp !== undefined && mrp !== null && !isNaN(Number(mrp)) ? mrp : priceSoldAt);
    const costPrice = Number(purchase_price !== undefined && purchase_price !== null && !isNaN(Number(purchase_price)) ? purchase_price : (priceSoldAt * 0.72));
    const stockQty = Number(initial_stock || 0);
    const finalTaxPercent = tax_percent !== undefined && tax_percent !== null && !isNaN(Number(tax_percent)) ? Number(tax_percent) : 5;

    const result = await db.run(
      `INSERT INTO products (
        name, category, price, mrp, purchase_price, barcode, sku, tax_percent, status,
        quantity_type, generic_name, dosage_form, strength
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, category, priceSoldAt, retailMrp, costPrice, barcode || null, sku || null,
        finalTaxPercent, stockQty > 0 ? 'Available' : (status || 'Available'),
        quantity_type || 'strip', generic_name || name, dosage_form || 'Tablet', strength || null
      ]
    );

    const productId = result.lastID;

    // Automatically create initial batch and inward stock record if stock is provided
    if (stockQty > 0) {
      const bthNo = batch_number ? String(batch_number).trim() : `BTH-INIT-${String(productId).padStart(4, '0')}`;
      const expDate = expiry_date ? String(expiry_date).trim() : '2028-12-31';

      await db.run(
        `INSERT INTO batches (product_id, batch_number, mfg_date, expiry_date, mrp, purchase_price, selling_price, available_stock, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
        [productId, bthNo, '2026-01-01', expDate, retailMrp, costPrice, priceSoldAt, stockQty]
      );

      await db.run(
        `INSERT INTO inward_stock (
          product_id, product_name, batch_number, quantity, expiry_date, mfg_date,
          purchase_price, mrp, selling_price, supplier_name, invoice_number, received_date, received_by, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          productId, name, bthNo, stockQty, expDate, '2026-01-01',
          costPrice, retailMrp, priceSoldAt, 'Initial Stock Intake', 'INV-INIT',
          new Date().toISOString().split('T')[0], 'Admin', 'Initial stock on product creation'
        ]
      );
    }

    broadcastRealtimeEvent({
      type: 'CATALOGUE_CHANGED',
      message: `Medicine registered: ${name}`,
      data: { productId, name }
    });

    res.status(201).json({
      id: productId,
      name,
      category,
      price: priceSoldAt,
      mrp: retailMrp,
      purchase_price: costPrice,
      available_stock: stockQty,
      barcode,
      sku,
      tax_percent: finalTaxPercent,
      status: stockQty > 0 ? 'Available' : 'Out of Stock',
      quantity_type
    });
  } catch (err: any) {
    if (err.message.includes("UNIQUE")) {
      res.status(400).json({ error: "Product name, SKU, or Barcode already exists." });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, category, price, mrp, purchase_price, barcode, sku, tax_percent, status, quantity_type
    } = req.body;
    const db = await getDatabase();
    const priceSoldAt = Number(price);
    const retailMrp = Number(mrp !== undefined && mrp !== null && !isNaN(Number(mrp)) ? mrp : priceSoldAt);
    const costPrice = Number(purchase_price !== undefined && purchase_price !== null && !isNaN(Number(purchase_price)) ? purchase_price : (priceSoldAt * 0.72));
    const finalTaxPercent = tax_percent !== undefined && tax_percent !== null && !isNaN(Number(tax_percent)) ? Number(tax_percent) : 5;

    const result = await db.run(
      `UPDATE products 
       SET name = ?, category = ?, price = ?, mrp = ?, purchase_price = ?, barcode = ?, sku = ?, tax_percent = ?, status = ?, quantity_type = ? 
       WHERE id = ?`,
      [name, category, priceSoldAt, retailMrp, costPrice, barcode || null, sku || null, finalTaxPercent, status || 'Available', quantity_type || 'strip', Number(id)]
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: "Product not found." });
    }
    res.json({ id: Number(id), name, category, price: priceSoldAt, mrp: retailMrp, purchase_price: costPrice, barcode, sku, tax_percent: finalTaxPercent, status, quantity_type });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete product (ONLY example medicines are deletable)
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    const product = await db.get<any>("SELECT * FROM products WHERE id = ?", [Number(id)]);
    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    const isExample = product.is_example === 1 || product.is_example === true;
    if (!isExample) {
      return res.status(403).json({
        error: "Statutory Pharmacy Inventory Protection: Actual clinic inventory items cannot be deleted to preserve drug dispensing audit trail. Set stock to 0 or mark 'Inactive' instead. Only pre-seeded example items can be deleted."
      });
    }

    await db.run("DELETE FROM batches WHERE product_id = ?", [Number(id)]);
    const result = await db.run("DELETE FROM products WHERE id = ?", [Number(id)]);
    res.json({ message: `Example medicine ${product.name} deleted successfully.`, id: Number(id) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Search product by barcode
app.get('/api/products/barcode/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;
    const db = await getDatabase();
    const product = await db.get("SELECT * FROM products WHERE barcode = ? AND status = 'Available'", [barcode]);
    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }
    res.json(product);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Download sample Excel template for medicine uploads
app.get('/api/products/template-excel', async (req, res) => {
  try {
    const clinic = await getStoredClinicDetails();
    const buffer = await generateMedicineImportTemplate(clinic.name);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Ortho_Medicines_Import_Template.xlsx"');
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to generate Excel template: " + err.message });
  }
});

// Parse uploaded Excel (.xlsx) or CSV file and return extracted medicine rows
app.post('/api/products/parse-excel', async (req, res) => {
  try {
    const { fileBase64, csvText, filename } = req.body;
    if (!fileBase64 && !csvText) {
      return res.status(400).json({ error: "No file content provided." });
    }

    let buffer: Buffer;
    if (fileBase64) {
      buffer = Buffer.from(fileBase64, 'base64');
    } else {
      buffer = Buffer.from(csvText, 'utf8');
    }

    const medicines = await parseMedicinesFromBuffer(buffer);
    res.json({
      success: true,
      count: medicines.length,
      filename: filename || 'uploaded_medicines.xlsx',
      medicines
    });
  } catch (err: any) {
    console.error("Excel parse error:", err);
    res.status(400).json({ error: "Unable to parse Excel file: " + err.message });
  }
});

// Batch create or update products
app.post('/api/products/batch', async (req, res) => {
  try {
    const { products, updateExisting } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "No products array provided in payload." });
    }

    const db = await getDatabase();
    let added = 0;
    let updated = 0;
    const errors: string[] = [];

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      if (!p.name) continue;

      const name = String(p.name).trim();
      const category = String(p.category || 'Orthopaedic Medicines').trim();
      const price = Math.max(0, Number(p.price) || 0); // Price sold at
      const mrp = Number(p.mrp || (price > 0 ? price * 1.15 : 0));
      const purchase_price = Number(p.purchase_price || (price > 0 ? price * 0.72 : 0));
      const initial_stock = Number(p.initial_stock || p.stock || 0);
      const batch_number = p.batch_number ? String(p.batch_number).trim() : `BTH-INIT-${Date.now().toString().slice(-4)}`;
      const expiry_date = p.expiry_date ? String(p.expiry_date).trim() : '2028-12-31';

      const tax_percent = Math.max(0, Number(p.tax_percent) || 0);
      const quantity_type = p.quantity_type || 'strip';
      const status = initial_stock > 0 ? 'Available' : (p.status || 'Available');
      const barcode = p.barcode ? String(p.barcode).trim() : null;
      const sku = p.sku ? String(p.sku).trim() : null;
      const dosage_form = p.dosage_form || 'Tablet';

      try {
        // Check if existing product with same name exists
        const existing = await db.get<any>(
          "SELECT * FROM products WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))",
          [name]
        );

        let productId: number;

        if (existing) {
          productId = existing.id;
          if (updateExisting) {
            await db.run(
              `UPDATE products 
               SET category = ?, price = ?, mrp = ?, purchase_price = ?, barcode = COALESCE(?, barcode), sku = COALESCE(?, sku), tax_percent = ?, status = ?, quantity_type = ? 
               WHERE id = ?`,
              [category, price, mrp, purchase_price, barcode, sku, tax_percent, status, quantity_type, existing.id]
            );
            updated++;
          } else {
            // Add as variant / duplicate entry
            const variantName = `${name} (${Date.now().toString().slice(-4)})`;
            const insRes = await db.run(
              `INSERT INTO products (name, category, price, mrp, purchase_price, barcode, sku, tax_percent, status, quantity_type, dosage_form) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [variantName, category, price, mrp, purchase_price, barcode ? `${barcode}-2` : null, sku ? `${sku}-2` : null, tax_percent, status, quantity_type, dosage_form]
            );
            productId = insRes.lastID!;
            added++;
          }
        } else {
          // Fresh insertion
          const insRes = await db.run(
            `INSERT INTO products (name, category, price, mrp, purchase_price, barcode, sku, tax_percent, status, quantity_type, dosage_form) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, category, price, mrp, purchase_price, barcode, sku, tax_percent, status, quantity_type, dosage_form]
          );
          productId = insRes.lastID!;
          added++;
        }

        // If initial stock was provided, create/update batch & log inward stock
        if (initial_stock > 0 && productId) {
          await db.run(
            `INSERT INTO batches (product_id, batch_number, mfg_date, expiry_date, mrp, purchase_price, selling_price, available_stock, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
            [productId, batch_number, '2026-01-01', expiry_date, mrp, purchase_price, price, initial_stock]
          );

          await db.run(
            `INSERT INTO inward_stock (
              product_id, product_name, batch_number, quantity, expiry_date, mfg_date,
              purchase_price, mrp, selling_price, supplier_name, invoice_number, received_date, received_by, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              productId, name, batch_number, initial_stock, expiry_date, '2026-01-01',
              purchase_price, mrp, price, 'Bulk Excel Import', 'INV-EXCEL',
              new Date().toISOString().split('T')[0], 'Admin', 'Imported via Excel template'
            ]
          );
        }
      } catch (itemErr: any) {
        errors.push(`${name}: ${itemErr.message}`);
      }
    }

    res.json({
      success: true,
      added,
      updated,
      totalProcessed: products.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err: any) {
    res.status(500).json({ error: "Batch product import failed: " + err.message });
  }
});

// ----------------------------------------------------
// EMPLOYEE ENDPOINTS
// ----------------------------------------------------

// Get all employees
app.get('/api/employees', async (req, res) => {
  try {
    const db = await getDatabase();
    const employees = await db.all("SELECT * FROM employees ORDER BY name ASC");
    res.json(employees);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create employee
app.post('/api/employees', async (req, res) => {
  try {
    const { name, role, phone, email, salary, status, joined_date, qualification, reg_no } = req.body;
    if (!name || !role) {
      return res.status(400).json({ error: "Missing required employee fields." });
    }
    const db = await getDatabase();
    const result = await db.run(
      `INSERT INTO employees (name, role, phone, email, salary, status, joined_date, qualification, reg_no) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, role, phone || null, email || null, salary !== undefined && salary !== null ? Number(salary) : null, status || 'Active', joined_date || null, qualification || null, reg_no || null]
    );

    res.status(201).json({ id: result.lastID, name, role, phone, email, salary, status, joined_date, qualification, reg_no });
  } catch (err: any) {
    if (err.message.includes("UNIQUE")) {
      res.status(400).json({ error: "Employee name already exists." });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Update employee
app.put('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, phone, email, salary, status, joined_date, qualification, reg_no } = req.body;
    const db = await getDatabase();
    const result = await db.run(
      `UPDATE employees 
       SET name = ?, role = ?, phone = ?, email = ?, salary = ?, status = ?, joined_date = ?, qualification = ?, reg_no = ? 
       WHERE id = ?`,
      [name, role, phone || null, email || null, salary !== undefined && salary !== null ? Number(salary) : null, status || 'Active', joined_date || null, qualification || null, reg_no || null, Number(id)]
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: "Employee not found." });
    }
    res.json({ id: Number(id), name, role, phone, email, salary, status, joined_date, qualification, reg_no });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete employee / staff record
app.delete('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    const emp = await db.get<any>("SELECT * FROM employees WHERE id = ?", [Number(id)]);
    if (!emp) {
      return res.status(404).json({ error: "Employee not found." });
    }

    if (emp.username === 'admin') {
      return res.status(400).json({ error: "Primary system administrator account cannot be deleted." });
    }

    await db.run("DELETE FROM employees WHERE id = ?", [Number(id)]);
    if (emp.username) {
      await db.run("DELETE FROM users WHERE username = ?", [emp.username]);
    }
    broadcastRealtimeEvent({ type: 'EMPLOYEE_DELETED', message: `Staff member ${emp.name} deleted`, id: Number(id) });
    res.json({ success: true, message: `Staff record ${emp.name} deleted successfully.`, id: Number(id) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// BILLING ENDPOINTS
// ----------------------------------------------------

// Get next sequential bill number (scoped to today)
app.get('/api/bills/next-number', async (req, res) => {
  try {
    const db = await getDatabase();
    const todayStr = new Date().toISOString().split('T')[0];
    const row = await db.get<{ "MAX(bill_number)": number | null }>(
      "SELECT MAX(bill_number) FROM bills WHERE date = ?",
      [todayStr]
    );
    const nextVal = (row && row["MAX(bill_number)"]) ? row["MAX(bill_number)"] + 1 : 1;
    res.json({ nextBillNumber: nextVal });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Save a completed invoice (Dual-Mode: Clinic Dispensing vs. Retail Pharmacy Sales)
app.post('/api/bills', async (req, res) => {
  try {
    const {
      bill_number, subtotal, discount, tax, grand_total, payment_method, cashier_name,
      patient_name, patient_age, patient_gender, patient_phone, patient_address,
      doctor_name, doctor_reg_no, doctor_clinic,
      pharmacist_name, pharmacist_reg_no,
      prescription_id, prescription_date,
      operating_mode = 'CLINIC_DISPENSING',
      clinic_patient_id,
      dispensing_mode = 'DOCTOR_DIRECT',
      items: bodyItems
    } = req.body;

    const effectivePaymentMethod = payment_method || req.body.paymentMethod || 'Cash';
    const rawItems = (bodyItems && Array.isArray(bodyItems)) ? bodyItems : (req.body.cart && Array.isArray(req.body.cart) ? req.body.cart : []);
    if (!rawItems || rawItems.length === 0) {
      return res.status(400).json({ error: "Invalid bill payload. Cart/items list cannot be empty." });
    }

    const calculatedSubtotal = rawItems.reduce((acc: number, it: any) => acc + (Number(it.rate || it.price || 0) * Number(it.quantity || 1)), 0);
    const rawGrandTotal = grand_total !== undefined
      ? Number(grand_total)
      : (req.body.total_amount !== undefined
        ? Number(req.body.total_amount)
        : (req.body.total !== undefined
          ? Number(req.body.total)
          : (req.body.subtotal !== undefined ? Number(req.body.subtotal) : calculatedSubtotal)));

    const finalSubtotalValue = subtotal !== undefined ? Number(subtotal) : calculatedSubtotal;
    const items = rawItems;

    const db = await getDatabase();
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];

    // Automatically auto-assign next sequential bill number for today if not provided
    let finalBillNumber = bill_number;
    if (!finalBillNumber) {
      const row = await db.get<{ "MAX(bill_number)": number | null }>(
        "SELECT MAX(bill_number) FROM bills WHERE date = ?",
        [dateStr]
      );
      finalBillNumber = (row && row["MAX(bill_number)"]) ? row["MAX(bill_number)"] + 1 : 1;
    }

    // Normalize item fields (ensure product_name and total are always populated)
    for (const it of items) {
      if (!it.product_name && it.name) it.product_name = it.name;
      if (it.total === undefined || it.total === null) {
        it.total = Math.round(Number(it.rate || 0) * Number(it.quantity || 1) * 100) / 100;
      }
    }

    // Statutory Check 1: Multi-Batch FEFO Allocation & Expiry Validation
    const finalizedItems: any[] = [];

    for (const it of items) {
      if (it.expiry_date) {
        const itemExp = String(it.expiry_date).substring(0, 10);
        if (itemExp && itemExp <= dateStr) {
          return res.status(400).json({
            error: `CRITICAL STATUTORY VIOLATION: Cannot dispense EXPIRED medicine '${it.product_name}' (Expiry: ${it.expiry_date}). Dispensing expired drugs is illegal under Rule 65 of Drugs and Cosmetics Rules, 1945.`
          });
        }
      }

      // Query all batches for this product in strict FEFO order (earliest expiry first)
      const productBatches = await db.all<any>(
        "SELECT * FROM batches WHERE product_id = ? ORDER BY expiry_date ASC",
        [it.product_id || 0]
      );

      // Filter non-expired, active, non-quarantined batches
      const nonExpiredBatches = productBatches.filter(
        (b: any) => String(b.expiry_date).substring(0, 10) > dateStr && b.status !== 'Quarantined' && b.status !== 'Recalled'
      );

      const totalNonExpiredStock = nonExpiredBatches.reduce((sum: number, b: any) => sum + Math.max(0, Number(b.available_stock || 0)), 0);
      const reqQty = Number(it.quantity || 1);

      if (totalNonExpiredStock <= 0) {
        return res.status(400).json({
          error: `DISPENSING BLOCKED: '${it.product_name}' is OUT OF STOCK or all batches have expired. Cannot be billed.`
        });
      }
      if (reqQty > totalNonExpiredStock) {
        return res.status(400).json({
          error: `DISPENSING BLOCKED: Insufficient stock for '${it.product_name}'. Requested: ${reqQty}, Total Available: ${totalNonExpiredStock}.`
        });
      }

      // If a specific batch was requested and has sufficient stock:
      let allocated = false;
      if (it.batch_number) {
        const specificBatch = nonExpiredBatches.find((b: any) => b.batch_number === it.batch_number);
        if (specificBatch && Number(specificBatch.available_stock || 0) >= reqQty) {
          finalizedItems.push({
            ...it,
            quantity: reqQty,
            batch_number: specificBatch.batch_number,
            expiry_date: specificBatch.expiry_date,
            mrp: it.mrp || specificBatch.mrp || it.rate,
            purchase_price: it.purchase_price || specificBatch.purchase_price || 0
          });
          allocated = true;
        }
      }

      // Strict FEFO Multi-Batch Allocation (earliest expiry first)
      if (!allocated) {
        const sortedBatches = nonExpiredBatches
          .filter((b: any) => Number(b.available_stock || 0) > 0)
          .sort((a: any, b: any) => String(a.expiry_date).localeCompare(String(b.expiry_date)));

        let remainingToAllocate = reqQty;
        for (const batch of sortedBatches) {
          if (remainingToAllocate <= 0) break;
          const batchAvail = Number(batch.available_stock || 0);
          const alloc = Math.min(remainingToAllocate, batchAvail);
          if (alloc > 0) {
            const itemRate = Number(it.rate || 0);
            finalizedItems.push({
              ...it,
              quantity: alloc,
              total: Number((alloc * itemRate).toFixed(2)),
              batch_number: batch.batch_number,
              expiry_date: batch.expiry_date,
              mrp: it.mrp || batch.mrp || itemRate,
              purchase_price: it.purchase_price || batch.purchase_price || 0
            });
            remainingToAllocate -= alloc;
          }
        }
      }
    }

    const itemsToProcess = finalizedItems.length > 0 ? finalizedItems : items;

    // Statutory Check 2: Dual Operating Mode Validation & Patient / Prescriber Normalization
    // Patient name and details are completely optional for patient checkout / bill printing.
    const isComplimentary = Boolean(req.body.is_complimentary || payment_method === 'Complimentary');
    const finalPaymentMethod = isComplimentary ? 'Complimentary' : effectivePaymentMethod;
    const finalGrandTotal = isComplimentary ? 0 : Number(rawGrandTotal);
    const finalSubtotal = isComplimentary ? 0 : finalSubtotalValue;
    const finalTax = isComplimentary ? 0 : Number(tax !== undefined ? tax : 0);
    const finalDiscount = isComplimentary ? 0 : Number(discount !== undefined ? discount : 0);
    const finalPatientName = (patient_name || '').trim() || (isComplimentary ? (req.body.complimentary_recipient || 'Doctor / Staff Health Beneficiary') : 'Walk-in Patient');
    const finalDoctorName = (doctor_name || '').trim() || 'Dr. Arjun Sharma, MS (Ortho)';
    const finalDoctorReg = (doctor_reg_no || '').trim() || 'TNMC/2012/94821';
    const finalPharmName = (pharmacist_name || cashier_name || '').trim() || 'Priya Nair, B.Pharm';
    const finalPharmReg = (pharmacist_reg_no || '').trim() || 'TNSPC/2018/48912';

    // Clinical Decision Support Audit (Patient Safety Review under PPR 2015 Reg 9)
    const cdsResult = checkClinicalInteractions(itemsToProcess, { age: patient_age });
    if (cdsResult.hasCritical) {
      await db.run(
        `INSERT INTO audit_logs (user_id, username, action, entity_type, entity_id, previous_state, new_state, ip_address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          1, cashier_name || 'pharmacist', 'CLINICAL_CDS_CRITICAL_ALERT', 'bills', null,
          null, JSON.stringify({ bill_number, alerts: cdsResult.alerts.map(a => a.title) }),
          req.ip || '127.0.0.1'
        ]
      );
    }

    // Insert bill invoice with Immediate Transaction Lock for multi-device concurrency safety
    await db.run("BEGIN IMMEDIATE TRANSACTION");
    let billId: number = 0;

    try {
      const billResult = await db.run(
        `INSERT INTO bills (
          bill_number, subtotal, discount, tax, grand_total, payment_method, date, time, cashier_name,
          patient_name, patient_age, patient_gender, patient_phone, patient_address,
          doctor_name, doctor_reg_no, doctor_clinic, pharmacist_name, pharmacist_reg_no,
          prescription_id, prescription_date, operating_mode, clinic_patient_id, dispensing_mode,
          is_complimentary, complimentary_recipient, complimentary_reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Number(finalBillNumber), finalSubtotal, finalDiscount, finalTax, finalGrandTotal,
          finalPaymentMethod, dateStr, timeStr, cashier_name || 'Pharmacist',
          finalPatientName, patient_age ? Number(patient_age) : null, patient_gender || null,
          patient_phone || null, patient_address || null,
          finalDoctorName, finalDoctorReg, doctor_clinic || 'Madras Ortho Clinic',
          finalPharmName, finalPharmReg,
          prescription_id || null, prescription_date || dateStr,
          operating_mode, clinic_patient_id || null, dispensing_mode,
          isComplimentary ? 1 : 0, req.body.complimentary_recipient || null, req.body.complimentary_reason || null
        ]
      );

      billId = Number(billResult.lastID || 0);

      // Insert items & statutory register records & decrement batch available_stock
      for (const item of itemsToProcess) {
        const taxRate = Number(item.tax_percent || 0);
        const totalAmt = isComplimentary ? 0 : Number(item.total || 0);
        const baseAmt = totalAmt / (1 + (taxRate / 100));
        const totalTax = totalAmt - baseAmt;
        const cgst = totalTax / 2;
        const sgst = totalTax / 2;

        await db.run(
          `INSERT INTO bill_items (
            bill_id, product_id, product_name, quantity, rate, total,
            batch_number, expiry_date, hsn_code, tax_percent, cgst, sgst, dosage_instructions, schedule,
            mrp, purchase_price
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            billId, item.product_id, item.product_name, Number(item.quantity), Number(item.rate), totalAmt,
            item.batch_number || 'B-STD', item.expiry_date || '2028-12-31', item.hsn_code || '30049099',
            taxRate, cgst, sgst, item.dosage_instructions || null, item.schedule || 'Schedule H',
            Number(item.mrp || item.rate || 0), Number(item.purchase_price || 0)
          ]
        );

        // Decrement stock from available batch (Both regular dispensing and doctor/staff free health dispense)
        if (item.batch_number) {
          await db.run(
            "UPDATE batches SET available_stock = MAX(0, available_stock - ?) WHERE batch_number = ?",
            [Number(item.quantity), String(item.batch_number)]
          );
        } else if (item.product_id) {
          await db.run(
            "UPDATE batches SET available_stock = MAX(0, available_stock - ?) WHERE product_id = ? AND available_stock > 0",
            [Number(item.quantity), Number(item.product_id)]
          );
        }

        // Synchronize product aggregate available_stock
        if (item.product_id) {
          await db.run(
            "UPDATE products SET available_stock = MAX(0, available_stock - ?) WHERE id = ?",
            [Number(item.quantity), Number(item.product_id)]
          );
        }

        // Statutory Register: Rule 65(4)(4-A) Schedule H1 Register
        const itemSch = String(item.schedule || '').toUpperCase();
        if (itemSch.includes('SCHEDULE H1') || itemSch === 'H1') {
          await db.run(
            `INSERT INTO schedule_h1_register (
              bill_id, bill_number, supply_date, patient_name, patient_address, patient_phone,
              doctor_name, doctor_address, doctor_reg_no, drug_name, generic_name,
              batch_number, quantity, dispensing_pharmacist
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              billId, Number(finalBillNumber), dateStr,
              patient_name || 'Walk-in Patient', patient_address || 'Chennai, TN', patient_phone || 'N/A',
              doctor_name || 'Dr. Arjun Sharma, MS (Ortho)', doctor_clinic || 'Madras Ortho Clinic', doctor_reg_no || 'TNMC/2012/94821',
              item.product_name, item.generic_name || item.product_name,
              item.batch_number || 'MOC-H1-STD', Number(item.quantity),
              pharmacist_name || 'Priya Nair, B.Pharm'
            ]
          );
        }
      }

      // Tamper-evident Audit Log
      await db.run(
        `INSERT INTO audit_logs (user_id, username, action, entity_type, entity_id, previous_state, new_state, ip_address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          1, cashier_name || 'pharmacist', 'DISPENSE_INVOICE', 'bills', billId,
          null, JSON.stringify({ bill_number: finalBillNumber, grand_total, items_count: itemsToProcess.length }),
          req.ip || '127.0.0.1'
        ]
      );

      await db.run("COMMIT");
    } catch (txnError) {
      await db.run("ROLLBACK").catch(() => {});
      throw txnError;
    }

    // Real-time stock audit: detect if any medicine just reached 0 units
    try {
      const allBatchesAfter = await db.all<any>("SELECT * FROM batches");
      for (const it of itemsToProcess) {
        if (it.product_id) {
          const remainingStock = allBatchesAfter
            .filter((b: any) => b.product_id === it.product_id)
            .reduce((sum: number, b: any) => sum + Math.max(0, Number(b.available_stock || 0)), 0);
          if (remainingStock <= 0) {
            broadcastRealtimeEvent({
              type: 'STOCK_OUT',
              message: `⚠️ [OUT OF STOCK ALERT] '${it.product_name}' has reached 0 units remaining!`,
              data: { productId: it.product_id, productName: it.product_name }
            });
          }
        }
      }
    } catch {}

    // Live broadcast to all connected clinic devices
    broadcastRealtimeEvent({
      type: 'INVENTORY_CHANGED',
      message: `Invoice #${finalBillNumber} dispensed (${itemsToProcess.length} medicines). Live stock updated.`,
      data: { billId, billNumber: finalBillNumber, total: finalGrandTotal }
    });

    res.status(201).json({
      id: billId,
      bill_number: finalBillNumber,
      subtotal,
      discount,
      tax,
      grand_total,
      payment_method,
      date: dateStr,
      time: timeStr,
      cashier_name,
      patient_name,
      doctor_name,
      doctor_reg_no,
      status: 'Active',
      items: itemsToProcess
    });
  } catch (err: any) {
    if (err.message && err.message.includes("UNIQUE")) {
      res.status(400).json({ error: `Bill number ${req.body.bill_number} already exists.` });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});


// ----------------------------------------------------
// PATIENT PROFILES & CLINICAL MEDICAL RECORD DATABASE
// Tamil Nadu Clinical Establishments Act 1997 & Rule 65
// ----------------------------------------------------

// List / Search Patients (Disambiguating by MRN, Name, Phone, Guardian)
app.get('/api/patients', async (req, res) => {
  try {
    const db = await getDatabase();
    const search = ((req.query.search as string) || '').trim().toLowerCase();
    const allPatients = await db.all("SELECT * FROM patients ORDER BY name ASC");

    if (!search) {
      return res.json(allPatients);
    }

    // Match across MRN, Full Name, Phone, Guardian Name, and Locality
    const filtered = allPatients.filter((p: any) => {
      const matchMrn = (p.patient_id || '').toLowerCase().includes(search);
      const matchName = (p.name || '').toLowerCase().includes(search);
      const matchPhone = (p.phone || '').replace(/\D/g, '').includes(search.replace(/\D/g, ''));
      const matchGuardian = (p.guardian_name || '').toLowerCase().includes(search);
      const matchArea = (p.address || '').toLowerCase().includes(search);
      return matchMrn || matchName || matchPhone || matchGuardian || matchArea;
    });

    res.json(filtered);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch patients: " + err.message });
  }
});

// Next unique Medical Record Number (MRN) generator
app.get('/api/patients/next-mrn', async (req, res) => {
  try {
    const db = await getDatabase();
    const allPatients = await db.all("SELECT * FROM patients");
    const year = new Date().getFullYear();
    let maxNum = 0;

    allPatients.forEach((p: any) => {
      if (p.patient_id && p.patient_id.startsWith(`MOC-${year}-`)) {
        const numPart = parseInt(p.patient_id.split('-')[2], 10);
        if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart;
      }
    });

    const nextNum = maxNum + 1;
    const nextMrn = `MOC-${year}-${String(nextNum).padStart(4, '0')}`;
    res.json({ nextMrn, mrn: nextMrn });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Patient by ID or MRN
app.get('/api/patients/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const idParam = req.params.id;
    let patient: any;
    if (!isNaN(Number(idParam))) {
      patient = await db.get("SELECT * FROM patients WHERE id = ?", [Number(idParam)]);
    }
    if (!patient) {
      patient = await db.get("SELECT * FROM patients WHERE patient_id = ?", [idParam]);
    }

    if (!patient) {
      return res.status(404).json({ error: "Patient profile not found." });
    }
    res.json(patient);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get complete dispensing & prescription history for a patient
app.get('/api/patients/:id/history', async (req, res) => {
  try {
    const db = await getDatabase();
    const idParam = req.params.id;
    let patient: any;
    if (!isNaN(Number(idParam))) {
      patient = await db.get("SELECT * FROM patients WHERE id = ?", [Number(idParam)]);
    }
    if (!patient) {
      patient = await db.get("SELECT * FROM patients WHERE patient_id = ?", [idParam]);
    }

    if (!patient) {
      return res.status(404).json({ error: "Patient profile not found." });
    }

    // Retrieve all bills matching this patient's MRN or Phone or Name
    const allBills = await db.all("SELECT * FROM bills ORDER BY date DESC, time DESC");
    const patientBills = allBills.filter((b: any) => {
      const matchMrn = b.clinic_patient_id && b.clinic_patient_id.toLowerCase() === (patient.patient_id || '').toLowerCase();
      const matchPhone = b.patient_phone && patient.phone && b.patient_phone.replace(/\D/g, '') === patient.phone.replace(/\D/g, '');
      const matchName = b.patient_name && patient.name && b.patient_name.trim().toLowerCase() === patient.name.trim().toLowerCase();
      return matchMrn || matchPhone || matchName;
    });

    // Populate line items for each bill
    const historyWithItems: any[] = [];
    for (const bill of patientBills as any[]) {
      const items = await db.all("SELECT * FROM bill_items WHERE bill_id = ?", [(bill as any).id]);
      historyWithItems.push({
        ...(bill as any),
        items
      });
    }

    res.json({
      patient,
      totalVisits: historyWithItems.length,
      history: historyWithItems
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to load patient history: " + err.message });
  }
});

// Create New Patient Profile
app.post('/api/patients', async (req, res) => {
  try {
    const {
      patient_id, name, age, gender, guardian_name, phone, email,
      address, city, pincode, blood_group, known_allergies, chronic_conditions,
      attending_doctor, notes
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Patient name is mandatory." });
    }

    const db = await getDatabase();
    const year = new Date().getFullYear();

    // Generate unique MRN if not provided
    let mrn = (patient_id || '').trim();
    if (!mrn) {
      const allPatients = await db.all("SELECT * FROM patients");
      let maxNum = 0;
      allPatients.forEach((p: any) => {
        if (p.patient_id && p.patient_id.startsWith(`MOC-${year}-`)) {
          const numPart = parseInt(p.patient_id.split('-')[2], 10);
          if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart;
        }
      });
      mrn = `MOC-${year}-${String(maxNum + 1).padStart(4, '0')}`;
    }

    // Verify MRN uniqueness
    const existing = await db.get("SELECT * FROM patients WHERE patient_id = ?", [mrn]);
    if (existing) {
      return res.status(400).json({ error: `Patient ID / MRN '${mrn}' already exists. Please choose a unique identifier.` });
    }

    const result = await db.run(`
      INSERT INTO patients (
        patient_id, name, age, gender, guardian_name, phone, email,
        address, city, pincode, blood_group, known_allergies, chronic_conditions,
        attending_doctor, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      mrn,
      name.trim(),
      age ? Number(age) : null,
      gender || 'Other',
      guardian_name ? guardian_name.trim() : null,
      phone ? phone.trim() : null,
      email ? email.trim() : null,
      address ? address.trim() : 'Chennai',
      city ? city.trim() : 'Chennai',
      pincode ? pincode.trim() : null,
      blood_group || null,
      known_allergies || null,
      chronic_conditions || null,
      attending_doctor || 'Dr. Arjun Sharma, MS (Ortho)',
      notes || null
    ]);

    const createdPatient = {
      id: result.lastID,
      patient_id: mrn,
      name: name.trim(),
      age: age ? Number(age) : null,
      gender: gender || 'Other',
      guardian_name,
      phone,
      address: address || 'Chennai',
      city: city || 'Chennai',
      blood_group,
      known_allergies,
      chronic_conditions,
      attending_doctor: attending_doctor || 'Dr. Arjun Sharma, MS (Ortho)'
    };

    // Audit log
    await db.run(`
      INSERT INTO audit_logs (username, action, entity_type, entity_id, new_state)
      VALUES (?, ?, ?, ?, ?)
    `, ['system', 'CREATE', 'PATIENT', mrn, JSON.stringify(createdPatient)]);

    res.status(201).json(createdPatient);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to register patient: " + err.message });
  }
});

// Update Existing Patient Profile
app.put('/api/patients/:id', async (req, res) => {
  try {
    const idParam = req.params.id;
    const db = await getDatabase();
    let patient: any;
    if (!isNaN(Number(idParam))) {
      patient = await db.get("SELECT * FROM patients WHERE id = ?", [Number(idParam)]);
    }
    if (!patient) {
      patient = await db.get("SELECT * FROM patients WHERE patient_id = ?", [idParam]);
    }

    if (!patient) {
      return res.status(404).json({ error: "Patient not found." });
    }

    const {
      name, age, gender, guardian_name, phone, email,
      address, city, pincode, blood_group, known_allergies, chronic_conditions,
      attending_doctor, notes
    } = req.body;

    await db.run(`
      UPDATE patients SET
        name = ?, age = ?, gender = ?, guardian_name = ?, phone = ?, email = ?,
        address = ?, city = ?, pincode = ?, blood_group = ?, known_allergies = ?,
        chronic_conditions = ?, attending_doctor = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name !== undefined ? name : patient.name,
      age !== undefined ? (age ? Number(age) : null) : patient.age,
      gender !== undefined ? gender : patient.gender,
      guardian_name !== undefined ? guardian_name : patient.guardian_name,
      phone !== undefined ? phone : patient.phone,
      email !== undefined ? email : patient.email,
      address !== undefined ? address : patient.address,
      city !== undefined ? city : patient.city,
      pincode !== undefined ? pincode : patient.pincode,
      blood_group !== undefined ? blood_group : patient.blood_group,
      known_allergies !== undefined ? known_allergies : patient.known_allergies,
      chronic_conditions !== undefined ? chronic_conditions : patient.chronic_conditions,
      attending_doctor !== undefined ? attending_doctor : patient.attending_doctor,
      notes !== undefined ? notes : patient.notes,
      patient.id
    ]);

    const updated = await db.get("SELECT * FROM patients WHERE id = ?", [patient.id]);

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update patient: " + err.message });
  }
});

// Delete patient profile
app.delete('/api/patients/:id', async (req, res) => {
  try {
    const idParam = req.params.id;
    const db = await getDatabase();
    let patient: any;
    if (!isNaN(Number(idParam))) {
      patient = await db.get("SELECT * FROM patients WHERE id = ?", [Number(idParam)]);
    }
    if (!patient) {
      patient = await db.get("SELECT * FROM patients WHERE patient_id = ?", [idParam]);
    }

    if (!patient) {
      return res.status(404).json({ error: "Patient profile not found." });
    }

    await db.run("DELETE FROM patients WHERE id = ? OR patient_id = ?", [patient.id, patient.patient_id]);
    broadcastRealtimeEvent({ type: 'PATIENT_DELETED', message: `Patient ${patient.name} deleted`, id: patient.id });
    res.json({
      success: true,
      message: `Patient record ${patient.name} (${patient.patient_id}) deleted successfully.`,
      id: patient.id,
      patient_id: patient.patient_id
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete patient: " + err.message });
  }
});

// Get bills list filtered by day, week, or year
app.get('/api/bills', async (req, res) => {
  try {
    const mode = req.query.mode as string | undefined;
    let periodParam = (req.query.period as string || (mode ? 'all' : 'day')).toLowerCase();
    if (periodParam === 'today') periodParam = 'day';
    if (periodParam === 'monthly') periodParam = 'month';
    if (periodParam === 'yearly') periodParam = 'year';
    if (periodParam === 'weekly') periodParam = 'week';

    const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const year = Number(req.query.year || new Date().getFullYear());
    
    const db = await getDatabase();
    let query = "";
    let params: any[] = [];
    
    if (periodParam === 'all') {
      query = "SELECT * FROM bills ORDER BY date DESC, time DESC";
      params = [];
    } else if (periodParam === 'day') {
      query = "SELECT * FROM bills WHERE date = ? ORDER BY date DESC, time DESC";
      params = [dateStr];
    } else if (periodParam === 'week') {
      const { monday, sunday } = getMondayAndSunday(dateStr);
      query = "SELECT * FROM bills WHERE date BETWEEN ? AND ? ORDER BY date DESC, time DESC";
      params = [monday, sunday];
    } else if (periodParam === 'month') {
      const monthParam = (req.query.month as string) || (dateStr && dateStr.substring(0, 7)) || new Date().toISOString().substring(0, 7);
      const [y, m] = monthParam.split('-');
      const lastDay = new Date(Number(y), Number(m), 0).getDate();
      query = "SELECT * FROM bills WHERE date BETWEEN ? AND ? ORDER BY date DESC, time DESC";
      params = [`${monthParam}-01`, `${monthParam}-${String(lastDay).padStart(2, '0')}`];
    } else if (periodParam === 'year') {
      query = "SELECT * FROM bills WHERE date BETWEEN ? AND ? ORDER BY date DESC, time DESC";
      params = [`${year}-01-01`, `${year}-12-31`];
    } else {
      return res.status(400).json({ error: "Invalid period. Must be day, week, month, year, or all." });
    }
    
    let bills = await db.all(query, params);
    bills = bills.map((b: any) => {
      const finalAmt = Number(b.grand_total !== undefined && b.grand_total !== null ? b.grand_total : (b.total ?? b.total_amount ?? 0));
      return {
        ...b,
        total: finalAmt,
        grand_total: finalAmt,
        total_amount: finalAmt,
        mode: b.mode || (b.clinic_patient_id ? 'CLINIC_DISPENSING' : 'RETAIL_PHARMACY')
      };
    });

    if (mode) {
      if (mode === 'CLINIC_DISPENSING') {
        bills = bills.filter((b: any) => b.mode === 'CLINIC_DISPENSING');
      } else if (mode === 'RETAIL_PHARMACY') {
        bills = bills.filter((b: any) => b.mode === 'RETAIL_PHARMACY');
      }
    }

    res.json(bills);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get items for a specific bill
app.get('/api/bills/:id/items', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    const items = await db.all("SELECT * FROM bill_items WHERE bill_id = ?", [Number(id)]);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE BILL: ONLY example bills can be deleted; actual clinical invoices are protected by D&C Rule 65 & CGST Act Sec 36
app.delete('/api/bills/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    const bill = await db.get<any>("SELECT * FROM bills WHERE id = ?", [Number(id)]);
    if (!bill) {
      return res.status(404).json({ error: "Invoice record not found." });
    }

    const isExample = bill.is_example === 1 || bill.is_example === true;
    if (!isExample) {
      return res.status(405).json({
        error: "Statutory Violation: Invoices cannot be deleted under Rule 65 of Drugs and Cosmetics Rules, 1945 and Section 36 of CGST Act, 2017 (mandating 72-month retention). Only pre-seeded example/demo bills can be deleted. To cancel a genuine invoice lawfully, issue a Credit Note via POST /api/bills/:id/cancel."
      });
    }

    await db.run("DELETE FROM bill_items WHERE bill_id = ?", [Number(id)]);
    await db.run("DELETE FROM bills WHERE id = ?", [Number(id)]);
    res.json({
      success: true,
      message: `Example bill #${bill.bill_number} deleted successfully.`,
      id: Number(id)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// LAWFUL CANCELLATION VIA STATUTORY CREDIT NOTE
app.post('/api/bills/:id/cancel', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { reason, cancelled_by } = req.body;
    const db = await getDatabase();

    const bill = await db.get<any>("SELECT * FROM bills WHERE id = ?", [id]);
    if (!bill) {
      return res.status(404).json({ error: "Bill not found." });
    }

    if (bill.status === 'Cancelled') {
      return res.status(400).json({ error: "Bill is already cancelled." });
    }

    const cancelReason = reason || "Patient returned intact blister packaging under registered pharmacist verification";
    const cancelUser = cancelled_by || "Pharmacist";
    const nowIso = new Date().toISOString();

    // 1. Restore dispensed inventory back to batches (FEFO stock restoration)
    try {
      const billItems = await db.all<any>("SELECT product_id, batch_number, quantity FROM bill_items WHERE bill_id = ?", [id]);
      if (Array.isArray(billItems)) {
        for (const item of billItems) {
          const qty = Number(item.quantity || 0);
          const pid = Number(item.product_id || 0);
          if (pid > 0 && qty > 0) {
            if (item.batch_number) {
              await db.run(
                "UPDATE batches SET available_stock = available_stock + ? WHERE product_id = ? AND batch_number = ?",
                [qty, pid, item.batch_number]
              );
            } else {
              await db.run(
                "UPDATE batches SET available_stock = available_stock + ? WHERE product_id = ?",
                [qty, pid]
              );
            }
          }
        }
      }
    } catch (restockErr) {
      console.warn("[CANCEL-BILL] Warning restoring batch stocks:", restockErr);
    }

    // 2. Mark bill as Cancelled with audit trail
    await db.run(
      "UPDATE bills SET status = 'Cancelled', cancellation_reason = ?, cancelled_by = ?, cancelled_at = ? WHERE id = ?",
      [cancelReason, cancelUser, nowIso, id]
    );

    // Record statutory audit log
    await db.run(
      `INSERT INTO audit_logs (user_id, username, action, entity_type, entity_id, previous_state, new_state, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        1, cancelUser, 'CANCEL_INVOICE_CREDIT_NOTE', 'bills', id,
        JSON.stringify({ status: bill.status, grand_total: bill.grand_total }),
        JSON.stringify({ status: 'Cancelled', reason: cancelReason }),
        req.ip || '127.0.0.1'
      ]
    );

    broadcastRealtimeEvent({
      type: 'INVENTORY_CHANGED',
      message: `Invoice #${id} cancelled. Stock restored to active inventory.`,
      data: { billId: id }
    });

    const updated = await db.get<any>("SELECT * FROM bills WHERE id = ?", [id]);
    res.json({
      success: true,
      message: "Bill cancelled lawfully via Credit Note and recorded in statutory audit log.",
      bill: updated
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Audit log of deleted items (loss prevention tracking)
app.post('/api/deleted-items', async (req, res) => {
  try {
    const { bill_id, product_name, quantity } = req.body;
    const db = await getDatabase();
    await db.run(
      `INSERT INTO deleted_items_history (bill_id, product_name, quantity) VALUES (?, ?, ?)`,
      [bill_id ? Number(bill_id) : null, product_name, Number(quantity)]
    );

    res.status(201).json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/deleted-items', async (req, res) => {
  try {
    const db = await getDatabase();
    const logs = await db.all("SELECT * FROM deleted_items_history ORDER BY deleted_at DESC LIMIT 100");
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// ANALYTICS & SALES REPORT ENDPOINTS
// ----------------------------------------------------

// Comprehensive stats compiler for all report periods (Daily, Weekly, Monthly, Annual)
async function compileComprehensiveStats(options: {
  startDate: string;
  endDate: string;
  periodLabel: string;
}) {
  const { startDate, endDate, periodLabel } = options;
  const db = await getDatabase();

  const bills = await db.all<any>(
    "SELECT * FROM bills WHERE date BETWEEN ? AND ? ORDER BY date ASC, time ASC",
    [startDate, endDate]
  );

  const activeBills = bills.filter(b => b.status !== 'Cancelled');
  const cancelledBills = bills.filter(b => b.status === 'Cancelled');
  const complimentaryBills = activeBills.filter(b => Boolean(b.is_complimentary || b.payment_method === 'Complimentary'));
  const paidBills = activeBills.filter(b => !b.is_complimentary && b.payment_method !== 'Complimentary');

  // Query all bill items in range
  const billItems = await db.all<any>(`
    SELECT bi.*, b.date, b.payment_method, b.status, b.is_complimentary, b.operating_mode
    FROM bill_items bi
    JOIN bills b ON bi.bill_id = b.id
    WHERE b.date BETWEEN ? AND ?
  `, [startDate, endDate]);

  const activeItems = billItems.filter(it => it.status !== 'Cancelled');

  // Query batch master to lookup purchase_price and MRP accurately
  const allBatches = await db.all<any>("SELECT * FROM batches");
  const batchPriceMap = new Map<string, { purchase_price: number; mrp: number }>();
  allBatches.forEach(bat => {
    if (bat.batch_number) {
      batchPriceMap.set(String(bat.batch_number), {
        purchase_price: Number(bat.purchase_price || 0),
        mrp: Number(bat.mrp || 0)
      });
    }
  });

  // 1. Sales & Revenue
  let grossSales = 0; // MRP based
  let totalDiscounts = 0;
  let netSales = 0; // grand_total of paid active bills
  let totalTax = 0;

  paidBills.forEach(b => {
    netSales += Number(b.grand_total || 0);
    totalDiscounts += Number(b.discount || 0);
    totalTax += Number(b.tax || 0);
  });

  // Calculate COGS and Gross Profit
  let totalCogs = 0;
  let totalUnitsSold = 0;
  let totalUnitsSoldMrp = 0;
  let totalComplimentaryUnits = 0;
  let complimentaryAbsorbedCost = 0;
  let complimentaryMrpValue = 0;

  // Product aggregated sales map
  const productAggMap = new Map<string, { name: string; quantity: number; total: number; cogs: number; profit: number }>();

  // GST slabs breakdown
  const gstSlabs = {
    slab0: { taxable: 0, cgst: 0, sgst: 0, totalTax: 0 },
    slab5: { taxable: 0, cgst: 0, sgst: 0, totalTax: 0 },
    slab12: { taxable: 0, cgst: 0, sgst: 0, totalTax: 0 },
    slab18: { taxable: 0, cgst: 0, sgst: 0, totalTax: 0 }
  };

  activeItems.forEach(it => {
    const qty = Number(it.quantity || 0);
    const itemTotal = Number(it.total || 0);
    const batchInfo = batchPriceMap.get(String(it.batch_number)) || { purchase_price: Number(it.rate || 0) * 0.75, mrp: Number(it.rate || 0) };
    const costPrice = batchInfo.purchase_price;
    const itemCogs = qty * costPrice;

    if (it.is_complimentary || it.payment_method === 'Complimentary') {
      totalComplimentaryUnits += qty;
      complimentaryAbsorbedCost = 0; // Statutory requirement: The cost for stocks as compliments must be 0 rs.
      complimentaryMrpValue += (qty * batchInfo.mrp);
    } else {
      totalUnitsSold += qty;
      totalCogs += itemCogs;
      const itemMrpVal = Number(it.mrp || batchInfo.mrp || it.rate || 0);
      totalUnitsSoldMrp += (qty * itemMrpVal);
      grossSales += (qty * (Number(it.rate) || itemMrpVal));

      // GST Slab assignment
      const taxRate = Math.round(Number(it.tax_percent || 0));
      const taxable = itemTotal / (1 + (taxRate / 100));
      const cgst = Number(it.cgst || (itemTotal - taxable) / 2);
      const sgst = Number(it.sgst || (itemTotal - taxable) / 2);
      const taxAmt = cgst + sgst;

      if (taxRate <= 2) {
        gstSlabs.slab0.taxable += taxable;
      } else if (taxRate <= 6) {
        gstSlabs.slab5.taxable += taxable;
        gstSlabs.slab5.cgst += cgst;
        gstSlabs.slab5.sgst += sgst;
        gstSlabs.slab5.totalTax += taxAmt;
      } else if (taxRate <= 15) {
        gstSlabs.slab12.taxable += taxable;
        gstSlabs.slab12.cgst += cgst;
        gstSlabs.slab12.sgst += sgst;
        gstSlabs.slab12.totalTax += taxAmt;
      } else {
        gstSlabs.slab18.taxable += taxable;
        gstSlabs.slab18.cgst += cgst;
        gstSlabs.slab18.sgst += sgst;
        gstSlabs.slab18.totalTax += taxAmt;
      }

      // Aggregate top products
      const pName = it.product_name || 'Medicine';
      const existing = productAggMap.get(pName) || { name: pName, quantity: 0, total: 0, cogs: 0, profit: 0 };
      existing.quantity += qty;
      existing.total += itemTotal;
      existing.cogs += itemCogs;
      existing.profit += (itemTotal - itemCogs);
      productAggMap.set(pName, existing);
    }
  });

  if (grossSales === 0 && netSales > 0) {
    grossSales = netSales + totalDiscounts;
  }

  const grossProfit = Math.max(0, netSales - totalCogs);
  const profitMarginPercent = netSales > 0 ? Number(((grossProfit / netSales) * 100).toFixed(2)) : 0;

  // 2. Inward Stock in this Period
  const inwardRows = await db.all<any>(
    "SELECT * FROM inward_stock WHERE received_date BETWEEN ? AND ? ORDER BY received_date DESC, id DESC",
    [startDate, endDate]
  );
  let totalInwardUnits = 0;
  let totalInwardPurchaseValuation = 0;
  let totalInwardMrpValuation = 0;
  inwardRows.forEach(inw => {
    const qty = Number(inw.quantity || 0);
    totalInwardUnits += qty;
    totalInwardPurchaseValuation += (qty * Number(inw.purchase_price || 0));
    totalInwardMrpValuation += (qty * Number(inw.mrp || 0));
  });

  // Net Stock Movement & Difference
  const netStockUnitsDifference = totalInwardUnits - (totalUnitsSold + totalComplimentaryUnits);
  const netStockValuationDifference = totalInwardPurchaseValuation - (totalCogs + complimentaryAbsorbedCost);

  // Closing / Current Available Stock
  let currentClosingStockUnits = 0;
  let currentClosingStockPurchaseValuation = 0;
  let currentClosingStockMrpValuation = 0;
  allBatches.forEach(b => {
    const stk = Math.max(0, Number(b.available_stock || 0));
    currentClosingStockUnits += stk;
    currentClosingStockPurchaseValuation += (stk * Number(b.purchase_price || 0));
    currentClosingStockMrpValuation += (stk * Number(b.mrp || 0));
  });

  // 3. Payment & Mode Breakdown
  const paymentBreakdown = { Cash: 0, GooglePay: 0, BankCard: 0, Complimentary: 0 };
  const modeA = { revenue: 0, count: 0, tax: 0 };
  const modeB = { revenue: 0, count: 0, tax: 0 };

  activeBills.forEach(b => {
    const pm = String(b.payment_method || '').toLowerCase();
    const tot = Number(b.grand_total || 0);
    if (b.is_complimentary || pm.includes("complimentary")) {
      paymentBreakdown.Complimentary += 1;
    } else if (pm.includes("cash")) {
      paymentBreakdown.Cash += tot;
    } else if (pm.includes("card") || pm.includes("pos") || pm.includes("debit") || pm.includes("credit")) {
      paymentBreakdown.BankCard += tot;
    } else if (pm.includes("google") || pm.includes("upi") || pm.includes("gpay") || pm.includes("phonepe") || pm.includes("paytm")) {
      paymentBreakdown.GooglePay += tot;
    } else {
      paymentBreakdown.Cash += tot;
    }

    if (b.operating_mode === 'RETAIL_PHARMACY') {
      modeB.revenue += tot;
      modeB.count += 1;
      modeB.tax += Number(b.tax || 0);
    } else {
      modeA.revenue += tot;
      modeA.count += 1;
      modeA.tax += Number(b.tax || 0);
    }
  });

  const topProducts = Array.from(productAggMap.values()).sort((a, b) => b.quantity - a.quantity);

  // Master Inventory Ledger for Detailed Stock Reporting
  const allProducts = await db.all<any>("SELECT * FROM products");
  const productMap = new Map<number, any>();
  allProducts.forEach(p => productMap.set(p.id, p));

  const todayIso = new Date().toISOString().split('T')[0];
  const inventoryLedger = allBatches.map(b => {
    const prod = productMap.get(b.product_id);
    const prodName = prod ? prod.name : 'Medicine';
    const category = prod ? prod.category : 'General';
    const sellingPrice = Number(b.selling_price || prod?.price || b.mrp || 0);
    const purchasePrice = Number(b.purchase_price || prod?.purchase_price || 0);
    const mrp = Number(b.mrp || prod?.mrp || sellingPrice);
    const availStock = Math.max(0, Number(b.available_stock || 0));
    const marginPerUnit = Number((sellingPrice - purchasePrice).toFixed(2));
    const marginPercent = sellingPrice > 0 ? Number(((marginPerUnit / sellingPrice) * 100).toFixed(2)) : 0;
    const expDateStr = String(b.expiry_date || '2028-12-31').substring(0, 10);
    const diffDays = Math.ceil((new Date(expDateStr).getTime() - new Date(todayIso).getTime()) / (1000 * 60 * 60 * 24));
    const expiryStatus = diffDays < 0 ? 'EXPIRED' : (diffDays <= 60 ? 'EXPIRING SOON' : 'VALID');
    const stockStatus = availStock <= 0 ? 'Out of Stock' : (availStock <= 15 ? 'Low Stock' : 'In Stock');

    return {
      product_name: prodName,
      category,
      batch_number: b.batch_number || 'BTH-STD',
      expiry_date: expDateStr,
      expiry_status: expiryStatus,
      purchase_price: purchasePrice,
      mrp: mrp,
      selling_price: sellingPrice,
      margin_per_unit: marginPerUnit,
      margin_percent: marginPercent,
      available_stock: availStock,
      cost_valuation: Number((availStock * purchasePrice).toFixed(2)),
      mrp_valuation: Number((availStock * mrp).toFixed(2)),
      stock_status: stockStatus
    };
  });

  const billMap = new Map<number, any>();
  bills.forEach(b => billMap.set(b.id, b));

  const detailedSalesItems = activeItems.map(it => {
    const b = billMap.get(it.bill_id) || {};
    const qty = Number(it.quantity || 0);
    const rate = Number(it.rate || 0);
    const totalAmt = Number(it.total || 0);
    const batchInfo = batchPriceMap.get(String(it.batch_number)) || { purchase_price: rate * 0.75, mrp: rate };
    const itemMrp = Number(it.mrp || batchInfo.mrp || rate);
    const itemCost = Number(it.purchase_price || batchInfo.purchase_price || 0);
    const concession = Math.max(0, itemMrp - rate);
    const taxRate = Number(it.tax_percent || 0);
    const taxable = totalAmt / (1 + (taxRate / 100));
    const cgst = Number(it.cgst || (totalAmt - taxable) / 2);
    const sgst = Number(it.sgst || (totalAmt - taxable) / 2);
    const purchaseCost = qty * itemCost;
    const grossProfit = totalAmt - purchaseCost;

    return {
      bill_number: b.bill_number || it.bill_id,
      date: b.date || it.date || todayIso,
      time: b.time || '10:00:00',
      patient_name: b.patient_name || 'Walk-in Patient',
      doctor_name: b.doctor_name || 'Dr. Arjun Sharma, MS (Ortho)',
      payment_method: b.payment_method || 'Cash',
      product_name: it.product_name || 'Medicine',
      batch_number: it.batch_number || 'B-STD',
      expiry_date: it.expiry_date || '2028-12-31',
      mrp: itemMrp,
      rate: rate,
      discount_from_mrp: concession,
      quantity: qty,
      taxable_amount: Number(taxable.toFixed(2)),
      tax_percent: taxRate,
      cgst: Number(cgst.toFixed(2)),
      sgst: Number(sgst.toFixed(2)),
      total_amount: Number(totalAmt.toFixed(2)),
      purchase_cost: Number(purchaseCost.toFixed(2)),
      gross_profit: Number(grossProfit.toFixed(2))
    };
  });

  return {
    periodLabel,
    startDate,
    endDate,
    totalSales: netSales,
    grossSales: Number(grossSales.toFixed(2)),
    totalDiscounts: Number(totalDiscounts.toFixed(2)),
    discountedBillsCount: activeBills.filter(b => Number(b.discount || 0) > 0).length,
    averageDiscountPercent: grossSales > 0 ? Number(((totalDiscounts / grossSales) * 100).toFixed(2)) : 0,
    billCount: bills.length,
    activeBillsCount: activeBills.length,
    cancelledBillsCount: cancelledBills.length,
    
    // MRP & Purchase Rate / Financial Margins
    financials: {
      grossSales: Number(grossSales.toFixed(2)),
      totalDiscounts: Number(totalDiscounts.toFixed(2)),
      netSales: Number(netSales.toFixed(2)),
      cogs: Number(totalCogs.toFixed(2)),
      grossProfit: Number(grossProfit.toFixed(2)),
      profitMarginPercent
    },

    // Stock Movement & Difference
    stockMovement: {
      inwardUnits: totalInwardUnits,
      inwardPurchaseValuation: Number(totalInwardPurchaseValuation.toFixed(2)),
      inwardMrpValuation: Number(totalInwardMrpValuation.toFixed(2)),
      unitsSold: totalUnitsSold,
      unitsSoldCost: Number(totalCogs.toFixed(2)),
      unitsSoldMrp: Number(totalUnitsSoldMrp.toFixed(2)),
      complimentaryUnits: totalComplimentaryUnits,
      complimentaryAbsorbedCost: 0, // Requirement: The cost for stocks as compliments must be 0 rs.
      complimentaryCostAbsorbed: 0,
      netStockDifferenceUnits: netStockUnitsDifference,
      netStockValuationDifference: Number(netStockValuationDifference.toFixed(2)),
      currentAvailableStockUnits: currentClosingStockUnits,
      currentStockValuationCost: Number(currentClosingStockPurchaseValuation.toFixed(2)),
      currentStockValuationMrp: Number(currentClosingStockMrpValuation.toFixed(2))
    },

    // GST Breakdown
    gstReport: {
      taxableAmount: Number((netSales - totalTax).toFixed(2)),
      taxableValue: Number((netSales - totalTax).toFixed(2)),
      cgst: Number((totalTax / 2).toFixed(2)),
      sgst: Number((totalTax / 2).toFixed(2)),
      totalTax: Number(totalTax.toFixed(2)),
      totalGst: Number(totalTax.toFixed(2)),
      slabs: gstSlabs
    },

    // Complimentary / Doctor Health Dispense
    complimentarySummary: {
      billsCount: complimentaryBills.length,
      dispenseCount: complimentaryBills.length,
      unitsDispensed: totalComplimentaryUnits,
      totalUnits: totalComplimentaryUnits,
      absorbedCost: 0, // Requirement: Complimentary stock cost is 0 rs
      totalCostAbsorbed: 0,
      complimentaryAbsorbedCost: 0,
      mrpValue: Number(complimentaryMrpValue.toFixed(2))
    },

    paymentBreakdown,
    modeA,
    modeB,
    topProducts,
    allBills: bills,
    inwardRecords: inwardRows,
    inventoryLedger,
    detailedSalesItems,
    clinicDetails: await getStoredClinicDetails(),
    clinicName: (await getStoredClinicDetails()).name || 'MADRAS ORTHO CLINIC & PHARMACY'
  };
}

// Daily Report REST API
app.get('/api/reports/daily', async (req, res) => {
  try {
    const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const stats = await compileComprehensiveStats({
      startDate: dateStr,
      endDate: dateStr,
      periodLabel: `Daily Report - ${dateStr}`
    });

    if (req.query.export === 'excel') {
      const buffer = await generateDailyExcel({ date: dateStr, ...stats });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Daily_Sales_Report_${dateStr}.xlsx`);
      return res.send(buffer);
    }

    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Weekly Report REST API (Mon -> Sun)
app.get('/api/reports/weekly', async (req, res) => {
  try {
    const targetDate = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const { monday, sunday } = getMondayAndSunday(targetDate);
    const stats = await compileComprehensiveStats({
      startDate: monday,
      endDate: sunday,
      periodLabel: `Weekly Report (${monday} to ${sunday})`
    });

    // Populate calendar week days
    const dailyBreakdownMap: { [key: string]: { date: string; amount: number; bills: number } } = {};
    let runner = new Date(monday);
    for (let i = 0; i < 7; i++) {
      const dStr = runner.toISOString().split('T')[0];
      dailyBreakdownMap[dStr] = { date: dStr, amount: 0, bills: 0 };
      runner.setDate(runner.getDate() + 1);
    }

    stats.allBills.forEach((b: any) => {
      if (b.status !== 'Cancelled' && dailyBreakdownMap[b.date]) {
        dailyBreakdownMap[b.date].amount += Number(b.grand_total || 0);
        dailyBreakdownMap[b.date].bills += 1;
      }
    });

    const weeklyStats = {
      ...stats,
      dateRange: `${monday} to ${sunday}`,
      dailyBreakdown: Object.values(dailyBreakdownMap)
    };

    if (req.query.export === 'excel') {
      const buffer = await generateWeeklyExcel(weeklyStats);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Weekly_Sales_Report_${monday}_to_${sunday}.xlsx`);
      return res.send(buffer);
    }

    res.json(weeklyStats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Monthly Report REST API (Crucial for Clinic Accounts & Monthly Audit)
app.get('/api/reports/monthly', async (req, res) => {
  try {
    const monthParam = (req.query.month as string) || (req.query.date as string && (req.query.date as string).substring(0, 7)) || new Date().toISOString().substring(0, 7);
    const [yearStr, mStr] = monthParam.split('-');
    const year = Number(yearStr);
    const month = Number(mStr);
    const startDate = `${monthParam}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${monthParam}-${String(lastDay).padStart(2, '0')}`;

    const stats = await compileComprehensiveStats({
      startDate,
      endDate,
      periodLabel: `Monthly Report - ${monthParam}`
    });

    // Compute day-by-day trend of the month
    const dailyTrendMap: Record<string, { date: string; amount: number; bills: number }> = {};
    for (let d = 1; d <= lastDay; d++) {
      const dStr = `${monthParam}-${String(d).padStart(2, '0')}`;
      dailyTrendMap[dStr] = { date: dStr, amount: 0, bills: 0 };
    }
    stats.allBills.forEach((b: any) => {
      if (b.status !== 'Cancelled' && dailyTrendMap[b.date]) {
        dailyTrendMap[b.date].amount += Number(b.grand_total || 0);
        dailyTrendMap[b.date].bills += 1;
      }
    });

    const fullMonthlyStats = {
      ...stats,
      month: monthParam,
      dailyBreakdown: Object.values(dailyTrendMap)
    };

    if (req.query.export === 'excel') {
      const buffer = await generateMonthlyExcel(fullMonthlyStats);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Monthly_Pharmacy_Financial_Report_${monthParam}.xlsx`);
      return res.send(buffer);
    }

    res.json(fullMonthlyStats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Yearly Report REST API (Jan 1 -> Dec 31)
app.get('/api/reports/yearly', async (req, res) => {
  try {
    const year = Number(req.query.year || new Date().getFullYear());
    const start = `${year}-01-01`;
    const end = `${year}-12-31`;

    const stats = await compileComprehensiveStats({
      startDate: start,
      endDate: end,
      periodLabel: `Annual Report - ${year}`
    });

    // Monthly breakdown (January to December)
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    const monthlyBreakdown = months.map((name, idx) => ({
      monthIdx: idx,
      monthName: name,
      amount: 0,
      bills: 0,
      growthPercent: 0
    }));

    stats.allBills.forEach((b: any) => {
      if (b.status !== 'Cancelled') {
        const bDate = new Date(b.date);
        const mIdx = bDate.getMonth();
        if (mIdx >= 0 && mIdx < 12) {
          monthlyBreakdown[mIdx].amount += Number(b.grand_total || 0);
          monthlyBreakdown[mIdx].bills += 1;
        }
      }
    });

    for (let i = 0; i < 12; i++) {
      if (i === 0) {
        monthlyBreakdown[i].growthPercent = 0;
      } else {
        const prev = monthlyBreakdown[i - 1].amount;
        const curr = monthlyBreakdown[i].amount;
        monthlyBreakdown[i].growthPercent = prev === 0 ? (curr > 0 ? 1 : 0) : (curr - prev) / prev;
      }
    }

    const yearlyStats = {
      ...stats,
      year,
      monthlyBreakdown
    };

    if (req.query.export === 'excel') {
      const buffer = await generateYearlyExcel(yearlyStats);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Yearly_Sales_Report_${year}.xlsx`);
      return res.send(buffer);
    }

    res.json(yearlyStats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// INWARD STOCK MANAGEMENT API (Admin only monthly inward)
// ----------------------------------------------------
app.get('/api/inventory/inward', async (req, res) => {
  try {
    const db = await getDatabase();
    const rows = await db.all("SELECT * FROM inward_stock ORDER BY received_date DESC, id DESC");
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/inventory/inward', async (req, res) => {
  try {
    const db = await getDatabase();
    const {
      supplier_name = 'Direct Wholesale',
      invoice_number = 'INV-MONTHLY',
      received_date,
      received_by = 'Admin',
      notes = '',
      items
    } = req.body;

    const rDate = received_date || new Date().toISOString().split('T')[0];

    // If submitted as multi-item inward stock consignment
    if (Array.isArray(items) && items.length > 0) {
      const insertedRecords: any[] = [];
      let totalConsignmentCost = 0;
      let totalConsignmentUnits = 0;

      for (const it of items) {
        let pid = Number(it.product_id || 0);
        let pName = String(it.product_name || it.name || '').trim();
        const batchNum = String(it.batch_number || '').trim();
        const qty = Number(it.quantity || it.quantity_received || 0);
        const expDate = String(it.expiry_date || '').trim();
        const mfgDate = it.mfg_date || '2026-01-01';
        const pPrice = Number(it.purchase_price || 0);
        const mrpVal = Number(it.mrp || 0);
        const sPrice = Number(it.selling_price !== undefined ? it.selling_price : (mrpVal || 0));

        if (!pName && pid <= 0) continue;
        if (!batchNum || qty <= 0 || !expDate) {
          continue; // Skip invalid entries
        }

        // If product_id is not set, find or auto-create in products catalog
        if (pid <= 0 && pName) {
          const matched = await db.all<any>("SELECT id, name, price, mrp, purchase_price FROM products WHERE LOWER(name) = LOWER(?)", [pName]);
          if (matched && matched.length > 0) {
            pid = matched[0].id;
          } else {
            const newProd = await db.run(
              `INSERT INTO products (name, category, price, mrp, purchase_price, status, tax_percent)
               VALUES (?, 'General Medicine', ?, ?, ?, 'Available', 12)`,
              [pName, sPrice, mrpVal, pPrice]
            );
            pid = Number(newProd.lastID || 0);
          }
        } else if (pid > 0 && !pName) {
          const existingP = await db.get<any>("SELECT name FROM products WHERE id = ?", [pid]);
          if (existingP) pName = existingP.name;
        }

        // Insert into inward_stock
        const result = await db.run(
          `INSERT INTO inward_stock (
            product_id, product_name, batch_number, quantity, expiry_date, mfg_date,
            purchase_price, mrp, selling_price, supplier_name, invoice_number, received_date, received_by, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            pid, pName || 'Medicine', batchNum, qty,
            expDate, mfgDate, pPrice, mrpVal,
            sPrice, supplier_name, invoice_number, rDate, received_by, notes
          ]
        );

        // Sync into batches
        const existingBatches = await db.all<any>("SELECT * FROM batches WHERE product_id = ? AND batch_number = ?", [pid, batchNum]);
        if (existingBatches && existingBatches.length > 0) {
          await db.run(
            "UPDATE batches SET available_stock = available_stock + ?, expiry_date = ?, purchase_price = ?, mrp = ?, selling_price = ?, status = 'Active' WHERE id = ?",
            [qty, expDate, pPrice, mrpVal, sPrice, existingBatches[0].id]
          );
        } else {
          await db.run(
            `INSERT INTO batches (product_id, batch_number, mfg_date, expiry_date, mrp, selling_price, purchase_price, available_stock, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
            [pid, batchNum, mfgDate, expDate, mrpVal, sPrice, pPrice, qty]
          );
        }

        // Update product master catalog
        await db.run(
          "UPDATE products SET price = ?, mrp = ?, purchase_price = ?, status = 'Available' WHERE id = ?",
          [sPrice, mrpVal, pPrice, pid]
        );

        totalConsignmentCost += (qty * pPrice);
        totalConsignmentUnits += qty;
        insertedRecords.push({ id: result.lastID, product_id: pid, product_name: pName, batch_number: batchNum, quantity: qty, purchase_price: pPrice });
      }

      await db.run(
        `INSERT INTO audit_logs (user_id, username, action, entity_type, entity_id, previous_state, new_state, ip_address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, received_by, 'INWARD_STOCK_CONSIGNMENT', 'inward_stock', null, null, JSON.stringify({ invoice_number, supplier_name, total_items: insertedRecords.length, totalConsignmentUnits, totalConsignmentCost }), req.ip || '127.0.0.1']
      );

      broadcastRealtimeEvent({
        type: 'INVENTORY_CHANGED',
        message: `Inward consignment received: ${totalConsignmentUnits} units added across ${insertedRecords.length} medicines.`,
        data: { invoice: invoice_number, itemsCount: insertedRecords.length, totalUnits: totalConsignmentUnits }
      });

      return res.status(201).json({
        success: true,
        count: insertedRecords.length,
        total_units: totalConsignmentUnits,
        total_purchase_cost: totalConsignmentCost,
        invoice_number,
        supplier_name,
        message: `Successfully recorded inward consignment of ${insertedRecords.length} medicines (${totalConsignmentUnits} units) totaling ₹${totalConsignmentCost.toFixed(2)}`
      });
    }

    // Single item inward entry (backward compatible)
    const {
      product_id,
      product_name,
      batch_number,
      quantity,
      expiry_date,
      mfg_date,
      purchase_price,
      mrp,
      selling_price
    } = req.body;

    let pid = Number(product_id || 0);
    let pName = String(product_name || '').trim();

    if (pid <= 0 && pName) {
      const matched = await db.all<any>("SELECT id, name FROM products WHERE LOWER(name) = LOWER(?)", [pName]);
      if (matched && matched.length > 0) {
        pid = matched[0].id;
      } else {
        const newProd = await db.run(
          `INSERT INTO products (name, category, price, mrp, purchase_price, status, tax_percent)
           VALUES (?, 'General Medicine', ?, ?, ?, 'Available', 12)`,
          [pName, Number(selling_price || mrp || 0), Number(mrp || 0), Number(purchase_price || 0)]
        );
        pid = Number(newProd.lastID || 0);
      }
    }

    if (!pid || !quantity || !batch_number || !expiry_date) {
      return res.status(400).json({ error: "Missing required inward stock fields (product, quantity, batch_number, expiry_date)." });
    }

    const finalSellingPrice = Number(selling_price !== undefined ? selling_price : (mrp || 0));

    const result = await db.run(
      `INSERT INTO inward_stock (
        product_id, product_name, batch_number, quantity, expiry_date, mfg_date,
        purchase_price, mrp, selling_price, supplier_name, invoice_number, received_date, received_by, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        pid, String(pName || 'Medicine'), String(batch_number), Number(quantity),
        String(expiry_date), mfg_date || '2026-01-01', Number(purchase_price || 0), Number(mrp || 0),
        finalSellingPrice, supplier_name || 'Direct Wholesale', invoice_number || 'INV-MONTHLY', rDate, received_by, notes || ''
      ]
    );

    // Sync into batches table (available stock increases)
    const existingBatches = await db.all<any>("SELECT * FROM batches WHERE product_id = ? AND batch_number = ?", [pid, String(batch_number)]);
    if (existingBatches && existingBatches.length > 0) {
      await db.run(
        "UPDATE batches SET available_stock = available_stock + ?, expiry_date = ?, purchase_price = ?, mrp = ?, selling_price = ?, status = 'Active' WHERE id = ?",
        [Number(quantity), String(expiry_date), Number(purchase_price || 0), Number(mrp || 0), finalSellingPrice, existingBatches[0].id]
      );
    } else {
      await db.run(
        `INSERT INTO batches (product_id, batch_number, mfg_date, expiry_date, mrp, selling_price, purchase_price, available_stock, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
        [pid, String(batch_number), mfg_date || '2026-01-01', String(expiry_date), Number(mrp || 0), finalSellingPrice, Number(purchase_price || 0), Number(quantity)]
      );
    }

    // Synchronize product active catalogue selling rate, MRP, and purchase cost
    await db.run(
      "UPDATE products SET price = ?, mrp = ?, purchase_price = ?, status = 'Available' WHERE id = ?",
      [finalSellingPrice, Number(mrp || 0), Number(purchase_price || 0), pid]
    );

    await db.run(
      `INSERT INTO audit_logs (user_id, username, action, entity_type, entity_id, previous_state, new_state, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [1, received_by, 'INWARD_STOCK_ENTRY', 'inward_stock', result.lastID, null, JSON.stringify({ product_id: pid, batch_number, quantity }), req.ip || '127.0.0.1']
    );

    broadcastRealtimeEvent({
      type: 'INVENTORY_CHANGED',
      message: `Inward stock received for '${pName}' (${quantity} units).`,
      data: { productId: pid, quantity }
    });

    res.status(201).json({
      success: true,
      id: result.lastID,
      message: `Inward stock of ${quantity} units recorded for batch ${batch_number}`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// CUSTOM CATEGORIES MANAGEMENT API (Admin)
// ----------------------------------------------------
app.get('/api/categories', async (req, res) => {
  try {
    const db = await getDatabase();
    // Return newly created categories first so admin can easily select them
    const rows = await db.all("SELECT * FROM categories ORDER BY id DESC, created_at DESC");
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name, description, created_by = 'admin' } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Category name is required." });
    }
    const catName = name.trim();
    const db = await getDatabase();
    const existing = await db.all<any>("SELECT * FROM categories WHERE name = ?", [catName]);
    if (existing && existing.length > 0) {
      return res.json({ success: true, message: "Category already exists", category: existing[0] });
    }
    const result = await db.run(
      "INSERT INTO categories (name, description, created_by) VALUES (?, ?, ?)",
      [catName, description || '', created_by]
    );
    broadcastRealtimeEvent({
      type: 'CATALOGUE_CHANGED',
      message: `New category created: ${catName}`,
      data: { category: catName }
    });

    res.status(201).json({ success: true, id: result.lastID, name: catName });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:name', async (req, res) => {
  try {
    const catName = decodeURIComponent(req.params.name);
    const db = await getDatabase();
    await db.run("DELETE FROM categories WHERE name = ?", [catName]);
    res.json({ success: true, message: `Category '${catName}' deleted.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// NETWORK / WIFI THERMAL PRINTER ENDPOINT (ESC/POS: 9100)
// ----------------------------------------------------
function formatServerEscPos(receiptData: any): Buffer {
  const {
    bakeryName = "MADRAS ORTHO CLINIC SOFTWARE",
    description = "Mission for Cure",
    address = "Chennai, Tamil Nadu",
    phone = "+91 98765 43210",
    gstin = "",
    dlNo = "",
    billNumber = 1,
    date = new Date().toISOString().split('T')[0],
    time = new Date().toLocaleTimeString(),
    cashierName = "Pharmacist",
    items = [],
    subtotal = 0,
    discount = 0,
    tax = 0,
    grandTotal = 0,
    paymentMethod = "Cash",
    width = "80mm"
  } = receiptData || {};

  const is58mm = width === "58mm";
  const colWidth = is58mm ? 32 : 48;
  const divider = "-".repeat(colWidth) + "\n";
  const doubleDivider = "=".repeat(colWidth) + "\n";

  const chunks: Buffer[] = [];
  const pushAscii = (str: string) => {
    chunks.push(Buffer.from(str.replace(/₹/g, "Rs."), 'latin1'));
  };

  // Helper two col
  const twoCol = (l: string, r: string) => {
    const lClean = l.replace(/₹/g, "Rs.");
    const rClean = r.replace(/₹/g, "Rs.");
    const spaces = Math.max(1, colWidth - lClean.length - rClean.length);
    return lClean + " ".repeat(spaces) + rClean + "\n";
  };

  // ESC @: Init
  chunks.push(Buffer.from([0x1B, 0x40]));
  // ESC a 1: Center
  chunks.push(Buffer.from([0x1B, 0x61, 0x01]));
  // ESC ! 0x18: Double height bold
  chunks.push(Buffer.from([0x1B, 0x21, 0x18]));
  pushAscii(bakeryName + "\n");
  // ESC ! 0x08: Normal bold
  chunks.push(Buffer.from([0x1B, 0x21, 0x08]));
  pushAscii(description + "\n");
  // ESC ! 0x00: Normal
  chunks.push(Buffer.from([0x1B, 0x21, 0x00]));
  if (address) pushAscii(address + "\n");
  if (phone) pushAscii(`Ph: ${phone}\n`);
  if (gstin) pushAscii(`GSTIN: ${gstin}\n`);
  if (dlNo) pushAscii(`Drug Lic: ${dlNo}\n`);

  // Left align: ESC a 0
  chunks.push(Buffer.from([0x1B, 0x61, 0x00]));
  pushAscii(divider);
  pushAscii(twoCol(`Bill No: #${billNumber}`, `Date: ${date}`));
  pushAscii(twoCol(`Time: ${time}`, `Status: Issued`));
  pushAscii(divider);

  if (is58mm) {
    pushAscii(twoCol("Item", "Qty   Total"));
  } else {
    pushAscii("Item".padEnd(24) + "Qty".padStart(6) + "Rate".padStart(8) + "Total".padStart(10) + "\n");
  }
  pushAscii(divider);

  for (const it of items) {
    const name = String(it.product_name || "Item");
    const qty = String(it.quantity || 1);
    const rate = Number(it.rate || 0).toFixed(2);
    const tot = Number(it.total || 0).toFixed(2);

    if (is58mm) {
      pushAscii((name.length > 30 ? name.substring(0, 30) : name) + "\n");
      pushAscii(twoCol(`  ${qty} x Rs.${rate}`, `Rs.${tot}`));
    } else {
      let tName = name.length > 23 ? name.substring(0, 21) + ".." : name;
      pushAscii(tName.padEnd(24) + qty.padStart(6) + (`Rs.${rate}`).padStart(8) + (`Rs.${tot}`).padStart(10) + "\n");
    }
  }

  pushAscii(divider);
  pushAscii(twoCol("Subtotal (excl. GST):", `Rs.${Number(subtotal).toFixed(2)}`));
  if (discount > 0) {
    pushAscii(twoCol("Discount:", `-Rs.${Number(discount).toFixed(2)}`));
  }
  if (tax > 0) {
    pushAscii(twoCol("CGST (Half):", `+Rs.${(tax / 2).toFixed(2)}`));
    pushAscii(twoCol("SGST (Half):", `+Rs.${(tax / 2).toFixed(2)}`));
    pushAscii(twoCol("Total GST Added:", `+Rs.${Number(tax).toFixed(2)}`));
  }
  pushAscii(doubleDivider);

  // Grand Total Bold Double Height
  chunks.push(Buffer.from([0x1B, 0x21, 0x18]));
  pushAscii(twoCol("Grand Total (incl. GST):", `Rs.${Number(grandTotal).toFixed(2)}`));
  chunks.push(Buffer.from([0x1B, 0x21, 0x00]));
  pushAscii(doubleDivider);

  // Center: ESC a 1
  chunks.push(Buffer.from([0x1B, 0x61, 0x01]));
  pushAscii(`Payment Mode: ${paymentMethod}\n\n`);
  // ESC E 1: Bold on
  chunks.push(Buffer.from([0x1B, 0x45, 0x01]));
  pushAscii("Drugs sold cannot be refunded\n\n");
  // ESC E 0: Bold off
  chunks.push(Buffer.from([0x1B, 0x45, 0x00]));
  pushAscii("Thank You. Stay Healthy!\n");
  pushAscii("MADRAS ORTHO CLINIC SOFTWARE\n");
  pushAscii("Mission for Cure\n\n\n\n");

  // Paper cut: GS V 66 0
  chunks.push(Buffer.from([0x1D, 0x56, 0x42, 0x00]));

  return Buffer.concat(chunks);
}

app.post('/api/print/network', async (req, res) => {
  const { host, port = 9100, receiptData } = req.body;
  if (!host) {
    return res.status(400).json({ error: "WiFi printer host IP is required." });
  }

  const net = require('net');
  const socket = new net.Socket();
  socket.setTimeout(6000);

  socket.connect(Number(port), host, () => {
    try {
      const buffer = formatServerEscPos(receiptData);
      socket.write(buffer, () => {
        socket.end();
        res.json({ success: true, message: `Receipt sent to WiFi printer ${host}:${port}` });
      });
    } catch (e: any) {
      socket.destroy();
      res.status(500).json({ error: "Failed to format ESC/POS receipt: " + e.message });
    }
  });

  socket.on('error', (err: any) => {
    socket.destroy();
    res.status(502).json({ error: `Connection to WiFi printer at ${host}:${port} failed: ${err.message}` });
  });

  socket.on('timeout', () => {
    socket.destroy();
    res.status(504).json({ error: `Connection to WiFi printer at ${host}:${port} timed out.` });
  });
});

// ----------------------------------------------------
// STATUTORY COMPLIANCE & DRUG REGISTERS (D&C RULES, 1945)
// ----------------------------------------------------

// Schedule H1 Register (Rule 65(4)(4-A))
app.get('/api/registers/schedule-h1', async (req, res) => {
  try {
    const db = await getDatabase();
    const records = await db.all("SELECT * FROM schedule_h1_register");
    res.json(records);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/registers/schedule-h1/export-excel', async (req, res) => {
  try {
    const db = await getDatabase();
    const records = await db.all("SELECT * FROM schedule_h1_register");
    const buffer = await generateScheduleH1Excel(records);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Schedule_H1_Register_Form20B.xlsx"');
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Cold Chain Temperature Logs (Rule 65(17))
app.get('/api/registers/cold-chain', async (req, res) => {
  try {
    const db = await getDatabase();
    const records = await db.all("SELECT * FROM cold_chain_logs");
    res.json(records);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/registers/cold-chain', async (req, res) => {
  try {
    const { equipment_name, recorded_temp, checked_by, remarks } = req.body;
    const temp = Number(recorded_temp);
    const minTemp = 2.0;
    const maxTemp = 8.0;
    const status = (temp >= minTemp && temp <= maxTemp) ? 'Normal' : 'Excursion';
    const now = new Date();
    const logDate = now.toISOString().split('T')[0];
    const logTime = now.toTimeString().split(' ')[0];

    const db = await getDatabase();
    const result = await db.run(
      `INSERT INTO cold_chain_logs (log_date, log_time, equipment_name, recorded_temp_c, min_temp_c, max_temp_c, status, checked_by, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [logDate, logTime, equipment_name || 'Biologics Refrigerator R-01', temp, minTemp, maxTemp, status, checked_by || 'Priya Nair, B.Pharm', remarks || (status === 'Normal' ? 'Routine inspection' : 'Temperature excursion detected')]
    );

    res.status(201).json({
      id: result.lastID,
      log_date: logDate,
      log_time: logTime,
      equipment_name,
      recorded_temp_c: temp,
      min_temp_c: minTemp,
      max_temp_c: maxTemp,
      status,
      checked_by
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/registers/cold-chain/export-excel', async (req, res) => {
  try {
    const db = await getDatabase();
    const records = await db.all("SELECT * FROM cold_chain_logs");
    const buffer = await generateColdChainExcel(records);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Cold_Chain_Temperature_Log_Rule65.xlsx"');
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Pharmacy Retail Licences (Form 20B / Form 21B)
app.get('/api/registers/licences', async (req, res) => {
  try {
    const db = await getDatabase();
    const licences = await db.all("SELECT * FROM pharmacy_licences");
    res.json(licences);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Tamper-Evident Audit Trail Logs (DPDP Act 2023)
app.get('/api/audit-logs', async (req, res) => {
  try {
    const db = await getDatabase();
    const logs = await db.all("SELECT * FROM audit_logs");
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// FEFO Batch Tracking
app.get('/api/batches/product/:productId', async (req, res) => {
  try {
    const prodId = Number(req.params.productId);
    const db = await getDatabase();
    const batches = await db.all("SELECT * FROM batches WHERE product_id = ? ORDER BY expiry_date ASC", [prodId]);
    res.json(batches);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// ----------------------------------------------------
// CLINICAL DECISION SUPPORT & PATIENT SAFETY
// ----------------------------------------------------
app.post('/api/clinical/check-interactions', (req, res) => {
  try {
    const { items, patientInfo } = req.body;
    const result = checkClinicalInteractions(items || [], patientInfo || {});
    res.json({
      ...result,
      critical: result.alerts.filter(a => a.severity === 'CRITICAL'),
      warnings: result.alerts.filter(a => a.severity === 'WARNING')
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to evaluate clinical interactions: " + err.message });
  }
});

// ----------------------------------------------------
// PHARMACOVIGILANCE, RECALL TRACING & BATCH QUARANTINE
// ----------------------------------------------------

// List Quarantined and Recalled batches
app.get('/api/registers/recalls', async (req, res) => {
  try {
    const db = await getDatabase();
    const quarantined = await db.all(`
      SELECT b.*, p.name as product_name, p.generic_name
      FROM batches b
      LEFT JOIN products p ON b.product_id = p.id
      WHERE b.status IN ('Quarantined', 'Recalled')
      ORDER BY b.quarantined_at DESC
    `);
    res.json(quarantined);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Mark a batch as Quarantined or Recalled by Batch Number or ID
app.post('/api/registers/recalls/quarantine', async (req, res) => {
  try {
    const { batch_number, status = 'Quarantined', reason, authorized_by = 'Pharmacist' } = req.body;
    if (!batch_number) {
      return res.status(400).json({ error: "Batch number is required." });
    }
    const db = await getDatabase();
    const now = new Date().toISOString();
    const allBatches = await db.all<any>("SELECT * FROM batches");
    const existing = allBatches.find((b: any) => b.batch_number === batch_number || b.id === Number(batch_number));
    if (existing) {
      await db.run(
        "UPDATE batches SET status = ?, quarantine_reason = ?, quarantined_at = ? WHERE id = ?",
        [status, reason || 'CDSCO Recall / Substandard Batch Notice', now, existing.id]
      );
    } else {
      const prodId = req.body.product_id || 1;
      await db.run(
        `INSERT INTO batches (product_id, batch_number, mfg_date, expiry_date, mrp, purchase_price, available_stock, status, quarantine_reason, quarantined_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [prodId, batch_number, '2025-01-01', '2028-12-31', 100, 70, 50, status, reason || 'CDSCO Recall / Substandard Batch Notice', now]
      );
    }

    // Record statutory audit log
    await db.run(
      `INSERT INTO audit_logs (user_id, username, action, entity_type, entity_id, previous_state, new_state, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        1, authorized_by, 'BATCH_QUARANTINE_ACTION', 'batches', existing ? existing.id : 0,
        JSON.stringify({ status: 'Active' }),
        JSON.stringify({ batch_number, status, reason }),
        req.ip || '127.0.0.1'
      ]
    );

    res.json({ success: true, message: `Batch '${batch_number}' placed under ${status}.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Mark a batch as Quarantined or Recalled (CDSCO / State Drug Controller Alert)
app.post('/api/batches/:id/quarantine', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status = 'Quarantined', reason, authorized_by = 'Pharmacist' } = req.body;
    const db = await getDatabase();
    const now = new Date().toISOString();

    await db.run(
      "UPDATE batches SET status = ?, quarantine_reason = ?, quarantined_at = ? WHERE id = ?",
      [status, reason || 'CDSCO Recall / Substandard Batch Notice', now, id]
    );

    // Record statutory audit log
    await db.run(
      `INSERT INTO audit_logs (user_id, username, action, entity_type, entity_id, previous_state, new_state, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        1, authorized_by, 'BATCH_QUARANTINE_ACTION', 'batches', id,
        JSON.stringify({ status: 'Active' }),
        JSON.stringify({ status, reason }),
        req.ip || '127.0.0.1'
      ]
    );

    res.json({ success: true, message: `Batch #${id} successfully placed under ${status}.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Rapid Patient Contact Tracing for Recalled Batches (National Recall Directives)
app.get('/api/registers/recalls/trace/:batchNumber', async (req, res) => {
  try {
    const { batchNumber } = req.params;
    const db = await getDatabase();

    const query = `
      SELECT 
        b.id as bill_id, b.bill_number, b.date as dispense_date, b.time as dispense_time,
        b.operating_mode, b.patient_name, b.patient_phone, b.patient_address,
        b.doctor_name, b.doctor_reg_no, b.pharmacist_name,
        bi.product_name, bi.quantity, bi.batch_number, bi.expiry_date
      FROM bill_items bi
      JOIN bills b ON bi.bill_id = b.id
      WHERE bi.batch_number = ? AND b.status != 'Cancelled'
      ORDER BY b.date DESC
    `;

    const patients = await db.all(query, [batchNumber]);
    res.json({
      batch_number: batchNumber,
      total_dispensed_instances: patients.length,
      patients
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Pharmacovigilance Programme of India (PvPI) ADR Reporting
app.get('/api/registers/adr-reports', async (req, res) => {
  try {
    const db = await getDatabase();
    const reports = await db.all("SELECT * FROM adr_reports");
    res.json(reports);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/registers/adr-reports', async (req, res) => {
  try {
    const {
      patient_name, patient_age, patient_gender,
      suspected_drug, generic_name, batch_number,
      reaction_description, reaction_date,
      severity = 'MODERATE', outcome = 'RECOVERING',
      reported_by, reporter_qualification = 'B.Pharm'
    } = req.body;

    if (!patient_name || !suspected_drug || !reaction_description) {
      return res.status(400).json({ error: "Missing required PvPI ADR fields: Patient Name, Suspected Drug, and Reaction Description." });
    }

    const reportDate = new Date().toISOString().split('T')[0];
    const db = await getDatabase();

    const result = await db.run(
      `INSERT INTO adr_reports (
        report_date, patient_name, patient_age, patient_gender,
        suspected_drug, generic_name, batch_number,
        reaction_description, reaction_date, severity, outcome,
        reported_by, reporter_qualification
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reportDate, patient_name, patient_age ? Number(patient_age) : null, patient_gender || null,
        suspected_drug, generic_name || suspected_drug, batch_number || 'N/A',
        reaction_description, reaction_date || reportDate, severity, outcome,
        reported_by || 'Pharmacist', reporter_qualification
      ]
    );

    // Audit log
    await db.run(
      `INSERT INTO audit_logs (user_id, username, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?, ?)`,
      [1, reported_by || 'pharmacist', 'PVPI_ADR_REPORT_FILED', 'adr_reports', result.lastID, req.ip || '127.0.0.1']
    );

    res.status(201).json({
      success: true,
      id: result.lastID,
      message: "Adverse Drug Reaction recorded under PvPI protocol."
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
// ----------------------------------------------------
// SYSTEM DATA MANAGEMENT & UNINSTALL CLEANUP
// ----------------------------------------------------

// Permanently wipe all clinic records and data from this device
app.post('/api/system/wipe-all-data', async (req, res) => {
  try {
    const { wipeAllData } = await import('./database');
    await wipeAllData();
    res.json({ success: true, message: "All clinic data, bills, and records have been completely wiped from this device." });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to wipe data: " + err.message });
  }
});

// Purge ONLY example / demo records across all tables (patients, employees, bills, products)
app.post('/api/system/clear-example-records', async (req, res) => {
  try {
    const db = await getDatabase();

    // 1. Purge example patients
    const delPatients = await db.run("DELETE FROM patients WHERE is_example = 1");

    // 2. Purge example employees
    const delEmployees = await db.run("DELETE FROM employees WHERE is_example = 1");

    // 3. Purge example bills & bill items
    const exampleBills = await db.all<any>("SELECT id FROM bills WHERE is_example = 1");
    for (const b of exampleBills) {
      await db.run("DELETE FROM bill_items WHERE bill_id = ?", [b.id]);
    }
    const delBills = await db.run("DELETE FROM bills WHERE is_example = 1");

    // 4. Audit trail entry for governance
    try {
      await db.run(
        `INSERT INTO audit_logs (username, action, entity_type, entity_id, new_state, ip_address)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ["admin", "PURGE_EXAMPLE_RECORDS", "system", "all", JSON.stringify({
          patients: delPatients.changes || 0,
          employees: delEmployees.changes || 0,
          bills: delBills.changes || 0
        }), "127.0.0.1"]
      );
    } catch (e) {}

    res.json({
      success: true,
      message: "All example placeholder records (demo patients, demo employees, test bills) have been purged. Genuine clinic records are preserved.",
      purged: {
        patients: delPatients.changes || 0,
        employees: delEmployees.changes || 0,
        bills: delBills.changes || 0
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to purge example records: " + err.message });
  }
});

// ----------------------------------------------------
// NETWORK & WI-FI HOST INFORMATION ENDPOINT
// ----------------------------------------------------
app.get('/api/network-info', (req, res) => {
  try {
    const interfaces = os.networkInterfaces();
    const addresses: { interface: string; ip: string; isWifi: boolean; url: string }[] = [];
    
    for (const name of Object.keys(interfaces)) {
      for (const net of interfaces[name] || []) {
        if (net.family === 'IPv4' && !net.internal) {
          const isWifi = /wi-?fi|wlan|wireless|802\.11/i.test(name);
          addresses.push({
            interface: name,
            ip: net.address,
            isWifi,
            url: `http://${net.address}:${PORT}`
          });
        }
      }
    }

    // Sort so Wi-Fi interfaces appear first
    addresses.sort((a, b) => (b.isWifi ? 1 : 0) - (a.isWifi ? 1 : 0));

    res.json({
      port: Number(PORT),
      customUrl: `http://madrasorthoclinic.local:${PORT}`,
      localhostUrl: `http://localhost:${PORT}`,
      primaryLanUrl: addresses.length > 0 ? addresses[0].url : `http://localhost:${PORT}`,
      interfaces: addresses
    });
  } catch (err: any) {
    res.json({
      port: Number(PORT),
      customUrl: `http://madrasorthoclinic.local:${PORT}`,
      localhostUrl: `http://localhost:${PORT}`,
      primaryLanUrl: `http://localhost:${PORT}`,
      interfaces: []
    });
  }
});

// Start API server with EADDRINUSE guard.
// If the port is already in use (e.g., zombie process from a previous run),
// log clearly instead of crashing silently which would cause a blank screen.

// Wildcard fallback to serve index.html for client-side routing
if (resolvedDistPath) {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(resolvedDistPath, 'index.html'));
  });
} else {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.status(503).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Madras Ortho Clinic Server</title></head>
      <body style="font-family: -apple-system, sans-serif; padding: 40px; text-align: center; background: #0f172a; color: #f8fafc;">
        <h2 style="color: #38bdf8;">🏥 MADRAS ORTHO CLINIC PHARMACY SERVER</h2>
        <p style="color: #94a3b8; margin-top: 10px;">Backend API is active on port ${PORT}.</p>
        <p style="color: #cbd5e1; margin-top: 10px;">Frontend static bundle (dist/index.html) is being located.</p>
      </body>
      </html>
    `);
  });
}

const HOST = '0.0.0.0';
const server = app.listen(Number(PORT), HOST, () => {
  console.log(`[SERVER] API running on http://madrasorthoclinic.local:${PORT} (and http://localhost:${PORT})`);
  console.log(`[SERVER] Accepting LAN/Wi-Fi connections on http://${HOST}:${PORT}`);
  // Start Zero-Config mDNS responder for madrasorthoclinic.local
  try {
    startMdnsResponder();
  } catch (e) {
    console.warn('[SERVER] mDNS startup warning:', e);
  }
});

// Configure resilient connection & keep-alive timeouts for mobile / LAN clients
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
server.requestTimeout = 30000;

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[SERVER] Port ${PORT} is already in use. The API server could not start. Close any other instances and restart.`);
  } else {
    console.error('[SERVER] Unexpected server error:', err);
  }
});

export { app, server };

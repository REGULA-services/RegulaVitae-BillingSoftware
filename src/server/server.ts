import express from 'express';
import cors from 'cors';
import { getDatabase } from './database';
import { 
  generateDailyExcel, 
  generateWeeklyExcel, 
  generateYearlyExcel,
  generateMedicineImportTemplate,
  parseMedicinesFromBuffer
} from './excel';

const app = express();
const PORT = process.env.PORT || 4848;

app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Logger middleware
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
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
    const db = await getDatabase();
    const user = await db.get<any>("SELECT * FROM users WHERE username = ?", [username]);
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid username or password." });
    }
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Change Password (Admin Only)
app.put('/api/auth/change-password', async (req, res) => {
  try {
    const { requesterRole, username, currentPassword, newPassword } = req.body;
    if (requesterRole && requesterRole !== 'admin') {
      return res.status(403).json({ error: "Access Denied: Only Admin accounts can change passwords." });
    }
    if (!username || !currentPassword || !newPassword) {
      return res.status(400).json({ error: "All fields are required." });
    }
    const db = await getDatabase();
    const user = await db.get<any>("SELECT * FROM users WHERE username = ?", [username]);
    if (!user || user.password !== currentPassword) {
      return res.status(401).json({ error: "Incorrect current password." });
    }
    await db.run("UPDATE users SET password = ? WHERE username = ?", [newPassword, username]);
    res.json({ success: true, message: "Password updated successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// PRODUCT ENDPOINTS
// ----------------------------------------------------

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const db = await getDatabase();
    const products = await db.all("SELECT * FROM products ORDER BY name ASC");
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create product
app.post('/api/products', async (req, res) => {
  try {
    const { name, category, price, barcode, sku, tax_percent, status, quantity_type } = req.body;
    if (!name || !category || price === undefined) {
      return res.status(400).json({ error: "Missing required product fields." });
    }
    const db = await getDatabase();
    const result = await db.run(
      `INSERT INTO products (name, category, price, barcode, sku, tax_percent, status, quantity_type) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, category, Number(price), barcode || null, sku || null, Number(tax_percent || 0), status || 'Available', quantity_type || 'pcs']
    );
    res.status(201).json({ id: result.lastID, name, category, price, barcode, sku, tax_percent, status, quantity_type });
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
    const { name, category, price, barcode, sku, tax_percent, status, quantity_type } = req.body;
    const db = await getDatabase();
    const result = await db.run(
      `UPDATE products 
       SET name = ?, category = ?, price = ?, barcode = ?, sku = ?, tax_percent = ?, status = ?, quantity_type = ? 
       WHERE id = ?`,
      [name, category, Number(price), barcode || null, sku || null, Number(tax_percent || 0), status || 'Available', quantity_type || 'pcs', Number(id)]
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: "Product not found." });
    }
    res.json({ id: Number(id), name, category, price, barcode, sku, tax_percent, status, quantity_type });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    const result = await db.run("DELETE FROM products WHERE id = ?", [Number(id)]);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Product not found." });
    }
    res.json({ message: "Product deleted successfully.", id: Number(id) });
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
    const buffer = await generateMedicineImportTemplate();
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
      const price = Math.max(0, Number(p.price) || 0);
      const tax_percent = Math.max(0, Number(p.tax_percent) || 0);
      const quantity_type = p.quantity_type || 'strip';
      const status = p.status || 'Available';
      const barcode = p.barcode ? String(p.barcode).trim() : null;
      const sku = p.sku ? String(p.sku).trim() : null;

      try {
        // Check if existing product with same name exists
        const existing = await db.get<any>(
          "SELECT * FROM products WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))",
          [name]
        );

        if (existing) {
          if (updateExisting) {
            await db.run(
              `UPDATE products 
               SET category = ?, price = ?, barcode = COALESCE(?, barcode), sku = COALESCE(?, sku), tax_percent = ?, status = ?, quantity_type = ? 
               WHERE id = ?`,
              [category, price, barcode, sku, tax_percent, status, quantity_type, existing.id]
            );
            updated++;
          } else {
            // Add as variant / duplicate entry
            const variantName = `${name} (${Date.now().toString().slice(-4)})`;
            await db.run(
              `INSERT INTO products (name, category, price, barcode, sku, tax_percent, status, quantity_type) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [variantName, category, price, barcode ? `${barcode}-2` : null, sku ? `${sku}-2` : null, tax_percent, status, quantity_type]
            );
            added++;
          }
        } else {
          // Fresh insertion
          await db.run(
            `INSERT INTO products (name, category, price, barcode, sku, tax_percent, status, quantity_type) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, category, price, barcode, sku, tax_percent, status, quantity_type]
          );
          added++;
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
    const { name, role, phone, email, salary, status, joined_date } = req.body;
    if (!name || !role) {
      return res.status(400).json({ error: "Missing required employee fields." });
    }
    const db = await getDatabase();
    const result = await db.run(
      `INSERT INTO employees (name, role, phone, email, salary, status, joined_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, role, phone || null, email || null, salary !== undefined && salary !== null ? Number(salary) : null, status || 'Active', joined_date || null]
    );
    res.status(201).json({ id: result.lastID, name, role, phone, email, salary, status, joined_date });
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
    const { name, role, phone, email, salary, status, joined_date } = req.body;
    const db = await getDatabase();
    const result = await db.run(
      `UPDATE employees 
       SET name = ?, role = ?, phone = ?, email = ?, salary = ?, status = ?, joined_date = ? 
       WHERE id = ?`,
      [name, role, phone || null, email || null, salary !== undefined && salary !== null ? Number(salary) : null, status || 'Active', joined_date || null, Number(id)]
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: "Employee not found." });
    }
    res.json({ id: Number(id), name, role, phone, email, salary, status, joined_date });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete employee
app.delete('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    const result = await db.run("DELETE FROM employees WHERE id = ?", [Number(id)]);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Employee not found." });
    }
    res.json({ message: "Employee deleted successfully.", id: Number(id) });
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

// Save a completed invoice
app.post('/api/bills', async (req, res) => {
  try {
    const { bill_number, subtotal, discount, tax, grand_total, payment_method, cashier_name, items } = req.body;
    if (!bill_number || grand_total === undefined || !payment_method || !items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Invalid bill payload. Missing required properties." });
    }

    const db = await getDatabase();
    const now = new Date();
    
    // YYYY-MM-DD
    const dateStr = now.toISOString().split('T')[0];
    
    // HH:MM:SS (local style)
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}:${seconds}`;

    // Insert bill invoice
    const billResult = await db.run(
      `INSERT INTO bills (bill_number, subtotal, discount, tax, grand_total, payment_method, date, time, cashier_name) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [Number(bill_number), Number(subtotal), Number(discount), Number(tax), Number(grand_total), payment_method, dateStr, timeStr, cashier_name || 'Pharmacist']
    );

    const billId = billResult.lastID;

    // Insert items
    for (const item of items) {
      await db.run(
        `INSERT INTO bill_items (bill_id, product_id, product_name, quantity, rate, total) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [billId, item.product_id, item.product_name, Number(item.quantity), Number(item.rate), Number(item.total)]
      );
    }

    res.status(201).json({
      id: billId,
      bill_number,
      subtotal,
      discount,
      tax,
      grand_total,
      payment_method,
      date: dateStr,
      time: timeStr,
      cashier_name,
      items
    });
  } catch (err: any) {
    if (err.message.includes("UNIQUE")) {
      res.status(400).json({ error: `Bill number ${req.body.bill_number} already exists.` });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Get bills list filtered by day, week, or year
app.get('/api/bills', async (req, res) => {
  try {
    const period = req.query.period as string || 'day'; // 'day', 'week', 'year'
    const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const year = Number(req.query.year || new Date().getFullYear());
    
    const db = await getDatabase();
    let query = "";
    let params: any[] = [];
    
    if (period === 'day') {
      query = "SELECT * FROM bills WHERE date = ? ORDER BY date DESC, time DESC";
      params = [dateStr];
    } else if (period === 'week') {
      const { monday, sunday } = getMondayAndSunday(dateStr);
      query = "SELECT * FROM bills WHERE date BETWEEN ? AND ? ORDER BY date DESC, time DESC";
      params = [monday, sunday];
    } else if (period === 'year') {
      query = "SELECT * FROM bills WHERE date BETWEEN ? AND ? ORDER BY date DESC, time DESC";
      params = [`${year}-01-01`, `${year}-12-31`];
    } else {
      return res.status(400).json({ error: "Invalid period. Must be day, week, or year." });
    }
    
    const bills = await db.all(query, params);
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

// Delete a bill from history
app.delete('/api/bills/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    
    // Explicitly delete from bill_items first (to be safe against SQLite pragma settings)
    await db.run("DELETE FROM bill_items WHERE bill_id = ?", [Number(id)]);
    const result = await db.run("DELETE FROM bills WHERE id = ?", [Number(id)]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: "Bill not found." });
    }
    res.json({ message: "Bill deleted successfully.", id: Number(id) });
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

// Helper: compiles top products, totals, and payment distributions
async function compileDailyStats(dateStr: string) {
  const db = await getDatabase();
  const bills = await db.all("SELECT * FROM bills WHERE date = ?", [dateStr]);
  
  let totalSales = 0;
  const paymentBreakdown = { Cash: 0, GooglePay: 0, BankCard: 0 };

  bills.forEach((b: any) => {
    totalSales += b.grand_total;
    const pm = b.payment_method;
    if (pm === "Cash") paymentBreakdown.Cash += b.grand_total;
    else if (pm === "Google Pay" || pm === "GooglePay") paymentBreakdown.GooglePay += b.grand_total;
    else if (pm === "Bank Card" || pm === "BankCard") paymentBreakdown.BankCard += b.grand_total;
  });

  // Calculate items count
  const allItems = await db.all(`
    SELECT bi.product_name as name, SUM(bi.quantity) as quantity, SUM(bi.total) as total
    FROM bill_items bi
    JOIN bills b ON bi.bill_id = b.id
    WHERE b.date = ?
    GROUP BY bi.product_name
    ORDER BY quantity DESC
  `, [dateStr]);

  return {
    date: dateStr,
    totalSales,
    billCount: bills.length,
    paymentBreakdown,
    topProducts: allItems as any[],
    allBills: bills
  };
}

// Daily Report REST API
app.get('/api/reports/daily', async (req, res) => {
  try {
    const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const stats = await compileDailyStats(dateStr);

    if (req.query.export === 'excel') {
      const buffer = await generateDailyExcel(stats);
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
    
    const db = await getDatabase();
    const bills = await db.all("SELECT * FROM bills WHERE date BETWEEN ? AND ?", [monday, sunday]);

    let totalSales = 0;
    const paymentBreakdown = { Cash: 0, GooglePay: 0, BankCard: 0 };
    bills.forEach((b: any) => {
      totalSales += b.grand_total;
      const pm = b.payment_method;
      if (pm === "Cash") paymentBreakdown.Cash += b.grand_total;
      else if (pm === "Google Pay" || pm === "GooglePay") paymentBreakdown.GooglePay += b.grand_total;
      else if (pm === "Bank Card" || pm === "BankCard") paymentBreakdown.BankCard += b.grand_total;
    });

    // Daily breakdown mapping
    const dailyBreakdownMap: { [key: string]: { date: string; amount: number; bills: number } } = {};
    
    // Populate calendar week days
    let runner = new Date(monday);
    for (let i = 0; i < 7; i++) {
      const dStr = runner.toISOString().split('T')[0];
      dailyBreakdownMap[dStr] = { date: dStr, amount: 0, bills: 0 };
      runner.setDate(runner.getDate() + 1);
    }

    bills.forEach((b: any) => {
      if (dailyBreakdownMap[b.date]) {
        dailyBreakdownMap[b.date].amount += b.grand_total;
        dailyBreakdownMap[b.date].bills += 1;
      }
    });

    const dailyBreakdown = Object.values(dailyBreakdownMap);

    // Top selling items
    const topItems = await db.all(`
      SELECT bi.product_name as name, SUM(bi.quantity) as quantity, SUM(bi.total) as total
      FROM bill_items bi
      JOIN bills b ON bi.bill_id = b.id
      WHERE b.date BETWEEN ? AND ?
      GROUP BY bi.product_name
      ORDER BY quantity DESC
    `, [monday, sunday]);

    const stats = {
      dateRange: `${monday} to ${sunday}`,
      totalSales,
      dailyBreakdown,
      paymentBreakdown,
      topProducts: topItems as any[]
    };

    if (req.query.export === 'excel') {
      const buffer = await generateWeeklyExcel(stats);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Weekly_Sales_Report_${monday}_to_${sunday}.xlsx`);
      return res.send(buffer);
    }

    res.json(stats);
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

    const db = await getDatabase();
    const bills = await db.all("SELECT * FROM bills WHERE date BETWEEN ? AND ?", [start, end]);

    let totalSales = 0;
    const paymentBreakdown = { Cash: 0, GooglePay: 0, BankCard: 0 };
    bills.forEach((b: any) => {
      totalSales += b.grand_total;
      const pm = b.payment_method;
      if (pm === "Cash") paymentBreakdown.Cash += b.grand_total;
      else if (pm === "Google Pay" || pm === "GooglePay") paymentBreakdown.GooglePay += b.grand_total;
      else if (pm === "Bank Card" || pm === "BankCard") paymentBreakdown.BankCard += b.grand_total;
    });

    // Monthly breakdown (January to December)
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    const monthlyBreakdown = months.map((name, idx) => ({
      monthIdx: idx, // 0-based
      monthName: name,
      amount: 0,
      bills: 0,
      growthPercent: 0
    }));

    bills.forEach((b: any) => {
      const bDate = new Date(b.date);
      const mIdx = bDate.getMonth();
      if (mIdx >= 0 && mIdx < 12) {
        monthlyBreakdown[mIdx].amount += b.grand_total;
        monthlyBreakdown[mIdx].bills += 1;
      }
    });

    // Calculate month-on-month growth %
    for (let i = 0; i < 12; i++) {
      if (i === 0) {
        monthlyBreakdown[i].growthPercent = 0;
      } else {
        const prev = monthlyBreakdown[i - 1].amount;
        const curr = monthlyBreakdown[i].amount;
        if (prev === 0) {
          monthlyBreakdown[i].growthPercent = curr > 0 ? 1 : 0;
        } else {
          monthlyBreakdown[i].growthPercent = (curr - prev) / prev;
        }
      }
    }

    // Top products
    const topItems = await db.all(`
      SELECT bi.product_name as name, SUM(bi.quantity) as quantity, SUM(bi.total) as total
      FROM bill_items bi
      JOIN bills b ON bi.bill_id = b.id
      WHERE b.date BETWEEN ? AND ?
      GROUP BY bi.product_name
      ORDER BY quantity DESC
    `, [start, end]);

    const stats = {
      year,
      totalSales,
      monthlyBreakdown,
      paymentBreakdown,
      topProducts: topItems as any[]
    };

    if (req.query.export === 'excel') {
      const buffer = await generateYearlyExcel(stats);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Yearly_Sales_Report_${year}.xlsx`);
      return res.send(buffer);
    }

    res.json(stats);
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
  pushAscii(twoCol(`Pharmacist: ${cashierName}`, `Time: ${time}`));
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

// Start API server with EADDRINUSE guard.
// If the port is already in use (e.g., zombie process from a previous run),
// log clearly instead of crashing silently which would cause a blank screen.
const server = app.listen(PORT, () => {
  console.log(`[SERVER] API running on http://localhost:${PORT}`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[SERVER] Port ${PORT} is already in use. The API server could not start. Close any other instances and restart.`);
  } else {
    console.error('[SERVER] Unexpected server error:', err);
  }
});

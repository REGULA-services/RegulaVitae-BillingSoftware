import { ORTHO_PHARMACY_PRODUCTS } from './mockFetch';
/**
 * offlineApi.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Full offline data layer for MADRAS ORTHO CLINIC SOFTWARE mobile (Android).
 * All data is persisted to localStorage when the Express server is unreachable.
 * The desktop Electron build continues using the real REST API at port 4848.
 */

// ─── Platform Detection ──────────────────────────────────────────────────────
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  const isElectron = !!(window as any).electron;
  if (isElectron) return false;
  // Capacitor sets window.Capacitor when running inside the Android/iOS webview
  const isCap = !!(window as any).Capacitor;
  const ua = navigator.userAgent || '';
  const mobileUA = /Android|iPhone|iPad|iPod/i.test(ua);
  return isCap || mobileUA;
};

const SERVER = 'http://localhost:4848';

// ─── Storage Keys ─────────────────────────────────────────────────────────────
const KEYS = {
  PRODUCTS: 'moc_offline_products',
  EMPLOYEES: 'moc_offline_employees',
  BILLS: 'moc_offline_bills',
  BILL_SEQ: 'moc_offline_bill_seq',
  BILL_DATE: 'moc_offline_bill_date',
  DELETED: 'moc_offline_deleted',
  USERS: 'moc_offline_users',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: any) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('localStorage save failed:', e);
  }
}

function nextId(items: any[]): number {
  if (items.length === 0) return 1;
  return Math.max(...items.map(i => Number(i.id) || 0)) + 1;
}

function parseOfflineCsv(text: string): any[] {
  if (!text) return [];
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];

  const first = lines[0];
  let delimiter = ',';
  if (first.includes('\t')) delimiter = '\t';
  else if (first.includes(';') && !first.includes(',')) delimiter = ';';

  const grid: string[][] = lines.map(line => {
    const values: string[] = [];
    let insideQuotes = false;
    let current = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === delimiter && !insideQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  });

  let headerRowIdx = -1;
  let colMap: Record<string, number> = {};

  for (let r = 0; r < Math.min(grid.length, 25); r++) {
    const row = grid[r];
    const candidateMap: Record<string, number> = {};
    for (let c = 0; c < row.length; c++) {
      const val = (row[c] || '').toLowerCase().trim();
      if (!val || val.includes('template') || val.includes('instruction')) continue;
      if ((val.includes('name') || val.includes('medicine') || val.includes('drug') || val.includes('item') || val.includes('product')) && candidateMap.name === undefined) {
        candidateMap.name = c;
      } else if ((val.includes('category') || val.includes('cat') || val.includes('group') || val.includes('type')) && candidateMap.category === undefined) {
        candidateMap.category = c;
      } else if ((val.includes('price') || val.includes('mrp') || val.includes('rate') || val.includes('cost') || val.includes('amount') || val.includes('₹') || val.includes('rs')) && candidateMap.price === undefined) {
        candidateMap.price = c;
      } else if ((val.includes('gst') || val.includes('tax')) && candidateMap.tax === undefined) {
        candidateMap.tax = c;
      } else if ((val.includes('unit') || val.includes('pack') || val.includes('quantity')) && candidateMap.quantity_type === undefined) {
        candidateMap.quantity_type = c;
      } else if (val.includes('barcode') && candidateMap.barcode === undefined) {
        candidateMap.barcode = c;
      } else if (val.includes('sku') && candidateMap.sku === undefined) {
        candidateMap.sku = c;
      }
    }
    if (candidateMap.name !== undefined && (Object.keys(candidateMap).length >= 2 || candidateMap.price !== undefined || candidateMap.category !== undefined)) {
      headerRowIdx = r;
      colMap = candidateMap;
      break;
    }
  }

  if (headerRowIdx === -1 || colMap.name === undefined) {
    colMap = { name: 0, category: 1, price: 2, tax: 3, quantity_type: 4, barcode: 5, sku: 6 };
    headerRowIdx = -1;
  }

  const items: any[] = [];
  const startRow = headerRowIdx >= 0 ? headerRowIdx + 1 : 0;
  for (let r = startRow; r < grid.length; r++) {
    const row = grid[r];
    const name = (row[colMap.name !== undefined ? colMap.name : 0] || '').trim();
    if (!name || name.toLowerCase().includes('medicine name') || name.toLowerCase().includes('instructions:')) continue;
    const lower = name.toLowerCase();
    if (lower === 'total' || lower === 'grand total' || lower.startsWith('page ')) continue;

    const rawPrice = (colMap.price !== undefined ? row[colMap.price] : '') || '';
    const numPrice = parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 0;

    const rawTax = (colMap.tax !== undefined ? row[colMap.tax] : '') || '';
    const numTax = parseFloat(String(rawTax).replace(/[^0-9.]/g, '')) || 5;

    items.push({
      name,
      category: (colMap.category !== undefined && row[colMap.category]) ? row[colMap.category].trim() : 'Orthopaedic Medicines',
      price: numPrice,
      tax_percent: numTax,
      quantity_type: (colMap.quantity_type !== undefined && row[colMap.quantity_type]) ? row[colMap.quantity_type].trim() : 'strip',
      barcode: (colMap.barcode !== undefined && row[colMap.barcode]) ? row[colMap.barcode].trim() : null,
      sku: (colMap.sku !== undefined && row[colMap.sku]) ? row[colMap.sku].trim() : null,
      status: 'Available'
    });
  }
  return items;
}

// ─── Default Ortho Medicine Catalogue ────────────────────────────────────────
const DEFAULT_PRODUCTS = ORTHO_PHARMACY_PRODUCTS;

const DEFAULT_USERS = [
  { id: 1, username: 'admin', password: 'admin123', role: 'admin', name: 'Administrator' },
  { id: 2, username: 'employee', password: 'employee123', role: 'employee', name: 'Pharmacist' },
];

// Seed default products once
function ensureDefaultProducts() {
  const existing = load<any[]>(KEYS.PRODUCTS, []);
  if (existing.length === 0) {
    save(KEYS.PRODUCTS, DEFAULT_PRODUCTS);
  }
}

function ensureDefaultUsers() {
  const existing = load<any[]>(KEYS.USERS, []);
  if (existing.length === 0) {
    save(KEYS.USERS, DEFAULT_USERS);
  }
}

// ─── Next Bill Number ─────────────────────────────────────────────────────────
export function getOfflineNextBillNumber(): number {
  const todayStr = new Date().toISOString().split('T')[0];
  const storedDate = localStorage.getItem(KEYS.BILL_DATE);
  if (storedDate !== todayStr) {
    localStorage.setItem(KEYS.BILL_DATE, todayStr);
    save(KEYS.BILL_SEQ, 0);
  }
  const seq = load<number>(KEYS.BILL_SEQ, 0) + 1;
  save(KEYS.BILL_SEQ, seq);
  return seq;
}

// ─── Universal fetch wrapper ──────────────────────────────────────────────────
/**
 * Wraps fetch() so that when running on mobile (no server), all requests are
 * intercepted and handled offline. On desktop Electron the real server is used.
 */
export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  if (!isMobile()) {
    // Desktop: use real server
    return fetch(`${SERVER}${path}`, options);
  }

  // ── MOBILE OFFLINE HANDLER ──────────────────────────────────────────────────
  ensureDefaultProducts();
  ensureDefaultUsers();

  const method = (options?.method || 'GET').toUpperCase();
  const body = options?.body ? JSON.parse(options.body as string) : null;

  const ok = (data: any) => new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
  const err = (msg: string, status = 400) => new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

  // ── Auth ──
  if (path === '/api/auth/login' && method === 'POST') {
    const users = load<any[]>(KEYS.USERS, DEFAULT_USERS);
    const u = users.find(u => u.username === body.username && u.password === body.password);
    if (u) {
      return ok({ success: true, user: { id: u.id, username: u.username, role: u.role, name: u.name } });
    }
    return err('Invalid username or password', 401);
  }

  if (path === '/api/auth/change-password' && method === 'PUT') {
    const users = load<any[]>(KEYS.USERS, DEFAULT_USERS);
    const idx = users.findIndex(u => u.username === body.username);
    if (idx === -1) return err('User not found', 404);
    users[idx].password = body.newPassword;
    save(KEYS.USERS, users);
    return ok({ success: true });
  }

  // ── Products ──
  if (path === '/api/products' && method === 'GET') {
    return ok(load<any[]>(KEYS.PRODUCTS, DEFAULT_PRODUCTS));
  }

  if (path === '/api/products' && method === 'POST') {
    const products = load<any[]>(KEYS.PRODUCTS, []);
    const newP = { ...body, id: nextId(products) };
    save(KEYS.PRODUCTS, [...products, newP]);
    return ok(newP);
  }

  if (path.startsWith('/api/products/') && method === 'PUT') {
    const id = Number(path.split('/').pop());
    const products = load<any[]>(KEYS.PRODUCTS, []);
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return err('Product not found', 404);
    products[idx] = { ...products[idx], ...body, id };
    save(KEYS.PRODUCTS, products);
    return ok(products[idx]);
  }

  if (path.startsWith('/api/products/') && method === 'DELETE') {
    const id = Number(path.split('/').pop());
    const products = load<any[]>(KEYS.PRODUCTS, []);
    save(KEYS.PRODUCTS, products.filter(p => p.id !== id));
    return ok({ success: true });
  }

  // ── Employees ──
  if (path === '/api/employees' && method === 'GET') {
    return ok(load<any[]>(KEYS.EMPLOYEES, []));
  }

  if (path === '/api/employees' && method === 'POST') {
    const emps = load<any[]>(KEYS.EMPLOYEES, []);
    const newE = { ...body, id: nextId(emps) };
    save(KEYS.EMPLOYEES, [...emps, newE]);
    return ok(newE);
  }

  if (path.startsWith('/api/employees/') && method === 'PUT') {
    const id = Number(path.split('/').pop());
    const emps = load<any[]>(KEYS.EMPLOYEES, []);
    const idx = emps.findIndex(e => e.id === id);
    if (idx === -1) return err('Employee not found', 404);
    emps[idx] = { ...emps[idx], ...body, id };
    save(KEYS.EMPLOYEES, emps);
    return ok(emps[idx]);
  }

  if (path.startsWith('/api/employees/') && method === 'DELETE') {
    const id = Number(path.split('/').pop());
    const emps = load<any[]>(KEYS.EMPLOYEES, []);
    save(KEYS.EMPLOYEES, emps.filter(e => e.id !== id));
    return ok({ success: true });
  }

  // ── Bill number ──
  if (path === '/api/bills/next-number' && method === 'GET') {
    const bills = load<any[]>(KEYS.BILLS, []);
    const todayStr = new Date().toISOString().split('T')[0];
    const todayBills = bills.filter(b => (b.date || '').startsWith(todayStr));
    const maxNum = todayBills.length > 0 ? Math.max(...todayBills.map(b => b.bill_number || 0)) : 0;
    return ok({ nextBillNumber: maxNum + 1 });
  }

  // ── Save bill ──
  if (path === '/api/bills' && method === 'POST') {
    const bills = load<any[]>(KEYS.BILLS, []);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const todayBills = bills.filter(b => (b.date || '').startsWith(todayStr));
    const maxNum = todayBills.length > 0 ? Math.max(...todayBills.map(b => b.bill_number || 0)) : 0;
    const billNum = body.bill_number || (maxNum + 1);
    const newBill = {
      id: nextId(bills),
      bill_number: billNum,
      date: todayStr,
      time: now.toLocaleTimeString(),
      subtotal: body.subtotal,
      discount: body.discount,
      tax: body.tax,
      grand_total: body.grand_total,
      payment_method: body.payment_method,
      cashier_name: body.cashier_name,
      items: body.items || [],
    };
    save(KEYS.BILLS, [...bills, newBill]);
    return ok(newBill);
  }

  // ── Bills list (history) ──
  if (path.startsWith('/api/bills') && method === 'GET') {
    const bills = load<any[]>(KEYS.BILLS, []);
    // Handle ?period= filter for analytics
    const urlParams = new URLSearchParams(path.split('?')[1] || '');
    const period = urlParams.get('period');
    const todayStr = new Date().toISOString().split('T')[0];
    let filtered = bills;
    if (period === 'today') {
      filtered = bills.filter(b => (b.date || '').startsWith(todayStr));
    } else if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = bills.filter(b => new Date(b.date) >= weekAgo);
    }
    return ok(filtered.reverse()); // newest first
  }

  // ── Bill items ──
  if (path.match(/\/api\/bills\/\d+\/items/) && method === 'GET') {
    const billId = Number(path.split('/')[3]);
    const bills = load<any[]>(KEYS.BILLS, []);
    const bill = bills.find(b => b.id === billId);
    return ok(bill?.items || []);
  }

    // ── Cancel bill via Credit Note (Rule 65 & CGST Act) ──
  if (path.match(/\/api\/bills\/\d+\/cancel/) && method === 'POST') {
    const billId = Number(path.split('/')[3]);
    const bills = load<any[]>(KEYS.BILLS, []);
    const idx = bills.findIndex(b => b.id === billId);
    if (idx !== -1) {
      bills[idx].status = 'Cancelled';
      bills[idx].cancel_reason = body?.reason || 'Cancelled via credit note';
      bills[idx].cancelled_at = new Date().toISOString();
      save(KEYS.BILLS, bills);
      return ok({ success: true, message: 'Bill cancelled under statutory credit note.', bill: bills[idx] });
    }
    return err('Bill not found', 404);
  }

  // ── Block hard delete ──
  if (path.match(/\/api\/bills\/\d+/) && method === 'DELETE') {
    return err('Statutory Violation: Invoices cannot be deleted under Rule 65 of D&C Rules and Section 36 of CGST Act. Use Credit Note cancellation.', 405);
  }

  // ── Reports ──
  if (path.startsWith('/api/reports/') && method === 'GET') {
    const bills = load<any[]>(KEYS.BILLS, []);
    const urlParams = new URLSearchParams(path.split('?')[1] || '');
    const type = path.split('/api/reports/')[1]?.split('?')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    let filtered = bills;
    if (type === 'daily') {
      const date = urlParams.get('date') || todayStr;
      filtered = bills.filter(b => b.date === date);
    } else if (type === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = bills.filter(b => new Date(b.date) >= weekAgo);
    } else if (type === 'yearly') {
      const year = Number(urlParams.get('year')) || new Date().getFullYear();
      filtered = bills.filter(b => new Date(b.date).getFullYear() === year);
    }

    const totalRevenue = filtered.reduce((s, b) => s + (b.grand_total || 0), 0);
    const totalTax = filtered.reduce((s, b) => s + (b.tax || 0), 0);
    const totalBills = filtered.length;

    // Top products from items
    const itemMap: Record<string, { name: string; qty: number; revenue: number }> = {};
    filtered.forEach(b => {
      (b.items || []).forEach((it: any) => {
        if (!itemMap[it.product_name]) itemMap[it.product_name] = { name: it.product_name, qty: 0, revenue: 0 };
        itemMap[it.product_name].qty += it.quantity || 0;
        itemMap[it.product_name].revenue += it.total || 0;
      });
    });
    const topProducts = Object.values(itemMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Daily breakdown for charts
    const dailyMap: Record<string, { date: string; revenue: number; bills: number }> = {};
    filtered.forEach(b => {
      const d = b.date || todayStr;
      if (!dailyMap[d]) dailyMap[d] = { date: d, revenue: 0, bills: 0 };
      dailyMap[d].revenue += b.grand_total || 0;
      dailyMap[d].bills++;
    });
    const dailyBreakdown = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    return ok({
      totalRevenue,
      totalTax,
      totalBills,
      topProducts,
      dailyBreakdown,
      bills: filtered
    });
  }

  // ── Deleted items audit (fire-and-forget on mobile) ──
  if (path === '/api/deleted-items' && method === 'POST') {
    const deleted = load<any[]>(KEYS.DELETED, []);
    save(KEYS.DELETED, [...deleted, { ...body, timestamp: new Date().toISOString() }]);
    return ok({ success: true });
  }

  // ── Network print (no-op on mobile — handled by Bluetooth only) ──
  if (path === '/api/print/network' && method === 'POST') {
    return err('Direct WiFi TCP printing is not supported on mobile. Use Bluetooth printing instead.', 400);
  }

  // ── Parse Excel / CSV spreadsheet offline ──
  if (path === '/api/products/parse-excel' && method === 'POST') {
    try {
      const text = body.csvText || '';
      const medicines = parseOfflineCsv(text);
      return ok({
        success: true,
        count: medicines.length,
        filename: body.filename || 'uploaded_medicines.csv',
        medicines
      });
    } catch (e: any) {
      return err("Unable to parse file: " + e.message, 400);
    }
  }

  // ── Batch products import offline ──
  if (path === '/api/products/batch' && method === 'POST') {
    const list = body.products || [];
    const updateExisting = !!body.updateExisting;
    const current = load<any[]>(KEYS.PRODUCTS, []);
    let maxId = current.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0);
    let added = 0;
    let updated = 0;

    list.forEach((item: any) => {
      if (!item.name) return;
      const key = (item.name || '').trim().toLowerCase();
      const idx = current.findIndex(p => (p.name || '').trim().toLowerCase() === key);
      if (idx !== -1) {
        if (updateExisting) {
          current[idx] = {
            ...current[idx],
            category: item.category || current[idx].category,
            price: Number(item.price) || current[idx].price,
            tax_percent: item.tax_percent !== undefined ? Number(item.tax_percent) : current[idx].tax_percent,
            quantity_type: item.quantity_type || current[idx].quantity_type,
            barcode: item.barcode || current[idx].barcode,
            sku: item.sku || current[idx].sku
          };
          updated++;
        } else {
          maxId++;
          current.push({ ...item, id: maxId, name: `${item.name} (${maxId})` });
          added++;
        }
      } else {
        maxId++;
        current.push({ ...item, id: maxId });
        added++;
      }
    });

    save(KEYS.PRODUCTS, current);
    return ok({ success: true, added, updated, totalProcessed: list.length });
  }

  // ── Wipe all data from this device (uninstall/reset) ──
  if (path === '/api/system/wipe-all-data' && method === 'POST') {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    localStorage.removeItem('bakers_pos_last_bill_num');
    localStorage.removeItem('bakers_pos_bill_date');
    localStorage.removeItem('bakers_pos_sessions');
    localStorage.removeItem('bakers_pos_active_session');
    localStorage.removeItem('bakery_pos_details');
    ensureDefaultProducts();
    ensureDefaultUsers();
    return ok({ success: true, message: 'All local data has been wiped from this device.' });
  }

  // Catch-all
  console.warn('[offlineApi] Unhandled offline route:', method, path);
  return err(`Offline: route not implemented: ${method} ${path}`, 501);
}

// ─── Seed on import ───────────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  ensureDefaultProducts();
  ensureDefaultUsers();
}

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

// ─── Default Ortho Medicine Catalogue ────────────────────────────────────────
const DEFAULT_PRODUCTS = [
  { id: 1, name: 'Diclofenac 50mg Tablets (10s)', category: 'Pain Relief', price: 28.50, tax_percent: 5, status: 'Available', barcode: null, sku: 'DICLO50', quantity_type: 'strip' },
  { id: 2, name: 'Diclofenac 75mg SR Tablets (10s)', category: 'Pain Relief', price: 42.00, tax_percent: 5, status: 'Available', barcode: null, sku: 'DICLO75', quantity_type: 'strip' },
  { id: 3, name: 'Paracetamol 500mg Tablets (10s)', category: 'Pain Relief', price: 18.00, tax_percent: 5, status: 'Available', barcode: null, sku: 'PARA500', quantity_type: 'strip' },
  { id: 4, name: 'Paracetamol 650mg Tablets (10s)', category: 'Pain Relief', price: 22.00, tax_percent: 5, status: 'Available', barcode: null, sku: 'PARA650', quantity_type: 'strip' },
  { id: 5, name: 'Ibuprofen 400mg Tablets (10s)', category: 'Pain Relief', price: 24.00, tax_percent: 5, status: 'Available', barcode: null, sku: 'IBU400', quantity_type: 'strip' },
  { id: 6, name: 'Aceclofenac 100mg Tablets (10s)', category: 'Pain Relief', price: 35.00, tax_percent: 5, status: 'Available', barcode: null, sku: 'ACE100', quantity_type: 'strip' },
  { id: 7, name: 'Aceclofenac + Paracetamol Tablets (10s)', category: 'Pain Relief', price: 45.00, tax_percent: 5, status: 'Available', barcode: null, sku: 'ACEPARA', quantity_type: 'strip' },
  { id: 8, name: 'Tramadol 50mg Capsules (10s)', category: 'Pain Relief', price: 55.00, tax_percent: 12, status: 'Available', barcode: null, sku: 'TRAM50', quantity_type: 'strip' },
  { id: 9, name: 'Etoricoxib 60mg Tablets (10s)', category: 'Pain Relief', price: 98.00, tax_percent: 12, status: 'Available', barcode: null, sku: 'ETORI60', quantity_type: 'strip' },
  { id: 10, name: 'Etoricoxib 90mg Tablets (10s)', category: 'Pain Relief', price: 125.00, tax_percent: 12, status: 'Available', barcode: null, sku: 'ETORI90', quantity_type: 'strip' },
  { id: 11, name: 'Celecoxib 200mg Capsules (10s)', category: 'Pain Relief', price: 110.00, tax_percent: 12, status: 'Available', barcode: null, sku: 'CELE200', quantity_type: 'strip' },
  { id: 12, name: 'Calcium + Vitamin D3 Tablets (30s)', category: 'Bone Health', price: 145.00, tax_percent: 12, status: 'Available', barcode: null, sku: 'CALVD3', quantity_type: 'pack' },
  { id: 13, name: 'Calcium Carbonate 500mg (60s)', category: 'Bone Health', price: 98.00, tax_percent: 12, status: 'Available', barcode: null, sku: 'CALC500', quantity_type: 'pack' },
  { id: 14, name: 'Vitamin D3 60000 IU Sachet (4s)', category: 'Bone Health', price: 85.00, tax_percent: 12, status: 'Available', barcode: null, sku: 'VITD60K', quantity_type: 'pack' },
  { id: 15, name: 'Vitamin D3 1000 IU Tablets (30s)', category: 'Bone Health', price: 60.00, tax_percent: 12, status: 'Available', barcode: null, sku: 'VITD1K', quantity_type: 'pack' },
  { id: 16, name: 'Alfacalcidol 0.25mcg Capsules (10s)', category: 'Bone Health', price: 72.00, tax_percent: 12, status: 'Available', barcode: null, sku: 'ALFA25', quantity_type: 'strip' },
  { id: 17, name: 'Alendronate 70mg Tablets (4s)', category: 'Bone Health', price: 95.00, tax_percent: 12, status: 'Available', barcode: null, sku: 'ALEN70', quantity_type: 'strip' },
  { id: 18, name: 'Risedronate 35mg Tablets (4s)', category: 'Bone Health', price: 110.00, tax_percent: 12, status: 'Available', barcode: null, sku: 'RISE35', quantity_type: 'strip' },
  { id: 19, name: 'Strontium Ranelate 2g Sachet (28s)', category: 'Bone Health', price: 380.00, tax_percent: 12, status: 'Available', barcode: null, sku: 'STRONT2', quantity_type: 'pack' },
  { id: 20, name: 'Glucosamine 500mg + Chondroitin (30s)', category: 'Joint Supplements', price: 220.00, tax_percent: 18, status: 'Available', barcode: null, sku: 'GLUCO', quantity_type: 'pack' },
  { id: 21, name: 'Glucosamine 750mg Tablets (30s)', category: 'Joint Supplements', price: 180.00, tax_percent: 18, status: 'Available', barcode: null, sku: 'GLUCO750', quantity_type: 'pack' },
  { id: 22, name: 'Diacerhein 50mg Capsules (10s)', category: 'Joint Supplements', price: 135.00, tax_percent: 12, status: 'Available', barcode: null, sku: 'DIACER50', quantity_type: 'strip' },
  { id: 23, name: 'Collagen Peptides 10g Sachet (15s)', category: 'Joint Supplements', price: 450.00, tax_percent: 18, status: 'Available', barcode: null, sku: 'COLL10', quantity_type: 'pack' },
  { id: 24, name: 'Methylcobalamin 500mcg Tablets (10s)', category: 'Nerve Care', price: 38.00, tax_percent: 12, status: 'Available', barcode: null, sku: 'MCOBAL', quantity_type: 'strip' },
  { id: 25, name: 'Methylcobalamin 1500mcg Injection (1s)', category: 'Nerve Care', price: 65.00, tax_percent: 12, status: 'Available', barcode: null, sku: 'MCOBAL1500', quantity_type: 'pcs' },
  { id: 26, name: 'Pregabalin 75mg Capsules (10s)', category: 'Nerve Care', price: 88.00, tax_percent: 12, status: 'Available', barcode: null, sku: 'PREG75', quantity_type: 'strip' },
  { id: 27, name: 'Pregabalin 150mg Capsules (10s)', category: 'Nerve Care', price: 125.00, tax_percent: 12, status: 'Available', barcode: null, sku: 'PREG150', quantity_type: 'strip' },
  { id: 28, name: 'Gabapentin 300mg Capsules (10s)', category: 'Nerve Care', price: 78.00, tax_percent: 12, status: 'Available', barcode: null, sku: 'GABA300', quantity_type: 'strip' },
  { id: 29, name: 'Muscle Relaxant Thiocolchicoside 4mg (10s)', category: 'Muscle Relaxants', price: 82.00, tax_percent: 12, status: 'Available', barcode: null, sku: 'THIOCOL4', quantity_type: 'strip' },
  { id: 30, name: 'Muscle Relaxant Thiocolchicoside 8mg (10s)', category: 'Muscle Relaxants', price: 115.00, tax_percent: 12, status: 'Available', barcode: null, sku: 'THIOCOL8', quantity_type: 'strip' },
  { id: 31, name: 'Baclofen 10mg Tablets (10s)', category: 'Muscle Relaxants', price: 45.00, tax_percent: 12, status: 'Available', barcode: null, sku: 'BACL10', quantity_type: 'strip' },
  { id: 32, name: 'Chlorzoxazone 250mg Tablets (10s)', category: 'Muscle Relaxants', price: 30.00, tax_percent: 12, status: 'Available', barcode: null, sku: 'CHLOR250', quantity_type: 'strip' },
  { id: 33, name: 'Crepe Bandage 6cm x 4m (1s)', category: 'Bandages & Supports', price: 35.00, tax_percent: 5, status: 'Available', barcode: null, sku: 'CREP6', quantity_type: 'pcs' },
  { id: 34, name: 'Crepe Bandage 8cm x 4m (1s)', category: 'Bandages & Supports', price: 42.00, tax_percent: 5, status: 'Available', barcode: null, sku: 'CREP8', quantity_type: 'pcs' },
  { id: 35, name: 'Crepe Bandage 10cm x 4m (1s)', category: 'Bandages & Supports', price: 50.00, tax_percent: 5, status: 'Available', barcode: null, sku: 'CREP10', quantity_type: 'pcs' },
  { id: 36, name: 'Knee Cap (Medium)', category: 'Bandages & Supports', price: 180.00, tax_percent: 5, status: 'Available', barcode: null, sku: 'KNEEM', quantity_type: 'pcs' },
  { id: 37, name: 'Knee Cap (Large)', category: 'Bandages & Supports', price: 195.00, tax_percent: 5, status: 'Available', barcode: null, sku: 'KNEEL', quantity_type: 'pcs' },
  { id: 38, name: 'Elbow Support (Medium)', category: 'Bandages & Supports', price: 150.00, tax_percent: 5, status: 'Available', barcode: null, sku: 'ELBM', quantity_type: 'pcs' },
  { id: 39, name: 'Wrist Brace Support (Medium)', category: 'Bandages & Supports', price: 160.00, tax_percent: 5, status: 'Available', barcode: null, sku: 'WRISTM', quantity_type: 'pcs' },
  { id: 40, name: 'Ankle Brace Support (Medium)', category: 'Bandages & Supports', price: 175.00, tax_percent: 5, status: 'Available', barcode: null, sku: 'ANKLEM', quantity_type: 'pcs' },
  { id: 41, name: 'Lumbar Belt (Medium)', category: 'Bandages & Supports', price: 380.00, tax_percent: 5, status: 'Available', barcode: null, sku: 'LUMB_M', quantity_type: 'pcs' },
  { id: 42, name: 'Lumbar Belt (Large)', category: 'Bandages & Supports', price: 420.00, tax_percent: 5, status: 'Available', barcode: null, sku: 'LUMB_L', quantity_type: 'pcs' },
  { id: 43, name: 'Cervical Collar (Soft)', category: 'Bandages & Supports', price: 250.00, tax_percent: 5, status: 'Available', barcode: null, sku: 'CERVS', quantity_type: 'pcs' },
  { id: 44, name: 'Cervical Collar (Hard)', category: 'Bandages & Supports', price: 380.00, tax_percent: 5, status: 'Available', barcode: null, sku: 'CERVH', quantity_type: 'pcs' },
  { id: 45, name: 'Diclofenac Gel 30g', category: 'Topical', price: 65.00, tax_percent: 12, status: 'Available', barcode: null, sku: 'DICLGEL30', quantity_type: 'pcs' },
  { id: 46, name: 'Diclofenac Gel 50g', category: 'Topical', price: 95.00, tax_percent: 12, status: 'Available', barcode: null, sku: 'DICLGEL50', quantity_type: 'pcs' },
  { id: 47, name: 'Volini Spray 100g', category: 'Topical', price: 185.00, tax_percent: 12, status: 'Available', barcode: null, sku: 'VOLINI', quantity_type: 'pcs' },
  { id: 48, name: 'Moov Cream 50g', category: 'Topical', price: 98.00, tax_percent: 12, status: 'Available', barcode: null, sku: 'MOOV50', quantity_type: 'pcs' },
  { id: 49, name: 'Ibuprofen Gel 50g', category: 'Topical', price: 75.00, tax_percent: 12, status: 'Available', barcode: null, sku: 'IBUGEL50', quantity_type: 'pcs' },
  { id: 50, name: 'Methyl Salicylate Ointment 50g', category: 'Topical', price: 55.00, tax_percent: 12, status: 'Available', barcode: null, sku: 'METHSAL50', quantity_type: 'pcs' },
  { id: 51, name: 'Crutches (Axillary) - Pair', category: 'Ortho Aids', price: 650.00, tax_percent: 5, status: 'Available', barcode: null, sku: 'CRUTCH', quantity_type: 'pcs' },
  { id: 52, name: 'Walking Stick (Folding)', category: 'Ortho Aids', price: 280.00, tax_percent: 5, status: 'Available', barcode: null, sku: 'WALKFOLD', quantity_type: 'pcs' },
  { id: 53, name: 'Walking Frame / Walker', category: 'Ortho Aids', price: 950.00, tax_percent: 5, status: 'Available', barcode: null, sku: 'WALKER', quantity_type: 'pcs' },
  { id: 54, name: 'Hot Water Bag (1.5L)', category: 'Ortho Aids', price: 120.00, tax_percent: 5, status: 'Available', barcode: null, sku: 'HOTWATBAG', quantity_type: 'pcs' },
  { id: 55, name: 'Ice Gel Pack (Reusable)', category: 'Ortho Aids', price: 85.00, tax_percent: 5, status: 'Available', barcode: null, sku: 'ICEGEL', quantity_type: 'pcs' },
  { id: 56, name: 'Omeprazole 20mg Capsules (10s)', category: 'GI Protection', price: 28.00, tax_percent: 12, status: 'Available', barcode: null, sku: 'OMEP20', quantity_type: 'strip' },
  { id: 57, name: 'Pantoprazole 40mg Tablets (10s)', category: 'GI Protection', price: 38.00, tax_percent: 12, status: 'Available', barcode: null, sku: 'PANTO40', quantity_type: 'strip' },
  { id: 58, name: 'Ranitidine 150mg Tablets (10s)', category: 'GI Protection', price: 22.00, tax_percent: 12, status: 'Available', barcode: null, sku: 'RANI150', quantity_type: 'strip' },
  { id: 59, name: 'Zinc + Magnesium Supplement (30s)', category: 'Minerals', price: 165.00, tax_percent: 18, status: 'Available', barcode: null, sku: 'ZINCMAG', quantity_type: 'pack' },
  { id: 60, name: 'Omega-3 Fish Oil 1000mg (30s)', category: 'Joint Supplements', price: 280.00, tax_percent: 18, status: 'Available', barcode: null, sku: 'OMEGA3', quantity_type: 'pack' },
];

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

  // ── Cancel/Delete bill ──
  if (path.match(/\/api\/bills\/\d+/) && method === 'DELETE') {
    const billId = Number(path.split('/')[3]);
    const bills = load<any[]>(KEYS.BILLS, []);
    save(KEYS.BILLS, bills.filter(b => b.id !== billId));
    return ok({ success: true });
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

  // Catch-all
  console.warn('[offlineApi] Unhandled offline route:', method, path);
  return err(`Offline: route not implemented: ${method} ${path}`, 501);
}

// ─── Seed on import ───────────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  ensureDefaultProducts();
  ensureDefaultUsers();
}

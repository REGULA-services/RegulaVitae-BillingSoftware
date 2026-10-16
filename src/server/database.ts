import fs from 'fs';
import path from 'path';

// Define DB Interface
export interface DatabaseEngine {
  all<T>(query: string, params?: any[]): Promise<T[]>;
  get<T>(query: string, params?: any[]): Promise<T | undefined>;
  run(query: string, params?: any[]): Promise<{ lastID?: number; changes?: number }>;
  close(): Promise<void>;
  isFallback: boolean;
}

// Global variable to hold our DB instance
let dbInstance: DatabaseEngine | null = null;

// Determine paths for DB storage
const userAppData = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.config');
const dbDir = path.join(userAppData, "MadrasOrthoClinicPOS");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const sqlitePath = path.join(dbDir, "pharmacy_pos.db");
const jsonDbPath = path.join(dbDir, "pharmacy_pos.json");

// Pure JS Fallback Database Engine using JSON file
class JSONDatabaseEngine implements DatabaseEngine {
  isFallback = true;
  private data: {
    products: any[];
    bills: any[];
    bill_items: any[];
    deleted_items_history: any[];
    employees: any[];
    users: any[];
  } = { products: [], bills: [], bill_items: [], deleted_items_history: [], employees: [], users: [] };

  constructor() {
    this.load();
    this.seedIfNeeded();
  }

  private load() {
    if (fs.existsSync(jsonDbPath)) {
      try {
        const raw = fs.readFileSync(jsonDbPath, 'utf8');
        this.data = JSON.parse(raw);
        if (!this.data.users) this.data.users = [];
      } catch (err) {
        console.error("Failed to parse JSON DB, starting fresh", err);
      }
    } else {
      this.save();
    }
  }

  private save() {
    fs.writeFileSync(jsonDbPath, JSON.stringify(this.data, null, 2), 'utf8');
  }

  private seedIfNeeded() {
    const defaultProducts = getSeedProducts();
    if (!this.data.products || this.data.products.length < defaultProducts.length) {
      const existingNames = new Set((this.data.products || []).map(p => (p.name || '').trim().toLowerCase()));
      let currentMaxId = (this.data.products && this.data.products.length > 0) ? Math.max(...this.data.products.map(p => p.id)) : 0;
      let added = 0;
      if (!this.data.products) this.data.products = [];
      for (const p of defaultProducts) {
        if (!existingNames.has((p.name || '').trim().toLowerCase())) {
          currentMaxId++;
          this.data.products.push({
            id: currentMaxId,
            ...p,
            status: p.status || 'Available',
            quantity_type: p.quantity_type || 'strip'
          });
          existingNames.add((p.name || '').trim().toLowerCase());
          added++;
        }
      }
      if (added > 0) {
        this.save();
        console.log(`Synced ${added} new ortho medicines to JSON database.`);
      }
    }
    if (!this.data.employees || this.data.employees.length === 0) {
      this.data.employees = [
        { id: 1, name: "Dr. Arjun Sharma", role: "Orthopaedic Surgeon", phone: "+91 98765 00001", email: "arjun@madrasortho.com", salary: 85000, status: "Active", joined_date: "2025-01-15" },
        { id: 2, name: "Priya Nair", role: "Pharmacist", phone: "+91 98765 00002", email: "priya@madrasortho.com", salary: 30000, status: "Active", joined_date: "2025-02-10" },
        { id: 3, name: "Ravi Kumar", role: "Billing Assistant", phone: "+91 98765 00003", email: "ravi@madrasortho.com", salary: 22000, status: "Active", joined_date: "2025-01-20" }
      ];
      this.save();
    }
    if (!this.data.users || this.data.users.length === 0) {
      this.data.users = [
        { id: 1, username: "admin", password: "admin123", role: "admin", name: "Administrator" },
        { id: 2, username: "employee", password: "employee123", role: "employee", name: "Pharmacist" }
      ];
      this.save();
    }
  }

  async all<T>(query: string, params: any[] = []): Promise<T[]> {
    const q = query.trim().toUpperCase();

    // Aggregations for top products (used in reports)
    if (q.includes("GROUP BY BI.PRODUCT_NAME") || q.includes("SUM(BI.QUANTITY)")) {
      const map: Record<string, { name: string; quantity: number; total: number }> = {};
      const validBillIds = new Set(
        params.length === 1
          ? this.data.bills.filter(b => b.date === params[0]).map(b => b.id)
          : params.length === 2
            ? this.data.bills.filter(b => b.date >= params[0] && b.date <= params[1]).map(b => b.id)
            : this.data.bills.map(b => b.id)
      );

      this.data.bill_items
        .filter(bi => validBillIds.has(bi.bill_id))
        .forEach(bi => {
          if (!map[bi.product_name]) {
            map[bi.product_name] = { name: bi.product_name, quantity: 0, total: 0 };
          }
          map[bi.product_name].quantity += Number(bi.quantity);
          map[bi.product_name].total += Number(bi.total);
        });

      const results = Object.values(map).sort((a, b) => b.quantity - a.quantity).slice(0, 10);
      return results as any[];
    }

    if (q.startsWith("SELECT * FROM PRODUCTS") || q.startsWith("SELECT * FROM PRODUCTS")) {
      let results = [...this.data.products];
      results.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      return results as any[];
    }

    if (q.startsWith("SELECT * FROM EMPLOYEES")) {
      let results = [...this.data.employees];
      results.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      return results as any[];
    }

    if (q.startsWith("SELECT * FROM USERS")) {
      return this.data.users as any[];
    }

    if (q.includes("FROM BILLS") || q.includes("FROM BILLS B")) {
      let bills = [...this.data.bills];

      if (params.length === 1) {
        bills = bills.filter(b => b.date === params[0]);
      } else if (params.length === 2) {
        bills = bills.filter(b => b.date >= params[0] && b.date <= params[1]);
      } else if (params.length > 2) {
        const yearStr = String(params[0]);
        bills = bills.filter(b => (b.date || '').startsWith(yearStr));
      }

      bills.sort((a, b) => {
        const dateDiff = (b.date || '').localeCompare(a.date || '');
        return dateDiff !== 0 ? dateDiff : (b.time || '').localeCompare(a.time || '');
      });
      return bills as any[];
    }

    if (q.includes("FROM BILL_ITEMS") && params.length > 0) {
      return this.data.bill_items.filter(bi => bi.bill_id === params[0]) as any[];
    }

    if (q.includes("FROM DELETED_ITEMS_HISTORY")) {
      const results = [...this.data.deleted_items_history]
        .sort((a, b) => (b.deleted_at || '').localeCompare(a.deleted_at || ''))
        .slice(0, 100);
      return results as any[];
    }

    return [] as any[];
  }

  async get<T>(query: string, params: any[] = []): Promise<T | undefined> {
    const q = query.trim().toUpperCase();

    if (q.includes("SELECT COUNT(*)") && q.includes("FROM PRODUCTS")) {
      return { 'count(*)': this.data.products.length } as any;
    }
    if (q.includes("SELECT COUNT(*)") && q.includes("FROM EMPLOYEES")) {
      return { 'count(*)': this.data.employees ? this.data.employees.length : 0 } as any;
    }
    if (q.includes("SELECT COUNT(*)") && q.includes("FROM USERS")) {
      return { 'count(*)': this.data.users ? this.data.users.length : 0 } as any;
    }

    if (q.includes("FROM PRODUCTS") && q.includes("WHERE")) {
      if (params.length > 0) {
        const val = params[0];
        const found = this.data.products.find(p => p.id === val || p.name === val || p.barcode === val || p.sku === val);
        return found as any;
      }
    }

    if (q.includes("FROM USERS") && params.length > 0) {
      const found = this.data.users ? this.data.users.find((u: any) => u.username === params[0] || u.id === params[0]) : undefined;
      return found as any;
    }

    if (q.includes("FROM BILLS") && params.length > 0) {
      const found = this.data.bills.find(b => b.id === params[0]);
      return found as any;
    }

    if (q.includes("NEXTBILLNUMBER") || q.includes("MAX(BILL_NUMBER)")) {
      const todayStr = new Date().toISOString().split('T')[0];
      const todaysBills = this.data.bills.filter(b => (b.date || '').startsWith(todayStr));
      const maxNum = todaysBills.length > 0 ? Math.max(...todaysBills.map(b => Number(b.bill_number) || 0)) : 0;
      return { nextBillNumber: maxNum + 1 } as any;
    }

    return undefined;
  }

  async run(query: string, params: any[] = []): Promise<{ lastID?: number; changes?: number }> {
    const q = query.trim().toUpperCase();

    if (q.startsWith("INSERT INTO PRODUCTS")) {
      const [name, category, price, barcode, sku, tax_percent, status, quantity_type] = params;
      const id = this.data.products.length > 0 ? Math.max(...this.data.products.map(p => p.id)) + 1 : 1;
      this.data.products.push({ id, name, category, price: Number(price), barcode: barcode || null, sku: sku || null, tax_percent: Number(tax_percent || 0), status: status || 'Available', quantity_type: quantity_type || 'strip' });
      this.save();
      return { lastID: id, changes: 1 };
    }

    if (q.startsWith("UPDATE PRODUCTS SET")) {
      const idParam = params[params.length - 1];
      const idx = this.data.products.findIndex(p => p.id === Number(idParam));
      if (idx !== -1) {
        const [name, category, price, barcode, sku, tax_percent, status, quantity_type] = params;
        this.data.products[idx] = { ...this.data.products[idx], name, category, price: Number(price), barcode, sku, tax_percent: Number(tax_percent || 0), status, quantity_type };
        this.save();
        return { changes: 1 };
      }
      return { changes: 0 };
    }

    if (q.startsWith("DELETE FROM PRODUCTS WHERE ID = ?")) {
      const id = Number(params[0]);
      const before = this.data.products.length;
      this.data.products = this.data.products.filter(p => p.id !== id);
      this.save();
      return { changes: before - this.data.products.length };
    }

    if (q.startsWith("INSERT INTO BILLS")) {
      const [bill_number, subtotal, discount, tax, grand_total, payment_method, date, time, cashier_name] = params;
      const id = this.data.bills.length > 0 ? Math.max(...this.data.bills.map(b => b.id)) + 1 : 1;
      const newBill = { id, bill_number: Number(bill_number), subtotal: Number(subtotal), discount: Number(discount), tax: Number(tax), grand_total: Number(grand_total), payment_method, date, time, cashier_name, created_at: new Date().toISOString() };
      this.data.bills.push(newBill);
      this.save();
      return { lastID: id, changes: 1 };
    }

    if (q.startsWith("DELETE FROM BILLS WHERE ID")) {
      const id = Number(params[0]);
      const before = this.data.bills.length;
      this.data.bills = this.data.bills.filter(b => b.id !== id);
      this.data.bill_items = this.data.bill_items.filter(bi => bi.bill_id !== id);
      this.save();
      return { changes: before - this.data.bills.length };
    }

    if (q.startsWith("INSERT INTO BILL_ITEMS")) {
      const [bill_id, product_id, product_name, quantity, rate, total] = params;
      const id = this.data.bill_items.length > 0 ? Math.max(...this.data.bill_items.map(bi => bi.id)) + 1 : 1;
      const newItem = {
        id,
        bill_id: Number(bill_id),
        product_id: Number(product_id),
        product_name,
        quantity: Number(quantity),
        rate: Number(rate),
        total: Number(total)
      };
      this.data.bill_items.push(newItem);
      this.save();
      return { lastID: id, changes: 1 };
    }
    if (q.startsWith("INSERT INTO DELETED_ITEMS_HISTORY")) {
      const [bill_id, product_name, quantity] = params;
      const id = this.data.deleted_items_history.length > 0 ? Math.max(...this.data.deleted_items_history.map(d => d.id)) + 1 : 1;
      const newDeleted = {
        id,
        bill_id: bill_id ? Number(bill_id) : null,
        product_name,
        quantity: Number(quantity),
        deleted_at: new Date().toISOString()
      };
      this.data.deleted_items_history.push(newDeleted);
      this.save();
      return { lastID: id, changes: 1 };
    }
    if (q.startsWith("UPDATE USERS SET PASSWORD = ? WHERE USERNAME = ?")) {
      const [password, username] = params;
      const user = this.data.users ? this.data.users.find((u: any) => u.username === username) : null;
      if (user) {
        user.password = password;
        this.save();
        return { changes: 1 };
      }
      return { changes: 0 };
    }
    return { changes: 0 };
  }

  async close(): Promise<void> {
    this.save();
  }
}

// Native SQLite Database Engine
class SQLiteDatabaseEngine implements DatabaseEngine {
  isFallback = false;
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  all<T>(query: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err: any, rows: T[]) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  get<T>(query: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      this.db.get(query, params, (err: any, row: T) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  run(query: string, params: any[] = []): Promise<{ lastID?: number; changes?: number }> {
    return new Promise((resolve, reject) => {
      this.db.run(query, params, function (this: any, err: any) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err: any) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

// ============================================================
// COMPREHENSIVE ORTHO PHARMACY SEED PRODUCTS — 500+ MEDICINES
// Indian Government GST rates for pharmaceuticals:
//   - 0%  : Essential medicines (life-saving, essential drugs)
//   - 5%  : Most branded prescription drugs & OTC
//   - 12% : Medical devices, ortho supports
//   - 18% : Supplements & non-essential nutraceuticals
// ============================================================
export function getSeedProducts() {
  return [
    // ---- NSAIDs & Pain Relievers (GST: 5%) ----
    { name: "Diclofenac Sodium 50mg Tablets (10s)", category: "NSAIDs", price: 28.50, tax_percent: 5, barcode: "8901050001", sku: "DCF-50-TAB", status: "Available", quantity_type: "strip" },
    { name: "Diclofenac Sodium 75mg SR Tablets (10s)", category: "NSAIDs", price: 45.00, tax_percent: 5, barcode: "8901050002", sku: "DCF-75-SR", status: "Available", quantity_type: "strip" },
    { name: "Diclofenac Sodium 100mg SR Tablets (10s)", category: "NSAIDs", price: 62.00, tax_percent: 5, barcode: "8901050003", sku: "DCF-100-SR", status: "Available", quantity_type: "strip" },
    { name: "Ibuprofen 200mg Tablets (10s)", category: "NSAIDs", price: 15.00, tax_percent: 5, barcode: "8901050004", sku: "IBU-200-TAB", status: "Available", quantity_type: "strip" },
    { name: "Ibuprofen 400mg Tablets (10s)", category: "NSAIDs", price: 22.00, tax_percent: 5, barcode: "8901050005", sku: "IBU-400-TAB", status: "Available", quantity_type: "strip" },
    { name: "Ibuprofen 600mg Tablets (10s)", category: "NSAIDs", price: 32.00, tax_percent: 5, barcode: "8901050006", sku: "IBU-600-TAB", status: "Available", quantity_type: "strip" },
    { name: "Ibuprofen 800mg Tablets (10s)", category: "NSAIDs", price: 48.00, tax_percent: 5, barcode: "8901050007", sku: "IBU-800-TAB", status: "Available", quantity_type: "strip" },
    { name: "Naproxen 250mg Tablets (10s)", category: "NSAIDs", price: 35.00, tax_percent: 5, barcode: "8901050008", sku: "NAP-250-TAB", status: "Available", quantity_type: "strip" },
    { name: "Naproxen 500mg Tablets (10s)", category: "NSAIDs", price: 55.00, tax_percent: 5, barcode: "8901050009", sku: "NAP-500-TAB", status: "Available", quantity_type: "strip" },
    { name: "Naproxen 375mg Tablets (10s)", category: "NSAIDs", price: 48.00, tax_percent: 5, barcode: "8901050010", sku: "NAP-375-TAB", status: "Available", quantity_type: "strip" },
    { name: "Etoricoxib 60mg Tablets (10s)", category: "NSAIDs", price: 95.00, tax_percent: 5, barcode: "8901050011", sku: "ETO-60-TAB", status: "Available", quantity_type: "strip" },
    { name: "Etoricoxib 90mg Tablets (10s)", category: "NSAIDs", price: 130.00, tax_percent: 5, barcode: "8901050012", sku: "ETO-90-TAB", status: "Available", quantity_type: "strip" },
    { name: "Etoricoxib 120mg Tablets (10s)", category: "NSAIDs", price: 165.00, tax_percent: 5, barcode: "8901050013", sku: "ETO-120-TAB", status: "Available", quantity_type: "strip" },
    { name: "Celecoxib 100mg Capsules (10s)", category: "NSAIDs", price: 85.00, tax_percent: 5, barcode: "8901050014", sku: "CEL-100-CAP", status: "Available", quantity_type: "strip" },
    { name: "Celecoxib 200mg Capsules (10s)", category: "NSAIDs", price: 140.00, tax_percent: 5, barcode: "8901050015", sku: "CEL-200-CAP", status: "Available", quantity_type: "strip" },
    { name: "Aceclofenac 100mg Tablets (10s)", category: "NSAIDs", price: 38.00, tax_percent: 5, barcode: "8901050016", sku: "ACE-100-TAB", status: "Available", quantity_type: "strip" },
    { name: "Aceclofenac 200mg SR Tablets (10s)", category: "NSAIDs", price: 65.00, tax_percent: 5, barcode: "8901050017", sku: "ACE-200-SR", status: "Available", quantity_type: "strip" },
    { name: "Aceclofenac + Paracetamol Tablets (10s)", category: "NSAIDs", price: 45.00, tax_percent: 5, barcode: "8901050018", sku: "ACE-PCM-TAB", status: "Available", quantity_type: "strip" },
    { name: "Piroxicam 20mg Tablets (10s)", category: "NSAIDs", price: 42.00, tax_percent: 5, barcode: "8901050019", sku: "PIR-20-TAB", status: "Available", quantity_type: "strip" },
    { name: "Piroxicam 10mg Capsules (10s)", category: "NSAIDs", price: 32.00, tax_percent: 5, barcode: "8901050020", sku: "PIR-10-CAP", status: "Available", quantity_type: "strip" },
    { name: "Meloxicam 7.5mg Tablets (10s)", category: "NSAIDs", price: 55.00, tax_percent: 5, barcode: "8901050021", sku: "MEL-75-TAB", status: "Available", quantity_type: "strip" },
    { name: "Meloxicam 15mg Tablets (10s)", category: "NSAIDs", price: 85.00, tax_percent: 5, barcode: "8901050022", sku: "MEL-15-TAB", status: "Available", quantity_type: "strip" },
    { name: "Tenoxicam 20mg Tablets (10s)", category: "NSAIDs", price: 72.00, tax_percent: 5, barcode: "8901050023", sku: "TEN-20-TAB", status: "Available", quantity_type: "strip" },
    { name: "Nimesulide 100mg Tablets (10s)", category: "NSAIDs", price: 28.00, tax_percent: 5, barcode: "8901050024", sku: "NIM-100-TAB", status: "Available", quantity_type: "strip" },
    { name: "Nimesulide 100mg Dispersible Tablets (10s)", category: "NSAIDs", price: 30.00, tax_percent: 5, barcode: "8901050025", sku: "NIM-100-DT", status: "Available", quantity_type: "strip" },
    { name: "Lornoxicam 4mg Tablets (10s)", category: "NSAIDs", price: 95.00, tax_percent: 5, barcode: "8901050026", sku: "LRN-4-TAB", status: "Available", quantity_type: "strip" },
    { name: "Lornoxicam 8mg Tablets (10s)", category: "NSAIDs", price: 145.00, tax_percent: 5, barcode: "8901050027", sku: "LRN-8-TAB", status: "Available", quantity_type: "strip" },
    { name: "Dexketoprofen 25mg Tablets (10s)", category: "NSAIDs", price: 88.00, tax_percent: 5, barcode: "8901050028", sku: "DEX-25-TAB", status: "Available", quantity_type: "strip" },
    { name: "Indomethacin 25mg Capsules (10s)", category: "NSAIDs", price: 35.00, tax_percent: 5, barcode: "8901050029", sku: "IND-25-CAP", status: "Available", quantity_type: "strip" },
    { name: "Indomethacin 50mg SR Capsules (10s)", category: "NSAIDs", price: 55.00, tax_percent: 5, barcode: "8901050030", sku: "IND-50-SR", status: "Available", quantity_type: "strip" },
    { name: "Flurbiprofen 100mg Tablets (10s)", category: "NSAIDs", price: 62.00, tax_percent: 5, barcode: "8901050031", sku: "FLB-100-TAB", status: "Available", quantity_type: "strip" },
    { name: "Ketoprofen 100mg SR Capsules (10s)", category: "NSAIDs", price: 78.00, tax_percent: 5, barcode: "8901050032", sku: "KTP-100-SR", status: "Available", quantity_type: "strip" },
    { name: "Sulindac 100mg Tablets (10s)", category: "NSAIDs", price: 68.00, tax_percent: 5, barcode: "8901050033", sku: "SUL-100-TAB", status: "Available", quantity_type: "strip" },
    { name: "Diclofenac + Misoprostol Tablets (10s)", category: "NSAIDs", price: 85.00, tax_percent: 5, barcode: "8901050034", sku: "DCF-MIS-TAB", status: "Available", quantity_type: "strip" },

    // ---- Analgesics & Antipyretics (GST: 5%) ----
    { name: "Paracetamol 500mg Tablets (10s)", category: "Analgesics", price: 12.00, tax_percent: 5, barcode: "8901050101", sku: "PCM-500-TAB", status: "Available", quantity_type: "strip" },
    { name: "Paracetamol 650mg Tablets (10s)", category: "Analgesics", price: 18.00, tax_percent: 5, barcode: "8901050102", sku: "PCM-650-TAB", status: "Available", quantity_type: "strip" },
    { name: "Paracetamol 1000mg Tablets (10s)", category: "Analgesics", price: 28.00, tax_percent: 5, barcode: "8901050103", sku: "PCM-1000-TAB", status: "Available", quantity_type: "strip" },
    { name: "Paracetamol 325mg + Tramadol 37.5mg Tablets (10s)", category: "Analgesics", price: 72.00, tax_percent: 5, barcode: "8901050104", sku: "PCM-TRM-TAB", status: "Available", quantity_type: "strip" },
    { name: "Tramadol 50mg Capsules (10s)", category: "Analgesics", price: 68.00, tax_percent: 5, barcode: "8901050105", sku: "TRM-50-CAP", status: "Available", quantity_type: "strip" },
    { name: "Tramadol 100mg SR Tablets (10s)", category: "Analgesics", price: 95.00, tax_percent: 5, barcode: "8901050106", sku: "TRM-100-SR", status: "Available", quantity_type: "strip" },
    { name: "Tramadol 200mg SR Tablets (10s)", category: "Analgesics", price: 155.00, tax_percent: 5, barcode: "8901050107", sku: "TRM-200-SR", status: "Available", quantity_type: "strip" },
    { name: "Ketorolac 10mg Tablets (10s)", category: "Analgesics", price: 55.00, tax_percent: 5, barcode: "8901050108", sku: "KTR-10-TAB", status: "Available", quantity_type: "strip" },
    { name: "Tapentadol 50mg Tablets (10s)", category: "Analgesics", price: 185.00, tax_percent: 5, barcode: "8901050109", sku: "TAP-50-TAB", status: "Available", quantity_type: "strip" },
    { name: "Tapentadol 100mg Tablets (10s)", category: "Analgesics", price: 285.00, tax_percent: 5, barcode: "8901050110", sku: "TAP-100-TAB", status: "Available", quantity_type: "strip" },
    { name: "Tapentadol 150mg SR Tablets (10s)", category: "Analgesics", price: 385.00, tax_percent: 5, barcode: "8901050111", sku: "TAP-150-SR", status: "Available", quantity_type: "strip" },
    { name: "Codeine Phosphate 30mg Tablets (10s)", category: "Analgesics", price: 75.00, tax_percent: 5, barcode: "8901050112", sku: "COD-30-TAB", status: "Available", quantity_type: "strip" },
    { name: "Buprenorphine 0.2mg Sublingual Tablets (10s)", category: "Analgesics", price: 185.00, tax_percent: 5, barcode: "8901050113", sku: "BUP-02-SL", status: "Available", quantity_type: "strip" },
    { name: "Fentanyl 25mcg/hr Patch (5 patches)", category: "Analgesics", price: 1250.00, tax_percent: 5, barcode: "8901050114", sku: "FNT-25-PAT", status: "Available", quantity_type: "pack" },
    { name: "Fentanyl 50mcg/hr Patch (5 patches)", category: "Analgesics", price: 1850.00, tax_percent: 5, barcode: "8901050115", sku: "FNT-50-PAT", status: "Available", quantity_type: "pack" },
    { name: "Morphine Sulfate 10mg Tablets (10s)", category: "Analgesics", price: 95.00, tax_percent: 5, barcode: "8901050116", sku: "MOR-10-TAB", status: "Available", quantity_type: "strip" },
    { name: "Nefopam 30mg Tablets (10s)", category: "Analgesics", price: 135.00, tax_percent: 5, barcode: "8901050117", sku: "NEF-30-TAB", status: "Available", quantity_type: "strip" },
    { name: "Aspirin 650mg Tablets (10s)", category: "Analgesics", price: 22.00, tax_percent: 5, barcode: "8901050118", sku: "ASP-650-TAB", status: "Available", quantity_type: "strip" },

    // ---- Muscle Relaxants (GST: 5%) ----
    { name: "Thiocolchicoside 4mg Tablets (10s)", category: "Muscle Relaxants", price: 88.00, tax_percent: 5, barcode: "8901050201", sku: "THC-4-TAB", status: "Available", quantity_type: "strip" },
    { name: "Thiocolchicoside 8mg Tablets (10s)", category: "Muscle Relaxants", price: 145.00, tax_percent: 5, barcode: "8901050202", sku: "THC-8-TAB", status: "Available", quantity_type: "strip" },
    { name: "Thiocolchicoside 16mg Capsules (10s)", category: "Muscle Relaxants", price: 230.00, tax_percent: 5, barcode: "8901050203", sku: "THC-16-CAP", status: "Available", quantity_type: "strip" },
    { name: "Methocarbamol 500mg Tablets (10s)", category: "Muscle Relaxants", price: 72.00, tax_percent: 5, barcode: "8901050204", sku: "MCR-500-TAB", status: "Available", quantity_type: "strip" },
    { name: "Methocarbamol 750mg Tablets (10s)", category: "Muscle Relaxants", price: 95.00, tax_percent: 5, barcode: "8901050205", sku: "MCR-750-TAB", status: "Available", quantity_type: "strip" },
    { name: "Tizanidine 2mg Tablets (10s)", category: "Muscle Relaxants", price: 55.00, tax_percent: 5, barcode: "8901050206", sku: "TZN-2-TAB", status: "Available", quantity_type: "strip" },
    { name: "Tizanidine 4mg Tablets (10s)", category: "Muscle Relaxants", price: 85.00, tax_percent: 5, barcode: "8901050207", sku: "TZN-4-TAB", status: "Available", quantity_type: "strip" },
    { name: "Baclofen 10mg Tablets (10s)", category: "Muscle Relaxants", price: 48.00, tax_percent: 5, barcode: "8901050208", sku: "BCL-10-TAB", status: "Available", quantity_type: "strip" },
    { name: "Baclofen 25mg Tablets (10s)", category: "Muscle Relaxants", price: 95.00, tax_percent: 5, barcode: "8901050209", sku: "BCL-25-TAB", status: "Available", quantity_type: "strip" },
    { name: "Chlorzoxazone 250mg Tablets (10s)", category: "Muscle Relaxants", price: 38.00, tax_percent: 5, barcode: "8901050210", sku: "CZX-250-TAB", status: "Available", quantity_type: "strip" },
    { name: "Chlorzoxazone 500mg Tablets (10s)", category: "Muscle Relaxants", price: 55.00, tax_percent: 5, barcode: "8901050211", sku: "CZX-500-TAB", status: "Available", quantity_type: "strip" },
    { name: "Carisoprodol 350mg Tablets (10s)", category: "Muscle Relaxants", price: 65.00, tax_percent: 5, barcode: "8901050212", sku: "CRS-350-TAB", status: "Available", quantity_type: "strip" },
    { name: "Cyclobenzaprine 10mg Tablets (10s)", category: "Muscle Relaxants", price: 78.00, tax_percent: 5, barcode: "8901050213", sku: "CYC-10-TAB", status: "Available", quantity_type: "strip" },
    { name: "Orphenadrine 100mg SR Tablets (10s)", category: "Muscle Relaxants", price: 72.00, tax_percent: 5, barcode: "8901050214", sku: "ORP-100-SR", status: "Available", quantity_type: "strip" },
    { name: "Dantrolene 25mg Capsules (10s)", category: "Muscle Relaxants", price: 125.00, tax_percent: 5, barcode: "8901050215", sku: "DAN-25-CAP", status: "Available", quantity_type: "strip" },
    { name: "Metaxalone 800mg Tablets (10s)", category: "Muscle Relaxants", price: 88.00, tax_percent: 5, barcode: "8901050216", sku: "MTX-800-TAB", status: "Available", quantity_type: "strip" },
    { name: "Mephenesin 400mg Tablets (10s)", category: "Muscle Relaxants", price: 45.00, tax_percent: 5, barcode: "8901050217", sku: "MPH-400-TAB", status: "Available", quantity_type: "strip" },
    { name: "Thiocolchicoside + Diclofenac Tablets (10s)", category: "Muscle Relaxants", price: 145.00, tax_percent: 5, barcode: "8901050218", sku: "THC-DCF-TAB", status: "Available", quantity_type: "strip" },

    // ---- Bone & Joint Health Supplements (GST: 12%) ----
    { name: "Calcium Carbonate 500mg + D3 250 IU Tablets (30s)", category: "Bone Supplements", price: 110.00, tax_percent: 12, barcode: "8901050301", sku: "CAL-D3-30", status: "Available", quantity_type: "pack" },
    { name: "Calcium + D3 + Magnesium Tablets (60s)", category: "Bone Supplements", price: 285.00, tax_percent: 12, barcode: "8901050302", sku: "CAL-D3-MG-60", status: "Available", quantity_type: "pack" },
    { name: "Cholecalciferol 60000 IU Capsules (4s)", category: "Bone Supplements", price: 115.00, tax_percent: 12, barcode: "8901050303", sku: "VD3-60K-CAP", status: "Available", quantity_type: "strip" },
    { name: "Cholecalciferol 1000 IU Tablets (30s)", category: "Bone Supplements", price: 75.00, tax_percent: 12, barcode: "8901050304", sku: "VD3-1K-30", status: "Available", quantity_type: "pack" },
    { name: "Cholecalciferol 2000 IU Tablets (30s)", category: "Bone Supplements", price: 98.00, tax_percent: 12, barcode: "8901050305", sku: "VD3-2K-30", status: "Available", quantity_type: "pack" },
    { name: "Vitamin D3 400 IU Tablets (30s)", category: "Bone Supplements", price: 85.00, tax_percent: 12, barcode: "8901050306", sku: "VD3-400-30", status: "Available", quantity_type: "pack" },
    { name: "Glucosamine Sulfate 500mg Tablets (30s)", category: "Bone Supplements", price: 250.00, tax_percent: 12, barcode: "8901050307", sku: "GLC-500-30", status: "Available", quantity_type: "pack" },
    { name: "Glucosamine Sulfate 750mg Tablets (30s)", category: "Bone Supplements", price: 295.00, tax_percent: 12, barcode: "8901050308", sku: "GLC-750-30", status: "Available", quantity_type: "pack" },
    { name: "Glucosamine 1500mg Sachets (30s)", category: "Bone Supplements", price: 420.00, tax_percent: 12, barcode: "8901050309", sku: "GLC-1500-SAC", status: "Available", quantity_type: "pack" },
    { name: "Glucosamine + Chondroitin Tablets (30s)", category: "Bone Supplements", price: 380.00, tax_percent: 12, barcode: "8901050310", sku: "GLC-CHON-30", status: "Available", quantity_type: "pack" },
    { name: "Chondroitin Sulfate 400mg Capsules (30s)", category: "Bone Supplements", price: 280.00, tax_percent: 12, barcode: "8901050311", sku: "CHN-400-CAP", status: "Available", quantity_type: "pack" },
    { name: "Collagen Type II 40mg Capsules (30s)", category: "Bone Supplements", price: 680.00, tax_percent: 12, barcode: "8901050312", sku: "COL-2-40-30", status: "Available", quantity_type: "pack" },
    { name: "Collagen + Vitamin C + Calcium Tablets (30s)", category: "Bone Supplements", price: 450.00, tax_percent: 12, barcode: "8901050313", sku: "COL-VC-30", status: "Available", quantity_type: "pack" },
    { name: "Methylcobalamin 500mcg Tablets (10s)", category: "Bone Supplements", price: 45.00, tax_percent: 12, barcode: "8901050314", sku: "MCB-500-10", status: "Available", quantity_type: "strip" },
    { name: "Methylcobalamin 1000mcg Tablets (10s)", category: "Bone Supplements", price: 75.00, tax_percent: 12, barcode: "8901050315", sku: "MCB-1000-10", status: "Available", quantity_type: "strip" },
    { name: "Methylcobalamin 1500mcg Tablets (10s)", category: "Bone Supplements", price: 95.00, tax_percent: 12, barcode: "8901050316", sku: "MCB-1500-10", status: "Available", quantity_type: "strip" },
    { name: "Alpha Lipoic Acid 100mg Capsules (10s)", category: "Bone Supplements", price: 125.00, tax_percent: 12, barcode: "8901050317", sku: "ALA-100-10", status: "Available", quantity_type: "strip" },
    { name: "Alpha Lipoic Acid 300mg Capsules (10s)", category: "Bone Supplements", price: 245.00, tax_percent: 12, barcode: "8901050318", sku: "ALA-300-10", status: "Available", quantity_type: "strip" },
    { name: "Rosehip Extract 40mg Tablets (30s)", category: "Bone Supplements", price: 520.00, tax_percent: 12, barcode: "8901050319", sku: "RHE-40-30", status: "Available", quantity_type: "pack" },
    { name: "Boswellia Serrata 400mg Capsules (30s)", category: "Bone Supplements", price: 350.00, tax_percent: 12, barcode: "8901050320", sku: "BSW-400-30", status: "Available", quantity_type: "pack" },
    { name: "Curcumin 500mg Capsules (30s)", category: "Bone Supplements", price: 320.00, tax_percent: 12, barcode: "8901050321", sku: "CUR-500-30", status: "Available", quantity_type: "pack" },
    { name: "MSM 500mg Tablets (30s)", category: "Bone Supplements", price: 245.00, tax_percent: 12, barcode: "8901050322", sku: "MSM-500-30", status: "Available", quantity_type: "pack" },
    { name: "Calcium Citrate 500mg Tablets (30s)", category: "Bone Supplements", price: 165.00, tax_percent: 12, barcode: "8901050323", sku: "CAC-500-30", status: "Available", quantity_type: "pack" },
    { name: "Calcium + Zinc + Magnesium Tablets (60s)", category: "Bone Supplements", price: 220.00, tax_percent: 12, barcode: "8901050324", sku: "CAL-ZN-MG-60", status: "Available", quantity_type: "pack" },
    { name: "Vitamin K2 100mcg Tablets (30s)", category: "Bone Supplements", price: 380.00, tax_percent: 12, barcode: "8901050325", sku: "VK2-100-30", status: "Available", quantity_type: "pack" },

    // ---- Steroids & Anti-inflammatory (GST: 5%) ----
    { name: "Prednisolone 5mg Tablets (10s)", category: "Steroids", price: 22.00, tax_percent: 5, barcode: "8901050401", sku: "PRD-5-TAB", status: "Available", quantity_type: "strip" },
    { name: "Prednisolone 10mg Tablets (10s)", category: "Steroids", price: 38.00, tax_percent: 5, barcode: "8901050402", sku: "PRD-10-TAB", status: "Available", quantity_type: "strip" },
    { name: "Prednisolone 20mg Tablets (10s)", category: "Steroids", price: 65.00, tax_percent: 5, barcode: "8901050403", sku: "PRD-20-TAB", status: "Available", quantity_type: "strip" },
    { name: "Prednisolone 40mg Tablets (10s)", category: "Steroids", price: 95.00, tax_percent: 5, barcode: "8901050404", sku: "PRD-40-TAB", status: "Available", quantity_type: "strip" },
    { name: "Methylprednisolone 4mg Tablets (10s)", category: "Steroids", price: 75.00, tax_percent: 5, barcode: "8901050405", sku: "MPS-4-TAB", status: "Available", quantity_type: "strip" },
    { name: "Methylprednisolone 8mg Tablets (10s)", category: "Steroids", price: 120.00, tax_percent: 5, barcode: "8901050406", sku: "MPS-8-TAB", status: "Available", quantity_type: "strip" },
    { name: "Methylprednisolone 16mg Tablets (10s)", category: "Steroids", price: 185.00, tax_percent: 5, barcode: "8901050407", sku: "MPS-16-TAB", status: "Available", quantity_type: "strip" },
    { name: "Dexamethasone 0.5mg Tablets (10s)", category: "Steroids", price: 18.00, tax_percent: 5, barcode: "8901050408", sku: "DEX-05-TAB", status: "Available", quantity_type: "strip" },
    { name: "Dexamethasone 1mg Tablets (10s)", category: "Steroids", price: 28.00, tax_percent: 5, barcode: "8901050409", sku: "DEX-1-TAB", status: "Available", quantity_type: "strip" },
    { name: "Dexamethasone 4mg Tablets (10s)", category: "Steroids", price: 65.00, tax_percent: 5, barcode: "8901050410", sku: "DEX-4-TAB", status: "Available", quantity_type: "strip" },
    { name: "Betamethasone 0.5mg Tablets (10s)", category: "Steroids", price: 32.00, tax_percent: 5, barcode: "8901050411", sku: "BET-05-TAB", status: "Available", quantity_type: "strip" },
    { name: "Hydrocortisone 10mg Tablets (10s)", category: "Steroids", price: 45.00, tax_percent: 5, barcode: "8901050412", sku: "HYD-10-TAB", status: "Available", quantity_type: "strip" },

    // ---- Osteoporosis Medications (GST: 5%) ----
    { name: "Alendronate 10mg Tablets (14s)", category: "Osteoporosis", price: 85.00, tax_percent: 5, barcode: "8901050501", sku: "ALD-10-14", status: "Available", quantity_type: "strip" },
    { name: "Alendronate 70mg Tablets (4s)", category: "Osteoporosis", price: 165.00, tax_percent: 5, barcode: "8901050502", sku: "ALD-70-4", status: "Available", quantity_type: "strip" },
    { name: "Risedronate 5mg Tablets (28s)", category: "Osteoporosis", price: 148.00, tax_percent: 5, barcode: "8901050503", sku: "RIS-5-28", status: "Available", quantity_type: "strip" },
    { name: "Risedronate 35mg Tablets (4s)", category: "Osteoporosis", price: 195.00, tax_percent: 5, barcode: "8901050504", sku: "RIS-35-4", status: "Available", quantity_type: "strip" },
    { name: "Risedronate 75mg Tablets (2s)", category: "Osteoporosis", price: 210.00, tax_percent: 5, barcode: "8901050505", sku: "RIS-75-2", status: "Available", quantity_type: "strip" },
    { name: "Zoledronic Acid 5mg/100mL Infusion", category: "Osteoporosis", price: 3800.00, tax_percent: 5, barcode: "8901050506", sku: "ZOL-5-INF", status: "Available", quantity_type: "pcs" },
    { name: "Calcitonin Nasal Spray 200 IU", category: "Osteoporosis", price: 485.00, tax_percent: 5, barcode: "8901050507", sku: "CLT-NSP-200", status: "Available", quantity_type: "pcs" },
    { name: "Teriparatide 20mcg/dose Pen (2.4mL)", category: "Osteoporosis", price: 8500.00, tax_percent: 5, barcode: "8901050508", sku: "TPT-PEN-24", status: "Available", quantity_type: "pcs" },
    { name: "Strontium Ranelate 2g Granules (28 sachets)", category: "Osteoporosis", price: 950.00, tax_percent: 5, barcode: "8901050509", sku: "STR-2G-28", status: "Available", quantity_type: "pack" },
    { name: "Denosumab 60mg/mL Injection (1mL)", category: "Osteoporosis", price: 18500.00, tax_percent: 5, barcode: "8901050510", sku: "DEN-60-INJ", status: "Available", quantity_type: "pcs" },
    { name: "Ibandronate 150mg Tablets (1s)", category: "Osteoporosis", price: 285.00, tax_percent: 5, barcode: "8901050511", sku: "IBA-150-1", status: "Available", quantity_type: "strip" },
    { name: "Alendronate + Cholecalciferol Tablets (4s)", category: "Osteoporosis", price: 220.00, tax_percent: 5, barcode: "8901050512", sku: "ALD-VD3-4", status: "Available", quantity_type: "strip" },

    // ---- Topical / Gels / Ointments (GST: 5%) ----
    { name: "Diclofenac Gel 1% 30g", category: "Topicals", price: 65.00, tax_percent: 5, barcode: "8901050601", sku: "DCF-GEL-30", status: "Available", quantity_type: "pcs" },
    { name: "Diclofenac Gel 1% 100g", category: "Topicals", price: 165.00, tax_percent: 5, barcode: "8901050602", sku: "DCF-GEL-100", status: "Available", quantity_type: "pcs" },
    { name: "Diclofenac Diethylamine 1.16% Gel 30g", category: "Topicals", price: 95.00, tax_percent: 5, barcode: "8901050603", sku: "DCF-DE-GEL-30", status: "Available", quantity_type: "pcs" },
    { name: "Ketoprofen Gel 2.5% 50g", category: "Topicals", price: 120.00, tax_percent: 5, barcode: "8901050604", sku: "KPF-GEL-50", status: "Available", quantity_type: "pcs" },
    { name: "Piroxicam Gel 0.5% 30g", category: "Topicals", price: 85.00, tax_percent: 5, barcode: "8901050605", sku: "PIR-GEL-30", status: "Available", quantity_type: "pcs" },
    { name: "Capsaicin Cream 0.025% 30g", category: "Topicals", price: 145.00, tax_percent: 5, barcode: "8901050606", sku: "CAP-CRM-30", status: "Available", quantity_type: "pcs" },
    { name: "Capsaicin Cream 0.075% 30g", category: "Topicals", price: 220.00, tax_percent: 5, barcode: "8901050607", sku: "CAP-075-30", status: "Available", quantity_type: "pcs" },
    { name: "Methylsalicylate + Menthol Liniment 60mL", category: "Topicals", price: 75.00, tax_percent: 5, barcode: "8901050608", sku: "MSL-MNT-60", status: "Available", quantity_type: "pcs" },
    { name: "Diclofenac + Methyl Salicylate Gel 30g", category: "Topicals", price: 95.00, tax_percent: 5, barcode: "8901050609", sku: "DCF-MS-GEL-30", status: "Available", quantity_type: "pcs" },
    { name: "Voltaren Emulgel 100g", category: "Topicals", price: 285.00, tax_percent: 5, barcode: "8901050610", sku: "VLT-GEL-100", status: "Available", quantity_type: "pcs" },
    { name: "Volini Pain Relief Spray 100g", category: "Topicals", price: 185.00, tax_percent: 5, barcode: "8901050611", sku: "VOL-SPY-100", status: "Available", quantity_type: "pcs" },
    { name: "Moov Pain Relief Cream 50g", category: "Topicals", price: 98.00, tax_percent: 5, barcode: "8901050612", sku: "MOV-CRM-50", status: "Available", quantity_type: "pcs" },
    { name: "Ibuprofen Gel 5% 30g", category: "Topicals", price: 85.00, tax_percent: 5, barcode: "8901050613", sku: "IBU-GEL-30", status: "Available", quantity_type: "pcs" },
    { name: "Nimesulide Gel 1% 30g", category: "Topicals", price: 55.00, tax_percent: 5, barcode: "8901050614", sku: "NIM-GEL-30", status: "Available", quantity_type: "pcs" },
    { name: "Lornoxicam Gel 30g", category: "Topicals", price: 120.00, tax_percent: 5, barcode: "8901050615", sku: "LRN-GEL-30", status: "Available", quantity_type: "pcs" },
    { name: "Methyl Salicylate 15% Cream 60g", category: "Topicals", price: 65.00, tax_percent: 5, barcode: "8901050616", sku: "MSL-CRM-60", status: "Available", quantity_type: "pcs" },
    { name: "Camphor + Menthol Balm 50g", category: "Topicals", price: 58.00, tax_percent: 5, barcode: "8901050617", sku: "CAM-MNT-50", status: "Available", quantity_type: "pcs" },
    { name: "Omega-3 + Glucosamine Cream 75g", category: "Topicals", price: 165.00, tax_percent: 5, barcode: "8901050618", sku: "OMG-GLC-CRM", status: "Available", quantity_type: "pcs" },
    { name: "Diclofenac 3% Topical Solution 60mL", category: "Topicals", price: 280.00, tax_percent: 5, barcode: "8901050619", sku: "DCF-3-SOL", status: "Available", quantity_type: "pcs" },

    // ---- Ortho Supports & Braces (GST: 12%) ----
    { name: "Knee Cap (Small)", category: "Ortho Supports", price: 250.00, tax_percent: 12, barcode: "8901050700", sku: "KNC-CAP-S", status: "Available", quantity_type: "pcs" },
    { name: "Knee Cap (Medium)", category: "Ortho Supports", price: 280.00, tax_percent: 12, barcode: "8901050701", sku: "KNC-CAP-M", status: "Available", quantity_type: "pcs" },
    { name: "Knee Cap (Large)", category: "Ortho Supports", price: 280.00, tax_percent: 12, barcode: "8901050702", sku: "KNC-CAP-L", status: "Available", quantity_type: "pcs" },
    { name: "Knee Cap (XL)", category: "Ortho Supports", price: 310.00, tax_percent: 12, barcode: "8901050703", sku: "KNC-CAP-XL", status: "Available", quantity_type: "pcs" },
    { name: "Hinged Knee Brace (Medium)", category: "Ortho Supports", price: 1800.00, tax_percent: 12, barcode: "8901050704", sku: "HNG-KNE-M", status: "Available", quantity_type: "pcs" },
    { name: "Hinged Knee Brace (Large)", category: "Ortho Supports", price: 1800.00, tax_percent: 12, barcode: "8901050705", sku: "HNG-KNE-L", status: "Available", quantity_type: "pcs" },
    { name: "OA Knee Unloader Brace (Medium)", category: "Ortho Supports", price: 4500.00, tax_percent: 12, barcode: "8901050706", sku: "OAK-BRC-M", status: "Available", quantity_type: "pcs" },
    { name: "Lumbosacral Corset (Small)", category: "Ortho Supports", price: 700.00, tax_percent: 12, barcode: "8901050707", sku: "LSC-SML", status: "Available", quantity_type: "pcs" },
    { name: "Lumbosacral Corset (Medium)", category: "Ortho Supports", price: 750.00, tax_percent: 12, barcode: "8901050708", sku: "LSC-MED", status: "Available", quantity_type: "pcs" },
    { name: "Lumbosacral Corset (Large)", category: "Ortho Supports", price: 750.00, tax_percent: 12, barcode: "8901050709", sku: "LSC-LGE", status: "Available", quantity_type: "pcs" },
    { name: "Lumbosacral Corset (XL)", category: "Ortho Supports", price: 820.00, tax_percent: 12, barcode: "8901050710", sku: "LSC-XL", status: "Available", quantity_type: "pcs" },
    { name: "TLSO Thoracolumbar Brace", category: "Ortho Supports", price: 2800.00, tax_percent: 12, barcode: "8901050711", sku: "TLS-BRC", status: "Available", quantity_type: "pcs" },
    { name: "Cervical Collar (Standard)", category: "Ortho Supports", price: 320.00, tax_percent: 12, barcode: "8901050712", sku: "CVC-STD", status: "Available", quantity_type: "pcs" },
    { name: "Cervical Collar (Philadelphia Type)", category: "Ortho Supports", price: 850.00, tax_percent: 12, barcode: "8901050713", sku: "CVC-PHI", status: "Available", quantity_type: "pcs" },
    { name: "Wrist Splint (Left)", category: "Ortho Supports", price: 380.00, tax_percent: 12, barcode: "8901050714", sku: "WRS-SPL-L", status: "Available", quantity_type: "pcs" },
    { name: "Wrist Splint (Right)", category: "Ortho Supports", price: 380.00, tax_percent: 12, barcode: "8901050715", sku: "WRS-SPL-R", status: "Available", quantity_type: "pcs" },
    { name: "Ankle Brace (Small)", category: "Ortho Supports", price: 390.00, tax_percent: 12, barcode: "8901050716", sku: "ANK-BRC-S", status: "Available", quantity_type: "pcs" },
    { name: "Ankle Brace (Medium)", category: "Ortho Supports", price: 420.00, tax_percent: 12, barcode: "8901050717", sku: "ANK-BRC-M", status: "Available", quantity_type: "pcs" },
    { name: "Ankle Brace (Large)", category: "Ortho Supports", price: 420.00, tax_percent: 12, barcode: "8901050718", sku: "ANK-BRC-L", status: "Available", quantity_type: "pcs" },
    { name: "Elbow Support (One Size)", category: "Ortho Supports", price: 250.00, tax_percent: 12, barcode: "8901050719", sku: "ELB-SUP", status: "Available", quantity_type: "pcs" },
    { name: "Tennis Elbow Brace (One Size)", category: "Ortho Supports", price: 350.00, tax_percent: 12, barcode: "8901050720", sku: "TEN-ELB-BRC", status: "Available", quantity_type: "pcs" },
    { name: "Shoulder Immobilizer (Small)", category: "Ortho Supports", price: 580.00, tax_percent: 12, barcode: "8901050721", sku: "SHD-IMM-S", status: "Available", quantity_type: "pcs" },
    { name: "Shoulder Immobilizer (Medium)", category: "Ortho Supports", price: 650.00, tax_percent: 12, barcode: "8901050722", sku: "SHD-IMM-M", status: "Available", quantity_type: "pcs" },
    { name: "Shoulder Immobilizer (Large)", category: "Ortho Supports", price: 650.00, tax_percent: 12, barcode: "8901050723", sku: "SHD-IMM-L", status: "Available", quantity_type: "pcs" },
    { name: "Thumb Spica Splint (Left)", category: "Ortho Supports", price: 290.00, tax_percent: 12, barcode: "8901050724", sku: "THB-SPC-L", status: "Available", quantity_type: "pcs" },
    { name: "Thumb Spica Splint (Right)", category: "Ortho Supports", price: 290.00, tax_percent: 12, barcode: "8901050725", sku: "THB-SPC-R", status: "Available", quantity_type: "pcs" },
    { name: "Heel Cup (Pair)", category: "Ortho Supports", price: 180.00, tax_percent: 12, barcode: "8901050726", sku: "HEL-CUP-PR", status: "Available", quantity_type: "pcs" },
    { name: "Arch Support Insoles (Small)", category: "Ortho Supports", price: 320.00, tax_percent: 12, barcode: "8901050727", sku: "ARC-INS-S", status: "Available", quantity_type: "pcs" },
    { name: "Arch Support Insoles (Large)", category: "Ortho Supports", price: 350.00, tax_percent: 12, barcode: "8901050728", sku: "ARC-INS-L", status: "Available", quantity_type: "pcs" },
    { name: "Metatarsal Pad (Pair)", category: "Ortho Supports", price: 150.00, tax_percent: 12, barcode: "8901050729", sku: "MET-PAD-PR", status: "Available", quantity_type: "pcs" },
    { name: "Plantar Fasciitis Night Splint", category: "Ortho Supports", price: 850.00, tax_percent: 12, barcode: "8901050730", sku: "PLF-NSP", status: "Available", quantity_type: "pcs" },
    { name: "Walking Stick (Adjustable Aluminium)", category: "Ortho Supports", price: 350.00, tax_percent: 12, barcode: "8901050731", sku: "WLK-STK-ADJ", status: "Available", quantity_type: "pcs" },
    { name: "Walker / Walking Frame (Foldable)", category: "Ortho Supports", price: 1100.00, tax_percent: 12, barcode: "8901050732", sku: "WLK-FRM-FLD", status: "Available", quantity_type: "pcs" },
    { name: "Forearm Crutch (Pair, Adjustable)", category: "Ortho Supports", price: 850.00, tax_percent: 12, barcode: "8901050733", sku: "CRT-FARM-PR", status: "Available", quantity_type: "pcs" },
    { name: "Axillary Crutch (Pair, Wooden)", category: "Ortho Supports", price: 480.00, tax_percent: 12, barcode: "8901050734", sku: "CRT-AXL-PR", status: "Available", quantity_type: "pcs" },
    { name: "Knee Immobilizer 24 inch", category: "Ortho Supports", price: 680.00, tax_percent: 12, barcode: "8901050735", sku: "KNE-IMM-24", status: "Available", quantity_type: "pcs" },
    { name: "Clavicle Brace (Figure-8 Type)", category: "Ortho Supports", price: 420.00, tax_percent: 12, barcode: "8901050736", sku: "CLV-BRC-F8", status: "Available", quantity_type: "pcs" },
    { name: "Sacroiliac Belt (One Size)", category: "Ortho Supports", price: 580.00, tax_percent: 12, barcode: "8901050737", sku: "SCI-BLT", status: "Available", quantity_type: "pcs" },
    { name: "Posture Corrector (One Size)", category: "Ortho Supports", price: 650.00, tax_percent: 12, barcode: "8901050738", sku: "PST-COR", status: "Available", quantity_type: "pcs" },
    { name: "Back Cushion / Lumbar Roll", category: "Ortho Supports", price: 420.00, tax_percent: 12, barcode: "8901050739", sku: "LMB-CUS", status: "Available", quantity_type: "pcs" },
    { name: "Donut Pillow / Coccyx Cushion", category: "Ortho Supports", price: 380.00, tax_percent: 12, barcode: "8901050740", sku: "COC-CUS", status: "Available", quantity_type: "pcs" },

    // ---- Physiotherapy Consumables (GST: 12%) ----
    { name: "TENS Electrode Pads (4 pads)", category: "Physiotherapy", price: 180.00, tax_percent: 12, barcode: "8901050801", sku: "TENS-PAD-4", status: "Available", quantity_type: "pack" },
    { name: "TENS Electrode Pads (8 pads)", category: "Physiotherapy", price: 320.00, tax_percent: 12, barcode: "8901050802", sku: "TENS-PAD-8", status: "Available", quantity_type: "pack" },
    { name: "Ultrasound Gel 250mL", category: "Physiotherapy", price: 95.00, tax_percent: 12, barcode: "8901050803", sku: "USG-GEL-250", status: "Available", quantity_type: "pcs" },
    { name: "Ultrasound Gel 500mL", category: "Physiotherapy", price: 165.00, tax_percent: 12, barcode: "8901050804", sku: "USG-GEL-500", status: "Available", quantity_type: "pcs" },
    { name: "Hot Water Bag (1.5L)", category: "Physiotherapy", price: 185.00, tax_percent: 12, barcode: "8901050805", sku: "HWB-15L", status: "Available", quantity_type: "pcs" },
    { name: "Hot Water Bag (2L)", category: "Physiotherapy", price: 220.00, tax_percent: 12, barcode: "8901050806", sku: "HWB-2L", status: "Available", quantity_type: "pcs" },
    { name: "Ice Gel Pack (Reusable, Small)", category: "Physiotherapy", price: 145.00, tax_percent: 12, barcode: "8901050807", sku: "ICE-GLP-S", status: "Available", quantity_type: "pcs" },
    { name: "Ice Gel Pack (Reusable, Large)", category: "Physiotherapy", price: 220.00, tax_percent: 12, barcode: "8901050808", sku: "ICE-GLP-L", status: "Available", quantity_type: "pcs" },
    { name: "Resistance Band (Light)", category: "Physiotherapy", price: 95.00, tax_percent: 12, barcode: "8901050809", sku: "RES-BND-LT", status: "Available", quantity_type: "pcs" },
    { name: "Resistance Band (Medium)", category: "Physiotherapy", price: 145.00, tax_percent: 12, barcode: "8901050810", sku: "RES-BND-M", status: "Available", quantity_type: "pcs" },
    { name: "Resistance Band (Heavy)", category: "Physiotherapy", price: 185.00, tax_percent: 12, barcode: "8901050811", sku: "RES-BND-HV", status: "Available", quantity_type: "pcs" },
    { name: "Resistance Band Set (5 bands)", category: "Physiotherapy", price: 450.00, tax_percent: 12, barcode: "8901050812", sku: "RES-BND-SET5", status: "Available", quantity_type: "pcs" },
    { name: "Foam Roller 30cm", category: "Physiotherapy", price: 380.00, tax_percent: 12, barcode: "8901050813", sku: "FMR-30", status: "Available", quantity_type: "pcs" },
    { name: "Foam Roller 60cm", category: "Physiotherapy", price: 550.00, tax_percent: 12, barcode: "8901050814", sku: "FMR-60", status: "Available", quantity_type: "pcs" },
    { name: "Crepe Bandage 5cm x 4m", category: "Physiotherapy", price: 28.00, tax_percent: 12, barcode: "8901050815", sku: "CRP-BND-5", status: "Available", quantity_type: "pcs" },
    { name: "Crepe Bandage 10cm x 4m", category: "Physiotherapy", price: 45.00, tax_percent: 12, barcode: "8901050816", sku: "CRP-BND-10", status: "Available", quantity_type: "pcs" },
    { name: "Crepe Bandage 15cm x 4m", category: "Physiotherapy", price: 65.00, tax_percent: 12, barcode: "8901050817", sku: "CRP-BND-15", status: "Available", quantity_type: "pcs" },
    { name: "Elastic Adhesive Bandage (EAB) 5cm x 5m", category: "Physiotherapy", price: 85.00, tax_percent: 12, barcode: "8901050818", sku: "EAB-5-5", status: "Available", quantity_type: "pcs" },
    { name: "Kinesiology Tape Roll 5cm x 5m", category: "Physiotherapy", price: 250.00, tax_percent: 12, barcode: "8901050819", sku: "KIN-TAPE", status: "Available", quantity_type: "pcs" },
    { name: "Kinesiology Tape Roll 5cm x 32m", category: "Physiotherapy", price: 850.00, tax_percent: 12, barcode: "8901050820", sku: "KIN-TAPE-32", status: "Available", quantity_type: "pcs" },
    { name: "SpraySensicool Cold Spray 400mL", category: "Physiotherapy", price: 280.00, tax_percent: 12, barcode: "8901050821", sku: "CLD-SPY-400", status: "Available", quantity_type: "pcs" },
    { name: "Tens Electrode Lead Wires (2 pcs)", category: "Physiotherapy", price: 185.00, tax_percent: 12, barcode: "8901050822", sku: "TENS-LWR-2", status: "Available", quantity_type: "pcs" },
    { name: "Exercise Ball 65cm", category: "Physiotherapy", price: 650.00, tax_percent: 12, barcode: "8901050823", sku: "EXR-BLL-65", status: "Available", quantity_type: "pcs" },
    { name: "Balance Board / Wobble Board", category: "Physiotherapy", price: 950.00, tax_percent: 12, barcode: "8901050824", sku: "BAL-BRD", status: "Available", quantity_type: "pcs" },

    // ---- Injectables (GST: 5%) ----
    { name: "Diclofenac Sodium 75mg/3mL Injection", category: "Injectables", price: 28.00, tax_percent: 5, barcode: "8901050901", sku: "DCF-INJ-75", status: "Available", quantity_type: "pcs" },
    { name: "Ketorolac 30mg/mL Injection", category: "Injectables", price: 45.00, tax_percent: 5, barcode: "8901050902", sku: "KTR-INJ-30", status: "Available", quantity_type: "pcs" },
    { name: "Tramadol 50mg/mL Injection (2mL)", category: "Injectables", price: 38.00, tax_percent: 5, barcode: "8901050903", sku: "TRM-INJ-50", status: "Available", quantity_type: "pcs" },
    { name: "Methylprednisolone 40mg/mL Vial", category: "Injectables", price: 185.00, tax_percent: 5, barcode: "8901050904", sku: "MPS-40-VIAL", status: "Available", quantity_type: "pcs" },
    { name: "Methylprednisolone 125mg/mL Vial", category: "Injectables", price: 280.00, tax_percent: 5, barcode: "8901050905", sku: "MPS-125-VIAL", status: "Available", quantity_type: "pcs" },
    { name: "Triamcinolone 40mg/mL Vial 5mL", category: "Injectables", price: 245.00, tax_percent: 5, barcode: "8901050906", sku: "TRC-40-VIAL", status: "Available", quantity_type: "pcs" },
    { name: "Triamcinolone Acetonide 10mg/mL Vial 5mL", category: "Injectables", price: 185.00, tax_percent: 5, barcode: "8901050907", sku: "TRC-10-VIAL", status: "Available", quantity_type: "pcs" },
    { name: "Betamethasone 5mg/mL + 2mg/mL Vial 1mL", category: "Injectables", price: 125.00, tax_percent: 5, barcode: "8901050908", sku: "BET-5-VIAL", status: "Available", quantity_type: "pcs" },
    { name: "Dexamethasone 4mg/mL Injection", category: "Injectables", price: 28.00, tax_percent: 5, barcode: "8901050909", sku: "DEX-4-INJ", status: "Available", quantity_type: "pcs" },
    { name: "Hyaluronic Acid 2% Injection (2mL)", category: "Injectables", price: 2800.00, tax_percent: 5, barcode: "8901050910", sku: "HYA-2PC-INJ", status: "Available", quantity_type: "pcs" },
    { name: "Hyaluronic Acid 1% Injection (2mL)", category: "Injectables", price: 1800.00, tax_percent: 5, barcode: "8901050911", sku: "HYA-1PC-INJ", status: "Available", quantity_type: "pcs" },
    { name: "Sodium Hyaluronate 20mg Prefilled Syringe", category: "Injectables", price: 3500.00, tax_percent: 5, barcode: "8901050912", sku: "SHA-20-SYR", status: "Available", quantity_type: "pcs" },
    { name: "Platelet Rich Plasma Kit", category: "Injectables", price: 4500.00, tax_percent: 5, barcode: "8901050913", sku: "PRP-KIT", status: "Available", quantity_type: "pcs" },
    { name: "Paracetamol 1000mg/100mL IV Infusion", category: "Injectables", price: 95.00, tax_percent: 5, barcode: "8901050914", sku: "PCM-IV-100", status: "Available", quantity_type: "pcs" },
    { name: "Morphine 10mg/mL Injection (1mL)", category: "Injectables", price: 45.00, tax_percent: 5, barcode: "8901050915", sku: "MOR-10-INJ", status: "Available", quantity_type: "pcs" },
    { name: "Bupivacaine 0.5% Injection 20mL", category: "Injectables", price: 65.00, tax_percent: 5, barcode: "8901050916", sku: "BUP-05-INJ", status: "Available", quantity_type: "pcs" },
    { name: "Lignocaine 2% Injection 30mL", category: "Injectables", price: 38.00, tax_percent: 5, barcode: "8901050917", sku: "LIG-2-INJ", status: "Available", quantity_type: "pcs" },
    { name: "Enoxaparin 40mg/0.4mL Syringe", category: "Injectables", price: 225.00, tax_percent: 5, barcode: "8901050918", sku: "ENX-40-SYR", status: "Available", quantity_type: "pcs" },
    { name: "Enoxaparin 60mg/0.6mL Syringe", category: "Injectables", price: 285.00, tax_percent: 5, barcode: "8901050919", sku: "ENX-60-SYR", status: "Available", quantity_type: "pcs" },
    { name: "Methylcobalamin 500mcg Injection (1mL)", category: "Injectables", price: 65.00, tax_percent: 5, barcode: "8901050920", sku: "MCB-INJ-500", status: "Available", quantity_type: "pcs" },

    // ---- Nerve Pain / Neuropathy (GST: 5%) ----
    { name: "Pregabalin 25mg Capsules (10s)", category: "Neuropathy", price: 45.00, tax_percent: 5, barcode: "8901051001", sku: "PRG-25-CAP", status: "Available", quantity_type: "strip" },
    { name: "Pregabalin 75mg Capsules (10s)", category: "Neuropathy", price: 88.00, tax_percent: 5, barcode: "8901051002", sku: "PRG-75-CAP", status: "Available", quantity_type: "strip" },
    { name: "Pregabalin 150mg Capsules (10s)", category: "Neuropathy", price: 145.00, tax_percent: 5, barcode: "8901051003", sku: "PRG-150-CAP", status: "Available", quantity_type: "strip" },
    { name: "Pregabalin 300mg Capsules (10s)", category: "Neuropathy", price: 248.00, tax_percent: 5, barcode: "8901051004", sku: "PRG-300-CAP", status: "Available", quantity_type: "strip" },
    { name: "Gabapentin 100mg Capsules (10s)", category: "Neuropathy", price: 42.00, tax_percent: 5, barcode: "8901051005", sku: "GAB-100-CAP", status: "Available", quantity_type: "strip" },
    { name: "Gabapentin 300mg Capsules (10s)", category: "Neuropathy", price: 65.00, tax_percent: 5, barcode: "8901051006", sku: "GAB-300-CAP", status: "Available", quantity_type: "strip" },
    { name: "Gabapentin 400mg Capsules (10s)", category: "Neuropathy", price: 90.00, tax_percent: 5, barcode: "8901051007", sku: "GAB-400-CAP", status: "Available", quantity_type: "strip" },
    { name: "Gabapentin 600mg Tablets (10s)", category: "Neuropathy", price: 125.00, tax_percent: 5, barcode: "8901051008", sku: "GAB-600-TAB", status: "Available", quantity_type: "strip" },
    { name: "Amitriptyline 10mg Tablets (10s)", category: "Neuropathy", price: 18.00, tax_percent: 5, barcode: "8901051009", sku: "AMT-10-TAB", status: "Available", quantity_type: "strip" },
    { name: "Amitriptyline 25mg Tablets (10s)", category: "Neuropathy", price: 28.00, tax_percent: 5, barcode: "8901051010", sku: "AMT-25-TAB", status: "Available", quantity_type: "strip" },
    { name: "Duloxetine 20mg Capsules (10s)", category: "Neuropathy", price: 125.00, tax_percent: 5, barcode: "8901051011", sku: "DUL-20-CAP", status: "Available", quantity_type: "strip" },
    { name: "Duloxetine 30mg Capsules (10s)", category: "Neuropathy", price: 185.00, tax_percent: 5, barcode: "8901051012", sku: "DUL-30-CAP", status: "Available", quantity_type: "strip" },
    { name: "Duloxetine 60mg Capsules (10s)", category: "Neuropathy", price: 285.00, tax_percent: 5, barcode: "8901051013", sku: "DUL-60-CAP", status: "Available", quantity_type: "strip" },
    { name: "Venlafaxine 37.5mg Capsules (10s)", category: "Neuropathy", price: 95.00, tax_percent: 5, barcode: "8901051014", sku: "VEN-375-CAP", status: "Available", quantity_type: "strip" },
    { name: "Venlafaxine 75mg SR Capsules (10s)", category: "Neuropathy", price: 155.00, tax_percent: 5, barcode: "8901051015", sku: "VEN-75-SR", status: "Available", quantity_type: "strip" },
    { name: "Carbamazepine 200mg Tablets (10s)", category: "Neuropathy", price: 28.00, tax_percent: 5, barcode: "8901051016", sku: "CBZ-200-TAB", status: "Available", quantity_type: "strip" },
    { name: "Carbamazepine 400mg CR Tablets (10s)", category: "Neuropathy", price: 65.00, tax_percent: 5, barcode: "8901051017", sku: "CBZ-400-CR", status: "Available", quantity_type: "strip" },
    { name: "Oxcarbazepine 150mg Tablets (10s)", category: "Neuropathy", price: 88.00, tax_percent: 5, barcode: "8901051018", sku: "OXC-150-TAB", status: "Available", quantity_type: "strip" },
    { name: "Oxcarbazepine 300mg Tablets (10s)", category: "Neuropathy", price: 145.00, tax_percent: 5, barcode: "8901051019", sku: "OXC-300-TAB", status: "Available", quantity_type: "strip" },
    { name: "Nortriptyline 10mg Tablets (10s)", category: "Neuropathy", price: 25.00, tax_percent: 5, barcode: "8901051020", sku: "NRT-10-TAB", status: "Available", quantity_type: "strip" },
    { name: "Nortriptyline 25mg Tablets (10s)", category: "Neuropathy", price: 38.00, tax_percent: 5, barcode: "8901051021", sku: "NRT-25-TAB", status: "Available", quantity_type: "strip" },

    // ---- Anticoagulants (Post-Surgery / DVT Prevention, GST: 5%) ----
    { name: "Enoxaparin 40mg/0.4mL Subcutaneous (5 syringes)", category: "Anticoagulants", price: 1050.00, tax_percent: 5, barcode: "8901051101", sku: "ENX-40-5SYR", status: "Available", quantity_type: "pack" },
    { name: "Enoxaparin 60mg/0.6mL Subcutaneous (5 syringes)", category: "Anticoagulants", price: 1350.00, tax_percent: 5, barcode: "8901051102", sku: "ENX-60-5SYR", status: "Available", quantity_type: "pack" },
    { name: "Rivaroxaban 10mg Tablets (10s)", category: "Anticoagulants", price: 680.00, tax_percent: 5, barcode: "8901051103", sku: "RVX-10-TAB", status: "Available", quantity_type: "strip" },
    { name: "Rivaroxaban 15mg Tablets (10s)", category: "Anticoagulants", price: 820.00, tax_percent: 5, barcode: "8901051104", sku: "RVX-15-TAB", status: "Available", quantity_type: "strip" },
    { name: "Rivaroxaban 20mg Tablets (10s)", category: "Anticoagulants", price: 920.00, tax_percent: 5, barcode: "8901051105", sku: "RVX-20-TAB", status: "Available", quantity_type: "strip" },
    { name: "Apixaban 2.5mg Tablets (14s)", category: "Anticoagulants", price: 650.00, tax_percent: 5, barcode: "8901051106", sku: "APX-25-14", status: "Available", quantity_type: "strip" },
    { name: "Apixaban 5mg Tablets (10s)", category: "Anticoagulants", price: 780.00, tax_percent: 5, barcode: "8901051107", sku: "APX-5-10", status: "Available", quantity_type: "strip" },
    { name: "Dabigatran 75mg Capsules (10s)", category: "Anticoagulants", price: 550.00, tax_percent: 5, barcode: "8901051108", sku: "DAB-75-CAP", status: "Available", quantity_type: "strip" },
    { name: "Dabigatran 110mg Capsules (10s)", category: "Anticoagulants", price: 780.00, tax_percent: 5, barcode: "8901051109", sku: "DAB-110-CAP", status: "Available", quantity_type: "strip" },
    { name: "Aspirin 75mg Tablets (14s)", category: "Anticoagulants", price: 28.00, tax_percent: 5, barcode: "8901051110", sku: "ASP-75-14", status: "Available", quantity_type: "strip" },
    { name: "Aspirin 150mg Tablets (10s)", category: "Anticoagulants", price: 32.00, tax_percent: 5, barcode: "8901051111", sku: "ASP-150-TAB", status: "Available", quantity_type: "strip" },
    { name: "Warfarin 1mg Tablets (30s)", category: "Anticoagulants", price: 55.00, tax_percent: 5, barcode: "8901051112", sku: "WAR-1-30", status: "Available", quantity_type: "strip" },
    { name: "Warfarin 5mg Tablets (30s)", category: "Anticoagulants", price: 95.00, tax_percent: 5, barcode: "8901051113", sku: "WAR-5-30", status: "Available", quantity_type: "strip" },

    // ---- Uric Acid / Gout Medications (GST: 5%) ----
    { name: "Allopurinol 100mg Tablets (10s)", category: "Gout Medications", price: 18.00, tax_percent: 5, barcode: "8901051201", sku: "ALP-100-TAB", status: "Available", quantity_type: "strip" },
    { name: "Allopurinol 200mg Tablets (10s)", category: "Gout Medications", price: 32.00, tax_percent: 5, barcode: "8901051202", sku: "ALP-200-TAB", status: "Available", quantity_type: "strip" },
    { name: "Allopurinol 300mg Tablets (10s)", category: "Gout Medications", price: 42.00, tax_percent: 5, barcode: "8901051203", sku: "ALP-300-TAB", status: "Available", quantity_type: "strip" },
    { name: "Colchicine 0.5mg Tablets (10s)", category: "Gout Medications", price: 65.00, tax_percent: 5, barcode: "8901051204", sku: "COL-05-TAB", status: "Available", quantity_type: "strip" },
    { name: "Colchicine 1mg Tablets (10s)", category: "Gout Medications", price: 95.00, tax_percent: 5, barcode: "8901051205", sku: "COL-1-TAB", status: "Available", quantity_type: "strip" },
    { name: "Febuxostat 40mg Tablets (10s)", category: "Gout Medications", price: 125.00, tax_percent: 5, barcode: "8901051206", sku: "FEB-40-TAB", status: "Available", quantity_type: "strip" },
    { name: "Febuxostat 80mg Tablets (10s)", category: "Gout Medications", price: 185.00, tax_percent: 5, barcode: "8901051207", sku: "FEB-80-TAB", status: "Available", quantity_type: "strip" },
    { name: "Febuxostat 120mg Tablets (10s)", category: "Gout Medications", price: 245.00, tax_percent: 5, barcode: "8901051208", sku: "FEB-120-TAB", status: "Available", quantity_type: "strip" },
    { name: "Benzbromarone 50mg Tablets (10s)", category: "Gout Medications", price: 95.00, tax_percent: 5, barcode: "8901051209", sku: "BEN-50-TAB", status: "Available", quantity_type: "strip" },
    { name: "Probenecid 250mg Tablets (10s)", category: "Gout Medications", price: 65.00, tax_percent: 5, barcode: "8901051210", sku: "PRO-250-TAB", status: "Available", quantity_type: "strip" },
    { name: "Pegloticase 8mg Infusion", category: "Gout Medications", price: 12500.00, tax_percent: 5, barcode: "8901051211", sku: "PGL-8-INF", status: "Available", quantity_type: "pcs" },

    // ---- Proton Pump Inhibitors (GI Protection, GST: 5%) ----
    { name: "Pantoprazole 20mg Tablets (10s)", category: "GI Protection", price: 32.00, tax_percent: 5, barcode: "8901051301", sku: "PNT-20-TAB", status: "Available", quantity_type: "strip" },
    { name: "Pantoprazole 40mg Tablets (10s)", category: "GI Protection", price: 45.00, tax_percent: 5, barcode: "8901051302", sku: "PNT-40-TAB", status: "Available", quantity_type: "strip" },
    { name: "Omeprazole 10mg Capsules (10s)", category: "GI Protection", price: 22.00, tax_percent: 5, barcode: "8901051303", sku: "OMP-10-CAP", status: "Available", quantity_type: "strip" },
    { name: "Omeprazole 20mg Capsules (10s)", category: "GI Protection", price: 32.00, tax_percent: 5, barcode: "8901051304", sku: "OMP-20-CAP", status: "Available", quantity_type: "strip" },
    { name: "Omeprazole 40mg Capsules (10s)", category: "GI Protection", price: 55.00, tax_percent: 5, barcode: "8901051305", sku: "OMP-40-CAP", status: "Available", quantity_type: "strip" },
    { name: "Rabeprazole 10mg Tablets (10s)", category: "GI Protection", price: 35.00, tax_percent: 5, barcode: "8901051306", sku: "RAB-10-TAB", status: "Available", quantity_type: "strip" },
    { name: "Rabeprazole 20mg Tablets (10s)", category: "GI Protection", price: 52.00, tax_percent: 5, barcode: "8901051307", sku: "RAB-20-TAB", status: "Available", quantity_type: "strip" },
    { name: "Esomeprazole 20mg Tablets (10s)", category: "GI Protection", price: 55.00, tax_percent: 5, barcode: "8901051308", sku: "ESO-20-TAB", status: "Available", quantity_type: "strip" },
    { name: "Esomeprazole 40mg Tablets (10s)", category: "GI Protection", price: 68.00, tax_percent: 5, barcode: "8901051309", sku: "ESO-40-TAB", status: "Available", quantity_type: "strip" },
    { name: "Lansoprazole 15mg Capsules (10s)", category: "GI Protection", price: 38.00, tax_percent: 5, barcode: "8901051310", sku: "LAN-15-CAP", status: "Available", quantity_type: "strip" },
    { name: "Lansoprazole 30mg Capsules (10s)", category: "GI Protection", price: 58.00, tax_percent: 5, barcode: "8901051311", sku: "LAN-30-CAP", status: "Available", quantity_type: "strip" },
    { name: "Ranitidine 150mg Tablets (10s)", category: "GI Protection", price: 22.00, tax_percent: 5, barcode: "8901051312", sku: "RAN-150-TAB", status: "Available", quantity_type: "strip" },
    { name: "Famotidine 20mg Tablets (10s)", category: "GI Protection", price: 28.00, tax_percent: 5, barcode: "8901051313", sku: "FAM-20-TAB", status: "Available", quantity_type: "strip" },
    { name: "Famotidine 40mg Tablets (10s)", category: "GI Protection", price: 45.00, tax_percent: 5, barcode: "8901051314", sku: "FAM-40-TAB", status: "Available", quantity_type: "strip" },
    { name: "Misoprostol 200mcg Tablets (4s)", category: "GI Protection", price: 85.00, tax_percent: 5, barcode: "8901051315", sku: "MIS-200-4", status: "Available", quantity_type: "strip" },
    { name: "Sucralfate 500mg Tablets (10s)", category: "GI Protection", price: 35.00, tax_percent: 5, barcode: "8901051316", sku: "SUC-500-TAB", status: "Available", quantity_type: "strip" },
    { name: "Domperidone 10mg Tablets (10s)", category: "GI Protection", price: 22.00, tax_percent: 5, barcode: "8901051317", sku: "DOM-10-TAB", status: "Available", quantity_type: "strip" },
    { name: "Metoclopramide 10mg Tablets (10s)", category: "GI Protection", price: 18.00, tax_percent: 5, barcode: "8901051318", sku: "MTC-10-TAB", status: "Available", quantity_type: "strip" },

    // ---- Multivitamins & Immune Support (GST: 18%) ----
    { name: "Multivitamin + Mineral Tablets (30s)", category: "Multivitamins", price: 195.00, tax_percent: 18, barcode: "8901051401", sku: "MVM-MIN-30", status: "Available", quantity_type: "pack" },
    { name: "Vitamin B Complex Tablets (30s)", category: "Multivitamins", price: 95.00, tax_percent: 18, barcode: "8901051402", sku: "VTB-CMX-30", status: "Available", quantity_type: "pack" },
    { name: "Vitamin C 500mg Tablets (30s)", category: "Multivitamins", price: 125.00, tax_percent: 18, barcode: "8901051403", sku: "VTC-500-30", status: "Available", quantity_type: "pack" },
    { name: "Vitamin C 1000mg Tablets (30s)", category: "Multivitamins", price: 195.00, tax_percent: 18, barcode: "8901051404", sku: "VTC-1K-30", status: "Available", quantity_type: "pack" },
    { name: "Vitamin E 400 IU Capsules (30s)", category: "Multivitamins", price: 145.00, tax_percent: 18, barcode: "8901051405", sku: "VTE-400-30", status: "Available", quantity_type: "pack" },
    { name: "Zinc 50mg Tablets (30s)", category: "Multivitamins", price: 95.00, tax_percent: 18, barcode: "8901051406", sku: "ZNC-50-30", status: "Available", quantity_type: "pack" },
    { name: "Zinc + Vitamin C + D3 Effervescent (20s)", category: "Multivitamins", price: 280.00, tax_percent: 18, barcode: "8901051407", sku: "ZNC-VC-EFF", status: "Available", quantity_type: "pack" },
    { name: "Magnesium 375mg Tablets (30s)", category: "Multivitamins", price: 245.00, tax_percent: 18, barcode: "8901051408", sku: "MAG-375-30", status: "Available", quantity_type: "pack" },
    { name: "Omega-3 Fish Oil 1000mg Capsules (30s)", category: "Multivitamins", price: 350.00, tax_percent: 18, barcode: "8901051409", sku: "OMG-1000-30", status: "Available", quantity_type: "pack" },
    { name: "Omega-3 EPA+DHA 500mg Capsules (60s)", category: "Multivitamins", price: 480.00, tax_percent: 18, barcode: "8901051410", sku: "OMG-EPA-60", status: "Available", quantity_type: "pack" },
    { name: "Coenzyme Q10 100mg Capsules (30s)", category: "Multivitamins", price: 420.00, tax_percent: 18, barcode: "8901051411", sku: "COQ-100-30", status: "Available", quantity_type: "pack" },
    { name: "Biotin 5000mcg Tablets (30s)", category: "Multivitamins", price: 280.00, tax_percent: 18, barcode: "8901051412", sku: "BIO-5K-30", status: "Available", quantity_type: "pack" },
    { name: "Iron + Folic Acid Tablets (30s)", category: "Multivitamins", price: 85.00, tax_percent: 18, barcode: "8901051413", sku: "IRN-FOL-30", status: "Available", quantity_type: "pack" },
    { name: "Turmeric + Black Pepper Capsules (60s)", category: "Multivitamins", price: 320.00, tax_percent: 18, barcode: "8901051414", sku: "TRM-BPP-60", status: "Available", quantity_type: "pack" },

    // ---- Rheumatoid Arthritis / DMARDs (GST: 5%) ----
    { name: "Methotrexate 2.5mg Tablets (10s)", category: "Rheumatology", price: 48.00, tax_percent: 5, barcode: "8901051501", sku: "MTX-25-TAB", status: "Available", quantity_type: "strip" },
    { name: "Methotrexate 5mg Tablets (10s)", category: "Rheumatology", price: 75.00, tax_percent: 5, barcode: "8901051502", sku: "MTX-5-TAB", status: "Available", quantity_type: "strip" },
    { name: "Methotrexate 10mg Tablets (10s)", category: "Rheumatology", price: 120.00, tax_percent: 5, barcode: "8901051503", sku: "MTX-10-TAB", status: "Available", quantity_type: "strip" },
    { name: "Hydroxychloroquine 200mg Tablets (10s)", category: "Rheumatology", price: 65.00, tax_percent: 5, barcode: "8901051504", sku: "HCQ-200-TAB", status: "Available", quantity_type: "strip" },
    { name: "Hydroxychloroquine 400mg Tablets (10s)", category: "Rheumatology", price: 115.00, tax_percent: 5, barcode: "8901051505", sku: "HCQ-400-TAB", status: "Available", quantity_type: "strip" },
    { name: "Sulfasalazine 500mg Tablets (10s)", category: "Rheumatology", price: 45.00, tax_percent: 5, barcode: "8901051506", sku: "SUL-500-TAB", status: "Available", quantity_type: "strip" },
    { name: "Leflunomide 10mg Tablets (10s)", category: "Rheumatology", price: 195.00, tax_percent: 5, barcode: "8901051507", sku: "LEF-10-TAB", status: "Available", quantity_type: "strip" },
    { name: "Leflunomide 20mg Tablets (10s)", category: "Rheumatology", price: 310.00, tax_percent: 5, barcode: "8901051508", sku: "LEF-20-TAB", status: "Available", quantity_type: "strip" },
    { name: "D-Penicillamine 125mg Capsules (10s)", category: "Rheumatology", price: 145.00, tax_percent: 5, barcode: "8901051509", sku: "DPC-125-CAP", status: "Available", quantity_type: "strip" },
    { name: "Azathioprine 50mg Tablets (10s)", category: "Rheumatology", price: 165.00, tax_percent: 5, barcode: "8901051510", sku: "AZA-50-TAB", status: "Available", quantity_type: "strip" },
    { name: "Folic Acid 5mg Tablets (10s)", category: "Rheumatology", price: 12.00, tax_percent: 5, barcode: "8901051511", sku: "FOL-5-TAB", status: "Available", quantity_type: "strip" },
    { name: "Tofacitinib 5mg Tablets (14s)", category: "Rheumatology", price: 3200.00, tax_percent: 5, barcode: "8901051512", sku: "TOF-5-14", status: "Available", quantity_type: "strip" },
    { name: "Baricitinib 2mg Tablets (14s)", category: "Rheumatology", price: 4800.00, tax_percent: 5, barcode: "8901051513", sku: "BAR-2-14", status: "Available", quantity_type: "strip" },
    { name: "Etanercept 25mg Injection", category: "Rheumatology", price: 12500.00, tax_percent: 5, barcode: "8901051514", sku: "ETA-25-INJ", status: "Available", quantity_type: "pcs" },
    { name: "Adalimumab 40mg/0.8mL Injection", category: "Rheumatology", price: 28000.00, tax_percent: 5, barcode: "8901051515", sku: "ADA-40-INJ", status: "Available", quantity_type: "pcs" },

    // ---- Analgesic Combinations (GST: 5%) ----
    { name: "Aceclofenac + Paracetamol + Serratiopeptidase Tablets (10s)", category: "Combination Analgesics", price: 65.00, tax_percent: 5, barcode: "8901051601", sku: "ACE-PCM-SER", status: "Available", quantity_type: "strip" },
    { name: "Diclofenac + Paracetamol + Serratiopeptidase Tablets (10s)", category: "Combination Analgesics", price: 68.00, tax_percent: 5, barcode: "8901051602", sku: "DCF-PCM-SER", status: "Available", quantity_type: "strip" },
    { name: "Ibuprofen + Paracetamol Tablets (10s)", category: "Combination Analgesics", price: 38.00, tax_percent: 5, barcode: "8901051603", sku: "IBU-PCM-TAB", status: "Available", quantity_type: "strip" },
    { name: "Ibuprofen 400mg + Paracetamol 325mg Tablets (10s)", category: "Combination Analgesics", price: 42.00, tax_percent: 5, barcode: "8901051604", sku: "IBU-PCM-400", status: "Available", quantity_type: "strip" },
    { name: "Etoricoxib + Thiocolchicoside Tablets (10s)", category: "Combination Analgesics", price: 165.00, tax_percent: 5, barcode: "8901051605", sku: "ETO-THC-TAB", status: "Available", quantity_type: "strip" },
    { name: "Diclofenac + Thiocolchicoside Tablets (10s)", category: "Combination Analgesics", price: 115.00, tax_percent: 5, barcode: "8901051606", sku: "DCF-THC-TAB", status: "Available", quantity_type: "strip" },
    { name: "Naproxen + Esomeprazole Tablets (10s)", category: "Combination Analgesics", price: 125.00, tax_percent: 5, barcode: "8901051607", sku: "NAP-ESO-TAB", status: "Available", quantity_type: "strip" },
    { name: "Serratiopeptidase 10mg Tablets (10s)", category: "Combination Analgesics", price: 45.00, tax_percent: 5, barcode: "8901051608", sku: "SER-10-TAB", status: "Available", quantity_type: "strip" },
    { name: "Serratiopeptidase 20mg Tablets (10s)", category: "Combination Analgesics", price: 75.00, tax_percent: 5, barcode: "8901051609", sku: "SER-20-TAB", status: "Available", quantity_type: "strip" },
    { name: "Trypsin + Chymotrypsin Tablets (10s)", category: "Combination Analgesics", price: 85.00, tax_percent: 5, barcode: "8901051610", sku: "TRY-CHY-TAB", status: "Available", quantity_type: "strip" },
    { name: "Bromelain 500mg Tablets (10s)", category: "Combination Analgesics", price: 95.00, tax_percent: 5, barcode: "8901051611", sku: "BRM-500-TAB", status: "Available", quantity_type: "strip" },
    { name: "Tramadol + Paracetamol 650mg + 37.5mg Tablets (10s)", category: "Combination Analgesics", price: 85.00, tax_percent: 5, barcode: "8901051612", sku: "TRM-PCM-650", status: "Available", quantity_type: "strip" },

    // ---- Sleep & Anxiety (Adjuncts in Pain Management, GST: 5%) ----
    { name: "Clonazepam 0.25mg Tablets (10s)", category: "Sleep & Anxiety", price: 22.00, tax_percent: 5, barcode: "8901051701", sku: "CLN-025-TAB", status: "Available", quantity_type: "strip" },
    { name: "Clonazepam 0.5mg Tablets (10s)", category: "Sleep & Anxiety", price: 32.00, tax_percent: 5, barcode: "8901051702", sku: "CLN-05-TAB", status: "Available", quantity_type: "strip" },
    { name: "Alprazolam 0.25mg Tablets (10s)", category: "Sleep & Anxiety", price: 18.00, tax_percent: 5, barcode: "8901051703", sku: "ALP-025-TAB", status: "Available", quantity_type: "strip" },
    { name: "Alprazolam 0.5mg Tablets (10s)", category: "Sleep & Anxiety", price: 28.00, tax_percent: 5, barcode: "8901051704", sku: "ALP-05-TAB", status: "Available", quantity_type: "strip" },
    { name: "Zolpidem 5mg Tablets (10s)", category: "Sleep & Anxiety", price: 65.00, tax_percent: 5, barcode: "8901051705", sku: "ZOL-5-TAB", status: "Available", quantity_type: "strip" },
    { name: "Zolpidem 10mg Tablets (10s)", category: "Sleep & Anxiety", price: 95.00, tax_percent: 5, barcode: "8901051706", sku: "ZOL-10-TAB", status: "Available", quantity_type: "strip" },
    { name: "Melatonin 3mg Tablets (10s)", category: "Sleep & Anxiety", price: 85.00, tax_percent: 5, barcode: "8901051707", sku: "MEL-3-TAB", status: "Available", quantity_type: "strip" },
    { name: "Melatonin 5mg Tablets (10s)", category: "Sleep & Anxiety", price: 115.00, tax_percent: 5, barcode: "8901051708", sku: "MEL-5-TAB", status: "Available", quantity_type: "strip" },
    { name: "Diazepam 5mg Tablets (10s)", category: "Sleep & Anxiety", price: 18.00, tax_percent: 5, barcode: "8901051709", sku: "DZP-5-TAB", status: "Available", quantity_type: "strip" },
    { name: "Lorazepam 1mg Tablets (10s)", category: "Sleep & Anxiety", price: 25.00, tax_percent: 5, barcode: "8901051710", sku: "LRZ-1-TAB", status: "Available", quantity_type: "strip" },

    // ---- Wound Care & Dressings (GST: 12%) ----
    { name: "Sterile Gauze Pads 10x10cm (10s)", category: "Wound Care", price: 45.00, tax_percent: 12, barcode: "8901051801", sku: "GAZ-10-10", status: "Available", quantity_type: "pack" },
    { name: "Adhesive Bandage Strips (100 pcs)", category: "Wound Care", price: 95.00, tax_percent: 12, barcode: "8901051802", sku: "ADH-BND-100", status: "Available", quantity_type: "pack" },
    { name: "Povidone Iodine Solution 100mL", category: "Wound Care", price: 55.00, tax_percent: 12, barcode: "8901051803", sku: "PVD-SOL-100", status: "Available", quantity_type: "pcs" },
    { name: "Povidone Iodine Ointment 15g", category: "Wound Care", price: 38.00, tax_percent: 12, barcode: "8901051804", sku: "PVD-OIN-15", status: "Available", quantity_type: "pcs" },
    { name: "Hydrogen Peroxide 3% 100mL", category: "Wound Care", price: 25.00, tax_percent: 12, barcode: "8901051805", sku: "H2O2-3-100", status: "Available", quantity_type: "pcs" },
    { name: "Silver Sulfadiazine Cream 1% 25g", category: "Wound Care", price: 85.00, tax_percent: 12, barcode: "8901051806", sku: "SLV-SDF-25", status: "Available", quantity_type: "pcs" },
    { name: "Bacitracin + Neomycin Ointment 15g", category: "Wound Care", price: 55.00, tax_percent: 12, barcode: "8901051807", sku: "BAC-NEO-15", status: "Available", quantity_type: "pcs" },
    { name: "Mupirocin 2% Ointment 5g", category: "Wound Care", price: 65.00, tax_percent: 12, barcode: "8901051808", sku: "MUP-2-5", status: "Available", quantity_type: "pcs" },
    { name: "Chlorhexidine Gluconate Solution 500mL", category: "Wound Care", price: 75.00, tax_percent: 12, barcode: "8901051809", sku: "CHX-500-SOL", status: "Available", quantity_type: "pcs" },
    { name: "Non-adherent Dressing 10x10cm (10s)", category: "Wound Care", price: 125.00, tax_percent: 12, barcode: "8901051810", sku: "NAD-10-10", status: "Available", quantity_type: "pack" },

    // ---- Anti-infective / Antibiotics for Post-surgical (GST: 5%) ----
    { name: "Amoxicillin 500mg Capsules (10s)", category: "Antibiotics", price: 48.00, tax_percent: 5, barcode: "8901051901", sku: "AMX-500-CAP", status: "Available", quantity_type: "strip" },
    { name: "Amoxicillin + Clavulanate 625mg Tablets (6s)", category: "Antibiotics", price: 125.00, tax_percent: 5, barcode: "8901051902", sku: "AMX-CLV-625", status: "Available", quantity_type: "strip" },
    { name: "Amoxicillin + Clavulanate 1000mg Tablets (10s)", category: "Antibiotics", price: 280.00, tax_percent: 5, barcode: "8901051903", sku: "AMX-CLV-1K", status: "Available", quantity_type: "strip" },
    { name: "Ciprofloxacin 500mg Tablets (10s)", category: "Antibiotics", price: 55.00, tax_percent: 5, barcode: "8901051904", sku: "CIP-500-TAB", status: "Available", quantity_type: "strip" },
    { name: "Levofloxacin 500mg Tablets (5s)", category: "Antibiotics", price: 85.00, tax_percent: 5, barcode: "8901051905", sku: "LEV-500-5", status: "Available", quantity_type: "strip" },
    { name: "Cefixime 200mg Tablets (10s)", category: "Antibiotics", price: 95.00, tax_percent: 5, barcode: "8901051906", sku: "CEF-200-TAB", status: "Available", quantity_type: "strip" },
    { name: "Cefuroxime 250mg Tablets (10s)", category: "Antibiotics", price: 145.00, tax_percent: 5, barcode: "8901051907", sku: "CEF-250-TAB", status: "Available", quantity_type: "strip" },
    { name: "Metronidazole 400mg Tablets (10s)", category: "Antibiotics", price: 22.00, tax_percent: 5, barcode: "8901051908", sku: "MET-400-TAB", status: "Available", quantity_type: "strip" },
    { name: "Clindamycin 150mg Capsules (10s)", category: "Antibiotics", price: 95.00, tax_percent: 5, barcode: "8901051909", sku: "CLI-150-CAP", status: "Available", quantity_type: "strip" },
    { name: "Clindamycin 300mg Capsules (10s)", category: "Antibiotics", price: 165.00, tax_percent: 5, barcode: "8901051910", sku: "CLI-300-CAP", status: "Available", quantity_type: "strip" },
    { name: "Doxycycline 100mg Tablets (10s)", category: "Antibiotics", price: 45.00, tax_percent: 5, barcode: "8901051911", sku: "DOX-100-TAB", status: "Available", quantity_type: "strip" },
    { name: "Fluconazole 150mg Tablets (1s)", category: "Antibiotics", price: 38.00, tax_percent: 5, barcode: "8901051912", sku: "FLC-150-1", status: "Available", quantity_type: "strip" },
    { name: "Rifampicin 450mg Tablets (10s)", category: "Antibiotics", price: 85.00, tax_percent: 5, barcode: "8901051913", sku: "RIF-450-TAB", status: "Available", quantity_type: "strip" },
    { name: "Linezolid 600mg Tablets (10s)", category: "Antibiotics", price: 1850.00, tax_percent: 5, barcode: "8901051914", sku: "LIN-600-TAB", status: "Available", quantity_type: "strip" },

    // ---- Antifungals (GST: 5%) ----
    { name: "Fluconazole 50mg Capsules (7s)", category: "Antifungals", price: 65.00, tax_percent: 5, barcode: "8901052001", sku: "FLC-50-7", status: "Available", quantity_type: "strip" },
    { name: "Itraconazole 100mg Capsules (10s)", category: "Antifungals", price: 185.00, tax_percent: 5, barcode: "8901052002", sku: "ITR-100-CAP", status: "Available", quantity_type: "strip" },
    { name: "Clotrimazole 1% Cream 30g", category: "Antifungals", price: 55.00, tax_percent: 5, barcode: "8901052003", sku: "CLO-CRM-30", status: "Available", quantity_type: "pcs" },
    { name: "Terbinafine 250mg Tablets (7s)", category: "Antifungals", price: 95.00, tax_percent: 5, barcode: "8901052004", sku: "TER-250-7", status: "Available", quantity_type: "strip" },
    { name: "Miconazole + Clotrimazole Cream 30g", category: "Antifungals", price: 68.00, tax_percent: 5, barcode: "8901052005", sku: "MIC-CLO-30", status: "Available", quantity_type: "pcs" },

    // ---- Antihistamines & Allergy (GST: 5%) ----
    { name: "Cetirizine 10mg Tablets (10s)", category: "Antihistamines", price: 18.00, tax_percent: 5, barcode: "8901052101", sku: "CET-10-TAB", status: "Available", quantity_type: "strip" },
    { name: "Levocetirizine 5mg Tablets (10s)", category: "Antihistamines", price: 28.00, tax_percent: 5, barcode: "8901052102", sku: "LEV-5-TAB", status: "Available", quantity_type: "strip" },
    { name: "Fexofenadine 120mg Tablets (10s)", category: "Antihistamines", price: 45.00, tax_percent: 5, barcode: "8901052103", sku: "FEX-120-TAB", status: "Available", quantity_type: "strip" },
    { name: "Fexofenadine 180mg Tablets (10s)", category: "Antihistamines", price: 65.00, tax_percent: 5, barcode: "8901052104", sku: "FEX-180-TAB", status: "Available", quantity_type: "strip" },
    { name: "Loratadine 10mg Tablets (10s)", category: "Antihistamines", price: 22.00, tax_percent: 5, barcode: "8901052105", sku: "LOR-10-TAB", status: "Available", quantity_type: "strip" },
    { name: "Promethazine 25mg Tablets (10s)", category: "Antihistamines", price: 18.00, tax_percent: 5, barcode: "8901052106", sku: "PRM-25-TAB", status: "Available", quantity_type: "strip" },
    { name: "Hydrocortisone 1% Cream 30g", category: "Antihistamines", price: 45.00, tax_percent: 5, barcode: "8901052107", sku: "HYD-CRM-30", status: "Available", quantity_type: "pcs" },

    // ---- Diabetes Adjunct (Common Co-morbidity in Ortho, GST: 5%) ----
    { name: "Metformin 500mg Tablets (10s)", category: "Diabetes Adjunct", price: 18.00, tax_percent: 5, barcode: "8901052201", sku: "MET-500-TAB", status: "Available", quantity_type: "strip" },
    { name: "Metformin 1000mg Tablets (10s)", category: "Diabetes Adjunct", price: 28.00, tax_percent: 5, barcode: "8901052202", sku: "MET-1K-TAB", status: "Available", quantity_type: "strip" },
    { name: "Glibenclamide 5mg Tablets (10s)", category: "Diabetes Adjunct", price: 12.00, tax_percent: 5, barcode: "8901052203", sku: "GLB-5-TAB", status: "Available", quantity_type: "strip" },
    { name: "Sitagliptin 50mg Tablets (7s)", category: "Diabetes Adjunct", price: 245.00, tax_percent: 5, barcode: "8901052204", sku: "SIT-50-7", status: "Available", quantity_type: "strip" },
    { name: "Sitagliptin 100mg Tablets (7s)", category: "Diabetes Adjunct", price: 385.00, tax_percent: 5, barcode: "8901052205", sku: "SIT-100-7", status: "Available", quantity_type: "strip" },

    // ---- Cardiovascular Adjunct (GST: 5%) ----
    { name: "Atorvastatin 10mg Tablets (10s)", category: "Cardiovascular", price: 28.00, tax_percent: 5, barcode: "8901052301", sku: "ATV-10-TAB", status: "Available", quantity_type: "strip" },
    { name: "Atorvastatin 20mg Tablets (10s)", category: "Cardiovascular", price: 42.00, tax_percent: 5, barcode: "8901052302", sku: "ATV-20-TAB", status: "Available", quantity_type: "strip" },
    { name: "Atorvastatin 40mg Tablets (10s)", category: "Cardiovascular", price: 65.00, tax_percent: 5, barcode: "8901052303", sku: "ATV-40-TAB", status: "Available", quantity_type: "strip" },
    { name: "Amlodipine 5mg Tablets (10s)", category: "Cardiovascular", price: 18.00, tax_percent: 5, barcode: "8901052304", sku: "AML-5-TAB", status: "Available", quantity_type: "strip" },
    { name: "Amlodipine 10mg Tablets (10s)", category: "Cardiovascular", price: 28.00, tax_percent: 5, barcode: "8901052305", sku: "AML-10-TAB", status: "Available", quantity_type: "strip" },
    { name: "Telmisartan 40mg Tablets (10s)", category: "Cardiovascular", price: 48.00, tax_percent: 5, barcode: "8901052306", sku: "TEL-40-TAB", status: "Available", quantity_type: "strip" },
    { name: "Telmisartan 80mg Tablets (10s)", category: "Cardiovascular", price: 72.00, tax_percent: 5, barcode: "8901052307", sku: "TEL-80-TAB", status: "Available", quantity_type: "strip" },

    // ---- Protein Supplements (GST: 18%) ----
    { name: "Whey Protein 1kg (Unflavoured)", category: "Protein Supplements", price: 1800.00, tax_percent: 18, barcode: "8901052401", sku: "WHY-1K-UNF", status: "Available", quantity_type: "pcs" },
    { name: "Mass Protein Powder 2kg (Chocolate)", category: "Protein Supplements", price: 1250.00, tax_percent: 18, barcode: "8901052402", sku: "MSS-2K-CHO", status: "Available", quantity_type: "pcs" },
    { name: "Casein Protein 1kg (Vanilla)", category: "Protein Supplements", price: 2100.00, tax_percent: 18, barcode: "8901052403", sku: "CAS-1K-VAN", status: "Available", quantity_type: "pcs" },
    { name: "Pea Protein 1kg (Plain)", category: "Protein Supplements", price: 1350.00, tax_percent: 18, barcode: "8901052404", sku: "PEA-1K-PLN", status: "Available", quantity_type: "pcs" },
    { name: "Ensure Nutrition Powder 400g (Vanilla)", category: "Protein Supplements", price: 650.00, tax_percent: 18, barcode: "8901052405", sku: "ENS-400-VAN", status: "Available", quantity_type: "pcs" },
    { name: "Protinex Original 500g", category: "Protein Supplements", price: 550.00, tax_percent: 18, barcode: "8901052406", sku: "PRO-ORG-500", status: "Available", quantity_type: "pcs" },

    // ---- Miscellaneous Ortho Pharmacy Items ----
    { name: "Paraffinic Oil / Orthowax (500g)", category: "Miscellaneous", price: 280.00, tax_percent: 12, barcode: "8901052501", sku: "PRF-OIL-500", status: "Available", quantity_type: "pcs" },
    { name: "Plaster of Paris (POP) Bandage 15cm", category: "Miscellaneous", price: 65.00, tax_percent: 12, barcode: "8901052502", sku: "POP-15", status: "Available", quantity_type: "pcs" },
    { name: "Fibre Glass Cast Roll (3 inch)", category: "Miscellaneous", price: 145.00, tax_percent: 12, barcode: "8901052503", sku: "FBG-3IN", status: "Available", quantity_type: "pcs" },
    { name: "Stockinette Bandage 10cm x 10m", category: "Miscellaneous", price: 85.00, tax_percent: 12, barcode: "8901052504", sku: "STK-10-10M", status: "Available", quantity_type: "pcs" },
    { name: "Skin Stapler (35 staples)", category: "Miscellaneous", price: 185.00, tax_percent: 12, barcode: "8901052505", sku: "SKN-STP-35", status: "Available", quantity_type: "pcs" },
    { name: "Skin Staple Remover", category: "Miscellaneous", price: 65.00, tax_percent: 12, barcode: "8901052506", sku: "SKN-RMVR", status: "Available", quantity_type: "pcs" },
    { name: "Sterile Disposable Gloves (Medium, 50 pairs)", category: "Miscellaneous", price: 250.00, tax_percent: 12, barcode: "8901052507", sku: "GLV-M-50", status: "Available", quantity_type: "pack" },
    { name: "Sterile Syringes 2mL (10s)", category: "Miscellaneous", price: 35.00, tax_percent: 12, barcode: "8901052508", sku: "SYR-2ML-10", status: "Available", quantity_type: "pack" },
    { name: "Sterile Syringes 5mL (10s)", category: "Miscellaneous", price: 42.00, tax_percent: 12, barcode: "8901052509", sku: "SYR-5ML-10", status: "Available", quantity_type: "pack" },
    { name: "IV Cannula 20G (10s)", category: "Miscellaneous", price: 95.00, tax_percent: 12, barcode: "8901052510", sku: "CAN-20G-10", status: "Available", quantity_type: "pack" },
    { name: "IV Infusion Set (10s)", category: "Miscellaneous", price: 120.00, tax_percent: 12, barcode: "8901052511", sku: "IVS-10", status: "Available", quantity_type: "pack" },
    { name: "Normal Saline 0.9% 500mL IV Bag", category: "Miscellaneous", price: 55.00, tax_percent: 0, barcode: "8901052512", sku: "NS-09-500", status: "Available", quantity_type: "pcs" },
    { name: "Ringer's Lactate 500mL IV Bag", category: "Miscellaneous", price: 65.00, tax_percent: 0, barcode: "8901052513", sku: "RL-500-IV", status: "Available", quantity_type: "pcs" },
    { name: "Dextrose 5% in Water 500mL IV Bag", category: "Miscellaneous", price: 55.00, tax_percent: 0, barcode: "8901052514", sku: "D5W-500-IV", status: "Available", quantity_type: "pcs" },
    { name: "Micropore Tape 1.25cm x 9.1m", category: "Miscellaneous", price: 38.00, tax_percent: 12, barcode: "8901052515", sku: "MCP-125-9", status: "Available", quantity_type: "pcs" },
    { name: "Cotton Roll 500g", category: "Miscellaneous", price: 95.00, tax_percent: 12, barcode: "8901052516", sku: "CTN-500G", status: "Available", quantity_type: "pcs" },
    { name: "Thermometer (Digital)", category: "Miscellaneous", price: 185.00, tax_percent: 12, barcode: "8901052517", sku: "THM-DIG", status: "Available", quantity_type: "pcs" },
    { name: "Pulse Oximeter (Finger Type)", category: "Miscellaneous", price: 650.00, tax_percent: 12, barcode: "8901052518", sku: "PLX-FNG", status: "Available", quantity_type: "pcs" },
    { name: "Blood Pressure Monitor (Automatic)", category: "Miscellaneous", price: 1850.00, tax_percent: 12, barcode: "8901052519", sku: "BPM-AUT", status: "Available", quantity_type: "pcs" },

    // ---- Extended Ortho Pharmacy Formulations & Surgical Range ----
    { name: "Ketorolac Tromethamine 10mg DT Tablets (10s)", category: "NSAIDs", price: 85.00, tax_percent: 5, barcode: "8901052601", sku: "KTR-10-DT", status: "Available", quantity_type: "strip" },
    { name: "Ketorolac 30mg/mL IM/IV Injection (1mL)", category: "Injectables", price: 42.00, tax_percent: 5, barcode: "8901052602", sku: "KTR-30-INJ", status: "Available", quantity_type: "pcs" },
    { name: "Dexketoprofen 25mg Tablets (10s)", category: "NSAIDs", price: 95.00, tax_percent: 5, barcode: "8901052603", sku: "DXK-25-TAB", status: "Available", quantity_type: "strip" },
    { name: "Lornoxicam 4mg Tablets (10s)", category: "NSAIDs", price: 48.00, tax_percent: 5, barcode: "8901052604", sku: "LRN-4-TAB", status: "Available", quantity_type: "strip" },
    { name: "Lornoxicam 8mg + Thiocolchicoside 4mg Tablets (10s)", category: "Combination Analgesics", price: 135.00, tax_percent: 5, barcode: "8901052605", sku: "LRN-THC-4", status: "Available", quantity_type: "strip" },
    { name: "Lornoxicam 8mg + Thiocolchicoside 8mg Tablets (10s)", category: "Combination Analgesics", price: 175.00, tax_percent: 5, barcode: "8901052606", sku: "LRN-THC-8", status: "Available", quantity_type: "strip" },
    { name: "Etodolac 300mg Tablets (10s)", category: "NSAIDs", price: 88.00, tax_percent: 5, barcode: "8901052607", sku: "ETD-300-TAB", status: "Available", quantity_type: "strip" },
    { name: "Etodolac 400mg + Thiocolchicoside 4mg Tablets (10s)", category: "Combination Analgesics", price: 165.00, tax_percent: 5, barcode: "8901052608", sku: "ETD-THC-4", status: "Available", quantity_type: "strip" },
    { name: "Etodolac 600mg ER Tablets (10s)", category: "NSAIDs", price: 145.00, tax_percent: 5, barcode: "8901052609", sku: "ETD-600-ER", status: "Available", quantity_type: "strip" },
    { name: "Paracetamol 1000mg/100mL IV Infusion Bag", category: "Analgesics", price: 110.00, tax_percent: 5, barcode: "8901052610", sku: "PCM-1K-IV", status: "Available", quantity_type: "pcs" },
    { name: "Paracetamol 150mg/mL Injection (2mL)", category: "Analgesics", price: 18.00, tax_percent: 5, barcode: "8901052611", sku: "PCM-150-INJ", status: "Available", quantity_type: "pcs" },
    { name: "Aceclofenac 100mg + Paracetamol 325mg + Serratiopeptidase 15mg Tablets (10s)", category: "Combination Analgesics", price: 85.00, tax_percent: 5, barcode: "8901052612", sku: "ACE-PCM-SRT", status: "Available", quantity_type: "strip" },
    { name: "Diclofenac 50mg + Paracetamol 325mg + Serratiopeptidase 10mg Tablets (10s)", category: "Combination Analgesics", price: 75.00, tax_percent: 5, barcode: "8901052613", sku: "DCF-PCM-SRT", status: "Available", quantity_type: "strip" },
    { name: "Flupirtine Maleate 100mg Capsules (10s)", category: "Analgesics", price: 120.00, tax_percent: 5, barcode: "8901052614", sku: "FLP-100-CAP", status: "Available", quantity_type: "strip" },
    { name: "Tapentadol 50mg Tablets (10s)", category: "Analgesics", price: 130.00, tax_percent: 5, barcode: "8901052615", sku: "TAP-50-TAB", status: "Available", quantity_type: "strip" },
    { name: "Tapentadol 75mg Tablets (10s)", category: "Analgesics", price: 185.00, tax_percent: 5, barcode: "8901052616", sku: "TAP-75-TAB", status: "Available", quantity_type: "strip" },
    { name: "Tapentadol 100mg Tablets (10s)", category: "Analgesics", price: 240.00, tax_percent: 5, barcode: "8901052617", sku: "TAP-100-TAB", status: "Available", quantity_type: "strip" },
    { name: "Tramadol 37.5mg + Paracetamol 325mg Tablets (10s)", category: "Combination Analgesics", price: 82.00, tax_percent: 5, barcode: "8901052618", sku: "TRM-PCM-TAB", status: "Available", quantity_type: "strip" },
    { name: "Tramadol 50mg/mL Injection (2mL ampoule)", category: "Injectables", price: 32.00, tax_percent: 5, barcode: "8901052619", sku: "TRM-50-INJ", status: "Available", quantity_type: "pcs" },
    { name: "Teriparatide 750mcg/3mL Prefilled Pen", category: "Osteoporosis", price: 6500.00, tax_percent: 5, barcode: "8901052620", sku: "TER-750-PEN", status: "Available", quantity_type: "pcs" },
    { name: "Denosumab 60mg/mL Prefilled Syringe", category: "Osteoporosis", price: 7800.00, tax_percent: 5, barcode: "8901052621", sku: "DEN-60-PFS", status: "Available", quantity_type: "pcs" },
    { name: "Zoledronic Acid 5mg/100mL Infusion Bottle", category: "Osteoporosis", price: 2450.00, tax_percent: 5, barcode: "8901052622", sku: "ZOL-5MG-INF", status: "Available", quantity_type: "pcs" },
    { name: "Zoledronic Acid 4mg/5mL Vial", category: "Osteoporosis", price: 1850.00, tax_percent: 5, barcode: "8901052623", sku: "ZOL-4MG-VIA", status: "Available", quantity_type: "pcs" },
    { name: "Ibandronic Acid 150mg Tablets (1s)", category: "Osteoporosis", price: 380.00, tax_percent: 5, barcode: "8901052624", sku: "IBN-150-TAB", status: "Available", quantity_type: "pcs" },
    { name: "Ibandronic Acid 3mg/3mL Injection", category: "Osteoporosis", price: 1150.00, tax_percent: 5, barcode: "8901052625", sku: "IBN-3MG-INJ", status: "Available", quantity_type: "pcs" },
    { name: "Alendronate Sodium 70mg Tablets (4s)", category: "Osteoporosis", price: 160.00, tax_percent: 5, barcode: "8901052626", sku: "ALN-70-4S", status: "Available", quantity_type: "pack" },
    { name: "Alendronate 70mg + Cholecalciferol 5600IU Tablets (4s)", category: "Osteoporosis", price: 210.00, tax_percent: 5, barcode: "8901052627", sku: "ALN-D3-4S", status: "Available", quantity_type: "pack" },
    { name: "Raloxifene 60mg Tablets (10s)", category: "Osteoporosis", price: 195.00, tax_percent: 5, barcode: "8901052628", sku: "RLX-60-TAB", status: "Available", quantity_type: "strip" },
    { name: "Calcitonin Salmon Nasal Spray 200IU (2mL)", category: "Osteoporosis", price: 1450.00, tax_percent: 5, barcode: "8901052629", sku: "CLC-200-NS", status: "Available", quantity_type: "pcs" },
    { name: "Calcium Citrate Malate + Vit D3 + Vit K2-7 + Magnesium Tablets (15s)", category: "Bone Supplements", price: 225.00, tax_percent: 18, barcode: "8901052630", sku: "CCM-K2-15", status: "Available", quantity_type: "strip" },
    { name: "Cissus Quadrangularis 500mg (Hadjod) Capsules (60s)", category: "Bone Supplements", price: 350.00, tax_percent: 18, barcode: "8901052631", sku: "CSQ-500-60", status: "Available", quantity_type: "pack" },
    { name: "Calcium Carbonate 1250mg + Vit D3 250IU Tablets (15s)", category: "Bone Supplements", price: 118.00, tax_percent: 12, barcode: "8901052632", sku: "SHL-500-15", status: "Available", quantity_type: "strip" },
    { name: "Cholecalciferol 60,000 IU Oral Solution Nano Shots (4 x 5mL)", category: "Bone Supplements", price: 290.00, tax_percent: 12, barcode: "8901052633", sku: "D3-NANO-4S", status: "Available", quantity_type: "pack" },
    { name: "Cholecalciferol 600,000 IU/mL IM Injection", category: "Injectables", price: 145.00, tax_percent: 5, barcode: "8901052634", sku: "D3-6L-INJ", status: "Available", quantity_type: "pcs" },
    { name: "Coral Calcium 500mg Capsules (30s)", category: "Bone Supplements", price: 380.00, tax_percent: 18, barcode: "8901052635", sku: "CRL-500-30", status: "Available", quantity_type: "pack" },
    { name: "Undenatured Type II Collagen (UC-II) 40mg Capsules (30s)", category: "Bone Supplements", price: 850.00, tax_percent: 18, barcode: "8901052636", sku: "UC2-40-30", status: "Available", quantity_type: "pack" },
    { name: "Type I & III Collagen Peptide 10g Sachets (10s)", category: "Bone Supplements", price: 550.00, tax_percent: 18, barcode: "8901052637", sku: "COL-PEP-10S", status: "Available", quantity_type: "pack" },
    { name: "Sodium Hyaluronate Intra-Articular 20mg/2mL Syringe", category: "Injectables", price: 2800.00, tax_percent: 12, barcode: "8901052638", sku: "HYA-20-2ML", status: "Available", quantity_type: "pcs" },
    { name: "High Molecular Weight Cross-linked Hyaluronic Acid 88mg/4mL (Single Shot Knee)", category: "Injectables", price: 8900.00, tax_percent: 12, barcode: "8901052639", sku: "HYA-88-4ML", status: "Available", quantity_type: "pcs" },
    { name: "Glucosamine Sulfate 1500mg + Chondroitin 1200mg Effervescent Sachets (10s)", category: "Bone Supplements", price: 420.00, tax_percent: 18, barcode: "8901052640", sku: "GLC-CHD-10S", status: "Available", quantity_type: "pack" },
    { name: "Diacerein 50mg + Glucosamine 750mg + MSM 250mg Tablets (10s)", category: "Bone Supplements", price: 195.00, tax_percent: 18, barcode: "8901052641", sku: "DIA-GLC-MSM", status: "Available", quantity_type: "strip" },
    { name: "Rosehip Extract 550mg Capsules (30s)", category: "Bone Supplements", price: 450.00, tax_percent: 18, barcode: "8901052642", sku: "RSH-550-30", status: "Available", quantity_type: "pack" },
    { name: "Curcumin 95% 500mg + Piperine 5mg Anti-inflammatory Capsules (60s)", category: "Bone Supplements", price: 490.00, tax_percent: 18, barcode: "8901052643", sku: "CUR-500-60", status: "Available", quantity_type: "pack" },
    { name: "Boswellia Serrata 400mg (Shallaki) Capsules (60s)", category: "Bone Supplements", price: 320.00, tax_percent: 18, barcode: "8901052644", sku: "BSW-400-60", status: "Available", quantity_type: "pack" },
    { name: "Platelet-Rich Plasma (PRP) Ortho Separation Kit (Single Use)", category: "Miscellaneous", price: 1650.00, tax_percent: 12, barcode: "8901052645", sku: "PRP-KIT-1S", status: "Available", quantity_type: "pcs" },
    { name: "Tendon Healing Peptide Complex Capsules (10s)", category: "Bone Supplements", price: 360.00, tax_percent: 18, barcode: "8901052646", sku: "TDN-PEP-10", status: "Available", quantity_type: "strip" },
    { name: "Pregabalin 50mg Capsules (10s)", category: "Neuropathy", price: 75.00, tax_percent: 5, barcode: "8901052647", sku: "PRG-50-CAP", status: "Available", quantity_type: "strip" },
    { name: "Pregabalin 75mg + Methylcobalamin 750mcg Capsules (10s)", category: "Neuropathy", price: 125.00, tax_percent: 5, barcode: "8901052648", sku: "PRG-MCO-75", status: "Available", quantity_type: "strip" },
    { name: "Pregabalin 75mg + Nortriptyline 10mg Tablets (10s)", category: "Neuropathy", price: 140.00, tax_percent: 5, barcode: "8901052649", sku: "PRG-NOR-75", status: "Available", quantity_type: "strip" },
    { name: "Pregabalin 75mg + Duloxetine 20mg Capsules (10s)", category: "Neuropathy", price: 165.00, tax_percent: 5, barcode: "8901052650", sku: "PRG-DUL-75", status: "Available", quantity_type: "strip" },
    { name: "Gabapentin 100mg Tablets (10s)", category: "Neuropathy", price: 68.00, tax_percent: 5, barcode: "8901052651", sku: "GBP-100-TAB", status: "Available", quantity_type: "strip" },
    { name: "Gabapentin 300mg Tablets (10s)", category: "Neuropathy", price: 120.00, tax_percent: 5, barcode: "8901052652", sku: "GBP-300-TAB", status: "Available", quantity_type: "strip" },
    { name: "Gabapentin 300mg + Methylcobalamin 500mcg Tablets (10s)", category: "Neuropathy", price: 155.00, tax_percent: 5, barcode: "8901052653", sku: "GBP-MCO-300", status: "Available", quantity_type: "strip" },
    { name: "Duloxetine 20mg Gastro-resistant Tablets (10s)", category: "Neuropathy", price: 95.00, tax_percent: 5, barcode: "8901052654", sku: "DUL-20-TAB", status: "Available", quantity_type: "strip" },
    { name: "Duloxetine 30mg Gastro-resistant Tablets (10s)", category: "Neuropathy", price: 135.00, tax_percent: 5, barcode: "8901052655", sku: "DUL-30-TAB", status: "Available", quantity_type: "strip" },
    { name: "Duloxetine 60mg Gastro-resistant Tablets (10s)", category: "Neuropathy", price: 210.00, tax_percent: 5, barcode: "8901052656", sku: "DUL-60-TAB", status: "Available", quantity_type: "strip" },
    { name: "Amitriptyline 10mg Tablets (10s)", category: "Neuropathy", price: 25.00, tax_percent: 5, barcode: "8901052657", sku: "AMT-10-TAB", status: "Available", quantity_type: "strip" },
    { name: "Amitriptyline 25mg Tablets (10s)", category: "Neuropathy", price: 42.00, tax_percent: 5, barcode: "8901052658", sku: "AMT-25-TAB", status: "Available", quantity_type: "strip" },
    { name: "Palmitoylethanolamide (PEA) 300mg Capsules (30s)", category: "Neuropathy", price: 580.00, tax_percent: 18, barcode: "8901052659", sku: "PEA-300-30", status: "Available", quantity_type: "pack" },
    { name: "Alpha Lipoic Acid 200mg + Benfotiamine 100mg Capsules (10s)", category: "Neuropathy", price: 165.00, tax_percent: 18, barcode: "8901052660", sku: "ALA-BNF-10", status: "Available", quantity_type: "strip" },
    { name: "Methylcobalamin 1500mcg + Vit B6 3mg + Folic Acid 1.5mg Tablets (15s)", category: "Neuropathy", price: 145.00, tax_percent: 18, barcode: "8901052661", sku: "MCO-B6-15", status: "Available", quantity_type: "strip" },
    { name: "Mecobalamin 1000mcg/2mL IM/IV Injection (5 Ampoules)", category: "Injectables", price: 125.00, tax_percent: 5, barcode: "8901052662", sku: "MCO-1K-INJ", status: "Available", quantity_type: "pack" },
    { name: "Cefuroxime Axetil 250mg Tablets (10s)", category: "Antibiotics", price: 185.00, tax_percent: 5, barcode: "8901052663", sku: "CFR-250-TAB", status: "Available", quantity_type: "strip" },
    { name: "Cefuroxime Axetil 500mg Tablets (10s)", category: "Antibiotics", price: 340.00, tax_percent: 5, barcode: "8901052664", sku: "CFR-500-TAB", status: "Available", quantity_type: "strip" },
    { name: "Cefuroxime 750mg IV/IM Injection", category: "Antibiotics", price: 95.00, tax_percent: 5, barcode: "8901052665", sku: "CFR-750-INJ", status: "Available", quantity_type: "pcs" },
    { name: "Cefuroxime 1.5g IV Injection", category: "Antibiotics", price: 175.00, tax_percent: 5, barcode: "8901052666", sku: "CFR-15G-INJ", status: "Available", quantity_type: "pcs" },
    { name: "Amoxicillin 500mg + Clavulanic Acid 125mg Tablets (10s)", category: "Antibiotics", price: 210.00, tax_percent: 5, barcode: "8901052667", sku: "AMX-625-TAB", status: "Available", quantity_type: "strip" },
    { name: "Amoxicillin 875mg + Clavulanic Acid 125mg Tablets (6s)", category: "Antibiotics", price: 185.00, tax_percent: 5, barcode: "8901052668", sku: "AMX-1K-TAB", status: "Available", quantity_type: "strip" },
    { name: "Amoxicillin + Clavulanate 1.2g IV Injection", category: "Antibiotics", price: 145.00, tax_percent: 5, barcode: "8901052669", sku: "AMX-12G-INJ", status: "Available", quantity_type: "pcs" },
    { name: "Cefoperazone 1000mg + Sulbactam 500mg IV Injection", category: "Antibiotics", price: 260.00, tax_percent: 5, barcode: "8901052670", sku: "CFP-SLB-15G", status: "Available", quantity_type: "pcs" },
    { name: "Piperacillin 4g + Tazobactam 0.5g IV Infusion", category: "Antibiotics", price: 380.00, tax_percent: 5, barcode: "8901052671", sku: "PIP-TAZ-45G", status: "Available", quantity_type: "pcs" },
    { name: "Meropenem 1000mg IV Injection", category: "Antibiotics", price: 850.00, tax_percent: 5, barcode: "8901052672", sku: "MER-1K-INJ", status: "Available", quantity_type: "pcs" },
    { name: "Vancomycin 500mg IV Infusion", category: "Antibiotics", price: 290.00, tax_percent: 5, barcode: "8901052673", sku: "VAN-500-INJ", status: "Available", quantity_type: "pcs" },
    { name: "Vancomycin 1000mg IV Infusion", category: "Antibiotics", price: 520.00, tax_percent: 5, barcode: "8901052674", sku: "VAN-1K-INJ", status: "Available", quantity_type: "pcs" },
    { name: "Teicoplanin 200mg IV/IM Injection", category: "Antibiotics", price: 850.00, tax_percent: 5, barcode: "8901052675", sku: "TEI-200-INJ", status: "Available", quantity_type: "pcs" },
    { name: "Teicoplanin 400mg IV/IM Injection", category: "Antibiotics", price: 1450.00, tax_percent: 5, barcode: "8901052676", sku: "TEI-400-INJ", status: "Available", quantity_type: "pcs" },
    { name: "Linezolid 600mg Tablets (10s)", category: "Antibiotics", price: 320.00, tax_percent: 5, barcode: "8901052677", sku: "LNZ-600-TAB", status: "Available", quantity_type: "strip" },
    { name: "Linezolid 600mg/300mL IV Infusion", category: "Antibiotics", price: 280.00, tax_percent: 5, barcode: "8901052678", sku: "LNZ-600-IV", status: "Available", quantity_type: "pcs" },
    { name: "Clindamycin 300mg Capsules (10s)", category: "Antibiotics", price: 175.00, tax_percent: 5, barcode: "8901052679", sku: "CLI-300-CAP", status: "Available", quantity_type: "strip" },
    { name: "Clindamycin 600mg/4mL Injection", category: "Antibiotics", price: 165.00, tax_percent: 5, barcode: "8901052680", sku: "CLI-600-INJ", status: "Available", quantity_type: "pcs" },
    { name: "Faropenem 200mg Tablets (6s)", category: "Antibiotics", price: 420.00, tax_percent: 5, barcode: "8901052681", sku: "FAR-200-6S", status: "Available", quantity_type: "strip" },
    { name: "Enoxaparin 40mg/0.4mL Prefilled Syringe", category: "Anticoagulants", price: 450.00, tax_percent: 5, barcode: "8901052682", sku: "ENO-40-PFS", status: "Available", quantity_type: "pcs" },
    { name: "Enoxaparin 60mg/0.6mL Prefilled Syringe", category: "Anticoagulants", price: 590.00, tax_percent: 5, barcode: "8901052683", sku: "ENO-60-PFS", status: "Available", quantity_type: "pcs" },
    { name: "Dalteparin Sodium 5000 IU/0.2mL Syringe", category: "Anticoagulants", price: 520.00, tax_percent: 5, barcode: "8901052684", sku: "DAL-5K-PFS", status: "Available", quantity_type: "pcs" },
    { name: "Fondaparinux Sodium 2.5mg/0.5mL Syringe", category: "Anticoagulants", price: 680.00, tax_percent: 5, barcode: "8901052685", sku: "FON-25-PFS", status: "Available", quantity_type: "pcs" },
    { name: "Rivaroxaban 10mg Tablets (10s)", category: "Anticoagulants", price: 290.00, tax_percent: 5, barcode: "8901052686", sku: "RIV-10-TAB", status: "Available", quantity_type: "strip" },
    { name: "Rivaroxaban 15mg Tablets (10s)", category: "Anticoagulants", price: 380.00, tax_percent: 5, barcode: "8901052687", sku: "RIV-15-TAB", status: "Available", quantity_type: "strip" },
    { name: "Rivaroxaban 20mg Tablets (10s)", category: "Anticoagulants", price: 440.00, tax_percent: 5, barcode: "8901052688", sku: "RIV-20-TAB", status: "Available", quantity_type: "strip" },
    { name: "Apixaban 2.5mg Tablets (10s)", category: "Anticoagulants", price: 310.00, tax_percent: 5, barcode: "8901052689", sku: "API-25-TAB", status: "Available", quantity_type: "strip" },
    { name: "Apixaban 5mg Tablets (10s)", category: "Anticoagulants", price: 460.00, tax_percent: 5, barcode: "8901052690", sku: "API-5-TAB", status: "Available", quantity_type: "strip" },
    { name: "Dabigatran Etexilate 110mg Capsules (10s)", category: "Anticoagulants", price: 380.00, tax_percent: 5, barcode: "8901052691", sku: "DAB-110-CAP", status: "Available", quantity_type: "strip" },
    { name: "Dabigatran Etexilate 150mg Capsules (10s)", category: "Anticoagulants", price: 440.00, tax_percent: 5, barcode: "8901052692", sku: "DAB-150-CAP", status: "Available", quantity_type: "strip" },
    { name: "Aspirin 75mg Gastro-Resistant Tablets (14s)", category: "Anticoagulants", price: 12.00, tax_percent: 5, barcode: "8901052693", sku: "ASP-75-TAB", status: "Available", quantity_type: "strip" },
    { name: "Aspirin 150mg Gastro-Resistant Tablets (14s)", category: "Anticoagulants", price: 18.00, tax_percent: 5, barcode: "8901052694", sku: "ASP-150-TAB", status: "Available", quantity_type: "strip" },
    { name: "Febuxostat 40mg Tablets (10s)", category: "Gout Medications", price: 95.00, tax_percent: 5, barcode: "8901052695", sku: "FBX-40-TAB", status: "Available", quantity_type: "strip" },
    { name: "Febuxostat 80mg Tablets (10s)", category: "Gout Medications", price: 165.00, tax_percent: 5, barcode: "8901052696", sku: "FBX-80-TAB", status: "Available", quantity_type: "strip" },
    { name: "Allopurinol 100mg Tablets (10s)", category: "Gout Medications", price: 25.00, tax_percent: 5, barcode: "8901052697", sku: "ALP-100-TAB", status: "Available", quantity_type: "strip" },
    { name: "Allopurinol 300mg Tablets (10s)", category: "Gout Medications", price: 55.00, tax_percent: 5, barcode: "8901052698", sku: "ALP-300-TAB", status: "Available", quantity_type: "strip" },
    { name: "Colchicine 0.5mg Tablets (10s)", category: "Gout Medications", price: 48.00, tax_percent: 5, barcode: "8901052699", sku: "COL-05-TAB", status: "Available", quantity_type: "strip" },
    { name: "Potassium Citrate + Citric Acid Oral Solution 200mL", category: "Gout Medications", price: 165.00, tax_percent: 5, barcode: "8901052700", sku: "POT-CIT-200", status: "Available", quantity_type: "pcs" },
    { name: "Taylor's TLSO Brace (Thoracolumbosacral Orthosis) - Large", category: "Ortho Supports", price: 1850.00, tax_percent: 12, barcode: "8901052701", sku: "TYL-BRC-L", status: "Available", quantity_type: "pcs" },
    { name: "Taylor's TLSO Brace (Thoracolumbosacral Orthosis) - Medium", category: "Ortho Supports", price: 1800.00, tax_percent: 12, barcode: "8901052702", sku: "TYL-BRC-M", status: "Available", quantity_type: "pcs" },
    { name: "Philadelphia Cervical Collar (Rigid with Trachea opening)", category: "Ortho Supports", price: 650.00, tax_percent: 12, barcode: "8901052703", sku: "PHL-CLR-ML", status: "Available", quantity_type: "pcs" },
    { name: "Hard Cervical Collar with Chin Support - Medium", category: "Ortho Supports", price: 380.00, tax_percent: 12, barcode: "8901052704", sku: "HRD-CLR-M", status: "Available", quantity_type: "pcs" },
    { name: "Contoured LS Lumbar Sacro Belt with Double Pull Straps - Large", category: "Ortho Supports", price: 580.00, tax_percent: 12, barcode: "8901052705", sku: "CNT-LSB-L", status: "Available", quantity_type: "pcs" },
    { name: "Contoured LS Lumbar Sacro Belt with Double Pull Straps - XL", category: "Ortho Supports", price: 620.00, tax_percent: 12, barcode: "8901052706", sku: "CNT-LSB-XL", status: "Available", quantity_type: "pcs" },
    { name: "Hyperextension (ASH) Spinal Brace", category: "Ortho Supports", price: 2200.00, tax_percent: 12, barcode: "8901052707", sku: "ASH-SPN-BRC", status: "Available", quantity_type: "pcs" },
    { name: "Knee Immobilizer 19 inch (Universal)", category: "Ortho Supports", price: 750.00, tax_percent: 12, barcode: "8901052708", sku: "KNE-IMB-19", status: "Available", quantity_type: "pcs" },
    { name: "Functional ROM Hinged Knee Brace (Post-Op ACL/PCL)", category: "Ortho Supports", price: 2400.00, tax_percent: 12, barcode: "8901052709", sku: "ROM-HNG-KNE", status: "Available", quantity_type: "pcs" },
    { name: "Neoprene Hinged Knee Support Wrap - Large", category: "Ortho Supports", price: 850.00, tax_percent: 12, barcode: "8901052710", sku: "NPR-KNE-L", status: "Available", quantity_type: "pcs" },
    { name: "Patellar Tendon Knee Strap (Runner's Knee)", category: "Ortho Supports", price: 290.00, tax_percent: 12, barcode: "8901052711", sku: "PTL-STR-KNE", status: "Available", quantity_type: "pcs" },
    { name: "Air-Gel Ankle Stirrup Brace", category: "Ortho Supports", price: 780.00, tax_percent: 12, barcode: "8901052712", sku: "AIR-GEL-ANK", status: "Available", quantity_type: "pcs" },
    { name: "Rigid AFO Ankle Foot Orthosis (Left)", category: "Ortho Supports", price: 1100.00, tax_percent: 12, barcode: "8901052713", sku: "AFO-LFT-UNV", status: "Available", quantity_type: "pcs" },
    { name: "Rigid AFO Ankle Foot Orthosis (Right)", category: "Ortho Supports", price: 1100.00, tax_percent: 12, barcode: "8901052714", sku: "AFO-RGT-UNV", status: "Available", quantity_type: "pcs" },
    { name: "Cock-up Wrist Splint with Palmar Stay (Right)", category: "Ortho Supports", price: 340.00, tax_percent: 12, barcode: "8901052715", sku: "CKP-WST-R", status: "Available", quantity_type: "pcs" },
    { name: "Cock-up Wrist Splint with Palmar Stay (Left)", category: "Ortho Supports", price: 340.00, tax_percent: 12, barcode: "8901052716", sku: "CKP-WST-L", status: "Available", quantity_type: "pcs" },
    { name: "Thumb Spica Splint (De Quervain's Tenosynovitis)", category: "Ortho Supports", price: 380.00, tax_percent: 12, barcode: "8901052717", sku: "THM-SPC-SPL", status: "Available", quantity_type: "pcs" },
    { name: "Mallet Finger Splint (Aluminium Padded)", category: "Ortho Supports", price: 85.00, tax_percent: 12, barcode: "8901052718", sku: "MLT-FNG-SPL", status: "Available", quantity_type: "pcs" },
    { name: "Frog Finger Splint (Aluminium) - Large", category: "Ortho Supports", price: 65.00, tax_percent: 12, barcode: "8901052719", sku: "FRG-FNG-L", status: "Available", quantity_type: "pcs" },
    { name: "Tennis Elbow Strap with Silicone Pressure Pad", category: "Ortho Supports", price: 280.00, tax_percent: 12, barcode: "8901052720", sku: "TNS-ELB-STP", status: "Available", quantity_type: "pcs" },
    { name: "Clavicle Brace with Hook & Loop Fasteners - Medium", category: "Ortho Supports", price: 420.00, tax_percent: 12, barcode: "8901052721", sku: "CLV-BRC-M", status: "Available", quantity_type: "pcs" },
    { name: "Clavicle Brace with Hook & Loop Fasteners - Large", category: "Ortho Supports", price: 440.00, tax_percent: 12, barcode: "8901052722", sku: "CLV-BRC-L", status: "Available", quantity_type: "pcs" },
    { name: "Shoulder Immobilizer Deluxe Envelope Sling", category: "Ortho Supports", price: 380.00, tax_percent: 12, barcode: "8901052723", sku: "SHL-IMB-SLG", status: "Available", quantity_type: "pcs" },
    { name: "Rib Belt for Chest Trauma / Fracture - Universal", category: "Ortho Supports", price: 360.00, tax_percent: 12, barcode: "8901052724", sku: "RIB-BLT-UNV", status: "Available", quantity_type: "pcs" },
    { name: "Sacroiliac (SI) Joint Pelvic Belt", category: "Ortho Supports", price: 520.00, tax_percent: 12, barcode: "8901052725", sku: "SI-PLV-BLT", status: "Available", quantity_type: "pcs" },
    { name: "Silicone Medical Arch Supports (Pair)", category: "Ortho Supports", price: 420.00, tax_percent: 12, barcode: "8901052726", sku: "SIL-ARC-SUP", status: "Available", quantity_type: "pack" },
    { name: "Silicone Heel Cups for Plantar Fasciitis (Pair)", category: "Ortho Supports", price: 350.00, tax_percent: 12, barcode: "8901052727", sku: "SIL-HEL-CUP", status: "Available", quantity_type: "pack" },
    { name: "Bunion Corrector & Night Splint (Hallux Valgus)", category: "Ortho Supports", price: 480.00, tax_percent: 12, barcode: "8901052728", sku: "BUN-COR-SPL", status: "Available", quantity_type: "pcs" },
    { name: "Forearm Ergonomic Elbow Crutches (Pair, Height Adjustable)", category: "Ortho Supports", price: 1250.00, tax_percent: 12, barcode: "8901052729", sku: "FRM-CRT-ADJ", status: "Available", quantity_type: "pack" },
    { name: "Underarm Aluminium Axillary Crutches (Pair, Adult)", category: "Ortho Supports", price: 950.00, tax_percent: 12, barcode: "8901052730", sku: "UND-AXL-CRT", status: "Available", quantity_type: "pack" },
    { name: "Quadripod Walking Stick (Wide Base)", category: "Ortho Supports", price: 580.00, tax_percent: 12, barcode: "8901052731", sku: "QDP-WLK-STK", status: "Available", quantity_type: "pcs" },
    { name: "Reciprocal Folding Aluminium Walker (Lightweight)", category: "Ortho Supports", price: 1450.00, tax_percent: 12, barcode: "8901052732", sku: "REC-FLD-WLK", status: "Available", quantity_type: "pcs" },
    { name: "Folding Walker with 2 Front Wheels", category: "Ortho Supports", price: 1850.00, tax_percent: 12, barcode: "8901052733", sku: "WHL-FLD-WLK", status: "Available", quantity_type: "pcs" },
    { name: "Dynacast Prelude Synthetic Splint 4 inch x 15 inch (1s)", category: "Miscellaneous", price: 280.00, tax_percent: 12, barcode: "8901052734", sku: "DYN-SPL-415", status: "Available", quantity_type: "pcs" },
    { name: "Dynacast Prelude Synthetic Splint 3 inch x 12 inch (1s)", category: "Miscellaneous", price: 220.00, tax_percent: 12, barcode: "8901052735", sku: "DYN-SPL-312", status: "Available", quantity_type: "pcs" },
    { name: "Povidone Iodine 10% Antiseptic Solution 500mL", category: "Wound Care", price: 195.00, tax_percent: 5, barcode: "8901052736", sku: "PVD-10-500", status: "Available", quantity_type: "pcs" },
    { name: "Povidone Iodine 5% Antiseptic Ointment 250g", category: "Wound Care", price: 185.00, tax_percent: 5, barcode: "8901052737", sku: "PVD-5-250G", status: "Available", quantity_type: "pcs" },
    { name: "Chlorhexidine 4% Surgical Hand Scrub 500mL", category: "Wound Care", price: 220.00, tax_percent: 12, barcode: "8901052738", sku: "CHX-4-500", status: "Available", quantity_type: "pcs" },
    { name: "Silver Sulfadiazine 1% Cream 250g Jar", category: "Wound Care", price: 165.00, tax_percent: 5, barcode: "8901052739", sku: "SSD-1-250G", status: "Available", quantity_type: "pcs" },
    { name: "Mupirocin 2% Antibacterial Ointment 15g", category: "Wound Care", price: 145.00, tax_percent: 5, barcode: "8901052740", sku: "MUP-2-15G", status: "Available", quantity_type: "pcs" },
    { name: "Framycetin Sulfate 1% Skin Cream 100g", category: "Wound Care", price: 95.00, tax_percent: 5, barcode: "8901052741", sku: "FRM-1-100G", status: "Available", quantity_type: "pcs" },
    { name: "Sterile Paraffin Gauze Dressing 10cm x 10cm (Box of 10)", category: "Wound Care", price: 290.00, tax_percent: 12, barcode: "8901052742", sku: "PRF-GZ-10S", status: "Available", quantity_type: "pack" },
    { name: "Transparent Polyurethane Film Dressing 10cm x 12cm (10s)", category: "Wound Care", price: 340.00, tax_percent: 12, barcode: "8901052743", sku: "TPU-FLM-10S", status: "Available", quantity_type: "pack" },
    { name: "Hydrocolloid Dressing for Bedsores / Ulcers 10x10cm (5s)", category: "Wound Care", price: 650.00, tax_percent: 12, barcode: "8901052744", sku: "HYD-DRE-5S", status: "Available", quantity_type: "pack" },
    { name: "Calcium Alginate Exudate Absorbing Dressing 10x10cm (5s)", category: "Wound Care", price: 780.00, tax_percent: 12, barcode: "8901052745", sku: "ALG-DRE-5S", status: "Available", quantity_type: "pack" },
    { name: "Suture Removal Kit (Sterile Disposable)", category: "Miscellaneous", price: 95.00, tax_percent: 12, barcode: "8901052746", sku: "STR-RMV-KIT", status: "Available", quantity_type: "pcs" },
    { name: "Surgical Paper Tape (Micropore 2.5cm x 9.1m)", category: "Miscellaneous", price: 65.00, tax_percent: 12, barcode: "8901052747", sku: "MCP-25-9M", status: "Available", quantity_type: "pcs" },
  ];
}

// Database initialization loader
export async function getDatabase(): Promise<DatabaseEngine> {
  if (dbInstance) return dbInstance;

  try {
    console.log("Attempting to initialize SQLite database at", sqlitePath);
    const sqlite3 = require('sqlite3').verbose();
    
    const db = new sqlite3.Database(sqlitePath);
    const nativeEngine = new SQLiteDatabaseEngine(db);
    
    await nativeEngine.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        category TEXT,
        price REAL,
        barcode TEXT UNIQUE,
        sku TEXT UNIQUE,
        tax_percent REAL DEFAULT 0,
        status TEXT DEFAULT 'Available',
        quantity_type TEXT DEFAULT 'strip'
      )
    `);

    await nativeEngine.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT,
        name TEXT
      )
    `);

    // Check if the bills table already exists and has a UNIQUE constraint on bill_number
    const tableInfo = await nativeEngine.get<{ sql: string }>(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='bills'"
    );

    if (tableInfo && tableInfo.sql && (tableInfo.sql.toUpperCase().includes("BILL_NUMBER INTEGER UNIQUE") || tableInfo.sql.toUpperCase().includes("UNIQUE(BILL_NUMBER)"))) {
      console.log("Migrating bills table to remove UNIQUE constraint from bill_number...");
      try {
        await nativeEngine.run("PRAGMA foreign_keys=OFF");
        await nativeEngine.run("BEGIN TRANSACTION");
        await nativeEngine.run("ALTER TABLE bills RENAME TO bills_old");
        
        await nativeEngine.run(`
          CREATE TABLE bills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bill_number INTEGER,
            subtotal REAL,
            discount REAL,
            tax REAL,
            grand_total REAL,
            payment_method TEXT,
            date TEXT,
            time TEXT,
            cashier_name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        await nativeEngine.run(`
          INSERT INTO bills (id, bill_number, subtotal, discount, tax, grand_total, payment_method, date, time, cashier_name, created_at)
          SELECT id, bill_number, subtotal, discount, tax, grand_total, payment_method, date, time, cashier_name, created_at
          FROM bills_old
        `);
        
        await nativeEngine.run("DROP TABLE bills_old");
        await nativeEngine.run("COMMIT");
        console.log("Bills table migration completed successfully.");
      } catch (migrationErr) {
        console.error("Migration failed, rolling back...", migrationErr);
        try { await nativeEngine.run("ROLLBACK"); } catch (e) {}
      } finally {
        await nativeEngine.run("PRAGMA foreign_keys=ON");
      }
    }

    await nativeEngine.run(`
      CREATE TABLE IF NOT EXISTS bills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bill_number INTEGER,
        subtotal REAL,
        discount REAL,
        tax REAL,
        grand_total REAL,
        payment_method TEXT,
        date TEXT,
        time TEXT,
        cashier_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await nativeEngine.run(`
      CREATE TABLE IF NOT EXISTS bill_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bill_id INTEGER,
        product_id INTEGER,
        product_name TEXT,
        quantity REAL,
        rate REAL,
        total REAL,
        FOREIGN KEY(bill_id) REFERENCES bills(id) ON DELETE CASCADE
      )
    `);

    await nativeEngine.run(`
      CREATE TABLE IF NOT EXISTS deleted_items_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bill_id INTEGER NULL,
        product_name TEXT,
        quantity REAL,
        deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await nativeEngine.run(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        role TEXT,
        phone TEXT,
        email TEXT,
        salary REAL,
        status TEXT DEFAULT 'Active',
        joined_date TEXT
      )
    `);

    // Seed users
    const usrCount = await nativeEngine.get<{ 'count(*)': number }>("SELECT count(*) FROM users");
    if (usrCount && usrCount['count(*)'] === 0) {
      await nativeEngine.run(`INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)`, ["admin", "admin123", "admin", "Administrator"]);
      await nativeEngine.run(`INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)`, ["employee", "employee123", "employee", "Pharmacist"]);
    }

    // Seed employees
    const empCount = await nativeEngine.get<{ 'count(*)': number }>("SELECT count(*) FROM employees");
    if (empCount && empCount['count(*)'] === 0) {
      const seeds = [
        { name: "Dr. Arjun Sharma", role: "Orthopaedic Surgeon", phone: "+91 98765 00001", email: "arjun@madrasortho.com", salary: 85000, status: "Active", joined_date: "2025-01-15" },
        { name: "Priya Nair", role: "Pharmacist", phone: "+91 98765 00002", email: "priya@madrasortho.com", salary: 30000, status: "Active", joined_date: "2025-02-10" },
        { name: "Ravi Kumar", role: "Billing Assistant", phone: "+91 98765 00003", email: "ravi@madrasortho.com", salary: 22000, status: "Active", joined_date: "2025-01-20" }
      ];
      for (const e of seeds) {
        await nativeEngine.run(
          `INSERT INTO employees (name, role, phone, email, salary, status, joined_date) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [e.name, e.role, e.phone, e.email, e.salary, e.status, e.joined_date]
        );
      }
    }

    // Seed pharmacy products (ensure comprehensive 500+ items are present)
    const seeds = getSeedProducts();
    const prodCount = await nativeEngine.get<{ 'count(*)': number }>("SELECT count(*) FROM products");
    if (prodCount && prodCount['count(*)'] < seeds.length) {
      console.log(`Synchronizing comprehensive ortho pharmacy medicines database (${seeds.length} target items)...`);
      for (const p of seeds) {
        try {
          await nativeEngine.run(
            `INSERT OR IGNORE INTO products (name, category, price, barcode, sku, tax_percent, status, quantity_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [p.name, p.category, p.price, p.barcode, p.sku, p.tax_percent, p.status, p.quantity_type]
          );
        } catch (e) {
          // Skip duplicates gracefully
        }
      }
      console.log(`Ortho pharmacy medicine seeding/sync completed.`);
    }

    console.log("SQLite Engine successfully loaded.");
    dbInstance = nativeEngine;
    return dbInstance;
  } catch (err) {
    console.warn("SQLite database driver initialization failed. Using JSON-File DB Engine fallback.", err);
    dbInstance = new JSONDatabaseEngine();
    return dbInstance;
  }
}

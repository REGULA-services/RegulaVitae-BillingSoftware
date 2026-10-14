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
    if (this.data.products.length === 0) {
      const defaultProducts = getSeedProducts();
      this.data.products = defaultProducts.map((p, idx) => ({
        id: idx + 1,
        ...p,
        status: p.status || 'Available',
        quantity_type: p.quantity_type || 'strip'
      }));
      this.save();
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
      for (const it of this.data.bill_items) {
        if (validBillIds.has(it.bill_id)) {
          if (!map[it.product_name]) {
            map[it.product_name] = { name: it.product_name, quantity: 0, total: 0 };
          }
          map[it.product_name].quantity += Number(it.quantity) || 0;
          map[it.product_name].total += Number(it.total) || 0;
        }
      }
      return Object.values(map).sort((a, b) => b.quantity - a.quantity) as T[];
    }

    if (q.includes("FROM PRODUCTS")) {
      return [...this.data.products] as T[];
    }
    if (q.includes("FROM EMPLOYEES")) {
      return [...this.data.employees] as T[];
    }
    if (q.includes("FROM USERS")) {
      return [...this.data.users] as T[];
    }
    if (q.includes("FROM BILL_ITEMS")) {
      if (query.includes("bill_id = ?")) {
        const billId = params[0];
        return this.data.bill_items.filter(item => item.bill_id === Number(billId)) as T[];
      }
      return [...this.data.bill_items] as T[];
    }
    if (q.includes("FROM BILLS")) {
      if (query.includes("date = ?")) {
        const date = params[0];
        return this.data.bills.filter(b => b.date === date) as T[];
      }
      if (query.includes("date BETWEEN ? AND ?")) {
        const [start, end] = params;
        return this.data.bills.filter(b => b.date >= start && b.date <= end) as T[];
      }
      if (query.includes("strftime('%Y', date) = ?") || query.includes("strftime('%Y', date) =")) {
        const year = String(params[0]);
        return this.data.bills.filter(b => String(b.date).startsWith(year)) as T[];
      }
      return [...this.data.bills] as T[];
    }
    if (q.includes("FROM DELETED_ITEMS_HISTORY")) {
      return [...this.data.deleted_items_history] as T[];
    }
    return [];
  }

  async get<T>(query: string, params: any[] = []): Promise<T | undefined> {
    const q = query.trim().toUpperCase();

    // Handle count queries
    if (q.includes("COUNT(*)")) {
      if (q.includes("FROM PRODUCTS")) return { "count(*)": this.data.products.length } as any;
      if (q.includes("FROM EMPLOYEES")) return { "count(*)": this.data.employees.length } as any;
      if (q.includes("FROM USERS")) return { "count(*)": this.data.users.length } as any;
      if (q.includes("FROM BILLS")) return { "count(*)": this.data.bills.length } as any;
    }

    if (q.includes("FROM PRODUCTS WHERE ID = ?") || q.includes("FROM PRODUCTS WHERE ID =")) {
      const id = params[0];
      return this.data.products.find(p => p.id === Number(id)) as T;
    }
    if (q.includes("FROM EMPLOYEES WHERE ID = ?") || q.includes("FROM EMPLOYEES WHERE ID =")) {
      const id = params[0];
      return this.data.employees.find(e => e.id === Number(id)) as T;
    }
    if (q.includes("FROM USERS WHERE USERNAME = ?")) {
      const username = params[0];
      return this.data.users.find(u => u.username === username) as T;
    }
    if (q.includes("FROM PRODUCTS WHERE BARCODE = ?")) {
      const barcode = params[0];
      return this.data.products.find(p => p.barcode === barcode) as T;
    }
    if (q.includes("FROM BILLS WHERE ID = ?")) {
      const id = params[0];
      return this.data.bills.find(b => b.id === Number(id)) as T;
    }
    if (q.includes("MAX(BILL_NUMBER)")) {
      const dateFilter = params.length > 0 ? params[0] : null;
      const billsInScope = dateFilter
        ? this.data.bills.filter(b => b.date === dateFilter)
        : this.data.bills;
      if (billsInScope.length === 0) return { "MAX(bill_number)": null } as any;
      const maxVal = Math.max(...billsInScope.map(b => b.bill_number || 0));
      return { "MAX(bill_number)": maxVal } as any;
    }
    return undefined;
  }

  async run(query: string, params: any[] = []): Promise<{ lastID?: number; changes?: number }> {
    const q = query.trim().toUpperCase();
    if (q.startsWith("INSERT INTO EMPLOYEES")) {
      const [name, role, phone, email, salary, status, joined_date] = params;
      const id = this.data.employees && this.data.employees.length > 0 ? Math.max(...this.data.employees.map(e => e.id)) + 1 : 1;
      const newEmp = { id, name, role, phone, email, salary: salary !== null ? Number(salary) : null, status, joined_date };
      if (!this.data.employees) this.data.employees = [];
      this.data.employees.push(newEmp);
      this.save();
      return { lastID: id, changes: 1 };
    }
    if (q.startsWith("UPDATE EMPLOYEES")) {
      const id = params[params.length - 1];
      if (!this.data.employees) this.data.employees = [];
      const idx = this.data.employees.findIndex(e => e.id === Number(id));
      if (idx !== -1) {
        if (params.length === 8) {
          const [name, role, phone, email, salary, status, joined_date] = params;
          this.data.employees[idx] = { id: Number(id), name, role, phone, email, salary: salary !== null ? Number(salary) : null, status, joined_date };
        } else {
          this.data.employees[idx] = { ...this.data.employees[idx] };
        }
        this.save();
        return { lastID: Number(id), changes: 1 };
      }
      return { changes: 0 };
    }
    if (q.startsWith("DELETE FROM EMPLOYEES")) {
      const id = params[0];
      if (!this.data.employees) this.data.employees = [];
      const initialLen = this.data.employees.length;
      this.data.employees = this.data.employees.filter(e => e.id !== Number(id));
      this.save();
      return { changes: initialLen - this.data.employees.length };
    }
    if (q.startsWith("INSERT INTO PRODUCTS")) {
      const [name, category, price, barcode, sku, tax_percent, status, quantity_type] = params;
      const id = this.data.products.length > 0 ? Math.max(...this.data.products.map(p => p.id)) + 1 : 1;
      const newProd = { id, name, category, price: Number(price), barcode, sku, tax_percent: Number(tax_percent), status, quantity_type };
      this.data.products.push(newProd);
      this.save();
      return { lastID: id, changes: 1 };
    }
    if (q.startsWith("UPDATE PRODUCTS")) {
      const id = params[params.length - 1];
      const idx = this.data.products.findIndex(p => p.id === Number(id));
      if (idx !== -1) {
        if (params.length === 9) {
          const [name, category, price, barcode, sku, tax_percent, status, quantity_type] = params;
          this.data.products[idx] = { id: Number(id), name, category, price: Number(price), barcode, sku, tax_percent: Number(tax_percent), status, quantity_type };
        } else if (q.includes("SET PRICE = ?")) {
          this.data.products[idx].price = Number(params[0]);
        } else {
          this.data.products[idx] = { ...this.data.products[idx] };
        }
        this.save();
        return { lastID: Number(id), changes: 1 };
      }
      return { changes: 0 };
    }
    if (q.startsWith("DELETE FROM PRODUCTS")) {
      const id = params[0];
      const initialLen = this.data.products.length;
      this.data.products = this.data.products.filter(p => p.id !== Number(id));
      this.save();
      return { changes: initialLen - this.data.products.length };
    }
    if (q.startsWith("DELETE FROM BILLS")) {
      const id = params[0];
      const initialLen = this.data.bills.length;
      this.data.bills = this.data.bills.filter(b => b.id !== Number(id));
      this.save();
      return { changes: initialLen - this.data.bills.length };
    }
    if (q.startsWith("DELETE FROM BILL_ITEMS")) {
      const billId = params[0];
      const initialLen = this.data.bill_items.length;
      this.data.bill_items = this.data.bill_items.filter(item => item.bill_id !== Number(billId));
      this.save();
      return { changes: initialLen - this.data.bill_items.length };
    }
    if (q.startsWith("INSERT INTO BILLS")) {
      const [bill_number, subtotal, discount, tax, grand_total, payment_method, date, time, cashier_name] = params;
      const id = this.data.bills.length > 0 ? Math.max(...this.data.bills.map(b => b.id)) + 1 : 1;
      const newBill = {
        id,
        bill_number: Number(bill_number),
        subtotal: Number(subtotal),
        discount: Number(discount),
        tax: Number(tax),
        grand_total: Number(grand_total),
        payment_method,
        date,
        time,
        cashier_name,
        created_at: new Date().toISOString()
      };
      this.data.bills.push(newBill);
      this.save();
      return { lastID: id, changes: 1 };
    }
    if (q.startsWith("INSERT INTO BILL_ITEMS")) {
      const [bill_id, product_id, product_name, quantity, rate, total] = params;
      const id = this.data.bill_items.length > 0 ? Math.max(...this.data.bill_items.map(item => item.id)) + 1 : 1;
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
// ORTHO PHARMACY SEED PRODUCTS (India Prices with GST Rates)
// Indian Government GST rates for pharmaceuticals:
//   - 0%  : Essential medicines (most prescription drugs)
//   - 5%  : Branded medicines/OTC pain relievers
//   - 12% : Medical devices & ortho supports
//   - 18% : Supplements & non-essential items
// ============================================================
function getSeedProducts() {
  return [
    // ---- NSAIDs & Pain Relievers (GST: 5%) ----
    { name: "Diclofenac Sodium 50mg Tablets (10s)", category: "NSAIDs", price: 28.50, tax_percent: 5, barcode: "8901050001", sku: "DCF-50-TAB", status: "Available", quantity_type: "strip" },
    { name: "Diclofenac Sodium 75mg SR Tablets (10s)", category: "NSAIDs", price: 45.00, tax_percent: 5, barcode: "8901050002", sku: "DCF-75-SR", status: "Available", quantity_type: "strip" },
    { name: "Ibuprofen 400mg Tablets (10s)", category: "NSAIDs", price: 22.00, tax_percent: 5, barcode: "8901050003", sku: "IBU-400-TAB", status: "Available", quantity_type: "strip" },
    { name: "Ibuprofen 600mg Tablets (10s)", category: "NSAIDs", price: 32.00, tax_percent: 5, barcode: "8901050004", sku: "IBU-600-TAB", status: "Available", quantity_type: "strip" },
    { name: "Naproxen 250mg Tablets (10s)", category: "NSAIDs", price: 35.00, tax_percent: 5, barcode: "8901050005", sku: "NAP-250-TAB", status: "Available", quantity_type: "strip" },
    { name: "Naproxen 500mg Tablets (10s)", category: "NSAIDs", price: 55.00, tax_percent: 5, barcode: "8901050006", sku: "NAP-500-TAB", status: "Available", quantity_type: "strip" },
    { name: "Etoricoxib 60mg Tablets (10s)", category: "NSAIDs", price: 95.00, tax_percent: 5, barcode: "8901050007", sku: "ETO-60-TAB", status: "Available", quantity_type: "strip" },
    { name: "Etoricoxib 90mg Tablets (10s)", category: "NSAIDs", price: 130.00, tax_percent: 5, barcode: "8901050008", sku: "ETO-90-TAB", status: "Available", quantity_type: "strip" },
    { name: "Celecoxib 100mg Capsules (10s)", category: "NSAIDs", price: 85.00, tax_percent: 5, barcode: "8901050009", sku: "CEL-100-CAP", status: "Available", quantity_type: "strip" },
    { name: "Celecoxib 200mg Capsules (10s)", category: "NSAIDs", price: 140.00, tax_percent: 5, barcode: "8901050010", sku: "CEL-200-CAP", status: "Available", quantity_type: "strip" },
    { name: "Aceclofenac 100mg Tablets (10s)", category: "NSAIDs", price: 38.00, tax_percent: 5, barcode: "8901050011", sku: "ACE-100-TAB", status: "Available", quantity_type: "strip" },
    { name: "Piroxicam 20mg Tablets (10s)", category: "NSAIDs", price: 42.00, tax_percent: 5, barcode: "8901050012", sku: "PIR-20-TAB", status: "Available", quantity_type: "strip" },

    // ---- Analgesics & Antipyretics (GST: 5%) ----
    { name: "Paracetamol 500mg Tablets (10s)", category: "Analgesics", price: 12.00, tax_percent: 5, barcode: "8901050101", sku: "PCM-500-TAB", status: "Available", quantity_type: "strip" },
    { name: "Paracetamol 650mg Tablets (10s)", category: "Analgesics", price: 18.00, tax_percent: 5, barcode: "8901050102", sku: "PCM-650-TAB", status: "Available", quantity_type: "strip" },
    { name: "Tramadol 50mg Capsules (10s)", category: "Analgesics", price: 68.00, tax_percent: 5, barcode: "8901050103", sku: "TRM-50-CAP", status: "Available", quantity_type: "strip" },
    { name: "Tramadol 100mg SR Tablets (10s)", category: "Analgesics", price: 95.00, tax_percent: 5, barcode: "8901050104", sku: "TRM-100-SR", status: "Available", quantity_type: "strip" },
    { name: "Ketorolac 10mg Tablets (10s)", category: "Analgesics", price: 55.00, tax_percent: 5, barcode: "8901050105", sku: "KTR-10-TAB", status: "Available", quantity_type: "strip" },
    { name: "Tapentadol 50mg Tablets (10s)", category: "Analgesics", price: 185.00, tax_percent: 5, barcode: "8901050106", sku: "TAP-50-TAB", status: "Available", quantity_type: "strip" },
    { name: "Tapentadol 100mg Tablets (10s)", category: "Analgesics", price: 285.00, tax_percent: 5, barcode: "8901050107", sku: "TAP-100-TAB", status: "Available", quantity_type: "strip" },

    // ---- Muscle Relaxants (GST: 5%) ----
    { name: "Thiocolchicoside 4mg Tablets (10s)", category: "Muscle Relaxants", price: 88.00, tax_percent: 5, barcode: "8901050201", sku: "THC-4-TAB", status: "Available", quantity_type: "strip" },
    { name: "Thiocolchicoside 8mg Tablets (10s)", category: "Muscle Relaxants", price: 145.00, tax_percent: 5, barcode: "8901050202", sku: "THC-8-TAB", status: "Available", quantity_type: "strip" },
    { name: "Methocarbamol 500mg Tablets (10s)", category: "Muscle Relaxants", price: 72.00, tax_percent: 5, barcode: "8901050203", sku: "MCR-500-TAB", status: "Available", quantity_type: "strip" },
    { name: "Tizanidine 2mg Tablets (10s)", category: "Muscle Relaxants", price: 55.00, tax_percent: 5, barcode: "8901050204", sku: "TZN-2-TAB", status: "Available", quantity_type: "strip" },
    { name: "Tizanidine 4mg Tablets (10s)", category: "Muscle Relaxants", price: 85.00, tax_percent: 5, barcode: "8901050205", sku: "TZN-4-TAB", status: "Available", quantity_type: "strip" },
    { name: "Baclofen 10mg Tablets (10s)", category: "Muscle Relaxants", price: 48.00, tax_percent: 5, barcode: "8901050206", sku: "BCL-10-TAB", status: "Available", quantity_type: "strip" },
    { name: "Chlorzoxazone 250mg Tablets (10s)", category: "Muscle Relaxants", price: 38.00, tax_percent: 5, barcode: "8901050207", sku: "CZX-250-TAB", status: "Available", quantity_type: "strip" },

    // ---- Bone & Joint Health Supplements (GST: 12%) ----
    { name: "Calcium + D3 Tablets (30s)", category: "Bone Supplements", price: 145.00, tax_percent: 12, barcode: "8901050301", sku: "CAL-D3-30", status: "Available", quantity_type: "pack" },
    { name: "Calcium + D3 + Magnesium Tablets (60s)", category: "Bone Supplements", price: 285.00, tax_percent: 12, barcode: "8901050302", sku: "CAL-D3-MG-60", status: "Available", quantity_type: "pack" },
    { name: "Cholecalciferol 60000 IU Capsules (4s)", category: "Bone Supplements", price: 115.00, tax_percent: 12, barcode: "8901050303", sku: "VD3-60K-CAP", status: "Available", quantity_type: "strip" },
    { name: "Vitamin D3 400 IU Tablets (30s)", category: "Bone Supplements", price: 85.00, tax_percent: 12, barcode: "8901050304", sku: "VD3-400-30", status: "Available", quantity_type: "pack" },
    { name: "Glucosamine 500mg + Chondroitin Tablets (30s)", category: "Bone Supplements", price: 380.00, tax_percent: 12, barcode: "8901050305", sku: "GLC-CHON-30", status: "Available", quantity_type: "pack" },
    { name: "Glucosamine 750mg Tablets (30s)", category: "Bone Supplements", price: 295.00, tax_percent: 12, barcode: "8901050306", sku: "GLC-750-30", status: "Available", quantity_type: "pack" },
    { name: "Collagen + Vitamin C Tablets (30s)", category: "Bone Supplements", price: 450.00, tax_percent: 12, barcode: "8901050307", sku: "COL-VC-30", status: "Available", quantity_type: "pack" },
    { name: "Methylcobalamin 500mcg Tablets (10s)", category: "Bone Supplements", price: 45.00, tax_percent: 12, barcode: "8901050308", sku: "MCB-500-10", status: "Available", quantity_type: "strip" },
    { name: "Mecobalamin 1500mcg Tablets (10s)", category: "Bone Supplements", price: 95.00, tax_percent: 12, barcode: "8901050309", sku: "MCB-1500-10", status: "Available", quantity_type: "strip" },
    { name: "Alpha Lipoic Acid 100mg Capsules (10s)", category: "Bone Supplements", price: 125.00, tax_percent: 12, barcode: "8901050310", sku: "ALA-100-10", status: "Available", quantity_type: "strip" },
    { name: "Rosehip Extract 40mg Tablets (30s)", category: "Bone Supplements", price: 520.00, tax_percent: 12, barcode: "8901050311", sku: "RHE-40-30", status: "Available", quantity_type: "pack" },

    // ---- Steroids & Anti-inflammatory (GST: 5%) ----
    { name: "Prednisolone 5mg Tablets (10s)", category: "Steroids", price: 22.00, tax_percent: 5, barcode: "8901050401", sku: "PRD-5-TAB", status: "Available", quantity_type: "strip" },
    { name: "Prednisolone 10mg Tablets (10s)", category: "Steroids", price: 38.00, tax_percent: 5, barcode: "8901050402", sku: "PRD-10-TAB", status: "Available", quantity_type: "strip" },
    { name: "Methylprednisolone 4mg Tablets (10s)", category: "Steroids", price: 75.00, tax_percent: 5, barcode: "8901050403", sku: "MPS-4-TAB", status: "Available", quantity_type: "strip" },
    { name: "Methylprednisolone 8mg Tablets (10s)", category: "Steroids", price: 120.00, tax_percent: 5, barcode: "8901050404", sku: "MPS-8-TAB", status: "Available", quantity_type: "strip" },
    { name: "Dexamethasone 0.5mg Tablets (10s)", category: "Steroids", price: 18.00, tax_percent: 5, barcode: "8901050405", sku: "DEX-05-TAB", status: "Available", quantity_type: "strip" },

    // ---- Osteoporosis Medications (GST: 5%) ----
    { name: "Alendronate 70mg Tablets (4s)", category: "Osteoporosis", price: 165.00, tax_percent: 5, barcode: "8901050501", sku: "ALD-70-4", status: "Available", quantity_type: "strip" },
    { name: "Risedronate 35mg Tablets (4s)", category: "Osteoporosis", price: 195.00, tax_percent: 5, barcode: "8901050502", sku: "RIS-35-4", status: "Available", quantity_type: "strip" },
    { name: "Calcitonin Nasal Spray 200 IU", category: "Osteoporosis", price: 485.00, tax_percent: 5, barcode: "8901050503", sku: "CLT-NSP-200", status: "Available", quantity_type: "pcs" },
    { name: "Teriparatide 20mcg/dose Pen (2.4mL)", category: "Osteoporosis", price: 8500.00, tax_percent: 5, barcode: "8901050504", sku: "TPT-PEN-24", status: "Available", quantity_type: "pcs" },
    { name: "Strontium Ranelate 2g Granules (28 sachets)", category: "Osteoporosis", price: 950.00, tax_percent: 5, barcode: "8901050505", sku: "STR-2G-28", status: "Available", quantity_type: "pack" },

    // ---- Topical / Gels / Ointments (GST: 5%) ----
    { name: "Diclofenac Gel 1% 30g", category: "Topicals", price: 65.00, tax_percent: 5, barcode: "8901050601", sku: "DCF-GEL-30", status: "Available", quantity_type: "pcs" },
    { name: "Diclofenac Gel 1% 100g", category: "Topicals", price: 165.00, tax_percent: 5, barcode: "8901050602", sku: "DCF-GEL-100", status: "Available", quantity_type: "pcs" },
    { name: "Ketoprofen Gel 2.5% 50g", category: "Topicals", price: 120.00, tax_percent: 5, barcode: "8901050603", sku: "KPF-GEL-50", status: "Available", quantity_type: "pcs" },
    { name: "Piroxicam Gel 0.5% 30g", category: "Topicals", price: 85.00, tax_percent: 5, barcode: "8901050604", sku: "PIR-GEL-30", status: "Available", quantity_type: "pcs" },
    { name: "Capsaicin Cream 0.025% 30g", category: "Topicals", price: 145.00, tax_percent: 5, barcode: "8901050605", sku: "CAP-CRM-30", status: "Available", quantity_type: "pcs" },
    { name: "Methylsalicylate + Menthol Liniment 60mL", category: "Topicals", price: 75.00, tax_percent: 5, barcode: "8901050606", sku: "MSL-MNT-60", status: "Available", quantity_type: "pcs" },
    { name: "Diclofenac + Methyl Salicylate Gel 30g", category: "Topicals", price: 95.00, tax_percent: 5, barcode: "8901050607", sku: "DCF-MS-GEL-30", status: "Available", quantity_type: "pcs" },
    { name: "Voltaren Emulgel 100g", category: "Topicals", price: 285.00, tax_percent: 5, barcode: "8901050608", sku: "VLT-GEL-100", status: "Available", quantity_type: "pcs" },

    // ---- Ortho Supports & Braces (GST: 12%) ----
    { name: "Knee Cap (Medium)", category: "Ortho Supports", price: 280.00, tax_percent: 12, barcode: "8901050701", sku: "KNC-CAP-M", status: "Available", quantity_type: "pcs" },
    { name: "Knee Cap (Large)", category: "Ortho Supports", price: 280.00, tax_percent: 12, barcode: "8901050702", sku: "KNC-CAP-L", status: "Available", quantity_type: "pcs" },
    { name: "Lumbosacral Corset (Medium)", category: "Ortho Supports", price: 750.00, tax_percent: 12, barcode: "8901050703", sku: "LSC-MED", status: "Available", quantity_type: "pcs" },
    { name: "Lumbosacral Corset (Large)", category: "Ortho Supports", price: 750.00, tax_percent: 12, barcode: "8901050704", sku: "LSC-LGE", status: "Available", quantity_type: "pcs" },
    { name: "Cervical Collar (Standard)", category: "Ortho Supports", price: 320.00, tax_percent: 12, barcode: "8901050705", sku: "CVC-STD", status: "Available", quantity_type: "pcs" },
    { name: "Wrist Splint (One Size)", category: "Ortho Supports", price: 380.00, tax_percent: 12, barcode: "8901050706", sku: "WRS-SPL", status: "Available", quantity_type: "pcs" },
    { name: "Ankle Brace (Medium)", category: "Ortho Supports", price: 420.00, tax_percent: 12, barcode: "8901050707", sku: "ANK-BRC-M", status: "Available", quantity_type: "pcs" },
    { name: "Elbow Support (One Size)", category: "Ortho Supports", price: 250.00, tax_percent: 12, barcode: "8901050708", sku: "ELB-SUP", status: "Available", quantity_type: "pcs" },
    { name: "Shoulder Immobilizer (Medium)", category: "Ortho Supports", price: 650.00, tax_percent: 12, barcode: "8901050709", sku: "SHD-IMM-M", status: "Available", quantity_type: "pcs" },
    { name: "Thumb Spica Splint", category: "Ortho Supports", price: 290.00, tax_percent: 12, barcode: "8901050710", sku: "THB-SPC", status: "Available", quantity_type: "pcs" },
    { name: "Heel Cup (Pair)", category: "Ortho Supports", price: 180.00, tax_percent: 12, barcode: "8901050711", sku: "HEL-CUP-PR", status: "Available", quantity_type: "pcs" },
    { name: "Arch Support Insoles (Large)", category: "Ortho Supports", price: 350.00, tax_percent: 12, barcode: "8901050712", sku: "ARC-INS-L", status: "Available", quantity_type: "pcs" },

    // ---- Physiotherapy Consumables (GST: 12%) ----
    { name: "TENS Electrode Pads (4 pads)", category: "Physiotherapy", price: 180.00, tax_percent: 12, barcode: "8901050801", sku: "TENS-PAD-4", status: "Available", quantity_type: "pack" },
    { name: "Ultrasound Gel 250mL", category: "Physiotherapy", price: 95.00, tax_percent: 12, barcode: "8901050802", sku: "USG-GEL-250", status: "Available", quantity_type: "pcs" },
    { name: "Hot Water Bag (2L)", category: "Physiotherapy", price: 220.00, tax_percent: 12, barcode: "8901050803", sku: "HWB-2L", status: "Available", quantity_type: "pcs" },
    { name: "Ice Gel Pack (Reusable)", category: "Physiotherapy", price: 185.00, tax_percent: 12, barcode: "8901050804", sku: "ICE-GLP", status: "Available", quantity_type: "pcs" },
    { name: "Resistance Band (Medium)", category: "Physiotherapy", price: 145.00, tax_percent: 12, barcode: "8901050805", sku: "RES-BND-M", status: "Available", quantity_type: "pcs" },
    { name: "Foam Roller 30cm", category: "Physiotherapy", price: 380.00, tax_percent: 12, barcode: "8901050806", sku: "FMR-30", status: "Available", quantity_type: "pcs" },
    { name: "Crepe Bandage 10cm x 4m", category: "Physiotherapy", price: 45.00, tax_percent: 12, barcode: "8901050807", sku: "CRP-BND-10", status: "Available", quantity_type: "pcs" },
    { name: "Elastic Adhesive Bandage (EAB) 5cm x 5m", category: "Physiotherapy", price: 85.00, tax_percent: 12, barcode: "8901050808", sku: "EAB-5-5", status: "Available", quantity_type: "pcs" },
    { name: "Kinesiology Tape Roll 5cm x 5m", category: "Physiotherapy", price: 250.00, tax_percent: 12, barcode: "8901050809", sku: "KIN-TAPE", status: "Available", quantity_type: "pcs" },
    { name: "Pillowcase Splint Foam Padding", category: "Physiotherapy", price: 120.00, tax_percent: 12, barcode: "8901050810", sku: "PLW-SPL", status: "Available", quantity_type: "pcs" },

    // ---- Injections & Injectables (GST: 5%) ----
    { name: "Diclofenac Sodium 75mg/3mL Injection", category: "Injectables", price: 28.00, tax_percent: 5, barcode: "8901050901", sku: "DCF-INJ-75", status: "Available", quantity_type: "pcs" },
    { name: "Methylprednisolone 40mg/mL Vial", category: "Injectables", price: 185.00, tax_percent: 5, barcode: "8901050902", sku: "MPS-40-VIAL", status: "Available", quantity_type: "pcs" },
    { name: "Triamcinolone 40mg/mL Vial 5mL", category: "Injectables", price: 245.00, tax_percent: 5, barcode: "8901050903", sku: "TRC-40-VIAL", status: "Available", quantity_type: "pcs" },
    { name: "Hyaluronic Acid 2% Injection (2mL)", category: "Injectables", price: 2800.00, tax_percent: 5, barcode: "8901050904", sku: "HYA-2PC-INJ", status: "Available", quantity_type: "pcs" },
    { name: "Ketorolac 30mg/mL Injection", category: "Injectables", price: 45.00, tax_percent: 5, barcode: "8901050905", sku: "KTR-INJ-30", status: "Available", quantity_type: "pcs" },
    { name: "Tramadol 50mg/mL Injection (2mL)", category: "Injectables", price: 38.00, tax_percent: 5, barcode: "8901050906", sku: "TRM-INJ-50", status: "Available", quantity_type: "pcs" },

    // ---- Nerve Pain / Neuropathy (GST: 5%) ----
    { name: "Pregabalin 75mg Capsules (10s)", category: "Neuropathy", price: 88.00, tax_percent: 5, barcode: "8901051001", sku: "PRG-75-CAP", status: "Available", quantity_type: "strip" },
    { name: "Pregabalin 150mg Capsules (10s)", category: "Neuropathy", price: 145.00, tax_percent: 5, barcode: "8901051002", sku: "PRG-150-CAP", status: "Available", quantity_type: "strip" },
    { name: "Gabapentin 300mg Capsules (10s)", category: "Neuropathy", price: 65.00, tax_percent: 5, barcode: "8901051003", sku: "GAB-300-CAP", status: "Available", quantity_type: "strip" },
    { name: "Gabapentin 400mg Capsules (10s)", category: "Neuropathy", price: 90.00, tax_percent: 5, barcode: "8901051004", sku: "GAB-400-CAP", status: "Available", quantity_type: "strip" },
    { name: "Amitriptyline 10mg Tablets (10s)", category: "Neuropathy", price: 18.00, tax_percent: 5, barcode: "8901051005", sku: "AMT-10-TAB", status: "Available", quantity_type: "strip" },
    { name: "Duloxetine 30mg Capsules (10s)", category: "Neuropathy", price: 185.00, tax_percent: 5, barcode: "8901051006", sku: "DUL-30-CAP", status: "Available", quantity_type: "strip" },

    // ---- Anticoagulants (Post-Surgery / DVT Prevention, GST: 5%) ----
    { name: "Enoxaparin 40mg/0.4mL Syringe", category: "Anticoagulants", price: 225.00, tax_percent: 5, barcode: "8901051101", sku: "ENX-40-SYR", status: "Available", quantity_type: "pcs" },
    { name: "Rivaroxaban 10mg Tablets (10s)", category: "Anticoagulants", price: 680.00, tax_percent: 5, barcode: "8901051102", sku: "RVX-10-TAB", status: "Available", quantity_type: "strip" },
    { name: "Aspirin 75mg Tablets (14s)", category: "Anticoagulants", price: 28.00, tax_percent: 5, barcode: "8901051103", sku: "ASP-75-TAB", status: "Available", quantity_type: "strip" },

    // ---- Uric Acid / Gout Medications (GST: 5%) ----
    { name: "Allopurinol 100mg Tablets (10s)", category: "Gout Medications", price: 18.00, tax_percent: 5, barcode: "8901051201", sku: "ALP-100-TAB", status: "Available", quantity_type: "strip" },
    { name: "Allopurinol 300mg Tablets (10s)", category: "Gout Medications", price: 42.00, tax_percent: 5, barcode: "8901051202", sku: "ALP-300-TAB", status: "Available", quantity_type: "strip" },
    { name: "Colchicine 0.5mg Tablets (10s)", category: "Gout Medications", price: 65.00, tax_percent: 5, barcode: "8901051203", sku: "COL-05-TAB", status: "Available", quantity_type: "strip" },
    { name: "Febuxostat 40mg Tablets (10s)", category: "Gout Medications", price: 125.00, tax_percent: 5, barcode: "8901051204", sku: "FEB-40-TAB", status: "Available", quantity_type: "strip" },
    { name: "Febuxostat 80mg Tablets (10s)", category: "Gout Medications", price: 185.00, tax_percent: 5, barcode: "8901051205", sku: "FEB-80-TAB", status: "Available", quantity_type: "strip" },

    // ---- Proton Pump Inhibitors (GI Protection, GST: 5%) ----
    { name: "Pantoprazole 40mg Tablets (10s)", category: "GI Protection", price: 45.00, tax_percent: 5, barcode: "8901051301", sku: "PNT-40-TAB", status: "Available", quantity_type: "strip" },
    { name: "Omeprazole 20mg Capsules (10s)", category: "GI Protection", price: 32.00, tax_percent: 5, barcode: "8901051302", sku: "OMP-20-CAP", status: "Available", quantity_type: "strip" },
    { name: "Ranitidine 150mg Tablets (10s)", category: "GI Protection", price: 22.00, tax_percent: 5, barcode: "8901051303", sku: "RAN-150-TAB", status: "Available", quantity_type: "strip" },
    { name: "Esomeprazole 40mg Tablets (10s)", category: "GI Protection", price: 68.00, tax_percent: 5, barcode: "8901051304", sku: "ESO-40-TAB", status: "Available", quantity_type: "strip" },

    // ---- Multivitamins & Immune Support (GST: 18%) ----
    { name: "Multivitamin + Mineral Tablets (30s)", category: "Multivitamins", price: 195.00, tax_percent: 18, barcode: "8901051401", sku: "MVM-MIN-30", status: "Available", quantity_type: "pack" },
    { name: "Vitamin C 500mg Tablets (30s)", category: "Multivitamins", price: 125.00, tax_percent: 18, barcode: "8901051402", sku: "VTC-500-30", status: "Available", quantity_type: "pack" },
    { name: "Zinc + Vitamin C + D3 Effervescent (20s)", category: "Multivitamins", price: 280.00, tax_percent: 18, barcode: "8901051403", sku: "ZNC-VC-EFF", status: "Available", quantity_type: "pack" },
    { name: "Magnesium 375mg Tablets (30s)", category: "Multivitamins", price: 245.00, tax_percent: 18, barcode: "8901051404", sku: "MAG-375-30", status: "Available", quantity_type: "pack" },
    { name: "Omega-3 Fish Oil 1000mg Capsules (30s)", category: "Multivitamins", price: 350.00, tax_percent: 18, barcode: "8901051405", sku: "OMG-1000-30", status: "Available", quantity_type: "pack" },
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

    // Seed pharmacy products
    const prodCount = await nativeEngine.get<{ 'count(*)': number }>("SELECT count(*) FROM products");
    if (prodCount && prodCount['count(*)'] === 0) {
      console.log("Seeding ortho pharmacy medicines database...");
      const seeds = getSeedProducts();
      for (const p of seeds) {
        try {
          await nativeEngine.run(
            `INSERT INTO products (name, category, price, barcode, sku, tax_percent, status, quantity_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [p.name, p.category, p.price, p.barcode, p.sku, p.tax_percent, p.status, p.quantity_type]
          );
        } catch (e) {
          // Skip duplicates gracefully
        }
      }
      console.log("Ortho pharmacy medicine seeding completed.");
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

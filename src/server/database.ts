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
const dbDir = path.join(userAppData, "BillingSoftwarePOS");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const sqlitePath = path.join(dbDir, "bakery_pos.db");
const jsonDbPath = path.join(dbDir, "bakery_pos.json");

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
        quantity_type: p.quantity_type || 'pcs'
      }));
      this.save();
    }
    if (!this.data.employees || this.data.employees.length === 0) {
      this.data.employees = [
        { id: 1, name: "Joel Brown", role: "Manager", phone: "+91 98765 00001", email: "joel@billingsoftware.com", salary: 35000, status: "Active", joined_date: "2025-01-15" },
        { id: 2, name: "Alice Smith", role: "Cashier", phone: "+91 98765 00002", email: "alice@billingsoftware.com", salary: 20000, status: "Active", joined_date: "2025-02-10" },
        { id: 3, name: "Chef Bob", role: "Baker", phone: "+91 98765 00003", email: "bob@billingsoftware.com", salary: 28000, status: "Active", joined_date: "2025-01-20" }
      ];
      this.save();
    }
    if (!this.data.users || this.data.users.length === 0) {
      this.data.users = [
        { id: 1, username: "admin", password: "admin123", role: "admin", name: "Administrator" },
        { id: 2, username: "employee", password: "employee123", role: "employee", name: "Employee" }
      ];
      this.save();
    }
  }

  async all<T>(query: string, params: any[] = []): Promise<T[]> {
    const q = query.trim().toUpperCase();
    if (q.startsWith("SELECT * FROM PRODUCTS")) {
      return this.data.products as T[];
    }
    if (q.startsWith("SELECT * FROM EMPLOYEES")) {
      return this.data.employees as T[];
    }
    if (q.startsWith("SELECT * FROM USERS")) {
      return this.data.users as T[];
    }
    if (q.startsWith("SELECT * FROM BILLS")) {
      // Check filters
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
      return this.data.bills as T[];
    }
    if (q.startsWith("SELECT * FROM BILL_ITEMS")) {
      if (query.includes("bill_id = ?")) {
        const billId = params[0];
        return this.data.bill_items.filter(item => item.bill_id === Number(billId)) as T[];
      }
      return this.data.bill_items as T[];
    }
    if (q.startsWith("SELECT * FROM DELETED_ITEMS_HISTORY")) {
      return this.data.deleted_items_history as T[];
    }
    return [];
  }

  async get<T>(query: string, params: any[] = []): Promise<T | undefined> {
    const q = query.trim().toUpperCase();
    if (q.startsWith("SELECT * FROM PRODUCTS WHERE ID = ?") || q.includes("FROM PRODUCTS WHERE ID =")) {
      const id = params[0];
      return this.data.products.find(p => p.id === Number(id)) as T;
    }
    if (q.startsWith("SELECT * FROM EMPLOYEES WHERE ID = ?") || q.includes("FROM EMPLOYEES WHERE ID =")) {
      const id = params[0];
      return this.data.employees.find(e => e.id === Number(id)) as T;
    }
    if (q.startsWith("SELECT * FROM USERS WHERE USERNAME = ?")) {
      const username = params[0];
      return this.data.users.find(u => u.username === username) as T;
    }
    if (q.startsWith("SELECT * FROM PRODUCTS WHERE BARCODE = ?")) {
      const barcode = params[0];
      return this.data.products.find(p => p.barcode === barcode) as T;
    }
    if (q.startsWith("SELECT * FROM BILLS WHERE ID = ?")) {
      const id = params[0];
      return this.data.bills.find(b => b.id === Number(id)) as T;
    }
    if (q.includes("SELECT MAX(BILL_NUMBER)") || q.includes("MAX(BILL_NUMBER)")) {
      // Scoped to a specific date if provided (day-based sequence)
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
      // INSERT INTO bills (bill_number, subtotal, discount, tax, grand_total, payment_method, date, time, cashier_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      // INSERT INTO bill_items (bill_id, product_id, product_name, quantity, rate, total) VALUES (?, ?, ?, ?, ?, ?)
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
      // INSERT INTO deleted_items_history (bill_id, product_name, quantity) VALUES (?, ?, ?)
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

// Helper to seed initial products
function getSeedProducts() {
  return [
    { name: "Chocolate Cake", category: "Cakes", price: 450, tax_percent: 5, barcode: "890105800101", sku: "CK-CHO", status: "Available", quantity_type: "pcs" },
    { name: "Black Forest Cake", category: "Cakes", price: 550, tax_percent: 5, barcode: "890105800102", sku: "CK-BLF", status: "Available", quantity_type: "pcs" },
    { name: "Vanilla Cake", category: "Cakes", price: 400, tax_percent: 5, barcode: "890105800103", sku: "CK-VAN", status: "Available", quantity_type: "pcs" },
    { name: "Red Velvet Cake", category: "Cakes", price: 600, tax_percent: 5, barcode: "890105800104", sku: "CK-RDV", status: "Available", quantity_type: "pcs" },
    
    { name: "Chicken Puff", category: "Puffs", price: 25, tax_percent: 5, barcode: "890105800201", sku: "PF-CHK", status: "Available", quantity_type: "pcs" },
    { name: "Egg Puff", category: "Puffs", price: 20, tax_percent: 5, barcode: "890105800202", sku: "PF-EGG", status: "Available", quantity_type: "pcs" },
    { name: "Veg Puff", category: "Puffs", price: 15, tax_percent: 5, barcode: "890105800203", sku: "PF-VEG", status: "Available", quantity_type: "pcs" },
    { name: "Paneer Puff", category: "Puffs", price: 22, tax_percent: 5, barcode: "890105800204", sku: "PF-PAN", status: "Available", quantity_type: "pcs" },
    
    { name: "White Bread", category: "Bread", price: 35, tax_percent: 0, barcode: "890105800301", sku: "BD-WHT", status: "Available", quantity_type: "pcs" },
    { name: "Brown Bread", category: "Bread", price: 45, tax_percent: 0, barcode: "890105800302", sku: "BD-BRN", status: "Available", quantity_type: "pcs" },
    { name: "Multigrain Bread", category: "Bread", price: 55, tax_percent: 0, barcode: "890105800303", sku: "BD-MLT", status: "Available", quantity_type: "pcs" },
    
    { name: "Masala Tea", category: "Tea", price: 12, tax_percent: 0, barcode: "890105800401", sku: "BV-TEA", status: "Available", quantity_type: "pcs" },
    { name: "Filter Coffee", category: "Coffee", price: 15, tax_percent: 0, barcode: "890105800402", sku: "BV-COF", status: "Available", quantity_type: "pcs" },
    { name: "Green Tea", category: "Tea", price: 20, tax_percent: 0, barcode: "890105800403", sku: "BV-GRN", status: "Available", quantity_type: "pcs" },
    { name: "Cold Coffee", category: "Coffee", price: 40, tax_percent: 5, barcode: "890105800404", sku: "BV-CLD", status: "Available", quantity_type: "pcs" },
    
    { name: "Butter Cookies", category: "Cookies", price: 120, tax_percent: 18, barcode: "890105800501", sku: "CK-BUT", status: "Available", quantity_type: "pack" },
    { name: "Chocolate Cookies", category: "Cookies", price: 140, tax_percent: 18, barcode: "890105800502", sku: "CK-CHO-C", status: "Available", quantity_type: "pack" },
    
    { name: "Veg Samosa", category: "Snacks", price: 12, tax_percent: 5, barcode: "890105800601", sku: "SN-VEG", status: "Available", quantity_type: "pcs" },
    { name: "Chicken Roll", category: "Snacks", price: 35, tax_percent: 5, barcode: "890105800602", sku: "SN-CHK", status: "Available", quantity_type: "pcs" }
  ];
}

// Database initialization loader
export async function getDatabase(): Promise<DatabaseEngine> {
  if (dbInstance) return dbInstance;

  try {
    console.log("Attempting to initialize SQLite database at", sqlitePath);
    // Dynamic import to handle SQLite load failure gracefully
    const sqlite3 = require('sqlite3').verbose();
    
    const db = new sqlite3.Database(sqlitePath);
    
    // Perform initial tables set up synchronously using standard promises
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
        quantity_type TEXT DEFAULT 'pcs'
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
        try {
          await nativeEngine.run("ROLLBACK");
        } catch (rollbackErr) {
          console.error("Rollback failed...", rollbackErr);
        }
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

    // Check if user seeding is necessary
    const usrCount = await nativeEngine.get<{ 'count(*)': number }>("SELECT count(*) FROM users");
    if (usrCount && usrCount['count(*)'] === 0) {
      console.log("Seeding default users database...");
      await nativeEngine.run(
        `INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)`,
        ["admin", "admin123", "admin", "Administrator"]
      );
      await nativeEngine.run(
        `INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)`,
        ["employee", "employee123", "employee", "Employee"]
      );
      console.log("User seeding completed.");
    }

    // Check if employee seeding is necessary
    const empCount = await nativeEngine.get<{ 'count(*)': number }>("SELECT count(*) FROM employees");
    if (empCount && empCount['count(*)'] === 0) {
      console.log("Seeding default employees database...");
      const seeds = [
        { name: "Joel Brown", role: "Manager", phone: "+91 98765 00001", email: "joel@billingsoftware.com", salary: 35000, status: "Active", joined_date: "2025-01-15" },
        { name: "Alice Smith", role: "Cashier", phone: "+91 98765 00002", email: "alice@billingsoftware.com", salary: 20000, status: "Active", joined_date: "2025-02-10" },
        { name: "Chef Bob", role: "Baker", phone: "+91 98765 00003", email: "bob@billingsoftware.com", salary: 28000, status: "Active", joined_date: "2025-01-20" }
      ];
      for (const e of seeds) {
        await nativeEngine.run(
          `INSERT INTO employees (name, role, phone, email, salary, status, joined_date) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [e.name, e.role, e.phone, e.email, e.salary, e.status, e.joined_date]
        );
      }
      console.log("Employee seeding completed.");
    }

    // Check if seeding is necessary
    const prodCount = await nativeEngine.get<{ 'count(*)': number }>("SELECT count(*) FROM products");
    if (prodCount && prodCount['count(*)'] === 0) {
      console.log("Seeding default bakery products database...");
      const seeds = getSeedProducts();
      for (const p of seeds) {
        await nativeEngine.run(
          `INSERT INTO products (name, category, price, barcode, sku, tax_percent, status, quantity_type) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [p.name, p.category, p.price, p.barcode, p.sku, p.tax_percent, p.status, p.quantity_type]
        );
      }
      console.log("Product seeding completed.");
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

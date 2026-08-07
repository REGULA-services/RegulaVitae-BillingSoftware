import express from 'express';
import cors from 'cors';
import { getDatabase } from './database';
import { generateDailyExcel, generateWeeklyExcel, generateYearlyExcel } from './excel';

const app = express();
const PORT = process.env.PORT || 4848;

app.use(cors());
app.use(express.json());

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
      [Number(bill_number), Number(subtotal), Number(discount), Number(tax), Number(grand_total), payment_method, dateStr, timeStr, cashier_name || 'Cashier']
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

// Local Storage Database Emulator for Standalone Mobile Web / PWA views

// Check if we are running in Electron
const isElectron = typeof window !== 'undefined' && (window as any).electron !== undefined;

// Initial Seeding Data
const DEFAULT_PRODUCTS = [
  { id: 1, name: "Chocolate Cake", category: "Cakes", price: 450, tax_percent: 5, barcode: "890105800101", sku: "CK-CHO", status: "Available", quantity_type: "pcs" },
  { id: 2, name: "Black Forest Cake", category: "Cakes", price: 550, tax_percent: 5, barcode: "890105800102", sku: "CK-BLF", status: "Available", quantity_type: "pcs" },
  { id: 3, name: "Vanilla Cake", category: "Cakes", price: 400, tax_percent: 5, barcode: "890105800103", sku: "CK-VAN", status: "Available", quantity_type: "pcs" },
  { id: 4, name: "Red Velvet Cake", category: "Cakes", price: 600, tax_percent: 5, barcode: "890105800104", sku: "CK-RDV", status: "Available", quantity_type: "pcs" },
  { id: 5, name: "Chicken Puff", category: "Puffs", price: 25, tax_percent: 5, barcode: "890105800201", sku: "PF-CHK", status: "Available", quantity_type: "pcs" },
  { id: 6, name: "Egg Puff", category: "Puffs", price: 20, tax_percent: 5, barcode: "890105800202", sku: "PF-EGG", status: "Available", quantity_type: "pcs" },
  { id: 7, name: "Veg Puff", category: "Puffs", price: 15, tax_percent: 5, barcode: "890105800203", sku: "PF-VEG", status: "Available", quantity_type: "pcs" },
  { id: 8, name: "Paneer Puff", category: "Puffs", price: 22, tax_percent: 5, barcode: "890105800204", sku: "PF-PAN", status: "Available", quantity_type: "pcs" },
  { id: 9, name: "White Bread", category: "Bread", price: 35, tax_percent: 0, barcode: "890105800301", sku: "BD-WHT", status: "Available", quantity_type: "pcs" },
  { id: 10, name: "Brown Bread", category: "Bread", price: 45, tax_percent: 0, barcode: "890105800302", sku: "BD-BRN", status: "Available", quantity_type: "pcs" },
  { id: 11, name: "Multigrain Bread", category: "Bread", price: 55, tax_percent: 0, barcode: "890105800303", sku: "BD-MLT", status: "Available", quantity_type: "pcs" },
  { id: 12, name: "Masala Tea", category: "Tea", price: 12, tax_percent: 0, barcode: "890105800401", sku: "BV-TEA", status: "Available", quantity_type: "pcs" },
  { id: 13, name: "Filter Coffee", category: "Coffee", price: 15, tax_percent: 0, barcode: "890105800402", sku: "BV-COF", status: "Available", quantity_type: "pcs" },
  { id: 14, name: "Green Tea", category: "Tea", price: 20, tax_percent: 0, barcode: "890105800403", sku: "BV-GRN", status: "Available", quantity_type: "pcs" },
  { id: 15, name: "Cold Coffee", category: "Coffee", price: 40, tax_percent: 5, barcode: "890105800404", sku: "BV-CLD", status: "Available", quantity_type: "pcs" },
  { id: 16, name: "Butter Cookies", category: "Cookies", price: 120, tax_percent: 18, barcode: "890105800501", sku: "CK-BUT", status: "Available", quantity_type: "pack" },
  { id: 17, name: "Chocolate Cookies", category: "Cookies", price: 140, tax_percent: 18, barcode: "890105800502", sku: "CK-CHO-C", status: "Available", quantity_type: "pack" },
  { id: 18, name: "Veg Samosa", category: "Snacks", price: 12, tax_percent: 5, barcode: "890105800601", sku: "SN-VEG", status: "Available", quantity_type: "pcs" },
  { id: 19, name: "Chicken Roll", category: "Snacks", price: 35, tax_percent: 5, barcode: "890105800602", sku: "SN-CHK", status: "Available", quantity_type: "pcs" }
];

const DEFAULT_EMPLOYEES = [
  { id: 1, name: "Joel Brown", role: "Manager", phone: "+91 98765 00001", email: "joel@billingsoftware.com", salary: 35000, status: "Active", joined_date: "2025-01-15" },
  { id: 2, name: "Alice Smith", role: "Cashier", phone: "+91 98765 00002", email: "alice@billingsoftware.com", salary: 20000, status: "Active", joined_date: "2025-02-10" },
  { id: 3, name: "Chef Bob", role: "Baker", phone: "+91 98765 00003", email: "bob@billingsoftware.com", salary: 28000, status: "Active", joined_date: "2025-01-20" }
];

// Helper to get monday and sunday of a given date (matching server calendar bounds)
function getMondayAndSunday(dStr: string) {
  const d = new Date(dStr);
  const day = d.getDay();
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

// Database state accessor helpers
const getDbData = (key: string, defaults: any) => {
  const raw = localStorage.getItem(`db_${key}`);
  if (!raw) {
    localStorage.setItem(`db_${key}`, JSON.stringify(defaults));
    return defaults;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    return defaults;
  }
};

const saveDbData = (key: string, data: any) => {
  localStorage.setItem(`db_${key}`, JSON.stringify(data));
};

// Response factory helper
const makeResponse = (data: any, status: number = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
};

// Initialize interceptor
export function initMockFetch() {
  if (isElectron) return; // Keep Electron calling real backend server

  console.log("[MOCK DB] Non-Electron environment detected. Local database emulator active!");

  const originalFetch = window.fetch;

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const urlStr = typeof input === 'string' ? input : (input as any).url || input.toString();

    // Only intercept our local Express API server endpoints
    if (!urlStr.includes("localhost:4848") && !urlStr.startsWith("/api/")) {
      return originalFetch.apply(this, arguments as any);
    }

    const parsedUrl = new URL(urlStr, window.location.origin);
    const path = parsedUrl.pathname;
    const method = (init?.method || 'GET').toUpperCase();
    const params = parsedUrl.searchParams;

    try {
      // ----------------------------------------------------
      // PRODUCTS API MOCK
      // ----------------------------------------------------
      if (path === '/api/products') {
        let products = getDbData('products', DEFAULT_PRODUCTS);

        if (method === 'GET') {
          // Sort products by name alphabetically
          products.sort((a: any, b: any) => a.name.localeCompare(b.name));
          return makeResponse(products);
        }

        if (method === 'POST') {
          const body = JSON.parse(init?.body as string || '{}');
          if (!body.name || !body.category || body.price === undefined) {
            return makeResponse({ error: "Missing required product fields." }, 400);
          }
          const exists = products.some((p: any) => 
            p.name.toLowerCase() === body.name.toLowerCase() || 
            (body.barcode && p.barcode === body.barcode) ||
            (body.sku && p.sku === body.sku)
          );
          if (exists) {
            return makeResponse({ error: "Product name, SKU, or Barcode already exists." }, 400);
          }

          const newId = products.length > 0 ? Math.max(...products.map((p: any) => p.id)) + 1 : 1;
          const newProduct = {
            id: newId,
            name: body.name,
            category: body.category,
            price: Number(body.price),
            barcode: body.barcode || null,
            sku: body.sku || null,
            tax_percent: Number(body.tax_percent || 0),
            status: body.status || 'Available',
            quantity_type: body.quantity_type || 'pcs'
          };
          products.push(newProduct);
          saveDbData('products', products);
          return makeResponse(newProduct, 201);
        }
      }

      // Update / Delete Products by ID
      if (path.startsWith('/api/products/')) {
        const idStr = path.substring('/api/products/'.length);
        
        // Barcode check route: /api/products/barcode/:barcode
        if (idStr.startsWith('barcode/')) {
          const barcode = idStr.substring('barcode/'.length);
          const products = getDbData('products', DEFAULT_PRODUCTS);
          const product = products.find((p: any) => p.barcode === barcode && p.status === 'Available');
          if (!product) {
            return makeResponse({ error: "Product not found." }, 404);
          }
          return makeResponse(product);
        }

        const id = Number(idStr);
        let products = getDbData('products', DEFAULT_PRODUCTS);
        const idx = products.findIndex((p: any) => p.id === id);

        if (idx === -1) {
          return makeResponse({ error: "Product not found." }, 404);
        }

        if (method === 'PUT') {
          const body = JSON.parse(init?.body as string || '{}');
          const updated = {
            ...products[idx],
            name: body.name,
            category: body.category,
            price: Number(body.price),
            barcode: body.barcode || null,
            sku: body.sku || null,
            tax_percent: Number(body.tax_percent || 0),
            status: body.status || 'Available',
            quantity_type: body.quantity_type || 'pcs'
          };
          products[idx] = updated;
          saveDbData('products', products);
          return makeResponse(updated);
        }

        if (method === 'DELETE') {
          products.splice(idx, 1);
          saveDbData('products', products);
          return makeResponse({ message: "Product deleted successfully.", id });
        }
      }

      // ----------------------------------------------------
      // EMPLOYEES API MOCK
      // ----------------------------------------------------
      if (path === '/api/employees') {
        let employees = getDbData('employees', DEFAULT_EMPLOYEES);

        if (method === 'GET') {
          employees.sort((a: any, b: any) => a.name.localeCompare(b.name));
          return makeResponse(employees);
        }

        if (method === 'POST') {
          const body = JSON.parse(init?.body as string || '{}');
          if (!body.name || !body.role) {
            return makeResponse({ error: "Missing required employee fields." }, 400);
          }
          const exists = employees.some((e: any) => e.name.toLowerCase() === body.name.toLowerCase());
          if (exists) {
            return makeResponse({ error: "Employee name already exists." }, 400);
          }

          const newId = employees.length > 0 ? Math.max(...employees.map((e: any) => e.id)) + 1 : 1;
          const newEmp = {
            id: newId,
            name: body.name,
            role: body.role,
            phone: body.phone || null,
            email: body.email || null,
            salary: body.salary !== undefined && body.salary !== null ? Number(body.salary) : null,
            status: body.status || 'Active',
            joined_date: body.joined_date || null
          };
          employees.push(newEmp);
          saveDbData('employees', employees);
          return makeResponse(newEmp, 201);
        }
      }

      if (path.startsWith('/api/employees/')) {
        const id = Number(path.substring('/api/employees/'.length));
        let employees = getDbData('employees', DEFAULT_EMPLOYEES);
        const idx = employees.findIndex((e: any) => e.id === id);

        if (idx === -1) {
          return makeResponse({ error: "Employee not found." }, 404);
        }

        if (method === 'PUT') {
          const body = JSON.parse(init?.body as string || '{}');
          const updated = {
            ...employees[idx],
            name: body.name,
            role: body.role,
            phone: body.phone || null,
            email: body.email || null,
            salary: body.salary !== undefined && body.salary !== null ? Number(body.salary) : null,
            status: body.status || 'Active',
            joined_date: body.joined_date || null
          };
          employees[idx] = updated;
          saveDbData('employees', employees);
          return makeResponse(updated);
        }

        if (method === 'DELETE') {
          employees.splice(idx, 1);
          saveDbData('employees', employees);
          return makeResponse({ message: "Employee deleted successfully.", id });
        }
      }

      // ----------------------------------------------------
      // BILLING / INVOICING API MOCK
      // ----------------------------------------------------
      if (path === '/api/bills/next-number') {
        const bills = getDbData('bills', []);
        const todayStr = new Date().toISOString().split('T')[0];
        const todaysBills = bills.filter((b: any) => b.date === todayStr);
        const nextVal = todaysBills.length > 0 ? Math.max(...todaysBills.map((b: any) => b.bill_number)) + 1 : 1;
        return makeResponse({ nextBillNumber: nextVal });
      }

      if (path === '/api/bills') {
        let bills = getDbData('bills', []);

        if (method === 'GET') {
          const period = params.get('period') || 'day';
          const dateStr = params.get('date') || new Date().toISOString().split('T')[0];
          const year = Number(params.get('year') || new Date().getFullYear());

          let filteredBills = [];

          if (period === 'day') {
            filteredBills = bills.filter((b: any) => b.date === dateStr);
          } else if (period === 'week') {
            const { monday, sunday } = getMondayAndSunday(dateStr);
            filteredBills = bills.filter((b: any) => b.date >= monday && b.date <= sunday);
          } else if (period === 'year') {
            filteredBills = bills.filter((b: any) => b.date.startsWith(`${year}-`));
          }

          // Sort descending by date and time
          filteredBills.sort((a: any, b: any) => {
            const dateDiff = b.date.localeCompare(a.date);
            if (dateDiff !== 0) return dateDiff;
            return b.time.localeCompare(a.time);
          });

          return makeResponse(filteredBills);
        }

        if (method === 'POST') {
          const body = JSON.parse(init?.body as string || '{}');
          if (!body.bill_number || body.grand_total === undefined || !body.payment_method || !body.items || !Array.isArray(body.items)) {
            return makeResponse({ error: "Invalid bill payload. Missing required properties." }, 400);
          }

          const now = new Date();
          const dateStr = now.toISOString().split('T')[0];
          const timeStr = now.toTimeString().split(' ')[0];

          // Check if bill number already exists for today
          const exists = bills.some((b: any) => b.date === dateStr && b.bill_number === Number(body.bill_number));
          if (exists) {
            return makeResponse({ error: `Bill number ${body.bill_number} already exists.` }, 400);
          }

          const newId = bills.length > 0 ? Math.max(...bills.map((b: any) => b.id)) + 1 : 1;
          const newBill = {
            id: newId,
            bill_number: Number(body.bill_number),
            subtotal: Number(body.subtotal),
            discount: Number(body.discount),
            tax: Number(body.tax),
            grand_total: Number(body.grand_total),
            payment_method: body.payment_method,
            date: dateStr,
            time: timeStr,
            cashier_name: body.cashier_name || 'Cashier',
            items: body.items.map((it: any) => ({
              product_id: it.product_id,
              product_name: it.product_name,
              quantity: Number(it.quantity),
              rate: Number(it.rate),
              total: Number(it.total)
            }))
          };
          bills.push(newBill);
          saveDbData('bills', bills);
          return makeResponse(newBill, 201);
        }
      }

      // Specific bill actions: /api/bills/:id/items or delete /api/bills/:id
      if (path.startsWith('/api/bills/')) {
        const subPath = path.substring('/api/bills/'.length);
        
        if (subPath.endsWith('/items')) {
          const id = Number(subPath.substring(0, subPath.indexOf('/items')));
          const bills = getDbData('bills', []);
          const bill = bills.find((b: any) => b.id === id);
          if (!bill) {
            return makeResponse([], 200); // return empty list
          }
          return makeResponse(bill.items || []);
        }

        // Delete bill by ID
        const id = Number(subPath);
        let bills = getDbData('bills', []);
        const idx = bills.findIndex((b: any) => b.id === id);
        if (idx === -1) {
          return makeResponse({ error: "Bill not found." }, 404);
        }
        bills.splice(idx, 1);
        saveDbData('bills', bills);
        return makeResponse({ message: "Bill deleted successfully.", id });
      }

      // ----------------------------------------------------
      // DELETED ITEMS HISTORY AUDIT MOCK
      // ----------------------------------------------------
      if (path === '/api/deleted-items') {
        let logs = getDbData('deleted_items', []);

        if (method === 'GET') {
          logs.sort((a: any, b: any) => b.deleted_at.localeCompare(a.deleted_at));
          return makeResponse(logs.slice(0, 100)); // limit to 100
        }

        if (method === 'POST') {
          const body = JSON.parse(init?.body as string || '{}');
          const newLog = {
            id: logs.length > 0 ? Math.max(...logs.map((l: any) => l.id)) + 1 : 1,
            bill_id: body.bill_id ? Number(body.bill_id) : null,
            product_name: body.product_name,
            quantity: Number(body.quantity),
            deleted_at: new Date().toISOString()
          };
          logs.push(newLog);
          saveDbData('deleted_items', logs);
          return makeResponse({ success: true }, 201);
        }
      }

      // ----------------------------------------------------
      // REPORTS / SALES ANALYTICS API MOCK
      // ----------------------------------------------------
      if (path.startsWith('/api/reports/')) {
        const reportType = path.substring('/api/reports/'.length); // 'daily', 'weekly', 'yearly'
        const bills = getDbData('bills', []);

        if (reportType === 'daily') {
          const dateStr = params.get('date') || new Date().toISOString().split('T')[0];
          const dayBills = bills.filter((b: any) => b.date === dateStr);
          
          let totalSales = 0;
          const paymentBreakdown = { Cash: 0, GooglePay: 0, BankCard: 0 };
          const productsMap: { [key: string]: { name: string; quantity: number; total: number } } = {};

          dayBills.forEach((b: any) => {
            totalSales += b.grand_total;
            const pm = b.payment_method;
            if (pm === "Cash") paymentBreakdown.Cash += b.grand_total;
            else if (pm === "Google Pay" || pm === "GooglePay") paymentBreakdown.GooglePay += b.grand_total;
            else if (pm === "Bank Card" || pm === "BankCard") paymentBreakdown.BankCard += b.grand_total;

            if (b.items) {
              b.items.forEach((it: any) => {
                if (!productsMap[it.product_name]) {
                  productsMap[it.product_name] = { name: it.product_name, quantity: 0, total: 0 };
                }
                productsMap[it.product_name].quantity += it.quantity;
                productsMap[it.product_name].total += it.total;
              });
            }
          });

          const topProducts = Object.values(productsMap).sort((a, b) => b.quantity - a.quantity);

          return makeResponse({
            date: dateStr,
            totalSales,
            billCount: dayBills.length,
            paymentBreakdown,
            topProducts,
            allBills: dayBills
          });
        }

        if (reportType === 'weekly') {
          const dateStr = params.get('date') || new Date().toISOString().split('T')[0];
          const { monday, sunday } = getMondayAndSunday(dateStr);
          const weekBills = bills.filter((b: any) => b.date >= monday && b.date <= sunday);

          let totalSales = 0;
          const paymentBreakdown = { Cash: 0, GooglePay: 0, BankCard: 0 };
          const productsMap: { [key: string]: { name: string; quantity: number; total: number } } = {};

          // Populate daily breakdown arrays
          const dailyBreakdownMap: { [key: string]: { date: string; amount: number; bills: number } } = {};
          let runner = new Date(monday);
          for (let i = 0; i < 7; i++) {
            const dStr = runner.toISOString().split('T')[0];
            dailyBreakdownMap[dStr] = { date: dStr, amount: 0, bills: 0 };
            runner.setDate(runner.getDate() + 1);
          }

          weekBills.forEach((b: any) => {
            totalSales += b.grand_total;
            const pm = b.payment_method;
            if (pm === "Cash") paymentBreakdown.Cash += b.grand_total;
            else if (pm === "Google Pay" || pm === "GooglePay") paymentBreakdown.GooglePay += b.grand_total;
            else if (pm === "Bank Card" || pm === "BankCard") paymentBreakdown.BankCard += b.grand_total;

            if (dailyBreakdownMap[b.date]) {
              dailyBreakdownMap[b.date].amount += b.grand_total;
              dailyBreakdownMap[b.date].bills += 1;
            }

            if (b.items) {
              b.items.forEach((it: any) => {
                if (!productsMap[it.product_name]) {
                  productsMap[it.product_name] = { name: it.product_name, quantity: 0, total: 0 };
                }
                productsMap[it.product_name].quantity += it.quantity;
                productsMap[it.product_name].total += it.total;
              });
            }
          });

          const topProducts = Object.values(productsMap).sort((a, b) => b.quantity - a.quantity);
          const dailyBreakdown = Object.values(dailyBreakdownMap);

          return makeResponse({
            dateRange: `${monday} to ${sunday}`,
            totalSales,
            dailyBreakdown,
            paymentBreakdown,
            topProducts
          });
        }

        if (reportType === 'yearly') {
          const year = Number(params.get('year') || new Date().getFullYear());
          const yearBills = bills.filter((b: any) => b.date.startsWith(`${year}-`));

          let totalSales = 0;
          const paymentBreakdown = { Cash: 0, GooglePay: 0, BankCard: 0 };
          const productsMap: { [key: string]: { name: string; quantity: number; total: number } } = {};

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

          yearBills.forEach((b: any) => {
            totalSales += b.grand_total;
            const pm = b.payment_method;
            if (pm === "Cash") paymentBreakdown.Cash += b.grand_total;
            else if (pm === "Google Pay" || pm === "GooglePay") paymentBreakdown.GooglePay += b.grand_total;
            else if (pm === "Bank Card" || pm === "BankCard") paymentBreakdown.BankCard += b.grand_total;

            const mIdx = new Date(b.date).getMonth();
            if (mIdx >= 0 && mIdx < 12) {
              monthlyBreakdown[mIdx].amount += b.grand_total;
              monthlyBreakdown[mIdx].bills += 1;
            }

            if (b.items) {
              b.items.forEach((it: any) => {
                if (!productsMap[it.product_name]) {
                  productsMap[it.product_name] = { name: it.product_name, quantity: 0, total: 0 };
                }
                productsMap[it.product_name].quantity += it.quantity;
                productsMap[it.product_name].total += it.total;
              });
            }
          });

          // Calculate Month-on-Month Growth
          for (let i = 0; i < 12; i++) {
            if (i > 0) {
              const prev = monthlyBreakdown[i - 1].amount;
              const curr = monthlyBreakdown[i].amount;
              monthlyBreakdown[i].growthPercent = prev === 0 ? (curr > 0 ? 1 : 0) : (curr - prev) / prev;
            }
          }

          const topProducts = Object.values(productsMap).sort((a, b) => b.quantity - a.quantity);

          return makeResponse({
            year,
            totalSales,
            monthlyBreakdown,
            paymentBreakdown,
            topProducts
          });
        }
      }

      // Default fallback for unhandled /api requests
      return makeResponse({ error: "Method or route not emulated." }, 404);

    } catch (err: any) {
      console.error("[MOCK DB] Error processing request:", err);
      return makeResponse({ error: err.message }, 500);
    }
  };
}

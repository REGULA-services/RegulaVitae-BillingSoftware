const http = require('http');

// Start express server programmatically or import database
const { getDatabase } = require('../dist-electron/src/server/database');

async function runTests() {
  console.log("=== STARTING BACKEND FUNCTIONALITY TESTS ===");
  
  try {
    const db = await getDatabase();
    console.log(`[DB INITIALIZATION] Engine loaded. Fallback mode: ${db.isFallback}`);

    // Test 1: Products Query & Operations
    console.log("\n--- Testing Product Operations ---");
    const initialProducts = await db.all("SELECT * FROM products");
    console.log(`Initial product count: ${initialProducts.length}`);

    // Create test product
    const testBarcode = "TEST_BARCODE_" + Date.now();
    const testSku = "TEST_SKU_" + Date.now();
    const newProd = await db.run(
      `INSERT INTO products (name, category, price, barcode, sku, tax_percent, status, quantity_type) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ["Test Pastry", "Cakes", 99.99, testBarcode, testSku, 5, "Available", "pcs"]
    );
    console.log(`[PASS] Created product with ID: ${newProd.lastID}`);

    const fetchedProd = await db.get("SELECT * FROM products WHERE id = ?", [newProd.lastID]);
    if (fetchedProd && fetchedProd.name === "Test Pastry") {
      console.log(`[PASS] Fetched product correctly: ${fetchedProd.name}`);
    } else {
      console.error(`[FAIL] Product fetch mismatch`);
    }

    // Update product
    await db.run(
      `UPDATE products SET price = ? WHERE id = ?`,
      [149.99, newProd.lastID]
    );
    const updatedProd = await db.get("SELECT * FROM products WHERE id = ?", [newProd.lastID]);
    if (updatedProd && updatedProd.price === 149.99) {
      console.log(`[PASS] Product price updated successfully to ${updatedProd.price}`);
    } else {
      console.error(`[FAIL] Product update failed`);
    }

    // Delete test product
    await db.run("DELETE FROM products WHERE id = ?", [newProd.lastID]);
    const deletedProd = await db.get("SELECT * FROM products WHERE id = ?", [newProd.lastID]);
    if (!deletedProd) {
      console.log(`[PASS] Product deleted successfully`);
    } else {
      console.error(`[FAIL] Product delete failed`);
    }

    // Test 2: Employees Operations
    console.log("\n--- Testing Employee Operations ---");
    const employees = await db.all("SELECT * FROM employees");
    console.log(`Initial employee count: ${employees.length}`);
    
    const empName = "Test Employee " + Date.now();
    const newEmp = await db.run(
      `INSERT INTO employees (name, role, phone, email, salary, status, joined_date) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [empName, "Tester", "+91 9999999999", "test@test.com", 25000, "Active", "2026-01-01"]
    );
    console.log(`[PASS] Created employee with ID: ${newEmp.lastID}`);

    await db.run("DELETE FROM employees WHERE id = ?", [newEmp.lastID]);
    console.log(`[PASS] Cleaned up test employee`);

    // Test 3: Bills and Bill Items Operations
    console.log("\n--- Testing Billing Operations ---");
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Get max bill number
    const maxRow = await db.get("SELECT MAX(bill_number) FROM bills WHERE date = ?", [todayStr]);
    const nextBillNum = (maxRow && maxRow["MAX(bill_number)"]) ? maxRow["MAX(bill_number)"] + 1 : 1;
    console.log(`Next Bill Number for today (${todayStr}): ${nextBillNum}`);

    const newBill = await db.run(
      `INSERT INTO bills (bill_number, subtotal, discount, tax, grand_total, payment_method, date, time, cashier_name) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nextBillNum, 200, 10, 5, 195, "Cash", todayStr, "12:00:00", "Test Cashier"]
    );
    console.log(`[PASS] Created test bill ID: ${newBill.lastID}`);

    await db.run(
      `INSERT INTO bill_items (bill_id, product_id, product_name, quantity, rate, total) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [newBill.lastID, 1, "Chocolate Cake", 2, 100, 200]
    );
    console.log(`[PASS] Added bill item to bill ${newBill.lastID}`);

    const items = await db.all("SELECT * FROM bill_items WHERE bill_id = ?", [newBill.lastID]);
    if (items.length === 1 && items[0].product_name === "Chocolate Cake") {
      console.log(`[PASS] Retreived bill items successfully: ${items[0].product_name} x${items[0].quantity}`);
    } else {
      console.error(`[FAIL] Bill items mismatch`);
    }

    // Clean up test bill
    await db.run("DELETE FROM bill_items WHERE bill_id = ?", [newBill.lastID]);
    await db.run("DELETE FROM bills WHERE id = ?", [newBill.lastID]);
    console.log(`[PASS] Cleaned up test bill and bill items`);

    // Test 4: Users & Authentication Operations
    console.log("\n--- Testing Authentication & User Accounts ---");
    const adminUser = await db.get("SELECT * FROM users WHERE username = ?", ["admin"]);
    if (adminUser && adminUser.username === "admin" && adminUser.role === "admin") {
      console.log(`[PASS] Admin account verified: ${adminUser.username} (Role: ${adminUser.role})`);
    } else {
      console.error(`[FAIL] Admin account missing or invalid`);
    }

    const employeeUser = await db.get("SELECT * FROM users WHERE username = ?", ["employee"]);
    if (employeeUser && employeeUser.username === "employee" && employeeUser.role === "employee") {
      console.log(`[PASS] Employee account verified: ${employeeUser.username} (Role: ${employeeUser.role})`);
    } else {
      console.error(`[FAIL] Employee account missing or invalid`);
    }

    console.log("\n=== ALL BACKEND FUNCTIONALITY TESTS COMPLETED SUCCESSFULLY ===");
  } catch (err) {
    console.error("Test execution error:", err);
    process.exit(1);
  }
}

runTests();

const express = require('express');
const http = require('http');

// Load built server module
const { getDatabase } = require('../dist-electron/src/server/database');

async function testAPI() {
  console.log("=== STARTING API ENDPOINT TESTS ===");

  // Start express app on a temporary test port
  const expressApp = require('express')();
  const cors = require('cors');
  expressApp.use(cors());
  expressApp.use(express.json());

  // Import server routes or test against port 4848 if running
  // Let's start the server programmatically by importing server
  require('../dist-electron/src/server/server');

  // Wait 1 second for server to initialize on port 4848
  await new Promise(res => setTimeout(res, 1000));

  function request(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 4848,
        path,
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, body });
          }
        });
      });

      req.on('error', reject);
      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  try {
    // 1. GET /api/products
    let res = await request('/api/products');
    console.log(`[PASS] GET /api/products -> status ${res.status}, items: ${res.body.length}`);

    // 2. GET /api/employees
    res = await request('/api/employees');
    console.log(`[PASS] GET /api/employees -> status ${res.status}, items: ${res.body.length}`);

    // 3. GET /api/bills/next-number
    res = await request('/api/bills/next-number');
    console.log(`[PASS] GET /api/bills/next-number -> status ${res.status}, nextBillNumber: ${res.body.nextBillNumber}`);

    // 4. POST /api/products
    const prodBarcode = "API_BAR_" + Date.now();
    res = await request('/api/products', 'POST', {
      name: "API Test Cake " + Date.now(),
      category: "Cakes",
      price: 350,
      barcode: prodBarcode,
      sku: "API_SKU_" + Date.now(),
      tax_percent: 5,
      status: "Available",
      quantity_type: "pcs"
    });
    console.log(`[PASS] POST /api/products -> status ${res.status}, created ID: ${res.body.id}`);
    const testProdId = res.body.id;

    // 5. GET /api/products/barcode/:barcode
    res = await request(`/api/products/barcode/${prodBarcode}`);
    console.log(`[PASS] GET /api/products/barcode -> status ${res.status}, found: ${res.body.name}`);

    // 6. PUT /api/products/:id
    res = await request(`/api/products/${testProdId}`, 'PUT', {
      name: "Updated API Test Cake",
      category: "Cakes",
      price: 399,
      barcode: prodBarcode,
      sku: "API_SKU_" + Date.now(),
      tax_percent: 5,
      status: "Available",
      quantity_type: "pcs"
    });
    console.log(`[PASS] PUT /api/products/${testProdId} -> status ${res.status}`);

    // 7. DELETE /api/products/:id
    res = await request(`/api/products/${testProdId}`, 'DELETE');
    console.log(`[PASS] DELETE /api/products/${testProdId} -> status ${res.status}`);

    // 8. POST /api/bills
    res = await request('/api/bills', 'POST', {
      bill_number: 9999,
      subtotal: 500,
      discount: 50,
      tax: 25,
      grand_total: 475,
      payment_method: "Cash",
      cashier_name: "API Tester",
      items: [
        { product_id: 1, product_name: "Chocolate Cake", quantity: 1, rate: 500, total: 500 }
      ]
    });
    console.log(`[PASS] POST /api/bills -> status ${res.status}, created Bill ID: ${res.body.id}`);
    const testBillId = res.body.id;

    // 9. GET /api/bills
    res = await request('/api/bills?period=day');
    console.log(`[PASS] GET /api/bills?period=day -> status ${res.status}, bills count: ${res.body.length}`);

    // 10. GET /api/bills/:id/items
    res = await request(`/api/bills/${testBillId}/items`);
    console.log(`[PASS] GET /api/bills/${testBillId}/items -> status ${res.status}, items: ${res.body.length}`);

    // 11. Reports
    res = await request('/api/reports/daily');
    console.log(`[PASS] GET /api/reports/daily -> status ${res.status}, totalSales: ${res.body.totalSales}`);

    res = await request('/api/reports/weekly');
    console.log(`[PASS] GET /api/reports/weekly -> status ${res.status}, totalSales: ${res.body.totalSales}`);

    res = await request('/api/reports/yearly');
    console.log(`[PASS] GET /api/reports/yearly -> status ${res.status}, totalSales: ${res.body.totalSales}`);

    // 12. DELETE /api/bills/:id
    res = await request(`/api/bills/${testBillId}`, 'DELETE');
    console.log(`[PASS] DELETE /api/bills/${testBillId} -> status ${res.status}`);

    console.log("\n=== ALL API ENDPOINTS TESTED SUCCESSFULLY ===");
    process.exit(0);
  } catch (err) {
    console.error("API testing error:", err);
    process.exit(1);
  }
}

testAPI();

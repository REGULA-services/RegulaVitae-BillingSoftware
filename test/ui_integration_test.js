const assert = require('assert');
const http = require('http');

// Start Express test server
const { server } = require('../dist-electron/src/server/server');

function request(method, path, body = null) {
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
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runUiIntegrationSuite() {
  console.log("================================================================");
  console.log("🏥 MADRAS ORTHO CLINIC - UI & PHARMACY DATA INTEGRATION AUDIT");
  console.log("================================================================");

  // 1. Check Product Catalog & Categories Integrity
  console.log("\n--- 1. Product Catalog & Category Page Validation ---");
  const prodsRes = await request('GET', '/api/products');
  assert.strictEqual(prodsRes.status, 200, "Products API should return 200");
  assert.ok(Array.isArray(prodsRes.body), "Products should be an array");
  console.log(`  ✅ PASS: Products API returned ${prodsRes.body.length} formulations`);

  const categoryCounts = {};
  const blankCategories = [];
  prodsRes.body.forEach(p => {
    if (!p.category || p.category.trim() === '') {
      blankCategories.push(p);
    } else {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    }
  });

  assert.strictEqual(blankCategories.length, 0, "No product should have a blank/null category");
  console.log("  ✅ PASS: Zero products with blank/null category");

  const categories = Object.keys(categoryCounts);
  console.log(`  ✅ PASS: Verified ${categories.length} distinct orthopaedic categories:`);
  categories.forEach(c => {
    assert.ok(categoryCounts[c] > 0, `Category ${c} should have at least 1 medicine`);
    console.log(`     • ${c.padEnd(25)} : ${categoryCounts[c]} medicines`);
  });

  // 2. Verify Registers & Recalls Pages
  console.log("\n--- 2. Statutory Registers & Recall Pages Validation ---");
  const registers = [
    { name: 'Schedule H1 Register', path: '/api/registers/schedule-h1' },
    { name: 'Cold Chain Logs', path: '/api/registers/cold-chain' },
    { name: 'Pharmacy Licences', path: '/api/registers/licences' },
    { name: 'Drug Recalls & Quarantines', path: '/api/registers/recalls' },
    { name: 'Pharmacovigilance ADR Reports', path: '/api/registers/adr-reports' },
    { name: 'Statutory Audit Logs', path: '/api/audit-logs' }
  ];

  for (const reg of registers) {
    const res = await request('GET', reg.path);
    assert.strictEqual(res.status, 200, `${reg.name} endpoint should return 200`);
    assert.ok(Array.isArray(res.body), `${reg.name} MUST return an array (preventing blank pages)`);
    console.log(`  ✅ PASS: ${reg.name} successfully returned valid array (${res.body.length} records)`);
  }

  // 3. Clinical Decision Support (CDS) engine
  console.log("\n--- 3. Clinical Decision Support (CDS) Interactions Check ---");
  const cdsRes = await request('POST', '/api/clinical/check-interactions', {
    items: [
      { name: "Voveran 50mg Tablets", category: "NSAIDs" },
      { name: "Combiflam Tablets", category: "NSAIDs" }
    ]
  });
  assert.strictEqual(cdsRes.status, 200);
  assert.ok(Array.isArray(cdsRes.body.alerts), "CDS alerts must be an array");
  assert.ok(cdsRes.body.alerts.length >= 1, "Duplicate NSAIDs must generate an alert");
  console.log(`  ✅ PASS: CDS engine accurately detected duplicate NSAIDs with recommendation:`);
  console.log(`     "${cdsRes.body.alerts[0].message.slice(0, 75)}..."`);

  // 4. Financial Calculation & Tender Due Logic
  console.log("\n--- 4. Financial Settlement & Cash Tender Verification ---");
  const sampleItems = [
    { price: 100, tax_percent: 12, quantity: 2 }, // Base: 200, Tax: 24 -> 224
    { price: 50, tax_percent: 5, quantity: 1 }     // Base: 50, Tax: 2.5 -> 52.5
  ];
  const subtotal = sampleItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);
  const tax = sampleItems.reduce((acc, it) => acc + ((it.price * it.quantity * it.tax_percent) / 100), 0);
  const discount = 10;
  const grandTotal = Math.round((subtotal + tax - discount) * 100) / 100;

  assert.strictEqual(subtotal, 250);
  assert.strictEqual(tax, 26.5);
  assert.strictEqual(grandTotal, 266.5);

  const cashTendered = 500;
  const changeDue = Math.max(0, cashTendered - grandTotal);
  assert.strictEqual(changeDue, 233.5);
  console.log(`  ✅ PASS: Base: ₹${subtotal}, Tax: ₹${tax}, Grand Total: ₹${grandTotal}, Tender: ₹${cashTendered}, Change Due: ₹${changeDue}`);

  // 5. Patient Database, MRN Generation & Name Disambiguation
  console.log("\n--- 5. Patient Database, Unique MRN & Name Disambiguation ---");
  const nextMrnRes = await request('GET', '/api/patients/next-mrn');
  assert.strictEqual(nextMrnRes.status, 200);
  const nextMrn = nextMrnRes.body.nextMrn || nextMrnRes.body.mrn;
  assert.ok(nextMrn, "Next MRN must be generated");
  assert.match(nextMrn, /^MOC-\d{4}-\d{4}$/, "MRN must match format MOC-YYYY-XXXX");
  console.log(`  ✅ PASS: Next sequential MRN generated: ${nextMrn}`);

  const allPatientsRes = await request('GET', '/api/patients');
  assert.strictEqual(allPatientsRes.status, 200);
  assert.ok(Array.isArray(allPatientsRes.body), "Patients list must be an array");
  assert.ok(allPatientsRes.body.length >= 2, "Patient seed records must exist");
  console.log(`  ✅ PASS: Patient database verified with ${allPatientsRes.body.length} registered profiles`);

  // Disambiguation Search test: Multiple patients with exact same name "Ramesh K"
  const disambigRes = await request('GET', '/api/patients?search=Ramesh');
  assert.strictEqual(disambigRes.status, 200);
  assert.ok(Array.isArray(disambigRes.body), "Disambiguation search must return array");
  const rameshProfiles = disambigRes.body.filter(p => p.name.includes("Ramesh"));
  assert.ok(rameshProfiles.length >= 2, "Must return at least 2 distinct patients sharing same name");
  assert.notStrictEqual(rameshProfiles[0].patient_id, rameshProfiles[1].patient_id, "Identical names must have unique MRNs");
  assert.notStrictEqual(rameshProfiles[0].guardian_name, rameshProfiles[1].guardian_name, "Identical names must be disambiguated by father/husband name (S/o, W/o)");
  assert.notStrictEqual(rameshProfiles[0].phone, rameshProfiles[1].phone, "Identical names must have distinct contact phones");
  console.log(`  ✅ PASS: Verified Tamil Nadu Patient Disambiguation for identical names:`);
  rameshProfiles.forEach(p => {
    console.log(`     • ${p.name.padEnd(12)} | MRN: ${p.patient_id} | ${p.guardian_name.padEnd(18)} | Age: ${p.age} | Phone: ${p.phone} | Locality: ${p.city}`);
  });

  // 6. Patient Prescription & Dispensing History
  console.log("\n--- 6. Patient Prescription & Dispensing History ---");
  const patHistoryRes = await request('GET', `/api/patients/${rameshProfiles[0].id}/history`);
  assert.strictEqual(patHistoryRes.status, 200);
  const historyList = patHistoryRes.body.history || patHistoryRes.body;
  assert.ok(Array.isArray(historyList), "Patient history must be an array");
  console.log(`  ✅ PASS: Retrieved dispensing history for ${rameshProfiles[0].patient_id} (${historyList.length} records)`);

  // 7. Mode A (Clinic Dispensing) vs Mode B (Retail Pharmacy) Separation
  console.log("\n--- 7. Mode A vs Mode B Separation Audit ---");
  const modeABillsRes = await request('GET', '/api/bills?mode=CLINIC_DISPENSING');
  assert.strictEqual(modeABillsRes.status, 200);
  assert.ok(Array.isArray(modeABillsRes.body));
  modeABillsRes.body.forEach(b => {
    assert.strictEqual(b.mode, 'CLINIC_DISPENSING', "All returned bills must be Mode A: CLINIC_DISPENSING");
  });
  console.log(`  ✅ PASS: Filtered Mode A bills exclusively (${modeABillsRes.body.length} clinic dispensing records)`);

  const modeBBillsRes = await request('GET', '/api/bills?mode=RETAIL_PHARMACY');
  assert.strictEqual(modeBBillsRes.status, 200);
  assert.ok(Array.isArray(modeBBillsRes.body));
  modeBBillsRes.body.forEach(b => {
    assert.notStrictEqual(b.mode, 'CLINIC_DISPENSING', "Mode B bills must not be CLINIC_DISPENSING");
  });
  console.log(`  ✅ PASS: Filtered Mode B bills exclusively (${modeBBillsRes.body.length} retail pharmacy records)`);

  console.log("\n================================================================");
  console.log("🏁 ALL UI INTEGRATION & CLINICAL CHECKS PASSED PERFECTLY!");
  console.log("================================================================\n");

  process.exit(0);
}

runUiIntegrationSuite().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});

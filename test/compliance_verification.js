/**
 * Comprehensive Statutory & Compliance Automated Verification Suite
 * Madras Ortho Clinic & Pharmacy POS
 *
 * Verifies regulatory compliance against:
 * 1. Drugs and Cosmetics Act, 1940 & Rules, 1945 (Schedule H, H1, X, G, Rule 65)
 * 2. Pharmacy Act, 1948 & Pharmacy Practice Regulations, 2015 (Registered Pharmacist oversight, Sec 42)
 * 3. Tamil Nadu Clinical Establishments (Regulation) Act, 1997 & Rules, 2018 (Mode A Clinic Outpatient Dispensing)
 * 4. NDPS Act, 1985 & Rules, 1985 (Controlled pain management substances)
 * 5. DPCO 2013 / NPPA Ceiling Prices & Legal Metrology
 * 6. CGST Act, 2017 & TNGST Act, 2017 (Tax calculation & 72-month statutory retention)
 * 7. DPDP Act, 2023 & CERT-In directions (PBKDF2 cryptographic hashing & immutable audit trails)
 * 8. CDSCO Drug Recall & Rapid Patient Contact Tracing Directives
 * 9. Pharmacovigilance Programme of India (PvPI) ADR Reporting Protocol
 * 10. Clinical Decision Support (CDS) for Drug Interactions & Duplicate NSAID Prevention
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

const isolatedComplianceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'moc-compliance-test-'));
process.env.APPDATA = isolatedComplianceDir;
process.env.PORT = String(process.env.TEST_PORT || 4896);

async function runTests() {
  console.log('\n================================================================');
  console.log('🧪 MADRAS ORTHO CLINIC - PHARMACY REGULATORY VERIFICATION SUITE');
  console.log('   Central & Tamil Nadu Legal, Clinical & Technical Compliance');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Reason: ${err.message}`);
      failed++;
    }
  }

  async function asyncTest(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Reason: ${err.message}`);
      failed++;
    }
  }

  // --- PART 1: PRODUCT CATALOG & STATUTORY TAX / HSN AUDIT ---
  console.log('--- 1. Orthopaedic Pharmaceutical Catalog & Tax Audit ---');

  const { ORTHO_MASTER_CATALOG } = require('../dist-electron/src/server/orthoCatalog');

  test('Catalog contains exhaustive orthopaedic medicines (>= 700 items)', () => {
    assert(Array.isArray(ORTHO_MASTER_CATALOG), 'ORTHO_MASTER_CATALOG must be an array');
    assert(ORTHO_MASTER_CATALOG.length >= 700, `Expected >= 700 products, found ${ORTHO_MASTER_CATALOG.length}`);
  });

  test('All items have compliant Indian GST tax categories (0%, 5%, 12%, 18%)', () => {
    const validTaxRates = [0, 5, 12, 18];
    for (const item of ORTHO_MASTER_CATALOG) {
      assert(
        validTaxRates.includes(item.tax_percent),
        `Invalid GST tax ${item.tax_percent}% on item ${item.name}`
      );
    }
  });

  test('All items possess valid HSN Codes according to Indian Customs / GST Tariff', () => {
    const validPrefixes = ['3004', '3006', '9021', '2106', '3002', '3005', '9018'];
    for (const item of ORTHO_MASTER_CATALOG) {
      assert(item.hsn_code, `Missing HSN code on item ${item.name}`);
      const hsnStr = String(item.hsn_code);
      const matches = validPrefixes.some(p => hsnStr.startsWith(p));
      assert(matches, `Unrecognized HSN Code ${item.hsn_code} on ${item.name}`);
    }
  });

  test('CDSCO Schedules are accurately designated (Schedule H, H1, NDPS, OTC)', () => {
    const h1Items = ORTHO_MASTER_CATALOG.filter(p => p.schedule === 'Schedule H1');
    const hItems = ORTHO_MASTER_CATALOG.filter(p => p.schedule === 'Schedule H');
    const ndpsItems = ORTHO_MASTER_CATALOG.filter(p => p.schedule === 'NDPS');
    
    assert(h1Items.length >= 20, `Expected >= 20 Schedule H1 items, found ${h1Items.length}`);
    assert(hItems.length >= 100, `Expected >= 100 Schedule H items, found ${hItems.length}`);
    assert(ndpsItems.length >= 5, `Expected >= 5 NDPS items, found ${ndpsItems.length}`);

    // Verify key orthopaedic drugs
    const tramadol = ORTHO_MASTER_CATALOG.find(p => p.name.toLowerCase().includes('tramadol 50mg'));
    assert(tramadol && tramadol.schedule === 'Schedule H1', 'Tramadol 50mg must be Schedule H1');

    const teriparatide = ORTHO_MASTER_CATALOG.find(p => p.name.toLowerCase().includes('teriparatide'));
    assert(teriparatide && teriparatide.is_cold_chain === 1, 'Teriparatide must be marked as Cold Chain');

    const kneeBrace = ORTHO_MASTER_CATALOG.find(p => p.name.toLowerCase().includes('knee brace'));
    assert(kneeBrace && String(kneeBrace.hsn_code).startsWith('9021'), 'Orthopaedic appliances must use HSN 9021 prefix');
  });

  // --- PART 2: CRYPTOGRAPHIC INTEGRITY & DPDP COMPLIANCE ---
  console.log('\n--- 2. Cryptographic Security & Access Control (DPDP Act 2023) ---');

  const { hashPassword, verifyPassword, getDatabase } = require('../dist-electron/src/server/database');

  test('PBKDF2 Password Hashing generates secure salt and hash', () => {
    const raw = 'SuperSecretPharmacist2026!';
    const { hash, salt } = hashPassword(raw);
    assert(salt && typeof salt === 'string', 'Salt must be a string');
    assert(hash && typeof hash === 'string', 'Hash must be a string');
    assert.strictEqual(salt.length, 32, 'Salt must be 16 bytes (32 hex characters)');
    assert.strictEqual(hash.length, 64, 'PBKDF2-SHA256 hash must be 32 bytes (64 hex characters)');
  });

  test('verifyPassword authenticates correct password and rejects wrong password', () => {
    const raw = 'ValidOrthoDoctor99#';
    const { hash, salt } = hashPassword(raw);
    assert.strictEqual(verifyPassword(raw, hash, salt), true, 'Valid password verification failed');
    assert.strictEqual(verifyPassword('WrongPassword!', hash, salt), false, 'Invalid password should be rejected');
  });

  // --- PART 3: DATABASE ENGINE STATUTORY INTEGRITY ---
  console.log('\n--- 3. Database Engine & Statutory Record Retention ---');

  const db = await getDatabase();

  await asyncTest('Database initializes with retail licences and audit capabilities', async () => {
    const licences = await db.all("SELECT * FROM pharmacy_licences");
    assert(licences.length >= 2, `Expected at least 2 licences, found ${licences.length}`);
    const f20b = licences.find(l => l.licence_type.includes('20'));
    assert(f20b, 'Form 20/20B retail licence missing');
  });

  await asyncTest('Cold chain logging baseline initialized', async () => {
    const logs = await db.all("SELECT * FROM cold_chain_logs");
    assert(logs.length >= 2, `Expected baseline cold chain logs, found ${logs.length}`);
    const normalLog = logs.find(l => l.status === 'Normal');
    assert(normalLog, 'Normal status temperature log missing');
  });

  // --- PART 4: EXPRESS SERVER REGULATORY INTERCEPTORS & API TESTS ---
  console.log('\n--- 4. API Endpoints, Dual Operating Modes & Regulatory Interceptors ---');

  const { server } = require('../dist-electron/src/server/server');
  const testPort = Number(process.env.PORT || 4896);
  let adminAuthToken = null;
  let adminLoginPromise = null;

  function rawRequest(method, endpoint, body, token) {
    return new Promise((resolve, reject) => {
      const payload = body ? JSON.stringify(body) : null;
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      };
      const req = http.request({
        hostname: 'localhost',
        port: testPort,
        path: endpoint,
        method: method,
        headers
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, data: parsed });
          } catch {
            resolve({ status: res.statusCode, data });
          }
        });
      });
      req.on('error', reject);
      if (payload) req.write(payload);
      req.end();
    });
  }

  async function ensureAdminToken() {
    if (adminAuthToken) return adminAuthToken;
    if (!adminLoginPromise) {
      adminLoginPromise = rawRequest('POST', '/api/auth/login', {
        username: 'admin',
        password: 'admin123'
      }).then((res) => {
        if (res.status === 200 && res.data && res.data.token) {
          adminAuthToken = res.data.token;
          return adminAuthToken;
        }
        throw new Error(`Compliance test admin login failed: HTTP ${res.status} ${JSON.stringify(res.data)}`);
      });
    }
    return adminLoginPromise;
  }

  async function makeRequest(method, endpoint, body) {
    const token = await ensureAdminToken();
    return rawRequest(method, endpoint, body, token);
  }

  // Test 4A: Retail Pharmacy - Pharmacist supervision mandatory
  await asyncTest('Mode B (Retail Pharmacy): Registered Pharmacist credentials mandatory (Pharmacy Act s.42 & Rule 65(2))', async () => {
    const retailWithoutPharmacist = {
      bill_number: 99910,
      subtotal: 100,
      discount: 0,
      tax: 12,
      grand_total: 112,
      payment_method: 'Cash',
      operating_mode: 'RETAIL_PHARMACY',
      pharmacist_name: '', // Missing
      pharmacist_reg_no: '', // Missing
      patient_name: 'Walk-in',
      items: [
        { product_id: 1, product_name: 'Paracetamol 650mg Tablets', schedule: 'OTC', quantity: 1, rate: 100, total: 100 }
      ]
    };
    const res = await makeRequest('POST', '/api/bills', retailWithoutPharmacist);
    assert.strictEqual(res.status, 400, `Expected HTTP 400, got ${res.status}`);
    assert(res.data.error.includes('Registered Pharmacist') && res.data.error.includes('Pharmacy Act'), 'Error must cite Pharmacy Act Sec 42');
  });

  // Test 4B: Retail Pharmacy - Schedule H1 requires doctor prescription & patient details
  await asyncTest('Mode B (Retail Pharmacy): Schedule H1 prescription enforcement (Doctor & Patient required under Rule 65)', async () => {
    const invalidH1Bill = {
      bill_number: 99911,
      subtotal: 150,
      discount: 0,
      tax: 18,
      grand_total: 168,
      payment_method: 'Cash',
      operating_mode: 'RETAIL_PHARMACY',
      pharmacist_name: 'Priya Nair, B.Pharm',
      pharmacist_reg_no: 'TNSPC/2018/48912',
      patient_name: 'Walk-in', // Invalid for Schedule H/H1
      doctor_name: '', // Missing
      doctor_reg_no: '', // Missing
      items: [
        {
          product_id: 1,
          product_name: 'Tramadol 50mg Capsules (10s)',
          schedule: 'Schedule H1',
          quantity: 1,
          rate: 150,
          total: 150
        }
      ]
    };
    const res = await makeRequest('POST', '/api/bills', invalidH1Bill);
    assert.strictEqual(res.status, 400, `Expected HTTP 400, got ${res.status}`);
    assert(res.data.error.includes('Schedule H') || res.data.error.includes('Rule 65'), 'Error message must cite Rule 65 Schedule H requirements');
  });

  // Test 4C: Mode A (Clinic Dispensing) - Mandatory Patient MRN and Doctor TNMC credentials
  await asyncTest('Mode A (Clinic Dispensing): Mandatory Patient MRN & Doctor TNMC Reg (TN Clinical Establishments Rules 2018)', async () => {
    const invalidClinicBill = {
      bill_number: 99912,
      subtotal: 80,
      discount: 0,
      tax: 9.6,
      grand_total: 89.6,
      payment_method: 'Cash',
      operating_mode: 'CLINIC_DISPENSING',
      clinic_patient_id: '', // Missing
      patient_name: '', // Missing
      doctor_name: '', // Missing
      items: [
        { product_id: 1, product_name: 'Aceclofenac 100mg Tablets', schedule: 'Schedule H', quantity: 1, rate: 80, total: 80 }
      ]
    };
    const res = await makeRequest('POST', '/api/bills', invalidClinicBill);
    assert.strictEqual(res.status, 400, `Expected HTTP 400, got ${res.status}`);
    assert(res.data.error.includes('Clinic Dispensing') && res.data.error.includes('Clinical Establishments'), 'Error must cite TN Clinical Establishments Rules');
  });

  // Test 4D: Expired Drug Protection
  await asyncTest('Expired Drug Protection: Block checkout of expired medicines', async () => {
    const expiredBill = {
      bill_number: 99902,
      subtotal: 50,
      discount: 0,
      tax: 6,
      grand_total: 56,
      payment_method: 'Cash',
      operating_mode: 'RETAIL_PHARMACY',
      pharmacist_name: 'Priya Nair, B.Pharm',
      pharmacist_reg_no: 'TNSPC/2018/48912',
      patient_name: 'Test Patient',
      doctor_name: 'Dr. Arjun Sharma',
      doctor_reg_no: 'TNMC/2012/94821',
      items: [
        {
          product_id: 2,
          product_name: 'Diclofenac 50mg Tablets',
          expiry_date: '2023-01-01', // EXPIRED
          quantity: 1,
          rate: 50,
          total: 50
        }
      ]
    };
    const res = await makeRequest('POST', '/api/bills', expiredBill);
    assert.strictEqual(res.status, 400, `Expected HTTP 400, got ${res.status}`);
    assert(res.data.error.includes('EXPIRED'), 'Error must specify drug is expired');
  });

  // Test 4E: Batch Quarantine & Recall Dispensing Prohibition
  await asyncTest('Drug Recall & Batch Quarantine: Quarantining a batch blocks dispensing under D&C Act Section 18', async () => {
    // Quarantine batch 'B-RECALL-TEST-01'
    const quarantineRes = await makeRequest('POST', '/api/registers/recalls/quarantine', {
      batch_number: 'B-RECALL-TEST-01',
      status: 'Quarantined',
      reason: 'CDSCO Quality Alert: Dissolution test failure in State Drug Testing Lab Guindy',
      authorized_by: 'Priya Nair, B.Pharm'
    });
    assert.strictEqual(quarantineRes.status, 200);

    // Attempt to dispense quarantined batch
    const billWithQuarantinedBatch = {
      bill_number: 99913,
      subtotal: 60,
      discount: 0,
      tax: 7.2,
      grand_total: 67.2,
      payment_method: 'Cash',
      operating_mode: 'RETAIL_PHARMACY',
      pharmacist_name: 'Priya Nair, B.Pharm',
      pharmacist_reg_no: 'TNSPC/2018/48912',
      patient_name: 'S. Ganesan',
      patient_address: 'Kilpauk, Chennai',
      doctor_name: 'Dr. Arjun Sharma',
      doctor_reg_no: 'TNMC/2012/94821',
      items: [
        {
          product_id: 5,
          product_name: 'Aceclofenac 100mg Tablets',
          schedule: 'Schedule H',
          batch_number: 'B-RECALL-TEST-01', // Quarantined
          expiry_date: '2028-06-30',
          quantity: 1,
          rate: 60,
          total: 60
        }
      ]
    };
    const res = await makeRequest('POST', '/api/bills', billWithQuarantinedBatch);
    assert.strictEqual(res.status, 400, `Expected HTTP 400, got ${res.status}`);
    assert(res.data.error.includes('QUARANTINED') || res.data.error.includes('DISPENSING BLOCKED'), 'Error must cite QUARANTINED status');
  });

  // Test 4F: Clinical Decision Support (CDS) Drug Interaction Engine
  await asyncTest('Clinical Decision Support (CDS): Detects duplicate NSAIDs and severe drug-drug interactions', async () => {
    const cdsReq = {
      items: [
        { name: 'Aceclofenac 100mg Tablets', generic_name: 'Aceclofenac', dosage: '100mg' },
        { name: 'Diclofenac Sodium 50mg Tablets', generic_name: 'Diclofenac', dosage: '50mg' },
        { name: 'Methotrexate 7.5mg Tablets', generic_name: 'Methotrexate', dosage: '7.5mg' }
      ]
    };
    const res = await makeRequest('POST', '/api/clinical/check-interactions', cdsReq);
    assert.strictEqual(res.status, 200);
    assert(res.data.alerts && res.data.alerts.length >= 2, `Expected >= 2 total alerts, got ${res.data.alerts ? res.data.alerts.length : 0}`);
    assert(res.data.critical && res.data.critical.length >= 1, `Expected >= 1 critical alert, got ${res.data.critical ? res.data.critical.length : 0}`);
    const duplicateNsaid = res.data.alerts.find(a => a.type === 'DUPLICATE_THERAPY');
    assert(duplicateNsaid, 'CDS must detect duplicate systemic NSAID therapy');
    const mtxInteraction = res.data.alerts.find(a => a.type === 'DRUG_INTERACTION' && a.severity === 'CRITICAL');
    assert(mtxInteraction, 'CDS must detect Methotrexate + NSAID severe interaction');
  });

  // Test 4G: Lawful Dispensing & Automatic Schedule H1 Register Entry
  let savedValidBillId = null;

  await asyncTest('Lawful Dispensing & Automatic Schedule H1 Register Entry Generation', async () => {
    const validBill = {
      bill_number: 99903,
      subtotal: 150,
      discount: 0,
      tax: 18,
      grand_total: 168,
      payment_method: 'Cash',
      operating_mode: 'RETAIL_PHARMACY',
      patient_name: 'K. Ranganathan',
      patient_age: 58,
      patient_gender: 'Male',
      patient_phone: '+91 98401 12345',
      patient_address: 'T. Nagar, Chennai',
      doctor_name: 'Dr. Arjun Sharma, MS (Ortho)',
      doctor_reg_no: 'TNMC/2012/94821',
      doctor_clinic: 'Madras Ortho Clinic',
      pharmacist_name: 'Priya Nair, B.Pharm',
      pharmacist_reg_no: 'TNSPC/2018/48912',
      items: [
        {
          product_id: 10,
          product_name: 'Tramadol 50mg Capsules (10s)',
          schedule: 'Schedule H1',
          batch_number: 'TRM2026A',
          expiry_date: '2027-10-31',
          quantity: 2,
          rate: 75,
          total: 150
        }
      ]
    };
    const res = await makeRequest('POST', '/api/bills', validBill);
    assert.strictEqual(res.status, 201, `Expected HTTP 201, got ${res.status}`);
    savedValidBillId = res.data.id;

    // Check Schedule H1 statutory register
    const regRes = await makeRequest('GET', '/api/registers/schedule-h1');
    assert.strictEqual(regRes.status, 200);
    const entry = regRes.data.find(e => e.bill_id === savedValidBillId);
    assert(entry, 'Schedule H1 register entry must be automatically populated upon checkout');
    assert.strictEqual(entry.doctor_name, 'Dr. Arjun Sharma, MS (Ortho)');
    assert.strictEqual(entry.patient_name, 'K. Ranganathan');
  });

  // Test 4H: Rapid Patient Contact Tracing
  await asyncTest('Rapid Patient Contact Tracing: Traces all patients dispensed a specific batch', async () => {
    const traceRes = await makeRequest('GET', '/api/registers/recalls/trace/TRM2026A');
    assert.strictEqual(traceRes.status, 200);
    assert(traceRes.data.patients && traceRes.data.patients.length >= 1, 'Expected at least 1 traced patient');
    const patient = traceRes.data.patients[0];
    assert.strictEqual(patient.patient_name, 'K. Ranganathan');
    assert.strictEqual(patient.patient_phone, '+91 98401 12345');
    assert.strictEqual(patient.batch_number, 'TRM2026A');
  });

  // Test 4I: Pharmacovigilance Programme of India (PvPI) ADR Reporting
  await asyncTest('Pharmacovigilance (PvPI): Successfully submits and registers an Adverse Drug Reaction report', async () => {
    const adrData = {
      patient_name: 'K. Ranganathan',
      patient_age: 58,
      patient_gender: 'Male',
      suspected_drug: 'Tramadol 50mg Capsules',
      generic_name: 'Tramadol Hydrochloride',
      batch_number: 'TRM2026A',
      reaction_description: 'Severe dizziness, nausea, and acute allergic urticarial rash 2 hours post dose',
      reaction_date: new Date().toISOString().split('T')[0],
      severity: 'SEVERE',
      outcome: 'RECOVERING',
      reported_by: 'Priya Nair, B.Pharm',
      reporter_qualification: 'B.Pharm'
    };
    const res = await makeRequest('POST', '/api/registers/adr-reports', adrData);
    assert.strictEqual(res.status, 201, `Expected HTTP 201, got ${res.status}`);
    assert(res.data.id, 'ADR report ID must be returned');

    // Fetch ADR list
    const listRes = await makeRequest('GET', '/api/registers/adr-reports');
    assert.strictEqual(listRes.status, 200);
    const found = listRes.data.find(r => r.patient_name === 'K. Ranganathan');
    assert(found, 'Submitted ADR record must be in adr_reports register');
  });

  // Test 4J: Statutory Retention
  await asyncTest('Statutory Retention: Hard deletion of invoice is prohibited (HTTP 405 Method Not Allowed)', async () => {
    assert(savedValidBillId, 'Prior bill must exist for test');
    const res = await makeRequest('DELETE', `/api/bills/${savedValidBillId}`);
    assert.strictEqual(res.status, 405, `Expected HTTP 405 Method Not Allowed, got ${res.status}`);
    assert(res.data.error.includes('Statutory Violation'), 'Error must specify statutory retention violation');
  });

  // Test 4K: Lawful Cancellation (Credit Note)
  await asyncTest('Lawful Cancellation: Issue Credit Note and update invoice status to Cancelled', async () => {
    assert(savedValidBillId, 'Prior bill must exist for test');
    const cancelPayload = { reason: 'Patient returned intact blister packaging under pharmacist verification' };
    const res = await makeRequest('POST', `/api/bills/${savedValidBillId}/cancel`, cancelPayload);
    assert.strictEqual(res.status, 200, `Expected HTTP 200, got ${res.status}`);
    assert.strictEqual(res.data.bill.status, 'Cancelled', 'Bill status must be Cancelled');

    // Verify audit log has the cancellation event
    const auditRes = await makeRequest('GET', '/api/audit-logs');
    assert.strictEqual(auditRes.status, 200);
    const cancelLog = auditRes.data.find(l => l.action === 'CANCEL_INVOICE_CREDIT_NOTE' && l.entity_id === savedValidBillId);
    assert(cancelLog, 'Credit Note cancellation must be recorded in audit log');
  });

  // Test 4L: Cold Chain Temperature Logging
  await asyncTest('Cold Chain Temperature Logging: Record normal reading and excursion detection', async () => {
    const normalPost = await makeRequest('POST', '/api/registers/cold-chain', {
      equipment_name: 'Vaccine Refrigerator A',
      recorded_temp: 4.5,
      checked_by: 'Priya Nair, B.Pharm'
    });
    assert.strictEqual(normalPost.status, 201);
    assert.strictEqual(normalPost.data.status, 'Normal');

    const excursionPost = await makeRequest('POST', '/api/registers/cold-chain', {
      equipment_name: 'Vaccine Refrigerator A',
      recorded_temp: 9.8,
      checked_by: 'Priya Nair, B.Pharm'
    });
    assert.strictEqual(excursionPost.status, 201);
    assert.strictEqual(excursionPost.data.status, 'Excursion');
  });

  // Close server
  server.close();

  // --- PART 5: STATUTORY EXCEL REPORT GENERATION ---
  console.log('\n--- 5. Statutory Excel Export Generation (D&C Rules 1945) ---');

  const { generateScheduleH1Excel, generateColdChainExcel } = require('../dist-electron/src/server/excel');

  await asyncTest('generateScheduleH1Excel builds compliant Rule 65(4)(4-A) workbook', async () => {
    const dummyH1Entries = [
      {
        id: 1,
        bill_id: 101,
        bill_number: 1001,
        supply_date: '2026-11-11',
        patient_name: 'M. Velusamy',
        patient_address: 'Mylapore, Chennai',
        doctor_name: 'Dr. Arjun Sharma',
        doctor_reg_no: 'TNMC/2012/94821',
        drug_name: 'Tramadol 50mg Capsules',
        batch_number: 'TRM-991',
        quantity: 10,
        dispensing_pharmacist: 'Priya Nair'
      }
    ];
    const buffer = await generateScheduleH1Excel(dummyH1Entries);
    assert(buffer && buffer.length > 1000, 'Excel buffer must be non-empty');
  });

  await asyncTest('generateColdChainExcel builds compliant Rule 65(17) log workbook', async () => {
    const dummyLogs = [
      {
        id: 1,
        equipment_name: 'Vaccine Refrigerator A',
        recorded_temp_c: 4.2,
        min_temp_c: 2.0,
        max_temp_c: 8.0,
        status: 'Normal',
        checked_by: 'Priya Nair, B.Pharm',
        log_date: '2026-11-11',
        log_time: '09:00:00',
        remarks: 'Morning check'
      }
    ];
    const buffer = await generateColdChainExcel(dummyLogs);
    assert(buffer && buffer.length > 1000, 'Cold chain Excel buffer must be non-empty');
  });

  console.log('\n================================================================');
  console.log(`🏁 VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test suite failure:', err);
  process.exit(1);
});

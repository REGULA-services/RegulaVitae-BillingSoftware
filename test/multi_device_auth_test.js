/**
 * Multi-Device Per-Session Authentication, RBAC & Logout Isolation Test Suite
 * Verifies that every device/session must authenticate independently,
 * enforces 401/403 API gates, supports concurrent PC Admin + Mobile Employee
 * sessions + SSE streams, and isolates logouts per token.
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const PORT = Number(process.env.TEST_PORT || 4898);

function httpRequest(method, endpoint, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = {
      ...(body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path: endpoint,
        method,
        headers
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode, headers: res.headers, data: raw });
          }
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function connectSse(endpoint) {
  return new Promise((resolve, reject) => {
    const req = http.get(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path: endpoint
      },
      (res) => {
        if (res.statusCode !== 200) {
          let raw = '';
          res.on('data', (c) => (raw += c));
          res.on('end', () => resolve({ status: res.statusCode, body: raw, res, req }));
          return;
        }

        let buffer = '';
        let closed = false;
        let settled = false;
        const onData = (chunk) => {
          buffer += chunk.toString('utf8');
          if (!settled && buffer.includes('CONNECTED')) {
            settled = true;
            resolve({
              status: res.statusCode,
              buffer,
              isClosed: () => closed,
              close: () => {
                try { req.destroy(); } catch {}
              },
              waitForClose: (timeoutMs = 3000) =>
                new Promise((resClose) => {
                  if (closed) return resClose(true);
                  const timer = setTimeout(() => resClose(false), timeoutMs);
                  res.once('close', () => {
                    clearTimeout(timer);
                    resClose(true);
                  });
                  res.once('end', () => {
                    clearTimeout(timer);
                    resClose(true);
                  });
                })
            });
          }
        };

        res.on('data', onData);
        res.on('close', () => {
          closed = true;
        });
        res.on('end', () => {
          closed = true;
        });

        setTimeout(() => {
          if (!settled) {
            settled = true;
            try { req.destroy(); } catch {}
            reject(new Error(`Timed out waiting for SSE CONNECTED event; got: ${buffer}`));
          }
        }, 4000);
      }
    );
    req.on('error', (err) => {
      // Ignore intentional destroy errors after settlement
      if (err && err.code === 'ECONNRESET') return;
      reject(err);
    });
  });
}

async function ensureServerRunning() {
  const testDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'moc-auth-test-'));
  const serverEntry = path.join(__dirname, '../dist-electron/src/server/server.js');
  let stderrLog = '';
  const child = spawn(process.execPath, [serverEntry], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(PORT), APPDATA: testDataDir },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  child.stderr.on('data', (chunk) => { stderrLog += chunk.toString('utf8'); });

  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 250));
    try {
      const health = await httpRequest('GET', '/api/health');
      if (health.status === 200) {
        return { child, testDataDir };
      }
    } catch {
      // Wait for boot
    }
  }

  try { child.kill(); } catch {}
  try { fs.rmSync(testDataDir, { recursive: true, force: true }); } catch {}
  throw new Error(`Server failed to start on port ${PORT} within 10s. Stderr: ${stderrLog}`);
}

async function runTests() {
  console.log('\n========================================================================');
  console.log('🔐 MADRAS ORTHO CLINIC - MULTI-DEVICE AUTH & RBAC ISOLATION TEST SUITE');
  console.log('========================================================================\n');

  const { child, testDataDir } = await ensureServerRunning();
  let passed = 0;
  let failed = 0;
  let sseToClose = null;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Reason: ${err && err.stack ? err.stack : err}`);
      failed++;
    }
  }

  let pcAdminToken = null;
  let mobileEmployeeToken = null;

  try {
    // 1. Public login shell & health routes
    await test('Public routes: GET /, GET /?view=mobile, GET /api/health return 200; wrong password returns 401', async () => {
      const rootRes = await httpRequest('GET', '/');
      assert.strictEqual(rootRes.status, 200, `Expected 200 for /, got ${rootRes.status}`);
      assert(typeof rootRes.data === 'string' && rootRes.data.toLowerCase().includes('<html'), 'GET / must serve HTML shell');

      const mobileRes = await httpRequest('GET', '/?view=mobile');
      assert.strictEqual(mobileRes.status, 200, `Expected 200 for /?view=mobile, got ${mobileRes.status}`);
      assert(typeof mobileRes.data === 'string' && mobileRes.data.toLowerCase().includes('<html'), 'GET /?view=mobile must serve HTML shell');

      const healthRes = await httpRequest('GET', '/api/health');
      assert.strictEqual(healthRes.status, 200, `Expected 200 for /api/health, got ${healthRes.status}`);
      assert.strictEqual(healthRes.data.ok, true, 'Health check ok must be true');
      assert.strictEqual(healthRes.data.status, 'running', 'Health check status must be running');

      const badLogin = await httpRequest('POST', '/api/auth/login', {
        username: 'admin',
        password: 'wrong-password-999'
      });
      assert.strictEqual(badLogin.status, 401, `Expected 401 for bad password, got ${badLogin.status}`);
    });

    // 2. Unauthenticated blocks across clinical & operational endpoints
    await test('All protected /api/* routes reject unauthenticated requests with 401 Unauthorized', async () => {
      const protectedEndpoints = [
        '/api/auth/session',
        '/api/bills',
        '/api/products',
        '/api/patients',
        '/api/employees',
        '/api/clinic/details',
        '/api/notifications',
        '/api/reports/daily',
        '/api/inventory/inward'
      ];

      for (const ep of protectedEndpoints) {
        const res = await httpRequest('GET', ep);
        assert.strictEqual(res.status, 401, `Expected 401 for unauthenticated GET ${ep}, got ${res.status}`);
      }

      const sseUnauth = await connectSse('/api/events');
      assert.strictEqual(sseUnauth.status, 401, `Expected 401 for unauthenticated SSE /api/events, got ${sseUnauth.status}`);
    });

    // 3. Simultaneous PC Admin + Mobile Employee login isolation
    await test('Simultaneous PC Admin & Mobile Employee logins yield distinct cryptographic tokens and isolated /api/auth/session identities', async () => {
      const pcRes = await httpRequest('POST', '/api/auth/login', {
        username: 'admin',
        password: 'admin123'
      });
      assert.strictEqual(pcRes.status, 200, `Expected 200 for PC Admin login, got ${pcRes.status}`);
      assert(pcRes.data.token && pcRes.data.token.length >= 32, 'PC Admin token must be issued');
      assert.strictEqual(pcRes.data.user.role, 'admin', 'PC user role must be admin');
      pcAdminToken = pcRes.data.token;

      const mobRes = await httpRequest('POST', '/api/auth/login', {
        username: 'employee',
        password: 'employee123'
      });
      assert.strictEqual(mobRes.status, 200, `Expected 200 for Mobile Employee login, got ${mobRes.status}`);
      assert(mobRes.data.token && mobRes.data.token.length >= 32, 'Mobile Employee token must be issued');
      assert.strictEqual(mobRes.data.user.role, 'employee', 'Mobile user role must be employee');
      mobileEmployeeToken = mobRes.data.token;

      assert.notStrictEqual(pcAdminToken, mobileEmployeeToken, 'Tokens across devices must be unique');

      const pcSession = await httpRequest('GET', '/api/auth/session', null, pcAdminToken);
      assert.strictEqual(pcSession.status, 200);
      assert.strictEqual(pcSession.data.user.role, 'admin');

      const mobSession = await httpRequest('GET', '/api/auth/session', null, mobileEmployeeToken);
      assert.strictEqual(mobSession.status, 200);
      assert.strictEqual(mobSession.data.user.role, 'employee');

      const forgedSession = await httpRequest('GET', '/api/auth/session', null, 'forged-token-000000000000');
      assert.strictEqual(forgedSession.status, 401, 'Forged token must be rejected with 401');
    });

    // 4. Employee RBAC 403 enforcement vs allowed operational routes
    await test('Employee token receives 403 Forbidden on admin-only routes while succeeding on POS & read-only routes', async () => {
      const adminOnlyChecks = [
        { method: 'PUT', path: '/api/clinic/details', body: { clinic_name: 'Tampered Clinic' } },
        { method: 'POST', path: '/api/categories', body: { name: 'Unauthorized Category' } },
        { method: 'DELETE', path: '/api/patients/999999', body: null },
        { method: 'POST', path: '/api/employees', body: { name: 'Rogue Staff', role: 'Cashier' } },
        { method: 'POST', path: '/api/system/wipe-all-data', body: {} },
        {
          method: 'POST',
          path: '/api/bills',
          body: { is_complimentary: true, payment_method: 'Complimentary', items: [] }
        }
      ];

      for (const reqSpec of adminOnlyChecks) {
        const res = await httpRequest(reqSpec.method, reqSpec.path, reqSpec.body, mobileEmployeeToken);
        assert.strictEqual(
          res.status,
          403,
          `Expected 403 for employee ${reqSpec.method} ${reqSpec.path}, got ${res.status}`
        );
      }

      const employeeAllowed = [
        '/api/products',
        '/api/bills',
        '/api/reports/monthly',
        '/api/notifications',
        '/api/patients'
      ];
      for (const ep of employeeAllowed) {
        const res = await httpRequest('GET', ep, null, mobileEmployeeToken);
        assert.strictEqual(res.status, 200, `Expected 200 for employee GET ${ep}, got ${res.status}`);
      }

      const adminAllowed = await httpRequest('GET', '/api/employees', null, pcAdminToken);
      assert.strictEqual(adminAllowed.status, 200, `Expected 200 for admin GET /api/employees, got ${adminAllowed.status}`);
      assert(Array.isArray(adminAllowed.data) && adminAllowed.data.some((e) => e.salary !== undefined), 'Admin should see staff salary metadata');

      const empAllowedList = await httpRequest('GET', '/api/employees', null, mobileEmployeeToken);
      assert.strictEqual(empAllowedList.status, 200, `Expected 200 for employee GET /api/employees, got ${empAllowedList.status}`);
      assert(Array.isArray(empAllowedList.data) && empAllowedList.data.every((e) => e.salary === undefined), 'Employee view must omit payroll salary field');
    });

    // 4b. Integrated Inward Stock -> Multi-Category -> FEFO Batch Isolation -> Notification Ranking -> Cancel Restock
    await test('Unified workflow: Multi-category medicine, shared batch isolation, smart notification ranking, and cancel restock', async () => {
      const catRes = await httpRequest('POST', '/api/categories', { name: 'Spine & Trauma' }, pcAdminToken);
      assert(catRes.status === 200 || catRes.status === 201, `Category create failed: HTTP ${catRes.status}`);

      const prodA = await httpRequest('POST', '/api/products', {
        name: 'Test Ortho Tablet A',
        category: 'Spine & Trauma, Pain Management',
        price: 100,
        mrp: 120,
        purchase_price: 70,
        initial_stock: 10,
        batch_number: 'SHARED-LOT-01',
        expiry_date: '2027-06-30',
        tax_percent: 5
      }, pcAdminToken);
      assert.strictEqual(prodA.status, 201);

      const prodB = await httpRequest('POST', '/api/products', {
        name: 'Test Ortho Tablet B',
        category: 'Spine & Trauma',
        price: 50,
        mrp: 60,
        purchase_price: 35,
        initial_stock: 20,
        batch_number: 'SHARED-LOT-01',
        expiry_date: '2027-12-31',
        tax_percent: 5
      }, pcAdminToken);
      assert.strictEqual(prodB.status, 201);

      const soonDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const inwRes = await httpRequest('POST', '/api/inventory/inward', {
        supplier_name: 'Chennai Pharma',
        invoice_number: 'INV-E2E-01',
        items: [{
          product_id: prodB.data.id,
          product_name: prodB.data.name,
          batch_number: 'SOON-LOT-02',
          quantity: 5,
          expiry_date: soonDate,
          purchase_price: 35,
          mrp: 60,
          selling_price: 50
        }]
      }, pcAdminToken);
      assert.strictEqual(inwRes.status, 201);

      // Employee bills 4 units of Product A on SHARED-LOT-01 -> Product B's SHARED-LOT-01 must remain untouched (20 units + 5 SOON = 25 total)
      const billRes = await httpRequest('POST', '/api/bills', {
        bill_number: 88001,
        subtotal: 400,
        discount: 0,
        tax: 20,
        grand_total: 420,
        payment_method: 'Cash',
        items: [{
          product_id: prodA.data.id,
          product_name: prodA.data.name,
          batch_number: 'SHARED-LOT-01',
          quantity: 4,
          rate: 100,
          total: 400,
          tax_percent: 5
        }]
      }, mobileEmployeeToken);
      assert.strictEqual(billRes.status, 201, `Employee bill checkout failed: HTTP ${billRes.status}`);

      const prodsAfterSale = await httpRequest('GET', '/api/products', null, mobileEmployeeToken);
      const aAfter = prodsAfterSale.data.find((p) => p.id === prodA.data.id);
      const bAfter = prodsAfterSale.data.find((p) => p.id === prodB.data.id);
      assert.strictEqual(aAfter.available_stock, 6, 'Product A stock should decrement from 10 to 6');
      assert.strictEqual(bAfter.available_stock, 25, 'Product B stock must remain 25 despite identical batch_number');

      // Notifications: Expiring Soon & Low Stock at top (Rank 1), Expired next (Rank 2), Out-of-Stock strictly at bottom (Rank 3)
      const notifRes = await httpRequest('GET', '/api/notifications', null, mobileEmployeeToken);
      assert.strictEqual(notifRes.status, 200);
      assert(Array.isArray(notifRes.data.allAlerts) && notifRes.data.allAlerts.length > 0, 'allAlerts must be populated');
      const ranks = notifRes.data.allAlerts.map((x) =>
        (x.type === 'EXPIRING_SOON' || x.type === 'LOW_STOCK') ? 1 : (x.type === 'EXPIRED' ? 2 : 3)
      );
      for (let i = 1; i < ranks.length; i++) {
        assert(ranks[i] >= ranks[i - 1], `Notification alert rank inverted at index ${i}: ${ranks[i - 1]} -> ${ranks[i]}`);
      }
      assert.strictEqual(
        notifRes.data.summary.totalAlerts,
        notifRes.data.summary.expiredCount + notifRes.data.summary.expiringSoonCount + notifRes.data.summary.lowStockCount,
        'Smart alert badge total must exclude outOfStockCount'
      );

      // Admin cancels the bill -> Product A restores back to 10
      const cancelRes = await httpRequest('POST', `/api/bills/${billRes.data.id}/cancel`, { reason: 'E2E restock verification' }, pcAdminToken);
      assert.strictEqual(cancelRes.status, 200);
      const prodsAfterCancel = await httpRequest('GET', '/api/products', null, pcAdminToken);
      const aRestored = prodsAfterCancel.data.find((p) => p.id === prodA.data.id);
      assert.strictEqual(aRestored.available_stock, 10, 'Cancelled bill must restore Product A available_stock to 10');
    });

    // 5. SSE Connection + Per-Device Logout Isolation
    await test('PC Admin logout revokes PC token and closes its SSE stream while Mobile Employee session remains 200 active', async () => {
      const sseStream = await connectSse(`/api/events?token=${encodeURIComponent(pcAdminToken)}`);
      sseToClose = sseStream;
      assert.strictEqual(sseStream.status, 200, 'Authenticated SSE stream must connect with HTTP 200');
      assert(sseStream.buffer.includes('CONNECTED'), 'SSE stream must deliver CONNECTED event');

      const logoutAdmin = await httpRequest('POST', '/api/auth/logout', {}, pcAdminToken);
      assert.strictEqual(logoutAdmin.status, 200, `Expected 200 on PC Admin logout, got ${logoutAdmin.status}`);

      const closed = await sseStream.waitForClose(3000);
      assert.strictEqual(closed, true, 'PC Admin SSE stream must close immediately on logout');
      sseToClose = null;

      const pcAfterLogout = await httpRequest('GET', '/api/auth/session', null, pcAdminToken);
      assert.strictEqual(pcAfterLogout.status, 401, 'Logged-out PC Admin token must return 401');

      const pcProductsAfterLogout = await httpRequest('GET', '/api/products', null, pcAdminToken);
      assert.strictEqual(pcProductsAfterLogout.status, 401, 'Logged-out PC Admin token cannot access /api/products');

      // Mobile employee MUST remain authenticated!
      const mobileStillSession = await httpRequest('GET', '/api/auth/session', null, mobileEmployeeToken);
      assert.strictEqual(mobileStillSession.status, 200, 'Mobile Employee session must stay active after PC Admin logs out');
      assert.strictEqual(mobileStillSession.data.user.role, 'employee');

      const mobileStillProducts = await httpRequest('GET', '/api/products', null, mobileEmployeeToken);
      assert.strictEqual(mobileStillProducts.status, 200, 'Mobile Employee must still read /api/products after PC Admin logs out');

      // Clean up Mobile Employee session
      const logoutMob = await httpRequest('POST', '/api/auth/logout', {}, mobileEmployeeToken);
      assert.strictEqual(logoutMob.status, 200, `Expected 200 on Mobile logout, got ${logoutMob.status}`);

      const mobAfterLogout = await httpRequest('GET', '/api/auth/session', null, mobileEmployeeToken);
      assert.strictEqual(mobAfterLogout.status, 401, 'Logged-out Mobile Employee token must return 401');
    });
  } finally {
    if (sseToClose) sseToClose.close();
    if (child) {
      try { child.kill(); } catch {}
    }
    try { fs.rmSync(testDataDir, { recursive: true, force: true }); } catch {}
  }

  console.log('\n========================================================================');
  console.log(`🏁 MULTI-DEVICE AUTH RESULTS: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
  console.log('========================================================================\n');

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Fatal test harness error:', err);
  process.exit(1);
});

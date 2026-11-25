const http = require('http');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');
const path = require('path');

const TEST_PORT = Number(process.env.TEST_PORT || 4897);
let serverProcess = null;
let testDataDir = null;

function request(method, reqPath, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    const options = {
      hostname: 'localhost',
      port: TEST_PORT,
      path: reqPath,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function ensureServerRunning() {
  testDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'moc-admin-emp-test-'));
  const serverPath = path.join(__dirname, '..', 'dist-electron', 'src', 'server', 'server.js');
  serverProcess = spawn(process.execPath, [serverPath], {
    env: { ...process.env, PORT: String(TEST_PORT), APPDATA: testDataDir },
    stdio: 'ignore',
    detached: false
  });

  // Wait up to 8 seconds for isolated server to be ready
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await request('GET', '/api/health');
      if (res && res.status === 200 && res.data && res.data.ok) {
        return;
      }
    } catch {}
  }
  throw new Error(`Isolated test server failed to start on port ${TEST_PORT}`);
}

async function runTests() {
  await ensureServerRunning();
  console.log("=================================================================");
  console.log("   MADRAS ORTHO CLINIC - ADMIN & EMPLOYEE VERIFICATION SUITE   ");
  console.log("=================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  let employeeToken = null;
  let adminToken = null;

  // 0. Unauthenticated Access Protection
  console.log("Test 0: Unauthenticated API Access Gate");
  try {
    const unauthRes = await request('GET', '/api/clinic/details');
    assert(unauthRes.status === 401, `Unauthenticated /api/clinic/details blocked with 401 (Got ${unauthRes.status})`);
  } catch (e) {
    assert(false, `Unauthenticated gate error: ${e.message}`);
  }

  // 1. Test Employee Login
  console.log("\nTest 1: Employee Authentication (employee / employee123)");
  try {
    const res = await request('POST', '/api/auth/login', { username: 'employee', password: 'employee123' });
    assert(res.status === 200, `Employee login status 200 (Got ${res.status})`);
    assert(res.data.success === true, `Employee login success === true`);
    assert(Boolean(res.data.token), `Employee received isolated session token`);
    employeeToken = res.data.token;
    assert(res.data.user && res.data.user.role === 'employee', `Employee role is 'employee'`);
    assert(res.data.user.name && res.data.user.name.includes("Priya Nair"), `Employee name is ${res.data.user?.name}`);
  } catch (e) {
    assert(false, `Employee login error: ${e.message}`);
  }

  // 2. Test Admin Login
  console.log("\nTest 2: Admin Authentication (admin / admin123)");
  try {
    const res = await request('POST', '/api/auth/login', { username: 'admin', password: 'admin123' });
    assert(res.status === 200, `Admin login status 200 (Got ${res.status})`);
    assert(res.data.success === true, `Admin login success === true`);
    assert(Boolean(res.data.token), `Admin received independent session token`);
    assert(res.data.token !== employeeToken, `Admin and Employee tokens are distinct`);
    adminToken = res.data.token;
    assert(res.data.user && res.data.user.role === 'admin', `Admin role is 'admin'`);
  } catch (e) {
    assert(false, `Admin login error: ${e.message}`);
  }

  // 3. Test Clinic Details GET
  console.log("\nTest 3: Clinic Details GET (/api/clinic/details)");
  try {
    const res = await request('GET', '/api/clinic/details', null, adminToken);
    assert(res.status === 200, `Clinic details status 200 (Got ${res.status})`);
    assert(res.data.name.includes("MADRAS ORTHO"), `Clinic name: ${res.data.name}`);
    assert(Boolean(res.data.dlNo), `Form 20B Drug License: ${res.data.dlNo}`);
    assert(Boolean(res.data.doctorRegNo), `Doctor Reg No: ${res.data.doctorRegNo}`);
  } catch (e) {
    assert(false, `Clinic details GET error: ${e.message}`);
  }

  // 4. Test Clinic Details PUT (Doctor updates their credentials and clinic license)
  console.log("\nTest 4: Clinic Details PUT (Doctor updates their credentials and clinic license)");
  try {
    const updatePayload = {
      name: "MADRAS ORTHO CLINIC & PHARMACY",
      description: "Premier Joint Replacement & Trauma Care Center",
      address: "42 Anna Salai, Thousand Lights, Chennai - 600002, Tamil Nadu",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600002",
      phone: "+91 44 2855 0123 / +91 98401 22334",
      email: "contact@madrasortho.in",
      gstin: "33AAAAA0000A1Z5",
      dlNo: "20B/TN/CHE/00482",
      dlNo21: "21B/TN/CHE/00482",
      ceaNo: "TN-CEA/2021/04912",
      doctorName: "Dr. Arjun Sharma, MS (Ortho), MCh (Ortho)",
      doctorDegrees: "MBBS, MS (Orthopaedics), MCh (Ortho - UK), DNB",
      doctorRegNo: "TNMC/2012/94821",
      doctorCouncil: "Tamil Nadu Medical Council",
      doctorSpecialty: "Chief Consultant Orthopaedic & Trauma Surgeon",
      doctorPhone: "+91 98401 22334",
      doctorEmail: "dr.arjun@madrasortho.in",
      pharmacistName: "Priya Nair, B.Pharm",
      pharmacistRegNo: "TNSPC/2018/48912",
      stateCouncil: "Tamil Nadu State Pharmacy Council",
      adminUsername: "admin"
    };

    const empPutRes = await request('PUT', '/api/clinic/details', updatePayload, employeeToken);
    assert(empPutRes.status === 403, `Employee blocked from updating clinic details with 403 (Got ${empPutRes.status})`);

    const putRes = await request('PUT', '/api/clinic/details', updatePayload, adminToken);
    assert(putRes.status === 200, `Clinic details PUT status 200 (Got ${putRes.status})`);
    assert(putRes.data.success === true, `Clinic details PUT success === true`);

    // Verify GET reflects updated credentials
    const verifyGet = await request('GET', '/api/clinic/details', null, adminToken);
    assert(verifyGet.data.doctorDegrees.includes("MCh"), `Updated doctor degrees: ${verifyGet.data.doctorDegrees}`);
    assert(verifyGet.data.ceaNo === "TN-CEA/2021/04912", `Updated CEA Reg No: ${verifyGet.data.ceaNo}`);
  } catch (e) {
    assert(false, `Clinic details PUT error: ${e.message}`);
  }

  // 5. Test Employee CRUD with Qualifications and Reg No
  console.log("\nTest 5: Employee CRUD with Qualifications and Medical/Pharmacy Council Reg No");
  let testEmpId = null;
  try {
    const newEmp = {
      name: "Dr. K. Vigneshwaran (Test Staff)",
      role: "Orthopaedic Surgeon",
      qualification: "MBBS, MS (Orthopaedics)",
      reg_no: "TNMC/2020/07319",
      phone: "+91 98409 99887",
      email: "dr.vignesh@madrasortho.in",
      salary: 75000,
      status: "Active",
      joined_date: "2026-03-01"
    };

    const createRes = await request('POST', '/api/employees', newEmp, adminToken);
    assert(createRes.status === 201, `Employee created status 201 (Got ${createRes.status})`);
    testEmpId = createRes.data.id;
    assert(Boolean(testEmpId), `New employee assigned ID: ${testEmpId}`);
    assert(createRes.data.qualification === "MBBS, MS (Orthopaedics)", `Qualification stored: ${createRes.data.qualification}`);
    assert(createRes.data.reg_no === "TNMC/2020/07319", `Reg No stored: ${createRes.data.reg_no}`);

    // Update Employee
    const updateEmp = {
      ...newEmp,
      salary: 80000,
      qualification: "MBBS, MS (Ortho), Fellowship in Arthroscopy"
    };
    const updateRes = await request('PUT', `/api/employees/${testEmpId}`, updateEmp, adminToken);
    assert(updateRes.status === 200, `Employee updated status 200 (Got ${updateRes.status})`);
    assert(updateRes.data.salary === 80000, `Updated salary: ₹${updateRes.data.salary}`);
    assert(updateRes.data.qualification.includes("Fellowship"), `Updated qualification: ${updateRes.data.qualification}`);
  } catch (e) {
    assert(false, `Employee CRUD error: ${e.message}`);
  }

  // 6. Test Staff Deletion and Primary Admin Protection
  console.log("\nTest 6: Staff Record Deletion and Primary Administrator Account Protection");
  try {
    const empDeleteRes = await request('DELETE', `/api/employees/${testEmpId}`, null, employeeToken);
    assert(empDeleteRes.status === 403, `Employee blocked from deleting staff with 403 (Got ${empDeleteRes.status})`);

    // Staff deletion allowed for admin (per user requirement)
    const deleteRes = await request('DELETE', `/api/employees/${testEmpId}`, null, adminToken);
    assert(deleteRes.status === 200, `Staff record deletion successful (Got ${deleteRes.status})`);
    assert(deleteRes.data.success === true, `Deletion message: ${deleteRes.data.message}`);

    // Primary administrator protection (cannot be deleted)
    const adminEmp = await request('GET', '/api/employees', null, adminToken);
    const adminUser = Array.isArray(adminEmp.data) ? adminEmp.data.find(e => e.username === 'admin') : null;
    if (adminUser) {
      const adminDelRes = await request('DELETE', `/api/employees/${adminUser.id}`, null, adminToken);
      assert(adminDelRes.status === 400, `Admin deletion blocked with 400 (Got ${adminDelRes.status})`);
      assert(adminDelRes.data.error.includes("administrator account cannot be deleted"), `Admin protection reason: ${adminDelRes.data.error}`);
    }
  } catch (e) {
    assert(false, `Staff deletion test error: ${e.message}`);
  }

  // 7. Per-Device Session Isolation & Logout Revocation
  console.log("\nTest 7: Independent Per-Device Session Revocation");
  try {
    const logoutAdmin = await request('POST', '/api/auth/logout', {}, adminToken);
    assert(logoutAdmin.status === 200 && logoutAdmin.data.success === true, 'Admin device logout returned 200');
    const reuseAdmin = await request('GET', '/api/auth/session', null, adminToken);
    assert(reuseAdmin.status === 401, `Revoked admin token rejected with 401 (Got ${reuseAdmin.status})`);
    const checkEmpStillValid = await request('GET', '/api/auth/session', null, employeeToken);
    assert(checkEmpStillValid.status === 200 && checkEmpStillValid.data.user.role === 'employee', 'Employee second-device session remained isolated and active');
  } catch (e) {
    assert(false, `Session isolation test error: ${e.message}`);
  }

  console.log("\n=================================================================");
  console.log(`   TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================================\n");

  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch {}
  }
  if (testDataDir) {
    try {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    } catch {}
  }

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();


const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

let serverProcess = null;

function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    const options = {
      hostname: 'localhost',
      port: 4848,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
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
  try {
    const res = await request('GET', '/api/notifications');
    if (res && res.status === 200) {
      return; // Server is already running
    }
  } catch (e) {
    // Need to start server
  }

  const serverPath = path.join(__dirname, '..', 'dist-electron', 'src', 'server', 'server.js');
  serverProcess = spawn(process.execPath, [serverPath], {
    stdio: 'ignore',
    detached: false
  });

  // Wait up to 5 seconds for server to be ready
  for (let i = 0; i < 25; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await request('GET', '/api/notifications');
      if (res && res.status === 200) {
        return;
      }
    } catch {}
  }
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

  // 1. Test Employee Login
  console.log("Test 1: Employee Authentication (employee / employee123)");
  try {
    const res = await request('POST', '/api/auth/login', { username: 'employee', password: 'employee123' });
    assert(res.status === 200, `Employee login status 200 (Got ${res.status})`);
    assert(res.data.success === true, `Employee login success === true`);
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
    assert(res.data.user && res.data.user.role === 'admin', `Admin role is 'admin'`);
  } catch (e) {
    assert(false, `Admin login error: ${e.message}`);
  }

  // 3. Test Clinic Details GET
  console.log("\nTest 3: Clinic Details GET (/api/clinic/details)");
  try {
    const res = await request('GET', '/api/clinic/details');
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

    const putRes = await request('PUT', '/api/clinic/details', updatePayload);
    assert(putRes.status === 200, `Clinic details PUT status 200 (Got ${putRes.status})`);
    assert(putRes.data.success === true, `Clinic details PUT success === true`);

    // Verify GET reflects updated credentials
    const verifyGet = await request('GET', '/api/clinic/details');
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

    const createRes = await request('POST', '/api/employees', newEmp);
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
    const updateRes = await request('PUT', `/api/employees/${testEmpId}`, updateEmp);
    assert(updateRes.status === 200, `Employee updated status 200 (Got ${updateRes.status})`);
    assert(updateRes.data.salary === 80000, `Updated salary: ₹${updateRes.data.salary}`);
    assert(updateRes.data.qualification.includes("Fellowship"), `Updated qualification: ${updateRes.data.qualification}`);
  } catch (e) {
    assert(false, `Employee CRUD error: ${e.message}`);
  }

  // 6. Test Staff Deletion and Primary Admin Protection
  console.log("\nTest 6: Staff Record Deletion and Primary Administrator Account Protection");
  try {
    // Staff deletion allowed (per user requirement)
    const deleteRes = await request('DELETE', `/api/employees/${testEmpId}`);
    assert(deleteRes.status === 200, `Staff record deletion successful (Got ${deleteRes.status})`);
    assert(deleteRes.data.success === true, `Deletion message: ${deleteRes.data.message}`);

    // Primary administrator protection (cannot be deleted)
    const adminEmp = await request('GET', '/api/employees');
    const adminUser = Array.isArray(adminEmp.data) ? adminEmp.data.find(e => e.username === 'admin') : null;
    if (adminUser) {
      const adminDelRes = await request('DELETE', `/api/employees/${adminUser.id}`);
      assert(adminDelRes.status === 400, `Admin deletion blocked with 400 (Got ${adminDelRes.status})`);
      assert(adminDelRes.data.error.includes("administrator account cannot be deleted"), `Admin protection reason: ${adminDelRes.data.error}`);
    }
  } catch (e) {
    assert(false, `Staff deletion test error: ${e.message}`);
  }

  console.log("\n=================================================================");
  console.log(`   TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================================\n");

  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch {}
  }

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();


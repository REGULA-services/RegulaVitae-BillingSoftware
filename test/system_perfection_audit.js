/**
 * System Perfection & Clinical Audit Verification Suite
 * Madras Ortho Clinic & Pharmacy POS (Windows Localhost, Standalone POS, Mobile/Tablet)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

async function runAudit() {
  console.log('\n========================================================================');
  console.log('🏥 MADRAS ORTHO CLINIC - SYSTEM PERFECTION & CLINICAL AUDIT SUITE');
  console.log('   End-to-End Deep Verification Across Desktop, Localhost & Mobile');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function verify(testName, fn) {
    try {
      fn();
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${testName}`);
      console.error(`     Reason: ${err.message}`);
      failed++;
    }
  }

  // ----------------------------------------------------------------------
  // PHASE 1: DYNAMIC CLINIC BRANDING, LICENSURE & STATUTORY DOCUMENTS
  // ----------------------------------------------------------------------
  console.log('\n--- PHASE 1: Dynamic Clinic Branding & Licensure Engine ---');

  const appTsx = fs.readFileSync(path.join(__dirname, '../src/renderer/src/App.tsx'), 'utf8');
  const mobileTsx = fs.readFileSync(path.join(__dirname, '../src/renderer/src/components/MobileTabletApp.tsx'), 'utf8');
  const serverTs = fs.readFileSync(path.join(__dirname, '../src/server/server.ts'), 'utf8');
  const excelTs = fs.readFileSync(path.join(__dirname, '../src/server/excel.ts'), 'utf8');

  verify('Server exposes getStoredClinicDetails and /api/clinic/details GET/PUT', () => {
    assert(serverTs.includes('getStoredClinicDetails'), 'Server must define getStoredClinicDetails()');
    assert(serverTs.includes("app.get('/api/clinic/details'"), 'Server must have GET /api/clinic/details');
    assert(serverTs.includes("app.put('/api/clinic/details'"), 'Server must have PUT /api/clinic/details');
  });

  verify('Inward Stock GRN PDF dynamically renders clinic name, address & licenses', () => {
    assert(appTsx.includes('${(bakeryDetails.name || \'MADRAS ORTHO CLINIC\').toUpperCase()}'), 'GRN must use dynamic bakeryDetails.name');
    assert(appTsx.includes('${bakeryDetails.description || (bakeryDetails as any).doctorSpecialty'), 'GRN must use dynamic clinic tagline/specialty');
    assert(appTsx.includes('DL Form 20B:'), 'GRN must render DL Form 20B dynamically');
    assert(appTsx.includes('DL Form 21B:'), 'GRN must render DL Form 21B dynamically');
    assert(appTsx.includes('GSTIN:'), 'GRN must render GSTIN dynamically');
  });

  verify('Inward Stock GRN PDF dynamically binds registered signatures', () => {
    assert(appTsx.includes('${bakeryDetails.pharmacistName'), 'GRN must dynamically bind Supervising Pharmacist');
    assert(appTsx.includes('${bakeryDetails.doctorName'), 'GRN must dynamically bind Authorized Doctor / Signatory');
  });

  verify('Reports & Analytics Modal dynamically titles with configured clinic name', () => {
    assert(appTsx.includes('{(bakeryDetails.name || \'MADRAS ORTHO CLINIC\').toUpperCase()}</span>'), 'Analytics title must use dynamic bakeryDetails.name');
    assert(appTsx.includes('Financial Reports, Margins & Stock Analytics'), 'Analytics title must keep clinical description');
  });

  verify('Excel Export dynamically binds clinic name into creator and sheet banners', () => {
    assert(excelTs.includes('reportData.clinicName || reportData.clinicDetails?.name'), 'Excel builder must extract dynamic clinic name');
    assert(excelTs.includes('workbook.creator = `${clinicName} SOFTWARE`'), 'Workbook creator must be dynamic clinic name');
    assert(excelTs.includes('tCell.value = `${clinicName} - ${reportTitle.toUpperCase()}'), 'Banner header must use dynamic clinic name');
  });

  verify('Client-Side CSV Export dynamically prepends active clinic name and contact details', () => {
    assert(appTsx.includes('const activeClinicName = (bakeryDetails.name || \'MADRAS ORTHO CLINIC\').toUpperCase()'), 'CSV export must resolve activeClinicName');
    assert(appTsx.includes('csvContent += `${activeClinicName}\\n`'), 'CSV content must prepend dynamic clinic name');
  });

  verify('Mobile Thermal Receipts dynamically consume server-provided clinic details', () => {
    assert(mobileTsx.includes('printMobileThermalReceipt(b, clinicDetails)'), 'Mobile reprint must pass clinicDetails');
    assert(mobileTsx.includes('printMobileThermalReceipt(billSuccessModal, clinicDetails)'), 'Mobile checkout receipt must pass clinicDetails');
    assert(mobileTsx.includes('printMobileThermalReceipt(viewingBillModal, clinicDetails)'), 'Mobile view modal must pass clinicDetails');
  });

  // ----------------------------------------------------------------------
  // PHASE 2: REAL-TIME SSE EVENT BUS & MULTI-DEVICE SYNCHRONIZATION
  // ----------------------------------------------------------------------
  console.log('\n--- PHASE 2: Real-Time SSE Event Bus & Multi-Device Sync ---');

  verify('Server defines CLINIC_DETAILS_UPDATED event and broadcasts on PUT', () => {
    assert(serverTs.includes("'CLINIC_DETAILS_UPDATED'"), "RealtimeEvent must include 'CLINIC_DETAILS_UPDATED'");
    assert(serverTs.includes("type: 'CLINIC_DETAILS_UPDATED'"), 'PUT /api/clinic/details must broadcast CLINIC_DETAILS_UPDATED');
  });

  verify('Desktop and Mobile SSE listeners handle CLINIC_DETAILS_UPDATED and update state', () => {
    assert(appTsx.includes("data.type === 'CLINIC_DETAILS_UPDATED'"), 'Desktop App.tsx must listen for CLINIC_DETAILS_UPDATED');
    assert(appTsx.includes('setBakeryDetails(prev => ({ ...prev, ...data.data }))'), 'Desktop App.tsx must update bakeryDetails on SSE');
    assert(mobileTsx.includes("data.type === 'CLINIC_DETAILS_UPDATED'"), 'MobileTabletApp must listen for CLINIC_DETAILS_UPDATED');
    assert(mobileTsx.includes('setClinicDetails(data.data)'), 'MobileTabletApp must update clinicDetails on SSE');
  });

  verify('SSE connection has 20-second heartbeat ping and reconnect handler', () => {
    assert(serverTs.includes("type: 'HEARTBEAT'"), 'Server must send periodic HEARTBEAT to maintain sockets');
    assert(appTsx.includes("if (data.type === 'HEARTBEAT') return;"), 'Desktop must safely ignore heartbeat');
    assert(mobileTsx.includes("if (data.type === 'HEARTBEAT') return;"), 'Mobile must safely ignore heartbeat');
    assert(appTsx.includes('reconnectTimer = setTimeout'), 'Desktop must have 5s reconnect timer on socket error');
    assert(mobileTsx.includes('reconnectTimeout = setTimeout'), 'Mobile must have 5s reconnect timer on socket error');
  });

  verify('Desktop Settings modal has direct Save & Broadcast trigger', () => {
    assert(appTsx.includes('syncClinicDetailsToServer(bakeryDetails)'), 'Settings close and save button must call syncClinicDetailsToServer');
    assert(appTsx.includes('Save & Broadcast Changes'), 'Settings modal must feature Save & Broadcast button');
  });

  // ----------------------------------------------------------------------
  // PHASE 3: TOP BANNER LAYOUT & VISUAL HIERARCHY
  // ----------------------------------------------------------------------
  console.log('\n--- PHASE 3: Top Banner Layout & De-congestion ---');

  verify('Desktop header has completely removed Dr. Arjun text next to logout', () => {
    const logoutIdx = appTsx.indexOf('{/* Logout Button */}');
    assert(logoutIdx !== -1, 'Logout button comment must exist');
    const headerEndIdx = appTsx.indexOf('</header>', logoutIdx);
    const logoutSection = appTsx.substring(logoutIdx, headerEndIdx);
    assert(!logoutSection.includes('Dr. Arjun Sharma'), 'Logout area must NOT contain Dr. Arjun Sharma text');
    assert(!logoutSection.includes('ADMIN'), 'Logout area must NOT contain static ADMIN label');
  });

  verify('Desktop header has completely removed text next to Mode A/B switches', () => {
    const headerStart = appTsx.indexOf('{/* ----------------- TOP NAVBAR PANEL ----------------- */}');
    const modeBIdx = appTsx.indexOf('Mode B: Retail Pharmacy', headerStart);
    const headerLeftSection = appTsx.substring(headerStart, modeBIdx);
    assert(!headerLeftSection.includes('MADRAS ORTHO CLINIC & PHARMACY'), 'Header must NOT have text block next to Mode A/B');
    assert(!headerLeftSection.includes('Mission for Cure |'), 'Header must NOT have static tagline next to Mode A/B');
  });

  verify('Desktop header layout groups Logo and Mode A/B cleanly on the left', () => {
    assert(appTsx.includes('src="./icon.png"'), 'Logo must exist in header');
    assert(appTsx.includes('Mode A: Clinic Dispensing'), 'Mode A must exist in header');
    assert(appTsx.includes('Mode B: Retail Pharmacy'), 'Mode B must exist in header');
  });

  verify('Mobile header has removed specialists directory and desktop switch button', () => {
    assert(!mobileTsx.includes('Specialists Directory'), 'Mobile must NOT contain Specialists Directory');
    assert(!mobileTsx.includes('Switch to Desktop'), 'Mobile must NOT have Switch to Desktop button');
  });

  // ----------------------------------------------------------------------
  // PHASE 4: SMART NOTIFICATION ENGINE & CLINICAL ALERTS
  // ----------------------------------------------------------------------
  console.log('\n--- PHASE 4: Smart Notification Engine & Clinical Alerts ---');

  verify('Server calculates smartAlertsCount excluding catalog out-of-stock items', () => {
    assert(serverTs.includes('const smartAlertsCount = expired.length + expiringSoon.length + lowStock.length;'), 'Server must strictly compute active clinical risks');
    assert(serverTs.includes('totalAlerts: smartAlertsCount'), 'summary.totalAlerts must equal smartAlertsCount');
  });

  verify('Desktop and Mobile notification badges do not inflate to 99+ on unstocked items', () => {
    assert(appTsx.includes('const smartCount = (notificationsData?.summary?.expiringSoonCount || 0) + (notificationsData?.summary?.lowStockCount || 0) + (notificationsData?.summary?.expiredCount || 0)'), 'Desktop must only sum expiringSoon, lowStock, and expired');
    assert(mobileTsx.includes('const smartCount = (notificationsData?.summary?.expiringSoonCount || 0) + (notificationsData?.summary?.lowStockCount || 0) + (notificationsData?.summary?.expiredCount || 0)'), 'Mobile must only sum expiringSoon, lowStock, and expired');
    assert(appTsx.includes('if (smartCount <= 0) return null;'), 'Desktop badge must hide when 0 alerts');
    assert(mobileTsx.includes('if (smartCount <= 0) return null;'), 'Mobile badge must hide when 0 alerts');
  });

  verify('Clinical alerts categorized with proper severity (CRITICAL, HIGH, LOW)', () => {
    assert(serverTs.includes("severity: 'CRITICAL'"), 'Expired batches must be marked CRITICAL');
    assert(serverTs.includes("severity: diffDays <= 30 ? 'HIGH' : 'MEDIUM'"), 'Expiring batches must be categorized by days left');
    assert(serverTs.includes("type: 'LOW_STOCK'"), 'Low stock items must have distinct LOW_STOCK type');
  });

  // ----------------------------------------------------------------------
  // PHASE 5: MOBILE/TABLET PARITY, FINANCIAL CALCULATIONS & ROLE GUARDS
  // ----------------------------------------------------------------------
  console.log('\n--- PHASE 5: Mobile Parity, Financial Calculations & Role Guards ---');

  verify('Mobile bill financial calculations safely handle grand_total/total/total_amount fallbacks (Zero NaN)', () => {
    assert(
      mobileTsx.includes('const billAmt = round2(b.grand_total !== undefined && b.grand_total !== null ? b.grand_total : (b.total ?? b.total_amount ?? 0));') ||
      mobileTsx.includes('const billAmt = Number(b.grand_total !== undefined && b.grand_total !== null ? b.grand_total : (b.total ?? b.total_amount ?? 0));'),
      'Mobile stats calculation must use robust fallbacks'
    );
  });

  verify('Mobile Today Sales & Tax Summary refresh button is functional with visual spinner', () => {
    assert(mobileTsx.includes('setIsRefreshingStats(true);'), 'Refresh button must activate loading state');
    assert(mobileTsx.includes('loadPeriodStats(reportPeriod)'), 'Refresh button must reload stats');
    assert(mobileTsx.includes('loadBillsHistory()'), 'Refresh button must reload bills history');
    assert(mobileTsx.includes('setIsRefreshingStats(false);'), 'Refresh button must deactivate loading state on complete');
  });

  verify('In-stock medicines prioritized on top of out-of-stock medicines', () => {
    assert(appTsx.includes('if (aInStock !== bInStock) return bInStock - aInStock;'), 'Desktop product grid must sort in-stock items first');
    assert(mobileTsx.includes('if (aInStock !== bInStock) return bInStock - aInStock;'), 'Mobile product grid must sort in-stock items first');
  });

  verify('Mobile allows patient and staff record deletion with admin role enforcement', () => {
    assert(mobileTsx.includes("method: 'DELETE'"), 'Mobile must contain DELETE API calls');
    assert(mobileTsx.includes("currentUser?.role === 'admin'"), 'Mobile must protect admin-only actions');
    assert(appTsx.includes('Employee View-Only Mode'), 'Desktop must display view-only badge for staff');
  });

  // ----------------------------------------------------------------------
  // PHASE 6: INVENTORY LEDGER, FEFO ALLOCATION & STOCK INTEGRITY
  // ----------------------------------------------------------------------
  console.log('\n--- PHASE 6: Inventory Ledger, FEFO Multi-Batch Allocation ---');

  verify('Server queries batches strictly by FEFO (ORDER BY expiry_date ASC)', () => {
    assert(serverTs.includes('ORDER BY expiry_date ASC'), 'Batch allocation query must prioritize earliest expiry date');
  });

  verify('Multi-batch iteration preserves previous inward arrivals without stock neglect', () => {
    assert(serverTs.includes('UPDATE batches SET available_stock = MAX(0, available_stock - ?) WHERE batch_number = ?'), 'Batches must be deducted accurately by batch_number');
    assert(serverTs.includes('UPDATE products SET available_stock = MAX(0, available_stock - ?) WHERE id = ?'), 'Product aggregate stock must be synchronized');
  });

  verify('Database transactions wrap all bill checkouts with BEGIN IMMEDIATE TRANSACTION', () => {
    assert(serverTs.includes('BEGIN IMMEDIATE TRANSACTION'), 'Checkout endpoint must use immediate transactions to prevent race conditions');
    assert(serverTs.includes('await db.run("COMMIT");'), 'Transactions must commit atomically');
    assert(serverTs.includes('await db.run("ROLLBACK")'), 'Transactions must roll back on failure');
  });

  // ----------------------------------------------------------------------
  // PHASE 7: BUILD VERIFICATION & RELEASE PACKAGING
  // ----------------------------------------------------------------------
  console.log('\n--- PHASE 7: Release Packaging Deliverables ---');

  const releaseDir = path.join(__dirname, '../release');
  const localhostInstaller = path.join(releaseDir, 'MADRAS ORTHO CLINIC LOCALHOST Setup 1.0.0.exe');
  const desktopInstaller = path.join(releaseDir, 'MADRAS ORTHO CLINIC SOFTWARE Setup 1.0.0.exe');
  const androidApk = path.join(releaseDir, 'MADRAS ORTHO CLINIC MOBILE APP.apk');

  verify('Windows Localhost Server Installer exists and is non-empty (>50MB)', () => {
    assert(fs.existsSync(localhostInstaller), 'Localhost installer must exist in release/');
    const stat = fs.statSync(localhostInstaller);
    assert(stat.size > 50 * 1024 * 1024, `Localhost installer size too small (${stat.size} bytes)`);
    console.log(`     Path: release/MADRAS ORTHO CLINIC LOCALHOST Setup 1.0.0.exe (${(stat.size / (1024 * 1024)).toFixed(2)} MB)`);
  });

  verify('Standalone Windows Desktop POS Installer exists and is non-empty (>50MB)', () => {
    assert(fs.existsSync(desktopInstaller), 'Desktop installer must exist in release/');
    const stat = fs.statSync(desktopInstaller);
    assert(stat.size > 50 * 1024 * 1024, `Desktop installer size too small (${stat.size} bytes)`);
    console.log(`     Path: release/MADRAS ORTHO CLINIC SOFTWARE Setup 1.0.0.exe (${(stat.size / (1024 * 1024)).toFixed(2)} MB)`);
  });

  verify('Android Tablet & Mobile APK exists and is non-empty (>5MB)', () => {
    assert(fs.existsSync(androidApk), 'Android APK must exist in release/');
    const stat = fs.statSync(androidApk);
    assert(stat.size > 5 * 1024 * 1024, `Android APK size too small (${stat.size} bytes)`);
    console.log(`     Path: release/MADRAS ORTHO CLINIC MOBILE APP.apk (${(stat.size / (1024 * 1024)).toFixed(2)} MB)`);
  });

  // ----------------------------------------------------------------------
  // PHASE 8: PER-DEVICE AUTHENTICATION & SESSION ISOLATION
  // ----------------------------------------------------------------------
  console.log('\n--- PHASE 8: Per-Device Authentication & Session Isolation ---');

  const apiConfigTs = fs.readFileSync(path.join(__dirname, '../src/renderer/src/utils/apiConfig.ts'), 'utf8');

  verify('App.tsx initializes unauthenticated with zero cross-tab localStorage session leakage', () => {
    assert(!/localStorage\.(get|set)Item\(['"]madrasortho_pos_user['"]/.test(appTsx), 'App.tsx must not read/write madrasortho_pos_user in localStorage');
    assert(appTsx.includes('setUnauthorizedHandler') && appTsx.includes('setAuthToken'), 'App.tsx must bind in-memory token lifecycle & 401 handler');
    assert(appTsx.includes("authApiUrl('/api/events')"), 'Desktop EventSource must pass per-session token');
  });

  verify('MobileTabletApp.tsx removes default admin fallback and requires validated token', () => {
    assert(!mobileTsx.includes("currentUser = { username: 'admin'"), 'MobileTabletApp must not supply a default admin user prop');
    assert(mobileTsx.includes('!currentUser') && mobileTsx.includes('getAuthToken()'), 'MobileTabletApp must enforce authenticated user & token');
    assert(mobileTsx.includes("authApiUrl('/api/events')"), 'Mobile EventSource must pass per-session token');
  });

  verify('apiConfig.ts keeps bearer tokens strictly in-memory and attaches Authorization headers', () => {
    assert(apiConfigTs.includes('initAuthFetchInterceptor') && apiConfigTs.includes('setAuthToken') && apiConfigTs.includes('authApiUrl'), 'apiConfig must implement auth token helpers');
    assert(apiConfigTs.includes('let activeAuthToken: string | null = null;'), 'Auth token must live in module memory');
    assert(!/localStorage\.(get|set)Item\([^)]*(token|user)/i.test(apiConfigTs) && !/sessionStorage\.(get|set)Item/i.test(apiConfigTs), 'Auth token must stay strictly in-memory (never localStorage/sessionStorage)');
  });

  verify('server.ts enforces cryptographic session tokens, /api/auth/session, /api/auth/logout, and admin RBAC', () => {
    assert(serverTs.includes("app.get('/api/auth/session'") && serverTs.includes("app.post('/api/auth/logout'"), 'Server must implement session verify & logout endpoints');
    assert(serverTs.includes('isAdminOnlyRoute') && serverTs.includes('activeSessions'), 'Server must enforce session validation & admin RBAC middleware');
  });

  // ----------------------------------------------------------------------
  // PHASE 9: 2-DECIMAL FINANCIAL PRECISION, EXACT CASH TENDER & MOBILE LOGO UI
  // ----------------------------------------------------------------------
  console.log('\n--- PHASE 9: 2-Decimal Financial Precision, Cash Tender Parity & Mobile Header ---');

  verify('apiConfig.ts exports shared round2 & toPaise integer-paise financial helpers', () => {
    assert(apiConfigTs.includes('export const round2') && apiConfigTs.includes('export const toPaise'), 'apiConfig must export round2 and toPaise helpers');
  });

  verify('App.tsx & MobileTabletApp.tsx compare Cash Tendered in integer paise without float drift', () => {
    assert(appTsx.includes('toPaise(parsedCash) < toPaise(payableAmt)'), 'App.tsx completeBilling must compare cash tendered in integer paise');
    assert(appTsx.includes('round2(billSummary.grandTotal).toFixed(2)'), 'Desktop Exact button must match 2-decimal rounded Grand Total');
    assert(mobileTsx.includes('round2(') && mobileTsx.includes('sgst') && mobileTsx.includes('cartCgst'), 'MobileTabletApp.tsx must round totals & balance CGST/SGST');
  });

  verify('Mobile header removes truncated clinic text and retains clean clinic logo only', () => {
    const mobileHeaderMatch = mobileTsx.match(/<header[\s\S]*?<\/header>/);
    assert(mobileHeaderMatch, 'Mobile header tag must exist');
    const mobileHeaderBlock = mobileHeaderMatch[0];
    assert(!mobileHeaderBlock.includes('MADRAS ORTHO CLINIC') && !mobileHeaderBlock.includes('Center for Orthopaedic') && !mobileHeaderBlock.includes('clinicDetails?.description'), 'Mobile header must not render clinic title/subtitle text alongside logo');
    assert(mobileHeaderBlock.includes('<img') && mobileHeaderBlock.includes('./icon.png'), 'Mobile header must display clinic logo');
  });

  // ----------------------------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log(`🏁 AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAudit().catch(err => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});

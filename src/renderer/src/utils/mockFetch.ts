// Local Storage Database Emulator for Standalone Mobile Web / Android APK / PWA views
// Madras Ortho Clinic Pharmacy POS - Full Offline Capability

// Check if running inside Electron desktop container
const isElectron = typeof window !== 'undefined' && (window as any).electron !== undefined;

export const ORTHO_PHARMACY_PRODUCTS = [
  // NSAIDs & Pain Relievers
  { id: 1, name: "Diclofenac Sodium 50mg Tablets (10s)", category: "NSAIDs", price: 28.50, tax_percent: 5, barcode: "8901050001", sku: "DCF-50-TAB", status: "Available", quantity_type: "strip" },
  { id: 2, name: "Diclofenac Sodium 75mg SR Tablets (10s)", category: "NSAIDs", price: 45.00, tax_percent: 5, barcode: "8901050002", sku: "DCF-75-SR", status: "Available", quantity_type: "strip" },
  { id: 3, name: "Ibuprofen 400mg Tablets (10s)", category: "NSAIDs", price: 22.00, tax_percent: 5, barcode: "8901050003", sku: "IBU-400-TAB", status: "Available", quantity_type: "strip" },
  { id: 4, name: "Ibuprofen 600mg Tablets (10s)", category: "NSAIDs", price: 32.00, tax_percent: 5, barcode: "8901050004", sku: "IBU-600-TAB", status: "Available", quantity_type: "strip" },
  { id: 5, name: "Naproxen 250mg Tablets (10s)", category: "NSAIDs", price: 35.00, tax_percent: 5, barcode: "8901050005", sku: "NAP-250-TAB", status: "Available", quantity_type: "strip" },
  { id: 6, name: "Naproxen 500mg Tablets (10s)", category: "NSAIDs", price: 55.00, tax_percent: 5, barcode: "8901050006", sku: "NAP-500-TAB", status: "Available", quantity_type: "strip" },
  { id: 7, name: "Etoricoxib 60mg Tablets (10s)", category: "NSAIDs", price: 95.00, tax_percent: 5, barcode: "8901050007", sku: "ETO-60-TAB", status: "Available", quantity_type: "strip" },
  { id: 8, name: "Etoricoxib 90mg Tablets (10s)", category: "NSAIDs", price: 130.00, tax_percent: 5, barcode: "8901050008", sku: "ETO-90-TAB", status: "Available", quantity_type: "strip" },
  { id: 9, name: "Celecoxib 100mg Capsules (10s)", category: "NSAIDs", price: 85.00, tax_percent: 5, barcode: "8901050009", sku: "CEL-100-CAP", status: "Available", quantity_type: "strip" },
  { id: 10, name: "Celecoxib 200mg Capsules (10s)", category: "NSAIDs", price: 140.00, tax_percent: 5, barcode: "8901050010", sku: "CEL-200-CAP", status: "Available", quantity_type: "strip" },
  { id: 11, name: "Aceclofenac 100mg Tablets (10s)", category: "NSAIDs", price: 38.00, tax_percent: 5, barcode: "8901050011", sku: "ACE-100-TAB", status: "Available", quantity_type: "strip" },
  { id: 12, name: "Piroxicam 20mg Tablets (10s)", category: "NSAIDs", price: 42.00, tax_percent: 5, barcode: "8901050012", sku: "PIR-20-TAB", status: "Available", quantity_type: "strip" },

  // Analgesics & Antipyretics
  { id: 13, name: "Paracetamol 500mg Tablets (10s)", category: "Analgesics", price: 12.00, tax_percent: 5, barcode: "8901050101", sku: "PCM-500-TAB", status: "Available", quantity_type: "strip" },
  { id: 14, name: "Paracetamol 650mg Tablets (10s)", category: "Analgesics", price: 18.00, tax_percent: 5, barcode: "8901050102", sku: "PCM-650-TAB", status: "Available", quantity_type: "strip" },
  { id: 15, name: "Tramadol 50mg Capsules (10s)", category: "Analgesics", price: 68.00, tax_percent: 5, barcode: "8901050103", sku: "TRM-50-CAP", status: "Available", quantity_type: "strip" },
  { id: 16, name: "Tramadol 100mg SR Tablets (10s)", category: "Analgesics", price: 95.00, tax_percent: 5, barcode: "8901050104", sku: "TRM-100-SR", status: "Available", quantity_type: "strip" },
  { id: 17, name: "Ketorolac 10mg Tablets (10s)", category: "Analgesics", price: 55.00, tax_percent: 5, barcode: "8901050105", sku: "KTR-10-TAB", status: "Available", quantity_type: "strip" },
  { id: 18, name: "Tapentadol 50mg Tablets (10s)", category: "Analgesics", price: 185.00, tax_percent: 5, barcode: "8901050106", sku: "TAP-50-TAB", status: "Available", quantity_type: "strip" },
  { id: 19, name: "Tapentadol 100mg Tablets (10s)", category: "Analgesics", price: 285.00, tax_percent: 5, barcode: "8901050107", sku: "TAP-100-TAB", status: "Available", quantity_type: "strip" },

  // Muscle Relaxants
  { id: 20, name: "Thiocolchicoside 4mg Tablets (10s)", category: "Muscle Relaxants", price: 88.00, tax_percent: 5, barcode: "8901050201", sku: "THC-4-TAB", status: "Available", quantity_type: "strip" },
  { id: 21, name: "Thiocolchicoside 8mg Tablets (10s)", category: "Muscle Relaxants", price: 145.00, tax_percent: 5, barcode: "8901050202", sku: "THC-8-TAB", status: "Available", quantity_type: "strip" },
  { id: 22, name: "Methocarbamol 500mg Tablets (10s)", category: "Muscle Relaxants", price: 72.00, tax_percent: 5, barcode: "8901050203", sku: "MCR-500-TAB", status: "Available", quantity_type: "strip" },
  { id: 23, name: "Tizanidine 2mg Tablets (10s)", category: "Muscle Relaxants", price: 55.00, tax_percent: 5, barcode: "8901050204", sku: "TZN-2-TAB", status: "Available", quantity_type: "strip" },
  { id: 24, name: "Tizanidine 4mg Tablets (10s)", category: "Muscle Relaxants", price: 85.00, tax_percent: 5, barcode: "8901050205", sku: "TZN-4-TAB", status: "Available", quantity_type: "strip" },
  { id: 25, name: "Baclofen 10mg Tablets (10s)", category: "Muscle Relaxants", price: 48.00, tax_percent: 5, barcode: "8901050206", sku: "BCL-10-TAB", status: "Available", quantity_type: "strip" },
  { id: 26, name: "Chlorzoxazone 250mg Tablets (10s)", category: "Muscle Relaxants", price: 38.00, tax_percent: 5, barcode: "8901050207", sku: "CZX-250-TAB", status: "Available", quantity_type: "strip" },

  // Bone & Joint Health Supplements
  { id: 27, name: "Calcium + D3 Tablets (30s)", category: "Bone Supplements", price: 145.00, tax_percent: 12, barcode: "8901050301", sku: "CAL-D3-30", status: "Available", quantity_type: "pack" },
  { id: 28, name: "Calcium + D3 + Magnesium Tablets (60s)", category: "Bone Supplements", price: 285.00, tax_percent: 12, barcode: "8901050302", sku: "CAL-D3-MG-60", status: "Available", quantity_type: "pack" },
  { id: 29, name: "Cholecalciferol 60000 IU Capsules (4s)", category: "Bone Supplements", price: 115.00, tax_percent: 12, barcode: "8901050303", sku: "VD3-60K-CAP", status: "Available", quantity_type: "strip" },
  { id: 30, name: "Vitamin D3 400 IU Tablets (30s)", category: "Bone Supplements", price: 85.00, tax_percent: 12, barcode: "8901050304", sku: "VD3-400-30", status: "Available", quantity_type: "pack" },
  { id: 31, name: "Glucosamine 500mg + Chondroitin Tablets (30s)", category: "Bone Supplements", price: 380.00, tax_percent: 12, barcode: "8901050305", sku: "GLC-CHON-30", status: "Available", quantity_type: "pack" },
  { id: 32, name: "Glucosamine 750mg Tablets (30s)", category: "Bone Supplements", price: 295.00, tax_percent: 12, barcode: "8901050306", sku: "GLC-750-30", status: "Available", quantity_type: "pack" },
  { id: 33, name: "Collagen + Vitamin C Tablets (30s)", category: "Bone Supplements", price: 450.00, tax_percent: 12, barcode: "8901050307", sku: "COL-VC-30", status: "Available", quantity_type: "pack" },
  { id: 34, name: "Methylcobalamin 500mcg Tablets (10s)", category: "Bone Supplements", price: 45.00, tax_percent: 12, barcode: "8901050308", sku: "MCB-500-10", status: "Available", quantity_type: "strip" },
  { id: 35, name: "Mecobalamin 1500mcg Tablets (10s)", category: "Bone Supplements", price: 95.00, tax_percent: 12, barcode: "8901050309", sku: "MCB-1500-10", status: "Available", quantity_type: "strip" },
  { id: 36, name: "Alpha Lipoic Acid 100mg Capsules (10s)", category: "Bone Supplements", price: 125.00, tax_percent: 12, barcode: "8901050310", sku: "ALA-100-10", status: "Available", quantity_type: "strip" },

  // Steroids & Anti-inflammatory
  { id: 37, name: "Prednisolone 5mg Tablets (10s)", category: "Steroids", price: 22.00, tax_percent: 5, barcode: "8901050401", sku: "PRD-5-TAB", status: "Available", quantity_type: "strip" },
  { id: 38, name: "Prednisolone 10mg Tablets (10s)", category: "Steroids", price: 38.00, tax_percent: 5, barcode: "8901050402", sku: "PRD-10-TAB", status: "Available", quantity_type: "strip" },
  { id: 39, name: "Methylprednisolone 4mg Tablets (10s)", category: "Steroids", price: 75.00, tax_percent: 5, barcode: "8901050403", sku: "MPS-4-TAB", status: "Available", quantity_type: "strip" },
  { id: 40, name: "Methylprednisolone 8mg Tablets (10s)", category: "Steroids", price: 120.00, tax_percent: 5, barcode: "8901050404", sku: "MPS-8-TAB", status: "Available", quantity_type: "strip" },
  { id: 41, name: "Dexamethasone 0.5mg Tablets (10s)", category: "Steroids", price: 18.00, tax_percent: 5, barcode: "8901050405", sku: "DEX-05-TAB", status: "Available", quantity_type: "strip" },

  // Osteoporosis Medications
  { id: 42, name: "Alendronate 70mg Tablets (4s)", category: "Osteoporosis", price: 165.00, tax_percent: 5, barcode: "8901050501", sku: "ALD-70-4", status: "Available", quantity_type: "strip" },
  { id: 43, name: "Risedronate 35mg Tablets (4s)", category: "Osteoporosis", price: 195.00, tax_percent: 5, barcode: "8901050502", sku: "RIS-35-4", status: "Available", quantity_type: "strip" },
  { id: 44, name: "Calcitonin Nasal Spray 200 IU", category: "Osteoporosis", price: 485.00, tax_percent: 5, barcode: "8901050503", sku: "CLT-NSP-200", status: "Available", quantity_type: "pcs" },

  // Topicals & Gels
  { id: 45, name: "Diclofenac Gel 1% 30g", category: "Topicals", price: 65.00, tax_percent: 5, barcode: "8901050601", sku: "DCF-GEL-30", status: "Available", quantity_type: "pcs" },
  { id: 46, name: "Diclofenac Gel 1% 100g", category: "Topicals", price: 165.00, tax_percent: 5, barcode: "8901050602", sku: "DCF-GEL-100", status: "Available", quantity_type: "pcs" },
  { id: 47, name: "Ketoprofen Gel 2.5% 50g", category: "Topicals", price: 120.00, tax_percent: 5, barcode: "8901050603", sku: "KPF-GEL-50", status: "Available", quantity_type: "pcs" },
  { id: 48, name: "Voltaren Emulgel 100g", category: "Topicals", price: 285.00, tax_percent: 5, barcode: "8901050608", sku: "VLT-GEL-100", status: "Available", quantity_type: "pcs" },
  { id: 49, name: "Volini Pain Relief Spray 100g", category: "Topicals", price: 185.00, tax_percent: 5, barcode: "8901050609", sku: "VOL-SPY-100", status: "Available", quantity_type: "pcs" },
  { id: 50, name: "Moov Pain Relief Cream 50g", category: "Topicals", price: 98.00, tax_percent: 5, barcode: "8901050610", sku: "MOV-CRM-50", status: "Available", quantity_type: "pcs" },

  // Ortho Supports & Braces
  { id: 51, name: "Knee Cap (Medium)", category: "Ortho Supports", price: 280.00, tax_percent: 12, barcode: "8901050701", sku: "KNC-CAP-M", status: "Available", quantity_type: "pcs" },
  { id: 52, name: "Knee Cap (Large)", category: "Ortho Supports", price: 280.00, tax_percent: 12, barcode: "8901050702", sku: "KNC-CAP-L", status: "Available", quantity_type: "pcs" },
  { id: 53, name: "Lumbosacral Corset (Medium)", category: "Ortho Supports", price: 750.00, tax_percent: 12, barcode: "8901050703", sku: "LSC-MED", status: "Available", quantity_type: "pcs" },
  { id: 54, name: "Lumbosacral Corset (Large)", category: "Ortho Supports", price: 750.00, tax_percent: 12, barcode: "8901050704", sku: "LSC-LGE", status: "Available", quantity_type: "pcs" },
  { id: 55, name: "Cervical Collar (Standard)", category: "Ortho Supports", price: 320.00, tax_percent: 12, barcode: "8901050705", sku: "CVC-STD", status: "Available", quantity_type: "pcs" },
  { id: 56, name: "Wrist Splint (One Size)", category: "Ortho Supports", price: 380.00, tax_percent: 12, barcode: "8901050706", sku: "WRS-SPL", status: "Available", quantity_type: "pcs" },
  { id: 57, name: "Ankle Brace (Medium)", category: "Ortho Supports", price: 420.00, tax_percent: 12, barcode: "8901050707", sku: "ANK-BRC-M", status: "Available", quantity_type: "pcs" },
  { id: 58, name: "Elbow Support (One Size)", category: "Ortho Supports", price: 250.00, tax_percent: 12, barcode: "8901050708", sku: "ELB-SUP", status: "Available", quantity_type: "pcs" },
  { id: 59, name: "Shoulder Immobilizer (Medium)", category: "Ortho Supports", price: 650.00, tax_percent: 12, barcode: "8901050709", sku: "SHD-IMM-M", status: "Available", quantity_type: "pcs" },
  { id: 60, name: "Walking Stick (Adjustable)", category: "Ortho Supports", price: 350.00, tax_percent: 12, barcode: "8901050713", sku: "WLK-STK-ADJ", status: "Available", quantity_type: "pcs" },
  { id: 61, name: "Walker / Walking Frame", category: "Ortho Supports", price: 1100.00, tax_percent: 12, barcode: "8901050714", sku: "WLK-FRM", status: "Available", quantity_type: "pcs" },

  // Physiotherapy Consumables
  { id: 62, name: "TENS Electrode Pads (4 pads)", category: "Physiotherapy", price: 180.00, tax_percent: 12, barcode: "8901050801", sku: "TENS-PAD-4", status: "Available", quantity_type: "pack" },
  { id: 63, name: "Hot Water Bag (2L)", category: "Physiotherapy", price: 220.00, tax_percent: 12, barcode: "8901050803", sku: "HWB-2L", status: "Available", quantity_type: "pcs" },
  { id: 64, name: "Ice Gel Pack (Reusable)", category: "Physiotherapy", price: 185.00, tax_percent: 12, barcode: "8901050804", sku: "ICE-GLP", status: "Available", quantity_type: "pcs" },
  { id: 65, name: "Crepe Bandage 10cm x 4m", category: "Physiotherapy", price: 45.00, tax_percent: 12, barcode: "8901050807", sku: "CRP-BND-10", status: "Available", quantity_type: "pcs" },
  { id: 66, name: "Crepe Bandage 15cm x 4m", category: "Physiotherapy", price: 65.00, tax_percent: 12, barcode: "8901050811", sku: "CRP-BND-15", status: "Available", quantity_type: "pcs" },

  // Injectables
  { id: 67, name: "Diclofenac Sodium 75mg/3mL Injection", category: "Injectables", price: 28.00, tax_percent: 5, barcode: "8901050901", sku: "DCF-INJ-75", status: "Available", quantity_type: "pcs" },
  { id: 68, name: "Methylprednisolone 40mg/mL Vial", category: "Injectables", price: 185.00, tax_percent: 5, barcode: "8901050902", sku: "MPS-40-VIAL", status: "Available", quantity_type: "pcs" },
  { id: 69, name: "Triamcinolone 40mg/mL Vial 5mL", category: "Injectables", price: 245.00, tax_percent: 5, barcode: "8901050903", sku: "TRC-40-VIAL", status: "Available", quantity_type: "pcs" },
  { id: 70, name: "Hyaluronic Acid 2% Injection (2mL)", category: "Injectables", price: 2800.00, tax_percent: 5, barcode: "8901050904", sku: "HYA-2PC-INJ", status: "Available", quantity_type: "pcs" },

  // Neuropathy
  { id: 71, name: "Pregabalin 75mg Capsules (10s)", category: "Neuropathy", price: 88.00, tax_percent: 5, barcode: "8901051001", sku: "PRG-75-CAP", status: "Available", quantity_type: "strip" },
  { id: 72, name: "Pregabalin 150mg Capsules (10s)", category: "Neuropathy", price: 145.00, tax_percent: 5, barcode: "8901051002", sku: "PRG-150-CAP", status: "Available", quantity_type: "strip" },
  { id: 73, name: "Gabapentin 300mg Capsules (10s)", category: "Neuropathy", price: 65.00, tax_percent: 5, barcode: "8901051003", sku: "GAB-300-CAP", status: "Available", quantity_type: "strip" },
  { id: 74, name: "Amitriptyline 10mg Tablets (10s)", category: "Neuropathy", price: 18.00, tax_percent: 5, barcode: "8901051005", sku: "AMT-10-TAB", status: "Available", quantity_type: "strip" },

  // GI Protection
  { id: 75, name: "Pantoprazole 40mg Tablets (10s)", category: "GI Protection", price: 38.00, tax_percent: 12, barcode: "8901051301", sku: "PAN-40-TAB", status: "Available", quantity_type: "strip" },
  { id: 76, name: "Omeprazole 20mg Capsules (10s)", category: "GI Protection", price: 28.00, tax_percent: 12, barcode: "8901051302", sku: "OMP-20-CAP", status: "Available", quantity_type: "strip" },
  { id: 77, name: "Rabeprazole 20mg Tablets (10s)", category: "GI Protection", price: 42.00, tax_percent: 12, barcode: "8901051303", sku: "RAB-20-TAB", status: "Available", quantity_type: "strip" }
];

export const DEFAULT_EMPLOYEES = [
  { id: 1, name: "Dr. Arjun Sharma", role: "Orthopaedic Surgeon", phone: "+91 98765 00001", email: "arjun@madrasortho.com", salary: 85000, status: "Active", joined_date: "2025-01-15" },
  { id: 2, name: "Priya Nair", role: "Pharmacist", phone: "+91 98765 00002", email: "priya@madrasortho.com", salary: 30000, status: "Active", joined_date: "2025-02-10" },
  { id: 3, name: "Ravi Kumar", role: "Billing Assistant", phone: "+91 98765 00003", email: "ravi@madrasortho.com", salary: 22000, status: "Active", joined_date: "2025-01-20" }
];

export const DEFAULT_USERS = [
  { id: 1, username: "admin", password: "admin123", role: "admin", name: "Administrator" },
  { id: 2, username: "employee", password: "employee123", role: "employee", name: "Pharmacist" }
];

// Helper to get monday and sunday of a given date
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
    const parsed = JSON.parse(raw);
    // If key is products, ensure it's not containing old bakery items
    if (key === 'products' && Array.isArray(parsed)) {
      const isOldBakery = parsed.some((p: any) => p.name && (p.name.includes("Cake") || p.name.includes("Puff") || p.name.includes("Bread")));
      if (isOldBakery || parsed.length === 0) {
        localStorage.setItem(`db_${key}`, JSON.stringify(defaults));
        return defaults;
      }
    }
    return parsed;
  } catch (e) {
    return defaults;
  }
};

const saveDbData = (key: string, data: any) => {
  try {
    localStorage.setItem(`db_${key}`, JSON.stringify(data));
  } catch (e) {
    console.error("Local storage save error:", e);
  }
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

  console.log("[MOCK DB] Non-Electron environment detected. Offline database active!");

  // Ensure clean initial seeding in localStorage
  getDbData('products', ORTHO_PHARMACY_PRODUCTS);
  getDbData('employees', DEFAULT_EMPLOYEES);
  getDbData('users', DEFAULT_USERS);

  const originalFetch = window.fetch;

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const urlStr = typeof input === 'string' ? input : (input as any).url || input.toString();

    // Only intercept local Express API server endpoints
    if (!urlStr.includes("localhost:4848") && !urlStr.startsWith("/api/")) {
      return originalFetch.apply(this, arguments as any);
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(urlStr, window.location.origin || 'http://localhost:4848');
    } catch {
      parsedUrl = new URL(urlStr, 'http://localhost:4848');
    }

    const path = parsedUrl.pathname;
    const method = (init?.method || 'GET').toUpperCase();
    const params = parsedUrl.searchParams;

    try {
      // ----------------------------------------------------
      // AUTHENTICATION API
      // ----------------------------------------------------
      if (path === '/api/auth/login') {
        if (method === 'POST') {
          const body = JSON.parse(init?.body as string || '{}');
          const users = getDbData('users', DEFAULT_USERS);
          const found = users.find((u: any) => u.username === body.username && u.password === body.password);
          if (found) {
            return makeResponse({
              success: true,
              user: {
                id: found.id,
                username: found.username,
                role: found.role,
                name: found.name
              }
            });
          }
          return makeResponse({ error: "Invalid username or password." }, 401);
        }
      }

      if (path === '/api/auth/change-password') {
        if (method === 'PUT') {
          const body = JSON.parse(init?.body as string || '{}');
          const users = getDbData('users', DEFAULT_USERS);
          const idx = users.findIndex((u: any) => u.username === body.username);
          if (idx === -1) {
            return makeResponse({ error: "User not found." }, 404);
          }
          if (users[idx].password !== body.currentPassword) {
            return makeResponse({ error: "Incorrect current password." }, 401);
          }
          users[idx].password = body.newPassword;
          saveDbData('users', users);
          return makeResponse({ success: true, message: "Password updated successfully." });
        }
      }

      // ----------------------------------------------------
      // PRODUCTS API
      // ----------------------------------------------------
      if (path === '/api/products') {
        let products = getDbData('products', ORTHO_PHARMACY_PRODUCTS);

        if (method === 'GET') {
          products.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
          return makeResponse(products);
        }

        if (method === 'POST') {
          const body = JSON.parse(init?.body as string || '{}');
          if (!body.name || !body.category || body.price === undefined) {
            return makeResponse({ error: "Missing required product fields." }, 400);
          }
          const newId = products.length > 0 ? Math.max(...products.map((p: any) => Number(p.id) || 0)) + 1 : 1;
          const newProduct = {
            id: newId,
            name: body.name,
            category: body.category,
            price: Number(body.price),
            barcode: body.barcode || null,
            sku: body.sku || null,
            tax_percent: Number(body.tax_percent || 0),
            status: body.status || 'Available',
            quantity_type: body.quantity_type || 'strip'
          };
          products.push(newProduct);
          saveDbData('products', products);
          return makeResponse(newProduct, 201);
        }
      }

      if (path.startsWith('/api/products/')) {
        const idStr = path.substring('/api/products/'.length);

        if (idStr.startsWith('barcode/')) {
          const barcode = idStr.substring('barcode/'.length);
          const products = getDbData('products', ORTHO_PHARMACY_PRODUCTS);
          const product = products.find((p: any) => p.barcode === barcode && p.status === 'Available');
          if (!product) {
            return makeResponse({ error: "Product not found." }, 404);
          }
          return makeResponse(product);
        }

        const id = Number(idStr);
        let products = getDbData('products', ORTHO_PHARMACY_PRODUCTS);
        const idx = products.findIndex((p: any) => p.id === id);

        if (idx === -1) {
          return makeResponse({ error: "Product not found." }, 404);
        }

        if (method === 'PUT') {
          const body = JSON.parse(init?.body as string || '{}');
          const updated = {
            ...products[idx],
            name: body.name !== undefined ? body.name : products[idx].name,
            category: body.category !== undefined ? body.category : products[idx].category,
            price: body.price !== undefined ? Number(body.price) : products[idx].price,
            barcode: body.barcode !== undefined ? body.barcode : products[idx].barcode,
            sku: body.sku !== undefined ? body.sku : products[idx].sku,
            tax_percent: body.tax_percent !== undefined ? Number(body.tax_percent) : products[idx].tax_percent,
            status: body.status !== undefined ? body.status : products[idx].status,
            quantity_type: body.quantity_type !== undefined ? body.quantity_type : products[idx].quantity_type
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
      // EMPLOYEES API
      // ----------------------------------------------------
      if (path === '/api/employees') {
        let employees = getDbData('employees', DEFAULT_EMPLOYEES);

        if (method === 'GET') {
          employees.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
          return makeResponse(employees);
        }

        if (method === 'POST') {
          const body = JSON.parse(init?.body as string || '{}');
          const newId = employees.length > 0 ? Math.max(...employees.map((e: any) => Number(e.id) || 0)) + 1 : 1;
          const newEmp = {
            id: newId,
            name: body.name,
            role: body.role,
            phone: body.phone || null,
            email: body.email || null,
            salary: body.salary !== undefined && body.salary !== null ? Number(body.salary) : null,
            status: body.status || 'Active',
            joined_date: body.joined_date || new Date().toISOString().split('T')[0]
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
            name: body.name !== undefined ? body.name : employees[idx].name,
            role: body.role !== undefined ? body.role : employees[idx].role,
            phone: body.phone !== undefined ? body.phone : employees[idx].phone,
            email: body.email !== undefined ? body.email : employees[idx].email,
            salary: body.salary !== undefined && body.salary !== null ? Number(body.salary) : employees[idx].salary,
            status: body.status !== undefined ? body.status : employees[idx].status,
            joined_date: body.joined_date !== undefined ? body.joined_date : employees[idx].joined_date
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
      // BILLS & INVOICES API
      // ----------------------------------------------------
      if (path === '/api/bills/next-number') {
        const bills = getDbData('bills', []);
        const todayStr = new Date().toISOString().split('T')[0];
        const todaysBills = bills.filter((b: any) => (b.date || '').startsWith(todayStr));
        const nextVal = todaysBills.length > 0 ? Math.max(...todaysBills.map((b: any) => Number(b.bill_number) || 0)) + 1 : 1;
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
            filteredBills = bills.filter((b: any) => (b.date || '').startsWith(dateStr));
          } else if (period === 'week') {
            const { monday, sunday } = getMondayAndSunday(dateStr);
            filteredBills = bills.filter((b: any) => b.date >= monday && b.date <= sunday);
          } else if (period === 'year') {
            filteredBills = bills.filter((b: any) => (b.date || '').startsWith(`${year}-`));
          } else {
            filteredBills = bills;
          }

          filteredBills.sort((a: any, b: any) => {
            const dateDiff = (b.date || '').localeCompare(a.date || '');
            if (dateDiff !== 0) return dateDiff;
            return (b.time || '').localeCompare(a.time || '');
          });

          return makeResponse(filteredBills);
        }

        if (method === 'POST') {
          const body = JSON.parse(init?.body as string || '{}');
          const now = new Date();
          const dateStr = now.toISOString().split('T')[0];
          const timeStr = now.toTimeString().split(' ')[0];

          const newId = bills.length > 0 ? Math.max(...bills.map((b: any) => Number(b.id) || 0)) + 1 : 1;
          const newBill = {
            id: newId,
            bill_number: Number(body.bill_number || 1),
            subtotal: Number(body.subtotal || 0),
            discount: Number(body.discount || 0),
            tax: Number(body.tax || 0),
            grand_total: Number(body.grand_total || 0),
            payment_method: body.payment_method || 'Cash',
            date: dateStr,
            time: timeStr,
            cashier_name: body.cashier_name || 'Pharmacist',
            items: (body.items || []).map((it: any) => ({
              product_id: it.product_id,
              product_name: it.product_name,
              quantity: Number(it.quantity || 1),
              rate: Number(it.rate || 0),
              total: Number(it.total || 0)
            }))
          };
          bills.push(newBill);
          saveDbData('bills', bills);
          return makeResponse(newBill, 201);
        }
      }

      if (path.startsWith('/api/bills/')) {
        const subPath = path.substring('/api/bills/'.length);

        if (subPath.endsWith('/items')) {
          const id = Number(subPath.substring(0, subPath.indexOf('/items')));
          const bills = getDbData('bills', []);
          const bill = bills.find((b: any) => b.id === id);
          return makeResponse(bill ? bill.items || [] : []);
        }

        const id = Number(subPath);
        let bills = getDbData('bills', []);
        const idx = bills.findIndex((b: any) => b.id === id);
        if (idx !== -1) {
          if (method === 'DELETE') {
            bills.splice(idx, 1);
            saveDbData('bills', bills);
            return makeResponse({ message: "Bill deleted successfully.", id });
          }
          return makeResponse(bills[idx]);
        }
        return makeResponse({ error: "Bill not found." }, 404);
      }

      // ----------------------------------------------------
      // DELETED ITEMS HISTORY AUDIT
      // ----------------------------------------------------
      if (path === '/api/deleted-items') {
        let logs = getDbData('deleted_items', []);

        if (method === 'GET') {
          logs.sort((a: any, b: any) => (b.deleted_at || '').localeCompare(a.deleted_at || ''));
          return makeResponse(logs.slice(0, 100));
        }

        if (method === 'POST') {
          const body = JSON.parse(init?.body as string || '{}');
          const newLog = {
            id: logs.length > 0 ? Math.max(...logs.map((l: any) => Number(l.id) || 0)) + 1 : 1,
            bill_id: body.bill_id ? Number(body.bill_id) : null,
            product_name: body.product_name || 'Item',
            quantity: Number(body.quantity || 1),
            deleted_at: new Date().toISOString()
          };
          logs.push(newLog);
          saveDbData('deleted_items', logs);
          return makeResponse({ success: true }, 201);
        }
      }

      // ----------------------------------------------------
      // NETWORK PRINTER MOCK
      // ----------------------------------------------------
      if (path === '/api/print/network') {
        return makeResponse({ success: true, message: "Receipt dispatched to printer." });
      }

      // ----------------------------------------------------
      // REPORTS / SALES ANALYTICS
      // ----------------------------------------------------
      if (path.startsWith('/api/reports/')) {
        const reportType = path.substring('/api/reports/'.length);
        const bills = getDbData('bills', []);

        if (reportType === 'daily') {
          const dateStr = params.get('date') || new Date().toISOString().split('T')[0];
          const dayBills = bills.filter((b: any) => (b.date || '').startsWith(dateStr));

          let totalSales = 0;
          const paymentBreakdown = { Cash: 0, GooglePay: 0, BankCard: 0 };
          const productsMap: { [key: string]: { name: string; quantity: number; total: number } } = {};

          dayBills.forEach((b: any) => {
            totalSales += Number(b.grand_total || 0);
            const pm = b.payment_method;
            if (pm === "Cash") paymentBreakdown.Cash += Number(b.grand_total || 0);
            else if (pm === "Google Pay" || pm === "GooglePay") paymentBreakdown.GooglePay += Number(b.grand_total || 0);
            else if (pm === "Bank Card" || pm === "BankCard") paymentBreakdown.BankCard += Number(b.grand_total || 0);

            if (b.items) {
              b.items.forEach((it: any) => {
                if (!productsMap[it.product_name]) {
                  productsMap[it.product_name] = { name: it.product_name, quantity: 0, total: 0 };
                }
                productsMap[it.product_name].quantity += Number(it.quantity || 0);
                productsMap[it.product_name].total += Number(it.total || 0);
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

          const dailyBreakdownMap: { [key: string]: { date: string; amount: number; bills: number } } = {};
          let runner = new Date(monday);
          for (let i = 0; i < 7; i++) {
            const dStr = runner.toISOString().split('T')[0];
            dailyBreakdownMap[dStr] = { date: dStr, amount: 0, bills: 0 };
            runner.setDate(runner.getDate() + 1);
          }

          weekBills.forEach((b: any) => {
            totalSales += Number(b.grand_total || 0);
            const pm = b.payment_method;
            if (pm === "Cash") paymentBreakdown.Cash += Number(b.grand_total || 0);
            else if (pm === "Google Pay" || pm === "GooglePay") paymentBreakdown.GooglePay += Number(b.grand_total || 0);
            else if (pm === "Bank Card" || pm === "BankCard") paymentBreakdown.BankCard += Number(b.grand_total || 0);

            if (dailyBreakdownMap[b.date]) {
              dailyBreakdownMap[b.date].amount += Number(b.grand_total || 0);
              dailyBreakdownMap[b.date].bills += 1;
            }

            if (b.items) {
              b.items.forEach((it: any) => {
                if (!productsMap[it.product_name]) {
                  productsMap[it.product_name] = { name: it.product_name, quantity: 0, total: 0 };
                }
                productsMap[it.product_name].quantity += Number(it.quantity || 0);
                productsMap[it.product_name].total += Number(it.total || 0);
              });
            }
          });

          return makeResponse({
            dateRange: `${monday} to ${sunday}`,
            totalSales,
            dailyBreakdown: Object.values(dailyBreakdownMap),
            paymentBreakdown,
            topProducts: Object.values(productsMap).sort((a, b) => b.quantity - a.quantity)
          });
        }

        if (reportType === 'yearly') {
          const year = Number(params.get('year') || new Date().getFullYear());
          const yearBills = bills.filter((b: any) => (b.date || '').startsWith(`${year}-`));

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
            totalSales += Number(b.grand_total || 0);
            const pm = b.payment_method;
            if (pm === "Cash") paymentBreakdown.Cash += Number(b.grand_total || 0);
            else if (pm === "Google Pay" || pm === "GooglePay") paymentBreakdown.GooglePay += Number(b.grand_total || 0);
            else if (pm === "Bank Card" || pm === "BankCard") paymentBreakdown.BankCard += Number(b.grand_total || 0);

            const mIdx = new Date(b.date).getMonth();
            if (mIdx >= 0 && mIdx < 12) {
              monthlyBreakdown[mIdx].amount += Number(b.grand_total || 0);
              monthlyBreakdown[mIdx].bills += 1;
            }

            if (b.items) {
              b.items.forEach((it: any) => {
                if (!productsMap[it.product_name]) {
                  productsMap[it.product_name] = { name: it.product_name, quantity: 0, total: 0 };
                }
                productsMap[it.product_name].quantity += Number(it.quantity || 0);
                productsMap[it.product_name].total += Number(it.total || 0);
              });
            }
          });

          for (let i = 1; i < 12; i++) {
            const prev = monthlyBreakdown[i - 1].amount;
            const curr = monthlyBreakdown[i].amount;
            monthlyBreakdown[i].growthPercent = prev === 0 ? (curr > 0 ? 1 : 0) : (curr - prev) / prev;
          }

          return makeResponse({
            year,
            totalSales,
            monthlyBreakdown,
            paymentBreakdown,
            topProducts: Object.values(productsMap).sort((a, b) => b.quantity - a.quantity)
          });
        }
      }

      // Safe fallback for unhandled requests: return 200 with empty object to prevent frontend crashes
      console.warn(`[MOCK DB] Unhandled offline endpoint: ${method} ${path}`);
      return makeResponse({ success: true, warning: "Offline mock: route not explicitly handled." }, 200);

    } catch (err: any) {
      console.error("[MOCK DB] Error processing request:", err);
      return makeResponse({ error: err.message }, 500);
    }
  };
}

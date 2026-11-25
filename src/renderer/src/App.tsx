import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Plus, Search, Trash2, CreditCard, DollarSign, Smartphone, ShoppingBag,
  Settings, BarChart2, FileText, X, Check, AlertCircle, Edit, RefreshCw, AlertTriangle,
  Users, Lock, LogOut, Shield, KeyRound, Wifi, Bluetooth, Printer,
  FileSpreadsheet, UploadCloud, Download, Menu, CheckCircle, CheckCircle2,
  Database, PlusCircle, ChevronRight, ChevronDown, Building2, Store, Package,
  Sparkles, Stethoscope, Bell
} from 'lucide-react';
import { PatientsModal } from './components/PatientsModal';
import { MobileTabletApp } from './components/MobileTabletApp';
import { NotificationsModal, NotificationsData } from './components/NotificationsModal';
import { apiUrl, authApiUrl, setAuthToken, getAuthToken, setUnauthorizedHandler, getSavedClinicServerUrl, setSavedClinicServerUrl, getApiBaseUrl, round2, toPaise } from './utils/apiConfig';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import {
  isBluetoothSupported,
  connectBluetoothPrinter,
  disconnectBluetoothPrinter,
  printViaBluetooth,
  getActiveBluetoothDevice
} from './utils/bluetoothPrinter';

// Clinic Orthopaedic Prescribing Specialists Directory (Tamil Nadu Medical Council)
const CLINIC_DOCTORS = [
  {
    name: "Dr. Arjun Sharma, MS (Ortho)",
    reg_no: "TNMC/2012/94821",
    council: "Tamil Nadu Medical Council",
    specialty: "Senior Consultant Orthopaedic Surgeon",
    degrees: "MBBS, MS (Orthopaedics), DNB (Orthopaedics)"
  },
  {
    name: "Dr. Meera Chandran, D.Ortho, DNB",
    reg_no: "TNMC/2017/09142",
    council: "Tamil Nadu Medical Council",
    specialty: "Associate Orthopaedic Surgeon",
    degrees: "MBBS, D.Ortho, DNB (Orthopaedics)"
  },
  {
    name: "Dr. S. K. Rajasekaran, MCh (Ortho)",
    reg_no: "TNMC/2009/01284",
    council: "Tamil Nadu Medical Council",
    specialty: "Spine & Joint Replacement Specialist",
    degrees: "MBBS, MS (Ortho), MCh (Ortho - UK)"
  },
  {
    name: "Dr. K. Vigneshwaran, MS (Ortho)",
    reg_no: "TNMC/2020/07319",
    council: "Tamil Nadu Medical Council",
    specialty: "Sports Medicine & Arthroscopy",
    degrees: "MBBS, MS (Orthopaedics)"
  }
];

// Safe Electron detection and fallback
const isElectron = typeof window !== 'undefined' && (window as any).electron !== undefined;
const electronAPI = isElectron ? (window as any).electron : {
  printReceipt: async (receiptData: any, printerName: string) => {
    console.log("[MOCK PRINT]", receiptData, printerName);
    try {
      const {
        bakeryName = "MADRAS ORTHO CLINIC SOFTWARE",
        address = "Chennai, Tamil Nadu",
        phone = "+91 98765 43210",
        gstin = "",
        dlNo = "",
        billNumber,
        date,
        time,
        items = [],
        subtotal = 0,
        discount = 0,
        tax = 0,
        grandTotal = 0,
        paymentMethod = "Cash",
        width = "80mm" // "58mm" or "80mm"
      } = receiptData;
      const cgst = tax > 0 ? tax / 2 : 0;
      const sgst = tax > 0 ? tax / 2 : 0;

      const thermalHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            @page { margin: 0; }
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: ${width === '58mm' ? '11px' : '13px'};
              line-height: 1.4;
              margin: 0;
              padding: ${width === '58mm' ? '5px' : '15px'};
              color: #000;
              background: #fff;
              width: ${width};
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .header-title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 2px;
              text-transform: uppercase;
            }
            .separator { border-top: 1px dashed #000; margin: 8px 0; }
            .info-table, .items-table { width: 100%; border-collapse: collapse; }
            .info-table td { padding: 1px 0; }
            .items-table th {
              text-align: left;
              border-bottom: 1px dashed #000;
              padding-bottom: 4px;
              font-weight: bold;
            }
            .items-table td { padding: 4px 0; vertical-align: top; }
            .right { text-align: right; }
            .totals-container { width: 100%; margin-top: 8px; }
            .totals-table { width: 60%; margin-left: 40%; }
            .totals-table td { padding: 2px 0; }
            .footer { margin-top: 20px; font-size: ${width === '58mm' ? '10px' : '11px'}; }
          </style>
        </head>
        <body>
          <div class="center">
            <div class="header-title">${bakeryName}</div>
            <div class="bold" style="font-size:11px;">Mission for Cure</div>
            <div>${address}</div>
            <div>Phone: ${phone}</div>
            ${gstin ? `<div><strong>GSTIN: ${gstin}</strong></div>` : ''}
            ${dlNo ? `<div>Drug Lic: ${dlNo}</div>` : ''}
          </div>
          <div class="separator"></div>
          <table class="info-table">
            <tr>
              <td><span class="bold">Bill No:</span> #${billNumber}</td>
              <td class="right"><span class="bold">Date:</span> ${date}</td>
            </tr>
            <tr>
              <td><span class="bold">Time:</span> ${time}</td>
              <td class="right"><span class="bold">Status:</span> Issued</td>
            </tr>
          </table>
          <div class="separator"></div>
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 50%;">Item</th>
                <th class="right" style="width: 15%;">Qty</th>
                <th class="right" style="width: 15%;">Rate</th>
                <th class="right" style="width: 20%;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item: any) => `
                <tr>
                  <td>
                    ${item.product_name}
                    ${item.mrp ? `<br/><span style="font-size:8px;color:#555;">MRP: ₹${Number(item.mrp).toFixed(2)}</span>` : ''}
                  </td>
                  <td class="right">${item.quantity}</td>
                  <td class="right">₹${Number(item.rate).toFixed(2)}</td>
                  <td class="right">₹${Number(item.total).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="separator"></div>
          <div class="totals-container">
            <table class="totals-table">
              <tr>
                <td>Subtotal (excl. GST):</td>
                <td class="right">₹${Number(subtotal).toFixed(2)}</td>
              </tr>
              ${discount > 0 ? `
                <tr>
                  <td>Discount:</td>
                  <td class="right">-₹${Number(discount).toFixed(2)}</td>
                </tr>
              ` : ''}
              ${tax > 0 ? `
                <tr>
                  <td>CGST:</td>
                  <td class="right">+₹${cgst.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>SGST:</td>
                  <td class="right">+₹${sgst.toFixed(2)}</td>
                </tr>
                <tr class="bold">
                  <td>Total GST Added:</td>
                  <td class="right">+₹${tax.toFixed(2)}</td>
                </tr>
              ` : ''}
              <tr class="bold">
                <td>Grand Total (incl. GST):</td>
                <td class="right" style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 4px 0;">
                  ₹${Number(grandTotal).toFixed(2)}
                </td>
              </tr>
            </table>
          </div>
          <div class="separator"></div>
          <div class="center">
            <span class="bold">Payment Method: ${paymentMethod}</span>
          </div>
          <div class="separator"></div>
          <div class="center footer">
            <div class="bold" style="font-size: 11px; margin-top: 4px; letter-spacing: 0.5px;">Drugs sold cannot be refunded</div>
            <div class="bold" style="margin-top: 4px;">Thank You. Stay Healthy!</div>
            <div style="font-size: 9px; color: #666; margin-top: 4px;">${bakeryName || 'MADRAS ORTHO CLINIC'} · Developed by RegulaVitae © 2026</div>
          </div>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank', 'width=400,height=600');
      if (printWindow) {
        printWindow.document.write(thermalHtml);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }
    } catch (err) {
      console.error("Print mock failure:", err);
    }
    return { success: true };
  },
  getPrinters: async () => [
    { name: "Default Printer", isDefault: true },
    { name: "XP-80 Thermal Printer", isDefault: false },
    { name: "RP-58 USB Printer", isDefault: false }
  ]
};

// Core Domain Interfaces
interface Product {
  id: number;
  name: string;
  category: string;
  price: number; // Price sold at (selling price charged to patient)
  barcode: string | null;
  sku: string | null;
  tax_percent: number;
  status: 'Available' | 'Out of Stock' | 'Expired';
  quantity_type: string;
  generic_name?: string;
  mrp?: number; // Maximum Retail Price printed on drug package
  purchase_price?: number; // Cost of purchase from wholesale/distributor
  available_stock?: number; // Real-time non-expired physical units
  batch_number?: string;
  expiry_date?: string;
  is_expired?: boolean;
  is_out_of_stock?: boolean;
  hsn_code?: string;
  schedule?: 'Schedule H' | 'Schedule H1' | 'Schedule X' | 'NDPS' | 'Schedule G' | 'OTC' | 'Medical Device';
  dosage_form?: string;
  strength?: string;
  pack_size?: string;
  storage_condition?: string;
  is_prescription_required?: number;
  is_cold_chain?: number;
  is_example?: number | boolean;
}

interface Employee {
  id: number;
  username?: string | null;
  name: string;
  role: string;
  phone: string | null;
  email: string | null;
  salary: number | null;
  status: 'Active' | 'Inactive';
  joined_date: string | null;
  qualification?: string | null;
  reg_no?: string | null;
  is_example?: number | boolean;
}

interface BillItem {
  product_id: number;
  product_name: string;
  generic_name?: string;
  quantity: number;
  rate: number; // Price sold at
  mrp?: number; // MRP
  purchase_price?: number; // Purchase rate / COGS
  tax_percent: number;
  total: number;
  batch_number?: string;
  expiry_date?: string;
  hsn_code?: string;
  schedule?: string;
  dosage_instructions?: string;
}

interface BillingSession {
  id: string;
  billNumber: number;
  items: BillItem[];
  discountPercent: number;
  discountAmount: number;
  paymentMethod: 'Cash' | 'Google Pay' | 'Bank Card' | null;
  holdStatus: boolean;
  selectedItemIndex: number;
  cashierName: string;
  // Patient & Clinical Prescriber details
  patientName?: string;
  patientAge?: string;
  patientGender?: string;
  patientPhone?: string;
  patientAddress?: string;
  doctorName?: string;
  doctorRegNo?: string;
  doctorClinic?: string;
  prescriptionDate?: string;
  pharmacistName?: string;
  pharmacistRegNo?: string;
}

interface ClinicBranding {
  name: string;
  description: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone: string;
  email?: string;
  gstin: string;
  dlNo: string; // Form 20B
  dlNo21?: string; // Form 21B
  ceaNo?: string; // Clinical Establishments Act Registration No.
  doctorName?: string;
  doctorDegrees?: string;
  doctorRegNo?: string;
  doctorCouncil?: string;
  doctorSpecialty?: string;
  doctorPhone?: string;
  doctorEmail?: string;
  pharmacistName?: string;
  pharmacistRegNo?: string;
  stateCouncil?: string;
  adminUsername?: string;
}

export default function App() {
  // View Switcher (Desktop POS vs Dedicated Mobile & Tablet UI)
  const [isMobileView, setIsMobileView] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'mobile') return true;
      if (params.get('view') === 'desktop') return false;
      return window.innerWidth <= 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      const params = new URLSearchParams(window.location.search);
      if (!params.has('view')) {
        if (window.innerWidth <= 768 && !isMobileView) {
          setIsMobileView(true);
        }
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileView]);

  // App states
  const [sessions, setSessions] = useState<BillingSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Modals & Panels visibility
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showProductCrudModal, setShowProductCrudModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAdminProfileModal, setShowAdminProfileModal] = useState(false);
  const [adminProfileForm, setAdminProfileForm] = useState<ClinicBranding>(() => ({} as any));
  const [showEmployeeCrudModal, setShowEmployeeCrudModal] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editingEmployee, setEditingEmployee] = useState<Partial<Employee>>({});
  const [employeeSearch, setEmployeeSearch] = useState('');

  // Mobile navigation drawer & instant catalogue search
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [catalogueSearch, setCatalogueSearch] = useState('');

  // Medicine Management & Intelligent Excel Upload state
  const [productModalTab, setProductModalTab] = useState<'manual' | 'excel' | 'list' | 'inward'>('manual');
  const [excelParsing, setExcelParsing] = useState(false);
  const [excelFileName, setExcelFileName] = useState('');
  const [excelParsedMedicines, setExcelParsedMedicines] = useState<any[]>([]);
  const [excelConflicts, setExcelConflicts] = useState<Array<{ excelItem: any; existingItem: Product; userChoice: 'skip' | 'add' }>>([]);
  const [excelNewItems, setExcelNewItems] = useState<any[]>([]);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [isBatchImporting, setIsBatchImporting] = useState(false);

  // Persistent Discount (remains active for every single bill until user changes it)
  const [persistentDiscount, setPersistentDiscount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('moc_persistent_discount');
      return saved !== null ? Number(saved) : 0;
    } catch {
      return 0;
    }
  });

  // Multi-Medicine Inward Stock Consignment state (Admin only)
  const [inwardRecords, setInwardRecords] = useState<any[]>([]);
  const [savingInward, setSavingInward] = useState(false);
  const [inwardSearchQuery, setInwardSearchQuery] = useState('');
  const [inwardConsignment, setInwardConsignment] = useState({
    supplier_name: '',
    invoice_number: '',
    received_date: new Date().toISOString().split('T')[0],
    notes: '',
    items: [
      {
        id: 'inw-item-1',
        product_id: 0,
        product_name: '',
        batch_number: '',
        quantity: 0,
        expiry_date: '',
        purchase_price: 0,
        mrp: 0,
        selling_price: 0
      }
    ]
  });

  // Complimentary / Doctor Health Dispense state (Admin only)
  const [isComplimentaryCheckout, setIsComplimentaryCheckout] = useState(false);
  const [complimentaryRecipient, setComplimentaryRecipient] = useState('');
  const [complimentaryReason, setComplimentaryReason] = useState('Doctor / Staff Health Dispense');
  const [hasOpeningStock, setHasOpeningStock] = useState(false);

  // Authentication & Role State (Strictly per-device/per-session in-memory; NEVER auto-logged-in from localStorage)
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string; role: 'admin' | 'employee' | string; name: string; doctor_reg_no?: string; pharmacist_reg_no?: string } | null>(null);
  const [isFirstTimeEver, setIsFirstTimeEver] = useState<boolean>(() => {
    return !localStorage.getItem("madrasortho_pos_has_logged_in_ever");
  });
  const [loginForm, setLoginForm] = useState({ username: 'admin', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showLoginServerConfig, setShowLoginServerConfig] = useState(false);
  const [loginServerUrl, setLoginServerUrl] = useState(() => getSavedClinicServerUrl() || getApiBaseUrl());
  const [loginServerStatus, setLoginServerStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ username: 'admin', currentPassword: '', newPassword: '', confirmPassword: '' });

  const clearInMemoryClinicalState = () => {
    setHistoryBills([]);
    setSelectedBill(null);
    setSelectedBillItems([]);
    setAnalyticsData(null);
    setPatientsList([]);
    setEmployees([]);
    setInwardRecords([]);
    setNotificationsData({
      summary: { totalAlerts: 0, expiredCount: 0, expiringSoonCount: 0, outOfStockCount: 0, lowStockCount: 0, updatedAt: '' },
      expired: [],
      expiringSoon: [],
      outOfStock: [],
      lowStock: []
    });
  };

  // Clear any legacy cached user credentials from localStorage on startup and wire global 401 lock
  useEffect(() => {
    try {
      localStorage.removeItem("madrasortho_pos_user");
    } catch { }
    setUnauthorizedHandler(() => {
      setAuthToken(null);
      setCurrentUser(null);
      setIsLoggingIn(false);
      clearInMemoryClinicalState();
      setLoginForm({ username: 'admin', password: '' });
      setLoginError('Your session expired or was signed out. Please log in to continue.');
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // Ensure login state is completely clean whenever user is logged out
  useEffect(() => {
    if (!currentUser) {
      setIsLoggingIn(false);
    }
  }, [currentUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginForm.password || !loginForm.password.trim()) {
      setLoginError('Password is required.');
      setIsLoggingIn(false);
      return;
    }
    setIsLoggingIn(true);
    let serverResponded = false;
    try {
      const res = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm)
      });
      serverResponded = true;
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.user) {
        setAuthToken(data.token || null);
        localStorage.removeItem("madrasortho_pos_user");
        localStorage.setItem("madrasortho_pos_has_logged_in_ever", "true");
        setCurrentUser(data.user);
        setIsFirstTimeEver(false);
        setIsLoggingIn(false);
        showToast(`Logged in as ${data.user.name} (${data.user.role.toUpperCase()})`, "success");
        return;
      }
      // Server explicitly rejected credentials (401/400/etc.): never bypass with offline fallback
      setAuthToken(null);
      setLoginError(data.error || "Invalid username or password.");
      setIsLoggingIn(false);
      return;
    } catch (err) {
      if (serverResponded) {
        setAuthToken(null);
        setLoginError("Authentication failed. Please verify credentials.");
        setIsLoggingIn(false);
        return;
      }
      // Genuine network unreachable fallback (offline Electron/emulator only)
    }

    // Offline fallback ONLY when backend server is unreachable
    const uname = (loginForm.username || '').toLowerCase().trim();
    const pwd = loginForm.password;
    const savedAdminPwd = localStorage.getItem("madrasortho_admin_password");
    const savedEmpPwd = localStorage.getItem("madrasortho_employee_password");
    const offlineTok = `offline-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    if (uname === 'admin' && (pwd === 'admin123' || pwd === 'admin' || (savedAdminPwd && pwd === savedAdminPwd))) {
      const u = {
        id: 1,
        username: 'admin',
        role: 'admin' as const,
        name: bakeryDetails.doctorName || 'Dr. Arjun Sharma, MS (Ortho)',
        doctor_reg_no: bakeryDetails.doctorRegNo || 'TNMC/2012/94821'
      };
      setAuthToken(offlineTok);
      setCurrentUser(u);
      localStorage.setItem("madrasortho_pos_has_logged_in_ever", "true");
      setIsFirstTimeEver(false);
      showToast(`Logged in as Administrator (${u.name})`, "success");
    } else if (uname === 'employee' && (pwd === 'employee123' || pwd === 'employee' || pwd === '1234' || (savedEmpPwd && pwd === savedEmpPwd))) {
      const u = {
        id: 2,
        username: 'employee',
        role: 'employee' as const,
        name: bakeryDetails.pharmacistName || 'Priya Nair, B.Pharm (Staff Pharmacist)',
        pharmacist_reg_no: bakeryDetails.pharmacistRegNo || 'TNSPC/2018/48912'
      };
      setAuthToken(offlineTok);
      setCurrentUser(u);
      localStorage.setItem("madrasortho_pos_has_logged_in_ever", "true");
      setIsFirstTimeEver(false);
      showToast("Logged in as Clinic Staff / Pharmacist", "success");
    } else if (uname === 'doctor' && (pwd === 'doc123' || pwd === 'doctor123')) {
      const u = {
        id: 3,
        username: 'doctor',
        role: 'doctor' as const,
        name: bakeryDetails.doctorName || 'Dr. Arjun Sharma, MS (Ortho)',
        doctor_reg_no: bakeryDetails.doctorRegNo || 'TNMC/2012/94821'
      };
      setAuthToken(offlineTok);
      setCurrentUser(u);
      localStorage.setItem("madrasortho_pos_has_logged_in_ever", "true");
      setIsFirstTimeEver(false);
      showToast(`Logged in as Doctor (${u.name})`, "success");
    } else if (uname === 'pharmacist' && (pwd === 'pharm123' || pwd === 'pharmacist123')) {
      const u = {
        id: 4,
        username: 'pharmacist',
        role: 'registered_pharmacist' as const,
        name: bakeryDetails.pharmacistName || 'Priya Nair, B.Pharm',
        pharmacist_reg_no: bakeryDetails.pharmacistRegNo || 'TNSPC/2018/48912'
      };
      setAuthToken(offlineTok);
      setCurrentUser(u);
      localStorage.setItem("madrasortho_pos_has_logged_in_ever", "true");
      setIsFirstTimeEver(false);
      showToast(`Logged in as Pharmacist (${u.name})`, "success");
    } else {
      setAuthToken(null);
      setLoginError("Invalid username or password. Default Admin: admin / admin123  |  Default Employee: employee / employee123");
    }
    setIsLoggingIn(false);
  };

  const handleLogout = () => {
    const tokenToRevoke = getAuthToken();
    if (tokenToRevoke) {
      fetch(apiUrl("/api/auth/logout"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${tokenToRevoke}`
        },
        body: JSON.stringify({ token: tokenToRevoke })
      }).catch(() => { });
    }
    setAuthToken(null);
    setCurrentUser(null);
    setIsLoggingIn(false);
    clearInMemoryClinicalState();
    localStorage.removeItem("madrasortho_pos_user");
    setLoginForm({ username: 'admin', password: '' });
    setLoginError('');
    showToast("Logged out successfully.", "info");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role !== 'admin') {
      showToast("Access Denied: Only Admin accounts can change passwords.", "error");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast("New passwords do not match.", "error");
      return;
    }
    try {
      const res = await fetch(apiUrl("/api/auth/change-password"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterRole: currentUser?.role,
          username: passwordForm.username,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (passwordForm.username === 'admin') {
          localStorage.setItem("madrasortho_admin_password", passwordForm.newPassword);
        } else if (passwordForm.username === 'employee') {
          localStorage.setItem("madrasortho_employee_password", passwordForm.newPassword);
        }
        showToast(`Password for ${passwordForm.username} updated!`, "success");
        setChangePasswordModal(false);
        setPasswordForm({ username: 'admin', currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showToast(data.error || "Failed to update password.", "error");
      }
    } catch (err: any) {
      if (passwordForm.username === 'admin') {
        localStorage.setItem("madrasortho_admin_password", passwordForm.newPassword);
      } else if (passwordForm.username === 'employee') {
        localStorage.setItem("madrasortho_employee_password", passwordForm.newPassword);
      }
      showToast(`Password for ${passwordForm.username} updated locally!`, "success");
      setChangePasswordModal(false);
      setPasswordForm({ username: 'admin', currentPassword: '', newPassword: '', confirmPassword: '' });
    }
  };

  const handleSaveAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfileForm.name || !adminProfileForm.doctorName) {
      showToast("Clinic Name and Doctor Name are required fields.", "error");
      return;
    }

    const updated: ClinicBranding = {
      ...bakeryDetails,
      ...adminProfileForm
    };

    setBakeryDetails(updated);
    localStorage.setItem("madrasortho_clinic_branding", JSON.stringify(updated));

    try {
      const res = await fetch(apiUrl("/api/clinic/details"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        showToast("Doctor profile & clinic licensure updated successfully!", "success");
      } else {
        showToast("Clinic details updated and saved on device.", "success");
      }
    } catch (err) {
      // Offline / mobile app
      showToast("Clinic details updated and saved locally.", "success");
    }

    setShowAdminProfileModal(false);
  };

  const syncClinicDetailsToServer = async (details: ClinicBranding) => {
    if (currentUser?.role !== 'admin') return;
    try {
      await fetch(apiUrl("/api/clinic/details"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(details)
      });
    } catch (err) {
      console.warn("Failed to sync clinic details to server:", err);
    }
  };

  // Custom confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info';
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: () => { },
  });

  const showConfirm = (options: {
    title: string;
    message: string;
    type?: 'danger' | 'warning' | 'info';
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
  }) => {
    setConfirmDialog({
      isOpen: true,
      title: options.title,
      message: options.message,
      type: options.type || 'warning',
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      onConfirm: options.onConfirm,
      onCancel: options.onCancel,
    });
  };

  const closeConfirm = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  // Keyboard shortcuts for confirm dialog
  useEffect(() => {
    if (!confirmDialog.isOpen) return;

    const handleConfirmKeys = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        confirmDialog.onConfirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (confirmDialog.onCancel) confirmDialog.onCancel();
        closeConfirm();
      }
    };

    window.addEventListener('keydown', handleConfirmKeys, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleConfirmKeys, { capture: true });
    };
  }, [confirmDialog.isOpen, confirmDialog.onConfirm, confirmDialog.onCancel]);

  // Search inputs
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSelectedIndex, setSearchSelectedIndex] = useState(0);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Payment calculator
  const [cashReceived, setCashReceived] = useState('');

  // Printer configurations
  const [printers, setPrinters] = useState<any[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState('Default');
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('80mm');
  const [printerInterface, setPrinterInterface] = useState<'usb' | 'wifi' | 'bluetooth'>(() => {
    return (localStorage.getItem("madrasortho_printer_interface") as any) || 'usb';
  });
  const [wifiPrinterIp, setWifiPrinterIp] = useState(() => {
    return localStorage.getItem("madrasortho_wifi_printer_ip") || '192.168.1.100';
  });
  const [wifiPrinterPort, setWifiPrinterPort] = useState(() => {
    return localStorage.getItem("madrasortho_wifi_printer_port") || '9100';
  });
  const [bluetoothDeviceName, setBluetoothDeviceName] = useState<string | null>(() => {
    const dev = getActiveBluetoothDevice();
    return dev ? dev.name : null;
  });
  const [isConnectingBluetooth, setIsConnectingBluetooth] = useState(false);

  useEffect(() => {
    localStorage.setItem("madrasortho_printer_interface", printerInterface);
  }, [printerInterface]);

  useEffect(() => {
    localStorage.setItem("madrasortho_wifi_printer_ip", wifiPrinterIp);
  }, [wifiPrinterIp]);

  useEffect(() => {
    localStorage.setItem("madrasortho_wifi_printer_port", wifiPrinterPort);
  }, [wifiPrinterPort]);

  const [bakeryDetails, setBakeryDetails] = useState<ClinicBranding>(() => {
    const saved = localStorage.getItem("madrasortho_clinic_branding");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          city: parsed.city || "Chennai",
          state: parsed.state || "Tamil Nadu",
          pincode: parsed.pincode || "600002",
          email: parsed.email || "contact@madrasortho.in",
          ceaNo: parsed.ceaNo || "TN-CEA/2021/04912",
          dlNo21: parsed.dlNo21 || "21B/TN/CHE/00482",
          doctorName: parsed.doctorName || "Dr. Arjun Sharma, MS (Ortho)",
          doctorDegrees: parsed.doctorDegrees || "MBBS, MS (Orthopaedics), MCh (Ortho)",
          doctorRegNo: parsed.doctorRegNo || "TNMC/2012/94821",
          doctorCouncil: parsed.doctorCouncil || "Tamil Nadu Medical Council",
          doctorSpecialty: parsed.doctorSpecialty || "Consultant Orthopaedic & Trauma Surgeon",
          doctorPhone: parsed.doctorPhone || "+91 98401 22334",
          doctorEmail: parsed.doctorEmail || "dr.arjun@madrasortho.in",
          pharmacistName: parsed.pharmacistName || "Priya Nair, B.Pharm",
          pharmacistRegNo: parsed.pharmacistRegNo || "TNSPC/2018/48912",
          stateCouncil: parsed.stateCouncil || "Tamil Nadu State Pharmacy Council",
          adminUsername: parsed.adminUsername || "admin"
        };
      } catch (e) {
        // fallback
      }
    }
    return {
      name: "MADRAS ORTHO CLINIC & PHARMACY",
      description: "Center for Orthopaedic Surgery & Trauma Care",
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
      doctorName: "Dr. Arjun Sharma, MS (Ortho)",
      doctorDegrees: "MBBS, MS (Orthopaedics), MCh (Ortho)",
      doctorRegNo: "TNMC/2012/94821",
      doctorCouncil: "Tamil Nadu Medical Council",
      doctorSpecialty: "Consultant Orthopaedic & Trauma Surgeon",
      doctorPhone: "+91 98401 22334",
      doctorEmail: "dr.arjun@madrasortho.in",
      pharmacistName: "Priya Nair, B.Pharm",
      pharmacistRegNo: "TNSPC/2018/48912",
      stateCouncil: "Tamil Nadu State Pharmacy Council",
      adminUsername: "admin"
    };
  });

  useEffect(() => {
    localStorage.setItem("madrasortho_clinic_branding", JSON.stringify(bakeryDetails));
  }, [bakeryDetails]);

  // Patient Database & Disambiguation States
  const [showPatientsModal, setShowPatientsModal] = useState(false);
  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [selectedPatientObj, setSelectedPatientObj] = useState<any | null>(null);
  const [patientAllergyAlert, setPatientAllergyAlert] = useState<string | null>(null);

  // Real-Time Inventory & Expiration Notifications
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [notificationsData, setNotificationsData] = useState<NotificationsData>({
    summary: { totalAlerts: 0, expiredCount: 0, expiringSoonCount: 0, outOfStockCount: 0, lowStockCount: 0, updatedAt: '' },
    expired: [],
    expiringSoon: [],
    outOfStock: [],
    lowStock: []
  });

  const fetchNotifications = async () => {
    try {
      const res = await fetch(apiUrl('/api/notifications'));
      if (res.ok) {
        const data = await res.json();
        setNotificationsData(data);
      }
    } catch (err) {
      console.error('[NOTIFICATIONS] Fetch error:', err);
    }
  };

  // Prescribing Doctor Database & Dropdown States
  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState('');
  const [selectedDoctorObj, setSelectedDoctorObj] = useState<any | null>(null);

  // History Mode Filter (Mode A vs Mode B Separation)
  const [historyModeFilter, setHistoryModeFilter] = useState<'ALL' | 'CLINIC_DISPENSING' | 'RETAIL_PHARMACY'>('ALL');

  // Dual Operating Mode: Mode A (Clinic Dispensing) vs Mode B (Retail Pharmacy)
  const [operatingMode, setOperatingMode] = useState<'CLINIC_DISPENSING' | 'RETAIL_PHARMACY'>(() => {
    return (localStorage.getItem("madrasortho_operating_mode") as any) || 'RETAIL_PHARMACY';
  });
  const [clinicPatientId, setClinicPatientId] = useState('MOC-2026-0042');
  const [dispensingMode, setDispensingMode] = useState<'Attached Pharmacist' | 'Doctor Direct Dispensing' | 'Doctor Direct Supervision'>('Attached Pharmacist');

  // Clinical Decision Support (CDS) Alerts
  const [clinicalAlerts, setClinicalAlerts] = useState<{ hasCritical: boolean; hasWarning: boolean; alerts: any[]; critical: any[]; warnings: any[] }>({
    hasCritical: false,
    hasWarning: false,
    alerts: [],
    critical: [],
    warnings: []
  });
  const [_isCheckingInteractions, setIsCheckingInteractions] = useState(false);
  const [cdsOverrideReason, setCdsOverrideReason] = useState('');

  // Checkout Patient & Prescriber Form States
  const [checkoutPatientName, setCheckoutPatientName] = useState('Walk-in Patient');
  const [checkoutPatientAge, setCheckoutPatientAge] = useState('');
  const [checkoutPatientGender, setCheckoutPatientGender] = useState('Male');
  const [checkoutPatientPhone, setCheckoutPatientPhone] = useState('');
  const [checkoutPatientAddress, setCheckoutPatientAddress] = useState('');
  const [checkoutDoctorName, setCheckoutDoctorName] = useState('Dr. Arjun Sharma, MS (Ortho)');
  const [checkoutDoctorRegNo, setCheckoutDoctorRegNo] = useState('TNMC/2012/94821');
  const [checkoutPharmacistName, setCheckoutPharmacistName] = useState('Priya Nair, B.Pharm');
  const [checkoutPharmacistRegNo, setCheckoutPharmacistRegNo] = useState('TNSPC/2018/48912');

  // Statutory Cancellation Modal (Credit Note)
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [billToCancel, setBillToCancel] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState('Patient returned medicine unopened / entry error');

  // Mobile navigation active tab ('menu', 'ticket', 'queue')
  const [mobileTab, setMobileTab] = useState<'menu' | 'ticket' | 'queue'>('menu');

  // Admin Product Form
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [crudSearch, setCrudSearch] = useState('');

  // Analytics report states
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportMonth, setReportMonth] = useState(() => new Date().toISOString().substring(0, 7));
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Previous bills history states
  const [activeTab, setActiveTab] = useState<'analytics' | 'history'>('analytics');
  const [historyBills, setHistoryBills] = useState<any[]>([]);
  const [selectedBill, setSelectedBill] = useState<any | null>(null);
  const [selectedBillItems, setSelectedBillItems] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Status banners / Toasts
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Refs for element focusing
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const paymentCashInputRef = useRef<HTMLInputElement>(null);

  // ----------------------------------------------------
  // INITIALIZERS
  // ----------------------------------------------------

  // Fetch custom categories created by admin
  const fetchCustomCategories = async (): Promise<string[]> => {
    try {
      const res = await fetch(apiUrl("/api/categories"));
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          return data.map((c: any) => c.name || c);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch custom categories:", e);
    }
    return [];
  };

  const handleCreateCategory = async (name: string) => {
    if (!name.trim()) return;
    const catName = name.trim();
    try {
      const res = await fetch(apiUrl("/api/categories"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: catName })
      });
      if (res.ok) {
        showToast(`Category "${catName}" created successfully`, "success");
        // Prepend new category to the beginning of the list so it appears FIRST
        setCategories(prev => Array.from(new Set([catName, ...prev])));
        setSelectedCategory(catName);
        if (editingProduct) {
          setEditingProduct(prev => {
            if (!prev) return prev;
            const existing = (prev.category || '').split(',').map(s => s.trim()).filter(Boolean);
            const merged = Array.from(new Set([...existing, catName]));
            return { ...prev, category: merged.join(', ') };
          });
        }
        setShowAddCategoryModal(false);
        setNewCategoryName('');
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to create category", "error");
      }
    } catch (e) {
      showToast("Error creating category", "error");
    }
  };

  // Fetch inward stock intake audit records
  const fetchInwardRecords = async () => {
    try {
      const res = await fetch(apiUrl("/api/inventory/inward"));
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setInwardRecords(data);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch inward records:", e);
    }
  };

  const handleSetDiscount = (percent: number) => {
    try {
      localStorage.setItem('moc_persistent_discount', String(percent));
    } catch { }
    setPersistentDiscount(percent);
    setSessions(prev => prev.map(s => {
      if (s.id !== activeSessionId) return s;
      return { ...s, discountPercent: percent, discountAmount: 0 };
    }));
  };

  const handleAddInwardRow = () => {
    setInwardConsignment(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: 'inw-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          product_id: 0,
          product_name: '',
          batch_number: '',
          quantity: 0,
          expiry_date: '',
          purchase_price: 0,
          mrp: 0,
          selling_price: 0
        }
      ]
    }));
  };

  const handleRemoveInwardRow = (id: string) => {
    setInwardConsignment(prev => {
      if (prev.items.length <= 1) return prev;
      return {
        ...prev,
        items: prev.items.filter(it => it.id !== id)
      };
    });
  };

  const handleUpdateInwardRow = (id: string, field: string, val: any) => {
    setInwardConsignment(prev => ({
      ...prev,
      items: prev.items.map(it => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: val };
        if (field === 'product_name') {
          const match = products.find(p => p.name.toLowerCase() === String(val).toLowerCase());
          if (match) {
            updated.product_id = match.id;
            if (!updated.mrp || updated.mrp === 0) updated.mrp = match.mrp || match.price || 0;
            if (!updated.selling_price || updated.selling_price === 0) updated.selling_price = match.price || 0;
            if (!updated.purchase_price || updated.purchase_price === 0) updated.purchase_price = match.purchase_price || +(match.price * 0.7).toFixed(2);
          }
        }
        return updated;
      })
    }));
  };

  const handleRecordInwardStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inwardConsignment.items || inwardConsignment.items.length === 0) {
      showToast("Please add at least one medicine to this inward stock consignment.", "error");
      return;
    }

    for (let i = 0; i < inwardConsignment.items.length; i++) {
      const it = inwardConsignment.items[i];
      if (!it.product_name.trim() && it.product_id <= 0) {
        showToast(`Item #${i + 1}: Medicine name is required.`, "error");
        return;
      }
      if (!it.batch_number.trim()) {
        showToast(`Item #${i + 1} (${it.product_name || 'Medicine'}): Batch number is required.`, "error");
        return;
      }
      if (!it.quantity || it.quantity <= 0) {
        showToast(`Item #${i + 1} (${it.product_name || 'Medicine'}): Quantity must be greater than zero.`, "error");
        return;
      }
      if (!it.expiry_date) {
        showToast(`Item #${i + 1} (${it.product_name || 'Medicine'}): Expiry date is required under Rule 65.`, "error");
        return;
      }
    }

    setSavingInward(true);
    try {
      const payload = {
        supplier_name: inwardConsignment.supplier_name.trim() || 'Direct Wholesale',
        invoice_number: inwardConsignment.invoice_number.trim() || `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
        received_date: inwardConsignment.received_date,
        received_by: currentUser?.name || 'Admin',
        notes: inwardConsignment.notes.trim(),
        items: inwardConsignment.items.map(it => ({
          product_id: it.product_id,
          product_name: it.product_name.trim(),
          batch_number: it.batch_number.trim(),
          quantity: Number(it.quantity),
          expiry_date: it.expiry_date,
          purchase_price: Number(it.purchase_price || 0),
          mrp: Number(it.mrp || 0),
          selling_price: Number(it.selling_price || it.mrp || 0)
        }))
      };

      const res = await fetch(apiUrl("/api/inventory/inward"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to record inward stock consignment.");
      }

      const result = await res.json();
      showToast(result.message || `Inward consignment saved: ${payload.items.length} medicines logged!`, "success");

      setInwardConsignment({
        supplier_name: '',
        invoice_number: '',
        received_date: new Date().toISOString().split('T')[0],
        notes: '',
        items: [
          {
            id: 'inw-' + Date.now(),
            product_id: 0,
            product_name: '',
            batch_number: '',
            quantity: 0,
            expiry_date: '',
            purchase_price: 0,
            mrp: 0,
            selling_price: 0
          }
        ]
      });

      fetchInwardRecords();
      loadProducts();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSavingInward(false);
    }
  };

  // Fetch initial products and merge custom categories
  const loadProducts = async () => {
    try {
      const [res, customCats] = await Promise.all([
        fetch(apiUrl("/api/products")),
        fetchCustomCategories()
      ]);
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
        // Unique non-empty categories including custom clinic categories
        // New custom categories appear FIRST so admin can easily select them
        const customCatNames: string[] = (customCats || []).map((c: any) => typeof c === 'string' ? c : c.name).filter(Boolean);
        const prodCatsSet = new Set<string>();
        data.forEach((p: Product) => {
          if (p.category) {
            p.category.split(',').forEach(c => {
              const trimmed = c.trim();
              if (trimmed) prodCatsSet.add(trimmed);
            });
          }
        });
        const prodCats: string[] = Array.from(prodCatsSet);
        const remainingProdCats = prodCats.filter((c: string) => !customCatNames.includes(c));
        const mergedCats: string[] = [...customCatNames, ...remainingProdCats];
        setCategories(mergedCats);
      }
    } catch (err) {
      showToast("Failed to load products from server. Make sure server is running.", "error");
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await fetch(apiUrl("/api/patients"));
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setPatientsList(data);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch patients list:", e);
    }
  };

  const selectDoctorInCheckout = (doc: any) => {
    setSelectedDoctorObj(doc);
    setCheckoutDoctorName(doc.name);
    setCheckoutDoctorRegNo(doc.reg_no);
    setDoctorSearchQuery(`${doc.name} (${doc.reg_no})`);
    setIsDoctorDropdownOpen(false);
  };

  const selectPatientInCheckout = (p: any) => {
    setSelectedPatientObj(p);
    setClinicPatientId(p.patient_id);
    setCheckoutPatientName(p.name);
    setCheckoutPatientAge(p.age ? String(p.age) : '');
    setCheckoutPatientGender(p.gender || 'Male');
    setCheckoutPatientPhone(p.phone || '');
    if (p.address) {
      setCheckoutPatientAddress(p.city ? `${p.address}, ${p.city}` : p.address);
    }
    setPatientSearchQuery(`${p.name} (${p.patient_id})`);
    setIsPatientDropdownOpen(false);

    // Cross-autofill attending doctor if recorded on patient profile
    if (p.attending_doctor) {
      setCheckoutDoctorName(p.attending_doctor);
      const matchedClinicDoc = CLINIC_DOCTORS.find(d =>
        p.attending_doctor.toLowerCase().includes(d.name.toLowerCase().split(',')[0]) ||
        d.name.toLowerCase().includes(p.attending_doctor.toLowerCase().split(',')[0])
      );
      if (matchedClinicDoc) {
        setCheckoutDoctorRegNo(matchedClinicDoc.reg_no);
        setSelectedDoctorObj(matchedClinicDoc);
        setDoctorSearchQuery(`${matchedClinicDoc.name} (${matchedClinicDoc.reg_no})`);
      } else if (p.attending_doctor.toLowerCase().includes('arjun')) {
        setCheckoutDoctorRegNo('TNMC/2012/94821');
        setDoctorSearchQuery(`${p.attending_doctor} (TNMC/2012/94821)`);
      }
    }

    // Check allergy conflict against active cart items
    if (p.known_allergies && p.known_allergies.toLowerCase() !== 'none reported' && p.known_allergies.trim() !== '') {
      const allergyKeywords = p.known_allergies.toLowerCase().split(/[,; ]+/).filter((w: string) => w.length > 3);
      const cartNames = (activeSession?.items || []).map(it => (((it as any).product_name || (it as any).name || '') + ' ' + (it.generic_name || '')).toLowerCase()).join(' ');
      const matched = allergyKeywords.filter((kw: string) => cartNames.includes(kw));
      if (matched.length > 0) {
        setPatientAllergyAlert(`⚠️ ALLERGY CONTRAINDICATION ALERT: Patient has recorded allergy to "${matched.join(', ')}". Check cart medicines immediately!`);
      } else {
        setPatientAllergyAlert(null);
      }
    } else {
      setPatientAllergyAlert(null);
    }
  };





  const loadEmployees = async () => {
    try {
      const res = await fetch(apiUrl("/api/employees"));
      const data = await res.json();
      if (Array.isArray(data)) {
        setEmployees(data);
      }
    } catch (err) {
      showToast("Failed to load employees from server. Make sure server is running.", "error");
    }
  };

  // Fetch system printers on Electron boot
  useEffect(() => {
    electronAPI.getPrinters().then((list: any[]) => {
      setPrinters(list);
      const def = list.find((p: any) => p.isDefault);
      if (def) setSelectedPrinter(def.name);
    }).catch(() => { });
  }, []);

  // Load clinical data ONLY after this device/tab has authenticated
  useEffect(() => {
    if (!currentUser || !getAuthToken()) return;

    loadProducts();
    loadEmployees();
    fetchPatients();

    // Fetch and sync clinic & doctor branding details
    fetch(apiUrl("/api/clinic/details"))
      .then(res => res.json())
      .then(data => {
        if (data && data.name) {
          setBakeryDetails(prev => ({ ...prev, ...data }));
        }
      })
      .catch(() => { });

    // Restore sessions from localStorage, with daily auto-reset and conflict resolution
    const restoreSessions = async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const storedDate = localStorage.getItem('madrasortho_pos_bill_date');
      const saved = localStorage.getItem("madrasortho_pos_sessions");

      // Auto-reset: if sessions were saved on a previous day, start fresh
      if (storedDate && storedDate !== todayStr) {
        localStorage.removeItem('madrasortho_pos_sessions');
        localStorage.removeItem('madrasortho_pos_active_session');
        localStorage.removeItem('madrasortho_pos_last_bill_num');
        localStorage.removeItem('madrasortho_pos_bill_date');
        createNewBill();
        return;
      }

      let restored: BillingSession[] = [];
      if (saved) {
        try {
          restored = JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }

      if (restored.length > 0) {
        try {
          const res = await fetch(apiUrl("/api/bills/next-number"));
          const data = await res.json();
          const dbNextNum = data.nextBillNumber || 1;

          // Resolve any bill numbers conflicting with already-finalized bills
          const finalSessions: BillingSession[] = [];
          restored.forEach(s => {
            let num = s.billNumber;
            while (num < dbNextNum || finalSessions.some(fs => fs.billNumber === num)) {
              num++;
            }
            finalSessions.push({ ...s, billNumber: num });
          });

          const maxAssigned = Math.max(...finalSessions.map(s => s.billNumber));
          localStorage.setItem('madrasortho_pos_last_bill_num', String(maxAssigned));
          localStorage.setItem('madrasortho_pos_bill_date', todayStr);

          setSessions(finalSessions);
          const activeId = localStorage.getItem("madrasortho_pos_active_session");
          setActiveSessionId(
            activeId && finalSessions.some(fs => fs.id === activeId)
              ? activeId
              : finalSessions[0].id
          );
        } catch (err) {
          console.warn("Could not check conflicts with server on startup. Restoring as saved.", err);
          setSessions(restored);
          const activeId = localStorage.getItem("madrasortho_pos_active_session");
          setActiveSessionId(activeId || restored[0].id);
        }
      } else {
        createNewBill();
      }
    };

    restoreSessions();
  }, [currentUser]);

  // Real-Time SSE Listener & Multi-Device Inventory Sync (Authenticated Only)
  useEffect(() => {
    if (!currentUser || !getAuthToken()) return;

    fetchNotifications();

    let eventSource: EventSource | null = null;
    let reconnectTimer: any = null;

    const connectSSE = () => {
      if (!getAuthToken()) return;
      try {
        const eventsUrl = authApiUrl('/api/events');
        eventSource = new EventSource(eventsUrl);

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'HEARTBEAT') return;

            console.log('[REALTIME EVENT RECEIVED]', data);

            if (data.type === 'INVENTORY_CHANGED' || data.type === 'STOCK_OUT' || data.type === 'CATALOGUE_CHANGED') {
              loadProducts();
              fetchNotifications();
            }

            if (data.type === 'CLINIC_DETAILS_UPDATED') {
              if (data.data) {
                setBakeryDetails(prev => ({ ...prev, ...data.data }));
                localStorage.setItem("madrasortho_clinic_branding", JSON.stringify(data.data));
              } else {
                fetch(apiUrl("/api/clinic/details")).then(r => r.json()).then(d => {
                  setBakeryDetails(prev => ({ ...prev, ...d }));
                  localStorage.setItem("madrasortho_clinic_branding", JSON.stringify(d));
                }).catch(() => { });
              }
              showToast("Clinic settings & licensure updated in real time across devices.", "info");
            }

            if (data.type === 'STOCK_OUT') {
              showToast(data.message || '⚠️ Medicine reached 0 stock!', 'info');
            }
          } catch (e) {
            console.error('Failed to parse realtime event:', e);
          }
        };

        eventSource.onerror = async () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          if (!getAuthToken()) return;
          try {
            const checkRes = await fetch(apiUrl('/api/auth/session'));
            if (checkRes.status === 401 || !getAuthToken()) return;
          } catch { }
          if (!reconnectTimer && getAuthToken()) {
            reconnectTimer = setTimeout(() => {
              reconnectTimer = null;
              connectSSE();
            }, 5000);
          }
        };
      } catch (err) {
        if (!reconnectTimer) {
          reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            connectSSE();
          }, 5000);
        }
      }
    };

    connectSSE();

    // Fallback periodic poll every 60s
    const pollInterval = setInterval(() => {
      fetchNotifications();
    }, 60000);

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      clearInterval(pollInterval);
    };
  }, [currentUser]);

  // Sync sessions with localStorage
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("madrasortho_pos_sessions", JSON.stringify(sessions));
      localStorage.setItem("madrasortho_pos_active_session", activeSessionId);
    }
  }, [sessions, activeSessionId]);

  // Toast timer auto-close
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Get active session helper
  const activeSession = useMemo(() => {
    return sessions.find(s => s.id === activeSessionId) || null;
  }, [sessions, activeSessionId]);

  // Real-time Clinical Decision Support (CDS) Interaction Check
  useEffect(() => {
    if (!activeSession || !activeSession.items || activeSession.items.length === 0) {
      setClinicalAlerts({ hasCritical: false, hasWarning: false, alerts: [], critical: [], warnings: [] });
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setIsCheckingInteractions(true);
        const res = await fetch(apiUrl("/api/clinical/check-interactions"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: activeSession.items.map(it => ({
              product_name: it.product_name,
              generic_name: it.generic_name || it.product_name,
              dosage: it.schedule || ''
            }))
          })
        });
        if (res.ok) {
          const data = await res.json();
          setClinicalAlerts(data);
        }
      } catch (err) {
        console.error("CDS check failed:", err);
      } finally {
        setIsCheckingInteractions(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [activeSession?.items]);



  // Subtotals calculations for active bill — GST per Indian pharma standards
  const billSummary = useMemo(() => {
    if (!activeSession) {
      return {
        subtotal: 0,
        discount: 0,
        tax: 0,
        cgst: 0,
        sgst: 0,
        grandTotal: 0
      };
    }

    // Subtotal: prices in DB are EXCLUSIVE of GST (MRP base price), rounded to strict 2 decimals (paise precision)
    const subtotal = round2(activeSession.items.reduce((sum, item) => sum + round2(item.total), 0));

    let discount = 0;
    if (activeSession.discountPercent > 0) {
      discount = round2((subtotal * activeSession.discountPercent) / 100);
    } else if (activeSession.discountAmount > 0) {
      discount = round2(Math.min(subtotal, activeSession.discountAmount));
    }

    // GST = sum of (item.total * item.tax_percent / 100) — per-item GST under TNGST/CGST rules
    const gstTotal = activeSession.items.reduce((sum, item) => {
      return sum + (round2(item.total) * (Number(item.tax_percent || 0) / 100));
    }, 0);
    // Discount reduces the taxable base proportionally
    const discountRatio = subtotal > 0 ? discount / subtotal : 0;
    const tax = round2(gstTotal * (1 - discountRatio));
    const cgst = round2(tax / 2);
    const sgst = round2(tax - cgst);
    const grandTotal = Math.max(0, round2(subtotal - discount + tax));

    return {
      subtotal,
      discount,
      tax,
      cgst,
      sgst,
      grandTotal
    };
  }, [activeSession]);

  // Payment modal keyboard shortcuts: C = Cash, G = Google Pay, K = (Bank) Card
  useEffect(() => {
    if (!showPaymentModal) return;

    const handlePaymentKey = (e: KeyboardEvent) => {
      // Don't fire if user is typing in the cash-received input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const key = e.key.toLowerCase();
      if (key === 'c') {
        e.preventDefault();
        completeBilling('Cash');
      } else if (key === 'g') {
        e.preventDefault();
        completeBilling('Google Pay');
      } else if (key === 'k') {
        e.preventDefault();
        completeBilling('Bank Card');
      }
    };

    window.addEventListener('keydown', handlePaymentKey);
    return () => window.removeEventListener('keydown', handlePaymentKey);
  }, [showPaymentModal]);

  // ----------------------------------------------------
  // BILLING ACTION ENGINES
  // ----------------------------------------------------

  // Helper: compute the next unique bill number across all sources
  const getNextBillNumber = (currentSessions: BillingSession[], dbNextNum: number): number => {
    const todayStr = new Date().toISOString().split('T')[0];

    const storedDate = localStorage.getItem('madrasortho_pos_bill_date');
    if (storedDate !== todayStr) {
      localStorage.removeItem('madrasortho_pos_last_bill_num');
      localStorage.setItem('madrasortho_pos_bill_date', todayStr);
    }

    const storedLast = parseInt(localStorage.getItem('madrasortho_pos_last_bill_num') || '0', 10);
    let candidate = Math.max(dbNextNum, storedLast + 1);
    while (currentSessions.some(s => s.billNumber === candidate)) {
      candidate++;
    }
    return candidate;
  };

  const createNewBill = async () => {
    try {
      // Get next consecutive bill number from server (scoped to today)
      const res = await fetch(apiUrl("/api/bills/next-number"));
      const data = await res.json();
      const dbNextNum = data.nextBillNumber || 1;

      const newId = Date.now().toString();
      setSessions(prev => {
        const billNum = getNextBillNumber(prev, dbNextNum);
        return [...prev, {
          id: newId,
          billNumber: billNum,
          items: [],
          discountPercent: persistentDiscount,
          discountAmount: 0,
          paymentMethod: null,
          holdStatus: false,
          selectedItemIndex: -1,
          cashierName: "Cashier A"
        }];
      });
      setActiveSessionId(newId);
      setSearchQuery('');

      // Auto-focus barcode/search input
      setTimeout(() => barcodeInputRef.current?.focus(), 50);
    } catch (err) {
      showToast("Error connecting to server. Local fallback bill number used.", "info");
      // Full local fallback (no server)
      const newId = Date.now().toString();
      setSessions(prev => {
        const billNum = getNextBillNumber(prev, 1);
        return [...prev, {
          id: newId,
          billNumber: billNum,
          items: [],
          discountPercent: persistentDiscount,
          discountAmount: 0,
          paymentMethod: null,
          holdStatus: false,
          selectedItemIndex: -1,
          cashierName: currentUser?.name || "Pharmacist"
        }];
      });
      setActiveSessionId(newId);
    }
  };

  const closeSession = (sessionId: string) => {
    if (sessions.length <= 1) {
      showToast("Must have at least one active billing tab.", "info");
      return;
    }
    const idx = sessions.findIndex(s => s.id === sessionId);
    const updated = sessions.filter(s => s.id !== sessionId);
    setSessions(updated);

    // Set next active session
    if (activeSessionId === sessionId) {
      const nextActive = updated[Math.max(0, idx - 1)];
      setActiveSessionId(nextActive.id);
    }
    showToast("Bill session closed.", "info");
  };

  const addItemToBill = (product: Product, quantity = 1) => {
    const todayStr = new Date().toISOString().split('T')[0];

    // Intelligent Guardrail 1: Check Expiry Date
    const isExpired = Boolean(
      product.status === 'Expired' ||
      product.is_expired ||
      (product.expiry_date && String(product.expiry_date).substring(0, 10) <= todayStr)
    );
    if (isExpired) {
      showToast(`PROHIBITED: ${product.name} has EXPIRED on ${product.expiry_date || 'N/A'}. Dispensing expired drugs is illegal and strictly prohibited.`, "error");
      return;
    }

    // Intelligent Guardrail 2: Check Stock Availability
    const availStock = product.available_stock !== undefined ? product.available_stock : (product.status === 'Out of Stock' ? 0 : 9999);
    const isOutOfStock = Boolean(
      product.status === 'Out of Stock' ||
      product.is_out_of_stock ||
      availStock <= 0
    );
    if (isOutOfStock) {
      showToast(`PROHIBITED: ${product.name} is OUT OF STOCK. Cannot be billed.`, "error");
      return;
    }

    // Ensure an active session exists
    if (!activeSession) {
      // Create a new bill and defer adding the item
      createNewBill();
      setTimeout(() => addItemToBill(product, quantity), 200);
      return;
    }

    // Intelligent Guardrail 3: Check quantity against available stock
    const existingIndex = activeSession.items.findIndex(item => item.product_id === product.id);
    const currentQty = existingIndex !== -1 ? activeSession.items[existingIndex].quantity : 0;
    const requestedQty = currentQty + quantity;
    if (requestedQty > availStock) {
      showToast(`Cannot exceed available stock (${availStock} units available for ${product.name}).`, "error");
      return;
    }

    setSessions(prev => prev.map(s => {
      if (s.id !== activeSessionId) return s;
      const updatedItems = [...s.items];
      if (existingIndex !== -1) {
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          quantity: requestedQty,
          total: round2(requestedQty * product.price),
        };
      } else {
        updatedItems.push({
          product_id: product.id,
          product_name: product.name,
          generic_name: product.generic_name || product.name,
          quantity: quantity,
          rate: round2(product.price), // Price sold at
          mrp: round2(product.mrp || product.price),
          purchase_price: round2(product.purchase_price || 0),
          tax_percent: product.tax_percent || 0,
          total: round2(quantity * product.price),
          batch_number: product.batch_number || `B-2026-${String(product.id).padStart(4, '0')}`,
          expiry_date: product.expiry_date || '2028-12-31',
          hsn_code: product.hsn_code || '30049099',
          schedule: product.schedule || 'Schedule H',
          dosage_instructions: product.dosage_form || 'Tablet'
        });
      }
      return {
        ...s,
        items: updatedItems,
        selectedItemIndex: existingIndex !== -1 ? existingIndex : updatedItems.length - 1,
      };
    }));
    if (product.schedule === 'Schedule H1' || product.schedule === 'NDPS' || product.schedule === 'Schedule H') {
      showToast(`${product.name} [${product.schedule}] added. Doctor Rx details required.`, "info");
    } else {
      showToast(`${product.name} added.`, "success");
    }
    setTimeout(() => barcodeInputRef.current?.focus(), 20);
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    if (!activeSession || quantity <= 0) return;
    const item = activeSession.items[index];
    const prod = products.find(p => p.id === item.product_id);
    const availStock = prod?.available_stock !== undefined ? prod.available_stock : 9999;
    if (quantity > availStock) {
      showToast(`Cannot exceed available stock (${availStock} units available for ${item.product_name}).`, "error");
      return;
    }
    setSessions(prev => prev.map(s => {
      if (s.id !== activeSessionId) return s;
      const updated = [...s.items];
      updated[index] = {
        ...updated[index],
        quantity,
        total: round2(quantity * updated[index].rate)
      };
      return { ...s, items: updated };
    }));
  };

  const deleteItemFromBill = (index: number) => {
    if (!activeSession) return;
    const item = activeSession.items[index];

    // Log item deletion to Audit History API
    fetch(apiUrl("/api/deleted-items"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bill_id: activeSession.billNumber,
        product_name: item.product_name,
        quantity: item.quantity
      })
    }).catch(err => console.error("Loss prevention audit post failed:", err));

    setSessions(prev => prev.map(s => {
      if (s.id !== activeSessionId) return s;
      const updated = s.items.filter((_, idx) => idx !== index);
      return {
        ...s,
        items: updated,
        selectedItemIndex: updated.length > 0 ? Math.min(s.selectedItemIndex, updated.length - 1) : -1
      };
    }));
    showToast(`Removed ${item.product_name}.`, "info");
  };

  const toggleHold = () => {
    if (!activeSession) return;
    setSessions(prev => prev.map(s => {
      if (s.id !== activeSessionId) return s;
      return { ...s, holdStatus: !s.holdStatus };
    }));
    showToast(activeSession.holdStatus ? "Bill resumed." : "Bill placed on Hold.", "info");
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    // If dropdown is showing and an item is highlighted, add it
    if (isSearchFocused && filteredSearchProducts.length > 0) {
      const selected = filteredSearchProducts[searchSelectedIndex] || filteredSearchProducts[0];
      if (selected) {
        addItemToBill(selected, 1);
        setSearchQuery('');
        setIsSearchFocused(false);
        setSearchSelectedIndex(0);
        return;
      }
    }

    // Check exact barcode match
    const match = products.find(p => p.barcode === query && p.status === 'Available');
    if (match) {
      addItemToBill(match, 1);
      setSearchQuery('');
      return;
    }

    // If only one fuzzy result exists, add it directly
    if (filteredSearchProducts.length === 1) {
      addItemToBill(filteredSearchProducts[0], 1);
      setSearchQuery('');
      setIsSearchFocused(false);
      setSearchSelectedIndex(0);
    }
  };

  // Smart Search indexing algorithm — only show Available products in dropdown
  const filteredSearchProducts = useMemo(() => {
    if (!searchQuery) return [];

    const rawTokens = searchQuery.toLowerCase().trim().split(/\s+/);

    // Expand baker abbreviations (e.g. blk -> black, chk -> chicken)
    const tokens = rawTokens.map(token => {
      if (token === 'blk') return 'black';
      if (token === 'chk') return 'chicken';
      if (token === 'wht') return 'white';
      if (token === 'brn') return 'brown';
      return token;
    });

    return products.filter(p => {
      if (p.status !== 'Available') return false;
      const name = p.name.toLowerCase();
      const cat = p.category.toLowerCase();
      const sku = (p.sku || '').toLowerCase();
      const barcode = (p.barcode || '').toLowerCase();

      return tokens.every(token =>
        name.includes(token) ||
        cat.includes(token) ||
        sku.includes(token) ||
        barcode.includes(token)
      );
    }).sort((a, b) => {
      const aInStock = (a.available_stock ?? 0) > 0 ? 1 : 0;
      const bInStock = (b.available_stock ?? 0) > 0 ? 1 : 0;
      if (aInStock !== bInStock) return bInStock - aInStock;
      return (b.available_stock ?? 0) - (a.available_stock ?? 0) || a.name.localeCompare(b.name);
    }).slice(0, 10); // cap to 10 suggestions for performance
  }, [searchQuery, products]);

  // Keyboard navigation handler for the inline search dropdown
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const hasDropdown = isSearchFocused && filteredSearchProducts.length > 0;

    if (e.key === 'ArrowDown') {
      if (hasDropdown) {
        e.preventDefault();
        setSearchSelectedIndex(prev => Math.min(prev + 1, filteredSearchProducts.length - 1));
      }
      return;
    }
    if (e.key === 'ArrowUp') {
      if (hasDropdown) {
        e.preventDefault();
        setSearchSelectedIndex(prev => Math.max(prev - 1, 0));
      }
      return;
    }
    if (e.key === 'Escape') {
      setSearchQuery('');
      setIsSearchFocused(false);
      setSearchSelectedIndex(0);
      return;
    }
    if (e.key === 'Enter') {
      if (hasDropdown) {
        e.preventDefault();
        const selected = filteredSearchProducts[searchSelectedIndex];
        if (selected) {
          addItemToBill(selected, 1);
          setSearchQuery('');
          setIsSearchFocused(false);
          setSearchSelectedIndex(0);
        }
        return;
      }
      // If no dropdown visible, fall through to form submit (barcode)
    }
  };

  // ----------------------------------------------------
  // UNIFIED THERMAL PRINTER DISPATCHER (USB / WiFi / Bluetooth)
  // ----------------------------------------------------
  const executeReceiptPrint = async (printData: any) => {
    try {
      if (printerInterface === 'bluetooth') {
        const activeDev = getActiveBluetoothDevice();
        if (!activeDev) {
          showToast("Bluetooth printer not connected. Please pair from Settings.", "error");
          // Fallback to browser/system print so invoice receipt is never lost
          electronAPI.printReceipt(printData, selectedPrinter).catch(() => { });
          return;
        }
        await printViaBluetooth(printData);
        showToast(`Receipt sent to Bluetooth printer (${activeDev.name})!`, "success");
      } else if (printerInterface === 'wifi') {
        if (!wifiPrinterIp) {
          showToast("Please enter WiFi Printer IP in Settings.", "error");
          electronAPI.printReceipt(printData, selectedPrinter).catch(() => { });
          return;
        }
        // Direct Electron TCP socket printing or server proxy
        if (isElectron && (electronAPI as any).printNetwork) {
          await (electronAPI as any).printNetwork(wifiPrinterIp, Number(wifiPrinterPort) || 9100, printData);
          showToast(`Receipt sent to WiFi printer (${wifiPrinterIp})!`, "success");
        } else {
          const res = await fetch(apiUrl("/api/print/network"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ host: wifiPrinterIp, port: Number(wifiPrinterPort) || 9100, receiptData: printData })
          });
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "WiFi network print failed.");
          }
          showToast(`Receipt sent to WiFi printer (${wifiPrinterIp})!`, "success");
        }
      } else {
        // USB / Default OS Printer Driver
        await electronAPI.printReceipt(printData, selectedPrinter);
      }
    } catch (err: any) {
      console.error("Printer pipeline error:", err);
      showToast(err.message || "Print failure, check printer connection.", "error");
    }
  };

  const handleConnectBluetooth = async () => {
    if (!isBluetoothSupported()) {
      showToast("Web Bluetooth API is not available on this browser/environment.", "error");
      return;
    }
    setIsConnectingBluetooth(true);
    try {
      const dev = await connectBluetoothPrinter();
      setBluetoothDeviceName(dev.name);
      showToast(`Connected to Bluetooth printer: ${dev.name}`, "success");
    } catch (err: any) {
      console.error("Bluetooth pairing error:", err);
      showToast(err.message || "Bluetooth pairing failed.", "error");
    } finally {
      setIsConnectingBluetooth(false);
    }
  };

  const handleDisconnectBluetooth = async () => {
    try {
      await disconnectBluetoothPrinter();
      setBluetoothDeviceName(null);
      showToast("Bluetooth printer disconnected.", "info");
    } catch (err: any) {
      showToast("Failed to disconnect Bluetooth.", "error");
    }
  };

  const handleTestPrint = async () => {
    const testData = {
      bakeryName: bakeryDetails.name,
      description: bakeryDetails.description || "Mission for Cure",
      address: bakeryDetails.address,
      phone: bakeryDetails.phone,
      gstin: (bakeryDetails as any).gstin || '',
      dlNo: (bakeryDetails as any).dlNo || '',
      billNumber: 9999,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString(),
      cashierName: currentUser?.name || "Pharmacist",
      items: [
        { product_name: "Diclofenac 50mg Tablets (10s)", quantity: 2, rate: 28.50, total: 57.00, tax_percent: 5 },
        { product_name: "Calcium + D3 Tablets (30s)", quantity: 1, rate: 145.00, total: 145.00, tax_percent: 12 }
      ],
      subtotal: 202.00,
      discount: 0,
      tax: 20.25,
      grandTotal: 222.25,
      paymentMethod: "Test Print",
      width: paperWidth
    };
    await executeReceiptPrint(testData);
  };

  // ----------------------------------------------------
  // PAYMENT COMPLETION HANDLERS
  // ----------------------------------------------------

  const completeBilling = async (paymentMethod: 'Cash' | 'Google Pay' | 'Bank Card' | 'Complimentary') => {
    if (!activeSession || activeSession.items.length === 0) {
      showToast("Cannot check out empty ticket.", "error");
      return;
    }

    const isFree = paymentMethod === 'Complimentary' || isComplimentaryCheckout;

    // Map UI payment method labels to server-friendly values (no spaces)
    const methodMap: Record<string, string> = {
      'Cash': 'Cash',
      'Google Pay': 'googlepay',
      'Bank Card': 'bankcard',
      'Complimentary': 'Complimentary'
    };
    const serverPaymentMethod = isFree ? 'Complimentary' : (methodMap[paymentMethod] || paymentMethod);

    // Smart Cash Tender Validation (Integer-Paise Precision per TN/Indian Currency Rules): Cash tendered must be >= payable grand total
    if (paymentMethod === 'Cash' && !isFree) {
      const parsedCash = parseFloat(cashReceived);
      const payableAmt = round2(billSummary.grandTotal);
      const cashAmt = round2(parsedCash);
      if (isNaN(parsedCash) || toPaise(parsedCash) < toPaise(payableAmt)) {
        showToast(`Insufficient Cash Tendered: Total payable is ₹${payableAmt.toFixed(2)}, but received ₹${isNaN(parsedCash) ? '0.00' : cashAmt.toFixed(2)}. Please enter the full amount received from the customer before completing payment.`, "error");
        paymentCashInputRef.current?.focus();
        return;
      }
    }

    // Patient name & details are optional for bill pay and printing
    const patientName = isFree
      ? (complimentaryRecipient.trim() || 'Clinic Doctor / Staff')
      : (activeSession.patientName || checkoutPatientName.trim() || 'Walk-in Patient');
    const doctorName = activeSession.doctorName || checkoutDoctorName.trim() || bakeryDetails.doctorName || 'Dr. Arjun Sharma, MS (Ortho)';
    const doctorRegNo = activeSession.doctorRegNo || checkoutDoctorRegNo.trim() || bakeryDetails.doctorRegNo || 'TNMC/2012/94821';
    const pharmacistName = checkoutPharmacistName.trim() || currentUser?.name || bakeryDetails.pharmacistName || 'Priya Nair, B.Pharm';
    const pharmacistRegNo = checkoutPharmacistRegNo.trim() || (currentUser as any)?.pharmacist_reg_no || bakeryDetails.pharmacistRegNo || 'TNSPC/2018/48912';

    if (clinicalAlerts.critical && clinicalAlerts.critical.length > 0 && !cdsOverrideReason.trim()) {
      showToast("Clinical Decision Support: Critical contraindication/duplicate detected! Clinical Override Rationale is required.", "error");
      return;
    }

    const payload = {
      bill_number: activeSession.billNumber,
      subtotal: isFree ? 0 : round2(billSummary.subtotal),
      discount: isFree ? round2(billSummary.subtotal) : round2(billSummary.discount),
      tax: isFree ? 0 : round2(billSummary.tax),
      grand_total: isFree ? 0 : round2(billSummary.grandTotal),
      payment_method: serverPaymentMethod,
      is_complimentary: isFree ? 1 : 0,
      complimentary_recipient: isFree ? (complimentaryRecipient.trim() || 'Clinic Doctor / Staff') : undefined,
      complimentary_reason: isFree ? (complimentaryReason.trim() || 'Doctor / Staff Health Dispense') : undefined,
      cashier_name: activeSession.cashierName || currentUser?.name || 'Pharmacist',
      operating_mode: operatingMode,
      clinic_patient_id: operatingMode === 'CLINIC_DISPENSING' ? clinicPatientId : undefined,
      dispensing_mode: operatingMode === 'CLINIC_DISPENSING' ? dispensingMode : undefined,
      patient_name: patientName,
      patient_age: activeSession.patientAge || checkoutPatientAge ? Number(checkoutPatientAge) : null,
      patient_gender: activeSession.patientGender || checkoutPatientGender || 'Not Specified',
      patient_phone: activeSession.patientPhone || checkoutPatientPhone || '',
      patient_address: activeSession.patientAddress || 'Chennai, Tamil Nadu',
      doctor_name: doctorName,
      doctor_reg_no: doctorRegNo,
      doctor_clinic: bakeryDetails.name || 'Madras Ortho Clinic',
      pharmacist_name: pharmacistName,
      pharmacist_reg_no: pharmacistRegNo,
      prescription_date: new Date().toISOString().split('T')[0],
      cds_override_reason: cdsOverrideReason || undefined,
      items: activeSession.items
    };

    try {
      // POST invoice to server DB
      const res = await fetch(apiUrl("/api/bills"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        console.error('Invoice save error:', err);
        throw new Error(err.error || "Save invoice failed.");
      }

      const savedBill = await res.json();
      showToast(`Bill #${savedBill.bill_number} finalized!`, "success");

      // Persist the finalized bill number to local storage
      localStorage.setItem('madrasortho_pos_last_bill_num', String(savedBill.bill_number));
      localStorage.setItem('madrasortho_pos_bill_date', savedBill.date);

      // Build thermal printer payload with statutory fields
      const printData = {
        bakeryName: bakeryDetails.name,
        address: bakeryDetails.address,
        phone: bakeryDetails.phone,
        gstin: (bakeryDetails as any).gstin || '',
        dlNo: (bakeryDetails as any).dlNo || '',
        dlNo21: (bakeryDetails as any).dlNo21 || '21B/TN/CHE/00482',
        billNumber: savedBill.bill_number,
        date: savedBill.date,
        time: savedBill.time,
        cashierName: savedBill.cashier_name,
        patientName: savedBill.patient_name,
        patientAge: savedBill.patient_age,
        patientGender: savedBill.patient_gender,
        patientPhone: savedBill.patient_phone,
        doctorName: savedBill.doctor_name,
        doctorRegNo: savedBill.doctor_reg_no,
        pharmacistName: savedBill.pharmacist_name,
        pharmacistRegNo: savedBill.pharmacist_reg_no,
        items: savedBill.items,
        subtotal: savedBill.subtotal,
        discount: savedBill.discount,
        tax: savedBill.tax,
        grandTotal: isFree ? 0 : savedBill.grand_total,
        paymentMethod: isFree ? 'Doctor / Staff Health Dispense (Free)' : savedBill.payment_method,
        width: paperWidth
      };

      // Execute thermal receipt print across active interface (USB, WiFi, or Bluetooth)
      executeReceiptPrint(printData).catch((err: any) => {
        console.error("Printer pipeline error:", err);
      });

      // Clear completed tab & open a new fresh bill tab
      const remains = sessions.filter(s => s.id !== activeSessionId);
      if (remains.length > 0) {
        setSessions(remains);
        setActiveSessionId(remains[0].id);
      } else {
        // If last tab, clear current and rebuild a consecutive one
        setSessions([]);
        createNewBill();
      }

      // Close modals & reset transaction state
      setShowPaymentModal(false);
      setIsComplimentaryCheckout(false);
      setComplimentaryRecipient('');
      setComplimentaryReason('Doctor / Staff Health Dispense');
      setCashReceived('');
      setSearchQuery('');
      loadProducts();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // ----------------------------------------------------
  // KEYBOARD SHORTCUT ASSIGNMENTS
  // ----------------------------------------------------

  useKeyboardShortcuts({
    onF1: () => createNewBill(),
    onF2: () => {
      setSearchQuery('');
      barcodeInputRef.current?.focus();
    },
    onF3: () => {
      if (activeSession && activeSession.items.length > 0) {
        // Focus first item quantity input
        setTimeout(() => {
          const firstInput = document.querySelector('input[type="number"]') as HTMLInputElement;
          firstInput?.focus();
          firstInput?.select();
        }, 50);
      }
    },
    onF4: () => {
      // Focus discount percent input
      setTimeout(() => {
        const discInput = document.getElementById('discount-input') as HTMLInputElement;
        discInput?.focus();
        discInput?.select();
      }, 50);
    },
    onF5: () => toggleHold(),
    onF6: () => {
      // Focus active sessions panel
      showToast("F6: Cycle Active Bills via ALT+1 to ALT+9", "info");
    },
    onF7: () => {
      if (activeSession && activeSession.items.length > 0) {
        setShowPaymentModal(true);
        setTimeout(() => paymentCashInputRef.current?.focus(), 150);
      } else {
        showToast("Cannot checkout an empty ticket.", "error");
      }
    },
    onF8: () => {
      showToast("Invoice print triggers automatically on checkout F9", "info");
    },
    onF9: () => {
      // Fast check out F9
      if (activeSession && activeSession.items.length > 0) {
        setShowPaymentModal(true);
        setTimeout(() => paymentCashInputRef.current?.focus(), 150);
      }
    },
    onEsc: () => {
      setShowSearchModal(false);
      setShowPaymentModal(false);
      setShowProductCrudModal(false);
      setShowAnalyticsModal(false);
      setShowSettingsModal(false);
      setShowEmployeeCrudModal(false);
      setSearchQuery('');
      setCashReceived('');
      barcodeInputRef.current?.focus();
    },
    onCtrlD: () => {
      if (activeSession && activeSession.selectedItemIndex !== -1) {
        deleteItemFromBill(activeSession.selectedItemIndex);
      }
    },
    onAltNum: (num) => {
      // Alt+1 to Alt+9 switching
      const target = sessions[num - 1];
      if (target) {
        setActiveSessionId(target.id);
        showToast(`Switched to Bill #${target.billNumber}`, "success");
      }
    },
    onAltN: () => createNewBill(),
    onAltX: () => {
      if (activeSession) closeSession(activeSession.id);
    }
  });

  // ----------------------------------------------------
  // ADMIN PRODUCTS CRUD API HELPERS
  // ----------------------------------------------------

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role !== 'admin') {
      showToast("Access Denied: Admin privileges required to modify products.", "error");
      return;
    }
    if (!editingProduct?.name || !editingProduct?.category || editingProduct?.price === undefined) {
      showToast("Name, Category and Price are mandatory.", "error");
      return;
    }

    const isNew = !editingProduct.id;
    const url = isNew ? apiUrl("/api/products") : apiUrl(`/api/products/${editingProduct.id}`);
    const method = isNew ? "POST" : "PUT";

    const finalTaxPercent = editingProduct.tax_percent !== undefined && editingProduct.tax_percent !== null && !isNaN(Number(editingProduct.tax_percent))
      ? Number(editingProduct.tax_percent)
      : 5;
    const finalPrice = Number(editingProduct.price || 0);
    const finalMrp = Number(editingProduct.mrp !== undefined && editingProduct.mrp !== null && !isNaN(Number(editingProduct.mrp)) ? editingProduct.mrp : finalPrice);
    const finalPurchasePrice = Number(editingProduct.purchase_price !== undefined && editingProduct.purchase_price !== null && !isNaN(Number(editingProduct.purchase_price)) ? editingProduct.purchase_price : +(finalPrice * 0.72).toFixed(2));

    const finalStock = Number(editingProduct.available_stock || 0);
    const finalStatus = finalStock > 0 ? 'Available' : 'Out of Stock';

    const payload = {
      ...editingProduct,
      price: finalPrice,
      mrp: finalMrp,
      purchase_price: finalPurchasePrice,
      tax_percent: finalTaxPercent,
      available_stock: finalStock,
      quantity_type: editingProduct.quantity_type || 'strip',
      status: finalStatus
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save product failed.");
      }

      showToast(`Product ${isNew ? 'created' : 'updated'} successfully!`, "success");
      setEditingProduct(null);
      loadProducts();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const updateProductCategory = async (id: number, newCategory: string) => {
    if (currentUser?.role !== 'admin') {
      showToast("Access Denied: Admin privileges required to update category.", "error");
      return;
    }
    const targetProd = products.find(p => p.id === id);
    if (!targetProd) return;
    try {
      const res = await fetch(apiUrl(`/api/products/${id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...targetProd, category: newCategory })
      });
      if (res.ok) {
        showToast(`Category updated to "${newCategory}"`, "success");
        loadProducts();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to update category.", "error");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const downloadInwardReceiptPDF = (record: any) => {
    try {
      const printWindow = window.open('', '_blank', 'width=800,height=900');
      if (!printWindow) {
        showToast("Pop-up blocked. Please allow pop-ups to print or download PDF.", "error");
        return;
      }
      const invoiceNo = record.invoice_number || 'INV-MONTHLY';
      const recDate = record.received_date || new Date().toISOString().split('T')[0];
      const supplier = record.supplier_name || 'Direct Wholesale';
      const recBy = record.received_by || 'Admin';
      const notes = record.notes || 'Routine Clinic Restock';
      const items = record.items && Array.isArray(record.items) && record.items.length > 0 ? record.items : [
        {
          product_name: record.product_name,
          batch_number: record.batch_number,
          expiry_date: record.expiry_date,
          quantity: record.quantity || record.quantity_received || 0,
          purchase_price: record.purchase_price || 0,
          mrp: record.mrp || 0,
          selling_price: record.selling_price || record.mrp || 0
        }
      ];

      const totalPurchaseVal = items.reduce((sum: number, it: any) => sum + (Number(it.quantity || 0) * Number(it.purchase_price || 0)), 0);
      const totalMrpVal = items.reduce((sum: number, it: any) => sum + (Number(it.quantity || 0) * Number(it.mrp || 0)), 0);
      const totalUnits = items.reduce((sum: number, it: any) => sum + Number(it.quantity || 0), 0);

      const grnHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Inward Stock Receipt / GRN #${invoiceNo}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #1e293b; margin: 0; padding: 20px; font-size: 12px; line-height: 1.4; }
            .header { border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
            .clinic-name { font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 2px; }
            .clinic-sub { font-size: 11px; color: #64748b; font-weight: 600; }
            .grn-badge { background: #f0f9ff; border: 1px solid #bae6fd; color: #0369a1; padding: 6px 12px; border-radius: 8px; font-weight: 800; text-align: right; }
            .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 16px; font-size: 11px; }
            .info-item { display: flex; flex-direction: column; }
            .info-label { font-size: 9.5px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 2px; }
            .info-val { font-weight: 600; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11px; }
            th { background: #0f172a; color: #ffffff; text-align: left; padding: 8px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
            td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
            tr:nth-child(even) { background: #f8fafc; }
            .text-right { text-align: right; }
            .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
            .summary-box { display: flex; justify-content: flex-end; margin-top: 10px; margin-bottom: 24px; }
            .summary-table { width: 320px; border-collapse: collapse; }
            .summary-table td { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; }
            .signatures { display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px; margin-top: 40px; padding-top: 20px; border-top: 1px dashed #cbd5e1; }
            .sig-line { border-top: 1px solid #0f172a; margin-top: 50px; text-align: center; font-size: 10px; color: #64748b; font-weight: 700; padding-top: 4px; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="clinic-name">${(bakeryDetails.name || 'MADRAS ORTHO CLINIC').toUpperCase()}</div>
              <div class="clinic-sub">${bakeryDetails.description || (bakeryDetails as any).doctorSpecialty || 'Center for Orthopaedic Surgery & Speciality Clinic Pharmacy'}</div>
              <div class="clinic-sub">${[
          bakeryDetails.address,
          bakeryDetails.city && bakeryDetails.state ? `${bakeryDetails.city}, ${bakeryDetails.state}` : (bakeryDetails.city || bakeryDetails.state),
          bakeryDetails.pincode ? `PIN: ${bakeryDetails.pincode}` : '',
          bakeryDetails.phone ? `Ph: ${bakeryDetails.phone}` : '',
          (bakeryDetails as any).dlNo ? `DL Form 20B: ${(bakeryDetails as any).dlNo}` : '',
          (bakeryDetails as any).dlNo21 ? `DL Form 21B: ${(bakeryDetails as any).dlNo21}` : '',
          (bakeryDetails as any).ceaNo ? `CEA Reg: ${(bakeryDetails as any).ceaNo}` : '',
          (bakeryDetails as any).gstin ? `GSTIN: ${(bakeryDetails as any).gstin}` : ''
        ].filter(Boolean).join(' • ')}</div>
            </div>
            <div class="grn-badge">
              <div style="font-size: 14px; color: #0284c7;">GOODS RECEIVED NOTE (GRN)</div>
              <div style="font-size: 10px; color: #64748b;">Statutory Drug Intake Voucher</div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Supplier / Wholesaler:</span>
              <span class="info-val">${supplier}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Invoice / DC Reference:</span>
              <span class="info-val font-mono">${invoiceNo}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Date Received:</span>
              <span class="info-val font-mono">${recDate}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Verified & Received By:</span>
              <span class="info-val">${recBy}</span>
            </div>
            <div class="info-item" style="grid-column: span 2;">
              <span class="info-label">Consignment Notes / Storage Location:</span>
              <span class="info-val">${notes}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 30px;">#</th>
                <th>Medicine / Drug Formulation</th>
                <th>Batch Number</th>
                <th>Expiry Date</th>
                <th class="text-right">Qty Received</th>
                <th class="text-right">Cost (₹)</th>
                <th class="text-right">Total Cost (₹)</th>
                <th class="text-right">MRP (₹)</th>
                <th class="text-right">Selling Rate (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((it: any, idx: number) => {
          const lineTot = Number(it.quantity || 0) * Number(it.purchase_price || 0);
          return `
                  <tr>
                    <td style="color:#64748b; font-size:10px;">${idx + 1}</td>
                    <td style="font-weight:700;">${it.product_name || `Medicine #${it.product_id}`}</td>
                    <td class="font-mono" style="color:#0369a1;">${it.batch_number}</td>
                    <td class="font-mono">${it.expiry_date}</td>
                    <td class="text-right font-mono" style="font-weight:700;">${it.quantity}</td>
                    <td class="text-right font-mono">₹${Number(it.purchase_price || 0).toFixed(2)}</td>
                    <td class="text-right font-mono" style="font-weight:700; color:#0f172a;">₹${lineTot.toFixed(2)}</td>
                    <td class="text-right font-mono">₹${Number(it.mrp || 0).toFixed(2)}</td>
                    <td class="text-right font-mono" style="color:#16a34a; font-weight:700;">₹${Number(it.selling_price || it.mrp || 0).toFixed(2)}</td>
                  </tr>
                `;
        }).join('')}
            </tbody>
          </table>

          <div class="summary-box">
            <table class="summary-table">
              <tr>
                <td><strong>Total Medicines in Voucher:</strong></td>
                <td class="text-right font-mono"><strong>${items.length} Medicines</strong></td>
              </tr>
              <tr>
                <td><strong>Total Units Received:</strong></td>
                <td class="text-right font-mono" style="color:#0284c7;"><strong>${totalUnits} Units</strong></td>
              </tr>
              <tr>
                <td><strong>Total Stock Purchase Valuation:</strong></td>
                <td class="text-right font-mono" style="font-size:13px; font-weight:800; color:#b45309;">₹${totalPurchaseVal.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Total Printed MRP Valuation:</td>
                <td class="text-right font-mono">₹${totalMrpVal.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div class="signatures">
            <div>
              <div class="sig-line">${bakeryDetails.pharmacistName ? `${bakeryDetails.pharmacistName}${bakeryDetails.pharmacistRegNo ? ` (Reg: ${bakeryDetails.pharmacistRegNo})` : ''} — Supervising Pharmacist` : 'Pharmacist In-Charge (Verification & Physical Audit)'}</div>
            </div>
            <div>
              <div class="sig-line">${bakeryDetails.doctorName ? `${bakeryDetails.doctorName}${bakeryDetails.doctorRegNo ? ` (Reg: ${bakeryDetails.doctorRegNo})` : ''} — Chief Medical Officer / Authorized Signatory` : 'Authorized Signatory / Clinic Admin'}</div>
            </div>
          </div>

          <div style="margin-top: 30px; text-align: center; font-size: 9px; color: #94a3b8;">
            This is a computerized official Goods Received Note (GRN) generated under Rule 65 of Drugs and Cosmetics Rules, 1945.
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(grnHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } catch (err: any) {
      console.error("Inward PDF print error:", err);
      showToast("Failed to print/download Inward Stock PDF receipt.", "error");
    }
  };

  const deleteProduct = async (id: number) => {
    if (currentUser?.role !== 'admin') {
      showToast("Access Denied: Admin privileges required to delete products.", "error");
      return;
    }
    const targetProd = products.find(p => p.id === id);
    if (targetProd && (targetProd.is_example === 0 || targetProd.is_example === false)) {
      showToast("Statutory Inventory Protection: Actual clinic inventory items cannot be deleted to preserve drug dispensing audit trail under D&C Rules. Set stock to 0 or mark 'Inactive' instead. Only pre-seeded example items can be deleted.", "error");
      return;
    }
    showConfirm({
      title: "Delete Example Medicine",
      message: `Are you sure you want to delete example medicine "${targetProd?.name || 'Item'}" from the database?`,
      type: "danger",
      confirmText: "Delete",
      onConfirm: async () => {
        try {
          const res = await fetch(apiUrl(`/api/products/${id}`), {
            method: "DELETE"
          });
          if (res.ok) {
            showToast("Product deleted successfully.", "success");
            if (editingProduct?.id === id) {
              setEditingProduct(null);
            }
            loadProducts();
            setTimeout(() => {
              const prodInput = document.querySelector('input[placeholder="Search products by typing... [CTRL+F]"]') as HTMLInputElement;
              prodInput?.focus();
            }, 100);
          } else {
            const err = await res.json();
            showToast(err.error || "Delete failed.", "error");
          }
        } catch (err: any) {
          showToast(err.message, "error");
        } finally {
          closeConfirm();
        }
      },
      onCancel: () => {
        setTimeout(() => {
          const prodInput = document.querySelector('input[placeholder="Search products by typing... [CTRL+F]"]') as HTMLInputElement;
          prodInput?.focus();
        }, 50);
      }
    });
  };

  // ----------------------------------------------------
  // INTELLIGENT EXCEL MEDICINE IMPORT HANDLERS
  // ----------------------------------------------------

  const handleDownloadTemplate = () => {
    window.open(authApiUrl("/api/products/template-excel"), "_blank");
    showToast("Downloading Ortho Medicines Excel template...", "info");
  };

  const handleExcelFileSelect = async (file: File) => {
    if (!file) return;
    setExcelFileName(file.name);
    setExcelParsing(true);

    try {
      const isCsv = file.name.toLowerCase().endsWith('.csv');
      let res: Response;

      if (isCsv) {
        const text = await file.text();
        res = await fetch(apiUrl("/api/products/parse-excel"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csvText: text, filename: file.name })
        });
      } else {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = '';
        const len = bytes.byteLength;
        const chunkSize = 8192;
        for (let i = 0; i < len; i += chunkSize) {
          const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
          binary += String.fromCharCode.apply(null, chunk as any);
        }
        const base64 = btoa(binary);

        res = await fetch(apiUrl("/api/products/parse-excel"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileBase64: base64, filename: file.name })
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to parse file.");
      }

      const data = await res.json();
      const rows: any[] = data.medicines || [];

      if (rows.length === 0) {
        showToast("No valid medicine rows found in the uploaded file.", "error");
        setExcelParsing(false);
        return;
      }

      setExcelParsedMedicines(rows);

      // Intelligently compare medicine names case-insensitively with current database
      const existingMap = new Map<string, Product>();
      products.forEach(p => {
        existingMap.set((p.name || '').trim().toLowerCase(), p);
      });

      const conflicts: Array<{ excelItem: any; existingItem: Product; userChoice: 'skip' | 'add' }> = [];
      const newItems: any[] = [];

      rows.forEach(item => {
        const key = (item.name || '').trim().toLowerCase();
        const existing = existingMap.get(key);
        if (existing) {
          conflicts.push({
            excelItem: item,
            existingItem: existing,
            userChoice: 'skip' // Default to skip, user can choose 'add' or 'skip'
          });
        } else {
          newItems.push(item);
        }
      });

      setExcelConflicts(conflicts);
      setExcelNewItems(newItems);

      if (conflicts.length > 0) {
        // Warning: Found duplicate medicine names in the database
        setShowConflictModal(true);
      } else {
        showToast(`Excel verified: All ${newItems.length} medicines are new and ready to import directly.`, "success");
      }
    } catch (err: any) {
      console.error("Excel upload parse error:", err);
      showToast("Error reading Excel sheet: " + err.message, "error");
    } finally {
      setExcelParsing(false);
    }
  };

  const executeExcelImport = async (importList: any[], updateDuplicates: boolean) => {
    if (!importList || importList.length === 0) {
      showToast("No medicines selected to import.", "info");
      return;
    }

    setIsBatchImporting(true);
    try {
      const res = await fetch(apiUrl("/api/products/batch"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products: importList,
          updateExisting: updateDuplicates
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Batch import failed.");
      }

      const result = await res.json();
      showToast(`Successfully processed ${result.totalProcessed || importList.length} medicines (${result.added || 0} added, ${result.updated || 0} updated)!`, "success");
      setShowConflictModal(false);
      setExcelParsedMedicines([]);
      setExcelConflicts([]);
      setExcelNewItems([]);
      setExcelFileName('');
      loadProducts();
      setProductModalTab('list');
    } catch (err: any) {
      showToast("Import error: " + err.message, "error");
    } finally {
      setIsBatchImporting(false);
    }
  };

  const saveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role !== 'admin') {
      showToast("Access Denied: Admin privileges required to modify employees.", "error");
      return;
    }
    if (!editingEmployee.name || !editingEmployee.role) {
      showToast("Name and Role are mandatory.", "error");
      return;
    }

    const isNew = !editingEmployee.id;
    const url = isNew ? apiUrl("/api/employees") : apiUrl(`/api/employees/${editingEmployee.id}`);
    const method = isNew ? "POST" : "PUT";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingEmployee)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save employee failed.");
      }

      showToast(`Employee ${isNew ? 'added' : 'updated'} successfully!`, "success");
      setEditingEmployee({});
      loadEmployees();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const deleteEmployee = async (id: number) => {
    if (currentUser?.role !== 'admin') {
      showToast("Access Denied: Admin privileges required to delete employees.", "error");
      return;
    }
    const targetEmp = employees.find(e => e.id === id);
    if (targetEmp?.username === 'admin' || (targetEmp?.role?.toLowerCase() === 'admin' && employees.filter(e => e.role?.toLowerCase() === 'admin').length <= 1)) {
      showToast("Protection: Primary administrator account cannot be deleted.", "error");
      return;
    }
    showConfirm({
      title: "Delete Staff Member Record",
      message: `Are you sure you want to permanently delete employee '${targetEmp?.name || id}'?`,
      type: "danger",
      confirmText: "Delete Employee",
      onConfirm: async () => {
        try {
          const res = await fetch(apiUrl(`/api/employees/${id}`), {
            method: "DELETE"
          });
          if (res.ok) {
            showToast("Employee deleted successfully.", "success");
            if (editingEmployee.id === id) {
              setEditingEmployee({});
            }
            loadEmployees();
            setTimeout(() => {
              const nameInput = document.querySelector('input[placeholder="Enter full name"]') as HTMLInputElement;
              nameInput?.focus();
            }, 100);
          } else {
            const err = await res.json();
            showToast(err.error || "Delete failed.", "error");
          }
        } catch (err: any) {
          showToast(err.message, "error");
        } finally {
          closeConfirm();
        }
      },
      onCancel: () => {
        setTimeout(() => {
          const nameInput = document.querySelector('input[placeholder="Enter full name"]') as HTMLInputElement;
          nameInput?.focus();
        }, 50);
      }
    });
  };

  const deleteExampleBill = async (id: number) => {
    showConfirm({
      title: "Delete Demo Bill Record",
      message: "Are you sure you want to remove this example/demo sales bill from history?",
      type: "danger",
      confirmText: "Delete Demo Bill",
      onConfirm: async () => {
        try {
          const res = await fetch(apiUrl(`/api/bills/${id}`), {
            method: "DELETE"
          });
          const data = await res.json();
          if (res.ok) {
            showToast(data.message || "Example bill removed from history.", "success");
            fetchHistory();
            setSelectedBill(null);
          } else {
            showToast(data.error || "Delete failed.", "error");
          }
        } catch (err: any) {
          showToast(err.message, "error");
        } finally {
          closeConfirm();
        }
      }
    });
  };

  // ----------------------------------------------------
  // ANALYTICS & EXPORTS
  // ----------------------------------------------------

  const fetchReports = async () => {
    setLoadingAnalytics(true);
    try {
      let url = apiUrl(`/api/reports/${reportType}`);
      if (reportType === 'yearly') {
        url += `?year=${reportYear}`;
      } else if (reportType === 'monthly') {
        url += `?month=${reportMonth}`;
      } else {
        url += `?date=${reportDate}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      setAnalyticsData(data);
    } catch (err) {
      showToast("Failed to compile financial reports.", "error");
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      // Map UI reportType to API period values
      const periodMap: Record<string, string> = { daily: 'day', weekly: 'week', monthly: 'month', yearly: 'year' };
      const period = periodMap[reportType] || 'month';
      let url = apiUrl(`/api/bills?period=${period}`);
      if (period === 'year') {
        url += `&year=${reportYear}`;
      } else if (period === 'month') {
        url += `&month=${reportMonth}`;
      } else if (period === 'week') {
        // For week, server expects date param (any date in week) to compute Monday/Sunday
        url += `&date=${reportDate}`;
      } else {
        // day
        url += `&date=${reportDate}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        const errText = await res.text();
        console.error('Fetch history error', errText);
        throw new Error('Server error');
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setHistoryBills(data);
      } else {
        setHistoryBills([]);
      }
      setSelectedBill(null);
      setSelectedBillItems([]);
    } catch (err) {
      showToast('Failed to load bills history.', 'error');
      setHistoryBills([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchBillItems = async (bill: any) => {
    try {
      const res = await fetch(apiUrl(`/api/bills/${bill.id}/items`));
      if (!res.ok) {
        throw new Error("Server error");
      }
      const data = await res.json();
      setSelectedBill(bill);
      setSelectedBillItems(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast("Failed to fetch bill details.", "error");
    }
  };

  const handleReprintReceipt = (bill: any, items: any[]) => {
    // Recalculate GST from stored items
    const storedTax = bill.tax || 0;
    const printData = {
      bakeryName: bakeryDetails.name,
      address: bakeryDetails.address,
      phone: bakeryDetails.phone,
      gstin: (bakeryDetails as any).gstin || '',
      dlNo: (bakeryDetails as any).dlNo || '',
      dlNo21: (bakeryDetails as any).dlNo21 || '21B/TN/CHE/00482',
      billNumber: bill.bill_number,
      date: bill.date,
      time: bill.time,
      cashierName: bill.cashier_name,
      patientName: bill.patient_name || 'Walk-in Patient',
      patientAge: bill.patient_age,
      patientGender: bill.patient_gender,
      patientPhone: bill.patient_phone,
      doctorName: bill.doctor_name || bakeryDetails.doctorName || 'Dr. Arjun Sharma, MS (Ortho)',
      doctorRegNo: bill.doctor_reg_no || bakeryDetails.doctorRegNo || 'TNMC/2012/94821',
      pharmacistName: bill.pharmacist_name || bakeryDetails.pharmacistName || 'Priya Nair, B.Pharm',
      pharmacistRegNo: bill.pharmacist_reg_no || bakeryDetails.pharmacistRegNo || 'TNSPC/2018/48912',
      items: items.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        generic_name: item.generic_name || item.product_name,
        batch_number: item.batch_number || 'B-STD',
        expiry_date: item.expiry_date || '2028-12-31',
        hsn_code: item.hsn_code || '30049099',
        schedule: item.schedule || 'Schedule H',
        quantity: item.quantity,
        rate: item.rate,
        total: item.total,
        tax_percent: item.tax_percent || 0
      })),
      subtotal: bill.subtotal,
      discount: bill.discount,
      tax: storedTax,
      grandTotal: bill.grand_total,
      paymentMethod: bill.payment_method,
      width: paperWidth
    };

    executeReceiptPrint(printData)
      .then(() => showToast(`Bill #${bill.bill_number} receipt reprinted!`, "success"))
      .catch((err: any) => {
        console.error("Printer pipeline error:", err);
      });
  };

  // Statutory Bill Cancellation / Credit Note (Compliant with Rule 65(4) D&C Rules & GST Sec 36)
  const handleCancelBill = async (id: number, reason: string) => {
    try {
      const res = await fetch(apiUrl(`/api/bills/${id}/cancel`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reason || 'Customer returned medicine unopened',
          cancelled_by: currentUser?.name || 'Pharmacist'
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to cancel bill.");
      }

      showToast("Invoice cancelled. Credit Note recorded in statutory audit.", "success");
      setShowCancelModal(false);
      setBillToCancel(null);
      setSelectedBill(null);
      setSelectedBillItems([]);

      fetchReports();
      fetchHistory();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };



  useEffect(() => {
    if (showAnalyticsModal) {
      if (activeTab === 'analytics') {
        fetchReports();
      } else {
        fetchHistory();
      }
    }
  }, [showAnalyticsModal, activeTab, reportType, reportDate, reportMonth, reportYear]);

  const downloadClientSideCsvReport = async (
    type: 'daily' | 'weekly' | 'monthly' | 'yearly',
    date: string,
    year: number
  ) => {
    try {
      let url = apiUrl(`/api/reports/${type}`);
      if (type === 'yearly') {
        url += `?year=${year}`;
      } else if (type === 'monthly') {
        url += `?month=${reportMonth}`;
      } else {
        url += `?date=${date}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      const activeClinicName = (bakeryDetails.name || 'MADRAS ORTHO CLINIC').toUpperCase();
      let csvContent = "\ufeff"; // UTF-8 BOM
      csvContent += `${activeClinicName}\n`;
      if (bakeryDetails.address || bakeryDetails.phone) {
        csvContent += `"${[bakeryDetails.address, bakeryDetails.phone, (bakeryDetails as any).gstin ? `GSTIN: ${(bakeryDetails as any).gstin}` : ''].filter(Boolean).join(' • ')}"\n\n`;
      }
      let filename = "";

      if (type === 'daily') {
        filename = `Daily_Sales_Report_${date}.csv`;
        csvContent += `Daily Sales Report - ${date}\n\n`;
        csvContent += `Summary Metrics\n`;
        csvContent += `Total Sales,₹${(data.totalSales || 0).toFixed(2)}\n`;
        csvContent += `Bill Count,${data.billCount || 0}\n`;
        csvContent += `Cash Sales,₹${(data.paymentBreakdown?.Cash || 0).toFixed(2)}\n`;
        csvContent += `Google Pay Sales,₹${(data.paymentBreakdown?.GooglePay || 0).toFixed(2)}\n`;
        csvContent += `Bank Card Sales,₹${(data.paymentBreakdown?.BankCard || 0).toFixed(2)}\n\n`;

        csvContent += `Top Selling Products\n`;
        csvContent += `Product Name,Quantity,Total Sales\n`;
        if (data.topProducts) {
          data.topProducts.forEach((p: any) => {
            csvContent += `"${p.name}",${p.quantity},₹${p.total.toFixed(2)}\n`;
          });
        }

        csvContent += `\nTransactions List\n`;
        csvContent += `Bill #,Time,Cashier,Payment Method,Grand Total\n`;
        if (data.allBills) {
          data.allBills.forEach((b: any) => {
            csvContent += `#${b.bill_number},${b.time},"${b.cashier_name}",${b.payment_method},₹${b.grand_total.toFixed(2)}\n`;
          });
        }
      } else if (type === 'weekly') {
        filename = `Weekly_Sales_Report_${(data.dateRange || '').replace(' to ', '_to_')}.csv`;
        csvContent += `Weekly Sales Report - ${data.dateRange || ''}\n\n`;
        csvContent += `Summary Metrics\n`;
        csvContent += `Total Sales,₹${(data.totalSales || 0).toFixed(2)}\n`;
        csvContent += `Cash Sales,₹${(data.paymentBreakdown?.Cash || 0).toFixed(2)}\n`;
        csvContent += `Google Pay Sales,₹${(data.paymentBreakdown?.GooglePay || 0).toFixed(2)}\n`;
        csvContent += `Bank Card Sales,₹${(data.paymentBreakdown?.BankCard || 0).toFixed(2)}\n\n`;

        csvContent += `Daily Breakdown\n`;
        csvContent += `Date,Sales Amount,Bills Count\n`;
        if (data.dailyBreakdown) {
          data.dailyBreakdown.forEach((d: any) => {
            csvContent += `${d.date},₹${d.amount.toFixed(2)},${d.bills}\n`;
          });
        }

        csvContent += `\nTop Selling Products\n`;
        csvContent += `Product Name,Quantity,Total Sales\n`;
        if (data.topProducts) {
          data.topProducts.forEach((p: any) => {
            csvContent += `"${p.name}",${p.quantity},₹${p.total.toFixed(2)}\n`;
          });
        }
      } else if (type === 'monthly') {
        filename = `Monthly_Pharmacy_Financial_Report_${reportMonth}.csv`;
        csvContent += `Monthly Pharmacy Financial & Stock Management Report - ${reportMonth}\n\n`;
        csvContent += `1. EXECUTIVE FINANCIAL INDICATORS (MRP vs. PRICE SOLD AT)\n`;
        csvContent += `Gross Sales (Valuation at MRP),₹${(data.financials?.grossSales || 0).toFixed(2)}\n`;
        csvContent += `Patient Savings & Clinic Discounts,₹${(data.financials?.totalDiscounts || 0).toFixed(2)}\n`;
        csvContent += `Net Realized Sales (Price Sold At),₹${(data.financials?.netSales || data.totalSales || 0).toFixed(2)}\n`;
        csvContent += `Cost of Goods Sold (Purchase Rate COGS),₹${(data.financials?.cogs || 0).toFixed(2)}\n`;
        csvContent += `Gross Profit Margin,₹${(data.financials?.grossProfit || 0).toFixed(2)}\n`;
        csvContent += `Overall Profit Margin %,${data.financials?.profitMarginPercent || 0}%\n\n`;

        csvContent += `2. INVENTORY CAPITAL MOVEMENT & STOCK VALUATION\n`;
        csvContent += `Inward Stock Received (Units),${data.stockMovement?.inwardUnits || 0}\n`;
        csvContent += `Inward Purchase Valuation,₹${(data.stockMovement?.inwardPurchaseValuation || 0).toFixed(2)}\n`;
        csvContent += `Stock Sold to Patients (Units),${data.stockMovement?.unitsSold || 0}\n`;
        csvContent += `Units Sold COGS,₹${(data.stockMovement?.unitsSoldCost || 0).toFixed(2)}\n`;
        csvContent += `Doctor / Staff Complimentary Dispense (Units),${data.stockMovement?.complimentaryUnits || 0}\n`;
        csvContent += `Complimentary Absorbed Cost,₹${(data.stockMovement?.complimentaryAbsorbedCost || 0).toFixed(2)}\n`;
        csvContent += `Current Closing Stock Available (Units),${data.stockMovement?.currentAvailableStockUnits || 0}\n`;
        csvContent += `Current Closing Stock Valuation at Cost,₹${(data.stockMovement?.currentStockValuationCost || 0).toFixed(2)}\n`;
        csvContent += `Current Closing Stock Valuation at MRP,₹${(data.stockMovement?.currentStockValuationMrp || 0).toFixed(2)}\n\n`;

        csvContent += `3. STATUTORY GST AUDIT BREAKDOWN\n`;
        csvContent += `Taxable Base Amount,₹${(data.gstReport?.taxableAmount || 0).toFixed(2)}\n`;
        csvContent += `CGST Collected,₹${(data.gstReport?.cgst || 0).toFixed(2)}\n`;
        csvContent += `SGST Collected,₹${(data.gstReport?.sgst || 0).toFixed(2)}\n`;
        csvContent += `Total GST Collected,₹${(data.gstReport?.totalTax || 0).toFixed(2)}\n\n`;

        csvContent += `4. TOP DISPENSED MEDICINES\n`;
        csvContent += `Medicine Name,Units Dispensed,Revenue at Price Sold,COGS,Gross Margin\n`;
        if (data.topProducts) {
          data.topProducts.forEach((p: any) => {
            csvContent += `"${p.name}",${p.quantity},₹${Number(p.total || 0).toFixed(2)},₹${Number(p.cogs || 0).toFixed(2)},₹${Number(p.profit || 0).toFixed(2)}\n`;
          });
        }
      } else if (type === 'yearly') {
        filename = `Yearly_Sales_Report_${year}.csv`;
        csvContent += `Yearly Sales Report - ${year}\n\n`;
        csvContent += `Summary Metrics\n`;
        csvContent += `Total Sales,₹${(data.totalSales || 0).toFixed(2)}\n`;
        csvContent += `Cash Sales,₹${(data.paymentBreakdown?.Cash || 0).toFixed(2)}\n`;
        csvContent += `Google Pay Sales,₹${(data.paymentBreakdown?.GooglePay || 0).toFixed(2)}\n`;
        csvContent += `Bank Card Sales,₹${(data.paymentBreakdown?.BankCard || 0).toFixed(2)}\n\n`;

        csvContent += `Monthly Breakdown\n`;
        csvContent += `Month,Sales Amount,Bills Count,MoM Growth\n`;
        if (data.monthlyBreakdown) {
          data.monthlyBreakdown.forEach((m: any) => {
            csvContent += `${m.monthName},₹${m.amount.toFixed(2)},${m.bills},${(m.growthPercent * 100).toFixed(1)}%\n`;
          });
        }

        csvContent += `\nTop Selling Products\n`;
        csvContent += `Product Name,Quantity,Total Sales\n`;
        if (data.topProducts) {
          data.topProducts.forEach((p: any) => {
            csvContent += `"${p.name}",${p.quantity},₹${p.total.toFixed(2)}\n`;
          });
        }
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", blobUrl);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("CSV export failure:", err);
      showToast("Failed to compile CSV report.", "error");
    }
  };

  const handleExcelExport = () => {
    let url = authApiUrl(`/api/reports/${reportType}?export=excel`);
    if (reportType === 'yearly') {
      url += `&year=${reportYear}`;
    } else if (reportType === 'monthly') {
      url += `&month=${reportMonth}`;
    } else {
      url += `&date=${reportDate}`;
    }

    try {
      window.open(url, "_blank");
      showToast("Excel spreadsheet (.xlsx) downloaded successfully.", "success");
    } catch {
      downloadClientSideCsvReport(reportType, reportDate, reportYear);
    }
  };

  // ----------------------------------------------------
  // VISUAL RENDER NODES
  // ----------------------------------------------------

  // Grid products after category and instant catalogue search filtering (In-stock first priority)
  const visibleGridProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === 'All' ||
        Boolean(p.category && p.category.split(',').map(c => c.trim().toLowerCase()).includes(selectedCategory.toLowerCase()));
      const q = catalogueSearch.trim().toLowerCase();
      const matchSearch = !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.includes(q));
      return matchCat && matchSearch;
    }).sort((a, b) => {
      const aInStock = (a.available_stock ?? 0) > 0 ? 1 : 0;
      const bInStock = (b.available_stock ?? 0) > 0 ? 1 : 0;
      if (aInStock !== bInStock) return bInStock - aInStock;
      return (b.available_stock ?? 0) - (a.available_stock ?? 0) || a.name.localeCompare(b.name);
    });
  }, [products, selectedCategory, catalogueSearch]);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-4 font-sans select-none">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-sky-700 via-sky-600 to-cyan-500 p-6 text-white">
            <div className={`flex items-center ${isMobileView ? 'justify-center' : 'space-x-3'}`}>
              <div className="bg-white/20 backdrop-blur rounded-xl overflow-hidden w-12 h-12 flex-shrink-0 flex items-center justify-center">
                <img src="./icon.png" alt="Clinic Logo" className="w-12 h-12 object-cover" />
              </div>
              {!isMobileView && (
                <div>
                  <h2 className="text-xl font-black tracking-tight">MADRAS ORTHO CLINIC SOFTWARE</h2>
                  <p className="text-xs font-bold text-white/80">Mission for Cure — Select Account</p>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleLogin} className="p-6 space-y-4">
            {loginError && (
              <div className="flex items-center space-x-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select User Account</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoginForm({ username: 'admin', password: '' });
                    setIsLoggingIn(false);
                    setLoginError('');
                  }}
                  className={`flex items-center justify-center px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${loginForm.username === 'admin'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-md shadow-amber-500/10'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                >
                  <Shield className="w-3.5 h-3.5 mr-2" />
                  Admin (admin)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginForm({ username: 'employee', password: '' });
                    setIsLoggingIn(false);
                    setLoginError('');
                  }}
                  className={`flex items-center justify-center px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${loginForm.username === 'employee'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-md shadow-blue-500/10'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                >
                  <Users className="w-3.5 h-3.5 mr-2" />
                  Employee (employee)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => {
                    setLoginForm(prev => ({ ...prev, password: e.target.value }));
                    if (isLoggingIn) setIsLoggingIn(false);
                  }}
                  placeholder={`Enter password for ${loginForm.username}...`}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  autoFocus
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn || !loginForm.password.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-700 hover:to-cyan-600 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-sky-500/20 active:scale-98 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoggingIn && loginForm.password.trim().length > 0 ? "Authenticating..." : `Login as ${loginForm.username.toUpperCase()}`}
            </button>

            {isFirstTimeEver && (
              <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-[11px] text-slate-400 space-y-1">
                <p className="font-bold text-slate-300">Default Passwords (First-Time Only):</p>
                <p>• Admin: <code className="text-amber-400 bg-slate-900 px-1.5 py-0.5 rounded">admin123</code></p>
                <p>• Employee: <code className="text-blue-400 bg-slate-900 px-1.5 py-0.5 rounded">employee123</code></p>
              </div>
            )}

            <div className="pt-1 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setLoginServerUrl(getSavedClinicServerUrl() || getApiBaseUrl());
                  setShowLoginServerConfig(prev => !prev);
                }}
                className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-400 hover:text-sky-400 py-1 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-sky-400" />
                  <span>Clinic Server: <code className="text-slate-300 font-mono">{getApiBaseUrl()}</code></span>
                </span>
                <span>{showLoginServerConfig ? 'Hide' : 'Configure LAN'}</span>
              </button>

              {showLoginServerConfig && (
                <div className="mt-2 p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                  <input
                    type="text"
                    value={loginServerUrl}
                    onChange={(e) => setLoginServerUrl(e.target.value)}
                    placeholder="http://192.168.x.x:4848 or http://madrasorthoclinic.local:4848"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-[11px] font-mono text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                  {loginServerStatus && (
                    <div className={`text-[10px] px-2 py-1 rounded border ${loginServerStatus.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
                      {loginServerStatus.msg}
                    </div>
                  )}
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={async () => {
                        const target = (loginServerUrl || '').trim().replace(/\/+$/, '');
                        if (!target) return;
                        try {
                          const start = performance.now();
                          const r = await fetch(`${target}/api/health`);
                          const ms = Math.round(performance.now() - start);
                          if (r.ok) {
                            setLoginServerStatus({ ok: true, msg: `Connected to clinic server (${ms}ms)` });
                          } else {
                            setLoginServerStatus({ ok: false, msg: `Server responded HTTP ${r.status}` });
                          }
                        } catch {
                          setLoginServerStatus({ ok: false, msg: 'Unreachable. Verify Wi-Fi and port 4848.' });
                        }
                      }}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-bold"
                    >
                      Test Ping
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const target = (loginServerUrl || '').trim().replace(/\/+$/, '');
                        if (!target) return;
                        setSavedClinicServerUrl(target);
                        setAuthToken(null);
                        setLoginServerStatus({ ok: true, msg: `Saved server host: ${target}` });
                      }}
                      className="flex-1 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-[11px] font-bold"
                    >
                      Save Host
                    </button>
                    {getSavedClinicServerUrl() && (
                      <button
                        type="button"
                        onClick={() => {
                          setSavedClinicServerUrl('');
                          setAuthToken(null);
                          const autoUrl = getApiBaseUrl();
                          setLoginServerUrl(autoUrl);
                          setLoginServerStatus({ ok: true, msg: `Reset to auto-detect (${autoUrl})` });
                        }}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-[11px] font-bold"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </form>
          <div className="px-6 py-3 bg-slate-950/70 border-t border-slate-800/80 text-center space-y-0.5">
            <div className="text-[11px] font-semibold text-slate-300">
              © 2026 <span className="text-sky-400 font-bold">RegulaVitae</span>. All Rights Reserved.
            </div>
            <div className="text-[10px] text-slate-500">
              Developed &amp; Licensed by RegulaVitae · Clinical &amp; Pharmacy Software Systems
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render dedicated Phone & Tablet UI if active
  if (isMobileView) {
    return (
      <MobileTabletApp
        onSwitchToDesktop={() => setIsMobileView(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 font-sans text-slate-100 select-none overflow-hidden theme-pharmacy-blue">

      {/* ----------------- TOP NAVBAR PANEL ----------------- */}
      <header className="flex items-center justify-between px-4 lg:px-6 py-2.5 lg:py-3 bg-slate-900 border-b border-slate-800 shadow-md">
        <div className="flex items-center space-x-3 lg:space-x-4">
          <div className="flex-shrink-0">
            <img
              src="./icon.png"
              alt="Clinic Logo"
              className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl object-cover shadow-md shadow-sky-900/30"
              style={{ imageRendering: 'crisp-edges' }}
            />
          </div>

          {/* Operating Mode Toggle (Mode A vs Mode B) */}
          <div className="hidden md:flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => {
                setOperatingMode('CLINIC_DISPENSING');
                localStorage.setItem("madrasortho_operating_mode", 'CLINIC_DISPENSING');
                showToast("Operating in Mode A: Clinic Dispensing (TNCEA 1997 / Schedule K)", "info");
              }}
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${operatingMode === 'CLINIC_DISPENSING'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-400 hover:text-slate-200'
                }`}
              title="Clinic Outpatient Dispensing under Tamil Nadu Clinical Establishments Act, 1997"
            >
              <span className={`w-2 h-2 rounded-full ${operatingMode === 'CLINIC_DISPENSING' ? 'bg-white animate-pulse' : 'bg-slate-600'}`}></span>
              Mode A: Clinic Dispensing
            </button>
            <button
              onClick={() => {
                setOperatingMode('RETAIL_PHARMACY');
                localStorage.setItem("madrasortho_operating_mode", 'RETAIL_PHARMACY');
                showToast("Operating in Mode B: Retail Pharmacy Sales (D&C Form 20B/21B)", "info");
              }}
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${operatingMode === 'RETAIL_PHARMACY'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200'
                }`}
              title="Retail Sale under Drugs and Cosmetics Rules Form 20B/21B and Section 42 of Pharmacy Act"
            >
              <span className={`w-2 h-2 rounded-full ${operatingMode === 'RETAIL_PHARMACY' ? 'bg-white animate-pulse' : 'bg-slate-600'}`}></span>
              Mode B: Retail Pharmacy
            </button>
          </div>
        </div>

        {/* Desktop Action Controls */}
        <div className="hidden lg:flex items-center space-x-3">
          <button
            onClick={() => {
              setProductModalTab('manual');
              setShowProductCrudModal(true);
            }}
            className="flex items-center px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-xs font-semibold rounded-lg border border-slate-700 text-slate-200"
          >
            <Edit className="w-3.5 h-3.5 mr-2 text-sky-400" />
            <span>Manage Medicines [CTRL+N]</span>
          </button>

          <button
            onClick={() => {
              setProductModalTab('excel');
              setShowProductCrudModal(true);
            }}
            className="flex items-center px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 active:scale-95 transition-all text-xs font-semibold rounded-lg border border-sky-500/30 text-sky-300"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-2 text-sky-400" />
            <span>Upload Excel</span>
          </button>

          {currentUser?.role === 'admin' && (
            <button
              onClick={() => {
                setShowEmployeeCrudModal(true);
                setEditingEmployee({});
                loadEmployees();
              }}
              className="flex items-center px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-xs font-semibold rounded-lg border border-slate-700 text-slate-200"
            >
              <Users className="w-3.5 h-3.5 mr-2 text-purple-400" />
              <span>Manage Employees</span>
            </button>
          )}

          {currentUser?.role === 'admin' && (
            <button
              onClick={() => {
                setAdminProfileForm({ ...bakeryDetails });
                setShowAdminProfileModal(true);
              }}
              className="flex items-center px-3 py-1.5 bg-blue-950/60 hover:bg-blue-900/80 active:scale-95 transition-all text-xs font-semibold rounded-lg border border-blue-700/60 text-blue-200"
              title="Doctor Profile, Qualifications, Medical Council Reg & Clinic Licensure"
            >
              <Stethoscope className="w-3.5 h-3.5 mr-2 text-cyan-400" />
              <span>Doctor Profile & Licensure</span>
            </button>
          )}

          <button
            onClick={() => setShowAnalyticsModal(true)}
            className="flex items-center px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-xs font-semibold rounded-lg border border-slate-700 text-slate-200"
          >
            <BarChart2 className="w-3.5 h-3.5 mr-2 text-emerald-400" />
            <span>Analytics Reports</span>
          </button>

          <button
            onClick={() => {
              fetchPatients();
              setShowPatientsModal(true);
            }}
            className="flex items-center px-3 py-1.5 bg-indigo-950/60 hover:bg-indigo-900/80 active:scale-95 transition-all text-xs font-semibold rounded-lg border border-indigo-700/60 text-indigo-200"
          >
            <Users className="w-3.5 h-3.5 mr-2 text-indigo-400" />
            <span>Patients Database</span>
          </button>

          {/* Real-Time Expiry & Inventory Alerts Bell */}
          <button
            onClick={() => {
              fetchNotifications();
              setShowNotificationsModal(true);
            }}
            className="relative p-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-lg border border-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Real-Time Expiry & Inventory Alerts"
          >
            <Bell className="w-4 h-4 text-amber-400" />
            {(() => {
              const smartCount = (notificationsData?.summary?.expiringSoonCount || 0) + (notificationsData?.summary?.lowStockCount || 0) + (notificationsData?.summary?.expiredCount || 0);
              if (smartCount <= 0) return null;
              return (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-lg animate-pulse">
                  {smartCount}
                </span>
              );
            })()}
          </button>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
            title="Settings & Hardware Alignment"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Logout Button */}
          <div className="flex flex-col items-center justify-center pl-2.5 border-l border-slate-800 gap-0.5">
            <button
              onClick={handleLogout}
              title="Logout / Switch User"
              className="flex items-center px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-semibold transition-colors active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              <span>Logout</span>
            </button>
            <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded leading-none ${currentUser?.role === 'admin'
              ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
              : 'text-slate-400 bg-slate-800 border border-slate-700'
              }`}>
              {currentUser?.role === 'admin' ? 'admin' : 'employee'}
            </span>
          </div>
        </div>

        {/* Mobile Clean Top Controls (No congestion) */}
        <div className="flex lg:hidden items-center space-x-2">
          <button
            onClick={createNewBill}
            className="flex items-center px-2.5 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 active:scale-95 text-sky-400 border border-sky-500/30 rounded-xl text-xs font-bold transition-all"
          >
            <Plus className="w-3.5 h-3.5 mr-1 stroke-[3]" />
            <span>New Rx</span>
          </button>

          {/* Real-time Alerts Bell (Mobile) */}
          <button
            onClick={() => {
              fetchNotifications();
              setShowNotificationsModal(true);
            }}
            className="relative p-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 rounded-xl text-xs transition-all"
            title="Real-Time Alerts"
          >
            <Bell className="w-4 h-4 text-amber-400" />
            {(() => {
              const smartCount = (notificationsData?.summary?.expiringSoonCount || 0) + (notificationsData?.summary?.lowStockCount || 0) + (notificationsData?.summary?.expiredCount || 0);
              if (smartCount <= 0) return null;
              return (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-lg animate-pulse">
                  {smartCount}
                </span>
              );
            })()}
          </button>

          <button
            onClick={() => setShowMobileNav(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 active:scale-95 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-4 h-4 text-sky-400" />
            <span className="text-[11px]">Menu</span>
          </button>
        </div>
      </header>

      {/* ----------------- CORE THREE PANEL LAYOUT ----------------- */}
      <main className="flex flex-col lg:flex-row flex-1 overflow-hidden p-2 lg:p-3 gap-2 lg:gap-3">

        {/* === LEFT PANEL: Categories & Visual Products Grid === */}
        <section className={`flex flex-col w-full lg:w-5/12 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden ${mobileTab === 'menu' ? 'flex flex-1' : 'hidden lg:flex'}`}>

          {/* Catalogue Search Header */}
          <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={catalogueSearch}
                onChange={(e) => setCatalogueSearch(e.target.value)}
                placeholder="Search 550+ medicines, categories..."
                className="w-full pl-8 pr-7 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              {catalogueSearch && (
                <button
                  onClick={() => setCatalogueSearch('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-white p-0.5"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-2 rounded-xl whitespace-nowrap">
              {visibleGridProducts.length} Meds
            </span>
          </div>

          {/* Quick Categories bar with FIXED Add Category button */}
          <div className="flex items-center p-2 gap-2 bg-slate-900/90 border-b border-slate-800 flex-shrink-0">
            {currentUser?.role === 'admin' && (
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(true)}
                className="px-3 py-1.5 text-xs font-black rounded-xl transition-all flex-shrink-0 bg-sky-500 hover:bg-sky-400 text-slate-950 flex items-center gap-1.5 shadow-md shadow-sky-500/20 active:scale-95"
                title="Create custom category (Always Visible)"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>+ Add Category</span>
              </button>
            )}

            {/* Scrollable Categories List */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-1 min-w-0">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex-shrink-0 ${selectedCategory === 'All'
                  ? 'bg-sky-600 text-white font-black shadow-md shadow-sky-600/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
              >
                All Medicines
              </button>
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex-shrink-0 ${selectedCategory === c
                    ? 'bg-sky-500 text-slate-950 font-black shadow-md shadow-sky-500/20 scale-105'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Products with spacious cards */}
          <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {visibleGridProducts.length === 0 ? (
              <div className="col-span-full py-16 flex flex-col items-center justify-center text-center text-slate-500 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                  <Package className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-300">No medicines found in "{selectedCategory}"</h4>
                  <p className="text-xs text-slate-500 mt-1">Try selecting another category or clearing your search query.</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedCategory('All'); setCatalogueSearch(''); }}
                  className="px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-xl text-xs font-bold transition-all"
                >
                  View All Medicines ({products.length})
                </button>
              </div>
            ) : (
              visibleGridProducts.map(p => {
                const todayStr = new Date().toISOString().split('T')[0];
                const isExpired = Boolean(
                  p.status === 'Expired' ||
                  p.is_expired ||
                  (p.expiry_date && String(p.expiry_date).substring(0, 10) <= todayStr)
                );
                const availStock = p.available_stock !== undefined ? p.available_stock : (p.status === 'Out of Stock' ? 0 : 50);
                const isOutOfStock = Boolean(
                  p.status === 'Out of Stock' ||
                  p.is_out_of_stock ||
                  availStock <= 0
                );
                const mrpVal = Number(p.mrp || p.price || 0);
                const sellingVal = Number(p.price || 0);
                const hasConcession = mrpVal > sellingVal;

                return (
                  <div
                    key={p.id}
                    className={`flex flex-col justify-between p-3.5 rounded-2xl border text-left transition-all shadow-sm ${isExpired
                      ? 'bg-rose-950/20 border-rose-900/50 text-slate-500 opacity-75'
                      : isOutOfStock
                        ? 'bg-slate-950/40 border-slate-900 text-slate-600 opacity-60'
                        : 'bg-slate-800/40 border-slate-800/90 hover:border-sky-500/50 hover:bg-slate-800/70'
                      }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5 flex-wrap">
                        <span className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-400 border border-sky-500/20 truncate max-w-[130px]">
                          {p.category}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${isExpired
                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                            : isOutOfStock
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : availStock <= 15
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}>
                            Stk: {availStock}
                          </span>
                          <span className="text-[9px] uppercase font-bold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                            {p.quantity_type}
                          </span>
                        </div>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-snug">
                        {p.name}
                      </h4>
                      {p.expiry_date && (
                        <span className={`text-[9px] font-mono mt-1 block ${isExpired ? 'text-rose-400 font-bold' : 'text-slate-500'}`}>
                          Exp: {String(p.expiry_date).substring(0, 10)} {isExpired ? '(EXPIRED)' : ''}
                        </span>
                      )}
                    </div>

                    <div className="flex items-end justify-between mt-3 pt-2.5 border-t border-slate-800/70">
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-sm font-bold font-mono text-emerald-400 leading-none">
                            ₹{sellingVal.toFixed(2)}
                          </span>
                          {hasConcession && (
                            <span className="text-[10px] text-slate-400 line-through font-mono">
                              MRP ₹{mrpVal.toFixed(2)}
                            </span>
                          )}
                        </div>
                        {hasConcession && (
                          <span className="text-[9px] font-bold text-emerald-400/90 mt-0.5">
                            Save ₹{(mrpVal - sellingVal).toFixed(2)}
                          </span>
                        )}
                        <span className="text-[8.5px] text-amber-400/80 font-medium">
                          {p.tax_percent}% GST
                        </span>
                      </div>

                      <button
                        onClick={() => addItemToBill(p, 1)}
                        disabled={isExpired || isOutOfStock}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1 active:scale-95 transition-all ${isExpired
                          ? 'bg-rose-950/40 text-rose-400 border border-rose-800/80 cursor-not-allowed text-[10px]'
                          : isOutOfStock
                            ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed text-[10px]'
                            : 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md shadow-sky-500/20 font-black'
                          }`}
                      >
                        {isExpired ? (
                          <span>Expired</span>
                        ) : isOutOfStock ? (
                          <span>Out of Stock</span>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5 mr-0.5 stroke-[3]" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              }))}
          </div>
        </section>

        {/* === CENTER PANEL: Current Active Ticket Details === */}
        <section className={`flex flex-col w-full lg:flex-1 bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden ${mobileTab === 'ticket' ? 'flex flex-1' : 'hidden lg:flex'}`}>

          {/* Header & Scanning Bar */}
          <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 bg-slate-800 rounded text-xs font-bold text-bakery-400 border border-slate-700">
                Bill #{activeSession?.billNumber || 0}
              </span>
              {activeSession?.holdStatus && (
                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded text-xs font-bold border border-amber-500/30">
                  HOLD
                </span>
              )}
            </div>

            {/* Smart barcode search bar with inline dropdown */}
            <div className="relative flex-1 max-w-md">
              <form onSubmit={handleBarcodeSubmit}>
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchSelectedIndex(0);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 120)}
                  placeholder="Scan barcode or type to search... [F2]"
                  className="w-full pl-9 pr-8 py-1.5 bg-slate-950 border border-slate-800 text-xs rounded-md placeholder-slate-500 text-slate-200 focus:border-bakery-500 focus:outline-none transition-colors"
                  autoComplete="off"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setIsSearchFocused(false); barcodeInputRef.current?.focus(); }}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </form>

              {/* Inline Dropdown Suggestions */}
              {isSearchFocused && filteredSearchProducts.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl shadow-slate-950/80 z-50 overflow-hidden max-h-72 overflow-y-auto">
                  {/* Hint row */}
                  <div className="px-3 py-1.5 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{filteredSearchProducts.length} match{filteredSearchProducts.length !== 1 ? 'es' : ''} found</span>
                    <span className="text-[9px] text-slate-600">↑↓ Navigate · Enter to add</span>
                  </div>
                  {filteredSearchProducts.map((p, idx) => {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const isExp = Boolean(p.status === 'Expired' || p.is_expired || (p.expiry_date && String(p.expiry_date).substring(0, 10) <= todayStr));
                    const isOos = Boolean(p.status === 'Out of Stock' || p.is_out_of_stock || (p.available_stock !== undefined && p.available_stock <= 0));
                    const mrpVal = Number(p.mrp || p.price || 0);
                    const sellingVal = Number(p.price || 0);

                    return (
                      <div
                        key={p.id}
                        onMouseDown={(e) => {
                          e.preventDefault(); // prevent blur before click fires
                          if (!isExp && !isOos) {
                            addItemToBill(p, 1);
                            setSearchQuery('');
                            setIsSearchFocused(false);
                            setSearchSelectedIndex(0);
                            setTimeout(() => barcodeInputRef.current?.focus(), 20);
                          } else {
                            addItemToBill(p, 1); // will trigger statutory guardrail toast
                          }
                        }}
                        onMouseEnter={() => setSearchSelectedIndex(idx)}
                        className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors ${isExp || isOos
                          ? 'opacity-60 bg-slate-950/40 hover:bg-slate-900 border-l-2 border-rose-500/40'
                          : searchSelectedIndex === idx
                            ? 'bg-bakery-500/20 border-l-2 border-bakery-500'
                            : 'hover:bg-slate-800 border-l-2 border-transparent'
                          }`}
                      >
                        <div className="flex flex-col min-w-0">
                          <span className={`text-xs font-semibold truncate ${isExp ? 'text-rose-400 line-through' : (isOos ? 'text-slate-400' : (searchSelectedIndex === idx ? 'text-bakery-300' : 'text-slate-200'))
                            }`}>
                            {p.name}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                            <span>{p.category}</span>
                            <span className={`px-1 py-0.2 rounded font-mono ${isExp ? 'text-rose-400 bg-rose-500/10' : (isOos ? 'text-rose-400 bg-rose-500/10' : 'text-emerald-400 bg-emerald-500/10')}`}>
                              Stk: {p.available_stock ?? (isOos ? 0 : 50)}
                            </span>
                            {isExp && <span className="text-rose-400 font-bold uppercase text-[9px]">(Expired)</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                          <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono uppercase">{p.quantity_type}</span>
                          <div className="flex flex-col items-end">
                            <span className={`text-xs font-bold font-mono ${searchSelectedIndex === idx ? 'text-emerald-300' : 'text-emerald-400'}`}>
                              ₹{sellingVal.toFixed(2)}
                            </span>
                            {mrpVal > sellingVal && (
                              <span className="text-[9px] text-slate-400 line-through font-mono">
                                MRP ₹{mrpVal.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>


          {/* Ticket Items View: Cards on Mobile, Table on Desktop */}
          <div className="flex-1 overflow-y-auto p-3">
            {activeSession && activeSession.items.length > 0 ? (
              <>
                {/* Mobile Touch-Friendly Card List */}
                <div className="flex flex-col gap-2.5 lg:hidden">
                  {activeSession.items.map((item, idx) => (
                    <div
                      key={item.product_id}
                      className="p-3.5 bg-slate-800/60 border border-slate-700/80 rounded-2xl flex flex-col gap-2.5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-white block leading-snug">
                            {item.product_name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                            ₹{item.rate.toFixed(2)} / unit {item.tax_percent > 0 ? `· ${item.tax_percent}% GST` : ''}
                          </span>
                        </div>
                        <button
                          onClick={() => deleteItemFromBill(idx)}
                          className="p-2 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl transition-colors active:scale-90"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                        {/* Stepper with touch-friendly 36px buttons */}
                        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl overflow-hidden p-0.5">
                          <button
                            onClick={() => updateItemQuantity(idx, Math.max(1, item.quantity - 1))}
                            className="w-9 h-9 flex items-center justify-center bg-slate-800 hover:bg-slate-700 active:scale-90 text-white font-black rounded-lg text-sm"
                          >
                            -
                          </button>
                          <span className="w-10 text-center font-mono font-bold text-sm text-sky-400">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateItemQuantity(idx, item.quantity + 1)}
                            className="w-9 h-9 flex items-center justify-center bg-slate-800 hover:bg-slate-700 active:scale-90 text-white font-black rounded-lg text-sm"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block leading-none">Total</span>
                          <span className="text-sm font-bold font-mono text-emerald-400">
                            ₹{item.total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop High-Speed Table */}
                <table className="hidden lg:table w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800 pb-2">
                      <th className="py-2">Product Name</th>
                      <th className="py-2 text-right">Qty</th>
                      <th className="py-2 text-right">Price</th>
                      <th className="py-2 text-right">Total</th>
                      <th className="py-2 text-center w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSession.items.map((item, idx) => (
                      <tr
                        key={item.product_id}
                        onClick={() => {
                          setSessions(prev => prev.map(s => {
                            if (s.id !== activeSessionId) return s;
                            return { ...s, selectedItemIndex: idx };
                          }));
                        }}
                        className={`text-xs border-b border-slate-800/40 hover:bg-slate-800/20 cursor-pointer ${activeSession.selectedItemIndex === idx ? 'bg-slate-800/40' : ''
                          }`}
                      >
                        <td className="py-2.5 font-semibold text-white">{item.product_name}</td>
                        <td className="py-2.5 text-right">
                          <input
                            type="number"
                            value={item.quantity}
                            min="1"
                            onChange={(e) => updateItemQuantity(idx, Number(e.target.value))}
                            className="w-12 px-1 py-0.5 bg-slate-950 border border-slate-800 text-right font-mono rounded text-slate-200 focus:border-sky-500"
                          />
                        </td>
                        <td className="py-2.5 text-right font-mono text-slate-400">₹{item.rate.toFixed(2)}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-emerald-400">₹{item.total.toFixed(2)}</td>
                        <td className="py-2.5 text-center">
                          <button
                            onClick={() => deleteItemFromBill(idx)}
                            className="p-1 hover:bg-slate-800 text-slate-500 hover:text-rose-400 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2 p-6 text-center">
                <ShoppingBag className="w-12 h-12 stroke-[1.2] text-slate-700" />
                <span className="text-sm font-semibold text-slate-400">Active bill is currently empty</span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-600">Select medicines from catalogue or scan barcode</span>
              </div>
            )}
          </div>

          {/* Ticket Summary Calculations Footer */}
          <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-4">

              {/* Discount inputs */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Discount (%)</label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleSetDiscount(5)}
                      className={`px-2 py-0.5 rounded text-[10px] font-black transition-all ${activeSession?.discountPercent === 5 ? 'bg-amber-500 text-slate-950 shadow-md ring-1 ring-amber-400' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                      title="Set 5% persistent discount on all bills"
                    >
                      5%
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetDiscount(10)}
                      className={`px-2 py-0.5 rounded text-[10px] font-black transition-all ${activeSession?.discountPercent === 10 ? 'bg-amber-500 text-slate-950 shadow-md ring-1 ring-amber-400' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                      title="Set 10% persistent discount on all bills"
                    >
                      10%
                    </button>
                    {(activeSession?.discountPercent || 0) > 0 && (
                      <button
                        type="button"
                        onClick={() => handleSetDiscount(0)}
                        className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800/80 text-slate-400 hover:text-rose-400"
                        title="Clear discount (0%)"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                <input
                  id="discount-input"
                  type="number"
                  placeholder="0"
                  value={activeSession?.discountPercent ? activeSession.discountPercent : ''}
                  onChange={(e) => {
                    const percent = Math.min(100, Math.max(0, Number(e.target.value)));
                    handleSetDiscount(percent);
                  }}
                  className="px-2 py-1 bg-slate-950 border border-slate-800 text-xs rounded text-slate-200"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Discount Amount (₹)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={activeSession?.discountAmount || ''}
                  onChange={(e) => {
                    const amt = Math.max(0, Number(e.target.value));
                    setSessions(prev => prev.map(s => {
                      if (s.id !== activeSessionId) return s;
                      return { ...s, discountAmount: amt, discountPercent: 0 };
                    }));
                  }}
                  className="px-2 py-1 bg-slate-950 border border-slate-800 text-xs rounded text-slate-200"
                />
              </div>

              {/* Quick totals list with GST breakdown */}
              <div className="flex flex-col justify-end text-right font-mono text-xs text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal (excl. GST):</span>
                  <span>₹{billSummary.subtotal.toFixed(2)}</span>
                </div>
                {billSummary.discount > 0 && (
                  <div className="flex justify-between text-rose-400">
                    <span>Discount:</span>
                    <span>-₹{billSummary.discount.toFixed(2)}</span>
                  </div>
                )}
                {billSummary.tax > 0 && (
                  <>
                    <div className="flex justify-between text-amber-400">
                      <span>CGST:</span>
                      <span>+₹{(billSummary.cgst || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-amber-400">
                      <span>SGST:</span>
                      <span>+₹{(billSummary.sgst || 0).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Total Balance Actions panel */}
            <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 mt-1">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block leading-none">Total (incl. GST)</span>
                <span className="text-2xl font-bold font-mono text-emerald-400">₹{billSummary.grandTotal.toFixed(2)}</span>
                {billSummary.tax > 0 && <span className="text-[10px] text-amber-400 font-mono block">GST: ₹{billSummary.tax.toFixed(2)}</span>}
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={toggleHold}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-xs font-bold rounded-lg border border-slate-700 text-slate-200"
                >
                  Hold Bill [F5]
                </button>
                <button
                  onClick={() => {
                    if (activeSession && activeSession.items.length > 0) {
                      setShowPaymentModal(true);
                      setTimeout(() => paymentCashInputRef.current?.focus(), 150);
                    } else {
                      showToast("Active bill is empty.", "error");
                    }
                  }}
                  className="px-5 py-2 bg-bakery-500 text-slate-950 hover:bg-bakery-400 active:scale-95 transition-all text-xs font-black rounded-lg shadow-lg shadow-bakery-500/20"
                >
                  Pay & Print [F7]
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* === RIGHT PANEL: Active Customer Sessions List / Queue === */}
        <section className={`flex flex-col w-full lg:w-3/12 bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden ${mobileTab === 'queue' ? 'flex flex-1' : 'hidden lg:flex'}`}>
          <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">Active Queue</span>
            <button
              onClick={createNewBill}
              className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-700/60"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {sessions.map((sess, idx) => {
              // Calculate ticket total
              let sub = 0;
              let tx = 0;
              sess.items.forEach(item => {
                sub = round2(sub + round2(item.rate * item.quantity));
                // tax calculation disabled (tax_percent set to 0)
              });
              const disc = round2(sess.discountAmount > 0 ? sess.discountAmount : (sub * (sess.discountPercent / 100)));
              const total = Math.max(0, round2(sub + tx - disc));

              const isActive = sess.id === activeSessionId;

              return (
                <div
                  key={sess.id}
                  onClick={() => {
                    setActiveSessionId(sess.id);
                    barcodeInputRef.current?.focus();
                  }}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all relative flex flex-col gap-1.5 ${isActive
                    ? 'bg-slate-800 border-bakery-500 shadow-md shadow-bakery-500/5'
                    : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isActive ? 'text-sky-400' : 'text-slate-400'}`}>
                      Rx #{sess.billNumber}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeSession(sess.id);
                      }}
                      className="p-0.5 hover:bg-slate-700 rounded text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-slate-400 font-mono">
                      {sess.items.length} {sess.items.length === 1 ? 'item' : 'items'}
                    </span>
                    <span className="text-xs font-bold font-mono text-emerald-400">
                      ₹{total.toFixed(2)}
                    </span>
                  </div>

                  {/* Status badges */}
                  <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-slate-800/80">
                    <div className="flex items-center space-x-1">
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-900 px-1 py-0.5 rounded font-mono">
                        ALT+{idx + 1}
                      </span>
                      {sess.holdStatus && (
                        <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/20">
                          HOLD
                        </span>
                      )}
                    </div>
                    {isActive && (
                      <span className="text-[9px] uppercase font-extrabold text-sky-400 tracking-wider">ACTIVE</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-slate-950 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono flex flex-col gap-1">
            <div className="flex justify-between">
              <span>F1: New Bill</span>
              <span>ALT + X: Close Tab</span>
            </div>
            <div className="flex justify-between">
              <span>ALT + [1-9]: Switch Tab</span>
              <span>F5: Toggle Hold</span>
            </div>
          </div>
        </section>

      </main>

      {/* ----------------- DESKTOP DEVELOPER COPYRIGHT FOOTER ----------------- */}
      <footer className="hidden lg:flex items-center justify-between px-5 py-1 bg-slate-900/95 border-t border-slate-800/90 text-[10px] text-slate-400 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300">Clinical &amp; Pharmacy POS Suite v1.0.0</span>
          <span className="text-slate-600">•</span>
          <span>TNCEA &amp; D&amp;C Compliant Architecture</span>
        </div>
        <div>
          &copy; 2026 <span className="font-bold text-sky-400">RegulaVitae</span>. All Rights Reserved &nbsp;·&nbsp; Developed by <span className="font-semibold text-slate-200">RegulaVitae</span>
        </div>
      </footer>

      {/* ----------------- MOBILE BOTTOM TAB NAVIGATION BAR (CLEAN & SPACIOUS) ----------------- */}
      <nav aria-label="Mobile Navigation" className="lg:hidden flex items-center justify-around bg-slate-900/95 backdrop-blur-md border-t border-slate-800/90 py-2.5 px-4 shadow-2xl flex-shrink-0 z-40">
        <button
          onClick={() => setMobileTab('menu')}
          className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all active:scale-95 ${mobileTab === 'menu'
            ? 'text-sky-400 font-bold bg-sky-500/10'
            : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[11px] font-semibold tracking-wide">Catalogue</span>
        </button>

        <button
          onClick={() => setMobileTab('ticket')}
          className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all relative active:scale-95 ${mobileTab === 'ticket'
            ? 'text-sky-400 font-bold bg-sky-500/10'
            : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          <CreditCard className="w-5 h-5" />
          <span className="text-[11px] font-semibold tracking-wide">Current Bill</span>
          {activeSession && activeSession.items.length > 0 && (
            <span className="absolute -top-0.5 right-1.5 bg-sky-500 text-slate-950 text-[10px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-sm">
              {activeSession.items.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setMobileTab('queue')}
          className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all relative active:scale-95 ${mobileTab === 'queue'
            ? 'text-sky-400 font-bold bg-sky-500/10'
            : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[11px] font-semibold tracking-wide">Queue</span>
          {sessions.length > 0 && (
            <span className="absolute -top-0.5 right-1.5 bg-slate-700 text-slate-200 text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-sm">
              {sessions.length}
            </span>
          )}
        </button>
      </nav>

      {/* ----------------- SMART FUZZY PRODUCT SEARCH SEARCH MODAL ----------------- */}
      {showSearchModal && filteredSearchProducts.length > 0 && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-xl shadow-2xl flex flex-col max-h-[500px]">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
              <span className="text-sm font-bold text-white flex items-center">
                <Search className="w-4 h-4 mr-2 text-bakery-400" />
                Product Search Suggestions
              </span>
              <button
                onClick={() => setShowSearchModal(false)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredSearchProducts.map((p, idx) => {
                const todayStr = new Date().toISOString().split('T')[0];
                const isExp = Boolean(p.status === 'Expired' || p.is_expired || (p.expiry_date && String(p.expiry_date).substring(0, 10) <= todayStr));
                const isOos = Boolean(p.status === 'Out of Stock' || p.is_out_of_stock || (p.available_stock !== undefined && p.available_stock <= 0));
                const mrpVal = Number(p.mrp || p.price || 0);
                const sellingVal = Number(p.price || 0);

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      addItemToBill(p, 1);
                      if (!isExp && !isOos) {
                        setShowSearchModal(false);
                        setSearchQuery('');
                      }
                    }}
                    className={`p-3 rounded-lg flex items-center justify-between cursor-pointer border ${isExp || isOos
                      ? 'bg-slate-950/40 border-rose-500/30 opacity-60'
                      : searchSelectedIndex === idx
                        ? 'bg-slate-800 border-bakery-500'
                        : 'bg-slate-950/20 border-transparent hover:bg-slate-800'
                      }`}
                  >
                    <div>
                      <span className={`text-xs font-bold block ${isExp ? 'text-rose-400 line-through' : 'text-white'}`}>
                        {p.name}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-500 uppercase">{p.category}</span>
                        <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${isExp ? 'text-rose-400 bg-rose-500/10' : (isOos ? 'text-rose-400 bg-rose-500/10' : 'text-emerald-400 bg-emerald-500/10')}`}>
                          Stk: {p.available_stock ?? (isOos ? 0 : 50)}
                        </span>
                        {isExp && <span className="text-[9px] text-rose-400 font-bold uppercase">(Expired)</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-400 block font-mono">₹{sellingVal.toFixed(2)}</span>
                      {mrpVal > sellingVal && (
                        <span className="text-[9px] text-slate-400 line-through font-mono block">MRP ₹{mrpVal.toFixed(2)}</span>
                      )}
                      <span className="text-[9px] px-1 bg-slate-800 rounded text-slate-400 uppercase font-semibold">{p.quantity_type}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-slate-950 text-[10px] text-slate-500 font-mono flex justify-between border-t border-slate-800">
              <span>ENTER: Add Selected Item</span>
              <span>ESC: Cancel Search</span>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- DETAILED PAYMENT METHOD MODAL ----------------- */}
      {showPaymentModal && activeSession && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-white leading-tight">Billing Checkout & Dispensing</h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      Bill #{activeSession.billNumber}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {activeSession.items.length} Item(s)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">Statutory dispensing compliance & financial settlement</p>
                </div>
              </div>

              {/* Operating Mode Selector in Header */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-950 p-1 border border-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setOperatingMode('CLINIC_DISPENSING')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${operatingMode === 'CLINIC_DISPENSING'
                      ? 'bg-sky-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Mode A: Clinic OP</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOperatingMode('RETAIL_PHARMACY')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${operatingMode === 'RETAIL_PHARMACY'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Mode B: Retail Rx</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: 2-Column Responsive Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">

              {/* LEFT COLUMN (7 COLS): Clinical Governance, CDS Alerts, Patient & Prescriber Data */}
              <div className="lg:col-span-7 flex flex-col gap-4">

                {/* CDS Clinical Decision Support Alert Card */}
                {clinicalAlerts.alerts && clinicalAlerts.alerts.length > 0 && (
                  <div className="p-4 bg-slate-950 border border-rose-900/80 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-rose-400 text-xs">
                        <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
                        <span>Clinical Decision Support (CDS) Alerts ({clinicalAlerts.alerts.length})</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-rose-950 text-rose-300 border border-rose-800">
                        Attention Required
                      </span>
                    </div>

                    <div className="space-y-2">
                      {clinicalAlerts.alerts.map((alert, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border text-xs leading-relaxed ${alert.severity === 'CRITICAL'
                            ? 'bg-rose-950/60 border-rose-800/80 text-rose-200'
                            : 'bg-amber-950/60 border-amber-800/80 text-amber-200'
                            }`}
                        >
                          <div className="font-bold flex items-center justify-between text-[11px]">
                            <span>{alert.title}</span>
                            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold bg-slate-900/80">
                              {alert.severity}
                            </span>
                          </div>
                          <div className="mt-1 text-slate-300 text-[11px]">{alert.message}</div>
                          <div className="text-[10px] text-sky-300 mt-1.5 font-medium flex items-center gap-1">
                            <span className="font-bold">Recommendation:</span> {alert.recommendation}
                          </div>
                        </div>
                      ))}
                    </div>

                    {clinicalAlerts.critical && clinicalAlerts.critical.length > 0 && (
                      <div className="pt-3 border-t border-rose-900/60">
                        <label className="text-[11px] font-bold text-rose-300 uppercase block mb-1.5">
                          Clinical Override Rationale * (Mandatory for Contraindications)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Post-operative acute refractory flare under close clinical monitoring"
                          value={cdsOverrideReason}
                          onChange={(e) => setCdsOverrideReason(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-rose-700/80 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-rose-400 font-medium"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Patient & Prescriber Statutory Details Card */}
                <div className="p-4 bg-slate-950/80 border border-slate-800/90 rounded-2xl flex flex-col gap-3.5">
                  <div className="flex justify-between items-center border-b border-slate-800/80 pb-2.5">
                    <span className="font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wide text-xs">
                      <FileText className="w-4 h-4 text-sky-400" />
                      Patient & Prescription Record (Rule 65 / TNCEA 1997)
                    </span>
                    {activeSession.items.some(it => String(it.schedule || '').toUpperCase().includes('SCHEDULE')) ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-950 text-red-300 border border-red-700/60 animate-pulse">
                        Schedule H / H1 Rx Mandatory
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] text-slate-400 bg-slate-900 border border-slate-800">
                        Retail Cash Memo
                      </span>
                    )}
                  </div>

                  {/* Mode A (Clinic Dispensing) Specific Box */}
                  {operatingMode === 'CLINIC_DISPENSING' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-sky-950/30 rounded-xl border border-sky-900/50">
                      <div>
                        <label className="text-[10px] font-bold text-sky-300 uppercase block mb-1">Clinic Patient MRN / ID *</label>
                        <input
                          type="text"
                          placeholder="e.g. MOC-2026-0042"
                          value={clinicPatientId}
                          onChange={(e) => setClinicPatientId(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-sky-700 rounded-lg text-sky-200 font-mono text-xs focus:outline-none focus:border-sky-400 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-sky-300 uppercase block mb-1">Dispensing Mode</label>
                        <select
                          value={dispensingMode}
                          onChange={(e: any) => setDispensingMode(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-sky-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-sky-400"
                        >
                          <option value="Attached Pharmacist">Attached Pharmacist</option>
                          <option value="Doctor Direct Dispensing">Doctor Direct Dispensing</option>
                          <option value="Doctor Direct Supervision">Doctor Direct Supervision</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Patient Lookup & Disambiguation Selector */}
                  <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        Patient Database Lookup & Name Disambiguation
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          fetchPatients();
                          setShowPatientsModal(true);
                        }}
                        className="text-[10px] text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Register New Patient
                      </button>
                    </div>

                    <div className="relative">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder="Type name, phone, MRN, or click browse dropdown..."
                            value={patientSearchQuery}
                            onChange={(e) => {
                              setPatientSearchQuery(e.target.value);
                              setIsPatientDropdownOpen(true);
                            }}
                            onFocus={() => {
                              fetchPatients();
                              setIsPatientDropdownOpen(true);
                            }}
                            className="w-full pl-8 pr-9 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-medium"
                          />
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                          <button
                            type="button"
                            onClick={() => {
                              fetchPatients();
                              setIsPatientDropdownOpen(!isPatientDropdownOpen);
                            }}
                            className="absolute right-2 top-2 p-0.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                            title="Toggle patients list"
                          >
                            <ChevronDown className={`w-4 h-4 transition-transform ${isPatientDropdownOpen ? 'rotate-180 text-sky-400' : ''}`} />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            fetchPatients();
                            setIsPatientDropdownOpen(!isPatientDropdownOpen);
                          }}
                          className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold flex items-center gap-1 border border-slate-700 shrink-0"
                          title="Click to view all patients"
                        >
                          <Users className="w-3 h-3 text-sky-400" />
                          <span>All Patients ({patientsList.length})</span>
                        </button>
                        {selectedPatientObj && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPatientObj(null);
                              setPatientSearchQuery('');
                              setPatientAllergyAlert(null);
                              setCheckoutPatientName('');
                              setCheckoutPatientPhone('');
                              setCheckoutPatientAge('');
                              setClinicPatientId('');
                            }}
                            className="px-2 py-2 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-slate-700"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {/* Disambiguation Dropdown Menu */}
                      {isPatientDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto">
                          <div className="p-1.5 bg-slate-950/80 border-b border-slate-800 text-[10px] font-bold uppercase text-slate-400 px-3 flex justify-between items-center">
                            <span>Registered Patient Directory ({patientsList.length})</span>
                            <span className="text-[9px] text-sky-400 font-mono">Select to autofill patient & doctor</span>
                          </div>

                          {patientsList.filter((p: any) => {
                            if (!patientSearchQuery || patientSearchQuery.trim() === '') return true;
                            const q = patientSearchQuery.toLowerCase();
                            return (
                              (p.name || '').toLowerCase().includes(q) ||
                              (p.patient_id || '').toLowerCase().includes(q) ||
                              (p.phone || '').includes(q) ||
                              (p.guardian_name || '').toLowerCase().includes(q) ||
                              (p.city || '').toLowerCase().includes(q) ||
                              (p.attending_doctor || '').toLowerCase().includes(q)
                            );
                          }).length === 0 ? (
                            <div className="p-3 text-xs text-slate-400 text-center">
                              No matching registered patient found. You can enter details manually below or click "+ Register New Patient".
                            </div>
                          ) : (
                            patientsList.filter((p: any) => {
                              if (!patientSearchQuery || patientSearchQuery.trim() === '') return true;
                              const q = patientSearchQuery.toLowerCase();
                              return (
                                (p.name || '').toLowerCase().includes(q) ||
                                (p.patient_id || '').toLowerCase().includes(q) ||
                                (p.phone || '').includes(q) ||
                                (p.guardian_name || '').toLowerCase().includes(q) ||
                                (p.city || '').toLowerCase().includes(q) ||
                                (p.attending_doctor || '').toLowerCase().includes(q)
                              );
                            }).map((p: any) => (
                              <div
                                key={p.id || p.patient_id}
                                onClick={() => selectPatientInCheckout(p)}
                                className="p-2.5 hover:bg-slate-800/90 border-b border-slate-800 cursor-pointer transition-colors flex items-center justify-between gap-2"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-white text-xs">{p.name}</span>
                                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-sky-950 text-sky-300 border border-sky-800 rounded">
                                      {p.patient_id}
                                    </span>
                                    {p.gender && (
                                      <span className="text-[10px] text-slate-400">
                                        {p.gender}, {p.age ? `${p.age}y` : ''}
                                      </span>
                                    )}
                                    {p.is_example ? (
                                      <span className="text-[8px] font-bold uppercase px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                        Example
                                      </span>
                                    ) : null}
                                  </div>
                                  <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                                    {p.guardian_name && <span className="text-slate-300 font-semibold">{p.guardian_name}</span>}
                                    {p.phone && <span>📞 {p.phone}</span>}
                                    {p.city && <span>📍 {p.city}</span>}
                                    {p.attending_doctor && <span className="text-sky-300">👨‍⚕️ {p.attending_doctor}</span>}
                                    {p.known_allergies && p.known_allergies.toLowerCase() !== 'none reported' && (
                                      <span className="text-rose-400 font-semibold bg-rose-950/60 px-1 rounded">
                                        ⚠️ Allergy: {p.known_allergies}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <span className="text-[10px] font-semibold text-sky-400 shrink-0">
                                  Select →
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Active Patient Disambiguation Details Card */}
                    {selectedPatientObj && (
                      <div className="p-2.5 bg-sky-950/20 border border-sky-800/40 rounded-lg text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sky-300">
                            Selected: {selectedPatientObj.name} ({selectedPatientObj.patient_id})
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {selectedPatientObj.guardian_name || ''}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300 flex items-center gap-3 flex-wrap">
                          <span>Age: {selectedPatientObj.age} ({selectedPatientObj.gender})</span>
                          <span>Phone: {selectedPatientObj.phone}</span>
                          <span>Area: {selectedPatientObj.city || selectedPatientObj.address}</span>
                          {selectedPatientObj.blood_group && <span>Blood: {selectedPatientObj.blood_group}</span>}
                          {selectedPatientObj.attending_doctor && <span>Doctor: {selectedPatientObj.attending_doctor}</span>}
                        </div>
                      </div>
                    )}

                    {/* Patient Allergy Warning Banner */}
                    {patientAllergyAlert && (
                      <div className="p-2.5 bg-rose-950/70 border border-rose-700 rounded-lg text-xs text-rose-200 font-bold flex items-center gap-2 animate-pulse">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{patientAllergyAlert}</span>
                      </div>
                    )}
                  </div>

                  {/* Patient Info Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                    <div className="sm:col-span-6">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Patient Full Name (Optional - Walk-in)</label>
                      <input
                        type="text"
                        placeholder="e.g. K. Ramesh"
                        value={checkoutPatientName}
                        onChange={(e) => setCheckoutPatientName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-sky-500 font-medium"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Age</label>
                      <input
                        type="number"
                        placeholder="45"
                        value={checkoutPatientAge}
                        onChange={(e) => setCheckoutPatientAge(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Gender</label>
                      <select
                        value={checkoutPatientGender}
                        onChange={(e) => setCheckoutPatientGender(e.target.value)}
                        className="w-full px-2 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-sky-500"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="sm:col-span-6">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Contact Phone Number</label>
                      <input
                        type="tel"
                        placeholder="+91 98401 XXXXX"
                        value={checkoutPatientPhone}
                        onChange={(e) => setCheckoutPatientPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-sky-500 font-mono"
                      />
                    </div>

                    <div className="sm:col-span-6">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Patient Address / Locality</label>
                      <input
                        type="text"
                        placeholder="e.g. Anna Nagar, Chennai"
                        value={checkoutPatientAddress}
                        onChange={(e) => setCheckoutPatientAddress(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-sky-500 font-medium"
                      />
                    </div>

                    {/* Prescribing Doctor Dropdown Combo Box */}
                    <div className="sm:col-span-12 p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5" />
                          Prescribing Doctor & Medical Council Registration *
                        </label>
                        {selectedDoctorObj ? (
                          <span className="text-[9px] text-sky-300 font-mono font-bold bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800">
                            {selectedDoctorObj.specialty}
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-500 font-mono">TNMC / National Medical Commission</span>
                        )}
                      </div>

                      <div className="relative">
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              placeholder="Search or select doctor (e.g. Dr. Arjun Sharma, TNMC/2012)..."
                              value={doctorSearchQuery || checkoutDoctorName}
                              onChange={(e) => {
                                setDoctorSearchQuery(e.target.value);
                                setCheckoutDoctorName(e.target.value);
                                setIsDoctorDropdownOpen(true);
                              }}
                              onFocus={() => setIsDoctorDropdownOpen(true)}
                              className="w-full pl-8 pr-9 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-medium"
                            />
                            <Stethoscope className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                            <button
                              type="button"
                              onClick={() => setIsDoctorDropdownOpen(!isDoctorDropdownOpen)}
                              className="absolute right-2 top-2 p-0.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                              title="Toggle clinic doctors list"
                            >
                              <ChevronDown className={`w-4 h-4 transition-transform ${isDoctorDropdownOpen ? 'rotate-180 text-sky-400' : ''}`} />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => setIsDoctorDropdownOpen(!isDoctorDropdownOpen)}
                            className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold flex items-center gap-1 border border-slate-700 shrink-0"
                          >
                            <Users className="w-3 h-3 text-sky-400" />
                            <span>Clinic Doctors ({CLINIC_DOCTORS.length})</span>
                          </button>
                        </div>

                        {/* Prescribing Doctor Dropdown Menu */}
                        {isDoctorDropdownOpen && (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto">
                            <div className="p-1.5 bg-slate-950/80 border-b border-slate-800 text-[10px] font-bold uppercase text-slate-400 px-3 flex justify-between items-center">
                              <span>Clinic Doctors Directory</span>
                              <span className="text-[9px] text-sky-400 font-mono">Select to autofill TNMC Reg</span>
                            </div>

                            {CLINIC_DOCTORS.filter(d => {
                              const q = (doctorSearchQuery || checkoutDoctorName || '').toLowerCase().trim();
                              if (!q) return true;
                              return (
                                d.name.toLowerCase().includes(q) ||
                                d.reg_no.toLowerCase().includes(q) ||
                                d.specialty.toLowerCase().includes(q) ||
                                d.degrees.toLowerCase().includes(q)
                              );
                            }).map((d, dIdx) => (
                              <div
                                key={dIdx}
                                onClick={() => selectDoctorInCheckout(d)}
                                className="p-2.5 hover:bg-slate-800/90 border-b border-slate-800/60 cursor-pointer transition-colors flex items-center justify-between gap-2"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-white text-xs">{d.name}</span>
                                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-sky-950 text-sky-300 border border-sky-800 rounded font-bold">
                                      {d.reg_no}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                                    <span className="text-slate-300 font-medium">{d.specialty}</span>
                                    <span>·</span>
                                    <span className="text-slate-400 font-mono">{d.degrees}</span>
                                  </div>
                                </div>
                                <span className="text-[10px] font-semibold text-sky-400 shrink-0">
                                  Select →
                                </span>
                              </div>
                            ))}

                            {/* Outside Doctor Option */}
                            <div
                              onClick={() => {
                                setIsDoctorDropdownOpen(false);
                                setDoctorSearchQuery('');
                              }}
                              className="p-2.5 hover:bg-slate-800/80 cursor-pointer text-xs text-slate-400 hover:text-white flex items-center gap-2 border-t border-slate-800 bg-slate-950/40"
                            >
                              <Plus className="w-3.5 h-3.5 text-sky-400" />
                              <span>External / Other Doctor (Type doctor name & TNMC reg manually)</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Doctor Details Summary Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Doctor Name *</label>
                          <input
                            type="text"
                            value={checkoutDoctorName}
                            onChange={(e) => setCheckoutDoctorName(e.target.value)}
                            placeholder="Dr. Arjun Sharma, MS (Ortho)"
                            className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-sky-500 font-medium"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Doctor TNMC / NMC Reg. No *</label>
                          <input
                            type="text"
                            value={checkoutDoctorRegNo}
                            onChange={(e) => setCheckoutDoctorRegNo(e.target.value)}
                            placeholder="TNMC/2012/94821"
                            className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-sky-400 font-mono text-xs focus:outline-none focus:border-sky-500 font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="sm:col-span-6">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Dispensing Pharmacist *</label>
                      <input
                        type="text"
                        value={checkoutPharmacistName}
                        onChange={(e) => setCheckoutPharmacistName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-sky-500 font-medium"
                      />
                    </div>

                    <div className="sm:col-span-6">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Pharmacist TNSPC Reg. No *</label>
                      <input
                        type="text"
                        value={checkoutPharmacistRegNo}
                        onChange={(e) => setCheckoutPharmacistRegNo(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-sky-400 font-mono text-xs focus:outline-none focus:border-sky-500 font-bold"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN (5 COLS): Financial Settlement, Grand Total, Tender & Payment Buttons */}
              <div className="lg:col-span-5 flex flex-col gap-4">

                {/* Admin Feature: Complimentary / Doctor Free Health Dispense Toggle */}
                {currentUser?.role === 'admin' && (
                  <div className="p-3 bg-slate-950 border border-amber-500/30 rounded-2xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">Free Health Dispense (₹0 Cost)</span>
                        <span className="text-[10px] text-slate-400">Doctor / Staff internal welfare</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextState = !isComplimentaryCheckout;
                        setIsComplimentaryCheckout(nextState);
                        if (nextState) {
                          setComplimentaryReason('Doctor / Staff Health Dispense');
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${isComplimentaryCheckout
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20 scale-105'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                        }`}
                    >
                      {isComplimentaryCheckout ? 'Active (₹0)' : 'Enable'}
                    </button>
                  </div>
                )}

                {/* Grand Total Summary Card */}
                <div className="p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl flex flex-col shadow-inner">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
                      {isComplimentaryCheckout ? 'Complimentary Dispense Valuation' : 'Grand Total Payable (incl. GST)'}
                    </span>
                    {isComplimentaryCheckout && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Zero Cost Dispense
                      </span>
                    )}
                  </div>
                  <div className="text-center my-2">
                    <span className={`text-4xl sm:text-5xl font-black font-mono tracking-tight ${isComplimentaryCheckout ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                      ₹{isComplimentaryCheckout ? '0.00' : billSummary.grandTotal.toFixed(2)}
                    </span>
                    {isComplimentaryCheckout && (
                      <div className="text-[10px] text-amber-300/80 font-mono mt-1">
                        (Inventory MRP: ₹{billSummary.grandTotal.toFixed(2)} · Absorbed as Clinic Health Cost)
                      </div>
                    )}
                  </div>

                  <div className="mt-2 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs font-mono">
                    <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800/60">
                      <span className="text-[10px] text-slate-400 block font-sans uppercase">Base</span>
                      <span className="text-slate-200 font-bold">₹{isComplimentaryCheckout ? '0.00' : billSummary.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800/60">
                      <span className="text-[10px] text-slate-400 block font-sans uppercase">GST</span>
                      <span className="text-amber-400 font-bold">₹{isComplimentaryCheckout ? '0.00' : billSummary.tax.toFixed(2)}</span>
                    </div>
                    <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800/60">
                      <span className="text-[10px] text-slate-400 block font-sans uppercase">{isComplimentaryCheckout ? 'Waived' : 'Disc'}</span>
                      <span className="text-rose-400 font-bold">₹{isComplimentaryCheckout ? billSummary.grandTotal.toFixed(2) : billSummary.discount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {isComplimentaryCheckout ? (
                  /* Complimentary Doctor/Staff Health Dispense Details & Trigger */
                  <div className="p-4 bg-amber-950/30 border border-amber-600/50 rounded-2xl flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-amber-200">Doctor / Staff Health Dispense</span>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-amber-300 uppercase block mb-1">Recipient (Doctor / Staff / Employee Name) *</label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. Meera Chandran / Nurse Ramesh"
                        value={complimentaryRecipient}
                        onChange={(e) => setComplimentaryRecipient(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-amber-600/60 rounded-xl text-amber-100 placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-amber-300 uppercase block mb-1">Clinical Health Purpose / Notes</label>
                      <input
                        type="text"
                        placeholder="e.g. Post-op joint recovery / Acute migraine relief / Staff health"
                        value={complimentaryReason}
                        onChange={(e) => setComplimentaryReason(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-amber-600/60 rounded-xl text-amber-100 placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400 font-medium"
                      />
                    </div>
                    <div className="p-2.5 bg-slate-950/60 rounded-xl border border-amber-700/30 text-[11px] text-amber-200/90 leading-relaxed">
                      <strong>Zero Cost Dispensing:</strong> No cost or money will be deducted or charged for this medicine. Only the available inventory quantity will decrease.
                    </div>

                    <button
                      type="button"
                      onClick={() => completeBilling('Complimentary')}
                      className="w-full py-4 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 mt-1"
                    >
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>Authorize Free Health Dispense (₹0.00 · Decrement Stock Only)</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Cash Tender & Change Due Calculator Card */}
                    <div className="p-4 bg-slate-950/80 border border-slate-800/90 rounded-2xl flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Cash Tendered by Customer (₹) *</span>
                        </label>
                        <span className="text-[9px] text-slate-500 font-mono">Mandatory for Cash Sale</span>
                      </div>

                      {/* Cash Tender Warning & Live Calculation (Integer-Paise Precision) */}
                      {(() => {
                        const parsedCash = parseFloat(cashReceived);
                        const payableAmt = round2(billSummary.grandTotal);
                        const payablePaise = toPaise(payableAmt);
                        const cashPaise = !isNaN(parsedCash) && Number.isFinite(parsedCash) ? toPaise(parsedCash) : 0;
                        const cashAmt = round2(parsedCash);
                        const isCashInvalid = isNaN(parsedCash) || cashPaise <= 0;
                        const isCashShort = !isNaN(parsedCash) && cashPaise > 0 && cashPaise < payablePaise;
                        const shortAmt = round2((payablePaise - (isNaN(parsedCash) ? 0 : cashPaise)) / 100);

                        return (
                          <div className="space-y-1.5">
                            {isCashShort && (
                              <div className="p-2.5 bg-rose-950/80 border border-rose-600 rounded-xl flex items-start gap-2 text-rose-200 animate-pulse">
                                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                                <div className="text-[11px] leading-tight">
                                  <span className="font-bold block text-rose-300">Insufficient Cash Tendered!</span>
                                  Received <span className="font-mono font-bold text-white">₹{cashAmt.toFixed(2)}</span> is less than payable <span className="font-mono font-bold text-white">₹{payableAmt.toFixed(2)}</span>. Customer is short by <span className="font-mono font-black text-rose-300 underline">₹{shortAmt.toFixed(2)}</span>. Please collect the remaining cash before dispensing.
                                </div>
                              </div>
                            )}
                            {isCashInvalid && (
                              <div className="p-2 bg-amber-950/40 border border-amber-700/50 rounded-xl flex items-center gap-2 text-amber-200 text-[10px]">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span>Enter exact or greater amount received from customer or use quick tender chips below.</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      <div className="relative">
                        <input
                          ref={paymentCashInputRef}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value)}
                          className={`w-full px-3 py-2 bg-slate-900 border rounded-xl text-lg font-bold font-mono focus:outline-none transition-colors ${!isNaN(parseFloat(cashReceived)) && toPaise(parseFloat(cashReceived)) >= toPaise(billSummary.grandTotal)
                            ? 'border-emerald-500/80 text-emerald-400 focus:border-emerald-400'
                            : !isNaN(parseFloat(cashReceived)) && toPaise(parseFloat(cashReceived)) > 0
                              ? 'border-rose-500/80 text-rose-400 focus:border-rose-400'
                              : 'border-slate-700 text-slate-100 focus:border-sky-500'
                            }`}
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-mono font-bold">INR (₹)</span>
                      </div>

                      {/* Quick Tender Preset Chips */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => setCashReceived(round2(billSummary.grandTotal).toFixed(2))}
                          className="px-2 py-1 bg-emerald-950/60 hover:bg-emerald-800/80 text-emerald-300 hover:text-white rounded-lg text-[10px] font-mono font-bold border border-emerald-600/50 transition-colors"
                          title="Set tender to exact grand total"
                        >
                          Exact (₹{round2(billSummary.grandTotal).toFixed(2)})
                        </button>
                        <button
                          type="button"
                          onClick={() => setCashReceived(String(Math.ceil(round2(billSummary.grandTotal) / 50) * 50))}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-mono border border-slate-700 transition-colors"
                        >
                          Next ₹50 (₹{Math.ceil(round2(billSummary.grandTotal) / 50) * 50})
                        </button>
                        <button
                          type="button"
                          onClick={() => setCashReceived(String(Math.ceil(round2(billSummary.grandTotal) / 100) * 100))}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-mono border border-slate-700 transition-colors"
                        >
                          Next ₹100 (₹{Math.ceil(round2(billSummary.grandTotal) / 100) * 100})
                        </button>
                        <button
                          type="button"
                          onClick={() => setCashReceived(String(Math.ceil(round2(billSummary.grandTotal) / 500) * 500))}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-mono border border-slate-700 transition-colors"
                        >
                          Next ₹500 (₹{Math.ceil(round2(billSummary.grandTotal) / 500) * 500})
                        </button>
                        <button
                          type="button"
                          onClick={() => setCashReceived("2000")}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-white rounded-lg text-[10px] font-mono border border-purple-800/40 transition-colors"
                        >
                          ₹2000
                        </button>
                      </div>

                      {/* Change Due vs Short Amount Dynamic Display */}
                      {(() => {
                        const parsedCash = parseFloat(cashReceived);
                        const payablePaise = toPaise(billSummary.grandTotal);
                        const cashPaise = !isNaN(parsedCash) && Number.isFinite(parsedCash) ? toPaise(parsedCash) : 0;
                        const isTendered = !isNaN(parsedCash) && cashPaise > 0;
                        const isSufficient = isTendered && cashPaise >= payablePaise;
                        const diff = isTendered ? round2((cashPaise - payablePaise) / 100) : 0;

                        return (
                          <div className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${isSufficient
                            ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                            : isTendered
                              ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                              : 'bg-slate-900/80 border-slate-800 text-slate-400'
                            }`}>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold uppercase tracking-wider">
                                {isSufficient ? 'Change Due to Customer' : isTendered ? 'Short Amount (Deficit)' : 'Change / Balance'}
                              </span>
                              <span className="text-[9px] text-slate-400">
                                {isSufficient ? 'Return to patient upon receipt' : isTendered ? 'Additional cash required' : 'Enter cash amount above'}
                              </span>
                            </div>
                            <span className={`text-xl font-black font-mono ${isSufficient ? 'text-amber-400' : isTendered ? 'text-rose-400' : 'text-slate-500'
                              }`}>
                              ₹{isSufficient ? Math.max(0, diff).toFixed(2) : Math.abs(diff).toFixed(2)}
                            </span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Dispensing Readiness & Compliance Checklist */}
                    <div className="p-3 bg-slate-950/80 border border-slate-800/90 rounded-xl space-y-1.5 text-[11px]">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                        <span>Statutory Dispensing Checklist</span>
                        <span className="text-sky-400 font-mono text-[9px]">D&C Rules & TN 2018</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                        <div className="flex items-center gap-1.5">
                          {(checkoutPatientName.trim() || activeSession.patientName) ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          )}
                          <span className={(checkoutPatientName.trim() || activeSession.patientName) ? 'text-slate-200' : 'text-slate-400'}>
                            Patient (Optional)
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {(checkoutDoctorName.trim() && checkoutDoctorRegNo.trim()) ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          )}
                          <span className={(checkoutDoctorName.trim() && checkoutDoctorRegNo.trim()) ? 'text-slate-200' : 'text-amber-400'}>
                            Doctor & TNMC Reg
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {(checkoutPharmacistName.trim() && checkoutPharmacistRegNo.trim()) ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          )}
                          <span className={(checkoutPharmacistName.trim() && checkoutPharmacistRegNo.trim()) ? 'text-slate-200' : 'text-amber-400'}>
                            Pharmacist & TNSPC Reg
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {(!cashReceived || (!isNaN(parseFloat(cashReceived)) && toPaise(parseFloat(cashReceived)) >= toPaise(billSummary.grandTotal))) ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          )}
                          <span className={(!cashReceived || (!isNaN(parseFloat(cashReceived)) && toPaise(parseFloat(cashReceived)) >= toPaise(billSummary.grandTotal))) ? 'text-slate-200' : 'text-rose-400 font-bold'}>
                            Cash Tender Valid
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Direct Payment Channel Action Buttons */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Authorize Payment & Complete Dispensing [C / G / K]
                      </span>

                      <div className="grid grid-cols-3 gap-2.5">
                        <button
                          type="button"
                          onClick={() => completeBilling('Cash')}
                          className="flex flex-col items-center justify-center p-3.5 bg-slate-800/80 hover:bg-emerald-600 border border-emerald-500/30 hover:border-emerald-400 rounded-2xl active:scale-95 transition-all group shadow-md"
                        >
                          <DollarSign className="w-5 h-5 text-emerald-400 group-hover:text-slate-950 mb-1 transition-colors" />
                          <span className="text-xs font-black font-mono text-white group-hover:text-slate-950 transition-colors">[C] Cash</span>
                          <span className="text-[9px] text-slate-400 group-hover:text-slate-900/80 transition-colors">Physical</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => completeBilling('Google Pay')}
                          className="flex flex-col items-center justify-center p-3.5 bg-slate-800/80 hover:bg-sky-500 border border-sky-500/30 hover:border-sky-400 rounded-2xl active:scale-95 transition-all group shadow-md"
                        >
                          <Smartphone className="w-5 h-5 text-sky-400 group-hover:text-slate-950 mb-1 transition-colors" />
                          <span className="text-xs font-black font-mono text-white group-hover:text-slate-950 transition-colors">[G] UPI</span>
                          <span className="text-[9px] text-slate-400 group-hover:text-slate-900/80 transition-colors">G-Pay / QR</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => completeBilling('Bank Card')}
                          className="flex flex-col items-center justify-center p-3.5 bg-slate-800/80 hover:bg-purple-600 border border-purple-500/30 hover:border-purple-400 rounded-2xl active:scale-95 transition-all group shadow-md"
                        >
                          <CreditCard className="w-5 h-5 text-purple-400 group-hover:text-white mb-1 transition-colors" />
                          <span className="text-xs font-black font-mono text-white transition-colors">[K] Card</span>
                          <span className="text-[9px] text-slate-400 group-hover:text-slate-200 transition-colors">POS EDC</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}

              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-slate-950 text-[10px] text-slate-400 font-mono flex flex-wrap justify-between items-center gap-2 border-t border-slate-800 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <span>Hotkeys:</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-200 font-bold">C Cash</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-200 font-bold">G UPI</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-200 font-bold">K Card</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-200 font-bold">ESC Cancel</span>
              </div>
              <span className="text-slate-500">Statutory record verified · Tamil Nadu Clinical Establishments & D&C Rules compliant</span>
            </div>

          </div>
        </div>
      )}

      {/* ----------------- MOBILE NAVIGATION SHEET DRAWER ----------------- */}
      {showMobileNav && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm lg:hidden transition-opacity">
          {/* Overlay click to dismiss */}
          <div className="absolute inset-0" onClick={() => setShowMobileNav(false)} />

          {/* Drawer Content */}
          <div className="relative w-5/6 max-w-sm h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col p-5 z-10 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 text-slate-950 font-black text-lg">
                  +
                </div>
                <div>
                  <h3 className="text-sm font-black text-white leading-tight">Madras Ortho Clinic</h3>
                  <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">Mission for Cure</span>
                </div>
              </div>
              <button
                onClick={() => setShowMobileNav(false)}
                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Info Card */}
            <div className="my-4 p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-xs">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <div className="text-xs font-bold text-white leading-tight">{currentUser?.name || 'Staff User'}</div>
                  <div className="text-[10px] text-slate-400 font-medium">@{currentUser?.username || 'user'}</div>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${currentUser?.role === 'admin'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                {currentUser?.role === 'admin' ? 'admin' : 'employee'}
              </span>
            </div>

            {/* Navigation Actions */}
            <div className="flex flex-col gap-2.5 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1 mt-1">Management & Tools</span>

              <button
                onClick={() => {
                  setShowMobileNav(false);
                  setShowProductCrudModal(true);
                  setProductModalTab('list');
                }}
                className="flex items-center justify-between p-3.5 bg-slate-800/60 hover:bg-slate-800 active:scale-[0.98] border border-slate-700/60 rounded-2xl text-left transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:bg-sky-500 group-hover:text-slate-950 transition-colors">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Medicines Database</span>
                    <span className="text-[10px] text-slate-400">557+ preloaded & manual entry</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-colors" />
              </button>

              <button
                onClick={() => {
                  setShowMobileNav(false);
                  setShowProductCrudModal(true);
                  setProductModalTab('excel');
                }}
                className="flex items-center justify-between p-3.5 bg-slate-800/60 hover:bg-slate-800 active:scale-[0.98] border border-slate-700/60 rounded-2xl text-left transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Upload Excel Sheet</span>
                    <span className="text-[10px] text-slate-400">Intelligent bulk medicine import</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </button>

              <button
                onClick={() => {
                  setShowMobileNav(false);
                  setShowAnalyticsModal(true);
                }}
                className="flex items-center justify-between p-3.5 bg-slate-800/60 hover:bg-slate-800 active:scale-[0.98] border border-slate-700/60 rounded-2xl text-left transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                    <BarChart2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Sales & Reports</span>
                    <span className="text-[10px] text-slate-400">Daily, weekly & yearly revenue</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
              </button>

              <button
                onClick={() => {
                  setShowMobileNav(false);
                  fetchPatients();
                  setShowPatientsModal(true);
                }}
                className="flex items-center justify-between p-3.5 bg-slate-800/60 hover:bg-slate-800 active:scale-[0.98] border border-slate-700/60 rounded-2xl text-left transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Patient Database</span>
                    <span className="text-[10px] text-slate-400">MRN profiles, disambiguation & history</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
              </button>



              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => {
                    setShowMobileNav(false);
                    setShowEmployeeCrudModal(true);
                  }}
                  className="flex items-center justify-between p-3.5 bg-slate-800/60 hover:bg-slate-800 active:scale-[0.98] border border-slate-700/60 rounded-2xl text-left transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Staff Management</span>
                      <span className="text-[10px] text-slate-400">Pharmacists & billing clerks</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
                </button>
              )}

              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => {
                    setShowMobileNav(false);
                    setAdminProfileForm({ ...bakeryDetails });
                    setShowAdminProfileModal(true);
                  }}
                  className="flex items-center justify-between p-3.5 bg-slate-800/60 hover:bg-slate-800 active:scale-[0.98] border border-slate-700/60 rounded-2xl text-left transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Doctor Profile & Licensure</span>
                      <span className="text-[10px] text-slate-400">Doctor degrees, council reg & clinic licenses</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                </button>
              )}

              <button
                onClick={() => {
                  setShowMobileNav(false);
                  setShowSettingsModal(true);
                }}
                className="flex items-center justify-between p-3.5 bg-slate-800/60 hover:bg-slate-800 active:scale-[0.98] border border-slate-700/60 rounded-2xl text-left transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Settings & Printers</span>
                    <span className="text-[10px] text-slate-400">Thermal receipt, WiFi & Bluetooth</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
              </button>

              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1 mt-3">Account</span>

              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => {
                    setShowMobileNav(false);
                    setChangePasswordModal(true);
                  }}
                  className="flex items-center space-x-3 p-3 bg-slate-950/50 hover:bg-slate-800 rounded-xl text-left transition-all border border-slate-800"
                >
                  <KeyRound className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-300">Change Password</span>
                </button>
              )}

              <button
                onClick={() => {
                  setShowMobileNav(false);
                  showConfirm({
                    title: "Sign Out",
                    message: "Are you sure you want to sign out of the POS system?",
                    type: "warning",
                    confirmText: "Sign Out",
                    onConfirm: () => {
                      handleLogout();
                      closeConfirm();
                    }
                  });
                }}
                className="flex items-center space-x-3 p-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl text-left transition-all text-rose-400"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-xs font-bold">Sign Out</span>
              </button>
            </div>

            {/* Clinic Info Footer */}
            <div className="pt-4 border-t border-slate-800 text-center">
              <div className="text-[10px] text-slate-500 font-medium">Madras Ortho Clinic Software v2.5</div>
              <div className="text-[9px] text-emerald-400 font-semibold mt-0.5">557 Preloaded Formulations · Offline Ready</div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- MEDICINE MANAGEMENT MODAL (MANUAL & EXCEL IMPORT) ----------------- */}
      {showProductCrudModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl h-[92vh] max-h-[720px] flex flex-col overflow-hidden">

            {/* Modal Header */}
            <div className="p-4 sm:px-6 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">Medicine & Inventory Management</h3>
                  <p className="text-[11px] text-slate-400">557+ Pre-loaded Formulations · Manual Entry · Intelligent Excel Upload</p>
                </div>
              </div>

              {/* Segmented Tab Controls */}
              <div className="flex items-center bg-slate-950 p-1 border border-slate-800 rounded-xl">
                {currentUser?.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => setProductModalTab('manual')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${productModalTab === 'manual'
                      ? 'bg-sky-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Manual Entry</span>
                    <span className={`text-[9px] font-black uppercase px-1 rounded ${productModalTab === 'manual' ? 'bg-slate-950 text-sky-300' : 'bg-sky-500/20 text-sky-400'
                      }`}>Admin</span>
                  </button>
                )}

                {currentUser?.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => setProductModalTab('excel')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${productModalTab === 'excel'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Upload Excel</span>
                    <span className={`text-[9px] font-black uppercase px-1 py-0.2 rounded ${productModalTab === 'excel' ? 'bg-slate-950 text-emerald-300' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>Admin</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setProductModalTab('list')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${productModalTab === 'list'
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                    }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Browse ({products.length})</span>
                </button>

                {currentUser?.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setProductModalTab('inward');
                      fetchInwardRecords();
                    }}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${productModalTab === 'inward'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Inward Stock</span>
                    <span className={`text-[9px] font-black uppercase px-1 rounded ${productModalTab === 'inward' ? 'bg-slate-950 text-amber-300' : 'bg-amber-500/20 text-amber-400'
                      }`}>Admin</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => {
                  setShowProductCrudModal(false);
                  setEditingProduct(null);
                }}
                className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">

              {/* TAB 1: MANUAL ENTRY */}
              {productModalTab === 'manual' && (
                <div className="max-w-2xl mx-auto">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {editingProduct?.id ? `Edit Medicine: ${editingProduct.name}` : 'Register New Medicine Manually'}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {editingProduct?.id ? 'Update prices, GST rates, or SKU codes.' : 'Add custom orthopaedic medicines, ointments, or braces to the active catalogue.'}
                      </p>
                    </div>
                    {editingProduct?.id && (
                      <button
                        type="button"
                        onClick={() => setEditingProduct(null)}
                        className="px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>

                  {currentUser?.role !== 'admin' && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center space-x-2 text-amber-400 text-xs font-semibold mb-4">
                      <Lock className="w-4 h-4 flex-shrink-0 text-amber-400" />
                      <span>View Only Mode: Admin login required to save or modify medicines.</span>
                    </div>
                  )}

                  <form onSubmit={saveProduct} className="flex flex-col gap-4 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Medicine / Product Name *</label>
                      <input
                        type="text"
                        required
                        disabled={currentUser?.role !== 'admin'}
                        placeholder="e.g. Aceclofenac 100mg + Paracetamol 325mg"
                        value={editingProduct?.name || ''}
                        onChange={(e) => setEditingProduct(prev => ({ ...prev, name: e.target.value }))}
                        className="px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 disabled:opacity-50"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Category *</label>
                          {currentUser?.role === 'admin' && (
                            <button
                              type="button"
                              onClick={() => setShowAddCategoryModal(true)}
                              className="text-[10px] text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> New
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          list="category-suggestions"
                          required
                          disabled={currentUser?.role !== 'admin'}
                          placeholder="Select or enter categories (comma-separated for multiple)..."
                          value={editingProduct?.category || ''}
                          onChange={(e) => setEditingProduct(prev => ({ ...prev, category: e.target.value }))}
                          className="px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 disabled:opacity-50"
                        />
                        <datalist id="category-suggestions">
                          {categories.map(c => (
                            <option key={c} value={c} />
                          ))}
                        </datalist>

                        {/* Interactive Category Chips for Multi-Category Assignment */}
                        <div className="flex flex-wrap gap-1 mt-1 max-h-24 overflow-y-auto p-1.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
                          {categories.filter(c => c !== 'All').map(cat => {
                            const activeCats = (editingProduct?.category || '').split(',').map(s => s.trim()).filter(Boolean);
                            const isSelected = activeCats.some(c => c.toLowerCase() === cat.toLowerCase());
                            return (
                              <button
                                key={cat}
                                type="button"
                                disabled={currentUser?.role !== 'admin'}
                                onClick={() => {
                                  let updated: string[];
                                  if (isSelected) {
                                    updated = activeCats.filter(c => c.toLowerCase() !== cat.toLowerCase());
                                  } else {
                                    updated = [...activeCats, cat];
                                  }
                                  setEditingProduct(prev => prev ? ({ ...prev, category: updated.join(', ') }) : prev);
                                }}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all border ${isSelected
                                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 shadow-xs'
                                  : 'bg-slate-800/80 text-slate-400 border-slate-750 hover:border-slate-600 hover:text-slate-200'
                                  }`}
                                title={isSelected ? `Click to remove from "${cat}"` : `Click to add to "${cat}"`}
                              >
                                {isSelected ? '✓ ' : '+ '}{cat}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Packaging / Unit Type *</label>
                        <select
                          disabled={currentUser?.role !== 'admin'}
                          value={editingProduct?.quantity_type || 'strip'}
                          onChange={(e: any) => setEditingProduct(prev => ({ ...prev, quantity_type: e.target.value }))}
                          className="px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500 disabled:opacity-50"
                        >
                          <option value="strip">strip (tablets/capsules)</option>
                          <option value="pcs">pcs (individual item / brace)</option>
                          <option value="pack">pack</option>
                          <option value="ml">ml (syrup/lotion/injection)</option>
                          <option value="L">L (litre)</option>
                          <option value="g">g (gram / ointment)</option>
                          <option value="kg">kg</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">MRP (₹ Printed) *</label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-500">₹</span>
                          <input
                            type="number"
                            required
                            disabled={currentUser?.role !== 'admin'}
                            step="0.01"
                            placeholder="0.00"
                            value={editingProduct?.mrp !== undefined ? editingProduct.mrp : (editingProduct?.price !== undefined ? editingProduct.price : '')}
                            onChange={(e) => setEditingProduct(prev => ({ ...prev, mrp: Number(e.target.value) }))}
                            className="w-full pl-8 pr-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-sky-500 disabled:opacity-50"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Price Sold At (₹ Clinic Rate) *</label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-500">₹</span>
                          <input
                            type="number"
                            required
                            disabled={currentUser?.role !== 'admin'}
                            step="0.01"
                            placeholder="0.00"
                            value={editingProduct?.price !== undefined ? editingProduct.price : ''}
                            onChange={(e) => setEditingProduct(prev => ({ ...prev, price: Number(e.target.value) }))}
                            className="w-full pl-8 pr-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-sky-500 disabled:opacity-50 font-bold text-emerald-400"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Cost of Purchase (₹ Cost)</label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-500">₹</span>
                          <input
                            type="number"
                            disabled={currentUser?.role !== 'admin'}
                            step="0.01"
                            placeholder="0.00"
                            value={editingProduct?.purchase_price !== undefined ? editingProduct.purchase_price : ''}
                            onChange={(e) => setEditingProduct(prev => ({ ...prev, purchase_price: Number(e.target.value) }))}
                            className="w-full pl-8 pr-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-sky-500 disabled:opacity-50"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">GST Tax Rate *</label>
                        <select
                          disabled={currentUser?.role !== 'admin'}
                          value={editingProduct?.tax_percent !== undefined ? editingProduct.tax_percent : 5}
                          onChange={(e) => setEditingProduct(prev => ({ ...prev, tax_percent: Number(e.target.value) }))}
                          className="px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500 disabled:opacity-50"
                        >
                          <option value={0}>0% (Exempt Medicines)</option>
                          <option value={5}>5% (Essential Pharma & Life-saving)</option>
                          <option value={12}>12% (Medical Devices & Braces)</option>
                          <option value={18}>18% (Supplements & OTC Topicals)</option>
                          <option value={28}>28% (Specialized Goods)</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Barcode (Optional)</label>
                        <input
                          type="text"
                          disabled={currentUser?.role !== 'admin'}
                          placeholder="Barcode scan"
                          value={editingProduct?.barcode || ''}
                          onChange={(e) => setEditingProduct(prev => ({ ...prev, barcode: e.target.value }))}
                          className="px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 disabled:opacity-50 font-mono"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">SKU Code (Optional)</label>
                        <input
                          type="text"
                          disabled={currentUser?.role !== 'admin'}
                          placeholder="Item SKU"
                          value={editingProduct?.sku || ''}
                          onChange={(e) => setEditingProduct(prev => ({ ...prev, sku: e.target.value }))}
                          className="px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 disabled:opacity-50 font-mono"
                        />
                      </div>
                    </div>

                    {/* Initial Opening Stock Setup Toggle (Optional for clinic onboarding) */}
                    <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={hasOpeningStock || (editingProduct?.available_stock !== undefined && editingProduct.available_stock > 0)}
                          onChange={(e) => {
                            setHasOpeningStock(e.target.checked);
                            if (!e.target.checked) {
                              setEditingProduct(prev => ({ ...prev, available_stock: 0, batch_number: '', expiry_date: '' }));
                            }
                          }}
                          className="rounded text-sky-500 focus:ring-sky-500 w-4 h-4 bg-slate-950 border-slate-700"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-200 block">
                            Add Initial Opening Stock (Optional for Initial Clinic Setup)
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Leave unchecked if incoming stock will be recorded later via Inward Stock applications.
                          </span>
                        </div>
                      </label>

                      {(hasOpeningStock || (editingProduct?.available_stock !== undefined && editingProduct.available_stock > 0)) && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Opening Quantity (Units)</label>
                            <input
                              type="number"
                              min="0"
                              placeholder="e.g. 50"
                              value={editingProduct?.available_stock !== undefined ? editingProduct.available_stock : ''}
                              onChange={(e) => setEditingProduct(prev => ({ ...prev, available_stock: Number(e.target.value) }))}
                              className="px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                            />
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Batch Number</label>
                            <input
                              type="text"
                              placeholder="e.g. BTH-2026-099"
                              value={editingProduct?.batch_number || ''}
                              onChange={(e) => setEditingProduct(prev => ({ ...prev, batch_number: e.target.value }))}
                              className="px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                            />
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Expiry Date</label>
                            <input
                              type="date"
                              value={editingProduct?.expiry_date ? String(editingProduct.expiry_date).substring(0, 10) : ''}
                              onChange={(e) => setEditingProduct(prev => ({ ...prev, expiry_date: e.target.value }))}
                              className="px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Stock Status - Fully Automatic Detection */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Stock Status (Automatic Detection)</label>
                      <div className="px-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                        <span className={`font-bold flex items-center gap-2 ${Number(editingProduct?.available_stock || 0) > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          <span className={`w-2 h-2 rounded-full ${Number(editingProduct?.available_stock || 0) > 0 ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                          {Number(editingProduct?.available_stock || 0) > 0 ? `Available (${editingProduct?.available_stock} Units in Stock)` : 'Out of Stock (0 Units Available)'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Auto: 0 = Out of stock, &gt;0 = Available
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 pt-3 border-t border-slate-800">
                      <button
                        type="submit"
                        disabled={currentUser?.role !== 'admin'}
                        className="flex-1 py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black rounded-xl text-xs tracking-wider uppercase transition-all shadow-lg shadow-sky-500/20 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99]"
                      >
                        {editingProduct?.id ? 'Update Medicine' : 'Save Medicine to Database'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProduct(null);
                          setProductModalTab('list');
                        }}
                        className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 2: INTELLIGENT EXCEL UPLOAD */}
              {productModalTab === 'excel' && (
                <div className="max-w-3xl mx-auto flex flex-col gap-6">

                  {/* Informational Hero Card */}
                  <div className="p-5 bg-gradient-to-br from-emerald-500/10 via-slate-900 to-sky-500/10 border border-emerald-500/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                        <h4 className="text-sm font-bold text-white">Intelligent Excel Medicine Importer</h4>
                      </div>
                      <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                        Upload Excel spreadsheets (.xlsx, .xls) or CSV files with your clinic’s custom medicines.
                        The system cross-checks medicine names (case-insensitive) against the 550+ existing database items.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Template (.xlsx)</span>
                    </button>
                  </div>

                  {currentUser?.role !== 'admin' && (
                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center space-x-2 text-amber-400 text-xs font-semibold">
                      <Lock className="w-4 h-4 flex-shrink-0 text-amber-400" />
                      <span>Admin access required to import medicines into database.</span>
                    </div>
                  )}

                  {/* Drag-and-Drop / Upload Zone */}
                  <div
                    onClick={() => {
                      if (currentUser?.role === 'admin' && !excelParsing) {
                        const input = document.getElementById('excel-file-upload-input') as HTMLInputElement;
                        input?.click();
                      }
                    }}
                    className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${excelParsing
                      ? 'border-sky-500 bg-sky-500/5 cursor-wait'
                      : currentUser?.role !== 'admin'
                        ? 'border-slate-800 bg-slate-950/40 opacity-50 cursor-not-allowed'
                        : 'border-slate-700 hover:border-emerald-500 bg-slate-950/50 hover:bg-emerald-500/5 group'
                      }`}
                  >
                    <input
                      id="excel-file-upload-input"
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      className="hidden"
                      disabled={currentUser?.role !== 'admin' || excelParsing}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleExcelFileSelect(file);
                        e.target.value = '';
                      }}
                    />

                    {excelParsing ? (
                      <div className="flex flex-col items-center space-y-3">
                        <RefreshCw className="w-10 h-10 text-sky-400 animate-spin" />
                        <span className="text-sm font-bold text-white">Analyzing & Verifying Spreadsheet...</span>
                        <span className="text-xs text-slate-400">Comparing medicine names with database formulations...</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform mb-3">
                          <UploadCloud className="w-8 h-8" />
                        </div>
                        <h5 className="text-sm font-bold text-white mb-1">
                          Click to browse or drag & drop Excel / CSV file
                        </h5>
                        <p className="text-xs text-slate-400 max-w-sm mb-3">
                          Supports Microsoft Excel (.xlsx, .xls) and CSV sheets with medicine name, category, MRP, and GST.
                        </p>
                        <span className="inline-flex items-center px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[10px] text-slate-400 font-mono">
                          Format: Name, Category, Price, GST, Quantity_Type
                        </span>
                      </>
                    )}
                  </div>

                  {/* Parse Results Status Card (if file was selected and processed) */}
                  {excelFileName && !excelParsing && (
                    <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col gap-4">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                        <div className="flex items-center space-x-2.5">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-white">{excelFileName}</span>
                          <span className="text-[10px] text-slate-400">({excelParsedMedicines.length} rows processed)</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Verified
                        </span>
                      </div>

                      {/* Case 1: Duplicates Found -> Interactive Resolution Required */}
                      {excelConflicts.length > 0 ? (
                        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-start space-x-3">
                            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="text-xs font-bold text-amber-300">
                                {excelConflicts.length} Potential Duplicate Medicine(s) Detected
                              </div>
                              <p className="text-[11px] text-amber-200/80 leading-relaxed">
                                {excelNewItems.length} new medicine(s) will be added directly. {excelConflicts.length} medicine(s) already exist in the database.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 w-full sm:w-auto">
                            <button
                              type="button"
                              onClick={() => setShowConflictModal(true)}
                              className="flex-1 sm:flex-none px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 whitespace-nowrap"
                            >
                              Review & Resolve ({excelConflicts.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => executeExcelImport(excelNewItems, false)}
                              className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors whitespace-nowrap"
                            >
                              Skip Duplicates & Import ({excelNewItems.length})
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Case 2: Clean File -> No Duplicates -> Direct 1-Click Import */
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                            <div>
                              <div className="text-xs font-bold text-emerald-300">
                                All {excelNewItems.length} Medicines are Clean & Ready
                              </div>
                              <p className="text-[11px] text-emerald-200/80">
                                No duplicates detected against the existing 550+ formulations.
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={isBatchImporting}
                            onClick={() => executeExcelImport(excelNewItems, false)}
                            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                          >
                            {isBatchImporting ? 'Importing...' : `Import All ${excelNewItems.length} Medicines Now`}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Excel Structure Guidance */}
                  <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Excel Column Reference</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                        <strong className="text-white block">Name *</strong>
                        <span className="text-[10px] text-slate-400">Medicine & formulation</span>
                      </div>
                      <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                        <strong className="text-white block">Category *</strong>
                        <span className="text-[10px] text-slate-400">e.g. NSAIDs, Injections</span>
                      </div>
                      <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                        <strong className="text-white block">Price *</strong>
                        <span className="text-[10px] text-slate-400">MRP in Indian Rupees (₹)</span>
                      </div>
                      <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                        <strong className="text-white block">GST_Percent *</strong>
                        <span className="text-[10px] text-slate-400">0, 5, 12, or 18</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: BROWSE MEDICINE DATABASE */}
              {productModalTab === 'list' && (
                <div className="flex flex-col h-full gap-3">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Search 550+ medicines by name, category, or barcode..."
                        value={crudSearch}
                        onChange={(e) => setCrudSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                      />
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3 py-1.5 rounded-xl whitespace-nowrap">
                        {products.filter(p => !crudSearch || p.name.toLowerCase().includes(crudSearch.toLowerCase()) || p.category.toLowerCase().includes(crudSearch.toLowerCase())).length} of {products.length} Items
                      </span>
                      {currentUser?.role === 'admin' && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct(null);
                            setProductModalTab('manual');
                          }}
                          className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center space-x-1"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Add New</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto border border-slate-800 rounded-2xl bg-slate-950/40">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 z-10">
                        <tr className="text-[10px] uppercase font-bold text-slate-400">
                          <th className="py-2.5 px-3">Medicine Name</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3">Unit</th>
                          <th className="py-2.5 px-3 text-right">MRP (₹)</th>
                          <th className="py-2.5 px-3 text-right">Price Sold (₹)</th>
                          <th className="py-2.5 px-3 text-center">Available Stock</th>
                          <th className="py-2.5 px-3 text-center">Expiry</th>
                          <th className="py-2.5 px-3 text-right">GST</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                          <th className="py-2.5 px-3 text-right w-24">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {products
                          .filter(p => !crudSearch || p.name.toLowerCase().includes(crudSearch.toLowerCase()) || p.category.toLowerCase().includes(crudSearch.toLowerCase()))
                          .sort((a, b) => {
                            const aInStock = (a.available_stock ?? 0) > 0 ? 1 : 0;
                            const bInStock = (b.available_stock ?? 0) > 0 ? 1 : 0;
                            if (aInStock !== bInStock) return bInStock - aInStock;
                            return (b.available_stock ?? 0) - (a.available_stock ?? 0) || a.name.localeCompare(b.name);
                          })
                          .map(p => {
                            const todayStr = new Date().toISOString().split('T')[0];
                            const isExp = Boolean(p.status === 'Expired' || p.is_expired || (p.expiry_date && String(p.expiry_date).substring(0, 10) <= todayStr));
                            const availStk = p.available_stock !== undefined ? p.available_stock : (p.status === 'Out of Stock' ? 0 : 50);
                            const isOos = Boolean(p.status === 'Out of Stock' || p.is_out_of_stock || availStk <= 0);

                            return (
                              <tr key={p.id} className="hover:bg-slate-900/60 transition-colors">
                                <td className="py-2 px-3 font-semibold text-white">
                                  <div className={isExp ? 'line-through text-rose-400' : ''}>{p.name}</div>
                                  {p.barcode && <div className="text-[9px] text-slate-500 font-mono">{p.barcode}</div>}
                                </td>
                                <td className="py-2 px-3">
                                  {currentUser?.role === 'admin' ? (
                                    <select
                                      value={p.category}
                                      onChange={(e) => updateProductCategory(p.id, e.target.value)}
                                      className="bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1 text-xs text-sky-300 font-medium focus:outline-none focus:border-sky-500 max-w-[155px] truncate cursor-pointer hover:border-sky-500/50"
                                      title="Click to change medicine category"
                                    >
                                      {Array.from(new Set([
                                        p.category,
                                        'Orthopaedic',
                                        'Analgesics & NSAIDs',
                                        'Antibiotics',
                                        'Muscle Relaxants',
                                        'Joint Supplements & Calcium',
                                        'Gastro-Protective',
                                        'Topical Sprays & Ointments',
                                        'Antacids & PPI',
                                        'Neuropathic Pain',
                                        'Post-Op Care & Dressings',
                                        ...categories.filter(c => c !== 'All')
                                      ])).filter(Boolean).map(c => (
                                        <option key={c} value={c}>{c}</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <span className="text-slate-400">{p.category}</span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{p.quantity_type || 'strip'}</td>
                                <td className="py-2 px-3 text-right font-mono text-slate-400">₹{Number(p.mrp !== undefined && p.mrp !== null && !isNaN(Number(p.mrp)) ? p.mrp : (p.price || 0)).toFixed(2)}</td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">₹{Number(p.price || 0).toFixed(2)}</td>
                                <td className="py-2 px-3 text-center font-mono">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isOos ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : (availStk <= 15 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20')
                                    }`}>
                                    {availStk}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-center font-mono text-[11px]">
                                  <span className={isExp ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                                    {p.expiry_date ? String(p.expiry_date).substring(0, 10) : '2028-12-31'}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-right font-mono text-slate-400">{p.tax_percent}%</td>
                                <td className="py-2 px-3 text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${isExp ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : (isOos ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20')
                                      }`}>
                                      {isExp ? 'Expired' : (isOos ? 'Out of Stock' : 'In Stock')}
                                    </span>
                                    {p.is_example ? (
                                      <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                        Demo Item
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                                        Clinic Drug
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2 px-3 text-right">
                                  <div className="flex items-center justify-end space-x-1">
                                    {currentUser?.role === 'admin' && (
                                      <button
                                        onClick={() => {
                                          setInwardConsignment({
                                            supplier_name: '',
                                            invoice_number: '',
                                            received_date: new Date().toISOString().split('T')[0],
                                            notes: '',
                                            items: [
                                              {
                                                id: 'inw-' + Date.now(),
                                                product_id: p.id,
                                                product_name: p.name,
                                                batch_number: '',
                                                quantity: 0,
                                                expiry_date: '',
                                                purchase_price: p.purchase_price || (p.price ? +(p.price * 0.7).toFixed(2) : 0),
                                                mrp: p.mrp || p.price || 0,
                                                selling_price: p.price || 0
                                              }
                                            ]
                                          });
                                          setProductModalTab('inward');
                                        }}
                                        className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-amber-400 rounded-lg transition-colors"
                                        title="Record Monthly Inward Stock"
                                      >
                                        <Package className="w-3.5 h-3.5 text-amber-400" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => {
                                        setEditingProduct(p);
                                        setProductModalTab('manual');
                                      }}
                                      className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-sky-400 rounded-lg transition-colors"
                                      title="Edit medicine"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    {p.is_example ? (
                                      <button
                                        onClick={() => deleteProduct(p.id)}
                                        className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                                        title="Delete Demo Medicine"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    ) : (
                                      <span
                                        className="p-1.5 text-slate-600 cursor-not-allowed rounded"
                                        title="Statutory Pharmacy Inventory Protection: Actual clinic inventory items cannot be deleted to preserve drug dispensing audit trail under D&C Rules."
                                      >
                                        <Lock className="w-3.5 h-3.5 text-slate-600" />
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: MONTHLY INWARD STOCK INTAKE (ADMIN ONLY) */}
              {productModalTab === 'inward' && (
                <div className="flex flex-col gap-5 max-w-4xl mx-auto">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Package className="w-4 h-4 text-amber-400" />
                        <span>Monthly Medicine Inward Stock Intake</span>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">Admin Only</span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        Manually log monthly medicine batches received by the clinic, update inventory quantities, and register expiry dates.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={fetchInwardRecords}
                      className="self-start sm:self-auto px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1.5 font-bold"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {currentUser?.role !== 'admin' ? (
                    <div className="p-4 bg-amber-950/40 border border-amber-800/80 rounded-2xl text-amber-200 text-xs">
                      Admin privileges required to record monthly inward stock medicines.
                    </div>
                  ) : (
                    <form onSubmit={handleRecordInwardStock} className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-5">
                      {/* Consignment Header: Supplier & Invoice Information */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs bg-slate-900/60 p-4 rounded-xl border border-slate-800/70">
                        <div className="sm:col-span-4 flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-amber-300 uppercase">Supplier / Wholesaler *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Apex Pharma Wholesale, MedPlus Depot"
                            value={inwardConsignment.supplier_name}
                            onChange={(e) => setInwardConsignment(prev => ({ ...prev, supplier_name: e.target.value }))}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 font-semibold"
                          />
                        </div>

                        <div className="sm:col-span-3 flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-amber-300 uppercase">Invoice / DC Number *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. INV-2026-8491"
                            value={inwardConsignment.invoice_number}
                            onChange={(e) => setInwardConsignment(prev => ({ ...prev, invoice_number: e.target.value }))}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-400 font-semibold"
                          />
                        </div>

                        <div className="sm:col-span-2 flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-amber-300 uppercase">Date Received *</label>
                          <input
                            type="date"
                            required
                            value={inwardConsignment.received_date}
                            onChange={(e) => setInwardConsignment(prev => ({ ...prev, received_date: e.target.value }))}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        <div className="sm:col-span-3 flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-amber-300 uppercase">Consignment Notes / Rack</label>
                          <input
                            type="text"
                            placeholder="e.g. Monthly refill, Shelf A-1"
                            value={inwardConsignment.notes}
                            onChange={(e) => setInwardConsignment(prev => ({ ...prev, notes: e.target.value }))}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>

                      {/* Datalist for Medicine Autocomplete */}
                      <datalist id="inward-med-suggestions">
                        {products.map(p => (
                          <option key={p.id} value={p.name}>
                            {p.name} · MRP: ₹{Number(p.mrp !== undefined && p.mrp !== null && !isNaN(Number(p.mrp)) ? p.mrp : (p.price || 0)).toFixed(2)} · Cost: ₹{Number(p.purchase_price || 0).toFixed(2)}
                          </option>
                        ))}
                      </datalist>

                      {/* Multi-Medicine Inward Stock Items Table */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                            Medicines In This Inward Stock Consignment ({inwardConsignment.items.length})
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Type medicine name to select or auto-register new medicines.
                          </span>
                        </div>

                        {/* Multi-Medicine Spacious Inward Stock Cards */}
                        <div className="space-y-4">
                          {inwardConsignment.items.map((it, idx) => {
                            const lineTotal = Number(it.quantity || 0) * Number(it.purchase_price || 0);
                            return (
                              <div key={it.id} className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3.5 hover:border-amber-500/40 transition-all shadow-md">
                                {/* Card Header Row: Item Number, Medicine Name (wide autocomplete), Batch Number, Expiry, and Remove */}
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-amber-500/30">
                                      #{idx + 1}
                                    </span>
                                  </div>

                                  <div className="flex-1 min-w-[240px]">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                      Medicine Name (Type or Select from Catalog) *
                                    </label>
                                    <input
                                      type="text"
                                      required
                                      list="inward-med-suggestions"
                                      placeholder="e.g. Paracetamol 650mg, Aceclofenac..."
                                      value={it.product_name}
                                      onChange={(e) => handleUpdateInwardRow(it.id, 'product_name', e.target.value)}
                                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 font-semibold"
                                    />
                                  </div>

                                  <div className="w-full sm:w-44">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                      Batch Number *
                                    </label>
                                    <input
                                      type="text"
                                      required
                                      placeholder="e.g. B-2026-001"
                                      value={it.batch_number}
                                      onChange={(e) => handleUpdateInwardRow(it.id, 'batch_number', e.target.value)}
                                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-sky-400 font-mono focus:outline-none focus:border-amber-400"
                                    />
                                  </div>

                                  <div className="w-full sm:w-44">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                      Expiry Date *
                                    </label>
                                    <input
                                      type="date"
                                      required
                                      value={it.expiry_date}
                                      onChange={(e) => handleUpdateInwardRow(it.id, 'expiry_date', e.target.value)}
                                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-400"
                                    />
                                  </div>

                                  {inwardConsignment.items.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveInwardRow(it.id)}
                                      className="self-end sm:self-center p-2 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 rounded-xl transition-colors border border-transparent hover:border-rose-500/20"
                                      title="Remove medicine from this inward receipt"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>

                                {/* Card Body Grid: 5 spacious columns for Qty, Cost, Line Total, MRP, Selling Rate */}
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2.5 border-t border-slate-800/60">
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                      Quantity (Units) *
                                    </label>
                                    <input
                                      type="number"
                                      required
                                      min="1"
                                      placeholder="e.g. 50"
                                      value={it.quantity || ''}
                                      onChange={(e) => handleUpdateInwardRow(it.id, 'quantity', Number(e.target.value))}
                                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-400 text-right"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                      Purchase Cost (₹) *
                                    </label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      required
                                      placeholder="0.00"
                                      value={it.purchase_price || ''}
                                      onChange={(e) => handleUpdateInwardRow(it.id, 'purchase_price', Number(e.target.value))}
                                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-400 text-right"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[10px] font-bold text-amber-400/90 uppercase tracking-wider block mb-1">
                                      Line Total Cost (₹)
                                    </label>
                                    <div className="w-full px-3 py-2 bg-slate-950/60 border border-amber-500/20 rounded-xl text-xs text-amber-300 font-mono font-bold text-right">
                                      ₹{lineTotal.toFixed(2)}
                                    </div>
                                  </div>

                                  <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                      MRP Printed (₹) *
                                    </label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      required
                                      placeholder="0.00"
                                      value={it.mrp || ''}
                                      onChange={(e) => handleUpdateInwardRow(it.id, 'mrp', Number(e.target.value))}
                                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-300 font-mono focus:outline-none focus:border-amber-400 text-right"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[10px] font-bold text-emerald-400/90 uppercase tracking-wider block mb-1">
                                      Selling Rate (₹) *
                                    </label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      required
                                      placeholder="0.00"
                                      value={it.selling_price || ''}
                                      onChange={(e) => handleUpdateInwardRow(it.id, 'selling_price', Number(e.target.value))}
                                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-amber-400 text-right"
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Add Another Medicine Row Button */}
                        <div className="flex justify-start">
                          <button
                            type="button"
                            onClick={handleAddInwardRow}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Another Medicine to this Inward Stock</span>
                          </button>
                        </div>
                      </div>

                      {/* Consignment Financial Summary & Submit */}
                      {(() => {
                        const totalUnits = inwardConsignment.items.reduce((sum, it) => sum + Number(it.quantity || 0), 0);
                        const totalCost = inwardConsignment.items.reduce((sum, it) => sum + (Number(it.quantity || 0) * Number(it.purchase_price || 0)), 0);
                        const totalMrpVal = inwardConsignment.items.reduce((sum, it) => sum + (Number(it.quantity || 0) * Number(it.mrp || 0)), 0);

                        return (
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl">
                            <div className="flex flex-wrap items-center gap-6 text-xs">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Medicines in Consignment</span>
                                <span className="text-base font-black text-white">{inwardConsignment.items.length} Medicines</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Units Received</span>
                                <span className="text-base font-black text-sky-400">{totalUnits} Units</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Stock Purchase Cost</span>
                                <span className="text-lg font-black text-amber-400">₹{totalCost.toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Total MRP Valuation</span>
                                <span className="text-base font-bold text-slate-300">₹{totalMrpVal.toFixed(2)}</span>
                              </div>
                            </div>

                            <button
                              type="submit"
                              disabled={savingInward}
                              className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              <Package className="w-4 h-4" />
                              <span>{savingInward ? 'Saving Consignment...' : `Record Inward Stock Consignment (₹${totalCost.toFixed(2)})`}</span>
                            </button>
                          </div>
                        );
                      })()}
                    </form>
                  )}

                  {/* Recent Inward Stock Entries Ledger */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <span>Recent Inward Stock Receipts & Refills</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300">
                          {inwardRecords.length} records
                        </span>
                      </span>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={inwardSearchQuery}
                          onChange={(e) => setInwardSearchQuery(e.target.value)}
                          placeholder="Search Invoice #, Medicine, or Supplier..."
                          className="w-64 pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div className="border border-slate-800 rounded-2xl bg-slate-950/40 overflow-hidden">
                      {inwardRecords.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-500">
                          No inward stock records yet. Use the form above to log monthly incoming stock.
                        </div>
                      ) : (
                        <div className="max-h-72 overflow-y-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                              <tr>
                                <th className="p-2.5">Date</th>
                                <th className="p-2.5">Invoice #</th>
                                <th className="p-2.5">Supplier</th>
                                <th className="p-2.5">Medicine</th>
                                <th className="p-2.5">Batch</th>
                                <th className="p-2.5 text-right">Qty</th>
                                <th className="p-2.5">Expiry</th>
                                <th className="p-2.5 text-right">Cost (₹)</th>
                                <th className="p-2.5 text-right">Total Purchase (₹)</th>
                                <th className="p-2.5 text-right">MRP (₹)</th>
                                <th className="p-2.5 text-right">Rate (₹)</th>
                                <th className="p-2.5 text-center">Receipt</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                              {inwardRecords
                                .filter((r: any) => {
                                  if (!inwardSearchQuery.trim()) return true;
                                  const q = inwardSearchQuery.toLowerCase();
                                  return (
                                    (r.invoice_number && r.invoice_number.toLowerCase().includes(q)) ||
                                    (r.product_name && r.product_name.toLowerCase().includes(q)) ||
                                    (r.supplier_name && r.supplier_name.toLowerCase().includes(q)) ||
                                    (r.batch_number && r.batch_number.toLowerCase().includes(q))
                                  );
                                })
                                .slice(0, 100)
                                .map((r: any) => {
                                  const totalPurchase = Number(r.quantity || r.quantity_received || 0) * Number(r.purchase_price || 0);
                                  return (
                                    <tr key={r.id} className="hover:bg-slate-900/60 transition-colors">
                                      <td className="p-2.5 text-slate-400 font-mono text-[11px]">{r.received_date}</td>
                                      <td className="p-2.5 font-mono text-sky-400 font-semibold">{r.invoice_number || 'INV-MONTHLY'}</td>
                                      <td className="p-2.5 text-slate-300 font-medium truncate max-w-[140px]">{r.supplier_name || 'Direct Wholesale'}</td>
                                      <td className="p-2.5 font-bold text-white">{r.product_name || `Medicine #${r.product_id}`}</td>
                                      <td className="p-2.5 font-mono text-amber-300">{r.batch_number}</td>
                                      <td className="p-2.5 text-right font-mono font-bold text-emerald-400">+{r.quantity || r.quantity_received}</td>
                                      <td className="p-2.5 font-mono text-slate-400 text-[11px]">{r.expiry_date}</td>
                                      <td className="p-2.5 text-right font-mono text-slate-300">₹{Number(r.purchase_price || 0).toFixed(2)}</td>
                                      <td className="p-2.5 text-right font-mono font-bold text-amber-400">₹{totalPurchase.toFixed(2)}</td>
                                      <td className="p-2.5 text-right font-mono text-slate-400">₹{Number(r.mrp || 0).toFixed(2)}</td>
                                      <td className="p-2.5 text-right font-mono text-emerald-400">₹{Number(r.selling_price || r.mrp || 0).toFixed(2)}</td>
                                      <td className="p-2.5 text-center">
                                        <button
                                          type="button"
                                          onClick={() => downloadInwardReceiptPDF(r)}
                                          className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 transition-all whitespace-nowrap"
                                          title="Download / Print Inward Stock Receipt (GRN PDF)"
                                        >
                                          <FileText className="w-3 h-3" />
                                          <span>GRN PDF</span>
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ----------------- INTELLIGENT DUPLICATE RESOLUTION MODAL ----------------- */}
      {showConflictModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl w-full max-w-3xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden">

            {/* Header */}
            <div className="p-4 sm:p-5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Duplicate Medicine Names Detected</h3>
                  <p className="text-xs text-amber-300/80">
                    {excelConflicts.length} item(s) in "{excelFileName}" already exist in your database.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConflictModal(false)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Bulk Choice Controls */}
            <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Choose action for existing medicines:
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setExcelConflicts(prev => prev.map(c => ({ ...c, userChoice: 'skip' })));
                  }}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg transition-colors"
                >
                  Skip All Duplicates
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExcelConflicts(prev => prev.map(c => ({ ...c, userChoice: 'add' })));
                  }}
                  className="px-3 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 border border-sky-500/30 font-bold text-xs rounded-lg transition-colors"
                >
                  Add / Overwrite All Anyway
                </button>
              </div>
            </div>

            {/* Conflicting Items Scrollable List */}
            <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-2.5">
              {excelConflicts.map((conflict, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${conflict.userChoice === 'add'
                    ? 'bg-sky-500/5 border-sky-500/40'
                    : 'bg-slate-950/60 border-slate-800'
                    }`}
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-white block truncate">
                      {conflict.excelItem.name}
                    </span>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[11px]">
                      <span className="text-slate-400">
                        In DB: <span className="font-mono text-emerald-400">₹{conflict.existingItem.price.toFixed(2)}</span> · {conflict.existingItem.tax_percent}% GST · {conflict.existingItem.category}
                      </span>
                      <span className="text-sky-300">
                        In Excel: <span className="font-mono font-bold text-sky-400">₹{Number(conflict.excelItem.price).toFixed(2)}</span> · {conflict.excelItem.tax_percent}% GST · {conflict.excelItem.category}
                      </span>
                    </div>
                  </div>

                  {/* Toggle Choice */}
                  <div className="flex items-center space-x-1.5 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        setExcelConflicts(prev => prev.map((c, i) => i === idx ? { ...c, userChoice: 'skip' } : c));
                      }}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${conflict.userChoice === 'skip'
                        ? 'bg-slate-700 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                    >
                      Skip
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setExcelConflicts(prev => prev.map((c, i) => i === idx ? { ...c, userChoice: 'add' } : c));
                      }}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${conflict.userChoice === 'add'
                        ? 'bg-sky-500 text-slate-950 shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-sky-400'
                        }`}
                    >
                      Add Anyway
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Summary & Proceed */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                Ready to import: <strong className="text-white">{excelNewItems.length} new</strong> +{' '}
                <strong className="text-sky-400">{excelConflicts.filter(c => c.userChoice === 'add').length} duplicate</strong> medicines (
                <span className="text-slate-500">{excelConflicts.filter(c => c.userChoice === 'skip').length} skipped</span>).
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowConflictModal(false)}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isBatchImporting}
                  onClick={() => {
                    const finalItems = [
                      ...excelNewItems,
                      ...excelConflicts.filter(c => c.userChoice === 'add').map(c => c.excelItem)
                    ];
                    executeExcelImport(finalItems, true);
                  }}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-sky-500/20 active:scale-95 disabled:opacity-50"
                >
                  {isBatchImporting ? 'Importing...' : 'Confirm & Import Medicines'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ----------------- REPORTS & ANALYTICS DASHBOARD MODAL ----------------- */}
      {showAnalyticsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl shadow-2xl h-[90vh] max-h-[860px] flex flex-col overflow-hidden">

            <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
              <span className="text-sm font-bold text-white flex items-center">
                <BarChart2 className="w-4 h-4 mr-2 text-emerald-400" />
                <span className="text-sky-300 font-extrabold uppercase mr-2 tracking-wide">{(bakeryDetails.name || 'MADRAS ORTHO CLINIC').toUpperCase()}</span>
                <span className="text-slate-500 mr-2">•</span>
                <span>Financial Reports, Margins & Stock Analytics</span>
                {currentUser?.role !== 'admin' && (
                  <span className="ml-3 px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-bold uppercase tracking-wider">
                    Employee View-Only Mode
                  </span>
                )}
              </span>
              <button
                onClick={() => setShowAnalyticsModal(false)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex bg-slate-900 border-b border-slate-800 px-4">
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all ${activeTab === 'analytics'
                  ? 'border-sky-500 text-sky-400 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
              >
                Comprehensive Financial & Inventory Report
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all ${activeTab === 'history'
                  ? 'border-sky-500 text-sky-400 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
              >
                Previous Invoices History
              </button>
            </div>

            {/* Filter controls */}
            <div className="p-3.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setReportType('daily')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${reportType === 'daily' ? 'bg-sky-500 text-slate-950 font-black shadow-sm' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setReportType('weekly')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${reportType === 'weekly' ? 'bg-sky-500 text-slate-950 font-black shadow-sm' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                >
                  Weekly (Mon-Sun)
                </button>
                <button
                  onClick={() => setReportType('monthly')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${reportType === 'monthly' ? 'bg-sky-500 text-slate-950 font-black shadow-md shadow-sky-500/20' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                >
                  <span>Monthly</span>
                  <span className={`text-[9px] font-black uppercase px-1 rounded ${reportType === 'monthly' ? 'bg-slate-950 text-sky-300' : 'bg-sky-500/20 text-sky-400'}`}>Primary</span>
                </button>
                <button
                  onClick={() => setReportType('yearly')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${reportType === 'yearly' ? 'bg-sky-500 text-slate-950 font-black shadow-sm' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                >
                  Yearly
                </button>
              </div>

              <div className="flex items-center space-x-3">
                {reportType === 'yearly' ? (
                  <select
                    value={reportYear}
                    onChange={(e) => setReportYear(Number(e.target.value))}
                    className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono font-bold"
                  >
                    {[2024, 2025, 2026, 2027, 2028].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                ) : reportType === 'monthly' ? (
                  <input
                    type="month"
                    value={reportMonth}
                    onChange={(e) => setReportMonth(e.target.value)}
                    className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono font-bold focus:outline-none focus:border-sky-500"
                  />
                ) : (
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono font-bold focus:outline-none focus:border-sky-500"
                  />
                )}

                <button
                  onClick={handleExcelExport}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all flex items-center shadow-md shadow-emerald-600/20 active:scale-95"
                >
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  Export .xlsx Spreadsheet
                </button>
              </div>
            </div>

            {/* Dashboard Contents */}
            <div className={`flex-1 p-4 sm:p-5 ${activeTab === 'analytics' ? 'overflow-y-auto' : 'overflow-hidden'}`}>
              {activeTab === 'analytics' ? (
                loadingAnalytics ? (
                  <div className="flex flex-col justify-center items-center h-full text-slate-500 gap-3 py-16">
                    <RefreshCw className="w-8 h-8 animate-spin text-sky-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Compiling precise financial & stock metrics...</span>
                  </div>
                ) : analyticsData ? (
                  <div className="space-y-4">

                    {/* ROW 1: PRIMARY FINANCIAL MARGINS & COGS CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                      {/* Card 1: Revenue & Invoices */}
                      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Net Sales Revenue</span>
                          <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                            ₹{(analyticsData.financials?.netSales ?? analyticsData.totalSales ?? 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Total Invoices:</span>
                          <span className="font-bold text-white font-mono">{analyticsData.billCount ?? 0}</span>
                        </div>
                      </div>

                      {/* Card 2: MRP vs Discount Info */}
                      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Gross MRP & Discounts</span>
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold text-slate-200 font-mono">
                              ₹{(analyticsData.financials?.grossSales ?? analyticsData.totalSales ?? 0).toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-400">Gross</span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                          <span className="text-rose-400 font-medium">Discounts Given:</span>
                          <span className="font-bold text-rose-300 font-mono">
                            -₹{(analyticsData.financials?.discounts ?? 0).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Card 3: Purchase Rate (COGS) */}
                      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Cost of Goods Sold (Purchase Rate)</span>
                          <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                            ₹{(analyticsData.financials?.cogs ?? 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Purchase Basis:</span>
                          <span className="font-bold text-slate-300 font-mono">Wholesale Inward Rate</span>
                        </div>
                      </div>

                      {/* Card 4: Gross Profit & Margin % */}
                      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Gross Profit & Margin</span>
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl sm:text-2xl font-black text-sky-400 font-mono">
                              ₹{(analyticsData.financials?.grossProfit ?? 0).toFixed(2)}
                            </span>
                            <span className="text-xs font-bold text-emerald-400 font-mono">
                              {(analyticsData.financials?.profitMarginPercent ?? 0).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Net Profitability:</span>
                          <span className="font-bold text-emerald-400">
                            {(analyticsData.financials?.profitMarginPercent ?? 0) >= 0 ? 'Profitable' : 'Deficit'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ROW 2: STOCK AMOUNT & DIFFERENCE + STATUTORY GST REPORT */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">

                      {/* Left: Stock Movement, Difference & Valuations (7 Cols) */}
                      <div className="lg:col-span-7 bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wide">
                            <Package className="w-4 h-4 text-amber-400" />
                            Stock Amount, Inward vs Outward & Net Difference
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">Period Audit</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                          <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-xl">
                            <span className="text-[10px] text-slate-400 block uppercase">Inward Received</span>
                            <span className="text-base font-black text-emerald-400 font-mono">
                              +{analyticsData.stockMovement?.inwardUnits ?? 0}
                            </span>
                            <span className="text-[9px] text-slate-500 block font-mono">
                              (₹{(analyticsData.stockMovement?.inwardPurchaseValuation ?? 0).toFixed(0)})
                            </span>
                          </div>

                          <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-xl">
                            <span className="text-[10px] text-slate-400 block uppercase">Stock Sold</span>
                            <span className="text-base font-black text-rose-400 font-mono">
                              -{analyticsData.stockMovement?.unitsSold ?? 0}
                            </span>
                            <span className="text-[9px] text-slate-500 block">Dispensed</span>
                          </div>

                          <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-xl">
                            <span className="text-[10px] text-amber-300 block uppercase">Free Health Disp.</span>
                            <span className="text-base font-black text-amber-400 font-mono">
                              -{analyticsData.stockMovement?.complimentaryUnits ?? 0}
                            </span>
                            <span className="text-[9px] text-slate-500 block font-mono">
                              (₹{(analyticsData.stockMovement?.complimentaryCostAbsorbed ?? analyticsData.stockMovement?.complimentaryAbsorbedCost ?? 0).toFixed(0)})
                            </span>
                          </div>

                          <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-xl">
                            <span className="text-[10px] text-slate-300 block uppercase font-bold">Net Difference</span>
                            <span className={`text-base font-black font-mono ${(analyticsData.stockMovement?.netStockDifferenceUnits ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}>
                              {(analyticsData.stockMovement?.netStockDifferenceUnits ?? 0) >= 0 ? '+' : ''}
                              {analyticsData.stockMovement?.netStockDifferenceUnits ?? 0}
                            </span>
                            <span className="text-[9px] text-slate-500 block">Units</span>
                          </div>
                        </div>

                        {/* Current Available Closing Stock Valuation in Batches */}
                        <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs flex-wrap gap-2">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Current Closing Stock in Clinic Batches</span>
                            <span className="font-mono font-bold text-white text-sm">
                              {analyticsData.stockMovement?.currentAvailableStockUnits ?? 0} Available Units
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] font-mono">
                            <div className="text-right">
                              <span className="text-slate-500 block text-[9px] uppercase">Valuation at Cost</span>
                              <span className="text-amber-400 font-bold">₹{(analyticsData.stockMovement?.currentStockValuationCost ?? 0).toFixed(2)}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-slate-500 block text-[9px] uppercase">Valuation at MRP</span>
                              <span className="text-emerald-400 font-bold">₹{(analyticsData.stockMovement?.currentStockValuationMrp ?? 0).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Statutory GST Tax Report (5 Cols) */}
                      <div className="lg:col-span-5 bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wide">
                            <FileText className="w-4 h-4 text-sky-400" />
                            GST Statutory Tax Report (CGST & SGST)
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400 font-bold">
                            Total: ₹{(analyticsData.gstReport?.totalGst ?? 0).toFixed(2)}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="p-2 bg-slate-900/70 border border-slate-800 rounded-xl">
                            <span className="text-[9px] text-slate-400 block uppercase">Taxable Base</span>
                            <span className="font-mono font-bold text-slate-200">
                              ₹{(analyticsData.gstReport?.taxableValue ?? 0).toFixed(1)}
                            </span>
                          </div>
                          <div className="p-2 bg-slate-900/70 border border-slate-800 rounded-xl">
                            <span className="text-[9px] text-slate-400 block uppercase">CGST (50%)</span>
                            <span className="font-mono font-bold text-amber-400">
                              ₹{(analyticsData.gstReport?.cgst ?? 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="p-2 bg-slate-900/70 border border-slate-800 rounded-xl">
                            <span className="text-[9px] text-slate-400 block uppercase">SGST (50%)</span>
                            <span className="font-mono font-bold text-amber-400">
                              ₹{(analyticsData.gstReport?.sgst ?? 0).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* 4-Tier GST Slab Table */}
                        <div className="border border-slate-800 rounded-xl overflow-hidden text-[11px]">
                          <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-900 border-b border-slate-800 text-[9px] uppercase font-bold text-slate-400">
                              <tr>
                                <th className="p-1.5 pl-2">Slab</th>
                                <th className="p-1.5 text-right">Taxable</th>
                                <th className="p-1.5 text-right">CGST</th>
                                <th className="p-1.5 text-right">SGST</th>
                                <th className="p-1.5 text-right pr-2">Total GST</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40 font-mono">
                              {['0%', '5%', '12%', '18%'].map((slab) => {
                                const sData = analyticsData.gstReport?.slabs?.[slab] || { taxable: 0, cgst: 0, sgst: 0, total: 0 };
                                return (
                                  <tr key={slab} className="hover:bg-slate-900/40">
                                    <td className="p-1.5 pl-2 font-bold text-slate-300">{slab}</td>
                                    <td className="p-1.5 text-right text-slate-400">₹{sData.taxable.toFixed(1)}</td>
                                    <td className="p-1.5 text-right text-slate-400">₹{sData.cgst.toFixed(2)}</td>
                                    <td className="p-1.5 text-right text-slate-400">₹{sData.sgst.toFixed(2)}</td>
                                    <td className="p-1.5 text-right pr-2 font-bold text-emerald-400">₹{sData.total.toFixed(2)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* ROW 3: DOCTOR/STAFF FREE HEALTH DISPENSE + PAYMENT DISTRIBUTION + TOP PRODUCTS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">

                      {/* Doctor/Staff Health Dispense Summary */}
                      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                              Free Health Dispenses (₹0)
                            </span>
                            <span className="text-[9px] font-mono text-slate-400">Admin</span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                            Doctor-issued medicines to employees & colleagues for health purposes with zero cost deducted.
                          </p>
                        </div>
                        <div className="space-y-1.5 text-xs pt-3 border-t border-slate-800/80">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Dispense Count:</span>
                            <span className="font-bold text-white font-mono">{analyticsData.complimentarySummary?.dispenseCount ?? analyticsData.complimentarySummary?.billsCount ?? 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Free Medicine Units:</span>
                            <span className="font-bold text-amber-300 font-mono">{analyticsData.complimentarySummary?.totalUnits ?? analyticsData.complimentarySummary?.unitsDispensed ?? 0} units</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Clinic Cost Absorbed:</span>
                            <span className="font-bold text-amber-400 font-mono">₹{(analyticsData.complimentarySummary?.totalCostAbsorbed ?? analyticsData.complimentarySummary?.absorbedCost ?? 0).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Payment Distribution */}
                      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                          Payment Mode Settlement
                        </span>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                            <span className="flex items-center text-slate-300">
                              <DollarSign className="w-3.5 h-3.5 text-emerald-400 mr-2" />
                              Cash:
                            </span>
                            <span className="font-bold font-mono text-white">₹{(analyticsData.paymentBreakdown?.Cash ?? 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                            <span className="flex items-center text-slate-300">
                              <Smartphone className="w-3.5 h-3.5 text-sky-400 mr-2" />
                              Google Pay / UPI:
                            </span>
                            <span className="font-bold font-mono text-white">₹{(analyticsData.paymentBreakdown?.GooglePay ?? 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="flex items-center text-slate-300">
                              <CreditCard className="w-3.5 h-3.5 text-purple-400 mr-2" />
                              Bank Card:
                            </span>
                            <span className="font-bold font-mono text-white">₹{(analyticsData.paymentBreakdown?.BankCard ?? 0).toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-800/60 text-[10px] text-slate-500">
                          Physical POS & UPI settlements
                        </div>
                      </div>

                      {/* Top Products Sold */}
                      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                          Top Products Sold
                        </span>
                        <div className="flex-1 overflow-y-auto space-y-2 max-h-36">
                          {analyticsData.topProducts?.slice(0, 5).map((p: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-xs pb-1 border-b border-slate-800/40">
                              <div>
                                <span className="font-bold text-white block truncate max-w-[140px]">{p.name}</span>
                                <span className="text-[10px] text-slate-500">{p.quantity} sold</span>
                              </div>
                              <span className="font-bold font-mono text-emerald-400">₹{p.total.toFixed(2)}</span>
                            </div>
                          ))}
                          {(!analyticsData.topProducts || analyticsData.topProducts.length === 0) && (
                            <div className="py-4 text-center text-slate-500 text-xs">No sales recorded.</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ROW 4: DAILY TREND (FOR MONTH / WEEK) OR MONTHLY GROWTH (FOR YEAR) */}
                    {analyticsData.dailyBreakdown && (
                      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Daily Sales Trend ({reportType.toUpperCase()})
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {analyticsData.dailyBreakdown.length} Days Tracked
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-center text-xs">
                          {analyticsData.dailyBreakdown.slice(-14).map((day: any) => (
                            <div key={day.date} className="p-2 bg-slate-900/60 border border-slate-800 rounded-xl">
                              <div className="font-bold text-slate-300 text-[11px]">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                              <div className="text-[9px] text-slate-500 mb-1">{day.date.split('-').slice(1).join('/')}</div>
                              <div className="font-bold text-emerald-400 font-mono">₹{day.amount.toFixed(0)}</div>
                              <div className="text-[9px] text-slate-500">{day.bills} bills</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analyticsData.monthlyBreakdown && (
                      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                          Monthly Growth Breakdown ({reportYear})
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs">
                          {analyticsData.monthlyBreakdown.map((m: any) => (
                            <div key={m.monthName} className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col justify-between">
                              <div>
                                <div className="font-bold text-slate-300">{m.monthName}</div>
                                <div className="font-bold text-emerald-400 font-mono mt-1">₹{m.amount.toFixed(0)}</div>
                              </div>
                              <div className="text-[9px] text-slate-500 mt-2">
                                {m.bills} bills • {(m.growthPercent * 100).toFixed(0)}% MoM
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-500 font-mono">Failed to load reports. Try hitting Refresh.</div>
                )
              ) : (
                // Previous bills history tab
                loadingHistory ? (
                  <div className="flex flex-col justify-center items-center h-full text-slate-500 gap-3">
                    <RefreshCw className="w-8 h-8 animate-spin" />
                    <span className="text-xs font-semibold uppercase">Fetching bills history...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-12 gap-5 h-full overflow-hidden">
                    {/* Left: Bills List */}
                    <div className="col-span-7 flex flex-col h-full overflow-hidden bg-slate-950/20 border border-slate-800/80 rounded-xl p-4">
                      <div className="flex flex-col gap-2.5 mb-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Invoices ({historyBills.length})
                          </span>
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-sky-400 font-bold">
                              Mode A: ₹{historyBills.filter(b => b.mode === 'CLINIC_DISPENSING' && b.status !== 'Cancelled').reduce((s, b) => s + (Number(b.grand_total) || 0), 0).toFixed(2)}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="text-emerald-400 font-bold">
                              Mode B: ₹{historyBills.filter(b => b.mode !== 'CLINIC_DISPENSING' && b.status !== 'Cancelled').reduce((s, b) => s + (Number(b.grand_total) || 0), 0).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Mode A vs Mode B Filter Buttons */}
                        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
                          <button
                            type="button"
                            onClick={() => setHistoryModeFilter('ALL')}
                            className={`flex-1 py-1 px-2 rounded font-bold text-[11px] transition-all ${historyModeFilter === 'ALL'
                              ? 'bg-slate-700 text-white shadow-sm'
                              : 'text-slate-400 hover:text-slate-200'
                              }`}
                          >
                            All ({historyBills.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setHistoryModeFilter('CLINIC_DISPENSING')}
                            className={`flex-1 py-1 px-2 rounded font-bold text-[11px] flex items-center justify-center gap-1 transition-all ${historyModeFilter === 'CLINIC_DISPENSING'
                              ? 'bg-sky-600 text-white shadow-sm'
                              : 'text-sky-400/80 hover:text-sky-300'
                              }`}
                          >
                            <Building2 className="w-3 h-3" /> Mode A: Clinic ({historyBills.filter(b => b.mode === 'CLINIC_DISPENSING').length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setHistoryModeFilter('RETAIL_PHARMACY')}
                            className={`flex-1 py-1 px-2 rounded font-bold text-[11px] flex items-center justify-center gap-1 transition-all ${historyModeFilter === 'RETAIL_PHARMACY'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-emerald-400/80 hover:text-emerald-300'
                              }`}
                          >
                            <Store className="w-3 h-3" /> Mode B: Retail ({historyBills.filter(b => b.mode !== 'CLINIC_DISPENSING').length})
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto pr-1">
                        {historyBills.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-slate-600">
                            <FileText className="w-8 h-8 mb-2 stroke-[1.2]" />
                            <span className="text-xs">No bills found for the selected period.</span>
                          </div>
                        ) : (
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-800">
                                <th className="py-2 pl-2">Bill #</th>
                                <th className="py-2">Mode</th>
                                <th className="py-2">Date & Time</th>
                                <th className="py-2">Payment</th>
                                <th className="py-2 text-right pr-2">Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {historyBills.filter(b => historyModeFilter === 'ALL' || b.mode === historyModeFilter || (!b.mode && historyModeFilter === 'RETAIL_PHARMACY')).map((bill) => {
                                const isSelected = selectedBill?.id === bill.id;
                                return (
                                  <tr
                                    key={bill.id}
                                    onClick={() => fetchBillItems(bill)}
                                    className={`border-b border-slate-800/60 cursor-pointer transition-colors ${isSelected ? 'bg-slate-800/80 text-white font-semibold' : 'hover:bg-slate-900/40 text-slate-300'
                                      }`}
                                  >
                                    <td className="py-2.5 pl-2 font-mono font-bold text-bakery-400">#{bill.bill_number}</td>
                                    <td className="py-2.5">
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${bill.mode === 'CLINIC_DISPENSING'
                                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                        }`}>
                                        {bill.mode === 'CLINIC_DISPENSING' ? 'Clinic OP' : 'Retail Rx'}
                                      </span>
                                    </td>
                                    <td className="py-2.5">
                                      <div>{bill.date}</div>
                                      <div className="text-[10px] text-slate-500">{bill.time}</div>
                                    </td>
                                    <td className="py-2.5">
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${bill.payment_method === 'Cash' ? 'bg-emerald-500/10 text-emerald-400' :
                                        bill.payment_method?.toLowerCase() === 'googlepay' ? 'bg-sky-500/10 text-sky-400' :
                                          'bg-purple-500/10 text-purple-400'
                                        }`}>
                                        {bill.payment_method}
                                      </span>
                                    </td>
                                    <td className="py-2.5 text-right pr-2 font-mono text-emerald-400 font-bold">₹{bill.grand_total.toFixed(2)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>

                    {/* Right: Selected Bill Details */}
                    <div className="col-span-5 flex flex-col h-full overflow-hidden bg-slate-950/20 border border-slate-800/80 rounded-xl p-4">
                      {selectedBill ? (
                        <div className="flex flex-col h-full overflow-hidden">
                          <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-3">
                            <div className="min-w-0 flex-1 mr-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Bill Details</span>
                              <span className="text-sm font-bold text-white font-mono truncate block">Bill #{selectedBill.bill_number}</span>
                            </div>

                            <div className="flex space-x-1.5 items-center">
                              {selectedBill.status === 'Cancelled' && (
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase">
                                  Cancelled (Credit Note)
                                </span>
                              )}
                              {selectedBill.is_example ? (
                                <button
                                  onClick={() => deleteExampleBill(selectedBill.id)}
                                  className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/60 font-bold rounded text-[10px] uppercase tracking-wider transition-colors active:scale-95 flex items-center gap-1 flex-shrink-0"
                                  title="Delete Demo / Example Bill Record"
                                >
                                  <Trash2 className="w-3 h-3 text-rose-400" />
                                  <span>Delete Demo Bill</span>
                                </button>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[9px] font-mono text-slate-500 flex items-center gap-1 bg-slate-900 border border-slate-800" title="Statutory 72-month retention under D&C Rule 65 & CGST Act Sec 36. Cancellation via Credit Note only.">
                                  <Lock className="w-2.5 h-2.5 text-slate-500" />
                                  <span>Statutory Retained</span>
                                </span>
                              )}
                              <button
                                onClick={() => handleReprintReceipt(selectedBill, selectedBillItems)}
                                className="px-3 py-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black rounded text-[10px] uppercase tracking-wider transition-colors active:scale-95 flex-shrink-0"
                              >
                                Reprint
                              </button>
                              <button
                                onClick={() => {
                                  setBillToCancel(selectedBill);
                                  setShowCancelModal(true);
                                }}
                                disabled={selectedBill.status === 'Cancelled'}
                                className={`px-3 py-1 font-bold rounded text-[10px] uppercase tracking-wider transition-colors active:scale-95 flex-shrink-0 ${selectedBill.status === 'Cancelled'
                                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                  : 'bg-rose-600 hover:bg-rose-500 text-white'
                                  }`}
                              >
                                {selectedBill.status === 'Cancelled' ? 'Cancelled' : 'Cancel (Credit Note)'}
                              </button>
                            </div>
                          </div>

                          {/* Bill Info Grid */}
                          <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-950/40 p-2.5 rounded border border-slate-800 mb-3 flex-shrink-0">
                            <div>
                              <span className="text-slate-500 uppercase block">Cashier</span>
                              <span className="text-slate-300 font-semibold">{selectedBill.cashier_name}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 uppercase block">Payment</span>
                              <span className="text-slate-300 font-semibold">{selectedBill.payment_method}</span>
                            </div>
                            <div className="mt-1">
                              <span className="text-slate-500 uppercase block">Date</span>
                              <span className="text-slate-300 font-semibold">{selectedBill.date}</span>
                            </div>
                            <div className="mt-1">
                              <span className="text-slate-500 uppercase block">Time</span>
                              <span className="text-slate-300 font-semibold">{selectedBill.time}</span>
                            </div>
                          </div>

                          {/* Items Table */}
                          <div className="flex-1 overflow-y-auto mb-3 pr-1 border-b border-slate-800/50">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="text-[9px] uppercase font-bold text-slate-500 border-b border-slate-800">
                                  <th className="py-1">Item</th>
                                  <th className="py-1 text-center">Qty</th>
                                  <th className="py-1 text-right pr-1">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedBillItems.map((item, idx) => (
                                  <tr key={idx} className="border-b border-slate-800/40 text-slate-300">
                                    <td className="py-2 font-semibold text-white truncate max-w-[120px]">{item.product_name}</td>
                                    <td className="py-2 text-center font-mono">{item.quantity}</td>
                                    <td className="py-2 text-right font-mono pr-1 text-emerald-400">₹{item.total.toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Financial Summary */}
                          <div className="flex flex-col gap-1.5 text-xs font-mono text-slate-400 bg-slate-950/40 p-3 rounded border border-slate-800 flex-shrink-0">
                            <div className="flex justify-between">
                              <span>Subtotal (excl. GST):</span>
                              <span className="text-white">₹{selectedBill.subtotal.toFixed(2)}</span>
                            </div>
                            {selectedBill.discount > 0 && (
                              <div className="flex justify-between text-rose-400">
                                <span>Discount:</span>
                                <span>-₹{selectedBill.discount.toFixed(2)}</span>
                              </div>
                            )}
                            {selectedBill.tax > 0 && (
                              <>
                                <div className="flex justify-between text-amber-400">
                                  <span>CGST (Half):</span>
                                  <span>+₹{(selectedBill.tax / 2).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-amber-400">
                                  <span>SGST (Half):</span>
                                  <span>+₹{(selectedBill.tax / 2).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-amber-400 font-semibold">
                                  <span>Total GST Added:</span>
                                  <span>+₹{selectedBill.tax.toFixed(2)}</span>
                                </div>
                              </>
                            )}
                            <div className="flex justify-between border-t border-slate-800/80 pt-2 font-bold text-sm">
                              <span className="text-white uppercase font-sans">Total Paid (incl. GST):</span>
                              <span className="text-emerald-400">₹{selectedBill.grand_total.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2 text-center">
                          <ShoppingBag className="w-10 h-10 stroke-[1.2]" />
                          <span className="text-xs px-4">Select a bill from the left list to view details and reprint receipt.</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- HARDWARE & RECEIPT SETTINGS MODAL ----------------- */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: '90vh' }}>

            <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
              <span className="text-sm font-bold text-white flex items-center">
                <Settings className="w-4 h-4 mr-2 text-sky-400" />
                POS Settings & Printer Alignment
              </span>
              <button
                onClick={() => {
                  if (currentUser?.role === 'admin') {
                    syncClinicDetailsToServer(bakeryDetails);
                  }
                  setShowSettingsModal(false);
                }}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4 overflow-y-auto flex-1">

              {/* Pharmacy/Clinic Details (Admin Editable Only) */}
              {currentUser?.role === 'admin' ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clinic & Doctor Details</span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSettingsModal(false);
                        setAdminProfileForm({ ...bakeryDetails });
                        setShowAdminProfileModal(true);
                      }}
                      className="text-[10px] font-bold text-sky-400 hover:text-sky-300 underline flex items-center gap-1"
                    >
                      <Stethoscope className="w-3 h-3" />
                      <span>Full Doctor Profile Editor →</span>
                    </button>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Clinic / Pharmacy Name</label>
                    <input
                      type="text"
                      value={bakeryDetails.name}
                      onChange={(e) => setBakeryDetails(prev => ({ ...prev, name: e.target.value }))}
                      className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Tagline / Description</label>
                    <input
                      type="text"
                      value={(bakeryDetails as any).description || 'Mission for Cure'}
                      onChange={(e) => setBakeryDetails(prev => ({ ...prev, description: e.target.value }))}
                      className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Address Line</label>
                    <input
                      type="text"
                      value={bakeryDetails.address}
                      onChange={(e) => setBakeryDetails(prev => ({ ...prev, address: e.target.value }))}
                      className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">City</label>
                      <input
                        type="text"
                        value={bakeryDetails.city || 'Chennai'}
                        onChange={(e) => setBakeryDetails(prev => ({ ...prev, city: e.target.value }))}
                        className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">State</label>
                      <input
                        type="text"
                        value={bakeryDetails.state || 'Tamil Nadu'}
                        onChange={(e) => setBakeryDetails(prev => ({ ...prev, state: e.target.value }))}
                        className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">PIN Code</label>
                      <input
                        type="text"
                        value={bakeryDetails.pincode || '600002'}
                        onChange={(e) => setBakeryDetails(prev => ({ ...prev, pincode: e.target.value }))}
                        className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Phone Number</label>
                      <input
                        type="text"
                        value={bakeryDetails.phone}
                        onChange={(e) => setBakeryDetails(prev => ({ ...prev, phone: e.target.value }))}
                        className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Official Email</label>
                      <input
                        type="email"
                        value={bakeryDetails.email || 'contact@madrasortho.in'}
                        onChange={(e) => setBakeryDetails(prev => ({ ...prev, email: e.target.value }))}
                        className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">GSTIN (Indian GST Number)</label>
                    <input
                      type="text"
                      value={(bakeryDetails as any).gstin || ''}
                      placeholder="e.g. 33AAAAA0000A1Z5"
                      onChange={(e) => setBakeryDetails(prev => ({ ...prev, gstin: e.target.value }))}
                      className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">D.L. Form 20B</label>
                      <input
                        type="text"
                        value={(bakeryDetails as any).dlNo || ''}
                        placeholder="e.g. 20B/TN/CHE/00482"
                        onChange={(e) => setBakeryDetails(prev => ({ ...prev, dlNo: e.target.value }))}
                        className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">D.L. Form 21B</label>
                      <input
                        type="text"
                        value={bakeryDetails.dlNo21 || ''}
                        placeholder="e.g. 21B/TN/CHE/00482"
                        onChange={(e) => setBakeryDetails(prev => ({ ...prev, dlNo21: e.target.value }))}
                        className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Clinical Establishments Act (CEA Reg No)</label>
                    <input
                      type="text"
                      value={bakeryDetails.ceaNo || ''}
                      placeholder="e.g. TN-CEA/2021/04912"
                      onChange={(e) => setBakeryDetails(prev => ({ ...prev, ceaNo: e.target.value }))}
                      className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white font-mono"
                    />
                  </div>

                  <div className="border-t border-slate-800/60 pt-2 flex flex-col gap-2">
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">Chief Doctor & Supervising Pharmacist</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Chief Doctor Name</label>
                        <input
                          type="text"
                          value={bakeryDetails.doctorName || ''}
                          onChange={(e) => setBakeryDetails(prev => ({ ...prev, doctorName: e.target.value }))}
                          className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Medical Council Reg No</label>
                        <input
                          type="text"
                          value={bakeryDetails.doctorRegNo || ''}
                          onChange={(e) => setBakeryDetails(prev => ({ ...prev, doctorRegNo: e.target.value }))}
                          className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white font-mono"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Registered Pharmacist</label>
                        <input
                          type="text"
                          value={bakeryDetails.pharmacistName || ''}
                          onChange={(e) => setBakeryDetails(prev => ({ ...prev, pharmacistName: e.target.value }))}
                          className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Pharmacy Council Reg No</label>
                        <input
                          type="text"
                          value={bakeryDetails.pharmacistRegNo || ''}
                          onChange={(e) => setBakeryDetails(prev => ({ ...prev, pharmacistRegNo: e.target.value }))}
                          className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-[10px] text-slate-400 flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-sky-400 flex-shrink-0" />
                  <span>Clinic Profile & Licensure settings are managed by Admin ({bakeryDetails.name}).</span>
                </div>
              )}

              {/* Printer Hardware & Wireless Connectivity */}
              <div className="flex flex-col gap-3 border-t border-slate-800/80 pt-4 mt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5 text-sky-400" />
                  Thermal Printer Connectivity (USB / WiFi / Bluetooth)
                </span>

                {/* Connection Mode Tabs */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setPrinterInterface('usb')}
                    className={`py-1.5 px-2 text-[10px] font-bold rounded flex items-center justify-center gap-1 transition-all ${printerInterface === 'usb'
                      ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                      : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    <Printer className="w-3 h-3" />
                    <span>USB / Driver</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrinterInterface('wifi')}
                    className={`py-1.5 px-2 text-[10px] font-bold rounded flex items-center justify-center gap-1 transition-all ${printerInterface === 'wifi'
                      ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                      : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    <Wifi className="w-3 h-3" />
                    <span>WiFi / Network</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrinterInterface('bluetooth')}
                    className={`py-1.5 px-2 text-[10px] font-bold rounded flex items-center justify-center gap-1 transition-all ${printerInterface === 'bluetooth'
                      ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                      : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    <Bluetooth className="w-3 h-3" />
                    <span>Bluetooth</span>
                  </button>
                </div>

                {/* USB / System Interface */}
                {printerInterface === 'usb' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Select Connected Printer</label>
                    <select
                      value={selectedPrinter}
                      onChange={(e) => setSelectedPrinter(e.target.value)}
                      className="px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 font-mono"
                    >
                      <option value="Default">System default print wrapper</option>
                      {printers.map((p, idx) => (
                        <option key={idx} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* WiFi / Network Interface */}
                {printerInterface === 'wifi' && (
                  <div className="flex flex-col gap-2 p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
                    <span className="text-[10px] font-semibold text-slate-300">Network ESC/POS Printer (WiFi / Ethernet)</span>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2 flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Printer IP Address</label>
                        <input
                          type="text"
                          placeholder="e.g. 192.168.1.100"
                          value={wifiPrinterIp}
                          onChange={(e) => setWifiPrinterIp(e.target.value)}
                          className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-white font-mono"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Port</label>
                        <input
                          type="number"
                          placeholder="9100"
                          value={wifiPrinterPort}
                          onChange={(e) => setWifiPrinterPort(e.target.value)}
                          className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-white font-mono"
                        />
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-500">Communicates over standard RAW TCP port (9100). Works from computer and mobile app.</span>
                  </div>
                )}

                {/* Bluetooth Interface */}
                {printerInterface === 'bluetooth' && (
                  <div className="flex flex-col gap-2.5 p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-300">Bluetooth Wireless ESC/POS Printer</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${bluetoothDeviceName
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                        {bluetoothDeviceName ? 'Connected' : 'Not Paired'}
                      </span>
                    </div>

                    {bluetoothDeviceName ? (
                      <div className="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded text-xs">
                        <div className="flex items-center gap-2">
                          <Bluetooth className="w-4 h-4 text-sky-400" />
                          <span className="font-mono text-white font-semibold">{bluetoothDeviceName}</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleDisconnectBluetooth}
                          className="px-2 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px] font-bold rounded"
                        >
                          Disconnect
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleConnectBluetooth}
                        disabled={isConnectingBluetooth}
                        className="w-full py-2 bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-bold rounded text-xs transition-all flex items-center justify-center gap-2"
                      >
                        <Bluetooth className="w-4 h-4" />
                        <span>{isConnectingBluetooth ? 'Scanning for Printers...' : 'Scan & Pair Bluetooth Printer'}</span>
                      </button>
                    )}
                    <span className="text-[9px] text-slate-500">Supports standard portable Bluetooth thermal printers (58mm / 80mm).</span>
                  </div>
                )}

                {/* Paper Roll Width */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Thermal Paper Roll Width</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setPaperWidth('58mm')}
                      className={`py-1.5 text-xs font-bold rounded border ${paperWidth === '58mm' ? 'bg-sky-500 text-slate-950 border-sky-500 font-extrabold' : 'bg-slate-950 border-slate-800 hover:bg-slate-900 text-slate-300'
                        }`}
                    >
                      58mm Narrow
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaperWidth('80mm')}
                      className={`py-1.5 text-xs font-bold rounded border ${paperWidth === '80mm' ? 'bg-sky-500 text-slate-950 border-sky-500 font-extrabold' : 'bg-slate-950 border-slate-800 hover:bg-slate-900 text-slate-300'
                        }`}
                    >
                      80mm Standard
                    </button>
                  </div>
                </div>

                {/* Test Print Button */}
                <button
                  type="button"
                  onClick={handleTestPrint}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 mt-1"
                >
                  <Printer className="w-3.5 h-3.5 text-sky-400" />
                  <span>Test Print Receipt ({printerInterface.toUpperCase()})</span>
                </button>
              </div>

              {/* Account Security & Password Management */}
              <div className="flex flex-col gap-3 border-t border-slate-800/80 pt-4 mt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Security & Account Passwords</span>
                {currentUser?.role === 'admin' ? (
                  <button
                    onClick={() => {
                      setShowSettingsModal(false);
                      setChangePasswordModal(true);
                    }}
                    className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Change Admin or Employee Passwords</span>
                  </button>
                ) : (
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-[10px] text-slate-400 flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Password Management is restricted. Only Admin accounts can change passwords.</span>
                  </div>
                )}
              </div>

              {/* Bill Number Sequence Reset & Device Data Management (Admin Only) */}
              {currentUser?.role === 'admin' && (
                <>
                  <div className="flex flex-col gap-3 border-t border-slate-800/80 pt-4 mt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bill Number Sequence</span>
                    <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 flex flex-col gap-2">
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Bill numbers restart automatically every new day. Use the reset below to manually restart the sequence from <span className="text-white font-bold">#1</span> at any time (e.g., beginning of a new shift).
                      </p>
                      <p className="text-[10px] text-amber-400/80 font-semibold">
                        ⚠ This will close all open bill tabs and cannot be undone.
                      </p>
                      <button
                        onClick={() => {
                          showConfirm({
                            title: "Reset Bill Sequence",
                            message: "Reset bill number sequence to #1?\n\nAll open bill tabs will be closed. This cannot be undone.",
                            type: "danger",
                            confirmText: "Reset Sequence",
                            onConfirm: () => {
                              // Clear counter and date so next bill starts fresh at 1
                              localStorage.removeItem('bakers_pos_last_bill_num');
                              localStorage.removeItem('bakers_pos_bill_date');
                              localStorage.removeItem('bakers_pos_sessions');
                              localStorage.removeItem('bakers_pos_active_session');
                              localStorage.removeItem('madrasortho_pos_last_bill_num');
                              localStorage.removeItem('madrasortho_pos_bill_date');
                              localStorage.removeItem('madrasortho_pos_sessions');
                              localStorage.removeItem('madrasortho_pos_active_session');
                              setSessions([]);
                              setShowSettingsModal(false);
                              showToast("Bill sequence reset. Next bill will be #1.", "info");
                              // createNewBill after short delay so state clears first
                              setTimeout(() => createNewBill(), 100);
                              closeConfirm();
                            }
                          });
                        }}
                        className="w-full py-2 bg-rose-900/40 hover:bg-rose-800/60 active:scale-[0.98] transition-all border border-rose-700/50 rounded-lg text-xs font-bold text-rose-300 hover:text-rose-200"
                      >
                        Reset Bill Sequence → Start from #1
                      </button>
                    </div>
                  </div>

                  {/* Device Data & Uninstall Management */}
                  <div className="flex flex-col gap-3 border-t border-slate-800/80 pt-4 mt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-rose-400" />
                      Device Storage & Uninstall Options
                    </span>
                    <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 flex flex-col gap-2.5">
                      <div className="flex flex-col gap-1.5 text-[10px] text-slate-400 leading-relaxed">
                        <p className="flex items-start gap-1.5">
                          <span className="text-sky-400 font-bold shrink-0">💻 Windows Desktop:</span>
                          <span>When you uninstall via Windows Settings / Control Panel, you will be prompted with a choice to permanently delete all clinic databases, bill archives, and patient records, or keep them for future reinstallation.</span>
                        </p>
                        <p className="flex items-start gap-1.5">
                          <span className="text-emerald-400 font-bold shrink-0">📱 Android Mobile:</span>
                          <span>When uninstalling the APK, Android prompts whether to preserve or remove all local app storage from your device.</span>
                        </p>
                      </div>

                      <div className="border-t border-slate-800/60 pt-2 flex flex-col gap-1.5">
                        <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          Clinic Clean Slate (Purge Example Records Only)
                        </span>
                        <p className="text-[10px] text-slate-300 leading-relaxed">
                          Quickly clear out all pre-seeded demo records (example patient profiles, demo employees, and sample bills) with one click so the clinic starts with a 100% clean slate. Genuine records created by the clinic are strictly protected and kept safe.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            showConfirm({
                              title: "Purge All Example / Demo Records?",
                              message: "This will permanently remove ONLY pre-seeded example patients, demo employees, and demo bills.\n\nAll real clinical and pharmacy records created by your clinic will remain completely safe and untouched.\n\nProceed with clearing demo records?",
                              type: "danger",
                              confirmText: "Purge Example Records",
                              onConfirm: async () => {
                                try {
                                  const res = await fetch(apiUrl("/api/system/clear-example-records"), { method: 'POST' });
                                  const data = await res.json();
                                  closeConfirm();
                                  setShowSettingsModal(false);
                                  showToast(data.message || "All demo/example records successfully purged.", "success");
                                  loadEmployees();
                                  fetchHistory();
                                } catch (err: any) {
                                  closeConfirm();
                                  showToast("Failed to purge demo records: " + (err.message || err), "error");
                                }
                              }
                            });
                          }}
                          className="w-full py-2 bg-amber-600/30 hover:bg-amber-600/50 active:scale-[0.98] transition-all border border-amber-500/50 rounded-lg text-xs font-bold text-amber-200 hover:text-white flex items-center justify-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Purge All Example / Demo Records</span>
                        </button>
                      </div>

                      <div className="border-t border-slate-800/60 pt-2 flex flex-col gap-1.5">
                        <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          Clean Device Wipe (Pre-Uninstall / Factory Reset)
                        </span>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          Permanently wipe all local billing history, sales records, employee lists, and database files stored on this device.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            showConfirm({
                              title: "Delete All Data From Device?",
                              message: "WARNING: This will permanently delete ALL local bills, sales history, employee lists, and local database files stored on this device.\n\nUse this option if you are planning to uninstall the software, transfer the device, or perform a complete factory wipe.\n\nAre you sure you want to proceed?",
                              type: "danger",
                              confirmText: "Yes, Delete All Data",
                              onConfirm: async () => {
                                try {
                                  const res = await fetch(apiUrl("/api/system/wipe-all-data"), { method: 'POST' });
                                  const data = await res.json();
                                  // Clear client storage
                                  localStorage.clear();
                                  sessionStorage.clear();
                                  setShowSettingsModal(false);
                                  closeConfirm();
                                  showToast(data.message || "All clinic records deleted from device.", "success");
                                  setTimeout(() => {
                                    window.location.reload();
                                  }, 1200);
                                } catch (err: any) {
                                  // If offline / mobile fallback
                                  localStorage.clear();
                                  sessionStorage.clear();
                                  setShowSettingsModal(false);
                                  closeConfirm();
                                  showToast("All local mobile storage deleted.", "success");
                                  setTimeout(() => {
                                    window.location.reload();
                                  }, 1200);
                                }
                              }
                            });
                          }}
                          className="w-full py-2 bg-rose-950/40 hover:bg-rose-900/60 active:scale-[0.98] transition-all border border-rose-800/60 rounded-lg text-xs font-bold text-rose-300 hover:text-rose-100 flex items-center justify-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Wipe & Remove All Data From This Device</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-3 bg-slate-950 text-xs flex items-center justify-between border-t border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono">
                {currentUser?.role === 'admin' ? 'Settings save & sync across all devices.' : 'Printer preferences save for this terminal.'}
              </span>
              {currentUser?.role === 'admin' ? (
                <button
                  type="button"
                  onClick={() => {
                    syncClinicDetailsToServer(bakeryDetails);
                    setShowSettingsModal(false);
                    showToast("Clinic settings saved and synced across all devices.", "success");
                  }}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  Save & Broadcast Changes
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowSettingsModal(false);
                    showToast("Printer settings saved for this terminal.", "success");
                  }}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- ADMIN EMPLOYEES EDITOR CRUD MODAL ----------------- */}
      {showEmployeeCrudModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl shadow-2xl h-[600px] flex overflow-hidden">

            {/* Left Column: Form Editor */}
            <div className="w-5/12 bg-slate-900 border-r border-slate-800 p-5 flex flex-col overflow-y-auto">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center">
                <Users className="w-4 h-4 mr-2 text-sky-400" />
                {editingEmployee.id ? 'Edit Employee Details' : 'Add New Employee'}
              </h3>

              {currentUser?.role !== 'admin' && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-amber-400 text-xs font-semibold mb-3">
                  <div className="flex items-center space-x-2">
                    <Lock className="w-4 h-4 flex-shrink-0 text-amber-400" />
                    <span>View Only: Login as Admin to add, edit, or delete staff.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmployeeCrudModal(false);
                      handleLogout();
                    }}
                    className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded text-[10px] font-bold"
                  >
                    Switch to Admin
                  </button>
                </div>
              )}

              <form onSubmit={saveEmployee} className="flex flex-col gap-4 flex-1">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Full Name *</label>
                  <input
                    type="text"
                    required
                    disabled={currentUser?.role !== 'admin'}
                    value={editingEmployee.name || ''}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                    className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none disabled:opacity-50"
                    placeholder="Enter full name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Role / Position *</label>
                    <select
                      disabled={currentUser?.role !== 'admin'}
                      value={editingEmployee.role || ''}
                      required
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, role: e.target.value })}
                      className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 focus:border-sky-500 focus:outline-none disabled:opacity-50"
                    >
                      <option value="" disabled>Select Role / Position</option>
                      <optgroup label="── Ownership ──">
                        <option value="Owner">Owner</option>
                      </optgroup>
                      <optgroup label="── Medical Staff ──">
                        <option value="Orthopaedic Surgeon">Orthopaedic Surgeon</option>
                        <option value="Consultant Physician">Consultant Physician</option>
                        <option value="Physiotherapist">Physiotherapist</option>
                        <option value="Anaesthesiologist">Anaesthesiologist</option>
                        <option value="Radiologist">Radiologist</option>
                      </optgroup>
                      <optgroup label="── Pharmacy & Billing ──">
                        <option value="Pharmacist">Pharmacist</option>
                        <option value="Pharmacy Assistant">Pharmacy Assistant</option>
                        <option value="Billing Clerk">Billing Clerk</option>
                        <option value="Cashier">Cashier</option>
                      </optgroup>
                      <optgroup label="── Allied Health ──">
                        <option value="Nursing Staff">Nursing Staff</option>
                        <option value="Lab Technician">Lab Technician</option>
                        <option value="X-Ray Technician">X-Ray Technician</option>
                        <option value="Operation Theatre Technician">Operation Theatre Technician</option>
                      </optgroup>
                      <optgroup label="── Administration ──">
                        <option value="Receptionist">Receptionist</option>
                        <option value="Hospital Administrator">Hospital Administrator</option>
                        <option value="Medical Records Officer">Medical Records Officer</option>
                      </optgroup>
                      <optgroup label="── Support Staff ──">
                        <option value="Ward Attendant">Ward Attendant</option>
                        <option value="Security Guard">Security Guard</option>
                        <option value="Housekeeping">Housekeeping</option>
                        <option value="Driver">Driver</option>
                      </optgroup>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Status</label>
                    <select
                      disabled={currentUser?.role !== 'admin'}
                      value={editingEmployee.status || 'Active'}
                      onChange={(e: any) => setEditingEmployee({ ...editingEmployee, status: e.target.value })}
                      className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 focus:border-sky-500 focus:outline-none disabled:opacity-50"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Qualifications / Degrees</label>
                    <input
                      type="text"
                      disabled={currentUser?.role !== 'admin'}
                      value={editingEmployee.qualification || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, qualification: e.target.value })}
                      className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none disabled:opacity-50"
                      placeholder="e.g. MBBS, MS (Ortho) or B.Pharm"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Council Reg No (TNMC / TNSPC)</label>
                    <input
                      type="text"
                      disabled={currentUser?.role !== 'admin'}
                      value={editingEmployee.reg_no || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, reg_no: e.target.value })}
                      className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none disabled:opacity-50 font-mono"
                      placeholder="e.g. TNMC/2012/94821"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</label>
                    <input
                      type="text"
                      disabled={currentUser?.role !== 'admin'}
                      value={editingEmployee.phone || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, phone: e.target.value })}
                      className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none disabled:opacity-50"
                      placeholder="e.g. +91 98765 43210"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
                    <input
                      type="email"
                      disabled={currentUser?.role !== 'admin'}
                      value={editingEmployee.email || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, email: e.target.value })}
                      className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none disabled:opacity-50"
                      placeholder="e.g. john@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Monthly Salary (₹)</label>
                    <input
                      type="number"
                      disabled={currentUser?.role !== 'admin'}
                      value={editingEmployee.salary !== undefined && editingEmployee.salary !== null ? editingEmployee.salary : ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, salary: e.target.value ? Number(e.target.value) : null })}
                      className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none disabled:opacity-50"
                      placeholder="e.g. 25000"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Joined Date</label>
                    <input
                      type="date"
                      disabled={currentUser?.role !== 'admin'}
                      value={editingEmployee.joined_date || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, joined_date: e.target.value })}
                      className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:border-sky-500 focus:outline-none disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="flex space-x-2 mt-6">
                  <button
                    type="submit"
                    disabled={currentUser?.role !== 'admin'}
                    className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded text-xs transition-colors shadow-lg shadow-sky-600/10 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {editingEmployee.id ? 'Update Employee' : 'Add Employee'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingEmployee({})}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors active:scale-95"
                  >
                    Clear
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column: Existing Employees List Table */}
            <div className="flex-1 p-5 flex flex-col overflow-hidden bg-slate-950/20">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Clinic Employees List</h3>
                <button
                  onClick={() => setShowEmployeeCrudModal(false)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Fast filter */}
              <input
                type="text"
                placeholder="Search employees by name or role..."
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 text-xs rounded mb-3 focus:border-sky-500 focus:outline-none"
              />

              <div className="flex-1 overflow-y-auto">
                {employees.filter(emp => !employeeSearch || emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) || emp.role.toLowerCase().includes(employeeSearch.toLowerCase())).length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
                    <Users className="w-8 h-8 stroke-[1.2]" />
                    <span className="text-xs">No employees found.</span>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-800">
                        <th className="py-2">Employee Name</th>
                        <th className="py-2">Role</th>
                        <th className="py-2 text-right">Salary</th>
                        <th className="py-2 text-center">Status</th>
                        <th className="py-2 text-right w-16">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees
                        .filter(emp => !employeeSearch || emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) || emp.role.toLowerCase().includes(employeeSearch.toLowerCase()))
                        .map(emp => (
                          <tr key={emp.id} className="border-b border-slate-800/60 hover:bg-slate-900/40">
                            <td className="py-2.5 font-semibold text-white">
                              <div>{emp.name}</div>
                              {emp.qualification && <div className="text-[10px] text-sky-400 font-medium">{emp.qualification}</div>}
                              {emp.reg_no && <div className="text-[9px] text-indigo-400 font-mono">Reg: {emp.reg_no}</div>}
                              {emp.phone && <div className="text-[10px] text-slate-500 font-normal font-mono">{emp.phone}</div>}
                            </td>
                            <td className="py-2.5 text-slate-400 font-medium">
                              <div>{emp.role}</div>
                              {emp.joined_date && <div className="text-[9px] text-slate-600 font-normal">Joined: {emp.joined_date}</div>}
                            </td>
                            <td className="py-2.5 text-right font-mono text-emerald-400 font-semibold">
                              {emp.salary ? `₹${emp.salary.toLocaleString()}` : '—'}
                            </td>
                            <td className="py-2.5 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${emp.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500 border border-slate-700/50'
                                  }`}>
                                  {emp.status}
                                </span>
                                {emp.is_example ? (
                                  <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                    Demo Record
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                                    Clinic Staff
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 text-right flex justify-end space-x-1.5">
                              <button
                                onClick={() => setEditingEmployee(emp)}
                                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-sky-400 rounded transition-colors"
                                title="Edit employee"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              {emp.username === 'admin' ? (
                                <span
                                  className="p-1 text-slate-600 cursor-not-allowed rounded"
                                  title="Primary administrator account is protected and cannot be deleted."
                                >
                                  <Lock className="w-3.5 h-3.5 text-slate-600" />
                                </span>
                              ) : (
                                <button
                                  onClick={() => deleteEmployee(emp.id)}
                                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-rose-500 rounded transition-colors"
                                  title="Delete Employee Record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- CUSTOM CONFIRMATION DIALOG ----------------- */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in">
            {/* Header section with icon */}
            <div className="p-5 flex items-start gap-4">
              <div className={`p-3 rounded-lg ${confirmDialog.type === 'danger' ? 'bg-rose-500/10 text-rose-400' :
                confirmDialog.type === 'info' ? 'bg-sky-500/10 text-sky-400' :
                  'bg-amber-500/10 text-amber-400'
                }`}>
                {confirmDialog.type === 'danger' ? (
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                ) : confirmDialog.type === 'info' ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <AlertCircle className="w-6 h-6 animate-pulse" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
                  {confirmDialog.title}
                </h3>
                <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                  {confirmDialog.message}
                </p>
              </div>
            </div>

            {/* Actions section */}
            <div className="bg-slate-950/40 px-5 py-3.5 border-t border-slate-800/60 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (confirmDialog.onCancel) {
                    confirmDialog.onCancel();
                  }
                  closeConfirm();
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs transition-colors active:scale-95"
              >
                {confirmDialog.cancelText}
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-2 text-white font-bold rounded-lg text-xs transition-colors shadow-lg active:scale-95 ${confirmDialog.type === 'danger' ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/10' :
                  confirmDialog.type === 'info' ? 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/10' :
                    'bg-amber-600 hover:bg-amber-500 shadow-amber-600/10'
                  }`}
                autoFocus
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- DOCTOR PROFILE & CLINIC LICENSURE MODAL ----------------- */}
      {showAdminProfileModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 lg:p-6 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">

            {/* Modal Header */}
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm lg:text-base font-bold text-white flex items-center gap-2">
                    Doctor Profile, Clinic Establishment & Licensure
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      TNMC & TN-CEA Compliant
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Manage prescriber credentials, statutory drug licences (Form 20B/21B), and clinic branding
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAdminProfileModal(false)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Scrollable Form */}
            <form onSubmit={handleSaveAdminProfile} className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* SECTION 1: Chief Doctor / Prescribing Specialist Details */}
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-sky-400" />
                    Doctor Profile & Prescriber Credentials (Medical Council of India / TNMC)
                  </span>
                  <span className="text-[10px] text-slate-400">Required on all outpatient bills & Schedule H/H1 registers</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-300 uppercase">
                      Chief Doctor Full Name & Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={adminProfileForm.doctorName || ''}
                      onChange={(e) => setAdminProfileForm(prev => ({ ...prev, doctorName: e.target.value }))}
                      placeholder="e.g. Dr. Arjun Sharma, MS (Ortho)"
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-300 uppercase">
                      Degrees & Medical Qualifications
                    </label>
                    <input
                      type="text"
                      value={adminProfileForm.doctorDegrees || ''}
                      onChange={(e) => setAdminProfileForm(prev => ({ ...prev, doctorDegrees: e.target.value }))}
                      placeholder="e.g. MBBS, MS (Orthopaedics), MCh (Ortho), DNB"
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-300 uppercase">
                      Medical Council Reg. Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={adminProfileForm.doctorRegNo || ''}
                      onChange={(e) => setAdminProfileForm(prev => ({ ...prev, doctorRegNo: e.target.value }))}
                      placeholder="e.g. TNMC/2012/94821"
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-300 uppercase">
                      State Medical Council
                    </label>
                    <input
                      type="text"
                      value={adminProfileForm.doctorCouncil || 'Tamil Nadu Medical Council'}
                      onChange={(e) => setAdminProfileForm(prev => ({ ...prev, doctorCouncil: e.target.value }))}
                      placeholder="e.g. Tamil Nadu Medical Council"
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-300 uppercase">
                      Clinical Specialty / Designation
                    </label>
                    <input
                      type="text"
                      value={adminProfileForm.doctorSpecialty || ''}
                      onChange={(e) => setAdminProfileForm(prev => ({ ...prev, doctorSpecialty: e.target.value }))}
                      placeholder="e.g. Consultant Orthopaedic Surgeon"
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-300 uppercase">
                      Doctor Direct Phone / Mobile
                    </label>
                    <input
                      type="text"
                      value={adminProfileForm.doctorPhone || ''}
                      onChange={(e) => setAdminProfileForm(prev => ({ ...prev, doctorPhone: e.target.value }))}
                      placeholder="e.g. +91 98401 22334"
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-300 uppercase">
                      Doctor Professional Email
                    </label>
                    <input
                      type="email"
                      value={adminProfileForm.doctorEmail || ''}
                      onChange={(e) => setAdminProfileForm(prev => ({ ...prev, doctorEmail: e.target.value }))}
                      placeholder="e.g. dr.arjun@madrasortho.in"
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Clinic Establishment & Statutory Licences */}
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    Clinic Establishment & Statutory Licences (TN-CEA, Form 20B/21B, GSTIN)
                  </span>
                  <span className="text-[10px] text-slate-400">Printed on bill headers & regulatory audits</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-300 uppercase">
                      Clinic / Hospital Establishment Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={adminProfileForm.name || ''}
                      onChange={(e) => setAdminProfileForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. MADRAS ORTHO CLINIC & PHARMACY"
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-semibold"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-300 uppercase">
                      Tagline / Clinical Focus
                    </label>
                    <input
                      type="text"
                      value={adminProfileForm.description || ''}
                      onChange={(e) => setAdminProfileForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="e.g. Center for Orthopaedic Surgery & Trauma Care"
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-300 uppercase">
                    Clinic Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={adminProfileForm.address || ''}
                    onChange={(e) => setAdminProfileForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="e.g. 42 Anna Salai, Thousand Lights"
                    className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-300 uppercase">City</label>
                    <input
                      type="text"
                      value={adminProfileForm.city || 'Chennai'}
                      onChange={(e) => setAdminProfileForm(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Chennai"
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-300 uppercase">State</label>
                    <input
                      type="text"
                      value={adminProfileForm.state || 'Tamil Nadu'}
                      onChange={(e) => setAdminProfileForm(prev => ({ ...prev, state: e.target.value }))}
                      placeholder="Tamil Nadu"
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-300 uppercase">PIN Code</label>
                    <input
                      type="text"
                      value={adminProfileForm.pincode || '600002'}
                      onChange={(e) => setAdminProfileForm(prev => ({ ...prev, pincode: e.target.value }))}
                      placeholder="600002"
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-300 uppercase">
                      Clinic Reception / Landline Phone *
                    </label>
                    <input
                      type="text"
                      required
                      value={adminProfileForm.phone || ''}
                      onChange={(e) => setAdminProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="e.g. +91 44 2855 0123 / +91 98401 22334"
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-300 uppercase">
                      Clinic Official Email
                    </label>
                    <input
                      type="email"
                      value={adminProfileForm.email || ''}
                      onChange={(e) => setAdminProfileForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="e.g. contact@madrasortho.in"
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800/60">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-300 uppercase">
                      GSTIN (15-Digit Goods & Services Tax Number)
                    </label>
                    <input
                      type="text"
                      value={adminProfileForm.gstin || ''}
                      onChange={(e) => setAdminProfileForm(prev => ({ ...prev, gstin: e.target.value }))}
                      placeholder="e.g. 33AAAAA0000A1Z5"
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono placeholder-slate-500 focus:border-emerald-500 focus:outline-none uppercase"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-300 uppercase">
                      Clinical Establishments Act Reg No (TN-CEA)
                    </label>
                    <input
                      type="text"
                      value={adminProfileForm.ceaNo || ''}
                      onChange={(e) => setAdminProfileForm(prev => ({ ...prev, ceaNo: e.target.value }))}
                      placeholder="e.g. TN-CEA/2021/04912"
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-300 uppercase">
                      Drug License Form 20B (Retail Allopathic Drugs)
                    </label>
                    <input
                      type="text"
                      value={adminProfileForm.dlNo || ''}
                      onChange={(e) => setAdminProfileForm(prev => ({ ...prev, dlNo: e.target.value }))}
                      placeholder="e.g. 20B/TN/CHE/00482"
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-300 uppercase">
                      Drug License Form 21B (Schedule C & C1 Biologicals)
                    </label>
                    <input
                      type="text"
                      value={adminProfileForm.dlNo21 || ''}
                      onChange={(e) => setAdminProfileForm(prev => ({ ...prev, dlNo21: e.target.value }))}
                      placeholder="e.g. 21B/TN/CHE/00482"
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Supervising Pharmacist In-Charge */}
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    Supervising Pharmacist In-Charge (Section 42, Pharmacy Act & TNSPC)
                  </span>
                  <span className="text-[10px] text-slate-400">Required for Schedule H, H1 & Retail dispensing</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-300 uppercase">
                      Registered Pharmacist Name
                    </label>
                    <input
                      type="text"
                      value={adminProfileForm.pharmacistName || ''}
                      onChange={(e) => setAdminProfileForm(prev => ({ ...prev, pharmacistName: e.target.value }))}
                      placeholder="e.g. Priya Nair, B.Pharm"
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-300 uppercase">
                      TNSPC Registration Number
                    </label>
                    <input
                      type="text"
                      value={adminProfileForm.pharmacistRegNo || ''}
                      onChange={(e) => setAdminProfileForm(prev => ({ ...prev, pharmacistRegNo: e.target.value }))}
                      placeholder="e.g. TNSPC/2018/48912"
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-300 uppercase">
                      State Pharmacy Council
                    </label>
                    <input
                      type="text"
                      value={adminProfileForm.stateCouncil || 'Tamil Nadu State Pharmacy Council'}
                      onChange={(e) => setAdminProfileForm(prev => ({ ...prev, stateCouncil: e.target.value }))}
                      placeholder="Tamil Nadu State Pharmacy Council"
                      className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: Administrator Account & Passwords */}
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    Administrator Account & Security
                  </span>
                  <span className="text-[10px] text-slate-400">Master login credentials for clinic doctor</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-900/80 border border-slate-800 rounded-lg">
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Admin Username: <span className="font-mono text-amber-400">{adminProfileForm.adminUsername || 'admin'}</span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      The admin user has full supervisory authority to edit doctor credentials, clinic licenses, and employee records.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdminProfileModal(false);
                      setChangePasswordModal(true);
                    }}
                    className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Change Account Passwords</span>
                  </button>
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-md pt-4 pb-2 border-t border-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setShowAdminProfileModal(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAdminProfileForm({ ...bakeryDetails });
                      showToast("Form reloaded with current clinic details.", "info");
                    }}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Reset Form
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-sky-600/20 active:scale-95 flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save All Doctor & Clinic Details</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}
      {changePasswordModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
              <span className="text-sm font-bold text-white flex items-center">
                <KeyRound className="w-4 h-4 mr-2 text-amber-400" />
                Change Password
              </span>
              <button
                onClick={() => setChangePasswordModal(false)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Target User Account</label>
                <select
                  value={passwordForm.username}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, username: e.target.value }))}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                >
                  <option value="admin">Admin (admin)</option>
                  <option value="employee">Employee (employee)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Current Password *</label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="Enter current password..."
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">New Password *</label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter new password..."
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password..."
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs transition-colors mt-2"
              >
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- CREATE CATEGORY MODAL (ADMIN ONLY) ----------------- */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-bold text-white">Create Custom Category</h3>
              </div>
              <button
                onClick={() => setShowAddCategoryModal(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Create a new category to organize orthopaedic medicines and clinical supplies for Madras Ortho Clinic.
            </p>
            <div>
              <label className="text-[10px] font-bold text-slate-300 uppercase block mb-1">Category Name *</label>
              <input
                type="text"
                autoFocus
                placeholder="e.g. Spine Implants, Pediatric Suspensions, Post-Op Care"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateCategory(newCategoryName);
                  }
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-medium"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleCreateCategory(newCategoryName)}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 active:scale-95 transition-all"
              >
                Create Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- STATUTORY INVOICE CANCELLATION MODAL (CREDIT NOTE) ----------------- */}
      {showCancelModal && billToCancel && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                Cancel Statutory Invoice #{billToCancel.bill_number}
              </span>
              <button
                onClick={() => setShowCancelModal(false)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4 text-xs">
              <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-xl text-rose-200 text-[11px] leading-relaxed">
                <strong>Statutory Notice:</strong> Under Rule 65(4) of Drugs & Cosmetics Rules and Section 36 of the CGST Act, statutory drug invoices cannot be deleted. Cancelling this bill will issue a formal <strong>Credit Note</strong> and preserve the transaction in the permanent audit trail.
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Reason for Invoice Cancellation *
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                >
                  <option value="Patient returned medicine unopened within 24h">Patient returned medicine unopened within 24h</option>
                  <option value="Billing entry error / incorrect quantity">Billing entry error / incorrect quantity</option>
                  <option value="Prescription modified by Orthopaedic Doctor">Prescription modified by Orthopaedic Doctor</option>
                  <option value="Payment mode failure / re-billing required">Payment mode failure / re-billing required</option>
                </select>
              </div>

              <div className="flex space-x-2 mt-2">
                <button
                  onClick={() => handleCancelBill(billToCancel.id, cancelReason)}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-rose-600/20 active:scale-95"
                >
                  Confirm Cancellation & Issue Credit Note
                </button>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- PATIENT DATABASE MODAL ----------------- */}
      <PatientsModal
        isOpen={showPatientsModal}
        onClose={() => {
          setShowPatientsModal(false);
          fetchPatients();
        }}
        onSelectPatient={(patient: any) => {
          selectPatientInCheckout(patient);
          setShowPatientsModal(false);
        }}
      />

      {/* ----------------- REAL-TIME NOTIFICATIONS & EXPIRY MODAL ----------------- */}
      <NotificationsModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        data={notificationsData}
        onRefresh={fetchNotifications}
        onNavigateToInward={() => {
          setShowNotificationsModal(false);
          setProductModalTab('inward');
          setShowProductCrudModal(true);
        }}
        onSelectProductForBilling={(productName) => {
          setShowNotificationsModal(false);
          setSearchQuery(productName);
        }}
      />


      {/* ----------------- TOAST STATUS BANNER ----------------- */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center px-4 py-2.5 bg-slate-900 border border-slate-800 text-xs rounded-xl shadow-2xl animate-bounce">
          {toast.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-400 mr-2" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 mr-2" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400 mr-2" />
          )}
          <span className="font-semibold text-slate-200">{toast.message}</span>
        </div>
      )}

    </div>
  );
}

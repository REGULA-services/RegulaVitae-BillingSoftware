import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus, Minus, Trash2, ShoppingBag, Users,
  BarChart2, Wifi, CheckCircle2, AlertTriangle,
  AlertCircle, X, ChevronRight, Download, RefreshCw, LogOut,
  Package, Edit2, ShieldAlert, Printer, Eye,
  Settings, UserCheck, Tag, Sparkles, Bell
} from 'lucide-react';
import { apiUrl, authApiUrl, getAuthToken, setAuthToken, getSavedClinicServerUrl, setSavedClinicServerUrl, getApiBaseUrl, round2, toPaise } from '../utils/apiConfig';
import { NotificationsModal, NotificationsData } from './NotificationsModal';

interface Product {
  id: number;
  name: string;
  generic_name?: string;
  category: string;
  price: number; // Price sold at
  mrp?: number;
  purchase_price?: number;
  available_stock?: number;
  batch_number?: string;
  expiry_date?: string;
  is_expired?: boolean;
  is_out_of_stock?: boolean;
  status?: string;
  quantity_type?: string;
  tax_percent?: number;
  hsn_code?: string;
  barcode?: string;
  rack_location?: string;
  schedule?: string;
  dosage_form?: string;
}

interface CartItem {
  id: number;
  name: string;
  generic_name?: string;
  batch_number?: string;
  expiry_date?: string;
  mrp: number;
  rate: number; // Price sold at
  purchase_price: number;
  quantity: number;
  available_stock: number;
  tax_percent: number;
}

interface Patient {
  id: number;
  name: string;
  age?: number;
  gender?: string;
  phone?: string;
  mrn?: string;
  address?: string;
  doctor?: string;
  diagnosis?: string;
  notes?: string;
  created_at?: string;
}

interface Employee {
  id: number;
  username?: string;
  name: string;
  role: 'admin' | 'pharmacist' | 'cashier';
  phone?: string;
  email?: string;
  shift?: string;
  active?: number | boolean;
}

interface BillRecord {
  id: number;
  bill_number: string;
  date: string;
  created_at?: string;
  patient_name?: string;
  patient_phone?: string;
  doctor?: string;
  payment_method?: string;
  subtotal?: number;
  discount?: number;
  tax?: number;
  total: number;
  grand_total?: number;
  total_amount?: number;
  total_mrp?: number;
  status?: string;
  items?: any[];
  items_json?: string;
  cancelled_reason?: string;
}

interface MobileTabletAppProps {
  onSwitchToDesktop?: () => void;
  currentUser: { id?: number; username: string; role: string; name?: string } | null;
  onLogout?: () => void;
}

const CLINIC_DOCTORS = [
  { name: "Dr. Arjun Sharma, MS (Ortho)", specialty: "Senior Consultant Orthopaedic Surgeon" },
  { name: "Dr. Meera Chandran, D.Ortho, DNB", specialty: "Associate Orthopaedic Surgeon" },
  { name: "Dr. S. K. Rajasekaran, MCh (Ortho)", specialty: "Spine & Joint Replacement Specialist" },
  { name: "Dr. K. Vigneshwaran, MS (Ortho)", specialty: "Sports Medicine & Arthroscopy" }
];

export const printMobileThermalReceipt = (bill: any, pharmacyDetails: any = null) => {
  const details = pharmacyDetails || {
    name: "MADRAS ORTHO CLINIC PHARMACY",
    address: "Chennai, Tamil Nadu",
    phone: "+91 98400 12345",
    gstin: "33AAAAA0000A1Z5",
    dlNo: "20B/TN/CHE/00482"
  };

  const billNumber = bill.billNumber || bill.bill_number || 1;
  const date = bill.date ? String(bill.date).substring(0, 10) : new Date().toISOString().split('T')[0];
  const time = bill.time || new Date().toTimeString().split(' ')[0];
  const paymentMethod = bill.paymentMethod || bill.payment_method || 'Cash';
  const rawItems = bill.items || (bill.items_json ? (typeof bill.items_json === 'string' ? JSON.parse(bill.items_json) : bill.items_json) : []);
  const items = Array.isArray(rawItems) ? rawItems : [];
  const subtotal = bill.subtotal !== undefined ? bill.subtotal : (bill.totalAmount || bill.total || bill.grand_total || 0);
  const discount = bill.discount || 0;
  const tax = bill.tax || 0;
  const cgst = tax > 0 ? tax / 2 : 0;
  const sgst = tax > 0 ? tax / 2 : 0;
  const grandTotal = bill.grand_total !== undefined ? bill.grand_total : (bill.totalAmount !== undefined ? bill.totalAmount : (bill.total !== undefined ? bill.total : subtotal - discount + tax));

  const thermalHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Receipt #${billNumber}</title>
      <style>
        @page { margin: 0; }
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 11px;
          line-height: 1.35;
          margin: 0;
          padding: 8px;
          color: #000;
          background: #fff;
          width: 80mm;
          max-width: 80mm;
        }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .header-title { font-size: 14px; font-weight: bold; margin-bottom: 2px; text-transform: uppercase; }
        .sub-info { font-size: 9.5px; }
        .separator { border-top: 1px dashed #000; margin: 4px 0; }
        .info-table, .items-table { width: 100%; border-collapse: collapse; }
        .info-table td { padding: 1px 0; font-size: 9.5px; }
        .items-table th { text-align: left; border-bottom: 1px dashed #000; padding-bottom: 2px; font-size: 9.5px; font-weight: bold; }
        .items-table td { padding: 2px 0; vertical-align: top; font-size: 10px; }
        .right { text-align: right; }
        .totals-container { width: 100%; margin-top: 4px; }
        .totals-table { width: 85%; margin-left: 15%; font-size: 10px; }
        .totals-table td { padding: 1.5px 0; }
        .footer { margin-top: 8px; font-size: 9.5px; }
      </style>
    </head>
    <body>
      <div class="center">
        <div class="header-title">${details.name || 'MADRAS ORTHO CLINIC PHARMACY'}</div>
        <div class="sub-info bold">Center for Orthopaedic Surgery & Pharmacy</div>
        <div class="sub-info">${details.address || 'Chennai, Tamil Nadu'}</div>
        <div class="sub-info">Ph: ${details.phone || '+91 98400 12345'}</div>
        ${details.gstin ? `<div class="sub-info bold">GSTIN: ${details.gstin}</div>` : ''}
        <div class="sub-info">Drug Lic: ${details.dlNo || '20B/TN/CHE/00482'}</div>
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
        ${(bill.patient_name || bill.patientName) ? `
          <tr>
            <td colspan="2"><span class="bold">Patient:</span> ${bill.patient_name || bill.patientName}</td>
          </tr>
        ` : ''}
        ${(bill.doctor_name || bill.doctorName) ? `
          <tr>
            <td colspan="2"><span class="bold">Doctor:</span> ${bill.doctor_name || bill.doctorName}</td>
          </tr>
        ` : ''}
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
                <span class="bold">${item.product_name || item.name}</span>
                <div style="font-size:8.5px;color:#475569;">
                  ${item.batch_number ? `Batch: ${item.batch_number} ` : ''}
                  ${item.expiry_date ? `Exp: ${String(item.expiry_date).substring(0, 10)}` : ''}
                  ${item.mrp ? ` | MRP: ₹${Number(item.mrp).toFixed(2)}` : ''}
                </div>
              </td>
              <td class="right">${item.quantity}</td>
              <td class="right">₹${Number(item.rate || item.price || 0).toFixed(2)}</td>
              <td class="right">₹${Number(item.total || (Number(item.rate || item.price || 0) * Number(item.quantity || 1))).toFixed(2)}</td>
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
              <td class="right">+₹${Number(tax).toFixed(2)}</td>
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
        <div style="font-size: 9px; color: #666; margin-top: 4px;">${details.name || 'MADRAS ORTHO CLINIC'} · Developed by RegulaVitae © 2026</div>
      </div>
    </body>
    </html>
  `;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (doc) {
    doc.open();
    doc.write(thermalHtml);
    doc.close();
    iframe.contentWindow?.focus();
    setTimeout(() => {
      try {
        iframe.contentWindow?.print();
      } catch (e) {
        window.print();
      }
      setTimeout(() => {
        try { document.body.removeChild(iframe); } catch {}
      }, 1000);
    }, 300);
  } else {
    window.print();
  }
};

export const MobileTabletApp: React.FC<MobileTabletAppProps> = ({
  onSwitchToDesktop: _onSwitchToDesktop,
  currentUser,
  onLogout
}) => {
  // Safety gate: NEVER render Mobile POS without an authenticated user & active session token
  useEffect(() => {
    if ((!currentUser || !currentUser.role || !getAuthToken()) && onLogout) {
      onLogout();
    }
  }, [currentUser, onLogout]);
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'billing' | 'medicines' | 'reports' | 'patients' | 'more'>('billing');

  // Products and Categories
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);

  // Cart & Billing State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearch, setPatientSearch] = useState<string>('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState<boolean>(false);
  const [isWalkIn, setIsWalkIn] = useState<boolean>(true);
  const [selectedDoctor, setSelectedDoctor] = useState<string>(CLINIC_DOCTORS[0].name);
  const [clinicDetails, setClinicDetails] = useState<any>(null);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card'>('Cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [isSubmittingBill, setIsSubmittingBill] = useState<boolean>(false);
  const [billSuccessModal, setBillSuccessModal] = useState<any | null>(null);

  // Persistent Discount (active across all bills until changed)
  const [persistentDiscount, setPersistentDiscount] = useState<number>(() => {
    try {
      const val = localStorage.getItem('moc_persistent_discount');
      return val !== null ? Number(val) : 0;
    } catch {
      return 0;
    }
  });
  const [discountPercent, setDiscountPercent] = useState<number>(persistentDiscount);

  // Complimentary / Doctor Health Dispense state (Admin only)
  const [isComplimentaryCheckout, setIsComplimentaryCheckout] = useState<boolean>(false);
  const [complimentaryRecipient, setComplimentaryRecipient] = useState<string>('');
  const [complimentaryReason, setComplimentaryReason] = useState<string>('Doctor / Staff Health Dispense');

  // Real-Time Inventory & Expiry Notifications State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
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
      if (res && res.ok) {
        const data = await res.json();
        setNotificationsData(data);
      }
    } catch (err) {
      console.error('[MOBILE NOTIFICATIONS] Fetch error:', err);
    }
  };

  // Enforce role scope: employees can view Billing, Medicines, Reports (Read-Only), & Patients, but NOT More/Settings
  useEffect(() => {
    if (currentUser?.role && currentUser.role !== 'admin' && activeTab === 'more') {
      setActiveTab('billing');
    }
  }, [currentUser, activeTab]);

  // Inward Stock Consignment Modal (Admin Multi-Medicine Intake)
  const [isInwardModalOpen, setIsInwardModalOpen] = useState<boolean>(false);
  const [inwardConsignment, setInwardConsignment] = useState({
    supplier: 'Direct Clinic Wholesale',
    invoiceNumber: '',
    receivedDate: new Date().toISOString().split('T')[0],
    notes: '',
    items: [
      {
        id: 'mob-inw-1',
        productId: '',
        productName: '',
        batchNumber: '',
        expiryDate: '',
        quantity: '',
        purchasePrice: '',
        mrp: '',
        sellingPrice: ''
      }
    ]
  });

  // Add / Edit Medicine Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    generic_name: '',
    category: '',
    price: '',
    mrp: '',
    purchase_price: '',
    available_stock: '100',
    batch_number: '',
    expiry_date: '',
    quantity_type: 'strip',
    barcode: '',
    hsn_code: '3004',
    rack_location: '',
    tax_percent: 5
  });

  // Category Modal
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');

  // Patient Creation & Edit Modal
  const [isPatientModalOpen, setIsPatientModalOpen] = useState<boolean>(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [patientForm, setPatientForm] = useState({
    name: '',
    age: '',
    gender: 'Male',
    phone: '',
    address: '',
    doctor: CLINIC_DOCTORS[0].name,
    diagnosis: '',
    notes: ''
  });
  const [viewingPatientHistory, setViewingPatientHistory] = useState<Patient | null>(null);

  // Reports & Bill History State
  const [reportsSubTab, setReportsSubTab] = useState<'snapshot' | 'history' | 'inward'>('snapshot');
  const [reportPeriod, setReportPeriod] = useState<'today' | 'monthly' | 'yearly'>('today');
  const [billsList, setBillsList] = useState<BillRecord[]>([]);
  const [billSearchQuery, setBillSearchQuery] = useState<string>('');
  const [isLoadingBills, setIsLoadingBills] = useState<boolean>(false);
  const [viewingBillModal, setViewingBillModal] = useState<BillRecord | null>(null);
  const [cancellingBill, setCancellingBill] = useState<BillRecord | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [inwardLogs, setInwardLogs] = useState<any[]>([]);
  const [isRefreshingStats, setIsRefreshingStats] = useState<boolean>(false);

  // Employees / Staff State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState<boolean>(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    role: 'pharmacist' as 'admin' | 'pharmacist' | 'cashier',
    phone: '',
    email: '',
    shift: 'General'
  });

  // Clinical Drug Interactions Checker State
  const [interactionSelectedIds, setInteractionSelectedIds] = useState<number[]>([]);
  const [interactionResult, setInteractionResult] = useState<any | null>(null);
  const [isCheckingInteractions, setIsCheckingInteractions] = useState<boolean>(false);

  // Network Info
  const [networkInfo, setNetworkInfo] = useState<{ localhostUrl: string; primaryLanUrl: string; interfaces: any[] } | null>(null);

  // Dynamic Clinic Server Connection State
  const [serverUrlInput, setServerUrlInput] = useState<string>(() => getSavedClinicServerUrl() || getApiBaseUrl());
  const [isTestingServer, setIsTestingServer] = useState<boolean>(false);
  const [serverTestResult, setServerTestResult] = useState<{ status: 'idle' | 'success' | 'error'; message: string; latency?: number } | null>(null);

  const handleTestServerConnection = async () => {
    const targetUrl = (serverUrlInput || '').trim().replace(/\/+$/, '');
    if (!targetUrl) {
      setServerTestResult({ status: 'error', message: 'Please enter a server URL (e.g. http://192.168.x.x:4848)' });
      return;
    }
    setIsTestingServer(true);
    setServerTestResult(null);
    const start = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${targetUrl}/api/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      const elapsed = Math.round(performance.now() - start);
      if (res.ok) {
        const health = await res.json().catch(() => ({}));
        setServerTestResult({
          status: 'success',
          message: `Connected to ${health.service || 'Madras Ortho Clinic Server'}`,
          latency: elapsed
        });
      } else {
        setServerTestResult({
          status: 'error',
          message: `Server returned HTTP ${res.status}. Verify server is running on port 4848.`
        });
      }
    } catch (e: any) {
      setServerTestResult({
        status: 'error',
        message: 'Could not connect. Ensure laptop host is running and both devices share Wi-Fi.'
      });
    } finally {
      setIsTestingServer(false);
    }
  };

  const handleSaveServerConnection = () => {
    const targetUrl = (serverUrlInput || '').trim().replace(/\/+$/, '');
    if (!targetUrl) return;
    setSavedClinicServerUrl(targetUrl);
    setAuthToken(null);
    alert(`Clinic server URL saved to ${targetUrl}. Please log in again on the connected server.`);
    if (onLogout) {
      onLogout();
    } else {
      loadData();
    }
  };

  const handleResetServerConnection = () => {
    setSavedClinicServerUrl('');
    setServerUrlInput(getApiBaseUrl());
    setServerTestResult(null);
    setAuthToken(null);
    alert('Reset to zero-config auto-detection (http://madrasorthoclinic.local:4848). Please log in again.');
    if (onLogout) {
      onLogout();
    } else {
      loadData();
    }
  };

  // Financial Stats Snapshot
  const [todayStats, setTodayStats] = useState({
    billsCount: 0,
    grossSales: 0,
    totalMrp: 0,
    concession: 0,
    taxable: 0,
    cgst: 0,
    sgst: 0,
    cashAmount: 0,
    cardAmount: 0,
    upiAmount: 0,
    itemsSold: 0
  });

  // Load all core data
  const loadData = async () => {
    setIsLoadingProducts(true);
    try {
      const [prodRes, catRes, patRes, netRes, clinicRes] = await Promise.all([
        fetch(apiUrl('/api/products')),
        fetch(apiUrl('/api/categories')),
        fetch(apiUrl('/api/patients')),
        fetch(apiUrl('/api/network-info')).catch(() => null),
        fetch(apiUrl('/api/clinic/details')).catch(() => null)
      ]);

      let loadedProds: Product[] = [];
      let customCatNames: string[] = [];

      if (clinicRes && clinicRes.ok) {
        const clinicData = await clinicRes.json();
        setClinicDetails(clinicData);
      }

      if (prodRes && prodRes.ok) {
        const prodData = await prodRes.json();
        loadedProds = Array.isArray(prodData) ? prodData : [];
        setProducts(loadedProds);
      }
      if (catRes && catRes.ok) {
        const catData = await catRes.json();
        customCatNames = Array.isArray(catData) ? catData.map((c: any) => typeof c === 'string' ? c : c.name).filter(Boolean) : [];
      }

      // Ensure newly created medicine categories appear FIRST right after 'All'
      const prodCatsSet = new Set<string>();
      loadedProds.forEach((p: any) => {
        if (p.category) {
          p.category.split(',').forEach((c: string) => {
            const trimmed = c.trim();
            if (trimmed) prodCatsSet.add(trimmed);
          });
        }
      });
      const prodCats = Array.from(prodCatsSet);
      const remainingProdCats = prodCats.filter((c: string) => !customCatNames.includes(c));
      setCategories(['All', ...customCatNames, ...remainingProdCats]);

      if (patRes && patRes.ok) {
        const patData = await patRes.json();
        setPatients(Array.isArray(patData) ? patData : []);
      }
      if (netRes && netRes.ok) {
        const netData = await netRes.json();
        setNetworkInfo(netData);
      }
    } catch (err) {
      console.error('[MOBILE POS] Data loading error:', err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const loadPatients = async () => {
    try {
      const patRes = await fetch(apiUrl('/api/patients'));
      if (patRes && patRes.ok) {
        const patData = await patRes.json();
        setPatients(Array.isArray(patData) ? patData : []);
      }
    } catch (err) {
      console.error('[MOBILE POS] Failed to reload patients:', err);
    }
  };

  const loadPeriodStats = async (period: 'today' | 'monthly' | 'yearly' = reportPeriod) => {
    try {
      const apiPeriod = period === 'today' ? 'day' : period === 'monthly' ? 'month' : period === 'yearly' ? 'year' : period;
      const res = await fetch(apiUrl(`/api/bills?period=${apiPeriod}`));
      if (res && res.ok) {
        const bills = await res.json();
        if (Array.isArray(bills)) {
          let count = 0;
          let sales = 0;
          let mrpTotal = 0;
          let cash = 0;
          let card = 0;
          let upi = 0;
          let items = 0;

          bills.forEach((b: any) => {
            if (b.status !== 'Cancelled') {
              count++;
              const billAmt = round2(b.grand_total !== undefined && b.grand_total !== null ? b.grand_total : (b.total ?? b.total_amount ?? 0));
              sales = round2(sales + billAmt);
              mrpTotal = round2(mrpTotal + round2(b.total_mrp || billAmt));
              const pm = (b.payment_method || '').toLowerCase();
              if (pm.includes('cash')) cash = round2(cash + billAmt);
              else if (pm.includes('card') || pm.includes('pos') || pm.includes('debit') || pm.includes('credit')) card = round2(card + billAmt);
              else upi = round2(upi + billAmt);

              let lineItems: any[] = [];
              try {
                lineItems = typeof b.items === 'string' ? JSON.parse(b.items) : (b.items || []);
              } catch { lineItems = []; }
              items += lineItems.reduce((acc: number, it: any) => acc + (Number(it.quantity) || 1), 0);
            }
          });

          const concession = Math.max(0, round2(mrpTotal - sales));
          const taxable = round2(sales / 1.12);
          const gst = round2(sales - taxable);
          const cgst = round2(gst / 2);
          const sgst = round2(gst - cgst);

          setTodayStats({
            billsCount: count,
            grossSales: sales,
            totalMrp: mrpTotal,
            concession,
            taxable,
            cgst,
            sgst,
            cashAmount: cash,
            cardAmount: card,
            upiAmount: upi,
            itemsSold: items
          });
        }
      }
    } catch (err) {
      console.warn('[MOBILE POS] Error loading stats:', err);
    }
  };

  const loadBillsHistory = async () => {
    setIsLoadingBills(true);
    try {
      const res = await fetch(apiUrl('/api/bills'));
      if (res && res.ok) {
        const data = await res.json();
        setBillsList(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('Error loading bills:', err);
    } finally {
      setIsLoadingBills(false);
    }
  };

  const loadInwardLogs = async () => {
    try {
      const res = await fetch(apiUrl('/api/inventory/inward'));
      if (res && res.ok) {
        const data = await res.json();
        setInwardLogs(Array.isArray(data) ? data : []);
      }
    } catch (e) {}
  };

  const loadEmployees = async () => {
    try {
      const res = await fetch(apiUrl('/api/employees'));
      if (res && res.ok) {
        const data = await res.json();
        setEmployees(Array.isArray(data) ? data : []);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (!currentUser || !currentUser.role || !getAuthToken()) return;

    loadData();
    loadPeriodStats('today');
    fetchNotifications();

    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connectSSE = () => {
      if (!getAuthToken()) return;
      try {
        const eventsUrl = authApiUrl('/api/events');
        eventSource = new EventSource(eventsUrl);

        eventSource.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.type === 'HEARTBEAT') return;

            console.log('[MOBILE REALTIME SSE RECEIVED]', data);
            if (data.type === 'INVENTORY_CHANGED' || data.type === 'STOCK_OUT' || data.type === 'CATALOGUE_CHANGED') {
              loadData();
              loadPeriodStats('today');
              fetchNotifications();
            }
            if (data.type === 'CLINIC_DETAILS_UPDATED') {
              if (data.data) {
                setClinicDetails(data.data);
              } else {
                fetch(apiUrl('/api/clinic/details')).then(r => r.json()).then(d => setClinicDetails(d)).catch(() => {});
              }
            }
          } catch (err) {}
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
          } catch {}
          if (!reconnectTimeout && getAuthToken()) {
            reconnectTimeout = setTimeout(() => {
              reconnectTimeout = null;
              connectSSE();
            }, 5000);
          }
        };
      } catch (e) {
        if (!reconnectTimeout) {
          reconnectTimeout = setTimeout(() => {
            reconnectTimeout = null;
            connectSSE();
          }, 5000);
        }
      }
    };

    connectSSE();

    const notifTimer = setInterval(fetchNotifications, 60000);

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      clearInterval(notifTimer);
    };
  }, [currentUser]);

  useEffect(() => {
    if (activeTab === 'reports') {
      loadBillsHistory();
      loadInwardLogs();
    } else if (activeTab === 'more') {
      loadEmployees();
    }
  }, [activeTab]);

  // Filtered products for POS & Medicines tab (In-stock medicines displayed first)
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesCategory = selectedCategory === 'All' ||
          Boolean(p.category && p.category.split(',').map((c: string) => c.trim().toLowerCase()).includes(selectedCategory.toLowerCase()));
        const q = searchQuery.toLowerCase().trim();
        if (!q) return matchesCategory;
        const matchesSearch =
          p.name.toLowerCase().includes(q) ||
          (p.generic_name && p.generic_name.toLowerCase().includes(q)) ||
          (p.batch_number && p.batch_number.toLowerCase().includes(q)) ||
          (p.barcode && p.barcode.includes(q));
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        const aInStock = (a.available_stock ?? 0) > 0 ? 1 : 0;
        const bInStock = (b.available_stock ?? 0) > 0 ? 1 : 0;
        if (aInStock !== bInStock) return bInStock - aInStock;
        return (b.available_stock ?? 0) - (a.available_stock ?? 0) || a.name.localeCompare(b.name);
      });
  }, [products, selectedCategory, searchQuery]);

  // Cart calculations with persistent discount and GST (strict 2-decimal paise precision)
  const totalItemsCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const totalMrp = useMemo(() => round2(cart.reduce((sum, item) => sum + round2(item.mrp * item.quantity), 0)), [cart]);
  const cartSubtotal = useMemo(() => round2(cart.reduce((sum, item) => sum + round2(item.rate * item.quantity), 0)), [cart]);
  const discountAmount = useMemo(() => round2((cartSubtotal * discountPercent) / 100), [cartSubtotal, discountPercent]);

  // GST Calculation (per-item tax percent with proportional discount reduction under TNGST/CGST rules)
  const cartGstTotal = useMemo(() => cart.reduce((sum, item) => sum + (round2(item.rate * item.quantity) * ((item.tax_percent ?? 5) / 100)), 0), [cart]);
  const discountRatio = useMemo(() => cartSubtotal > 0 ? discountAmount / cartSubtotal : 0, [cartSubtotal, discountAmount]);
  const cartTax = useMemo(() => round2(cartGstTotal * (1 - discountRatio)), [cartGstTotal, discountRatio]);
  const cartCgst = useMemo(() => round2(cartTax / 2), [cartTax]);
  const cartSgst = useMemo(() => round2(cartTax - cartCgst), [cartTax, cartCgst]);
  const totalAmount = useMemo(() => Math.max(0, round2(cartSubtotal - discountAmount + cartTax)), [cartSubtotal, discountAmount, cartTax]);
  const totalSavings = useMemo(() => Math.max(0, round2(totalMrp - totalAmount)), [totalMrp, totalAmount]);

  const handleSetDiscount = (percent: number) => {
    try {
      localStorage.setItem('moc_persistent_discount', String(percent));
    } catch {}
    setPersistentDiscount(percent);
    setDiscountPercent(percent);
  };

  const handleAddInwardRow = () => {
    setInwardConsignment((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: 'mob-inw-' + Date.now(),
          productId: '',
          productName: '',
          batchNumber: '',
          expiryDate: '',
          quantity: '',
          purchasePrice: '',
          mrp: '',
          sellingPrice: ''
        }
      ]
    }));
  };

  const handleRemoveInwardRow = (id: string) => {
    setInwardConsignment((prev) => {
      if (prev.items.length <= 1) return prev;
      return {
        ...prev,
        items: prev.items.filter((it) => it.id !== id)
      };
    });
  };

  const handleUpdateInwardRow = (id: string, field: string, val: any) => {
    setInwardConsignment((prev) => ({
      ...prev,
      items: prev.items.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: val };
        if (field === 'productName') {
          const match = products.find((p) => p.name.toLowerCase() === String(val).toLowerCase());
          if (match) {
            updated.productId = String(match.id);
            if (!updated.mrp) updated.mrp = String(match.mrp || match.price || '');
            if (!updated.sellingPrice) updated.sellingPrice = String(match.price || '');
            if (!updated.purchasePrice) updated.purchasePrice = String(match.purchase_price || +(match.price * 0.7).toFixed(2));
          }
        }
        return updated;
      })
    }));
  };

  // Add product to cart with strict guardrails
  const addToCart = (product: Product) => {
    if (product.is_expired || product.status === 'Expired') {
      alert(`STATUTORY PROHIBITION: ${product.name} is EXPIRED. Dispensing expired drugs is strictly forbidden under Rule 65.`);
      return;
    }
    const stockAvailable = Number(product.available_stock ?? 0);
    if (product.is_out_of_stock || stockAvailable <= 0) {
      alert(`INSUFFICIENT STOCK: ${product.name} is out of stock.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= stockAvailable) {
          alert(`STOCK LIMIT: Only ${stockAvailable} unit(s) available for ${product.name}.`);
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        const mrp = Number(product.mrp ?? product.price ?? 0);
        const rate = Number(product.price ?? 0);
        const cost = Number(product.purchase_price ?? 0);
        return [
          ...prev,
          {
            id: product.id,
            name: product.name,
            generic_name: product.generic_name,
            batch_number: product.batch_number || 'BATCH-001',
            expiry_date: product.expiry_date || '2027-12-31',
            mrp: mrp > 0 ? mrp : rate,
            rate,
            purchase_price: cost,
            quantity: 1,
            available_stock: stockAvailable,
            tax_percent: product.tax_percent ?? 12
          }
        ];
      }
    });
  };

  const updateCartQty = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            if (newQty > item.available_stock) {
              alert(`STOCK LIMIT: Only ${item.available_stock} units available.`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // Cash change calculation (Integer-Paise Precision per TN/Indian Currency Rules)
  const cashNum = round2(parseFloat(cashTendered));
  const changeToReturn = Math.max(0, round2((toPaise(cashNum) - toPaise(totalAmount)) / 100));
  const isCashInsufficient = paymentMethod === 'Cash' && toPaise(cashNum) < toPaise(totalAmount);

  // Complete bill submission
  const handleCompleteBill = async () => {
    if (cart.length === 0) {
      alert('Cart is empty. Add medicines before checkout.');
      return;
    }
    if (paymentMethod === 'Cash' && isCashInsufficient) {
      alert(`Insufficient cash tendered. Total is ₹${totalAmount.toFixed(2)}, received ₹${cashNum.toFixed(2)}.`);
      return;
    }

    setIsSubmittingBill(true);
    try {
      let nextBillNumber = '';
      try {
        const numRes = await fetch(apiUrl('/api/bills/next-number'));
        if (numRes.ok) {
          const numData = await numRes.json();
          nextBillNumber = numData.bill_number || numData.next_bill_number || '';
        }
      } catch (e) {}

      if (!nextBillNumber) {
        const d = new Date();
        const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
        nextBillNumber = `MOC-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`;
      }

      const isFree = isComplimentaryCheckout && currentUser?.role === 'admin';
      const finalPaymentMethod = isFree ? 'Complimentary' : paymentMethod;
      const finalGrandTotal = isFree ? 0 : totalAmount;

      const billPayload = {
        bill_number: nextBillNumber,
        patient_id: selectedPatient?.id || null,
        patient_name: isFree ? (complimentaryRecipient.trim() || 'Clinic Doctor / Staff') : (isWalkIn ? 'Walk-in Patient' : (selectedPatient?.name || 'Walk-in Patient')),
        patient_phone: selectedPatient?.phone || '',
        doctor: selectedDoctor,
        payment_method: finalPaymentMethod,
        items: cart.map((i) => ({
          product_id: i.id,
          product_name: i.name,
          name: i.name,
          batch_number: i.batch_number,
          expiry_date: i.expiry_date,
          mrp: i.mrp,
          rate: i.rate,
          price: i.rate,
          purchase_price: i.purchase_price,
          quantity: i.quantity,
          tax_percent: i.tax_percent,
          total: Number((i.rate * i.quantity).toFixed(2))
        })),
        grand_total: finalGrandTotal,
        total_amount: finalGrandTotal,
        total: finalGrandTotal,
        subtotal: cartSubtotal,
        discount: isFree ? 0 : discountAmount,
        tax: isFree ? 0 : cartTax,
        cgst: isFree ? 0 : cartCgst,
        sgst: isFree ? 0 : cartSgst,
        is_complimentary: isFree ? 1 : 0,
        complimentary_recipient: isFree ? (complimentaryRecipient.trim() || 'Clinic Doctor / Staff') : undefined,
        complimentary_reason: isFree ? (complimentaryReason.trim() || 'Doctor / Staff Health Dispense') : undefined,
        cash_tendered: finalPaymentMethod === 'Cash' ? cashNum : finalGrandTotal,
        change_returned: finalPaymentMethod === 'Cash' ? changeToReturn : 0
      };

      const res = await fetch(apiUrl('/api/bills'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billPayload)
      });

      if (res.ok) {
        const result = await res.json();
        setBillSuccessModal({
          billNumber: result.bill_number || nextBillNumber,
          totalAmount: finalGrandTotal,
          totalMrp,
          totalSavings: isFree ? totalMrp : totalSavings,
          subtotal: cartSubtotal,
          discount: isFree ? 0 : discountAmount,
          tax: isFree ? 0 : cartTax,
          cgst: isFree ? 0 : cartCgst,
          sgst: isFree ? 0 : cartSgst,
          paymentMethod: finalPaymentMethod,
          patientName: isFree ? (complimentaryRecipient.trim() || 'Clinic Doctor / Staff') : (isWalkIn ? 'Walk-in Patient' : (selectedPatient?.name || 'Walk-in Patient')),
          doctor: selectedDoctor,
          items: [...cart],
          date: new Date().toLocaleString()
        });

        // Clear cart & refresh data
        setCart([]);
        setIsCartOpen(false);
        setCashTendered('');
        setIsComplimentaryCheckout(false);
        setComplimentaryRecipient('');
        loadData();
        loadPeriodStats(reportPeriod);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to complete transaction.');
      }
    } catch (err: any) {
      alert(`Network error while issuing bill: ${err.message}`);
    } finally {
      setIsSubmittingBill(false);
    }
  };

  // Create Category Handler
  const handleCreateCategory = async (name: string) => {
    if (!name.trim()) return;
    const cat = name.trim();
    try {
      const res = await fetch(apiUrl('/api/categories'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cat })
      });
      if (res.ok) {
        setCategories((prev) => Array.from(new Set(['All', cat, ...prev.filter((c) => c !== 'All')])));
        setSelectedCategory(cat);
        setProductForm((prev) => {
          const existing = (prev.category || '').split(',').map((s) => s.trim()).filter(Boolean);
          const merged = Array.from(new Set([...existing, cat]));
          return { ...prev, category: merged.join(', ') };
        });
        setIsAddCategoryOpen(false);
        setNewCatName('');
        alert(`Category "${cat}" created successfully!`);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create category.');
      }
    } catch (e) {
      alert('Network error creating category.');
    }
  };

  // Save / Update Medicine
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim() || !productForm.category.trim() || !productForm.price) {
      alert('Name, Category, and Price Sold At are required.');
      return;
    }

    const payload = {
      name: productForm.name.trim(),
      generic_name: productForm.generic_name.trim(),
      category: productForm.category.trim(),
      price: Number(productForm.price),
      mrp: Number(productForm.mrp || productForm.price),
      purchase_price: Number(productForm.purchase_price || 0),
      available_stock: Number(productForm.available_stock || 0),
      batch_number: productForm.batch_number.trim() || 'BATCH-001',
      expiry_date: productForm.expiry_date || '2028-12-31',
      quantity_type: productForm.quantity_type,
      barcode: productForm.barcode.trim(),
      hsn_code: productForm.hsn_code.trim(),
      rack_location: productForm.rack_location.trim(),
      tax_percent: Number(productForm.tax_percent ?? 5),
      status: Number(productForm.available_stock) > 0 ? 'Available' : 'Out of Stock'
    };

    try {
      const url = editingProduct ? apiUrl(`/api/products/${editingProduct.id}`) : apiUrl('/api/products');
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(editingProduct ? 'Medicine updated successfully!' : 'Medicine added successfully!');
        setIsProductModalOpen(false);
        setEditingProduct(null);
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save medicine.');
      }
    } catch (e: any) {
      alert(`Error saving medicine: ${e.message}`);
    }
  };

  // Delete Medicine
  const handleDeleteProduct = async (prod: Product) => {
    if (!window.confirm(`Are you sure you want to delete ${prod.name}?`)) return;
    try {
      const res = await fetch(apiUrl(`/api/products/${prod.id}`), { method: 'DELETE' });
      if (res.ok) {
        alert(`${prod.name} deleted.`);
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete medicine.');
      }
    } catch (e: any) {
      alert(`Error deleting medicine: ${e.message}`);
    }
  };

  // Delete Patient Record
  const handleDeletePatient = async (p: Patient) => {
    if (!window.confirm(`Are you sure you want to delete patient record "${p.name}"?`)) return;
    try {
      const res = await fetch(apiUrl(`/api/patients/${p.id}`), { method: 'DELETE' });
      if (res.ok) {
        alert(`Patient record "${p.name}" deleted successfully.`);
        loadPatients();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete patient record.');
      }
    } catch (e: any) {
      alert(`Error deleting patient: ${e.message}`);
    }
  };

  // Delete Staff / Employee Record
  const handleDeleteEmployee = async (emp: Employee) => {
    if (emp.username === 'admin') {
      alert('System administrator cannot be deleted.');
      return;
    }
    if (!window.confirm(`Are you sure you want to remove staff member "${emp.name}"?`)) return;
    try {
      const res = await fetch(apiUrl(`/api/employees/${emp.id}`), { method: 'DELETE' });
      if (res.ok) {
        alert(`Staff member "${emp.name}" removed successfully.`);
        loadEmployees();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete staff member.');
      }
    } catch (e: any) {
      alert(`Error deleting staff: ${e.message}`);
    }
  };

  // Save Inward Stock Consignment (Multi-Medicine)
  const handleInwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inwardConsignment.items || inwardConsignment.items.length === 0) {
      alert('Please add at least one medicine to this inward stock consignment.');
      return;
    }

    for (let i = 0; i < inwardConsignment.items.length; i++) {
      const it = inwardConsignment.items[i];
      if (!it.productName.trim() && !it.productId) {
        alert(`Item #${i + 1}: Medicine name is required.`);
        return;
      }
      if (!it.batchNumber.trim()) {
        alert(`Item #${i + 1} (${it.productName || 'Medicine'}): Batch number is required.`);
        return;
      }
      if (!it.quantity || Number(it.quantity) <= 0) {
        alert(`Item #${i + 1} (${it.productName || 'Medicine'}): Quantity must be greater than zero.`);
        return;
      }
      if (!it.expiryDate) {
        alert(`Item #${i + 1} (${it.productName || 'Medicine'}): Expiry date is required under Rule 65.`);
        return;
      }
    }

    try {
      const payload = {
        supplier_name: inwardConsignment.supplier.trim() || 'Direct Clinic Supply',
        invoice_number: inwardConsignment.invoiceNumber.trim() || `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
        received_date: inwardConsignment.receivedDate,
        notes: inwardConsignment.notes,
        received_by: currentUser?.name || 'admin',
        items: inwardConsignment.items.map((it) => ({
          product_id: it.productId ? Number(it.productId) : 0,
          product_name: it.productName.trim(),
          batch_number: it.batchNumber.trim(),
          expiry_date: it.expiryDate,
          quantity: Number(it.quantity),
          purchase_price: Number(it.purchasePrice || 0),
          mrp: Number(it.mrp || it.sellingPrice || 0),
          selling_price: Number(it.sellingPrice || it.mrp || 0)
        }))
      };

      const res = await fetch(apiUrl('/api/inventory/inward'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const result = await res.json();
        alert(result.message || 'Stock consignment received and inventory updated successfully!');
        setIsInwardModalOpen(false);
        setInwardConsignment({
          supplier: 'Direct Clinic Wholesale',
          invoiceNumber: '',
          receivedDate: new Date().toISOString().split('T')[0],
          notes: '',
          items: [
            {
              id: 'mob-inw-' + Date.now(),
              productId: '',
              productName: '',
              batchNumber: '',
              expiryDate: '',
              quantity: '',
              purchasePrice: '',
              mrp: '',
              sellingPrice: ''
            }
          ]
        });
        loadData();
        loadInwardLogs();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to record inward stock.');
      }
    } catch (err: any) {
      alert(`Stock entry error: ${err.message}`);
    }
  };

  // Save / Update Patient
  const handleSavePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientForm.name.trim()) {
      alert('Patient name is required.');
      return;
    }

    const payload = {
      name: patientForm.name.trim(),
      age: patientForm.age ? Number(patientForm.age) : undefined,
      gender: patientForm.gender,
      phone: patientForm.phone.trim(),
      address: patientForm.address.trim(),
      doctor: patientForm.doctor,
      diagnosis: patientForm.diagnosis.trim(),
      notes: patientForm.notes.trim()
    };

    try {
      const url = editingPatient ? apiUrl(`/api/patients/${editingPatient.id}`) : apiUrl('/api/patients');
      const method = editingPatient ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await res.json();
        alert(editingPatient ? 'Patient updated successfully!' : 'Patient registered successfully!');
        setIsPatientModalOpen(false);
        setEditingPatient(null);
        // Refresh patients & auto-select for billing if newly registered
        const pRes = await fetch(apiUrl('/api/patients'));
        if (pRes.ok) {
          const list = await pRes.json();
          setPatients(list);
          if (!editingPatient && list.length > 0) {
            const found = list.find((p: any) => p.name === payload.name) || list[list.length - 1];
            setSelectedPatient(found);
            setIsWalkIn(false);
          }
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save patient.');
      }
    } catch (e: any) {
      alert(`Error saving patient: ${e.message}`);
    }
  };

  // Cancel Bill Handler (Rule 65 Statutory compliance)
  const handleConfirmCancelBill = async () => {
    if (!cancellingBill) return;
    if (!cancelReason.trim()) {
      alert('Statutory requirement: Please enter a reason for cancelling this bill.');
      return;
    }

    try {
      const res = await fetch(apiUrl(`/api/bills/${cancellingBill.id}/cancel`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason.trim(), cancelled_by: currentUser?.name || 'admin' })
      });

      if (res.ok) {
        alert(`Bill #${cancellingBill.bill_number} cancelled and medicines returned to stock.`);
        setCancellingBill(null);
        setCancelReason('');
        loadBillsHistory();
        loadData();
        loadPeriodStats(reportPeriod);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to cancel bill.');
      }
    } catch (e: any) {
      alert(`Error cancelling bill: ${e.message}`);
    }
  };

  // Employee Save / Update
  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeForm.name.trim()) {
      alert('Employee name is required.');
      return;
    }

    try {
      const url = editingEmployee ? apiUrl(`/api/employees/${editingEmployee.id}`) : apiUrl('/api/employees');
      const method = editingEmployee ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeForm)
      });

      if (res.ok) {
        alert(editingEmployee ? 'Staff updated successfully!' : 'Staff member registered successfully!');
        setIsEmployeeModalOpen(false);
        setEditingEmployee(null);
        loadEmployees();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save staff member.');
      }
    } catch (e: any) {
      alert(`Error saving staff: ${e.message}`);
    }
  };

  // Clinical Interactions Checker
  const handleRunInteractionCheck = async () => {
    if (interactionSelectedIds.length < 2) {
      alert('Select at least 2 medicines to test for clinical drug-drug interactions.');
      return;
    }

    setIsCheckingInteractions(true);
    try {
      const selectedProds = products.filter((p) => interactionSelectedIds.includes(p.id));
      const res = await fetch(apiUrl('/api/clinical-checks'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: selectedProds })
      });

      if (res.ok) {
        const data = await res.json();
        setInteractionResult(data);
      } else {
        // Fallback local check
        const names = selectedProds.map((p) => p.name.toLowerCase());
        const hasNsaid = names.some((n) => n.includes('aceclo') || n.includes('ibu') || n.includes('diclo'));
        const hasAspirin = names.some((n) => n.includes('aspirin') || n.includes('warfarin') || n.includes('clopi'));
        const warnings = [];
        if (hasNsaid && hasAspirin) {
          warnings.push({
            severity: 'HIGH',
            title: 'NSAID + Antiplatelet/Anticoagulant Risk',
            description: 'Concurrent use increases risk of gastrointestinal ulceration and major haemorrhage.'
          });
        }
        setInteractionResult({
          checkedCount: selectedProds.length,
          interactions: warnings,
          status: warnings.length > 0 ? 'WARNING' : 'SAFE'
        });
      }
    } catch (e) {
      setInteractionResult({ checkedCount: interactionSelectedIds.length, interactions: [], status: 'SAFE' });
    } finally {
      setIsCheckingInteractions(false);
    }
  };

  if (!currentUser || !currentUser.role || !getAuthToken()) {
    return null;
  }

  return (
    <div className="flex flex-col h-[100dvh] min-h-[100dvh] max-h-[100dvh] w-screen max-w-full overflow-hidden bg-slate-100 text-slate-800 font-sans select-none antialiased">
      {/* ─── APP HEADER ─────────────────────────────────────────────── */}
      <header className="bg-slate-900 text-white shrink-0 shadow-md z-30">
        <div className="flex items-center justify-between px-3.5 py-2.5 max-w-lg mx-auto">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="./icon.png"
              alt="Clinic Logo"
              className="h-9 w-9 rounded-xl object-cover shadow-md shadow-sky-900/30 shrink-0"
              style={{ imageRendering: 'crisp-edges' }}
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Real-Time Expiry & Inventory Alerts Bell */}
            <button
              onClick={() => {
                fetchNotifications();
                setIsNotificationsOpen(true);
              }}
              className="relative p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 shadow-xs active:scale-95 transition-all"
              title="Real-Time Alerts"
            >
              <Bell className="h-4 w-4 text-amber-400" />
              {(() => {
                const smartCount = (notificationsData?.summary?.expiringSoonCount || 0) + (notificationsData?.summary?.lowStockCount || 0) + (notificationsData?.summary?.expiredCount || 0);
                if (smartCount <= 0) return null;
                return (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center animate-pulse shadow-md">
                    {smartCount}
                  </span>
                );
              })()}
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-xs active:scale-95 transition-all"
            >
              <ShoppingBag className="h-4 w-4" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black h-4 w-4 rounded-full flex items-center justify-center animate-pulse">
                  {totalItemsCount}
                </span>
              )}
            </button>

            {/* Logout Button & User Role Badge */}
            {onLogout && (
              <div className="flex flex-col items-center gap-0.5">
                <button
                  onClick={onLogout}
                  className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-xl text-xs font-bold border border-rose-500/30 flex items-center gap-1 transition-all active:scale-95"
                  title="Log out of software"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Logout</span>
                </button>
                <span className={`text-[8px] font-black uppercase tracking-wider px-1 rounded leading-none ${
                  currentUser?.role === 'admin'
                    ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                    : 'text-slate-400 bg-slate-800 border border-slate-700'
                }`}>
                  {currentUser?.role === 'admin' ? 'admin' : 'employee'}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─── MAIN CONTENT VIEWPORT ──────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-3 pb-32 overscroll-contain">
        {/* ── TAB 1: POS BILLING ────────────────────────────────────── */}
        {activeTab === 'billing' && (
          <div className="space-y-3 max-w-lg mx-auto">
            {/* Search Input Box */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 550+ medicines, generic, batch..."
                className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs placeholder-slate-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Quick Category Filter Pills with fixed Add Category button */}
            <div className="flex items-center gap-1.5 overflow-hidden">
              {currentUser?.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(true)}
                  className="shrink-0 px-2.5 py-1.5 bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-black text-xs rounded-lg shadow-xs flex items-center gap-1"
                  title="Create custom category (Always Visible)"
                >
                  <Plus className="h-3.5 w-3.5 stroke-[3]" />
                  <span>+ Add</span>
                </button>
              )}
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1 flex-1 min-w-0">
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Medicines List Grid */}
            {isLoadingProducts ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                <span className="text-xs">Loading medicines...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 text-slate-500">
                <Package className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                <div className="text-xs font-bold">No medicines found</div>
                <div className="text-[11px] text-slate-400 mt-1">Try another search or category.</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {filteredProducts.map((product) => {
                  const isExpired = product.is_expired || product.status === 'Expired';
                  const isOutOfStock = (product.available_stock ?? 0) <= 0;
                  const inCartItem = cart.find((i) => i.id === product.id);
                  const mrp = Number(product.mrp ?? product.price ?? 0);
                  const rate = Number(product.price ?? 0);
                  const savings = Math.max(0, mrp - rate);

                  return (
                    <div
                      key={product.id}
                      className={`bg-white rounded-2xl p-3 border shadow-2xs transition-all ${
                        isExpired
                          ? 'border-rose-200 bg-rose-50/20'
                          : isOutOfStock
                          ? 'border-amber-200 bg-amber-50/20'
                          : inCartItem
                          ? 'border-blue-400 ring-1 ring-blue-400'
                          : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xs font-bold text-slate-900 leading-snug truncate">
                            {product.name}
                          </h3>
                          {product.generic_name && (
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {product.generic_name}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
                            <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-medium truncate max-w-[120px]">
                              {product.category}
                            </span>
                            <span>•</span>
                            <span>Batch: <strong className="font-mono text-slate-600">{product.batch_number || 'N/A'}</strong></span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0 text-right">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            isExpired
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : isOutOfStock
                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}>
                            {isExpired ? 'Expired' : isOutOfStock ? 'Out of Stock' : `${product.available_stock} in stock`}
                          </span>
                        </div>
                      </div>

                      {/* Pricing Row */}
                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-black text-blue-700">₹{rate.toFixed(2)}</span>
                          {mrp > rate && (
                            <span className="text-[10px] text-slate-400 line-through">MRP ₹{mrp.toFixed(2)}</span>
                          )}
                          {savings > 0 && (
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">
                              Save ₹{savings.toFixed(2)}
                            </span>
                          )}
                        </div>

                        {/* Add / Stepper Controls */}
                        {isExpired || isOutOfStock ? (
                          <button
                            disabled
                            className="px-2.5 py-1 bg-slate-100 text-slate-400 rounded-lg text-xs font-semibold cursor-not-allowed"
                          >
                            Unavailable
                          </button>
                        ) : inCartItem ? (
                          <div className="flex items-center bg-blue-50 border border-blue-200 rounded-lg p-0.5">
                            <button
                              onClick={() => updateCartQty(product.id, -1)}
                              className="h-6 w-6 rounded flex items-center justify-center text-blue-700 hover:bg-blue-100"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-black text-blue-700">
                              {inCartItem.quantity}
                            </span>
                            <button
                              onClick={() => updateCartQty(product.id, 1)}
                              className="h-6 w-6 rounded flex items-center justify-center text-blue-700 hover:bg-blue-100"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(product)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: MEDICINES & INVENTORY CRUD ─────────────────────── */}
        {activeTab === 'medicines' && (
          <div className="space-y-3 max-w-lg mx-auto">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900">Medicines Inventory</h2>
                <p className="text-xs text-slate-500">Live batches, rates & CRUD controls</p>
              </div>
              <div className="flex items-center gap-1">
                {currentUser?.role === 'admin' && (
                  <>
                    <button
                      onClick={() => {
                        setEditingProduct(null);
                        setProductForm({
                          name: '',
                          generic_name: '',
                          category: categories[1] || 'Orthopaedic Medicines',
                          price: '',
                          mrp: '',
                          purchase_price: '',
                          available_stock: '100',
                          batch_number: '',
                          expiry_date: '',
                          quantity_type: 'strip',
                          barcode: '',
                          hsn_code: '3004',
                          rack_location: '',
                          tax_percent: 5
                        });
                        setIsProductModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Medicine
                    </button>
                    <button
                      onClick={() => setIsInwardModalOpen(true)}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Inward Stock
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className="flex gap-2">
              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => setIsAddCategoryOpen(true)}
                  className="flex-1 py-1.5 bg-white border border-slate-200 text-sky-600 text-xs font-bold rounded-lg shadow-2xs flex items-center justify-center gap-1"
                >
                  <Tag className="h-3.5 w-3.5" />
                  + Add Category
                </button>
              )}
              <button
                onClick={loadData}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </button>
            </div>

            {/* Search within inventory */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, generic, barcode..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
            />

            {/* Product Cards with Edit / Delete actions */}
            <div className="space-y-2">
              {filteredProducts.map((p) => {
                const isExpired = p.is_expired || p.status === 'Expired';
                const isOutOfStock = (p.available_stock ?? 0) <= 0;
                return (
                  <div key={p.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-slate-900 truncate">{p.name}</div>
                        <div className="text-[11px] text-slate-500">{p.generic_name || p.category}</div>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        isExpired ? 'bg-rose-100 text-rose-700' : isOutOfStock ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {isExpired ? 'Expired' : isOutOfStock ? 'Out of Stock' : `Stock: ${p.available_stock}`}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1 bg-slate-50 p-2 rounded-lg text-center text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">MRP</div>
                        <div className="font-bold text-slate-700">₹{Number(p.mrp || p.price).toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-blue-500 uppercase font-bold">Price Sold At</div>
                        <div className="font-extrabold text-blue-700">₹{Number(p.price).toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Cost Price</div>
                        <div className="font-medium text-slate-600">₹{Number(p.purchase_price || 0).toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Batch: <strong className="font-mono">{p.batch_number || 'N/A'}</strong></span>
                      <span>Exp: <strong className={isExpired ? 'text-rose-600' : ''}>{p.expiry_date || 'N/A'}</strong></span>
                      {currentUser?.role === 'admin' && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setProductForm({
                                name: p.name,
                                generic_name: p.generic_name || '',
                                category: p.category,
                                price: p.price.toString(),
                                mrp: p.mrp ? p.mrp.toString() : p.price.toString(),
                                purchase_price: p.purchase_price ? p.purchase_price.toString() : '',
                                available_stock: p.available_stock ? p.available_stock.toString() : '0',
                                batch_number: p.batch_number || '',
                                expiry_date: p.expiry_date || '',
                                quantity_type: p.quantity_type || 'strip',
                                barcode: p.barcode || '',
                                hsn_code: p.hsn_code || '3004',
                                rack_location: p.rack_location || '',
                                tax_percent: p.tax_percent ?? 5
                              });
                              setIsProductModalOpen(true);
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit Medicine"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                            title="Delete Medicine"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB 3: REPORTS, STATS & BILL HISTORY ─────────────────── */}
        {activeTab === 'reports' && (
          <div className="space-y-3 max-w-lg mx-auto">
            {currentUser?.role !== 'admin' && (
              <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs font-semibold flex items-center justify-between shadow-2xs">
                <span>Employee View-Only Access</span>
                <span className="text-[10px] font-mono uppercase bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold border border-blue-200">
                  Read-Only Mode
                </span>
              </div>
            )}

            {/* Sub-navigation pills */}
            <div className="flex bg-slate-200 p-1 rounded-xl gap-1 text-xs font-bold">
              <button
                onClick={() => setReportsSubTab('snapshot')}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                  reportsSubTab === 'snapshot' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                P&L & Tax Audit
              </button>
              <button
                onClick={() => setReportsSubTab('history')}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                  reportsSubTab === 'history' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Bill History ({billsList.length})
              </button>
              <button
                onClick={() => setReportsSubTab('inward')}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                  reportsSubTab === 'inward' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Stock Intake Log
              </button>
            </div>

            {/* Sub-view: Snapshot & Performance */}
            {reportsSubTab === 'snapshot' && (
              <div className="space-y-3">
                {/* Period Selector Tabs */}
                <div className="flex gap-1.5 pb-1">
                  {(['today', 'monthly', 'yearly'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setReportPeriod(p);
                        loadPeriodStats(p);
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                        reportPeriod === p ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      {p === 'today' ? "Today's P&L" : p === 'monthly' ? "This Month" : "This Year"}
                    </button>
                  ))}
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        {reportPeriod === 'today' ? "Today's" : reportPeriod === 'monthly' ? "Monthly" : "Yearly"} Sales & Tax Summary
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Live collection & statutory GST snapshot
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        setIsRefreshingStats(true);
                        await Promise.all([
                          loadPeriodStats(reportPeriod),
                          loadBillsHistory(),
                          loadInwardLogs()
                        ]);
                        setIsRefreshingStats(false);
                      }}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 transition-all"
                      title="Refresh sales and tax summary"
                    >
                      <RefreshCw className={`h-4 w-4 ${isRefreshingStats ? 'animate-spin text-blue-600' : ''}`} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100">
                      <div className="text-[10px] font-bold text-blue-600 uppercase">Gross Sales Collected</div>
                      <div className="text-lg font-black text-blue-900 mt-0.5">₹{todayStats.grossSales.toFixed(2)}</div>
                    </div>
                    <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100">
                      <div className="text-[10px] font-bold text-emerald-600 uppercase">Bills Dispensed</div>
                      <div className="text-lg font-black text-emerald-900 mt-0.5">{todayStats.billsCount}</div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <div className="text-[10px] font-semibold text-slate-500">Cash Received</div>
                      <div className="text-sm font-bold text-slate-800">₹{todayStats.cashAmount.toFixed(2)}</div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <div className="text-[10px] font-semibold text-slate-500">Digital / UPI</div>
                      <div className="text-sm font-bold text-slate-800">₹{todayStats.upiAmount.toFixed(2)}</div>
                    </div>
                    <div className="bg-purple-50/70 p-2.5 rounded-xl border border-purple-200 col-span-2 sm:col-span-1">
                      <div className="text-[10px] font-bold text-purple-700 uppercase">Money by Card</div>
                      <div className="text-sm font-black text-purple-900">₹{todayStats.cardAmount.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* GST Audit Breakdown */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
                    <div className="font-bold text-slate-700 uppercase text-[10px] tracking-wide border-b pb-1">
                      Statutory GST Breakdown
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Taxable Turnover:</span>
                      <span className="font-medium">₹{todayStats.taxable.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">CGST (6%):</span>
                      <span className="font-medium">₹{todayStats.cgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">SGST (6%):</span>
                      <span className="font-medium">₹{todayStats.sgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold pt-1 border-t border-slate-200">
                      <span>Total GST Liability:</span>
                      <span className="text-blue-700">₹{(todayStats.cgst + todayStats.sgst).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Downloads Section */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="text-sm font-bold text-slate-900">Detailed Financial Reports (Excel)</div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Download comprehensive audits covering P&L Summary, Inventory Ledger, Itemized Sales, Inward Receipts, GST Audit, and Stock Margins.
                  </p>
                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      onClick={() => window.open(authApiUrl('/api/reports/monthly?export=excel'), '_blank')}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Download className="h-4 w-4" />
                      Download 6-Sheet Monthly Excel Report
                    </button>
                    <button
                      onClick={() => window.open(authApiUrl('/api/reports/daily?export=excel'), '_blank')}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-200"
                    >
                      <Download className="h-4 w-4" />
                      Download Today's Daily Audit Excel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-view: Bill History with View / Reprint / Cancel */}
            {reportsSubTab === 'history' && (
              <div className="space-y-2.5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={billSearchQuery}
                    onChange={(e) => setBillSearchQuery(e.target.value)}
                    placeholder="Search invoice number or patient name..."
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                {isLoadingBills ? (
                  <div className="text-center py-8 text-slate-400 text-xs">Loading bills history...</div>
                ) : (
                  <div className="space-y-2">
                    {billsList
                      .filter((b) => {
                        if (!billSearchQuery.trim()) return true;
                        const q = billSearchQuery.toLowerCase();
                        return (
                          b.bill_number.toLowerCase().includes(q) ||
                          (b.patient_name && b.patient_name.toLowerCase().includes(q))
                        );
                      })
                      .map((b) => {
                        const isCancelled = b.status === 'Cancelled';
                        return (
                          <div
                            key={b.id}
                            className={`p-3 rounded-xl border bg-white shadow-2xs space-y-1.5 ${
                              isCancelled ? 'border-rose-200 bg-rose-50/10' : 'border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-xs text-blue-700">{b.bill_number}</span>
                              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                                isCancelled ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {isCancelled ? 'Cancelled' : 'Completed'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                              <div>
                                <span className="font-semibold text-slate-800">{b.patient_name || 'Walk-in'}</span>
                                <div className="text-[10px] text-slate-400">{b.date} • {b.payment_method || 'Cash'}</div>
                              </div>
                              <span className="text-sm font-black text-slate-900">₹{Number(b.grand_total !== undefined && b.grand_total !== null ? b.grand_total : (b.total ?? b.total_amount ?? 0)).toFixed(2)}</span>
                            </div>

                            {isCancelled && b.cancelled_reason && (
                              <div className="text-[10px] text-rose-600 bg-rose-50 p-1.5 rounded">
                                Reason: {b.cancelled_reason}
                              </div>
                            )}

                            <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-100">
                              <button
                                onClick={() => setViewingBillModal(b)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1"
                              >
                                <Eye className="h-3 w-3" /> View
                              </button>
                              <button
                                onClick={() => printMobileThermalReceipt(b, clinicDetails)}
                                className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg flex items-center gap-1"
                              >
                                <Printer className="h-3 w-3" /> Reprint
                              </button>
                              {!isCancelled && currentUser?.role === 'admin' && (
                                <button
                                  onClick={() => {
                                    setCancellingBill(b);
                                    setCancelReason('');
                                  }}
                                  className="px-2.5 py-1 bg-rose-50 text-rose-600 text-xs font-semibold rounded-lg"
                                >
                                  Cancel Bill
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* Sub-view: Inward Stock Intake History */}
            {reportsSubTab === 'inward' && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700">Stock Intake Audit Trail</div>
                {inwardLogs.length === 0 ? (
                  <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-xs text-slate-400">
                    No inward stock entries recorded yet.
                  </div>
                ) : (
                  inwardLogs.map((log: any) => {
                    const totalCost = Number(log.quantity || 0) * Number(log.purchase_price || 0);
                    return (
                      <div key={log.id} className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1.5 shadow-2xs">
                        <div className="flex justify-between items-start font-bold">
                          <div>
                            <span className="text-slate-900 block">{log.product_name}</span>
                            <span className="text-[10px] text-sky-700 font-mono font-semibold">Inv #{log.invoice_number || 'INV-MONTHLY'}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-emerald-700 font-black block">+{log.quantity} units</span>
                            <span className="text-[11px] text-amber-700 font-bold font-mono">Total: ₹{totalCost.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500 bg-slate-50 p-1.5 rounded">
                          <span>Batch: <span className="font-mono font-semibold">{log.batch_number}</span></span>
                          <span>Unit Cost: <span className="font-mono font-bold text-slate-700">₹{Number(log.purchase_price || 0).toFixed(2)}</span></span>
                          <span>Exp: <span className="font-mono">{log.expiry_date}</span></span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t">
                          <span>Supplier: <strong className="text-slate-600">{log.supplier_name || 'Direct Wholesale'}</strong></span>
                          <span>{log.received_date || log.created_at}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 4: PATIENTS DIRECTORY ─────────────────────────────── */}
        {activeTab === 'patients' && (
          <div className="space-y-3 max-w-lg mx-auto">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900">Patients Directory</h2>
                <p className="text-xs text-slate-500">Clinical records & walk-in registration</p>
              </div>
              <button
                onClick={() => {
                  setEditingPatient(null);
                  setPatientForm({
                    name: '',
                    age: '',
                    gender: 'Male',
                    phone: '',
                    address: '',
                    doctor: CLINIC_DOCTORS[0].name,
                    diagnosis: '',
                    notes: ''
                  });
                  setIsPatientModalOpen(true);
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1 active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                New Patient
              </button>
            </div>

            {/* Patient Search */}
            <input
              type="text"
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              placeholder="Search by name, phone or MRN..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 font-medium"
            />

            {/* Patient Cards */}
            <div className="space-y-2">
              {patients
                .filter((p) => {
                  if (!patientSearch.trim()) return true;
                  const q = patientSearch.toLowerCase();
                  return (
                    p.name.toLowerCase().includes(q) ||
                    (p.phone && p.phone.includes(q)) ||
                    (p.mrn && p.mrn.toLowerCase().includes(q))
                  );
                })
                .map((p) => (
                  <div key={p.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-slate-900 truncate">{p.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {p.gender || 'Patient'} • Age: {p.age || 'N/A'} {p.phone ? `• ${p.phone}` : ''}
                        </div>
                        {p.address && <div className="text-[10px] text-slate-400 mt-0.5 truncate">{p.address}</div>}
                      </div>

                      <button
                        onClick={() => {
                          setSelectedPatient(p);
                          setIsWalkIn(false);
                          setActiveTab('billing');
                          setIsCartOpen(true);
                        }}
                        className="shrink-0 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs"
                      >
                        Bill Patient
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <button
                        onClick={() => setViewingPatientHistory(p)}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        View Visit & Bill History
                      </button>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setEditingPatient(p);
                            setPatientForm({
                              name: p.name,
                              age: p.age ? p.age.toString() : '',
                              gender: p.gender || 'Male',
                              phone: p.phone || '',
                              address: p.address || '',
                              doctor: p.doctor || CLINIC_DOCTORS[0].name,
                              diagnosis: p.diagnosis || '',
                              notes: p.notes || ''
                            });
                            setIsPatientModalOpen(true);
                          }}
                          className="text-slate-600 hover:text-blue-600 font-medium"
                        >
                          Edit Details
                        </button>
                        {currentUser?.role === 'admin' && (
                          <button
                            onClick={() => handleDeletePatient(p)}
                            className="text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-0.5"
                            title="Delete Patient Record"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ── TAB 5: MORE / CLINIC TOOLS & SETTINGS ──────────────────── */}
        {activeTab === 'more' && (
          <div className="space-y-3 max-w-lg mx-auto">
            {/* Wi-Fi & Local Network Card with Interactive Server Connection Manager */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-600">
                  <Wifi className="h-5 w-5" />
                  <h2 className="text-sm font-bold text-slate-900">Clinic Server & Wi-Fi Connection</h2>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Port 4848
                </span>
              </div>

              <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-mono text-[11px]">
                <div><strong>Domain:</strong> <code className="text-blue-700 font-bold">http://madrasorthoclinic.local:4848</code></div>
                {networkInfo?.primaryLanUrl && (
                  <div><strong>Wi-Fi Direct:</strong> <code className="text-emerald-700 font-bold">{networkInfo.primaryLanUrl}</code></div>
                )}
                <div><strong>Active Base:</strong> <code className="text-slate-800">{getApiBaseUrl()}</code></div>
              </div>

              {/* Configure Server URL */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Server Address / IP (Mobile & Tab Connection)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={serverUrlInput}
                    onChange={(e) => setServerUrlInput(e.target.value)}
                    placeholder="http://192.168.x.x:4848 or http://madrasorthoclinic.local:4848"
                    className="flex-1 px-3 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-xl"
                  />
                  <button
                    type="button"
                    disabled={isTestingServer}
                    onClick={handleTestServerConnection}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl whitespace-nowrap shadow-xs"
                  >
                    {isTestingServer ? 'Pinging...' : 'Test Ping'}
                  </button>
                </div>

                {serverTestResult && (
                  <div className={`p-2 rounded-xl text-xs flex items-center justify-between ${
                    serverTestResult.status === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    <div className="flex items-center gap-1.5 font-medium">
                      {serverTestResult.status === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                      )}
                      <span>{serverTestResult.message}</span>
                    </div>
                    {serverTestResult.latency !== undefined && (
                      <span className="font-mono font-bold text-[10px] ml-2">
                        {serverTestResult.latency}ms
                      </span>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveServerConnection}
                    className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
                  >
                    Save & Reconnect
                  </button>
                  {getSavedClinicServerUrl() && (
                    <button
                      type="button"
                      onClick={handleResetServerConnection}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                    >
                      Reset Auto
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Drug-Drug Clinical Interaction Checker */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-600">
                  <ShieldAlert className="h-5 w-5" />
                  <h3 className="text-sm font-bold text-slate-900">Clinical Drug Interaction Checker</h3>
                </div>
              </div>
              <p className="text-xs text-slate-500">Select medicines to check contraindications and severe interaction alerts.</p>

              {/* Medicine multi-selector */}
              <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50 space-y-1">
                {products.slice(0, 40).map((p) => {
                  const isChecked = interactionSelectedIds.includes(p.id);
                  return (
                    <label key={p.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer p-1 rounded hover:bg-white">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setInteractionSelectedIds((prev) =>
                            isChecked ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                          );
                        }}
                        className="rounded text-blue-600"
                      />
                      <span className="truncate">{p.name}</span>
                    </label>
                  );
                })}
              </div>

              <button
                onClick={handleRunInteractionCheck}
                disabled={isCheckingInteractions || interactionSelectedIds.length < 2}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                {isCheckingInteractions ? 'Checking Rules...' : `Check Interactions (${interactionSelectedIds.length} selected)`}
              </button>

              {interactionResult && (
                <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                  interactionResult.status === 'WARNING'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <div className="font-bold flex items-center gap-1.5">
                    {interactionResult.status === 'WARNING' ? <AlertCircle className="h-4 w-4 text-rose-600" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                    <span>{interactionResult.status === 'WARNING' ? 'Clinical Precautions Detected' : 'No Major Adverse Interactions Found'}</span>
                  </div>
                  {interactionResult.interactions?.map((w: any, idx: number) => (
                    <div key={idx} className="bg-white/80 p-2 rounded border border-rose-200 text-[11px]">
                      <strong>{w.title}</strong>: {w.description}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Staff / Employees Management (Admin) */}
            {currentUser?.role === 'admin' && (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <UserCheck className="h-5 w-5" />
                    <h3 className="text-sm font-bold text-slate-900">Clinic Staff Directory</h3>
                  </div>
                  <button
                    onClick={() => {
                      setEditingEmployee(null);
                      setEmployeeForm({ name: '', role: 'pharmacist', phone: '', email: '', shift: 'General' });
                      setIsEmployeeModalOpen(true);
                    }}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg"
                  >
                    + Add Staff
                  </button>
                </div>

                <div className="space-y-1.5">
                  {employees.map((emp) => (
                    <div key={emp.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-800">{emp.name}</div>
                        <div className="text-[10px] text-slate-500 uppercase">{emp.role} • {emp.shift || 'General'}</div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => {
                            setEditingEmployee(emp);
                            setEmployeeForm({
                              name: emp.name,
                              role: emp.role,
                              phone: emp.phone || '',
                              email: emp.email || '',
                              shift: emp.shift || 'General'
                            });
                            setIsEmployeeModalOpen(true);
                          }}
                          className="text-xs text-blue-600 font-semibold hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(emp)}
                          className="text-xs text-rose-600 font-semibold hover:underline flex items-center gap-0.5"
                          title="Delete staff record"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Danger Zone: Clinic Data Maintenance (Admin Only) */}
            {currentUser?.role === 'admin' && (
              <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs space-y-3">
                <div className="text-sm font-bold text-rose-700 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Clinic Data Maintenance (Admin)</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Clean example/demo records to start fresh for clinic operations, or perform a complete device data reset.
                </p>
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    onClick={async () => {
                      if (!confirm("Are you sure you want to delete all example/demo records (demo patients, demo bills)? Real clinic records will be kept.")) return;
                      try {
                        const res = await fetch(apiUrl('/api/system/clear-example-records'), { method: 'POST' });
                        if (res.ok) {
                          alert("All example placeholder records have been deleted successfully.");
                          loadData();
                          loadPeriodStats(reportPeriod);
                        } else {
                          const err = await res.json();
                          alert(err.error || "Failed to purge example records.");
                        }
                      } catch (e: any) {
                        alert(e.message || "Failed to clear example records.");
                      }
                    }}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete All Example Data Records</span>
                  </button>

                  <button
                    onClick={async () => {
                      if (!confirm("CAUTION: This will permanently wipe ALL clinic data, medicines, and records from this device. Are you completely sure?")) return;
                      try {
                        const res = await fetch(apiUrl('/api/system/wipe-all-data'), { method: 'POST' });
                        if (res.ok) {
                          alert("All data on this device has been completely wiped. Reloading...");
                          window.location.reload();
                        } else {
                          const err = await res.json();
                          alert(err.error || "Failed to wipe data.");
                        }
                      } catch (e: any) {
                        alert(e.message || "Failed to wipe data.");
                      }
                    }}
                    className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-rose-200"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <span>Factory Reset / Wipe All Data</span>
                  </button>
                </div>
              </div>
            )}

            {/* System Controls */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              {onLogout && (
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={onLogout}
                    className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Log Out
                  </button>
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded leading-none ${
                    currentUser?.role === 'admin'
                      ? 'text-amber-600 bg-amber-50 border border-amber-200'
                      : 'text-slate-600 bg-slate-100 border border-slate-200'
                  }`}>
                    {currentUser?.role === 'admin' ? 'admin' : 'employee'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ─── STICKY BOTTOM CART TRIGGER (BILLING TAB) ───────────────── */}
      {cart.length > 0 && !isCartOpen && activeTab === 'billing' && (
        <div className="fixed bottom-[76px] left-0 right-0 p-3 z-30 pointer-events-none">
          <div className="max-w-lg mx-auto pointer-events-auto">
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl flex items-center justify-between active:scale-98 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-white/20 flex items-center justify-center font-bold text-xs">
                  {totalItemsCount}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold truncate">Review Bill & Checkout</div>
                  <div className="text-[10px] text-blue-200">{cart.length} unique medicines</div>
                </div>
              </div>
              <div className="flex items-center gap-1 font-black text-sm">
                <span>₹{totalAmount.toFixed(2)}</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ─── BOTTOM NAVIGATION BAR & COPYRIGHT FOOTER ───────────────── */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shrink-0 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <nav className={`pt-1.5 pb-1 px-1 ${
          currentUser?.role === 'admin' ? 'grid grid-cols-5' : 'grid grid-cols-4'
        }`}>
          <button
            onClick={() => setActiveTab('billing')}
            className={`flex flex-col items-center justify-center gap-0.5 ${
              activeTab === 'billing' ? 'text-blue-600 font-bold' : 'text-slate-500'
            }`}
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="text-[10px] font-bold">Billing</span>
          </button>

          <button
            onClick={() => setActiveTab('medicines')}
            className={`flex flex-col items-center justify-center gap-0.5 ${
              activeTab === 'medicines' ? 'text-blue-600 font-bold' : 'text-slate-500'
            }`}
          >
            <Package className="h-5 w-5" />
            <span className="text-[10px]">Medicines</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex flex-col items-center justify-center gap-0.5 ${
              activeTab === 'reports' ? 'text-blue-600 font-bold' : 'text-slate-500'
            }`}
          >
            <BarChart2 className="h-5 w-5" />
            <span className="text-[10px]">Reports {currentUser?.role !== 'admin' && '(View)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('patients')}
            className={`flex flex-col items-center justify-center gap-0.5 ${
              activeTab === 'patients' ? 'text-blue-600 font-bold' : 'text-slate-500'
            }`}
          >
            <Users className="h-5 w-5" />
            <span className="text-[10px]">Patients</span>
          </button>

          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('more')}
              className={`flex flex-col items-center justify-center gap-0.5 ${
                activeTab === 'more' ? 'text-blue-600 font-bold' : 'text-slate-500'
              }`}
            >
              <Settings className="h-5 w-5" />
              <span className="text-[10px]">More</span>
            </button>
          )}
        </nav>
        <div className="bg-slate-50 border-t border-slate-100 px-2 py-0.5 pb-[max(3px,env(safe-area-inset-bottom))] text-center text-[9px] text-slate-500 font-medium">
          &copy; 2026 <strong className="text-slate-700 font-bold">RegulaVitae</strong> · Developed &amp; Licensed by RegulaVitae
        </div>
      </footer>

      {/* ─── CHECKOUT SHEET DRAWER ──────────────────────────────────── */}
      {isCartOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end">
          <div className="w-full max-w-lg mx-auto bg-white rounded-t-3xl max-h-[92vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* Sheet Header */}
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  {totalItemsCount}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Current Bill Checkout</h3>
                  <p className="text-[10px] text-slate-400">Pharmacy Dispensing Checkout</p>
                </div>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Sheet Scrollable Body */}
            <div className="p-3.5 overflow-y-auto space-y-3 flex-1">
              {/* Patient Selection Card */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Patient Details
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                    <input
                      type="checkbox"
                      checked={isWalkIn}
                      onChange={(e) => {
                        setIsWalkIn(e.target.checked);
                        if (e.target.checked) setSelectedPatient(null);
                      }}
                      className="rounded text-blue-600"
                    />
                    Walk-in Patient
                  </label>
                </div>

                {!isWalkIn && (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search patient by name / phone..."
                      value={selectedPatient ? `${selectedPatient.name} (${selectedPatient.phone || 'No phone'})` : patientSearch}
                      onChange={(e) => {
                        setSelectedPatient(null);
                        setPatientSearch(e.target.value);
                        setIsPatientDropdownOpen(true);
                      }}
                      onFocus={() => setIsPatientDropdownOpen(true)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                    {isPatientDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                        {patients
                          .filter((p) => p.name.toLowerCase().includes(patientSearch.toLowerCase()))
                          .map((p) => (
                            <div
                              key={p.id}
                              onClick={() => {
                                setSelectedPatient(p);
                                setIsPatientDropdownOpen(false);
                              }}
                              className="p-2 text-xs hover:bg-blue-50 cursor-pointer border-b border-slate-100"
                            >
                              <div className="font-bold text-slate-800">{p.name}</div>
                              <div className="text-[10px] text-slate-400">{p.phone} • Age: {p.age || 'N/A'}</div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Prescribing Doctor */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Prescribing Doctor</label>
                  <select
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                  >
                    {CLINIC_DOCTORS.map((doc, idx) => (
                      <option key={idx} value={doc.name}>{doc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cart Items List */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Medicines to Dispense ({cart.length})
                </div>

                {cart.map((item) => (
                  <div key={item.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate">{item.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Batch: <span className="font-mono">{item.batch_number}</span> • Exp: {item.expiry_date}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs">
                        <span className="font-black text-slate-900">₹{(item.rate * item.quantity).toFixed(2)}</span>
                        <span className="text-[10px] text-slate-400">(₹{item.rate.toFixed(2)} each)</span>
                      </div>
                    </div>

                    {/* Stepper + Delete */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                        <button
                          onClick={() => updateCartQty(item.id, -1)}
                          className="h-6 w-6 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQty(item.id, 1)}
                          className="h-6 w-6 rounded flex items-center justify-center text-blue-600 hover:bg-blue-50"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Discount Section (5%, 10%, Custom - Persists across all bills) */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 uppercase tracking-wide text-[11px]">Bill Discount (%)</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSetDiscount(5)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${discountPercent === 5 ? 'bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-400 font-black' : 'bg-white text-slate-700 border border-slate-200'}`}
                      title="Apply 5% persistent discount"
                    >
                      5%
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetDiscount(10)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${discountPercent === 10 ? 'bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-400 font-black' : 'bg-white text-slate-700 border border-slate-200'}`}
                      title="Apply 10% persistent discount"
                    >
                      10%
                    </button>
                    {discountPercent > 0 && (
                      <button
                        type="button"
                        onClick={() => handleSetDiscount(0)}
                        className="px-2 py-1 rounded-lg text-xs bg-slate-200 text-slate-600 hover:text-rose-600 font-bold"
                        title="Clear discount (0%)"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[11px]">Custom %:</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={discountPercent > 0 ? discountPercent : ''}
                    onChange={(e) => {
                      const p = Math.min(100, Math.max(0, Number(e.target.value)));
                      handleSetDiscount(p);
                    }}
                    className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 text-center"
                  />
                  {discountAmount > 0 && (
                    <span className="text-rose-600 font-bold text-xs ml-auto">
                      -₹{discountAmount.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Subtotal & Net Payable */}
                <div className="pt-2 border-t border-slate-200 space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal (excl. GST):</span>
                    <span className="font-medium font-mono">₹{cartSubtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-rose-600 font-medium">
                      <span>Discount ({discountPercent}%):</span>
                      <span className="font-mono">-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {cartTax > 0 && (
                    <>
                      <div className="flex justify-between text-slate-600 text-xs">
                        <span>CGST (Central Tax):</span>
                        <span className="font-mono">+₹{cartCgst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 text-xs">
                        <span>SGST (State Tax):</span>
                        <span className="font-mono">+₹{cartSgst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-amber-600 text-xs font-bold">
                        <span>Total GST Added:</span>
                        <span className="font-mono">+₹{cartTax.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-base font-black text-slate-900 pt-1 border-t border-slate-200">
                    <span>{isComplimentaryCheckout ? 'Complimentary Dispense:' : 'Grand Total (incl. GST):'}</span>
                    <span className="text-blue-700 font-mono">₹{isComplimentaryCheckout ? '0.00' : totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Admin Only: Complimentary / Doctor Free Health Dispense */}
              {currentUser?.role === 'admin' && (
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
                  <label className="flex items-center justify-between cursor-pointer select-none">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Free Health Dispense (₹0 Cost)</span>
                        <span className="text-[10px] text-amber-800 block">Admin: Dispense complimentary to doctor/staff</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isComplimentaryCheckout}
                      onChange={(e) => {
                        setIsComplimentaryCheckout(e.target.checked);
                        if (e.target.checked) setPaymentMethod('Cash');
                      }}
                      className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                    />
                  </label>

                  {isComplimentaryCheckout && (
                    <div className="space-y-1.5 pt-1.5 border-t border-amber-200/80">
                      <input
                        type="text"
                        placeholder="Recipient Name (e.g. Dr. Ramesh / Staff Priya)"
                        value={complimentaryRecipient}
                        onChange={(e) => setComplimentaryRecipient(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-amber-500"
                      />
                      <input
                        type="text"
                        placeholder="Reason / Notes (e.g. Health Dispense)"
                        value={complimentaryReason}
                        onChange={(e) => setComplimentaryReason(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Payment Section */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Payment Mode
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {(['Cash', 'UPI', 'Card'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2 rounded-lg text-xs font-bold transition-all ${
                        paymentMethod === m
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {paymentMethod === 'Cash' && (
                  <div className="space-y-2 pt-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Cash Received (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      placeholder={`Min ₹${totalAmount.toFixed(2)}`}
                      className={`w-full px-3 py-2 rounded-xl text-sm font-bold border ${
                        isCashInsufficient ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200 bg-white'
                      }`}
                    />

                    {/* Quick Cash Chips */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      <button
                        onClick={() => setCashTendered(round2(totalAmount).toFixed(2))}
                        className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-[11px] font-bold text-slate-700"
                      >
                        Exact (₹{round2(totalAmount).toFixed(2)})
                      </button>
                      {[100, 200, 500, 1000].map((val) => (
                        <button
                          key={val}
                          onClick={() => {
                            const cur = parseFloat(cashTendered) || 0;
                            setCashTendered(round2(cur + val).toFixed(2));
                          }}
                          className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-[11px] font-bold text-slate-700"
                        >
                          +₹{val}
                        </button>
                      ))}
                    </div>

                    {isCashInsufficient ? (
                      <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        Enter amount received (min ₹{totalAmount.toFixed(2)})
                      </p>
                    ) : (
                      <div className="flex justify-between items-center bg-emerald-50 p-2 rounded-lg border border-emerald-200 text-xs">
                        <span className="font-bold text-emerald-800">Change to Return:</span>
                        <span className="font-black text-emerald-700 text-sm">₹{changeToReturn.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sheet Footer Actions */}
            <div className="p-3.5 border-t border-slate-100 bg-white shrink-0 space-y-2">
              <button
                disabled={isSubmittingBill || cart.length === 0 || (paymentMethod === 'Cash' && isCashInsufficient)}
                onClick={handleCompleteBill}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-98 transition-all"
              >
                {isSubmittingBill ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Processing Bill...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Complete & Print Bill (₹{totalAmount.toFixed(2)})</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setCart([])}
                className="w-full py-1.5 text-slate-400 hover:text-rose-600 text-xs font-semibold"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── BILL SUCCESS & RECEIPT MODAL ────────────────────────────── */}
      {billSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-white rounded-3xl p-4 shadow-2xl space-y-3 text-center animate-in zoom-in-95">
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">Bill Issued Successfully!</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">Invoice #{billSuccessModal.billNumber}</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-bold text-slate-800">{billSuccessModal.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Doctor:</span>
                <span className="font-medium text-slate-700 truncate max-w-[170px]">{billSuccessModal.doctor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Items:</span>
                <span className="font-bold">{billSuccessModal.items.length} medicines</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 font-black text-sm">
                <span>Amount Paid:</span>
                <span className="text-blue-700">₹{billSuccessModal.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="text-[11px] font-bold text-slate-700 bg-amber-50 border border-amber-200 p-2 rounded-lg">
              Drugs sold cannot be refunded
            </div>

            <div className="space-y-1.5 pt-1">
              <button
                onClick={() => printMobileThermalReceipt(billSuccessModal, clinicDetails)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                🖨️ Print Receipt
              </button>
              <button
                onClick={() => setBillSuccessModal(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD / EDIT MEDICINE MODAL ───────────────────────────────── */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-white rounded-3xl p-4 shadow-2xl max-h-[92vh] overflow-y-auto space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                {editingProduct ? 'Edit Medicine' : 'Add New Medicine'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-2 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Brand Name *</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Zerodol-P Tablet"
                  className="w-full p-2 bg-slate-50 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Generic Name / Composition</label>
                <input
                  type="text"
                  value={productForm.generic_name}
                  onChange={(e) => setProductForm({ ...productForm, generic_name: e.target.value })}
                  placeholder="e.g. Aceclofenac + Paracetamol"
                  className="w-full p-2 bg-slate-50 border rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Category * (Select multiple or enter comma-separated)
                  </label>
                  <input
                    type="text"
                    list="mobile-cats"
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    placeholder="e.g. Analgesic, Anti-inflammatory"
                    className="w-full p-2 bg-slate-50 border rounded-lg text-xs"
                    required
                  />
                  <datalist id="mobile-cats">
                    {categories.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>

                  {/* Interactive Category Chips for Multi-Category Assignment */}
                  <div className="flex flex-wrap gap-1 mt-1.5 max-h-24 overflow-y-auto p-1.5 bg-slate-100 rounded-lg border border-slate-200">
                    {categories.filter((c) => c !== 'All').map((cat) => {
                      const activeCats = (productForm.category || '').split(',').map(s => s.trim()).filter(Boolean);
                      const isSelected = activeCats.some(c => c.toLowerCase() === cat.toLowerCase());
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            let updated: string[];
                            if (isSelected) {
                              updated = activeCats.filter(c => c.toLowerCase() !== cat.toLowerCase());
                            } else {
                              updated = [...activeCats, cat];
                            }
                            setProductForm(prev => ({ ...prev, category: updated.join(', ') }));
                          }}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all border ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                          title={isSelected ? `Click to remove "${cat}"` : `Click to add "${cat}"`}
                        >
                          {isSelected ? '✓ ' : '+ '}{cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Packaging Type</label>
                  <select
                    value={productForm.quantity_type}
                    onChange={(e) => setProductForm({ ...productForm, quantity_type: e.target.value })}
                    className="w-full p-2 bg-slate-50 border rounded-lg"
                  >
                    <option value="strip">strip (tablets)</option>
                    <option value="pcs">pcs (brace / item)</option>
                    <option value="pack">pack</option>
                    <option value="ml">ml (syrup/lotion)</option>
                    <option value="g">g (ointment)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <div>
                  <label className="block text-[10px] font-bold text-blue-700 mb-1">Selling Rate *</label>
                  <input
                    type="number"
                    step="any"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="Rate"
                    className="w-full p-1.5 bg-blue-50 border border-blue-200 rounded-lg font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    step="any"
                    value={productForm.mrp}
                    onChange={(e) => setProductForm({ ...productForm, mrp: e.target.value })}
                    placeholder="MRP"
                    className="w-full p-1.5 bg-slate-50 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Cost Price</label>
                  <input
                    type="number"
                    step="any"
                    value={productForm.purchase_price}
                    onChange={(e) => setProductForm({ ...productForm, purchase_price: e.target.value })}
                    placeholder="Cost"
                    className="w-full p-1.5 bg-slate-50 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    value={productForm.available_stock}
                    onChange={(e) => setProductForm({ ...productForm, available_stock: e.target.value })}
                    className="w-full p-1.5 bg-slate-50 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Batch Number</label>
                  <input
                    type="text"
                    value={productForm.batch_number}
                    onChange={(e) => setProductForm({ ...productForm, batch_number: e.target.value })}
                    placeholder="Batch"
                    className="w-full p-1.5 bg-slate-50 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={productForm.expiry_date}
                    onChange={(e) => setProductForm({ ...productForm, expiry_date: e.target.value })}
                    className="w-full p-1.5 bg-slate-50 border rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">GST Tax Rate *</label>
                <select
                  value={productForm.tax_percent}
                  onChange={(e) => setProductForm({ ...productForm, tax_percent: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-semibold"
                >
                  <option value={0}>0% — Exempt Medicines</option>
                  <option value={5}>5% — Essential Pharma / Life-saving</option>
                  <option value={12}>12% — Medical Devices &amp; Braces</option>
                  <option value={18}>18% — Supplements &amp; OTC Topicals</option>
                  <option value={28}>28% — Specialized Goods</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                >
                  {editingProduct ? 'Update Medicine' : 'Save Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD CATEGORY MODAL ─────────────────────────────────────── */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-white rounded-3xl p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">Create Custom Category</h3>
              <button onClick={() => setIsAddCategoryOpen(false)} className="text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category Name *</label>
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. Spine Implants, Pediatric Care"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <button
              onClick={() => handleCreateCategory(newCatName)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
            >
              Add Category (Placed First)
            </button>
          </div>
        </div>
      )}

      {/* ─── INWARD STOCK MULTI-MEDICINE CONSIGNMENT MODAL ───────────────────────── */}
      {isInwardModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="w-full max-w-lg bg-white rounded-3xl p-4 shadow-2xl max-h-[92vh] overflow-y-auto space-y-3.5">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div>
                <h3 className="text-sm font-black text-slate-900">Inward Stock Refill Consignment</h3>
                <p className="text-[11px] text-slate-500">Log multiple medicines received in a single delivery receipt</p>
              </div>
              <button onClick={() => setIsInwardModalOpen(false)} className="text-slate-400 p-1 hover:bg-slate-100 rounded-full">
                <X className="h-4 w-4" />
              </button>
            </div>

            <datalist id="mob-inward-med-list">
              {products.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name} · MRP ₹{(p.mrp || p.price).toFixed(2)} · Cost ₹{(p.purchase_price || 0).toFixed(2)}
                </option>
              ))}
            </datalist>

            <form onSubmit={handleInwardSubmit} className="space-y-3.5 text-xs">
              {/* Consignment Header: Supplier & Invoice */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Supplier / Wholesaler *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Pharma, MedPlus"
                      value={inwardConsignment.supplier}
                      onChange={(e) => setInwardConsignment({ ...inwardConsignment, supplier: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Invoice / DC No. *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. INV-9041"
                      value={inwardConsignment.invoiceNumber}
                      onChange={(e) => setInwardConsignment({ ...inwardConsignment, invoiceNumber: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Date Received *</label>
                    <input
                      type="date"
                      required
                      value={inwardConsignment.receivedDate}
                      onChange={(e) => setInwardConsignment({ ...inwardConsignment, receivedDate: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Notes / Storage Rack</label>
                    <input
                      type="text"
                      placeholder="e.g. Shelf A-2"
                      value={inwardConsignment.notes}
                      onChange={(e) => setInwardConsignment({ ...inwardConsignment, notes: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Medicines In This Consignment */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                    Medicines In This Delivery ({inwardConsignment.items.length})
                  </span>
                  <span className="text-[10px] text-slate-400">Type or select from dropdown</span>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-0.5">
                  {inwardConsignment.items.map((it, idx) => {
                    const lineCost = Number(it.quantity || 0) * Number(it.purchasePrice || 0);
                    return (
                      <div key={it.id} className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-700 text-xs">#{idx + 1} Medicine</span>
                          {inwardConsignment.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveInwardRow(it.id)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                              title="Remove item"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Medicine name with autocomplete & typing option */}
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Medicine Name *</label>
                          <input
                            type="text"
                            required
                            list="mob-inward-med-list"
                            placeholder="Type or select medicine name..."
                            value={it.productName}
                            onChange={(e) => handleUpdateInwardRow(it.id, 'productName', e.target.value)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Batch Number *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. B-2026-01"
                              value={it.batchNumber}
                              onChange={(e) => handleUpdateInwardRow(it.id, 'batchNumber', e.target.value)}
                              className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono uppercase text-sky-700 font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Expiry Date *</label>
                            <input
                              type="date"
                              required
                              value={it.expiryDate}
                              onChange={(e) => handleUpdateInwardRow(it.id, 'expiryDate', e.target.value)}
                              className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5">
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Qty Received *</label>
                            <input
                              type="number"
                              required
                              min="1"
                              placeholder="Qty"
                              value={it.quantity}
                              onChange={(e) => handleUpdateInwardRow(it.id, 'quantity', e.target.value)}
                              className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Cost (₹) *</label>
                            <input
                              type="number"
                              step="any"
                              required
                              placeholder="Cost"
                              value={it.purchasePrice}
                              onChange={(e) => handleUpdateInwardRow(it.id, 'purchasePrice', e.target.value)}
                              className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Line Cost</label>
                            <div className="p-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-mono font-bold text-amber-800 text-center">
                              ₹{lineCost.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">MRP (₹) *</label>
                            <input
                              type="number"
                              step="any"
                              required
                              placeholder="MRP"
                              value={it.mrp}
                              onChange={(e) => handleUpdateInwardRow(it.id, 'mrp', e.target.value)}
                              className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-blue-700 mb-1">Selling Rate (₹) *</label>
                            <input
                              type="number"
                              step="any"
                              required
                              placeholder="Rate"
                              value={it.sellingPrice}
                              onChange={(e) => handleUpdateInwardRow(it.id, 'sellingPrice', e.target.value)}
                              className="w-full p-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-mono font-bold text-blue-800 text-center"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleAddInwardRow}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-amber-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-slate-200"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Add Another Medicine</span>
                </button>
              </div>

              {/* Total Consignment Purchase Cost */}
              {(() => {
                const totalCost = inwardConsignment.items.reduce(
                  (sum, it) => sum + (Number(it.quantity || 0) * Number(it.purchasePrice || 0)),
                  0
                );
                return (
                  <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-amber-900 block">Total Consignment Cost:</span>
                      <span className="text-[10px] text-amber-700">{inwardConsignment.items.length} medicines in receipt</span>
                    </div>
                    <span className="text-base font-black text-amber-800 font-mono">₹{totalCost.toFixed(2)}</span>
                  </div>
                );
              })()}

              <div className="pt-1">
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Record Inward Stock Consignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD / EDIT PATIENT MODAL ────────────────────────────────── */}
      {isPatientModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-white rounded-3xl p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                {editingPatient ? 'Edit Patient Details' : 'Register New Patient'}
              </h3>
              <button onClick={() => setIsPatientModalOpen(false)} className="text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSavePatient} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={patientForm.name}
                  onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
                  placeholder="Patient Name"
                  className="w-full p-2 bg-slate-50 border rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Age</label>
                  <input
                    type="number"
                    value={patientForm.age}
                    onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })}
                    placeholder="Years"
                    className="w-full p-2 bg-slate-50 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Gender</label>
                  <select
                    value={patientForm.gender}
                    onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
                    className="w-full p-2 bg-slate-50 border rounded-lg"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={patientForm.phone}
                  onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                  placeholder="+91 98..."
                  className="w-full p-2 bg-slate-50 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Address / Area</label>
                <input
                  type="text"
                  value={patientForm.address}
                  onChange={(e) => setPatientForm({ ...patientForm, address: e.target.value })}
                  placeholder="Chennai, TN"
                  className="w-full p-2 bg-slate-50 border rounded-lg"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                >
                  {editingPatient ? 'Update Patient' : 'Save Patient & Select for Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── PATIENT HISTORY & VISITS MODAL ─────────────────────────── */}
      {viewingPatientHistory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-white rounded-3xl p-4 shadow-2xl max-h-[85vh] overflow-y-auto space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{viewingPatientHistory.name}</h3>
                <p className="text-[10px] text-slate-400">Past Bills & Prescription Log</p>
              </div>
              <button onClick={() => setViewingPatientHistory(null)} className="text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              {billsList
                .filter((b) => b.patient_name === viewingPatientHistory.name)
                .map((b) => (
                  <div key={b.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="font-mono text-blue-700">{b.bill_number}</span>
                      <span className="text-slate-800">₹{Number(b.grand_total !== undefined && b.grand_total !== null ? b.grand_total : (b.total ?? b.total_amount ?? 0)).toFixed(2)}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">{b.date} • {b.doctor || 'Doctor'}</div>
                  </div>
                ))}
            </div>

            <button
              onClick={() => setViewingPatientHistory(null)}
              className="w-full py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
            >
              Close History
            </button>
          </div>
        </div>
      )}

      {/* ─── VIEW BILL RECEIPT MODAL ─────────────────────────────────── */}
      {viewingBillModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-white rounded-3xl p-4 shadow-2xl max-h-[90vh] overflow-y-auto space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Receipt Details</h3>
                <p className="text-xs font-mono text-blue-600">{viewingBillModal.bill_number}</p>
              </div>
              <button onClick={() => setViewingBillModal(null)} className="text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="text-xs space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="flex justify-between"><span className="text-slate-500">Date:</span><span>{viewingBillModal.date}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Patient:</span><span className="font-bold">{viewingBillModal.patient_name || 'Walk-in'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Doctor:</span><span>{viewingBillModal.doctor || 'Consultant'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Payment:</span><span>{viewingBillModal.payment_method}</span></div>
              <div className="flex justify-between font-bold pt-1 border-t text-sm">
                <span>Total Amount:</span><span className="text-blue-700">₹{Number(viewingBillModal.grand_total !== undefined && viewingBillModal.grand_total !== null ? viewingBillModal.grand_total : (viewingBillModal.total ?? viewingBillModal.total_amount ?? 0)).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => printMobileThermalReceipt(viewingBillModal, clinicDetails)}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1"
              >
                <Printer className="h-3.5 w-3.5" /> Print
              </button>
              <button
                onClick={() => setViewingBillModal(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CANCEL BILL MODAL (STATUTORY) ───────────────────────────── */}
      {cancellingBill && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-white rounded-3xl p-4 shadow-2xl space-y-3">
            <div className="flex items-center gap-2 text-rose-600 border-b pb-2">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-sm font-bold text-slate-900">Cancel Bill #{cancellingBill.bill_number}</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Under Drug Rule 65, voiding an invoice requires an audit justification. Medicines will automatically be returned to live stock.
            </p>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Cancellation Reason *</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Patient changed prescription / billing entry error"
                rows={3}
                className="w-full p-2 bg-slate-50 border rounded-lg text-xs"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmCancelBill}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl"
              >
                Confirm Cancellation
              </button>
              <button
                onClick={() => setCancellingBill(null)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD / EDIT STAFF MODAL ──────────────────────────────────── */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-white rounded-3xl p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                {editingEmployee ? 'Edit Staff Member' : 'Register New Staff'}
              </h3>
              <button onClick={() => setIsEmployeeModalOpen(false)} className="text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Staff Name *</label>
                <input
                  type="text"
                  value={employeeForm.name}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                  placeholder="e.g. S. Karthik"
                  className="w-full p-2 bg-slate-50 border rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Role</label>
                  <select
                    value={employeeForm.role}
                    onChange={(e: any) => setEmployeeForm({ ...employeeForm, role: e.target.value })}
                    className="w-full p-2 bg-slate-50 border rounded-lg"
                  >
                    <option value="pharmacist">Pharmacist</option>
                    <option value="cashier">Cashier</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Shift</label>
                  <select
                    value={employeeForm.shift}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, shift: e.target.value })}
                    className="w-full p-2 bg-slate-50 border rounded-lg"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Phone</label>
                <input
                  type="tel"
                  value={employeeForm.phone}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                  placeholder="+91..."
                  className="w-full p-2 bg-slate-50 border rounded-lg"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── REAL-TIME EXPIRATION & INVENTORY ALERTS MODAL ─────────── */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        data={notificationsData}
        onRefresh={fetchNotifications}
        onNavigateToInward={() => {
          setIsNotificationsOpen(false);
          setIsInwardModalOpen(true);
        }}
        onSelectProductForBilling={(productName) => {
          setIsNotificationsOpen(false);
          setActiveTab('billing');
          setSearchQuery(productName);
        }}
      />
    </div>
  );
};

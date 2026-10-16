import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Plus, Search, Trash2, CreditCard, DollarSign, Smartphone, ShoppingBag,
  Settings, BarChart2, FileText, X, Check, AlertCircle, Edit, RefreshCw, AlertTriangle,
  Users, Lock, LogOut, Shield, KeyRound, Wifi, Bluetooth, Printer,
  FileSpreadsheet, UploadCloud, Download, Menu, CheckCircle,
  Database, PlusCircle, ChevronRight
} from 'lucide-react';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import {
  isBluetoothSupported,
  connectBluetoothPrinter,
  disconnectBluetoothPrinter,
  printViaBluetooth,
  getActiveBluetoothDevice
} from './utils/bluetoothPrinter';

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
        cashierName = "Pharmacist",
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
              <td><span class="bold">Cashier:</span> ${cashierName}</td>
              <td class="right"><span class="bold">Time:</span> ${time}</td>
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
                  <td>${item.product_name}</td>
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
            <div class="bold">Thank You. Stay Healthy!</div>
            <div style="font-size: 9px; color: #666; margin-top: 4px;">MADRAS ORTHO CLINIC SOFTWARE | Mission for Cure</div>
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
  price: number;
  barcode: string | null;
  sku: string | null;
  tax_percent: number;
  status: 'Available' | 'Out of Stock';
  quantity_type: 'pcs' | 'kg' | 'g' | 'pack' | 'strip' | 'ml' | 'L';
}

interface Employee {
  id: number;
  name: string;
  role: string;
  phone: string | null;
  email: string | null;
  salary: number | null;
  status: 'Active' | 'Inactive';
  joined_date: string | null;
}

interface BillItem {
  product_id: number;
  product_name: string;
  quantity: number;
  rate: number;
  tax_percent: number;
  total: number;
}

interface BillingSession {
  id: string;
  billNumber: number;
  items: BillItem[];
  discountPercent: number;
  discountAmount: number;
  paymentMethod: 'Cash' | 'Google Pay' | 'Bank Card' | null;
  holdStatus: boolean;
  selectedItemIndex: number; // for keyboard navigation inside active item list
  cashierName: string;
}

interface ClinicBranding {
  name: string;
  description: string;
  address: string;
  phone: string;
  gstin: string;
  dlNo: string;
}

export default function App() {
  // App states
  const [sessions, setSessions] = useState<BillingSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Modals & Panels visibility
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showProductCrudModal, setShowProductCrudModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showEmployeeCrudModal, setShowEmployeeCrudModal] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editingEmployee, setEditingEmployee] = useState<Partial<Employee>>({});
  const [employeeSearch, setEmployeeSearch] = useState('');

  // Mobile navigation drawer & instant catalogue search
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [catalogueSearch, setCatalogueSearch] = useState('');

  // Medicine Management & Intelligent Excel Upload state
  const [productModalTab, setProductModalTab] = useState<'manual' | 'excel' | 'list'>('manual');
  const [excelParsing, setExcelParsing] = useState(false);
  const [excelFileName, setExcelFileName] = useState('');
  const [excelParsedMedicines, setExcelParsedMedicines] = useState<any[]>([]);
  const [excelConflicts, setExcelConflicts] = useState<Array<{ excelItem: any; existingItem: Product; userChoice: 'skip' | 'add' }>>([]);
  const [excelNewItems, setExcelNewItems] = useState<any[]>([]);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [isBatchImporting, setIsBatchImporting] = useState(false);

  // Authentication & Role State
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string; role: 'admin' | 'employee'; name: string } | null>(() => {
    const saved = localStorage.getItem("madrasortho_pos_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [isFirstTimeEver, setIsFirstTimeEver] = useState<boolean>(() => {
    return !localStorage.getItem("madrasortho_pos_has_logged_in_ever");
  });
  const [loginForm, setLoginForm] = useState({ username: 'admin', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ username: 'admin', currentPassword: '', newPassword: '', confirmPassword: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginForm.password) {
      setLoginError('Password is required.');
      return;
    }
    setIsLoggingIn(true);
    try {
      const res = await fetch("http://localhost:4848/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentUser(data.user);
        localStorage.setItem("madrasortho_pos_user", JSON.stringify(data.user));
        localStorage.setItem("madrasortho_pos_has_logged_in_ever", "true");
        setIsFirstTimeEver(false);
        showToast(`Logged in as ${data.user.name} (${data.user.role.toUpperCase()})`, "success");
      } else {
        setLoginError(data.error || "Invalid username or password");
      }
    } catch (err) {
      // Local fallback authentication
      if (loginForm.username === 'admin' && (loginForm.password === 'admin123' || loginForm.password === 'admin')) {
        const u = { id: 1, username: 'admin', role: 'admin' as const, name: 'Administrator' };
        setCurrentUser(u);
        localStorage.setItem("madrasortho_pos_user", JSON.stringify(u));
        localStorage.setItem("madrasortho_pos_has_logged_in_ever", "true");
        setIsFirstTimeEver(false);
        showToast("Logged in as Administrator", "success");
      } else if (loginForm.username === 'employee' && (loginForm.password === 'employee123' || loginForm.password === 'employee' || loginForm.password === '1234')) {
        const u = { id: 2, username: 'employee', role: 'employee' as const, name: 'Pharmacist' };
        setCurrentUser(u);
        localStorage.setItem("madrasortho_pos_user", JSON.stringify(u));
        localStorage.setItem("madrasortho_pos_has_logged_in_ever", "true");
        setIsFirstTimeEver(false);
        showToast("Logged in as Pharmacist", "success");
      } else {
        setLoginError(isFirstTimeEver ? "Invalid username or password. Default Admin: admin / admin123. Default Employee: employee / employee123" : "Invalid username or password.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
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
      const res = await fetch("http://localhost:4848/api/auth/change-password", {
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
        showToast(`Password for ${passwordForm.username} updated!`, "success");
        setChangePasswordModal(false);
        setPasswordForm({ username: 'admin', currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showToast(data.error || "Failed to update password.", "error");
      }
    } catch (err: any) {
      showToast(err.message, "error");
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
  const [changeDue, setChangeDue] = useState(0);

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
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      name: "MADRAS ORTHO CLINIC SOFTWARE",
      description: "Mission for Cure",
      address: "Chennai, Tamil Nadu",
      phone: "+91 98765 43210",
      gstin: "33AAAAA0000A1Z5",
      dlNo: "TN/CHE/2026/001"
    };
  });

  useEffect(() => {
    localStorage.setItem("madrasortho_clinic_branding", JSON.stringify(bakeryDetails));
  }, [bakeryDetails]);

  // Mobile navigation active tab ('menu', 'ticket', 'queue')
  const [mobileTab, setMobileTab] = useState<'menu' | 'ticket' | 'queue'>('menu');

  // Admin Product Form
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [crudSearch, setCrudSearch] = useState('');

  // Analytics report states
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'yearly'>('daily');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
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

  // Fetch initial products
  const loadProducts = async () => {
    try {
      const res = await fetch("http://localhost:4848/api/products");
      const data = await res.json();
      setProducts(data);
      // Unique categories
      const cats: string[] = Array.from(new Set(data.map((p: Product) => p.category)));
      setCategories(cats);
    } catch (err) {
      showToast("Failed to load products from server. Make sure server is running.", "error");
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await fetch("http://localhost:4848/api/employees");
      const data = await res.json();
      setEmployees(data);
    } catch (err) {
      showToast("Failed to load employees from server. Make sure server is running.", "error");
    }
  };

  useEffect(() => {
    loadProducts();
    loadEmployees();
    // Fetch system printers
    electronAPI.getPrinters().then((list: any[]) => {
      setPrinters(list);
      const def = list.find((p: any) => p.isDefault);
      if (def) setSelectedPrinter(def.name);
    });

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
          const res = await fetch("http://localhost:4848/api/bills/next-number");
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
  }, []);

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

    // Subtotal: prices in DB are EXCLUSIVE of GST (MRP base price)
    const subtotal = activeSession.items.reduce((sum, item) => sum + item.total, 0);

    let discount = 0;
    if (activeSession.discountPercent > 0) {
      discount = (subtotal * activeSession.discountPercent) / 100;
    } else if (activeSession.discountAmount > 0) {
      discount = Math.min(subtotal, activeSession.discountAmount);
    }

    // GST = sum of (item.total * item.tax_percent / 100) — per-item GST
    const gstTotal = activeSession.items.reduce((sum, item) => {
      return sum + (item.total * (item.tax_percent / 100));
    }, 0);
    // Discount reduces the taxable base proportionally
    const discountRatio = subtotal > 0 ? discount / subtotal : 0;
    const tax = gstTotal * (1 - discountRatio);
    const cgst = tax / 2;
    const sgst = tax / 2;
    const grandTotal = Math.max(0, subtotal - discount + tax);

    return {
      subtotal,
      discount,
      tax,
      cgst,
      sgst,
      grandTotal
    };
  }, [activeSession]);

  // Update change due in cash payments
  useEffect(() => {
    if (showPaymentModal && cashReceived) {
      const received = parseFloat(cashReceived) || 0;
      setChangeDue(Math.max(0, received - billSummary.grandTotal));
    } else {
      setChangeDue(0);
    }
  }, [cashReceived, billSummary.grandTotal, showPaymentModal]);

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
      const res = await fetch("http://localhost:4848/api/bills/next-number");
      const data = await res.json();
      const dbNextNum = data.nextBillNumber || 1;

      const newId = Date.now().toString();
      setSessions(prev => {
        const billNum = getNextBillNumber(prev, dbNextNum);
        return [...prev, {
          id: newId,
          billNumber: billNum,
          items: [],
          discountPercent: 0,
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
          discountPercent: 0,
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

    // Prevent adding out-of-stock items
    if (product.status === 'Out of Stock') {
      showToast("Product is marked Out of Stock.", "error");
      return;
    }



    // Ensure an active session exists
    if (!activeSession) {
      // Create a new bill and defer adding the item
      createNewBill();
      setTimeout(() => addItemToBill(product, quantity), 200);
      return;
    }

    setSessions(prev => prev.map(s => {
      if (s.id !== activeSessionId) return s;
      const existingIndex = s.items.findIndex(item => item.product_id === product.id);
      const updatedItems = [...s.items];
      if (existingIndex !== -1) {
        const currentQty = updatedItems[existingIndex].quantity;
        const newQty = currentQty + quantity;
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          quantity: newQty,
          total: newQty * product.price,
        };
      } else {
        updatedItems.push({
          product_id: product.id,
          product_name: product.name,
          quantity: quantity,
          rate: product.price,
          tax_percent: product.tax_percent || 0,
          total: quantity * product.price,
        });
      }
      return {
        ...s,
        items: updatedItems,
        selectedItemIndex: existingIndex !== -1 ? existingIndex : updatedItems.length - 1,
      };
    }));
    showToast(`${product.name} added.`, "success");
    setTimeout(() => barcodeInputRef.current?.focus(), 20);
  };



  const updateItemQuantity = (index: number, quantity: number) => {
    if (!activeSession || quantity <= 0) return;
    setSessions(prev => prev.map(s => {
      if (s.id !== activeSessionId) return s;
      const updated = [...s.items];
      updated[index] = {
        ...updated[index],
        quantity,
        total: quantity * updated[index].rate
      };
      return { ...s, items: updated };
    }));
  };

  const deleteItemFromBill = (index: number) => {
    if (!activeSession) return;
    const item = activeSession.items[index];

    // Log item deletion to Audit History API
    fetch("http://localhost:4848/api/deleted-items", {
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
          electronAPI.printReceipt(printData, selectedPrinter).catch(() => {});
          return;
        }
        await printViaBluetooth(printData);
        showToast(`Receipt sent to Bluetooth printer (${activeDev.name})!`, "success");
      } else if (printerInterface === 'wifi') {
        if (!wifiPrinterIp) {
          showToast("Please enter WiFi Printer IP in Settings.", "error");
          electronAPI.printReceipt(printData, selectedPrinter).catch(() => {});
          return;
        }
        // Direct Electron TCP socket printing or server proxy
        if (isElectron && (electronAPI as any).printNetwork) {
          await (electronAPI as any).printNetwork(wifiPrinterIp, Number(wifiPrinterPort) || 9100, printData);
          showToast(`Receipt sent to WiFi printer (${wifiPrinterIp})!`, "success");
        } else {
          const res = await fetch("http://localhost:4848/api/print/network", {
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

  const completeBilling = async (paymentMethod: 'Cash' | 'Google Pay' | 'Bank Card') => {
    if (!activeSession || activeSession.items.length === 0) {
      showToast("Cannot check out empty ticket.", "error");
      return;
    }

    // Map UI payment method labels to server-friendly values (no spaces)
    const methodMap: Record<string, string> = {
      'Cash': 'Cash',
      'Google Pay': 'googlepay',
      'Bank Card': 'bankcard'
    };
    const serverPaymentMethod = methodMap[paymentMethod] || paymentMethod;

    const payload = {
      bill_number: activeSession.billNumber,
      subtotal: billSummary.subtotal,
      discount: billSummary.discount,
      tax: billSummary.tax,
      grand_total: billSummary.grandTotal,
      payment_method: serverPaymentMethod,
      cashier_name: activeSession.cashierName,
      items: activeSession.items
    };

    try {
      // POST invoice to server DB
      const res = await fetch("http://localhost:4848/api/bills", {
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

      // Build thermal printer payload
      const printData = {
        bakeryName: bakeryDetails.name,
        address: bakeryDetails.address,
        phone: bakeryDetails.phone,
        gstin: (bakeryDetails as any).gstin || '',
        dlNo: (bakeryDetails as any).dlNo || '',
        billNumber: savedBill.bill_number,
        date: savedBill.date,
        time: savedBill.time,
        cashierName: savedBill.cashier_name,
        items: savedBill.items,
        subtotal: savedBill.subtotal,
        discount: savedBill.discount,
        tax: savedBill.tax,
        grandTotal: savedBill.grand_total,
        paymentMethod: savedBill.payment_method,
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

      // Close modals
      setShowPaymentModal(false);
      setCashReceived('');
      setChangeDue(0);
      setSearchQuery('');
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
    const url = isNew ? "http://localhost:4848/api/products" : `http://localhost:4848/api/products/${editingProduct.id}`;
    const method = isNew ? "POST" : "PUT";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingProduct)
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

  const deleteProduct = async (id: number) => {
    if (currentUser?.role !== 'admin') {
      showToast("Access Denied: Admin privileges required to delete products.", "error");
      return;
    }
    showConfirm({
      title: "Delete Medicine",
      message: "Are you sure you want to delete this medicine/product from the database?",
      type: "danger",
      confirmText: "Delete",
      onConfirm: async () => {
        try {
          const res = await fetch(`http://localhost:4848/api/products/${id}`, {
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
    window.open("http://localhost:4848/api/products/template-excel", "_blank");
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
        res = await fetch("http://localhost:4848/api/products/parse-excel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csvText: text, filename: file.name })
        });
      } else {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);

        res = await fetch("http://localhost:4848/api/products/parse-excel", {
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
      const res = await fetch("http://localhost:4848/api/products/batch", {
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
    const url = isNew ? "http://localhost:4848/api/employees" : `http://localhost:4848/api/employees/${editingEmployee.id}`;
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
    showConfirm({
      title: "Remove Employee",
      message: "Are you sure you want to remove this employee?",
      type: "danger",
      confirmText: "Remove",
      onConfirm: async () => {
        try {
          const res = await fetch(`http://localhost:4848/api/employees/${id}`, {
            method: "DELETE"
          });
          if (res.ok) {
            showToast("Employee removed successfully.", "success");
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

  // ----------------------------------------------------
  // ANALYTICS & EXPORTS
  // ----------------------------------------------------

  const fetchReports = async () => {
    setLoadingAnalytics(true);
    try {
      let url = `http://localhost:4848/api/reports/${reportType}`;
      if (reportType === 'yearly') {
        url += `?year=${reportYear}`;
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
      const periodMap: Record<string, string> = { daily: 'day', weekly: 'week', yearly: 'year' };
      const period = periodMap[reportType] || 'day';
      let url = `http://localhost:4848/api/bills?period=${period}`;
      if (period === 'year') {
        url += `&year=${reportYear}`;
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
      const res = await fetch(`http://localhost:4848/api/bills/${bill.id}/items`);
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
      billNumber: bill.bill_number,
      date: bill.date,
      time: bill.time,
      cashierName: bill.cashier_name,
      items: items.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
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

  const handleDeleteBill = async (id: number) => {
    showConfirm({
      title: "Delete Bill",
      message: "Are you sure you want to permanently delete this bill from history? This will re-evaluate all sales statistics.",
      type: "danger",
      confirmText: "Delete",
      onConfirm: async () => {
        try {
          const res = await fetch(`http://localhost:4848/api/bills/${id}`, {
            method: "DELETE"
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Failed to delete bill.");
          }

          showToast("Bill deleted successfully.", "success");
          setSelectedBill(null);
          setSelectedBillItems([]);

          // Re-fetch reports and history to re-evaluate statistics instantly!
          fetchReports();
          fetchHistory();

          // Auto-focus barcode input to restore active workflow
          setTimeout(() => barcodeInputRef.current?.focus(), 100);
        } catch (err: any) {
          showToast(err.message, "error");
        } finally {
          closeConfirm();
        }
      }
    });
  };

  useEffect(() => {
    if (showAnalyticsModal) {
      if (activeTab === 'analytics') {
        fetchReports();
      } else {
        fetchHistory();
      }
    }
  }, [showAnalyticsModal, activeTab, reportType, reportDate, reportYear]);

  const downloadClientSideCsvReport = async (
    type: 'daily' | 'weekly' | 'yearly',
    date: string,
    year: number
  ) => {
    try {
      let url = `http://localhost:4848/api/reports/${type}`;
      if (type === 'yearly') {
        url += `?year=${year}`;
      } else {
        url += `?date=${date}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      let csvContent = "\ufeff"; // UTF-8 BOM
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
    if (!isElectron) {
      downloadClientSideCsvReport(reportType, reportDate, reportYear);
      showToast("CSV Sales Report downloaded successfully.", "success");
      return;
    }

    let url = `http://localhost:4848/api/reports/${reportType}?export=excel`;
    if (reportType === 'yearly') {
      url += `&year=${reportYear}`;
    } else {
      url += `&date=${reportDate}`;
    }

    // Trigger standard browser download pipeline
    window.open(url, "_blank");
    showToast("Excel spreadsheet downloaded successfully.", "success");
  };

  // ----------------------------------------------------
  // VISUAL RENDER NODES
  // ----------------------------------------------------

  // Grid products after category and instant catalogue search filtering
  const visibleGridProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const q = catalogueSearch.trim().toLowerCase();
      const matchSearch = !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.includes(q));
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, catalogueSearch]);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-4 font-sans select-none">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-sky-700 via-sky-600 to-cyan-500 p-6 text-white">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 backdrop-blur rounded-xl overflow-hidden w-12 h-12 flex-shrink-0 flex items-center justify-center">
                <img src="./icon.png" alt="MADRAS ORTHO CLINIC" className="w-12 h-12 object-cover" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">MADRAS ORTHO CLINIC SOFTWARE</h2>
                <p className="text-xs font-bold text-white/80">Mission for Cure — Select Account</p>
              </div>
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
                  onClick={() => setLoginForm(prev => ({ ...prev, username: 'admin' }))}
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
                  onClick={() => setLoginForm(prev => ({ ...prev, username: 'employee' }))}
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
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder={`Enter password for ${loginForm.username}...`}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  autoFocus
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-700 hover:to-cyan-600 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-sky-500/20 active:scale-98 disabled:opacity-50"
            >
              {isLoggingIn ? "Authenticating..." : `Login as ${loginForm.username.toUpperCase()}`}
            </button>

            {isFirstTimeEver && (
              <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-[11px] text-slate-400 space-y-1">
                <p className="font-bold text-slate-300">Default Passwords (First-Time Only):</p>
                <p>• Admin: <code className="text-amber-400 bg-slate-900 px-1.5 py-0.5 rounded">admin123</code></p>
                <p>• Employee: <code className="text-blue-400 bg-slate-900 px-1.5 py-0.5 rounded">employee123</code></p>
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 font-sans text-slate-100 select-none overflow-hidden theme-pharmacy-blue">

      {/* ----------------- TOP NAVBAR PANEL ----------------- */}
      <header className="flex items-center justify-between px-4 lg:px-6 py-2.5 lg:py-3 bg-slate-900 border-b border-slate-800 shadow-md">
        <div className="flex items-center space-x-2 lg:space-x-3">
          <div className="flex-shrink-0">
            <img
              src="./icon.png"
              alt="MADRAS ORTHO CLINIC"
              className="w-9 h-9 lg:w-11 lg:h-11 rounded-xl object-cover shadow-md shadow-sky-900/30"
              style={{ imageRendering: 'crisp-edges' }}
            />
          </div>
          <div>
            <h1 className="text-sm lg:text-lg font-bold tracking-tight text-white">{bakeryDetails.name}</h1>
            <p className="text-[10px] lg:text-xs text-slate-400 font-medium font-mono">Mission for Cure | Pharmacy POS Terminal</p>
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

          <button
            onClick={() => setShowAnalyticsModal(true)}
            className="flex items-center px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-xs font-semibold rounded-lg border border-slate-700 text-slate-200"
          >
            <BarChart2 className="w-3.5 h-3.5 mr-2 text-emerald-400" />
            <span>Analytics Reports</span>
          </button>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
            title="Settings & Hardware Alignment"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* User Profile Badge & Logout */}
          <div className="flex items-center space-x-2 pl-3 border-l border-slate-800">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-slate-200">{currentUser.name}</span>
              <span className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded ${currentUser.role === 'admin' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                {currentUser.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Logout / Switch User"
              className="flex items-center px-2 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-md text-xs font-semibold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              <span>Logout</span>
            </button>
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

          {/* Quick Categories horizontal list */}
          <div className="flex p-2.5 gap-1.5 overflow-x-auto bg-slate-900/80 border-b border-slate-800 scrollbar-none flex-shrink-0">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex-shrink-0 ${selectedCategory === 'All'
                ? 'bg-sky-500 text-slate-950 font-black shadow-md shadow-sky-500/20 scale-105'
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

          {/* Grid Products with spacious cards */}
          <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {visibleGridProducts.map(p => (
              <div
                key={p.id}
                className={`flex flex-col justify-between p-3.5 rounded-2xl border text-left transition-all shadow-sm ${
                  p.status === 'Out of Stock'
                    ? 'bg-slate-950/40 border-slate-900 text-slate-600 opacity-60'
                    : 'bg-slate-800/40 border-slate-800/90 hover:border-sky-500/50 hover:bg-slate-800/70'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-400 border border-sky-500/20 truncate max-w-[140px]">
                      {p.category}
                    </span>
                    <span className="text-[9px] uppercase font-bold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 flex-shrink-0">
                      {p.quantity_type}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-snug">
                    {p.name}
                  </h4>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800/70">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold font-mono text-emerald-400 leading-none">
                      ₹{p.price.toFixed(2)}
                    </span>
                    <span className="text-[9px] text-amber-400/90 font-medium mt-0.5">
                      {p.tax_percent}% GST
                    </span>
                  </div>

                  <button
                    onClick={() => addItemToBill(p, 1)}
                    disabled={p.status === 'Out of Stock'}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1 active:scale-95 transition-all ${
                      p.status === 'Out of Stock'
                        ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                        : 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md shadow-sky-500/20 font-black'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5 mr-0.5 stroke-[3]" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            ))}
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
                  {filteredSearchProducts.map((p, idx) => (
                    <div
                      key={p.id}
                      onMouseDown={(e) => {
                        e.preventDefault(); // prevent blur before click fires
                        addItemToBill(p, 1);
                        setSearchQuery('');
                        setIsSearchFocused(false);
                        setSearchSelectedIndex(0);
                        setTimeout(() => barcodeInputRef.current?.focus(), 20);
                      }}
                      onMouseEnter={() => setSearchSelectedIndex(idx)}
                      className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors ${searchSelectedIndex === idx
                        ? 'bg-bakery-500/20 border-l-2 border-bakery-500'
                        : 'hover:bg-slate-800 border-l-2 border-transparent'
                        }`}
                    >
                      <div className="flex flex-col min-w-0">
                        <span className={`text-xs font-semibold truncate ${searchSelectedIndex === idx ? 'text-bakery-300' : 'text-slate-200'}`}>
                          {p.name}
                        </span>
                        <span className="text-[10px] text-slate-500 mt-0.5">{p.category}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono uppercase">{p.quantity_type}</span>
                        <span className={`text-xs font-bold font-mono ${searchSelectedIndex === idx ? 'text-emerald-300' : 'text-emerald-400'}`}>
                          ₹{p.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
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
                <label className="text-[10px] font-bold text-slate-400 uppercase">Discount Percent (%)</label>
                <input
                  id="discount-input"
                  type="number"
                  placeholder="0"
                  value={activeSession?.discountPercent || ''}
                  onChange={(e) => {
                    const percent = Math.min(100, Math.max(0, Number(e.target.value)));
                    setSessions(prev => prev.map(s => {
                      if (s.id !== activeSessionId) return s;
                      return { ...s, discountPercent: percent, discountAmount: 0 };
                    }));
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
                sub += item.rate * item.quantity;
                // tax calculation disabled (tax_percent set to 0)
              });
              const disc = sess.discountAmount > 0 ? sess.discountAmount : sub * (sess.discountPercent / 100);
              const total = Math.max(0, sub + tx - disc);

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
              {filteredSearchProducts.map((p, idx) => (
                <div
                  key={p.id}
                  onClick={() => {
                    addItemToBill(p, 1);
                    setShowSearchModal(false);
                    setSearchQuery('');
                  }}
                  className={`p-3 rounded-lg flex items-center justify-between cursor-pointer border ${searchSelectedIndex === idx
                    ? 'bg-slate-800 border-bakery-500'
                    : 'bg-slate-950/20 border-transparent hover:bg-slate-800'
                    }`}
                >
                  <div>
                    <span className="text-xs font-bold text-white block">{p.name}</span>
                    <span className="text-[10px] text-slate-500 uppercase">{p.category}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400 block font-mono">₹{p.price.toFixed(2)}</span>
                    <span className="text-[9px] px-1 bg-slate-800 rounded text-slate-400 uppercase font-semibold">{p.quantity_type}</span>
                  </div>
                </div>
              ))}
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">

            <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase block">Billing Checkout</span>
                <span className="text-sm font-bold text-white">Select Receipt Payment Method</span>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-5">

              {/* Grand Total banner */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/60 text-center flex flex-col">
                <span className="text-xs font-bold text-slate-400 uppercase">Grand Total Invoice (incl. GST)</span>
                <span className="text-4xl font-extrabold font-mono text-emerald-400 mt-1">₹{billSummary.grandTotal.toFixed(2)}</span>
                <div className="flex justify-center items-center gap-3 text-xs font-mono text-slate-400 mt-2">
                  <span>Base: ₹{billSummary.subtotal.toFixed(2)}</span>
                  {billSummary.discount > 0 && <span className="text-rose-400">Disc: -₹{billSummary.discount.toFixed(2)}</span>}
                  {billSummary.tax > 0 && (
                    <span className="text-amber-400 font-semibold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/50">
                      GST (+₹{billSummary.tax.toFixed(2)})
                    </span>
                  )}
                </div>
              </div>

              {/* Cash Calculator */}
              <div className="flex gap-4">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Cash Amount Received</label>
                  <input
                    ref={paymentCashInputRef}
                    type="number"
                    placeholder="0.00"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-base font-bold font-mono rounded text-slate-200 focus:border-bakery-500"
                  />
                </div>

                <div className="flex flex-col justify-end text-right flex-1 font-mono">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Change Due to Customer</span>
                  <span className="text-2xl font-bold text-amber-400">₹{changeDue.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Select Payment Channel [C / G / K]</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => completeBilling('Cash')}
                    className="flex flex-col items-center justify-center p-4 bg-slate-800 hover:bg-slate-700/80 rounded-xl border border-slate-800/80 active:scale-95 transition-all text-slate-200"
                  >
                    <DollarSign className="w-5 h-5 text-emerald-400 mb-1" />
                    <span className="text-xs font-bold font-mono">[C] Cash</span>
                  </button>

                  <button
                    onClick={() => completeBilling('Google Pay')}
                    className="flex flex-col items-center justify-center p-4 bg-slate-800 hover:bg-slate-700/80 rounded-xl border border-slate-800/80 active:scale-95 transition-all text-slate-200"
                  >
                    <Smartphone className="w-5 h-5 text-terminal-highlight mb-1" />
                    <span className="text-xs font-bold font-mono">[G] G-Pay</span>
                  </button>

                  <button
                    onClick={() => completeBilling('Bank Card')}
                    className="flex flex-col items-center justify-center p-4 bg-slate-800 hover:bg-slate-700/80 rounded-xl border border-slate-800/80 active:scale-95 transition-all text-slate-200"
                  >
                    <CreditCard className="w-5 h-5 text-bakery-400 mb-1" />
                    <span className="text-xs font-bold font-mono">[K] Card</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-950 text-[10px] text-slate-500 font-mono flex justify-between border-t border-slate-800">
              <span>Press <strong className="text-slate-300">C</strong> Cash &nbsp;·&nbsp; <strong className="text-slate-300">G</strong> G-Pay &nbsp;·&nbsp; <strong className="text-slate-300">K</strong> Card</span>
              <span>ESC: Cancel</span>
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
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                currentUser?.role === 'admin'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {currentUser?.role || 'Staff'}
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

              <button
                onClick={() => {
                  setShowMobileNav(false);
                  showConfirm({
                    title: "Sign Out",
                    message: "Are you sure you want to sign out of the POS system?",
                    type: "warning",
                    confirmText: "Sign Out",
                    onConfirm: () => {
                      localStorage.removeItem("madrasortho_pos_user");
                      setCurrentUser(null);
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
                <button
                  type="button"
                  onClick={() => setProductModalTab('manual')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    productModalTab === 'manual'
                      ? 'bg-sky-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Manual Entry</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProductModalTab('excel')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    productModalTab === 'excel'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Upload Excel</span>
                  <span className={`text-[9px] font-black uppercase px-1 py-0.2 rounded ${
                    productModalTab === 'excel' ? 'bg-slate-950 text-emerald-300' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>Smart</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProductModalTab('list')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    productModalTab === 'list'
                      ? 'bg-indigo-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Browse ({products.length})</span>
                </button>
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
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Category *</label>
                        <input
                          type="text"
                          required
                          disabled={currentUser?.role !== 'admin'}
                          placeholder="e.g. NSAIDs, Muscle Relaxants, Osteoporosis"
                          value={editingProduct?.category || ''}
                          onChange={(e) => setEditingProduct(prev => ({ ...prev, category: e.target.value }))}
                          className="px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 disabled:opacity-50"
                        />
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Selling Price (₹ MRP) *</label>
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
                            className="w-full pl-8 pr-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-sky-500 disabled:opacity-50"
                          />
                        </div>
                      </div>

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
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Stock Status</label>
                        <select
                          disabled={currentUser?.role !== 'admin'}
                          value={editingProduct?.status || 'Available'}
                          onChange={(e: any) => setEditingProduct(prev => ({ ...prev, status: e.target.value }))}
                          className="px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500 disabled:opacity-50"
                        >
                          <option value="Available">Available</option>
                          <option value="Out of Stock">Out of Stock</option>
                        </select>
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
                    className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      excelParsing
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
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto border border-slate-800 rounded-2xl bg-slate-950/40">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 z-10">
                        <tr className="text-[10px] uppercase font-bold text-slate-400">
                          <th className="py-2.5 px-3">Medicine Name</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3">Unit</th>
                          <th className="py-2.5 px-3 text-right">Price (₹)</th>
                          <th className="py-2.5 px-3 text-right">GST</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                          <th className="py-2.5 px-3 text-right w-24">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {products
                          .filter(p => !crudSearch || p.name.toLowerCase().includes(crudSearch.toLowerCase()) || p.category.toLowerCase().includes(crudSearch.toLowerCase()))
                          .map(p => (
                            <tr key={p.id} className="hover:bg-slate-900/60 transition-colors">
                              <td className="py-2 px-3 font-semibold text-white">
                                <div>{p.name}</div>
                                {p.barcode && <div className="text-[9px] text-slate-500 font-mono">{p.barcode}</div>}
                              </td>
                              <td className="py-2 px-3 text-slate-400">{p.category}</td>
                              <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{p.quantity_type || 'strip'}</td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">₹{p.price.toFixed(2)}</td>
                              <td className="py-2 px-3 text-right font-mono text-slate-400">{p.tax_percent}%</td>
                              <td className="py-2 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                  p.status === 'Available' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                }`}>
                                  {p.status === 'Available' ? 'In Stock' : 'Out'}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right">
                                <div className="flex items-center justify-end space-x-1">
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
                                  <button
                                    onClick={() => deleteProduct(p.id)}
                                    className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                                    title="Delete medicine"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
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
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    conflict.userChoice === 'add'
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
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                        conflict.userChoice === 'skip'
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
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                        conflict.userChoice === 'add'
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl shadow-2xl h-[550px] flex flex-col overflow-hidden">

            <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
              <span className="text-sm font-bold text-white flex items-center">
                <BarChart2 className="w-4 h-4 mr-2 text-emerald-400" />
                Financial Sales Analytics & Audits
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
                className={`py-2 px-4 text-xs font-bold border-b-2 transition-all ${activeTab === 'analytics'
                  ? 'border-bakery-500 text-bakery-400 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
              >
                Sales Analytics Dashboard
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition-all ${activeTab === 'history'
                  ? 'border-bakery-500 text-bakery-400 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
              >
                Previous Bills History
              </button>
            </div>

            {/* Filter controls */}
            <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setReportType('daily')}
                  className={`px-3 py-1 text-xs font-bold rounded ${reportType === 'daily' ? 'bg-bakery-500 text-slate-950' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setReportType('weekly')}
                  className={`px-3 py-1 text-xs font-bold rounded ${reportType === 'weekly' ? 'bg-bakery-500 text-slate-950' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                >
                  Weekly (Mon-Sun)
                </button>
                <button
                  onClick={() => setReportType('yearly')}
                  className={`px-3 py-1 text-xs font-bold rounded ${reportType === 'yearly' ? 'bg-bakery-500 text-slate-950' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
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
                    className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100"
                  >
                    {[2025, 2026, 2027, 2028].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                  />
                )}

                <button
                  onClick={handleExcelExport}
                  className="px-4 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs transition-colors flex items-center"
                >
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  Export styled .xlsx
                </button>
              </div>
            </div>

            {/* Dashboard Contents */}
            <div className={`flex-1 p-5 ${activeTab === 'analytics' ? 'overflow-y-auto' : 'overflow-hidden'}`}>
              {activeTab === 'analytics' ? (
                loadingAnalytics ? (
                  <div className="flex flex-col justify-center items-center h-full text-slate-500 gap-3">
                    <RefreshCw className="w-8 h-8 animate-spin" />
                    <span className="text-xs font-semibold uppercase">Compiling report statistics...</span>
                  </div>
                ) : analyticsData ? (
                  <div className="grid grid-cols-3 gap-5">

                    {/* KPI card columns */}
                    <div className="col-span-1 bg-slate-950/20 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none mb-1">Total Revenue</span>
                        <span className="text-3xl font-extrabold text-emerald-400 font-mono">₹{analyticsData.totalSales.toFixed(2)}</span>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col gap-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total Invoices:</span>
                          <span className="font-bold text-white">{analyticsData.billCount !== undefined ? analyticsData.billCount : analyticsData.dailyBreakdown?.reduce((acc: number, d: any) => acc + d.bills, 0) || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Period Scope:</span>
                          <span className="font-bold text-bakery-400">{reportType.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment breakdowns column */}
                    <div className="col-span-1 bg-slate-950/20 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none mb-3">Payment Distribution</span>

                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between items-center py-1">
                            <span className="flex items-center text-slate-300">
                              <DollarSign className="w-3.5 h-3.5 text-emerald-400 mr-2" />
                              Cash:
                            </span>
                            <span className="font-bold font-mono">₹{analyticsData.paymentBreakdown?.Cash.toFixed(2)}</span>
                          </div>

                          <div className="flex justify-between items-center py-1">
                            <span className="flex items-center text-slate-300">
                              <Smartphone className="w-3.5 h-3.5 text-terminal-highlight mr-2" />
                              Google Pay:
                            </span>
                            <span className="font-bold font-mono">₹{analyticsData.paymentBreakdown?.GooglePay.toFixed(2)}</span>
                          </div>

                          <div className="flex justify-between items-center py-1">
                            <span className="flex items-center text-slate-300">
                              <CreditCard className="w-3.5 h-3.5 text-bakery-400 mr-2" />
                              Bank Card:
                            </span>
                            <span className="font-bold font-mono">₹{analyticsData.paymentBreakdown?.BankCard.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Best Selling products columns */}
                    <div className="col-span-1 bg-slate-950/20 border border-slate-800/80 p-4 rounded-xl flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none mb-3">Top Products Sold</span>
                      <div className="flex-1 overflow-y-auto space-y-2">
                        {analyticsData.topProducts?.slice(0, 5).map((p: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-xs pb-1.5 border-b border-slate-800/50">
                            <div>
                              <span className="font-bold text-white block">{p.name}</span>
                              <span className="text-[10px] text-slate-500">{p.quantity} sold</span>
                            </div>
                            <span className="font-bold font-mono text-emerald-400">₹{p.total.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Monthly or Daily breaking details table */}
                    {analyticsData.dailyBreakdown && (
                      <div className="col-span-3 bg-slate-950/20 border border-slate-800/80 p-4 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Daily Revenue Summary (Mon-Sun)</span>
                        <div className="grid grid-cols-7 gap-2 text-center text-xs">
                          {analyticsData.dailyBreakdown.map((day: any) => (
                            <div key={day.date} className="p-2 bg-slate-950/50 border border-slate-800 rounded">
                              <div className="font-bold text-slate-300">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                              <div className="text-[10px] text-slate-500 mb-1">{day.date.split('-').slice(1).join('/')}</div>
                              <div className="font-bold text-emerald-400 font-mono">₹{day.amount.toFixed(0)}</div>
                              <div className="text-[9px] text-slate-500">{day.bills} bills</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analyticsData.monthlyBreakdown && (
                      <div className="col-span-3 bg-slate-950/20 border border-slate-800/80 p-4 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Monthly Sales Growth Breakdown</span>
                        <div className="grid grid-cols-6 gap-2 text-center text-xs">
                          {analyticsData.monthlyBreakdown.map((m: any) => (
                            <div key={m.monthName} className="p-2 bg-slate-950/50 border border-slate-800 rounded flex flex-col justify-between">
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
                  <div className="text-center py-10 text-slate-500 font-mono">Failed to load reports. Try hitting Refresh.</div>
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
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Bills List ({historyBills.length})</span>
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
                                <th className="py-2">Date & Time</th>
                                <th className="py-2">Payment</th>
                                <th className="py-2 text-right pr-2">Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {historyBills.map((bill) => {
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

                            <div className="flex space-x-1.5">
                              <button
                                onClick={() => handleReprintReceipt(selectedBill, selectedBillItems)}
                                className="px-3 py-1 bg-bakery-500 hover:bg-bakery-400 text-slate-950 font-black rounded text-[10px] uppercase tracking-wider transition-colors active:scale-95 flex-shrink-0"
                              >
                                Reprint
                              </button>
                              <button
                                onClick={() => handleDeleteBill(selectedBill.id)}
                                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-[10px] uppercase tracking-wider transition-colors active:scale-95 flex-shrink-0"
                              >
                                Delete
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
                onClick={() => setShowSettingsModal(false)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4 overflow-y-auto flex-1">

              {/* Pharmacy/Clinic Details */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clinic / Pharmacy Branding</span>

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
                  <label className="text-[9px] font-bold text-slate-500 uppercase">GSTIN (Indian GST Number)</label>
                  <input
                    type="text"
                    value={(bakeryDetails as any).gstin || ''}
                    placeholder="e.g. 33AAAAA0000A1Z5"
                    onChange={(e) => setBakeryDetails(prev => ({ ...prev, gstin: e.target.value }))}
                    className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Drug License Number (D.L. No.)</label>
                  <input
                    type="text"
                    value={(bakeryDetails as any).dlNo || ''}
                    placeholder="e.g. TN/CHE/2026/001"
                    onChange={(e) => setBakeryDetails(prev => ({ ...prev, dlNo: e.target.value }))}
                    className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white font-mono"
                  />
                </div>
              </div>

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
                    className={`py-1.5 px-2 text-[10px] font-bold rounded flex items-center justify-center gap-1 transition-all ${
                      printerInterface === 'usb'
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
                    className={`py-1.5 px-2 text-[10px] font-bold rounded flex items-center justify-center gap-1 transition-all ${
                      printerInterface === 'wifi'
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
                    className={`py-1.5 px-2 text-[10px] font-bold rounded flex items-center justify-center gap-1 transition-all ${
                      printerInterface === 'bluetooth'
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
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        bluetoothDeviceName
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

              {/* Bill Number Sequence Reset */}
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
                              const res = await fetch('http://localhost:4848/api/system/wipe-all-data', { method: 'POST' });
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
            </div>

            <div className="p-3 bg-slate-950 text-[10px] text-slate-500 font-mono text-center border-t border-slate-800">
              Settings save automatically. Press ESC to close.
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
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center space-x-2 text-amber-400 text-xs font-semibold mb-3">
                  <Lock className="w-4 h-4 flex-shrink-0 text-amber-400" />
                  <span>View Only Mode: Login as Admin to add, edit, or delete employee details.</span>
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
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${emp.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500 border border-slate-700/50'
                                }`}>
                                {emp.status}
                              </span>
                            </td>
                            <td className="py-2.5 text-right flex justify-end space-x-1.5">
                              <button
                                onClick={() => setEditingEmployee(emp)}
                                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-sky-400 rounded transition-colors"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteEmployee(emp.id)}
                                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-rose-500 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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

      {/* ----------------- CHANGE PASSWORD MODAL ----------------- */}
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

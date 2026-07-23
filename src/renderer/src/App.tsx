import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Plus, Search, Trash2, CreditCard, DollarSign, Smartphone, ShoppingBag,
  Settings, BarChart2, FileText, X, Check, AlertCircle, Edit, RefreshCw, AlertTriangle,
  Users
} from 'lucide-react';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// Safe Electron detection and fallback
const isElectron = typeof window !== 'undefined' && (window as any).electron !== undefined;
const electronAPI = isElectron ? (window as any).electron : {
  printReceipt: async (receiptData: any, printerName: string) => {
    console.log("[MOCK PRINT]", receiptData, printerName);
    try {
      const {
        bakeryName = "Billing Software",
        address = "123 Gourmet Lane, Foodie City",
        phone = "+91 98765 43210",
        billNumber,
        date,
        time,
        cashierName = "Cashier",
        items = [],
        subtotal = 0,
        discount = 0,
        grandTotal = 0,
        paymentMethod = "Cash",
        width = "80mm" // "58mm" or "80mm"
      } = receiptData;

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
            <div>${address}</div>
            <div>Phone: ${phone}</div>
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
                <td>Subtotal:</td>
                <td class="right">₹${Number(subtotal).toFixed(2)}</td>
              </tr>
              ${discount > 0 ? `
                <tr>
                  <td>Discount:</td>
                  <td class="right">-₹${Number(discount).toFixed(2)}</td>
                </tr>
              ` : ''}
              <tr class="bold">
                <td>Grand Total:</td>
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
            <div class="bold">Thank You. Visit Again!</div>
            <div style="font-size: 9px; color: #666; margin-top: 4px;">Powered by REGULA</div>
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
  quantity_type: 'pcs' | 'kg' | 'g' | 'pack';
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
  const [bakeryDetails, setBakeryDetails] = useState({
    name: "Billing Software",
    address: "123 Gourmet Lane, Foodie City",
    phone: "+91 98765 43210"
  });

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
      const storedDate = localStorage.getItem('bakers_pos_bill_date');
      const saved = localStorage.getItem("bakers_pos_sessions");

      // Auto-reset: if sessions were saved on a previous day, start fresh
      if (storedDate && storedDate !== todayStr) {
        localStorage.removeItem('bakers_pos_sessions');
        localStorage.removeItem('bakers_pos_active_session');
        localStorage.removeItem('bakers_pos_last_bill_num');
        localStorage.removeItem('bakers_pos_bill_date');
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
            // If this number is already saved in db (< dbNextNum), find a free one
            while (num < dbNextNum || finalSessions.some(fs => fs.billNumber === num)) {
              num++;
            }
            finalSessions.push({ ...s, billNumber: num });
          });

          // Update the local counter to the highest assigned
          const maxAssigned = Math.max(...finalSessions.map(s => s.billNumber));
          localStorage.setItem('bakers_pos_last_bill_num', String(maxAssigned));
          localStorage.setItem('bakers_pos_bill_date', todayStr);

          setSessions(finalSessions);
          const activeId = localStorage.getItem("bakers_pos_active_session");
          setActiveSessionId(
            activeId && finalSessions.some(fs => fs.id === activeId)
              ? activeId
              : finalSessions[0].id
          );
        } catch (err) {
          console.warn("Could not check conflicts with server on startup. Restoring as saved.", err);
          setSessions(restored);
          const activeId = localStorage.getItem("bakers_pos_active_session");
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
      localStorage.setItem("bakers_pos_sessions", JSON.stringify(sessions));
      localStorage.setItem("bakers_pos_active_session", activeSessionId);
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

  // Subtotals calculations for active bill
  const billSummary = useMemo(() => {
    if (!activeSession) {
      return {
        subtotal: 0,
        discount: 0,
        tax: 0,
        grandTotal: 0
      };
    }

    const subtotal = activeSession.items.reduce((sum, item) => sum + item.total, 0);

    let discount = 0;
    if (activeSession.discountPercent > 0) {
      discount = (subtotal * activeSession.discountPercent) / 100;
    } else if (activeSession.discountAmount > 0) {
      discount = Math.min(subtotal, activeSession.discountAmount);
    }

    const tax = 0; // tax is completely disabled/removed
    const grandTotal = Math.max(0, subtotal - discount);

    return {
      subtotal,
      discount,
      tax,
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

    // Check if the stored counter is from a different day — if so, reset it
    const storedDate = localStorage.getItem('bakers_pos_bill_date');
    if (storedDate !== todayStr) {
      localStorage.removeItem('bakers_pos_last_bill_num');
      localStorage.setItem('bakers_pos_bill_date', todayStr);
    }

    const storedLast = parseInt(localStorage.getItem('bakers_pos_last_bill_num') || '0', 10);

    // Start from the highest of: db next, local counter+1. We do not use activeMax+1
    // to allow reusing gaps from closed tabs, and collision checks are handled below.
    let candidate = Math.max(dbNextNum, storedLast + 1);

    // Ensure it doesn't collide with any open session
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
          cashierName: "Cashier A"
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
      localStorage.setItem('bakers_pos_last_bill_num', String(savedBill.bill_number));
      localStorage.setItem('bakers_pos_bill_date', savedBill.date);

      // Build thermal printer payload
      const printData = {
        bakeryName: bakeryDetails.name,
        address: bakeryDetails.address,
        phone: bakeryDetails.phone,
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

      // Trigger Electron silent printer
      electronAPI.printReceipt(printData, selectedPrinter).catch((err: any) => {
        console.error("Printer pipeline error:", err);
        showToast("Silent print failed, but invoice saved.", "info");
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
    showConfirm({
      title: "Delete Product",
      message: "Are you sure you want to delete this bakery product?",
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

  const saveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
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
    const printData = {
      bakeryName: bakeryDetails.name,
      address: bakeryDetails.address,
      phone: bakeryDetails.phone,
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
        tax_percent: 0
      })),
      subtotal: bill.subtotal,
      discount: bill.discount,
      tax: 0,
      grandTotal: bill.grand_total,
      paymentMethod: bill.payment_method,
      width: paperWidth
    };

    electronAPI.printReceipt(printData, selectedPrinter)
      .then(() => showToast(`Bill #${bill.bill_number} receipt reprinted!`, "success"))
      .catch((err: any) => {
        console.error("Printer pipeline error:", err);
        showToast("Silent print failed.", "error");
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

  // Grid products after category filtering
  const visibleGridProducts = useMemo(() => {
    if (selectedCategory === 'All') return products;
    return products.filter(p => p.category === selectedCategory);
  }, [products, selectedCategory]);

  return (
    <div className="flex flex-col h-screen bg-slate-950 font-sans text-slate-100 select-none overflow-hidden theme-orange-white">

      {/* ----------------- TOP NAVBAR PANEL ----------------- */}
      <header className="flex items-center justify-between px-4 lg:px-6 py-2.5 lg:py-3 bg-slate-900 border-b border-slate-800 shadow-md">
        <div className="flex items-center space-x-2 lg:space-x-3">
          <div className="flex-shrink-0">
            <img
              src="./icon.png"
              alt="REGULA Logo"
              className="w-9 h-9 lg:w-11 lg:h-11 rounded-xl object-cover shadow-md shadow-yellow-900/30"
              style={{ imageRendering: 'crisp-edges' }}
            />
          </div>
          <div>
            <h1 className="text-sm lg:text-lg font-bold tracking-tight text-white">{bakeryDetails.name}</h1>
            <p className="text-[10px] lg:text-xs text-slate-400 font-medium font-mono">Counter POS terminal</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 lg:space-x-4">
          <button
            onClick={() => setShowProductCrudModal(true)}
            className="flex items-center px-2 py-1.5 lg:px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-xs font-semibold rounded-md border border-slate-700 text-slate-200"
          >
            <Edit className="w-3.5 h-3.5 lg:mr-2 text-bakery-400" />
            <span className="hidden lg:inline">Manage Products [CTRL+N]</span>
          </button>

          <button
            onClick={() => {
              setShowEmployeeCrudModal(true);
              setEditingEmployee({});
              loadEmployees();
            }}
            className="flex items-center px-2 py-1.5 lg:px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-xs font-semibold rounded-md border border-slate-700 text-slate-200"
          >
            <Users className="w-3.5 h-3.5 lg:mr-2 text-sky-400" />
            <span className="hidden lg:inline">Manage Employees</span>
          </button>

          <button
            onClick={() => setShowAnalyticsModal(true)}
            className="flex items-center px-2 py-1.5 lg:px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-xs font-semibold rounded-md border border-slate-700 text-slate-200"
          >
            <BarChart2 className="w-3.5 h-3.5 lg:mr-2 text-emerald-400" />
            <span className="hidden lg:inline">Analytics Reports</span>
          </button>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ----------------- CORE THREE PANEL LAYOUT ----------------- */}
      <main className="flex flex-col lg:flex-row flex-1 overflow-hidden p-2 lg:p-3 gap-2 lg:gap-3">

        {/* === LEFT PANEL: Categories & Visual Products Grid === */}
        <section className={`flex flex-col w-full lg:w-5/12 bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden ${mobileTab === 'menu' ? 'flex flex-1' : 'hidden lg:flex'}`}>
          <div className="p-3 bg-slate-900/50 border-b border-slate-800 flex items-center space-x-2">
            <span className="text-xs font-bold text-bakery-400 uppercase tracking-widest">Menu</span>
          </div>

          {/* Quick Categories list */}
          <div className="flex p-2 gap-1.5 overflow-x-auto bg-slate-900 border-b border-slate-800 scrollbar-none flex-shrink-0">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-all flex-shrink-0 ${selectedCategory === 'All'
                ? 'bg-bakery-500 text-slate-950 font-black scale-105 shadow-md shadow-bakery-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
            >
              All Items
            </button>
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-all flex-shrink-0 ${selectedCategory === c
                  ? 'bg-bakery-500 text-slate-950 font-black scale-105 shadow-md shadow-bakery-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Grid Products */}
          <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 lg:grid-cols-3 gap-2">
            {visibleGridProducts.map(p => (
              <button
                key={p.id}
                onClick={() => addItemToBill(p, 1)}
                disabled={p.status === 'Out of Stock'}
                className={`flex flex-col p-3 rounded-lg border text-left active:scale-95 transition-all shadow-sm ${p.status === 'Out of Stock'
                  ? 'bg-slate-950/40 border-slate-900 text-slate-600 cursor-not-allowed'
                  : 'bg-slate-800/50 border-slate-700 hover:border-bakery-500 hover:bg-slate-800'
                  }`}
              >
                <span className="text-[10px] uppercase font-bold text-bakery-400/80 mb-1">{p.category}</span>
                <span className="text-xs font-bold text-white line-clamp-2 flex-1">{p.name}</span>
                <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-700/50 w-full">
                  <span className="text-xs font-mono font-bold text-emerald-400">₹{p.price.toFixed(2)}</span>
                  <span className="text-[9px] px-1 bg-slate-700 rounded text-slate-400 uppercase font-semibold">{p.quantity_type}</span>
                </div>
              </button>
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


          {/* Ticket Items Grid */}
          <div className="flex-1 overflow-y-auto p-3">
            {activeSession && activeSession.items.length > 0 ? (
              <table className="w-full text-left border-collapse">
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
                          className="w-12 px-1 py-0.5 bg-slate-950 border border-slate-800 text-right font-mono rounded text-slate-200 focus:border-bakery-500"
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
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
                <ShoppingBag className="w-12 h-12 stroke-[1.2]" />
                <span className="text-sm font-semibold">Active Billing Ticket is empty</span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-700">Type or scan items to begin</span>
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

              {/* Quick totals list */}
              <div className="flex flex-col justify-end text-right font-mono text-xs text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{billSummary.subtotal.toFixed(2)}</span>
                </div>
                {billSummary.discount > 0 && (
                  <div className="flex justify-between text-rose-400">
                    <span>Discount:</span>
                    <span>-₹{billSummary.discount.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Total Balance Actions panel */}
            <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 mt-1">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block leading-none">Net Amount Due</span>
                <span className="text-2xl font-bold font-mono text-emerald-400">₹{billSummary.grandTotal.toFixed(2)}</span>
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
            <span className="text-xs font-bold text-bakery-400 uppercase tracking-widest">Active Queue</span>
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
                    <span className={`text-xs font-bold ${isActive ? 'text-bakery-400' : 'text-slate-400'}`}>
                      Bill #{sess.billNumber}
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
                      <span className="text-[9px] uppercase font-extrabold text-bakery-400 tracking-wider">ACTIVE</span>
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

      {/* ----------------- MOBILE BOTTOM TAB NAVIGATION BAR ----------------- */}
      <div className="lg:hidden flex items-center justify-around bg-slate-900 border-t border-slate-800 py-2 px-4 shadow-lg flex-shrink-0 z-40">
        <button
          onClick={() => setMobileTab('menu')}
          className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded-lg transition-all ${
            mobileTab === 'menu'
              ? 'text-bakery-400 font-bold'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[10px] tracking-wide uppercase">Menu</span>
        </button>

        <button
          onClick={() => setMobileTab('ticket')}
          className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded-lg transition-all relative ${
            mobileTab === 'ticket'
              ? 'text-bakery-400 font-bold'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <CreditCard className="w-5 h-5" />
          <span className="text-[10px] tracking-wide uppercase">Ticket</span>
          {activeSession && activeSession.items.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-bakery-500 text-slate-950 text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-slate-950">
              {activeSession.items.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setMobileTab('queue')}
          className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded-lg transition-all relative ${
            mobileTab === 'queue'
              ? 'text-bakery-400 font-bold'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] tracking-wide uppercase">Queue</span>
          {sessions.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-slate-700 text-slate-200 text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border border-slate-950">
              {sessions.length}
            </span>
          )}
        </button>
      </div>

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
                <span className="text-xs font-bold text-slate-400 uppercase">Grand Total Invoice</span>
                <span className="text-4xl font-extrabold font-mono text-emerald-400 mt-1">₹{billSummary.grandTotal.toFixed(2)}</span>
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

      {/* ----------------- ADMIN PRODUCTS EDITOR CRUD MODAL ----------------- */}
      {showProductCrudModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl shadow-2xl h-[600px] flex overflow-hidden">

            {/* Left Column: Form Editor */}
            <div className="w-5/12 bg-slate-900 border-r border-slate-800 p-5 flex flex-col overflow-y-auto">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                {editingProduct?.id ? 'Edit Product' : 'Add New Product'}
              </h3>

              <form onSubmit={saveProduct} className="flex flex-col gap-4 flex-1">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct?.name || ''}
                    onChange={(e) => setEditingProduct(prev => ({ ...prev, name: e.target.value }))}
                    className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Category *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cakes, Puffs"
                      value={editingProduct?.category || ''}
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, category: e.target.value }))}
                      className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Quantity Type *</label>
                    <select
                      value={editingProduct?.quantity_type || 'pcs'}
                      onChange={(e: any) => setEditingProduct(prev => ({ ...prev, quantity_type: e.target.value }))}
                      className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100"
                    >
                      <option value="pcs">pcs</option>
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="pack">pack</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={editingProduct?.price || ''}
                    onChange={(e) => setEditingProduct(prev => ({ ...prev, price: Number(e.target.value) }))}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Barcode</label>
                    <input
                      type="text"
                      placeholder="Optional"
                      value={editingProduct?.barcode || ''}
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, barcode: e.target.value }))}
                      className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">SKU Code</label>
                    <input
                      type="text"
                      placeholder="Optional"
                      value={editingProduct?.sku || ''}
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, sku: e.target.value }))}
                      className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Availability Status</label>
                  <select
                    value={editingProduct?.status || 'Available'}
                    onChange={(e: any) => setEditingProduct(prev => ({ ...prev, status: e.target.value }))}
                    className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100"
                  >
                    <option value="Available">Available</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>

                <div className="flex space-x-2 mt-4">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-bakery-500 hover:bg-bakery-400 text-slate-950 font-black rounded text-xs transition-colors"
                  >
                    Save Product
                  </button>
                  {editingProduct && (
                    <button
                      type="button"
                      onClick={() => setEditingProduct(null)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Right Column: Existing Products List Table */}
            <div className="flex-1 p-5 flex flex-col overflow-hidden bg-slate-950/20">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Existing Products List</h3>
                <button
                  onClick={() => setShowProductCrudModal(false)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Fast filter */}
              <input
                type="text"
                placeholder="Search products by typing... [CTRL+F]"
                value={crudSearch}
                onChange={(e) => setCrudSearch(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 text-xs rounded mb-3"
              />

              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-800">
                      <th className="py-2">Item</th>
                      <th className="py-2">Category</th>
                      <th className="py-2 text-right">Price</th>
                      <th className="py-2 text-center">Status</th>
                      <th className="py-2 text-right w-16">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products
                      .filter(p => !crudSearch || p.name.toLowerCase().includes(crudSearch.toLowerCase()) || p.category.toLowerCase().includes(crudSearch.toLowerCase()))
                      .map(p => (
                        <tr key={p.id} className="border-b border-slate-800/60 hover:bg-slate-900/40">
                          <td className="py-2 font-semibold text-white">{p.name}</td>
                          <td className="py-2 text-slate-400">{p.category}</td>
                          <td className="py-2 text-right font-mono text-emerald-400">₹{p.price.toFixed(2)}</td>
                          <td className="py-2 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${p.status === 'Available' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-500'
                              }`}>
                              {p.status === 'Available' ? 'AV' : 'OOS'}
                            </span>
                          </td>
                          <td className="py-2 text-right flex justify-end space-x-1">
                            <button
                              onClick={() => setEditingProduct(p)}
                              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-bakery-400 rounded"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteProduct(p.id)}
                              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-rose-500 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
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
                              <span>Subtotal:</span>
                              <span className="text-white">₹{selectedBill.subtotal.toFixed(2)}</span>
                            </div>
                            {selectedBill.discount > 0 && (
                              <div className="flex justify-between text-rose-400">
                                <span>Discount:</span>
                                <span>-₹{selectedBill.discount.toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between border-t border-slate-800/80 pt-2 font-bold text-sm">
                              <span className="text-white uppercase font-sans">Total Paid:</span>
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden">

            <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
              <span className="text-sm font-bold text-white flex items-center">
                <Settings className="w-4 h-4 mr-2 text-bakery-400" />
                POS Settings & Printer Alignment
              </span>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">

              {/* Bakery Details */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Store Custom Branding</span>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Bakery Shop Name</label>
                  <input
                    type="text"
                    value={bakeryDetails.name}
                    onChange={(e) => setBakeryDetails(prev => ({ ...prev, name: e.target.value }))}
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
              </div>

              {/* Printer Hardware */}
              <div className="flex flex-col gap-3 border-t border-slate-800/80 pt-4 mt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Printer & Layout Settings</span>

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

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Thermal Paper Roll Width</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      onClick={() => setPaperWidth('58mm')}
                      className={`py-1.5 text-xs font-bold rounded border ${paperWidth === '58mm' ? 'bg-bakery-500 text-slate-950 border-bakery-500' : 'bg-slate-950 border-slate-800 hover:bg-slate-900'
                        }`}
                    >
                      58mm Narrow
                    </button>
                    <button
                      onClick={() => setPaperWidth('80mm')}
                      className={`py-1.5 text-xs font-bold rounded border ${paperWidth === '80mm' ? 'bg-bakery-500 text-slate-950 border-bakery-500' : 'bg-slate-950 border-slate-800 hover:bg-slate-900'
                        }`}
                    >
                      80mm Standard
                    </button>
                  </div>
                </div>
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

              <form onSubmit={saveEmployee} className="flex flex-col gap-4 flex-1">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editingEmployee.name || ''}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                    className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none"
                    placeholder="Enter full name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Role / Position *</label>
                    <select
                      value={editingEmployee.role || ''}
                      required
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, role: e.target.value })}
                      className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
                    >
                      <option value="" disabled>Select Role</option>
                      <option value="Manager">Manager</option>
                      <option value="Cashier">Cashier</option>
                      <option value="Baker">Baker / Chef</option>
                      <option value="Store Assistant">Store Assistant</option>
                      <option value="Delivery Partner">Delivery Partner</option>
                      <option value="Cleaner">Cleaner</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Status</label>
                    <select
                      value={editingEmployee.status || 'Active'}
                      onChange={(e: any) => setEditingEmployee({ ...editingEmployee, status: e.target.value })}
                      className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
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
                      value={editingEmployee.phone || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, phone: e.target.value })}
                      className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none"
                      placeholder="e.g. +91 98765 43210"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
                    <input
                      type="email"
                      value={editingEmployee.email || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, email: e.target.value })}
                      className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none"
                      placeholder="e.g. john@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Monthly Salary (₹)</label>
                    <input
                      type="number"
                      value={editingEmployee.salary !== undefined && editingEmployee.salary !== null ? editingEmployee.salary : ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, salary: e.target.value ? Number(e.target.value) : null })}
                      className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none"
                      placeholder="e.g. 25000"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Joined Date</label>
                    <input
                      type="date"
                      value={editingEmployee.joined_date || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, joined_date: e.target.value })}
                      className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex space-x-2 mt-6">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded text-xs transition-colors shadow-lg shadow-sky-600/10 active:scale-95"
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
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Store Employees List</h3>
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

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus, Minus, Trash2, ShoppingBag, Stethoscope, Users,
  BarChart2, Wifi, CheckCircle2, AlertTriangle,
  AlertCircle, X, ChevronRight, Download, RefreshCw, LogOut,
  Package, Monitor
} from 'lucide-react';
import { apiUrl } from '../utils/apiConfig';

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
}

interface MobileTabletAppProps {
  onSwitchToDesktop: () => void;
  currentUser?: { username: string; role: string; name?: string } | null;
  onLogout?: () => void;
}

const CLINIC_DOCTORS = [
  { name: "Dr. Arjun Sharma, MS (Ortho)", specialty: "Senior Consultant Orthopaedic Surgeon" },
  { name: "Dr. Meera Chandran, D.Ortho, DNB", specialty: "Associate Orthopaedic Surgeon" },
  { name: "Dr. S. K. Rajasekaran, MCh (Ortho)", specialty: "Spine & Joint Replacement Specialist" },
  { name: "Dr. K. Vigneshwaran, MS (Ortho)", specialty: "Sports Medicine & Arthroscopy" }
];

export const MobileTabletApp: React.FC<MobileTabletAppProps> = ({
  onSwitchToDesktop,
  currentUser = { username: 'admin', role: 'admin', name: 'Dr. Arjun Sharma' },
  onLogout
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'billing' | 'medicines' | 'patients' | 'reports' | 'info'>('billing');

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

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card'>('Cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [isSubmittingBill, setIsSubmittingBill] = useState<boolean>(false);
  const [billSuccessModal, setBillSuccessModal] = useState<any | null>(null);

  // Inward Stock Modal (Admin)
  const [isInwardModalOpen, setIsInwardModalOpen] = useState<boolean>(false);
  const [inwardForm, setInwardForm] = useState({
    productId: '',
    batchNumber: '',
    expiryDate: '',
    quantity: '',
    purchasePrice: '',
    mrp: '',
    sellingPrice: '',
    supplier: 'Direct Clinic Supply',
    invoiceNumber: ''
  });

  // Patient Creation Modal
  const [isAddPatientOpen, setIsAddPatientOpen] = useState<boolean>(false);
  const [newPatientForm, setNewPatientForm] = useState({
    name: '',
    age: '',
    gender: 'Male',
    phone: '',
    address: ''
  });

  // Network Info
  const [networkInfo, setNetworkInfo] = useState<{ localhostUrl: string; primaryLanUrl: string; interfaces: any[] } | null>(null);

  // Today's Report Snapshot
  const [todayStats, setTodayStats] = useState({
    billsCount: 0,
    grossSales: 0,
    cashAmount: 0,
    upiAmount: 0,
    itemsSold: 0
  });

  // Fetch initial data
  const loadData = async () => {
    setIsLoadingProducts(true);
    try {
      const [prodRes, catRes, patRes, netRes] = await Promise.all([
        fetch(apiUrl('/api/products')),
        fetch(apiUrl('/api/categories')),
        fetch(apiUrl('/api/patients')),
        fetch(apiUrl('/api/network-info')).catch(() => null)
      ]);

      if (prodRes && prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(Array.isArray(prodData) ? prodData : []);
      }
      if (catRes && catRes.ok) {
        const catData = await catRes.json();
        const catNames = Array.isArray(catData) ? catData.map((c: any) => typeof c === 'string' ? c : c.name) : [];
        setCategories(['All', ...catNames]);
      }
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

  const loadTodayStats = async () => {
    try {
      const res = await fetch(apiUrl('/api/bills?period=today'));
      if (res && res.ok) {
        const bills = await res.json();
        if (Array.isArray(bills)) {
          let count = bills.length;
          let sales = 0;
          let cash = 0;
          let upi = 0;
          let items = 0;
          for (const b of bills) {
            const tot = Number(b.net_amount || b.grand_total || b.total_amount || 0);
            sales += tot;
            if ((b.payment_method || '').toLowerCase() === 'cash') cash += tot;
            else upi += tot;
            items += Number(b.item_count || 1);
          }
          setTodayStats({
            billsCount: count,
            grossSales: Math.round(sales * 100) / 100,
            cashAmount: Math.round(cash * 100) / 100,
            upiAmount: Math.round(upi * 100) / 100,
            itemsSold: items
          });
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadData();
    loadTodayStats();
  }, []);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        (p.generic_name && p.generic_name.toLowerCase().includes(q)) ||
        (p.batch_number && p.batch_number.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart calculations
  const totalItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const totalMrp = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.mrp * item.quantity), 0);
  }, [cart]);

  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.rate * item.quantity), 0);
  }, [cart]);

  const totalSavings = useMemo(() => {
    return Math.max(0, totalMrp - totalAmount);
  }, [totalMrp, totalAmount]);

  // Add product to cart with strict guardrails
  const addToCart = (product: Product) => {
    // Statutory Guardrail 1: Prohibit Expired Medicines
    if (product.is_expired || product.status === 'Expired') {
      alert(`STATUTORY PROHIBITION: ${product.name} is EXPIRED. Dispensing expired drugs is strictly forbidden under Rule 65.`);
      return;
    }
    // Statutory Guardrail 2: Prohibit Out-of-Stock Medicines
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
            batch_number: product.batch_number || 'BATCH-MOC',
            expiry_date: product.expiry_date || '2028-12-31',
            mrp,
            rate,
            purchase_price: cost,
            quantity: 1,
            available_stock: stockAvailable,
            tax_percent: Number(product.tax_percent ?? 12)
          }
        ];
      }
    });
  };

  const updateCartQty = (productId: number, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty > item.available_stock) {
              alert(`STOCK LIMIT: Only ${item.available_stock} unit(s) available.`);
              return item;
            }
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  // Change computation for Cash
  const changeToReturn = useMemo(() => {
    const tendered = parseFloat(cashTendered);
    if (isNaN(tendered) || tendered < totalAmount) return 0;
    return Math.round((tendered - totalAmount) * 100) / 100;
  }, [cashTendered, totalAmount]);

  const isCashInsufficient = useMemo(() => {
    if (paymentMethod !== 'Cash') return false;
    if (!cashTendered) return true;
    const tendered = parseFloat(cashTendered);
    return isNaN(tendered) || tendered < totalAmount;
  }, [paymentMethod, cashTendered, totalAmount]);

  // Complete Payment & Bill Generation
  const handleCompleteBill = async () => {
    if (cart.length === 0) {
      alert("Cart is empty. Add medicines to proceed.");
      return;
    }

    if (paymentMethod === 'Cash' && isCashInsufficient) {
      alert(`Please enter cash tendered. Amount must be at least ₹${totalAmount.toFixed(2)}.`);
      return;
    }

    setIsSubmittingBill(true);
    try {
      let nextBillNum: number | string = 1;
      try {
        const numRes = await fetch(apiUrl('/api/bills/next-number'));
        if (numRes.ok) {
          const numData = await numRes.json();
          if (numData.nextBillNumber) nextBillNum = numData.nextBillNumber;
        }
      } catch (e) {}

      const billPayload = {
        bill_number: nextBillNum,
        patient_name: isWalkIn ? (selectedPatient?.name || "Walk-in Patient") : (selectedPatient?.name || "Walk-in Patient"),
        patient_phone: selectedPatient?.phone || "",
        patient_id: selectedPatient?.id || null,
        doctor_name: selectedDoctor,
        prescribing_doctor: selectedDoctor,
        payment_method: paymentMethod,
        items: cart.map((it) => ({
          product_id: it.id,
          product_name: it.name,
          name: it.name,
          batch_number: it.batch_number,
          expiry_date: it.expiry_date,
          mrp: it.mrp,
          rate: it.rate,
          purchase_price: it.purchase_price,
          quantity: it.quantity,
          tax_percent: it.tax_percent,
          total: Math.round(it.rate * it.quantity * 100) / 100
        })),
        subtotal: totalAmount,
        discount: totalSavings,
        tax: 0,
        total_mrp: totalMrp,
        grand_total: totalAmount,
        cash_tendered: paymentMethod === 'Cash' ? parseFloat(cashTendered) || totalAmount : totalAmount,
        change_returned: paymentMethod === 'Cash' ? changeToReturn : 0
      };

      const res = await fetch(apiUrl('/api/bills'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billPayload)
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to process bill. Please check stock and expiry.");
        return;
      }

      // Success
      setBillSuccessModal({
        billNumber: data.bill_number || `MOC-${Date.now().toString().slice(-6)}`,
        items: [...cart],
        totalAmount,
        totalMrp,
        totalSavings,
        paymentMethod,
        doctor: selectedDoctor,
        patientName: billPayload.patient_name
      });

      // Clear cart
      setCart([]);
      setCashTendered('');
      setIsCartOpen(false);

      // Refresh product stocks & stats
      loadData();
      loadTodayStats();
    } catch (err: any) {
      alert("Error submitting bill: " + err.message);
    } finally {
      setIsSubmittingBill(false);
    }
  };

  // Submit Inward Stock (Admin)
  const handleInwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inwardForm.productId || !inwardForm.batchNumber || !inwardForm.expiryDate || !inwardForm.quantity) {
      alert("Please fill in all required fields (Medicine, Batch, Expiry, Qty, Prices).");
      return;
    }

    try {
      const res = await fetch(apiUrl('/api/inventory/inward'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: Number(inwardForm.productId),
          batch_number: inwardForm.batchNumber,
          expiry_date: inwardForm.expiryDate,
          quantity: Number(inwardForm.quantity),
          purchase_price: Number(inwardForm.purchasePrice || 0),
          mrp: Number(inwardForm.mrp || inwardForm.sellingPrice || 0),
          selling_price: Number(inwardForm.sellingPrice || 0),
          supplier: inwardForm.supplier,
          invoice_number: inwardForm.invoiceNumber,
          received_by: currentUser?.name || currentUser?.username || 'Staff'
        })
      });

      if (res.ok) {
        alert("Inward stock successfully added! Inventory and prices synced.");
        setIsInwardModalOpen(false);
        setInwardForm({
          productId: '',
          batchNumber: '',
          expiryDate: '',
          quantity: '',
          purchasePrice: '',
          mrp: '',
          sellingPrice: '',
          supplier: 'Direct Clinic Supply',
          invoiceNumber: ''
        });
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to record inward stock.");
      }
    } catch (e: any) {
      alert("Network error: " + e.message);
    }
  };

  // Submit New Patient
  const handleAddPatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientForm.name) {
      alert("Patient name is required.");
      return;
    }

    try {
      const res = await fetch(apiUrl('/api/patients'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPatientForm.name,
          age: newPatientForm.age ? Number(newPatientForm.age) : null,
          gender: newPatientForm.gender,
          phone: newPatientForm.phone,
          address: newPatientForm.address
        })
      });

      if (res.ok) {
        const created = await res.json();
        setSelectedPatient(created);
        setIsWalkIn(false);
        setIsAddPatientOpen(false);
        setNewPatientForm({ name: '', age: '', gender: 'Male', phone: '', address: '' });
        loadData();
      } else {
        alert("Failed to create patient record.");
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 text-slate-900 select-none overflow-hidden font-sans">
      {/* ─── ORDERED TOP APP BAR ─────────────────────────────────────── */}
      <header className="shrink-0 bg-slate-900 text-white px-3 py-2.5 shadow-md flex items-center justify-between z-30">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-xs">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex flex-col justify-center">
            <div className="text-sm font-black tracking-tight leading-tight truncate text-blue-400">
              MADRAS ORTHO CLINIC
            </div>
            <div className="text-[10px] text-slate-400 leading-none truncate flex items-center gap-1.5 mt-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Wi-Fi POS</span>
              <span className="text-slate-500">•</span>
              <span className="font-semibold text-slate-300 capitalize">{currentUser?.role || 'Staff'}</span>
            </div>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Switch to Desktop View Button */}
          <button
            onClick={onSwitchToDesktop}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-blue-300 rounded-lg text-xs font-semibold border border-slate-700 transition-all"
            title="Switch to full desktop POS view"
          >
            <Monitor className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">Desktop</span>
          </button>

          {/* Cart Trigger Badge */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-lg text-xs font-bold shadow-xs transition-all"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>₹{totalAmount.toFixed(0)}</span>
            {totalItemsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-xs">
                {totalItemsCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ─── MAIN CONTENT VIEWPORT (SCROLLABLE) ───────────────────────── */}
      <main className="flex-1 overflow-y-auto overscroll-contain pb-20 p-2.5 bg-slate-100">
        {/* ── TAB 1: BILLING / DISPENSE ──────────────────────────────── */}
        {activeTab === 'billing' && (
          <div className="space-y-2.5 max-w-lg mx-auto">
            {/* Search Input Box (No text bleed) */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search medicine, generic, brand..."
                className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
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

            {/* Category Filter Pills (Horizontal Scroll) */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
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

            {/* Medicine Listing (Vertical Cards, Strict Box Constraints) */}
            {isLoadingProducts ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                <span className="text-xs">Loading medicines...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 text-slate-500">
                <Package className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                <div className="text-sm font-bold text-slate-700">No medicines found</div>
                <div className="text-xs text-slate-400 mt-1">Try another search keyword or category.</div>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProducts.map((p) => {
                  const cartItem = cart.find((it) => it.id === p.id);
                  const isExpired = p.is_expired || p.status === 'Expired';
                  const isOutOfStock = p.is_out_of_stock || (p.available_stock ?? 0) <= 0;
                  const canDispense = !isExpired && !isOutOfStock;
                  const savings = Math.max(0, (p.mrp ?? p.price) - p.price);

                  return (
                    <div
                      key={p.id}
                      className={`bg-white rounded-xl p-3 border transition-all shadow-xs ${
                        isExpired
                          ? 'border-rose-200 bg-rose-50/30'
                          : isOutOfStock
                          ? 'border-amber-200 bg-amber-50/20'
                          : 'border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        {/* Left Title & Formula */}
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-bold text-slate-900 leading-snug break-words">
                            {p.name}
                          </h3>
                          {p.generic_name && (
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                              {p.generic_name}
                            </p>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0">
                          {isExpired ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                              <AlertCircle className="h-3 w-3" />
                              EXPIRED
                            </span>
                          ) : isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-700 border border-amber-200">
                              <AlertTriangle className="h-3 w-3" />
                              OUT OF STOCK
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Stock: {p.available_stock}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Batch & Expiry Info Row */}
                      <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
                        {p.batch_number && (
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">
                            {p.batch_number}
                          </span>
                        )}
                        {p.expiry_date && (
                          <span>
                            Exp: <strong className={isExpired ? 'text-rose-600 font-bold' : 'text-slate-700'}>{p.expiry_date}</strong>
                          </span>
                        )}
                        <span className="text-slate-400">•</span>
                        <span className="truncate">{p.category}</span>
                      </div>

                      {/* Pricing & Add Stepper Row */}
                      <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100">
                        {/* Price Details */}
                        <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
                          <span className="text-base font-black text-slate-900">
                            ₹{Number(p.price).toFixed(2)}
                          </span>
                          {p.mrp && p.mrp > p.price && (
                            <>
                              <span className="text-xs text-slate-400 line-through">
                                ₹{Number(p.mrp).toFixed(2)}
                              </span>
                              <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                Save ₹{savings.toFixed(0)}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Action Stepper or Add Button */}
                        <div className="shrink-0">
                          {!canDispense ? (
                            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg inline-block">
                              Prohibited
                            </span>
                          ) : cartItem ? (
                            <div className="flex items-center bg-blue-50 border border-blue-200 rounded-lg p-0.5 gap-1">
                              <button
                                onClick={() => updateCartQty(p.id, -1)}
                                className="h-7 w-7 rounded bg-white text-blue-600 flex items-center justify-center font-bold shadow-2xs active:bg-blue-100"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-6 text-center text-xs font-black text-blue-900">
                                {cartItem.quantity}
                              </span>
                              <button
                                onClick={() => updateCartQty(p.id, 1)}
                                className="h-7 w-7 rounded bg-blue-600 text-white flex items-center justify-center font-bold shadow-2xs active:bg-blue-700"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(p)}
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: MEDICINES & INVENTORY ─────────────────────────── */}
        {activeTab === 'medicines' && (
          <div className="space-y-3 max-w-lg mx-auto">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900">Medicines Catalogue</h2>
                <p className="text-xs text-slate-500">Live batch stock, MRP & selling rates</p>
              </div>
              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => setIsInwardModalOpen(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1 active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Inward Stock
                </button>
              )}
            </div>

            {/* Quick stock list */}
            <div className="space-y-2">
              {products.map((p) => {
                const isExpired = p.is_expired || p.status === 'Expired';
                const isOutOfStock = (p.available_stock ?? 0) <= 0;
                return (
                  <div key={p.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-slate-900 truncate">{p.name}</div>
                        <div className="text-[11px] text-slate-500">{p.category}</div>
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
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Cost</div>
                        <div className="font-medium text-slate-600">₹{Number(p.purchase_price || 0).toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Batch: <strong className="font-mono">{p.batch_number || 'N/A'}</strong></span>
                      <span>Exp: <strong className={isExpired ? 'text-rose-600' : ''}>{p.expiry_date || 'N/A'}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB 3: PATIENTS DIRECTORY ─────────────────────────────── */}
        {activeTab === 'patients' && (
          <div className="space-y-3 max-w-lg mx-auto">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900">Patients</h2>
                <p className="text-xs text-slate-500">Search directory or register walk-in</p>
              </div>
              <button
                onClick={() => setIsAddPatientOpen(true)}
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
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
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
                  <div key={p.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-slate-900 truncate">{p.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {p.gender || 'Patient'} • Age: {p.age || 'N/A'}
                        {p.phone ? ` • ${p.phone}` : ''}
                      </div>
                      {p.mrn && (
                        <span className="inline-block text-[10px] font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded mt-1">
                          {p.mrn}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedPatient(p);
                        setIsWalkIn(false);
                        setActiveTab('billing');
                        setIsCartOpen(true);
                      }}
                      className="shrink-0 px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 text-blue-600 text-xs font-bold rounded-lg border border-slate-200"
                    >
                      Select
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ── TAB 4: REPORTS & SUMMARY ──────────────────────────────── */}
        {activeTab === 'reports' && (
          <div className="space-y-3 max-w-lg mx-auto">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Today's Performance</h2>
                  <p className="text-xs text-slate-500">Live collection snapshot</p>
                </div>
                <button
                  onClick={loadTodayStats}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100">
                  <div className="text-[10px] font-bold text-blue-600 uppercase">Gross Sales</div>
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
              </div>
            </div>

            {/* Monthly Report Action */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="text-sm font-bold text-slate-900">Detailed 6-Sheet Financial Report</div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Download comprehensive monthly audit covering P&L Summary, Inventory Ledger, Itemized Sales, Inward Receipts, GST Audit, and Margins.
              </p>
              <button
                onClick={() => {
                  window.open(apiUrl('/api/reports/monthly?export=excel'), '_blank');
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Download className="h-4 w-4" />
                Download Monthly Excel Report
              </button>
            </div>
          </div>
        )}

        {/* ── TAB 5: WI-FI & CLINIC INFO ─────────────────────────────── */}
        {activeTab === 'info' && (
          <div className="space-y-3 max-w-lg mx-auto">
            {/* Wi-Fi & Network Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-blue-600">
                <Wifi className="h-5 w-5" />
                <h2 className="text-sm font-bold text-slate-900">Clinic Local Network Host</h2>
              </div>
              <div className="text-xs text-slate-600 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div><strong>Custom Clinic URL:</strong> <code className="text-blue-700 font-bold font-mono">http://madrasorthoclinic.local:4848</code></div>
                <div><strong>Localhost Fallback:</strong> <code className="text-slate-700 font-mono">http://localhost:4848</code></div>
                {networkInfo?.primaryLanUrl && (
                  <div><strong>Same Wi-Fi Direct:</strong> <code className="text-emerald-700 font-bold font-mono">{networkInfo.primaryLanUrl}</code></div>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Any device on the clinic network can access the software via <strong>http://madrasorthoclinic.local:4848</strong>.
              </p>
            </div>

            {/* Prescribing Orthopaedic Specialists */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="text-sm font-bold text-slate-900">Clinic Specialists Directory</div>
              <div className="space-y-2 pt-1">
                {CLINIC_DOCTORS.map((doc, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-slate-50 text-xs border border-slate-100">
                    <div className="font-bold text-slate-800">{doc.name}</div>
                    <div className="text-[11px] text-slate-500">{doc.specialty}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Controls */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <button
                onClick={onSwitchToDesktop}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2"
              >
                <Monitor className="h-4 w-4" />
                Switch to Full Desktop POS Layout
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="w-full py-2 bg-slate-100 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ─── STICKY BOTTOM CART TRIGGER BAR (WHEN CART HAS ITEMS) ────── */}
      {cart.length > 0 && !isCartOpen && activeTab === 'billing' && (
        <div className="fixed bottom-14 inset-x-0 p-2.5 z-20 pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto">
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white p-3 rounded-2xl shadow-xl flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 rounded-xl bg-blue-500/50 flex items-center justify-center font-black text-xs">
                  {totalItemsCount}
                </div>
                <div className="text-left min-w-0">
                  <div className="text-xs font-bold truncate">Review Bill & Checkout</div>
                  {totalSavings > 0 && (
                    <div className="text-[10px] text-emerald-300 font-semibold">
                      Saved ₹{totalSavings.toFixed(0)} off MRP
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-base font-black">₹{totalAmount.toFixed(2)}</span>
                <ChevronRight className="h-5 w-5" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ─── FIXED BOTTOM THUMB NAVIGATION (5 ORDERED TABS) ─────────── */}
      <nav className="fixed bottom-0 inset-x-0 h-14 bg-white border-t border-slate-200 grid grid-cols-5 z-30 shadow-lg">
        <button
          onClick={() => setActiveTab('billing')}
          className={`flex flex-col items-center justify-center gap-0.5 ${
            activeTab === 'billing' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <ShoppingBag className="h-5 w-5" />
          <span className="text-[10px]">Dispense</span>
        </button>

        <button
          onClick={() => setActiveTab('medicines')}
          className={`flex flex-col items-center justify-center gap-0.5 ${
            activeTab === 'medicines' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Package className="h-5 w-5" />
          <span className="text-[10px]">Stock</span>
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

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex flex-col items-center justify-center gap-0.5 ${
            activeTab === 'reports' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <BarChart2 className="h-5 w-5" />
          <span className="text-[10px]">Reports</span>
        </button>

        <button
          onClick={() => setActiveTab('info')}
          className={`flex flex-col items-center justify-center gap-0.5 ${
            activeTab === 'info' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Wifi className="h-5 w-5" />
          <span className="text-[10px]">Wi-Fi</span>
        </button>
      </nav>

      {/* ─── SLIDE-UP CHECKOUT DRAWER / CART SHEET ───────────────────── */}
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
                  <h3 className="text-sm font-bold text-slate-900">Current Bill</h3>
                  <p className="text-[10px] text-slate-400">Madras Ortho Clinic Pharmacy</p>
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
                              <div className="text-[10px] text-slate-400">{p.phone} • {p.mrn}</div>
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
                  Items to Dispense ({cart.length})
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

              {/* Price Calculation Card */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Gross Total (MRP)</span>
                  <span className="font-medium">₹{totalMrp.toFixed(2)}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Clinic Concession (Saved)</span>
                    <span>-₹{totalSavings.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>Net Payable Amount</span>
                  <span className="text-blue-700">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Smart Payment Section */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Payment Method
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
                      step="any"
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
                        onClick={() => setCashTendered(totalAmount.toString())}
                        className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-[11px] font-bold text-slate-700"
                      >
                        Exact
                      </button>
                      {[100, 200, 500, 1000].map((val) => (
                        <button
                          key={val}
                          onClick={() => {
                            const cur = parseFloat(cashTendered) || 0;
                            setCashTendered((cur + val).toString());
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

            {/* Receipt Summary Card */}
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
                onClick={() => {
                  window.print();
                }}
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

      {/* ─── INWARD STOCK MODAL (ADMIN ONLY) ─────────────────────────── */}
      {isInwardModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-white rounded-3xl p-4 shadow-2xl max-h-[90vh] overflow-y-auto space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">Manual Inward Stock Entry</h3>
              <button onClick={() => setIsInwardModalOpen(false)} className="text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleInwardSubmit} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Select Medicine *</label>
                <select
                  value={inwardForm.productId}
                  onChange={(e) => {
                    const pid = e.target.value;
                    const prod = products.find((p) => p.id === Number(pid));
                    setInwardForm({
                      ...inwardForm,
                      productId: pid,
                      mrp: prod?.mrp ? prod.mrp.toString() : prod?.price ? prod.price.toString() : '',
                      sellingPrice: prod?.price ? prod.price.toString() : '',
                      purchasePrice: prod?.purchase_price ? prod.purchase_price.toString() : ''
                    });
                  }}
                  className="w-full p-2 bg-slate-50 border rounded-lg"
                  required
                >
                  <option value="">-- Choose Medicine --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Batch Number *</label>
                  <input
                    type="text"
                    value={inwardForm.batchNumber}
                    onChange={(e) => setInwardForm({ ...inwardForm, batchNumber: e.target.value })}
                    placeholder="e.g. MOC-9921"
                    className="w-full p-2 bg-slate-50 border rounded-lg font-mono uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    value={inwardForm.expiryDate}
                    onChange={(e) => setInwardForm({ ...inwardForm, expiryDate: e.target.value })}
                    className="w-full p-2 bg-slate-50 border rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Quantity Received *</label>
                <input
                  type="number"
                  min="1"
                  value={inwardForm.quantity}
                  onChange={(e) => setInwardForm({ ...inwardForm, quantity: e.target.value })}
                  placeholder="Units"
                  className="w-full p-2 bg-slate-50 border rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Purchase Rate</label>
                  <input
                    type="number"
                    step="any"
                    value={inwardForm.purchasePrice}
                    onChange={(e) => setInwardForm({ ...inwardForm, purchasePrice: e.target.value })}
                    placeholder="Cost"
                    className="w-full p-1.5 bg-slate-50 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    step="any"
                    value={inwardForm.mrp}
                    onChange={(e) => setInwardForm({ ...inwardForm, mrp: e.target.value })}
                    placeholder="MRP"
                    className="w-full p-1.5 bg-slate-50 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-blue-700 mb-1">Price Sold At</label>
                  <input
                    type="number"
                    step="any"
                    value={inwardForm.sellingPrice}
                    onChange={(e) => setInwardForm({ ...inwardForm, sellingPrice: e.target.value })}
                    placeholder="Rate"
                    className="w-full p-1.5 bg-blue-50 border border-blue-200 rounded-lg font-bold"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Inward Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── REGISTER PATIENT MODAL ──────────────────────────────────── */}
      {isAddPatientOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-white rounded-3xl p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">Register New Patient</h3>
              <button onClick={() => setIsAddPatientOpen(false)} className="text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddPatientSubmit} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={newPatientForm.name}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, name: e.target.value })}
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
                    value={newPatientForm.age}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, age: e.target.value })}
                    placeholder="Years"
                    className="w-full p-2 bg-slate-50 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Gender</label>
                  <select
                    value={newPatientForm.gender}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, gender: e.target.value })}
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
                  value={newPatientForm.phone}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, phone: e.target.value })}
                  placeholder="+91 98..."
                  className="w-full p-2 bg-slate-50 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Address</label>
                <input
                  type="text"
                  value={newPatientForm.address}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, address: e.target.value })}
                  placeholder="Area / City"
                  className="w-full p-2 bg-slate-50 border rounded-lg"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Patient & Select for Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

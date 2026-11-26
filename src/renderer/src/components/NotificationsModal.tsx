import React, { useState } from 'react';
import {
  X, Bell, AlertOctagon, AlertTriangle, Clock, Package, RefreshCw,
  Search, ShieldAlert, ArrowRight, CheckCircle2, Radio
} from 'lucide-react';

export interface NotificationItem {
  id: string;
  batch_id?: number;
  product_id?: number;
  product_name: string;
  batch_number?: string;
  expiry_date?: string;
  available_stock?: number;
  rack_location?: string;
  days_overdue?: number;
  days_left?: number;
  category?: string;
  mrp?: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  type: 'EXPIRED' | 'EXPIRING_SOON' | 'OUT_OF_STOCK' | 'LOW_STOCK';
  title: string;
  message: string;
}

export interface NotificationsData {
  summary: {
    totalAlerts: number;
    expiredCount: number;
    expiringSoonCount: number;
    outOfStockCount: number;
    lowStockCount: number;
    updatedAt: string;
  };
  expired: NotificationItem[];
  expiringSoon: NotificationItem[];
  outOfStock: NotificationItem[];
  lowStock: NotificationItem[];
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: NotificationsData;
  onRefresh: () => void;
  onNavigateToInward?: () => void;
  onSelectProductForBilling?: (productName: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  data,
  onRefresh,
  onNavigateToInward,
  onSelectProductForBilling
}) => {
  const [filter, setFilter] = useState<'all' | 'expired' | 'oos' | 'expiring' | 'low'>('all');
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const summary = data.summary || {
    totalAlerts: 0,
    expiredCount: 0,
    expiringSoonCount: 0,
    outOfStockCount: 0,
    lowStockCount: 0,
    updatedAt: new Date().toISOString()
  };

  // Priority sorting for "All alerts":
  // Tier 1: Expiring Soon & Low Stock (Highest importance, at top)
  // Tier 2: Expired Batches
  // Tier 3: Out-of-Stock (At the very bottom)
  const getAlertRank = (item: NotificationItem) => {
    if (item.type === 'EXPIRING_SOON' || item.type === 'LOW_STOCK') return 1;
    if (item.type === 'EXPIRED') return 2;
    if (item.type === 'OUT_OF_STOCK') return 3;
    return 4;
  };

  const allItems: NotificationItem[] = [
    ...(data.expiringSoon || []),
    ...(data.lowStock || []),
    ...(data.expired || []),
    ...(data.outOfStock || [])
  ].sort((a, b) => {
    const rankDiff = getAlertRank(a) - getAlertRank(b);
    if (rankDiff !== 0) return rankDiff;
    if (a.type === 'EXPIRING_SOON' && b.type === 'EXPIRING_SOON') {
      return (a.days_left ?? 999) - (b.days_left ?? 999);
    }
    if (a.type === 'LOW_STOCK' && b.type === 'LOW_STOCK') {
      return (a.available_stock ?? 0) - (b.available_stock ?? 0);
    }
    return a.product_name.localeCompare(b.product_name);
  });

  let displayedItems: NotificationItem[] = [];
  if (filter === 'expired') displayedItems = data.expired || [];
  else if (filter === 'oos') displayedItems = data.outOfStock || [];
  else if (filter === 'expiring') displayedItems = data.expiringSoon || [];
  else if (filter === 'low') displayedItems = data.lowStock || [];
  else displayedItems = allItems;

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    displayedItems = displayedItems.filter(item =>
      (item.product_name && item.product_name.toLowerCase().includes(q)) ||
      (item.batch_number && item.batch_number.toLowerCase().includes(q)) ||
      (item.rack_location && item.rack_location.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q))
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div
        className="bg-white border-2 border-orange-200 rounded-2xl w-full max-w-3xl shadow-2xl shadow-orange-950/15 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        style={{ maxHeight: '92vh' }}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-white via-orange-50/70 to-amber-50/60 border-b border-orange-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border flex items-center justify-center ${
              summary.expiredCount > 0
                ? 'bg-rose-50 border-rose-200 text-rose-600'
                : summary.outOfStockCount > 0
                  ? 'bg-amber-50 border-amber-200 text-amber-600'
                  : 'bg-orange-50 border-orange-200 text-[#C25222]'
            }`}>
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  Dispensary Alerts & Live Inventory Notifications
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Real-time synchronized medicine alerts across all connected PC, tablet, and mobile terminals.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              title="Refresh alerts from database"
              className="p-2 bg-orange-50 hover:bg-orange-100 text-[#C25222] border border-orange-200 rounded-xl transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 rounded-xl transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Pills Banner */}
        <div className="p-3 sm:px-5 bg-orange-50/40 border-b border-orange-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-[#C25222] to-orange-600 text-white shadow-md shadow-orange-500/20'
                  : 'bg-white text-slate-700 hover:bg-orange-50 border border-orange-200'
              }`}
            >
              All Alerts ({summary.totalAlerts})
            </button>

            <button
              type="button"
              onClick={() => setFilter('expired')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                filter === 'expired'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : summary.expiredCount > 0
                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Expired ({summary.expiredCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilter('oos')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                filter === 'oos'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : summary.outOfStockCount > 0
                    ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Out of Stock ({summary.outOfStockCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilter('expiring')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                filter === 'expiring'
                  ? 'bg-yellow-500 text-slate-950 shadow-md shadow-yellow-500/20'
                  : summary.expiringSoonCount > 0
                    ? 'bg-yellow-50 text-yellow-800 hover:bg-yellow-100 border border-yellow-300'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Expiring Soon ({summary.expiringSoonCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilter('low')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                filter === 'low'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : summary.lowStockCount > 0
                    ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Low Stock ({summary.lowStockCount})</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-orange-400" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-orange-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Alerts List Viewport */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 bg-[#FFFBF7]">
          {displayedItems.length === 0 ? (
            <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Dispensary Stock & Expiry Clear</h4>
              <p className="text-xs text-slate-600 max-w-sm mt-1">
                {search.trim()
                  ? `No active alerts matched "${search}".`
                  : 'All medicines in the active dispensary are within valid expiry ranges and available for patient prescription.'}
              </p>
            </div>
          ) : (
            displayedItems.map((item) => {
              const isExpired = item.type === 'EXPIRED';
              const isOos = item.type === 'OUT_OF_STOCK';
              const isSoon = item.type === 'EXPIRING_SOON';

              return (
                <div
                  key={item.id}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all shadow-2xs ${
                    isExpired
                      ? 'bg-rose-50/70 border-rose-200 hover:border-rose-300'
                      : isOos
                        ? 'bg-amber-50/70 border-amber-200 hover:border-amber-300'
                        : isSoon
                          ? 'bg-yellow-50/70 border-yellow-200 hover:border-yellow-300'
                          : 'bg-indigo-50/50 border-indigo-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${
                        isExpired
                          ? 'bg-rose-100 border-rose-200 text-rose-600'
                          : isOos
                            ? 'bg-amber-100 border-amber-200 text-amber-700'
                            : isSoon
                              ? 'bg-yellow-100 border-yellow-300 text-yellow-800'
                              : 'bg-indigo-100 border-indigo-200 text-indigo-700'
                      }`}>
                        {isExpired && <AlertOctagon className="w-4 h-4" />}
                        {isOos && <AlertTriangle className="w-4 h-4" />}
                        {isSoon && <Clock className="w-4 h-4" />}
                        {item.type === 'LOW_STOCK' && <Package className="w-4 h-4" />}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-slate-900">
                            {item.product_name}
                          </span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            isExpired
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : isOos
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : isSoon
                                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                                  : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                          }`}>
                            {item.type.replace('_', ' ')}
                          </span>

                          {item.batch_number && (
                            <span className="text-[10px] font-mono text-slate-600">
                              Batch: <strong className="text-slate-900">{item.batch_number}</strong>
                            </span>
                          )}

                          {item.rack_location && (
                            <span className="text-[10px] text-slate-600 bg-white px-1.5 py-0.5 rounded border border-orange-200">
                              {item.rack_location}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed">
                          {item.message}
                        </p>

                        {/* Regulatory / Pharmacy Guidance alert */}
                        {isExpired && (
                          <div className="flex items-center gap-1.5 text-[11px] text-rose-700 font-semibold mt-1">
                            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                            <span>Rule 65 Statutory Prohibition: Dispensing is locked. Isolate batch from active shelf.</span>
                          </div>
                        )}
                        {isSoon && (
                          <div className="flex items-center gap-1.5 text-[11px] text-amber-800 font-semibold mt-1">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>Wholesaler Return Advisory: Return batch to supplier for 100% refund or credit note within 60 days.</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center mt-2 sm:mt-0">
                      {isOos && onNavigateToInward && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onNavigateToInward();
                          }}
                          className="px-3 py-1.5 bg-gradient-to-r from-[#C25222] to-orange-500 hover:from-[#a8441b] hover:to-orange-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                        >
                          <span>Log Inward Refill</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {isSoon && onSelectProductForBilling && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSelectProductForBilling(item.product_name);
                          }}
                          className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs rounded-xl border border-amber-300 flex items-center gap-1.5 transition-all"
                        >
                          <span>Priority Dispense</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:px-5 bg-orange-50/60 border-t border-orange-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2 text-[11px]">
            <Radio className="w-3.5 h-3.5 text-emerald-600" />
            <span>Endpoint: <code className="text-[#C25222] font-mono font-semibold">http://madrasorthoclinic.local:4848/api/events</code></span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-orange-50 text-slate-800 border border-orange-200 rounded-xl font-bold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

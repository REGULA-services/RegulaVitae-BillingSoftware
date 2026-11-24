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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        style={{ maxHeight: '92vh' }}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border flex items-center justify-center ${
              summary.expiredCount > 0
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                : summary.outOfStockCount > 0
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : 'bg-sky-500/20 border-sky-500/40 text-sky-400'
            }`}>
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Dispensary Alerts & Live Inventory Notifications
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time synchronized medicine alerts across all connected PC, tablet, and mobile terminals.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              title="Refresh alerts from database"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Pills Banner */}
        <div className="p-3 sm:px-5 bg-slate-950/70 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                filter === 'all'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-850 hover:text-white border border-slate-800'
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
                    ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-850 border border-slate-800'
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
                    ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-850 border border-slate-800'
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
                  ? 'bg-yellow-600 text-white shadow-md shadow-yellow-600/20'
                  : summary.expiringSoonCount > 0
                    ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/30'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-850 border border-slate-800'
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
                    ? 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/30'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-850 border border-slate-800'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Low Stock ({summary.lowStockCount})</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Alerts List Viewport */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 bg-slate-950/40">
          {displayedItems.length === 0 ? (
            <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">Dispensary Stock & Expiry Clear</h4>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
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
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                    isExpired
                      ? 'bg-rose-950/20 border-rose-800/60 hover:border-rose-700'
                      : isOos
                        ? 'bg-amber-950/20 border-amber-800/60 hover:border-amber-700'
                        : isSoon
                          ? 'bg-yellow-950/20 border-yellow-800/50 hover:border-yellow-700'
                          : 'bg-indigo-950/20 border-indigo-800/40 hover:border-indigo-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${
                        isExpired
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                          : isOos
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                            : isSoon
                              ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                              : 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400'
                      }`}>
                        {isExpired && <AlertOctagon className="w-4 h-4" />}
                        {isOos && <AlertTriangle className="w-4 h-4" />}
                        {isSoon && <Clock className="w-4 h-4" />}
                        {item.type === 'LOW_STOCK' && <Package className="w-4 h-4" />}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-white">
                            {item.product_name}
                          </span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            isExpired
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : isOos
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : isSoon
                                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          }`}>
                            {item.type.replace('_', ' ')}
                          </span>

                          {item.batch_number && (
                            <span className="text-[10px] font-mono text-slate-400">
                              Batch: <strong className="text-slate-300">{item.batch_number}</strong>
                            </span>
                          )}

                          {item.rack_location && (
                            <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                              {item.rack_location}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          {item.message}
                        </p>

                        {/* Regulatory / Pharmacy Guidance alert */}
                        {isExpired && (
                          <div className="flex items-center gap-1.5 text-[11px] text-rose-400 font-semibold mt-1">
                            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                            <span>Rule 65 Statutory Prohibition: Dispensing is locked. Isolate batch from active shelf.</span>
                          </div>
                        )}
                        {isSoon && (
                          <div className="flex items-center gap-1.5 text-[11px] text-yellow-400 font-semibold mt-1">
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
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
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
                          className="px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 font-bold text-xs rounded-xl border border-yellow-500/30 flex items-center gap-1.5 transition-all"
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
        <div className="p-3 sm:px-5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2 text-[11px]">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>Endpoint: <code className="text-slate-300 font-mono">http://madrasorthoclinic.local:4848/api/events</code></span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

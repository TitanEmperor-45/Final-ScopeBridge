import React, { useState } from 'react';
import { WifiOff, CheckCircle2, RefreshCw, Database, HardDriveDownload } from 'lucide-react';
import {
  useOnlineStatus,
  useOfflineCacheStatus,
} from '../../lib/offlineServiceWorker';

interface OfflineStatusBannerProps {
  onForceSync?: () => void;
  propertiesCount?: number;
  bookingsCount?: number;
}

export const OfflineStatusBanner: React.FC<OfflineStatusBannerProps> = ({
  onForceSync,
  propertiesCount,
  bookingsCount,
}) => {
  const isOnline = useOnlineStatus();
  const cacheMeta = useOfflineCacheStatus();

  const effectiveProps =
    typeof propertiesCount === 'number' ? propertiesCount : cacheMeta.propertiesCount;
  const effectiveBookings =
    typeof bookingsCount === 'number' ? bookingsCount : cacheMeta.bookingsCount;

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-50 rounded-2xl bg-slate-900/95 border border-amber-500/50 p-3.5 text-white shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
          <WifiOff className="w-4 h-4 animate-pulse" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
              Offline Mode Active
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Service Worker Cache Hit
            </span>
          </div>
          <p className="text-xs text-slate-200 mt-1 leading-relaxed">
            You are currently offline. Property listings, room details, and your bookings are being served from the local Service Worker cache.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 font-semibold">
              <Database className="w-3 h-3 text-emerald-400" />
              {effectiveProps} Properties Cached
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 font-semibold">
              <CheckCircle2 className="w-3 h-3 text-indigo-400" />
              {effectiveBookings} Bookings Cached
            </span>
            {onForceSync && (
              <button
                type="button"
                onClick={onForceSync}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh Snapshot</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const OfflineCacheBadge: React.FC<{
  onSyncNow?: () => void;
  propertiesCount?: number;
  bookingsCount?: number;
}> = ({ onSyncNow, propertiesCount, bookingsCount }) => {
  const isOnline = useOnlineStatus();
  const cacheMeta = useOfflineCacheStatus();
  const [justSynced, setJustSynced] = useState(false);

  const effectiveProps =
    typeof propertiesCount === 'number' ? propertiesCount : cacheMeta.propertiesCount;
  const effectiveBookings =
    typeof bookingsCount === 'number' ? bookingsCount : cacheMeta.bookingsCount;

  const handleSync = () => {
    if (onSyncNow) {
      onSyncNow();
    }
    setJustSynced(true);
    setTimeout(() => setJustSynced(false), 2000);
  };

  if (!isOnline) {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-[11px] bg-amber-100 text-amber-900 font-extrabold px-3 py-1 rounded-full border border-amber-300 shadow-2xs"
        title="Offline Mode: Viewing cached properties and bookings from Service Worker"
      >
        <WifiOff className="w-3 h-3 text-amber-700 shrink-0" />
        <span>
          Offline Mode ({effectiveProps} Properties • {effectiveBookings} Bookings Cached)
        </span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSync}
      className="inline-flex items-center gap-1.5 text-[11px] bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 font-bold px-2.5 py-1 rounded-full border border-slate-200 hover:border-emerald-200 transition-colors cursor-pointer"
      title="Service Worker Offline Cache Active — Click to sync latest property listings & bookings for offline viewing"
    >
      <HardDriveDownload className={`w-3 h-3 text-emerald-600 shrink-0 ${justSynced ? 'animate-bounce' : ''}`} />
      <span>
        {justSynced
          ? `Offline Cache Updated (${effectiveProps} Props • ${effectiveBookings} Bookings)`
          : `Offline Ready (${effectiveProps} Props • ${effectiveBookings} Bookings)`}
      </span>
    </button>
  );
};

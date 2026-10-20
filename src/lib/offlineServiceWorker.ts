import { useEffect, useState } from 'react';

const OFFLINE_SNAPSHOT_STORAGE_KEY = 'scopebridg_offline_snapshot_v2';
const DATA_CACHE_NAME = 'scopebridg-data-v2';

export interface OfflineCacheMetadata {
  swRegistered: boolean;
  lastSyncedAt: string | null;
  propertiesCount: number;
  bookingsCount: number;
}

type CacheStatusListener = (meta: OfflineCacheMetadata) => void;
const statusListeners = new Set<CacheStatusListener>();

let currentCacheMeta: OfflineCacheMetadata = {
  swRegistered: false,
  lastSyncedAt: null,
  propertiesCount: 0,
  bookingsCount: 0,
};

function notifyCacheStatusListeners() {
  statusListeners.forEach((listener) => {
    try {
      listener({ ...currentCacheMeta });
    } catch {
      // Ignore listener error
    }
  });
}

/**
 * Unregisters any legacy Service Workers and hydrates local cache metadata.
 */
export function registerOfflineServiceWorker(): void {
  if (typeof window === 'undefined') {
    return;
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().catch(() => {});
      }
    }).catch(() => {});
  }

  try {
    const raw = localStorage.getItem(OFFLINE_SNAPSHOT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.collections) {
        currentCacheMeta = {
          ...currentCacheMeta,
          swRegistered: false,
          lastSyncedAt: parsed.cachedAt || null,
          propertiesCount: Array.isArray(parsed.collections.properties)
            ? parsed.collections.properties.length
            : 0,
          bookingsCount: Array.isArray(parsed.collections.bookings)
            ? parsed.collections.bookings.length
            : 0,
        };
      }
    }
  } catch {
    // Ignore storage read error
  }
}

/**
 * Synchronizes critical property listings, room inventory, bookings, and platform state
 * into localStorage.
 */
export async function syncOfflinePlatformData(
  collections: Record<string, any[]>
): Promise<void> {
  if (typeof window === 'undefined') return;

  const cachedAt = new Date().toISOString();
  const snapshot = {
    ok: true,
    cachedAt,
    offlineReady: true,
    collections,
  };

  try {
    localStorage.setItem(OFFLINE_SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore quota warnings
  }

  currentCacheMeta = {
    ...currentCacheMeta,
    swRegistered: false,
    lastSyncedAt: cachedAt,
    propertiesCount: Array.isArray(collections.properties) ? collections.properties.length : 0,
    bookingsCount: Array.isArray(collections.bookings) ? collections.bookings.length : 0,
  };
  notifyCacheStatusListeners();
}

/**
 * Reads cached property listings, bookings, and collections for immediate offline viewing.
 */
export function readOfflinePlatformData(): Record<string, any[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(OFFLINE_SNAPSHOT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && parsed.collections && typeof parsed.collections === 'object') {
      return parsed.collections;
    }
    return {};
  } catch {
    return {};
  }
}

/**
 * React hook tracking real-time browser online/offline connectivity status.
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * React hook returning the current Service Worker offline cache metadata.
 */
export function useOfflineCacheStatus(): OfflineCacheMetadata {
  const [meta, setMeta] = useState<OfflineCacheMetadata>({ ...currentCacheMeta });

  useEffect(() => {
    setMeta({ ...currentCacheMeta });
    statusListeners.add(setMeta);
    return () => {
      statusListeners.delete(setMeta);
    };
  }, []);

  return meta;
}

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  getFirestore,
  setLogLevel,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { IS_PROD } from './env';
import {
  DbProcessLogEntry,
  recordProdDbProcessLog,
  subscribeToProdDbProcessLogs,
  verifyProdDatabaseConnection,
  verifyProdWriteAndCommit,
  saveToProdDatabase,
  deleteFromProdDatabase,
  subscribeToProdCollection,
  subscribeToProdDocument,
  getProdCollectionData,
  resetProdDatabaseToSuperAdminOnly,
} from './prodDatabase';
import {
  recordDevDbProcessLog,
  subscribeToDevDbProcessLogs,
  verifyDevDatabaseConnection,
  verifyDevWriteAndCommit,
  saveToDevDatabase,
  deleteFromDevDatabase,
  subscribeToDevCollection,
  subscribeToDevDocument,
  getDevCollectionData,
} from './devDatabase';

export type { DbProcessLogEntry };

try {
  setLogLevel('silent');
} catch {
  // Ignore if unsupported
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function testFirestoreConnection() {
  if (typeof window === 'undefined') return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      // Retry once after 1.5 seconds in case initial socket connection was settling
      setTimeout(async () => {
        try {
          await getDocFromServer(doc(db, 'test', 'connection'));
        } catch (_retryErr) {
          console.warn('Firebase connection running with resilient offline cache fallback.');
        }
      }, 1500);
    }
  }
}
testFirestoreConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.warn('Database Operation Warning:', errInfo);
}

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    const existingUsers = await getCollectionData<any>('users');
    const existingProfile = existingUsers.find((u) => u.id === user.uid || u.email === user.email);

    const userData = existingProfile || {
      id: user.uid,
      name: user.displayName || user.email?.split('@')[0] || 'ScopeBridg User',
      fullName: user.displayName || user.email?.split('@')[0] || 'ScopeBridg User',
      username: user.email?.split('@')[0] || `user_${user.uid.slice(0, 5)}`,
      email: user.email || '',
      phone: user.phoneNumber || '+27 ',
      role: 'guest',
      title: 'Verified Traveler & Guest',
      avatar: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!existingProfile) {
      await saveToFirestore('users', user.uid, userData);
    }

    return { user, profile: userData };
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
}

export async function logOutFirebase() {
  return firebaseSignOut(auth);
}

export interface DatabaseTableMeta {
  name: string;
  label: string;
  category: 'Core PMS' | 'Financial & Billing' | 'Distribution & Gateways' | 'Concierge & Fleet' | 'System & Auth';
  description: string;
  primaryKey: string;
}

export const ALL_DATABASE_TABLES: DatabaseTableMeta[] = [
  { name: 'properties', label: 'Properties & Units', category: 'Core PMS', description: 'Property listings, owner bank accounts, property photos/videos, rooms & room media', primaryKey: 'id' },
  { name: 'bookings', label: 'Reservations & Bookings', category: 'Core PMS', description: 'Direct, Airbnb, and Booking.com guest reservations, door PINs & add-ons', primaryKey: 'id' },
  { name: 'users', label: 'User Accounts & Roles', category: 'System & Auth', description: 'Super Admin, Admins, Property Owners, Guests, Nannies & Shuttle Drivers', primaryKey: 'id' },
  { name: 'channels', label: 'OTA Booking Channels', category: 'Distribution & Gateways', description: 'Airbnb, Booking.com, Expedia, LekkeSlaap, Agoda, Vrbo, SafariNow & Direct feeds', primaryKey: 'id' },
  { name: 'paymentGateways', label: 'Payment Gateways', category: 'Distribution & Gateways', description: 'Paystack, Ozow, Yoco, SnapScan, Peach Payments, Stripe & Direct Bank EFT', primaryKey: 'id' },
  { name: 'accessRequests', label: 'Channel & Gateway Requests', category: 'Distribution & Gateways', description: 'Owner requests to connect/disconnect OTA channels and merchant gateways', primaryKey: 'id' },
  { name: 'quotations', label: 'Guest Quotations', category: 'Financial & Billing', description: 'Itemized accommodation & service quotations with 15% VAT calculation', primaryKey: 'id' },
  { name: 'invoices', label: 'Tax Invoices & Payouts', category: 'Financial & Billing', description: 'Issued tax invoices, payment status, and 90/10 owner/admin commission splits', primaryKey: 'id' },
  { name: 'settings', label: 'Platform Settings & Wallets', category: 'Financial & Billing', description: 'Global platform configuration, virtual wallets, and database health telemetry', primaryKey: 'id' },
  { name: 'roomBids', label: 'Room Rate Bids', category: 'Financial & Billing', description: 'Guest price bids and owner/admin counter-offers', primaryKey: 'id' },
  { name: 'reviews', label: 'Guest Reviews', category: 'Core PMS', description: 'Verified guest ratings, review comments, and host replies', primaryKey: 'id' },
  { name: 'cleaningTasks', label: 'Turnover & Cleaning', category: 'Core PMS', description: 'Automated checkout housekeeping schedules and inspection checklists', primaryKey: 'id' },
  { name: 'promos', label: 'Promo & Loyalty Codes', category: 'Financial & Billing', description: 'Direct booking discount codes and usage counters', primaryKey: 'code' },
  { name: 'alerts', label: 'Admin Audit Alerts', category: 'System & Auth', description: 'Real-time security, operations, and financial audit notifications', primaryKey: 'id' },
  { name: 'nannies', label: 'Certified Nanny Profiles', category: 'Concierge & Fleet', description: 'Vetted childcare specialists, CPR certifications, and hourly rates', primaryKey: 'id' },
  { name: 'nannyBookings', label: 'Childcare Bookings', category: 'Concierge & Fleet', description: 'Booked nanny sessions and live child activity logs', primaryKey: 'id' },
  { name: 'shuttleDrivers', label: 'Shuttle Chauffeur Fleet', category: 'Concierge & Fleet', description: 'Executive airport transfer drivers and vehicle specifications', primaryKey: 'id' },
  { name: 'shuttleBookings', label: 'Shuttle Transfers', category: 'Concierge & Fleet', description: 'Airport pickups, point-to-point rides, and dispatch status', primaryKey: 'id' },
  { name: 'fleetServiceRequests', label: 'Fleet Maintenance & Fines', category: 'Concierge & Fleet', description: 'Vehicle license disk renewals, traffic fines, and mechanical service logs', primaryKey: 'id' },
  { name: 'kioskFlightBookings', label: 'Kiosk Flight Bookings', category: 'Concierge & Fleet', description: 'Self-service lobby kiosk flight reservations', primaryKey: 'id' },
  { name: 'kioskCarBookings', label: 'Kiosk Car Rentals', category: 'Concierge & Fleet', description: 'Self-service lobby kiosk vehicle hire reservations', primaryKey: 'id' },
  { name: 'calendarEvents', label: 'Universal Calendar & Holiday Plans', category: 'Core PMS', description: 'Daily, weekly & monthly bookings, holiday itineraries, and personal plans synced across all registered channels', primaryKey: 'id' },
];

export function recordDbProcessLog(entry: Omit<DbProcessLogEntry, 'id' | 'timestamp'>) {
  if (IS_PROD) {
    recordProdDbProcessLog(entry);
  } else {
    recordDevDbProcessLog(entry);
  }
}

export function subscribeToDbProcessLogs(listener: (logs: DbProcessLogEntry[]) => void): () => void {
  return IS_PROD
    ? subscribeToProdDbProcessLogs(listener)
    : subscribeToDevDbProcessLogs(listener);
}

export function getFirebaseConnectionInfo() {
  if (IS_PROD) {
    return {
      projectId: firebaseConfig.projectId,
      databaseId: firebaseConfig.firestoreDatabaseId,
      authDomain: firebaseConfig.authDomain,
      storageBucket: firebaseConfig.storageBucket,
      totalTables: ALL_DATABASE_TABLES.length,
    };
  }
  return {
    projectId: 'development-local-store',
    databaseId: '/data/dev-database.json',
    authDomain: 'localhost',
    storageBucket: 'local-dev-storage',
    totalTables: ALL_DATABASE_TABLES.length,
  };
}

export async function verifyDatabaseConnection() {
  return IS_PROD ? verifyProdDatabaseConnection() : verifyDevDatabaseConnection();
}

export async function verifyProductionWriteAndCommit() {
  return IS_PROD ? verifyProdWriteAndCommit() : verifyDevWriteAndCommit();
}

export async function saveToFirestore<T extends Record<string, any>>(
  collectionName: string,
  id: string,
  data: T
) {
  if (IS_PROD) {
    return saveToProdDatabase(collectionName, id, data);
  }
  return saveToDevDatabase(collectionName, id, data);
}

export async function deleteFromFirestore(collectionName: string, id: string) {
  if (IS_PROD) {
    return deleteFromProdDatabase(collectionName, id);
  }
  return deleteFromDevDatabase(collectionName, id);
}

export function subscribeToCollection<T>(
  collectionName: string,
  onUpdate: (items: T[]) => void
) {
  if (IS_PROD) {
    return subscribeToProdCollection(collectionName, onUpdate);
  }
  return subscribeToDevCollection(collectionName, onUpdate);
}

export function subscribeToDocument<T>(
  collectionName: string,
  docId: string,
  onUpdate: (data: T | null) => void
) {
  if (IS_PROD) {
    return subscribeToProdDocument(collectionName, docId, onUpdate);
  }
  return subscribeToDevDocument(collectionName, docId, onUpdate);
}

export async function getCollectionData<T>(collectionName: string): Promise<T[]> {
  if (IS_PROD) {
    return getProdCollectionData<T>(collectionName);
  }
  return getDevCollectionData<T>(collectionName);
}

export async function resetProductionDatabaseToSuperAdminOnly(
  superAdminUser: Record<string, any>,
  wipeAllNonSuperAdmin = false
) {
  if (!IS_PROD) {
    return {
      success: true,
      purgedRecordsCount: 0,
      purgedCount: 0,
      connectionVerified: true,
      writeCommitted: true,
      commitLatencyMs: 2,
      commitReceiptId: `DEV-ISOLATED-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
  }
  return resetProdDatabaseToSuperAdminOnly(superAdminUser, wipeAllNonSuperAdmin);
}

export async function logFirestoreDiagnostics() {
  try {
    const users = await getCollectionData<any>('users');
    const properties = await getCollectionData<any>('properties');
    return { users, properties };
  } catch {
    return { users: [], properties: [] };
  }
}

export function parseMediaUrls(input: string): string[] {
  if (!input || !input.trim()) return [];
  const trimmed = input.trim();
  
  // Split lines by newline
  const lines = trimmed.split(/[\r\n]+/);
  const result: string[] = [];
  
  for (const line of lines) {
    const l = line.trim();
    if (!l) continue;
    
    // If it's a data URL, add directly without splitting
    if (l.startsWith('data:image/') || l.startsWith('data:')) {
      result.push(l);
    } else if (l.includes('http://') || l.includes('https://') || l.includes('blob:')) {
      // Split by comma followed by http/blob/data boundaries
      const parts = l.split(/,\s*(?=https?:\/\/|blob:|data:)/);
      for (const p of parts) {
        const item = p.trim();
        if (item) result.push(item);
      }
    } else {
      const parts = l.split(',').map((s) => s.trim()).filter(Boolean);
      result.push(...parts);
    }
  }
  
  return result;
}

export function compressImageToDataUrl(
  file: File,
  maxWidth = 1600,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If it's an SVG, read directly as data URL without rasterizing
    if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Failed to read SVG file'));
      reader.readAsDataURL(file);
      return;
    }

    // If it's a GIF animation, preserve it directly as data URL
    if (file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif')) {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Failed to read GIF file'));
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Invalid image data'));
        return;
      }

      const img = new Image();
      img.onerror = () => {
        // Fallback: If canvas decoding fails, resolve with raw data URL so file is never lost
        resolve(result);
      };
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(result);
            return;
          }

          // Handle PNG transparency with smooth background fill
          const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
          if (!isPng) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Use WebP if supported, otherwise JPEG or PNG
          let mimeType = 'image/jpeg';
          if (isPng) mimeType = 'image/png';
          else if (file.type === 'image/webp') mimeType = 'image/webp';

          const compressed = canvas.toDataURL(mimeType, quality);
          resolve(compressed);
        } catch {
          resolve(result);
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}

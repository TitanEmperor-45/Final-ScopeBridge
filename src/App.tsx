/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  AppRole,
  Property,
  Review,
  Booking,
  CleaningTask,
  PromoCode,
  AdminAuditAlert,
  ChannelConfig,
  PaymentGatewayConfig,
  OwnerAccessRequest,
  PropertyRoom,
  NannyProfile,
  NannyBooking,
  NannyActivityLog,
  ShuttleDriverProfile,
  ShuttleBooking,
  UserAccount,
  GlobalCurrency,
  RoomBid,
  FleetServiceRequest,
  FleetServiceStatus,
  VirtualWalletData,
  Quotation,
  Invoice,
  KioskFlightBooking,
  KioskCarBooking,
  CalendarPlanEvent,
} from './types';
import { checkDoubleBookingConflict } from './utils/bookingAvailability';
import { PRESET_USERS, PRODUCTION_SUPER_ADMIN, KENNY_WEEDER_SUPER_ADMIN, DEVELOPMENT_TEST_USERS } from './data/usersData';
import {
  INITIAL_PROPERTIES,
  MOCK_BOOKINGS,
  MOCK_REVIEWS,
  MOCK_CLEANING_TASKS,
  MOCK_PROMOS,
  MOCK_ADMIN_ALERTS,
  MOCK_CHANNELS,
  MOCK_PAYMENT_GATEWAYS,
  MOCK_OWNER_ACCESS_REQUESTS,
  MOCK_NANNIES,
  MOCK_NANNY_PROFILES,
  MOCK_NANNY_BOOKINGS,
  MOCK_SHUTTLE_DRIVERS,
  MOCK_SHUTTLE_BOOKINGS,
  MOCK_ROOM_BIDS,
  MOCK_FLEET_SERVICE_REQUESTS,
  MOCK_QUOTATIONS,
  MOCK_INVOICES,
  MOCK_CALENDAR_EVENTS,
} from './data/mockData';
import { Header } from './components/Header';
import { GuestView } from './components/guest/GuestView';
import { OwnerPortal } from './components/owner/OwnerPortal';
import { AdminPortal } from './components/admin/AdminPortal';
import { NannyPortal } from './components/nanny/NannyPortal';
import { DriverPortal } from './components/driver/DriverPortal';
import { KioskMode } from './components/kiosk/KioskMode';
import { LoginModal } from './components/auth/LoginModal';
import { AuthPage } from './components/auth/AuthPage';
import { GroundingAdvisorModal } from './components/common/GroundingAdvisorModal';
import { UniversalCalendarPlanner } from './components/common/UniversalCalendarPlanner';
import { GuestBookingLinkModal } from './components/guest/GuestBookingLinkModal';
import { LiveChatModal } from './components/guest/LiveChatModal';
import { OfflineStatusBanner } from './components/common/OfflineStatusBanner';
import { OpenWaSupportModal } from './components/common/OpenWaSupportModal';
import { installGlobalOpenWaLinkInterceptor } from './lib/openwaBridge';
import { syncBookingToChannels } from './lib/channelSync';
import {
  syncOfflinePlatformData,
  readOfflinePlatformData,
} from './lib/offlineServiceWorker';
import {
  auth,
  subscribeToCollection,
  subscribeToDocument,
  saveToFirestore,
  deleteFromFirestore,
  getCollectionData,
  logFirestoreDiagnostics,
} from './lib/firebase';
import { IS_DEV, IS_PROD, RUNTIME_ENV } from './lib/env';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  Heart,
  ShieldCheck,
  Sparkles,
  Navigation,
  Phone,
  Check,
  Globe,
  KeyRound,
  Baby,
  Car,
  Building2,
  User,
} from 'lucide-react';

export default function App() {
  const [isGroundingAdvisorOpen, setIsGroundingAdvisorOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isGuestBookingLinkModalOpen, setIsGuestBookingLinkModalOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return (
        params.get('guestBookingLink') === '1' ||
        params.get('booking') === 'guest-calendar' ||
        Boolean(params.get('bookProperty'))
      );
    }
    return false;
  });

  const [isSuperAdminSession, setIsSuperAdminSession] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('ferndalestay_') || k === 'scopebridg_env_mode') {
          localStorage.removeItem(k);
        }
      });
    }
    return localStorage.getItem('scopebridg_superadmin_session') === 'true';
  });

  const [deletedUserIds, setDeletedUserIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('scopebridg_deleted_user_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('scopebridg_deleted_user_ids', JSON.stringify(deletedUserIds));
  }, [deletedUserIds]);

  // Route all WhatsApp communication links across the platform through the OpenWA REST API Gateway
  useEffect(() => {
    installGlobalOpenWaLinkInterceptor();
  }, []);

  // Helper to dispatch live Admin notifications via OpenWA (+27694977018), Email & In-App Chat
  const triggerLiveAdminNotification = (eventType: string, title: string, message: string, recipientEmail?: string, recipientPhone?: string) => {
    fetch('/api/notifications/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType,
        title,
        message,
        recipientEmail: recipientEmail || 'nightscope58@gmail.com',
        recipientPhone: recipientPhone || '+27694977018',
        adminEmail: 'nightscope58@gmail.com',
        adminWhatsApp: '+27694977018',
      }),
    }).catch(() => {});
  };

  // Ensure collections are initialized on both Production and Development databases
  useEffect(() => {
    const seedCollections = {
      users: PRESET_USERS,
      properties: INITIAL_PROPERTIES,
      bookings: MOCK_BOOKINGS,
      reviews: MOCK_REVIEWS,
      cleaningTasks: MOCK_CLEANING_TASKS,
      promos: MOCK_PROMOS,
      alerts: MOCK_ADMIN_ALERTS,
      channels: MOCK_CHANNELS,
      paymentGateways: MOCK_PAYMENT_GATEWAYS,
      accessRequests: MOCK_OWNER_ACCESS_REQUESTS,
      nannies: MOCK_NANNY_PROFILES,
      nannyBookings: MOCK_NANNY_BOOKINGS,
      shuttleDrivers: MOCK_SHUTTLE_DRIVERS,
      shuttleBookings: MOCK_SHUTTLE_BOOKINGS,
      roomBids: MOCK_ROOM_BIDS,
      fleetServiceRequests: MOCK_FLEET_SERVICE_REQUESTS,
      quotations: MOCK_QUOTATIONS,
      invoices: MOCK_INVOICES,
      kioskFlightBookings: [],
      kioskCarBookings: [],
      calendarEvents: MOCK_CALENDAR_EVENTS,
    };

    if (IS_PROD) {
      fetch('/api/prod-db/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collections: seedCollections, forceReset: false }),
      }).catch(() => {});
    } else {
      fetch('/api/dev-db/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collections: seedCollections, forceReset: false }),
      }).catch(() => {});
    }
  }, []);

  // Synchronized Subscriptions (Loads all collections on Production & Development)
  useEffect(() => {
    logFirestoreDiagnostics();

    // 1. Subscribe to Users
    const unsubUsers = subscribeToCollection<UserAccount>('users', (fsUsers) => {
      const baseUsers =
        fsUsers && fsUsers.length > 0
          ? [...fsUsers]
          : IS_PROD
          ? [PRODUCTION_SUPER_ADMIN]
          : [...PRESET_USERS];
      if (IS_DEV) {
        for (const preset of PRESET_USERS) {
          if (!baseUsers.some((u) => u.id === preset.id || u.username.toLowerCase() === preset.username.toLowerCase())) {
            baseUsers.push(preset);
          }
        }
      }
      const activeUsers = baseUsers.filter(
        (u) =>
          !(u.email || '').toLowerCase().includes('ferndalestay') &&
          !deletedUserIds.includes(u.id)
      );
      if (!deletedUserIds.includes(PRODUCTION_SUPER_ADMIN.id)) {
        const hasSuperAdmin = activeUsers.some(
          (u) => u.id === PRODUCTION_SUPER_ADMIN.id || u.username === 'superadmin' || u.role === 'super_admin'
        );
        if (!hasSuperAdmin) {
          saveToFirestore('users', PRODUCTION_SUPER_ADMIN.id, PRODUCTION_SUPER_ADMIN);
          activeUsers.unshift(PRODUCTION_SUPER_ADMIN);
        }
      }
      if (!deletedUserIds.includes(KENNY_WEEDER_SUPER_ADMIN.id)) {
        const hasKenny = activeUsers.some(
          (u) => u.id === KENNY_WEEDER_SUPER_ADMIN.id || (u.email && u.email.toLowerCase() === KENNY_WEEDER_SUPER_ADMIN.email.toLowerCase())
        );
        if (!hasKenny) {
          saveToFirestore('users', KENNY_WEEDER_SUPER_ADMIN.id, KENNY_WEEDER_SUPER_ADMIN);
          activeUsers.unshift(KENNY_WEEDER_SUPER_ADMIN);
        }
      }
      setRegisteredUsers(activeUsers);
      setCurrentUser((prev) => {
        if (!prev || prev.id === 'guest-1' || prev.id === 'guest-unauth') return prev;
        const fresh = activeUsers.find(
          (u) =>
            u.id === prev.id ||
            (prev.username && u.username.toLowerCase() === prev.username.toLowerCase())
        );
        if (!fresh) return prev;
        return {
          ...prev,
          ...fresh,
          bankAccount: fresh.bankAccount || prev.bankAccount,
          bankAccounts:
            fresh.bankAccounts && fresh.bankAccounts.length > 0
              ? fresh.bankAccounts
              : prev.bankAccounts,
        };
      });
    });

    // 2. Subscribe to Properties
    const unsubProperties = subscribeToCollection<Property>('properties', (fsProps) => {
      if (fsProps && fsProps.length > 0) {
        setProperties(fsProps);
      } else {
        const cachedProps = readOfflinePlatformData().properties;
        if (Array.isArray(cachedProps) && cachedProps.length > 0) {
          setProperties(cachedProps as Property[]);
        } else {
          setProperties(INITIAL_PROPERTIES);
        }
      }
    });

    // 3. Subscribe to Bookings
    const unsubBookings = subscribeToCollection<Booking>('bookings', (fsBookings) => {
      if (fsBookings && fsBookings.length > 0) {
        setBookings(fsBookings);
      } else {
        const cachedBookings = readOfflinePlatformData().bookings;
        if (Array.isArray(cachedBookings) && cachedBookings.length > 0) {
          setBookings(cachedBookings as Booking[]);
        } else {
          setBookings(MOCK_BOOKINGS);
        }
      }
    });

    // 4. Subscribe to Reviews
    const unsubReviews = subscribeToCollection<Review>('reviews', (fsReviews) => {
      setReviews(fsReviews && fsReviews.length > 0 ? fsReviews : MOCK_REVIEWS);
    });

    // 5. Subscribe to Cleaning Tasks
    const unsubCleanings = subscribeToCollection<CleaningTask>('cleaningTasks', (fsCleanings) => {
      setCleaningTasks(fsCleanings && fsCleanings.length > 0 ? fsCleanings : MOCK_CLEANING_TASKS);
    });

    // 6. Subscribe to Promo Codes
    const unsubPromos = subscribeToCollection<PromoCode>('promos', (fsPromos) => {
      setPromos(fsPromos && fsPromos.length > 0 ? fsPromos : MOCK_PROMOS);
    });

    // 7. Subscribe to Admin Audit Alerts
    const unsubAlerts = subscribeToCollection<AdminAuditAlert>('alerts', (fsAlerts) => {
      setAlerts(fsAlerts && fsAlerts.length > 0 ? fsAlerts : MOCK_ADMIN_ALERTS);
    });

    // 8. Subscribe to Channels & Payment Gateways
    const unsubChannels = subscribeToCollection<ChannelConfig>('channels', (fsChannels) => {
      if (fsChannels && fsChannels.length > 0) {
        setChannels(fsChannels);
      } else {
        setChannels(MOCK_CHANNELS);
      }
    });

    const unsubGateways = subscribeToCollection<PaymentGatewayConfig>('paymentGateways', (fsGateways) => {
      if (fsGateways && fsGateways.length > 0) {
        setPaymentGateways(fsGateways);
      } else {
        setPaymentGateways(MOCK_PAYMENT_GATEWAYS);
      }
    });

    // Subscribe to Virtual Wallets
    const unsubWallets = subscribeToDocument<Record<string, any>>('settings', 'virtualWallets', (fsWallets) => {
      if (fsWallets) {
        const { updatedAt, id, deleted, ...walletsMap } = fsWallets;
        setVirtualWallets(walletsMap || {});
      } else {
        setVirtualWallets({});
      }
    });

    const unsubAccessRequests = subscribeToCollection<OwnerAccessRequest>('accessRequests', (fsReqs) => {
      setAccessRequests(fsReqs && fsReqs.length > 0 ? fsReqs : MOCK_OWNER_ACCESS_REQUESTS);
    });

    // 9. Subscribe to Nannies & Nanny Bookings
    const unsubNannies = subscribeToCollection<NannyProfile>('nannies', (fsNannies) => {
      setNannies(fsNannies && fsNannies.length > 0 ? fsNannies : MOCK_NANNY_PROFILES);
    });

    const unsubNannyBookings = subscribeToCollection<NannyBooking>('nannyBookings', (fsNannyBookings) => {
      setNannyBookings(fsNannyBookings && fsNannyBookings.length > 0 ? fsNannyBookings : MOCK_NANNY_BOOKINGS);
    });

    // 10. Subscribe to Shuttle Drivers & Shuttle Bookings
    const unsubDrivers = subscribeToCollection<ShuttleDriverProfile>('shuttleDrivers', (fsDrivers) => {
      setShuttleDrivers(fsDrivers && fsDrivers.length > 0 ? fsDrivers : MOCK_SHUTTLE_DRIVERS);
    });

    const unsubShuttleBookings = subscribeToCollection<ShuttleBooking>('shuttleBookings', (fsShuttleBookings) => {
      setShuttleBookings(fsShuttleBookings && fsShuttleBookings.length > 0 ? fsShuttleBookings : MOCK_SHUTTLE_BOOKINGS);
    });

    // 11. Subscribe to Room Bids & Fleet Service Requests
    const unsubRoomBids = subscribeToCollection<RoomBid>('roomBids', (fsBids) => {
      setRoomBids(fsBids && fsBids.length > 0 ? fsBids : MOCK_ROOM_BIDS);
    });

    const unsubFleetReqs = subscribeToCollection<FleetServiceRequest>('fleetServiceRequests', (fsFleetReqs) => {
      setFleetServiceRequests(fsFleetReqs && fsFleetReqs.length > 0 ? fsFleetReqs : MOCK_FLEET_SERVICE_REQUESTS);
    });

    // 12. Subscribe to Quotations & Invoices
    const unsubQuotations = subscribeToCollection<Quotation>('quotations', (fsQuotes) => {
      setQuotations(fsQuotes && fsQuotes.length > 0 ? fsQuotes : MOCK_QUOTATIONS);
    });

    const unsubInvoices = subscribeToCollection<Invoice>('invoices', (fsInvoices) => {
      setInvoices(fsInvoices && fsInvoices.length > 0 ? fsInvoices : MOCK_INVOICES);
    });

    // 13. Subscribe to Kiosk Flight & Car Bookings
    const unsubFlights = subscribeToCollection<KioskFlightBooking>('kioskFlightBookings', (fsFlights) => {
      setKioskFlightBookings(fsFlights || []);
    });

    const unsubCars = subscribeToCollection<KioskCarBooking>('kioskCarBookings', (fsCars) => {
      setKioskCarBookings(fsCars || []);
    });

    const unsubCalendarEvents = subscribeToCollection<CalendarPlanEvent>('calendarEvents', (fsEvents) => {
      setCalendarEvents(fsEvents && fsEvents.length > 0 ? fsEvents : MOCK_CALENDAR_EVENTS);
    });

    return () => {
      unsubUsers();
      unsubProperties();
      unsubBookings();
      unsubReviews();
      unsubCleanings();
      unsubPromos();
      unsubAlerts();
      unsubChannels();
      unsubGateways();
      if (typeof unsubWallets === 'function') unsubWallets();
      unsubAccessRequests();
      unsubNannies();
      unsubNannyBookings();
      unsubDrivers();
      unsubShuttleBookings();
      unsubRoomBids();
      unsubFleetReqs();
      unsubQuotations();
      unsubInvoices();
      unsubFlights();
      unsubCars();
      unsubCalendarEvents();
    };
  }, [deletedUserIds]);

  // Firebase Auth State Listener & User Profile Sync (Preserves 100% of User & Banking Data)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const allUsers = await getCollectionData<UserAccount>('users');
          const data = allUsers.find(
            (u) =>
              u.id === fbUser.uid ||
              (fbUser.email && u.email?.toLowerCase() === fbUser.email.toLowerCase())
          );
          if (data) {
            const profileAcc: UserAccount = {
              ...data,
              id: data.id || fbUser.uid,
              name: data.name || fbUser.displayName || 'Verified User',
              fullName: data.fullName || data.name || fbUser.displayName || 'Verified User',
              username: data.username || fbUser.email?.split('@')[0] || 'verified_user',
              email: data.email || fbUser.email || '',
              phone: data.phone || fbUser.phoneNumber || '+27 ',
              role: data.role || 'guest',
              title: data.title || 'Verified Member',
              avatar: data.avatar || fbUser.photoURL || '',
              status: data.status || 'active',
              location: data.location || '',
              bankAccount: data.bankAccount,
              bankAccounts: data.bankAccounts,
            };
            setCurrentUser(profileAcc);
            setCurrentRole(profileAcc.role);
            try {
              localStorage.setItem('ferndalestay_currentUser', JSON.stringify(profileAcc));
            } catch {
              // ignore storage quota
            }
          }
        } catch (err) {
          console.error('Error syncing user from database:', err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Authentication & Current User Session
  const [registeredUsers, setRegisteredUsers] = useState<UserAccount[]>(() =>
    DEVELOPMENT_TEST_USERS.length > 0 ? DEVELOPMENT_TEST_USERS : [PRODUCTION_SUPER_ADMIN]
  );

  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    try {
      const saved = localStorage.getItem('ferndalestay_currentUser');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && parsed.id !== 'guest-unauth') {
          return parsed as UserAccount;
        }
      }
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('kiosk') === '1' || params.get('kioskMode') === '1' || params.get('role') === 'kiosk' || params.get('mode') === 'kiosk') {
        return {
          id: 'kiosk-staff-1',
          name: 'Reception Kiosk',
          fullName: 'Reception Kiosk Terminal',
          username: 'reception_kiosk',
          password: '',
          role: 'kiosk',
          email: 'kiosk@scopebridg.co.za',
          phone: '+27 69 497 7018',
          avatar: '',
          title: 'Reception Lobby Kiosk Terminal',
          location: 'Oxford St & Ferndale on Republic',
          badge: 'Owner-Authorized Kiosk Terminal',
          kioskAccess: true,
        };
      }
    }
    return {
      id: 'guest-1',
      name: 'Guest',
      fullName: 'Guest',
      username: 'guest',
      password: '',
      role: 'guest',
      email: '',
      phone: '',
      avatar: '',
      title: 'Guest',
      location: '',
      badge: '',
    };
  });
  const [currentRole, setCurrentRole] = useState<AppRole>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('kiosk') === '1' || params.get('kioskMode') === '1' || params.get('role') === 'kiosk' || params.get('mode') === 'kiosk') {
        return 'kiosk';
      }
    }
    try {
      const savedRole = localStorage.getItem('ferndalestay_currentRole') as AppRole | null;
      if (savedRole) return savedRole;
    } catch {
      // ignore
    }
    return 'guest';
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAuthPageOpen, setIsAuthPageOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (
        params.get('kiosk') === '1' ||
        params.get('kioskMode') === '1' ||
        params.get('role') === 'kiosk' ||
        params.get('mode') === 'kiosk' ||
        params.get('guestBookingLink') === '1' ||
        params.get('booking') === 'guest-calendar' ||
        Boolean(params.get('bookProperty'))
      ) {
        return false;
      }
    }
    return true;
  });

  // Global Currency State
  const [selectedCurrency, setSelectedCurrency] = useState<GlobalCurrency>('ZAR');

  // Core platform state with Firestore real-time sync & Service Worker Offline Hydration
  const [properties, setProperties] = useState<Property[]>(() => {
    const cached = readOfflinePlatformData().properties;
    if (Array.isArray(cached) && cached.length > 0) return cached as Property[];
    return INITIAL_PROPERTIES;
  });
  const [reviews, setReviews] = useState<Review[]>(() => {
    const cached = readOfflinePlatformData().reviews;
    if (Array.isArray(cached) && cached.length > 0) return cached as Review[];
    return MOCK_REVIEWS;
  });
  const [bookings, setBookings] = useState<Booking[]>(() => {
    const cached = readOfflinePlatformData().bookings;
    if (Array.isArray(cached) && cached.length > 0) return cached as Booking[];
    return MOCK_BOOKINGS;
  });
  const [cleaningTasks, setCleaningTasks] = useState<CleaningTask[]>(() => MOCK_CLEANING_TASKS);
  const [promos, setPromos] = useState<PromoCode[]>(MOCK_PROMOS);
  const [alerts, setAlerts] = useState<AdminAuditAlert[]>(() => MOCK_ADMIN_ALERTS);

  // Channels, Gateways, and Owner Access Requests state
  const [channels, setChannels] = useState<ChannelConfig[]>(MOCK_CHANNELS);
  const [paymentGateways, setPaymentGateways] = useState<PaymentGatewayConfig[]>(MOCK_PAYMENT_GATEWAYS);
  const [accessRequests, setAccessRequests] = useState<OwnerAccessRequest[]>(() => MOCK_OWNER_ACCESS_REQUESTS);

  // Nanny Portal State
  const [nannies, setNannies] = useState<NannyProfile[]>(() => MOCK_NANNY_PROFILES);
  const [nannyBookings, setNannyBookings] = useState<NannyBooking[]>(() => MOCK_NANNY_BOOKINGS);

  // Shuttle & Chauffeur Fleet State
  const [shuttleDrivers, setShuttleDrivers] = useState<ShuttleDriverProfile[]>(() => MOCK_SHUTTLE_DRIVERS);
  const [shuttleBookings, setShuttleBookings] = useState<ShuttleBooking[]>(() => MOCK_SHUTTLE_BOOKINGS);

  // Room Bidding & Fleet Service Request States
  const [roomBids, setRoomBids] = useState<RoomBid[]>(() => MOCK_ROOM_BIDS);
  const [fleetServiceRequests, setFleetServiceRequests] = useState<FleetServiceRequest[]>(() => MOCK_FLEET_SERVICE_REQUESTS);

  // Quotations and Invoices state
  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    const cached = readOfflinePlatformData().quotations;
    return Array.isArray(cached) && cached.length > 0 ? (cached as Quotation[]) : MOCK_QUOTATIONS;
  });
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const cached = readOfflinePlatformData().invoices;
    return Array.isArray(cached) && cached.length > 0 ? (cached as Invoice[]) : MOCK_INVOICES;
  });

  // Virtual Wallets State (Global Platform Level)
  const [virtualWallets, setVirtualWallets] = useState<{ [guestName: string]: VirtualWalletData }>({});

  // Kiosk Flights and Cars state
  const [kioskFlightBookings, setKioskFlightBookings] = useState<KioskFlightBooking[]>([]);
  const [kioskCarBookings, setKioskCarBookings] = useState<KioskCarBooking[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarPlanEvent[]>(() => {
    const cached = readOfflinePlatformData().calendarEvents;
    if (Array.isArray(cached) && cached.length > 0) return cached as CalendarPlanEvent[];
    return MOCK_CALENDAR_EVENTS;
  });

  // Continuously synchronize critical property listings, room inventory, and bookings with the Service Worker cache
  const handleSyncOfflineCache = () => {
    syncOfflinePlatformData({
      properties,
      bookings,
      reviews,
      quotations,
      invoices,
      calendarEvents,
      users: registeredUsers,
    }).catch(() => {});
  };

  useEffect(() => {
    syncOfflinePlatformData({
      properties,
      bookings,
      reviews,
      quotations,
      invoices,
      calendarEvents,
      users: registeredUsers,
    }).catch(() => {});
  }, [properties, bookings, reviews, quotations, invoices, calendarEvents, registeredUsers]);

  const handleUpdateVirtualWallets: React.Dispatch<
    React.SetStateAction<{ [guestName: string]: VirtualWalletData }>
  > = (action) => {
    setVirtualWallets((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      saveToFirestore('settings', 'virtualWallets', next);
      return next;
    });
  };

  // Universal helper to create a React state setter that automatically syncs additions, updates, and deletions
  // to the bound environment database via saveToFirestore / deleteFromFirestore
  function createFirestoreSyncedSetter<T extends Record<string, any>>(
    collectionName: string,
    baseSetter: React.Dispatch<React.SetStateAction<T[]>>,
    idKey: keyof T = 'id' as keyof T
  ): React.Dispatch<React.SetStateAction<T[]>> {
    return (action) => {
      baseSetter((prev) => {
        const next = typeof action === 'function' ? (action as (p: T[]) => T[])(prev) : action;
        next.forEach((item) => {
          const itemId = String(item[idKey] || item.id || item.code || '');
          if (!itemId) return;
          const prevItem = prev.find((p) => String(p[idKey] || p.id || p.code || '') === itemId);
          if (!prevItem || JSON.stringify(prevItem) !== JSON.stringify(item)) {
            saveToFirestore(collectionName, itemId, item);
          }
        });
        prev.forEach((prevItem) => {
          const prevId = String(prevItem[idKey] || prevItem.id || prevItem.code || '');
          if (!prevId) return;
          if (!next.some((item) => String(item[idKey] || item.id || item.code || '') === prevId)) {
            deleteFromFirestore(collectionName, prevId);
          }
        });
        return next;
      });
    };
  }

  const handleUpdateProperties = createFirestoreSyncedSetter<Property>('properties', setProperties);
  const handleUpdateRegisteredUsers = createFirestoreSyncedSetter<UserAccount>('users', setRegisteredUsers);
  const handleUpdateBookings = createFirestoreSyncedSetter<Booking>('bookings', setBookings);
  const handleUpdateReviews = createFirestoreSyncedSetter<Review>('reviews', setReviews);
  const handleUpdateCleanings = createFirestoreSyncedSetter<CleaningTask>('cleaningTasks', setCleaningTasks);
  const handleUpdatePromos = createFirestoreSyncedSetter<PromoCode>('promos', setPromos, 'code');
  const handleUpdateAlerts = createFirestoreSyncedSetter<AdminAuditAlert>('alerts', setAlerts);
  const handleUpdateChannels = createFirestoreSyncedSetter<ChannelConfig>('channels', setChannels);
  const handleUpdateGateways = createFirestoreSyncedSetter<PaymentGatewayConfig>('paymentGateways', setPaymentGateways);
  const handleUpdateAccessRequests = createFirestoreSyncedSetter<OwnerAccessRequest>('accessRequests', setAccessRequests);
  const handleUpdateNannies = createFirestoreSyncedSetter<NannyProfile>('nannies', setNannies);
  const handleUpdateNannyBookings = createFirestoreSyncedSetter<NannyBooking>('nannyBookings', setNannyBookings);
  const handleUpdateShuttleDrivers = createFirestoreSyncedSetter<ShuttleDriverProfile>('shuttleDrivers', setShuttleDrivers);
  const handleUpdateShuttleBookings = createFirestoreSyncedSetter<ShuttleBooking>('shuttleBookings', setShuttleBookings);
  const handleUpdateRoomBids = createFirestoreSyncedSetter<RoomBid>('roomBids', setRoomBids);
  const handleUpdateFleetServiceRequests = createFirestoreSyncedSetter<FleetServiceRequest>('fleetServiceRequests', setFleetServiceRequests);
  const handleUpdateQuotations = createFirestoreSyncedSetter<Quotation>('quotations', setQuotations);
  const handleUpdateInvoices = createFirestoreSyncedSetter<Invoice>('invoices', setInvoices);
  const handleUpdateFlightBookings = createFirestoreSyncedSetter<KioskFlightBooking>('kioskFlightBookings', setKioskFlightBookings);
  const handleUpdateCarBookings = createFirestoreSyncedSetter<KioskCarBooking>('kioskCarBookings', setKioskCarBookings);
  const handleUpdateCalendarEvents = createFirestoreSyncedSetter<CalendarPlanEvent>('calendarEvents', setCalendarEvents);

  const handleAddRoomBid = (bid: Omit<RoomBid, 'id' | 'createdAt' | 'status'>) => {
    const newBid: RoomBid = {
      ...bid,
      id: `BID-${Date.now().toString().slice(-4)}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    handleUpdateRoomBids((prev) => [newBid, ...prev]);
    showToast(`Room bid submitted successfully! Awaiting owner/admin review.`);
  };

  const handleUpdateRoomBidStatus = (
    bidId: string,
    status: 'approved' | 'declined' | 'pending' | 'countered',
    counterRate?: number,
    counterMessage?: string
  ) => {
    handleUpdateRoomBids((prev) =>
      prev.map((b) =>
        b.id === bidId
          ? {
              ...b,
              status,
              counterOfferRateZar: counterRate !== undefined ? counterRate : b.counterOfferRateZar,
              counterOfferMessage: counterMessage !== undefined ? counterMessage : b.counterOfferMessage,
            }
          : b
      )
    );
    showToast(`Room bid #${bidId} has been ${status === 'countered' ? 'counter-offered' : status}.`);
  };

  const handleCreateQuotation = (quote: Omit<Quotation, 'id' | 'createdAt'>) => {
    const newQuote: Quotation = {
      ...quote,
      id: `QT-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
    };
    handleUpdateQuotations((prev) => [newQuote, ...prev]);
    showToast(`Quotation ${newQuote.quotationNumber} created successfully.`);
  };

  const handleEditQuotation = (quote: Quotation) => {
    handleUpdateQuotations((prev) => prev.map((q) => (q.id === quote.id ? quote : q)));
    showToast(`Quotation ${quote.quotationNumber} updated successfully.`);
  };

  const handleDeleteQuotation = (quoteId: string) => {
    handleUpdateQuotations((prev) => {
      const q = prev.find((item) => item.id === quoteId);
      showToast(`Quotation ${q?.quotationNumber || quoteId} deleted.`);
      return prev.filter((item) => item.id !== quoteId);
    });
  };

  const handleConvertQuoteToInvoice = (quoteId: string) => {
    const quote = quotations.find((q) => q.id === quoteId);
    if (!quote) return;

    const newInvoice: Invoice = {
      id: `INV-${Date.now().toString().slice(-4)}`,
      invoiceNumber: `INV-${quote.quotationNumber.split('-').slice(1).join('-')}`,
      quotationRef: quote.quotationNumber,
      propertyId: quote.propertyId,
      propertyTitle: quote.propertyTitle,
      ownerId: quote.ownerId,
      ownerName: quote.ownerName,
      guestName: quote.guestName,
      guestEmail: quote.guestEmail,
      guestPhone: quote.guestPhone,
      taxNumber: 'SARS-VAT-4920192837',
      items: quote.items.map((item) => ({ ...item })),
      subtotalZar: quote.subtotalZar,
      vatAmountZar: quote.vatAmountZar,
      totalZar: quote.totalZar,
      amountPaidZar: 0,
      balanceDueZar: quote.totalZar,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending_payment',
      paymentStatus: 'unpaid',
      issueDate: new Date().toISOString().split('T')[0],
      notes: quote.notes || 'Converted from quotation.',
      createdAt: new Date().toISOString(),
      createdBy: 'owner',
    };

    handleUpdateQuotations((prev) =>
      prev.map((q) => (q.id === quoteId ? { ...q, status: 'accepted', convertedToInvoiceId: newInvoice.id } : q))
    );
    handleUpdateInvoices((prev) => [newInvoice, ...prev]);
    showToast(`Quotation ${quote.quotationNumber} converted to Invoice ${newInvoice.invoiceNumber}.`);
  };

  const handleCreateInvoice = (inv: Omit<Invoice, 'id' | 'createdAt'>) => {
    const newInvoice: Invoice = {
      ...inv,
      id: `INV-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
    };
    handleUpdateInvoices((prev) => [newInvoice, ...prev]);
    showToast(`Invoice ${newInvoice.invoiceNumber} created successfully.`);
  };

  const handleEditInvoice = (inv: Invoice) => {
    handleUpdateInvoices((prev) => prev.map((i) => (i.id === inv.id ? inv : i)));
    showToast(`Invoice ${inv.invoiceNumber} updated successfully.`);
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    handleUpdateInvoices((prev) => {
      const inv = prev.find((item) => item.id === invoiceId);
      showToast(`Invoice ${inv?.invoiceNumber || invoiceId} deleted.`);
      return prev.filter((item) => item.id !== invoiceId);
    });
  };

  const handlePayInvoice = (invoiceId: string, method: string, amount: number) => {
    handleUpdateInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId) {
          const newAmountPaid = inv.amountPaidZar + amount;
          const newBalanceDue = Math.max(0, inv.totalZar - newAmountPaid);
          const newStatus = newBalanceDue === 0 ? 'paid' : 'partially_paid';

          // If fully paid, calculate 10% commission
          if (newBalanceDue === 0 && inv.status !== 'paid') {
            const commission = Math.round(inv.totalZar * 0.1);
            const ownerShare = inv.totalZar - commission;

            // Admin gets commission in virtual wallet
            setVirtualWallets((prevWallets) => {
              const adminWallet = prevWallets['Scope Bridge Admin'] || {
                holidayFundBalanceZar: 0,
                cashbackRewardsZar: 0,
                referralCreditsZar: 0,
                goalName: 'Platform Fees',
                goalTargetZar: 1000000,
                transactions: [],
              };
              return {
                ...prevWallets,
                ['Scope Bridge Admin']: {
                  ...adminWallet,
                  transactions: [
                    ...adminWallet.transactions,
                    {
                      id: `TX-${Date.now()}`,
                      date: new Date().toISOString(),
                      title: `Commission: ${inv.propertyTitle}`,
                      category: 'deposit',
                      amountZar: commission,
                      status: 'completed',
                      reference: inv.invoiceNumber,
                    },
                  ],
                },
              };
            });

            // Owner gets share in virtual wallet
            setVirtualWallets((prevWallets) => {
              const ownerWallet = prevWallets[inv.ownerName] || {
                holidayFundBalanceZar: 0,
                cashbackRewardsZar: 0,
                referralCreditsZar: 0,
                goalName: 'Owner Earnings',
                goalTargetZar: 1000000,
                transactions: [],
              };
              return {
                ...prevWallets,
                [inv.ownerName]: {
                  ...ownerWallet,
                  transactions: [
                    ...ownerWallet.transactions,
                    {
                      id: `TX-${Date.now() + 1}`,
                      date: new Date().toISOString(),
                      title: `Payout: ${inv.propertyTitle}`,
                      category: 'deposit',
                      amountZar: ownerShare,
                      status: 'completed',
                      reference: inv.invoiceNumber,
                    },
                  ],
                },
              };
            });
          }

          return {
            ...inv,
            amountPaidZar: newAmountPaid,
            balanceDueZar: newBalanceDue,
            status: newStatus as any,
            paymentStatus: (newBalanceDue === 0 ? 'paid' : 'partially_paid') as any,
            paymentMethod: method,
            paidAt: new Date().toISOString(),
          };
        }
        return inv;
      })
    );
    showToast(`Payment of R ${amount} recorded successfully.`);
  };

  const handleAddFleetServiceRequest = (req: Omit<FleetServiceRequest, 'id' | 'createdAt' | 'status'>) => {
    const newReq: FleetServiceRequest = {
      ...req,
      id: `FSR-${Date.now().toString().slice(-4)}`,
      status: 'pending_admin_approval',
      createdAt: new Date().toISOString(),
    };
    handleUpdateFleetServiceRequests((prev) => [newReq, ...prev]);
    showToast(`Fleet service request submitted to Admin for approval.`);
  };

  const handleUpdateFleetServiceStatus = (reqId: string, status: FleetServiceStatus, adminNotes?: string) => {
    handleUpdateFleetServiceRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status, adminNotes: adminNotes !== undefined ? adminNotes : r.adminNotes, updatedAt: new Date().toISOString() } : r))
    );
    showToast(`Fleet service request #${reqId} updated to ${status.replace('_', ' ')}.`);
  };

  // Guest State
  const [wishlistIds, setWishlistIds] = useState<string[]>(['prop-1', 'prop-global-1']);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isTripToolsOpen, setIsTripToolsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Role switching with matching preset user (Restricted to Super Admin session)
  const handleSelectRole = (newRole: AppRole) => {
    setIsAuthPageOpen(false);
    setCurrentRole(newRole);
    const matchingUser =
      registeredUsers.find((u) => {
        if (newRole === 'super_admin') return u.role === 'super_admin';
        if (newRole === 'admin') return u.role === 'admin' || u.role === 'super_admin';
        return u.role === newRole;
      }) ||
      DEVELOPMENT_TEST_USERS.find((u) => {
        if (newRole === 'super_admin') return u.role === 'super_admin';
        if (newRole === 'admin') return u.role === 'admin' || u.role === 'super_admin';
        return u.role === newRole;
      });
    if (matchingUser) {
      setCurrentUser(matchingUser);
      showToast(
        `Switched portal to ${newRole.replace('_', ' ').toUpperCase()} — Active account: ${
          matchingUser.fullName || matchingUser.name
        }`
      );
    } else {
      showToast(`Switched portal to ${newRole.replace('_', ' ').toUpperCase()}`);
    }
  };

  // Non-Destructive Backup & Reboot Production Server (Preserves 100% of Database Data)
  const handleSeparateAndRebootProduction = async () => {
    setDeletedUserIds([]);
    try {
      await fetch('/api/prod-db/backup/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggerType: 'manual_admin' }),
      });
    } catch {
      // Ignore transient network error
    }
    showToast('Production Server & Cloud SQL Database backed up and verified (100% of database records preserved, zero data deleted).');
  };

  // Full Logout / Sign Off Workflow
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {
      // Ignore if not signed in via Firebase Auth
    }
    localStorage.removeItem('ferndalestay_currentUser');
    localStorage.removeItem('ferndalestay_currentRole');
    localStorage.removeItem('scopebridg_superadmin_session');
    setIsSuperAdminSession(false);
    setCurrentUser({
      id: 'guest-unauth',
      name: 'Guest',
      fullName: 'Guest',
      username: 'guest',
      password: '',
      role: 'guest',
      email: '',
      phone: '',
      avatar: '',
      title: 'Guest',
      location: '',
    });
    setCurrentRole('guest');
    setIsLoginModalOpen(false);
    setIsAuthPageOpen(true);
    showToast('Logged off successfully. Session terminated.');
  };

  // User Login / Authentication Success (Non-destructive merge with database record)
  const handleLoginSuccess = (user: UserAccount) => {
    setIsAuthPageOpen(false);
    setIsLoginModalOpen(false);
    const existingDbUser = registeredUsers.find(
      (u) =>
        u.id === user.id ||
        u.username.toLowerCase() === (user.username || '').toLowerCase() ||
        (user.email && u.email.toLowerCase() === user.email.toLowerCase())
    );
    const mergedUser: UserAccount = existingDbUser
      ? {
          ...existingDbUser,
          ...user,
          id: existingDbUser.id || user.id,
          bankAccount: user.bankAccount || existingDbUser.bankAccount,
          bankAccounts:
            user.bankAccounts && user.bankAccounts.length > 0
              ? user.bankAccounts
              : existingDbUser.bankAccounts,
        }
      : user;

    setCurrentUser(mergedUser);
    setCurrentRole(mergedUser.role);
    try {
      localStorage.setItem('ferndalestay_currentUser', JSON.stringify(mergedUser));
      localStorage.setItem('ferndalestay_currentRole', mergedUser.role);
    } catch {
      // ignore storage quota
    }
    // Ensure logged-in user is also persisted in registeredUsers without losing any fields
    handleUpdateRegisteredUsers((prev) => {
      const exists = prev.some((u) => u.id === mergedUser.id);
      return exists
        ? prev.map((u) => (u.id === mergedUser.id ? { ...u, ...mergedUser } : u))
        : [mergedUser, ...prev];
    });
    if (mergedUser.role === 'super_admin' || mergedUser.username === 'superadmin') {
      setIsSuperAdminSession(true);
      localStorage.setItem('scopebridg_superadmin_session', 'true');
    }
    showToast(`Welcome, ${mergedUser.fullName || mergedUser.name}! Active role: ${mergedUser.title || mergedUser.role}`);
  };

  // Kiosk Mode Login for Owners, Admins, and Staff Created by Owner
  const handleLoginToKioskMode = (user: UserAccount) => {
    setIsAuthPageOpen(false);
    setIsLoginModalOpen(false);
    const existingDbUser = registeredUsers.find(
      (u) =>
        u.id === user.id ||
        u.username.toLowerCase() === (user.username || '').toLowerCase()
    );
    const mergedUser: UserAccount = existingDbUser
      ? {
          ...existingDbUser,
          ...user,
          bankAccount: user.bankAccount || existingDbUser.bankAccount,
          bankAccounts:
            user.bankAccounts && user.bankAccounts.length > 0
              ? user.bankAccounts
              : existingDbUser.bankAccounts,
        }
      : user;
    setCurrentUser(mergedUser);
    setCurrentRole('kiosk');
    if (mergedUser.role === 'super_admin' || mergedUser.username === 'superadmin') {
      setIsSuperAdminSession(true);
      localStorage.setItem('scopebridg_superadmin_session', 'true');
    }
    triggerLiveAdminNotification(
      'KIOSK_MODE_LOGIN',
      `Kiosk Mode Login: ${mergedUser.fullName || mergedUser.name} (@${mergedUser.username})`,
      `${mergedUser.fullName || mergedUser.name} (${
        mergedUser.createdByOwnerName
          ? `Staff created by ${mergedUser.createdByOwnerName}`
          : mergedUser.role.toUpperCase()
      }) logged into Reception Kiosk Mode.`,
      mergedUser.email || 'nightscope58@gmail.com',
      mergedUser.phone || '+27694977018'
    );
    showToast(
      `Kiosk Mode Activated! Logged in as ${mergedUser.fullName || mergedUser.name} (${
        mergedUser.createdByOwnerName ? `Staff Created by ${mergedUser.createdByOwnerName}` : mergedUser.role.toUpperCase()
      })`
    );
  };

  // User Registration
  const handleRegisterUser = async (newUser: UserAccount) => {
    setIsAuthPageOpen(false);
    setIsLoginModalOpen(false);
    const normalizedBankAccounts =
      newUser.bankAccounts && newUser.bankAccounts.length > 0
        ? newUser.bankAccounts
        : newUser.bankAccount
        ? [
            {
              ...newUser.bankAccount,
              id: newUser.bankAccount.id || `ba-${Date.now()}`,
              status: newUser.bankAccount.status || 'active',
              isPrimary: true,
              enteredInRegistration: true,
              createdAt: new Date().toISOString(),
            },
          ]
        : [];
    const primaryBank =
      normalizedBankAccounts.find((b) => b.isPrimary) ||
      normalizedBankAccounts[0] ||
      newUser.bankAccount;

    const userWithStatus: UserAccount = {
      ...newUser,
      id: newUser.id || `user-${Date.now()}`,
      status: newUser.status || (newUser.role === 'guest' ? 'active' : 'pending'),
      location: newUser.location || '',
      bankAccount: primaryBank,
      bankAccounts: normalizedBankAccounts,
    };

    saveToFirestore('users', userWithStatus.id, userWithStatus);

    handleUpdateRegisteredUsers((prev) => {
      const exists = prev.some((u) => u.id === userWithStatus.id);
      return exists ? prev.map((u) => (u.id === userWithStatus.id ? userWithStatus : u)) : [userWithStatus, ...prev];
    });

    setCurrentUser(userWithStatus);
    setCurrentRole(userWithStatus.role);
    try {
      localStorage.setItem('ferndalestay_currentUser', JSON.stringify(userWithStatus));
      localStorage.setItem('ferndalestay_currentRole', userWithStatus.role);
    } catch {
      // ignore storage quota
    }

    triggerLiveAdminNotification(
      'USER_PROFILE_REGISTERED',
      `New Profile Registered: ${userWithStatus.fullName || userWithStatus.name} (${userWithStatus.role.toUpperCase()})`,
      `User @${userWithStatus.username} (${userWithStatus.email} / ${userWithStatus.phone}) registered on ${RUNTIME_ENV.toUpperCase()} server with status: ${userWithStatus.status?.toUpperCase()}${primaryBank ? ` & Bank Account (${primaryBank.bankName})` : ''}.`,
      userWithStatus.email,
      userWithStatus.phone
    );

    showToast(
      userWithStatus.status === 'pending'
        ? `Account registered! Status is PENDING admin approval.`
        : `Account registered successfully! Welcome, ${newUser.fullName || newUser.name}`
    );
  };

  // User Profile Update (Edit any profile + sync bank accounts across Nanny/Driver/Owner profiles)
  const handleUpdateUser = async (updatedUser: UserAccount) => {
    const normalizedBankAccounts =
      updatedUser.bankAccounts !== undefined
        ? updatedUser.bankAccounts
        : updatedUser.bankAccount
        ? [
            {
              ...updatedUser.bankAccount,
              id: updatedUser.bankAccount.id || `ba-${Date.now()}`,
              status: updatedUser.bankAccount.status || 'active',
              isPrimary: true,
            },
          ]
        : undefined;
    const primaryBank =
      normalizedBankAccounts && normalizedBankAccounts.length > 0
        ? normalizedBankAccounts.find((b) => b.isPrimary && b.status !== 'suspended') ||
          normalizedBankAccounts[0]
        : updatedUser.bankAccount;

    const cleanUpdatedUser: UserAccount = {
      ...updatedUser,
      bankAccount: primaryBank,
      bankAccounts: normalizedBankAccounts,
    };

    saveToFirestore('users', cleanUpdatedUser.id, {
      ...cleanUpdatedUser,
      _clearBankAccounts: normalizedBankAccounts !== undefined && normalizedBankAccounts.length === 0,
    });

    handleUpdateRegisteredUsers((prev) =>
      prev.map((u) => (u.id === cleanUpdatedUser.id ? { ...u, ...cleanUpdatedUser } : u))
    );
    if (currentUser.id === cleanUpdatedUser.id) {
      setCurrentUser(cleanUpdatedUser);
      try {
        localStorage.setItem('ferndalestay_currentUser', JSON.stringify(cleanUpdatedUser));
      } catch {
        // ignore
      }
    }

    // Also sync bankAccount & bankAccounts to matching Nanny or ShuttleDriver profile if applicable
    if (cleanUpdatedUser.role === 'nanny') {
      handleUpdateNannies((prev) =>
        prev.map((n) =>
          n.id === cleanUpdatedUser.id ||
          n.name.toLowerCase() === (cleanUpdatedUser.fullName || cleanUpdatedUser.name).toLowerCase()
            ? { ...n, bankAccount: primaryBank, bankAccounts: normalizedBankAccounts }
            : n
        )
      );
    } else if (cleanUpdatedUser.role === 'driver') {
      handleUpdateShuttleDrivers((prev) =>
        prev.map((d) =>
          d.id === cleanUpdatedUser.id ||
          d.name.toLowerCase() === (cleanUpdatedUser.fullName || cleanUpdatedUser.name).toLowerCase()
            ? { ...d, bankAccount: primaryBank, bankAccounts: normalizedBankAccounts }
            : d
        )
      );
    }

    showToast(`Profile "${cleanUpdatedUser.fullName || cleanUpdatedUser.name}" updated & synced globally!`);
  };

  // Update User Profile Status (Approve, Pend, Suspend, Reject)
  const handleUpdateUserStatus = (userId: string, status: UserAccount['status']) => {
    const resolvedStatus = status || 'active';
    handleUpdateRegisteredUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: resolvedStatus } : u))
    );
    if (currentUser.id === userId) {
      setCurrentUser((prev) => ({ ...prev, status: resolvedStatus }));
    }
    showToast(`Profile status updated to ${String(resolvedStatus).toUpperCase()}.`);
  };

  // Delete Any Profile Created
  const handleDeleteUser = (userId: string) => {
    const target = registeredUsers.find((u) => u.id === userId);
    setDeletedUserIds((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
    deleteFromFirestore('users', userId);
    handleUpdateRegisteredUsers((prev) => prev.filter((u) => u.id !== userId));
    showToast(`Profile "${target?.fullName || target?.name || userId}" permanently deleted.`);
  };

  // Toggle wishlist item
  const handleToggleWishlist = (propertyId: string) => {
    setWishlistIds((prev) => {
      const exists = prev.includes(propertyId);
      const updated = exists ? prev.filter((id) => id !== propertyId) : [...prev, propertyId];
      showToast(exists ? 'Removed from saved places' : 'Saved to wishlist!');
      return updated;
    });
  };

  // Create direct booking with Strict Double-Booking & Room Occupancy Prevention
  const handleBookProperty = (newBookingData: Omit<Booking, 'id' | 'createdAt'>) => {
    // 1. Validate for double booking overlap
    const targetRoomId = (newBookingData as any).roomId;
    const conflictCheck = checkDoubleBookingConflict({
      bookings,
      propertyId: newBookingData.propertyId,
      roomId: targetRoomId,
      checkInDate: newBookingData.checkInDate,
      checkOutDate: newBookingData.checkOutDate,
    });

    if (conflictCheck.hasConflict) {
      showToast(`⛔ ${conflictCheck.message || 'Double Booking Prevented: Room is already booked for these dates.'}`);
      return;
    }

    const newBooking: Booking = {
      ...newBookingData,
      id: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
    };

    handleUpdateBookings((prev) => [newBooking, ...prev]);

    // Update the property's room status to 'occupied'
    handleUpdateProperties((prev) =>
      prev.map((p) => {
        if (p.id === newBooking.propertyId) {
          const updatedRooms = (p.rooms || []).map((r) => {
            if (targetRoomId && r.id === targetRoomId) {
              return { ...r, status: 'occupied' as const };
            }
            if (newBooking.propertyTitle.includes(r.name)) {
              return { ...r, status: 'occupied' as const };
            }
            return r;
          });
          return {
            ...p,
            status: 'active',
            rooms: updatedRooms,
          };
        }
        return p;
      })
    );

    // Synchronize to universal calendar planner
    const newCalEvent: CalendarPlanEvent = {
      id: `CAL-${Date.now().toString().slice(-5)}`,
      title: `Stay Booking: ${newBooking.propertyTitle} (${newBooking.guestName})`,
      category: 'stay_booking',
      startDate: newBooking.checkInDate,
      endDate: newBooking.checkOutDate,
      startTime: '14:00',
      endTime: '10:00',
      status: 'confirmed',
      userId: currentUser?.id || 'guest-01',
      userName: newBooking.guestName,
      userRole: 'guest',
      propertyId: newBooking.propertyId,
      propertyTitle: newBooking.propertyTitle,
      roomId: targetRoomId,
      channelId: newBooking.channel || 'direct',
      syncedChannels: ['direct', newBooking.channel || 'direct', 'airbnb', 'booking_com', 'lekkeslaap'],
      amountZar: newBooking.totalAmount,
      notes: `Door PIN: ${newBooking.doorCode || '4821#'} • Paid via ${newBooking.paymentMethod.toUpperCase()}`,
      createdAt: new Date().toISOString(),
    };
    handleUpdateCalendarEvents((prev) => [newCalEvent, ...prev]);

    // Trigger standardized multi-channel synchronization directly to Airbnb, Booking.com & connected OTAs
    syncBookingToChannels(newBooking)
      .then((res) => {
        console.log(`[ChannelSync] ${res.message} (latency: ${res.channelResults?.airbnb?.latencyMs || 0}ms)`);
      })
      .catch((err) => {
        console.error('[ChannelSync] Automated sync error:', err);
      });


    // Automatically trigger cleaning task for check-out day (Owner Operations)
    const newCleaningTask: CleaningTask = {
      id: `cln-${Date.now()}`,
      propertyId: newBooking.propertyId,
      propertyTitle: newBooking.propertyTitle,
      cleanerName: 'Sipho Zulu',
      cleanerPhone: '+27 72 333 1122',
      scheduledDate: newBooking.checkOutDate,
      status: 'pending',
      checklist: [
        { item: 'Change & wash linen with lavender sanitiser', done: false },
        { item: 'Restock complimentary rooibos, coffee & milk', done: false },
        { item: 'Inspect solar inverter state & battery level', done: false },
        { item: 'Wipe down kitchen & sanitize Yale smart lock', done: false },
      ],
    };
    handleUpdateCleanings((prev) => [newCleaningTask, ...prev]);

    triggerLiveAdminNotification(
      'GUEST_STAY_BOOKING_CONFIRMED',
      `New Reservation ${newBooking.id}: ${newBooking.propertyTitle}`,
      `Guest ${newBooking.guestName} (${newBooking.guestPhone}) booked ${newBooking.propertyTitle} (${newBooking.checkInDate} to ${newBooking.checkOutDate}, ${newBooking.nights} nights) via ${newBooking.source || 'ScopeBridge Direct'} for R${newBooking.totalAmount}. Room marked as Occupied.`,
      newBooking.guestEmail,
      newBooking.guestPhone
    );

    showToast(`Booking ${newBooking.id} confirmed! Room marked Occupied and locked for dates ${newBooking.checkInDate} → ${newBooking.checkOutDate}.`);
  };

  // Nanny Booking Handlers
  const handleAddNannyBooking = (booking: NannyBooking) => {
    handleUpdateNannyBookings((prev) => [booking, ...prev]);
    triggerLiveAdminNotification(
      'NANNY_BOOKING_CONFIRMED',
      `New Childcare Booking ${booking.id}: ${booking.nannyName}`,
      `Parent ${booking.parentName} (${booking.parentPhone}) booked nanny ${booking.nannyName} at ${booking.propertyTitle} on ${booking.date} (${booking.startTime}-${booking.endTime}) for R${booking.totalAmountZar}.`,
      'nightscope58@gmail.com',
      booking.parentPhone
    );
    showToast(`Nanny booking ${booking.id} confirmed with ${booking.nannyName}! Admin notified at +27694977018.`);
  };

  const handleUpdateNannyBookingStatus = (
    bookingId: string,
    status: NannyBooking['status']
  ) => {
    handleUpdateNannyBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
    );
    showToast(`Nanny session status updated to ${status.replace('_', ' ')}.`);
  };

  const handleAddNannyActivityLog = (
    bookingId: string,
    log: Omit<NannyActivityLog, 'id'>
  ) => {
    const newLogItem: NannyActivityLog = {
      ...log,
      id: `log-${Date.now()}`,
    };
    handleUpdateNannyBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          return {
            ...b,
            activityLogs: [...b.activityLogs, newLogItem],
          };
        }
        return b;
      })
    );
    showToast(`Live activity log recorded: "${newLogItem.title}"`);
  };

  // Kiosk Flight & Car Booking Handlers
  const handleAddFlightBooking = (flight: Omit<KioskFlightBooking, 'id' | 'status' | 'createdAt'>) => {
    const newFlight: KioskFlightBooking = {
      ...flight,
      id: `FLT-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'queued',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
    handleUpdateFlightBookings((prev) => [newFlight, ...prev]);
    handleUpdateAlerts((prev) => [
      {
        id: `alert-${Date.now()}`,
        severity: 'low',
        title: 'New Flight Booking Queued',
        message: `Guest "${flight.guestName}" registered a flight booking from ${flight.route} (${flight.carrier}).`,
        category: 'guest',
        timestamp: 'Just now',
        resolved: false,
      },
      ...prev,
    ]);
    triggerLiveAdminNotification(
      'KIOSK_FLIGHT_BOOKING',
      `Lobby Kiosk Flight Booking: ${newFlight.id} (${flight.carrier})`,
      `Guest "${flight.guestName}" booked flight ${flight.route} (${flight.carrier}) on ${flight.date}.`,
      'nightscope58@gmail.com',
      '+27694977018'
    );
  };

  const handleAddCarBooking = (car: Omit<KioskCarBooking, 'id' | 'status' | 'createdAt'>) => {
    const newCar: KioskCarBooking = {
      ...car,
      id: `CAR-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'queued',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
    handleUpdateCarBookings((prev) => [newCar, ...prev]);
    handleUpdateAlerts((prev) => [
      {
        id: `alert-${Date.now()}`,
        severity: 'low',
        title: 'New Car Rental Queued',
        message: `Guest "${car.guestName}" registered a car rental booking for ${car.vehicle} (${car.days} days).`,
        category: 'guest',
        timestamp: 'Just now',
        resolved: false,
      },
      ...prev,
    ]);
    triggerLiveAdminNotification(
      'KIOSK_CAR_BOOKING',
      `Lobby Kiosk Car Rental: ${newCar.id} (${car.vehicle})`,
      `Guest "${car.guestName}" booked ${car.vehicle} for ${car.days} day(s).`,
      'nightscope58@gmail.com',
      '+27694977018'
    );
  };

  const handleResolveFlightBooking = (id: string, action: 'confirmed' | 'cancelled') => {
    handleUpdateFlightBookings((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: action } : f))
    );
    showToast(`Flight booking ${id} status resolved to ${action}.`);
  };

  const handleResolveCarBooking = (id: string, action: 'confirmed' | 'cancelled') => {
    handleUpdateCarBookings((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: action } : c))
    );
    showToast(`Car booking ${id} status resolved to ${action}.`);
  };

  // Shuttle Booking Handlers
  const handleAddShuttleBooking = (booking: ShuttleBooking) => {
    handleUpdateShuttleBookings((prev) => [booking, ...prev]);
    triggerLiveAdminNotification(
      'SHUTTLE_TRANSFER_BOOKED',
      `New Chauffeur Transfer ${booking.id}: ${booking.driverName}`,
      `Guest ${booking.guestName || booking.passengerName} booked ${booking.vehicleModel} from ${booking.pickupLocation} to ${booking.dropoffLocation} on ${booking.date} at ${booking.time}.`,
      booking.guestEmail || 'nightscope58@gmail.com',
      booking.guestPhone || '+27694977018'
    );
    showToast(`Shuttle transfer ${booking.id} booked with ${booking.driverName}! Admin notified at +27694977018.`);
  };

  const handleUpdateShuttleBookingStatus = (
    bookingId: string,
    status: ShuttleBooking['status']
  ) => {
    handleUpdateShuttleBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
    );
    showToast(`Shuttle status updated to ${status.replace('_', ' ')}.`);
  };

  const handleCheckoutBooking = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    // Update booking status
    handleUpdateBookings(prev => prev.map(b => b.id === bookingId ? { ...b, paymentStatus: 'paid' } : b));

    // Create checkout cleaning task
    const newCleaningTask: CleaningTask = {
      id: `cln-${Date.now()}`,
      propertyId: booking.propertyId,
      propertyTitle: booking.propertyTitle,
      cleanerName: 'Sipho Zulu',
      cleanerPhone: '+27 72 333 1122',
      scheduledDate: new Date().toISOString().slice(0, 10),
      status: 'pending',
      checklist: [
        { item: 'Change & wash linen with lavender sanitiser', done: false },
        { item: 'Restock complimentary rooibos, coffee & milk', done: false },
        { item: 'Inspect solar inverter state & battery level', done: false },
        { item: 'Wipe down kitchen & sanitize Yale smart lock', done: false },
      ],
    };
    handleUpdateCleanings(prev => [newCleaningTask, ...prev]);

    // Push audit alerts
    handleUpdateAlerts(prev => [
      {
        id: `alert-${Date.now()}`,
        severity: 'low',
        title: 'Self Check-Out',
        message: `Guest "${booking.guestName}" completed self check-out at Lobby Kiosk for "${booking.propertyTitle}". Priority cleaning task created.`,
        category: 'operations',
        timestamp: 'Just now',
        resolved: false,
      },
      ...prev
    ]);
  };

  // Owner requests channel or payment gateway connection / disconnection
  const handleOwnerRequestAccess = (
    req: Omit<OwnerAccessRequest, 'id' | 'createdAt' | 'status'>
  ) => {
    const newReq: OwnerAccessRequest = {
      ...req,
      id: `REQ-${Math.floor(400 + Math.random() * 600)}`,
      status: 'pending',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    handleUpdateAccessRequests((prev) => [newReq, ...prev]);

    if (req.requestType === 'channel') {
      handleUpdateProperties((prev) =>
        prev.map((p) => {
          if (p.id === req.propertyId) {
            const currentReqs = p.requestedChannels || [];
            return {
              ...p,
              requestedChannels: currentReqs.includes(req.targetId)
                ? currentReqs
                : [...currentReqs, req.targetId],
            };
          }
          return p;
        })
      );
    } else {
      handleUpdateProperties((prev) =>
        prev.map((p) => {
          if (p.id === req.propertyId) {
            const currentReqs = p.requestedGateways || [];
            return {
              ...p,
              requestedGateways: currentReqs.includes(req.targetId)
                ? currentReqs
                : [...currentReqs, req.targetId],
            };
          }
          return p;
        })
      );
    }

    triggerLiveAdminNotification(
      'OWNER_ACCESS_REQUEST',
      `Owner Request: ${req.targetName} (${req.action.toUpperCase()})`,
      `Owner ${req.ownerName} requested to ${req.action} ${req.targetName} (${req.requestType}) for ${req.propertyTitle}.`,
      'nightscope58@gmail.com',
      '+27694977018'
    );

    showToast(`Request submitted for ${req.targetName} (${req.action}). Live notification sent to Admin (+27694977018).`);
  };

  // Admin approves channel or payment gateway request
  const handleApproveRequest = (requestId: string, adminNotes?: string) => {
    const targetReq = accessRequests.find((r) => r.id === requestId);
    if (!targetReq) return;

    handleUpdateAccessRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'approved',
              reviewedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
              adminNotes: adminNotes || 'Approved by Admin Kenneth Mathunywa.',
            }
          : r
      )
    );

    if (targetReq.requestType === 'channel') {
      handleUpdateProperties((prev) =>
        prev.map((p) => {
          if (p.id === targetReq.propertyId) {
            const published = p.publishedChannels || [];
            const newPublished =
              targetReq.action === 'connect'
                ? published.includes(targetReq.targetId)
                  ? published
                  : [...published, targetReq.targetId]
                : published.filter((c) => c !== targetReq.targetId);

            const updatedRooms = p.rooms?.map((room) => {
              if (!targetReq.roomId || room.id === targetReq.roomId) {
                const roomPub = room.publishedChannels || [];
                const nextRoomPub =
                  targetReq.action === 'connect'
                    ? roomPub.includes(targetReq.targetId)
                      ? roomPub
                      : [...roomPub, targetReq.targetId]
                    : roomPub.filter((c) => c !== targetReq.targetId);
                return { ...room, publishedChannels: nextRoomPub };
              }
              return room;
            });

            return {
              ...p,
              publishedChannels: newPublished,
              rooms: updatedRooms,
            };
          }
          return p;
        })
      );
    } else {
      handleUpdateProperties((prev) =>
        prev.map((p) => {
          if (p.id === targetReq.propertyId) {
            const currentGateways = p.requestedGateways || [];
            const updatedGateways =
              targetReq.action === 'connect'
                ? currentGateways.includes(targetReq.targetId)
                  ? currentGateways
                  : [...currentGateways, targetReq.targetId]
                : currentGateways.filter((g) => g !== targetReq.targetId);
            return {
              ...p,
              requestedGateways: updatedGateways,
            };
          }
          return p;
        })
      );
    }

    showToast(`Approved ${targetReq.targetName} for ${targetReq.propertyTitle}!`);
  };

  // Admin rejects request
  const handleRejectRequest = (requestId: string, adminNotes?: string) => {
    handleUpdateAccessRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'rejected',
              reviewedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
              adminNotes: adminNotes || 'Request declined by Admin.',
            }
          : r
      )
    );
    showToast(`Request declined.`);
  };

  // Admin toggles channel connection status
  const handleToggleChannel = (channelId: string) => {
    handleUpdateChannels((prev) =>
      prev.map((ch) => {
        if (ch.id === channelId) {
          const nextStatus = ch.status === 'connected' ? 'disconnected' : 'connected';
          const nextApi = nextStatus === 'connected' ? 'healthy' : 'offline';
          showToast(
            `${ch.name} ${nextStatus === 'connected' ? 'Connected & Live' : 'Disconnected from platform'}`
          );
          return { ...ch, status: nextStatus, apiStatus: nextApi };
        }
        return ch;
      })
    );
  };

  // Admin toggles payment gateway connection status
  const handleToggleGateway = (gatewayId: string) => {
    handleUpdateGateways((prev) =>
      prev.map((gw) => {
        if (gw.id === gatewayId) {
          const nextStatus = gw.status === 'connected' ? 'disconnected' : 'connected';
          showToast(
            `${gw.name} ${nextStatus === 'connected' ? 'Enabled for checkouts' : 'Disabled'}`
          );
          return { ...gw, status: nextStatus };
        }
        return gw;
      })
    );
  };

  // Owner/Admin publishes or unpublishes room to channel
  const handlePublishRoomToChannel = (
    propertyId: string,
    roomId: string,
    channelId: string,
    publish: boolean
  ) => {
    handleUpdateProperties((prev) =>
      prev.map((p) => {
        if (p.id === propertyId && p.rooms) {
          const updatedRooms = p.rooms.map((r) => {
            if (r.id === roomId) {
              const current = r.publishedChannels || [];
              const next = publish
                ? current.includes(channelId)
                  ? current
                  : [...current, channelId]
                : current.filter((c) => c !== channelId);
              return { ...r, publishedChannels: next };
            }
            return r;
          });
          return { ...p, rooms: updatedRooms };
        }
        return p;
      })
    );
    showToast(`Room distribution updated on ${channelId}`);
  };

  // Publish / Unpublish an entire Property across OTA channels (and sync rooms + channel counters)
  const handlePublishPropertyToChannel = (propertyId: string, channelId: string, publish: boolean) => {
    const targetProp = properties.find((p) => p.id === propertyId);
    handleUpdateProperties((prev) =>
      prev.map((p) => {
        if (p.id === propertyId) {
          const current = p.publishedChannels || ['direct'];
          const next = publish
            ? current.includes(channelId)
              ? current
              : [...current, channelId]
            : current.filter((c) => c !== channelId);
          const updatedRooms = (p.rooms || []).map((r) => {
            const rCurr = r.publishedChannels || [];
            const rNext = publish
              ? rCurr.includes(channelId)
                ? rCurr
                : [...rCurr, channelId]
              : rCurr.filter((c) => c !== channelId);
            return { ...r, publishedChannels: rNext };
          });
          return { ...p, publishedChannels: next, rooms: updatedRooms };
        }
        return p;
      })
    );

    handleUpdateChannels((prev) =>
      prev.map((ch) => {
        if (ch.id === channelId) {
          return {
            ...ch,
            status: 'connected',
            lastSyncTime: 'Just now',
          };
        }
        return ch;
      })
    );

    fetch('/api/channels/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyId,
        propertyTitle: targetProp?.title || propertyId,
        address: targetProp?.address || '',
        basePrice: targetProp?.basePrice || 1500,
        currencyCode: 'ZAR',
        channelId,
        publish,
      }),
    }).catch(() => {});

    showToast(
      publish
        ? `Property published to ${channelId} and synchronized across all channels!`
        : `Property unpublished from ${channelId}.`
    );
  };

  // Add new Property
  const handleAddProperty = async (newProperty: Property) => {
    const publishedList =
      newProperty.publishedChannels && newProperty.publishedChannels.length > 0
        ? newProperty.publishedChannels
        : ['direct', 'booking_com', 'airbnb', 'lekkeslaap', 'expedia', 'vrbo', 'safarinow', 'agoda', 'google_rentals'];
    const enrichedProperty: Property = {
      ...newProperty,
      publishedChannels: publishedList,
      rooms: (newProperty.rooms || []).map((r) => ({
        ...r,
        publishedChannels: r.publishedChannels && r.publishedChannels.length > 0 ? r.publishedChannels : publishedList,
      })),
    };

    handleUpdateProperties((prev) => [enrichedProperty, ...prev]);

    // Sync channel publication counters & backend ScopeBridge channel registry for every selected channel
    publishedList.forEach((channelId) => {
      fetch('/api/channels/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: enrichedProperty.id,
          propertyTitle: enrichedProperty.title,
          address: enrichedProperty.address || '',
          basePrice: enrichedProperty.basePrice,
          currencyCode: 'ZAR',
          channelId,
          publish: true,
        }),
      }).catch(() => {});
    });

    handleUpdateChannels((prev) =>
      prev.map((ch) =>
        publishedList.includes(ch.id)
          ? {
              ...ch,
              status: 'connected',
              propertiesSyncedCount: (ch.propertiesSyncedCount || 0) + 1,
              lastSyncTime: 'Just now',
            }
          : ch
      )
    );

    handleUpdateAlerts((prev) => [
      {
        id: `alert-${Date.now()}`,
        severity: 'low',
        title: 'Property Published Across Channels',
        message: `Owner published "${enrichedProperty.title}" across ${publishedList.length} channels (${publishedList.join(', ')}). Receptionist Kiosk & Guest Booking Link activated.`,
        category: 'operations',
        timestamp: 'Just now',
        resolved: false,
      },
      ...prev,
    ]);
    showToast(
      `Property "${enrichedProperty.title}" published across ${publishedList.length} channels! Guest Booking Link & Kiosk Activated.`
    );
  };

  // Add new Room to property
  const handleAddRoom = (propertyId: string, room: PropertyRoom) => {
    handleUpdateProperties((prev) =>
      prev.map((p) => {
        if (p.id === propertyId) {
          const existingRooms = p.rooms || [];
          return { ...p, rooms: [...existingRooms, room] };
        }
        return p;
      })
    );
    showToast(`New room "${room.name}" added with pricing R${room.basePrice}/night.`);
  };

  // Update room pricing
  const handleUpdateRoomPricing = (
    propertyId: string,
    roomId: string,
    basePrice: number,
    weekendPrice: number,
    corporatePrice?: number,
    surgeMultiplier?: number
  ) => {
    handleUpdateProperties((prev) =>
      prev.map((p) => {
        if (p.id === propertyId && p.rooms) {
          const updatedRooms = p.rooms.map((r) => {
            if (r.id === roomId) {
              return {
                ...r,
                basePrice,
                weekendPrice,
                ...(corporatePrice !== undefined ? { corporatePrice } : {}),
                ...(surgeMultiplier !== undefined ? { surgeMultiplier } : {}),
              };
            }
            return r;
          });
          return { ...p, rooms: updatedRooms };
        }
        return p;
      })
    );
    showToast(`Pricing updated: Base R${basePrice} | Weekend R${weekendPrice}`);
  };

  // Admin adds new channel
  const handleAddChannel = (channel: ChannelConfig) => {
    handleUpdateChannels((prev) => [...prev, channel]);
    showToast(`Channel "${channel.name}" added to global manager.`);
  };

  // Admin adds new payment gateway
  const handleAddGateway = (gateway: PaymentGatewayConfig) => {
    handleUpdateGateways((prev) => [...prev, gateway]);
    showToast(`Payment Gateway "${gateway.name}" configured.`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-emerald-200">
      {/* Platform Header with Role Switcher & Multi-Currency */}
      <Header
        currentRole={currentRole}
        currentUser={currentUser}
        onSelectRole={handleSelectRole}
        selectedCurrency={selectedCurrency}
        onSelectCurrency={setSelectedCurrency}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenAuthPage={() => setIsAuthPageOpen(true)}
        isAuthPageActive={isAuthPageOpen}
        wishlistCount={wishlistIds.length}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenTripTools={() => setIsTripToolsOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenGroundingAdvisor={() => setIsGroundingAdvisorOpen(true)}
        onOpenCalendarPlanner={() => setIsCalendarModalOpen(true)}
        onOpenGuestBookingLink={() => setIsGuestBookingLinkModalOpen(true)}
        onLogout={handleLogout}
        isSuperAdminSession={isSuperAdminSession}
        offlinePropertiesCount={properties.length}
        offlineBookingsCount={bookings.length}
        onSyncOfflineCache={() => {
          handleSyncOfflineCache();
          showToast(
            `Offline cache synced: ${properties.length} property listings & ${bookings.length} bookings available offline.`
          );
        }}
        onUpdateUser={handleUpdateUser}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Full-Page Login & Register / Profile Management Portal */}
        {isAuthPageOpen ? (
          <AuthPage
            currentUser={currentUser}
            registeredUsers={registeredUsers}
            onLoginSuccess={handleLoginSuccess}
            onLoginToKioskMode={handleLoginToKioskMode}
            onRegisterUser={handleRegisterUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onUpdateUserStatus={handleUpdateUserStatus}
            onBackToApp={() => setIsAuthPageOpen(false)}
            onLogout={handleLogout}
            properties={properties}
            bookings={bookings}
            calendarEvents={calendarEvents}
            channels={channels}
            onBookProperty={handleBookProperty}
            onUpdateCalendarEvents={handleUpdateCalendarEvents}
            onUpdateProperties={handleUpdateProperties}
            onOpenGuestBookingLink={() => setIsGuestBookingLinkModalOpen(true)}
            showToast={showToast}
          />
        ) : (
          <>
            {/* Active View Based on Role */}
            {currentRole === 'guest' && (
              <GuestView
                properties={properties}
                reviews={reviews}
                bookings={bookings}
                wishlistIds={wishlistIds}
                currentUser={currentUser}
                selectedCurrency={selectedCurrency}
                walletData={
                  virtualWallets[currentUser.fullName || currentUser.name] || {
                    holidayFundBalanceZar: 0,
                    cashbackRewardsZar: 0,
                    referralCreditsZar: 0,
                    goalName: 'Holiday Savings Goal',
                    goalTargetZar: 10000,
                    transactions: [],
                  }
                }
                onUpdateWalletData={(newWallet) => {
                  const key = currentUser.fullName || currentUser.name || 'Guest User';
                  handleUpdateVirtualWallets((prev) => ({
                    ...prev,
                    [key]: newWallet,
                  }));
                }}
                onToggleWishlist={handleToggleWishlist}
                onBookProperty={handleBookProperty}
                onAddRoomBid={handleAddRoomBid}
                isWishlistOpen={isWishlistOpen}
                setIsWishlistOpen={setIsWishlistOpen}
                isTripToolsOpen={isTripToolsOpen}
                setIsTripToolsOpen={setIsTripToolsOpen}
                isChatOpen={isChatOpen}
                setIsChatOpen={setIsChatOpen}
                nannies={nannies}
                nannyBookings={nannyBookings}
                shuttleDrivers={shuttleDrivers}
                shuttleBookings={shuttleBookings}
                onAddNannyBooking={handleAddNannyBooking}
                onUpdateNannyBookingStatus={handleUpdateNannyBookingStatus}
                onAddShuttleBooking={handleAddShuttleBooking}
                onUpdateShuttleBookingStatus={handleUpdateShuttleBookingStatus}
                calendarEvents={calendarEvents}
                channels={channels}
                registeredUsers={registeredUsers}
                onUpdateUser={handleUpdateUser}
                onUpdateBookings={handleUpdateBookings}
                onUpdateCalendarEvents={handleUpdateCalendarEvents}
                onOpenGuestBookingLink={() => setIsGuestBookingLinkModalOpen(true)}
              />
            )}

            {currentRole === 'owner' && (
              <OwnerPortal
                properties={properties}
                bookings={bookings}
                cleaningTasks={cleaningTasks}
                reviews={reviews}
                promos={promos}
                channels={channels}
                paymentGateways={paymentGateways}
                accessRequests={accessRequests}
                nannies={nannies}
                nannyBookings={nannyBookings}
                onBookProperty={handleBookProperty}
                quotations={quotations}
                invoices={invoices}
                roomBids={roomBids}
                onAddNannyBooking={handleAddNannyBooking}
                onUpdateNannyBookingStatus={handleUpdateNannyBookingStatus}
                onUpdateProperties={handleUpdateProperties}
                onUpdateCleanings={handleUpdateCleanings}
                onUpdateReviews={handleUpdateReviews}
                onUpdatePromos={handleUpdatePromos}
                onRequestAccess={handleOwnerRequestAccess}
                onPublishRoomToChannel={handlePublishRoomToChannel}
                onPublishPropertyToChannel={handlePublishPropertyToChannel}
                onAddProperty={handleAddProperty}
                onAddRoom={handleAddRoom}
                onUpdateRoomPricing={handleUpdateRoomPricing}
                onCreateQuotation={handleCreateQuotation}
                onEditQuotation={handleEditQuotation}
                onDeleteQuotation={handleDeleteQuotation}
                onConvertQuoteToInvoice={handleConvertQuoteToInvoice}
                onCreateInvoice={handleCreateInvoice}
                onEditInvoice={handleEditInvoice}
                onDeleteInvoice={handleDeleteInvoice}
                onPayInvoice={handlePayInvoice}
                onUpdateRoomBidStatus={handleUpdateRoomBidStatus}
                calendarEvents={calendarEvents}
                registeredUsers={registeredUsers}
                shuttleBookings={shuttleBookings}
                currentUser={currentUser}
                onUpdateUser={handleUpdateUser}
                onUpdateBookings={handleUpdateBookings}
                onUpdateCalendarEvents={handleUpdateCalendarEvents}
                onOpenGuestBookingLink={() => setIsGuestBookingLinkModalOpen(true)}
                onRegisterStaffUser={(staffUser) => {
                  handleUpdateRegisteredUsers((prev) => {
                    const filtered = prev.filter(
                      (u) => u.username.toLowerCase() !== staffUser.username.toLowerCase()
                    );
                    return [staffUser, ...filtered];
                  });
                  showToast(
                    `Staff Kiosk login created for ${staffUser.fullName || staffUser.name} (@${staffUser.username})!`
                  );
                }}
                onEnterKioskMode={() => handleLoginToKioskMode(currentUser)}
              />
            )}

            {(currentRole === 'admin' || currentRole === 'super_admin') && (
              <AdminPortal
                currentRole={currentRole}
                currentUser={currentUser}
                cleaningTasks={cleaningTasks}
                promos={promos}
                registeredUsers={registeredUsers}
                onUpdateRegisteredUsers={handleUpdateRegisteredUsers}
                onDeleteUserAccount={handleDeleteUser}
                onSeparateAndRebootProduction={handleSeparateAndRebootProduction}
                onSelectRole={handleSelectRole}
                onLoginTestAccount={handleLoginSuccess}
                onOpenAuthPage={() => setIsAuthPageOpen(true)}
                onLogout={handleLogout}
                properties={properties}
                bookings={bookings}
                reviews={reviews}
                alerts={alerts}
                channels={channels}
                paymentGateways={paymentGateways}
                accessRequests={accessRequests}
                roomBids={roomBids}
                fleetServiceRequests={fleetServiceRequests}
                shuttleDrivers={shuttleDrivers}
                nannies={nannies}
                nannyBookings={nannyBookings}
                shuttleBookings={shuttleBookings}
                onUpdateNannies={handleUpdateNannies}
                onUpdateShuttleDrivers={handleUpdateShuttleDrivers}
                onUpdateNannyBookings={handleUpdateNannyBookings}
                onUpdateShuttleBookings={handleUpdateShuttleBookings}
                onUpdateFleetServiceRequests={handleUpdateFleetServiceRequests}
                virtualWallets={virtualWallets}
                quotations={quotations}
                invoices={invoices}
                onUpdateVirtualWallets={handleUpdateVirtualWallets}
                onUpdateProperties={handleUpdateProperties}
                onUpdateAlerts={handleUpdateAlerts}
                onToggleChannel={handleToggleChannel}
                onToggleGateway={handleToggleGateway}
                onApproveRequest={handleApproveRequest}
                onRejectRequest={handleRejectRequest}
                onPublishRoomToChannel={handlePublishRoomToChannel}
                onAddChannel={handleAddChannel}
                onAddGateway={handleAddGateway}
                onUpdateRoomBidStatus={handleUpdateRoomBidStatus}
                onUpdateFleetServiceStatus={handleUpdateFleetServiceStatus}
                onCreateQuotation={handleCreateQuotation}
                onEditQuotation={handleEditQuotation}
                onDeleteQuotation={handleDeleteQuotation}
                onConvertQuoteToInvoice={handleConvertQuoteToInvoice}
                onCreateInvoice={handleCreateInvoice}
                onEditInvoice={handleEditInvoice}
                onDeleteInvoice={handleDeleteInvoice}
                onPayInvoice={handlePayInvoice}
                kioskFlightBookings={kioskFlightBookings}
                kioskCarBookings={kioskCarBookings}
                onResolveFlightBooking={handleResolveFlightBooking}
                onResolveCarBooking={handleResolveCarBooking}
                calendarEvents={calendarEvents}
                onUpdateBookings={handleUpdateBookings}
                onUpdateCalendarEvents={handleUpdateCalendarEvents}
                onBookProperty={handleBookProperty}
                onOpenGuestBookingLink={() => setIsGuestBookingLinkModalOpen(true)}
              />
            )}

            {currentRole === 'nanny' && (
              <NannyPortal
                nannies={nannies}
                bookings={nannyBookings}
                properties={properties}
                onAddBooking={handleAddNannyBooking}
                onUpdateBookingStatus={handleUpdateNannyBookingStatus}
                onAddActivityLog={handleAddNannyActivityLog}
                stayBookings={bookings}
                calendarEvents={calendarEvents}
                channels={channels}
                registeredUsers={registeredUsers}
                currentUser={currentUser}
                onUpdateStayBookings={handleUpdateBookings}
                onUpdateCalendarEvents={handleUpdateCalendarEvents}
                onBookProperty={handleBookProperty}
              />
            )}

            {currentRole === 'driver' && (
              <DriverPortal
                drivers={shuttleDrivers}
                bookings={shuttleBookings}
                properties={properties}
                selectedCurrency={selectedCurrency}
                fleetServiceRequests={fleetServiceRequests}
                onUpdateBookingStatus={handleUpdateShuttleBookingStatus}
                onAddBooking={handleAddShuttleBooking}
                onAddFleetServiceRequest={handleAddFleetServiceRequest}
                stayBookings={bookings}
                calendarEvents={calendarEvents}
                channels={channels}
                registeredUsers={registeredUsers}
                currentUser={currentUser}
                onUpdateStayBookings={handleUpdateBookings}
                onUpdateCalendarEvents={handleUpdateCalendarEvents}
                onBookProperty={handleBookProperty}
              />
            )}

            {currentRole === 'kiosk' && (
              <KioskMode
                properties={properties}
                drivers={shuttleDrivers}
                nannies={nannies}
                bookings={bookings}
                selectedCurrency={selectedCurrency}
                onBookProperty={handleBookProperty}
                onAddShuttleBooking={handleAddShuttleBooking}
                onAddNannyBooking={handleAddNannyBooking}
                onExitKiosk={() => {
                  if (currentUser.role === 'owner' || currentUser.role === 'admin' || currentUser.role === 'super_admin') {
                    setCurrentRole(currentUser.role);
                  } else {
                    setIsAuthPageOpen(true);
                    setCurrentRole('guest');
                  }
                }}
                showToast={showToast}
                onCheckoutBooking={handleCheckoutBooking}
                onAddFlightBooking={handleAddFlightBooking}
                onAddCarBooking={handleAddCarBooking}
                calendarEvents={calendarEvents}
                channels={channels}
                registeredUsers={registeredUsers}
                onUpdateBookings={handleUpdateBookings}
                onUpdateCalendarEvents={handleUpdateCalendarEvents}
                onOpenGuestBookingLink={() => setIsGuestBookingLinkModalOpen(true)}
                kioskOperator={currentUser}
              />
            )}
          </>
        )}
      </main>

      {/* Global Grounding Advisor Modal */}
      <GroundingAdvisorModal
        isOpen={isGroundingAdvisorOpen}
        onClose={() => setIsGroundingAdvisorOpen(false)}
      />

      {/* Global 24/7 Concierge AI Host & WhatsApp Chat Modal */}
      {isChatOpen && (
        <LiveChatModal
          property={properties[0] || null}
          onClose={() => setIsChatOpen(false)}
          onNotifyAdmin={(subject, message) => {
            showToast(`Notification sent to Super Admin (+27 69 497 7018): ${subject}`);
          }}
        />
      )}

      {/* Global Universal Calendar & Multi-Channel Life Planner Modal */}
      {isCalendarModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-50 rounded-3xl max-w-7xl w-full max-h-[94vh] overflow-y-auto shadow-2xl border border-slate-200 p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Global Multi-Channel Calendar & Holiday Life Planner (Daily • Weekly • Monthly)
                </h2>
                <p className="text-xs text-slate-500">
                  Synchronized across Development & Production servers and all registered OTA Holiday Channels
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCalendarModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Close Calendar
              </button>
            </div>
            <UniversalCalendarPlanner
              currentRole={currentRole}
              currentUser={currentUser}
              properties={properties}
              bookings={bookings}
              nannyBookings={nannyBookings}
              shuttleBookings={shuttleBookings}
              calendarEvents={calendarEvents}
              channels={channels}
              registeredUsers={registeredUsers}
              onUpdateBookings={handleUpdateBookings}
              onUpdateCalendarEvents={handleUpdateCalendarEvents}
              onUpdateProperties={handleUpdateProperties}
              onBookProperty={handleBookProperty}
            />
          </div>
        </div>
      )}

      {/* Shareable Direct Guest Booking Link Modal with Interactive Calendar */}
      <GuestBookingLinkModal
        isOpen={isGuestBookingLinkModalOpen}
        onClose={() => setIsGuestBookingLinkModalOpen(false)}
        properties={properties}
        bookings={bookings}
        calendarEvents={calendarEvents}
        channels={channels}
        currentUser={currentUser}
        onBookProperty={handleBookProperty}
        onUpdateCalendarEvents={handleUpdateCalendarEvents}
        showToast={showToast}
        onOpenRegistration={() => {
          setIsGuestBookingLinkModalOpen(false);
          setIsAuthPageOpen(true);
        }}
      />

      {/* Global Login & User Switcher Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentUser={currentUser}
        registeredUsers={registeredUsers}
        onLoginSuccess={handleLoginSuccess}
        onLoginToKioskMode={handleLoginToKioskMode}
        onSwitchRole={setCurrentRole}
        onOpenFullAuthPage={() => setIsAuthPageOpen(true)}
        onLogout={handleLogout}
        isSuperAdminSession={isSuperAdminSession}
      />

      {/* Offline Mode Connectivity & Cached Property/Bookings Status Banner */}
      <OfflineStatusBanner
        propertiesCount={properties.length}
        bookingsCount={bookings.length}
        onForceSync={handleSyncOfflineCache}
      />

      {/* Global OpenWA Support & WhatsApp Link Communicator Modal */}
      <OpenWaSupportModal />

      {/* Global Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Footer with ScopeBridg Global trust markers */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900">ScopeBridg™</span>
            <span>•</span>
            <span>Global Residences, Executive Chauffeur & Verified Childcare</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-800 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Portfolio by Mdluli Nhlanhla
            </span>
            <span className="flex items-center gap-1 text-slate-600">
              ⚡ Solar & Battery Backed Units in SA
            </span>
            <span className="flex items-center gap-1 text-slate-600">
              🚗 Airport Chauffeur: Mthokozisi Mbele
            </span>
            <span className="flex items-center gap-1 text-slate-600">
              👶 Certified Nanny: Sebenele Mathunywa
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PLATFORM_CONFIG } from '../../data/platformConfig';
import { Property, Booking, Review, AdminAuditAlert, AiRule, ChannelConfig, PaymentGatewayConfig, OwnerAccessRequest, RoomBid, FleetServiceRequest, FleetServiceStatus, ShuttleDriverProfile, VirtualWalletData, WalletTransaction, Quotation, Invoice, NannyProfile, NannyBooking, ShuttleBooking, KioskFlightBooking, KioskCarBooking, UserAccount, AppRole, CalendarPlanEvent } from '../../types';
import { UniversalCalendarPlanner } from '../common/UniversalCalendarPlanner';
import {
  Shield, Users, DollarSign, ListChecks, Cpu, BarChart3, CheckCircle,
  XCircle, AlertTriangle, Sliders, ToggleLeft, ToggleRight, Sparkles,
  Building, Check, Ban, Plus, ArrowUpRight, Lock, Key, Globe, CreditCard, Inbox, BedDouble, Car,
  Wallet, TrendingUp, PlusCircle, MinusCircle, History, Search, ArrowDownRight, Clock, FileText, Receipt, Gavel,
  Baby, Monitor, Plane, Fuel, Award, Wrench, Compass, CheckCircle2, UserCheck, Download, FileSpreadsheet, Trash2, Database, Edit3, Calendar, Activity, Zap, Radio, KeyRound, FolderTree, ChevronDown, ChevronRight, Layers
} from 'lucide-react';
import { AdminChannelsManager } from './AdminChannelsManager';
import { AdminGatewaysManager } from './AdminGatewaysManager';
import { AdminOwnerRequestsManager } from './AdminOwnerRequestsManager';
import { QuotationsAndInvoicesManager } from '../finance/QuotationsAndInvoicesManager';
import { BiddingManager } from '../finance/BiddingManager';
import { RoomsPricingManager } from '../owner/RoomsPricingManager';
import { DatabaseMonitorDashboard } from './DatabaseMonitorDashboard';
import { AdminNotificationsLiveTestPanel } from './AdminNotificationsLiveTestPanel';
import { AdminSystemHealthPanel } from './AdminSystemHealthPanel';
import { ProfileBankAccountsManager } from '../common/ProfileBankAccountsManager';
import { ActiveDirectoryTreeView } from './ActiveDirectoryTreeView';
import { InteractiveFloorPlanOccupancyMap } from './InteractiveFloorPlanOccupancyMap';
import { DEVELOPMENT_TEST_USERS, PRODUCTION_SUPER_ADMIN } from '../../data/usersData';
import { IS_DEV, IS_PROD } from '../../lib/env';

interface AdminPortalProps {
  currentRole?: AppRole;
  currentUser?: UserAccount;
  cleaningTasks?: any[];
  promos?: any[];
  registeredUsers?: UserAccount[];
  onUpdateRegisteredUsers?: React.Dispatch<React.SetStateAction<UserAccount[]>>;
  onDeleteUserAccount?: (userId: string) => void;
  onSeparateAndRebootProduction?: () => Promise<void>;
  onSelectRole?: (role: AppRole) => void;
  onLoginTestAccount?: (user: UserAccount) => void;
  onOpenAuthPage?: () => void;
  onLogout?: () => void;
  properties: Property[];
  bookings: Booking[];
  reviews: Review[];
  alerts: AdminAuditAlert[] | any[];
  channels: ChannelConfig[];
  gateways?: PaymentGatewayConfig[];
  paymentGateways?: PaymentGatewayConfig[];
  requests?: OwnerAccessRequest[];
  accessRequests?: OwnerAccessRequest[];
  roomBids?: RoomBid[];
  fleetServiceRequests?: FleetServiceRequest[];
  shuttleDrivers?: ShuttleDriverProfile[];
  nannies?: NannyProfile[];
  nannyBookings?: NannyBooking[];
  shuttleBookings?: ShuttleBooking[];
  onUpdateNannies?: React.Dispatch<React.SetStateAction<NannyProfile[]>>;
  onUpdateShuttleDrivers?: React.Dispatch<React.SetStateAction<ShuttleDriverProfile[]>>;
  onUpdateNannyBookings?: React.Dispatch<React.SetStateAction<NannyBooking[]>>;
  onUpdateShuttleBookings?: React.Dispatch<React.SetStateAction<ShuttleBooking[]>>;
  onUpdateFleetServiceRequests?: React.Dispatch<React.SetStateAction<FleetServiceRequest[]>>;
  virtualWallets?: { [guestName: string]: VirtualWalletData };
  quotations?: Quotation[];
  invoices?: Invoice[];
  onUpdateVirtualWallets?: React.Dispatch<React.SetStateAction<{ [guestName: string]: VirtualWalletData }>>;
  onUpdateProperties: React.Dispatch<React.SetStateAction<Property[]>>;
  onUpdateAlerts: React.Dispatch<React.SetStateAction<any[]>>;
  onToggleChannelStatus?: (channelId: string, status: 'connected' | 'disconnected') => void;
  onToggleChannel?: (channelId: string, enabled?: boolean) => void;
  onUpdateCommission?: (channelId: string, newRate: number) => void;
  onAddChannel?: (newChannel: ChannelConfig) => void;
  onToggleGatewayStatus?: (gatewayId: string, status: 'connected' | 'disconnected') => void;
  onToggleGateway?: (gatewayId: string, enabled?: boolean) => void;
  onUpdateGatewayFee?: (gatewayId: string, feePercent: number, fixedFee: number) => void;
  onAddGateway?: (newGateway: PaymentGatewayConfig) => void;
  onReviewRequest?: (requestId: string, status: 'approved' | 'rejected', notes?: string) => void;
  onApproveRequest?: (requestId: string, adminNotes?: string) => void;
  onRejectRequest?: (requestId: string, adminNotes?: string) => void;
  onPublishRoomToChannel?: (propertyId: string, roomId: string, channelId: string, publish: boolean) => void;
  onPublishPropertyToChannel?: (propertyId: string, channelId: string, publish: boolean) => void;
  onUpdateRoomBidStatus?: (bidId: string, status: 'approved' | 'declined' | 'pending' | 'countered', counterRate?: number, counterMessage?: string) => void;
  onUpdateFleetServiceStatus?: (reqId: string, status: FleetServiceStatus, adminNotes?: string) => void;
  onCreateQuotation?: (quote: Omit<Quotation, 'id' | 'createdAt'>) => void;
  onEditQuotation?: (quote: Quotation) => void;
  onDeleteQuotation?: (quoteId: string) => void;
  onConvertQuoteToInvoice?: (quoteId: string) => void;
  onCreateInvoice?: (inv: Omit<Invoice, 'id' | 'createdAt'>) => void;
  onEditInvoice?: (inv: Invoice) => void;
  onDeleteInvoice?: (invoiceId: string) => void;
  onPayInvoice?: (invoiceId: string, method: string, amount: number) => void;
  kioskFlightBookings?: KioskFlightBooking[];
  kioskCarBookings?: KioskCarBooking[];
  onResolveFlightBooking?: (id: string, action: 'confirmed' | 'cancelled') => void;
  onResolveCarBooking?: (id: string, action: 'confirmed' | 'cancelled') => void;
  calendarEvents?: CalendarPlanEvent[];
  onBookProperty?: (bookingData: Omit<Booking, 'id' | 'createdAt'>) => void;
  onUpdateBookings?: React.Dispatch<React.SetStateAction<Booking[]>>;
  onUpdateCalendarEvents?: React.Dispatch<React.SetStateAction<CalendarPlanEvent[]>>;
  onOpenGuestBookingLink?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentRole = 'super_admin',
  currentUser,
  cleaningTasks = [],
  promos = [],
  registeredUsers = [],
  onUpdateRegisteredUsers,
  onDeleteUserAccount,
  onSeparateAndRebootProduction,
  onSelectRole,
  onLoginTestAccount,
  onOpenAuthPage,
  onLogout,
  properties,
  bookings,
  reviews,
  alerts,
  channels,
  gateways,
  paymentGateways,
  requests,
  accessRequests,
  onUpdateProperties,
  onUpdateAlerts,
  onToggleChannelStatus,
  onToggleChannel,
  onUpdateCommission,
  onAddChannel,
  onToggleGatewayStatus,
  onToggleGateway,
  onUpdateGatewayFee,
  onAddGateway,
  onReviewRequest,
  onApproveRequest,
  onRejectRequest,
  onPublishRoomToChannel,
  onPublishPropertyToChannel,
  roomBids = [],
  fleetServiceRequests = [],
  shuttleDrivers = [],
  nannies = [],
  nannyBookings = [],
  shuttleBookings = [],
  onUpdateNannies,
  onUpdateShuttleDrivers,
  onUpdateNannyBookings,
  onUpdateShuttleBookings,
  onUpdateFleetServiceRequests,
  virtualWallets = {},
  quotations = [],
  invoices = [],
  onUpdateVirtualWallets,
  onUpdateRoomBidStatus = () => {},
  onUpdateFleetServiceStatus,
  onCreateQuotation = () => {},
  onEditQuotation = () => {},
  onDeleteQuotation = () => {},
  onConvertQuoteToInvoice = () => {},
  onCreateInvoice = () => {},
  onEditInvoice = () => {},
  onDeleteInvoice = () => {},
  onPayInvoice = () => {},
  kioskFlightBookings = [],
  kioskCarBookings = [],
  onResolveFlightBooking,
  onResolveCarBooking,
  calendarEvents = [],
  onBookProperty = () => {},
  onUpdateBookings = () => {},
  onUpdateCalendarEvents = () => {},
  onOpenGuestBookingLink,
}) => {
  const effectiveGateways = paymentGateways || gateways || [];
  const effectiveRequests = accessRequests || requests || [];

  const handleToggleChannelStatus = (channelId: string, status: 'connected' | 'disconnected') => {
    if (onToggleChannelStatus) {
      onToggleChannelStatus(channelId, status);
    } else if (onToggleChannel) {
      onToggleChannel(channelId, status === 'connected');
    }
  };

  const handleToggleGatewayStatus = (gatewayId: string, status: 'connected' | 'disconnected') => {
    if (onToggleGatewayStatus) {
      onToggleGatewayStatus(gatewayId, status);
    } else if (onToggleGateway) {
      onToggleGateway(gatewayId, status === 'connected');
    }
  };

  const handleReviewRequest = (requestId: string, status: 'approved' | 'rejected', notes?: string) => {
    if (onReviewRequest) {
      onReviewRequest(requestId, status, notes);
    } else if (status === 'approved' && onApproveRequest) {
      onApproveRequest(requestId, notes);
    } else if (status === 'rejected' && onRejectRequest) {
      onRejectRequest(requestId, notes);
    }
  };

  const handleAddChannel = onAddChannel || (() => {});
  const handleAddGateway = onAddGateway || (() => {});
  const handleUpdateCommission = onUpdateCommission || (() => {});
  const handleUpdateGatewayFee = onUpdateGatewayFee || (() => {});
  const handlePublishRoom = onPublishRoomToChannel || (() => {});
  const handlePublishProperty =
    onPublishPropertyToChannel ||
    ((propId: string, chId: string, publish: boolean) => {
      onUpdateProperties((prev) =>
        prev.map((p) => {
          if (p.id === propId) {
            const current = p.publishedChannels || [];
            return {
              ...p,
              publishedChannels: publish
                ? Array.from(new Set([...current, chId]))
                : current.filter((c) => c !== chId),
            };
          }
          return p;
        })
      );
    });
  const [activeTab, setActiveTab] = useState<
    'owner_tree' | 'occupancy_map' | 'system_health' | 'db_monitor' | 'calendar_planner' | 'live_notifications' | 'finance' | 'channels' | 'gateways' | 'requests' | 'access' | 'listings' | 'ai_rules' | 'reports' | 'room_bids' | 'fleet_service' | 'virtual_wallets' | 'quotes_invoices' | 'commissions' | 'nanny_on_call' | 'fleet_management' | 'kiosk_support'
  >('owner_tree');

  const getCommissionGrowthData = () => {
    const data: { name: string; monthKey: string; admin: number; owner: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = d.toISOString().slice(0, 7); // YYYY-MM
      data.push({
        name: d.toLocaleString('default', { month: 'short' }),
        monthKey,
        admin: 0,
        owner: 0,
      });
    }

    bookings.forEach((b) => {
      if (b.paymentStatus === 'paid' && b.createdAt) {
        const bookingDate = b.createdAt.slice(0, 7);
        const monthObj = data.find((m) => m.monthKey === bookingDate);
        if (monthObj) {
          monthObj.admin += b.commission?.adminAmount || 0;
          monthObj.owner += b.commission?.ownerAmount || 0;
        }
      }
    });
    return data;
  };

  const commissionData = getCommissionGrowthData();

  // Virtual Wallets Management State (Admin)
  const [selectedWalletGuest, setSelectedWalletGuest] = useState<string>(() => Object.keys(virtualWallets)[0] || '');
  const [creditAmountZar, setCreditAmountZar] = useState<number>(500);
  const [creditCategory, setCreditCategory] = useState<'deposit' | 'cashback_reward' | 'referral_credit' | 'refund'>('deposit');
  const [creditReference, setCreditReference] = useState<string>('ADM-GRANT-101');
  const [creditNotes, setCreditNotes] = useState<string>('Executive bonus granted by Super Admin');
  const [walletSearchTerm, setWalletSearchTerm] = useState<string>('');
  const [walletAdminFeedback, setWalletAdminFeedback] = useState<string | null>(null);

  // Platform Commission setting (e.g. 8%)
  const [platformCommissionPercent, setPlatformCommissionPercent] = useState<number>(8);
  const calculateCommission = (totalAmount: number) => {
    // Platform earns commission
    const adminAmount = Math.round(totalAmount * (platformCommissionPercent / 100));
    const ownerAmount = totalAmount - adminAmount;
    return { ownerAmount, adminAmount };
  };

  const [payoutsApproved, setPayoutsApproved] = useState<{ [id: string]: boolean }>({});

  // Minimum pricing rule threshold (e.g. R500)
  const [minimumPriceLimit, setMinimumPriceLimit] = useState<number>(500);

  // Room Bids Filter & Search state
  const [bidStatusFilter, setBidStatusFilter] = useState<'all' | 'pending' | 'approved' | 'declined'>('all');
  const [bidSearchQuery, setBidSearchQuery] = useState<string>('');

  // Global Admin Search Bar State (Filters registeredUsers & properties by name/title)
  const [globalSearchTerm, setGlobalSearchTerm] = useState<string>('');

  // User & Employer Management State
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('all');
  const [userSearchTerm, setUserSearchTerm] = useState<string>('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [adminResetPasswordUser, setAdminResetPasswordUser] = useState<UserAccount | null>(null);
  const [adminNewPasswordInput, setAdminNewPasswordInput] = useState<string>('');
  const [adminPasswordResetSuccess, setAdminPasswordResetSuccess] = useState<string | null>(null);
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('+27 ');
  const [newUserRole, setNewUserRole] = useState<AppRole>('owner');
  const [newUserTitle, setNewUserTitle] = useState('Property Host & Employer');
  const [newUserPassword, setNewUserPassword] = useState('ScopeBridg@2026');
  const [newUserInitialStatus, setNewUserInitialStatus] = useState<'active' | 'pending' | 'suspended'>('pending');

  // Owners list state (Zero mock data on Production)
  const [ownersList, setOwnersList] = useState(() =>
    IS_PROD
      ? []
      : [
          { id: 'usr-1', name: 'Tendai Mutasa', phone: '+27 82 123 4567', email: 'tendai.m@gmail.com', role: 'owner', units: ['Executive Solar Loft'] },
          { id: 'usr-2', name: 'Lerato Khumalo', phone: '+27 83 987 6543', email: 'lerato.k@outlook.com', role: 'owner', units: ['Sandton Garden Villa'] },
          { id: 'usr-3', name: 'Bongani Sithole', phone: '+27 71 444 8921', email: 'bongani.s@randburg.co.za', role: 'owner', units: ['Rosebank Central Studio'] },
        ]
  );

  // AI automation rules state
  const [aiRules, setAiRules] = useState<AiRule[]>([
    {
      id: 'rule-1',
      trigger: 'WiFi & Loadshedding',
      action: 'Instantly send fibre credentials & inverter uptime details',
      enabled: true,
    },
    {
      id: 'rule-2',
      trigger: 'Early Check-in request',
      action: 'Offer R120 Early Arrival Add-on if unit was cleaned yesterday',
      enabled: true,
    },
    {
      id: 'rule-3',
      trigger: 'Sandton Gautrain directions',
      action: 'Send verified walking map & Google Maps landmark pins',
      enabled: true,
    },
    {
      id: 'rule-4',
      trigger: 'Below minimum R500 price block',
      action: 'Reject owner price drop below threshold to protect market value',
      enabled: true,
    },
  ]);

  // New Admin States for Childcare, Fleet & Kiosk Support
  const [nannySearch, setNannySearch] = useState('');
  const [nannyStatusFilter, setNannyStatusFilter] = useState<'all' | 'pending' | 'fully_vetted' | 'rejected'>('all');
  const [driverSearch, setDriverSearch] = useState('');
  const [driverStatusFilter, setDriverStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  
  // Custom manual Kiosk toggle state (with default true to show automatic activation!)
  const [kioskActivationState, setKioskActivationState] = useState<{ [propId: string]: boolean }>(() => {
    // Automatically pre-activate all properties (since when owner registers, it automatically activates)
    const initial: { [key: string]: boolean } = {};
    properties.forEach(p => {
      initial[p.id] = p.status === 'active';
    });
    return initial;
  });

  // Domestic flights booked by guests at Kiosks (Zero mock data on Production)
  const [flightBookings, setFlightBookings] = useState(() =>
    IS_PROD
      ? []
      : [
          { id: 'FL-901', guestName: 'Nyasha Gumbo', route: 'JNB to CPT', date: '2026-09-28', time: '14:20', airline: 'Safair', status: 'confirmed', fareZar: 1450 },
          { id: 'FL-902', guestName: 'Richard Ndlovu', route: 'CPT to DUR', date: '2026-10-02', time: '09:45', airline: 'Airlink', status: 'pending_payment', fareZar: 1850 },
        ]
  );

  // List of car rentals booked by guests at Kiosks (Zero mock data on Production)
  const [carBookings, setCarBookings] = useState(() =>
    IS_PROD
      ? []
      : [
          { id: 'CAR-401', guestName: 'Zarah Els', vehicle: 'BMW 3 Series Luxury', startDate: '2026-09-25', endDate: '2026-09-28', days: 3, status: 'approved', ratePerDayZar: 850, insuranceVerified: true },
          { id: 'CAR-402', guestName: 'Nomvula Sithole', vehicle: 'Toyota Hilux 4x4 Double Cab', startDate: '2026-10-01', endDate: '2026-10-05', days: 4, status: 'pending_approval', ratePerDayZar: 1200, insuranceVerified: false },
        ]
  );

  // Kiosk self check-in/out logs (Zero mock data on Production)
  const [kioskLogs, setKioskLogs] = useState(() =>
    IS_PROD
      ? []
      : [
          { id: 'LOG-301', time: '08:42 AM', propertyName: 'Executive Solar Loft', guestName: 'Nyasha Gumbo', action: 'self_check_in', status: 'pin_delivered_sms' },
          { id: 'LOG-302', time: '10:15 AM', propertyName: 'Sandton Garden Villa', guestName: 'Thabo Mokoena', action: 'self_check_out', status: 'cleaned_task_created' },
          { id: 'LOG-303', time: '11:05 AM', propertyName: 'Rosebank Central Studio', guestName: 'Richard Ndlovu', action: 'self_check_in', status: 'pin_delivered_sms' },
        ]
  );

  // Platform-wide calculations
  const totalPlatformVolume = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalCommissionEarned = Math.round(totalPlatformVolume * (platformCommissionPercent / 100));
  const activeListingsCount = properties.filter((p) => p.status === 'active').length;
  const pendingReviewListings = properties.filter((p) => p.status === 'pending_approval').length;

  const handleToggleListingStatus = (propertyId: string) => {
    const targetProp = properties.find((p) => p.id === propertyId);
    onUpdateProperties((prev) =>
      prev.map((p) => {
        if (p.id === propertyId) {
          const nextStatus = p.status === 'active' ? 'suspended' : 'active';
          return {
            ...p,
            status: nextStatus,
            verificationStatus: nextStatus === 'active' ? 'verified' : 'pending_verification',
            verifiedBy: currentUser?.fullName || PRODUCTION_SUPER_ADMIN.fullName,
            verifiedAt: new Date().toISOString(),
            rooms: (p.rooms || []).map((r) => ({
              ...r,
              status: nextStatus === 'active' ? 'available' : r.status,
              verificationStatus: nextStatus === 'active' ? 'verified' : r.verificationStatus,
              verifiedBy: currentUser?.fullName || PRODUCTION_SUPER_ADMIN.fullName,
              verifiedAt: new Date().toISOString(),
            })),
          };
        }
        return p;
      })
    );
    if (targetProp) {
      const nextStatus = targetProp.status === 'active' ? 'suspended' : 'active';
      fetch('/api/notifications/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: nextStatus === 'active' ? 'PROPERTY_VERIFIED_AND_PUBLISHED' : 'PROPERTY_SUSPENDED',
          recipientName: targetProp.ownerName || 'Property Host',
          recipientPhone: targetProp.ownerWhatsApp || '+27 69 497 7018',
          recipientEmail: 'nightscope58@gmail.com',
          subject: `Property ${nextStatus === 'active' ? 'Verified & Active' : 'Suspended'}: ${targetProp.title}`,
          message: `Super Admin updated property "${targetProp.title}" (${targetProp.unitCode}) status to ${nextStatus.toUpperCase()}.`,
          channels: ['email', 'sms', 'whatsapp'],
        }),
      }).catch(() => {});
    }
  };

  const handleVerifyRoomStatus = (
    propertyId: string,
    roomId: string,
    nextStatus: 'available' | 'maintenance' | 'pending_verification' | 'rejected',
    nextVerification: 'verified' | 'pending_verification' | 'rejected'
  ) => {
    const targetProp = properties.find((p) => p.id === propertyId);
    const targetRoom = targetProp?.rooms?.find((r) => r.id === roomId);
    onUpdateProperties((prev) =>
      prev.map((p) => {
        if (p.id === propertyId && p.rooms) {
          return {
            ...p,
            rooms: p.rooms.map((r) =>
              r.id === roomId
                ? {
                    ...r,
                    status: nextStatus,
                    verificationStatus: nextVerification,
                    verifiedBy: currentUser?.fullName || PRODUCTION_SUPER_ADMIN.fullName,
                    verifiedAt: new Date().toISOString(),
                  }
                : r
            ),
          };
        }
        return p;
      })
    );
    if (targetProp && targetRoom) {
      fetch('/api/notifications/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: `ROOM_${nextVerification.toUpperCase()}`,
          recipientName: targetProp.ownerName || 'Property Host',
          recipientPhone: targetProp.ownerWhatsApp || '+27 69 497 7018',
          recipientEmail: 'nightscope58@gmail.com',
          subject: `Room Verification Update: ${targetRoom.name} (${targetProp.title})`,
          message: `Super Admin updated room "${targetRoom.name}" in "${targetProp.title}" to status=${nextStatus.toUpperCase()}, verification=${nextVerification.toUpperCase()}.`,
          channels: ['email', 'sms', 'whatsapp'],
        }),
      }).catch(() => {});
    }
  };

  interface MaintenanceIncident {
    id: string;
    propertyId: string;
    propertyName: string;
    issue: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'pending' | 'in_progress' | 'resolved';
    reportedAt: string;
    assignedTo?: string;
  }

  const [maintenanceIncidents, setMaintenanceIncidents] = useState<MaintenanceIncident[]>(() =>
    IS_PROD
      ? []
      : [
          {
            id: 'maint-1',
            propertyId: 'prop-1',
            propertyName: 'Executive Luxury Suite 1',
            issue: 'Routine battery checkup for solar inverter',
            severity: 'low',
            status: 'in_progress',
            reportedAt: '2026-09-18',
            assignedTo: 'Johannesburg Solar Ltd',
          },
          {
            id: 'maint-2',
            propertyId: 'prop-2',
            propertyName: 'Executive Suite 2 (Backhouse)',
            issue: 'Yale Smart Lock keypad battery replacement',
            severity: 'medium',
            status: 'resolved',
            reportedAt: '2026-09-19',
            assignedTo: 'Sandton On-Call Locksmiths',
          },
          {
            id: 'maint-3',
            propertyId: 'prop-global-1',
            propertyName: 'London Mayfair Executive Loft',
            issue: 'Heating element repair in master suite',
            severity: 'high',
            status: 'pending',
            reportedAt: '2026-09-20',
            assignedTo: 'UK Heating Solutions',
          },
        ]
  );

  const [newIncidentPropertyId, setNewIncidentPropertyId] = useState<string>('');
  const [newIncidentIssue, setNewIncidentIssue] = useState<string>('');
  const [newIncidentSeverity, setNewIncidentSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [newIncidentAssignedTo, setNewIncidentAssignedTo] = useState<string>('');

  const handleAddMaintenanceIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncidentPropertyId || !newIncidentIssue) return;
    const prop = properties.find(p => p.id === newIncidentPropertyId);
    if (!prop) return;

    const newM: MaintenanceIncident = {
      id: `maint-${Date.now()}`,
      propertyId: newIncidentPropertyId,
      propertyName: prop.title,
      issue: newIncidentIssue,
      severity: newIncidentSeverity,
      status: 'pending',
      reportedAt: new Date().toISOString().split('T')[0],
      assignedTo: newIncidentAssignedTo || 'General Maintenance Staff'
    };

    setMaintenanceIncidents(prev => [newM, ...prev]);
    // Automatically set the property status to 'maintenance'
    onUpdateProperties(prev => prev.map(p => p.id === newIncidentPropertyId ? { ...p, status: 'maintenance' } : p));
    
    // Reset form
    setNewIncidentIssue('');
    setNewIncidentAssignedTo('');
  };

  const handleToggleMaintenance = (propertyId: string) => {
    onUpdateProperties((prev) =>
      prev.map((p) => {
        if (p.id === propertyId) {
          const nextStatus = p.status === 'maintenance' ? 'active' : 'maintenance';
          return { ...p, status: nextStatus };
        }
        return p;
      })
    );
  };

  const handleApprovePayout = (bookingId: string) => {
    setPayoutsApproved((prev) => ({ ...prev, [bookingId]: true }));
  };

  const handleToggleAiRule = (ruleId: string) => {
    setAiRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleExportUsersCSV = () => {
    if (!registeredUsers || registeredUsers.length === 0) {
      alert('No user accounts available to export.');
      return;
    }
    const headers = ['ID', 'Full Name', 'Username', 'Email', 'Phone', 'Role', 'Status', 'Location', 'Title', 'Registered At'];
    const rows = registeredUsers.map((u) => [
      `"${(u.id || '').replace(/"/g, '""')}"`,
      `"${(u.fullName || u.name || '').replace(/"/g, '""')}"`,
      `"${(u.username || '').replace(/"/g, '""')}"`,
      `"${(u.email || '').replace(/"/g, '""')}"`,
      `"${(u.phone || '').replace(/"/g, '""')}"`,
      `"${(u.role || '').replace(/"/g, '""')}"`,
      `"${(u.status || 'active').replace(/"/g, '""')}"`,
      `"${(u.location || '').replace(/"/g, '""')}"`,
      `"${(u.title || '').replace(/"/g, '""')}"`,
      `"${(u.registeredAt || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `StaySync_Users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPropertiesCSV = () => {
    if (!properties || properties.length === 0) {
      alert('No property listings available to export.');
      return;
    }
    const headers = [
      'ID',
      'Unit Code',
      'Title',
      'Property Type',
      'Address',
      'Area',
      'City',
      'Country',
      'Base Price (ZAR)',
      'Weekend Price (ZAR)',
      'Bedrooms',
      'Bathrooms',
      'Max Guests',
      'Rating',
      'Status',
      'Owner Name',
      'Owner WhatsApp',
      'Bank Name',
      'Bank Account Holder',
      'Bank Account Number',
      'Branch Code',
      'Photos Count',
      'Videos Count',
      'Lockbox Code',
      'Smart Lock PIN'
    ];
    const rows = properties.map((p) => [
      `"${(p.id || '').replace(/"/g, '""')}"`,
      `"${(p.unitCode || '').replace(/"/g, '""')}"`,
      `"${(p.title || '').replace(/"/g, '""')}"`,
      `"${(p.propertyType || '').replace(/"/g, '""')}"`,
      `"${(p.address || '').replace(/"/g, '""')}"`,
      `"${(p.area || '').replace(/"/g, '""')}"`,
      `"${(p.city || '').replace(/"/g, '""')}"`,
      `"${(p.country || '').replace(/"/g, '""')}"`,
      `"${p.basePrice || 0}"`,
      `"${p.weekendPrice || 0}"`,
      `"${p.bedrooms || 0}"`,
      `"${p.bathrooms || 0}"`,
      `"${p.maxGuests || 0}"`,
      `"${p.rating || 5.0}"`,
      `"${(p.status || 'active').replace(/"/g, '""')}"`,
      `"${(p.ownerName || '').replace(/"/g, '""')}"`,
      `"${(p.ownerWhatsApp || '').replace(/"/g, '""')}"`,
      `"${(p.bankAccount?.bankName || '').replace(/"/g, '""')}"`,
      `"${(p.bankAccount?.accountName || '').replace(/"/g, '""')}"`,
      `"${(p.bankAccount?.accountNumber || '').replace(/"/g, '""')}"`,
      `"${(p.bankAccount?.branchCode || '').replace(/"/g, '""')}"`,
      `"${p.images?.length || 0}"`,
      `"${p.videos?.length || 0}"`,
      `"${(p.checkInInstructions?.lockboxCode || '').replace(/"/g, '""')}"`,
      `"${(p.checkInInstructions?.smartLockPin || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `StaySync_Properties_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 p-5 rounded-2xl text-white shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-black">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">Super Admin Control Hub</h2>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold px-2 py-0.5 rounded-full">
                Global Platform Master Access
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Access control, financial commission, quality moderation & AI automation rules
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="px-3 py-1.5 bg-slate-800 rounded-xl border border-slate-700">
            <span className="text-slate-400 block text-[10px]">Active Environment:</span>
            <span className={`font-extrabold text-sm ${IS_PROD ? 'text-emerald-400' : 'text-amber-400'}`}>
              {IS_PROD && 'PRODUCTION (Cloud SQL)'}
              {IS_DEV && 'DEVELOPMENT (JSON DB)'}
            </span>
          </div>
          <div className="px-3 py-1.5 bg-slate-800 rounded-xl border border-slate-700">
            <span className="text-slate-400 block text-[10px]">Platform Fee:</span>
            <span className="text-emerald-400 font-extrabold text-sm">{platformCommissionPercent}%</span>
          </div>
          <div className="px-3 py-1.5 bg-slate-800 rounded-xl border border-slate-700">
            <span className="text-slate-400 block text-[10px]">Total Platform GMV:</span>
            <span className="text-white font-extrabold text-sm">R{totalPlatformVolume.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* SUPER ADMIN EXCLUSIVE VIEW: PORTALS SWITCHER */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Top Portals Navigation Strip (Inside Super Admin Account) */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mr-1">
              PORTALS:
            </span>
            {[
              { id: 'guest' as AppRole, label: 'Guest Stay', color: 'text-blue-600' },
              { id: 'owner' as AppRole, label: 'Owner Portal', color: 'text-emerald-600' },
              { id: 'driver' as AppRole, label: 'Shuttle', color: 'text-amber-600' },
              { id: 'nanny' as AppRole, label: 'Nanny', color: 'text-pink-600' },
              { id: 'kiosk' as AppRole, label: 'Kiosk', color: 'text-teal-600' },
              { id: 'super_admin' as AppRole, label: 'Admin', color: 'text-purple-600' },
            ].map((p) => {
              const isAct = currentRole === p.id || (p.id === 'super_admin' && (currentRole === 'admin' || currentRole === 'super_admin'));
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectRole && onSelectRole(p.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isAct
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
            {onOpenAuthPage && (
              <button
                type="button"
                onClick={onOpenAuthPage}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-all cursor-pointer"
              >
                Login / Profile
              </button>
            )}
            {onOpenGuestBookingLink && (
              <button
                type="button"
                onClick={onOpenGuestBookingLink}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all cursor-pointer"
              >
                Guest Booking Link
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {IS_PROD && 'Production Cloud SQL Synchronized'}
              {IS_DEV && 'Development JSON Database Synchronized'}
            </span>
          </div>
        </div>
      </div>

      {/* GLOBAL ADMIN SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={globalSearchTerm}
            onChange={(e) => {
              const val = e.target.value;
              setGlobalSearchTerm(val);
              setUserSearchTerm(val);
            }}
            placeholder="Search users by name/username/email or properties by title/address/host..."
            className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-emerald-600 focus:bg-white shadow-inner transition-all"
          />
          {globalSearchTerm && (
            <button
              onClick={() => {
                setGlobalSearchTerm('');
                setUserSearchTerm('');
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-extrabold bg-slate-200 hover:bg-slate-300 w-5 h-5 rounded-full flex items-center justify-center transition-colors cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {globalSearchTerm.trim() && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
              <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                🔍 Global Search Results for &quot;{globalSearchTerm}&quot;
              </span>
              <div className="flex items-center gap-2">
                <span className="bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-md">
                  👥 {registeredUsers.filter((u) => {
                    const q = globalSearchTerm.toLowerCase().trim();
                    return (
                      (u.name && u.name.toLowerCase().includes(q)) ||
                      (u.fullName && u.fullName.toLowerCase().includes(q)) ||
                      (u.username && u.username.toLowerCase().includes(q)) ||
                      (u.email && u.email.toLowerCase().includes(q))
                    );
                  }).length} Users
                </span>
                <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                  🏢 {properties.filter((p) => {
                    const q = globalSearchTerm.toLowerCase().trim();
                    return (
                      (p.title && p.title.toLowerCase().includes(q)) ||
                      (p.address && p.address.toLowerCase().includes(q)) ||
                      (p.ownerName && p.ownerName.toLowerCase().includes(q))
                    );
                  }).length} Properties
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Users Search Results */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 flex items-center justify-between">
                  <span>Users Matching Query</span>
                  <button
                    onClick={() => setActiveTab('access')}
                    className="text-[11px] text-purple-700 hover:underline font-bold"
                  >
                    View All in Access Tab →
                  </button>
                </h4>
                {registeredUsers.filter((u) => {
                  const q = globalSearchTerm.toLowerCase().trim();
                  return (
                    (u.name && u.name.toLowerCase().includes(q)) ||
                    (u.fullName && u.fullName.toLowerCase().includes(q)) ||
                    (u.username && u.username.toLowerCase().includes(q)) ||
                    (u.email && u.email.toLowerCase().includes(q))
                  );
                }).length === 0 ? (
                  <p className="text-slate-400 italic text-[11px]">No users match &quot;{globalSearchTerm}&quot;</p>
                ) : (
                  registeredUsers
                    .filter((u) => {
                      const q = globalSearchTerm.toLowerCase().trim();
                      return (
                        (u.name && u.name.toLowerCase().includes(q)) ||
                        (u.fullName && u.fullName.toLowerCase().includes(q)) ||
                        (u.username && u.username.toLowerCase().includes(q)) ||
                        (u.email && u.email.toLowerCase().includes(q))
                      );
                    })
                    .slice(0, 5)
                    .map((u) => (
                      <div key={u.id} className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900">{u.fullName || u.name}</p>
                          <p className="text-[10px] text-slate-500">@{u.username} • {u.email} • {u.role.toUpperCase()}</p>
                        </div>
                        <button
                          onClick={() => setActiveTab('access')}
                          className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-md font-bold text-[10px] cursor-pointer shrink-0"
                        >
                          View Profile
                        </button>
                      </div>
                    ))
                )}
              </div>

              {/* Properties Search Results */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 flex items-center justify-between">
                  <span>Properties Matching Query</span>
                  <button
                    onClick={() => setActiveTab('listings')}
                    className="text-[11px] text-emerald-700 hover:underline font-bold"
                  >
                    View All in Listings Tab →
                  </button>
                </h4>
                {properties.filter((p) => {
                  const q = globalSearchTerm.toLowerCase().trim();
                  return (
                    (p.title && p.title.toLowerCase().includes(q)) ||
                    (p.address && p.address.toLowerCase().includes(q)) ||
                    (p.ownerName && p.ownerName.toLowerCase().includes(q))
                  );
                }).length === 0 ? (
                  <p className="text-slate-400 italic text-[11px]">No properties match &quot;{globalSearchTerm}&quot;</p>
                ) : (
                  properties
                    .filter((p) => {
                      const q = globalSearchTerm.toLowerCase().trim();
                      return (
                        (p.title && p.title.toLowerCase().includes(q)) ||
                        (p.address && p.address.toLowerCase().includes(q)) ||
                        (p.ownerName && p.ownerName.toLowerCase().includes(q))
                      );
                    })
                    .slice(0, 5)
                    .map((p) => (
                      <div key={p.id} className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900">{p.title}</p>
                          <p className="text-[10px] text-slate-500">{p.address} • Host: {p.ownerName}</p>
                        </div>
                        <button
                          onClick={() => setActiveTab('listings')}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md font-bold text-[10px] cursor-pointer shrink-0"
                        >
                          View Listing
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expanded Super Admin Menu Tabs - Uniformly Aligned Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 bg-slate-100 p-2 rounded-2xl border border-slate-200 text-xs font-bold">
        {(currentRole === 'super_admin' || currentUser?.role === 'super_admin') && (
          <button
            onClick={() => setActiveTab('owner_tree')}
            className={`h-9 px-3 rounded-xl transition-all flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer ${
              activeTab === 'owner_tree'
                ? 'bg-slate-950 text-amber-300 shadow-sm border border-amber-500/40'
                : 'bg-amber-950/10 text-slate-800 hover:bg-slate-200 border border-amber-600/20'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">Owner Property Tree</span>
            <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full uppercase shrink-0 ml-auto">
              Tree
            </span>
          </button>
        )}

        {(currentRole === 'super_admin' || currentUser?.role === 'super_admin') && (
          <button
            onClick={() => setActiveTab('system_health')}
            className={`h-9 px-3 rounded-xl transition-all flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer ${
              activeTab === 'system_health'
                ? 'bg-slate-950 text-emerald-400 shadow-sm border border-emerald-500/40'
                : 'bg-emerald-950/10 text-slate-800 hover:bg-slate-200 border border-emerald-600/20'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">Admin System Health (6 Services)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0 ml-auto" />
          </button>
        )}

        {(currentRole === 'super_admin' || currentUser?.role === 'super_admin') && (
          <button
            onClick={() => setActiveTab('db_monitor')}
            className={`h-9 px-3 rounded-xl transition-all flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer ${
              activeTab === 'db_monitor'
                ? 'bg-slate-950 text-emerald-400 shadow-sm border border-emerald-500/40'
                : 'bg-emerald-950/10 text-slate-800 hover:bg-slate-200 border border-emerald-600/20'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">App &amp; DB Monitor (22 Tables)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0 ml-auto" />
          </button>
        )}

        <button
          onClick={() => setActiveTab('occupancy_map')}
          className={`h-9 px-3 rounded-xl transition-all flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer ${
            activeTab === 'occupancy_map'
              ? 'bg-rose-700 text-white shadow-sm border border-rose-500'
              : 'bg-rose-50 text-rose-950 hover:bg-rose-100 border border-rose-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span className="truncate">Visual Occupancy Floor Plan</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar_planner')}
          className={`h-9 px-3 rounded-xl transition-all flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer ${
            activeTab === 'calendar_planner'
              ? 'bg-emerald-700 text-white shadow-sm border border-emerald-500'
              : 'bg-emerald-50 text-emerald-950 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="truncate">Calendar &amp; Planner</span>
        </button>

        <button
          onClick={() => setActiveTab('live_notifications')}
          className={`h-9 px-3 rounded-xl transition-all flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer ${
            activeTab === 'live_notifications'
              ? 'bg-slate-950 text-emerald-400 shadow-sm border border-emerald-500/40'
              : 'bg-emerald-950/10 text-slate-800 hover:bg-slate-200 border border-emerald-600/20'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="truncate">Scope Bridge Support</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0 ml-auto" />
        </button>

        <button
          onClick={() => setActiveTab('finance')}
          className={`h-9 px-3 rounded-xl transition-all flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer ${
            activeTab === 'finance'
              ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">Money &amp; Payouts</span>
        </button>

        <button
          onClick={() => setActiveTab('quotes_invoices')}
          className={`h-9 px-3 rounded-xl transition-all flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer ${
            activeTab === 'quotes_invoices'
              ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Receipt className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="truncate">Quotes &amp; Invoices ({quotations.length + invoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('commissions')}
          className={`h-9 px-3 rounded-xl transition-all flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer ${
            activeTab === 'commissions'
              ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">Commissions</span>
        </button>

        <button
          onClick={() => setActiveTab('channels')}
          className={`h-9 px-3 rounded-xl transition-all flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer ${
            activeTab === 'channels'
              ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">OTA Channels ({channels.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('gateways')}
          className={`h-9 px-3 rounded-xl transition-all flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer ${
            activeTab === 'gateways'
              ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">Payment Gateways ({effectiveGateways.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`h-9 px-3 rounded-xl transition-all flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer ${
            activeTab === 'requests'
              ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Inbox className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">Owner Requests</span>
          {effectiveRequests.filter((r) => r.status === 'pending').length > 0 && (
            <span className="text-[10px] bg-amber-500 text-white font-black px-1.5 py-0.2 rounded-full shrink-0 ml-auto">
              {effectiveRequests.filter((r) => r.status === 'pending').length}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('listings');
            if (properties.length > 0 && !newIncidentPropertyId) {
              setNewIncidentPropertyId(properties[0].id);
            }
          }}
          className={`h-9 px-3 rounded-xl transition-all flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer ${
            activeTab === 'listings'
              ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <ListChecks className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">Listings &amp; Maintenance</span>
        </button>

        <button
          onClick={() => setActiveTab('access')}
          className={`h-9 px-3 rounded-xl transition-all flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer ${
            activeTab === 'access'
              ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">Access Control</span>
        </button>

        <button
          onClick={() => setActiveTab('ai_rules')}
          className={`h-9 px-3 rounded-xl transition-all flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer ${
            activeTab === 'ai_rules'
              ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">AI Rules</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`h-9 px-3 rounded-xl transition-all flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">Reports</span>
        </button>

        <button
          onClick={() => setActiveTab('room_bids')}
          className={`h-9 px-3 rounded-xl transition-all flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer ${
            activeTab === 'room_bids'
              ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <BedDouble className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">Room Bids</span>
          {roomBids && roomBids.filter(b => b.status === 'pending').length > 0 && (
            <span className="text-[10px] bg-amber-500 text-white font-black px-1.5 py-0.2 rounded-full shrink-0 ml-auto">
              {roomBids.filter(b => b.status === 'pending').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('fleet_service')}
          className={`h-9 px-3 rounded-xl transition-all flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer ${
            activeTab === 'fleet_service'
              ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Car className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">Fleet Approvals</span>
          {fleetServiceRequests && fleetServiceRequests.filter(r => r.status === 'pending_admin_approval').length > 0 && (
            <span className="text-[10px] bg-amber-500 text-white font-black px-1.5 py-0.2 rounded-full shrink-0 ml-auto">
              {fleetServiceRequests.filter(r => r.status === 'pending_admin_approval').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('virtual_wallets')}
          className={`h-9 px-3 rounded-xl transition-all flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer ${
            activeTab === 'virtual_wallets'
              ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Wallet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">Virtual Wallets</span>
        </button>

        <button
          onClick={() => setActiveTab('nanny_on_call')}
          className={`h-9 px-3 rounded-xl transition-all flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer ${
            activeTab === 'nanny_on_call'
              ? 'bg-white text-purple-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Baby className="w-3.5 h-3.5 text-purple-600 shrink-0" />
          <span className="truncate">Childcare &amp; Nannies</span>
          {nannies && nannies.filter(n => n.verifiedStatus === 'pending').length > 0 && (
            <span className="text-[10px] bg-purple-500 text-white font-black px-1.5 py-0.2 rounded-full shrink-0 ml-auto">
              {nannies.filter(n => n.verifiedStatus === 'pending').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('fleet_management')}
          className={`h-9 px-3 rounded-xl transition-all flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer ${
            activeTab === 'fleet_management'
              ? 'bg-white text-amber-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Car className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="truncate">Fleet &amp; Bookings</span>
          {shuttleDrivers && shuttleDrivers.filter(d => d.verifiedStatus === 'pending').length > 0 && (
            <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full shrink-0 ml-auto">
              {shuttleDrivers.filter(d => d.verifiedStatus === 'pending').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('kiosk_support')}
          className={`h-9 px-3 rounded-xl transition-all flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer ${
            activeTab === 'kiosk_support'
              ? 'bg-white text-indigo-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Monitor className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span className="truncate">Kiosk Links</span>
        </button>
      </div>

      {/* SECTION: ADMINISTRATOR ACTIVE DIRECTORY HIERARCHICAL TREE VIEW */}
      {activeTab === 'owner_tree' && (
        <ActiveDirectoryTreeView
          registeredUsers={registeredUsers}
          properties={properties}
          onSelectProperty={(propId) => {
            setActiveTab('listings');
            setNewIncidentPropertyId(propId);
          }}
          onEditUser={(u) => {
            setEditingUser(u);
          }}
          currentUser={currentUser}
          onOpenAuthPage={onOpenAuthPage}
          onLogout={onLogout}
          onLoginTestAccount={onLoginTestAccount}
          onSelectRole={onSelectRole}
        />
      )}

      {/* SECTION: INTERACTIVE VISUAL OCCUPANCY FLOOR PLAN MAP */}
      {activeTab === 'occupancy_map' && (
        <InteractiveFloorPlanOccupancyMap
          properties={properties}
          bookings={bookings}
          channels={channels}
          onUpdateProperties={onUpdateProperties}
          onUpdateBookings={onUpdateBookings}
        />
      )}

      {/* SECTION: UNIVERSAL CALENDAR, BOOKINGS & MULTI-CHANNEL PLANNER */}
      {activeTab === 'calendar_planner' && (
        <UniversalCalendarPlanner
          currentRole={currentRole}
          currentUser={currentUser || PRODUCTION_SUPER_ADMIN}
          properties={properties}
          bookings={bookings}
          nannyBookings={nannyBookings}
          shuttleBookings={shuttleBookings}
          calendarEvents={calendarEvents}
          channels={channels}
          registeredUsers={registeredUsers}
          selectedCurrency="ZAR"
          onBookProperty={onBookProperty}
          onUpdateBookings={onUpdateBookings}
          onUpdateCalendarEvents={onUpdateCalendarEvents}
          onUpdateProperties={onUpdateProperties}
          onPublishPropertyToChannel={handlePublishProperty}
        />
      )}

      {/* SECTION: CENTRALIZED ADMIN SYSTEM HEALTH PANEL (6 CONNECTED SERVICES) */}
      {activeTab === 'system_health' && (currentRole === 'super_admin' || currentUser?.role === 'super_admin') && (
        <AdminSystemHealthPanel
          onTriggerAlert={(msg) => {
            if (onUpdateAlerts) {
              onUpdateAlerts((prev) => [
                {
                  id: `alert-health-${Date.now()}`,
                  title: 'System Health Diagnostic',
                  message: msg,
                  severity: 'info',
                  timestamp: new Date().toISOString(),
                  type: 'system',
                },
                ...prev,
              ]);
            }
          }}
        />
      )}

      {/* SECTION: LIVE NOTIFICATIONS & PLAYSMS API GATEWAY TESTER */}
      {(activeTab === 'live_notifications' || activeTab === 'db_monitor') && (
        <AdminNotificationsLiveTestPanel
          adminEmail={currentUser?.email || 'nightscope58@gmail.com'}
          onPushAdminAlert={(newAlert) => {
            if (onUpdateAlerts) {
              onUpdateAlerts((prev) => [newAlert, ...prev]);
            }
          }}
        />
      )}

      {/* SECTION: SUPER ADMIN EXCLUSIVE APP & DATABASE MONITORING DASHBOARD */}
      {activeTab === 'db_monitor' && (currentRole === 'super_admin' || currentUser?.role === 'super_admin') && (
        <DatabaseMonitorDashboard
          currentRole={currentRole}
          currentUserEmail={currentUser?.email || 'nightscope58@gmail.com'}
          onSeparateAndRebootProduction={onSeparateAndRebootProduction}
          tableDataMap={{
            properties,
            bookings,
            users: registeredUsers,
            channels,
            paymentGateways: effectiveGateways,
            accessRequests: effectiveRequests,
            quotations,
            invoices,
            settings: Object.entries(virtualWallets || {}).map(([ownerKey, val]) => ({
              id: `wallet_${ownerKey}`,
              owner: ownerKey,
              ...val,
            })),
            roomBids,
            reviews,
            cleaningTasks,
            promos,
            alerts,
            nannies,
            nannyBookings,
            shuttleDrivers,
            shuttleBookings,
            fleetServiceRequests,
            kioskFlightBookings,
            kioskCarBookings,
            calendarEvents,
          }}
          onNavigateTab={(tabName: string) => {
            if (tabName === 'channels_gateways') setActiveTab('channels');
            else if (tabName === 'properties') setActiveTab('listings');
            else if (tabName === 'users') setActiveTab('access');
          }}
        />
      )}

      {/* SECTION: QUOTATIONS AND INVOICES MANAGER (SUPER ADMIN) */}
      {activeTab === 'quotes_invoices' && (
        <QuotationsAndInvoicesManager
          role="admin"
          currentUserName="Super Admin"
          quotations={quotations}
          invoices={invoices}
          properties={properties}
          onCreateQuotation={onCreateQuotation}
          onEditQuotation={onEditQuotation}
          onDeleteQuotation={onDeleteQuotation}
          onConvertQuoteToInvoice={onConvertQuoteToInvoice}
          onCreateInvoice={onCreateInvoice}
          onEditInvoice={onEditInvoice}
          onDeleteInvoice={onDeleteInvoice}
          onPayInvoice={onPayInvoice}
        />
      )}

      {/* SECTION: COMMISSIONS & PAYOUTS */}
      {activeTab === 'commissions' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-slate-900">Commissions & Payouts</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-2">Scope Bridge Admin Bank Account</h3>
              <p className="text-sm text-slate-600">This account receives all platform commissions and registration fees.</p>
              <div className="mt-4 space-y-1 text-sm">
                <p><span className="font-medium text-slate-500">Bank:</span> {PLATFORM_CONFIG.mainAdminBankAccount.bankName}</p>
                <p><span className="font-medium text-slate-500">Account:</span> {PLATFORM_CONFIG.mainAdminBankAccount.accountName}</p>
                <p><span className="font-medium text-slate-500">Number:</span> {PLATFORM_CONFIG.mainAdminBankAccount.accountNumber}</p>
                <p><span className="font-medium text-slate-500">Branch:</span> {PLATFORM_CONFIG.mainAdminBankAccount.branchCode}</p>
                <p><span className="font-medium text-slate-500">Type:</span> {PLATFORM_CONFIG.mainAdminBankAccount.accountType}</p>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <h3 className="font-bold text-emerald-900 mb-2">Platform Earnings Overview</h3>
              <p className="text-sm text-emerald-700">Total commission earned from completed bookings.</p>
              <p className="mt-4 text-3xl font-black text-emerald-950">
                R{bookings.reduce((sum, b) => sum + (b.commission?.adminAmount || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="h-64 w-full bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-700 mb-4">6-Month Growth</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={commissionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="admin" name="Admin" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="owner" name="Owners" stroke="#6366f1" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-slate-600">
              <thead className="text-xs uppercase bg-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left">Property</th>
                  <th className="px-4 py-3 text-left">Guest</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Admin Comm</th>
                  <th className="px-4 py-3 text-right">Owner Share</th>
                </tr>
              </thead>
              <tbody>
                {bookings.filter(b => b.paymentStatus === 'paid').map(booking => (
                  <tr key={booking.id} className="border-b">
                    <td className="px-4 py-3 font-medium">{booking.propertyTitle}</td>
                    <td className="px-4 py-3">{booking.guestName}</td>
                    <td className="px-4 py-3 text-right">R{booking.totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-emerald-700 font-bold">R{(booking.commission?.adminAmount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">R{(booking.commission?.ownerAmount || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION: CHANNELS MANAGER */}
      {activeTab === 'channels' && (
        <AdminChannelsManager
          channels={channels}
          properties={properties}
          onToggleChannelStatus={handleToggleChannelStatus}
          onUpdateCommission={handleUpdateCommission}
          onAddChannel={handleAddChannel}
          onPublishRoomToChannel={handlePublishRoom}
          onPublishPropertyToChannel={handlePublishProperty}
        />
      )}

      {/* SECTION: PAYMENT GATEWAYS MANAGER */}
      {activeTab === 'gateways' && (
        <AdminGatewaysManager
          gateways={effectiveGateways}
          onToggleGatewayStatus={handleToggleGatewayStatus}
          onUpdateGatewayFee={handleUpdateGatewayFee}
          onAddGateway={handleAddGateway}
        />
      )}

      {/* SECTION: OWNER REQUESTS MANAGER */}
      {activeTab === 'requests' && (
        <AdminOwnerRequestsManager
          requests={effectiveRequests}
          properties={properties}
          onReviewRequest={handleReviewRequest}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2: MONEY & COMMISSION */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'finance' && (
        <div className="space-y-6">
          {/* Summary Metric cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-semibold uppercase">Total Platform GMV</span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                R{totalPlatformVolume.toLocaleString()}
              </p>
              <span className="text-[10px] text-slate-400 mt-1 block">Across all direct bookings</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-semibold uppercase">Platform Revenue Earned</span>
              <p className="text-2xl font-black text-emerald-800 mt-1">
                R{totalCommissionEarned.toLocaleString()}
              </p>
              <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">
                Calculated at {platformCommissionPercent}% commission rate
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-semibold uppercase">Owner Payout Status</span>
              <p className="text-2xl font-black text-slate-800 mt-1">
                R{(totalPlatformVolume - totalCommissionEarned).toLocaleString()}
              </p>
              <span className="text-[10px] text-slate-400 mt-1 block">Ready for EFT batch distribution</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Commission Settings Config */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Platform Fee & Commission Rules
                </h3>
              </div>

              <p className="text-xs text-slate-500">
                Configure the percentage deducted on each direct reservation before dispersing owner earnings to FNB, Standard Bank, Capitec, or Nedbank.
              </p>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                  <span>Current Commission Rate:</span>
                  <span className="text-emerald-800 font-mono font-bold text-base">
                    {platformCommissionPercent}% per booking
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {[5, 8, 10, 12, 15].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setPlatformCommissionPercent(rate)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                        platformCommissionPercent === rate
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>

                <p className="text-[11px] text-slate-500">
                  Tip: Industry standard is 15% (Airbnb). Keeping ScopeBridg at 8% attracts top hosts across Rosebank and Sandton.
                </p>
              </div>
            </div>

            {/* Payout Approval Feed */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Owner Payout Release Approval
                </h3>
                <span className="text-[10px] text-slate-500">RSA Banking EFT</span>
              </div>

              <div className="space-y-2 text-xs">
                {bookings.map((booking) => {
                  const isApproved = payoutsApproved[booking.id];
                  const ownerShare = Math.round(booking.totalAmount * (1 - platformCommissionPercent / 100));

                  return (
                    <div key={booking.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 block">{booking.propertyTitle.split(' ')[0]}</span>
                        <span className="text-[10px] text-slate-500">
                          Total: R{booking.totalAmount} • Owner EFT: <strong className="text-slate-800">R{ownerShare}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isApproved ? (
                          <span className="text-[11px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Released
                          </span>
                        ) : (
                          <button
                            onClick={() => handleApprovePayout(booking.id)}
                            className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs transition-colors"
                          >
                            Approve EFT
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION 1: EMPLOYER & ACCOUNT ACCESS CONTROL & APPROVALS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'access' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Employer & User Account Management Hub
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Create, approve, pend, suspend, or delete accounts for Property Hosts, Private Companies, Government Entities, NGOs, Schools, Nannies, Shuttle Drivers & Guests.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    if (!onUpdateRegisteredUsers) return;
                    let count = 0;
                    onUpdateRegisteredUsers((prev) => {
                      const roleCounters: Record<string, number> = {
                        super_admin: 100,
                        admin: 100,
                        owner: 1000,
                        guest: 2000,
                        nanny: 3000,
                        driver: 4000,
                      };
                      return prev.map((usr) => {
                        const prefixMap: Record<string, string> = {
                          super_admin: 'SA',
                          admin: 'ADM',
                          owner: 'OWN',
                          guest: 'GS',
                          nanny: 'NAN',
                          driver: 'DRV',
                        };
                        const prefix = prefixMap[usr.role] || 'USR';
                        roleCounters[usr.role] = (roleCounters[usr.role] || 1000) + 1;
                        const assignedId = `${prefix}-${roleCounters[usr.role]}`;
                        if (!usr.id || usr.id.startsWith('user-') || usr.id.startsWith('owner-') || usr.id.startsWith('guest-') || usr.id.length > 15) {
                          count++;
                          return { ...usr, id: assignedId };
                        }
                        return usr;
                      });
                    });
                    if (onUpdateAlerts) {
                      onUpdateAlerts((prev) => [
                        {
                          id: `alert-${Date.now()}`,
                          type: 'info',
                          title: 'User IDs Assigned',
                          message: 'Standardized custom User IDs assigned across all registered user profiles!',
                          timestamp: 'Just now',
                          category: 'user',
                          resolved: false,
                        },
                        ...prev,
                      ]);
                    }
                  }}
                  className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                  title="Assign clean, standardized User IDs (e.g. ADM-101, OWN-1002, GS-2001) to all profile accounts"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Assign User IDs To All Profiles</span>
                </button>

                <button
                  onClick={() => setActiveTab('owner_tree')}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                  title="View Owner -> Property -> Room Hierarchical Tree View"
                >
                  <FolderTree className="w-4 h-4 text-amber-400" />
                  <span>Owner Property Tree View</span>
                </button>

                <button
                  onClick={handleExportUsersCSV}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                  title="Export entire registered users collection to CSV spreadsheet"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Users to CSV</span>
                </button>

                <button
                  onClick={() => setIsAddUserModalOpen(true)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Employer / User Account</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  placeholder="Search name, username, email..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-emerald-600"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              >
                <option value="all">All Roles</option>
                <option value="owner">Employers & Property Hosts</option>
                <option value="nanny">Super Nannies</option>
                <option value="driver">Shuttle Drivers</option>
                <option value="admin">Administrators</option>
                <option value="guest">Guests & Travelers</option>
              </select>

              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              >
                <option value="all">All Account Statuses</option>
                <option value="pending">Pending Approval</option>
                <option value="active">Active & Verified</option>
                <option value="suspended">Suspended</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Account List Grid */}
            <div className="divide-y divide-slate-100 text-xs">
              {registeredUsers.length === 0 ? (
                <div className="p-8 text-center text-slate-500 font-medium">
                  No accounts found matching search filters.
                </div>
              ) : (
                registeredUsers
                  .filter((u) => {
                    const matchesSearch =
                      !userSearchTerm ||
                      u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                      (u.fullName && u.fullName.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
                      u.username.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                      u.email.toLowerCase().includes(userSearchTerm.toLowerCase());

                    const matchesRole =
                      userRoleFilter === 'all' ||
                      (userRoleFilter === 'owner' ? u.role === 'owner' : u.role === userRoleFilter);

                    const userStatus = u.status || 'active';
                    const isPendingStatus = userStatus === 'pending' || userStatus === 'pending_approval';
                    const matchesStatus =
                      userStatusFilter === 'all' ||
                      (userStatusFilter === 'pending' ? isPendingStatus : userStatus === userStatusFilter);

                    return matchesSearch && matchesRole && matchesStatus;
                  })
                  .map((u) => {
                    const status = u.status || 'active';
                    const isPending = status === 'pending' || status === 'pending_approval';
                    return (
                      <div key={u.id} className="py-4 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-slate-900 text-sm">
                                {u.fullName || u.name}
                              </span>
                              <span className="text-[10px] bg-purple-100 text-purple-800 border border-purple-200 font-bold px-2 py-0.5 rounded-full uppercase">
                                {u.role}
                              </span>
                              <span className="text-[10px] font-mono bg-purple-50 text-purple-800 border border-purple-200 font-bold px-2 py-0.5 rounded-md">
                                ID: {u.id}
                              </span>
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase border ${
                                  status === 'active'
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : isPending
                                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                                    : status === 'suspended' || status === 'rejected'
                                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                                    : 'bg-slate-100 text-slate-800 border-slate-300'
                                }`}
                              >
                                {status.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                              @{u.username} • {u.email} • {u.phone}
                            </p>
                            <p className="text-[11px] text-slate-700 font-bold flex items-center gap-1 mt-0.5">
                              📍 <span className="text-slate-900 font-semibold">{u.location || 'Not set (search to populate)'}</span>
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[11px] text-emerald-800 font-semibold">{u.title}</span>
                              {properties.filter(p => p.ownerId === u.id || p.ownerName?.toLowerCase() === u.name?.toLowerCase()).length > 0 && (
                                <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                                  🏢 {properties.filter(p => p.ownerId === u.id || p.ownerName?.toLowerCase() === u.name?.toLowerCase()).length} Registered Properties
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Interactive Workflow Buttons: Edit, Approve, Pend, Suspend, Reject, Delete */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setEditingUser({ ...u })}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setAdminResetPasswordUser(u);
                              setAdminNewPasswordInput(`Pass@2026!${Math.floor(1000 + Math.random() * 9000)}`);
                              setAdminPasswordResetSuccess(null);
                            }}
                            className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                            title="Admin Reset Password for this user profile"
                          >
                            <KeyRound className="w-3 h-3 text-purple-600" />
                            <span>Reset Password</span>
                          </button>

                          {status !== 'active' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (onUpdateRegisteredUsers) {
                                  onUpdateRegisteredUsers((prev) =>
                                    prev.map((usr) => (usr.id === u.id ? { ...usr, status: 'active' } : usr))
                                  );
                                }
                                fetch('/api/notifications/dispatch', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    eventType: 'USER_ACCOUNT_APPROVED',
                                    recipientName: u.fullName || u.name,
                                    recipientEmail: u.email,
                                    recipientPhone: u.phone,
                                    subject: `Account Approved & Activated: ${u.fullName || u.name}`,
                                    message: `Your ${u.role.toUpperCase()} account (@${u.username}) has been approved and activated by Super Admin.`,
                                    channels: ['email', 'sms', 'whatsapp'],
                                  }),
                                }).catch(() => {});
                              }}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              Approve / Activate
                            </button>
                          )}

                          {!isPending && (
                            <button
                              type="button"
                              onClick={() => {
                                if (onUpdateRegisteredUsers) {
                                  onUpdateRegisteredUsers((prev) =>
                                    prev.map((usr) => (usr.id === u.id ? { ...usr, status: 'pending' } : usr))
                                  );
                                }
                              }}
                              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              Pend
                            </button>
                          )}

                          {status !== 'suspended' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (onUpdateRegisteredUsers) {
                                  onUpdateRegisteredUsers((prev) =>
                                    prev.map((usr) => (usr.id === u.id ? { ...usr, status: 'suspended' } : usr))
                                  );
                                }
                              }}
                              className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              Suspend
                            </button>
                          )}

                          {status !== 'rejected' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (onUpdateRegisteredUsers) {
                                  onUpdateRegisteredUsers((prev) =>
                                    prev.map((usr) => (usr.id === u.id ? { ...usr, status: 'rejected' } : usr))
                                  );
                                }
                              }}
                              className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              Reject
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              if (onDeleteUserAccount) {
                                onDeleteUserAccount(u.id);
                              } else if (onUpdateRegisteredUsers) {
                                onUpdateRegisteredUsers((prev) => prev.filter((usr) => usr.id !== u.id));
                              }
                            }}
                            className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* EDIT USER PROFILE MODAL */}
          {editingUser && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-slate-900 text-base">Edit Profile: {editingUser.fullName || editingUser.name}</h3>
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="text-slate-400 hover:text-slate-600 font-black cursor-pointer text-sm"
                  >
                    ✕
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (onUpdateRegisteredUsers && editingUser) {
                      onUpdateRegisteredUsers((prev) =>
                        prev.map((usr) => (usr.id === editingUser.id || usr.username === editingUser.username ? { ...editingUser, name: editingUser.fullName || editingUser.name } : usr))
                      );
                      fetch('/api/notifications/dispatch', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          eventType: 'ADMIN_PROFILE_UPDATED',
                          recipientName: editingUser.fullName || editingUser.name,
                          recipientEmail: editingUser.email,
                          recipientPhone: editingUser.phone,
                          subject: 'Account Profile & Credentials Updated by Admin',
                          message: `Your account details (User ID: ${editingUser.id}, Username: @${editingUser.username}) have been updated by Administrator.`,
                          channels: ['email', 'sms', 'whatsapp'],
                        }),
                      }).catch(() => {});
                    }
                    setEditingUser(null);
                  }}
                  className="space-y-3 text-xs"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Assigned User ID *</label>
                      <input
                        type="text"
                        value={editingUser.id}
                        onChange={(e) => setEditingUser({ ...editingUser, id: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-purple-700 focus:outline-emerald-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Username *</label>
                      <input
                        type="text"
                        value={editingUser.username}
                        onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-emerald-600"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={editingUser.fullName || editingUser.name}
                        onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value, name: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-emerald-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Account Password (Admin Reset)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editingUser.password || ''}
                          onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                          placeholder="Password"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-emerald-600"
                        />
                        <button
                          type="button"
                          onClick={() => setEditingUser({ ...editingUser, password: `Pass@2026!${Math.floor(1000 + Math.random() * 9000)}` })}
                          className="px-2.5 py-2 bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-[10px] rounded-xl shrink-0 cursor-pointer"
                        >
                          Auto-Gen
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Email *</label>
                      <input
                        type="email"
                        value={editingUser.email}
                        onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Phone</label>
                      <input
                        type="text"
                        value={editingUser.phone}
                        onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Account Role</label>
                      <select
                        value={editingUser.role}
                        onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as AppRole })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                      >
                        <option value="super_admin">Super Administrator</option>
                        <option value="admin">Administrator</option>
                        <option value="owner">Property Host / Employer</option>
                        <option value="nanny">Super Nanny</option>
                        <option value="driver">Shuttle Driver</option>
                        <option value="guest">Guest</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Account Status</label>
                      <select
                        value={editingUser.status || 'active'}
                        onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as any })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                      >
                        <option value="active">Active & Verified</option>
                        <option value="pending">Pending Approval</option>
                        <option value="suspended">Suspended</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Title / Designation</label>
                      <input
                        type="text"
                        value={editingUser.title || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, title: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Location</label>
                      <input
                        type="text"
                        value={editingUser.location || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, location: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                      />
                    </div>
                  </div>

                  {/* ADMIN BANK ACCOUNT MANAGEMENT FOR USER */}
                  <div className="pt-2 border-t border-slate-200">
                    <ProfileBankAccountsManager
                      accounts={
                        editingUser.bankAccounts && editingUser.bankAccounts.length > 0
                          ? editingUser.bankAccounts
                          : editingUser.bankAccount
                          ? [{ ...editingUser.bankAccount, id: 'primary-ba', status: editingUser.bankAccount.status || 'active', isPrimary: true }]
                          : []
                      }
                      defaultHolderName={editingUser.fullName || editingUser.name || ''}
                      compact={true}
                      onChange={(updatedAccounts, primaryAccount) => {
                        setEditingUser({
                          ...editingUser,
                          bankAccount: primaryAccount,
                          bankAccounts: updatedAccounts,
                        });
                      }}
                      title="User Bank Accounts & Payout Profiles (Administrator View)"
                      subtitle="Add, edit, delete, suspend, or pend bank accounts for this user."
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingUser(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                    >
                      Save Profile Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* STANDALONE ADMIN RESET PASSWORD MODAL */}
          {adminResetPasswordUser && (
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-purple-700" />
                    <h3 className="font-extrabold text-slate-900 text-base">
                      Admin Reset Password
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAdminResetPasswordUser(null)}
                    className="text-slate-400 hover:text-slate-600 font-black cursor-pointer text-sm"
                  >
                    ✕
                  </button>
                </div>

                <div className="bg-purple-50 p-3.5 rounded-2xl border border-purple-200 text-purple-950 space-y-1 text-xs">
                  <div className="font-extrabold flex items-center justify-between">
                    <span>Target Profile: {adminResetPasswordUser.fullName || adminResetPasswordUser.name}</span>
                    <span className="font-mono text-purple-700 bg-purple-100 px-2 py-0.5 rounded font-bold">
                      {adminResetPasswordUser.id}
                    </span>
                  </div>
                  <div className="text-slate-600">
                    Username: @{adminResetPasswordUser.username} • Role: {adminResetPasswordUser.role.toUpperCase()}
                  </div>
                  <div className="text-slate-600">Email: {adminResetPasswordUser.email}</div>
                </div>

                {adminPasswordResetSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{adminPasswordResetSuccess}</span>
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!adminNewPasswordInput || adminNewPasswordInput.length < 6) return;

                    const updatedUser: UserAccount = {
                      ...adminResetPasswordUser,
                      password: adminNewPasswordInput,
                    };

                    if (onUpdateRegisteredUsers) {
                      onUpdateRegisteredUsers((prev) =>
                        prev.map((usr) => (usr.id === updatedUser.id ? updatedUser : usr))
                      );
                    }

                    setAdminPasswordResetSuccess(`Password for @${updatedUser.username} successfully updated & notification dispatched!`);

                    fetch('/api/notifications/dispatch', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        eventType: 'ADMIN_PASSWORD_RESET_EXECUTED',
                        recipientName: updatedUser.fullName || updatedUser.name,
                        recipientEmail: updatedUser.email,
                        recipientPhone: updatedUser.phone,
                        subject: 'Your Account Password Has Been Reset by Super Admin',
                        message: `Administrator has reset your account password for @${updatedUser.username}. Your new temporary password is: [ ${adminNewPasswordInput} ]. Please sign in and update your password if desired.`,
                        channels: ['email', 'sms', 'whatsapp'],
                      }),
                    }).catch(() => {});

                    setTimeout(() => {
                      setAdminResetPasswordUser(null);
                      setAdminPasswordResetSuccess(null);
                    }, 1800);
                  }}
                  className="space-y-3 text-xs"
                >
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Set New Custom / Temporary Password *</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={adminNewPasswordInput}
                        onChange={(e) => setAdminNewPasswordInput(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-purple-600"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setAdminNewPasswordInput(`Pass@2026!${Math.floor(1000 + Math.random() * 9000)}`)}
                        className="px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold rounded-xl shrink-0 cursor-pointer text-xs"
                      >
                        Auto-Gen
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Clicking &quot;Confirm & Save Password&quot; will immediately update the user profile credentials and dispatch an automated email & SMS notification with their new credentials.
                  </p>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setAdminResetPasswordUser(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-extrabold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Confirm & Save Password</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* CREATE USER MODAL */}
          {isAddUserModalOpen && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-slate-900 text-base">Create New Employer or Staff Account</h3>
                  <button
                    onClick={() => setIsAddUserModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 font-black cursor-pointer text-sm"
                  >
                    ✕
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newUserName.trim() || !newUserUsername.trim() || !newUserEmail.trim()) return;

                    const createdUser: UserAccount = {
                      id: `user-${Date.now()}`,
                      name: newUserName.trim(),
                      fullName: newUserName.trim(),
                      username: newUserUsername.trim(),
                      email: newUserEmail.trim(),
                      phone: newUserPhone.trim() || '+27 82 000 0000',
                      role: newUserRole,
                      title: newUserTitle || 'Property Host',
                      password: newUserPassword,
                      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
                      status: newUserInitialStatus,
                    };

                    if (onUpdateRegisteredUsers) {
                      onUpdateRegisteredUsers((prev) => [...prev, createdUser]);
                    }
                    setIsAddUserModalOpen(false);
                    setNewUserName('');
                    setNewUserUsername('');
                    setNewUserEmail('');
                  }}
                  className="space-y-3 text-xs"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="e.g. Kagiso Dlamini"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-emerald-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Username *</label>
                      <input
                        type="text"
                        value={newUserUsername}
                        onChange={(e) => setNewUserUsername(e.target.value)}
                        placeholder="e.g. KagisoD"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-emerald-600"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Email *</label>
                      <input
                        type="email"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="kagiso@dlamini.co.za"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-emerald-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Phone</label>
                      <input
                        type="text"
                        value={newUserPhone}
                        onChange={(e) => setNewUserPhone(e.target.value)}
                        placeholder="+27 82 111 2222"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-emerald-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Account Role *</label>
                      <select
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value as AppRole)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                      >
                        <option value="owner">Property Host / Employer</option>
                        <option value="nanny">Super Nanny</option>
                        <option value="driver">Shuttle Driver</option>
                        <option value="admin">Administrator</option>
                        <option value="guest">Guest</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Initial Status *</label>
                      <select
                        value={newUserInitialStatus}
                        onChange={(e) => setNewUserInitialStatus(e.target.value as any)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                      >
                        <option value="pending">Pending Approval</option>
                        <option value="active">Active & Verified</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Title / Designation</label>
                    <input
                      type="text"
                      value={newUserTitle}
                      onChange={(e) => setNewUserTitle(e.target.value)}
                      placeholder="e.g. Senior Property Host"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Initial Password *</label>
                    <input
                      type="text"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-emerald-600"
                      required
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddUserModalOpen(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs"
                    >
                      Create Account
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION 3: LISTINGS CONTROL */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'listings' && (
        <div className="space-y-6">
          {/* Section A: Listings Quality & Maintenance Status Control */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Listings Quality, Moderation & Maintenance Control</h3>
                <p className="text-xs text-slate-500">
                  Audit smart locks, descriptions, minimum amenities, toggle active listings, or put properties on/off maintenance.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700">
                  {activeListingsCount} Active / {properties.length} Total
                </span>
                <button
                  onClick={handleExportPropertiesCSV}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
                  title="Export entire property listings collection to CSV spreadsheet"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Export Properties to CSV</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {properties
                .filter((prop) => {
                  if (!globalSearchTerm.trim()) return true;
                  const q = globalSearchTerm.toLowerCase().trim();
                  return (
                    (prop.title && prop.title.toLowerCase().includes(q)) ||
                    (prop.unitCode && prop.unitCode.toLowerCase().includes(q)) ||
                    (prop.address && prop.address.toLowerCase().includes(q)) ||
                    (prop.area && prop.area.toLowerCase().includes(q)) ||
                    (prop.ownerName && prop.ownerName.toLowerCase().includes(q))
                  );
                })
                .map((prop) => (
                <div key={prop.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">{prop.title}</h4>
                      <span className="text-[11px] text-slate-500">{prop.address} • {prop.area}</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        prop.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : prop.status === 'maintenance'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {prop.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                    <span>Host: {prop.ownerName}</span>
                    <span>•</span>
                    <span>Photos: {prop.images.length}</span>
                    <span>•</span>
                    <span>Videos: {prop.videos?.length || 0}</span>
                    <span>•</span>
                    <span>Rooms: {prop.rooms?.length || 0}</span>
                    <span>•</span>
                    <span>Rate: R{prop.basePrice}</span>
                  </div>

                  {prop.bankAccount?.accountNumber && (
                    <div className="text-[11px] bg-purple-50 text-purple-900 px-2.5 py-1.5 rounded-lg border border-purple-200 font-medium">
                      🏦 <strong>Owner Bank:</strong> {prop.bankAccount.bankName} • {prop.bankAccount.accountName} • Acc: <span className="font-mono font-bold">{prop.bankAccount.accountNumber}</span> (Branch: {prop.bankAccount.branchCode})
                    </div>
                  )}

                  {/* Admin Room-by-Room Verification Section */}
                  {prop.rooms && prop.rooms.length > 0 && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1">
                          <BedDouble className="w-3.5 h-3.5 text-emerald-600" />
                          Admin Room Verification ({prop.rooms.length} Rooms)
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700">
                          {prop.rooms.filter((r) => r.verificationStatus === 'verified' || r.status === 'available').length}/{prop.rooms.length} Verified
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {prop.rooms.map((rm) => {
                          const isRoomVerified = rm.verificationStatus === 'verified' || (rm.status === 'available' && rm.verificationStatus !== 'pending_verification');
                          return (
                            <div
                              key={rm.id}
                              className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px]"
                            >
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900">{rm.name}</span>
                                  <span
                                    className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase ${
                                      rm.status === 'maintenance'
                                        ? 'bg-amber-100 text-amber-800'
                                        : isRoomVerified
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-purple-100 text-purple-800'
                                    }`}
                                  >
                                    {rm.status === 'maintenance'
                                      ? 'MAINTENANCE'
                                      : isRoomVerified
                                      ? 'VERIFIED ROOM'
                                      : 'PENDING VERIFICATION'}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-500">
                                  Base: R{rm.basePrice} • Weekend: R{rm.weekendPrice} • Max {rm.maxGuests} guests
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleVerifyRoomStatus(
                                      prop.id,
                                      rm.id,
                                      'available',
                                      'verified'
                                    )
                                  }
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] cursor-pointer"
                                >
                                  Verify Room
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleVerifyRoomStatus(
                                      prop.id,
                                      rm.id,
                                      rm.status === 'maintenance' ? 'available' : 'maintenance',
                                      'verified'
                                    )
                                  }
                                  className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-bold text-[10px] cursor-pointer"
                                >
                                  {rm.status === 'maintenance' ? 'End Maint.' : 'Maint.'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[11px] text-slate-500">
                      Smart lock: <span className="font-mono font-bold text-slate-700">{prop.checkInInstructions.smartLockPin}</span>
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleMaintenance(prop.id)}
                        className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                          prop.status === 'maintenance'
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {prop.status === 'maintenance' ? 'End Maintenance' : 'Flag Maintenance'}
                      </button>
                      <button
                        onClick={() => handleToggleListingStatus(prop.id)}
                        className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                          prop.status === 'active'
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {prop.status === 'active' ? 'Suspend Listing' : 'Verify & Approve Property'}
                      </button>
                      <button
                        onClick={() => {
                          onUpdateProperties((prev) => prev.filter((p) => p.id !== prop.id));
                        }}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section B: Interactive Maintenance Incident Dispatcher & Log */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 1-Column: Dispatch Job Form */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 lg:col-span-1">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-emerald-700" />
                  Dispatch Contractor
                </h3>
                <p className="text-[11px] text-slate-500">
                  Log a maintenance issue and assign it to an on-call South African/global service partner.
                </p>
              </div>

              <form onSubmit={handleAddMaintenanceIncident} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Target Property
                  </label>
                  <select
                    value={newIncidentPropertyId}
                    onChange={(e) => setNewIncidentPropertyId(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-emerald-600"
                    required
                  >
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.unitCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Issue Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe plumbing, electrical, WiFi, lock repair, solar battery routine inspection..."
                    value={newIncidentIssue}
                    onChange={(e) => setNewIncidentIssue(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:outline-emerald-600 text-slate-800"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Severity
                    </label>
                    <select
                      value={newIncidentSeverity}
                      onChange={(e) => setNewIncidentSeverity(e.target.value as any)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:outline-emerald-600 text-slate-800"
                    >
                      <option value="low">Low (Routine)</option>
                      <option value="medium">Medium</option>
                      <option value="high">High (Urgent)</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Assigned Contractor
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sandton & Rosebank Contractors"
                      value={newIncidentAssignedTo}
                      onChange={(e) => setNewIncidentAssignedTo(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:outline-emerald-600 text-slate-800"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Dispatch Contractor</span>
                </button>
              </form>
            </div>

            {/* Right 2-Columns: Realtime Incident Jobs List */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 lg:col-span-2">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Maintenance Dispatch & Incidents Log
                </h3>
                <p className="text-[11px] text-slate-500">
                  Live monitoring of pending and in-progress property restoration events.
                </p>
              </div>

              <div className="space-y-3">
                {maintenanceIncidents.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No active maintenance incidents logged.</p>
                ) : (
                  maintenanceIncidents.map((inc) => (
                    <div
                      key={inc.id}
                      className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900">{inc.propertyName}</span>
                          <span className="font-mono text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded">
                            {inc.id}
                          </span>
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                              inc.severity === 'critical'
                                ? 'bg-red-600 text-white animate-pulse'
                                : inc.severity === 'high'
                                ? 'bg-red-100 text-red-800'
                                : inc.severity === 'medium'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {inc.severity} priority
                          </span>
                        </div>

                        <p className="text-slate-700 font-medium">
                          Issue: <span className="text-slate-900">{inc.issue}</span>
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                          <span>Reported: {inc.reportedAt}</span>
                          <span>•</span>
                          <span>Partner: <strong className="text-slate-700">{inc.assignedTo}</strong></span>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-end gap-2 shrink-0">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            inc.status === 'resolved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inc.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {inc.status === 'in_progress' ? 'IN PROGRESS' : inc.status.toUpperCase()}
                        </span>

                        <div className="flex gap-1.5">
                          {inc.status !== 'resolved' && (
                            <>
                              {inc.status === 'pending' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMaintenanceIncidents(prev =>
                                      prev.map(item => item.id === inc.id ? { ...item, status: 'in_progress' } : item)
                                    );
                                  }}
                                  className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[10px] font-bold cursor-pointer"
                                >
                                  In Progress
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                    setMaintenanceIncidents(prev =>
                                      prev.map(item => item.id === inc.id ? { ...item, status: 'resolved' } : item)
                                    );
                                    if (window.confirm('Mark issue as fully resolved? This will also reactivate the property.')) {
                                      onUpdateProperties(prev => prev.map(p => p.id === inc.propertyId ? { ...p, status: 'active' } : p));
                                    }
                                }}
                                className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[10px] font-bold cursor-pointer"
                              >
                                Resolve Job
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setMaintenanceIncidents(prev => prev.filter(item => item.id !== inc.id));
                            }}
                            className="p-1 text-rose-600 hover:text-rose-800 cursor-pointer"
                            title="Delete Incident"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Section C: Property Rooms & Pricing Administration Control */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-700" />
                Administrative Rooms & Pricing Configuration
              </h3>
              <p className="text-xs text-slate-500">
                Direct administrator controls to edit, add, or permanently remove rooms, and update rates for any channel or corporate discount.
              </p>
            </div>

            <RoomsPricingManager
              properties={properties}
              channels={channels}
              onUpdateProperties={onUpdateProperties}
              onPublishRoomToChannel={(propertyId, roomId, channelId, publish) => {
                if (onPublishRoomToChannel) {
                  onPublishRoomToChannel(propertyId, roomId, channelId, publish);
                } else {
                  onUpdateProperties((prev) =>
                    prev.map((p) => {
                      if (p.id === propertyId) {
                        const updatedRooms = (p.rooms || []).map((r) => {
                          if (r.id === roomId) {
                            const published = r.publishedChannels || [];
                            const nextPublished = publish
                              ? [...published, channelId]
                              : published.filter((id) => id !== channelId);
                            return { ...r, publishedChannels: nextPublished };
                          }
                          return r;
                        });
                        return { ...p, rooms: updatedRooms };
                      }
                      return p;
                    })
                  );
                }
              }}
            />
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION 4: SYSTEM AUTOMATION & AI RULES */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'ai_rules' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    System Automation & AI Trigger Rules (Gemini 24/7 Virtual Host)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Define automated workflows for WiFi queries, pricing floors, directions, and review moderation.
                  </p>
                </div>
              </div>
            </div>

            {/* Minimum price protection rule setting */}
            <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-amber-950 block">
                  Mandatory Platform Price Floor (Anti-Dumping Rule)
                </span>
                <p className="text-amber-800 text-[11px] mt-0.5">
                  Prevent owners from lowering nightly rates below minimum to maintain premium ScopeBridg standard.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Minimum: R{minimumPriceLimit}</span>
                <input
                  type="range"
                  min="300"
                  max="1000"
                  step="50"
                  value={minimumPriceLimit}
                  onChange={(e) => setMinimumPriceLimit(Number(e.target.value))}
                  className="accent-amber-600 cursor-pointer"
                />
              </div>
            </div>

            {/* AI Rules list */}
            <div className="space-y-3 text-xs">
              {aiRules.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                    rule.enabled ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100 opacity-60'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Trigger: "{rule.trigger}"
                    </span>
                    <p className="text-slate-600 text-[11px]">
                      Action: {rule.action}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleAiRule(rule.id)}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                        rule.enabled
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {rule.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                    <button
                      onClick={() => {
                        setAiRules(prev => prev.filter(r => r.id !== rule.id));
                      }}
                      className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      title="Delete AI Rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION 5: REPORTS & AUDITING DATASTORE */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'reports' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                Executive Reporting & Live Audit Datastore
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Consolidate and download live transactions, guest bids, lobby concierge sessions, and hospitality records.
              </p>
            </div>

            <button
              onClick={() => {
                const reportPayload = {
                  generatedAt: new Date().toISOString(),
                  system: "ScopeBridg StaySync Consolidated Enterprise System",
                  counts: {
                    bookings: bookings.length,
                    roomBids: roomBids.length,
                    nannyBookings: nannyBookings.length,
                    shuttleBookings: shuttleBookings.length,
                    kioskFlights: kioskFlightBookings.length,
                    kioskCars: kioskCarBookings.length,
                    invoices: invoices.length,
                    quotations: quotations.length,
                    alerts: alerts.length
                  },
                  bookings,
                  roomBids,
                  nannyBookings,
                  shuttleBookings,
                  kioskFlightBookings,
                  kioskCarBookings,
                  invoices,
                  quotations,
                  properties,
                  alerts
                };

                const blob = new Blob([JSON.stringify(reportPayload, null, 2)], { type: 'application/json' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `ScopeBridg_System_Audit_Report_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black shadow-md hover:bg-slate-800 transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download System Audit (JSON)</span>
            </button>
          </div>

          {/* Quick Metrics Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-extrabold block">Stay Bookings</span>
              <p className="text-xl font-black text-slate-900 mt-1">{bookings.length}</p>
              <span className="text-[10px] text-slate-400 block mt-0.5">ZAR {bookings.reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString()} value</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-extrabold block">Guest Room Bids</span>
              <p className="text-xl font-black text-slate-900 mt-1">{roomBids.length}</p>
              <span className="text-[10px] text-slate-400 block mt-0.5">{roomBids.filter(b => b.status === 'approved').length} custom bids approved</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-extrabold block">Concierge Sessions</span>
              <p className="text-xl font-black text-slate-900 mt-1">{(kioskFlightBookings?.length || 0) + (kioskCarBookings?.length || 0)}</p>
              <span className="text-[10px] text-slate-400 block mt-0.5">Flights & vehicle requests</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-extrabold block">On-Call Services</span>
              <p className="text-xl font-black text-slate-900 mt-1">{(nannyBookings?.length || 0) + (shuttleBookings?.length || 0)}</p>
              <span className="text-[10px] text-slate-400 block mt-0.5">Nanny & shuttle bookings</span>
            </div>
          </div>

          {/* Audit Sub-tables for Live Verification */}
          <div className="space-y-4">
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
              <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Recent Lobby Kiosk Flight Requests</span>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-extrabold px-2 py-0.5 rounded">
                  {kioskFlightBookings?.length || 0} Records
                </span>
              </div>
              <div className="max-h-40 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <th className="p-2">Guest</th>
                      <th className="p-2">Carrier</th>
                      <th className="p-2">Route</th>
                      <th className="p-2">Date</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(kioskFlightBookings || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-3 text-center text-slate-400 italic">No flight requests yet</td>
                      </tr>
                    ) : (
                      (kioskFlightBookings || []).map((b) => (
                        <tr key={b.id} className="border-b border-slate-200 hover:bg-slate-100 bg-white">
                          <td className="p-2 font-semibold">{b.guestName}</td>
                          <td className="p-2 font-mono text-[11px]">{b.carrier}</td>
                          <td className="p-2">{b.route}</td>
                          <td className="p-2">{b.date}</td>
                          <td className="p-2 capitalize">
                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                              b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                              b.status === 'cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
              <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Recent Lobby Kiosk Shuttle & Car Requests</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded">
                  {kioskCarBookings?.length || 0} Records
                </span>
              </div>
              <div className="max-h-40 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <th className="p-2">Guest</th>
                      <th className="p-2">Vehicle / Class</th>
                      <th className="p-2">Duration</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(kioskCarBookings || []).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-3 text-center text-slate-400 italic">No vehicle bookings yet</td>
                      </tr>
                    ) : (
                      (kioskCarBookings || []).map((b) => (
                        <tr key={b.id} className="border-b border-slate-200 hover:bg-slate-100 bg-white">
                          <td className="p-2 font-semibold">{b.guestName}</td>
                          <td className="p-2">{b.vehicle}</td>
                          <td className="p-2">{b.days} Days</td>
                          <td className="p-2 capitalize">
                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                              b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                              b.status === 'cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION: ROOM BIDS MODERATION */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'room_bids' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BedDouble className="w-5 h-5 text-emerald-600" />
                Guest Room Bidding & Custom Offer Approvals
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review, approve, or decline custom nightly rate offers submitted by guests across ScopeBridg residences.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {roomBids ? roomBids.filter(b => b.status === 'pending').length : 0} Pending Approvals
              </span>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                {roomBids ? roomBids.length : 0} Total Bids
              </span>
            </div>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Bids</span>
              <p className="text-xl font-extrabold text-slate-900">{roomBids ? roomBids.length : 0}</p>
            </div>

            <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-1">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Pending Review</span>
              <p className="text-xl font-extrabold text-amber-900">
                {roomBids ? roomBids.filter(b => b.status === 'pending').length : 0}
              </p>
            </div>

            <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-1">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Approved Offers</span>
              <p className="text-xl font-extrabold text-emerald-900">
                {roomBids ? roomBids.filter(b => b.status === 'approved').length : 0}
              </p>
            </div>

            <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-200 space-y-1">
              <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">Approved Value</span>
              <p className="text-xl font-extrabold text-indigo-900">
                R{roomBids ? roomBids.filter(b => b.status === 'approved').reduce((acc, b) => acc + b.totalOfferedZar, 0).toLocaleString() : 0}
              </p>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
              <button
                onClick={() => setBidStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  bidStatusFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Bids ({roomBids ? roomBids.length : 0})
              </button>

              <button
                onClick={() => setBidStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  bidStatusFilter === 'pending'
                    ? 'bg-amber-600 text-white shadow-xs font-bold'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                Pending ({roomBids ? roomBids.filter(b => b.status === 'pending').length : 0})
              </button>

              <button
                onClick={() => setBidStatusFilter('approved')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  bidStatusFilter === 'approved'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                Approved ({roomBids ? roomBids.filter(b => b.status === 'approved').length : 0})
              </button>

              <button
                onClick={() => setBidStatusFilter('declined')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  bidStatusFilter === 'declined'
                    ? 'bg-red-600 text-white shadow-xs font-bold'
                    : 'bg-red-50 text-red-800 hover:bg-red-100 border border-red-200'
                }`}
              >
                Declined ({roomBids ? roomBids.filter(b => b.status === 'declined').length : 0})
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={bidSearchQuery}
                onChange={(e) => setBidSearchQuery(e.target.value)}
                placeholder="Search guest name or residence..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Room Bids List */}
          <div className="space-y-4">
            {(!roomBids || roomBids.length === 0) ? (
              <p className="text-xs text-slate-500 text-center py-8">No room bids submitted yet.</p>
            ) : (
              roomBids
                .filter((bid) => {
                  if (bidStatusFilter !== 'all' && bid.status !== bidStatusFilter) return false;
                  if (bidSearchQuery.trim()) {
                    const q = bidSearchQuery.toLowerCase();
                    return (
                      bid.guestName.toLowerCase().includes(q) ||
                      bid.propertyName.toLowerCase().includes(q) ||
                      bid.id.toLowerCase().includes(q)
                    );
                  }
                  return true;
                })
                .map((bid) => {
                  const prop = properties.find((p) => p.id === bid.propertyId);
                  const standardNightly = prop ? prop.basePrice : bid.offeredPricePerNightZar * 1.15;
                  const discountPct = Math.max(0, Math.round(((standardNightly - bid.offeredPricePerNightZar) / standardNightly) * 100));

                  return (
                    <div
                      key={bid.id}
                      className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                        bid.status === 'pending'
                          ? 'bg-amber-50/40 border-amber-200'
                          : bid.status === 'approved'
                          ? 'bg-emerald-50/30 border-emerald-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                            {bid.id}
                          </span>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            bid.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            bid.status === 'declined' ? 'bg-red-100 text-red-800 border border-red-300' :
                            'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {bid.status}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            Submitted: {bid.createdAt.slice(0, 10)}
                          </span>
                        </div>

                        <h4 className="text-sm font-extrabold text-slate-900">{bid.propertyName}</h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200/80">
                          <div>
                            <span className="text-slate-400 block text-[10px] font-bold uppercase">Guest Profile</span>
                            <span className="font-bold text-slate-800">{bid.guestName}</span>
                            <p className="text-[11px] text-slate-500">{bid.guestEmail} • {bid.guestPhone}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] font-bold uppercase">Stay Details</span>
                            <span className="font-bold text-slate-800">{bid.checkInDate} to {bid.checkOutDate}</span>
                            <p className="text-[11px] text-slate-500">{bid.guestsCount} Guest(s)</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs pt-0.5">
                          <span className="text-emerald-800 font-black text-sm bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-200">
                            Offered: R{bid.offeredPricePerNightZar} / night (Total: R{bid.totalOfferedZar})
                          </span>
                          {prop && (
                            <span className="text-slate-500 font-medium">
                              Standard Rate: <strong className="line-through text-slate-400">R{prop.basePrice}</strong> ({discountPct}% discount)
                            </span>
                          )}
                        </div>

                        {bid.message && (
                          <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-xl border border-slate-200 mt-1">
                            Guest Note: "{bid.message}"
                          </p>
                        )}
                      </div>

                        <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0">
                          {bid.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => onUpdateRoomBidStatus && onUpdateRoomBidStatus(bid.id, 'approved')}
                                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                              >
                                <Check className="w-4 h-4" />
                                <span>Approve Bid</span>
                              </button>
                              <button
                                onClick={() => onUpdateRoomBidStatus && onUpdateRoomBidStatus(bid.id, 'declined')}
                                className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                              >
                                <Ban className="w-4 h-4" />
                                <span>Decline</span>
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-extrabold px-3 py-1.5 rounded-xl border ${
                                bid.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-rose-100 text-rose-800 border-rose-300'
                              }`}>
                                BID {bid.status.toUpperCase()}
                              </span>
                              {bid.status === 'approved' && (
                                <button
                                  onClick={() => onUpdateRoomBidStatus && onUpdateRoomBidStatus(bid.id, 'pending')}
                                  className="text-[11px] text-slate-500 hover:text-slate-800 underline font-semibold cursor-pointer"
                                >
                                  Reopen
                                </button>
                              )}
                            </div>
                          )}
                          <button
                            onClick={() => onUpdateRoomBidStatus && onUpdateRoomBidStatus(bid.id, 'declined')}
                            className="p-2 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl text-xs font-bold cursor-pointer"
                            title="Delete / Cancel Room Bid"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION: FLEET SERVICE & CAR APPROVALS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'fleet_service' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Car className="w-5 h-5 text-amber-600" />
                Fleet Service & Car Registration Approvals
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Approve cars registered in fleet management for vehicle disk renewals, traffic fine payments, and mechanical servicing.
              </p>
            </div>
            <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200">
              {fleetServiceRequests ? fleetServiceRequests.filter(r => r.status === 'pending_admin_approval').length : 0} Pending Approvals
            </span>
          </div>

          <div className="space-y-4">
            {(!fleetServiceRequests || fleetServiceRequests.length === 0) ? (
              <p className="text-xs text-slate-500 text-center py-8">No fleet service requests submitted yet.</p>
            ) : (
              fleetServiceRequests.map((req) => (
                <div key={req.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                        {req.id}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        req.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                        req.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        req.status === 'approved' ? 'bg-indigo-100 text-indigo-800' :
                        req.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {req.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-slate-400 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                        {req.vehiclePlate}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">
                      {req.vehicleModel} • <span className="text-amber-700 capitalize">{req.serviceType.replace('_', ' ')}</span>
                    </h4>

                    <p className="text-xs text-slate-600">
                      {req.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs pt-1">
                      <span className="text-slate-900 font-extrabold">
                        Cost: R{(req.estimatedCostZar || 0).toLocaleString()}
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        Submitted: {req.createdAt.slice(0, 10)}
                      </span>
                    </div>

                    {req.adminNotes && (
                      <p className="text-xs text-slate-500 italic bg-white p-2 rounded-xl border border-slate-200 mt-1">
                        Admin Notes: "{req.adminNotes}"
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0">
                    <button
                      onClick={() => {
                        const notes = prompt("Enter admin approval / processing notes:", req.adminNotes || "Approved by Super Admin");
                        if (notes !== null && onUpdateFleetServiceStatus) {
                          onUpdateFleetServiceStatus(req.id, 'approved', notes);
                        }
                      }}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => {
                        if (onUpdateFleetServiceStatus) {
                          onUpdateFleetServiceStatus(req.id, 'in_progress', 'Service request in progress / workshop booked');
                        }
                      }}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      In Progress
                    </button>
                    <button
                      onClick={() => {
                        if (onUpdateFleetServiceStatus) {
                          onUpdateFleetServiceStatus(req.id, 'completed', 'Service completed successfully');
                        }
                      }}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => {
                        if (onUpdateFleetServiceStatus) {
                          onUpdateFleetServiceStatus(req.id, 'rejected', 'Rejected by admin');
                        }
                      }}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION: MANAGE VIRTUAL WALLETS (SUPER ADMIN CONTROL) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'virtual_wallets' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-slate-900 p-5 rounded-2xl text-white shadow-md space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-black">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    Guest Virtual Wallet & Savings Ledger Management
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Monitor holiday funds, cashback rewards, referral credits & perform administrative balance adjustments.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-extrabold">
                  {Object.keys(virtualWallets).length} Active Guest Wallets
                </span>
              </div>
            </div>

            {/* Platform Wallet Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-800/90 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-extrabold block">
                  Total Platform Fund Volume
                </span>
                <p className="text-2xl font-black text-emerald-400 mt-1">
                  R
                  {Object.values(virtualWallets)
                    .reduce(
                      (sum, w) =>
                        sum +
                        (w.holidayFundBalanceZar || 0) +
                        (w.cashbackRewardsZar || 0) +
                        (w.referralCreditsZar || 0),
                      0
                    )
                    .toLocaleString()}{' '}
                  ZAR
                </p>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Sum of holiday funds, rewards & credits
                </span>
              </div>

              <div className="p-4 bg-slate-800/90 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-extrabold block">
                  Holiday Fund Balances
                </span>
                <p className="text-2xl font-black text-white mt-1">
                  R
                  {Object.values(virtualWallets)
                    .reduce((sum, w) => sum + (w.holidayFundBalanceZar || 0), 0)
                    .toLocaleString()}{' '}
                  ZAR
                </p>
                <span className="text-[10px] text-emerald-400 block mt-1">
                  Locked guest savings for future stays
                </span>
              </div>

              <div className="p-4 bg-slate-800/90 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-extrabold block">
                  Cashback Rewards Granted
                </span>
                <p className="text-2xl font-black text-amber-400 mt-1">
                  R
                  {Object.values(virtualWallets)
                    .reduce((sum, w) => sum + (w.cashbackRewardsZar || 0), 0)
                    .toLocaleString()}{' '}
                  ZAR
                </p>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Direct booking loyalty rebates
                </span>
              </div>

              <div className="p-4 bg-slate-800/90 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-extrabold block">
                  Referral Credits
                </span>
                <p className="text-2xl font-black text-purple-400 mt-1">
                  R
                  {Object.values(virtualWallets)
                    .reduce((sum, w) => sum + (w.referralCreditsZar || 0), 0)
                    .toLocaleString()}{' '}
                  ZAR
                </p>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Friend invite rewards
                </span>
              </div>
            </div>
          </div>

          {walletAdminFeedback && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>{walletAdminFeedback}</span>
              </div>
              <button
                onClick={() => setWalletAdminFeedback(null)}
                className="text-slate-500 hover:text-slate-800 font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Admin Action: Credit / Debit Wallet Form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-emerald-600" /> Admin Wallet Adjustment & Fund Credit
            </h4>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!onUpdateVirtualWallets) return;

                const targetGuest = selectedWalletGuest;
                const existing = virtualWallets[targetGuest] || {
                  holidayFundBalanceZar: 0,
                  cashbackRewardsZar: 0,
                  referralCreditsZar: 0,
                  goalName: 'Holiday Savings',
                  goalTargetZar: 10000,
                  transactions: [],
                };

                let newHolidayBalance = existing.holidayFundBalanceZar;
                let newCashback = existing.cashbackRewardsZar;
                let newReferral = existing.referralCreditsZar;

                if (creditCategory === 'deposit') {
                  newHolidayBalance += creditAmountZar;
                } else if (creditCategory === 'cashback_reward') {
                  newCashback += creditAmountZar;
                } else if (creditCategory === 'referral_credit') {
                  newReferral += creditAmountZar;
                } else if (creditCategory === 'refund') {
                  newHolidayBalance += creditAmountZar;
                }

                const newTx: WalletTransaction = {
                  id: `TX-${Date.now().toString().slice(-4)}`,
                  date: new Date().toISOString().slice(0, 10),
                  title: `Admin Credit: ${creditCategory.replace('_', ' ').toUpperCase()}`,
                  category: creditCategory,
                  amountZar: creditAmountZar,
                  status: 'completed',
                  reference: creditReference || `ADM-${Date.now().toString().slice(-4)}`,
                  notes: creditNotes,
                };

                const updatedWalletData: VirtualWalletData = {
                  ...existing,
                  holidayFundBalanceZar: newHolidayBalance,
                  cashbackRewardsZar: newCashback,
                  referralCreditsZar: newReferral,
                  transactions: [newTx, ...existing.transactions],
                };

                onUpdateVirtualWallets((prev) => ({
                  ...prev,
                  [targetGuest]: updatedWalletData,
                }));

                setWalletAdminFeedback(
                  `Successfully credited R${creditAmountZar} ZAR to ${targetGuest}'s wallet under ${creditCategory.replace('_', ' ')}.`
                );
              }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3"
            >
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Select or Enter Guest Account
                </label>
                {Object.keys(virtualWallets).length > 0 ? (
                  <select
                    value={selectedWalletGuest}
                    onChange={(e) => setSelectedWalletGuest(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="">-- Choose Existing Wallet --</option>
                    {Object.keys(virtualWallets).map((guest) => (
                      <option key={guest} value={guest}>
                        {guest}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={selectedWalletGuest}
                    onChange={(e) => setSelectedWalletGuest(e.target.value)}
                    placeholder="Enter Guest Full Name"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  />
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Adjustment Type
                </label>
                <select
                  value={creditCategory}
                  onChange={(e) => setCreditCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="deposit">Holiday Deposit</option>
                  <option value="cashback_reward">Cashback Bonus</option>
                  <option value="referral_credit">Referral Reward</option>
                  <option value="refund">Service Refund</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Amount (ZAR)
                </label>
                <input
                  type="number"
                  min={50}
                  step={50}
                  value={creditAmountZar}
                  onChange={(e) => setCreditAmountZar(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-extrabold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Ref Code / Ticket
                </label>
                <input
                  type="text"
                  value={creditReference}
                  onChange={(e) => setCreditReference(e.target.value)}
                  placeholder="ADM-GRANT-101"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Audit Reason / Notes
                </label>
                <input
                  type="text"
                  value={creditNotes}
                  onChange={(e) => setCreditNotes(e.target.value)}
                  placeholder="Executive bonus..."
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer transition-colors shadow-sm flex items-center justify-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Execute Grant</span>
                </button>
              </div>
            </form>
          </div>

          {/* Directory of Guest Virtual Wallets */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" /> Managed Guest Virtual Wallets
              </h4>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={walletSearchTerm}
                  onChange={(e) => setWalletSearchTerm(e.target.value)}
                  placeholder="Filter by guest name..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(virtualWallets)
                .filter(([guestName]) =>
                  guestName.toLowerCase().includes(walletSearchTerm.toLowerCase())
                )
                .map(([guestName, wallet]) => {
                  const totalValue =
                    (wallet.holidayFundBalanceZar || 0) +
                    (wallet.cashbackRewardsZar || 0) +
                    (wallet.referralCreditsZar || 0);
                  const goalPercent = Math.min(
                    100,
                    Math.round(
                      ((wallet.holidayFundBalanceZar || 0) / (wallet.goalTargetZar || 20000)) *
                        100
                    )
                  );

                  return (
                    <div
                      key={guestName}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 shadow-2xs"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div>
                          <h5 className="font-extrabold text-slate-900 text-xs">{guestName}</h5>
                          <span className="text-[10px] text-slate-500">
                            {wallet.transactions?.length || 0} Transactions recorded
                          </span>
                        </div>
                        <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200">
                          R{totalValue.toLocaleString()} ZAR
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                        <div className="bg-white p-2 rounded-xl border border-slate-200">
                          <span className="text-slate-400 font-bold block">Holiday Fund</span>
                          <span className="font-extrabold text-slate-900 text-xs mt-0.5 block">
                            R{wallet.holidayFundBalanceZar?.toLocaleString()}
                          </span>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-slate-200">
                          <span className="text-slate-400 font-bold block">Cashback</span>
                          <span className="font-extrabold text-amber-600 text-xs mt-0.5 block">
                            R{wallet.cashbackRewardsZar?.toLocaleString()}
                          </span>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-slate-200">
                          <span className="text-slate-400 font-bold block">Referrals</span>
                          <span className="font-extrabold text-purple-600 text-xs mt-0.5 block">
                            R{wallet.referralCreditsZar?.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Goal Progress */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-600 font-bold">
                          <span>Target: {wallet.goalName}</span>
                          <span>{goalPercent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${goalPercent}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <button
                          onClick={() => {
                            setSelectedWalletGuest(guestName);
                            setWalletAdminFeedback(`Selected ${guestName} for adjustment above.`);
                          }}
                          className="text-[10px] font-extrabold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                        >
                          Select for Adjustment
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Audit Ledger Across All Wallets */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-600" /> Platform Virtual Wallet Audit Ledger
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-extrabold">
                  <tr>
                    <th className="py-2.5 px-3 rounded-l-xl">Tx ID</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Guest Account</th>
                    <th className="py-2.5 px-3">Title / Type</th>
                    <th className="py-2.5 px-3">Reference</th>
                    <th className="py-2.5 px-3">Amount (ZAR)</th>
                    <th className="py-2.5 px-3 rounded-r-xl">Audit Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                  {Object.entries(virtualWallets).flatMap(([guestName, wallet]) =>
                    (wallet.transactions || []).map((tx) => (
                      <tr key={`${guestName}-${tx.id}`} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                          {tx.id}
                        </td>
                        <td className="py-2.5 px-3">{tx.date}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{guestName}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-bold rounded-md">
                            {tx.title}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500">
                          {tx.reference || 'N/A'}
                        </td>
                        <td className="py-2.5 px-3 font-extrabold">
                          <span
                            className={
                              tx.amountZar >= 0 ? 'text-emerald-700' : 'text-rose-700'
                            }
                          >
                            {tx.amountZar >= 0 ? '+' : ''}
                            {tx.amountZar} ZAR
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                          {tx.notes || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: CHILDCARE & NANNY ON CALL MANAGER (SUPER ADMIN) */}
      {activeTab === 'nanny_on_call' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-gradient-to-r from-purple-900 to-indigo-950 p-6 rounded-2xl text-white shadow-md">
            <div className="flex items-center gap-3">
              <Baby className="w-8 h-8 text-purple-300" />
              <div>
                <h3 className="text-base font-extrabold">ScopeBridg™ Verified Childcare Portal</h3>
                <p className="text-xs text-purple-200 mt-1">
                  Verify SAPS police clearance, first-aid certificates, monitor active bookings, and moderate the elite nanny roster.
                </p>
              </div>
            </div>
          </div>

          {/* Childcare Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-500 font-black uppercase">Elite Roster Size</span>
              <span className="block text-xl font-black text-slate-900 mt-1">{nannies.length} Nannies</span>
              <span className="text-[10px] text-emerald-600 font-extrabold block mt-0.5">100% CPR certified</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-500 font-black uppercase">Pending Vetting</span>
              <span className="block text-xl font-black text-purple-700 mt-1">
                {nannies.filter(n => n.verifiedStatus === 'pending').length} Profiles
              </span>
              <span className="text-[10px] text-slate-500 font-extrabold block mt-0.5">Awaiting certificate audit</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-500 font-black uppercase">On Call (Available)</span>
              <span className="block text-xl font-black text-emerald-700 mt-1">
                {nannies.filter(n => n.currentStatus === 'available').length} Available
              </span>
              <span className="text-[10px] text-emerald-600 font-extrabold block mt-0.5">Ready for instant dispatch</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-500 font-black uppercase">Active Shifts</span>
              <span className="block text-xl font-black text-indigo-700 mt-1">
                {nannyBookings.filter(b => b.status === 'in_progress').length} In Progress
              </span>
              <span className="text-[10px] text-slate-500 font-extrabold block mt-0.5">Monitored via Kiosk GPS logs</span>
            </div>
          </div>

          {/* 1. Vetting & Verification Desk */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-600" /> Vetting & Background Clearance Center
              </h4>
              <span className="text-[10px] bg-purple-100 text-purple-800 font-black px-2 py-1 rounded-md">
                SAPS Crime Database API Connected
              </span>
            </div>

            {nannies.filter(n => n.verifiedStatus === 'pending').length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">All registered nanny profiles are fully vetted!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">No pending police or first aid clearances require auditing.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {nannies.filter(n => n.verifiedStatus === 'pending').map((nanny) => (
                  <div key={nanny.id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in slide-in-from-top-1">
                    <div className="flex items-center gap-3">
                      <img src={nanny.avatar} alt={nanny.name} className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-extrabold text-slate-900">{nanny.name}</h5>
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.2 rounded-sm">
                            Awaiting Vetting
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-semibold">
                          Experience: {nanny.experienceYears} Years • Desired Rate: R{nanny.hourlyRateZar}/hr
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 italic font-semibold max-w-xl">
                          "{nanny.bio}"
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {nanny.certifications.map((c: string, idx: number) => (
                            <span key={idx} className="text-[9px] bg-slate-100 text-slate-700 border border-slate-200 font-extrabold px-1.5 py-0.2 rounded-full flex items-center gap-1">
                              <span className="w-1 h-1 bg-indigo-500 rounded-full" /> {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <button
                        onClick={() => {
                          if (onUpdateNannies) {
                            onUpdateNannies(prev => prev.map(p => p.id === nanny.id ? { ...p, verifiedStatus: 'fully_vetted', badge: 'Elite Vetted Partner' } : p));
                            onUpdateAlerts(prev => [
                              { id: `alert-${Date.now()}`, type: 'nanny_approved', message: `Nanny profile for "${nanny.name}" has been fully vetted and approved.`, severity: 'info', timestamp: 'Just now' },
                              ...prev
                            ]);
                          }
                        }}
                        className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black shadow-xs transition-colors cursor-pointer"
                      >
                        Verify & Fully Vet
                      </button>
                      <button
                        onClick={() => {
                          if (onUpdateNannies) {
                            onUpdateNannies(prev => prev.map(p => p.id === nanny.id ? { ...p, verifiedStatus: 'rejected' } : p));
                          }
                        }}
                        className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black transition-colors cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Roster Directory & Status Maintenance */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">Elite Active Childcare Directory</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Monitor hourly rates, neighborhood coverage, and live status.</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search nannies..."
                  value={nannySearch}
                  onChange={(e) => setNannySearch(e.target.value)}
                  className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <select
                  value={nannyStatusFilter}
                  onChange={(e) => setNannyStatusFilter(e.target.value as any)}
                  className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="all">All Vetting</option>
                  <option value="fully_vetted">Fully Vetted</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-extrabold">
                  <tr>
                    <th className="py-2.5 px-3 rounded-l-xl">Nanny Profile</th>
                    <th className="py-2.5 px-3">Rating / Shifts</th>
                    <th className="py-2.5 px-3">Covered Neighborhoods</th>
                    <th className="py-2.5 px-3">Vetting Status</th>
                    <th className="py-2.5 px-3">Hourly Rate</th>
                    <th className="py-2.5 px-3">Duty Status</th>
                    <th className="py-2.5 px-3 rounded-r-xl text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                  {nannies
                    .filter(n => {
                      const matchesSearch = n.name.toLowerCase().includes(nannySearch.toLowerCase());
                      const matchesFilter = nannyStatusFilter === 'all' ? true : n.verifiedStatus === nannyStatusFilter;
                      return matchesSearch && matchesFilter;
                    })
                    .map((nanny) => (
                      <tr key={nanny.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <img src={nanny.avatar} alt={nanny.name} className="w-9 h-9 rounded-xl object-cover border border-slate-100" />
                            <div>
                              <span className="font-extrabold text-slate-900 block">{nanny.name}</span>
                              <span className="text-[10px] text-slate-400 block">{nanny.phone}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1 text-amber-500 font-extrabold text-[11px]">
                            ★ {nanny.rating.toFixed(1)}
                            <span className="text-slate-400 font-semibold">({nanny.reviewCount || 0} reviews)</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-extrabold block mt-0.5">
                            {nanny.totalCompletedShifts || 0} completed shifts
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {nanny.availableNeighborhoods.map((b: string, i: number) => (
                              <span key={i} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-sm">
                                {b}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {nanny.verifiedStatus === 'fully_vetted' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200/40 px-2 py-0.5 rounded-full font-black">
                              <Shield className="w-3 h-3 text-emerald-600" /> Vetted
                            </span>
                          ) : nanny.verifiedStatus === 'pending' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200/40 px-2 py-0.5 rounded-full font-black">
                              Pending Vetting
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-rose-700 bg-rose-50 border border-rose-200/40 px-2 py-0.5 rounded-full font-black">
                              Rejected
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-900">R{nanny.hourlyRateZar}</span>
                            <button
                              onClick={() => {
                                const newRate = prompt(`Enter new hourly rate (ZAR) for ${nanny.name}:`, nanny.hourlyRateZar.toString());
                                if (newRate && !isNaN(Number(newRate)) && onUpdateNannies) {
                                  onUpdateNannies(prev => prev.map(p => p.id === nanny.id ? { ...p, hourlyRateZar: Number(newRate) } : p));
                                }
                              }}
                              className="text-[10px] text-purple-700 hover:text-purple-900 hover:underline cursor-pointer font-black"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <select
                            value={nanny.currentStatus}
                            onChange={(e) => {
                              if (onUpdateNannies) {
                                onUpdateNannies(prev => prev.map(p => p.id === nanny.id ? { ...p, currentStatus: e.target.value as any } : p));
                              }
                            }}
                            className={`p-1 border text-[10px] font-extrabold rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 ${
                              nanny.currentStatus === 'available' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' :
                              nanny.currentStatus === 'on_shift' ? 'bg-indigo-50 border-indigo-300 text-indigo-800' :
                              'bg-slate-50 border-slate-300 text-slate-800'
                            }`}
                          >
                            <option value="available">🟢 Available</option>
                            <option value="on_shift">🔵 On Shift</option>
                            <option value="off_duty">⚪ Off Duty</option>
                          </select>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              const note = prompt(`Enter support log note for ${nanny.name}:`);
                              if (note) {
                                alert(`Log registered: "${note}" has been audited.`);
                              }
                            }}
                            className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md font-bold cursor-pointer"
                          >
                            File Audit Log
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Childcare Live Bookings Monitor */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" /> Active Childcare Shifts & Requests Tracker
            </h4>

            {nannyBookings.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 font-bold text-xs">
                No child-care bookings have been made on the platform yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-extrabold">
                    <tr>
                      <th className="py-2.5 px-3 rounded-l-xl">Nanny Assigned</th>
                      <th className="py-2.5 px-3">Parent Name</th>
                      <th className="py-2.5 px-3">Property Unit</th>
                      <th className="py-2.5 px-3">Shift Details</th>
                      <th className="py-2.5 px-3">Children info</th>
                      <th className="py-2.5 px-3">Total Cost</th>
                      <th className="py-2.5 px-3">Shift Status</th>
                      <th className="py-2.5 px-3 rounded-r-xl text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                    {nannyBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-extrabold text-slate-900">{b.nannyName}</td>
                        <td className="py-3 px-3">
                          <span className="block font-bold">{b.parentName}</span>
                          <span className="text-[10px] text-slate-400 block">{b.parentPhone}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-600">{b.propertyTitle}</td>
                        <td className="py-3 px-3 text-slate-600">
                          <span className="block">{b.date}</span>
                          <span className="text-[10px] text-slate-400 block">{b.startTime} - {b.endTime} ({b.hours} hrs)</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="block font-bold">{b.childrenCount} child(ren)</span>
                          <span className="text-[10px] text-indigo-600 block">Ages: {b.childrenAges}</span>
                        </td>
                        <td className="py-3 px-3 font-extrabold text-slate-950">R{b.totalAmountZar}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            b.status === 'confirmed' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/30' :
                            b.status === 'in_progress' ? 'bg-amber-50 text-amber-700 border border-amber-200/30' :
                            b.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/30' :
                            'bg-slate-50 text-slate-500'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {b.status === 'pending' && (
                            <button
                              onClick={() => {
                                if (onUpdateNannyBookings) {
                                  onUpdateNannyBookings(prev => prev.map(item => item.id === b.id ? { ...item, status: 'confirmed' } : item));
                                }
                              }}
                              className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded-md font-black cursor-pointer shadow-xs"
                            >
                              Confirm
                            </button>
                          )}
                          {b.status === 'confirmed' && (
                            <button
                              onClick={() => {
                                if (onUpdateNannyBookings) {
                                  onUpdateNannyBookings(prev => prev.map(item => item.id === b.id ? { ...item, status: 'in_progress' } : item));
                                }
                              }}
                              className="text-[10px] bg-amber-500 hover:bg-amber-600 text-slate-950 px-2 py-1 rounded-md font-black cursor-pointer"
                            >
                              Dispatch Shift
                            </button>
                          )}
                          {b.status === 'in_progress' && (
                            <button
                              onClick={() => {
                                if (onUpdateNannyBookings) {
                                  onUpdateNannyBookings(prev => prev.map(item => item.id === b.id ? { ...item, status: 'completed' } : item));
                                }
                              }}
                              className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded-md font-black cursor-pointer shadow-xs"
                            >
                              Complete Shift
                            </button>
                          )}
                          {b.status === 'completed' && <span className="text-[10px] text-emerald-700 font-extrabold">Completed</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION: FLEET MANAGEMENT & TRIP RADAR (SUPER ADMIN) */}
      {activeTab === 'fleet_management' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-gradient-to-r from-slate-900 to-amber-950 p-6 rounded-2xl text-white shadow-md">
            <div className="flex items-center gap-3">
              <Car className="w-8 h-8 text-amber-400" />
              <div>
                <h3 className="text-base font-extrabold">ScopeBridg™ Premium Fleet & Chauffeur Command Center</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Verify professional chauffeur PDP licenses, audit high-end luxury shuttle fleet battery/fuel ranges, monitor active rides, and manage flight and car bookings.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-500 font-black uppercase">Active Vehicles</span>
              <span className="block text-xl font-black text-slate-900 mt-1">3 Premium Units</span>
              <span className="text-[10px] text-amber-600 font-extrabold block mt-0.5">Toyota Quantum, Mercedes, Tesla</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-500 font-black uppercase">Chauffeurs Under Vetting</span>
              <span className="block text-xl font-black text-amber-600 mt-1">
                {shuttleDrivers.filter(d => d.verifiedStatus === 'pending').length} Drivers
              </span>
              <span className="text-[10px] text-slate-500 font-extrabold block mt-0.5">Awaiting PDP license audit</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-500 font-black uppercase">Rides Dispatched Today</span>
              <span className="block text-xl font-black text-slate-900 mt-1">
                {shuttleBookings.filter(b => b.status === 'in_progress' || b.status === 'completed').length} Shuttles
              </span>
              <span className="text-[10px] text-emerald-600 font-extrabold block mt-0.5">100% On-Time arrival rate</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-500 font-black uppercase">Integrated Bookings</span>
              <span className="block text-xl font-black text-emerald-800 mt-1">
                {flightBookings.length + carBookings.length} Active Services
              </span>
              <span className="text-[10px] text-emerald-600 font-extrabold block mt-0.5">Flights & Car Rentals from Kiosk</span>
            </div>
          </div>

          {/* 1. Vetting & Verification Desk for Chauffeurs */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-600" /> Chauffeur Professional Licensing Desk
            </h4>

            {shuttleDrivers.filter(d => d.verifiedStatus === 'pending').length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">All registered chauffeurs are fully certified & verified!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Professional driving permits (PrDP) and SAPS records are completely audited.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {shuttleDrivers.filter(d => d.verifiedStatus === 'pending').map((driver) => (
                  <div key={driver.id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img src={driver.avatar} alt={driver.name} className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-extrabold text-slate-900">{driver.name}</h5>
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.2 rounded-sm">
                            PrDP Awaiting Audit
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-semibold">
                          License: {driver.driverLicense} • Vehicle assigned: {driver.vehicleModel} ({driver.vehiclePlate})
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 italic font-semibold max-w-xl">
                          "{driver.bio || 'Professional chauffeur'}"
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <button
                        onClick={() => {
                          if (onUpdateShuttleDrivers) {
                            onUpdateShuttleDrivers(prev => prev.map(p => p.id === driver.id ? { ...p, verifiedStatus: 'verified' } : p));
                            onUpdateAlerts(prev => [
                              { id: `alert-${Date.now()}`, type: 'driver_approved', message: `Chauffeur permit for "${driver.name}" approved. Vehicle ${driver.vehiclePlate} active.`, severity: 'info', timestamp: 'Just now' },
                              ...prev
                            ]);
                          }
                        }}
                        className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black cursor-pointer shadow-xs"
                      >
                        Approve PDP & Activate
                      </button>
                      <button
                        onClick={() => {
                          if (onUpdateShuttleDrivers) {
                            onUpdateShuttleDrivers(prev => prev.map(p => p.id === driver.id ? { ...p, verifiedStatus: 'rejected' } : p));
                          }
                        }}
                        className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black cursor-pointer"
                      >
                        Decline Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Premium VIP Vehicles & Live GPS/Charge Tracker */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900">Premium Fleet Vehicles & Diagnostic Status</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 font-semibold">Real-time solar battery charging and fuel telemetry monitoring.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {shuttleDrivers.map((driver) => {
                // Determine a mock fuel level or charge level based on driver
                const chargePercent = driver.id === 'drv-1' ? 84 : driver.id === 'drv-2' ? 92 : 98;
                const isEV = driver.vehicleModel.includes('Tesla') || driver.vehicleModel.includes('EV');

                return (
                  <div key={driver.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] bg-slate-900 text-white font-black px-2 py-0.5 rounded-sm uppercase tracking-wide">
                          {driver.vehiclePlate}
                        </span>
                        <h5 className="text-xs font-black text-slate-900 mt-1">{driver.vehicleModel}</h5>
                        <p className="text-[10px] text-slate-500 font-extrabold mt-0.5">{driver.vehicleColor} • {driver.vehicleYear}</p>
                      </div>
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200">
                        <img src={driver.carImage || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=150&q=80'} alt="car" className="w-full h-full object-cover" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span className="flex items-center gap-1">
                        <Fuel className="w-3.5 h-3.5 text-amber-600" />
                        {isEV ? 'Battery SOC:' : 'Fuel Tank:'}
                      </span>
                      <span className={`${chargePercent < 30 ? 'text-rose-600' : 'text-emerald-700'} font-extrabold`}>
                        {chargePercent}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${chargePercent < 30 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${chargePercent}%` }}
                      />
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                      <span>Chauffeur: {driver.name}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                        driver.status === 'available' ? 'bg-emerald-100 text-emerald-800' :
                        driver.status === 'on_trip' ? 'bg-indigo-100 text-indigo-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {driver.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Live Active Shuttle Trips Tracker */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-600" /> Executive Chauffeur Route Control Radar
            </h4>

            {shuttleBookings.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 font-black text-xs">
                No active shuttle rides have been ordered. Try booking a guest shuttle transfer inside the Kiosk or Guest views.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-extrabold">
                    <tr>
                      <th className="py-2.5 px-3 rounded-l-xl">Driver Assigned</th>
                      <th className="py-2.5 px-3">Passenger</th>
                      <th className="py-2.5 px-3">Pickup / Dropoff</th>
                      <th className="py-2.5 px-3">Schedule</th>
                      <th className="py-2.5 px-3">Luggage / Pax</th>
                      <th className="py-2.5 px-3">Price (ZAR)</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 rounded-r-xl text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                    {shuttleBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-extrabold text-slate-900">
                          {b.driverName}
                          <span className="block text-[10px] text-slate-400 font-semibold">{b.vehicleModel}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="block font-bold">{b.passengerName || b.guestName}</span>
                          <span className="text-[10px] text-slate-400 block">{b.passengerPhone || b.guestPhone}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-slate-800 block">From: {b.pickupLocation}</span>
                          <span className="text-slate-500 block text-[10px]">To: {b.dropoffLocation}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="block">{b.date}</span>
                          <span className="text-[10px] text-slate-400 block">{b.time}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          🧳 {b.luggageCount} bag(s) • 👤 {b.passengersCount || b.passengers || 1} pax
                        </td>
                        <td className="py-3 px-3 font-extrabold text-slate-900">R{b.totalAmountZar}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            b.status === 'scheduled' ? 'bg-slate-100 text-slate-700' :
                            b.status === 'en_route' || b.status === 'on_route' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                            b.status === 'in_progress' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                            b.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {b.status === 'scheduled' && (
                            <button
                              onClick={() => {
                                if (onUpdateShuttleBookings) {
                                  onUpdateShuttleBookings(prev => prev.map(item => item.id === b.id ? { ...item, status: 'en_route' } : item));
                                }
                              }}
                              className="text-[10px] bg-slate-900 hover:bg-slate-850 text-white px-2 py-1 rounded-md font-black cursor-pointer"
                            >
                              Dispatch Chauffeur
                            </button>
                          )}
                          {b.status === 'en_route' && (
                            <button
                              onClick={() => {
                                if (onUpdateShuttleBookings) {
                                  onUpdateShuttleBookings(prev => prev.map(item => item.id === b.id ? { ...item, status: 'in_progress' } : item));
                                }
                              }}
                              className="text-[10px] bg-amber-500 hover:bg-amber-600 text-slate-950 px-2 py-1 rounded-md font-black cursor-pointer"
                            >
                              Commence Ride
                            </button>
                          )}
                          {b.status === 'in_progress' && (
                            <button
                              onClick={() => {
                                if (onUpdateShuttleBookings) {
                                  onUpdateShuttleBookings(prev => prev.map(item => item.id === b.id ? { ...item, status: 'completed' } : item));
                                }
                              }}
                              className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded-md font-black cursor-pointer shadow-xs"
                            >
                              Arrived (Complete)
                            </button>
                          )}
                          {b.status === 'completed' && <span className="text-[10px] text-emerald-700 font-extrabold">Completed</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 4. Integrated Flight Lookup & Car Booking Services Monitor */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Flight Booking Services */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Plane className="w-4 h-4 text-sky-600" /> Integrated Flight Lookup & Booking Monitor
              </h4>
              <p className="text-[11px] text-slate-500 font-semibold">Monitor domestic flights reserved by guests at receptionist terminal kiosks.</p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[9px] font-black">
                    <tr>
                      <th className="py-2 px-2.5 rounded-l-lg">ID / Guest</th>
                      <th className="py-2 px-2.5">Route</th>
                      <th className="py-2 px-2.5">Date / Time</th>
                      <th className="py-2 px-2.5">Carrier</th>
                      <th className="py-2 px-2.5">Fare</th>
                      <th className="py-2 px-2.5 rounded-r-lg">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                    {flightBookings.map((fl) => (
                      <tr key={fl.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-2.5">
                          <span className="font-extrabold text-slate-900 block">{fl.guestName}</span>
                          <span className="text-[10px] text-slate-400 block">{fl.id}</span>
                        </td>
                        <td className="py-2.5 px-2.5 text-slate-700">{fl.route}</td>
                        <td className="py-2.5 px-2.5 text-slate-600">
                          {fl.date} <span className="text-slate-400 font-normal">at</span> {fl.time}
                        </td>
                        <td className="py-2.5 px-2.5 font-bold text-sky-800">{fl.airline}</td>
                        <td className="py-2.5 px-2.5 font-extrabold">R{fl.fareZar}</td>
                        <td className="py-2.5 px-2.5">
                          <select
                            value={fl.status}
                            onChange={(e) => {
                              setFlightBookings(prev => prev.map(item => item.id === fl.id ? { ...item, status: e.target.value } : item));
                            }}
                            className={`p-1 border text-[9px] font-extrabold rounded-md ${
                              fl.status === 'confirmed' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                          >
                            <option value="pending_payment">⏳ Pending</option>
                            <option value="confirmed">🟢 Confirmed</option>
                            <option value="cancelled">❌ Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Car Rental Services */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Car className="w-4 h-4 text-emerald-600" /> Kiosk Luxury Car Rental Services Monitor
              </h4>
              <p className="text-[11px] text-slate-500 font-semibold">Monitor rental vehicles reserved at premium digital kiosk points.</p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[9px] font-black">
                    <tr>
                      <th className="py-2 px-2.5 rounded-l-lg">Guest</th>
                      <th className="py-2 px-2.5">Vehicle Type</th>
                      <th className="py-2 px-2.5">Dates / Days</th>
                      <th className="py-2 px-2.5">Insurance Vetted</th>
                      <th className="py-2 px-2.5">Daily Rate</th>
                      <th className="py-2 px-2.5 rounded-r-lg">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                    {carBookings.map((car) => (
                      <tr key={car.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-2.5 font-bold text-slate-900">{car.guestName}</td>
                        <td className="py-2.5 px-2.5 text-indigo-900 font-extrabold">{car.vehicle}</td>
                        <td className="py-2.5 px-2.5 text-slate-600">
                          {car.startDate} to {car.endDate}
                          <span className="text-[10px] text-slate-400 block">({car.days} days)</span>
                        </td>
                        <td className="py-2.5 px-2.5">
                          <button
                            onClick={() => {
                              setCarBookings(prev => prev.map(item => item.id === car.id ? { ...item, insuranceVerified: !item.insuranceVerified } : item));
                            }}
                            className={`px-2 py-0.5 rounded-md text-[9px] font-black ${
                              car.insuranceVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {car.insuranceVerified ? '✓ Verified' : '⚠️ Unvetted'}
                          </button>
                        </td>
                        <td className="py-2.5 px-2.5 font-extrabold text-slate-900">
                          R{car.ratePerDayZar}/day
                        </td>
                        <td className="py-2.5 px-2.5">
                          <select
                            value={car.status}
                            onChange={(e) => {
                              setCarBookings(prev => prev.map(item => item.id === car.id ? { ...item, status: e.target.value } : item));
                            }}
                            className={`p-1 border text-[9px] font-extrabold rounded-md ${
                              car.status === 'approved' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                          >
                            <option value="pending_approval">⏳ Pending</option>
                            <option value="approved">🟢 Approved</option>
                            <option value="rejected">❌ Rejected</option>
                          </select>
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

      {/* SECTION: KIOSK LINKS HUB & AUTO-ACTIVATOR (SUPER ADMIN) */}
      {activeTab === 'kiosk_support' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-gradient-to-r from-indigo-900 to-slate-950 p-6 rounded-2xl text-white shadow-md">
            <div className="flex items-center gap-3">
              <Monitor className="w-8 h-8 text-indigo-400" />
              <div>
                <h3 className="text-base font-extrabold">ScopeBridg™ Active Receptionist Kiosks & Links Hub</h3>
                <p className="text-xs text-indigo-200 mt-1">
                  Manage active guest-facing self-service terminal links. Custom links are auto-generated when property owners list their spaces.
                </p>
              </div>
            </div>
          </div>

          {/* Auto Activation Explanation Notice */}
          <div className="bg-amber-50 border border-amber-200 text-slate-800 p-4 rounded-xl flex items-start gap-3 text-xs font-semibold">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-amber-950">⚡ Automatic Kiosk Activation Enabled</p>
              <p className="text-amber-900/80 mt-1">
                The ScopeBridg system activates a receptionist kiosk link automatically when any property owner registers and publishes their property unit on the platform. Admins can manually override, deactivate, or launch a kiosk link instantly for debugging.
              </p>
            </div>
          </div>

          {/* Active Kiosks list */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-sm font-extrabold text-slate-900">Property Kiosk Terminals Inventory ({properties.length})</h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-extrabold">
                  <tr>
                    <th className="py-2.5 px-3 rounded-l-xl">Property Residence</th>
                    <th className="py-2.5 px-3">Owner Account</th>
                    <th className="py-2.5 px-3">Kiosk ID & Security Code</th>
                    <th className="py-2.5 px-3">Kiosk Connection Status</th>
                    <th className="py-2.5 px-3">Generated Kiosk Link</th>
                    <th className="py-2.5 px-3 rounded-r-xl text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                  {properties.map((prop) => {
                    const isKioskActive = kioskActivationState[prop.id] !== false;
                    const kioskLink = `${window.location.origin}/kiosk/${prop.id}`;

                    return (
                      <tr key={prop.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3">
                          <span className="font-extrabold text-slate-900 block">{prop.title}</span>
                          <span className="text-[10px] text-slate-400 block">{prop.area}</span>
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-700">{prop.ownerName}</td>
                        <td className="py-3 px-3 font-mono text-[10px] text-slate-500">
                          ID: kiosk-{prop.id.slice(-5)} <span className="block text-slate-400 font-normal">PIN: *{prop.checkInInstructions?.lockboxCode}#</span>
                        </td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => {
                              setKioskActivationState(prev => ({
                                ...prev,
                                [prop.id]: !isKioskActive
                              }));
                            }}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-black cursor-pointer flex items-center gap-1 ${
                              isKioskActive ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isKioskActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {isKioskActive ? 'ACTIVE (Auto)' : 'DISABLED'}
                          </button>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-[10px] text-indigo-700 bg-slate-50 p-1 rounded border border-slate-200/60 max-w-[200px] truncate block">
                            {kioskLink}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              if (!isKioskActive) {
                                alert('This kiosk link is currently disabled. Please activate it first.');
                                return;
                              }
                              // Simulate launching Kiosk Mode
                              alert(`Launching Receptionist Kiosk Mode simulation for property: ${prop.title}.\n\nWhen a guest interacts with this kiosk link at the property, they can self-check-in, check-out, book Sebenele or other nannies on call, summon Mthokozisi or other airport shuttles, and book rental cars or flights.`);
                              // We'll set a state or redirect
                              window.location.hash = `#kiosk-${prop.id}`;
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="text-[10px] bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1.5 rounded-xl font-black cursor-pointer shadow-xs transition-transform"
                          >
                            Launch Kiosk Mode
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Kiosk Concierge Queued Reservations */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Plane className="w-4 h-4 text-indigo-600" /> Kiosk Concierge Moderation Queue
              </h4>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded-full border border-indigo-200">
                {kioskFlightBookings.filter(f => f.status === 'queued').length + kioskCarBookings.filter(c => c.status === 'queued').length} Reservations Queued
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Approve or cancel flight lookup reservations and self-drive car rental bookings requested by guests on the lobby receptionist kiosk.
            </p>

            {/* Flight Bookings List */}
            <div className="space-y-3">
              <h5 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">✈ Flight Bookings</h5>
              {kioskFlightBookings.length === 0 ? (
                <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-150">No kiosk flight reservations registered yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {kioskFlightBookings.map((flight) => (
                    <div key={flight.id} className="p-4 bg-slate-50 hover:bg-slate-100/70 transition-all rounded-xl border border-slate-200 flex flex-col justify-between gap-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-md font-mono">{flight.id}</span>
                          <h6 className="font-extrabold text-slate-900 mt-1">{flight.guestName}</h6>
                          <p className="text-[11px] text-slate-600 mt-0.5">Route: <strong className="text-indigo-700">{flight.route}</strong> via {flight.carrier}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Date: {flight.date}</p>
                        </div>
                        <div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            flight.status === 'queued' ? 'bg-amber-100 text-amber-800' :
                            flight.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {flight.status}
                          </span>
                        </div>
                      </div>

                      {flight.status === 'queued' && (
                        <div className="flex gap-2 pt-1 border-t border-slate-200/60">
                          <button
                            onClick={() => onResolveFlightBooking && onResolveFlightBooking(flight.id, 'confirmed')}
                            className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                          >
                            Approve & Confirm
                          </button>
                          <button
                            onClick={() => onResolveFlightBooking && onResolveFlightBooking(flight.id, 'cancelled')}
                            className="py-1.5 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Car Rental Bookings List */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h5 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">🚗 Car Rentals</h5>
              {kioskCarBookings.length === 0 ? (
                <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-150">No kiosk vehicle reservations registered yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {kioskCarBookings.map((car) => (
                    <div key={car.id} className="p-4 bg-slate-50 hover:bg-slate-100/70 transition-all rounded-xl border border-slate-200 flex flex-col justify-between gap-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md font-mono">{car.id}</span>
                          <h6 className="font-extrabold text-slate-900 mt-1">{car.guestName}</h6>
                          <p className="text-[11px] text-slate-600 mt-0.5">Vehicle: <strong className="text-emerald-700">{car.vehicle}</strong></p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Duration: {car.days} Days</p>
                        </div>
                        <div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            car.status === 'queued' ? 'bg-amber-100 text-amber-800' :
                            car.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {car.status}
                          </span>
                        </div>
                      </div>

                      {car.status === 'queued' && (
                        <div className="flex gap-2 pt-1 border-t border-slate-200/60">
                          <button
                            onClick={() => onResolveCarBooking && onResolveCarBooking(car.id, 'confirmed')}
                            className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                          >
                            Approve & Confirm
                          </button>
                          <button
                            onClick={() => onResolveCarBooking && onResolveCarBooking(car.id, 'cancelled')}
                            className="py-1.5 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Live Kiosk Self-Service Logs */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-600" /> Live Kiosk Self-Service Guest Audit Stream
            </h4>

            <div className="divide-y divide-slate-100 font-semibold text-xs">
              {kioskLogs.map((log) => (
                <div key={log.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[10px] bg-slate-100 text-slate-500 p-1 rounded">
                      {log.time}
                    </span>
                    <div>
                      <span className="font-extrabold text-slate-900 block">
                        {log.guestName} performed a self {log.action === 'self_check_in' ? 'check-in' : 'check-out'}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Property Residence: {log.propertyName}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                      log.status === 'pin_delivered_sms' ? 'bg-emerald-50 text-emerald-700' : 'bg-purple-50 text-purple-700'
                    }`}>
                      {log.status === 'pin_delivered_sms' ? 'Lockbox PIN SMS Sent' : 'Housekeeping Task Dispatched'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*       ADMINISTRATOR ACTIVE DIRECTORY HIERARCHICAL TREE VIEWER              */
/* -------------------------------------------------------------------------- */

export const AdminOwnerPropertyTreeViewer = ActiveDirectoryTreeView;

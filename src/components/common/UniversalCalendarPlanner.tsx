import React, { useState, useMemo, useRef } from 'react';
import {
  AppRole,
  Booking,
  CalendarEventCategory,
  CalendarEventStatus,
  CalendarPlanEvent,
  ChannelConfig,
  GlobalCurrency,
  NannyBooking,
  Property,
  ShuttleBooking,
  UserAccount,
} from '../../types';
import { CURRENCY_RATES } from '../../data/usersData';
import { IS_DEV, IS_PROD, PRODUCTION_APP_URL, DEVELOPMENT_APP_URL } from '../../lib/env';
import {
  checkDoubleBookingConflict,
  getBookedDatesSet,
  getAvailableFreeDaysList,
  getBookedSpansList,
  getRoomOccupancyStatus,
  getPropertyBookableRooms,
} from '../../utils/bookingAvailability';
import { ResponsiveLightboxGallery, LightboxPhotoItem } from './ResponsiveLightboxGallery';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Trash2,
  Globe,
  Link as LinkIcon,
  Copy,
  Check,
  Building2,
  BedDouble,
  User,
  Baby,
  Car,
  Plane,
  Utensils,
  Briefcase,
  Wrench,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Filter,
  CalendarDays,
  Ban,
  ArrowRight,
  Layers,
  ShieldCheck,
} from 'lucide-react';

export interface UniversalCalendarPlannerProps {
  currentRole: AppRole;
  currentUser: UserAccount;
  properties: Property[];
  bookings: Booking[];
  calendarEvents: CalendarPlanEvent[];
  channels: ChannelConfig[];
  nannyBookings?: NannyBooking[];
  shuttleBookings?: ShuttleBooking[];
  registeredUsers?: UserAccount[];
  selectedCurrency?: GlobalCurrency;
  onBookProperty: (booking: Omit<Booking, 'id' | 'createdAt'>) => void;
  onUpdateBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  onUpdateCalendarEvents: React.Dispatch<React.SetStateAction<CalendarPlanEvent[]>>;
  onUpdateProperties: React.Dispatch<React.SetStateAction<Property[]>>;
  onUpdateUser?: (updatedUser: UserAccount) => void;
  onPublishPropertyToChannel?: (propertyId: string, channelId: string, publish: boolean) => void;
  initialOpenGuestBookingLinkModal?: boolean;
  compactMode?: boolean;
}

const ALL_HOLIDAY_CHANNELS = [
  { id: 'direct', name: 'ScopeBridge Direct', badge: 'Official Direct' },
  { id: 'airbnb', name: 'Airbnb Global', badge: 'Global OTA' },
  { id: 'booking_com', name: 'Booking.com', badge: 'Global OTA' },
  { id: 'lekkeslaap', name: 'LekkeSlaap SA', badge: 'SA Holiday' },
  { id: 'safarinow', name: 'SafariNow', badge: 'SA Regional' },
  { id: 'expedia', name: 'Expedia & Hotels.com', badge: 'Global OTA' },
  { id: 'agoda', name: 'Agoda Homes', badge: 'Intl OTA' },
  { id: 'vrbo', name: 'Vrbo Holiday Villas', badge: 'Family Holiday' },
  { id: 'google_rentals', name: 'Google Vacation Rentals', badge: 'Metasearch' },
];

const EVENT_CATEGORIES: {
  id: CalendarEventCategory;
  label: string;
  color: string;
  badgeBg: string;
}[] = [
  { id: 'stay_booking', label: 'Stay / Property Booking', color: 'text-emerald-700', badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
  { id: 'holiday_trip', label: 'Holiday & Vacation Plan', color: 'text-blue-700', badgeBg: 'bg-blue-50 border-blue-200 text-blue-800' },
  { id: 'flight_transit', label: 'Flight & Airport Shuttle', color: 'text-amber-700', badgeBg: 'bg-amber-50 border-amber-200 text-amber-800' },
  { id: 'childcare_nanny', label: 'Childcare & Nanny Session', color: 'text-pink-700', badgeBg: 'bg-pink-50 border-pink-200 text-pink-800' },
  { id: 'dining_leisure', label: 'Dining, Safari & Excursion', color: 'text-purple-700', badgeBg: 'bg-purple-50 border-purple-200 text-purple-800' },
  { id: 'corporate_meeting', label: 'Executive / Work Schedule', color: 'text-indigo-700', badgeBg: 'bg-indigo-50 border-indigo-200 text-indigo-800' },
  { id: 'property_maintenance', label: 'Property Maintenance / Sync', color: 'text-teal-700', badgeBg: 'bg-teal-50 border-teal-200 text-teal-800' },
  { id: 'system_maintenance', label: '🛠️ System Maintenance & Backup Schedule', color: 'text-rose-700', badgeBg: 'bg-rose-50 border-rose-300 text-rose-900 font-bold' },
  { id: 'personal_event', label: 'Everything Else / Personal Plan', color: 'text-slate-700', badgeBg: 'bg-slate-100 border-slate-300 text-slate-800' },
];

function formatDateYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseYmd(ymd: string): Date {
  const parts = (ymd || '2026-09-26').split('-').map(Number);
  if (parts.length !== 3 || isNaN(parts[0])) return new Date(2026, 8, 26);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function isDateInRange(dayYmd: string, startYmd: string, endYmd: string): boolean {
  if (!dayYmd || !startYmd) return false;
  const effectiveEnd = endYmd && endYmd >= startYmd ? endYmd : startYmd;
  return dayYmd >= startYmd && dayYmd <= effectiveEnd;
}

export const UniversalCalendarPlanner: React.FC<UniversalCalendarPlannerProps> = ({
  currentRole,
  currentUser,
  properties,
  bookings,
  calendarEvents,
  channels,
  nannyBookings = [],
  shuttleBookings = [],
  registeredUsers = [],
  selectedCurrency = 'ZAR',
  onBookProperty,
  onUpdateBookings,
  onUpdateCalendarEvents,
  onUpdateProperties,
  onUpdateUser,
  onPublishPropertyToChannel,
  initialOpenGuestBookingLinkModal = false,
}) => {
  const calendarGridRef = useRef<HTMLDivElement>(null);

  // View Mode: Daily, Weekly, Monthly
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  // Active sub-section: 'calendar' | 'everything_planner' | 'channel_detector' | 'guest_booking_link' | 'guest_booked_list'
  const [activeSubSection, setActiveSubSection] = useState<
    'calendar' | 'everything_planner' | 'channel_detector' | 'guest_booking_link' | 'guest_booked_list'
  >(initialOpenGuestBookingLinkModal ? 'guest_booking_link' : 'calendar');

  // Selected Guest Booking for detailed inspection (Owner & Admin view)
  const [selectedGuestBooking, setSelectedGuestBooking] = useState<Booking | null>(null);

  // Selected focal date (YYYY-MM-DD) - defaults to 2026-09-26 where initial bookings sit, or today
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-26');
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState<string>('all');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('all');
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Feedback Banner
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Add Booking / Plan Modal or Drawer State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [addFormMode, setAddFormMode] = useState<'booking' | 'plan_everything' | 'block_date'>('booking');
  const [formPropertyId, setFormPropertyId] = useState<string>(properties[0]?.id || 'prop-1');
  const [formRoomId, setFormRoomId] = useState<string>('');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formCategory, setFormCategory] = useState<CalendarEventCategory>('holiday_trip');
  const [formGuestName, setFormGuestName] = useState<string>(currentUser.fullName || currentUser.name || 'Valued Guest');
  const [formGuestEmail, setFormGuestEmail] = useState<string>(currentUser.email || 'guest@scopebridg.co.za');
  const [formGuestPhone, setFormGuestPhone] = useState<string>(currentUser.phone || '+27 72 901 4455');
  const [formStartDate, setFormStartDate] = useState<string>('2026-09-26');
  const [formEndDate, setFormEndDate] = useState<string>('2026-09-28');
  const [formStartTime, setFormStartTime] = useState<string>('14:00');
  const [formEndTime, setFormEndTime] = useState<string>('10:00');
  const [formGuestsCount, setFormGuestsCount] = useState<number>(2);
  const [formStatus, setFormStatus] = useState<'confirmed' | 'pending' | 'cancelled'>('confirmed');
  const [formChannelId, setFormChannelId] = useState<string>('direct');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formLateCheckout, setFormLateCheckout] = useState<boolean>(false);
  const [formAirportPickup, setFormAirportPickup] = useState<boolean>(false);
  const [formBreakfast, setFormBreakfast] = useState<boolean>(false);
  const [rangeSelectingStart, setRangeSelectingStart] = useState<string | null>(null);

  const currencyInfo = CURRENCY_RATES[selectedCurrency] || CURRENCY_RATES.ZAR;
  const formatMoney = (zar: number) => `${currencyInfo.symbol}${Math.round(zar * currencyInfo.rateToZar).toLocaleString()}`;

  const triggerSyncBanner = (msg: string) => {
    setSyncNotice(msg);
    setTimeout(() => setSyncNotice(null), 5000);
  };

  // Automatic Accommodation Night Stay Calculation from Selected Calendar Days
  const calculatedNights = useMemo(() => {
    const startMs = parseYmd(formStartDate).getTime();
    const endMs = parseYmd(formEndDate).getTime();
    if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) return 1;
    return Math.max(1, Math.round((endMs - startMs) / 86400000));
  }, [formStartDate, formEndDate]);

  const activeFormProperty = useMemo(
    () => properties.find((p) => p.id === formPropertyId) || properties[0],
    [properties, formPropertyId]
  );

  const activeFormPropertyRooms = useMemo(
    () => getPropertyBookableRooms(activeFormProperty),
    [activeFormProperty]
  );

  const activeFormRoom = useMemo(() => {
    if (formRoomId) {
      const found = activeFormPropertyRooms.find((r) => r.id === formRoomId);
      if (found) return found;
    }
    return activeFormPropertyRooms[0];
  }, [activeFormPropertyRooms, formRoomId]);

  const [calendarGalleryOpen, setCalendarGalleryOpen] = useState(false);
  const [calendarGalleryIndex, setCalendarGalleryIndex] = useState(0);
  const [calendarGalleryPhotos, setCalendarGalleryPhotos] = useState<LightboxPhotoItem[]>([]);
  const [calendarGalleryTitle, setCalendarGalleryTitle] = useState('');

  const activeNightlyRateZar = activeFormRoom
    ? activeFormRoom.basePrice
    : activeFormProperty?.basePrice || 1500;

  const calculatedStayTotalZar = useMemo(() => {
    const addOns =
      (formLateCheckout ? 120 : 0) +
      (formAirportPickup ? 450 : 0) +
      (formBreakfast ? 150 * calculatedNights : 0);
    return activeNightlyRateZar * calculatedNights + addOns;
  }, [activeNightlyRateZar, calculatedNights, formLateCheckout, formAirportPickup, formBreakfast]);

  // Real-time Double Booking Conflict Checker for Add Booking Modal
  const formConflictCheck = useMemo(() => {
    if (addFormMode !== 'booking' || !activeFormProperty) return { hasConflict: false };
    return checkDoubleBookingConflict({
      bookings,
      propertyId: activeFormProperty.id,
      roomId: activeFormRoom?.id,
      roomName: activeFormRoom?.name,
      checkInDate: formStartDate,
      checkOutDate: formEndDate,
    });
  }, [bookings, activeFormProperty, activeFormRoom, formStartDate, formEndDate, addFormMode]);

  // Active Filter Property & Room Details for Calendar Header Widget
  const activeFilterProperty = useMemo(() => {
    if (selectedPropertyFilter === 'all') return properties[0];
    return properties.find((p) => p.id === selectedPropertyFilter) || properties[0];
  }, [properties, selectedPropertyFilter]);

  const activeFilterPropertyRooms = useMemo(
    () => getPropertyBookableRooms(activeFilterProperty),
    [activeFilterProperty]
  );

  const activeFilterRoom = useMemo(() => {
    if (selectedRoomFilter === 'all') return activeFilterPropertyRooms[0];
    return activeFilterPropertyRooms.find((r) => r.id === selectedRoomFilter) || activeFilterPropertyRooms[0];
  }, [activeFilterPropertyRooms, selectedRoomFilter]);

  const filterRoomBookedDatesSet = useMemo(() => {
    if (!activeFilterProperty) return new Set<string>();
    return getBookedDatesSet(
      bookings,
      activeFilterProperty.id,
      activeFilterRoom?.id,
      activeFilterProperty.blockedDates,
      activeFilterRoom?.name
    );
  }, [bookings, activeFilterProperty, activeFilterRoom]);

  const { freeSpans: filterFreeSpans, freeDays: filterFreeDays } = useMemo(() => {
    if (!activeFilterProperty) return { freeSpans: [], freeDays: [] };
    return getAvailableFreeDaysList({
      bookings,
      propertyId: activeFilterProperty.id,
      roomId: activeFilterRoom?.id,
      roomName: activeFilterRoom?.name,
      propertyBlockedDates: activeFilterProperty.blockedDates,
      startDate: selectedDate || new Date().toISOString().slice(0, 10),
      daysAhead: 60,
    });
  }, [bookings, activeFilterProperty, activeFilterRoom, selectedDate]);

  const filterBookedSpans = useMemo(() => {
    if (!activeFilterProperty) return [];
    return getBookedSpansList(bookings, activeFilterProperty.id, activeFilterRoom?.id, activeFilterRoom?.name);
  }, [bookings, activeFilterProperty, activeFilterRoom]);

  const filterRoomOccupancyStatus = useMemo(() => {
    if (!activeFilterProperty) {
      return { status: 'available' as const, badgeText: '🟢 Available', isAvailable: true };
    }
    return getRoomOccupancyStatus({
      room: activeFilterRoom || { id: `${activeFilterProperty.id}-room-1`, name: 'Room 1 — Executive King Suite' },
      property: activeFilterProperty,
      bookings,
      checkInDate: formStartDate,
      checkOutDate: formEndDate,
    });
  }, [activeFilterProperty, activeFilterRoom, bookings, formStartDate, formEndDate]);

  const handleStartDateChange = (newStartYmd: string) => {
    if (!newStartYmd) return;
    setFormStartDate(newStartYmd);
    setSelectedDate(newStartYmd);
    const startMs = parseYmd(newStartYmd).getTime();
    const endMs = parseYmd(formEndDate).getTime();
    if (isNaN(endMs) || endMs <= startMs) {
      const nextDay = formatDateYmd(new Date(startMs + 86400000));
      setFormEndDate(nextDay);
    }
  };

  const handleEndDateChange = (newEndYmd: string) => {
    if (!newEndYmd) return;
    const startMs = parseYmd(formStartDate).getTime();
    const endMs = parseYmd(newEndYmd).getTime();
    if (endMs <= startMs) {
      const nextDay = formatDateYmd(new Date(startMs + 86400000));
      setFormEndDate(nextDay);
    } else {
      setFormEndDate(newEndYmd);
    }
  };

  const handleNightsCountChange = (newNightsInput: number) => {
    const validNights = Math.max(1, Math.min(365, Math.round(newNightsInput || 1)));
    const startMs = parseYmd(formStartDate).getTime();
    if (!isNaN(startMs)) {
      const computedEnd = formatDateYmd(new Date(startMs + validNights * 86400000));
      setFormEndDate(computedEnd);
    }
  };

  // Interactive 2-click calendar day range selection that automatically calculates accommodation night stay
  const handleCalendarDaySelect = (ymd: string) => {
    setSelectedDate(ymd);
    if (!rangeSelectingStart) {
      setRangeSelectingStart(ymd);
      setFormStartDate(ymd);
      const nextDay = formatDateYmd(new Date(parseYmd(ymd).getTime() + 86400000));
      setFormEndDate(nextDay);
      triggerSyncBanner(
        `Check-In Date ${ymd} selected (1 Night default). Click a Check-Out date on the calendar to automatically calculate your multi-night accommodation stay.`
      );
    } else {
      if (ymd > rangeSelectingStart) {
        setFormStartDate(rangeSelectingStart);
        setFormEndDate(ymd);
        const nightsDiff = Math.max(
          1,
          Math.round((parseYmd(ymd).getTime() - parseYmd(rangeSelectingStart).getTime()) / 86400000)
        );
        setRangeSelectingStart(null);
        triggerSyncBanner(
          `Stay Dates Selected (${rangeSelectingStart} → ${ymd}): Automatically calculated ${nightsDiff} Night(s) Accommodation Stay (${formatMoney(
            activeNightlyRateZar * nightsDiff
          )}).`
        );
      } else if (ymd < rangeSelectingStart) {
        setRangeSelectingStart(ymd);
        setFormStartDate(ymd);
        const nextDay = formatDateYmd(new Date(parseYmd(ymd).getTime() + 86400000));
        setFormEndDate(nextDay);
      } else {
        const nextDay = formatDateYmd(new Date(parseYmd(ymd).getTime() + 86400000));
        setFormStartDate(ymd);
        setFormEndDate(nextDay);
        setRangeSelectingStart(null);
        triggerSyncBanner(
          `Stay Dates Selected (${ymd} → ${nextDay}): Automatically calculated 1 Night Accommodation Stay (${formatMoney(
            activeNightlyRateZar
          )}).`
        );
      }
    }
  };

  // Active User's Registered Holiday Channels
  const userRegisteredChannels = useMemo(() => {
    const base = currentUser.registeredHolidayChannels || [
      'direct',
      'airbnb',
      'booking_com',
      'lekkeslaap',
      'safarinow',
      'expedia',
      'vrbo',
      'google_rentals',
    ];
    return Array.from(new Set(['direct', ...base]));
  }, [currentUser]);

  const handleToggleUserHolidayChannel = (channelId: string) => {
    if (channelId === 'direct') return;
    const next = userRegisteredChannels.includes(channelId)
      ? userRegisteredChannels.filter((c) => c !== channelId)
      : [...userRegisteredChannels, channelId];
    if (onUpdateUser) {
      onUpdateUser({
        ...currentUser,
        registeredHolidayChannels: next,
      });
    }
    triggerSyncBanner(
      `Profile Holiday Channels updated (${next.length} active channels). All calendar plans & bookings now auto-sync across ${next
        .map((c) => c.toUpperCase())
        .join(', ')}.`
    );
  };

  // Unified Calendar Items combining Property Bookings, Nanny Shifts, Shuttle Rides, and Everything-Else Planner Events
  const unifiedItems = useMemo(() => {
    const list: Array<{
      id: string;
      sourceType: 'booking' | 'plan' | 'nanny' | 'shuttle';
      title: string;
      subtitle: string;
      category: CalendarEventCategory;
      startDate: string;
      endDate: string;
      startTime: string;
      endTime: string;
      status: 'confirmed' | 'pending' | 'cancelled';
      propertyId?: string;
      propertyTitle?: string;
      guestOrUserName: string;
      channelId: string;
      syncedChannels: string[];
      amountZar: number;
      doorCode?: string;
      notes?: string;
      rawBooking?: Booking;
      rawPlan?: CalendarPlanEvent;
    }> = [];

    // 1. Property Bookings
    const isPrivileged = currentRole === 'admin' || currentRole === 'super_admin' || currentRole === 'owner';

    bookings.forEach((b) => {
      const prop = properties.find((p) => p.id === b.propertyId);
      const propChannels = prop?.publishedChannels || ['direct', 'airbnb', 'booking_com'];
      const normalizedStatus: 'confirmed' | 'pending' | 'cancelled' =
        b.status === 'cancelled'
          ? 'cancelled'
          : b.status === 'pending' || b.paymentStatus === 'pending'
          ? 'pending'
          : 'confirmed';

      list.push({
        id: b.id,
        sourceType: 'booking',
        title: isPrivileged ? `${b.guestName} — ${b.propertyTitle}` : `🔴 Booked — ${b.propertyTitle}`,
        subtitle: isPrivileged
          ? `${b.nights} Night(s) • ${b.guestsCount} Guest(s) • PIN: ${b.doorCode || '4821#'}`
          : `${b.nights} Night(s) Stay • Occupied / Booked`,
        category: 'stay_booking',
        startDate: b.checkInDate,
        endDate: b.checkOutDate,
        startTime: '14:00',
        endTime: '10:00',
        status: normalizedStatus,
        propertyId: b.propertyId,
        propertyTitle: b.propertyTitle,
        guestOrUserName: isPrivileged ? b.guestName : 'Booked Guest',
        channelId: b.channel || 'direct',
        syncedChannels: Array.from(new Set(['direct', b.channel || 'direct', ...propChannels, ...userRegisteredChannels])),
        amountZar: isPrivileged ? (b.totalAmount || 0) : 0,
        doorCode: isPrivileged ? b.doorCode : undefined,
        notes: isPrivileged
          ? `Channel: ${(b.channel || 'direct').toUpperCase()} • Payment: ${b.paymentStatus.toUpperCase()} • Phone: ${b.guestPhone || 'N/A'}`
          : 'Room Occupied / Booked',
        rawBooking: b,
      });
    });

    // 2. Universal Planner Events (Holidays, Flights, Dining, Meetings, Maintenance, Personal)
    calendarEvents.forEach((ev) => {
      list.push({
        id: ev.id,
        sourceType: 'plan',
        title: ev.title,
        subtitle: `${ev.userName} (${ev.userRole.toUpperCase()}) • ${
          EVENT_CATEGORIES.find((c) => c.id === ev.category)?.label || 'Plan'
        }`,
        category: ev.category,
        startDate: ev.startDate,
        endDate: ev.endDate || ev.startDate,
        startTime: ev.startTime || '09:00',
        endTime: ev.endTime || '17:00',
        status: ev.status,
        propertyId: ev.propertyId,
        propertyTitle: ev.propertyTitle,
        guestOrUserName: ev.userName,
        channelId: ev.channelId || 'direct',
        syncedChannels: Array.from(new Set(['direct', ...(ev.syncedChannels || []), ...userRegisteredChannels])),
        amountZar: ev.amountZar || 0,
        notes: ev.notes,
        rawPlan: ev,
      });
    });

    // 3. Nanny Bookings
    nannyBookings.forEach((nb) => {
      const st: 'confirmed' | 'pending' | 'cancelled' =
        nb.status === 'cancelled' ? 'cancelled' : nb.status === 'pending' ? 'pending' : 'confirmed';
      list.push({
        id: nb.id,
        sourceType: 'nanny',
        title: `Childcare: ${nb.nannyName} for ${nb.parentName}`,
        subtitle: `${nb.propertyTitle} • ${nb.startTime}–${nb.endTime} (${nb.childrenCount} child)`,
        category: 'childcare_nanny',
        startDate: nb.date,
        endDate: nb.date,
        startTime: nb.startTime,
        endTime: nb.endTime,
        status: st,
        propertyId: nb.propertyId,
        propertyTitle: nb.propertyTitle,
        guestOrUserName: nb.parentName,
        channelId: 'direct',
        syncedChannels: ['direct', 'airbnb', 'booking_com'],
        amountZar: nb.totalAmountZar,
        notes: nb.specialNotes,
      });
    });

    // 4. Shuttle Bookings
    shuttleBookings.forEach((sb) => {
      const st: 'confirmed' | 'pending' | 'cancelled' =
        sb.status === 'cancelled' ? 'cancelled' : sb.paymentStatus === 'pending' ? 'pending' : 'confirmed';
      list.push({
        id: sb.id,
        sourceType: 'shuttle',
        title: `Shuttle: ${sb.pickupLocation} → ${sb.dropoffLocation}`,
        subtitle: `Chauffeur: ${sb.driverName} (${sb.vehicleModel}) • Guest: ${sb.guestName || sb.passengerName}`,
        category: 'flight_transit',
        startDate: sb.date,
        endDate: sb.date,
        startTime: sb.time,
        endTime: sb.time,
        status: st,
        guestOrUserName: sb.guestName || sb.passengerName || 'Guest',
        channelId: 'direct',
        syncedChannels: ['direct', 'booking_com', 'expedia'],
        amountZar: sb.totalAmountZar,
        notes: sb.specialRequests,
      });
    });

    return list.filter((item) => {
      if (selectedPropertyFilter !== 'all' && item.propertyId && item.propertyId !== selectedPropertyFilter) {
        return false;
      }
      if (selectedRoomFilter !== 'all') {
        const itemRoomId = (item as any).roomId;
        const itemTitle = (item.title || '').toLowerCase();
        const itemSub = (item.subtitle || '').toLowerCase();
        if (itemRoomId && itemRoomId !== selectedRoomFilter) return false;
        if (!itemRoomId && !itemTitle.includes(selectedRoomFilter.toLowerCase()) && !itemSub.includes(selectedRoomFilter.toLowerCase())) {
          return false;
        }
      }
      if (selectedChannelFilter !== 'all') {
        const chMatch =
          item.channelId.toLowerCase().includes(selectedChannelFilter.toLowerCase()) ||
          item.syncedChannels.some((c) => c.toLowerCase().includes(selectedChannelFilter.toLowerCase()));
        if (!chMatch) return false;
      }
      if (selectedStatusFilter !== 'all' && item.status !== selectedStatusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.guestOrUserName.toLowerCase().includes(q) ||
          (item.propertyTitle || '').toLowerCase().includes(q) ||
          item.channelId.toLowerCase().includes(q) ||
          item.startDate.includes(q) ||
          (item.notes || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [
    bookings,
    calendarEvents,
    nannyBookings,
    shuttleBookings,
    properties,
    userRegisteredChannels,
    selectedPropertyFilter,
    selectedRoomFilter,
    selectedChannelFilter,
    selectedStatusFilter,
    searchQuery,
  ]);

  // Date Navigation Helpers
  const focalDateObj = useMemo(() => parseYmd(selectedDate), [selectedDate]);
  const currentYear = focalDateObj.getFullYear();
  const currentMonth = focalDateObj.getMonth(); // 0-11

  const navigateCalendar = (direction: -1 | 1) => {
    const next = new Date(focalDateObj);
    if (viewMode === 'daily') {
      next.setDate(next.getDate() + direction);
    } else if (viewMode === 'weekly') {
      next.setDate(next.getDate() + direction * 7);
    } else {
      next.setMonth(next.getMonth() + direction);
    }
    setSelectedDate(formatDateYmd(next));
  };

  const scrollAndJumpToDate = (targetYmd: string) => {
    setSelectedDate(targetYmd);
    setActiveSubSection('calendar');
    setTimeout(() => {
      calendarGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  };

  // Build Monthly Days Array (42 cells covering full weeks)
  const monthDaysGrid = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) - 6 (Sat)
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const cells: Array<{ ymd: string; dayNum: number; isCurrentMonth: boolean }> = [];
    // Previous month trailing days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth, -i);
      cells.push({ ymd: formatDateYmd(d), dayNum: d.getDate(), isCurrentMonth: false });
    }
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(currentYear, currentMonth, day);
      cells.push({ ymd: formatDateYmd(d), dayNum: day, isCurrentMonth: true });
    }
    // Next month leading days to fill 35 or 42 cells
    const totalCells = cells.length <= 35 ? 35 : 42;
    let nextDay = 1;
    while (cells.length < totalCells) {
      const d = new Date(currentYear, currentMonth + 1, nextDay++);
      cells.push({ ymd: formatDateYmd(d), dayNum: d.getDate(), isCurrentMonth: false });
    }
    return cells;
  }, [currentYear, currentMonth]);

  // Build Weekly Days Array (7 days around focalDateObj)
  const weekDaysGrid = useMemo(() => {
    const dayOfWeek = focalDateObj.getDay();
    const sunday = new Date(focalDateObj);
    sunday.setDate(focalDateObj.getDate() - dayOfWeek);
    const days: Array<{ ymd: string; label: string; dayNum: number; monthShort: string }> = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      days.push({
        ymd: formatDateYmd(d),
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
        monthShort: d.toLocaleDateString('en-US', { month: 'short' }),
      });
    }
    return days;
  }, [focalDateObj]);

  // Actions: Add Booking / Add Plan / Block Date
  const handleSubmitAddForm = (e: React.FormEvent) => {
    e.preventDefault();
    const targetProp = properties.find((p) => p.id === formPropertyId) || properties[0];

    if (addFormMode === 'block_date' && targetProp) {
      const start = parseYmd(formStartDate);
      const end = parseYmd(formEndDate >= formStartDate ? formEndDate : formStartDate);
      const datesToAdd: string[] = [];
      const cur = new Date(start);
      while (cur <= end) {
        datesToAdd.push(formatDateYmd(cur));
        cur.setDate(cur.getDate() + 1);
      }
      onUpdateProperties((prev) =>
        prev.map((p) =>
          p.id === targetProp.id
            ? { ...p, blockedDates: Array.from(new Set([...(p.blockedDates || []), ...datesToAdd])) }
            : p
        )
      );
      triggerSyncBanner(
        `Blocked ${datesToAdd.length} date(s) (${formStartDate} to ${formEndDate}) on "${targetProp.title}" and synced across all active OTA channels.`
      );
      setIsAddModalOpen(false);
      return;
    }

    if (addFormMode === 'booking' && targetProp) {
      const start = parseYmd(formStartDate);
      const end = parseYmd(formEndDate > formStartDate ? formEndDate : formStartDate);
      const diffNights = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
      const targetRooms = getPropertyBookableRooms(targetProp);
      const selectedRoom = targetRooms.find((r) => r.id === formRoomId) || targetRooms[0];
      const nightlyRate = selectedRoom ? selectedRoom.basePrice : targetProp.basePrice;
      const addOnsTotal =
        (formLateCheckout ? 120 : 0) + (formAirportPickup ? 450 : 0) + (formBreakfast ? 150 * diffNights : 0);
      const totalAmount = nightlyRate * diffNights + addOnsTotal;
      const computedOutDate =
        formEndDate > formStartDate
          ? formEndDate
          : formatDateYmd(new Date(start.getTime() + 86400000));

      // Strict Double Booking Validation
      const conflictCheck = checkDoubleBookingConflict({
        bookings,
        propertyId: targetProp.id,
        roomId: selectedRoom?.id,
        roomName: selectedRoom?.name,
        checkInDate: formStartDate,
        checkOutDate: computedOutDate,
      });

      if (conflictCheck.hasConflict) {
        alert(`⛔ ${conflictCheck.message || 'Double Booking Prevented: Room is already booked for these dates.'}`);
        return;
      }

      const bookingPayload: any = {
        propertyId: targetProp.id,
        propertyTitle: selectedRoom ? `${targetProp.title} (${selectedRoom.name})` : targetProp.title,
        propertyImage: targetProp.images[0] || '',
        guestName: formGuestName.trim() || 'Valued Guest',
        guestEmail: formGuestEmail.trim() || 'guest@scopebridg.co.za',
        guestPhone: formGuestPhone.trim() || '+27 72 000 0000',
        checkInDate: formStartDate,
        checkOutDate: computedOutDate,
        nights: diffNights,
        guestsCount: formGuestsCount,
        totalAmount,
        commission: {
          ownerAmount: Math.round(totalAmount * 0.9),
          adminAmount: Math.round(totalAmount * 0.1),
        },
        paymentMethod: 'paystack',
        paymentStatus: formStatus === 'pending' ? 'pending' : 'paid',
        status: formStatus,
        addOns: {
          lateCheckout: formLateCheckout,
          airportPickup: formAirportPickup,
          breakfast: formBreakfast,
        },
        doorCode: `${Math.floor(1000 + Math.random() * 9000)}#`,
        channel: (formChannelId as any) || 'direct',
        source: `Calendar (${formChannelId.toUpperCase()})`,
        idVerified: true,
        depositStatus: 'held',
        roomId: selectedRoom?.id,
        roomName: selectedRoom?.name,
      };

      onBookProperty(bookingPayload);

      // Trigger automatic channel synchronization
      fetch('/api/channels/sync-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking: {
            ...bookingPayload,
            syncedChannels: channels.map(c => c.id),
          }
        })
      }).catch(err => console.error("Auto-sync trigger failed:", err));

      // Also create a synced calendar event so it appears in the user's holiday & multi-channel planner
      const newCalEvent: CalendarPlanEvent = {
        id: `CAL-${Date.now().toString().slice(-5)}`,
        title: formTitle.trim() || `Stay Booking: ${targetProp.title} (${formGuestName.trim() || 'Guest'})`,
        category: 'stay_booking',
        startDate: formStartDate,
        endDate:
          formEndDate > formStartDate
            ? formEndDate
            : formatDateYmd(new Date(start.getTime() + 86400000)),
        startTime: '14:00',
        endTime: '10:00',
        status: formStatus,
        userId: currentUser.id,
        userName: formGuestName.trim() || currentUser.fullName || currentUser.name,
        userRole: currentRole,
        propertyId: targetProp.id,
        propertyTitle: targetProp.title,
        roomId: selectedRoom?.id,
        roomName: selectedRoom?.name,
        channelId: formChannelId,
        syncedChannels: Array.from(
          new Set(['direct', formChannelId, ...(targetProp.publishedChannels || []), ...userRegisteredChannels])
        ),
        notes: formNotes.trim() || 'Booked via Universal Multi-Channel Calendar.',
        amountZar: totalAmount,
        createdAt: new Date().toISOString(),
      };
      onUpdateCalendarEvents((prev) => [newCalEvent, ...prev]);

      triggerSyncBanner(
        `Booking added for ${formStartDate} → ${newCalEvent.endDate} (${formStatus.toUpperCase()}) & synchronized across ${newCalEvent.syncedChannels.length} channels!`
      );
      setSelectedDate(formStartDate);
      setIsAddModalOpen(false);
      return;
    }

    // Otherwise: Plan Everything Else (Holiday, Flight, Nanny, Dining, Meeting, Maintenance, Personal)
    const newPlan: CalendarPlanEvent = {
      id: `PLAN-${Date.now().toString().slice(-5)}`,
      title:
        formTitle.trim() ||
        `${EVENT_CATEGORIES.find((c) => c.id === formCategory)?.label || 'Scheduled Plan'} — ${formStartDate}`,
      category: formCategory,
      startDate: formStartDate,
      endDate: formEndDate >= formStartDate ? formEndDate : formStartDate,
      startTime: formStartTime || '09:00',
      endTime: formEndTime || '17:00',
      status: formStatus,
      userId: currentUser.id,
      userName: currentUser.fullName || currentUser.name || formGuestName,
      userRole: currentRole,
      propertyId: targetProp?.id,
      propertyTitle: targetProp?.title,
      channelId: formChannelId,
      syncedChannels: Array.from(
        new Set(['direct', formChannelId, ...(targetProp?.publishedChannels || []), ...userRegisteredChannels])
      ),
      notes: formNotes.trim() || 'Planned via Universal Everything & Holiday Calendar.',
      amountZar: 0,
      createdAt: new Date().toISOString(),
    };

    onUpdateCalendarEvents((prev) => [newPlan, ...prev]);
    triggerSyncBanner(
      `Plan "${newPlan.title}" added (${formStatus.toUpperCase()}) and synced across ${newPlan.syncedChannels.length} registered holiday & OTA channels!`
    );
    setSelectedDate(formStartDate);
    setIsAddModalOpen(false);
  };

  // Status Update Handlers (Confirm, Pend, Cancel, Delete) for Bookings & Planner Events
  const handleUpdateItemStatus = (
    item: (typeof unifiedItems)[number],
    newStatus: 'confirmed' | 'pending' | 'cancelled'
  ) => {
    if (item.sourceType === 'booking') {
      onUpdateBookings((prev) =>
        prev.map((b) =>
          b.id === item.id
            ? {
                ...b,
                status: newStatus,
                paymentStatus: newStatus === 'confirmed' ? 'paid' : 'pending',
              }
            : b
        )
      );
    }
    onUpdateCalendarEvents((prev) =>
      prev.map((ev) =>
        ev.id === item.id || ev.linkedBookingId === item.id
          ? { ...ev, status: newStatus, updatedAt: new Date().toISOString() }
          : ev
      )
    );
    triggerSyncBanner(
      `Updated "${item.title}" to ${newStatus.toUpperCase()} — Calendar availability pushed to ${item.syncedChannels.length} active channels.`
    );
  };

  const handleDeleteCalendarItem = (item: (typeof unifiedItems)[number]) => {
    if (item.sourceType === 'booking') {
      onUpdateBookings((prev) => prev.filter((b) => b.id !== item.id));
    }
    onUpdateCalendarEvents((prev) =>
      prev.filter((ev) => ev.id !== item.id && ev.linkedBookingId !== item.id)
    );
    triggerSyncBanner(
      `Deleted "${item.title}" from calendar — Dates released across all ${item.syncedChannels.length} connected channels.`
    );
  };

  const handleToggleBlockSingleDate = (propertyId: string, ymd: string) => {
    const target = properties.find((p) => p.id === propertyId) || properties[0];
    if (!target) return;
    const isBlocked = (target.blockedDates || []).includes(ymd);
    onUpdateProperties((prev) =>
      prev.map((p) => {
        if (p.id === target.id) {
          const blocked = p.blockedDates || [];
          return {
            ...p,
            blockedDates: isBlocked ? blocked.filter((d) => d !== ymd) : [...blocked, ymd],
          };
        }
        return p;
      })
    );
    triggerSyncBanner(
      `${isBlocked ? 'Unblocked' : 'Blocked'} date ${ymd} on "${target.title}" across all published channels.`
    );
  };

  // Publish Property to Channel (or All Channels) and immediately reflect across platform
  const handlePublishPropertyEverywhere = async (prop: Property, specificChannelId?: string) => {
    const targetChannels = specificChannelId
      ? [specificChannelId]
      : ALL_HOLIDAY_CHANNELS.map((c) => c.id);

    const currentPublished = prop.publishedChannels || ['direct'];
    let nextPublished: string[];

    if (specificChannelId) {
      const already = currentPublished.includes(specificChannelId);
      nextPublished = already
        ? currentPublished.filter((c) => c !== specificChannelId)
        : Array.from(new Set([...currentPublished, specificChannelId]));
      if (onPublishPropertyToChannel) {
        onPublishPropertyToChannel(prop.id, specificChannelId, !already);
      }
    } else {
      nextPublished = Array.from(new Set([...currentPublished, ...targetChannels]));
    }

    onUpdateProperties((prev) =>
      prev.map((p) => {
        if (p.id === prop.id) {
          const updatedRooms = (p.rooms || []).map((rm) => ({
            ...rm,
            publishedChannels: Array.from(new Set([...(rm.publishedChannels || []), ...nextPublished])),
          }));
          return {
            ...p,
            status: 'active',
            publishedChannels: nextPublished,
            requestedChannels: Array.from(new Set([...(p.requestedChannels || []), ...nextPublished])),
            channelSync: {
              airbnb: nextPublished.includes('airbnb'),
              bookingCom: nextPublished.includes('booking_com'),
              direct: true,
              lastSynced: 'Live Real-Time',
            },
            rooms: updatedRooms,
          };
        }
        return p;
      })
    );

    try {
      await fetch('/api/channels/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: prop.id,
          propertyTitle: prop.title,
          address: prop.address,
          basePrice: prop.basePrice,
          currencyCode: prop.currencyCode || 'ZAR',
          channelId: specificChannelId || 'ALL_CHANNELS',
          publish: true,
        }),
      });
    } catch {
      // Local state & database already updated
    }

    triggerSyncBanner(
      `Property "${prop.title}" published and reflected across ${nextPublished.length} channels (${nextPublished
        .map((c) => c.toUpperCase())
        .join(', ')})!`
    );
  };

  // Shareable Guest Add Booking Link
  const guestBookingCalendarUrl = useMemo(() => {
    const baseUrl =
      typeof window !== 'undefined' ? window.location.origin : PRODUCTION_APP_URL;
    return `${baseUrl}/?booking=guest-calendar`;
  }, []);

  const prodGuestBookingCalendarUrl = `${PRODUCTION_APP_URL}/?booking=guest-calendar`;
  const devGuestBookingCalendarUrl = `${DEVELOPMENT_APP_URL}/?booking=guest-calendar`;

  const selectedDateItems = useMemo(
    () => unifiedItems.filter((item) => isDateInRange(selectedDate, item.startDate, item.endDate)),
    [unifiedItems, selectedDate]
  );

  // Months strip for fast scrolling across the calendar year
  const scrollableMonths = [
    { key: '2026-08-01', label: 'Aug 2026' },
    { key: '2026-09-01', label: 'Sep 2026' },
    { key: '2026-10-01', label: 'Oct 2026' },
    { key: '2026-11-01', label: 'Nov 2026' },
    { key: '2026-12-01', label: 'Dec 2026 (Holiday Peak)' },
    { key: '2027-01-01', label: 'Jan 2027' },
    { key: '2027-02-01', label: 'Feb 2027' },
    { key: '2027-03-01', label: 'Mar 2027' },
    { key: '2027-04-01', label: 'Apr 2027' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: Universal Profile Calendar, Guest Booking Link & Multi-Channel Sync Status */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-lg space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4" />
                Universal Multi-Channel Calendar & Holiday Planner
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-300 font-medium capitalize">
                Active Profile: {currentUser.fullName || currentUser.name} ({currentRole.replace('_', ' ')})
              </span>
              <span className="text-slate-500">·</span>
              <span className="font-mono text-[11px] text-amber-300">
                {IS_PROD ? 'PRODUCTION SERVER ACTIVE' : 'DEVELOPMENT SERVER ACTIVE'}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              Daily, Weekly & Monthly Booking Calendar + Everything & Holiday Planner
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Add, pend, cancel, or delete booking dates; search & scroll the calendar; plan holidays, flights, childcare, dining, and personal schedules; and automatically synchronize across all channels where Guest & Owner profiles and properties are registered.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setAddFormMode('booking');
                setFormStartDate(selectedDate);
                const nextDay = new Date(parseYmd(selectedDate).getTime() + 2 * 86400000);
                setFormEndDate(formatDateYmd(nextDay));
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Booking Date</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAddFormMode('plan_everything');
                setFormStartDate(selectedDate);
                setFormEndDate(selectedDate);
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Plan Holiday / Everything Else</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubSection('guest_booking_link')}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <LinkIcon className="w-4 h-4" />
              <span>Guest Add Booking Link</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation Bar */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveSubSection('calendar')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeSubSection === 'calendar'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Interactive Calendar (Daily / Weekly / Monthly)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubSection('everything_planner')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeSubSection === 'everything_planner'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Plan Holidays & Everything Else ({calendarEvents.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubSection('channel_detector')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeSubSection === 'channel_detector'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>ScopeBridge Channel Detector & Publish ({channels.length} Channels)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubSection('guest_booking_link')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeSubSection === 'guest_booking_link'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'bg-slate-800 text-amber-300 hover:bg-slate-700'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Guest Direct Booking Link &amp; Calendar</span>
            </button>

            {(currentRole === 'admin' || currentRole === 'owner' || currentRole === 'super_admin' || currentUser?.role === 'super_admin') && (
              <button
                type="button"
                onClick={() => setActiveSubSection('guest_booked_list')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeSubSection === 'guest_booked_list'
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'bg-slate-800 text-emerald-300 hover:bg-slate-700'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>👥 Guest Booked List ({bookings.length} Guests)</span>
              </button>
            )}

            {(currentRole === 'admin' || currentRole === 'super_admin' || currentUser?.role === 'super_admin') && (
              <button
                type="button"
                onClick={() => {
                  setAddFormMode('plan_everything');
                  setFormCategory('system_maintenance');
                  setFormTitle('🛠️ Weekly / Monthly System Maintenance & Backup');
                  setFormNotes('Scheduled maintenance: full database backup verification, SSL certificate check, and OTA channel gateway health check.');
                  setIsAddModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer bg-rose-950 text-rose-200 border border-rose-600/40 hover:bg-rose-900 shrink-0"
                title="Schedule a System Maintenance Window on the Calendar"
              >
                <Wrench className="w-3.5 h-3.5 text-rose-400" />
                <span>🛠️ Schedule System Maintenance</span>
              </button>
            )}
          </div>

          {/* Daily / Weekly / Monthly View Switcher */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
            {(['daily', 'weekly', 'monthly'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setViewMode(mode);
                  setActiveSubSection('calendar');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors cursor-pointer ${
                  viewMode === mode
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {mode} View
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Sync Notification Banner */}
      {syncNotice && (
        <div className="bg-emerald-950 text-emerald-200 border border-emerald-700 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs font-semibold shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncNotice(null)}
            className="text-emerald-400 hover:text-white text-xs font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search Bookings, Filter & Scroll Calendar Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
          {/* Search Input */}
          <div className="md:col-span-3 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search booking guest, property, ref ID, date..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Property Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedPropertyFilter}
              onChange={(e) => {
                setSelectedPropertyFilter(e.target.value);
                setSelectedRoomFilter('all');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Properties ({properties.length})</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.unitCode})
                </option>
              ))}
            </select>
          </div>

          {/* Room / Suite Filter */}
          <div className="md:col-span-2">
            <select
              value={activeFilterRoom?.id || selectedRoomFilter}
              onChange={(e) => setSelectedRoomFilter(e.target.value)}
              className="w-full px-3 py-2 bg-amber-50 border border-amber-300 rounded-xl text-xs font-extrabold text-amber-950 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            >
              {activeFilterPropertyRooms.map((rm) => (
                <option key={rm.id} value={rm.id}>
                  🛏️ {rm.name} (R{rm.basePrice})
                </option>
              ))}
            </select>
          </div>

          {/* Channel Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedChannelFilter}
              onChange={(e) => setSelectedChannelFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Channels (9 Active)</option>
              {ALL_HOLIDAY_CHANNELS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed / Active</option>
              <option value="pending">Pending / Hold</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Dedicated Room Occupancy & Free Days Explorer Widget */}
        <div className="p-3 bg-gradient-to-r from-amber-50/70 via-slate-50 to-emerald-50/70 border border-amber-200/80 rounded-xl space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-700" />
                <span>
                  {activeFilterProperty?.title || 'Selected Property'}{' '}
                  {activeFilterRoom ? `— ${activeFilterRoom.name}` : '(All Rooms)'}
                </span>
              </span>
              <span
                className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border shadow-2xs ${
                  filterRoomOccupancyStatus.isAvailable
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                    : 'bg-rose-100 text-rose-900 border-rose-400'
                }`}
              >
                {filterRoomOccupancyStatus.badgeText}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-semibold">
                🔒 Strict Double-Booking Protection Active
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1 text-[11px]">
            {/* Occupied Booked Dates */}
            <div className="p-2.5 bg-white border border-rose-200 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-rose-900 flex items-center gap-1 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-rose-600 inline-block"></span>
                  <span>🔴 Occupied / Booked Dates ({filterBookedSpans.length})</span>
                </span>
                <span className="text-[10px] text-rose-700 font-mono font-bold">Locked</span>
              </div>
              {filterBookedSpans.length === 0 ? (
                <span className="text-[10px] text-emerald-700 font-bold block py-0.5">
                  ✓ No current bookings (100% open for reservations)
                </span>
              ) : (
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pt-0.5">
                  {filterBookedSpans.map((sp, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-rose-600 text-white rounded-md text-[10px] font-bold shadow-2xs"
                    >
                      🔴 {sp.checkInDate} → {sp.checkOutDate} ({sp.nights}n • {sp.guestName})
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Available Free Days */}
            <div className="p-2.5 bg-white border border-emerald-200 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-emerald-900 flex items-center gap-1 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
                  <span>🟢 Available Free Days (Tap to Auto-Select Dates)</span>
                </span>
                <span className="text-[10px] text-emerald-700 font-mono font-bold">Open</span>
              </div>
              {filterFreeSpans.length === 0 ? (
                <span className="text-[10px] text-rose-700 font-bold block py-0.5">
                  No upcoming free date windows
                </span>
              ) : (
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pt-0.5">
                  {filterFreeSpans.slice(0, 4).map((span, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setFormStartDate(span.startDate);
                        setFormEndDate(span.endDate);
                        if (activeFilterProperty) setFormPropertyId(activeFilterProperty.id);
                        if (activeFilterRoom) setFormRoomId(activeFilterRoom.id);
                        setAddFormMode('booking');
                        setIsAddModalOpen(true);
                      }}
                      className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-950 border border-emerald-300 rounded-md text-[10px] font-extrabold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                      title={`Book ${span.startDate} to ${span.endDate}`}
                    >
                      <span>🟢 {span.label}</span>
                      <span className="bg-emerald-200 text-emerald-900 group-hover:bg-white text-[9px] px-1 rounded font-black">
                        ⚡ Book
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Instant Search Results Jump & Scroll Bar */}
        {searchQuery.trim() && (
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">
                Search Matches ({unifiedItems.length}) — Click any result to scroll calendar to date:
              </span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
              >
                Clear Search
              </button>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {unifiedItems.length === 0 ? (
                <span className="text-xs text-slate-500 py-1">
                  No bookings or plans match "{searchQuery}".
                </span>
              ) : (
                unifiedItems.slice(0, 10).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollAndJumpToDate(item.startDate)}
                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-left shrink-0 transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{item.title}</span>
                      <span className="text-[10px] font-mono text-emerald-800">({item.startDate})</span>
                    </div>
                    <div className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
                      <span>Status: {item.status.toUpperCase()}</span>
                      <span>·</span>
                      <span className="text-emerald-700 font-semibold">Scroll Calendar →</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Scrollable Calendar Month Timeline Bar */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-bold text-slate-500 mr-1">Scroll Calendar:</span>
            <button
              type="button"
              onClick={() => navigateCalendar(-1)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollAndJumpToDate('2026-09-26')}
              className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer"
            >
              Today (Sep 26)
            </button>
            <button
              type="button"
              onClick={() => navigateCalendar(1)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {scrollableMonths.map((m) => {
              const isSelectedMonth = selectedDate.slice(0, 7) === m.key.slice(0, 7);
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => scrollAndJumpToDate(m.key)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    isSelectedMonth
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* =====================================================================
          SECTION 1: GUEST DIRECT ADD BOOKING LINK WITH CALENDAR
         ===================================================================== */}
      {activeSubSection === 'guest_booking_link' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-emerald-700">Direct Guest Self-Booking & Availability Calendar Link</span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                Shareable Guest Add Booking Link with Live Multi-Channel Calendar
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Guests can use this direct link to inspect daily/weekly/monthly availability, select dates on the calendar, and add or pend their booking across all active channels.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(guestBookingCalendarUrl);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 3000);
                  triggerSyncBanner(`Copied Guest Add Booking Calendar Link: ${guestBookingCalendarUrl}`);
                }}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Copied Booking Link!' : 'Copy Guest Booking Link'}</span>
              </button>

              <a
                href={`https://wa.me/27694977018?text=${encodeURIComponent(
                  `Book your executive stay directly via our live ScopeBridg Guest Calendar Link: ${prodGuestBookingCalendarUrl}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Share via WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Environment Links Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Production Server Guest Booking Calendar Link</span>
                <span className="text-[11px] text-emerald-700 font-semibold">Active on Production</span>
              </div>
              <p className="font-mono text-[11px] text-slate-600 break-all">{prodGuestBookingCalendarUrl}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Development Server Guest Booking Calendar Link</span>
                <span className="text-[11px] text-blue-700 font-semibold">Active on Development</span>
              </div>
              <p className="font-mono text-[11px] text-slate-600 break-all">{devGuestBookingCalendarUrl}</p>
            </div>
          </div>

          {/* Embedded Guest Interactive Booking Form + Calendar Picker */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            <form onSubmit={handleSubmitAddForm} className="lg:col-span-6 space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <h4 className="text-sm font-bold text-slate-900">
                Guest Direct Add Booking Form (Synced with Calendar)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Residence *</label>
                  <select
                    value={formPropertyId}
                    onChange={(e) => {
                      setFormPropertyId(e.target.value);
                      setFormRoomId('');
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  >
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({formatMoney(p.basePrice)}/night)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Suite / Room (Rooms Only) *</label>
                  <select
                    value={activeFormRoom?.id || ''}
                    onChange={(e) => setFormRoomId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  >
                    {activeFormPropertyRooms.map((rm) => (
                      <option key={rm.id} value={rm.id}>
                        {rm.name} ({formatMoney(rm.basePrice)}/night)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Check-In Date *</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Check-Out Date *</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-emerald-800 mb-1">
                    Accommodation Night Stay
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={calculatedNights}
                      onChange={(e) => handleNightsCountChange(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-black text-emerald-950"
                    />
                    <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-2 rounded-xl shrink-0">
                      {calculatedNights} {calculatedNights === 1 ? 'Night' : 'Nights'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Booking Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="confirmed">Confirm Immediately</option>
                    <option value="pending">Pend Date (Hold)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-extrabold text-emerald-950">
                    Auto-Calculated Accommodation Night Stay: {calculatedNights} {calculatedNights === 1 ? 'Night' : 'Nights'} ({formStartDate} → {formEndDate})
                  </span>
                  <span className="block text-[11px] text-emerald-700">
                    Rate: {formatMoney(activeNightlyRateZar)}/night × {calculatedNights} {calculatedNights === 1 ? 'night' : 'nights'}
                  </span>
                </div>
                <span className="text-sm font-black text-emerald-900">
                  Total: {formatMoney(calculatedStayTotalZar)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Guest Full Name *</label>
                  <input
                    type="text"
                    value={formGuestName}
                    onChange={(e) => setFormGuestName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Guest Email *</label>
                  <input
                    type="email"
                    value={formGuestEmail}
                    onChange={(e) => setFormGuestEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp / Phone *</label>
                  <input
                    type="text"
                    value={formGuestPhone}
                    onChange={(e) => setFormGuestPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formAirportPickup}
                    onChange={(e) => setFormAirportPickup(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>Airport Chauffeur (+R450)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formBreakfast}
                    onChange={(e) => setFormBreakfast(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>Executive Breakfast (+R150/d)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formLateCheckout}
                    onChange={(e) => setFormLateCheckout(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>Late Checkout (+R120)</span>
                </label>
              </div>

              {/* Double Booking Conflict Alert Banner */}
              {formConflictCheck.hasConflict && (
                <div className="p-3 bg-rose-50 border-2 border-rose-400 rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-rose-800 font-black text-xs">
                    <span className="w-2 h-2 rounded-full bg-rose-600 inline-block animate-ping"></span>
                    <span>⛔ Double Booking Prevented</span>
                  </div>
                  <p className="text-[11px] text-rose-700 font-medium">
                    {formConflictCheck.message || 'Room is already booked on these dates. Select available green days.'}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={formConflictCheck.hasConflict}
                onClick={() => setAddFormMode('booking')}
                className={`w-full py-3 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-colors ${
                  formConflictCheck.hasConflict
                    ? 'bg-slate-400 cursor-not-allowed opacity-60'
                    : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                }`}
              >
                <CalendarIcon className="w-4 h-4" />
                <span>
                  {formConflictCheck.hasConflict
                    ? 'Suite Occupied on Chosen Dates — Double Booking Blocked'
                    : 'Add Guest Booking to Calendar & Sync All Channels'}
                </span>
              </button>
            </form>

            {/* Right: Interactive Mini-Calendar Date Selector */}
            <div className="lg:col-span-6 bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  Click Dates on Calendar ({focalDateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => navigateCalendar(-1)}
                    className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateCalendar(1)}
                    className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-500">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} className="py-1">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {monthDaysGrid.map((cell) => {
                  const inSelectedStay = isDateInRange(cell.ymd, formStartDate, formEndDate);
                  const hasBookings = unifiedItems.some(
                    (it) => it.status !== 'cancelled' && isDateInRange(cell.ymd, it.startDate, it.endDate)
                  );
                  return (
                    <button
                      key={cell.ymd}
                      type="button"
                      onClick={() => handleCalendarDaySelect(cell.ymd)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center ${
                        inSelectedStay
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                          : cell.isCurrentMonth
                          ? 'bg-white text-slate-800 border-slate-200 hover:border-emerald-400'
                          : 'bg-slate-100 text-slate-400 border-slate-100'
                      }`}
                    >
                      <span className="font-mono">{cell.dayNum}</span>
                      <span className={`text-[9px] mt-0.5 ${inSelectedStay ? 'text-emerald-100' : hasBookings ? 'text-amber-600' : 'text-slate-400'}`}>
                        {cell.ymd === formStartDate
                          ? 'Check-In'
                          : cell.ymd === formEndDate
                          ? 'Check-Out'
                          : inSelectedStay
                          ? `${calculatedNights}N Stay`
                          : hasBookings
                          ? 'Booked'
                          : 'Open'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SECTION 2: PLAN EVERYTHING ELSE & HOLIDAY PROFILE CHANNEL SYNC
         ===================================================================== */}
      {activeSubSection === 'everything_planner' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-blue-700">
                Universal Life, Holiday & Everything Planner (Synced Across Registered Holiday Channels)
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                Plan Bookings, Holidays, Flights, Childcare, Dining, Corporate Meetings & Personal Events
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Every event planned here automatically updates your profile calendar across all channels where Guest or Owner has registered their profile for holidays.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setAddFormMode('plan_everything');
                setFormStartDate(selectedDate);
                setFormEndDate(selectedDate);
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Holiday / Personal Plan</span>
            </button>
          </div>

          {/* Registered Holiday Channels for Active Guest/Owner Profile */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Registered Holiday & Stay Channels for {currentUser.fullName || currentUser.name} ({currentRole.toUpperCase()})
                </h4>
                <p className="text-[11px] text-slate-500">
                  Toggle channels below to register or unregister your profile for instant holiday & calendar synchronization:
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700">
                {userRegisteredChannels.length} Active Channels Syncing
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {ALL_HOLIDAY_CHANNELS.map((ch) => {
                const isReg = userRegisteredChannels.includes(ch.id);
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => handleToggleUserHolidayChannel(ch.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isReg
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span>{isReg ? '✓' : '+'}</span>
                    <span>{ch.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Quick Add Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {EVENT_CATEGORIES.map((cat) => {
              const count = unifiedItems.filter((i) => i.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setAddFormMode(cat.id === 'stay_booking' ? 'booking' : 'plan_everything');
                    setFormCategory(cat.id);
                    setFormStartDate(selectedDate);
                    setFormEndDate(selectedDate);
                    setIsAddModalOpen(true);
                  }}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-400 bg-white text-left transition-all cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${cat.color}`}>{cat.label}</span>
                    <span className="text-xs font-mono font-bold text-slate-500">{count}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">+ Click to schedule on calendar</p>
                </button>
              );
            })}
          </div>

          {/* Planned Events List */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900">
              All Active Holiday, Personal & Booking Plans ({unifiedItems.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {unifiedItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col justify-between gap-3 hover:border-slate-300"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900">{item.title}</span>
                      <span
                        className={`text-[11px] font-bold capitalize ${
                          item.status === 'confirmed'
                            ? 'text-emerald-700'
                            : item.status === 'pending'
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{item.subtitle}</p>
                    <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="font-mono font-semibold text-slate-700">
                        {item.startDate} → {item.endDate} ({item.startTime})
                      </span>
                      <span>·</span>
                      <span>Synced Channels: {item.syncedChannels.map((c) => c.toUpperCase()).join(', ')}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => scrollAndJumpToDate(item.startDate)}
                      className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                    >
                      View on Calendar →
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateItemStatus(item, 'confirmed')}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded text-[11px] font-bold cursor-pointer"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateItemStatus(item, 'pending')}
                        className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded text-[11px] font-bold cursor-pointer"
                      >
                        Pend
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateItemStatus(item, 'cancelled')}
                        className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded text-[11px] font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCalendarItem(item)}
                        className="px-2 py-1 bg-slate-100 hover:bg-rose-600 hover:text-white text-slate-700 rounded text-[11px] font-bold cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SECTION 3: SCOPEBRIDGE MULTI-CHANNEL DETECTOR & PROPERTY PUBLISH
         ===================================================================== */}
      {activeSubSection === 'channel_detector' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-emerald-700">
                ScopeBridge Real-Time Channel Detection & Property Distribution Scanner
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                Detected Channels Where Owners, Guests & Properties Are Listed
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                When an Owner adds a property or selects Publish, ScopeBridge immediately reflects the property across all selected channels and lists every active channel mapping below.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                properties.forEach((p) => handlePublishPropertyEverywhere(p));
              }}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Globe className="w-4 h-4" />
              <span>Publish All Properties to All 9 Channels</span>
            </button>
          </div>

          {/* Property-by-Property Channel Detection & Publish Matrix */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-900">
              1. Properties & Rooms Listed Across Channels ({properties.length} Active Properties)
            </h4>
            <div className="grid grid-cols-1 gap-4">
              {properties.map((prop) => {
                const published = Array.from(
                  new Set(['direct', ...(prop.publishedChannels || ['direct', 'airbnb', 'booking_com'])])
                );
                return (
                  <div
                    key={prop.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{prop.title}</span>
                          <span className="font-mono text-xs text-slate-500">({prop.unitCode})</span>
                          <span className="text-xs font-semibold text-emerald-700">
                            · Owner: {prop.ownerName || 'Mdluli Nhlanhla'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {prop.address} · Base Rate: {formatMoney(prop.basePrice)}/night · {(prop.rooms || []).length || 1} Suite(s)
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handlePublishPropertyEverywhere(prop)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Publish to All Channels</span>
                      </button>
                    </div>

                    {/* Channels Toggle Row */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-600 block">
                        ScopeBridge Detected Channels ({published.length} Listed — Click any channel to Publish / Unpublish):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {ALL_HOLIDAY_CHANNELS.map((ch) => {
                          const isPub = published.includes(ch.id);
                          return (
                            <button
                              key={ch.id}
                              type="button"
                              onClick={() => handlePublishPropertyEverywhere(prop, ch.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                isPub
                                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400'
                              }`}
                            >
                              <span>{isPub ? '✓ Published:' : '+ Publish to:'}</span>
                              <span>{ch.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Owner & Guest Profiles Registered Holiday Channels Detection */}
          {registeredUsers.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-900">
                2. Detected Owner & Guest Profile Channel Registrations ({registeredUsers.length} Profiles)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {registeredUsers.map((u) => {
                  const uChannels = u.registeredHolidayChannels || [
                    'direct',
                    'airbnb',
                    'booking_com',
                    'lekkeslaap',
                    'safarinow',
                  ];
                  return (
                    <div key={u.id} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{u.fullName || u.name}</span>
                        <span className="text-[11px] font-semibold text-slate-500 capitalize">
                          {u.role.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Registered Channels ({uChannels.length}):{' '}
                        <span className="font-semibold text-slate-700">
                          {uChannels.map((c) => c.toUpperCase()).join(' · ')}
                        </span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          SECTION 3.5: GUEST BOOKED LIST & WHO IS BOOKED INSPECTOR (ADMIN & OWNER)
         ===================================================================== */}
      {activeSubSection === 'guest_booked_list' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                  ADMIN & OWNER EXCLUSIVE
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Live Guest Booked List &amp; Reservation Intelligence
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                👥 Who is Booked: Comprehensive Guest Roster &amp; Room Details
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Full visibility for Admin &amp; Owner: Click any guest to view complete contact info, BnB account numbers, room pictures, stay dates, and multi-channel sync status. (Guests and Kiosk view only room booked status).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setAddFormMode('booking');
                  setFormStartDate(selectedDate);
                  setIsAddModalOpen(true);
                }}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ New Reservation</span>
              </button>
            </div>
          </div>

          {/* Bookings Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-800 uppercase block">Total Booked Guests</span>
              <span className="text-2xl font-black text-emerald-950 mt-1 block">{bookings.length}</span>
              <span className="text-[11px] text-emerald-700">Across all registered channels</span>
            </div>
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-[11px] font-bold text-blue-800 uppercase block">Confirmed Active</span>
              <span className="text-2xl font-black text-blue-950 mt-1 block">
                {bookings.filter((b) => b.status === 'confirmed').length}
              </span>
              <span className="text-[11px] text-blue-700">Rooms locked &amp; secured</span>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-[11px] font-bold text-amber-800 uppercase block">Pending Inquiries</span>
              <span className="text-2xl font-black text-amber-950 mt-1 block">
                {bookings.filter((b) => b.status === 'pending').length}
              </span>
              <span className="text-[11px] text-amber-700">Awaiting confirmation</span>
            </div>
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
              <span className="text-[11px] font-bold text-purple-800 uppercase block">Total Revenue (ZAR)</span>
              <span className="text-2xl font-black text-purple-950 mt-1 block">
                {formatMoney(bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0))}
              </span>
              <span className="text-[11px] text-purple-700">Synced across channels</span>
            </div>
          </div>

          {/* Booked Guests Roster Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-black text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Guest Full Name</th>
                  <th className="py-3 px-4">Residence &amp; Suite</th>
                  <th className="py-3 px-4">Stay Dates</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No reservations recorded yet.
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => {
                    const prop = properties.find((p) => p.id === b.propertyId) || properties[0];
                    const propRooms = getPropertyBookableRooms(prop);
                    const rm =
                      propRooms.find(
                        (r) =>
                          r.id === (b as any).roomId ||
                          ((b as any).roomName && r.name.toLowerCase() === String((b as any).roomName).toLowerCase()) ||
                          (b.propertyTitle && b.propertyTitle.toLowerCase().includes(r.name.toLowerCase()))
                      ) || propRooms[0];
                    const roomImg = rm?.imageUrl || rm?.images?.[0] || prop?.imageUrl || prop?.images?.[0];
                    return (
                      <tr
                        key={b.id}
                        onClick={() => setSelectedGuestBooking(b)}
                        className="hover:bg-emerald-50/50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            {roomImg ? (
                              <img
                                src={roomImg}
                                alt={b.guestName}
                                className="w-9 h-9 rounded-lg object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-xs">
                                {b.guestName.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <span className="font-extrabold text-slate-900 block">{b.guestName}</span>
                              <span className="text-[10px] text-slate-500 font-mono">ID: {b.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{prop?.title || b.propertyTitle}</span>
                          <span className="text-[11px] font-bold text-emerald-700">
                            Suite: {(b as any).roomName || rm?.name || 'Room 1 — Executive King Suite'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">
                            {b.checkInDate} → {b.checkOutDate}
                          </span>
                          <span className="text-[10px] text-emerald-700 font-semibold">
                            {b.guestsCount || 1} Guest(s)
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="block text-slate-800">{b.guestPhone || '—'}</span>
                          <span className="block text-[11px] text-slate-500">{b.guestEmail || '—'}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border border-slate-200">
                            {b.sourceChannel || 'Direct'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-extrabold text-slate-900">
                            {formatMoney(b.totalAmount || 0)}
                          </span>
                          <span className="block text-[10px] text-slate-500 capitalize">{b.paymentStatus || 'Paid'}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full font-black text-[10px] uppercase ${
                              b.status === 'confirmed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : b.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {b.status === 'confirmed' ? '🔴 Booked' : b.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedGuestBooking(b);
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            View Details →
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          SECTION 4: INTERACTIVE CALENDAR (DAILY, WEEKLY, MONTHLY VIEWS)
         ===================================================================== */}
      {activeSubSection === 'calendar' && (
        <div ref={calendarGridRef} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
          {/* Calendar Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigateCalendar(-1)}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {viewMode === 'monthly' &&
                    focalDateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  {viewMode === 'weekly' &&
                    `Week of ${weekDaysGrid[0].monthShort} ${weekDaysGrid[0].dayNum} – ${weekDaysGrid[6].monthShort} ${weekDaysGrid[6].dayNum}, ${currentYear}`}
                  {viewMode === 'daily' &&
                    focalDateObj.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                </h3>
                <p className="text-xs text-slate-500">
                  Selected Date: <span className="font-mono font-bold text-slate-800">{selectedDate}</span> ·{' '}
                  {selectedDateItems.length} Event(s) on this date · Auto-syncing across {channels.length} channels
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigateCalendar(1)}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center gap-2">
                <span>
                  Stay Range: <strong className="font-mono">{formStartDate}</strong> → <strong className="font-mono">{formEndDate}</strong>
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-emerald-700 text-white font-black text-[11px]">
                  {calculatedNights} {calculatedNights === 1 ? 'Night' : 'Nights'} Stay ({formatMoney(calculatedStayTotalZar)})
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAddFormMode('booking');
                  setIsAddModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
              >
                Book {calculatedNights} {calculatedNights === 1 ? 'Night' : 'Nights'}
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) handleCalendarDaySelect(e.target.value);
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50"
              />
              <button
                type="button"
                onClick={() => {
                  setAddFormMode('block_date');
                  setFormStartDate(selectedDate);
                  setFormEndDate(selectedDate);
                  setIsAddModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1"
              >
                <Ban className="w-3.5 h-3.5 text-rose-600" />
                <span>Block / Unblock Date</span>
              </button>
            </div>
          </div>

          {/* VIEW 1: MONTHLY VIEW */}
          {viewMode === 'monthly' && (
            <div className="space-y-2">
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-500 pb-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {monthDaysGrid.map((cell) => {
                  const dayItems = unifiedItems.filter((item) =>
                    isDateInRange(cell.ymd, item.startDate, item.endDate)
                  );
                  const isBlocked = properties.some(
                    (p) =>
                      (selectedPropertyFilter === 'all' || p.id === selectedPropertyFilter) &&
                      (p.blockedDates || []).includes(cell.ymd)
                  );
                  const isRoomBooked = filterRoomBookedDatesSet.has(cell.ymd);
                  const isSelected = cell.ymd === selectedDate;
                  const isInStayRange = isDateInRange(cell.ymd, formStartDate, formEndDate);
                  const isStayStart = cell.ymd === formStartDate;
                  const isStayEnd = cell.ymd === formEndDate;

                  return (
                    <div
                      key={cell.ymd}
                      onClick={() => handleCalendarDaySelect(cell.ymd)}
                      className={`min-h-[104px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isRoomBooked
                          ? 'border-rose-400 bg-rose-50/60'
                          : isSelected || isStayStart || isStayEnd
                          ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/30'
                          : isInStayRange
                          ? 'border-emerald-400 bg-emerald-50/20'
                          : isBlocked
                          ? 'border-rose-200 bg-rose-50/40'
                          : cell.isCurrentMonth
                          ? 'border-slate-200 bg-white hover:border-slate-300'
                          : 'border-slate-100 bg-slate-50/60 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-mono font-bold ${
                            isRoomBooked
                              ? 'text-rose-800'
                              : isSelected || isStayStart || isStayEnd
                              ? 'text-emerald-700'
                              : cell.isCurrentMonth
                              ? 'text-slate-800'
                              : 'text-slate-400'
                          }`}
                        >
                          {cell.dayNum}
                        </span>
                        {isRoomBooked && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-rose-600 text-white shadow-2xs">
                            🔴 Occupied
                          </span>
                        )}
                        {!isRoomBooked && isStayStart && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                            Check-In
                          </span>
                        )}
                        {!isRoomBooked && !isStayStart && isStayEnd && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-800 text-white">
                            Out ({calculatedNights}N)
                          </span>
                        )}
                        {!isRoomBooked && !isStayStart && !isStayEnd && isInStayRange && (
                          <span className="text-[9px] font-bold text-emerald-700">
                            Stay
                          </span>
                        )}
                        {!isRoomBooked && !isInStayRange && selectedRoomFilter !== 'all' && (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 rounded">
                            🟢 Free
                          </span>
                        )}
                        {isBlocked && (
                          <span className="text-[10px] font-bold text-rose-600">Blocked</span>
                        )}
                      </div>

                      <div className="space-y-1 my-1">
                        {dayItems.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold truncate border ${
                              item.status === 'cancelled'
                                ? 'bg-rose-50 text-rose-700 border-rose-200 line-through'
                                : item.status === 'pending'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : item.sourceType === 'booking'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-blue-50 text-blue-800 border-blue-200'
                            }`}
                            title={`${item.title} (${item.status})`}
                          >
                            {item.title}
                          </div>
                        ))}
                        {dayItems.length > 3 && (
                          <div className="text-[10px] font-bold text-slate-500 pl-1">
                            +{dayItems.length - 3} more
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(cell.ymd);
                          setFormStartDate(cell.ymd);
                          const nextDay = new Date(parseYmd(cell.ymd).getTime() + 86400000);
                          setFormEndDate(formatDateYmd(nextDay));
                          setAddFormMode('booking');
                          setIsAddModalOpen(true);
                        }}
                        className="text-[10px] text-slate-400 hover:text-emerald-700 font-semibold text-left"
                      >
                        + Add
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 2: WEEKLY VIEW */}
          {viewMode === 'weekly' && (
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
              {weekDaysGrid.map((wDay) => {
                const dayItems = unifiedItems.filter((item) =>
                  isDateInRange(wDay.ymd, item.startDate, item.endDate)
                );
                const isSelected = wDay.ymd === selectedDate;
                const isInStayRange = isDateInRange(wDay.ymd, formStartDate, formEndDate);
                return (
                  <div
                    key={wDay.ymd}
                    onClick={() => handleCalendarDaySelect(wDay.ymd)}
                    className={`p-3 rounded-xl border min-h-[260px] flex flex-col justify-between cursor-pointer ${
                      isSelected || isInStayRange ? 'border-emerald-600 bg-emerald-50/20' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div>
                          <span className="text-[11px] font-bold text-slate-500 block">{wDay.label}</span>
                          <span className="text-sm font-mono font-bold text-slate-900">
                            {wDay.monthShort} {wDay.dayNum}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-slate-500">{dayItems.length}</span>
                      </div>

                      <div className="space-y-2">
                        {dayItems.length === 0 ? (
                          <p className="text-[11px] text-slate-400 py-4 text-center">No bookings / plans</p>
                        ) : (
                          dayItems.map((item) => (
                            <div
                              key={item.id}
                              className="p-2 rounded-lg border border-slate-200 bg-slate-50 space-y-1 text-xs"
                            >
                              <div className="font-bold text-slate-900 leading-snug">{item.title}</div>
                              <div className="text-[10px] text-slate-500">
                                {item.startTime} · {item.status.toUpperCase()}
                              </div>
                              <div className="flex items-center gap-1 pt-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateItemStatus(item, 'pending');
                                  }}
                                  className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold cursor-pointer"
                                >
                                  Pend
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateItemStatus(item, 'cancelled');
                                  }}
                                  className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded text-[10px] font-bold cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCalendarItem(item);
                                  }}
                                  className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-bold cursor-pointer"
                                >
                                  Del
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDate(wDay.ymd);
                        setFormStartDate(wDay.ymd);
                        setFormEndDate(wDay.ymd);
                        setAddFormMode('booking');
                        setIsAddModalOpen(true);
                      }}
                      className="mt-3 w-full py-1.5 rounded-lg border border-dashed border-slate-300 hover:border-emerald-500 text-[11px] font-bold text-slate-600 hover:text-emerald-700 cursor-pointer"
                    >
                      + Add Date
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW 3: DAILY VIEW */}
          {viewMode === 'daily' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Daily Schedule & Channel Availability for {selectedDate}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Manage bookings, pend/cancel/delete dates, or add hourly holiday & operational plans for this day.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleToggleBlockSingleDate(
                        selectedPropertyFilter === 'all' ? properties[0]?.id || 'prop-1' : selectedPropertyFilter,
                        selectedDate
                      )
                    }
                    className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    Toggle Block {selectedDate}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormStartDate(selectedDate);
                      setFormEndDate(selectedDate);
                      setAddFormMode('booking');
                      setIsAddModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                  >
                    + Add Booking on {selectedDate}
                  </button>
                </div>
              </div>

              {selectedDateItems.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl space-y-2">
                  <p className="text-sm font-bold text-slate-700">No bookings or plans scheduled on {selectedDate}</p>
                  <p className="text-xs text-slate-500">
                    All properties and rooms are open across connected channels. Click "+ Add Booking Date" or "Plan Holiday / Everything Else" to schedule.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-emerald-700">
                            {item.startTime} – {item.endTime}
                          </span>
                          <span className="text-sm font-bold text-slate-900">{item.title}</span>
                          <span className="text-xs font-semibold text-slate-500">
                            · Status: {item.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">{item.subtitle}</p>
                        <p className="text-[11px] text-slate-500">
                          Dates: {item.startDate} to {item.endDate} · Synced Channels:{' '}
                          {item.syncedChannels.map((c) => c.toUpperCase()).join(', ')}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdateItemStatus(item, 'confirmed')}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateItemStatus(item, 'pending')}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Pend Date
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateItemStatus(item, 'cancelled')}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Cancel Date
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCalendarItem(item)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-rose-600 hover:text-white text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Delete Date
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Selected Date Inspector & Action Ledger (Always visible below Monthly/Weekly grid) */}
          {viewMode !== 'daily' && (
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-slate-900">
                  Selected Date Inspector ({selectedDate}) — Add, Pend, Cancel or Delete Dates
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAddFormMode('booking');
                      setFormStartDate(selectedDate);
                      const nextDay = new Date(parseYmd(selectedDate).getTime() + 86400000);
                      setFormEndDate(formatDateYmd(nextDay));
                      setIsAddModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    + Add Booking on {selectedDate}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddFormMode('plan_everything');
                      setFormStartDate(selectedDate);
                      setFormEndDate(selectedDate);
                      setIsAddModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    + Plan Holiday / Activity on {selectedDate}
                  </button>
                </div>
              </div>

              {selectedDateItems.length === 0 ? (
                <p className="text-xs text-slate-500 py-2">
                  No bookings or events on {selectedDate}. Click "+ Add Booking on {selectedDate}" to schedule.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedDateItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between gap-2.5"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900">{item.title}</span>
                          <span className="text-[11px] font-bold uppercase text-slate-600">
                            {item.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">{item.subtitle}</p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {item.startDate} → {item.endDate} · Channels:{' '}
                          {item.syncedChannels.map((c) => c.toUpperCase()).join(', ')}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/80">
                        <button
                          type="button"
                          onClick={() => handleUpdateItemStatus(item, 'confirmed')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateItemStatus(item, 'pending')}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          Pend Date
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateItemStatus(item, 'cancelled')}
                          className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          Cancel Date
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCalendarItem(item)}
                          className="px-2.5 py-1 bg-slate-200 hover:bg-rose-600 hover:text-white text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          Delete Date
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          MODAL: ADD BOOKING DATE / PLAN HOLIDAY & EVERYTHING ELSE / BLOCK DATE
         ===================================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {addFormMode === 'booking' && 'Add Booking Date to Multi-Channel Calendar'}
                  {addFormMode === 'plan_everything' && 'Plan Holiday, Travel, Childcare or Personal Event'}
                  {addFormMode === 'block_date' && 'Block Property Dates Across All Channels'}
                </h3>
                <p className="text-xs text-slate-500">
                  Automatically updates across all active & registered channels
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setAddFormMode('booking')}
                className={`py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  addFormMode === 'booking' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Stay Booking
              </button>
              <button
                type="button"
                onClick={() => setAddFormMode('plan_everything')}
                className={`py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  addFormMode === 'plan_everything' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Plan Everything
              </button>
              <button
                type="button"
                onClick={() => setAddFormMode('block_date')}
                className={`py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  addFormMode === 'block_date' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Block Dates
              </button>
            </div>

            <form onSubmit={handleSubmitAddForm} className="space-y-3">
              {addFormMode === 'plan_everything' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Plan Category *</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as CalendarEventCategory)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                    >
                      {EVENT_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Plan / Event Title *</label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g., December Family Holiday Trip, Safari Tour, Flight or Meeting"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                      required
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Property / Residence</label>
                  <select
                    value={formPropertyId}
                    onChange={(e) => {
                      setFormPropertyId(e.target.value);
                      setFormRoomId('');
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  >
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.unitCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-800 mb-1">Suite / Room (Rooms Only)</label>
                  <select
                    value={activeFormRoom?.id || ''}
                    onChange={(e) => setFormRoomId(e.target.value)}
                    className="w-full px-3 py-2 border border-emerald-400 bg-emerald-50/40 rounded-xl text-xs font-bold text-slate-900"
                  >
                    {activeFormPropertyRooms.map((rm) => (
                      <option key={rm.id} value={rm.id}>
                        {rm.name} ({formatMoney(rm.basePrice)}/n)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start / Check-In Date *</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End / Check-Out Date *</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-emerald-800 mb-1">
                    Accommodation Night Stay
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={calculatedNights}
                      onChange={(e) => handleNightsCountChange(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-black text-emerald-950"
                    />
                    <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-2 rounded-xl shrink-0">
                      {calculatedNights}N
                    </span>
                  </div>
                </div>
              </div>

              {addFormMode === 'booking' && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-emerald-950 block">
                      Auto-Calculated Accommodation Stay: {calculatedNights} {calculatedNights === 1 ? 'Night' : 'Nights'}
                    </span>
                    <span className="text-[11px] text-emerald-700">
                      {formStartDate} → {formEndDate} @ {formatMoney(activeNightlyRateZar)}/night
                    </span>
                  </div>
                  <span className="text-sm font-black text-emerald-900">
                    {formatMoney(calculatedStayTotalZar)}
                  </span>
                </div>
              )}

              {addFormMode !== 'block_date' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Date Status</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                      >
                        <option value="confirmed">Confirmed (Active)</option>
                        <option value="pending">Pending (Hold Date)</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Primary Channel</label>
                      <select
                        value={formChannelId}
                        onChange={(e) => setFormChannelId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                      >
                        {ALL_HOLIDAY_CHANNELS.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {addFormMode === 'booking' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Guest Name *</label>
                        <input
                          type="text"
                          value={formGuestName}
                          onChange={(e) => setFormGuestName(e.target.value)}
                          placeholder="e.g. Lerato Mokoena"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-950 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Guest Phone *</label>
                        <input
                          type="text"
                          value={formGuestPhone}
                          onChange={(e) => setFormGuestPhone(e.target.value)}
                          placeholder="+27 69 497 7018"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-950 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Holiday Itinerary Details</label>
                    <textarea
                      rows={2}
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="Add details for your stay, holiday plan, flight, or personal schedule..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-950 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                >
                  Save & Sync All Channels
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          GUEST BOOKED INSPECTOR MODAL (ADMIN & OWNER ONLY)
         ===================================================================== */}
      {selectedGuestBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-white">{selectedGuestBooking.guestName}</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                      ID: {selectedGuestBooking.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Reservation Details &amp; Who is Booked (Admin &amp; Owner View)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedGuestBooking(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Property & Room Gallery */}
              {(() => {
                const prop = properties.find((p) => p.id === selectedGuestBooking.propertyId) || properties[0];
                const propRooms = getPropertyBookableRooms(prop);
                const rm =
                  propRooms.find(
                    (r) =>
                      r.id === (selectedGuestBooking as any).roomId ||
                      ((selectedGuestBooking as any).roomName &&
                        r.name.toLowerCase() === String((selectedGuestBooking as any).roomName).toLowerCase()) ||
                      (selectedGuestBooking.propertyTitle &&
                        selectedGuestBooking.propertyTitle.toLowerCase().includes(r.name.toLowerCase()))
                  ) || propRooms[0];
                const displayRoomName =
                  rm?.name || (selectedGuestBooking as any).roomName || 'Room 1 — Executive King Suite';
                
                // Combine all room photos and property photos so all added pictures are displayed
                const combinedPicturesList: { url: string; label: string }[] = [];
                const seenPics = new Set<string>();
                (rm?.images || rm?.photos || []).forEach((img, idx) => {
                  if (img && !seenPics.has(img)) {
                    seenPics.add(img);
                    combinedPicturesList.push({ url: img, label: `${displayRoomName} (Photo ${idx + 1})` });
                  }
                });
                (prop?.images || []).forEach((img, idx) => {
                  if (img && !seenPics.has(img)) {
                    seenPics.add(img);
                    combinedPicturesList.push({ url: img, label: idx === 0 ? 'Property Main Cover' : `Property (Photo ${idx + 1})` });
                  }
                });
                if (prop?.imageUrl && !seenPics.has(prop.imageUrl)) {
                  seenPics.add(prop.imageUrl);
                  combinedPicturesList.push({ url: prop.imageUrl, label: 'Property Image' });
                }
                const bnbAccount = prop?.bankAccount || {
                  bankName: 'First National Bank (FNB)',
                  accountNumber: '62849102934',
                  accountName: 'KasiBnB Primary Operations',
                  branchCode: '250655',
                  accountType: 'Business Cheque',
                };

                const handleReassignBookingRoom = (newPropertyId: string, newRoomId: string) => {
                  const targetProperty = properties.find((p) => p.id === newPropertyId) || prop;
                  if (!targetProperty) return;
                  const targetRooms = getPropertyBookableRooms(targetProperty);
                  const targetRoom = targetRooms.find((r) => r.id === newRoomId) || targetRooms[0];
                  if (!targetRoom) return;

                  const conflict = checkDoubleBookingConflict({
                    bookings,
                    propertyId: targetProperty.id,
                    roomId: targetRoom.id,
                    roomName: targetRoom.name,
                    checkInDate: selectedGuestBooking.checkInDate,
                    checkOutDate: selectedGuestBooking.checkOutDate,
                    excludeBookingId: selectedGuestBooking.id,
                    userRole: currentRole,
                  });

                  if (conflict.hasConflict) {
                    alert(
                      `⛔ ${
                        conflict.message ||
                        `Room "${targetRoom.name}" is already booked for ${selectedGuestBooking.checkInDate} to ${selectedGuestBooking.checkOutDate}.`
                      }`
                    );
                    return;
                  }

                  const nights = Math.max(1, selectedGuestBooking.nights || 1);
                  const newPropertyTitle = `${targetProperty.title} — ${targetRoom.name}`;
                  const newRoomImage =
                    targetRoom.images?.[0] ||
                    targetRoom.photos?.[0] ||
                    targetProperty.images?.[0] ||
                    selectedGuestBooking.propertyImage;

                  const updatedBooking: Booking = {
                    ...selectedGuestBooking,
                    propertyId: targetProperty.id,
                    propertyTitle: newPropertyTitle,
                    propertyImage: newRoomImage,
                    roomId: targetRoom.id,
                    roomName: targetRoom.name,
                  } as any;

                  onUpdateBookings((prev) =>
                    prev.map((item) => (item.id === selectedGuestBooking.id ? updatedBooking : item))
                  );
                  setSelectedGuestBooking(updatedBooking);
                  triggerSyncBanner(
                    `Updated booking for ${selectedGuestBooking.guestName} to Property: "${targetProperty.title}" — Suite: "${targetRoom.name}" (${nights} night(s)) and synced across all channels.`
                  );
                };

                return (
                  <>
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Reserved Residence &amp; Room Pictures
                      </span>
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row gap-4 items-center">
                        {combinedPicturesList.length > 0 ? (
                          <div className="flex gap-2 overflow-x-auto max-w-full pb-1">
                            {combinedPicturesList.map((item, idx) => (
                              <div
                                key={idx}
                                onClick={() => {
                                  setCalendarGalleryPhotos(combinedPicturesList);
                                  setCalendarGalleryIndex(idx);
                                  setCalendarGalleryTitle(prop?.title || selectedGuestBooking.propertyTitle);
                                  setCalendarGalleryOpen(true);
                                }}
                                className="relative shrink-0 group cursor-pointer"
                              >
                                <img
                                  src={item.url}
                                  alt={item.label}
                                  className="w-24 h-24 rounded-xl object-cover border border-slate-200 shadow-2xs group-hover:scale-105 transition-transform"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src =
                                      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=400&q=80';
                                  }}
                                />
                                <span className="absolute bottom-1 inset-x-1 bg-slate-950/80 text-white text-[8px] font-bold px-1 py-0.5 rounded truncate text-center block">
                                  {item.label.split('(')[0]}
                                </span>
                                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 rounded-xl transition-colors flex items-center justify-center">
                                  <span className="opacity-0 group-hover:opacity-100 text-[9px] font-bold text-white bg-slate-950/80 px-1.5 py-0.5 rounded transition-opacity">
                                    🔍 Fullscreen
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="w-24 h-24 rounded-xl bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold shrink-0">
                            No Picture
                          </div>
                        )}
                        <div className="space-y-1.5 flex-1 w-full">
                          <h4 className="text-sm font-black text-slate-900">
                            {prop?.title || selectedGuestBooking.propertyTitle}
                          </h4>
                          <p className="text-xs text-slate-600">
                            Suite: <span className="font-bold text-emerald-800">{displayRoomName}</span>
                          </p>
                          <p className="text-[11px] text-slate-500">{prop?.address || 'Prime Location'}</p>
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-black border border-rose-200">
                              🔴 Status: Booked &amp; Locked
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                              Channel: {(selectedGuestBooking.sourceChannel || selectedGuestBooking.channel || 'Direct').toUpperCase()}
                            </span>
                          </div>

                          {/* Owner / Admin Direct Room & Property Switcher in this View */}
                          <div className="pt-2.5 mt-2 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
                                Change Property
                              </label>
                              <select
                                value={prop?.id || selectedGuestBooking.propertyId}
                                onChange={(e) => {
                                  const nextProp = properties.find((p) => p.id === e.target.value);
                                  const nextRooms = getPropertyBookableRooms(nextProp);
                                  if (nextProp && nextRooms[0]) {
                                    handleReassignBookingRoom(nextProp.id, nextRooms[0].id);
                                  }
                                }}
                                className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 cursor-pointer"
                              >
                                {properties.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.title}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-extrabold text-emerald-800 uppercase mb-1">
                                Change Suite / Room (Rooms Only)
                              </label>
                              <select
                                value={rm?.id || ''}
                                onChange={(e) => handleReassignBookingRoom(prop?.id || selectedGuestBooking.propertyId, e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-400 text-xs font-extrabold text-emerald-950 cursor-pointer"
                              >
                                {propRooms.map((roomOption) => {
                                  const roomConflict = checkDoubleBookingConflict({
                                    bookings,
                                    propertyId: prop?.id || selectedGuestBooking.propertyId,
                                    roomId: roomOption.id,
                                    roomName: roomOption.name,
                                    checkInDate: selectedGuestBooking.checkInDate,
                                    checkOutDate: selectedGuestBooking.checkOutDate,
                                    excludeBookingId: selectedGuestBooking.id,
                                  });
                                  return (
                                    <option key={roomOption.id} value={roomOption.id}>
                                      {roomConflict.hasConflict ? '🔴 [BOOKED] ' : '🟢 '}
                                      {roomOption.name} (R{roomOption.basePrice}/n)
                                    </option>
                                  );
                                })}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* BnB / Owner Bank Account Details */}
                    <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                          <span>🏦 Owner / BnB Banking Details</span>
                        </span>
                        <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded">
                          Direct Settlement
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-amber-700 block">Bank Name</span>
                          <span className="font-bold text-amber-950">{bnbAccount.bankName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-amber-700 block">Account Number</span>
                          <span className="font-mono font-black text-amber-950">{bnbAccount.accountNumber}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-amber-700 block">Account Name</span>
                          <span className="font-bold text-amber-950">{bnbAccount.accountName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-amber-700 block">Branch Code</span>
                          <span className="font-mono font-bold text-amber-950">{bnbAccount.branchCode}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-amber-700 block">Account Type</span>
                          <span className="font-bold text-amber-950">{bnbAccount.accountType || 'Cheque / Current'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-amber-700 block">Owner Contact</span>
                          <span className="font-bold text-amber-950">{prop?.ownerName || 'Mdluli Nhlanhla'}</span>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Guest & Reservation Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Guest Information</span>
                  <p className="font-black text-slate-900 text-sm">{selectedGuestBooking.guestName}</p>
                  <p className="text-slate-700">📱 {selectedGuestBooking.guestPhone || 'No Phone'}</p>
                  <p className="text-slate-700">✉️ {selectedGuestBooking.guestEmail || 'No Email'}</p>
                  <p className="text-slate-700">👥 {selectedGuestBooking.guestsCount || 1} Registered Guest(s)</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Stay Dates &amp; Financials</span>
                  <p className="font-black text-emerald-950">
                    📅 {selectedGuestBooking.checkInDate} → {selectedGuestBooking.checkOutDate}
                  </p>
                  <p className="font-black text-slate-900 text-base">
                    Total: {formatMoney(selectedGuestBooking.totalAmount || 0)}
                  </p>
                  <p className="text-slate-700 capitalize">
                    Payment Status: <span className="font-bold text-emerald-700">{selectedGuestBooking.paymentStatus || 'Paid'}</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Created: {selectedGuestBooking.createdAt ? selectedGuestBooking.createdAt.slice(0, 10) : 'Active'}
                  </p>
                </div>
              </div>

              {/* Synced OTA Channels */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  Synchronized OTA Channels (No Double Booking Guaranteed)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedGuestBooking.syncedChannels || ['direct', 'airbnb', 'booking_com', 'lekkeslaap', 'safarinow']).map((ch) => (
                    <span
                      key={ch}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-[10px] uppercase shadow-2xs flex items-center gap-1"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>{ch}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Special Requests & Notes */}
              {(selectedGuestBooking.specialRequests || selectedGuestBooking.ownerNotes) && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Guest &amp; Booking Notes</span>
                  {selectedGuestBooking.specialRequests && (
                    <p className="text-slate-700">
                      <span className="font-bold">Guest Request:</span> {selectedGuestBooking.specialRequests}
                    </p>
                  )}
                  {selectedGuestBooking.ownerNotes && (
                    <p className="text-slate-700">
                      <span className="font-bold">Owner Note:</span> {selectedGuestBooking.ownerNotes}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {selectedGuestBooking.guestPhone && (
                  <a
                    href={`https://wa.me/${selectedGuestBooking.guestPhone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>💬 WhatsApp Guest</span>
                  </a>
                )}
                {selectedGuestBooking.guestPhone && (
                  <a
                    href={`tel:${selectedGuestBooking.guestPhone}`}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                  >
                    <span>📞 Call Guest</span>
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    scrollAndJumpToDate(selectedGuestBooking.checkInDate);
                    setSelectedGuestBooking(null);
                    setActiveSubSection('calendar');
                  }}
                  className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
                >
                  View on Calendar →
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGuestBooking(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Responsive Touch & Swipe Lightbox Modal */}
      <ResponsiveLightboxGallery
        isOpen={calendarGalleryOpen}
        photos={calendarGalleryPhotos}
        initialIndex={calendarGalleryIndex}
        propertyTitle={calendarGalleryTitle || 'StaySync Property'}
        onClose={() => setCalendarGalleryOpen(false)}
        onSelectPhotoIndex={(idx) => setCalendarGalleryIndex(idx)}
      />
    </div>
  );
};


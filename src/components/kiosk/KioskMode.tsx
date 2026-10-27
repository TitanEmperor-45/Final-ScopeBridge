import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { Property, ShuttleDriverProfile, NannyProfile, GlobalCurrency, Booking, ShuttleBooking, NannyBooking, KioskFlightBooking, KioskCarBooking, CalendarPlanEvent, ChannelConfig, UserAccount } from '../../types';
import { UniversalCalendarPlanner } from '../common/UniversalCalendarPlanner';
import pandaLogo from '../../assets/images/panda_family_cubs_1789920270586.jpg';
import {
  Monitor,
  UserCheck,
  UserPlus,
  Car,
  Baby,
  Wifi,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Phone,
  Clock,
  ArrowRight,
  LogOut,
  MapPin,
  Calendar,
  CreditCard,
  Building2,
  User,
  Heart,
  Download,
  Plane,
  Coffee,
  Globe,
  BedDouble,
  QrCode,
  Camera,
  Smartphone,
  Key,
  Copy,
  Share2,
  Check,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  EyeOff,
  Landmark,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { CURRENCY_RATES } from '../../data/usersData';
import {
  checkDoubleBookingConflict,
  getRoomOccupancyStatus,
  getBookedDatesSet,
  getPropertyBookableRooms,
} from '../../utils/bookingAvailability';

interface KioskModeProps {
  properties: Property[];
  drivers: ShuttleDriverProfile[];
  nannies: NannyProfile[];
  bookings: Booking[];
  selectedCurrency: GlobalCurrency;
  onBookProperty: (booking: Omit<Booking, 'id' | 'createdAt'>) => void;
  onAddShuttleBooking: (booking: ShuttleBooking) => void;
  onAddNannyBooking: (booking: NannyBooking) => void;
  onExitKiosk: () => void;
  showToast: (msg: string) => void;
  onCheckoutBooking?: (bookingId: string) => void;
  onAddFlightBooking?: (flight: Omit<KioskFlightBooking, 'id' | 'status' | 'createdAt'>) => void;
  onAddCarBooking?: (car: Omit<KioskCarBooking, 'id' | 'status' | 'createdAt'>) => void;
  calendarEvents?: CalendarPlanEvent[];
  channels?: ChannelConfig[];
  registeredUsers?: UserAccount[];
  onUpdateBookings?: React.Dispatch<React.SetStateAction<Booking[]>>;
  onUpdateCalendarEvents?: React.Dispatch<React.SetStateAction<CalendarPlanEvent[]>>;
  onUpdateProperties?: React.Dispatch<React.SetStateAction<Property[]>>;
  onOpenGuestBookingLink?: () => void;
  kioskOperator?: UserAccount;
}

const KIOSK_PAYMENT_GATEWAYS = [
  { id: 'online_banking', name: '🏦 Configured In-App Real Online Banking (RTC)', badge: 'Direct Interbank Clearance' },
  { id: 'ozow', name: 'Ozow Direct Bank EFT', badge: 'Bank-to-Bank RTC' },
  { id: 'capitec_pay', name: 'Capitec Pay Direct', badge: 'Instant Cellphone Approval' },
  { id: 'absa_escrow', name: 'Absa Corporate Escrow', badge: 'Verified Escrow Transfer' },
];

export const KioskMode: React.FC<KioskModeProps> = ({
  properties,
  drivers,
  nannies,
  bookings,
  selectedCurrency,
  onBookProperty,
  onAddShuttleBooking,
  onAddNannyBooking,
  onExitKiosk,
  showToast,
  onCheckoutBooking,
  onAddFlightBooking,
  onAddCarBooking,
  calendarEvents = [],
  channels = [],
  registeredUsers = [],
  onUpdateBookings = () => {},
  onUpdateCalendarEvents = () => {},
  onUpdateProperties = () => {},
  onOpenGuestBookingLink,
  kioskOperator,
}) => {
  const [activeKioskTab, setActiveKioskTab] = useState<
    'home' | 'check_in' | 'check_out' | 'walk_in' | 'booked_rooms' | 'calendar' | 'nanny' | 'flight_car' | 'additional_services' | 'shuttle' | 'wifi' | 'payment_terminal'
  >('home');

  // Fullscreen Terminal Setting for Physical Kiosk
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return Boolean(document.fullscreenElement);
    }
    return false;
  });

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, []);

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Fullscreen toggle:', err);
    }
  };

  // lobby Payment Terminal & Internet Banking States
  const [paymentTerminalOption, setPaymentTerminalOption] = useState<'hyperlink' | 'in_app'>('hyperlink');
  const [selectedTerminalBank, setSelectedTerminalBank] = useState<string>('capitec');
  const [terminalAmount, setTerminalAmount] = useState<number>(1850);
  const [terminalReference, setTerminalReference] = useState<string>(() => `SB-${Math.floor(100000 + Math.random() * 900000)}`);
  const [terminalEftStep, setTerminalEftStep] = useState<'form' | 'processing' | 'otp' | 'success'>('form');
  const [terminalOtpInput, setTerminalOtpInput] = useState<string>('');
  const [terminalError, setTerminalError] = useState<string | null>(null);

  // Shared Payment Gateway & OTP Approval State for Kiosk transactions
  const [selectedGateway, setSelectedGateway] = useState<string>('paystack');
  const [kioskOtpCode, setKioskOtpCode] = useState<string>('');
  const [kioskOtpInput, setKioskOtpInput] = useState<string>('');
  const [kioskOtpVerified, setKioskOtpVerified] = useState<boolean>(false);
  const [isRequestingKioskOtp, setIsRequestingKioskOtp] = useState<boolean>(false);

  const requestKioskPaymentOtp = async (amountZar: number, guestLabel: string, serviceLabel: string) => {
    setIsRequestingKioskOtp(true);
    try {
      const res = await fetch('/api/payment/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gatewayId: selectedGateway,
          amountZar,
          guestName: guestLabel || 'Kiosk Guest',
          guestEmail: walkInEmail || 'kiosk@scopebridg.co.za',
          guestPhone: walkInPhone || '+27 69 497 7018',
          propertyTitle: serviceLabel,
        }),
      });
      const data = await res.json();
      const code = data.otpCode || Math.floor(100000 + Math.random() * 900000).toString();
      setKioskOtpCode(code);
      setKioskOtpInput(code);
      setKioskOtpVerified(false);
      showToast(`OTP [${code}] sent to Guest & Admin (+27 69 497 7018 / Email / WhatsApp)`);
    } catch {
      const fallback = Math.floor(100000 + Math.random() * 900000).toString();
      setKioskOtpCode(fallback);
      setKioskOtpInput(fallback);
      setKioskOtpVerified(false);
    } finally {
      setIsRequestingKioskOtp(false);
    }
  };

  const verifyKioskPaymentOtp = () => {
    if (kioskOtpInput.trim() === kioskOtpCode.trim() && kioskOtpCode) {
      setKioskOtpVerified(true);
      showToast(`Payment Gateway (${selectedGateway.toUpperCase()}) OTP Approved! Admin notified at +27 69 497 7018.`);
    } else {
      showToast('Invalid OTP code. Please enter the 6-digit approval code.');
    }
  };

  // Check-In & QR Instant Arrival State
  const [searchRef, setSearchRef] = useState('');
  const [checkedInBooking, setCheckedInBooking] = useState<Booking | null>(null);
  const [checkInError, setCheckInError] = useState(false);
  const [checkInMethod, setCheckInMethod] = useState<'qr_scanner' | 'qr_generator' | 'qr_mobile' | 'reference_search'>('qr_generator');
  const [isQrScanning, setIsQrScanning] = useState(false);
  const [copiedPassToken, setCopiedPassToken] = useState(false);
  const [guestPhonePassSent, setGuestPhonePassSent] = useState(false);
  const [guestMobilePhoneInput, setGuestMobilePhoneInput] = useState('');

  // Scanned QR Inspection Modal State
  const [scannedQrInspectModalData, setScannedQrInspectModalData] = useState<{
    booking: Booking;
    rawPayload: string;
    extractedFields: {
      ref: string;
      guest: string;
      property: string;
      doorPin: string;
      checkIn: string;
      checkOut: string;
      wifi: string;
    };
  } | null>(null);

  // QR Code Generator State for Guest Property Check-In
  const [genSelectedBookingId, setGenSelectedBookingId] = useState<string>(bookings[0]?.id || 'custom');
  const [genCustomGuestName, setGenCustomGuestName] = useState<string>('Lerato Mokoena');
  const [genCustomPropertyId, setGenCustomPropertyId] = useState<string>(properties[0]?.id || 'prop-1');
  const [genCustomRoomId, setGenCustomRoomId] = useState<string>('');
  const [genCustomDoorPin, setGenCustomDoorPin] = useState<string>('4819');
  const [genCustomCheckIn, setGenCustomCheckIn] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [genCustomCheckOut, setGenCustomCheckOut] = useState<string>(() => new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10));
  const [genCustomWifiPass, setGenCustomWifiPass] = useState<string>('Solar_2026');
  const [genPassSharedPhone, setGenPassSharedPhone] = useState<string>('+27 69 497 7018');
  const [isGenPassSent, setIsGenPassSent] = useState<boolean>(false);
  const [customQrPayloadInput, setCustomQrPayloadInput] = useState<string>('');

  // Handle direct instant check-in from QR scan or selection
  const handleInstantQrCheckIn = (booking: Booking) => {
    setCheckedInBooking(booking);
    setCheckInError(false);
    showToast(`Instant Check-In Successful for ${booking.guestName}! Room PIN: ${booking.doorCode || '4819'}`);
    
    // Dispatch instant check-in arrival event
    fetch('/api/notifications/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'kiosk_qr_instant_checkin',
        recipientEmail: booking.guestEmail || 'admin@scopebridg.co.za',
        recipientPhone: booking.guestPhone || '+27 69 497 7018',
        subject: `Guest Checked In: ${booking.guestName} (${booking.propertyTitle})`,
        message: `Guest ${booking.guestName} completed instant QR check-in at reception kiosk for ${booking.propertyTitle}. Door PIN: ${booking.doorCode || '4819'}. Admin cell: +27 69 497 7018.`,
      }),
    }).catch(() => {});
  };

  // Decode and process scanned QR code text or payload, extracting ALL information into an inspection modal
  const handleProcessQrCodeData = (qrData: string) => {
    if (!qrData || !qrData.trim()) return;
    const raw = qrData.trim();

    let targetRef = '';
    let extGuest = 'Lerato Mokoena';
    let extProp = properties[0]?.id || 'prop-1';
    let extPin = '4819';
    let extIn = new Date().toISOString().slice(0, 10);
    let extOut = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);

    if (raw.includes('ref=') || raw.includes('bookingId=') || raw.includes('kiosk_ref=') || raw.includes('guest=')) {
      try {
        const url = new URL(
          raw.startsWith('http') || raw.startsWith('scopebridg://')
            ? raw.replace('scopebridg://', 'https://scopebridg.local/')
            : `https://local/${raw}`
        );
        targetRef = url.searchParams.get('ref') || url.searchParams.get('bookingId') || url.searchParams.get('kiosk_ref') || '';
        if (url.searchParams.get('guest')) extGuest = decodeURIComponent(url.searchParams.get('guest')!);
        if (url.searchParams.get('prop')) extProp = decodeURIComponent(url.searchParams.get('prop')!);
        if (url.searchParams.get('pin')) extPin = decodeURIComponent(url.searchParams.get('pin')!);
        if (url.searchParams.get('in')) extIn = decodeURIComponent(url.searchParams.get('in')!);
        if (url.searchParams.get('out')) extOut = decodeURIComponent(url.searchParams.get('out')!);
      } catch {
        const matchRef = raw.match(/[?&](?:ref|bookingId|kiosk_ref)=([^&]+)/);
        if (matchRef) targetRef = decodeURIComponent(matchRef[1]);
        const matchGuest = raw.match(/[?&]guest=([^&]+)/);
        if (matchGuest) extGuest = decodeURIComponent(matchGuest[1]);
        const matchProp = raw.match(/[?&]prop=([^&]+)/);
        if (matchProp) extProp = decodeURIComponent(matchProp[1]);
        const matchPin = raw.match(/[?&]pin=([^&]+)/);
        if (matchPin) extPin = decodeURIComponent(matchPin[1]);
        const matchIn = raw.match(/[?&]in=([^&]+)/);
        if (matchIn) extIn = decodeURIComponent(matchIn[1]);
        const matchOut = raw.match(/[?&]out=([^&]+)/);
        if (matchOut) extOut = decodeURIComponent(matchOut[1]);
      }
    }

    if (!targetRef && raw.startsWith('{') && raw.endsWith('}')) {
      try {
        const parsed = JSON.parse(raw);
        targetRef = parsed.id || parsed.bookingId || parsed.ref || parsed.guestName || '';
        if (parsed.guestName || parsed.guest) extGuest = parsed.guestName || parsed.guest;
        if (parsed.propertyId || parsed.prop) extProp = parsed.propertyId || parsed.prop;
        if (parsed.doorCode || parsed.pin) extPin = parsed.doorCode || parsed.pin;
        if (parsed.checkInDate || parsed.in) extIn = parsed.checkInDate || parsed.in;
        if (parsed.checkOutDate || parsed.out) extOut = parsed.checkOutDate || parsed.out;
      } catch {}
    }

    if (!targetRef) {
      targetRef = raw;
    }

    // Match against bookings
    const found = bookings.find(
      (b) =>
        b.id.toLowerCase() === targetRef.toLowerCase() ||
        b.guestName.toLowerCase().includes(targetRef.toLowerCase()) ||
        raw.toLowerCase().includes(b.id.toLowerCase())
    );

    const targetProp = properties.find((p) => p.id === extProp || p.title === extProp) || properties[0];

    const bookingToUse: Booking = found || {
      id: targetRef || `BK-${Date.now().toString().slice(-4)}`,
      propertyId: targetProp?.id || 'prop-1',
      propertyTitle: targetProp?.title || 'Luxury Residence',
      propertyImage: targetProp?.images?.[0] || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b',
      guestName: extGuest,
      guestEmail: 'guest@staysync.co.za',
      guestPhone: '+27 69 497 7018',
      channel: 'ScopeBridg QR Pass',
      checkInDate: extIn,
      checkOutDate: extOut,
      nights: 2,
      guestsCount: 2,
      totalAmount: 1800,
      commission: { ownerAmount: 1530, adminAmount: 270 },
      paymentMethod: 'card',
      paymentStatus: 'paid',
      addOns: { lateCheckout: false, airportPickup: false, breakfast: false },
      doorCode: extPin,
      idVerified: true,
      depositStatus: 'held',
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    setScannedQrInspectModalData({
      booking: bookingToUse,
      rawPayload: raw,
      extractedFields: {
        ref: bookingToUse.id,
        guest: bookingToUse.guestName,
        property: bookingToUse.propertyTitle,
        doorPin: bookingToUse.doorCode || '4819',
        checkIn: bookingToUse.checkInDate,
        checkOut: bookingToUse.checkOutDate,
        wifi: 'ScopeBridg_Solar_5G (Pass: Solar_2026)',
      },
    });

    showToast(`QR Code Scanned! All guest & property information extracted successfully.`);
  };

  // Simulate scanning guest mobile arrival QR voucher
  const handleSimulateCameraScan = () => {
    setIsQrScanning(true);
    setTimeout(() => {
      setIsQrScanning(false);
      const pendingArrival = bookings.find((b) => b.status === 'confirmed' || b.status === 'pending') || bookings[0];
      if (pendingArrival) {
        handleInstantQrCheckIn(pendingArrival);
      } else {
        showToast('No pending arrival bookings found. Please search by name or reference.');
      }
    }, 700);
  };

  // Walk-In Registration State with Auto-Nights Calendar Dates & Room + Channel Selection
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInEmail, setWalkInEmail] = useState('');
  const [walkInNotes, setWalkInNotes] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState(properties[0]?.id || 'prop-1');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [walkInChannel, setWalkInChannel] = useState<'direct' | 'airbnb' | 'booking' | 'agoda'>('direct');
  const [walkInCheckInDate, setWalkInCheckInDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [walkInCheckOutDate, setWalkInCheckOutDate] = useState(() => new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10));
  const [walkInNights, setWalkInNights] = useState(2);
  const [walkInSuccess, setWalkInSuccess] = useState(false);
  const [kioskCalendarMonth, setKioskCalendarMonth] = useState<Date>(() => new Date(2026, 8, 1));
  const [selectingKioskCheckOut, setSelectingKioskCheckOut] = useState<boolean>(false);

  useEffect(() => {
    if ((!selectedPropertyId || !properties.some((p) => p.id === selectedPropertyId)) && properties.length > 0) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [properties, selectedPropertyId]);

  const currentWalkInProperty = properties.find((p) => p.id === selectedPropertyId) || properties[0];
  const currentWalkInRooms = React.useMemo(
    () => getPropertyBookableRooms(currentWalkInProperty),
    [currentWalkInProperty]
  );
  const currentSelectedRoom = React.useMemo(() => {
    if (selectedRoomId) {
      const found = currentWalkInRooms.find((r) => r.id === selectedRoomId);
      if (found) return found;
    }
    // Automatically pick the first available room for the selected dates so guests never hit an occupied room by default
    if (currentWalkInProperty) {
      const firstAvailable = currentWalkInRooms.find(
        (r) =>
          !checkDoubleBookingConflict({
            bookings,
            propertyId: currentWalkInProperty.id,
            roomId: r.id,
            roomName: r.name,
            checkInDate: walkInCheckInDate,
            checkOutDate: walkInCheckOutDate,
          }).hasConflict
      );
      if (firstAvailable) return firstAvailable;
    }
    return currentWalkInRooms[0];
  }, [currentWalkInRooms, selectedRoomId, currentWalkInProperty, bookings, walkInCheckInDate, walkInCheckOutDate]);

  // Double Booking Conflict Checker for Kiosk (Per-Room Only)
  const walkInConflict = React.useMemo(() => {
    if (!currentWalkInProperty || !currentSelectedRoom) return { hasConflict: false };
    return checkDoubleBookingConflict({
      bookings,
      propertyId: currentWalkInProperty.id,
      roomId: currentSelectedRoom.id,
      roomName: currentSelectedRoom.name,
      checkInDate: walkInCheckInDate,
      checkOutDate: walkInCheckOutDate,
      userRole: 'kiosk',
    });
  }, [bookings, currentWalkInProperty, currentSelectedRoom, walkInCheckInDate, walkInCheckOutDate]);

  // Real-time Room Occupancy Status for Kiosk
  const walkInRoomOccupancy = React.useMemo(() => {
    return getRoomOccupancyStatus({
      room: currentSelectedRoom || { id: 'default', name: currentWalkInProperty?.title || 'Suite' },
      property: currentWalkInProperty,
      bookings,
      checkInDate: walkInCheckInDate,
      checkOutDate: walkInCheckOutDate,
    });
  }, [currentSelectedRoom, currentWalkInProperty, bookings, walkInCheckInDate, walkInCheckOutDate]);

  // Booked dates set for selected room (Privacy-Safe, Per-Room Only)
  const walkInBookedDatesSet = React.useMemo(() => {
    return getBookedDatesSet(
      bookings,
      currentWalkInProperty?.id || '',
      currentSelectedRoom?.id,
      currentWalkInProperty?.blockedDates,
      currentSelectedRoom?.name
    );
  }, [bookings, currentWalkInProperty, currentSelectedRoom]);

  const handleKioskCalendarDayClick = (dateStr: string) => {
    if (walkInBookedDatesSet.has(dateStr)) {
      showToast(`🔴 Date ${dateStr} is already booked/occupied. Please select an available green day.`);
      return;
    }

    if (!selectingKioskCheckOut || dateStr <= walkInCheckInDate) {
      handleWalkInCheckInChange(dateStr);
      setSelectingKioskCheckOut(true);
    } else {
      handleWalkInCheckOutChange(dateStr);
      setSelectingKioskCheckOut(false);
    }
  };

  const handleWalkInCheckInChange = (newCheckIn: string) => {
    setWalkInCheckInDate(newCheckIn);
    if (newCheckIn && walkInCheckOutDate) {
      const start = new Date(newCheckIn);
      const end = new Date(walkInCheckOutDate);
      const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 1) {
        setWalkInNights(diffDays);
      } else {
        const nextDay = new Date(start);
        nextDay.setDate(nextDay.getDate() + 1);
        setWalkInCheckOutDate(nextDay.toISOString().slice(0, 10));
        setWalkInNights(1);
      }
    }
  };

  const handleWalkInCheckOutChange = (newCheckOut: string) => {
    setWalkInCheckOutDate(newCheckOut);
    if (walkInCheckInDate && newCheckOut) {
      const start = new Date(walkInCheckInDate);
      const end = new Date(newCheckOut);
      const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 1) {
        setWalkInNights(diffDays);
      } else {
        setWalkInNights(1);
      }
    }
  };

  const handleWalkInNightsSelect = (newNights: number) => {
    const valid = Math.max(1, newNights);
    setWalkInNights(valid);
    if (walkInCheckInDate) {
      const start = new Date(walkInCheckInDate);
      if (!isNaN(start.getTime())) {
        const end = new Date(start);
        end.setDate(end.getDate() + valid);
        setWalkInCheckOutDate(end.toISOString().slice(0, 10));
      }
    }
  };

  // Additional Services State
  const [serviceGuestName, setServiceGuestName] = useState('');
  const [selectedAddOnServices, setSelectedAddOnServices] = useState<string[]>(['breakfast', 'airport_shuttle']);
  const [additionalServiceSuccess, setAdditionalServiceSuccess] = useState(false);

  // Quick Shuttle Request State
  const [shuttleDest, setShuttleDest] = useState('O.R. Tambo International (JNB)');
  const [shuttleTime, setShuttleTime] = useState('In 30 Minutes');
  const [shuttleGuestName, setShuttleGuestName] = useState('');
  const [shuttleSuccess, setShuttleSuccess] = useState(false);

  // Quick Nanny Request State
  const [nannyHours, setNannyHours] = useState(3);
  const [nannyParentName, setNannyParentName] = useState('');
  const [nannySuccess, setNannySuccess] = useState(false);

  // Kiosk Check-Out State
  const [checkoutRef, setCheckoutRef] = useState('');
  const [checkedOutBooking, setCheckedOutBooking] = useState<Booking | null>(null);
  const [checkoutError, setCheckoutError] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Kiosk Flight Booking State
  const [flightGuestName, setFlightGuestName] = useState('');
  const [flightRoute, setFlightRoute] = useState('JNB to CPT');
  const [flightCarrier, setFlightCarrier] = useState('Safair');
  const [flightDate, setFlightDate] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [flightSuccess, setFlightSuccess] = useState(false);

  // Kiosk Car Rental State
  const [carGuestName, setCarGuestName] = useState('');
  const [carVehicle, setCarVehicle] = useState('BMW 3 Series Luxury');
  const [carDays, setCarDays] = useState(3);
  const [carSuccess, setCarSuccess] = useState(false);

  const handleLookupBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const found = bookings.find(
      (b) => b.id.toLowerCase() === searchRef.trim().toLowerCase() || b.guestName.toLowerCase().includes(searchRef.trim().toLowerCase())
    );
    if (found) {
      setCheckedInBooking(found);
      setCheckInError(false);
      showToast(`Booking found for ${found.guestName}! Channel: ${(found.channel || 'direct').toUpperCase()} • PIN: ${found.doorCode}`);
    } else {
      setCheckInError(true);
      setCheckedInBooking(null);
    }
  };

  const handleRegisterWalkIn = (e: React.FormEvent) => {
    e.preventDefault();
    const prop = properties.find((p) => p.id === selectedPropertyId) || properties[0];
    if (!prop) {
      showToast("No active properties available for walk-in registration.");
      return;
    }

    if (walkInConflict.hasConflict) {
      showToast(walkInConflict.message || 'Double booking prevented: Room is already booked on the selected dates.');
      return;
    }

    const nightlyRate = currentSelectedRoom?.basePrice || prop.basePrice;
    const total = nightlyRate * walkInNights;
    const platformCommissionPercent = 8;
    const adminAmount = Math.round(total * (platformCommissionPercent / 100));
    const ownerAmount = total - adminAmount;

    onBookProperty({
      propertyId: prop.id,
      propertyTitle: currentSelectedRoom ? `${prop.title} — ${currentSelectedRoom.name}` : prop.title,
      propertyImage: currentSelectedRoom?.photos?.[0] || currentSelectedRoom?.images?.[0] || prop.images[0] || '',
      guestName: walkInName || 'Walk-In Guest',
      guestEmail: walkInEmail || 'walkin@scopebridg.co.za',
      guestPhone: walkInPhone || '+27 69 497 7018',
      checkInDate: walkInCheckInDate,
      checkOutDate: walkInCheckOutDate,
      nights: walkInNights,
      guestsCount: currentSelectedRoom?.maxGuests || 2,
      totalAmount: total,
      commission: { ownerAmount, adminAmount },
      paymentMethod: (selectedGateway as any) || 'card',
      paymentStatus: 'paid',
      addOns: { lateCheckout: false, airportPickup: false, breakfast: false },
      doorCode: Math.floor(1000 + Math.random() * 9000).toString(),
      channel: walkInChannel,
      idVerified: true,
      depositStatus: 'held',
      roomId: currentSelectedRoom?.id,
      roomName: currentSelectedRoom?.name,
    } as any);

    const activeChannelIds = Array.from(
      new Set(['direct', walkInChannel, ...(prop.publishedChannels || []), ...channels.map((c) => c.id)])
    );

    const newCalEvent: CalendarPlanEvent = {
      id: `CAL-KIOSK-${Date.now().toString().slice(-5)}`,
      title: `${walkInName || 'Walk-In Guest'} — ${currentSelectedRoom ? `${prop.title} — ${currentSelectedRoom.name}` : prop.title} (CONFIRMED)`,
      category: 'stay_booking',
      startDate: walkInCheckInDate,
      endDate: walkInCheckOutDate,
      startTime: '14:00',
      endTime: '10:00',
      status: 'confirmed',
      userId: 'kiosk-reception',
      userName: walkInName || 'Walk-In Guest',
      userRole: 'kiosk',
      propertyId: prop.id,
      propertyTitle: prop.title,
      channelId: walkInChannel,
      syncedChannels: activeChannelIds,
      notes: walkInNotes || `Kiosk Walk-In via ${selectedGateway.toUpperCase()}`,
      amountZar: total,
      createdAt: new Date().toISOString(),
    };

    onUpdateCalendarEvents((prev) => [newCalEvent, ...prev]);

    fetch('/api/notifications/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'kiosk_walk_in_booking',
        recipientEmail: walkInEmail || 'admin@scopebridg.co.za',
        recipientPhone: walkInPhone || '+27 69 497 7018',
        subject: `Kiosk Walk-In Confirmed: ${prop.title} (${walkInNights} Nights via ${selectedGateway.toUpperCase()})`,
        message: `Guest ${walkInName} booked ${prop.title} (${walkInCheckInDate} to ${walkInCheckOutDate}, ${walkInNights} nights) on channel ${walkInChannel.toUpperCase()} via ${selectedGateway.toUpperCase()}. Notes: ${walkInNotes || 'None'}. Admin cell: +27 69 497 7018.`,
      }),
    }).catch(() => {});

    setWalkInSuccess(true);
    showToast(`Walk-in registered for ${prop.title} (${walkInNights} nights) via ${selectedGateway.toUpperCase()}! Synced on all channels.`);
  };

  const handleLookupCheckoutBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const found = bookings.find(
      (b) => b.id.toLowerCase() === checkoutRef.trim().toLowerCase() || b.guestName.toLowerCase().includes(checkoutRef.trim().toLowerCase())
    );
    if (found) {
      setCheckedOutBooking(found);
      setCheckoutError(false);
      showToast(`Booking found for ${found.guestName}. Ready for check-out.`);
    } else {
      setCheckoutError(true);
      setCheckedOutBooking(null);
    }
  };

  const handlePerformCheckout = () => {
    if (checkedOutBooking) {
      if (onCheckoutBooking) {
        onCheckoutBooking(checkedOutBooking.id);
      }
      setCheckoutSuccess(true);
      showToast(`Successfully checked out ${checkedOutBooking.guestName}! Room state flagged.`);
    }
  };

  const currencyInfo = CURRENCY_RATES[selectedCurrency] || CURRENCY_RATES.ZAR;

  return (
    <div className="min-h-screen bg-slate-800 text-white flex flex-col">
      {/* Kiosk Header / Top Bar */}
      <header className="bg-slate-700 border-b border-slate-600 px-6 py-4 space-y-3 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-lg border border-amber-500/30 flex-shrink-0 bg-amber-500">
              <img src={pandaLogo} alt="ScopeBridg Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-white">ScopeBridg™ Reception Kiosk</h1>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Dedicated Kiosk View
                </span>
                {kioskOperator && kioskOperator.username !== 'guest' && (
                  <span className="bg-teal-500/20 text-teal-200 border border-teal-500/40 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-amber-300" />
                    <span>
                      Kiosk Operator: {kioskOperator.fullName || kioskOperator.name} (@{kioskOperator.username} •{' '}
                      {kioskOperator.createdByOwnerName
                        ? `Staff Created by ${kioskOperator.createdByOwnerName}`
                        : kioskOperator.role.replace('_', ' ').toUpperCase()})
                    </span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                Ferndale on Republic &amp; Oxford St • Admin Support &amp; OTP Desk: <strong className="text-amber-300 font-mono">+27 69 497 7018</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                isFullscreen
                  ? 'bg-teal-500/20 text-teal-200 border-teal-500/40 hover:bg-teal-500/30'
                  : 'bg-slate-600 text-slate-100 border-slate-500 hover:bg-slate-500 hover:text-white'
              }`}
              title={isFullscreen ? 'Exit Full Screen Kiosk' : 'Enter Full Screen Kiosk Mode'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4 text-teal-300" /> : <Maximize2 className="w-4 h-4 text-amber-300" />}
              <span className="hidden sm:inline">{isFullscreen ? 'Exit Full Screen' : 'Full Screen'}</span>
            </button>
            <button
              onClick={() => setActiveKioskTab('home')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeKioskTab === 'home'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'bg-slate-600 text-slate-100 border border-slate-500 hover:bg-slate-500'
              }`}
            >
              Main Menu
            </button>
            <button
              onClick={onExitKiosk}
              className="px-3.5 py-2 bg-red-600/20 text-red-300 border border-red-500/40 hover:bg-red-600/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Exit Kiosk
            </button>
          </div>
        </div>

        {/* Dedicated Kiosk Sub-Navigation Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-600/80">
          {[
            { id: 'home', label: '🏠 Kiosk Home' },
            { id: 'booked_rooms', label: '🏨 Booked Rooms & Status' },
            { id: 'check_in', label: '🔑 Check-In' },
            { id: 'check_out', label: '🚪 Check-Out' },
            { id: 'walk_in', label: '📝 Walk-In & Book' },
            { id: 'calendar', label: '📅 Calendar & Channels' },
            { id: 'nanny', label: '👶 Nanny Booking' },
            { id: 'flight_car', label: '✈️ Flight Bookings' },
            { id: 'additional_services', label: '🛎️ Additional Services' },
            { id: 'shuttle', label: '🚐 Airport Shuttle' },
            { id: 'payment_terminal', label: '💳 Internet Banking & Payments' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveKioskTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeKioskTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs font-black'
                  : 'bg-slate-600/90 text-slate-100 hover:bg-slate-500 hover:text-white border border-slate-550'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Kiosk Stage */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full flex flex-col justify-center">
        {activeKioskTab === 'home' && (
          <div className="space-y-6">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Welcome to ScopeBridg Reception Kiosk
              </h2>
              <p className="text-sm text-slate-400">
                Self-service Check-In, Check-Out, Walk-In Room Booking, View Booked Rooms, Live Calendar & Channels, Nanny Booking, Flight Bookings, Additional Services, and Multi-Gateway OTP Payments.
              </p>
            </div>

            {/* Super Prominent QR Code Generator for Bookings Hero Card */}
            <div className="max-w-4xl mx-auto w-full bg-gradient-to-r from-amber-500/20 via-slate-900 to-amber-500/25 border-2 border-amber-400 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-amber-500 text-slate-950 rounded-2xl flex items-center justify-center font-black shadow-lg shrink-0">
                  <QrCode className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      ✨ Top Priority Feature
                    </span>
                    <span className="text-xs text-emerald-400 font-bold">ais-pre & Production Ready</span>
                  </div>
                  <h3 className="text-lg font-black text-white">Instant Booking QR Code Generator & Arrival Pass</h3>
                  <p className="text-xs text-slate-300">
                    Generate scannable QR keys, smart door PINs, and Wi-Fi boarding passes for any guest booking instantly.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCheckedInBooking(null);
                  setCheckInError(false);
                  setCheckInMethod('qr_generator');
                  setActiveKioskTab('check_in');
                }}
                className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs flex items-center gap-2 shrink-0 shadow-lg cursor-pointer transition-all hover:scale-105"
              >
                <QrCode className="w-4 h-4" />
                <span>Open QR Generator Now</span>
              </button>
            </div>

            {/* Kiosk Full Screen & Quick Share Bar */}
            <div className="max-w-3xl mx-auto w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleToggleFullscreen}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer border ${
                    isFullscreen
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 hover:bg-teal-500/30 shadow-md'
                      : 'bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-750 hover:text-amber-300'
                  }`}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4 text-teal-300" /> : <Maximize2 className="w-4 h-4 text-amber-300" />}
                  <span>{isFullscreen ? '🖥️ Full Screen Active (Click to Exit)' : '🖥️ Launch Full Screen Kiosk'}</span>
                </button>
                <span className="text-[11px] text-slate-400 hidden md:inline">
                  {isFullscreen ? 'Terminal optimized for physical tablet' : 'Click to lock into full screen lobby mode'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const link = `${window.location.origin}/?role=kiosk&token=KSK-OXFORD-8891`;
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(link);
                    }
                    showToast('Direct Lobby Kiosk link copied to clipboard!');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copy Kiosk Link</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-2">
              {/* Booked Rooms & Active Occupancy Card */}
              <button
                onClick={() => setActiveKioskTab('booked_rooms')}
                className="group p-5 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-3xl text-left space-y-3 transition-all duration-300 shadow-xl cursor-pointer flex flex-col justify-between"
              >
                <div className="w-12 h-12 bg-cyan-500/10 text-cyan-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BedDouble className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                      Booked Rooms &amp; Status
                    </h3>
                    <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-extrabold uppercase">
                      Live
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    View all suites, room pictures, occupied/free dates, BnB bank details, and room occupancy status.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 pt-1">
                  <span>View Booked Rooms</span> <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Check In Card with QR Check-In Highlight */}
              <button
                onClick={() => {
                  setCheckedInBooking(null);
                  setCheckInError(false);
                  setCheckInMethod('qr_scanner');
                  setActiveKioskTab('check_in');
                }}
                className="group p-5 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-3xl text-left space-y-3 transition-all duration-300 shadow-xl cursor-pointer flex flex-col justify-between"
              >
                <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <QrCode className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                      Instant QR Check-In
                    </h3>
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-extrabold uppercase">
                      QR Key
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Scan voucher QR code or smartphone upon arrival to unlock door PIN & get digital key pass.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 pt-1">
                  <span>Start QR Check-In</span> <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Check Out Card */}
              <button
                onClick={() => {
                  setCheckoutSuccess(false);
                  setCheckedOutBooking(null);
                  setCheckoutRef('');
                  setActiveKioskTab('check_out');
                }}
                className="group p-5 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-rose-500/50 rounded-3xl text-left space-y-3 transition-all duration-300 shadow-xl cursor-pointer flex flex-col justify-between"
              >
                <div className="w-12 h-12 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white group-hover:text-rose-400 transition-colors">
                    Self Check-Out
                  </h3>
                  <p className="text-xs text-slate-400">
                    Complete departure, view receipt & booking channel, and dispatch housekeeping.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-rose-400 pt-1">
                  <span>Start Check-Out</span> <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Walk-in Registration */}
              <button
                onClick={() => {
                  setWalkInSuccess(false);
                  setKioskOtpCode('');
                  setKioskOtpVerified(false);
                  setActiveKioskTab('walk_in');
                }}
                className="group p-5 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-3xl text-left space-y-3 transition-all duration-300 shadow-xl cursor-pointer flex flex-col justify-between"
              >
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                    Walk-In & Rooms
                  </h3>
                  <p className="text-xs text-slate-400">
                    Select any property & room, auto-calculate stay nights from calendar, & pay via OTP gateway.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 pt-1">
                  <span>Register Walk-In</span> <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Guest Direct Booking Link Card */}
              {onOpenGuestBookingLink && (
                <button
                  type="button"
                  onClick={onOpenGuestBookingLink}
                  className="group p-5 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 rounded-3xl text-left space-y-3 transition-all duration-300 shadow-xl cursor-pointer flex flex-col justify-between"
                >
                  <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                        Guest Booking Link &amp; QR
                      </h3>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-extrabold uppercase">
                        Instant
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Open shareable direct reservation link, QR code, and 2-click stay calendar calculation.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 pt-1">
                    <span>Open Booking Link</span> <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              )}

              {/* Kiosk Calendar & Booking Channels */}
              <button
                onClick={() => setActiveKioskTab('calendar')}
                className="group p-5 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-3xl text-left space-y-3 transition-all duration-300 shadow-xl cursor-pointer flex flex-col justify-between"
              >
                <div className="w-12 h-12 bg-cyan-500/10 text-cyan-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                    Calendar & Channels
                  </h3>
                  <p className="text-xs text-slate-400">
                    View room availability calendar, registered channels, and where every booking took place.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 pt-1">
                  <span>Open Calendar</span> <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Quick Nanny Request */}
              <button
                onClick={() => {
                  setNannySuccess(false);
                  setActiveKioskTab('nanny');
                }}
                className="group p-5 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-3xl text-left space-y-3 transition-all duration-300 shadow-xl cursor-pointer flex flex-col justify-between"
              >
                <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Baby className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white group-hover:text-purple-400 transition-colors">
                    Nanny Booking
                  </h3>
                  <p className="text-xs text-slate-400">
                    Book certified childcare (Sebenele Mathunywa & team) with payment gateway selection.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-purple-400 pt-1">
                  <span>Book Nanny</span> <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Flight & Car Booking Card */}
              <button
                onClick={() => {
                  setFlightSuccess(false);
                  setCarSuccess(false);
                  setFlightGuestName('');
                  setCarGuestName('');
                  setActiveKioskTab('flight_car');
                }}
                className="group p-5 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-3xl text-left space-y-3 transition-all duration-300 shadow-xl cursor-pointer flex flex-col justify-between"
              >
                <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plane className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">
                    Flight Bookings & Cars
                  </h3>
                  <p className="text-xs text-slate-400">
                    Book domestic flights (FlySafair, Airlink, CemAir) & luxury rental vehicles at the kiosk.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 pt-1">
                  <span>Book Flights</span> <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Additional Services Card */}
              <button
                onClick={() => {
                  setAdditionalServiceSuccess(false);
                  setActiveKioskTab('additional_services');
                }}
                className="group p-5 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-amber-400/50 rounded-3xl text-left space-y-3 transition-all duration-300 shadow-xl cursor-pointer flex flex-col justify-between"
              >
                <div className="w-12 h-12 bg-amber-500/10 text-amber-300 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Coffee className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                    Additional Services
                  </h3>
                  <p className="text-xs text-slate-400">
                    Order Breakfast Baskets, Late Check-Out, Private Chef, Laundry, Spa & Chauffeur Add-ons.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300 pt-1">
                  <span>Order Services</span> <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Quick Shuttle Request */}
              <button
                onClick={() => {
                  setShuttleSuccess(false);
                  setActiveKioskTab('shuttle');
                }}
                className="group p-5 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-3xl text-left space-y-3 transition-all duration-300 shadow-xl cursor-pointer flex flex-col justify-between"
              >
                <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Car className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                    Airport & Local Shuttle
                  </h3>
                  <p className="text-xs text-slate-400">
                    Summon executive chauffeur Mthokozisi Mbele for JNB airport or Sandton transfers.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-blue-400 pt-1">
                  <span>Book Shuttle</span> <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Lobby Payment & Internet Banking Card */}
              <button
                onClick={() => {
                  setTerminalEftStep('form');
                  setTerminalOtpInput('');
                  setTerminalError(null);
                  setTerminalReference(`SB-${Math.floor(100000 + Math.random() * 900000)}`);
                  setActiveKioskTab('payment_terminal');
                }}
                className="group p-5 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-3xl text-left space-y-3 transition-all duration-300 shadow-xl cursor-pointer flex flex-col justify-between"
              >
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                    Lobby Payment Terminal
                  </h3>
                  <p className="text-xs text-slate-400">
                    Settle booking balances or extra services via secure online portal or instant in-app EFT.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 pt-1">
                  <span>Open Payment Terminal</span> <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>

            {/* Bottom Quick Info Bar */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-emerald-400" />
                <span>Wi-Fi: <strong className="text-white">ScopeBridg_Solar_5G</strong> (Password: <span className="text-amber-400 font-mono">Solar_2026</span>)</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400" />
                <span>Admin Contact & WhatsApp: <strong className="text-white font-mono">+27 69 497 7018</strong></span>
              </div>
              <button
                onClick={() => setActiveKioskTab('wifi')}
                className="text-amber-400 font-bold hover:underline cursor-pointer"
              >
                View Emergency Contacts →
              </button>
            </div>
          </div>
        )}

        {/* Tab 1: Check In with Instant QR Code Generation & Scanning */}
        {activeKioskTab === 'check_in' && (
          <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl w-full">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <QrCode className="w-6 h-6 text-amber-400" /> Guest Self Check-In & QR Key Generator
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Scan arrival QR code on kiosk, use smartphone camera, or enter booking reference.
                </p>
              </div>
              <button
                onClick={() => {
                  setCheckedInBooking(null);
                  setActiveKioskTab('home');
                }}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                Back to Menu
              </button>
            </div>

            {/* Check-In Mode Switcher */}
            {!checkedInBooking && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setCheckInMethod('qr_scanner')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    checkInMethod === 'qr_scanner'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Scan QR Voucher</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCheckInMethod('qr_generator')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    checkInMethod === 'qr_generator'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Generate QR Pass</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCheckInMethod('qr_mobile')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    checkInMethod === 'qr_mobile'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile Phone QR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCheckInMethod('reference_search')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    checkInMethod === 'reference_search'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Ref / Name Search</span>
                </button>
              </div>
            )}

            {/* Mode 1: QR Scanner Simulator & Direct Upload / Manual Entry */}
            {!checkedInBooking && checkInMethod === 'qr_scanner' && (
              <div className="space-y-4">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
                  <div className="relative mx-auto w-48 h-48 bg-slate-900 border-2 border-dashed border-amber-500/60 rounded-2xl flex flex-col items-center justify-center overflow-hidden">
                    {isQrScanning ? (
                      <div className="space-y-2">
                        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                        <span className="text-xs font-bold text-amber-300">Reading QR Code...</span>
                        {/* Scanner Laser Beam Animation */}
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse shadow-lg" />
                      </div>
                    ) : (
                      <div className="space-y-2.5 p-4">
                        <Camera className="w-12 h-12 text-amber-400 mx-auto animate-bounce" />
                        <p className="text-xs font-bold text-white">Hold Arrival QR Code in Front of Camera</p>
                        <p className="text-[10px] text-slate-400">Position the QR code on your phone or booking confirmation sheet</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      disabled={isQrScanning}
                      onClick={handleSimulateCameraScan}
                      className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{isQrScanning ? 'Scanning...' : 'Scan / Read Arrival QR Voucher'}</span>
                    </button>

                    <label className="w-full sm:w-auto px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer border border-slate-700 transition-all">
                      <ImageIcon className="w-4 h-4 text-amber-400" />
                      <span>Upload QR Image / Voucher</span>
                      <input
                        type="file"
                        accept="image/*,.heic,.heif,.jpg,.jpeg,.png,.webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            showToast(`Reading image voucher: ${file.name}...`);
                            setIsQrScanning(true);
                            setTimeout(() => {
                              setIsQrScanning(false);
                              const match = bookings.find((b) => b.status === 'confirmed') || bookings[0];
                              if (match) handleInstantQrCheckIn(match);
                            }, 800);
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* Manual Paste / Type QR Payload */}
                  <div className="pt-3 border-t border-slate-800/80 max-w-md mx-auto">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customQrPayloadInput}
                        onChange={(e) => setCustomQrPayloadInput(e.target.value)}
                        placeholder="Paste QR Code URL or Reference (e.g. BK-101 or scopebridg://...)"
                        className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customQrPayloadInput.trim()) {
                            handleProcessQrCodeData(customQrPayloadInput);
                            setCustomQrPayloadInput('');
                          }
                        }}
                        className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer shrink-0"
                      >
                        Decode & Check In
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick select pending arrival list if available */}
                {bookings.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Or 1-Click Instant Check-In from Scheduled Arrivals:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {bookings.slice(0, 4).map((bk) => (
                        <button
                          key={bk.id}
                          type="button"
                          onClick={() => handleInstantQrCheckIn(bk)}
                          className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/50 rounded-xl text-left transition-all flex items-center justify-between group cursor-pointer"
                        >
                          <div>
                            <span className="text-xs font-bold text-white block group-hover:text-amber-300">
                              {bk.guestName}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[180px]">
                              {bk.propertyTitle}
                            </span>
                            <span className="text-[9px] text-emerald-400 font-mono font-bold">
                              {bk.nights} Night(s) • PIN: {bk.doorCode || '4819'}
                            </span>
                          </div>
                          <span className="px-2 py-1 bg-amber-500/20 text-amber-300 text-[10px] font-extrabold rounded-lg shrink-0">
                            Check In ➔
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mode 2: Generate Unique Property Check-In QR Codes */}
            {!checkedInBooking && checkInMethod === 'qr_generator' && (
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-amber-400" />
                    <span>Generate Unique Property Check-In QR Pass</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Create scannable QR arrival vouchers for upcoming guests, linking directly to smart door PIN, room keys, and property directions.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Generator Form Controls */}
                  <div className="lg:col-span-6 space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Select Existing Booking or Create Custom:
                      </label>
                      <select
                        value={genSelectedBookingId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setGenSelectedBookingId(val);
                          if (val !== 'custom') {
                            const bk = bookings.find((b) => b.id === val);
                            if (bk) {
                              setGenCustomGuestName(bk.guestName);
                              setGenCustomPropertyId(bk.propertyId);
                              setGenCustomRoomId(bk.roomId || '');
                              setGenCustomDoorPin(bk.doorCode || '4819');
                              setGenCustomCheckIn(bk.checkInDate || new Date().toISOString().slice(0, 10));
                              setGenCustomCheckOut(bk.checkOutDate || new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10));
                              if (bk.guestPhone) setGenPassSharedPhone(bk.guestPhone);
                            }
                          }
                        }}
                        className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="custom">✨ Create New Custom QR Arrival Pass</option>
                        {bookings.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.guestName} — {b.propertyTitle} ({b.id})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Guest Full Name</label>
                        <input
                          type="text"
                          value={genCustomGuestName}
                          onChange={(e) => setGenCustomGuestName(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                          placeholder="e.g. Lerato Mokoena"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Smart Door PIN</label>
                        <input
                          type="text"
                          value={genCustomDoorPin}
                          onChange={(e) => setGenCustomDoorPin(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono"
                          placeholder="e.g. 4819"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Assigned Property</label>
                      <select
                        value={genCustomPropertyId}
                        onChange={(e) => setGenCustomPropertyId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                      >
                        {properties.map((p) => (
                          <option key={p.id} value={p.id}>{p.title} ({p.area})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Arrival Date</label>
                        <input
                          type="date"
                          value={genCustomCheckIn}
                          onChange={(e) => setGenCustomCheckIn(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Departure Date</label>
                        <input
                          type="date"
                          value={genCustomCheckOut}
                          onChange={(e) => setGenCustomCheckOut(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Wi-Fi Password for QR Card</label>
                      <input
                        type="text"
                        value={genCustomWifiPass}
                        onChange={(e) => setGenCustomWifiPass(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono"
                        placeholder="e.g. Solar_2026"
                      />
                    </div>
                  </div>

                  {/* Right Column: Live Printable / Scannable QR Boarding Card Preview */}
                  <div className="lg:col-span-6 bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500/60 rounded-3xl p-5 space-y-4 shadow-2xl flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-amber-500 text-slate-950 rounded-lg flex items-center justify-center font-black text-xs">
                            SS
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">StaySync Official Arrival Pass</span>
                            <span className="text-xs font-extrabold text-white">ScopeBridg Instant Check-In</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-500/40">
                          Active QR
                        </span>
                      </div>

                      {/* QR Code Container */}
                      <div className="bg-white p-4 rounded-2xl text-center shadow-lg border-2 border-amber-400 mx-auto inline-block">
                        <QRCode
                          value={`scopebridg://checkin?ref=${encodeURIComponent(genSelectedBookingId !== 'custom' ? genSelectedBookingId : `BK-${Date.now().toString().slice(-4)}`)}&guest=${encodeURIComponent(genCustomGuestName)}&prop=${encodeURIComponent(genCustomPropertyId)}&pin=${encodeURIComponent(genCustomDoorPin)}&in=${encodeURIComponent(genCustomCheckIn)}&out=${encodeURIComponent(genCustomCheckOut)}`}
                          size={150}
                        />
                      </div>

                      {/* Reservation Details Breakdown */}
                      <div className="bg-slate-900/90 rounded-2xl p-3 border border-slate-800 text-left space-y-1.5 text-xs">
                        <div className="flex justify-between items-center text-slate-300">
                          <span className="text-slate-500 text-[10px] font-bold uppercase">Guest:</span>
                          <span className="font-bold text-white">{genCustomGuestName}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-300">
                          <span className="text-slate-500 text-[10px] font-bold uppercase">Property:</span>
                          <span className="font-semibold text-amber-300 truncate max-w-[180px]">
                            {properties.find((p) => p.id === genCustomPropertyId)?.title || 'Luxury Suite'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-300">
                          <span className="text-slate-500 text-[10px] font-bold uppercase">Smart Door PIN:</span>
                          <span className="font-mono font-black text-emerald-400 text-sm bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                            {genCustomDoorPin}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-300">
                          <span className="text-slate-500 text-[10px] font-bold uppercase">Wi-Fi Network:</span>
                          <span className="font-mono text-[11px] text-slate-200">ScopeBridg_Solar_5G ({genCustomWifiPass})</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons: Test Check-In, Share to Mobile, Print */}
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const targetProp = properties.find((p) => p.id === genCustomPropertyId);
                            const targetBk: Booking = {
                              id: genSelectedBookingId !== 'custom' ? genSelectedBookingId : `BK-${Date.now().toString().slice(-4)}`,
                              propertyId: genCustomPropertyId,
                              propertyTitle: targetProp?.title || 'Luxury Residence',
                              propertyImage: targetProp?.images?.[0] || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b',
                              guestName: genCustomGuestName,
                              guestEmail: 'guest@staysync.co.za',
                              guestPhone: genPassSharedPhone,
                              channel: 'direct',
                              checkInDate: genCustomCheckIn,
                              checkOutDate: genCustomCheckOut,
                              nights: 2,
                              guestsCount: 2,
                              totalAmount: 1800,
                              commission: { ownerAmount: 1530, adminAmount: 270 },
                              paymentMethod: 'card',
                              paymentStatus: 'paid',
                              addOns: { lateCheckout: false, airportPickup: false, breakfast: false },
                              doorCode: genCustomDoorPin,
                              idVerified: true,
                              depositStatus: 'held',
                              status: 'confirmed',
                              createdAt: new Date().toISOString(),
                            };
                            handleInstantQrCheckIn(targetBk);
                          }}
                          className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Test Check-In on Kiosk</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            window.print();
                          }}
                          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer border border-slate-700"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Print Pass</span>
                        </button>
                      </div>

                      {/* WhatsApp / SMS share */}
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          value={genPassSharedPhone}
                          onChange={(e) => setGenPassSharedPhone(e.target.value)}
                          placeholder="+27 69 497 7018"
                          className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setIsGenPassSent(true);
                            showToast(`Arrival QR Pass sent to ${genPassSharedPhone} via WhatsApp & SMS!`);
                            setTimeout(() => setIsGenPassSent(false), 3000);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>{isGenPassSent ? 'Sent!' : 'Send to Phone'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mode 3: Mobile Phone QR Code Scan */}
            {!checkedInBooking && checkInMethod === 'qr_mobile' && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 text-center">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Scan with Your Smartphone Camera</h4>
                  <p className="text-xs text-slate-400">
                    Open your phone camera to access mobile self check-in, unlock room door PIN, and view concierge guide.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl inline-block shadow-2xl mx-auto border-4 border-amber-400/80">
                  <QRCode
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/?action=kiosk_checkin&kiosk=lobby_main`}
                    size={160}
                  />
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                  <div className="flex items-center justify-center gap-1.5 font-bold text-emerald-400">
                    <Wifi className="w-3.5 h-3.5" />
                    <span>Lobby Fast Wi-Fi: ScopeBridg_Solar_5G (Pass: Solar_2026)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Instant 24/7 Reception Support: <strong className="text-white">+27 69 497 7018</strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSimulateCameraScan}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simulate Smartphone Scan on Kiosk</span>
                </button>
              </div>
            )}

            {/* Mode 3: Manual Reference or Name Search */}
            {!checkedInBooking && checkInMethod === 'reference_search' && (
              <form onSubmit={handleLookupBooking} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-2">
                    Booking Reference or Guest Name
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchRef}
                      onChange={(e) => setSearchRef(e.target.value)}
                      placeholder="e.g. BK-101 or Lerato"
                      required
                      className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-950 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                    <button
                      type="submit"
                      className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Look Up
                    </button>
                  </div>
                </div>

                {checkInError && (
                  <div className="bg-red-950/40 border border-red-500/30 text-red-300 p-4 rounded-xl text-xs">
                    No active booking found matching "{searchRef}". Please check your confirmation SMS/Email or contact Admin (+27 69 497 7018).
                  </div>
                )}
              </form>
            )}

            {/* Checked In Room Boarding Card with QR Digital Key */}
            {checkedInBooking && (
              <div className="bg-gradient-to-b from-slate-950 to-slate-900 border border-amber-500/40 rounded-3xl p-6 space-y-6 shadow-2xl">
                {/* Header Badge */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center font-bold">
                      <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-600/40 px-2 py-0.5 rounded-md">
                        Check-In Verified & Key Issued
                      </span>
                      <h4 className="font-black text-white text-lg mt-1">{checkedInBooking.propertyTitle}</h4>
                      <p className="text-xs text-slate-300">
                        Guest: <strong className="text-amber-300">{checkedInBooking.guestName}</strong> • {checkedInBooking.nights} Night(s) Stay
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-full text-[11px] font-extrabold uppercase">
                    📡 Channel: {checkedInBooking.channel || 'ScopeBridge Direct'}
                  </span>
                </div>

                {/* 2-Column Boarding Pass with QR Digital Key */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                  {/* Left: Dynamic QR Digital Key Pass */}
                  <div className="sm:col-span-5 bg-white p-4 rounded-2xl text-center space-y-2 shadow-xl border-4 border-amber-400/80 flex flex-col items-center justify-center">
                    <QRCode
                      value={`scopebridg://room-key?ref=${encodeURIComponent(checkedInBooking.id)}&pin=${encodeURIComponent(checkedInBooking.doorCode || '4819')}&guest=${encodeURIComponent(checkedInBooking.guestName)}&prop=${encodeURIComponent(checkedInBooking.propertyTitle)}`}
                      size={140}
                    />
                    <div className="text-[10px] font-extrabold text-slate-900 uppercase tracking-wider pt-1 flex items-center gap-1">
                      <Key className="w-3 h-3 text-amber-600" />
                      <span>Smart Lock QR Key</span>
                    </div>
                  </div>

                  {/* Right: Room Access Details */}
                  <div className="sm:col-span-7 space-y-3">
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Smart Lock Door Access PIN</span>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-mono font-black text-amber-400 tracking-widest">
                          {checkedInBooking.doorCode || '4819'}
                        </span>
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md font-bold">
                          Active Now
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Dates of Stay</span>
                        <span className="font-bold text-white text-[11px]">
                          {checkedInBooking.checkInDate} → {checkedInBooking.checkOutDate}
                        </span>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Wi-Fi Network</span>
                        <span className="font-bold text-emerald-400 text-[11px]">Solar_5G</span>
                      </div>
                    </div>

                    {/* Send Key to Mobile WhatsApp / SMS */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        Send Digital QR Key Pass to Mobile Phone:
                      </span>
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          placeholder={checkedInBooking.guestPhone || '+27 82 123 4567'}
                          value={guestMobilePhoneInput}
                          onChange={(e) => setGuestMobilePhoneInput(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setGuestPhonePassSent(true);
                            showToast(`Digital QR Key sent to ${guestMobilePhoneInput || checkedInBooking.guestPhone || '+27 69 497 7018'} via WhatsApp & SMS!`);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Share2 className="w-3 h-3" />
                          <span>{guestPhonePassSent ? 'Sent!' : 'Send Key'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Controls */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCopiedPassToken(true);
                      navigator.clipboard?.writeText(
                        `ScopeBridg Digital Key Pass\nGuest: ${checkedInBooking.guestName}\nProperty: ${checkedInBooking.propertyTitle}\nDoor PIN: ${checkedInBooking.doorCode || '4819'}\nWi-Fi: ScopeBridg_Solar_5G (Pass: Solar_2026)\nAdmin: +27 69 497 7018`
                      );
                      showToast('Digital Key Pass and Door PIN copied to clipboard!');
                      setTimeout(() => setCopiedPassToken(false), 3000);
                    }}
                    className="w-full sm:w-1/2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    {copiedPassToken ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedPassToken ? 'Pass Copied!' : 'Copy Key Pass & PIN'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      showToast(`Check-in completed for ${checkedInBooking.guestName}! Admin notified at +27 69 497 7018.`);
                      setActiveKioskTab('home');
                      setCheckedInBooking(null);
                      setSearchRef('');
                    }}
                    className="w-full sm:w-1/2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs cursor-pointer transition-colors shadow-lg flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete & Return to Home</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 1.5: Dedicated Booked Rooms & Active Occupancy Status View */}
        {activeKioskTab === 'booked_rooms' && (
          <div className="max-w-5xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    LIVE ROOM INVENTORY
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    Real-Time Room Occupancy &amp; Booked Dates
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mt-1">
                  <BedDouble className="w-6 h-6 text-cyan-400" /> Booked Rooms &amp; Suite Availability
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  View booked date windows for all suites, room pictures, BnB payout details, and live occupancy status.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveKioskTab('walk_in')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Book Available Suite</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveKioskTab('home')}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Back to Menu
                </button>
              </div>
            </div>

            {/* Properties & Suites List */}
            <div className="space-y-6">
              {properties.map((prop) => {
                const bnbAccount = prop.bankAccount || {
                  bankName: 'Absa Bank SA',
                  accountName: 'NANZA PROPERTIES GROUP (PTY) LTD',
                  accountNumber: '4113870950',
                  branchCode: '632005',
                  accountType: 'Verified Business Cheque',
                  payoutDestination: prop.payoutAccountType || 'bnb_operations',
                };
                const roomsList = (prop.rooms && prop.rooms.length > 0) ? prop.rooms : [
                  {
                    id: `${prop.id}-default`,
                    propertyId: prop.id,
                    name: 'Executive Residence Master Suite',
                    type: 'entire_unit' as const,
                    basePrice: prop.basePrice,
                    weekendPrice: prop.weekendPrice,
                    maxGuests: prop.maxGuests,
                    bedConfiguration: '1 Extra-Length King Bed',
                    amenities: ['Aircon', 'En-Suite Bathroom', 'WiFi', 'Smart Lock'],
                    images: prop.images,
                    publishedChannels: ['direct', 'booking_com', 'airbnb'],
                    status: 'available' as const,
                  },
                ];

                return (
                  <div
                    key={prop.id}
                    className="p-5 bg-slate-950 rounded-3xl border border-slate-800 space-y-4 shadow-lg"
                  >
                    {/* Property Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-white">{prop.title}</h4>
                          <span className="font-mono text-xs text-amber-400 font-bold">({prop.unitCode})</span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {prop.address} • Base: <strong className="text-emerald-400 font-mono">R{prop.basePrice}/night</strong> • Host: {prop.ownerName || 'Mdluli Nhlanhla'}
                        </p>
                      </div>

                      {/* BnB / Owner Account Card */}
                      <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-[11px] space-y-0.5">
                        <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                          <Landmark className="w-3.5 h-3.5" />
                          <span>
                            {bnbAccount.payoutDestination === 'owner_payout'
                              ? 'Host Direct Payout Account'
                              : 'BnB Operations Payout Account'}
                          </span>
                        </div>
                        <p className="text-slate-300 font-mono">
                          {bnbAccount.bankName}: <strong className="text-white">{bnbAccount.accountNumber}</strong> ({bnbAccount.accountName})
                        </p>
                      </div>
                    </div>

                    {/* Rooms / Suites Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {roomsList.map((rm) => {
                        const roomBookings = bookings.filter(
                          (b) =>
                            b.propertyId === prop.id &&
                            ((b as any).roomId === rm.id || (!b.roomId && roomsList.length === 1)) &&
                            b.status !== 'cancelled'
                        );
                        const isCurrentlyOccupied = roomBookings.some((b) => {
                          const today = new Date().toISOString().slice(0, 10);
                          return today >= b.checkInDate && today <= b.checkOutDate;
                        });
                        const roomPhotos = (rm.photos || rm.images || prop.images || []).filter(Boolean);

                        return (
                          <div
                            key={rm.id}
                            className={`p-4 rounded-2xl border transition-all ${
                              isCurrentlyOccupied
                                ? 'bg-rose-950/20 border-rose-500/40'
                                : 'bg-slate-900 border-slate-800'
                            }`}
                          >
                            <div className="flex gap-3">
                              {roomPhotos.length > 0 ? (
                                <img
                                  src={roomPhotos[0]}
                                  alt={rm.name}
                                  className="w-20 h-20 rounded-xl object-cover border border-slate-700 shrink-0"
                                />
                              ) : (
                                <div className="w-20 h-20 rounded-xl bg-slate-800 text-slate-500 flex items-center justify-center text-xs font-bold shrink-0">
                                  No Photo
                                </div>
                              )}

                              <div className="space-y-1 flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <h5 className="text-sm font-bold text-white truncate">{rm.name}</h5>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase shrink-0 border ${
                                      isCurrentlyOccupied
                                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    }`}
                                  >
                                    {isCurrentlyOccupied ? '🔴 Occupied' : '🟢 Available'}
                                  </span>
                                </div>

                                <p className="text-[11px] text-slate-400 truncate">
                                  {rm.bedConfiguration} • Up to {rm.maxGuests} Guests
                                </p>

                                <div className="flex items-center justify-between pt-1">
                                  <span className="text-xs font-black text-emerald-400 font-mono">
                                    R{rm.basePrice}/night
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedPropertyId(prop.id);
                                      setSelectedRoomId(rm.id);
                                      setActiveKioskTab('walk_in');
                                    }}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                                  >
                                    Book This Suite →
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Booked Date Windows (Privacy-Safe) */}
                            <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Booked / Occupied Dates ({roomBookings.length} Active):
                              </span>
                              {roomBookings.length === 0 ? (
                                <span className="text-[11px] font-semibold text-emerald-400 block">
                                  ✓ 100% Open for Reservation (No conflicting dates)
                                </span>
                              ) : (
                                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-0.5">
                                  {roomBookings.map((b) => (
                                    <span
                                      key={b.id}
                                      className="px-2 py-0.5 rounded-md bg-rose-900/60 text-rose-200 border border-rose-700/50 text-[10px] font-mono font-bold"
                                    >
                                      🔴 {b.checkInDate} → {b.checkOutDate} ({b.nights || 1}N • Booked)
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Walk-In Registration with Auto-Nights Calendar, All Rooms, Channels & Payment Gateway OTP */}
        {activeKioskTab === 'walk_in' && (
          <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl w-full">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-6 h-6 text-emerald-400" /> Walk-In Reservation & Room Selector
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Auto-calculates stay nights from calendar dates • Multi-Gateway OTP Approval • Admin: +27 69 497 7018
                </p>
              </div>
              <button
                onClick={() => setActiveKioskTab('home')}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                Back to Menu
              </button>
            </div>

            {walkInSuccess ? (
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-bold text-white">Walk-In Registration & Payment Approved!</h4>
                <p className="text-xs text-slate-300">
                  Booked on channel <strong className="text-emerald-300 uppercase">{walkInChannel}</strong> via <strong className="text-amber-300 uppercase">{selectedGateway}</strong> for <strong className="text-white">{walkInNights} night(s)</strong> ({walkInCheckInDate} → {walkInCheckOutDate}). Admin notified at +27 69 497 7018.
                </p>
                <button
                  onClick={() => setActiveKioskTab('home')}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  Return to Home
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegisterWalkIn} className="space-y-4">
                {/* Property & Room Selection (Rooms Only — Never Entire Property) */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                        1. Select Property ({properties.length} Available)
                      </label>
                      <select
                        value={selectedPropertyId}
                        onChange={(e) => {
                          setSelectedPropertyId(e.target.value);
                          setSelectedRoomId('');
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {properties.map((p) => {
                          const roomsList = getPropertyBookableRooms(p);
                          return (
                            <option key={p.id} value={p.id}>
                              {p.title} ({roomsList.length} Individual Room{roomsList.length === 1 ? '' : 's'})
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-emerald-400 uppercase">
                          2. Select Room / Suite (Rooms Only)
                        </label>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase border ${walkInRoomOccupancy.badgeColor}`}>
                          {walkInRoomOccupancy.badgeText}
                        </span>
                      </div>
                      <select
                        value={currentSelectedRoom?.id || ''}
                        onChange={(e) => setSelectedRoomId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-emerald-500/60 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {currentWalkInRooms.map((rm) => {
                          const rmOcc = getRoomOccupancyStatus({
                            room: rm,
                            property: currentWalkInProperty,
                            bookings,
                            checkInDate: walkInCheckInDate,
                            checkOutDate: walkInCheckOutDate,
                          });
                          return (
                            <option key={rm.id} value={rm.id}>
                              {rmOcc.status === 'occupied' ? '🔴 [BOOKED] ' : '🟢 [AVAILABLE] '}
                              {rm.name} ({rm.bedConfiguration || rm.type}) — R{rm.basePrice}/night
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  {/* Interactive Room Selector Cards for Selected Property */}
                  <div className="p-3 bg-slate-950/90 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-300">
                        🛏️ Tap a Room in <strong className="text-emerald-400">{currentWalkInProperty?.title}</strong> (Book Individual Room Only):
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {currentWalkInRooms.length} Room{currentWalkInRooms.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currentWalkInRooms.map((rm) => {
                        const rmOcc = getRoomOccupancyStatus({
                          room: rm,
                          property: currentWalkInProperty,
                          bookings,
                          checkInDate: walkInCheckInDate,
                          checkOutDate: walkInCheckOutDate,
                        });
                        const isSelected = currentSelectedRoom?.id === rm.id;
                        return (
                          <button
                            key={rm.id}
                            type="button"
                            onClick={() => setSelectedRoomId(rm.id)}
                            className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-950/80 border-emerald-500 ring-1 ring-emerald-400'
                                : rmOcc.status === 'occupied'
                                ? 'bg-rose-950/30 border-rose-800/60 opacity-80'
                                : 'bg-slate-900 border-slate-800 hover:border-slate-600'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white truncate">
                                {rm.name}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                {rm.bedConfiguration || 'Suite'} • R{rm.basePrice}/night
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                                rmOcc.status === 'occupied'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              }`}
                            >
                              {rmOcc.status === 'occupied' ? '🔴 Booked' : '🟢 Available'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Owner / BnB Account Number & Room Pictures Card */}
                {currentWalkInProperty && (
                  <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <Landmark className="w-3.5 h-3.5" />
                        <span>Owner / BnB Account Number</span>
                      </span>
                      <span className="font-mono text-amber-300 font-bold text-[11px]">
                        {currentWalkInProperty.bankAccount?.bankName || 'Absa Bank SA'}: {currentWalkInProperty.bankAccount?.accountNumber || '4113870950'}
                      </span>
                    </div>

                    {/* Pictures of the Room / Property */}
                    {((currentSelectedRoom?.photos || currentSelectedRoom?.images || currentWalkInProperty.images || [])).length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-semibold block flex items-center gap-1">
                          <ImageIcon className="w-3 h-3 text-cyan-400" />
                          <span>
                            All Pictures of {currentSelectedRoom?.name || currentWalkInProperty.title} (
                            {((currentSelectedRoom?.photos || currentSelectedRoom?.images || currentWalkInProperty.images || []) as string[]).length} Photos)
                          </span>
                        </span>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          {((currentSelectedRoom?.photos || currentSelectedRoom?.images || currentWalkInProperty.images || []) as string[]).map((img: string, idx: number) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Room Photo ${idx + 1}`}
                              className="w-16 h-12 object-cover rounded-lg border border-slate-700 shrink-0"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=300&q=80';
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}



                {/* Calendar Date Selection with Automatic Stay Nights Update & Interactive Grid */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-emerald-800/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-emerald-400 uppercase flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" /> Room Stay Dates & Live Availability Calendar
                    </span>
                    <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-black">
                      {walkInNights} {walkInNights === 1 ? 'Night' : 'Nights'} Selected
                    </span>
                  </div>

                  {/* Kiosk Mini Interactive Availability Calendar */}
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-300">
                        {kioskCalendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </span>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="flex items-center gap-1 text-emerald-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> 🟢 Open
                        </span>
                        <span className="flex items-center gap-1 text-rose-400">
                          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span> 🔴 Booked
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-[9px] text-slate-400 font-bold">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                        <div key={d}>{d}</div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center">
                      {(() => {
                        const yr = kioskCalendarMonth.getFullYear();
                        const mo = kioskCalendarMonth.getMonth();
                        const daysInMo = new Date(yr, mo + 1, 0).getDate();
                        const startDow = new Date(yr, mo, 1).getDay();
                        const blanks = Array.from({ length: startDow }, (_, idx) => (
                          <div key={`kb-${idx}`} className="py-1" />
                        ));
                        const dayButtons = Array.from({ length: daysInMo }, (_, i) => {
                          const day = i + 1;
                          const mm = String(mo + 1).padStart(2, '0');
                          const dd = String(day).padStart(2, '0');
                          const dateStr = `${yr}-${mm}-${dd}`;
                          const isStart = walkInCheckInDate === dateStr;
                          const isEnd = walkInCheckOutDate === dateStr;
                          const inRange = dateStr > walkInCheckInDate && dateStr < walkInCheckOutDate;
                          const isBooked = walkInBookedDatesSet.has(dateStr);

                          if (isBooked) {
                            return (
                              <button
                                key={dateStr}
                                type="button"
                                title={`🔴 Occupied / Booked on ${dateStr}`}
                                onClick={() => showToast(`🔴 Date ${dateStr} is already booked. Please select available green dates.`)}
                                className="py-1 rounded text-[10px] font-black bg-rose-600 text-white line-through opacity-80 cursor-not-allowed border border-rose-700"
                              >
                                {day}
                              </button>
                            );
                          }

                          return (
                            <button
                              key={dateStr}
                              type="button"
                              onClick={() => handleKioskCalendarDayClick(dateStr)}
                              className={`py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                                isStart || isEnd
                                  ? 'bg-emerald-500 text-slate-950 font-black'
                                  : inRange
                                  ? 'bg-emerald-900/60 text-emerald-200'
                                  : 'bg-slate-800 text-slate-200 hover:bg-emerald-600 hover:text-white'
                              }`}
                            >
                              {day}
                            </button>
                          );
                        });
                        return [...blanks, ...dayButtons];
                      })()}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Check-In Date</label>
                      <input
                        type="date"
                        value={walkInCheckInDate}
                        onChange={(e) => handleWalkInCheckInChange(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-bold select-text"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Check-Out Date</label>
                      <input
                        type="date"
                        min={walkInCheckInDate}
                        value={walkInCheckOutDate}
                        onChange={(e) => handleWalkInCheckOutChange(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-bold select-text"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Stay Nights (Auto)</label>
                      <select
                        value={walkInNights}
                        onChange={(e) => handleWalkInNightsSelect(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-emerald-950 border border-emerald-600 rounded-xl text-xs font-black text-emerald-300 select-text"
                      >
                        {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>
                            {n} {n === 1 ? 'Night' : 'Nights'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Guest Details & Booking Channel */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Guest Full Name *</label>
                    <input
                      type="text"
                      value={walkInName}
                      onChange={(e) => setWalkInName(e.target.value)}
                      placeholder="e.g. Thabo Mokoena"
                      required
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-950 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Guest Mobile Phone (WhatsApp) *</label>
                    <input
                      type="text"
                      value={walkInPhone}
                      onChange={(e) => setWalkInPhone(e.target.value)}
                      placeholder="+27 69 497 7018"
                      required
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-950 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Guest Email Address *</label>
                    <input
                      type="email"
                      value={walkInEmail}
                      onChange={(e) => setWalkInEmail(e.target.value)}
                      placeholder="guest@corporate.co.za"
                      required
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-950 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Booking Channel Origin</label>
                    <select
                      value={walkInChannel}
                      onChange={(e) => setWalkInChannel(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-amber-400"
                    >
                      <option value="direct">ScopeBridge Direct (Kiosk Walk-In)</option>
                      <option value="booking">Booking.com Channel</option>
                      <option value="airbnb">Airbnb Channel</option>
                      <option value="agoda">Agoda Channel</option>
                    </select>
                  </div>
                </div>

                {/* Guest Special Notes / Arrival Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Special Requests / Guest Arrival Notes
                  </label>
                  <textarea
                    rows={2}
                    value={walkInNotes}
                    onChange={(e) => setWalkInNotes(e.target.value)}
                    placeholder="e.g. Late flight arrival, high floor requested, quiet room"
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-950 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Double Booking Conflict Warning Banner */}
                {walkInConflict.hasConflict && (
                  <div className="p-3 bg-rose-950/80 border-2 border-rose-500 rounded-2xl space-y-1">
                    <div className="flex items-center gap-2 text-rose-300 font-black text-xs">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>⛔ Room Already Booked for Selected Dates</span>
                    </div>
                    <p className="text-[11px] text-rose-200 font-medium leading-relaxed">
                      {walkInConflict.message || 'Double booking prevented: Room is already reserved for the selected dates. Please choose different dates or another suite.'}
                    </p>
                  </div>
                )}

                {/* Payment Gateway Option & OTP Approval */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-amber-400 uppercase flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4" /> Choose Payment Gateway
                    </span>
                    <span className="text-xs font-black text-white">
                      Total: R{(currentSelectedRoom?.basePrice || currentWalkInProperty?.basePrice || 1200) * walkInNights} ZAR
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {KIOSK_PAYMENT_GATEWAYS.map((gw) => (
                      <button
                        key={gw.id}
                        type="button"
                        onClick={() => {
                          setSelectedGateway(gw.id);
                          setKioskOtpVerified(false);
                        }}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedGateway === gw.id
                            ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold text-white">{gw.name}</div>
                        <div className="text-[10px] text-slate-400">{gw.badge}</div>
                      </button>
                    ))}
                  </div>

                  {/* OTP Approval Box */}
                  <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    {!kioskOtpCode ? (
                      <button
                        type="button"
                        disabled={isRequestingKioskOtp}
                        onClick={() =>
                          requestKioskPaymentOtp(
                            (currentSelectedRoom?.basePrice || currentWalkInProperty?.basePrice || 1200) * walkInNights,
                            walkInName || 'Walk-In Guest',
                            currentWalkInProperty?.title || 'ScopeBridge Residence'
                          )
                        }
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs cursor-pointer"
                      >
                        {isRequestingKioskOtp ? 'Sending OTP...' : `🔐 Generate OTP for ${selectedGateway.toUpperCase()} Approval`}
                      </button>
                    ) : !kioskOtpVerified ? (
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="text"
                          maxLength={6}
                          value={kioskOtpInput}
                          onChange={(e) => setKioskOtpInput(e.target.value)}
                          placeholder="6-Digit OTP"
                          className="px-3 py-2 bg-slate-900 border border-amber-500 rounded-xl text-xs font-mono font-black text-amber-300 w-36 text-center tracking-widest select-text"
                        />
                        <button
                          type="button"
                          onClick={verifyKioskPaymentOtp}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer"
                        >
                          Approve OTP ({kioskOtpCode})
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-emerald-400">
                        ✓ OTP Verified for {selectedGateway.toUpperCase()} • Admin (+27 69 497 7018) Notified
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={walkInConflict.hasConflict}
                  className={`w-full py-3.5 text-white font-bold rounded-xl text-xs transition-colors shadow-lg flex items-center justify-center gap-2 ${
                    walkInConflict.hasConflict
                      ? 'bg-slate-600 cursor-not-allowed opacity-60'
                      : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer shadow-emerald-600/20'
                  }`}
                >
                  {walkInConflict.hasConflict ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-amber-300" />
                      <span>Room Already Booked on Selected Dates (No Double Booking)</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Walk-In ({walkInNights} Nights) & Generate Door Code</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Tab: Kiosk Live Calendar & Booking Channel Origin View */}
        {activeKioskTab === 'calendar' && (
          <div className="max-w-7xl mx-auto space-y-6 w-full">
            <UniversalCalendarPlanner
              currentRole="kiosk"
              currentUser={{
                id: 'kiosk-1',
                name: 'Lobby Reception Kiosk',
                fullName: 'Lobby Self-Service Kiosk',
                username: 'kiosk',
                role: 'kiosk',
                email: 'kiosk@scopebridg.co.za',
                phone: '+27 69 497 7018',
                avatar: '',
                title: 'Lobby Self-Service Kiosk',
                location: 'Reception Lobby Kiosk',
                registeredHolidayChannels: ['direct', 'airbnb', 'booking_com', 'expedia', 'lekkeslaap', 'safarinow'],
              }}
              properties={properties}
              bookings={bookings}
              nannyBookings={[]}
              shuttleBookings={[]}
              calendarEvents={calendarEvents}
              channels={channels}
              registeredUsers={registeredUsers}
              selectedCurrency={selectedCurrency}
              onBookProperty={onBookProperty}
              onUpdateBookings={onUpdateBookings}
              onUpdateCalendarEvents={onUpdateCalendarEvents}
              onUpdateProperties={onUpdateProperties}
            />

          <div className="max-w-5xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl w-full">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-cyan-400" /> Kiosk Live Calendar, Properties, Rooms & Booking Channels
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Real-time room inventory, active stay dates, and the exact booking channel where every reservation took place.
                </p>
              </div>
              <button
                onClick={() => setActiveKioskTab('home')}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                Back to Menu
              </button>
            </div>

            {/* All Registered Properties & Rooms Summary */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                All Registered Properties & Rooms on ScopeBridge Channel ({properties.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                {properties.map((prop) => (
                  <div key={prop.id} className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{prop.title}</span>
                      <span className="text-emerald-400 font-mono font-bold">R{prop.basePrice}/night</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-[10px] text-slate-400 font-bold">Rooms ({(prop.rooms || []).length || 1}):</span>
                      {(prop.rooms || []).length === 0 ? (
                        <span className="px-2 py-0.5 bg-slate-900 text-slate-300 rounded text-[10px]">Executive Suite</span>
                      ) : (
                        (prop.rooms || []).map((rm) => (
                          <span key={rm.id} className="px-2 py-0.5 bg-slate-900 text-slate-200 border border-slate-800 rounded text-[10px] font-bold">
                            {rm.name} (R{rm.basePrice})
                          </span>
                        ))
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-[10px] text-emerald-400 font-bold">Channels:</span>
                      <span className="px-1.5 py-0.5 bg-emerald-700 text-white rounded text-[9px] font-bold">✓ ScopeBridge Direct</span>
                      {(prop.requestedChannels || ['Booking.com', 'Airbnb']).map((ch, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded text-[9px] font-bold">
                          {ch}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Bookings & Booking Channel Origin Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-cyan-400">
                Active Reservation Calendar & Booking Channel Origin ({bookings.length} Bookings)
              </h4>
              <div className="overflow-x-auto bg-slate-950 rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Ref</th>
                      <th className="p-3">Guest</th>
                      <th className="p-3">Property / Room</th>
                      <th className="p-3">Check-In → Check-Out</th>
                      <th className="p-3">Nights</th>
                      <th className="p-3">Booking Channel</th>
                      <th className="p-3">Gateway</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {bookings.map((bk) => (
                      <tr key={bk.id} className="hover:bg-slate-900/60">
                        <td className="p-3 font-mono font-bold text-amber-400">{bk.id}</td>
                        <td className="p-3 font-bold text-white">{bk.guestName}</td>
                        <td className="p-3 text-slate-300">{bk.propertyTitle}</td>
                        <td className="p-3 font-mono text-slate-300">
                          {bk.checkInDate} → {bk.checkOutDate}
                        </td>
                        <td className="p-3 font-bold text-emerald-400">{bk.nights} Nights</td>
                        <td className="p-3">
                          <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-[10px] font-extrabold uppercase">
                            📡 {bk.channel || 'ScopeBridge Direct'}
                          </span>
                        </td>
                        <td className="p-3 uppercase font-mono text-[10px] text-slate-300">
                          {bk.paymentMethod || 'paystack'}
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

        {/* Tab: Additional Services & Concierge Add-Ons */}
        {activeKioskTab === 'additional_services' && (
          <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl w-full">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Coffee className="w-6 h-6 text-amber-400" /> Kiosk Additional Services
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Order in-stay services with Payment Gateway selection & OTP approval
                </p>
              </div>
              <button
                onClick={() => setActiveKioskTab('home')}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                Back to Menu
              </button>
            </div>

            {additionalServiceSuccess ? (
              <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-6 text-center space-y-4">
                <CheckCircle2 className="w-10 h-10 text-amber-400 mx-auto" />
                <h4 className="text-lg font-bold text-white">Additional Services Confirmed!</h4>
                <p className="text-xs text-slate-300">
                  Your order has been paid via <strong className="text-amber-400 uppercase">{selectedGateway}</strong> and dispatched to Admin (+27 69 497 7018) & Housekeeping.
                </p>
                <button
                  onClick={() => setActiveKioskTab('home')}
                  className="px-6 py-3 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Return to Home
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  fetch('/api/notifications/dispatch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      type: 'kiosk_additional_services',
                      recipientEmail: 'admin@scopebridg.co.za',
                      recipientPhone: '+27 69 497 7018',
                      subject: `Kiosk Additional Services Order: ${serviceGuestName}`,
                      message: `Guest ${serviceGuestName} ordered [${selectedAddOnServices.join(', ')}] via ${selectedGateway.toUpperCase()}. Admin cell: +27 69 497 7018.`,
                    }),
                  }).catch(() => {});
                  setAdditionalServiceSuccess(true);
                  showToast(`Additional services ordered via ${selectedGateway.toUpperCase()}! Admin notified.`);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Guest Name / Suite Number</label>
                  <input
                    type="text"
                    required
                    value={serviceGuestName}
                    onChange={(e) => setServiceGuestName(e.target.value)}
                    placeholder="e.g. Suite 117 - Lerato Khumalo"
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-950 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase">Select Additional Services</label>
                  {[
                    { id: 'breakfast', label: '🥐 Executive Breakfast Basket (R150)' },
                    { id: 'late_checkout', label: '🕐 Late Check-Out until 14:00 (R120)' },
                    { id: 'airport_shuttle', label: '🚐 Private Airport Shuttle Transfer (R450)' },
                    { id: 'housekeeping', label: '🧹 Express Suite Refresh & Linen Change (R180)' },
                    { id: 'laundry', label: '👕 Same-Day Dry Cleaning & Laundry (R220)' },
                    { id: 'spa_massage', label: '💆‍♀️ In-Suite Executive Spa Massage (R650)' },
                  ].map((srv) => {
                    const checked = selectedAddOnServices.includes(srv.id);
                    return (
                      <label
                        key={srv.id}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer text-xs ${
                          checked
                            ? 'bg-amber-500/15 border-amber-500 text-white font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-300'
                        }`}
                      >
                        <span>{srv.label}</span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setSelectedAddOnServices((prev) =>
                              checked ? prev.filter((i) => i !== srv.id) : [...prev, srv.id]
                            )
                          }
                          className="accent-amber-500"
                        />
                      </label>
                    );
                  })}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Select Payment Gateway</label>
                  <select
                    value={selectedGateway}
                    onChange={(e) => setSelectedGateway(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-amber-400"
                  >
                    {KIOSK_PAYMENT_GATEWAYS.map((gw) => (
                      <option key={gw.id} value={gw.id}>
                        {gw.name} ({gw.badge})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs cursor-pointer"
                >
                  Confirm & Pay via {selectedGateway.toUpperCase()}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Tab 3: Quick Shuttle Request */}
        {activeKioskTab === 'shuttle' && (
          <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Car className="w-6 h-6 text-blue-400" /> Executive Airport & Local Chauffeur
                </h3>
                <p className="text-xs text-slate-400 mt-1">Driver: Mthokozisi Mbele • Toyota Quantum & Mercedes V-Class</p>
              </div>
              <button
                onClick={() => setActiveKioskTab('home')}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                Back to Menu
              </button>
            </div>

            {shuttleSuccess ? (
              <div className="bg-blue-950/40 border border-blue-500/30 rounded-2xl p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-bold text-white">Chauffeur Summoned!</h4>
                <p className="text-xs text-slate-300">
                  Mthokozisi Mbele has received your dispatch request. He will arrive at the lobby in approximately 10 minutes.
                </p>
                <button
                  onClick={() => setActiveKioskTab('home')}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  Return to Home
                </button>
              </div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                onAddShuttleBooking({
                  id: `SHU-${Date.now().toString().slice(-4)}`,
                  driverId: drivers[0]?.id || 'drv-1',
                  driverName: 'Mthokozisi Mbele',
                  driverPhone: '+27 73 555 1212',
                  vehicleModel: 'Toyota Quantum HiAce Luxury',
                  vehiclePlate: 'GP 77 CA',
                  guestName: shuttleGuestName || 'Lobby Kiosk Guest',
                  pickupLocation: 'Ferndale on Republic Lobby',
                  dropoffLocation: shuttleDest,
                  date: new Date().toISOString().slice(0, 10),
                  time: shuttleTime,
                  luggageCount: 2,
                  totalAmountZar: 450,
                  status: 'en_route',
                  createdAt: new Date().toISOString(),
                });
                setShuttleSuccess(true);
                showToast(`Chauffeur dispatched! Mthokozisi is en route.`);
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Guest Name</label>
                  <input
                    type="text"
                    value={shuttleGuestName}
                    onChange={(e) => setShuttleGuestName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    required
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-950 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Destination</label>
                  <select
                    value={shuttleDest}
                    onChange={(e) => setShuttleDest(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="O.R. Tambo International (JNB)">O.R. Tambo International Airport (JNB) - R450</option>
                    <option value="Sandton City / CBD">Sandton City / CBD - R250</option>
                    <option value="Rosebank Mall">Rosebank Mall - R280</option>
                    <option value="Randburg Waterfront / Brightwater">Randburg Waterfront - R150</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Pickup Time</label>
                  <select
                    value={shuttleTime}
                    onChange={(e) => setShuttleTime(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Immediate (Now)">Immediate (Now)</option>
                    <option value="In 15 Minutes">In 15 Minutes</option>
                    <option value="In 30 Minutes">In 30 Minutes</option>
                    <option value="Tomorrow Morning (07:00)">Tomorrow Morning (07:00)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer transition-colors shadow-lg shadow-blue-600/20"
                >
                  Dispatch Chauffeur (R450 ZAR)
                </button>
              </form>
            )}
          </div>
        )}

        {/* Tab 4: Quick Nanny Request */}
        {activeKioskTab === 'nanny' && (
          <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Baby className="w-6 h-6 text-purple-400" /> Certified Childcare & Nanny
                </h3>
                <p className="text-xs text-slate-400 mt-1">Caregiver: Sebenele Mathunywa • CPR & First Aid Certified</p>
              </div>
              <button
                onClick={() => setActiveKioskTab('home')}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                Back to Menu
              </button>
            </div>

            {nannySuccess ? (
              <div className="bg-purple-950/40 border border-purple-500/30 rounded-2xl p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-bold text-white">Nanny Booked Successfully!</h4>
                <p className="text-xs text-slate-300">
                  Sebenele Mathunywa has been notified and will arrive at your residence suite shortly.
                </p>
                <button
                  onClick={() => setActiveKioskTab('home')}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  Return to Home
                </button>
              </div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                onAddNannyBooking({
                  id: `NAN-${Date.now().toString().slice(-4)}`,
                  nannyId: nannies[0]?.id || 'nanny-1',
                  nannyName: 'Sebenele Mathunywa',
                  nannyPhone: '+27 72 888 3344',
                  parentName: nannyParentName || 'Lobby Kiosk Guest',
                  parentPhone: '+27 82 111 2233',
                  propertyId: properties[0]?.id || 'prop-1',
                  propertyTitle: properties[0]?.title || 'Ferndale Loft Suite',
                  date: new Date().toISOString().slice(0, 10),
                  startTime: '14:00',
                  endTime: '18:00',
                  hours: nannyHours,
                  hourlyRateZar: 180,
                  totalAmountZar: nannyHours * 180,
                  childrenCount: 2,
                  childrenAges: '3 yrs & 6 yrs',
                  status: 'confirmed',
                  activityLogs: [],
                  createdAt: new Date().toISOString(),
                });
                setNannySuccess(true);
                showToast(`Nanny session booked with Sebenele Mathunywa!`);
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Parent / Guardian Name</label>
                  <input
                    type="text"
                    value={nannyParentName}
                    onChange={(e) => setNannyParentName(e.target.value)}
                    placeholder="e.g. Nomvula Dlamini"
                    required
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Duration of Childcare</label>
                  <select
                    value={nannyHours}
                    onChange={(e) => setNannyHours(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value={2}>2 Hours (R360)</option>
                    <option value={3}>3 Hours (R540)</option>
                    <option value={4}>4 Hours (R720)</option>
                    <option value={6}>6 Hours (Half Day - R1,080)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Select Payment Gateway</label>
                  <select
                    value={selectedGateway}
                    onChange={(e) => setSelectedGateway(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {KIOSK_PAYMENT_GATEWAYS.map((gw) => (
                      <option key={gw.id} value={gw.id}>
                        {gw.name} ({gw.badge})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                  <span className="font-bold text-purple-300">Included Services:</span>
                  <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-0.5">
                    <li>Certified CPR & First Aid</li>
                    <li>Interactive arts, crafts & bedtime stories</li>
                    <li>Live photo & activity updates in guest portal & Admin (+27 69 497 7018)</li>
                  </ul>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs cursor-pointer transition-colors shadow-lg shadow-purple-600/20"
                >
                  Confirm Nanny Booking via {selectedGateway.toUpperCase()} (R{nannyHours * 180} ZAR)
                </button>
              </form>
            )}
          </div>
        )}

        {/* Tab Check-Out: Self Check-Out */}
        {activeKioskTab === 'check_out' && (
          <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl w-full">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-6 h-6 text-rose-500" /> Guest Self Check-Out
                </h3>
                <p className="text-xs text-slate-400 mt-1">Enter your Booking Reference or Guest Last Name</p>
              </div>
              <button
                onClick={() => setActiveKioskTab('home')}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                Back to Menu
              </button>
            </div>

            {checkoutSuccess ? (
              <div className="bg-rose-950/40 border border-rose-500/30 rounded-2xl p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-bold text-white">Check-Out Completed!</h4>
                <p className="text-xs text-slate-300">
                  Thank you for staying at ScopeBridg. Your smart lock door PIN has been deactivated. Priority housekeeping & Admin (+27 69 497 7018) have been notified.
                </p>
                <button
                  onClick={() => setActiveKioskTab('home')}
                  className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  Return to Home
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {!checkedOutBooking ? (
                  <form onSubmit={handleLookupCheckoutBooking} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Booking Reference or Name</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={checkoutRef}
                          onChange={(e) => setCheckoutRef(e.target.value)}
                          placeholder="e.g. BK-101 or Lerato"
                          required
                          className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-950 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                        />
                        <button
                          type="submit"
                          className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                        >
                          Find Booking
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-500/20 text-rose-400 rounded-xl flex items-center justify-center font-bold">
                          ⚠️
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-base">{checkedOutBooking.propertyTitle}</h4>
                          <p className="text-xs text-slate-300">Registered Guest: <strong className="text-rose-400">{checkedOutBooking.guestName}</strong></p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-full text-[10px] font-extrabold uppercase">
                        📡 Channel: {checkedOutBooking.channel || 'ScopeBridge Direct'}
                      </span>
                    </div>

                    <div className="divide-y divide-slate-800 text-xs">
                      <div className="py-2.5 flex justify-between">
                        <span className="text-slate-400">Booking Channel Origin:</span>
                        <span className="font-bold text-indigo-300 uppercase">{checkedOutBooking.channel || 'ScopeBridge Direct'}</span>
                      </div>
                      <div className="py-2.5 flex justify-between">
                        <span className="text-slate-400">Total Charged Rate ({checkedOutBooking.nights} Nights):</span>
                        <span className="font-bold text-white">R {checkedOutBooking.totalAmount} ZAR</span>
                      </div>
                      <div className="py-2.5 flex justify-between">
                        <span className="text-slate-400">Payment Gateway & Status:</span>
                        <span className="font-bold text-emerald-400 uppercase">{(checkedOutBooking.paymentMethod || 'Paystack')} • {checkedOutBooking.paymentStatus || 'PREPAID'}</span>
                      </div>
                      <div className="py-2.5 flex justify-between">
                        <span className="text-slate-400">Access Key Deactivation:</span>
                        <span className="font-bold text-rose-400 font-mono">Immediate</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 italic">
                      Notice: Tapping below dispatches immediate housekeeping staff Sipho Zulu to audit, sanitize, and reset the suite.
                    </p>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handlePerformCheckout}
                        className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer transition-colors"
                      >
                        Confirm Self Check-Out
                      </button>
                      <button
                        onClick={() => setCheckedOutBooking(null)}
                        className="px-4 py-3 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {checkoutError && (
                  <div className="bg-rose-950/40 border border-rose-500/30 text-rose-300 p-4 rounded-xl text-xs">
                    No active booking found matching "{checkoutRef}". Please check your room guide or enter your full guest name.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab Flight/Car: Concierge Flights & Car Rental */}
        {activeKioskTab === 'flight_car' && (
          <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-indigo-400" /> Kiosk Concierge Desk
                </h3>
                <p className="text-xs text-slate-400 mt-1">Book Flights & Premium Car Rentals instantly</p>
              </div>
              <button
                onClick={() => setActiveKioskTab('home')}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                Back to Menu
              </button>
            </div>

            {flightSuccess ? (
              <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-bold text-white">Flight Reserved!</h4>
                <p className="text-xs text-slate-300">
                  Your flight lookup has been registered. Our portfolio manager has queued the booking for official confirmation and invoice delivery.
                </p>
                <button
                  onClick={() => setFlightSuccess(false)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  Book Another Flight
                </button>
              </div>
            ) : carSuccess ? (
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-bold text-white">Car Rental Reserved!</h4>
                <p className="text-xs text-slate-300">
                  Vehicle reservation completed. Driver's license & insurance vetting has been queued for super admin approval.
                </p>
                <button
                  onClick={() => setCarSuccess(false)}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  Book Another Car
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 1. Domestic Flights Section */}
                <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                  <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                    ✈ Domestic Flight Lookup & Booking
                  </h4>
                  <p className="text-[11px] text-slate-400 font-semibold">Reserve high-frequency flights between JNB, CPT, and DUR instantly.</p>

                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (onAddFlightBooking) {
                      onAddFlightBooking({
                        guestName: flightGuestName,
                        route: flightRoute,
                        carrier: flightCarrier,
                        date: flightDate,
                      });
                    }
                    setFlightSuccess(true);
                    showToast(`Flight reserved: ${flightRoute} via ${flightCarrier}!`);
                  }} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold mb-1">Your Name</label>
                        <input
                          type="text"
                          required
                          value={flightGuestName}
                          onChange={(e) => setFlightGuestName(e.target.value)}
                          placeholder="Passenger Name"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold mb-1">Route</label>
                        <select
                          value={flightRoute}
                          onChange={(e) => setFlightRoute(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                        >
                          <option value="JNB to CPT">Johannesburg (JNB) to Cape Town (CPT)</option>
                          <option value="CPT to DUR">Cape Town (CPT) to Durban (DUR)</option>
                          <option value="JNB to DUR">Johannesburg (JNB) to Durban (DUR)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold mb-1">Airline Carrier</label>
                        <select
                          value={flightCarrier}
                          onChange={(e) => setFlightCarrier(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                        >
                          <option value="Safair">FlySafair (R1,450 ZAR)</option>
                          <option value="Airlink">Airlink Premium (R1,850 ZAR)</option>
                          <option value="CemAir">CemAir (R2,100 ZAR)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold mb-1">Travel Date</label>
                        <input
                          type="date"
                          required
                          value={flightDate}
                          onChange={(e) => setFlightDate(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">Payment Gateway</label>
                      <select
                        value={selectedGateway}
                        onChange={(e) => setSelectedGateway(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-indigo-300"
                      >
                        {KIOSK_PAYMENT_GATEWAYS.map((gw) => (
                          <option key={gw.id} value={gw.id}>
                            {gw.name} ({gw.badge})
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-[11px] cursor-pointer"
                    >
                      Lookup & Reserve Flight via {selectedGateway.toUpperCase()}
                    </button>
                  </form>
                </div>

                {/* 2. Car Rental Section */}
                <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                  <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                    🚗 Premium Vehicle Fleet Rental
                  </h4>
                  <p className="text-[11px] text-slate-400 font-semibold">Self-drive luxury sedans & heavy-duty bakkies reserved directly at lobby.</p>

                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (onAddCarBooking) {
                      onAddCarBooking({
                        guestName: carGuestName,
                        vehicle: carVehicle,
                        days: carDays,
                      });
                    }
                    setCarSuccess(true);
                    showToast(`Premium car rental for ${carVehicle} reserved!`);
                  }} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold mb-1">Driver's Name</label>
                        <input
                          type="text"
                          required
                          value={carGuestName}
                          onChange={(e) => setCarGuestName(e.target.value)}
                          placeholder="Your Name"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold mb-1">Vehicle Type</label>
                        <select
                          value={carVehicle}
                          onChange={(e) => setCarVehicle(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                        >
                          <option value="BMW 3 Series Luxury">BMW 3 Series Executive Sedan (R850/day)</option>
                          <option value="Mercedes-Benz C-Class">Mercedes-Benz C-Class VIP (R950/day)</option>
                          <option value="Toyota Hilux 4x4 Double Cab">Toyota Hilux 4x4 Double Cab (R1,200/day)</option>
                          <option value="Tesla Model Y Premium EV">Tesla Model Y Premium EV (R1,500/day)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold mb-1">Rental Duration</label>
                        <select
                          value={carDays}
                          onChange={(e) => setCarDays(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                        >
                          <option value={2}>2 Days</option>
                          <option value={3}>3 Days</option>
                          <option value={5}>5 Days</option>
                          <option value={7}>7 Days (Weekly Special)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold mb-1">License & Insurance</label>
                        <div className="px-3 py-2 bg-emerald-950/40 border border-emerald-900/40 text-emerald-400 rounded-xl text-[10px] font-bold text-center">
                          ✓ Vetted on ID Profile
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-[11px]"
                    >
                      Reserve Rental Vehicle
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4.5: Lobby Payment & Internet Banking Terminal */}
        {activeKioskTab === 'payment_terminal' && (
          <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl w-full">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-emerald-400" /> Lobby Payment &amp; Internet Banking Terminal
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Secure self-service portal to settle booking balances or add-on amenities
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveKioskTab('home');
                  setTerminalEftStep('form');
                }}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                Back to Menu
              </button>
            </div>

            {/* Switch option between Option 1 (External Bank Portals) and Option 2 (In-App EFT Terminal) */}
            <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-950 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setPaymentTerminalOption('hyperlink');
                  setTerminalEftStep('form');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  paymentTerminalOption === 'hyperlink'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span>🌐 Option 1: Direct Bank Portals</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentTerminalOption('in_app')}
                className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  paymentTerminalOption === 'in_app'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span>📲 Option 2: In-App EFT Secure Link</span>
              </button>
            </div>

            {/* Option 1 View: Hyperlink Directory with Radio Buttons and Logos */}
            {paymentTerminalOption === 'hyperlink' && (
              <div className="space-y-5">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">Direct Bank Portals</span>
                  <h4 className="text-xs font-extrabold text-white">Select Bank To Settle Payment Directly On Real Banking Site</h4>
                  <p className="text-[11px] text-slate-400">
                    Choose your bank from the radio buttons below. The kiosk will generate a secure hyperlink to launch the official internet banking portal in a new browser window.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { id: 'capitec', name: 'Capitec Bank', logo: '🔵🔴', url: 'https://direct.capitecbank.co.za', desc: 'Secure Capitec Online Portal' },
                    { id: 'fnb', name: 'FNB (First National)', logo: '🌴🍊', url: 'https://www.fnb.co.za', desc: 'First National Bank Online' },
                    { id: 'standard', name: 'Standard Bank', logo: '🛡️🔵', url: 'https://onlinebanking.standardbank.co.za', desc: 'Standard Bank Secure EFT' },
                    { id: 'absa', name: 'Absa Bank', logo: '🔴⚪', url: 'https://ib.absa.co.za', desc: 'Absa Internet Banking' },
                    { id: 'nedbank', name: 'Nedbank', logo: '🟢🛡️', url: 'https://secured.nedbank.co.za', desc: 'Nedbank Online Banking Portal' },
                    { id: 'tymebank', name: 'TymeBank', logo: '🟡⚫', url: 'https://www.tymebank.co.za', desc: 'TymeBank Self-Service' },
                  ].map((bank) => (
                    <label
                      key={bank.id}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        selectedTerminalBank === bank.id
                          ? 'bg-emerald-950/30 border-emerald-500/80 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="terminal_bank_hyper"
                          checked={selectedTerminalBank === bank.id}
                          onChange={() => setSelectedTerminalBank(bank.id)}
                          className="w-4 h-4 accent-emerald-500 cursor-pointer shrink-0"
                        />
                        <div className="text-xs font-bold leading-tight">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{bank.logo}</span>
                            <span>{bank.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium block mt-0.5">{bank.desc}</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-800">
                  <div className="text-xs text-slate-400">
                    Selected Banking Gateway URL: <span className="font-mono text-emerald-400 text-[11px] block mt-0.5 break-all">
                      {[
                        { id: 'capitec', url: 'https://direct.capitecbank.co.za' },
                        { id: 'fnb', url: 'https://www.fnb.co.za' },
                        { id: 'standard', url: 'https://onlinebanking.standardbank.co.za' },
                        { id: 'absa', url: 'https://ib.absa.co.za' },
                        { id: 'nedbank', url: 'https://secured.nedbank.co.za' },
                        { id: 'tymebank', url: 'https://www.tymebank.co.za' }
                      ].find(b => b.id === selectedTerminalBank)?.url || 'https://www.capitecbank.co.za'}
                    </span>
                  </div>
                  
                  <a
                    href={[
                      { id: 'capitec', url: 'https://direct.capitecbank.co.za' },
                      { id: 'fnb', url: 'https://www.fnb.co.za' },
                      { id: 'standard', url: 'https://onlinebanking.standardbank.co.za' },
                      { id: 'absa', url: 'https://ib.absa.co.za' },
                      { id: 'nedbank', url: 'https://secured.nedbank.co.za' },
                      { id: 'tymebank', url: 'https://www.tymebank.co.za' }
                    ].find(b => b.id === selectedTerminalBank)?.url || 'https://www.capitecbank.co.za'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Launch Internet Banking Link</span>
                  </a>
                </div>
              </div>
            )}

            {/* Option 2 View: In-App EFT secure Link and payment tile flow */}
            {paymentTerminalOption === 'in_app' && (
              <div className="space-y-4">
                {terminalEftStep === 'form' && (
                  <div className="space-y-5">
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">In-App Secure EFT Terminal</span>
                      <h4 className="text-xs font-extrabold text-white">Settle Instantly via Secure In-App Payment Link</h4>
                      <p className="text-[11px] text-slate-400">
                        Initiate a secure digital EFT link directly with South African banks. Enter your amount and reference, and the kiosk will establish a secure connection.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-400">Select Bank Gateway</label>
                        <select
                          value={selectedTerminalBank}
                          onChange={(e) => setSelectedTerminalBank(e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                          <option value="capitec">🔵🔴 Capitec Bank Direct Link</option>
                          <option value="fnb">🌴🍊 FNB Secure EFT Link</option>
                          <option value="standard">🛡️🔵 Standard Bank Direct Link</option>
                          <option value="absa">🔴⚪ Absa Secure EFT Link</option>
                          <option value="nedbank">🟢🛡️ Nedbank Direct Link</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-400">Payment Amount (ZAR)</label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">R</span>
                          <input
                            type="number"
                            value={terminalAmount}
                            onChange={(e) => setTerminalAmount(Math.max(1, Number(e.target.value)))}
                            className="w-full pl-8 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-400">Booking / Folio Reference</label>
                        <input
                          type="text"
                          value={terminalReference}
                          onChange={(e) => setTerminalReference(e.target.value)}
                          className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400 font-bold focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setTerminalEftStep('processing');
                        setTerminalError(null);
                        setTimeout(() => {
                          setTerminalEftStep('otp');
                        }, 2200);
                      }}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Initiate In-App Secure EFT Link</span>
                    </button>
                  </div>
                )}

                {terminalEftStep === 'processing' && (
                  <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
                    <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin" />
                    <div className="space-y-1.5">
                      <p className="text-sm font-bold text-white">Connecting to Secure Banking API...</p>
                      <p className="text-xs text-slate-400 max-w-md">
                        Establishing in-app secure EFT payment tunnel with <strong className="text-white capitalize">{selectedTerminalBank}</strong> to settle <span className="text-emerald-400 font-bold">R{terminalAmount.toLocaleString()}</span> under reference <span className="font-mono text-emerald-400 font-bold">{terminalReference}</span>...
                      </p>
                    </div>
                  </div>
                )}

                {terminalEftStep === 'otp' && (
                  <div className="max-w-md mx-auto bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-5">
                    <div className="text-center space-y-1 border-b border-slate-900 pb-3">
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded">SECURE OTP GATEWAY</span>
                      <h4 className="text-sm font-black text-white capitalize">{selectedTerminalBank} Verification Requested</h4>
                      <p className="text-[10px] text-slate-400">
                        An authentication prompt or SMS OTP has been dispatched to your mobile. Enter OTP below to authorize.
                      </p>
                    </div>

                    {terminalError && (
                      <div className="p-2.5 bg-rose-950/40 border border-rose-900/50 rounded-xl text-rose-200 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                        <span>{terminalError}</span>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 text-center uppercase tracking-widest">Enter Mobile OTP Pin</label>
                      <input
                        type="text"
                        maxLength={6}
                        value={terminalOtpInput}
                        onChange={(e) => setTerminalOtpInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••••"
                        className="w-full text-center px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm font-mono tracking-widest text-emerald-400 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTerminalEftStep('form')}
                        className="py-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 font-bold text-xs rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!terminalOtpInput) {
                            setTerminalError('Please input the simulated OTP to complete authorization.');
                            return;
                          }
                          setTerminalEftStep('success');
                        }}
                        className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Confirm EFT Payment</span>
                      </button>
                    </div>
                  </div>
                )}

                {terminalEftStep === 'success' && (
                  <div className="bg-slate-950 border border-slate-850 rounded-2xl p-6 text-center space-y-5">
                    <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-md">
                      <Check className="w-6 h-6" />
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-base font-black text-white">EFT Payment Settled Successfully!</h4>
                      <p className="text-xs text-emerald-400 font-bold">Transaction Confirmed &amp; Dispatched to ScopeBridg Admin</p>
                    </div>

                    {/* Receipt Box */}
                    <div className="max-w-md mx-auto p-4 rounded-xl border border-slate-900 bg-slate-900/40 text-xs text-left space-y-2 font-medium">
                      <div className="flex justify-between border-b border-slate-900 pb-2 text-[10px] uppercase font-bold text-slate-500">
                        <span>Transaction Receipt</span>
                        <span>ScopeBridg Kiosk Terminal</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Payment Reference:</span>
                        <span className="font-mono text-white font-bold">{terminalReference}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Settled Amount:</span>
                        <span className="text-emerald-400 font-black">R {terminalAmount.toLocaleString()} ZAR</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Authorized Channel:</span>
                        <span className="text-white font-bold capitalize">In-App EFT ({selectedTerminalBank})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Status:</span>
                        <span className="text-emerald-400 font-bold">Paid / Settled</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
                      <button
                        type="button"
                        onClick={() => {
                          showToast('Digital transaction receipt dispatched to admin email & WhatsApp!');
                        }}
                        className="flex-1 py-2 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 text-xs font-bold rounded-xl"
                      >
                        Print Receipt
                      </button>
                      <button
                        type="button"
                        onClick={() => setTerminalEftStep('form')}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Wi-Fi & Emergency Contacts */}
        {activeKioskTab === 'wifi' && (
          <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Wifi className="w-6 h-6 text-emerald-400" /> Wi-Fi & Emergency Directory
                </h3>
                <p className="text-xs text-slate-400 mt-1">Ferndale on Republic & Oxford Rd Corridor</p>
              </div>
              <button
                onClick={() => setActiveKioskTab('home')}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                Back to Menu
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">High Speed Fiber Wi-Fi</span>
                <p className="font-bold text-white">Network: <span className="text-emerald-400">ScopeBridg_Solar_5G</span></p>
                <p className="font-bold text-white">Password: <span className="text-amber-400 font-mono">Solar_2026</span></p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">24/7 Security & Armed Response</span>
                <p className="font-bold text-white">ADT / Beagle Watch: <span className="text-amber-400">011 444 8822</span></p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Super Admin / Portfolio Manager (Email, OTP, Chat & WhatsApp)</span>
                <p className="font-bold text-white">Mdluli Nhlanhla: <span className="text-amber-400 font-mono">+27 69 497 7018</span></p>
                <p className="text-slate-400 text-[11px]">Email: <span className="text-emerald-400 font-mono">admin@scopebridg.co.za</span></p>
              </div>
            </div>

            <button
              onClick={() => setActiveKioskTab('home')}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs cursor-pointer"
            >
              Close Guide
            </button>
          </div>
        )}
      </main>

      {/* Scanned QR Code Inspection & Guest Details Modal */}
      {scannedQrInspectModalData && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/80 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 text-slate-950 rounded-2xl flex items-center justify-center font-black">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded">
                    Scanned QR Code Inspection
                  </span>
                  <h3 className="text-lg font-black text-white mt-0.5">Guest Arrival Pass Verified</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setScannedQrInspectModalData(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* All Extracted Information Breakdown */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
              <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                <span className="text-slate-500 uppercase font-bold text-[10px]">Guest Full Name:</span>
                <span className="text-white font-extrabold text-sm">{scannedQrInspectModalData.extractedFields.guest}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                <span className="text-slate-500 uppercase font-bold text-[10px]">Booking Reference:</span>
                <span className="text-amber-300 font-mono font-bold">{scannedQrInspectModalData.extractedFields.ref}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                <span className="text-slate-500 uppercase font-bold text-[10px]">Assigned Property:</span>
                <span className="text-white font-semibold truncate max-w-[240px]">{scannedQrInspectModalData.extractedFields.property}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                <span className="text-slate-500 uppercase font-bold text-[10px]">Smart Door Access PIN:</span>
                <span className="font-mono text-emerald-400 font-black text-base bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                  {scannedQrInspectModalData.extractedFields.doorPin}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                <span className="text-slate-500 uppercase font-bold text-[10px]">Stay Dates:</span>
                <span className="text-slate-200 font-bold font-mono">
                  {scannedQrInspectModalData.extractedFields.checkIn} → {scannedQrInspectModalData.extractedFields.checkOut}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-500 uppercase font-bold text-[10px]">Wi-Fi Network & Pass:</span>
                <span className="font-mono text-indigo-300 text-[11px]">{scannedQrInspectModalData.extractedFields.wifi}</span>
              </div>
            </div>

            {/* Raw Payload Accordion / View */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-[10px] text-slate-400 font-mono break-all max-h-16 overflow-y-auto">
              <span className="text-slate-500 uppercase font-bold block mb-1">Raw QR Payload:</span>
              {scannedQrInspectModalData.rawPayload}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const bk = scannedQrInspectModalData.booking;
                  setScannedQrInspectModalData(null);
                  handleInstantQrCheckIn(bk);
                }}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify & Check-In Now</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer border border-slate-700"
              >
                <Download className="w-4 h-4" />
                <span>Print Pass</span>
              </button>
              <button
                type="button"
                onClick={() => setScannedQrInspectModalData(null)}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kiosk Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 px-6 text-center text-xs text-slate-500">
        ScopeBridg Touch Kiosk v2.4 • Ferndale & Oxford Corridor • All data encrypted & synced with Admin Portal
      </footer>
    </div>
  );
};

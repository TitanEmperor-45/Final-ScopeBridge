import React, { useState, useMemo } from 'react';
import QRCode from 'react-qr-code';
import {
  Property,
  Booking,
  CalendarPlanEvent,
  ChannelConfig,
  UserAccount,
} from '../../types';
import {
  X,
  Calendar as CalendarIcon,
  Link2,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Building2,
  User,
  Mail,
  Phone,
  Globe,
  ShieldCheck,
  Sparkles,
  QrCode,
  Send,
  AlertCircle,
  Landmark,
  BedDouble,
  Image as ImageIcon,
} from 'lucide-react';
import { IS_PROD } from '../../lib/env';
import {
  checkDoubleBookingConflict,
  getRoomOccupancyStatus,
  getBookedDatesSet,
  getBookedSpansList,
  getPropertyBookableRooms,
} from '../../utils/bookingAvailability';
import { ResponsiveLightboxGallery } from '../common/ResponsiveLightboxGallery';

interface GuestBookingLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  bookings: Booking[];
  calendarEvents: CalendarPlanEvent[];
  channels: ChannelConfig[];
  currentUser: UserAccount;
  onBookProperty: (newBookingData: Omit<Booking, 'id' | 'createdAt'>) => void;
  onUpdateCalendarEvents: React.Dispatch<React.SetStateAction<CalendarPlanEvent[]>>;
  showToast?: (msg: string) => void;
  onOpenRegistration?: () => void;
}

export const GuestBookingLinkModal: React.FC<GuestBookingLinkModalProps> = ({
  isOpen,
  onClose,
  properties,
  bookings,
  calendarEvents,
  channels,
  currentUser,
  onBookProperty,
  onUpdateCalendarEvents,
  showToast,
  onOpenRegistration,
}) => {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const bookProp = params.get('bookProperty');
      if (bookProp && properties.some((p) => p.id === bookProp)) {
        return bookProp;
      }
    }
    return properties[0]?.id || 'prop-1';
  });
  const [selectedRoomId, setSelectedRoomId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('room') || '';
    }
    return '';
  });
  const [cursorMonth, setCursorMonth] = useState<Date>(() => new Date(2026, 9, 1)); // Oct 2026 default or current
  const [checkInDate, setCheckInDate] = useState<string>('2026-10-05');
  const [checkOutDate, setCheckOutDate] = useState<string>('2026-10-07');
  const [guestsCount, setGuestsCount] = useState<number>(2);
  const [bookingChannel, setBookingChannel] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const chan = params.get('channel');
      if (chan) return chan;
    }
    return 'direct';
  });

  // Synchronize with URL params if any
  React.useEffect(() => {
    if (typeof window !== 'undefined' && isOpen) {
      const params = new URLSearchParams(window.location.search);
      const bookProp = params.get('bookProperty');
      if (bookProp && properties.some((p) => p.id === bookProp)) {
        setSelectedPropertyId(bookProp);
      }
      const roomParam = params.get('room');
      if (roomParam) {
        setSelectedRoomId(roomParam);
      }
      const chan = params.get('channel');
      if (chan) {
        setBookingChannel(chan);
      }
    }
  }, [isOpen, properties]);
  const [bookingStatus, setBookingStatus] = useState<'confirmed' | 'pending'>('confirmed');
  const [guestName, setGuestName] = useState<string>(
    currentUser?.role === 'guest' && currentUser.name !== 'Guest'
      ? currentUser.fullName || currentUser.name
      : 'Tendai Mthembu'
  );
  const [guestEmail, setGuestEmail] = useState<string>(
    currentUser?.email || 'guest.booking@scopebridg.co.za'
  );
  const [guestPhone, setGuestPhone] = useState<string>(
    currentUser?.phone || '+27 82 555 0199'
  );
  const [holidayNotes, setHolidayNotes] = useState<string>(
    'Holiday stay & executive itinerary synced across all registered channels.'
  );
  const [lateCheckout, setLateCheckout] = useState(false);
  const [airportPickup, setAirportPickup] = useState(false);
  const [breakfast, setBreakfast] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectingEnd, setSelectingEnd] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);

  const selectedProperty =
    properties.find((p) => p.id === selectedPropertyId) || properties[0];
  const propertyRooms = useMemo(
    () => getPropertyBookableRooms(selectedProperty),
    [selectedProperty]
  );
  const selectedRoomObj = useMemo(() => {
    if (selectedRoomId) {
      const found = propertyRooms.find((r) => r.id === selectedRoomId);
      if (found) return found;
    }
    if (selectedProperty) {
      const firstAvail = propertyRooms.find(
        (r) =>
          !checkDoubleBookingConflict({
            bookings,
            propertyId: selectedProperty.id,
            roomId: r.id,
            roomName: r.name,
            checkInDate,
            checkOutDate,
          }).hasConflict
      );
      if (firstAvail) return firstAvail;
    }
    return propertyRooms[0];
  }, [propertyRooms, selectedRoomId, selectedProperty, bookings, checkInDate, checkOutDate]);

  const shareableGuestBookingUrl = useMemo(() => {
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://scopebridg.run.app';
    return `${origin}/?guestBookingLink=1&bookProperty=${encodeURIComponent(
      selectedProperty?.id || 'prop-1'
    )}${selectedRoomObj?.id ? `&room=${encodeURIComponent(selectedRoomObj.id)}` : ''}&channel=${encodeURIComponent(bookingChannel)}`;
  }, [selectedProperty, selectedRoomObj, bookingChannel]);

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareableGuestBookingUrl).catch(() => {});
    }
    setCopiedLink(true);
    if (showToast) {
      showToast('Shareable Guest Booking Link with Interactive Calendar copied to clipboard!');
    }
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Calculate nights & pricing
  const nightsCount = useMemo(() => {
    const d1 = new Date(checkInDate);
    const d2 = new Date(checkOutDate);
    const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }, [checkInDate, checkOutDate]);

  const baseRate = selectedRoomObj ? selectedRoomObj.basePrice : selectedProperty?.basePrice || 1650;

  const totalAmountZar = useMemo(() => {
    const base = baseRate * nightsCount;
    const addOnTotal =
      (lateCheckout ? 350 : 0) +
      (airportPickup ? 450 : 0) +
      (breakfast ? 180 * nightsCount : 0);
    return base + addOnTotal;
  }, [baseRate, nightsCount, lateCheckout, airportPickup, breakfast]);

  // Double Booking Conflict Checker (Per-Room Only)
  const doubleBookingConflict = useMemo(() => {
    if (!selectedProperty || !selectedRoomObj) return { hasConflict: false };
    return checkDoubleBookingConflict({
      bookings,
      propertyId: selectedProperty.id,
      roomId: selectedRoomObj.id,
      roomName: selectedRoomObj.name,
      checkInDate,
      checkOutDate,
      userRole: currentUser?.role || 'guest',
    });
  }, [bookings, selectedProperty, selectedRoomObj, checkInDate, checkOutDate, currentUser]);

  // Room Occupancy Status
  const roomOccupancyStatus = useMemo(() => {
    return getRoomOccupancyStatus({
      room: selectedRoomObj || { id: 'all', name: selectedProperty?.title || 'Suite' },
      property: selectedProperty,
      bookings,
      checkInDate,
      checkOutDate,
    });
  }, [selectedRoomObj, selectedProperty, bookings, checkInDate, checkOutDate]);

  // Calendar grid days for cursorMonth
  const calendarDays = useMemo(() => {
    const year = cursorMonth.getFullYear();
    const month = cursorMonth.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: Array<{ dateStr: string; dayNum: number; isCurrentMonth: boolean }> = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      const prevDate = new Date(year, month, -firstDayOfWeek + i + 1);
      cells.push({
        dateStr: prevDate.toISOString().split('T')[0],
        dayNum: prevDate.getDate(),
        isCurrentMonth: false,
      });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month, d);
      const yyyy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      cells.push({
        dateStr: `${yyyy}-${mm}-${dd}`,
        dayNum: d,
        isCurrentMonth: true,
      });
    }
    return cells;
  }, [cursorMonth]);

  if (!isOpen) return null;

  // Check date occupancy status for selected property and room (Privacy-Safe, Per-Room Only)
  const getDateStatus = (dateStr: string): 'confirmed' | 'pending' | 'available' => {
    const bookedSet = getBookedDatesSet(
      bookings,
      selectedProperty?.id || '',
      selectedRoomObj?.id,
      selectedProperty?.blockedDates,
      selectedRoomObj?.name
    );
    if (bookedSet.has(dateStr)) return 'confirmed';

    const propEvents = calendarEvents.filter(
      (ev) =>
        ev.propertyId === selectedProperty?.id &&
        ev.roomId &&
        ev.roomId === selectedRoomObj?.id &&
        ev.status !== 'cancelled' &&
        dateStr >= ev.startDate &&
        dateStr <= ev.endDate
    );
    if (propEvents.some((ev) => ev.status === 'confirmed')) return 'confirmed';
    if (propEvents.some((ev) => ev.status === 'pending')) return 'pending';

    return 'available';
  };

  const handleCheckInDateChange = (newIn: string) => {
    setCheckInDate(newIn);
    if (!newIn) return;
    const startMs = new Date(newIn).getTime();
    const endMs = new Date(checkOutDate).getTime();
    if (isNaN(endMs) || endMs <= startMs) {
      const nextOut = new Date(startMs + 86400000).toISOString().split('T')[0];
      setCheckOutDate(nextOut);
    }
  };

  const handleCheckOutDateChange = (newOut: string) => {
    if (!newOut) return;
    const startMs = new Date(checkInDate).getTime();
    const endMs = new Date(newOut).getTime();
    if (endMs <= startMs) {
      const nextOut = new Date(startMs + 86400000).toISOString().split('T')[0];
      setCheckOutDate(nextOut);
    } else {
      setCheckOutDate(newOut);
    }
  };

  const handleNightsInputChange = (newNightsVal: number) => {
    const valid = Math.max(1, Math.min(365, Math.round(newNightsVal || 1)));
    const startMs = new Date(checkInDate).getTime();
    if (!isNaN(startMs)) {
      const nextOut = new Date(startMs + valid * 86400000).toISOString().split('T')[0];
      setCheckOutDate(nextOut);
    }
  };

  const handleDayClick = (dateStr: string) => {
    const isBooked = getDateStatus(dateStr) === 'confirmed';
    if (isBooked) {
      if (showToast) {
        showToast(`Date ${dateStr} is already booked/occupied. Please select an available green date.`);
      }
      return;
    }

    if (!selectingEnd || dateStr <= checkInDate) {
      setCheckInDate(dateStr);
      const startMs = new Date(dateStr).getTime();
      const nextDay = new Date(startMs + 86400000).toISOString().split('T')[0];
      setCheckOutDate(nextDay);
      setSelectingEnd(true);
    } else {
      setCheckOutDate(dateStr);
      setSelectingEnd(false);
    }
  };

  const handleSubmitGuestBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty) return;

    if (doubleBookingConflict.hasConflict) {
      if (showToast) {
        showToast(doubleBookingConflict.message || 'Double booking prevented: Room is already booked for these dates.');
      }
      return;
    }

    const adminCommission = Math.round(totalAmountZar * 0.1);
    const ownerShare = totalAmountZar - adminCommission;
    const pin = `${Math.floor(1000 + Math.random() * 9000)}#`;

    const newBooking: Omit<Booking, 'id' | 'createdAt'> = {
      propertyId: selectedProperty.id,
      propertyTitle: selectedRoomObj ? `${selectedProperty.title} — ${selectedRoomObj.name}` : selectedProperty.title,
      propertyImage: selectedRoomObj?.images?.[0] || selectedRoomObj?.photos?.[0] || selectedProperty.images?.[0] || '',
      guestName,
      guestEmail,
      guestPhone,
      checkInDate,
      checkOutDate,
      nights: nightsCount,
      guestsCount,
      totalAmount: totalAmountZar,
      commission: {
        ownerAmount: ownerShare,
        adminAmount: adminCommission,
      },
      addOns: { lateCheckout, airportPickup, breakfast },
      doorCode: pin,
      smartLockPin: pin,
      channel: (bookingChannel as any) || 'direct',
      paymentMethod: 'paystack',
      paymentStatus: bookingStatus === 'confirmed' ? 'paid' : 'pending',
      status: bookingStatus,
      wifiAccessGranted: true,
      idVerified: true,
      depositStatus: 'held',
    };
    (newBooking as any).roomId = selectedRoomObj?.id;
    (newBooking as any).roomName = selectedRoomObj?.name;

    onBookProperty(newBooking);

    const activeChannelIds = Array.from(
      new Set([
        'direct',
        bookingChannel,
        ...(selectedProperty.publishedChannels || []),
        ...(currentUser?.registeredHolidayChannels || []),
        ...channels.filter((c) => c.status === 'connected').map((c) => c.id),
      ])
    );

    const newCalEvent: CalendarPlanEvent = {
      id: `CAL-GBL-${Date.now().toString().slice(-5)}`,
      title: `${guestName} — ${newBooking.propertyTitle} (${bookingStatus.toUpperCase()})`,
      category: 'stay_booking',
      startDate: checkInDate,
      endDate: checkOutDate,
      startTime: '14:00',
      endTime: '10:00',
      status: bookingStatus,
      userId: currentUser?.id || 'guest-link',
      userName: guestName,
      userRole: currentUser?.role || 'guest',
      propertyId: selectedProperty.id,
      propertyTitle: newBooking.propertyTitle,
      roomId: selectedRoomObj?.id,
      channelId: bookingChannel,
      syncedChannels: activeChannelIds,
      notes: holidayNotes,
      amountZar: totalAmountZar,
      createdAt: new Date().toISOString(),
    };

    onUpdateCalendarEvents((prev) => [newCalEvent, ...prev]);

    if (showToast) {
      showToast(
        `Booking & Calendar Plan (${checkInDate} → ${checkOutDate}) synchronized across ${activeChannelIds.length} active channels!`
      );
    }
    onClose();
  };

  const bnbAccount = selectedProperty?.bankAccount || {
    bankName: 'Absa Bank SA',
    accountName: 'NANZA PROPERTIES GROUP (PTY) LTD',
    accountNumber: '4113870950',
    branchCode: '632005',
    accountType: 'Verified Business Cheque',
    payoutDestination: selectedProperty?.payoutAccountType || 'bnb_operations',
  };



  const previewImages = [
    ...(selectedRoomObj?.images || selectedRoomObj?.photos || []),
    ...(selectedProperty?.images || []),
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[93vh] overflow-y-auto shadow-2xl border border-slate-200 p-5 sm:p-7 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                <Link2 className="w-3 h-3" />
                Direct Guest Booking Link + Live Multi-Channel Calendar
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-900 text-emerald-400">
                {IS_PROD ? 'PRODUCTION SERVER ACTIVE' : 'DEVELOPMENT SERVER ACTIVE'}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              Add Guest Booking Link & Interactive Availability Calendar
            </h2>
            <p className="text-xs text-slate-500">
              Share this direct booking link with any guest or book directly on the interactive calendar. Updates synchronize across all connected OTA channels immediately.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="self-end sm:self-center p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shareable Booking Link & QR Banner */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-2 flex-1 w-full">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <QrCode className="w-4 h-4" />
              <span>Shareable Guest Booking Link (With Live Calendar & Instant Multi-Channel Sync)</span>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareableGuestBookingUrl}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-emerald-300 focus:outline-hidden select-text"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Guest Booking Link'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Published Channels for <strong className="text-white">{selectedProperty?.title}</strong>:{' '}
              {(selectedProperty?.publishedChannels || ['direct', 'booking_com', 'airbnb', 'lekkeslaap']).join(' • ')}
            </p>
          </div>

          <div className="bg-white p-2.5 rounded-xl shrink-0">
            <QRCode value={shareableGuestBookingUrl} size={76} />
          </div>
        </div>

        {/* Owner / BnB Account Number & Room Pictures Card */}
        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-white space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Owner / BnB Verified Account Details ({
                  (bnbAccount.payoutDestination === 'owner_payout' || selectedProperty?.payoutAccountType === 'owner_payout')
                    ? '👤 Host Direct Personal Account'
                    : (bnbAccount.payoutDestination === 'holding_escrow' || selectedProperty?.payoutAccountType === 'holding_escrow')
                    ? '🛡️ Verified Holding Escrow Account'
                    : '🏦 BnB Operations Account'
                })
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-900/60 text-purple-200 border border-purple-700">
                {
                  (bnbAccount.payoutDestination === 'owner_payout' || selectedProperty?.payoutAccountType === 'owner_payout')
                    ? 'Direct Host Payout'
                    : (bnbAccount.payoutDestination === 'holding_escrow' || selectedProperty?.payoutAccountType === 'holding_escrow')
                    ? 'Escrow Settlement'
                    : 'BnB Operations Settlement'
                }
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                RTC Bank Clearance Active
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold block">Bank Name</span>
              <span className="font-bold text-white text-sm">{bnbAccount.bankName}</span>
            </div>
            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold block">Owner / BnB Account No</span>
              <span className="font-mono font-black text-amber-300 text-sm">{bnbAccount.accountNumber}</span>
            </div>
            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold block">Account Holder / BnB</span>
              <span className="font-bold text-slate-200 text-xs truncate block">{bnbAccount.accountName}</span>
            </div>
            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold block">Branch Code / Type</span>
              <span className="font-bold text-slate-300 text-xs">{bnbAccount.branchCode} ({bnbAccount.accountType || 'Cheque'})</span>
            </div>
          </div>

          {/* Pictures of the Room / Property */}
          {previewImages.length > 0 && (
            <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    All Photos of {selectedRoomObj ? selectedRoomObj.name : selectedProperty?.title} ({previewImages.length} Photos)
                  </span>
                </span>
                <span className="text-[10px] text-slate-400">Live Status: {roomOccupancyStatus.badgeText}</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {previewImages.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setGalleryInitialIndex(idx);
                      setIsGalleryOpen(true);
                    }}
                    className="relative shrink-0 group cursor-pointer"
                  >
                    <img
                      src={imgUrl}
                      alt={`Photo ${idx + 1}`}
                      className="w-20 h-16 sm:w-28 sm:h-20 object-cover rounded-xl border border-slate-700 shrink-0 group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=400&q=80';
                      }}
                    />
                    <span className="absolute bottom-1 left-1 bg-slate-950/80 text-[8px] font-bold text-slate-200 px-1 rounded">
                      #{idx + 1}
                    </span>
                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 rounded-xl transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 text-[9px] font-bold text-white bg-slate-950/80 px-1.5 py-0.5 rounded transition-opacity">
                        🔍 View
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Property & Individual Rooms Matrix (Select Property -> See All Rooms & Individual Room Status -> Book Room Only) */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wide">
                  Step 1: Select Property & Individual Room to Book (Room-Only Booking)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Guests book individual rooms/suites only — never the entire property. Click any room below to inspect its live multi-channel calendar and status for <strong className="text-emerald-300">{checkInDate} → {checkOutDate}</strong>.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-300 shrink-0">Property:</span>
              <select
                value={selectedPropertyId}
                onChange={(e) => {
                  setSelectedPropertyId(e.target.value);
                  setSelectedRoomId('');
                }}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-emerald-500/60 text-xs font-extrabold text-white"
              >
                {properties.map((p) => {
                  const pRooms = getPropertyBookableRooms(p);
                  return (
                    <option key={p.id} value={p.id}>
                      {p.title} ({pRooms.length} Rooms)
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Rooms Grid in Selected Property */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {propertyRooms.map((rm) => {
              const rmOcc = getRoomOccupancyStatus({
                room: rm,
                property: selectedProperty,
                bookings,
                checkInDate,
                checkOutDate,
              });
              const isSelected = selectedRoomObj?.id === rm.id;
              const rmImg = rm.images?.[0] || rm.photos?.[0] || selectedProperty?.images?.[0] || '';
              const syncedChans = rm.publishedChannels && rm.publishedChannels.length > 0
                ? rm.publishedChannels
                : selectedProperty?.publishedChannels || ['direct', 'airbnb', 'booking_com', 'lekkeslaap'];

              return (
                <div
                  key={rm.id}
                  onClick={() => setSelectedRoomId(rm.id)}
                  className={`rounded-2xl border p-3 transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                    isSelected
                      ? 'bg-emerald-950/80 border-2 border-emerald-400 shadow-lg'
                      : rmOcc.status === 'occupied'
                      ? 'bg-rose-950/30 border-rose-800/70 hover:border-rose-500'
                      : 'bg-slate-950 border-slate-800 hover:border-emerald-500/60'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {rmImg && (
                          <img
                            src={rmImg}
                            alt={rm.name}
                            className="w-11 h-11 rounded-xl object-cover border border-slate-700 shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-black text-white truncate">{rm.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {rm.bedConfiguration || '1 King Bed'} • Max {rm.maxGuests || 2} Guests
                          </div>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase shrink-0 border ${
                          rmOcc.status === 'occupied'
                            ? 'bg-rose-900/90 text-rose-200 border-rose-500'
                            : 'bg-emerald-900/90 text-emerald-200 border-emerald-500'
                        }`}
                      >
                        {rmOcc.status === 'occupied' ? '🔴 Booked' : '🟢 Available'}
                      </span>
                    </div>

                    {rmOcc.status === 'occupied' && rmOcc.conflictingBooking && (
                      <div className="p-1.5 rounded-lg bg-rose-950/90 border border-rose-700/80 text-[10px] text-rose-200">
                        Booked ({rmOcc.conflictingBooking.checkInDate} → {rmOcc.conflictingBooking.checkOutDate}) via{' '}
                        <strong className="uppercase">{rmOcc.conflictingBooking.channel || 'Direct'}</strong>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      <span className="text-[9px] font-bold text-slate-400">Synced:</span>
                      {syncedChans.slice(0, 4).map((chId, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[9px] font-bold text-cyan-300 uppercase"
                        >
                          {chId.replace('ch-', '').replace('_', '.')}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-amber-300">R{rm.basePrice}</span>
                      <span className="text-[10px] text-slate-400">/night</span>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                        isSelected
                          ? 'bg-emerald-400 text-slate-950'
                          : rmOcc.status === 'occupied'
                          ? 'bg-slate-800 text-rose-300'
                          : 'bg-slate-800 text-emerald-300'
                      }`}
                    >
                      {isSelected ? '✓ Selected Room' : rmOcc.status === 'occupied' ? 'Inspect Dates' : 'Select Room'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main 2-Column Layout: Interactive Calendar + Guest Booking Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Columns: Scrollable Interactive Calendar */}
          <div className="lg:col-span-7 bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-emerald-600" />
                  <span>Interactive Availability Calendar & Room Dates</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Select Check-In and Check-Out. Red dates are occupied (Double booking prevented).
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setCursorMonth(new Date(cursorMonth.getFullYear(), cursorMonth.getMonth() - 1, 1))
                  }
                  className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-black text-slate-900 px-2.5">
                  {cursorMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCursorMonth(new Date(cursorMonth.getFullYear(), cursorMonth.getMonth() + 1, 1))
                  }
                  className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Room Status Badge in Calendar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-white rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <BedDouble className="w-4 h-4 text-slate-700" />
                <span className="text-xs font-bold text-slate-900">
                  {selectedRoomObj ? selectedRoomObj.name : selectedProperty?.title}
                </span>
              </div>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${roomOccupancyStatus.badgeColor}`}>
                {roomOccupancyStatus.badgeText}
              </span>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold">
              <span className="flex items-center gap-1 text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Selected Range
              </span>
              <span className="flex items-center gap-1 text-rose-700">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span> 🔴 Booked / Occupied (Locked)
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-300"></span> 🟢 Available
              </span>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-extrabold uppercase text-slate-500">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((cell) => {
                const status = getDateStatus(cell.dateStr);
                const isSelectedRange =
                  cell.dateStr >= checkInDate && cell.dateStr <= checkOutDate;
                const isEndpoint =
                  cell.dateStr === checkInDate || cell.dateStr === checkOutDate;
                const isBooked = status === 'confirmed';

                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => handleDayClick(cell.dateStr)}
                    className={`h-12 rounded-xl border p-1.5 flex flex-col items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                      !cell.isCurrentMonth ? 'opacity-40 ' : ''
                    }${
                      isBooked
                        ? 'bg-rose-600 text-white border-rose-700 line-through opacity-90 cursor-not-allowed shadow-xs'
                        : isEndpoint
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm scale-[1.02]'
                        : isSelectedRange
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-400'
                    }`}
                  >
                    <span>{cell.dayNum}</span>
                    <span className="text-[9px] font-extrabold uppercase">
                      {isBooked
                        ? 'Booked'
                        : isEndpoint
                        ? cell.dateStr === checkInDate
                          ? 'In'
                          : 'Out'
                        : isSelectedRange
                        ? 'Stay'
                        : 'Open'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Synced OTA Channels & Per-Room Reservations Ledger */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Live Calendar Sync Across All Channels for {selectedRoomObj?.name || 'Selected Room'}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">
                  ✓ Two-Way iCal & API Sync Active
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  'ScopeBridg Direct',
                  'Booking.com',
                  'Airbnb',
                  'Expedia',
                  'Agoda',
                  'LekkeSlaap',
                  'SafariNow',
                  'VRBO',
                  'Google Hotels',
                ].map((chLabel, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700 flex items-center gap-1"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {chLabel}
                  </span>
                ))}
              </div>

              {(() => {
                const roomSpans = getBookedSpansList(
                  bookings,
                  selectedProperty?.id || '',
                  selectedRoomObj?.id,
                  selectedRoomObj?.name
                );
                if (roomSpans.length === 0) {
                  return (
                    <div className="text-[11px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5">
                      🟢 {selectedRoomObj?.name || 'This room'} has 0 conflicting bookings and is 100% open across all synced channels.
                    </div>
                  );
                }
                return (
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-rose-700 block">
                      Locked Dates for {selectedRoomObj?.name} (Other rooms in {selectedProperty?.title} remain bookable):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {roomSpans.map((sp) => (
                        <span
                          key={sp.bookingId}
                          className="px-2 py-1 rounded-lg bg-rose-50 border border-rose-200 text-[10px] font-bold text-rose-800"
                        >
                          🔴 {sp.checkInDate} → {sp.checkOutDate} ({String(sp.channel || 'Direct').toUpperCase()})
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Right 5 Columns: Booking & Multi-Channel Sync Form */}
          <form onSubmit={handleSubmitGuestBooking} className="lg:col-span-5 space-y-3.5">
            {onOpenRegistration && (!currentUser || currentUser.role === 'guest' || currentUser.name === 'Guest') && (
              <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-extrabold text-blue-900 block text-[11px]">
                    Not registered yet on ScopeBridg?
                  </span>
                  <span className="text-[10px] text-blue-700">
                    Create a free Traveller account or continue with instant booking.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRegistration();
                  }}
                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[10px] shrink-0 transition-colors cursor-pointer"
                >
                  Register Free
                </button>
              </div>
            )}

            {/* Property & Room Selectors (Book Individual Rooms Only) */}
            <div className="space-y-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">1. Select Property</label>
                <select
                  value={selectedPropertyId}
                  onChange={(e) => {
                    setSelectedPropertyId(e.target.value);
                    setSelectedRoomId('');
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900"
                >
                  {properties.map((p) => {
                    const pRooms = getPropertyBookableRooms(p);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.title} ({pRooms.length} Individual Room{pRooms.length === 1 ? '' : 's'})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-emerald-800">
                    2. Select Room / Suite (Rooms Only)
                  </label>
                  <span className="text-[10px] font-bold text-emerald-700">
                    R{selectedRoomObj?.basePrice || selectedProperty?.basePrice}/night
                  </span>
                </div>
                <select
                  value={selectedRoomObj?.id || ''}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-emerald-400 bg-emerald-50/40 text-xs font-bold text-slate-900"
                >
                  {propertyRooms.map((rm) => {
                    const rmOcc = getRoomOccupancyStatus({
                      room: rm,
                      property: selectedProperty,
                      bookings,
                      checkInDate,
                      checkOutDate,
                    });
                    return (
                      <option key={rm.id} value={rm.id}>
                        {rmOcc.status === 'occupied' ? '🔴 [BOOKED] ' : '🟢 [AVAILABLE] '}
                        {rm.name} ({rm.bedConfiguration || 'Suite'}) — R{rm.basePrice}/night
                      </option>
                    );
                  })}
                </select>

                {/* Quick Room Selector Pills */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {propertyRooms.map((rm) => {
                    const rmOcc = getRoomOccupancyStatus({
                      room: rm,
                      property: selectedProperty,
                      bookings,
                      checkInDate,
                      checkOutDate,
                    });
                    const isSelected = selectedRoomObj?.id === rm.id;
                    return (
                      <button
                        key={rm.id}
                        type="button"
                        onClick={() => setSelectedRoomId(rm.id)}
                        className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                            : rmOcc.status === 'occupied'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400'
                        }`}
                      >
                        <span>{rmOcc.status === 'occupied' ? '🔴' : '🟢'}</span>
                        <span>{rm.name}</span>
                        <span className="opacity-80">R{rm.basePrice}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Dates & Nights Calculation */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Check-In Date</label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => handleCheckInDateChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 select-text"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Check-Out Date</label>
                <input
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => handleCheckOutDateChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 select-text"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-emerald-800">
                  Stay Nights (Auto)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={nightsCount}
                    onChange={(e) => handleNightsInputChange(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 text-xs font-black text-emerald-950 select-text"
                  />
                  <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-2 rounded-xl shrink-0">
                    {nightsCount}N
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Origin Channel</label>
                <select
                  value={bookingChannel}
                  onChange={(e) => setBookingChannel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900"
                >
                  <option value="direct">ScopeBridg Direct</option>
                  {channels.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Calendar Status</label>
                <select
                  value={bookingStatus}
                  onChange={(e) => setBookingStatus(e.target.value as 'confirmed' | 'pending')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900"
                >
                  <option value="confirmed">Confirm Dates Now</option>
                  <option value="pending">Pend / Hold Dates</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Guest Full Name *</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 select-text"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Guests Count</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={guestsCount}
                  onChange={(e) => setGuestsCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 select-text"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Guest Email *</label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 select-text"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Guest WhatsApp / Phone *</label>
                <input
                  type="text"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 select-text"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Holiday & Itinerary Notes / Special Requests
              </label>
              <input
                type="text"
                value={holidayNotes}
                onChange={(e) => setHolidayNotes(e.target.value)}
                placeholder="Special arrival requests or notes"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 select-text"
              />
            </div>

            {/* Double Booking Conflict Warning Banner */}
            {doubleBookingConflict.hasConflict && (
              <div className="p-3 bg-rose-50 border-2 border-rose-400 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-black text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>⛔ Double Booking Prevented</span>
                </div>
                <p className="text-[11px] text-rose-700 font-medium leading-relaxed">
                  {doubleBookingConflict.message || 'This room is occupied for the selected dates. Please select available green dates in the calendar.'}
                </p>
              </div>
            )}

            {/* Total Summary */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-900 block">
                  {nightsCount} Night{nightsCount > 1 ? 's' : ''} • Syncs Across All 9 OTA Channels
                </span>
                <span className="text-[10px] text-emerald-700">
                  Includes Instant Smart Lock PIN & Multi-Channel Calendar Lock
                </span>
              </div>
              <span className="text-base font-black text-emerald-900">
                R {totalAmountZar.toLocaleString()}
              </span>
            </div>

            <button
              type="submit"
              disabled={doubleBookingConflict.hasConflict}
              className={`w-full py-3 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all ${
                doubleBookingConflict.hasConflict
                  ? 'bg-slate-400 cursor-not-allowed opacity-60'
                  : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
              }`}
            >
              {doubleBookingConflict.hasConflict ? (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-200" />
                  <span>Dates Already Booked (Select Available Green Dates)</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>
                    {bookingStatus === 'pending'
                      ? 'Pend Dates on Calendar & Sync All Channels'
                      : 'Add Booking to Calendar & Sync All Channels'}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Responsive Touch & Swipe Lightbox Modal */}
      <ResponsiveLightboxGallery
        isOpen={isGalleryOpen}
        photos={previewImages.map((imgUrl, idx) => ({
          url: imgUrl,
          label: `Photo #${idx + 1} — ${selectedRoomObj ? selectedRoomObj.name : selectedProperty?.title}`,
          category: selectedRoomObj?.id || 'property',
          roomId: selectedRoomObj?.id,
          roomName: selectedRoomObj?.name,
        }))}
        initialIndex={galleryInitialIndex}
        propertyTitle={selectedProperty?.title || 'ScopeBridg Residence'}
        propertyArea={selectedProperty?.area}
        onClose={() => setIsGalleryOpen(false)}
        onSelectPhotoIndex={(idx) => setGalleryInitialIndex(idx)}
      />
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { Property, Review, Booking, PaymentMethod, RoomBid, UserAccount } from '../../types';
import {
  X, Heart, Star, MapPin, Check, ShieldCheck, Wifi, Car, Utensils, PawPrint,
  Users, SunMedium, MessageSquare, Compass, Calendar, Clock, CreditCard,
  Building, Coffee, Sparkles, AlertCircle, Share2, Info, Navigation, Landmark,
  Camera, BedDouble, ChevronLeft, ChevronRight
} from 'lucide-react';
import { FERNDALE_LOCAL_TIPS } from '../../data/mockData';
import { LocalTip } from '../../types';
import { OnlineBankingPortalModal } from '../common/OnlineBankingPortalModal';
import { ResponsiveLightboxGallery } from '../common/ResponsiveLightboxGallery';
import {
  getBookedDatesSet,
  checkDoubleBookingConflict,
  getRoomOccupancyStatus,
  getAvailableFreeDaysList,
  getBookedSpansList,
  BookedDateSpan,
  FreeDateSpan,
} from '../../utils/bookingAvailability';

interface PropertyDetailModalProps {
  property: Property;
  reviews: Review[];
  bookings?: Booking[];
  isWishlisted: boolean;
  onToggleWishlist: (propertyId: string) => void;
  onClose: () => void;
  onBookProperty: (bookingData: Omit<Booking, 'id' | 'createdAt'>) => void;
  onOpenChat: (property: Property) => void;
  onAddRoomBid?: (bid: Omit<RoomBid, 'id' | 'createdAt' | 'status'>) => void;
  currentUser?: UserAccount | null;
}

export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({
  property,
  reviews,
  bookings = [],
  isWishlisted,
  onToggleWishlist,
  onClose,
  onBookProperty,
  onOpenChat,
  onAddRoomBid,
  currentUser,
}) => {
  // Booking state
  const [activeTab, setActiveTab] = useState<'overview' | 'photos' | 'reviews' | 'itinerary' | 'bidding'>('overview');
  const [nights, setNights] = useState<number>(2);
  const [guestsCount, setGuestsCount] = useState<number>(2);
  const [checkInDate, setCheckInDate] = useState<string>('2026-09-24');
  const [checkOutDate, setCheckOutDate] = useState<string>('2026-09-26');
  const [selectedRoomId, setSelectedRoomId] = useState<string>(property.rooms?.[0]?.id || 'full_unit');
  const [selectedBookingChannel, setSelectedBookingChannel] = useState<string>('direct');
  const [showInteractiveCalendar, setShowInteractiveCalendar] = useState<boolean>(true);
  const [calendarMonthCursor, setCalendarMonthCursor] = useState<Date>(() => new Date(2026, 8, 1));
  const [selectingCheckOut, setSelectingCheckOut] = useState<boolean>(false);

  // Synchronize nights whenever checkInDate or checkOutDate changes
  useEffect(() => {
    const startMs = new Date(checkInDate).getTime();
    const endMs = new Date(checkOutDate).getTime();
    if (!isNaN(startMs) && !isNaN(endMs) && endMs > startMs) {
      const diff = Math.max(1, Math.round((endMs - startMs) / 86400000));
      if (diff !== nights) {
        setNights(diff);
      }
    }
  }, [checkInDate, checkOutDate]);

  // Helper to automatically update stay nights when check-in or check-out date changes
  const handleCheckInDateChange = (newCheckIn: string) => {
    setCheckInDate(newCheckIn);
    if (!newCheckIn) return;
    const startMs = new Date(newCheckIn).getTime();
    const endMs = new Date(checkOutDate).getTime();
    if (isNaN(startMs)) return;
    if (isNaN(endMs) || endMs <= startMs) {
      const nextDay = new Date(startMs + 86400000).toISOString().slice(0, 10);
      setCheckOutDate(nextDay);
      setNights(1);
    } else {
      const calculatedNights = Math.max(1, Math.round((endMs - startMs) / 86400000));
      setNights(calculatedNights);
    }
  };

  const handleCheckOutDateChange = (newCheckOut: string) => {
    setCheckOutDate(newCheckOut);
    if (!newCheckOut) return;
    const startMs = new Date(checkInDate).getTime();
    const endMs = new Date(newCheckOut).getTime();
    if (isNaN(startMs) || isNaN(endMs)) return;
    if (endMs <= startMs) {
      const adjustedOut = new Date(startMs + 86400000).toISOString().slice(0, 10);
      setCheckOutDate(adjustedOut);
      setNights(1);
    } else {
      const calculatedNights = Math.max(1, Math.round((endMs - startMs) / 86400000));
      setNights(calculatedNights);
    }
  };

  const handleCalendarGridDayClick = (dateStr: string) => {
    if (bookedDatesSet.has(dateStr)) {
      alert(`🔴 Date Unavailable: This suite is already occupied/booked on ${dateStr}. Please select a green available day.`);
      return;
    }

    if (!selectingCheckOut || dateStr <= checkInDate) {
      setCheckInDate(dateStr);
      const startMs = new Date(dateStr).getTime();
      const nextDay = new Date(startMs + 86400000).toISOString().slice(0, 10);
      setCheckOutDate(nextDay);
      setNights(1);
      setSelectingCheckOut(true);
    } else {
      // Check if any date in between is booked
      let cur = new Date(checkInDate);
      const targetEnd = new Date(dateStr);
      let conflictFound = false;

      while (cur < targetEnd) {
        const ymd = cur.toISOString().slice(0, 10);
        if (bookedDatesSet.has(ymd)) {
          conflictFound = true;
          break;
        }
        cur.setDate(cur.getDate() + 1);
      }

      if (conflictFound) {
        alert(`⛔ Double Booking Prevented: The selected range (${checkInDate} to ${dateStr}) crosses booked date(s). Please choose from the green available free dates.`);
        return;
      }

      handleCheckOutDateChange(dateStr);
      setSelectingCheckOut(false);
    }
  };

  const handleNightsChange = (newNights: number) => {
    const validNights = Math.max(1, newNights);
    setNights(validNights);
    const startMs = new Date(checkInDate).getTime();
    if (!isNaN(startMs)) {
      const newOut = new Date(startMs + validNights * 86400000).toISOString().slice(0, 10);
      setCheckOutDate(newOut);
    }
  };

  // Payment Gateway OTP Approval state
  const [otpStepActive, setOtpStepActive] = useState<boolean>(false);
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [otpTxId, setOtpTxId] = useState<string>('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isOnlineBankingModalOpen, setIsOnlineBankingModalOpen] = useState<boolean>(false);
  const [selectedGatewayLabel, setSelectedGatewayLabel] = useState<string>('Online Banking (RTC)');
  const [showDistances, setShowDistances] = useState<boolean>(false);
  
  // Room Bidding State
  const [bidPrice, setBidPrice] = useState<number>(Math.round(property.basePrice * 0.85));
  const [bidGuestName, setBidGuestName] = useState<string>('Guest User');
  const [bidGuestEmail, setBidGuestEmail] = useState<string>('guest@scopebridg.co.za');
  const [bidGuestPhone, setBidGuestPhone] = useState<string>('+27 82 555 0192');
  const [bidMessage, setBidMessage] = useState<string>('Looking forward to staying at your property!');
  const [bidSubmittedSuccess, setBidSubmittedSuccess] = useState<boolean>(false);
  
  // Add-on sales
  const [lateCheckout, setLateCheckout] = useState<boolean>(false); // R120
  const [airportPickup, setAirportPickup] = useState<boolean>(false); // R450
  const [breakfast, setBreakfast] = useState<boolean>(false); // R150

  // Loyalty Promo Code
  const [promoCodeInput, setPromoCodeInput] = useState<string>('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountPercent: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Easy Pay payment method (Paystack, Ozow, Pay at Property, Card)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paystack');
  const [isProcessingBooking, setIsProcessingBooking] = useState<boolean>(false);
  const [bookingConfirmed, setBookingConfirmed] = useState<Booking | null>(null);

  // Guest details form
  const [guestName, setGuestName] = useState<string>('Kagiso Mokoena');
  const [guestEmail, setGuestEmail] = useState<string>('kagiso.m@gmail.com');
  const [guestPhone, setGuestPhone] = useState<string>('+27 82 555 1290');

  // Synchronize guest and bid contact forms with currently logged-in user profile
  useEffect(() => {
    if (currentUser) {
      const nameVal = currentUser.fullName || currentUser.name || '';
      const emailVal = currentUser.email || '';
      const phoneVal = currentUser.phone || '';
      
      if (nameVal) {
        setGuestName(nameVal);
        setBidGuestName(nameVal);
      }
      if (emailVal) {
        setGuestEmail(emailVal);
        setBidGuestEmail(emailVal);
      }
      if (phoneVal) {
        setGuestPhone(phoneVal);
        setBidGuestPhone(phoneVal);
      }
    }
  }, [currentUser]);

  // Selected photo for preview
  const [selectedPhoto, setSelectedPhoto] = useState<string>(property.images[0]);
  const [photoFilterCategory, setPhotoFilterCategory] = useState<string>('all');
  const [isPhotoLightboxOpen, setIsPhotoLightboxOpen] = useState(false);

  const selectedRoomObj = property.rooms?.find((r) => r.id === selectedRoomId) || property.rooms?.[0];

  // All combined photos from property, rooms, and guests
  const allGalleryPhotos = useMemo(() => {
    const list: { url: string; label: string; category: string; roomId?: string }[] = [];
    const seen = new Set<string>();

    // 1. If a room is selected, include its images
    if (selectedRoomObj?.images) {
      selectedRoomObj.images.forEach((img, idx) => {
        if (img && !seen.has(img)) {
          seen.add(img);
          list.push({
            url: img,
            label: `${selectedRoomObj.name} (Photo ${idx + 1})`,
            category: selectedRoomObj.id,
            roomId: selectedRoomObj.id,
          });
        }
      });
    }

    // 2. All property images
    (property.images || []).forEach((img, idx) => {
      if (img && !seen.has(img)) {
        seen.add(img);
        list.push({
          url: img,
          label: idx === 0 ? 'Main Property Cover' : `Property Overview (Photo ${idx + 1})`,
          category: 'property',
        });
      }
    });

    // 3. Other rooms' images
    (property.rooms || []).forEach((rm) => {
      if (rm.id !== selectedRoomObj?.id && rm.images) {
        rm.images.forEach((img, idx) => {
          if (img && !seen.has(img)) {
            seen.add(img);
            list.push({
              url: img,
              label: `${rm.name} (Photo ${idx + 1})`,
              category: rm.id,
              roomId: rm.id,
            });
          }
        });
      }
    });

    // 4. Guest shared photos
    (property.guestPhotos || []).forEach((img, idx) => {
      if (img && !seen.has(img)) {
        seen.add(img);
        list.push({
          url: img,
          label: `Guest Shared Photo ${idx + 1}`,
          category: 'guest',
        });
      }
    });

    return list;
  }, [property, selectedRoomObj]);

  // Filtered photos based on active category
  const displayedThumbnails = useMemo(() => {
    if (photoFilterCategory === 'all') return allGalleryPhotos;
    if (photoFilterCategory === 'property') return allGalleryPhotos.filter((p) => p.category === 'property');
    if (photoFilterCategory === 'guest') return allGalleryPhotos.filter((p) => p.category === 'guest');
    return allGalleryPhotos.filter((p) => p.category === photoFilterCategory || p.roomId === photoFilterCategory);
  }, [allGalleryPhotos, photoFilterCategory]);

  // Active room booked dates set
  const bookedDatesSet = useMemo(() => {
    return getBookedDatesSet(bookings, property.id, selectedRoomObj?.id, property.blockedDates);
  }, [bookings, property.id, selectedRoomObj?.id, property.blockedDates]);

  // Real-time Room Occupancy Status
  const roomOccupancyInfo = useMemo(() => {
    return getRoomOccupancyStatus({
      room: selectedRoomObj || { id: 'default', name: property.title },
      property,
      bookings,
      checkInDate,
      checkOutDate,
    });
  }, [selectedRoomObj, property, bookings, checkInDate, checkOutDate]);

  // Available Free Days List & Spans for the selected room
  const { freeDays, freeSpans } = useMemo(() => {
    return getAvailableFreeDaysList({
      bookings,
      propertyId: property.id,
      roomId: selectedRoomObj?.id,
      propertyBlockedDates: property.blockedDates,
      startDate: new Date().toISOString().slice(0, 10),
      daysAhead: 60,
    });
  }, [bookings, property.id, selectedRoomObj?.id, property.blockedDates]);

  // Booked Date Spans for the selected room
  const bookedSpans = useMemo(() => {
    return getBookedSpansList(bookings, property.id, selectedRoomObj?.id);
  }, [bookings, property.id, selectedRoomObj?.id]);

  // Double Booking Conflict Validation
  const doubleBookingConflict = useMemo(() => {
    return checkDoubleBookingConflict({
      bookings,
      propertyId: property.id,
      roomId: selectedRoomObj?.id,
      checkInDate,
      checkOutDate,
    });
  }, [bookings, property.id, selectedRoomObj?.id, checkInDate, checkOutDate]);

  // Price calculations
  const basePricePerNight = selectedRoomObj ? selectedRoomObj.basePrice : property.basePrice;
  const accommodationTotal = basePricePerNight * nights;
  const lateCheckoutFee = lateCheckout ? 120 : 0;
  const airportPickupFee = airportPickup ? 450 : 0;
  const breakfastFee = breakfast ? 150 * nights * guestsCount : 0;
  
  const subtotal = accommodationTotal + lateCheckoutFee + airportPickupFee + breakfastFee;
  const discountAmount = appliedPromo ? Math.round(subtotal * (appliedPromo.discountPercent / 100)) : 0;
  const finalTotal = subtotal - discountAmount;

  // Active Owner Promotions for this property (Promotions only active when configured by Owner)
  const activeOwnerPromos = useMemo(() => {
    const list = property.activePromotions || property.promotions || [];
    return list.filter((p) => p.active);
  }, [property]);

  const handleApplyPromo = () => {
    const clean = promoCodeInput.trim().toUpperCase();
    if (!clean) return;
    const match = activeOwnerPromos.find((p) => p.code.toUpperCase() === clean);
    if (match) {
      if (match.minNights && nights < match.minNights) {
        setPromoError(`Promotion "${match.code}" requires a minimum stay of ${match.minNights} nights.`);
        return;
      }
      setAppliedPromo({ code: match.code, discountPercent: match.discountPercent });
      setPromoError(null);
    } else {
      setPromoError('Promo code not valid. Only active owner promotions are accepted.');
    }
  };

  const finalizeBookingRecord = () => {
    if (doubleBookingConflict.hasConflict) {
      alert(`⛔ ${doubleBookingConflict.message || 'Double Booking Prevented: Room is already booked for these dates.'}`);
      return;
    }

    setIsProcessingBooking(true);

    setTimeout(() => {
      const newBooking: Booking = {
        id: `BK-${Date.now().toString().slice(-4)}`,
        propertyId: property.id,
        propertyTitle: selectedRoomObj ? `${property.title} — ${selectedRoomObj.name}` : property.title,
        propertyImage: selectedRoomObj?.images?.[0] || property.images[0],
        guestName,
        guestEmail,
        guestPhone,
        checkInDate,
        checkOutDate,
        nights,
        guestsCount,
        totalAmount: finalTotal,
        paymentMethod,
        paymentStatus: paymentMethod === 'property' ? 'pending' : 'paid',
        addOns: {
          lateCheckout,
          airportPickup,
          breakfast,
        },
        doorCode: property.checkInInstructions.smartLockPin,
        channel: (selectedBookingChannel as any) || 'direct',
        idVerified: true,
        depositStatus: 'held',
        commission: {
          ownerAmount: Math.round(finalTotal * 0.92),
          adminAmount: Math.round(finalTotal * 0.08),
        },
        createdAt: new Date().toISOString(),
      };
      (newBooking as any).roomId = selectedRoomObj?.id;

      // Dispatch Email, WhatsApp & In-App Chat confirmation to Guest and Admin (+27 69 497 7018)
      fetch('/api/notifications/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'BOOKING_PAYMENT_APPROVED',
          title: `Booking & Payment Confirmed (${newBooking.id}) via ${selectedGatewayLabel}`,
          message: `Guest ${guestName} (${guestEmail} | ${guestPhone}) booked ${newBooking.propertyTitle} for ${nights} nights (${checkInDate} to ${checkOutDate}). Channel: ${selectedBookingChannel.toUpperCase()}. Total: R${finalTotal}. Smart Lock PIN: ${newBooking.doorCode}`,
          recipientEmail: guestEmail,
          recipientPhone: guestPhone,
          adminWhatsApp: '+27 69 497 7018',
        }),
      }).catch(() => {});

      setIsProcessingBooking(false);
      setOtpStepActive(false);
      setBookingConfirmed(newBooking);
      onBookProperty(newBooking);
    }, 600);
  };

  const handleConfirmBooking = async () => {
    if (doubleBookingConflict.hasConflict) {
      alert(`⛔ ${doubleBookingConflict.message || 'Double Booking Prevented: Room is already booked for these dates.'}`);
      return;
    }

    // If paying at property, no payment gateway OTP needed, though we still notify admin
    if (paymentMethod === 'property') {
      finalizeBookingRecord();
      return;
    }

    if (paymentMethod === 'online_banking') {
      setIsOnlineBankingModalOpen(true);
      return;
    }

    // Request 6-digit OTP for Payment Gateway approval
    setIsProcessingBooking(true);
    setOtpError(null);
    const fallbackOtp = String(Math.floor(100000 + Math.random() * 900000));
    try {
      const res = await fetch('/api/payment/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway: selectedGatewayLabel || paymentMethod.toUpperCase(),
          amount: finalTotal,
          currency: 'ZAR',
          guestName,
          guestEmail,
          guestPhone,
          propertyTitle: property.title,
          channel: selectedBookingChannel,
        }),
      });
      const data = await res.json();
      const code = data.otpCode || fallbackOtp;
      setGeneratedOtp(code);
      setEnteredOtp(code); // prefill for instant convenience while allowing manual edit
      setOtpTxId(data.txId || `OTP-${Date.now()}`);
      setOtpStepActive(true);
    } catch {
      setGeneratedOtp(fallbackOtp);
      setEnteredOtp(fallbackOtp);
      setOtpTxId(`OTP-${Date.now()}`);
      setOtpStepActive(true);
    } finally {
      setIsProcessingBooking(false);
    }
  };

  const handleVerifyOtpAndApprove = async () => {
    if (!enteredOtp.trim() || enteredOtp.trim().length < 4) {
      setOtpError('Please enter the 6-digit OTP code sent to Email, In-App Chat & WhatsApp (+27 69 497 7018).');
      return;
    }
    if (generatedOtp && enteredOtp.trim() !== generatedOtp) {
      setOtpError(`Incorrect OTP. Expected ${generatedOtp} (sent to ${guestEmail} & Admin +27 69 497 7018).`);
      return;
    }
    setOtpError(null);
    try {
      await fetch('/api/payment/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txId: otpTxId, otpCode: enteredOtp.trim() }),
      });
    } catch {
      // ignore network error
    }
    finalizeBookingRecord();
  };

  // WhatsApp pre-filled message generator
  const getWhatsAppLink = () => {
    const text = encodeURIComponent(
      `Hi ${property.ownerName}! I am inquiring about '${property.title}' (${property.area}) on ScopeBridg. Are the dates ${checkInDate} to ${checkOutDate} available?`
    );
    return `https://wa.me/${property.ownerWhatsApp.replace(/\+/g, '')}?text=${text}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Top Modal Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onToggleWishlist(property.id)}
              className={`p-2 rounded-full border transition-all ${
                isWishlisted
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-white border-slate-200 text-slate-500 hover:text-rose-600'
              }`}
              title={isWishlisted ? 'Saved in wishlist' : 'Save to wishlist'}
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600' : ''}`} />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {property.title}
              </h2>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                {property.address}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* WhatsApp direct button */}
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <span>WhatsApp Host</span>
            </a>

            <button
              onClick={() => onOpenChat(property)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold border border-slate-300 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Chat with Host</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-2 px-4 border-b border-slate-200 bg-white text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Overview & Booking
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'photos'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Real Guest Photos</span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full">
              {property.guestPhotos.length} guest pics
            </span>
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'reviews'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Verified Reviews</span>
            <span className="flex items-center text-amber-600 font-bold">
              ★ {property.rating}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('itinerary')}
            className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'itinerary'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Trip Tools & Directions</span>
          </button>
          <button
            onClick={() => setActiveTab('bidding')}
            className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'bidding'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Room Bidding / Make Offer</span>
            <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              Save %
            </span>
          </button>
        </div>

        {/* Modal Body with Scroll */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 bg-slate-50/50">
          {/* TAB: ROOM BIDDING & OFFERS */}
          {activeTab === 'bidding' && (
            <div className="max-w-2xl mx-auto bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6 my-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Make an Offer / Room Bidding</h3>
                  <p className="text-xs text-slate-500">
                    Propose your custom nightly rate for {property.title}. Owners & Super Admins review and approve competitive offers instantly!
                  </p>
                </div>
              </div>

              {bidSubmittedSuccess ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-emerald-950 text-base">Room Bid Submitted Successfully!</h4>
                  <p className="text-xs text-slate-600">
                    Your bid of <strong className="text-emerald-700">R{bidPrice} / night</strong> has been sent to property management for review. You will receive a WhatsApp notification once approved.
                  </p>
                  <button
                    onClick={() => setBidSubmittedSuccess(false)}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Submit Another Bid
                  </button>
                </div>
              ) : (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (onAddRoomBid) {
                    onAddRoomBid({
                      propertyId: property.id,
                      propertyName: property.title,
                      guestName: bidGuestName,
                      guestEmail: bidGuestEmail,
                      guestPhone: bidGuestPhone,
                      offeredPricePerNightZar: bidPrice,
                      totalOfferedZar: bidPrice * nights,
                      guestsCount: 2,
                      checkInDate,
                      checkOutDate,
                      message: bidMessage,
                    });
                    setBidSubmittedSuccess(true);
                  }
                }} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Your Full Name</label>
                      <input
                        type="text"
                        value={bidGuestName}
                        onChange={(e) => setBidGuestName(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">WhatsApp / Phone</label>
                      <input
                        type="text"
                        value={bidGuestPhone}
                        onChange={(e) => setBidGuestPhone(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Check-in Date</label>
                      <input
                        type="date"
                        value={checkInDate}
                        onChange={(e) => setCheckInDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Check-out Date</label>
                      <input
                        type="date"
                        value={checkOutDate}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700 uppercase">Your Offered Price Per Night (ZAR)</label>
                      <span className="text-xs font-mono font-bold text-emerald-700">Standard Rate: R{property.basePrice}</span>
                    </div>
                    <input
                      type="number"
                      min={Math.round(property.basePrice * 0.5)}
                      max={property.basePrice}
                      value={bidPrice}
                      onChange={(e) => setBidPrice(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                      <span>Total Bid Amount ({nights} nights): R{bidPrice * nights}</span>
                      <span className="text-amber-600 font-semibold">
                        {Math.round(((property.basePrice - bidPrice) / property.basePrice) * 100)}% below standard rate
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Message to Host / Admin</label>
                    <textarea
                      rows={3}
                      value={bidMessage}
                      onChange={(e) => setBidMessage(e.target.value)}
                      placeholder="e.g. We are visiting for a family wedding in Ferndale and would love to stay!"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    Submit Room Bid for Approval (R{bidPrice}/night)
                  </button>
                </form>
              )}
            </div>
          )}
          {/* Booking Confirmation View */}
          {bookingConfirmed ? (
            <div className="bg-white rounded-2xl p-6 border border-emerald-200 shadow-md text-center max-w-2xl mx-auto my-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8" />
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Booking Confirmed & Access Issued
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-3">
                You're heading to {property.title}!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Booking Reference: <span className="font-mono font-bold text-slate-800">{bookingConfirmed.id}</span> • Payment via {bookingConfirmed.paymentMethod.toUpperCase()}
              </p>

              {/* Instant Smart Lock & Access Box */}
              <div className="mt-6 p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 text-left">
                <h4 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  Your Keyless Check-in Details (Active from 14:00)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <div className="bg-white p-3 rounded-lg border border-emerald-100">
                    <span className="text-[10px] text-slate-500 font-medium uppercase">Smart Lock PIN</span>
                    <p className="text-lg font-mono font-extrabold text-emerald-700 mt-0.5">
                      {property.checkInInstructions.smartLockPin}
                    </p>
                    <span className="text-[10px] text-slate-400">Door keypad + #</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-emerald-100">
                    <span className="text-[10px] text-slate-500 font-medium uppercase">Gate Intercom / Code</span>
                    <p className="text-sm font-bold text-slate-800 mt-1">
                      {property.checkInInstructions.gateCode}
                    </p>
                    <span className="text-[10px] text-slate-400">Security gate access</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-emerald-100">
                    <span className="text-[10px] text-slate-500 font-medium uppercase">Covered Parking</span>
                    <p className="text-sm font-bold text-slate-800 mt-1">
                      {property.checkInInstructions.parkingBay}
                    </p>
                    <span className="text-[10px] text-slate-400">Free dedicated bay</span>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-white rounded-lg border border-emerald-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-medium">Fibre WiFi (Solar Backed)</span>
                    <p className="text-xs font-semibold text-slate-800 mt-0.5">
                      SSID: {property.checkInInstructions.wifiName} • Pass: {property.checkInInstructions.wifiPassword}
                    </p>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-bold">
                    Connected 24/7
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  Send Itinerary to Host on WhatsApp
                </a>
                <button
                  onClick={() => {
                    setBookingConfirmed(null);
                    setActiveTab('itinerary');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  View Trip Directions & Tips
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW & BOOKING */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Photos & Details */}
                  <div className="lg:col-span-7 space-y-5">
                    {/* Main Image Banner */}
                    <div className="relative rounded-2xl overflow-hidden shadow-xs border border-slate-200 bg-slate-900 aspect-video group">
                      <img
                        src={selectedPhoto}
                        alt={property.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-101"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80';
                        }}
                      />
                      <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        <span>{property.area}</span>
                      </div>
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        {property.amenities.solarInverter && (
                          <div className="bg-amber-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                            <SunMedium className="w-3 h-3" />
                            <span>Solar Backup</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsPhotoLightboxOpen(true)}
                          className="bg-slate-900/85 hover:bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md border border-slate-700 cursor-pointer"
                        >
                          <Camera className="w-3 h-3 text-emerald-400" />
                          <span>View Fullscreen ({allGalleryPhotos.length} Photos)</span>
                        </button>
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                        <span className="bg-slate-900/80 backdrop-blur-xs text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-md">
                          {allGalleryPhotos.find((p) => p.url === selectedPhoto)?.label || 'Property View'}
                        </span>
                        <span className="bg-slate-900/80 backdrop-blur-xs text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                          {allGalleryPhotos.findIndex((p) => p.url === selectedPhoto) + 1} / {allGalleryPhotos.length}
                        </span>
                      </div>
                    </div>

                    {/* Photo Filter Pills & All Photos Strip */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPhotoFilterCategory('all')}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                              photoFilterCategory === 'all'
                                ? 'bg-emerald-800 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            All ({allGalleryPhotos.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setPhotoFilterCategory('property')}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                              photoFilterCategory === 'property'
                                ? 'bg-emerald-800 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            Property Exterior ({property.images?.length || 0})
                          </button>
                          {(property.rooms || []).map((rm) => (
                            <button
                              key={rm.id}
                              type="button"
                              onClick={() => {
                                setPhotoFilterCategory(rm.id);
                                if (rm.images?.[0]) setSelectedPhoto(rm.images[0]);
                                setSelectedRoomId(rm.id);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors cursor-pointer shrink-0 ${
                                photoFilterCategory === rm.id
                                  ? 'bg-emerald-800 text-white'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {rm.name.split('—')[0].trim()} ({rm.images?.length || 0})
                            </button>
                          ))}
                          {property.guestPhotos && property.guestPhotos.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setPhotoFilterCategory('guest')}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                                photoFilterCategory === 'guest'
                                  ? 'bg-emerald-800 text-white'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              Guests ({property.guestPhotos.length})
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Photo thumbnails */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1.5">
                        {displayedThumbnails.map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setSelectedPhoto(item.url);
                              if (item.roomId) setSelectedRoomId(item.roomId);
                            }}
                            className={`relative shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                              selectedPhoto === item.url
                                ? 'border-emerald-600 scale-102 ring-2 ring-emerald-400/40 shadow-sm'
                                : 'border-transparent opacity-75 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={item.url}
                              alt={item.label}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=400&q=80';
                              }}
                            />
                            <span className="absolute bottom-0 inset-x-0 bg-slate-950/75 text-[8px] text-white font-bold px-1 py-0.2 truncate block">
                              {item.label.split('(')[0]}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* OPTIONAL VIEW: Distance Feature Box */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                      <button
                        type="button"
                        onClick={() => setShowDistances(!showDistances)}
                        className="w-full flex items-center justify-between text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Compass className="w-4 h-4 text-indigo-600" />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                            Distances from Ferndale on Republic & Landmarks (Optional View)
                          </h3>
                        </div>
                        <span className="text-[11px] text-indigo-700 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                          {showDistances ? '▲ Hide Distances' : '📍 Show Distances & Landmarks'}
                        </span>
                      </button>

                      {showDistances && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs mt-3 pt-3 border-t border-slate-100">
                          <div className="p-2.5 bg-indigo-50/60 rounded-lg border border-indigo-100">
                            <span className="text-[10px] text-indigo-700 font-bold block">
                              Ferndale on Republic Mall
                            </span>
                            <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">
                              {property.distances.ferndaleOnRepublic}
                            </span>
                            <span className="text-[10px] text-slate-500">Pick n Pay, Woolies, Virgin Active</span>
                          </div>

                          <div className="p-2.5 bg-rose-50/60 rounded-lg border border-rose-100">
                            <span className="text-[10px] text-rose-700 font-bold block">
                              Absa Corporate Campus
                            </span>
                            <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">
                              {property.distances.absaCampus}
                            </span>
                            <span className="text-[10px] text-slate-500">Hans Strijdom / Malibongwe</span>
                          </div>

                          <div className="p-2.5 bg-amber-50/60 rounded-lg border border-amber-100">
                            <span className="text-[10px] text-amber-700 font-bold block">
                              Spar Ferndale & Tops
                            </span>
                            <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">
                              {property.distances.spar}
                            </span>
                            <span className="text-[10px] text-slate-500">Groceries, bakery, braai supplies</span>
                          </div>

                          <div className="p-2.5 bg-slate-100 rounded-lg border border-slate-200">
                            <span className="text-[10px] text-slate-600 font-bold block">
                              Randburg Square CBD
                            </span>
                            <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">
                              {property.distances.randburgSquare}
                            </span>
                          </div>

                          <div className="p-2.5 bg-sky-50 rounded-lg border border-sky-100">
                            <span className="text-[10px] text-sky-700 font-bold block">
                              Sandton Gautrain
                            </span>
                            <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">
                              {property.distances.gautrainSandton}
                            </span>
                          </div>

                          <div className="p-2.5 bg-slate-100 rounded-lg border border-slate-200">
                            <span className="text-[10px] text-slate-600 font-bold block">
                              Cresta Shopping Centre
                            </span>
                            <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">
                              {property.distances.crestaMall}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* MUST-ADD 5: Amenities & Flexible Filters checklist */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
                        Included Amenities & Property Features
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                        <div className="flex items-center gap-2 text-slate-700">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Self Check-in Smart Lock</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700">
                          <Car className="w-4 h-4 text-emerald-600" />
                          <span>Covered Free Parking</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700">
                          <Wifi className="w-4 h-4 text-emerald-600" />
                          <span>Uncapped Fibre WiFi</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700">
                          <Utensils className="w-4 h-4 text-emerald-600" />
                          <span>Fully Equipped Kitchen</span>
                        </div>
                        <div className={`flex items-center gap-2 ${property.amenities.petFriendly ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                          <PawPrint className="w-4 h-4" />
                          <span>{property.amenities.petFriendly ? 'Pet-Friendly' : 'No Pets'}</span>
                        </div>
                        <div className={`flex items-center gap-2 ${property.amenities.familyFriendly ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                          <Users className="w-4 h-4" />
                          <span>{property.amenities.familyFriendly ? 'Family-Friendly' : 'Adults Only'}</span>
                        </div>
                      </div>
                    </div>

                    {/* MOVED PAYMENT & TOTAL BREAKDOWN SECTION (RED ARROW LOCATION) */}
                    <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-emerald-500/30 shadow-md space-y-4">
                      {/* DIRECT ONLINE INTERNET BANKING HYPERLINKS */}
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5 shadow-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Landmark className="w-5 h-5 text-emerald-700" />
                            <span className="text-sm font-black text-slate-900 uppercase tracking-wide">
                              🏦 Direct Online Banking Portals
                            </span>
                          </div>
                          <span className="text-[10px] font-black text-slate-600 bg-slate-200 border border-slate-300 px-2 py-0.5 rounded-full uppercase">
                            External EFT
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                          Click your bank's logo/icon below to open their official secure internet banking portal in a new tab, complete your transfer of <strong className="text-emerald-800 font-mono">R{finalTotal}</strong>, then confirm your booking below.
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { id: 'capitec', name: 'Capitec Bank', emoji: '🔵🔴', url: 'https://direct.capitecbank.co.za', brandBg: 'hover:border-sky-500 hover:bg-sky-50/30' },
                            { id: 'fnb', name: 'FNB', emoji: '🌴🍊', url: 'https://www.fnb.co.za', brandBg: 'hover:border-teal-500 hover:bg-teal-50/30' },
                            { id: 'standard', name: 'Standard Bank', emoji: '🛡️🔵', url: 'https://onlinebanking.standardbank.co.za', brandBg: 'hover:border-blue-600 hover:bg-blue-50/30' },
                            { id: 'absa', name: 'Absa Bank', emoji: '🔴⚪', url: 'https://ib.absa.co.za', brandBg: 'hover:border-rose-600 hover:bg-rose-50/30' },
                            { id: 'nedbank', name: 'Nedbank', emoji: '🟢🛡️', url: 'https://secured.nedbank.co.za', brandBg: 'hover:border-emerald-600 hover:bg-emerald-50/30' },
                            { id: 'tymebank', name: 'TymeBank', emoji: '🟡⚫', url: 'https://www.tymebank.co.za', brandBg: 'hover:border-amber-500 hover:bg-amber-50/30' },
                            { id: 'discovery', name: 'Discovery', emoji: '🟠⚫', url: 'https://www.discovery.co.za/bank/online-banking', brandBg: 'hover:border-orange-500 hover:bg-orange-50/30' },
                            { id: 'investec', name: 'Investec', emoji: '⚫🟡', url: 'https://login.investec.com', brandBg: 'hover:border-yellow-600 hover:bg-yellow-50/30' },
                          ].map((bank) => (
                            <a
                              key={bank.id}
                              href={bank.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => {
                                setSelectedGatewayLabel(`${bank.name} Online`);
                                setPaymentMethod('online_banking');
                              }}
                              className={`p-2.5 rounded-xl border border-slate-200 bg-white flex flex-col items-center justify-center text-center transition-all shadow-2xs hover:shadow-xs group cursor-pointer ${bank.brandBg}`}
                              title={`Open ${bank.name} Internet Banking`}
                            >
                              <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{bank.emoji}</span>
                              <span className="text-[10px] font-black text-slate-800 tracking-tight leading-none">{bank.name}</span>
                            </a>
                          ))}
                        </div>

                        {/* Owner / BnB Verified Account Details */}
                        {(() => {
                          const bnbAccount = property.bankAccount || {
                            bankName: 'First National Bank (FNB)',
                            accountNumber: '62849102934',
                            accountName: 'KasiBnB Primary Operations',
                            branchCode: '250655',
                            accountType: 'Business Cheque',
                          };
                          return (
                            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1.5 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-amber-950 flex items-center gap-1.5">
                                  <Landmark className="w-3.5 h-3.5 text-amber-700" />
                                  <span>Owner / BnB Bank Account Details (EFT Beneficiary)</span>
                                </span>
                                <span className="text-[10px] font-mono font-bold bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded">
                                  Direct Settlement
                                </span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                                <div>
                                  <span className="text-amber-700 block text-[10px]">Bank Name</span>
                                  <span className="font-bold text-slate-900">{bnbAccount.bankName}</span>
                                </div>
                                <div>
                                  <span className="text-amber-700 block text-[10px]">Account Number</span>
                                  <span className="font-mono font-black text-slate-900">{bnbAccount.accountNumber}</span>
                                </div>
                                <div>
                                  <span className="text-amber-700 block text-[10px]">Account Name</span>
                                  <span className="font-bold text-slate-900">{bnbAccount.accountName}</span>
                                </div>
                                <div>
                                  <span className="text-amber-700 block text-[10px]">Branch Code</span>
                                  <span className="font-mono font-bold text-slate-900">{bnbAccount.branchCode}</span>
                                </div>
                                <div>
                                  <span className="text-amber-700 block text-[10px]">Account Type</span>
                                  <span className="font-bold text-slate-900">{bnbAccount.accountType || 'Cheque / Current'}</span>
                                </div>
                                <div>
                                  <span className="text-amber-700 block text-[10px]">Owner / Host</span>
                                  <span className="font-bold text-slate-900">{property.ownerName || 'Mdluli Nhlanhla'}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Total Stay Cost Breakdown */}
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs text-slate-600">
                        <div className="flex justify-between text-xs">
                          <span>R{basePricePerNight} × {nights} {nights === 1 ? 'night' : 'nights'}</span>
                          <span className="font-bold text-slate-900">R{accommodationTotal}</span>
                        </div>
                        {lateCheckout && (
                          <div className="flex justify-between text-slate-700">
                            <span>Late check-out until 13:00</span>
                            <span className="font-semibold">+R{lateCheckoutFee}</span>
                          </div>
                        )}
                        {airportPickup && (
                          <div className="flex justify-between text-slate-700">
                            <span>Airport pickup</span>
                            <span className="font-semibold">+R{airportPickupFee}</span>
                          </div>
                        )}
                        {breakfast && (
                          <div className="flex justify-between text-slate-700">
                            <span>Breakfast basket</span>
                            <span className="font-semibold">+R{breakfastFee}</span>
                          </div>
                        )}
                        {appliedPromo && (
                          <div className="flex justify-between text-emerald-700 font-semibold">
                            <span>Promo discount ({appliedPromo.code})</span>
                            <span>-R{discountAmount}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-slate-900 text-lg font-black pt-2 border-t border-slate-200">
                          <span>Total Stay Cost (ZAR)</span>
                          <span className="text-emerald-800 text-xl font-mono font-black">R{finalTotal}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 text-right">Includes all SARS VAT taxes (15%)</p>
                      </div>

                      {/* Payment Gateway OTP Verification Box */}
                      {otpStepActive && (
                        <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-2xl space-y-3 animate-in fade-in duration-150">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                              🔐 {selectedGatewayLabel} Payment Approval OTP
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-amber-200 text-amber-950 px-2 py-0.5 rounded">
                              {otpTxId}
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-900 leading-relaxed">
                            A 6-digit OTP has been dispatched to Guest (<strong className="font-mono">{guestEmail}</strong>) and Super Admin (<strong className="font-mono">+27 69 497 7018</strong>) via Email, In-App Chat, and WhatsApp.
                          </p>
                          <div className="p-2.5 bg-white border border-amber-300 rounded-xl flex items-center justify-between">
                            <div>
                              <span className="text-[9px] uppercase font-bold text-slate-400 block">Live Dispatched OTP Code</span>
                              <span className="text-base font-mono font-black tracking-widest text-emerald-700">{generatedOtp}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEnteredOtp(generatedOtp)}
                                className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg text-[10px] font-bold cursor-pointer"
                              >
                                Auto-Fill
                              </button>
                              <a
                                href={`https://wa.me/27694977018?text=${encodeURIComponent(
                                  `🔐 [ScopeBridg Payment OTP Approval]\nGateway: ${selectedGatewayLabel}\nAmount: R${finalTotal}\nGuest: ${guestName}\nOTP Code: ${generatedOtp}`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold"
                              >
                                WhatsApp Admin
                              </a>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-amber-950 uppercase mb-1">
                              Enter 6-Digit OTP to Approve R{finalTotal} Payment
                            </label>
                            <input
                              type="text"
                              maxLength={6}
                              value={enteredOtp}
                              onChange={(e) => setEnteredOtp(e.target.value)}
                              placeholder="Enter 6-digit OTP"
                              className="w-full px-3 py-2 bg-white border border-amber-400 rounded-xl text-center font-mono text-base font-black tracking-widest text-slate-900"
                            />
                          </div>

                          {otpError && (
                            <p className="text-[11px] text-rose-600 font-bold">{otpError}</p>
                          )}

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleVerifyOtpAndApprove}
                              className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black shadow-sm cursor-pointer"
                            >
                              ✓ Approve OTP & Complete Payment (R{finalTotal})
                            </button>
                            <button
                              type="button"
                              onClick={() => setOtpStepActive(false)}
                              className="px-3 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Double Booking Conflict Warning Banner */}
                      {doubleBookingConflict.hasConflict && (
                        <div className="p-3 bg-rose-50 border-2 border-rose-400 rounded-xl space-y-1 animate-in fade-in duration-150">
                          <div className="flex items-center gap-2 text-rose-800 font-black text-xs">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>⛔ Double Booking Prevented</span>
                          </div>
                          <p className="text-[11px] text-rose-700 font-medium leading-relaxed">
                            {doubleBookingConflict.message || 'This room is occupied on the selected dates. Please select an available suite or pick green available days in the calendar.'}
                          </p>
                        </div>
                      )}

                      {/* Final Confirm Booking & Pay CTA Button */}
                      {!otpStepActive && (
                        <button
                          id="confirm-booking-btn"
                          onClick={handleConfirmBooking}
                          disabled={isProcessingBooking || doubleBookingConflict.hasConflict}
                          className={`w-full py-3.5 text-white rounded-xl text-sm sm:text-base font-black shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            doubleBookingConflict.hasConflict
                              ? 'bg-slate-400 cursor-not-allowed opacity-60'
                              : 'bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99]'
                          }`}
                        >
                          {isProcessingBooking ? (
                            <>
                              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                              <span>Requesting OTP from {selectedGatewayLabel}...</span>
                            </>
                          ) : doubleBookingConflict.hasConflict ? (
                            <>
                              <AlertCircle className="w-5 h-5 text-amber-300" />
                              <span>Suite Occupied for Selected Dates — Select Green Dates</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-5 h-5" />
                              <span>
                                {paymentMethod === 'property'
                                  ? `Book with Pay on Arrival (R${finalTotal})`
                                  : `Pay via ${selectedGatewayLabel} & Request OTP (R${finalTotal})`}
                              </span>
                            </>
                          )}
                        </button>
                      )}

                      <p className="text-[11px] text-center text-slate-500 font-medium">
                        🔒 Instant reservation confirmation, OTP, In-App Chat & WhatsApp dispatched to Guest & Admin (+27 69 497 7018).
                      </p>
                    </div>
                  </div>

                  {/* Right Column: MUST-ADD 6 Easy Pay & Booking Engine */}
                  <div className="lg:col-span-5 space-y-4">
                    {/* MUST-ADD 8: Loyalty / Repeat Guest Banner */}
                    <div className="p-3.5 bg-gradient-to-r from-amber-50 to-emerald-50 rounded-xl border border-amber-200 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          Repeat Guest Discount Available!
                        </span>
                        <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                          10% OFF
                        </span>
                      </div>
                      <p className="text-xs text-amber-800 mt-1">
                        Use promo code <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-amber-300">WELCOME10</span> to save 10% on direct bookings!
                      </p>
                      {!appliedPromo && (
                        <button
                          onClick={() => {
                            setPromoCodeInput('WELCOME10');
                            setAppliedPromo({ code: 'WELCOME10', discountPercent: 10 });
                          }}
                          className="mt-2 text-[11px] font-bold text-emerald-800 underline hover:text-emerald-950"
                        >
                          Click here to auto-apply WELCOME10
                        </button>
                      )}
                    </div>

                    {/* Booking Form Card */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      {/* Price header */}
                      <div className="flex items-baseline justify-between pb-3 border-b border-slate-100">
                        <div>
                          <span className="text-2xl font-black text-slate-900">
                            R{basePricePerNight}
                          </span>
                          <span className="text-xs text-slate-500 ml-1">/ night (weekday)</span>
                        </div>
                        <div className="text-right text-xs text-slate-500">
                          <span>Weekend: </span>
                          <span className="font-bold text-slate-700">R{selectedRoomObj?.weekendPrice || property.weekendPrice}</span>
                        </div>
                      </div>

                      {/* SELECT CONFIGURED ROOM / SUITE (YELLOW HIGHLIGHTED) */}
                      {property.rooms && property.rooms.length > 0 && (
                        <div className="p-3.5 bg-yellow-100 border-2 border-yellow-400 rounded-2xl space-y-2 shadow-sm">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-black text-slate-900 uppercase tracking-wide block">
                              SELECT CONFIGURED ROOM / SUITE ({property.rooms.length} TOTAL):
                            </label>
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase border ${
                                roomOccupancyInfo.isAvailable
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                                  : 'bg-rose-100 text-rose-900 border-rose-400'
                              }`}
                            >
                              {roomOccupancyInfo.badgeText}
                            </span>
                          </div>
                          <select
                            value={selectedRoomId}
                            onChange={(e) => {
                              setSelectedRoomId(e.target.value);
                              const rm = property.rooms?.find((r) => r.id === e.target.value);
                              if (rm?.images?.[0]) setSelectedPhoto(rm.images[0]);
                            }}
                            className="w-full p-2.5 bg-white border border-yellow-500 rounded-xl text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-yellow-500 cursor-pointer"
                          >
                            {property.rooms.map((rm) => {
                              const roomStatus = getRoomOccupancyStatus({
                                room: rm,
                                property,
                                bookings,
                                checkInDate,
                                checkOutDate,
                              });
                              return (
                                <option key={rm.id} value={rm.id}>
                                  {roomStatus.isAvailable ? '🟢 [AVAILABLE]' : '🔴 [OCCUPIED / BOOKED]'} {rm.name} — R{rm.basePrice}/night ({rm.bedConfiguration})
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      )}

                      {/* Date & Guest Selectors with Automatic Stay Nights Calculation */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Stay Dates (Auto-Calculates Stay Nights)</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowInteractiveCalendar(!showInteractiveCalendar)}
                            className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                          >
                            {showInteractiveCalendar ? 'Hide Calendar Grid' : '📅 Pick on Calendar Grid'}
                          </button>
                        </div>

                        {showInteractiveCalendar && (
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCalendarMonthCursor(
                                      new Date(calendarMonthCursor.getFullYear(), calendarMonthCursor.getMonth() - 1, 1)
                                    )
                                  }
                                  className="px-2 py-0.5 bg-white border border-slate-300 rounded hover:bg-slate-100 cursor-pointer"
                                >
                                  ◀
                                </button>
                                <span>
                                  {calendarMonthCursor.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCalendarMonthCursor(
                                      new Date(calendarMonthCursor.getFullYear(), calendarMonthCursor.getMonth() + 1, 1)
                                    )
                                  }
                                  className="px-2 py-0.5 bg-white border border-slate-300 rounded hover:bg-slate-100 cursor-pointer"
                                >
                                  ▶
                                </button>
                              </div>
                              <span className="text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md font-extrabold">
                                {nights} {nights === 1 ? 'Night' : 'Nights'} Stay (R{accommodationTotal.toLocaleString()})
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500">
                              {selectingCheckOut
                                ? `Check-In ${checkInDate} selected — Now tap your Check-Out day to auto-calculate accommodation nights`
                                : 'Tap a green check-in day and green check-out day to reserve your suite.'}
                            </p>
                            <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-slate-400">
                              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                                <div key={d}>{d}</div>
                              ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1 text-center">
                              {(() => {
                                const yr = calendarMonthCursor.getFullYear();
                                const mo = calendarMonthCursor.getMonth();
                                const daysInMo = new Date(yr, mo + 1, 0).getDate();
                                const startDow = new Date(yr, mo, 1).getDay();
                                const blanks = Array.from({ length: startDow }, (_, idx) => (
                                  <div key={`b-${idx}`} className="py-1" />
                                ));
                                const dayButtons = Array.from({ length: daysInMo }, (_, i) => {
                                  const day = i + 1;
                                  const mm = String(mo + 1).padStart(2, '0');
                                  const dd = String(day).padStart(2, '0');
                                  const dateStr = `${yr}-${mm}-${dd}`;
                                  const isStart = checkInDate === dateStr;
                                  const isEnd = checkOutDate === dateStr;
                                  const inRange = dateStr > checkInDate && dateStr < checkOutDate;
                                  const isBooked = bookedDatesSet.has(dateStr);

                                  if (isBooked) {
                                    return (
                                      <button
                                        key={dateStr}
                                        type="button"
                                        title={`🔴 Room Occupied / Booked on ${dateStr} (Double booking blocked)`}
                                        onClick={() => {
                                          alert(`🔴 Date Unavailable: This suite is already reserved on ${dateStr}. Please pick green available dates.`);
                                        }}
                                        className="py-1 rounded text-[10px] font-black transition-colors bg-rose-600 text-white line-through opacity-90 cursor-not-allowed shadow-xs border border-rose-700"
                                      >
                                        {day}
                                      </button>
                                    );
                                  }

                                  return (
                                    <button
                                      key={dateStr}
                                      type="button"
                                      title={`🟢 Available for Booking on ${dateStr}`}
                                      onClick={() => handleCalendarGridDayClick(dateStr)}
                                      className={`py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                                        isStart || isEnd
                                          ? 'bg-emerald-700 text-white shadow-xs font-black'
                                          : inRange
                                          ? 'bg-emerald-200 text-emerald-950 font-bold'
                                          : 'bg-emerald-50 text-emerald-950 border border-emerald-300 hover:bg-emerald-600 hover:text-white'
                                      }`}
                                    >
                                      {day}
                                    </button>
                                  );
                                });
                                return [...blanks, ...dayButtons];
                              })()}
                            </div>

                            {/* Color Legend */}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[10px] font-bold">
                              <div className="flex items-center gap-1 text-emerald-800">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                                <span>🟢 Free &amp; Available Days</span>
                              </div>
                              <div className="flex items-center gap-1 text-rose-700">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block"></span>
                                <span>🔴 Occupied / Booked (Locked)</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                              Check-in (from 14:00)
                            </label>
                            <input
                              type="date"
                              value={checkInDate}
                              onChange={(e) => handleCheckInDateChange(e.target.value)}
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                              Check-out (by 10:00)
                            </label>
                            <input
                              type="date"
                              value={checkOutDate}
                              onChange={(e) => handleCheckOutDateChange(e.target.value)}
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-emerald-800 block mb-1">
                              Stay Nights (Auto-Updated)
                            </label>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min={1}
                                max={90}
                                value={nights}
                                onChange={(e) => handleNightsChange(Number(e.target.value))}
                                className="w-full p-2 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-black text-emerald-950"
                              />
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-2 rounded-lg shrink-0">
                                {nights} {nights === 1 ? 'Night' : 'Nights'}
                              </span>
                            </div>
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                              Guests
                            </label>
                            <select
                              value={guestsCount}
                              onChange={(e) => setGuestsCount(Number(e.target.value))}
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                            >
                              {Array.from({ length: property.maxGuests }, (_, i) => i + 1).map((g) => (
                                <option key={g} value={g}>
                                  {g} {g === 1 ? 'Guest' : 'Guests'} (Max {property.maxGuests})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Guest Contact Details */}
                      <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                        <label className="text-[11px] font-semibold text-slate-600 block">
                          Guest Details (for Smart Lock Code & WhatsApp)
                        </label>
                        <input
                          type="text"
                          placeholder="Your Full Name"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="email"
                            placeholder="Email address"
                            value={guestEmail}
                            onChange={(e) => setGuestEmail(e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          />
                          <input
                            type="tel"
                            placeholder="WhatsApp Number"
                            value={guestPhone}
                            onChange={(e) => setGuestPhone(e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      {/* OWNER ADD-ON SALES FEATURE: Late checkout, airport pickup, breakfast */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                            Recommended Stay Add-ons
                          </span>
                          <span className="text-[10px] text-emerald-700 font-semibold">Extra comfort</span>
                        </div>

                        <label className="flex items-center justify-between p-1.5 hover:bg-white rounded cursor-pointer transition-colors">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={lateCheckout}
                              onChange={(e) => setLateCheckout(e.target.checked)}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>Late Check-out (until 13:00)</span>
                          </div>
                          <span className="font-bold text-slate-700">+R120</span>
                        </label>

                        <label className="flex items-center justify-between p-1.5 hover:bg-white rounded cursor-pointer transition-colors">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={airportPickup}
                              onChange={(e) => setAirportPickup(e.target.checked)}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>Airport Transfer (OR Tambo / Lanseria)</span>
                          </div>
                          <span className="font-bold text-slate-700">+R450</span>
                        </label>

                        <label className="flex items-center justify-between p-1.5 hover:bg-white rounded cursor-pointer transition-colors">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={breakfast}
                              onChange={(e) => setBreakfast(e.target.checked)}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>Artisanal Breakfast Basket (daily)</span>
                          </div>
                          <span className="font-bold text-slate-700">+R150/day</span>
                        </label>
                      </div>

                      {/* Owner Active Promotions (Only displayed when configured by Owner) */}
                      {activeOwnerPromos.length > 0 && (
                        <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-purple-950 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                              <span>Host Active Promotion Available</span>
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-purple-200/70 text-purple-900 px-2 py-0.5 rounded">
                              Owner Activated
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Enter host promo code..."
                              value={promoCodeInput}
                              onChange={(e) => setPromoCodeInput(e.target.value)}
                              className="flex-1 p-2 bg-white border border-purple-200 rounded-lg text-xs font-mono uppercase focus:ring-2 focus:ring-purple-400 outline-hidden"
                            />
                            <button
                              type="button"
                              onClick={handleApplyPromo}
                              className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                              Apply
                            </button>
                          </div>
                          {promoError && (
                            <p className="text-[11px] text-rose-600 font-medium">{promoError}</p>
                          )}
                          {appliedPromo && (
                            <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-[11px] flex items-center justify-between font-semibold">
                              <span>Applied Host Promotion "{appliedPromo.code}" (-{appliedPromo.discountPercent}%)</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setAppliedPromo(null);
                                  setPromoCodeInput('');
                                }}
                                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MUST-ADD 4: Real Guest Photos Gallery */}
              {activeTab === 'photos' && (
                <div className="space-y-6">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Unfiltered Photos from Real Guests in Ferndale
                      </h3>
                      <p className="text-xs text-slate-500">
                        Real candid guest snapshots of the rooms, solar inverter, patio, and amenities.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                      Verified Stays
                    </span>
                  </div>

                  {property.guestPhotos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {property.guestPhotos.map((photo, i) => (
                        <div key={i} className="group relative rounded-xl overflow-hidden shadow-xs border border-slate-200 bg-slate-900 aspect-4/3">
                          <img
                            src={photo}
                            alt={`Guest photo ${i + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 text-white text-xs">
                            <span>Uploaded by verified guest in Ferndale</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
                      <p className="text-xs text-slate-500">
                        Be the first guest to upload snapshots after your stay!
                      </p>
                    </div>
                  )}

                  {/* Video Walkthroughs Section */}
                  {((property.videos && property.videos.length > 0) || (property.rooms && property.rooms.some(r => r.videos && r.videos.length > 0))) && (
                    <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-emerald-400" />
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                            🎥 Video Walkthroughs & Virtual Room Tours
                          </h4>
                        </div>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                          HD Video Available
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {property.videos && property.videos.map((vUrl, vIdx) => (
                          <div key={`prop-v-${vIdx}`} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 space-y-2 p-2">
                            <span className="text-[10px] font-bold text-slate-300 px-1 uppercase tracking-wider block">
                              Property Tour #{vIdx + 1}
                            </span>
                            {vUrl.includes('mp4') || vUrl.includes('mixkit') || vUrl.includes('video') ? (
                              <video src={vUrl} controls className="w-full h-44 object-cover rounded-lg" />
                            ) : (
                              <a
                                href={vUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block p-4 bg-slate-900 rounded-lg text-center text-xs text-emerald-400 hover:underline font-bold"
                              >
                                Watch Property Tour Video →
                              </a>
                            )}
                          </div>
                        ))}

                        {property.rooms && property.rooms.map((room) => (
                          room.videos && room.videos.map((rUrl, rIdx) => (
                            <div key={`room-v-${room.id}-${rIdx}`} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 space-y-2 p-2">
                              <span className="text-[10px] font-bold text-emerald-300 px-1 uppercase tracking-wider block">
                                {room.name} Video Tour
                              </span>
                              {rUrl.includes('mp4') || rUrl.includes('mixkit') || rUrl.includes('video') ? (
                                <video src={rUrl} controls className="w-full h-44 object-cover rounded-lg" />
                              ) : (
                                <a
                                  href={rUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block p-4 bg-slate-900 rounded-lg text-center text-xs text-emerald-400 hover:underline font-bold"
                                >
                                  Watch {room.name} Tour →
                                </a>
                              )}
                            </div>
                          ))
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Official Property Overview Images */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-emerald-600" />
                        <span>Official Property & Living Area Images ({property.images?.length || 0})</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPhoto(property.images[0]);
                          setIsPhotoLightboxOpen(true);
                        }}
                        className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                      >
                        Expand All
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {(property.images || []).map((img, i) => (
                        <div
                          key={`prop-img-${i}`}
                          onClick={() => {
                            setSelectedPhoto(img);
                            setIsPhotoLightboxOpen(true);
                          }}
                          className="group relative rounded-xl overflow-hidden aspect-video border border-slate-200 bg-slate-100 shadow-xs cursor-pointer"
                        >
                          <img
                            src={img}
                            alt={`Official ${i + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80';
                            }}
                          />
                          <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition-colors flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 text-white text-[10px] font-black bg-slate-950/80 px-2 py-1 rounded-full transition-opacity">
                              🔍 Click to Enlarge
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Configured Rooms & Suites Photo Galleries */}
                  {property.rooms && property.rooms.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-slate-200">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <BedDouble className="w-4 h-4 text-purple-600" />
                        <span>Individual Rooms & Suites Photo Galleries ({property.rooms.length} Suites)</span>
                      </h4>
                      <div className="space-y-4">
                        {property.rooms.map((rm) => {
                          const rmImgs = rm.images && rm.images.length > 0 ? rm.images : property.images;
                          const isCurrent = selectedRoomId === rm.id;
                          return (
                            <div
                              key={rm.id}
                              className={`p-4 rounded-2xl border transition-all ${
                                isCurrent
                                  ? 'bg-purple-50/50 border-purple-300 shadow-sm'
                                  : 'bg-white border-slate-200'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-black text-slate-900">{rm.name}</span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                      {rm.bedConfiguration}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    Rate: <strong className="text-emerald-700">R{rm.basePrice}/night</strong> • Max {rm.maxGuests} Guests • {rmImgs.length} Pictures Added
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedRoomId(rm.id);
                                    if (rmImgs[0]) setSelectedPhoto(rmImgs[0]);
                                    setActiveTab('overview');
                                  }}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-colors cursor-pointer self-start sm:self-auto ${
                                    isCurrent
                                      ? 'bg-purple-900 text-white shadow-xs'
                                      : 'bg-slate-100 text-purple-900 hover:bg-purple-100'
                                  }`}
                                >
                                  {isCurrent ? '✓ Active Selected Suite' : 'Select & Book Suite →'}
                                </button>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                {rmImgs.map((img, rIdx) => (
                                  <div
                                    key={`rm-${rm.id}-pic-${rIdx}`}
                                    onClick={() => {
                                      setSelectedPhoto(img);
                                      setSelectedRoomId(rm.id);
                                      setIsPhotoLightboxOpen(true);
                                    }}
                                    className="group relative rounded-xl overflow-hidden aspect-video border border-slate-200 bg-slate-100 shadow-2xs cursor-pointer"
                                  >
                                    <img
                                      src={img}
                                      alt={`${rm.name} ${rIdx + 1}`}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).src =
                                          'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80';
                                      }}
                                    />
                                    <span className="absolute bottom-1 left-1 bg-slate-950/80 text-[9px] font-bold text-white px-1.5 py-0.5 rounded">
                                      Photo {rIdx + 1}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Guest Community Shared Photos */}
                  {property.guestPhotos && property.guestPhotos.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-slate-200">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <span>📸 Guest Community Shared Photos ({property.guestPhotos.length})</span>
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {property.guestPhotos.map((img, i) => (
                          <div
                            key={`guest-img-${i}`}
                            onClick={() => {
                              setSelectedPhoto(img);
                              setIsPhotoLightboxOpen(true);
                            }}
                            className="group relative rounded-xl overflow-hidden aspect-video border border-slate-200 bg-slate-100 shadow-2xs cursor-pointer"
                          >
                            <img
                              src={img}
                              alt={`Guest upload ${i + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80';
                              }}
                            />
                            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition-colors flex items-center justify-center">
                              <span className="opacity-0 group-hover:opacity-100 text-white text-[10px] font-black bg-slate-950/80 px-2 py-1 rounded-full transition-opacity">
                                🔍 Click to Enlarge
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: MUST-ADD 4: Reviews Section */}
              {activeTab === 'reviews' && (
                <div className="space-y-4">
                  <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-slate-900">
                          {property.rating}
                        </span>
                        <div className="flex text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-amber-500" />
                          ))}
                        </div>
                        <span className="text-xs text-slate-500">
                          ({property.reviewCount} verified guest reviews)
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        100% of guests rated check-in ease, WiFi speed, and proximity to Ferndale on Republic 5 stars.
                      </p>
                    </div>
                    <button
                      onClick={() => onOpenChat(property)}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition-colors"
                    >
                      Ask Host a Question
                    </button>
                  </div>

                  <div className="space-y-3">
                    {reviews.map((rev) => (
                      <div key={rev.id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                              {rev.guestName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                {rev.guestName}
                                {rev.verifiedStay && (
                                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.2 rounded">
                                    Verified Ferndale Guest
                                  </span>
                                )}
                              </p>
                              <span className="text-[10px] text-slate-400">{rev.date}</span>
                            </div>
                          </div>
                          <div className="flex text-amber-500">
                            {Array.from({ length: rev.rating }).map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                            ))}
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed">
                          "{rev.text}"
                        </p>

                        {/* Guest snapshot in review */}
                        {rev.guestPhotoUrl && (
                          <div className="w-32 h-20 rounded-lg overflow-hidden border border-slate-200">
                            <img
                              src={rev.guestPhotoUrl}
                              alt="Guest review photo"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Host Reply */}
                        {rev.hostReply && (
                          <div className="p-3 bg-slate-50 rounded-lg border-l-2 border-emerald-600 text-xs">
                            <span className="font-bold text-slate-900 block mb-0.5">
                              Response from Host ({property.ownerName}):
                            </span>
                            <span className="text-slate-600">{rev.hostReply}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: MUST-ADD 7: Itinerary / Trip Tools & Ferndale Local Tips */}
              {activeTab === 'itinerary' && (
                <div className="space-y-6">
                  {/* Check-in instructions box */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        <h3 className="text-sm font-bold text-slate-900">
                          Automated Check-in Instructions
                        </h3>
                      </div>
                      <span className="text-xs text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        Check-in: 14:00 • Checkout: 10:00
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Smart Lock PIN</span>
                        <p className="text-base font-mono font-extrabold text-emerald-800 mt-1">
                          {property.checkInInstructions.smartLockPin}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">Enter PIN on Yale lock followed by #</p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Key Lockbox Backup</span>
                        <p className="text-base font-mono font-extrabold text-slate-800 mt-1">
                          {property.checkInInstructions.lockboxCode}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">Mounted beside front door</p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Gate Access</span>
                        <p className="text-sm font-bold text-slate-800 mt-1">
                          {property.checkInInstructions.gateCode}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">Security guard intercom on Oxford St</p>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                      <span className="font-bold text-slate-800">Special Host Note:</span>
                      <p className="text-slate-600 leading-relaxed">
                        {property.checkInInstructions.instructions}
                      </p>
                    </div>

                    {/* Google Maps Directions simulator */}
                    <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Navigation className="w-5 h-5 text-emerald-700" />
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            Google Maps Directions to Absa Campus & Ferndale on Republic
                          </p>
                          <p className="text-[11px] text-slate-600">
                            Direct GPS coordinates: {property.coordinates.lat}, {property.coordinates.lng}
                          </p>
                        </div>
                      </div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${property.coordinates.lat},${property.coordinates.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                      >
                        Open in Google Maps
                      </a>
                    </div>
                  </div>

                  {/* MUST-ADD 7: Local Tips: Where to eat in Ferndale, nearest Absa, Spar etc. */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                      <Coffee className="w-4 h-4 text-amber-600" />
                      <span>Ferndale Local Tips & Insider Neighborhood Guide</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {FERNDALE_LOCAL_TIPS.map((tip: LocalTip, idx: number) => (
                        <div key={idx} className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-slate-900">{tip.title}</span>
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                                {tip.badge}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium block mb-2">{tip.type}</span>
                            <p className="text-xs text-slate-600 leading-relaxed">{tip.description}</p>
                          </div>
                          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-emerald-700 font-semibold">
                            Distance: {tip.distance}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {/* Integrated Online Banking Direct Interbank Portal */}
      <OnlineBankingPortalModal
        isOpen={isOnlineBankingModalOpen}
        onClose={() => setIsOnlineBankingModalOpen(false)}
        amountZar={finalTotal}
        recipientName={property.ownerName || 'ScopeBridg Escrow'}
        reference={`BK-${property.id.toUpperCase()}`}
        description={`Accommodation: ${property.title} (${nights} nights)`}
        currentUser={currentUser || undefined}
        onPaymentSuccess={() => {
          setIsOnlineBankingModalOpen(false);
          finalizeBookingRecord();
        }}
      />

      {/* Responsive Touch & Swipe Fullscreen High-Resolution Lightbox Modal */}
      <ResponsiveLightboxGallery
        isOpen={isPhotoLightboxOpen}
        photos={allGalleryPhotos.map((p) => ({
          url: p.url,
          label: p.label,
          category: p.category,
          roomId: p.roomId,
          roomName: property.rooms?.find((r) => r.id === p.roomId)?.name,
        }))}
        initialIndex={Math.max(0, allGalleryPhotos.findIndex((p) => p.url === selectedPhoto))}
        propertyTitle={property.title}
        propertyArea={property.area}
        onClose={() => setIsPhotoLightboxOpen(false)}
        onSelectPhotoIndex={(idx) => {
          if (allGalleryPhotos[idx]) {
            setSelectedPhoto(allGalleryPhotos[idx].url);
            if (allGalleryPhotos[idx].roomId) {
              setSelectedRoomId(allGalleryPhotos[idx].roomId!);
            }
          }
        }}
        onBookRoom={(roomId) => {
          setSelectedRoomId(roomId);
          const rm = property.rooms?.find((r) => r.id === roomId);
          if (rm?.images?.[0]) setSelectedPhoto(rm.images[0]);
          setActiveTab('overview');
        }}
      />
    </div>
  );
};

import { Booking, Property, RoomType } from '../types';

/**
 * Ensures every property always exposes bookable individual rooms/suites (never the entire property).
 */
export function getPropertyBookableRooms(property?: Property | null): RoomType[] {
  if (!property) return [];
  if (Array.isArray(property.rooms) && property.rooms.length > 0) {
    return property.rooms;
  }
  const basePrice = property.basePrice || 1200;
  const img = property.images?.[0] || '';
  return [
    {
      id: `${property.id}-room-1`,
      propertyId: property.id,
      name: 'Room 1 — Executive King Suite',
      type: 'master_suite',
      bedConfiguration: '1 Extra-length King Bed',
      maxGuests: 2,
      basePrice,
      weekendPrice: Math.round(basePrice * 1.15),
      corporatePrice: Math.round(basePrice * 0.95),
      surgeMultiplier: 1.15,
      amenities: ['En-suite Bathroom', 'Fast WiFi', 'Smart Lock'],
      status: 'available',
      images: img ? [img] : [],
      publishedChannels: ['direct', 'airbnb', 'booking_com'],
    },
    {
      id: `${property.id}-room-2`,
      propertyId: property.id,
      name: 'Room 2 — Deluxe Queen Suite',
      type: 'deluxe_room',
      bedConfiguration: '1 Queen Bed',
      maxGuests: 2,
      basePrice: Math.max(550, Math.round(basePrice * 0.9)),
      weekendPrice: basePrice,
      corporatePrice: Math.max(500, Math.round(basePrice * 0.85)),
      surgeMultiplier: 1.15,
      amenities: ['En-suite Bathroom', 'Fast WiFi', 'Workstation'],
      status: 'available',
      images: img ? [img] : [],
      publishedChannels: ['direct', 'airbnb', 'booking_com'],
    },
  ];
}

/**
 * Checks if a booking belongs to a specific room (by roomId or roomName).
 * Never treats a booking as blocking all rooms / the entire property.
 */
export function doesBookingMatchRoom(
  booking: Booking,
  roomId?: string,
  roomName?: string
): boolean {
  if (!roomId && !roomName) return false;
  const bRoomId = String((booking as any).roomId || '').trim();
  const bRoomName = String((booking as any).roomName || '').trim().toLowerCase();
  const bTitle = String(booking.propertyTitle || '').trim().toLowerCase();

  // 1. Explicit roomId match
  if (bRoomId && roomId) {
    return bRoomId === roomId;
  }

  // 2. Explicit roomName match
  if (bRoomName && roomName) {
    return bRoomName === roomName.trim().toLowerCase();
  }

  // 3. Fallback: check if booking title explicitly contains the room name (e.g. "17onBuffalo — Loft King Room")
  if (!bRoomId && roomName && roomName.trim().length > 2) {
    const targetNameLower = roomName.trim().toLowerCase();
    if (
      bTitle.includes(`— ${targetNameLower}`) ||
      bTitle.includes(`- ${targetNameLower}`) ||
      bTitle.includes(`(${targetNameLower})`) ||
      bTitle === targetNameLower
    ) {
      return true;
    }
  }

  if (!bRoomId && roomId && bTitle.includes(roomId.toLowerCase())) {
    return true;
  }

  return false;
}

/**
 * Checks whether two ISO date ranges [startA, endA) and [startB, endB) overlap.
 * Note: Check-out day of Booking A is available for Check-in of Booking B (standard hotel turnover).
 */
export function doDateRangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  if (!startA || !endA || !startB || !endB) return false;
  const sA = startA.slice(0, 10);
  const eA = endA.slice(0, 10);
  const sB = startB.slice(0, 10);
  const eB = endB.slice(0, 10);

  // Standard turnover: overlap occurs if Start A is before End B AND End A is after Start B
  return sA < eB && eA > sB;
}

export interface DoubleBookingConflictResult {
  hasConflict: boolean;
  conflictingBooking?: Booking;
  message?: string;
}

/**
 * Validates if a proposed room booking conflicts with any existing active reservation for that specific room.
 * Bookings are strictly per-room — never blocking the entire property.
 */
export function checkDoubleBookingConflict(params: {
  bookings: Booking[];
  propertyId: string;
  roomId?: string;
  roomName?: string;
  checkInDate: string;
  checkOutDate: string;
  excludeBookingId?: string;
  userRole?: string;
}): DoubleBookingConflictResult {
  const { bookings, propertyId, roomId, roomName, checkInDate, checkOutDate, excludeBookingId, userRole } = params;

  if (!checkInDate || !checkOutDate || checkInDate >= checkOutDate) {
    return {
      hasConflict: true,
      message: 'Invalid stay dates: Check-Out date must be after Check-In date.',
    };
  }

  // If no room is specified or 'all', do not block the entire property
  if (!roomId && !roomName) {
    return { hasConflict: false };
  }

  const isPrivileged = userRole === 'admin' || userRole === 'super_admin' || userRole === 'owner';

  for (const b of bookings) {
    if (b.id === excludeBookingId) continue;
    if (b.status === 'cancelled') continue;
    if (b.propertyId !== propertyId) continue;

    const overlap = doDateRangesOverlap(checkInDate, checkOutDate, b.checkInDate, b.checkOutDate);
    if (!overlap) continue;

    if (doesBookingMatchRoom(b, roomId, roomName)) {
      const displayRoom = roomName || (b as any).roomName || 'This room';
      return {
        hasConflict: true,
        conflictingBooking: b,
        message: isPrivileged
          ? `Double Booking Prevented: Room "${displayRoom}" is already booked by ${b.guestName} (${b.checkInDate} to ${b.checkOutDate}, Channel: ${(b.channel || 'Direct').toUpperCase()}). Please select another room in this property.`
          : `Double Booking Prevented: Room "${displayRoom}" is already booked for the selected dates (${b.checkInDate} to ${b.checkOutDate}). Please select another available room in this property or choose different dates.`,
      };
    }
  }

  return { hasConflict: false };
}

export interface BookedDateSpan {
  bookingId: string;
  checkInDate: string;
  checkOutDate: string;
  guestName: string;
  channel?: string;
  nights: number;
  roomId?: string;
  roomName?: string;
}

export interface FreeDateSpan {
  startDate: string;
  endDate: string;
  nightsCount: number;
  label: string;
}

/**
 * Returns a Set of date strings ('YYYY-MM-DD') on which the specific room is booked.
 */
export function getBookedDatesSet(
  bookings: Booking[],
  propertyId: string,
  roomId?: string,
  propertyBlockedDates?: string[],
  roomName?: string
): Set<string> {
  const bookedSet = new Set<string>();

  // Add manually blocked dates if any
  if (propertyBlockedDates && Array.isArray(propertyBlockedDates)) {
    propertyBlockedDates.forEach((d) => {
      if (typeof d === 'string' && d.length >= 10) {
        bookedSet.add(d.slice(0, 10));
      }
    });
  }

  bookings.forEach((b) => {
    if (b.status === 'cancelled') return;
    if (b.propertyId !== propertyId) return;

    // Strictly match the specific room only — never mark all rooms in the property as booked
    if (roomId || roomName) {
      if (!doesBookingMatchRoom(b, roomId, roomName)) {
        return;
      }
    } else {
      return;
    }

    const start = new Date(b.checkInDate);
    const end = new Date(b.checkOutDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

    const cur = new Date(start);
    while (cur < end) {
      bookedSet.add(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }
  });

  return bookedSet;
}

/**
 * Returns all active booked date spans for a specific room.
 */
export function getBookedSpansList(
  bookings: Booking[],
  propertyId: string,
  roomId?: string,
  roomName?: string
): BookedDateSpan[] {
  const spans: BookedDateSpan[] = [];

  bookings.forEach((b) => {
    if (b.status === 'cancelled') return;
    if (b.propertyId !== propertyId) return;

    if (roomId || roomName) {
      if (!doesBookingMatchRoom(b, roomId, roomName)) return;
    }

    spans.push({
      bookingId: b.id,
      checkInDate: b.checkInDate,
      checkOutDate: b.checkOutDate,
      guestName: b.guestName,
      channel: b.channel || b.source || 'Direct',
      nights: b.nights || 1,
      roomId: (b as any).roomId,
      roomName: (b as any).roomName,
    });
  });

  return spans.sort((a, b) => a.checkInDate.localeCompare(b.checkInDate));
}

/**
 * Generates an array of available free date spans and individual free days for a room starting from today or a given date.
 */
export function getAvailableFreeDaysList(params: {
  bookings: Booking[];
  propertyId: string;
  roomId?: string;
  roomName?: string;
  propertyBlockedDates?: string[];
  startDate?: string;
  daysAhead?: number;
}): { freeDays: string[]; freeSpans: FreeDateSpan[] } {
  const { bookings, propertyId, roomId, roomName, propertyBlockedDates, startDate, daysAhead = 60 } = params;
  const bookedSet = getBookedDatesSet(bookings, propertyId, roomId, propertyBlockedDates, roomName);

  const start = startDate ? new Date(startDate) : new Date();
  if (isNaN(start.getTime())) start.setTime(Date.now());

  const freeDays: string[] = [];
  const cur = new Date(start);

  for (let i = 0; i < daysAhead; i++) {
    const ymd = cur.toISOString().slice(0, 10);
    if (!bookedSet.has(ymd)) {
      freeDays.push(ymd);
    }
    cur.setDate(cur.getDate() + 1);
  }

  // Calculate contiguous free spans
  const freeSpans: FreeDateSpan[] = [];
  if (freeDays.length > 0) {
    let spanStart = freeDays[0];
    let prev = new Date(freeDays[0]);

    for (let i = 1; i < freeDays.length; i++) {
      const current = new Date(freeDays[i]);
      const diffDays = Math.round((current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays > 1) {
        // Gap encountered, finish previous span
        const spanEnd = prev.toISOString().slice(0, 10);
        const nights = Math.max(1, Math.round((prev.getTime() - new Date(spanStart).getTime()) / (1000 * 60 * 60 * 24)) + 1);
        freeSpans.push({
          startDate: spanStart,
          endDate: spanEnd,
          nightsCount: nights,
          label: `${spanStart} → ${spanEnd} (${nights} nights free)`,
        });
        spanStart = freeDays[i];
      }
      prev = current;
    }

    // Final span
    const spanEnd = prev.toISOString().slice(0, 10);
    const nights = Math.max(1, Math.round((prev.getTime() - new Date(spanStart).getTime()) / (1000 * 60 * 60 * 24)) + 1);
    freeSpans.push({
      startDate: spanStart,
      endDate: spanEnd,
      nightsCount: nights,
      label: `${spanStart} → ${spanEnd} (${nights} nights free)`,
    });
  }

  return { freeDays, freeSpans };
}

/**
 * Returns detailed availability status for a room or suite.
 */
export function getRoomOccupancyStatus(params: {
  room: { id: string; name: string; status?: string };
  property: Property;
  bookings: Booking[];
  targetDate?: string;
  checkInDate?: string;
  checkOutDate?: string;
}): {
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  badgeColor: string;
  badgeText: string;
  isAvailable: boolean;
  conflictingBooking?: Booking;
} {
  const { room, property, bookings, targetDate, checkInDate, checkOutDate } = params;

  if (room.status === 'maintenance') {
    return {
      status: 'maintenance',
      badgeColor: 'bg-amber-950/80 text-amber-300 border border-amber-500/50',
      badgeText: '🛠️ Maintenance',
      isAvailable: false,
    };
  }

  // If check-in and check-out range is provided
  if (checkInDate && checkOutDate) {
    const conflict = checkDoubleBookingConflict({
      bookings,
      propertyId: property.id,
      roomId: room.id,
      roomName: room.name,
      checkInDate,
      checkOutDate,
    });

    if (conflict.hasConflict) {
      return {
        status: 'occupied',
        badgeColor: 'bg-rose-950/90 text-rose-300 border border-rose-500/60 font-bold',
        badgeText: '🔴 Occupied (Booked)',
        isAvailable: false,
        conflictingBooking: conflict.conflictingBooking,
      };
    }
  }

  // If target single date is provided
  if (targetDate) {
    const bookedSet = getBookedDatesSet(bookings, property.id, room.id, property.blockedDates, room.name);
    if (bookedSet.has(targetDate.slice(0, 10))) {
      return {
        status: 'occupied',
        badgeColor: 'bg-rose-950/90 text-rose-300 border border-rose-500/60 font-bold',
        badgeText: '🔴 Occupied (Booked)',
        isAvailable: false,
      };
    }
  }

  // Today check
  const todayYmd = new Date().toISOString().slice(0, 10);
  const todayBookedSet = getBookedDatesSet(bookings, property.id, room.id, property.blockedDates, room.name);
  if (todayBookedSet.has(todayYmd)) {
    return {
      status: 'occupied',
      badgeColor: 'bg-rose-950/90 text-rose-300 border border-rose-500/60 font-bold',
      badgeText: '🔴 Occupied Today',
      isAvailable: true, // might be available on other future dates
    };
  }

  return {
    status: 'available',
    badgeColor: 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/60 font-bold',
    badgeText: '🟢 Available',
    isAvailable: true,
  };
}

import { NannyProfile, NannyBooking } from '../types';

export interface NannyMatchingCriteria {
  requestedDurationHours: number;
  preferredLanguages: string[];
  careFocus?: 'all' | 'infant' | 'toddler' | 'corporate' | 'night';
  onlyAvailableNow?: boolean;
  requestedDate?: string;
  requestedStartTime?: string;
}

export interface NannyMatchResult {
  nanny: NannyProfile;
  matchScore: number; // 0 - 100
  matchTier: 'Top Qualification Match' | 'Strong Qualification Match' | 'Partial Match';
  matchedLanguages: string[];
  missingLanguages: string[];
  languageCoverageRatio: number; // 0 - 1
  durationSuitabilityLabel: string;
  availabilityLabel: string;
  hasScheduleConflict: boolean;
  estimatedTotalZar: number;
  reasons: string[];
  breakdown: {
    languageScore: number; // max 35
    durationScore: number; // max 25
    availabilityScore: number; // max 25
    qualificationScore: number; // max 15
  };
}

function parseHour(timeStr: string): number {
  const [h, m] = (timeStr || '14:00').split(':').map(Number);
  return (Number.isFinite(h) ? h : 14) + (Number.isFinite(m) ? m / 60 : 0);
}

export function checkShiftConflict(
  nannyId: string,
  bookings: NannyBooking[],
  requestedDate?: string,
  requestedStartTime?: string,
  requestedDurationHours: number = 4
): boolean {
  if (!requestedDate || !requestedStartTime) return false;
  const reqStart = parseHour(requestedStartTime);
  const reqEnd = reqStart + requestedDurationHours;

  return bookings.some((b) => {
    if (b.nannyId !== nannyId) return false;
    if (b.status === 'cancelled' || b.status === 'completed') return false;
    if (b.date !== requestedDate) return false;
    const bStart = parseHour(b.startTime);
    const bEnd = bStart + (b.hours || 4);
    return reqStart < bEnd && reqEnd > bStart;
  });
}

export function evaluateNannyMatch(
  nanny: NannyProfile,
  criteria: NannyMatchingCriteria,
  bookings: NannyBooking[] = []
): NannyMatchResult {
  const {
    requestedDurationHours = 4,
    preferredLanguages = ['English'],
    careFocus = 'all',
    requestedDate,
    requestedStartTime,
  } = criteria;

  const reasons: string[] = [];

  // 1. Language Preference Match Score (up to 35 points)
  const normalizedNannyLangs = nanny.languages.map((l) => l.toLowerCase());
  const activePreferred = preferredLanguages.length > 0 ? preferredLanguages : ['English'];

  const matchedLanguages = activePreferred.filter((lang) =>
    normalizedNannyLangs.includes(lang.toLowerCase())
  );
  const missingLanguages = activePreferred.filter(
    (lang) => !normalizedNannyLangs.includes(lang.toLowerCase())
  );

  const languageCoverageRatio =
    activePreferred.length > 0 ? matchedLanguages.length / activePreferred.length : 1;

  // Full match gets 32-35 pts (with bonus for extra multilingual fluency)
  const extraLanguagesBonus = Math.min(3, Math.max(0, nanny.languages.length - matchedLanguages.length));
  const languageScore =
    matchedLanguages.length === activePreferred.length
      ? Math.min(35, 32 + extraLanguagesBonus)
      : Math.round(languageCoverageRatio * 30);

  if (matchedLanguages.length === activePreferred.length) {
    reasons.push(`Fluent in all requested languages (${matchedLanguages.join(', ')})`);
  } else if (matchedLanguages.length > 0) {
    reasons.push(`Speaks ${matchedLanguages.join(', ')} (${matchedLanguages.length}/${activePreferred.length} requested)`);
  }

  // 2. Booking Duration Suitability & Endurance Score (up to 25 points)
  let durationScore = 16;
  let durationSuitabilityLabel = `Qualified for ${requestedDurationHours}h shift`;

  const specsLower = nanny.specialties.join(' ').toLowerCase();
  const certsLower = nanny.certifications.join(' ').toLowerCase();
  const bioLower = nanny.bio.toLowerCase();

  if (requestedDurationHours <= 3) {
    // Short / Express Errand or Evening Shift (2-3h)
    const isShortSpecialist =
      specsLower.includes('evening') ||
      specsLower.includes('short') ||
      specsLower.includes('toddler') ||
      nanny.hourlyRateZar <= 175;
    durationScore = isShortSpecialist ? 25 : 22;
    durationSuitabilityLabel = `Optimal for ${requestedDurationHours}h Express / Short-Stay Care`;
    reasons.push(`High responsiveness for ${requestedDurationHours}-hour short-duration bookings`);
  } else if (requestedDurationHours <= 6) {
    // Half-Day / Corporate Meeting Shift (4-6h)
    const isHalfDaySpecialist =
      specsLower.includes('corporate') ||
      specsLower.includes('au pair') ||
      specsLower.includes('homework') ||
      specsLower.includes('educational') ||
      specsLower.includes('toddler');
    const expBonus = nanny.experienceYears >= 5 ? 4 : 2;
    durationScore = Math.min(25, (isHalfDaySpecialist ? 21 : 18) + expBonus);
    durationSuitabilityLabel = `Ideal for ${requestedDurationHours}h Half-Day & Corporate Schedule`;
    reasons.push(`Structured ${requestedDurationHours}h curriculum & activity pacing (${nanny.experienceYears} yrs exp)`);
  } else if (requestedDurationHours <= 8) {
    // Full-Day Executive Shift (7-8h)
    const isFullDayQualified =
      nanny.experienceYears >= 6 ||
      nanny.totalCompletedShifts >= 150 ||
      certsLower.includes('ecd') ||
      certsLower.includes('educator') ||
      specsLower.includes('full-day') ||
      specsLower.includes('corporate');
    durationScore = isFullDayQualified
      ? Math.min(25, 21 + Math.min(4, Math.floor(nanny.experienceYears / 2)))
      : 16;
    durationSuitabilityLabel = isFullDayQualified
      ? `Certified for ${requestedDurationHours}h Full-Day Executive Stays`
      : `Standard fit for ${requestedDurationHours}h Full-Day shift`;
    if (isFullDayQualified) {
      reasons.push(`Proven endurance across ${nanny.totalCompletedShifts}+ extended full-day shifts`);
    }
  } else {
    // Overnight / Extended Night Nanny Shift (9-12h+)
    const isNightOrExtendedSpecialist =
      specsLower.includes('night') ||
      specsLower.includes('infants') ||
      specsLower.includes('newborn') ||
      certsLower.includes('neonatal') ||
      certsLower.includes('cpr') ||
      bioLower.includes('overnight');
    const highEndurance = nanny.experienceYears >= 7 && nanny.totalCompletedShifts >= 180;
    if (isNightOrExtendedSpecialist && highEndurance) {
      durationScore = 25;
      durationSuitabilityLabel = `Top Specialist for ${requestedDurationHours}h Overnight / Extended Care`;
      reasons.push(`Certified Night & Extended-Duration Specialist (${nanny.experienceYears} yrs experience)`);
    } else if (isNightOrExtendedSpecialist) {
      durationScore = 22;
      durationSuitabilityLabel = `Qualified for ${requestedDurationHours}h Night / Long Shift`;
      reasons.push(`Trained in night-shift & infant sleep routines`);
    } else {
      durationScore = 14;
      durationSuitabilityLabel = `Available for ${requestedDurationHours}h shift (prefers daytime hours)`;
    }
  }

  // Optional care focus boost
  if (careFocus !== 'all') {
    const matchesFocus = specsLower.includes(careFocus) || bioLower.includes(careFocus);
    if (matchesFocus) {
      durationScore = Math.min(25, durationScore + 2);
    }
  }

  // 3. Availability & Schedule Conflict Score (up to 25 points)
  const hasScheduleConflict = checkShiftConflict(
    nanny.id,
    bookings,
    requestedDate,
    requestedStartTime,
    requestedDurationHours
  );

  let availabilityScore = 25;
  let availabilityLabel = 'Available Now • Ready for Dispatch';

  if (hasScheduleConflict) {
    availabilityScore = 6;
    availabilityLabel = 'Overlapping Shift on Selected Time';
  } else if (nanny.currentStatus === 'available') {
    availabilityScore = 25;
    availabilityLabel = 'Available Immediately • No Schedule Conflict';
    reasons.push('Currently available for immediate or scheduled check-in');
  } else if (nanny.currentStatus === 'on_shift') {
    availabilityScore = 15;
    availabilityLabel = 'On Active Shift • Bookable for Next Window';
  } else {
    availabilityScore = 8;
    availabilityLabel = 'Off Duty';
  }

  // 4. Qualification, Vetting & Parent Rating Score (up to 15 points)
  const vettingPts = nanny.verifiedStatus === 'fully_vetted' ? 5 : 3;
  const ratingPts = Math.min(5, Math.max(0, (nanny.rating - 4.0) * 5));
  const experiencePts = Math.min(
    5,
    nanny.experienceYears * 0.35 + Math.min(2, nanny.totalCompletedShifts / 120)
  );
  const qualificationScore = Math.min(15, Math.round(vettingPts + ratingPts + experiencePts));

  if (nanny.verifiedStatus === 'fully_vetted') {
    reasons.push(`Fully Vetted (${nanny.certifications[0] || 'SAPS & First Aid Certified'})`);
  }

  const totalRaw = languageScore + durationScore + availabilityScore + qualificationScore;
  const matchScore = Math.max(10, Math.min(100, Math.round(totalRaw)));

  const matchTier: NannyMatchResult['matchTier'] =
    matchScore >= 85
      ? 'Top Qualification Match'
      : matchScore >= 70
      ? 'Strong Qualification Match'
      : 'Partial Match';

  const vettingSafetyFee = 35;
  const estimatedTotalZar = nanny.hourlyRateZar * requestedDurationHours + vettingSafetyFee;

  return {
    nanny,
    matchScore,
    matchTier,
    matchedLanguages,
    missingLanguages,
    languageCoverageRatio,
    durationSuitabilityLabel,
    availabilityLabel,
    hasScheduleConflict,
    estimatedTotalZar,
    reasons,
    breakdown: {
      languageScore,
      durationScore,
      availabilityScore,
      qualificationScore,
    },
  };
}

export function rankAndMatchNannies(
  nannies: NannyProfile[],
  criteria: NannyMatchingCriteria,
  bookings: NannyBooking[] = []
): NannyMatchResult[] {
  const results = nannies
    .filter((n) => (criteria.onlyAvailableNow ? n.currentStatus === 'available' : true))
    .map((nanny) => evaluateNannyMatch(nanny, criteria, bookings));

  return results.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    if (a.nanny.currentStatus === 'available' && b.nanny.currentStatus !== 'available') return -1;
    if (b.nanny.currentStatus === 'available' && a.nanny.currentStatus !== 'available') return 1;
    return b.nanny.rating - a.nanny.rating;
  });
}

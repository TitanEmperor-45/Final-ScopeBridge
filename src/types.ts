export interface LocalTip {
  title: string;
  desc: string;
  description: string;
  category: string;
  badge?: string;
  type?: string;
  distance?: string;
}

export type AppRole = 'guest' | 'owner' | 'super_admin' | 'admin' | 'nanny' | 'driver' | 'kiosk';
export type UserRole = AppRole;

export type PaymentMethod = 'paystack' | 'ozow' | 'property' | 'card' | 'yoco' | 'snapscan' | 'peach' | 'eft' | 'online_banking';

export interface PropertyRoom {
  id: string;
  propertyId: string;
  name: string; // e.g., "Master En-Suite Loft", "Garden Studio Suite", "Executive Workstation Room"
  type: 'entire_unit' | 'master_suite' | 'deluxe_room' | 'studio' | 'family_room' | 'cottage';
  basePrice: number; // in ZAR per night
  weekendPrice: number; // in ZAR per night
  corporatePrice?: number; // Absa / corporate negotiated rate
  surgeMultiplier?: number; // e.g. 1.15
  maxGuests: number;
  bedConfiguration: string; // e.g., "1 Extra-length King Bed"
  amenities: string[]; // e.g., ["Aircon", "En-suite bathroom", "Work desk", "Balcony"]
  images: string[];
  photos?: string[];
  imageUrl?: string;
  videos?: string[]; // Room video tour URLs (MP4 / YouTube / Vimeo links)
  publishedChannels: string[]; // ['direct', 'airbnb', 'booking_com', 'expedia', 'lekkeslaap', etc.]
  status: 'available' | 'maintenance' | 'occupied' | 'pending_verification' | 'pending_approval' | 'rejected';
  verificationStatus?: 'verified' | 'pending_verification' | 'pending_approval' | 'rejected';
  verifiedBy?: string;
  verifiedAt?: string;
}

export type Room = PropertyRoom;
export type RoomType = PropertyRoom;

export interface ChannelConfig {
  id: string; // 'direct' | 'airbnb' | 'booking_com' | 'expedia' | 'agoda' | 'vrbo' | 'lekkeslaap' | 'safarinow' | 'google_rentals'
  name: string;
  logo: string;
  category: 'direct' | 'global_ota' | 'domestic_sa' | 'metasearch' | 'niche_agent' | 'corporate_system';
  status: 'connected' | 'disconnected' | 'maintenance';
  commissionRate: number; // percentage, e.g. 15
  apiStatus: 'healthy' | 'degraded' | 'offline';
  lastSyncTime: string;
  propertiesSyncedCount: number;
  roomsSyncedCount: number;
  description: string;
  supportedFeatures?: string[];
}

export type DistributionChannel = ChannelConfig;

export interface PaymentGatewayConfig {
  id: string; // 'paystack' | 'ozow' | 'yoco' | 'snapscan' | 'peach' | 'stripe' | 'eft'
  name: string;
  type: 'instant_eft' | 'card_merchant' | 'qr_mobile' | 'card_and_eft';
  status: 'connected' | 'disconnected' | 'test_mode';
  feePercent: number; // e.g. 2.9
  fixedFee: number; // in ZAR, e.g. 1.00
  settlementTime: string; // "Instant", "Next Day (T+1)"
  description: string;
  supportedMethods: string[];
}

export interface OwnerAccessRequest {
  id: string;
  ownerId: string;
  ownerName: string;
  propertyId: string;
  propertyTitle: string;
  roomId?: string;
  roomName?: string;
  requestType: 'channel' | 'payment_gateway';
  targetId: string; // e.g. 'airbnb' or 'ozow'
  targetName: string;
  action: 'connect' | 'disconnect';
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  adminNotes?: string;
  bankName?: string;
  accountNumberMasked?: string;
}

export type ChannelAccessRequest = OwnerAccessRequest;
export type GatewayAccessRequest = OwnerAccessRequest;

export interface AiRule {
  id: string;
  trigger: string;
  action: string;
  enabled: boolean;
}

export interface Distances {
  ferndaleOnRepublic: string;
  absaCampus: string;
  spar: string;
  randburgSquare: string;
  gautrainSandton: string;
  crestaMall?: string;
}

export interface Coordinates {
  x: number; // For interactive SVG/Canvas map (0-100%)
  y: number;
  lat: number;
  lng: number;
}

export interface Review {
  id: string;
  propertyId: string;
  guestName: string;
  guestAvatar?: string;
  rating: number;
  date: string;
  text: string;
  guestPhotoUrl?: string; // Real photo taken by guest
  hostReply?: string;
  verifiedStay: boolean;
}

export interface Property {
  id: string;
  title: string;
  unitCode: string;
  propertyType?: 'bnb' | 'hotel' | 'resort' | 'apartment' | 'villa';
  area: string; // e.g. "Mayfair, London", "Ferndale, Randburg", "Downtown Dubai"
  city?: string; // e.g. "London", "Johannesburg", "Dubai", "New York", "Paris", "Bali", "Tokyo"
  country?: string; // e.g. "United Kingdom", "South Africa", "United Arab Emirates", "United States", "France", "Indonesia", "Japan"
  globalRegion?: 'South Africa' | 'Europe' | 'Middle East' | 'North America' | 'Asia Pacific';
  flag?: string; // e.g. "🇬🇧", "🇿🇦", "🇦🇪", "🇺🇸", "🇫🇷", "🇮🇩", "🇯🇵"
  currencyCode?: string; // e.g. "ZAR", "USD", "GBP", "EUR", "AED"
  address: string;
  basePrice: number; // in ZAR (Rands) or base unit
  weekendPrice: number;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  rating: number;
  reviewCount: number;
  photoCount: number;
  images: string[];
  imageUrl?: string;
  videos?: string[]; // Property walk-through video URLs
  guestPhotos: string[]; // guest photos section
  description?: string;
  summary?: string;
  bankAccount?: BankAccountDetails; // Property payout bank account
  amenities: {
    selfCheckIn: boolean;
    parking: boolean;
    wifi: boolean;
    kitchen: boolean;
    petFriendly: boolean;
    familyFriendly: boolean;
    solarInverter: boolean;
    swimmingPool?: boolean;
    aircon?: boolean;
    workspace?: boolean;
  };
  distances: Distances;
  coordinates: Coordinates;
  checkInInstructions: {
    lockboxCode: string;
    smartLockPin: string;
    wifiName: string;
    wifiPassword: string;
    parkingBay: string;
    gateCode: string;
    instructions: string;
  };
  qualityScore: number; // 0 - 100
  status: 'active' | 'pending_approval' | 'paused' | 'suspended' | 'maintenance';
  verificationStatus?: 'verified' | 'pending_verification' | 'pending_approval' | 'rejected';
  verifiedBy?: string;
  verifiedAt?: string;
  ownerId: string;
  ownerName: string;
  ownerWhatsApp: string;
  channelSync: {
    airbnb: boolean;
    bookingCom: boolean;
    direct: boolean;
    lastSynced: string;
  };
  blockedDates: string[]; // YYYY-MM-DD
  airbnbIcalUrl?: string; // Airbnb iCal sync feed URL
  rooms?: PropertyRoom[];
  publishedChannels?: string[];
  requestedChannels?: string[];
  requestedGateways?: string[];
  promotions?: PromoCode[];
  activePromotions?: PromoCode[];
  payoutAccountType?: 'bnb_operations' | 'owner_payout' | 'holding_escrow';
}

export interface Booking {
  id: string;
  propertyId: string;
  propertyTitle: string;
  roomId?: string;
  roomName?: string;
  propertyImage: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  guestsCount: number;
  totalAmount: number;
  commission: {
    ownerAmount: number;
    adminAmount: number;
  };
  paymentMethod: PaymentMethod;
  paymentStatus: 'paid' | 'pending' | 'deposit_held';
  addOns: {
    lateCheckout: boolean; // R120
    airportPickup: boolean; // R450
    breakfast: boolean; // R150
  };
  doorCode: string;
  smartLockPin?: string;
  wifiAccessGranted?: boolean;
  channel: 'direct' | 'airbnb' | 'booking.com' | 'booking' | 'agoda' | 'expedia' | 'lekkeslaap' | 'safarinow' | string;
  sourceChannel?: string;
  syncedChannels?: string[];
  notes?: string;
  specialRequests?: string;
  ownerNotes?: string;
  source?: string;
  status?: string;
  idVerified: boolean;
  depositStatus: 'held' | 'released' | 'refunded';
  createdAt: string;
}

export interface CleaningTask {
  id: string;
  propertyId: string;
  propertyTitle: string;
  cleanerName: string;
  cleanerPhone: string;
  scheduledDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  checklist: { item: string; done: boolean }[];
  notes?: string;
}

export interface AdminAlert {
  id: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  category: 'security' | 'operations' | 'money' | 'cleaning' | 'guest';
  timestamp: string;
  resolved: boolean;
  actionLabel?: string;
}

export type AdminAuditAlert = AdminAlert;

export interface SupportTicket {
  id: string;
  guestName: string;
  propertyTitle: string;
  subject: string;
  category: 'maintenance' | 'noise' | 'billing' | 'checkin';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved';
  date: string;
}

export interface PromoCode {
  code: string;
  discountPercent: number;
  active: boolean;
  uses?: number;
  usageCount?: number;
  description: string;
  minNights?: number;
}

export interface AiRuleConfig {
  id: string;
  trigger: string;
  responseTemplate: string;
  enabled: boolean;
  category: string;
}

export interface VatInvoice {
  invoiceNumber: string;
  date: string;
  guestName: string;
  propertyTitle: string;
  subtotal: number;
  vatAmount: number; // 15% in SA
  total: number;
  taxNumber: string;
  status: 'issued' | 'paid' | 'credited';
}

// ==========================================
// QUOTATION & INVOICE FULL TYPES
// ==========================================

export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired';
export type InvoiceStatus = 'draft' | 'issued' | 'pending_payment' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
export type PaymentStatusType = 'unpaid' | 'pending_approval' | 'partially_paid' | 'paid' | 'overdue' | 'refunded';

export interface QuotationItem {
  id: string;
  description: string;
  quantity: number;
  unitPriceZar: number;
  amountZar: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string; // e.g., "QT-2026-001"
  propertyId?: string;
  propertyTitle: string;
  ownerId?: string;
  ownerName: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  checkInDate?: string;
  checkOutDate?: string;
  items: QuotationItem[];
  subtotalZar: number;
  vatAmountZar: number; // 15% VAT
  totalZar: number;
  discountZar?: number;
  notes?: string;
  validUntil: string;
  status: QuotationStatus;
  paymentStatus: PaymentStatusType;
  convertedToInvoiceId?: string;
  createdAt: string;
  createdBy: string; // 'owner' | 'admin' | 'guest'
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPriceZar: number;
  amountZar: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g., "INV-2026-0901"
  quotationRef?: string;
  propertyId?: string;
  propertyTitle: string;
  ownerId?: string;
  ownerName: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  taxNumber: string; // e.g. SARS-VAT-4920192837
  items: InvoiceItem[];
  subtotalZar: number;
  vatAmountZar: number; // 15% VAT
  totalZar: number;
  amountPaidZar: number;
  balanceDueZar: number;
  status: InvoiceStatus;
  paymentStatus: PaymentStatusType;
  issueDate: string;
  dueDate: string;
  notes?: string;
  paymentMethod?: string;
  paidAt?: string;
  createdAt: string;
  createdBy: string;
}

// ==========================================
// NANNY & CHILDCARE PORTAL TYPES
// ==========================================

export type NannyVerificationStatus = 'pending' | 'police_cleared' | 'first_aid_certified' | 'fully_vetted' | 'rejected';

export interface NannyProfile {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  experienceYears: number;
  hourlyRateZar: number;
  phone: string;
  whatsapp: string;
  bio: string;
  certifications: string[]; // ["Red Cross Infant CPR", "SAPS Police Clearance", "Early Childhood Development"]
  languages: string[]; // ["English", "isiZulu", "Sesotho", "Afrikaans"]
  specialties: string[]; // ["Infants (0-12m)", "Toddler Play", "Homework & Au Pair", "Night Nanny", "Corporate Stays"]
  availableNeighborhoods: string[]; // ["Ferndale", "Rosebank", "Randburg Central", "Bryanston"]
  verifiedStatus: NannyVerificationStatus;
  currentStatus: 'available' | 'on_shift' | 'off_duty';
  totalCompletedShifts: number;
  badge: string;
}

export type NannyActivityCategory = 'meal' | 'nap' | 'play' | 'hygiene' | 'safety_check' | 'outdoor';

export interface NannyActivityLog {
  id: string;
  time: string;
  category: NannyActivityCategory;
  title: string;
  note: string;
  photoUrl?: string;
  verifiedByParent?: boolean;
}

export interface NannyBooking {
  id: string;
  nannyId: string;
  nannyName: string;
  nannyAvatar?: string;
  nannyPhone?: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  propertyId: string;
  propertyTitle: string;
  unitCode?: string;
  date: string;
  startTime: string; // e.g. "14:00"
  endTime: string; // e.g. "18:00"
  hours: number;
  hourlyRateZar: number;
  totalAmountZar: number;
  childrenCount: number;
  childrenAges: string; // e.g. "2 yrs & 5 yrs"
  specialNotes?: string;
  allergies?: string;
  emergencyContact?: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  activityLogs: NannyActivityLog[];
  createdAt: string;
}

// ==========================================
// AI FEATURES TYPES (GEMINI 3.8 FLASH)
// ==========================================

export interface AiPricingRecommendation {
  propertyId: string;
  propertyTitle: string;
  currentBasePrice: number;
  recommendedBasePrice: number;
  currentWeekendPrice: number;
  recommendedWeekendPrice: number;
  corporateNegotiatedPrice: number;
  reasoning: string;
  demandFactor: 'very_high' | 'high' | 'moderate' | 'steady';
  potentialRevenueIncreasePercent: number;
  localEventsContext: string;
}

export interface AiChildcareActivityPlan {
  childAge: string;
  durationHours: number;
  theme: string;
  schedule: {
    timeSlot: string;
    activityName: string;
    category: 'play' | 'learning' | 'meal' | 'rest' | 'reading';
    description: string;
    safetyTip: string;
  }[];
  healthySnackSuggestions: string[];
  calmingBedtimeTip: string;
}

export interface AiListingSuggestion {
  headline: string;
  tagline: string;
  overview: string;
  highlights: string[];
  familyFriendlyPitch: string;
  corporatePitch: string;
  loadSheddingAssurance: string;
}

// ==========================================
// AUTHENTICATION & PRESET USER LOGINS
// ==========================================

export interface UserAccount {
  id: string;
  name: string;
  fullName?: string;
  username: string;
  password?: string;
  role: AppRole;
  email: string;
  phone: string;
  avatar: string;
  title: string;
  location?: string;
  badge?: string;
  status?: 'active' | 'approved' | 'pending' | 'pending_approval' | 'rejected' | 'suspended';
  registeredAt?: string;
  createdAt?: string;
  bankAccount?: BankAccountDetails;
  bankAccounts?: BankAccountDetails[];
  registeredHolidayChannels?: string[];
  kioskAccess?: boolean;
  createdByOwnerId?: string;
  createdByOwnerName?: string;
  staffRoleLabel?: string;
  // BnB Logo, Branding & Tax Information for Documents
  bnbName?: string;
  bnbLogoUrl?: string;
  logoUrl?: string;
  vatNumber?: string;
  taxNumber?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
}

// ==========================================
// SHUTTLE DRIVER & AIRPORT TRANSFER TYPES
// ==========================================

export type ShuttleTripStatus =
  | 'scheduled'
  | 'on_route'
  | 'en_route'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'confirmed'
  | 'cancelled';

export interface ShuttleBooking {
  id: string;
  guestName?: string;
  passengerName?: string;
  guestPhone?: string;
  passengerPhone?: string;
  guestEmail?: string;
  passengerEmail?: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  vehicleModel: string;
  vehiclePlate: string;
  pickupLocation: string;
  dropoffLocation: string;
  date: string;
  time: string;
  passengersCount?: number;
  passengers?: number;
  luggageCount: number;
  flightNumber?: string;
  totalPriceZar?: number;
  totalAmountZar: number;
  status: ShuttleTripStatus;
  serviceType?: 'airport_transfer' | 'city_ride' | 'hourly_hire';
  paymentStatus?: 'paid' | 'pending';
  specialRequests?: string;
  specialInstructions?: string;
  createdAt: string;
  routeDistanceKm?: number;
  etaMinutes?: number;
  pickupCoordinates?: { lat: number; lng: number };
  dropoffCoordinates?: { lat: number; lng: number };
}

export interface ShuttleDriverProfile {
  id: string;
  name: string;
  username: string;
  phone: string;
  email: string;
  rating: number;
  reviewCount?: number;
  tripsCompleted?: number;
  totalTrips?: number;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleColor: string;
  vehicleYear: number;
  vehicleCapacity?: number;
  maxPassengers?: number;
  maxLuggage?: number;
  driverLicense?: string;
  status: 'available' | 'on_trip' | 'offline' | 'on_duty';
  verifiedStatus?: 'pending' | 'verified' | 'rejected';
  currentLocation?: string;
  avatar: string;
  carImage?: string;
  bio?: string;
  serviceAreas?: string[];
  baseRateAirportZar?: number;
  certifications?: string[];
  earningsTodayZar?: number;
  weeklyEarningsZar?: number;
}

// ==========================================
// GLOBAL CURRENCY TYPES
// ==========================================

export type GlobalCurrency = 'ZAR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'JPY';

export interface CurrencyRate {
  code: GlobalCurrency;
  symbol: string;
  rateToZar: number; // 1 ZAR in target currency
  name: string;
  flag: string;
}

// ==========================================
// ROOM BIDDING TYPES
// ==========================================

export interface RoomBid {
  id: string;
  propertyId: string;
  propertyName: string;
  roomId?: string;
  roomName?: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  guestsCount: number;
  offeredPricePerNightZar: number;
  totalOfferedZar: number;
  message?: string;
  status: 'pending' | 'approved' | 'declined' | 'countered';
  counterOfferRateZar?: number;
  counterOfferMessage?: string;
  generatedInvoiceId?: string;
  generatedQuoteId?: string;
  createdAt: string;
}

// ==========================================
// FLEET MANAGEMENT & SERVICE REQUEST TYPES
// ==========================================

export type FleetServiceType = 'disk_renewal' | 'fine_payment' | 'mechanical_service';
export type FleetServiceStatus = 'pending_admin_approval' | 'approved' | 'in_progress' | 'completed' | 'rejected';

export interface FleetServiceRequest {
  id: string;
  driverId: string;
  driverName: string;
  vehicleModel: string;
  vehiclePlate: string;
  serviceType: FleetServiceType;
  title: string;
  description: string;
  estimatedCostZar?: number;
  fineReferenceNumber?: string;
  diskExpiryDate?: string;
  status: FleetServiceStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

// ==========================================
// VIRTUAL WALLET TYPES
// ==========================================

export interface VirtualWalletTransaction {
  id: string;
  date: string;
  title: string;
  category: 'deposit' | 'booking_payment' | 'cashback_reward' | 'shuttle_payment' | 'nanny_payment' | 'refund' | 'transfer' | 'referral_credit';
  amountZar: number; // positive for credits, negative for debits
  status: 'completed' | 'pending' | 'failed';
  reference: string;
  notes?: string;
}

export type WalletTransaction = VirtualWalletTransaction;

export interface VirtualWalletData {
  holidayFundBalanceZar: number;
  cashbackRewardsZar: number;
  referralCreditsZar: number;
  goalName: string;
  goalTargetZar: number;
  transactions: VirtualWalletTransaction[];
}

// ==========================================
// HR & STAFF PAYROLL TYPES
// ==========================================

export interface StaffMember {
  id: string;
  name: string;
  role: 'Housekeeper' | 'Receptionist' | 'Shuttle Driver' | 'Property Nanny' | 'Maintenance Tech';
  phone: string;
  email: string;
  monthlyBaseRateZar: number;
  hourlyRateZar: number;
  bankName: string;
  accountNumberMasked: string;
  status: 'active' | 'on_leave' | 'inactive';
}

export interface PayrollEntry {
  id: string;
  staffId: string;
  staffName: string;
  role: string;
  monthYear: string; // e.g. "2026-09"
  baseSalaryZar: number;
  bonusZar: number;
  deductionsZar: number;
  netPayZar: number;
  paymentStatus: 'pending' | 'approved' | 'paid';
  paidDate?: string;
}

// ==========================================
// KIOSK ACTIVATION & PLATFORM CONFIG
// ==========================================

export type BankAccountStatus = 'active' | 'pending' | 'suspended';

export interface BankAccountDetails {
  id?: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branchCode: string;
  accountType: string;
  payoutDestination?: 'bnb_operations' | 'owner_payout' | 'holding_escrow';
  customLabel?: string;
  status?: BankAccountStatus;
  isPrimary?: boolean;
  swiftCode?: string;
  enteredInRegistration?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface OnlineBankingTransaction {
  id: string;
  transactionId: string;
  referenceCode: string;
  timestamp: string;
  channel: 'online_banking_rtc' | 'paystack' | 'ozow' | 'yoco' | 'peach' | 'snapscan' | 'stripe' | 'absa_direct_eft' | 'virtual_wallet';
  paymentMode: 'online_banking' | 'payment_gateway';
  payerUserId: string;
  payerName: string;
  payerRole: AppRole;
  payerBankName: string;
  payerAccountNumber: string;
  beneficiaryName: string;
  beneficiaryBankName: string;
  beneficiaryAccountNumber: string;
  beneficiaryBranchCode: string;
  amountZar: number;
  purpose: string;
  linkedEntityId?: string;
  status: 'SETTLED_LIVE' | 'PENDING_CLEARING' | 'VERIFIED';
  authApprovalCode: string;
}

export interface KioskConfig {
  activated: boolean;
  pin: string;
  activationUrl: string;
  activatedAt?: string;
}

export interface PlatformConfig {
  mainAdminBankAccount: BankAccountDetails;
}

export interface KioskFlightBooking {
  id: string;
  guestName: string;
  route: string;
  carrier: string;
  date: string;
  status: 'queued' | 'confirmed' | 'cancelled';
  createdAt: string;
}

export interface KioskCarBooking {
  id: string;
  guestName: string;
  vehicle: string;
  days: number;
  status: 'queued' | 'confirmed' | 'cancelled';
  createdAt: string;
}

// ==========================================
// UNIVERSAL CALENDAR & EVERYTHING PLANNER TYPES
// ==========================================

export type CalendarEventCategory =
  | 'stay_booking'
  | 'holiday_trip'
  | 'flight_transit'
  | 'childcare_nanny'
  | 'dining_leisure'
  | 'corporate_meeting'
  | 'property_maintenance'
  | 'system_maintenance'
  | 'personal_event';

export type CalendarEventStatus = 'confirmed' | 'pending' | 'cancelled';

export interface CalendarPlanEvent {
  id: string;
  title: string;
  category: CalendarEventCategory;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  status: CalendarEventStatus;
  userId: string;
  userName: string;
  userRole: AppRole;
  propertyId?: string;
  propertyTitle?: string;
  roomId?: string;
  roomName?: string;
  channelId?: string;
  syncedChannels: string[];
  notes?: string;
  amountZar?: number;
  linkedBookingId?: string;
  createdAt: string;
  updatedAt?: string;
}





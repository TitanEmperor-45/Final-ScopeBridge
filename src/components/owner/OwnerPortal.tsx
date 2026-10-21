import React, { useState } from 'react';
import { Property, PropertyRoom, Booking, CleaningTask, Review, PromoCode, ChannelConfig, PaymentGatewayConfig, OwnerAccessRequest, NannyProfile, NannyBooking, Quotation, Invoice, RoomBid, CalendarPlanEvent, ShuttleBooking, UserAccount } from '../../types';
import { MOCK_NANNIES, MOCK_NANNY_BOOKINGS } from '../../data/mockData';
import { IS_PROD } from '../../lib/env';
import { UniversalCalendarPlanner } from '../common/UniversalCalendarPlanner';
import {
  DollarSign, RefreshCw, Calendar as CalendarIcon, MessageSquare, Key, Sparkles,
  TrendingUp, Tag, Building2, CheckCircle2, ShieldAlert, Plus, Lock, Send,
  Download, Clock, Check, Eye, ChevronRight, Sliders, AlertCircle, Copy, BedDouble,
  Globe, CreditCard, Power, PowerOff, ShieldCheck, MapPin, Users, Monitor, Link as LinkIcon, Baby,
  FileText, Receipt, Gavel, Trash2, Car, Wrench, Plane, ExternalLink, Hammer, Fuel, Navigation,
  X, Image as ImageIcon, Video, Upload, Landmark
} from 'lucide-react';
import { AddPropertyModal } from './AddPropertyModal';
import { RoomsPricingManager } from './RoomsPricingManager';
import { OwnerChannelGatewayManager } from './OwnerChannelGatewayManager';
import { QuotationsAndInvoicesManager } from '../finance/QuotationsAndInvoicesManager';
import { BiddingManager } from '../finance/BiddingManager';
import { ProfileBankAccountsManager } from '../common/ProfileBankAccountsManager';
import { InteractiveFloorPlanOccupancyMap } from '../admin/InteractiveFloorPlanOccupancyMap';
import { parseMediaUrls, compressImageToDataUrl } from '../../lib/firebase';
import { GLOBAL_AREA_GROUPS, ALL_GLOBAL_AREAS, findGlobalAreaMeta } from '../../data/globalAreas';

interface OwnerPortalProps {
  properties: Property[];
  bookings: Booking[];
  cleaningTasks: CleaningTask[];
  reviews: Review[];
  promos: PromoCode[];
  channels: ChannelConfig[];
  gateways?: PaymentGatewayConfig[];
  paymentGateways?: PaymentGatewayConfig[];
  requests?: OwnerAccessRequest[];
  accessRequests?: OwnerAccessRequest[];
  nannies?: NannyProfile[];
  nannyBookings?: NannyBooking[];
  quotations?: Quotation[];
  invoices?: Invoice[];
  roomBids?: RoomBid[];
  onAddNannyBooking?: (booking: NannyBooking) => void;
  onUpdateNannyBookingStatus?: (id: string, status: NannyBooking['status']) => void;
  onUpdateProperties: React.Dispatch<React.SetStateAction<Property[]>>;
  onUpdateCleanings: React.Dispatch<React.SetStateAction<CleaningTask[]>>;
  onUpdateReviews: React.Dispatch<React.SetStateAction<Review[]>>;
  onUpdatePromos: React.Dispatch<React.SetStateAction<PromoCode[]>>;
  onSubmitRequest?: (request: Omit<OwnerAccessRequest, 'id' | 'createdAt' | 'status'>) => void;
  onRequestAccess?: (request: Omit<OwnerAccessRequest, 'id' | 'createdAt' | 'status'>) => void;
  onPublishPropertyToChannel?: (propertyId: string, channelId: string, publish: boolean) => void;
  onPublishRoomToChannel?: (propertyId: string, roomId: string, channelId: string, publish: boolean) => void;
  onAddProperty?: (newProp: Property) => void;
  onAddRoom?: (propertyId: string, room: PropertyRoom) => void;
  onUpdateRoomPricing?: (
    propertyId: string,
    roomId: string,
    basePrice: number,
    weekendPrice: number,
    corporatePrice?: number,
    surgeMultiplier?: number
  ) => void;
  onCreateQuotation?: (quote: Omit<Quotation, 'id' | 'createdAt'>) => void;
  onEditQuotation?: (quote: Quotation) => void;
  onDeleteQuotation?: (quoteId: string) => void;
  onConvertQuoteToInvoice?: (quoteId: string) => void;
  onCreateInvoice?: (inv: Omit<Invoice, 'id' | 'createdAt'>) => void;
  onEditInvoice?: (inv: Invoice) => void;
  onDeleteInvoice?: (invoiceId: string) => void;
  onPayInvoice?: (invoiceId: string, method: string, amount: number) => void;
  onUpdateRoomBidStatus?: (bidId: string, status: 'approved' | 'declined' | 'pending' | 'countered', counterRate?: number, counterMessage?: string) => void;
  onBookProperty?: (bookingData: Omit<Booking, 'id' | 'createdAt'>) => void;
  calendarEvents?: CalendarPlanEvent[];
  registeredUsers?: UserAccount[];
  shuttleBookings?: ShuttleBooking[];
  currentUser?: UserAccount;
  onUpdateUser?: (updatedUser: UserAccount) => void;
  onUpdateBookings?: React.Dispatch<React.SetStateAction<Booking[]>>;
  onUpdateCalendarEvents?: React.Dispatch<React.SetStateAction<CalendarPlanEvent[]>>;
  onOpenGuestBookingLink?: () => void;
  onRegisterStaffUser?: (staffUser: UserAccount) => void;
  onEnterKioskMode?: () => void;
}

export const OwnerPortal: React.FC<OwnerPortalProps> = ({
  properties,
  bookings,
  cleaningTasks,
  reviews,
  promos,
  channels,
  gateways,
  paymentGateways,
  requests,
  accessRequests,
  nannies = MOCK_NANNIES,
  nannyBookings = MOCK_NANNY_BOOKINGS,
  quotations = [],
  invoices = [],
  roomBids = [],
  onAddNannyBooking,
  onUpdateNannyBookingStatus,
  onUpdateProperties,
  onUpdateCleanings,
  onUpdateReviews,
  onUpdatePromos,
  onSubmitRequest,
  onRequestAccess,
  onPublishPropertyToChannel,
  onPublishRoomToChannel,
  onAddProperty,
  onAddRoom,
  onUpdateRoomPricing,
  onCreateQuotation = () => {},
  onEditQuotation = () => {},
  onDeleteQuotation = () => {},
  onConvertQuoteToInvoice = () => {},
  onCreateInvoice = () => {},
  onEditInvoice = () => {},
  onDeleteInvoice = () => {},
  onPayInvoice = () => {},
  onUpdateRoomBidStatus = () => {},
  onBookProperty = () => {},
  calendarEvents = [],
  registeredUsers = [],
  shuttleBookings = [],
  currentUser,
  onUpdateUser,
  onUpdateBookings = () => {},
  onUpdateCalendarEvents = () => {},
  onOpenGuestBookingLink,
  onRegisterStaffUser,
  onEnterKioskMode,
}) => {
  const effectiveGateways = paymentGateways || gateways || [];
  const effectiveRequests = accessRequests || requests || [];
  const handleRequestSubmit = onRequestAccess || onSubmitRequest || (() => {});
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
  // Expanded Owner Menu Navigation Options
  const [activeCategory, setActiveCategory] = useState<
    'money' | 'bank_accounts' | 'occupancy_map' | 'manage_properties' | 'rooms_pricing' | 'channels_gateways' | 'operations' | 'guests' | 'growth' | 'staff_payroll' | 'kiosk_config' | 'nanny_booking' | 'quotes_invoices' | 'room_bidding' | 'shuttle_fleet' | 'maintenance_built_skills' | 'flights_car_hire'
  >('money');

  // Shuttle & Fleet State
  const shuttleStorageKey = IS_PROD ? 'scopebridg_prod_shuttle_bookings' : 'scopebridg_shuttle_bookings';
  const [shuttleBookingsList, setShuttleBookingsList] = useState(() => {
    const saved = localStorage.getItem(shuttleStorageKey);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'SHT-901',
        passengerName: 'David Miller',
        passengerPhone: '+27 82 555 1234',
        driverName: 'Sipho Zulu (Airport Chauffeur)',
        vehicleModel: 'Mercedes Vito VIP V300',
        vehiclePlate: 'ND 881-229',
        pickupLocation: 'OR Tambo International Airport (Terminal A)',
        dropoffLocation: 'Rosebank Luxury Residences',
        date: new Date().toISOString().slice(0, 10),
        time: '14:30',
        passengersCount: 3,
        totalAmountZar: 650,
        status: 'confirmed',
      },
      {
        id: 'SHT-902',
        passengerName: 'Sarah Jenkins',
        passengerPhone: '+27 71 444 8899',
        driverName: 'Thabo Mbeki (Sandton Chauffeur)',
        vehicleModel: 'Mercedes E-Class Sedan',
        vehiclePlate: 'GP 772-001',
        pickupLocation: 'Gautrain Sandton Station',
        dropoffLocation: 'Sandton Executive Suite',
        date: new Date().toISOString().slice(0, 10),
        time: '18:15',
        passengersCount: 1,
        totalAmountZar: 420,
        status: 'in_transit',
      },
    ];
  });

  // Maintenance & BuiltSkills SA Partner State
  const maintenanceStorageKey = IS_PROD ? 'scopebridg_prod_maintenance_tickets' : 'scopebridg_maintenance_tickets';
  const [maintenanceTickets, setMaintenanceTickets] = useState(() => {
    const saved = localStorage.getItem(maintenanceStorageKey);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'MNT-301',
        propertyTitle: 'Executive Solar Lofts',
        title: 'Solar Inverter Annual Inspection',
        category: 'Solar & Electrical',
        priority: 'high',
        contractor: 'BuiltSkills SA Certified Artisan Network',
        externalPartnerUrl: 'https://builtskillsa.netlify.app',
        status: 'in_progress',
        createdAt: '2026-09-22',
        costZar: 1850,
        notes: 'Dispatched via BuiltSkills SA portal for 5kVA inverter inspection.',
      },
      {
        id: 'MNT-302',
        propertyTitle: 'The Mayfair Royal Penthouse',
        title: 'Smart Keypad Lock Battery & Sensor Service',
        category: 'Access Control',
        priority: 'urgent',
        contractor: 'BuiltSkills SA Locksmith Specialist',
        externalPartnerUrl: 'https://builtskillsa.netlify.app',
        status: 'completed',
        createdAt: '2026-09-20',
        costZar: 950,
        notes: 'Smart lock batteries replaced and re-calibrated.',
      },
    ];
  });

  // Flight Bookings & Car Hire State
  const flightsStorageKey = IS_PROD ? 'scopebridg_prod_flight_bookings' : 'scopebridg_flight_bookings';
  const [flightBookings, setFlightBookings] = useState(() => {
    const saved = localStorage.getItem(flightsStorageKey);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'FLT-801',
        guestName: 'Alex Thorne',
        carrier: 'FlySafair',
        route: 'CPT (Cape Town) -> JNB (OR Tambo)',
        flightNumber: 'FA-211',
        date: new Date().toISOString().slice(0, 10),
        status: 'confirmed',
        ticketPriceZar: 1450,
      },
      {
        id: 'FLT-802',
        guestName: 'Elena Rostova',
        carrier: 'South African Airways',
        route: 'JNB (OR Tambo) -> CPT (Cape Town)',
        flightNumber: 'SA-322',
        date: '2026-09-28',
        status: 'queued',
        ticketPriceZar: 1890,
      },
    ];
  });

  const carHireStorageKey = IS_PROD ? 'scopebridg_prod_car_hire_bookings' : 'scopebridg_car_hire_bookings';
  const [carHireBookings, setCarHireBookings] = useState(() => {
    const saved = localStorage.getItem(carHireStorageKey);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'CAR-701',
        guestName: 'David Miller',
        vehicleModel: 'Toyota Fortuner 2.8 GD-6 4x4 SUV',
        rentalDays: 4,
        dailyRateZar: 1200,
        totalAmountZar: 4800,
        pickupBranch: 'OR Tambo Hub',
        status: 'confirmed',
      },
    ];
  });

  // Save shuttle, maintenance, flights, car hire to localStorage
  React.useEffect(() => {
    localStorage.setItem(shuttleStorageKey, JSON.stringify(shuttleBookingsList));
  }, [shuttleBookingsList, shuttleStorageKey]);

  React.useEffect(() => {
    localStorage.setItem(maintenanceStorageKey, JSON.stringify(maintenanceTickets));
  }, [maintenanceTickets, maintenanceStorageKey]);

  React.useEffect(() => {
    localStorage.setItem(flightsStorageKey, JSON.stringify(flightBookings));
  }, [flightBookings, flightsStorageKey]);

  React.useEffect(() => {
    localStorage.setItem(carHireStorageKey, JSON.stringify(carHireBookings));
  }, [carHireBookings, carHireStorageKey]);

  // Owner Operational Form States
  const [newShtPassenger, setNewShtPassenger] = useState('');
  const [newShtPhone, setNewShtPhone] = useState('+27 ');
  const [newShtDriver, setNewShtDriver] = useState('Sipho Zulu (Airport Chauffeur)');
  const [newShtVehicle, setNewShtVehicle] = useState('Mercedes Vito VIP V300 (ND 881-229)');
  const [newShtPickup, setNewShtPickup] = useState('');
  const [newShtDropoff, setNewShtDropoff] = useState('');
  const [newShtAmount, setNewShtAmount] = useState(650);

  const [newMntTitle, setNewMntTitle] = useState('');
  const [newMntProp, setNewMntProp] = useState(properties[0]?.title || 'Executive Solar Lofts');
  const [newMntCategory, setNewMntCategory] = useState('Solar & Electrical');
  const [newMntCost, setNewMntCost] = useState(1200);

  const [newFltGuest, setNewFltGuest] = useState('');
  const [newFltCarrier, setNewFltCarrier] = useState('FlySafair');
  const [newFltRoute, setNewFltRoute] = useState('CPT -> JNB');
  const [newFltPrice, setNewFltPrice] = useState(1450);

  const [newCarGuest, setNewCarGuest] = useState('');
  const [newCarModel, setNewCarModel] = useState('Toyota Fortuner 2.8 GD-6 4x4');
  const [newCarDays, setNewCarDays] = useState(3);
  const [newCarRate, setNewCarRate] = useState(1200);

  // Owner Nanny Booking Form State
  const [ownerNannyGuestName, setOwnerNannyGuestName] = useState<string>('');
  const [ownerNannyGuestPhone, setOwnerNannyGuestPhone] = useState<string>('');
  const [ownerNannySelectedProperty, setOwnerNannySelectedProperty] = useState<string>(properties[0]?.id || '');
  const [ownerNannySelectedNanny, setOwnerNannySelectedNanny] = useState<string>(nannies[0]?.id || '');
  const [ownerNannyDate, setOwnerNannyDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [ownerNannyStartTime, setOwnerNannyStartTime] = useState<string>('14:00');
  const [ownerNannyHours, setOwnerNannyHours] = useState<number>(3);
  const [ownerNannyChildrenCount, setOwnerNannyChildrenCount] = useState<number>(1);
  const [ownerNannyChildrenAges, setOwnerNannyChildrenAges] = useState<string>('');
  const [ownerNannyNotes, setOwnerNannyNotes] = useState<string>('');
  const [ownerNannySuccessMsg, setOwnerNannySuccessMsg] = useState<string | null>(null);

  // Add Property Modal State
  const [isAddPropertyModalOpen, setIsAddPropertyModalOpen] = useState<boolean>(false);
  
  // Media & Bank Account Modal State
  const [editingPropertyMediaId, setEditingPropertyMediaId] = useState<string | null>(null);
  const [mediaBankName, setMediaBankName] = useState<string>('First National Bank (FNB)');
  const [mediaAccountName, setMediaAccountName] = useState<string>('');
  const [mediaAccountNumber, setMediaAccountNumber] = useState<string>('');
  const [mediaBranchCode, setMediaBranchCode] = useState<string>('250655');
  const [mediaAccountType, setMediaAccountType] = useState<string>('Cheque / Current Account');
  const [mediaPayoutAccountType, setMediaPayoutAccountType] = useState<'bnb_operations' | 'owner_payout' | 'holding_escrow'>('bnb_operations');
  const [mediaPromoCode, setMediaPromoCode] = useState<string>('');
  const [mediaPromoDiscount, setMediaPromoDiscount] = useState<number>(10);
  const [mediaPromoMinNights, setMediaPromoMinNights] = useState<number>(2);
  const [mediaPromoActive, setMediaPromoActive] = useState<boolean>(false);
  const [mediaImages, setMediaImages] = useState<string>('');
  const [mediaVideos, setMediaVideos] = useState<string>('');
  const [mediaRooms, setMediaRooms] = useState<{ id: string; name: string; images: string; videos: string }[]>([]);

  // Active selected property for single/multi unit management
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(properties[0]?.id || 'prop-1');
  const fallbackProperty: Property = {
    id: 'prop-placeholder',
    title: 'Add Your First Property',
    unitCode: 'UNIT-001',
    area: '',
    address: '',
    basePrice: 850,
    weekendPrice: 1050,
    bedrooms: 2,
    bathrooms: 2,
    maxGuests: 4,
    rating: 5.0,
    reviewCount: 0,
    photoCount: 1,
    images: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80'],
    videos: [],
    guestPhotos: [],
    amenities: {
      selfCheckIn: true,
      parking: true,
      wifi: true,
      kitchen: true,
      petFriendly: false,
      familyFriendly: true,
      solarInverter: true,
    },
    distances: {
      ferndaleOnRepublic: '350m',
      absaCampus: '1.2 km',
      spar: '450m',
      randburgSquare: '1.6 km',
      gautrainSandton: '8.2 km',
    },
    coordinates: { x: 50, y: 50, lat: -26.0945, lng: 28.0012 },
    checkInInstructions: {
      lockboxCode: '4821',
      smartLockPin: '4821#',
      wifiName: 'ScopeBridge_Fibre',
      wifiPassword: 'ScopeBridgeSuperHost2026',
      parkingBay: 'Bay #1',
      gateCode: '#8899',
      instructions: 'Use smart lock PIN at front door.',
    },
    qualityScore: 95,
    status: 'active',
    ownerId: 'owner-1',
    ownerName: 'Property Owner',
    ownerWhatsApp: '+27820000000',
    channelSync: { airbnb: true, bookingCom: true, direct: true, lastSynced: 'Just now' },
    blockedDates: [],
    publishedChannels: ['direct'],
    rooms: [],
  };
  const activeProperty = properties.find((p) => p.id === selectedPropertyId) || properties[0] || fallbackProperty;

  // Dynamic Pricing State
  const [weekendMarkupPercent, setWeekendMarkupPercent] = useState<number>(20);
  const [holidaySurgeEnabled, setHolidaySurgeEnabled] = useState<boolean>(true);
  const [dynamicPricingSaved, setDynamicPricingSaved] = useState<boolean>(false);
  const [calendarMonth, setCalendarMonth] = useState<'2026-09' | '2026-10' | '2026-11' | '2026-12'>('2026-09');

  // Channel sync state
  const [isSyncingChannels, setIsSyncingChannels] = useState<boolean>(false);
  const [lastSyncText, setLastSyncText] = useState<string>('Just now');

  // Automated WhatsApp messages template state
  const [testSendNumber, setTestSendNumber] = useState<string>('+27 82 555 1290');
  const [activeMsgTemplate, setActiveMsgTemplate] = useState<'checkin' | 'wifi' | 'checkout'>('checkin');
  const [messageSentFeedback, setMessageSentFeedback] = useState<string | null>(null);

  // Smart lock PIN generator
  const [generatedCode, setGeneratedCode] = useState<string>('4821#');
  const [codeCopied, setCodeCopied] = useState<boolean>(false);

  // New Promo Code Form
  const [newPromoCode, setNewPromoCode] = useState<string>('');
  const [newPromoDiscount, setNewPromoDiscount] = useState<number>(10);
  const [newPromoDesc, setNewPromoDesc] = useState<string>('');

  // Review reply state
  const [replyDrafts, setReplyDrafts] = useState<{ [reviewId: string]: string }>({});

  // Staff HR & Payroll State
  const staffStorageKey = IS_PROD ? 'scopebridg_prod_staff_list' : 'ferndalestay_staff_list';
  const [staffList, setStaffList] = useState(() => {
    const saved = localStorage.getItem(staffStorageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Error parsing staff list', e);
      }
    }
    return [
      {
        id: 'STF-101',
        name: 'Nomsa Dlamini',
        role: 'Certified Lead Super Nanny',
        hourlyRateZar: 150,
        hoursWorked: 84,
        monthlyGrossZar: 12600,
        status: 'active' as const,
        phone: '+27 83 491 0021',
        propertyAssigned: 'Global Portfolio',
        lastPaid: '2026-08-31',
      },
      {
        id: 'STF-102',
        name: 'Sipho Zulu',
        role: 'Executive Airport Chauffeur',
        hourlyRateZar: 180,
        hoursWorked: 70,
        monthlyGrossZar: 12600,
        status: 'active' as const,
        phone: '+27 72 881 9012',
        propertyAssigned: 'Johannesburg Airport Transfers',
        lastPaid: '2026-08-31',
      },
      {
        id: 'STF-103',
        name: 'Thandiwe Khumalo',
        role: 'Head Hospitality Cleaner',
        hourlyRateZar: 120,
        hoursWorked: 60,
        monthlyGrossZar: 7200,
        status: 'active' as const,
        phone: '+27 82 110 4482',
        propertyAssigned: 'Executive Solar Lofts',
        lastPaid: '2026-08-31',
      },
      {
        id: 'STF-104',
        name: 'David Van Der Merwe',
        role: 'Solar & HVAC Specialist',
        hourlyRateZar: 250,
        hoursWorked: 24,
        monthlyGrossZar: 6000,
        status: 'active' as const,
        phone: '+27 84 990 1234',
        propertyAssigned: 'Randburg Solar Substation',
        lastPaid: '2026-08-31',
      },
    ];
  });

  React.useEffect(() => {
    localStorage.setItem(staffStorageKey, JSON.stringify(staffList));
    localStorage.setItem('scopebridg_owner_staff_kiosk_users', JSON.stringify(staffList));
  }, [staffList, staffStorageKey]);

  // Add Staff Modal / Form state (with Kiosk Mode Login Username & Password created by Owner)
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Receptionist & Kiosk Concierge');
  const [newStaffRate, setNewStaffRate] = useState(150);
  const [newStaffHours, setNewStaffHours] = useState(40);
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffProperty, setNewStaffProperty] = useState('');
  const [newStaffStatus, setNewStaffStatus] = useState<'active' | 'pending'>('active');
  const [staffStatusFilter, setStaffStatusFilter] = useState<'all' | 'active' | 'pending' | 'on_leave'>('all');
  const [kioskCopyFeedback, setKioskCopyFeedback] = useState<string | null>(null);

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;

    const rate = Number(newStaffRate) || 100;
    const hours = Number(newStaffHours) || 40;
    const gross = rate * hours;
    const generatedUsername =
      newStaffUsername.trim() ||
      newStaffName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_');
    const generatedPassword = newStaffPassword.trim() || 'Kiosk@2026!';
    const generatedEmail = newStaffEmail.trim() || `${generatedUsername}@scopebridg.co.za`;
    const ownerName = currentUser?.fullName || currentUser?.name || 'Property Owner';
    const ownerId = currentUser?.id || 'owner-1';

    const newEmp = {
      id: `STF-${Date.now().toString().slice(-4)}`,
      name: newStaffName.trim(),
      username: generatedUsername,
      password: generatedPassword,
      email: generatedEmail,
      role: newStaffRole.trim(),
      hourlyRateZar: rate,
      hoursWorked: hours,
      monthlyGrossZar: gross,
      status: newStaffStatus,
      phone: newStaffPhone.trim() || '+27 82 000 0000',
      propertyAssigned: newStaffProperty || 'Executive Solar Lofts',
      lastPaid: new Date().toISOString().slice(0, 10),
      kioskAccess: true,
      createdByOwnerId: ownerId,
      createdByOwnerName: ownerName,
    };

    setStaffList((prev: any[]) => [newEmp, ...prev]);

    // Also register/sync this staff user into global registeredUsers so they can log into Login Kiosk Mode
    if (onRegisterStaffUser) {
      const mappedRole = newStaffRole.toLowerCase().includes('nanny')
        ? 'nanny'
        : newStaffRole.toLowerCase().includes('chauffeur') || newStaffRole.toLowerCase().includes('driver')
        ? 'driver'
        : 'kiosk';
      const staffUserAccount: UserAccount = {
        id: `staff-user-${newEmp.id}`,
        name: newEmp.name,
        fullName: newEmp.name,
        username: generatedUsername,
        password: generatedPassword,
        role: mappedRole,
        email: generatedEmail,
        phone: newEmp.phone,
        avatar:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        title: `${newEmp.role} (Created by ${ownerName})`,
        location: newEmp.propertyAssigned,
        badge: 'Owner-Authorized Kiosk Staff',
        status: newStaffStatus === 'active' ? 'active' : 'pending',
        registeredAt: new Date().toISOString().slice(0, 10),
        kioskAccess: true,
        createdByOwnerId: ownerId,
        createdByOwnerName: ownerName,
        staffRoleLabel: newEmp.role,
      };
      onRegisterStaffUser(staffUserAccount);
    }

    setIsAddStaffOpen(false);
    setNewStaffName('');
    setNewStaffUsername('');
    setNewStaffPassword('');
    setNewStaffEmail('');
    setNewStaffPhone('');
  };

  const handleUpdateStaffStatus = (id: string, nextStatus: 'active' | 'pending' | 'on_leave' | 'inactive') => {
    setStaffList((prev: any[]) => prev.map((s: any) => s.id === id ? { ...s, status: nextStatus } : s));
  };

  const handleDeleteStaff = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete employee "${name}" from the HR database?`)) {
      setStaffList((prev: any[]) => prev.filter((s: any) => s.id !== id));
    }
  };

  // Calculations for Payout Dashboard
  const totalEarned = bookings.reduce((sum, b) => (b.paymentStatus === 'paid' ? sum + b.totalAmount : sum), 0);
  const pendingPayout = bookings.reduce(
    (sum, b) => (b.paymentStatus === 'pending' ? sum + b.totalAmount : sum),
    IS_PROD ? 0 : 12350
  );
  const directBookingsCount = bookings.filter((b) => b.channel === 'direct').length;

  // Add-on revenue breakdown
  const addonLateCheckoutRev = bookings.filter((b) => b.addOns?.lateCheckout).length * 120;
  const addonAirportRev = bookings.filter((b) => b.addOns?.airportPickup).length * 450;
  const addonBreakfastRev = bookings.filter((b) => b.addOns?.breakfast).length * 300;
  const totalAddonProfit = addonLateCheckoutRev + addonAirportRev + addonBreakfastRev;

  // Handler for Channel Sync
  const handleSyncChannels = () => {
    setIsSyncingChannels(true);
    setTimeout(() => {
      setIsSyncingChannels(false);
      setLastSyncText('Just now (0 conflicts)');
    }, 1200);
  };

  // Handler for saving Dynamic Pricing
  const handleSaveDynamicPricing = () => {
    onUpdateProperties((prev) =>
      prev.map((p) => {
        if (p.id === activeProperty.id) {
          const newWeekend = Math.round(p.basePrice * (1 + weekendMarkupPercent / 100));
          return { ...p, weekendPrice: newWeekend };
        }
        return p;
      })
    );
    setDynamicPricingSaved(true);
    setTimeout(() => setDynamicPricingSaved(false), 2500);
  };

  // Handler to toggle Block Dates
  const handleToggleBlockDate = (dateStr: string) => {
    onUpdateProperties((prev) =>
      prev.map((p) => {
        if (p.id === activeProperty.id) {
          const exists = p.blockedDates.includes(dateStr);
          const updated = exists
            ? p.blockedDates.filter((d) => d !== dateStr)
            : [...p.blockedDates, dateStr];
          return { ...p, blockedDates: updated };
        }
        return p;
      })
    );
  };

  // Handler for sending automated message test
  const handleSendTestMessage = () => {
    setMessageSentFeedback(`WhatsApp message sent to ${testSendNumber}!`);
    setTimeout(() => setMessageSentFeedback(null), 3500);
  };

  // Generate new Smart Lock PIN
  const handleGenerateNewPin = () => {
    const randomPin = `${Math.floor(1000 + Math.random() * 9000)}#`;
    setGeneratedCode(randomPin);
    onUpdateProperties((prev) =>
      prev.map((p) => {
        if (p.id === activeProperty.id) {
          return {
            ...p,
            checkInInstructions: {
              ...p.checkInInstructions,
              smartLockPin: randomPin,
            },
          };
        }
        return p;
      })
    );
  };

  // Create Promo Code
  const handleCreatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoCode) return;
    const created: PromoCode = {
      code: newPromoCode.trim().toUpperCase(),
      discountPercent: newPromoDiscount,
      active: true,
      uses: 0,
      description: newPromoDesc || 'Direct booking special across our portfolio',
    };
    onUpdatePromos((prev) => [created, ...prev]);
    setNewPromoCode('');
    setNewPromoDesc('');
  };

  // Reply to review
  const handleSendReviewReply = (reviewId: string) => {
    const replyText = replyDrafts[reviewId];
    if (!replyText) return;
    onUpdateReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, hostReply: replyText } : r))
    );
    setReplyDrafts((prev) => ({ ...prev, [reviewId]: '' }));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Multi-Property Unit Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shrink-0">
            <Building2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Owner Portal Dashboard</h2>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
                Host: {currentUser?.name || activeProperty.ownerName}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Manage rates, channel sync, smart locks & cleaning across all global areas, suburbs & destinations
            </p>
          </div>
        </div>

        {/* Multi-Property Unit Selector (GROWTH feature) */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold whitespace-nowrap">Active Unit:</span>
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-emerald-600 min-w-[200px]"
            >
              {properties.length === 0 ? (
                <option value="prop-placeholder">No properties yet — Click Add Property</option>
              ) : (
                properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.unitCode})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Quick Add Property Button */}
          <button
            onClick={() => setIsAddPropertyModalOpen(true)}
            className="h-9 flex items-center justify-center gap-1.5 px-3.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-colors shrink-0 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Property</span>
          </button>

          {onOpenGuestBookingLink && (
            <button
              onClick={onOpenGuestBookingLink}
              className="h-9 flex items-center justify-center gap-1.5 px-3.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-bold shadow-xs transition-colors shrink-0 whitespace-nowrap cursor-pointer"
            >
              <LinkIcon className="w-4 h-4" />
              <span>Guest Booking Link (Calendar)</span>
            </button>
          )}
        </div>
      </div>

      {/* Expanded Owner Menu Navigation Options - Uniformly Aligned Grid/Flex */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 bg-slate-100 p-2 rounded-2xl border border-slate-200 text-xs font-bold">
        <button
          onClick={() => setActiveCategory('money')}
          className={`h-9 px-3 rounded-xl transition-all flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden text-ellipsis ${
            activeCategory === 'money'
              ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">Dashboard & Money</span>
        </button>

        <button
          onClick={() => setActiveCategory('bank_accounts')}
          className={`h-9 px-3 rounded-xl transition-all flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden text-ellipsis ${
            activeCategory === 'bank_accounts'
              ? 'bg-emerald-900 text-white shadow-xs border border-emerald-700 ring-2 ring-emerald-500/40'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
          }`}
          title="Add, Edit, Delete, Suspend, or Pend Owner Bank Accounts for Payouts"
        >
          <Landmark className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="truncate font-extrabold">🏦 Bank Accounts & Payouts</span>
        </button>

        <button
          onClick={() => setActiveCategory('occupancy_map')}
          className={`h-9 px-3 rounded-xl transition-all flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden text-ellipsis ${
            activeCategory === 'occupancy_map'
              ? 'bg-rose-700 text-white shadow-xs border border-rose-600'
              : 'bg-rose-50 text-rose-900 border border-rose-200 hover:bg-rose-100'
          }`}
          title="Interactive Visual Occupancy Map & Dynamic Floor Plan View"
        >
          <BedDouble className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span className="truncate font-bold">Visual Occupancy Map</span>
        </button>

        <button
          onClick={() => setActiveCategory('manage_properties')}
          className={`h-9 px-3 rounded-xl transition-all flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden text-ellipsis ${
            activeCategory === 'manage_properties'
              ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">Manage Properties ({properties.length})</span>
        </button>

        <button
          onClick={() => setActiveCategory('rooms_pricing')}
          className={`h-9 px-3 rounded-xl transition-all flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden text-ellipsis ${
            activeCategory === 'rooms_pricing'
              ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <BedDouble className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">Rooms & Pricing</span>
        </button>

        <button
          onClick={() => setActiveCategory('channels_gateways')}
          className={`h-9 px-3 rounded-xl transition-all flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden text-ellipsis ${
            activeCategory === 'channels_gateways'
              ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">Channels & Gateways</span>
        </button>

        <button
          onClick={() => setActiveCategory('operations')}
          className={`h-9 px-3 rounded-xl transition-all flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden text-ellipsis ${
            activeCategory === 'operations'
              ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <CalendarIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">Calendar &amp; Planner</span>
        </button>

        <button
          onClick={() => setActiveCategory('guests')}
          className={`h-9 px-3 rounded-xl transition-all flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden text-ellipsis ${
            activeCategory === 'guests'
              ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">Guest Comms & Locks</span>
        </button>

        <button
          onClick={() => setActiveCategory('growth')}
          className={`h-9 px-3 rounded-xl transition-all flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden text-ellipsis ${
            activeCategory === 'growth'
              ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">Loyalty & Promos</span>
        </button>

        <button
          onClick={() => setActiveCategory('staff_payroll')}
          className={`h-9 px-3 rounded-xl transition-all flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden text-ellipsis ${
            activeCategory === 'staff_payroll'
              ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">Staff HR & Payroll</span>
        </button>

        <button
          onClick={() => setActiveCategory('kiosk_config')}
          className={`h-9 px-3 rounded-xl transition-all flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden text-ellipsis ${
            activeCategory === 'kiosk_config'
              ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Monitor className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">Lobby Kiosk Setup</span>
        </button>

        <button
          onClick={() => setActiveCategory('nanny_booking')}
          className={`h-9 px-3 rounded-xl transition-all flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden text-ellipsis ${
            activeCategory === 'nanny_booking'
              ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Baby className="w-3.5 h-3.5 text-purple-600 shrink-0" />
          <span className="truncate">Book Nanny for Guest</span>
        </button>

        <button
          onClick={() => setActiveCategory('quotes_invoices')}
          className={`h-9 px-3 rounded-xl transition-all flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden text-ellipsis ${
            activeCategory === 'quotes_invoices'
              ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Receipt className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="truncate">Quotes & Invoices ({quotations.length + invoices.length})</span>
        </button>

        <button
          onClick={() => setActiveCategory('room_bidding')}
          className={`h-9 px-3 rounded-xl transition-all flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden text-ellipsis ${
            activeCategory === 'room_bidding'
              ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Gavel className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="truncate">Room Bids ({roomBids.length})</span>
        </button>

        <button
          onClick={() => setActiveCategory('shuttle_fleet')}
          className={`h-9 px-3 rounded-xl transition-all flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden text-ellipsis ${
            activeCategory === 'shuttle_fleet'
              ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Car className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">Shuttle & Fleet</span>
        </button>

        <button
          onClick={() => setActiveCategory('maintenance_built_skills')}
          className={`h-9 px-3 rounded-xl transition-all flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden text-ellipsis ${
            activeCategory === 'maintenance_built_skills'
              ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Wrench className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="truncate">Maintenance & BuiltSkills SA</span>
        </button>

        <button
          onClick={() => setActiveCategory('flights_car_hire')}
          className={`h-9 px-3 rounded-xl transition-all flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden text-ellipsis ${
            activeCategory === 'flights_car_hire'
              ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Plane className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="truncate">Flights & Car Hire</span>
        </button>
      </div>

      {/* SECTION: QUOTATIONS & INVOICES MANAGER */}
      {activeCategory === 'quotes_invoices' && (
        <QuotationsAndInvoicesManager
          role="owner"
          currentUserName={activeProperty.ownerName}
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

      {/* SECTION: ROOM BIDDING MANAGER */}
      {activeCategory === 'room_bidding' && (
        <BiddingManager
          role="owner"
          currentUserName={activeProperty.ownerName}
          roomBids={roomBids}
          properties={properties}
          onUpdateBidStatus={onUpdateRoomBidStatus}
          onCreateQuotationFromBid={(bid) => {
            const newQuote: Omit<Quotation, 'id' | 'createdAt'> = {
              quotationNumber: `QT-2026-${Math.floor(100 + Math.random() * 900)}`,
              propertyId: bid.propertyId,
              propertyTitle: bid.propertyName,
              ownerId: 'owner-1',
              ownerName: activeProperty.ownerName || 'Lindiwe Khumalo',
              guestName: bid.guestName,
              guestEmail: bid.guestEmail,
              guestPhone: bid.guestPhone,
              checkInDate: bid.checkInDate,
              checkOutDate: bid.checkOutDate,
              items: [
                {
                  id: `bid-item-${Date.now()}`,
                  description: `Negotiated Stay (${bid.propertyName})`,
                  quantity: 1,
                  unitPriceZar: bid.totalOfferedZar,
                  amountZar: bid.totalOfferedZar,
                },
              ],
              subtotalZar: Math.round(bid.totalOfferedZar * 0.86957 * 100) / 100,
              vatAmountZar: Math.round(bid.totalOfferedZar * 0.13043 * 100) / 100,
              totalZar: bid.totalOfferedZar,
              notes: 'Accepted room bid quotation.',
              validUntil: bid.checkInDate,
              status: 'accepted',
              paymentStatus: 'unpaid',
              createdBy: 'owner',
            };
            onCreateQuotation(newQuote);
          }}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION 1: MONEY FUNCTIONS */}
      {/* ------------------------------------------------------------- */}
      {activeCategory === 'money' && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-semibold uppercase">Total Earned (YTD)</span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                R{totalEarned.toLocaleString()}
              </p>
              <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">
                ↑ 18% higher than regional area avg
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-semibold uppercase">Pending Payout</span>
              <p className="text-2xl font-black text-emerald-800 mt-1">
                R{pendingPayout.toLocaleString()}
              </p>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Next EFT: Friday • FNB Ending in 4128
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-semibold uppercase">Add-on Sales Profit</span>
              <p className="text-2xl font-black text-indigo-700 mt-1">
                +R{totalAddonProfit}
              </p>
              <span className="text-[10px] text-indigo-600 font-semibold mt-1 block">
                Late checkouts & breakfast baskets
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-semibold uppercase">Channel Double-Booking Risk</span>
              <p className="text-2xl font-black text-emerald-700 mt-1">
                0%
              </p>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Airbnb & Booking.com 2-way synced
              </span>
            </div>
          </div>

          {/* Scope Bridge Official Escrow Bank Details Card */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-lg space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Official Escrow Account</span>
                  <span className="text-xs font-black text-slate-100 uppercase tracking-tight">Scope Bridge Official Admin Bank Account</span>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-extrabold px-3 py-1 rounded-full">
                Platform Commissions & Subscriptions EFT Payouts
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Bank Name</span>
                <p className="font-extrabold text-white text-xs">Absa Bank</p>
              </div>
              <div className="space-y-1 col-span-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Account Name</span>
                <p className="font-extrabold text-white text-xs truncate font-sans">NANZA PROPERTIES GROUP (PTY) LTD</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Account Number</span>
                <p className="font-mono font-black text-emerald-400 text-xs">4113870950</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Branch Code</span>
                <p className="font-mono font-extrabold text-white text-xs">632005</p>
              </div>
            </div>
            
            <p className="text-[10px] text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800 leading-relaxed">
              Property hosts must use the banking credentials listed above to deposit registration fees, pay active subscription invoices, and clear platform commission tabs. Please ensure your Host ID or Registered Property Name is used as your deposit reference.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feature 1.1: Dynamic Pricing Tool */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Dynamic Pricing Engine ({activeProperty.title})
                  </h3>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Auto Surge
                </span>
              </div>

              <p className="text-xs text-slate-500">
                Automatically raise nightly rates on weekends (Friday & Saturday) and regional & global public holidays to maximize RevPAR.
              </p>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700">Base Weekday Rate:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    R{activeProperty.basePrice}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>Weekend Markup (+{weekendMarkupPercent}%):</span>
                    <span className="text-emerald-800 font-bold text-sm">
                      R{Math.round(activeProperty.basePrice * (1 + weekendMarkupPercent / 100))}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="5"
                    value={weekendMarkupPercent}
                    onChange={(e) => setWeekendMarkupPercent(Number(e.target.value))}
                    className="w-full accent-emerald-700 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>+10%</span>
                    <span>+25%</span>
                    <span>+50%</span>
                  </div>
                </div>

                <label className="flex items-center justify-between pt-2 border-t border-slate-200 cursor-pointer text-xs">
                  <span className="font-medium text-slate-700">
                    Auto-surge for Global Events & Public Holidays (+35%)
                  </span>
                  <input
                    type="checkbox"
                    checked={holidaySurgeEnabled}
                    onChange={(e) => setHolidaySurgeEnabled(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between">
                {dynamicPricingSaved ? (
                  <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Rates updated across all channels!
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    Saves to Airbnb & Booking.com feeds
                  </span>
                )}
                <button
                  onClick={handleSaveDynamicPricing}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  Save Dynamic Rates
                </button>
              </div>
            </div>

            {/* Feature 1.2: Channel Manager (sync Booking.com, Airbnb, Direct) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <RefreshCw className={`w-4 h-4 text-emerald-600 ${isSyncingChannels ? 'animate-spin' : ''}`} />
                  <h3 className="text-sm font-bold text-slate-900">
                    Channel Manager (No Double Bookings)
                  </h3>
                </div>
                <button
                  onClick={handleSyncChannels}
                  disabled={isSyncingChannels}
                  className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                >
                  <span>Sync All Now</span>
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Instant 2-way iCal & API calendar synchronization between your direct site, Booking.com, and Airbnb.
              </p>

              <div className="space-y-2 text-xs">
                {/* Direct Site */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    <div>
                      <span className="font-bold text-slate-900 block">Direct Website (ScopeBridge)</span>
                      <span className="text-[10px] text-slate-500">0% commission • Instant lock codes</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                    Active
                  </span>
                </div>

                {/* Airbnb */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                    <div>
                      <span className="font-bold text-slate-900 block">Airbnb Calendar Sync</span>
                      <span className="text-[10px] text-slate-500">Last synced: {lastSyncText}</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded">
                    Connected
                  </span>
                </div>

                {/* Booking.com */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                    <div>
                      <span className="font-bold text-slate-900 block">Booking.com iCal Feed</span>
                      <span className="text-[10px] text-slate-500">Rates pushed • Calendar locked</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded">
                    Connected
                  </span>
                </div>
              </div>

              {/* UNIVERSAL 7-PROPERTY iCAL & FEED MANAGER */}
              <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    🌐 Universal 7-Property Airbnb iCal Feeds (Active Sync)
                  </span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2 py-0.5 rounded-full">
                    2-Way Blocked Dates Active
                  </span>
                </div>

                {/* Airbnb Outbound Export Feed */}
                <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-rose-900">
                      Step 1: Your ScopeBridge Export Feed (Paste into Airbnb)
                    </span>
                    <span className="text-[10px] bg-rose-100 text-rose-800 font-mono font-bold px-1.5 py-0.5 rounded">
                      Live Feed
                    </span>
                  </div>
                  <p className="text-[10px] text-rose-800 leading-relaxed">
                    Paste this feed URL into your Airbnb listing under <strong>Pricing and availability → Calendar sync → Import calendar</strong> so Airbnb automatically blocks all dates booked on ScopeBridge.
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/calendar/export.ics?propertyId=${activeProperty?.id || 'all'}`}
                      className="w-full bg-white border border-rose-300 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-rose-950"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/calendar/export.ics?propertyId=${activeProperty?.id || 'all'}`;
                        navigator.clipboard.writeText(url);
                        alert("Copied ScopeBridge Export iCal link for Airbnb! Paste this in your Airbnb Listing under Pricing & Availability -> Calendar sync -> Import calendar.");
                      }}
                      className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-[10px] font-bold shrink-0 transition-colors cursor-pointer"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-700 block">
                    Step 2: Airbnb Inbound Listing Feeds (Imported into ScopeBridge)
                  </span>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {[
                    { name: 'Rev Lux 2', url: 'https://www.airbnb.co.za/calendar/ical/1696949048961628947.ics?t=580cc049fe804fdaa74c019f501637f5', blocked: ['2026-10-18', '2026-10-19'] },
                    { name: 'Rev Lux', url: 'https://www.airbnb.co.za/calendar/ical/1693017309367793327.ics?t=fefe7e2258034bc1a149fa38397f2008', blocked: ['2026-10-20', '2026-10-21'] },
                    { name: 'Sand Lux 1', url: 'https://www.airbnb.co.za/calendar/ical/1006524732081072772.ics?t=36390aba1d334c6baa900efbf1b52791', blocked: ['2026-10-22'] },
                    { name: 'Sand Lux 2', url: 'https://www.airbnb.co.za/calendar/ical/1005227705117080489.ics?t=218a20004e7548ddbd780eeb640df1c0', blocked: ['2026-10-23'] },
                    { name: 'Sand Lux 3', url: 'https://www.airbnb.co.za/calendar/ical/700479090582969332.ics?t=2dbcaa192a27491faf28e4e02ada3f80', blocked: ['2026-10-24'] },
                    { name: 'Sand Lux 4', url: 'https://www.airbnb.co.za/calendar/ical/1005215909417275650.ics?t=3c5461bdc8724eababff247f94060e3f', blocked: ['2026-10-26'] },
                    { name: 'Sand Lux 5', url: 'https://www.airbnb.co.za/calendar/ical/1006525012201215997.ics?t=ea6c8451d4cb4d4facc8ddfc1058b01f', blocked: ['2026-10-27'] },
                  ].map((feed, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 text-xs">
                      <div className="truncate">
                        <span className="font-bold text-slate-900 block">{feed.name}</span>
                        <span className="font-mono text-[10px] text-slate-500 truncate block max-w-[220px]">
                          {feed.url}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-mono">
                          {feed.blocked.length} blocked
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(feed.url);
                            alert(`Copied iCal link for ${feed.name} to clipboard.`);
                          }}
                          className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-bold transition-colors cursor-pointer text-[10px]"
                        >
                          Copy iCal
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* BOOKING.COM EXTRANET iCAL EXPORT & IMPORT SYNCHRONIZER */}
              <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    Booking.com Extranet 2-Way Sync (admin.booking.com)
                  </span>
                  <span className="text-[10px] bg-blue-50 text-blue-800 border border-blue-200 font-bold px-2 py-0.5 rounded-full">
                    2-Way RFC 5545 Sync
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Export ScopeBridge bookings to Booking.com, or import Booking.com reservations to lock availability in real time without enterprise API keys.
                </p>

                {/* ScopeBridge Outbound Export Link to paste into Booking.com */}
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-900">
                      Step 1: Your ScopeBridge Export Feed (Paste into Booking.com)
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold px-1.5 py-0.5 rounded">
                      Live Feed
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-800 leading-relaxed">
                    Paste this feed URL into Booking.com Extranet under <strong>Calendar & Pricing → Sync Calendars → Add calendar connection</strong> so Booking.com blocks all dates booked on ScopeBridge.
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/calendar/export.ics?propertyId=all`}
                      className="w-full bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-emerald-950"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/calendar/export.ics?propertyId=all`;
                        navigator.clipboard.writeText(url);
                        alert("Copied ScopeBridge Export iCal link! Now paste this into Booking.com Extranet under Calendar -> Sync Calendars -> Add Calendar Connection.");
                      }}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold shrink-0 transition-colors cursor-pointer"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>

                {/* Booking.com Inbound Feeds */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 block">
                    Step 2: Booking.com Extranet Inbound Links
                  </span>
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {[
                      { name: 'Rev Lux 2', bkgUrl: 'https://admin.booking.com/hotel/hoteladmin/ical.html?t=revlux2-bkg-2026' },
                      { name: 'Rev Lux', bkgUrl: 'https://admin.booking.com/hotel/hoteladmin/ical.html?t=revlux-bkg-2026' },
                      { name: 'Sand Lux 1', bkgUrl: 'https://admin.booking.com/hotel/hoteladmin/ical.html?t=sandlux1-bkg-2026' },
                      { name: 'Sand Lux 2', bkgUrl: 'https://admin.booking.com/hotel/hoteladmin/ical.html?t=sandlux2-bkg-2026' },
                      { name: 'Sand Lux 3', bkgUrl: 'https://admin.booking.com/hotel/hoteladmin/ical.html?t=sandlux3-bkg-2026' },
                      { name: 'Sand Lux 4', bkgUrl: 'https://admin.booking.com/hotel/hoteladmin/ical.html?t=sandlux4-bkg-2026' },
                      { name: 'Sand Lux 5', bkgUrl: 'https://admin.booking.com/hotel/hoteladmin/ical.html?t=sandlux5-bkg-2026' },
                    ].map((item, idx) => (
                      <div key={idx} className="p-2.5 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center justify-between gap-2 text-xs">
                        <div className="truncate">
                          <span className="font-bold text-slate-900 block">{item.name}</span>
                          <span className="font-mono text-[10px] text-blue-700 truncate block max-w-[220px]">
                            {item.bkgUrl}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(item.bkgUrl);
                              alert(`Copied Booking.com Export iCal link for ${item.name} to clipboard.`);
                            }}
                            className="px-2 py-1 bg-white border border-blue-200 rounded-lg text-blue-800 hover:bg-blue-50 font-bold transition-colors cursor-pointer text-[10px]"
                          >
                            Copy iCal
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 1.3: Add-on Sales & Extra Profit */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Add-on Sales & Ancillary Revenue Generator
                  </h3>
                </div>
                <span className="text-xs text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Total Add-on Profit: +R{totalAddonProfit}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Late Check-out</span>
                    <span className="font-bold text-emerald-800">R120 / booking</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Extends stay until 13:00 when unit is empty the following night. High adoption on Sundays.
                  </p>
                  <div className="pt-2 border-t border-slate-200 flex justify-between text-[11px]">
                    <span className="text-slate-600">Total Booked:</span>
                    <span className="font-bold text-slate-900">{bookings.filter((b) => b.addOns?.lateCheckout).length} orders (R{addonLateCheckoutRev})</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Airport Pickup</span>
                    <span className="font-bold text-emerald-800">R450 / trip</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Private vetted driver from OR Tambo or Lanseria directly to your residence.
                  </p>
                  <div className="pt-2 border-t border-slate-200 flex justify-between text-[11px]">
                    <span className="text-slate-600">Total Booked:</span>
                    <span className="font-bold text-slate-900">{bookings.filter((b) => b.addOns?.airportPickup).length} orders (R{addonAirportRev})</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Breakfast Basket</span>
                    <span className="font-bold text-emerald-800">R150 / guest</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Fresh croissants, artisanal cheeses, seasonal fruit & farm yogurt prepared by local Rosebank cafe.
                  </p>
                  <div className="pt-2 border-t border-slate-200 flex justify-between text-[11px]">
                    <span className="text-slate-600">Total Booked:</span>
                    <span className="font-bold text-slate-900">{bookings.filter((b) => b.addOns?.breakfast).length} orders (R{addonBreakfastRev})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION: OWNER BANK ACCOUNTS & PAYOUT MANAGEMENT */}
      {/* ------------------------------------------------------------- */}
      {activeCategory === 'bank_accounts' && (
        <div className="space-y-6">
          <ProfileBankAccountsManager
            accounts={
              currentUser?.bankAccounts && currentUser.bankAccounts.length > 0
                ? currentUser.bankAccounts
                : currentUser?.bankAccount
                ? [{ ...currentUser.bankAccount, id: 'primary-ba', status: currentUser.bankAccount.status || 'active', isPrimary: true }]
                : []
            }
            defaultHolderName={currentUser?.fullName || currentUser?.name || ''}
            onChange={(updatedAccounts, primaryAccount) => {
              if (currentUser && onUpdateUser) {
                onUpdateUser({
                  ...currentUser,
                  bankAccount: primaryAccount,
                  bankAccounts: updatedAccounts,
                });
              }
            }}
            title="Property Host Bank Accounts & Payout Profiles"
            subtitle="Add, edit, delete, suspend, or set pending status for your bank accounts to receive instant EFT payouts and automated reservation revenue."
          />
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION: VISUAL OCCUPANCY FLOOR PLAN MAP */}
      {/* ------------------------------------------------------------- */}
      {activeCategory === 'occupancy_map' && (
        <InteractiveFloorPlanOccupancyMap
          properties={properties}
          bookings={bookings}
          channels={channels}
          onUpdateProperties={onUpdateProperties}
          onUpdateBookings={onUpdateBookings}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION: MANAGE CURRENT PROPERTIES */}
      {/* ------------------------------------------------------------- */}
      {activeCategory === 'manage_properties' && (
        <div className="space-y-6">
          {/* Top Banner */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                  <Building2 className="w-4 h-4" />
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Manage Current Properties ({properties.length} Units)
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                View, pause, or update your active listings across all global areas and suburbs. Configure pricing, add new rooms, or connect OTA distribution channels.
              </p>
            </div>

            <button
              onClick={() => setIsAddPropertyModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Property</span>
            </button>
          </div>

          {/* Properties List */}
          <div className="space-y-4">
            {properties.map((property) => {
              const roomsCount = (property.rooms || []).length;
              const channelsCount = (property.publishedChannels || []).length;

              return (
                <div
                  key={property.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 hover:border-slate-300 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-24 h-24 object-cover rounded-xl border border-slate-200 shrink-0"
                    />

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">{property.title}</h3>
                        <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {property.unitCode}
                        </span>
                        <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                          {property.bedrooms} Bed • {property.area}
                        </span>
                        <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          ★ {property.rating} ({property.reviewCount})
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{property.address}</span>
                      </p>

                      {/* Global Area / Suburb Selector for this Property */}
                      <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                          <Globe className="w-3 h-3 text-emerald-700" />
                          <span>Area / Suburb (Global):</span>
                        </span>
                        <select
                          value={ALL_GLOBAL_AREAS.some((a) => a.area === property.area) ? property.area : '__custom__'}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '__custom__') return;
                            const found = ALL_GLOBAL_AREAS.find((a) => a.area === val);
                            onUpdateProperties((prev) =>
                              prev.map((p) =>
                                p.id === property.id
                                  ? {
                                      ...p,
                                      area: val,
                                      city: found?.city || p.city,
                                      country: found?.country || p.country,
                                      globalRegion: found?.globalRegion || p.globalRegion,
                                      flag: found?.flag || p.flag,
                                      address: found?.defaultAddress || p.address,
                                    }
                                  : p
                              )
                            );
                          }}
                          className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-[11px] font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden cursor-pointer"
                        >
                          {GLOBAL_AREA_GROUPS.map((grp) => (
                            <optgroup key={grp.groupLabel} label={grp.groupLabel}>
                              {grp.options.map((opt) => (
                                <option key={opt.area} value={opt.area}>
                                  {opt.flag} {opt.area}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                          {!ALL_GLOBAL_AREAS.some((a) => a.area === property.area) && (
                            <option value="__custom__">📍 {property.area}</option>
                          )}
                        </select>
                        <input
                          type="text"
                          value={property.area}
                          onChange={(e) => {
                            const customVal = e.target.value;
                            const matched = findGlobalAreaMeta(customVal);
                            onUpdateProperties((prev) =>
                              prev.map((p) =>
                                p.id === property.id
                                  ? {
                                      ...p,
                                      area: customVal,
                                      city: matched?.city || p.city,
                                      country: matched?.country || p.country,
                                      globalRegion: matched?.globalRegion || p.globalRegion,
                                      flag: matched?.flag || p.flag,
                                    }
                                  : p
                              )
                            );
                          }}
                          placeholder="Or type any custom global area / suburb..."
                          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-[11px] font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-hidden min-w-[210px]"
                          title="Type any custom Area / Suburb globally"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                        <span className="text-slate-600">
                          Base: <strong className="text-slate-900 font-mono">R{property.basePrice}/night</strong>
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-600">
                          Weekend: <strong className="text-slate-900 font-mono">R{property.weekendPrice}/night</strong>
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-emerald-800 font-semibold flex items-center gap-1">
                          <BedDouble className="w-3.5 h-3.5" />
                          <span>{roomsCount} Rooms Configured</span>
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-emerald-800 font-semibold flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5" />
                          <span>{channelsCount} Channels Live</span>
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
                        <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-medium border border-amber-200">
                          Solar: {property.amenities.solarInverter ? 'Solar & Inverter Active' : 'Standard Grid'}
                        </span>
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                          Smart Lock PIN: {property.checkInInstructions.smartLockPin || 'Yale Keypad'}
                        </span>
                        {property.bankAccount?.accountNumber ? (
                          <span className="bg-purple-50 text-purple-800 px-2 py-0.5 rounded font-bold border border-purple-200">
                            🏦 {property.bankAccount.bankName} (•••{property.bankAccount.accountNumber.slice(-4)})
                          </span>
                        ) : (
                          <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-medium border border-rose-200">
                            🏦 Payout Bank Not Set
                          </span>
                        )}
                      </div>

                      {/* Registered & Visible Channels + Interactive Publish Toggles + Rooms List on Property Card */}
                      <div className="pt-2 mt-1 border-t border-slate-100 space-y-2 text-[11px]">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-extrabold text-slate-700 uppercase text-[10px]">
                            🌐 Click to Publish / Reflect Property in Active Channels:
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              channels
                                .filter((c) => c.status === 'connected')
                                .forEach((c) => handlePublishProperty(property.id, c.id, true));
                            }}
                            className="px-2.5 py-0.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-[10px] font-extrabold cursor-pointer transition-colors"
                          >
                            ✓ Publish to All Active Channels
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {(channels.length > 0
                            ? channels.map((c) => ({ id: c.id, name: c.name, logo: c.logo }))
                            : [
                                { id: 'direct', name: 'ScopeBridge Direct', logo: '🏠' },
                                { id: 'airbnb', name: 'Airbnb', logo: '🏡' },
                                { id: 'booking_com', name: 'Booking.com', logo: '🌐' },
                                { id: 'lekkeslaap', name: 'LekkeSlaap', logo: '🇿🇦' },
                                { id: 'safarinow', name: 'SafariNow', logo: '🦁' },
                                { id: 'expedia', name: 'Expedia', logo: '✈️' },
                                { id: 'agoda', name: 'Agoda', logo: '🏮' },
                                { id: 'vrbo', name: 'Vrbo', logo: '🏖️' },
                                { id: 'google_rentals', name: 'Google Rentals', logo: '📍' },
                              ]
                          ).map((ch) => {
                            const isPub =
                              ch.id === 'direct' || (property.publishedChannels || []).includes(ch.id);
                            return (
                              <button
                                key={`pub-btn-${property.id}-${ch.id}`}
                                type="button"
                                onClick={() => {
                                  if (ch.id === 'direct') return;
                                  handlePublishProperty(property.id, ch.id, !isPub);
                                }}
                                className={`px-2 py-0.5 rounded-md font-bold text-[10px] border transition-all cursor-pointer flex items-center gap-1 ${
                                  isPub
                                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-400'
                                }`}
                                title={
                                  isPub
                                    ? `Published & Live on ${ch.name} — Click to unpublish`
                                    : `Click to publish "${property.title}" to ${ch.name}`
                                }
                              >
                                <span>{ch.logo}</span>
                                <span>{isPub ? '✓ ' : '+ '}{ch.name.split(' ')[0]}</span>
                              </button>
                            );
                          })}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-extrabold text-slate-500 uppercase text-[10px]">
                            📋 Owner & Property Registered In:
                          </span>
                          {Array.from(
                            new Set([
                              'direct',
                              ...(property.requestedChannels || []),
                              ...(property.publishedChannels || []),
                              'booking_com',
                              'airbnb',
                              'safarinow',
                              'lekkeslaap',
                            ])
                          ).map((ch) => (
                            <span
                              key={`reg-${ch}`}
                              className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]"
                            >
                              {ch === 'direct' ? 'ScopeBridge Direct' : ch.replace('_', '.').toUpperCase()}
                            </span>
                          ))}
                        </div>

                        {property.rooms && property.rooms.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-extrabold text-indigo-800 uppercase text-[10px]">
                              🛏️ Rooms Added ({property.rooms.length}):
                            </span>
                            {property.rooms.map((rm) => (
                              <span
                                key={rm.id}
                                className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-900 border border-indigo-200 font-bold text-[10px]"
                              >
                                {rm.name} (R{rm.basePrice})
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap lg:flex-col items-end gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <button
                      onClick={() => {
                        setEditingPropertyMediaId(property.id);
                        setMediaBankName(property.bankAccount?.bankName || 'First National Bank (FNB)');
                        setMediaAccountName(property.bankAccount?.accountName || property.ownerName || '');
                        setMediaAccountNumber(property.bankAccount?.accountNumber || '');
                        setMediaBranchCode(property.bankAccount?.branchCode || '250655');
                        setMediaAccountType(property.bankAccount?.accountType || 'Cheque / Current Account');
                        setMediaPayoutAccountType(property.payoutAccountType || property.bankAccount?.payoutDestination || 'bnb_operations');
                        const firstPromo = (property.activePromotions || property.promotions || [])[0];
                        if (firstPromo) {
                          setMediaPromoCode(firstPromo.code);
                          setMediaPromoDiscount(firstPromo.discountPercent);
                          setMediaPromoMinNights(firstPromo.minNights || 2);
                          setMediaPromoActive(firstPromo.active);
                        } else {
                          setMediaPromoCode('');
                          setMediaPromoDiscount(10);
                          setMediaPromoMinNights(2);
                          setMediaPromoActive(false);
                        }
                        setMediaImages((property.images || []).join(', '));
                        setMediaVideos((property.videos || []).join(', '));
                        setMediaRooms(
                          (property.rooms || []).map((r) => ({
                            id: r.id,
                            name: r.name,
                            images: (r.images || []).join(', '),
                            videos: (r.videos || []).join(', '),
                          }))
                        );
                      }}
                      className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Configure Bank Account, Promos &amp; Photos ({property.images?.length || 0} pics)</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedPropertyId(property.id);
                        setActiveCategory('rooms_pricing');
                      }}
                      className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <BedDouble className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Manage Rooms & Pricing ({roomsCount})</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedPropertyId(property.id);
                        setActiveCategory('channels_gateways');
                      }}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Globe className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Channels & Publishing</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedPropertyId(property.id);
                        setActiveCategory('operations');
                      }}
                      className="px-3 py-1 text-emerald-700 hover:text-emerald-900 text-xs font-extrabold cursor-pointer"
                    >
                      View Calendar &amp; Bookings →
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm(`Are you absolutely sure you want to remove the property "${property.title}"? This will permanently delete the property, all its configured rooms, and listings.`)) {
                          onUpdateProperties(prev => prev.filter(p => p.id !== property.id));
                          if (selectedPropertyId === property.id && properties.length > 1) {
                            const remaining = properties.filter(p => p.id !== property.id);
                            setSelectedPropertyId(remaining[0].id);
                          }
                        }
                      }}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-[11px] font-bold flex items-center gap-1.5 w-full justify-center transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Property</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* EDIT BANK ACCOUNT & MEDIA GALLERY MODAL */}
          {editingPropertyMediaId && (() => {
            const prop = properties.find((p) => p.id === editingPropertyMediaId);
            if (!prop) return null;

            const handleSaveMedia = (e: React.FormEvent) => {
              e.preventDefault();
              const parsedImages = parseMediaUrls(mediaImages);
              const parsedVideos = parseMediaUrls(mediaVideos);

              const newPromos = mediaPromoCode.trim()
                ? [
                    {
                      code: mediaPromoCode.trim().toUpperCase(),
                      discountPercent: Number(mediaPromoDiscount) || 10,
                      active: mediaPromoActive,
                      minNights: Number(mediaPromoMinNights) || 1,
                      description: `Host ${mediaPromoDiscount}% Discount`,
                    },
                  ]
                : [];

              onUpdateProperties((prev) =>
                prev.map((p) => {
                  if (p.id === editingPropertyMediaId) {
                    const updatedRooms = (p.rooms || []).map((room) => {
                      const roomMedia = mediaRooms.find((rm) => rm.id === room.id);
                      if (!roomMedia) return room;
                      const rImgs = parseMediaUrls(roomMedia.images);
                      const rVids = parseMediaUrls(roomMedia.videos);
                      return {
                        ...room,
                        name: roomMedia.name || room.name,
                        images: rImgs.length > 0 ? rImgs : room.images,
                        videos: rVids,
                      };
                    });

                    return {
                      ...p,
                      bankAccount: {
                        bankName: mediaBankName,
                        accountName: mediaAccountName,
                        accountNumber: mediaAccountNumber,
                        branchCode: mediaBranchCode,
                        accountType: mediaAccountType,
                        payoutDestination: mediaPayoutAccountType,
                      },
                      payoutAccountType: mediaPayoutAccountType,
                      promotions: newPromos,
                      activePromotions: newPromos.filter((pr) => pr.active),
                      images: parsedImages.length > 0 ? parsedImages : p.images,
                      videos: parsedVideos,
                      photoCount: parsedImages.length > 0 ? parsedImages.length : p.photoCount,
                      rooms: updatedRooms,
                    };
                  }
                  return p;
                })
              );
              setEditingPropertyMediaId(null);
            };

            return (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
                <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                  {/* Modal Header */}
                  <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-purple-900 text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-purple-800/80 text-white flex items-center justify-center font-bold">
                        <CreditCard className="w-5 h-5 text-purple-200" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold">{prop.title} - Bank Details, Promos &amp; Media</h3>
                        <p className="text-xs text-purple-200">Configure owner payout bank account, promotions, and property pictures</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingPropertyMediaId(null)}
                      className="p-2 text-purple-200 hover:text-white hover:bg-purple-800 rounded-xl transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveMedia} className="p-6 overflow-y-auto space-y-6 text-xs">
                    {/* Bank Account Details & Payout Account Choice */}
                    <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-purple-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-purple-700" />
                          <span>Owner Bank Account (Payouts &amp; Direct Guest EFT)</span>
                        </h4>
                        <span className="text-[10px] font-bold text-purple-800 bg-purple-200/70 px-2 py-0.5 rounded">
                          Link Display
                        </span>
                      </div>

                      {/* Choose Which Account Must Be Displayed */}
                      <div>
                        <label className="block text-[11px] font-bold text-purple-950 mb-1 uppercase tracking-wider">
                          1. Choose Which Account Must Be Displayed for Guest Payments on Booking Link
                        </label>
                        <select
                          value={mediaPayoutAccountType}
                          onChange={(e) => setMediaPayoutAccountType(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl border border-purple-300 text-xs font-bold text-purple-950 bg-white focus:ring-2 focus:ring-purple-500 outline-hidden"
                        >
                          <option value="bnb_operations">🏦 BnB Operations Account (Default Payout)</option>
                          <option value="owner_payout">👤 Host Direct Personal Payout Account</option>
                          <option value="holding_escrow">🛡️ Absa Verified Holding Escrow Account</option>
                        </select>
                      </div>

                      {/* Quick Autofill from Saved Profiles */}
                      {currentUser?.bankAccounts && currentUser.bankAccounts.length > 0 && (
                        <div className="p-2.5 bg-white rounded-xl border border-purple-200 space-y-1">
                          <span className="text-[10px] font-bold text-slate-500 block">
                            Quick Auto-Fill from Saved Profile Bank Accounts:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {currentUser.bankAccounts.map((acc, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setMediaBankName(acc.bankName);
                                  setMediaAccountName(acc.accountName);
                                  setMediaAccountNumber(acc.accountNumber);
                                  setMediaBranchCode(acc.branchCode);
                                  setMediaAccountType(acc.accountType || 'Cheque / Current Account');
                                }}
                                className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                              >
                                {acc.bankName} (•••{acc.accountNumber.slice(-4)})
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                            Bank Name
                          </label>
                          <select
                            value={mediaBankName}
                            onChange={(e) => setMediaBankName(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-purple-500 outline-hidden"
                          >
                            <option value="First National Bank (FNB)">First National Bank (FNB)</option>
                            <option value="Standard Bank">Standard Bank</option>
                            <option value="Absa Bank">Absa Bank</option>
                            <option value="Nedbank">Nedbank</option>
                            <option value="Capitec Bank">Capitec Bank</option>
                            <option value="TymeBank">TymeBank</option>
                            <option value="Investec">Investec</option>
                            <option value="Barclays / HSBC / International">Barclays / HSBC / International</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                            Account Type
                          </label>
                          <select
                            value={mediaAccountType}
                            onChange={(e) => setMediaAccountType(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-purple-500 outline-hidden"
                          >
                            <option value="Cheque / Current Account">Cheque / Current Account</option>
                            <option value="Savings Account">Savings Account</option>
                            <option value="Business Account">Business Account</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                            Account Holder Name
                          </label>
                          <input
                            type="text"
                            required
                            value={mediaAccountName}
                            onChange={(e) => setMediaAccountName(e.target.value)}
                            placeholder="e.g. Nhlanhla Mdluli Trading"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-purple-500 outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                            Branch Code
                          </label>
                          <input
                            type="text"
                            value={mediaBranchCode}
                            onChange={(e) => setMediaBranchCode(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-800 bg-white focus:ring-2 focus:ring-purple-500 outline-hidden"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                          Account Number
                        </label>
                        <input
                          type="text"
                          required
                          value={mediaAccountNumber}
                          onChange={(e) => setMediaAccountNumber(e.target.value)}
                          placeholder="e.g. 62890192837"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-800 bg-white focus:ring-2 focus:ring-purple-500 outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Host Promotions & Discount Code Builder */}
                    <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-amber-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-700" />
                          <span>Owner Promotions &amp; Promo Code Configuration</span>
                        </h4>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={mediaPromoActive}
                            onChange={(e) => setMediaPromoActive(e.target.checked)}
                            className="rounded text-amber-600 focus:ring-amber-500"
                          />
                          <span className="text-[11px] font-bold text-amber-900">
                            {mediaPromoActive ? '🟢 Promotion Active' : '⚪ Promotion Inactive'}
                          </span>
                        </label>
                      </div>

                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Promotions are strictly disabled on the guest booking screen by default. Enter and check "Promotion Active" below only if you wish to offer a discount code for this property.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                            Promo Code (e.g. HOST15)
                          </label>
                          <input
                            type="text"
                            value={mediaPromoCode}
                            onChange={(e) => setMediaPromoCode(e.target.value)}
                            placeholder="e.g. HOST10"
                            className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-mono font-bold text-slate-800 bg-white uppercase"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                            Discount (%)
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={90}
                            value={mediaPromoDiscount}
                            onChange={(e) => setMediaPromoDiscount(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold text-slate-800 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                            Min Nights Stay
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={30}
                            value={mediaPromoMinNights}
                            onChange={(e) => setMediaPromoMinNights(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold text-slate-800 bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Property Media URLs */}
                    <div className="space-y-4">
                      <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span>Property Pictures Gallery & Video Tours</span>
                      </h4>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                            Property Photos — Add, Update or Delete ({parseMediaUrls(mediaImages).length} Photos)
                          </label>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const sampleImg = 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80';
                                const list = parseMediaUrls(mediaImages);
                                setMediaImages([...list, sampleImg].join(', '));
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[10px] font-bold cursor-pointer"
                            >
                              + Add Photo URL
                            </button>
                            <label className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors">
                              <Upload className="w-3 h-3" />
                              <span>Upload Photo from Device</span>
                              <input
                                type="file"
                                accept="image/*,.heic,.heif,.jpg,.jpeg,.png,.webp,.gif,.svg,.bmp,.avif"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const dataUrl = await compressImageToDataUrl(file);
                                  setMediaImages((prev) => (prev.trim() ? `${prev.trim()}\n${dataUrl}` : dataUrl));
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        {/* Interactive Property Photo List (Update URL, Replace File, Delete Photo) */}
                        <div className="space-y-1.5 mb-2 max-h-48 overflow-y-auto pr-1">
                          {parseMediaUrls(mediaImages).map((imgUrl, idx) => (
                            <div
                              key={`prop-edit-img-${idx}`}
                              className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200"
                            >
                              <img
                                src={imgUrl}
                                alt={`Preview ${idx + 1}`}
                                className="w-14 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900">
                                    {idx === 0 ? 'Cover Photo' : `Photo #${idx + 1}`}
                                  </span>
                                  {idx > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const list = parseMediaUrls(mediaImages);
                                        const [chosen] = list.splice(idx, 1);
                                        setMediaImages([chosen, ...list].join(', '));
                                      }}
                                      className="text-[9px] font-bold text-purple-700 hover:underline cursor-pointer"
                                    >
                                      Set as Cover
                                    </button>
                                  )}
                                </div>
                                <input
                                  type="text"
                                  value={imgUrl}
                                  onChange={(e) => {
                                    const list = parseMediaUrls(mediaImages);
                                    list[idx] = e.target.value;
                                    setMediaImages(list.join(', '));
                                  }}
                                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-mono text-slate-800"
                                  placeholder="Update property photo URL..."
                                />
                              </div>
                              <label
                                className="p-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 rounded-lg cursor-pointer"
                                title="Replace Property Photo"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <input
                                  type="file"
                                  accept="image/*,.heic,.heif,.jpg,.jpeg,.png,.webp,.gif,.svg,.bmp,.avif"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const dataUrl = await compressImageToDataUrl(file);
                                    const list = parseMediaUrls(mediaImages);
                                    list[idx] = dataUrl;
                                    setMediaImages(list.join('\n'));
                                  }}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  const list = parseMediaUrls(mediaImages).filter((_, i) => i !== idx);
                                  setMediaImages(list.join(', '));
                                }}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg cursor-pointer"
                                title="Delete Property Photo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <textarea
                          rows={2}
                          value={mediaImages}
                          onChange={(e) => setMediaImages(e.target.value)}
                          placeholder="https://image1.jpg, https://image2.jpg"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-purple-500 outline-hidden"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                            Property Video Tour URLs (Comma-separated MP4/YouTube/Vimeo)
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const sampleVid = 'https://assets.mixkit.co/videos/preview/mixkit-modern-apartment-interior-tour-42023-large.mp4';
                              setMediaVideos((prev) => (prev.trim() ? `${prev.trim()}, ${sampleVid}` : sampleVid));
                            }}
                            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Video className="w-3 h-3" />
                            <span>+ Add Sample HD Tour Video</span>
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={mediaVideos}
                          onChange={(e) => setMediaVideos(e.target.value)}
                          placeholder="https://example.com/tour.mp4"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-purple-500 outline-hidden"
                        />
                      </div>

                      {/* Video Player Preview Section */}
                      {mediaVideos.trim().length > 0 && (
                        <div className="p-3 bg-slate-900 text-white rounded-2xl space-y-2">
                          <span className="font-bold text-[11px] text-purple-300 uppercase tracking-wider block">
                            🎥 Live Video Preview
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {parseMediaUrls(mediaVideos)
                              .map((vUrl, idx) => (
                                <div key={idx} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
                                  {vUrl.includes('mp4') || vUrl.includes('mixkit') || vUrl.includes('video') ? (
                                    <video src={vUrl} controls className="w-full h-32 object-cover" />
                                  ) : (
                                    <div className="p-3 text-center space-y-1">
                                      <p className="text-[10px] text-slate-300 truncate">{vUrl}</p>
                                      <a
                                        href={vUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] text-purple-300 underline font-bold inline-flex items-center gap-1"
                                      >
                                        <span>Open Video Link</span>
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Room-by-Room Pictures & Videos Section */}
                      {mediaRooms.length > 0 && (
                        <div className="pt-3 border-t border-slate-200 space-y-3">
                          <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                            <BedDouble className="w-4 h-4 text-indigo-600" />
                            <span>Individual Room Photos & Video Tours — Add, Update or Delete ({mediaRooms.length} Rooms)</span>
                          </h4>
                          <div className="space-y-3">
                            {mediaRooms.map((rm, rIdx) => {
                              const roomPhotoArray = parseMediaUrls(rm.images);
                              return (
                                <div key={rm.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                                  <div className="flex items-center justify-between">
                                    <span className="font-extrabold text-slate-800 text-xs">{rm.name}</span>
                                    <span className="text-[10px] font-mono text-slate-400">{roomPhotoArray.length} Room Photos</span>
                                  </div>
                                  <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                      <label className="text-[10px] font-bold text-slate-600 uppercase">
                                        Room Photos (Add, Update URL, or Delete)
                                      </label>
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const sample = 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80';
                                            setMediaRooms((prev) =>
                                              prev.map((item, i) =>
                                                i === rIdx
                                                  ? { ...item, images: [...parseMediaUrls(item.images), sample].join(', ') }
                                                  : item
                                              )
                                            );
                                          }}
                                          className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-[10px] font-bold cursor-pointer"
                                        >
                                          + Add Room Photo
                                        </button>
                                        <label className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer">
                                          <Upload className="w-3 h-3" />
                                          <span>Upload Room Photo</span>
                                          <input
                                            type="file"
                                            accept="image/*,.heic,.heif,.jpg,.jpeg,.png,.webp,.gif,.svg,.bmp,.avif"
                                            className="hidden"
                                            onChange={async (e) => {
                                              const file = e.target.files?.[0];
                                              if (!file) return;
                                              const dataUrl = await compressImageToDataUrl(file);
                                              setMediaRooms((prev) =>
                                                prev.map((item, i) =>
                                                  i === rIdx
                                                    ? { ...item, images: item.images.trim() ? `${item.images.trim()}\n${dataUrl}` : dataUrl }
                                                    : item
                                                )
                                              );
                                            }}
                                          />
                                        </label>
                                      </div>
                                    </div>

                                    {/* Visual Room Photos with Update & Delete */}
                                    <div className="space-y-1.5 mb-2">
                                      {roomPhotoArray.map((rImg, rpIdx) => (
                                        <div
                                          key={`rm-edit-${rIdx}-${rpIdx}`}
                                          className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-slate-200"
                                        >
                                          <img
                                            src={rImg}
                                            alt="Room"
                                            className="w-12 h-9 rounded object-cover border border-slate-200 shrink-0"
                                          />
                                          <input
                                            type="text"
                                            value={rImg}
                                            onChange={(e) => {
                                              const updatedList = [...roomPhotoArray];
                                              updatedList[rpIdx] = e.target.value;
                                              setMediaRooms((prev) =>
                                                prev.map((item, i) =>
                                                  i === rIdx ? { ...item, images: updatedList.join(', ') } : item
                                                )
                                              );
                                            }}
                                            className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] font-mono text-slate-800"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updatedList = roomPhotoArray.filter((_, i) => i !== rpIdx);
                                              setMediaRooms((prev) =>
                                                prev.map((item, i) =>
                                                  i === rIdx ? { ...item, images: updatedList.join(', ') } : item
                                                )
                                              );
                                            }}
                                            className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded cursor-pointer"
                                            title="Delete Room Photo"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>

                                    <input
                                      type="text"
                                      value={rm.images}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setMediaRooms((prev) =>
                                          prev.map((item, i) => (i === rIdx ? { ...item, images: val } : item))
                                        );
                                      }}
                                      placeholder="https://room-photo1.jpg, https://room-photo2.jpg"
                                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                                    />
                                  </div>
                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <label className="text-[10px] font-bold text-slate-600 uppercase">Room Video Tour URLs</label>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const sampleVid = 'https://assets.mixkit.co/videos/preview/mixkit-modern-apartment-interior-tour-42023-large.mp4';
                                          setMediaRooms((prev) =>
                                            prev.map((item, i) =>
                                              i === rIdx
                                                ? { ...item, videos: item.videos.trim() ? `${item.videos.trim()}, ${sampleVid}` : sampleVid }
                                                : item
                                            )
                                          );
                                        }}
                                        className="px-2 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                      >
                                        <Video className="w-3 h-3" />
                                        <span>+ Sample Room Video</span>
                                      </button>
                                    </div>
                                    <input
                                      type="text"
                                      value={rm.videos}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setMediaRooms((prev) =>
                                          prev.map((item, i) => (i === rIdx ? { ...item, videos: val } : item))
                                        );
                                      }}
                                      placeholder="https://example.com/room-tour.mp4"
                                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Modal Footer */}
                    <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingPropertyMediaId(null)}
                        className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-purple-800 hover:bg-purple-900 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Save Bank & Media</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION: ROOMS & ROOM PRICING MANAGER */}
      {/* ------------------------------------------------------------- */}
      {activeCategory === 'rooms_pricing' && (
        <RoomsPricingManager
          properties={properties}
          channels={channels}
          onUpdateProperties={onUpdateProperties}
          onPublishRoomToChannel={handlePublishRoom}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION: CHANNELS & PAYMENT GATEWAYS MANAGER */}
      {/* ------------------------------------------------------------- */}
      {activeCategory === 'channels_gateways' && (
        <OwnerChannelGatewayManager
          properties={properties}
          channels={channels}
          gateways={effectiveGateways}
          requests={effectiveRequests}
          onSubmitRequest={handleRequestSubmit}
          onPublishPropertyToChannel={handlePublishProperty}
          onBookProperty={onBookProperty}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2: OPERATIONS & UNIVERSAL CALENDAR / PLANNER          */}
      {/* ------------------------------------------------------------- */}
      {activeCategory === 'operations' && (
        <div className="space-y-6">
          <UniversalCalendarPlanner
            currentRole="owner"
            currentUser={
              currentUser || {
                id: 'owner-1',
                name: activeProperty.ownerName || 'Property Owner',
                fullName: activeProperty.ownerName || 'Property Owner',
                username: 'owner',
                role: 'owner',
                email: 'owner@scopebridg.co.za',
                phone: activeProperty.ownerWhatsApp || '+27 69 497 7018',
                avatar: '',
                title: 'Executive Property Host',
                location: activeProperty.area || '',
                registeredHolidayChannels: ['direct', 'airbnb', 'booking_com', 'expedia', 'lekkeslaap', 'agoda', 'vrbo', 'safarinow', 'google_rentals'],
              }
            }
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feature 2.1: Calendar Sync + Block Dates */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Booking Calendar &amp; Block Dates ({activeProperty.title})
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={calendarMonth}
                    onChange={(e) => setCalendarMonth(e.target.value as any)}
                    className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                  >
                    <option value="2026-09">September 2026</option>
                    <option value="2026-10">October 2026</option>
                    <option value="2026-11">November 2026</option>
                    <option value="2026-12">December 2026</option>
                  </select>
                  <span className="text-[11px] bg-rose-50 text-rose-800 font-bold px-2 py-0.5 rounded-full border border-rose-200">
                    {activeProperty.blockedDates.length} blocked
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500">
                Click any date to block or unblock it for owner stays or maintenance. Changes sync immediately to Cloud Database, Airbnb &amp; Booking.com.
              </p>

              {/* Interactive Full-Month Date Blocker Grid */}
              <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                  <span key={d} className="text-[10px] text-slate-400 font-bold py-1">
                    {d}
                  </span>
                ))}
                {(() => {
                  const daysInMonth =
                    calendarMonth === '2026-09' || calendarMonth === '2026-11' ? 30 : 31;
                  return Array.from({ length: daysInMonth }, (_, i) => {
                    const dayNum = i + 1;
                    const dateStr = `${calendarMonth}-${dayNum < 10 ? '0' + dayNum : dayNum}`;
                    const isBlocked = activeProperty.blockedDates.includes(dateStr);
                    const isBooked = bookings.some(
                      (b) =>
                        b.propertyId === activeProperty.id &&
                        b.checkInDate <= dateStr &&
                        b.checkOutDate >= dateStr
                    );

                    return (
                      <button
                        key={dateStr}
                        type="button"
                        disabled={isBooked}
                        onClick={() => handleToggleBlockDate(dateStr)}
                        className={`p-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                          isBlocked
                            ? 'bg-rose-100 border-rose-300 text-rose-800'
                            : isBooked
                            ? 'bg-emerald-100 border-emerald-300 text-emerald-900 cursor-not-allowed'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-500 hover:bg-emerald-50/30'
                        }`}
                      >
                        <span className="font-bold">{dayNum}</span>
                        <span className="block text-[8px] uppercase mt-0.5 font-bold">
                          {isBlocked ? 'Blocked' : isBooked ? 'Booked' : `R${activeProperty.basePrice}`}
                        </span>
                      </button>
                    );
                  });
                })()}
              </div>

              <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-white border border-slate-300 rounded"></span> Available
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-emerald-100 rounded"></span> Booked by Guest
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-rose-100 rounded"></span> Blocked for Owner
                </span>
              </div>
            </div>

            {/* Feature 2.2: Smart Lock / Access Codes Generator */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Smart Lock & Digital Door PIN Generator
                  </h3>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Yale & TTLock Cloud Sync
                </span>
              </div>

              <p className="text-xs text-slate-500">
                Generate time-bounded digital passcodes that activate strictly at 14:00 check-in and auto-expire at 10:00 check-out.
              </p>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-center">
                <span className="text-[11px] text-slate-500 uppercase font-bold">
                  Active Door PIN ({activeProperty.unitCode})
                </span>
                <div className="text-3xl font-mono font-black text-slate-900 tracking-wider">
                  {generatedCode}
                </div>
                <p className="text-[11px] text-slate-500">
                  Valid for current reservation: Active from 14:00 check-in to 10:00 checkout
                </p>

                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCode);
                      setCodeCopied(true);
                      setTimeout(() => setCodeCopied(false), 2000);
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{codeCopied ? 'Copied!' : 'Copy Code'}</span>
                  </button>

                  <button
                    onClick={handleGenerateNewPin}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Generate New PIN
                  </button>
                </div>
              </div>

              <div className="text-xs text-slate-500 p-3 bg-emerald-50 rounded-xl border border-emerald-100 space-y-1">
                <span className="font-bold text-emerald-950">Auto-sent on WhatsApp:</span>
                <p className="text-[11px] text-emerald-800">
                  The system automatically messages this code to the guest 2 hours before arrival once ID is verified.
                </p>
              </div>
            </div>

            {/* Feature 2.3: Automated Messages on WhatsApp */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Automated Messages Engine (WhatsApp & SMS)
                  </h3>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  WhatsApp Cloud API
                </span>
              </div>

              <p className="text-xs text-slate-500">
                Check-in code, WiFi password, directions from Republic Rd, and checkout rules sent automatically.
              </p>

              <div className="flex gap-2 text-xs">
                <button
                  onClick={() => setActiveMsgTemplate('checkin')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    activeMsgTemplate === 'checkin'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Check-in Code
                </button>
                <button
                  onClick={() => setActiveMsgTemplate('wifi')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    activeMsgTemplate === 'wifi'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  WiFi & Loadshedding
                </button>
                <button
                  onClick={() => setActiveMsgTemplate('checkout')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    activeMsgTemplate === 'checkout'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Checkout Rules
                </button>
              </div>

              <div className="p-3.5 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs whitespace-pre-wrap leading-relaxed">
                {activeMsgTemplate === 'checkin' &&
                  `Hi {{guest_name}}! Welcome to ${activeProperty.title}.
🔑 Door PIN: ${activeProperty.checkInInstructions.smartLockPin}
🚗 Parking: ${activeProperty.checkInInstructions.parkingBay}
🏢 Gate: ${activeProperty.checkInInstructions.gateCode}
📍 Prime location with 24/7 security. Need anything? Just reply here!`}

                {activeMsgTemplate === 'wifi' &&
                  `Hi {{guest_name}}!
📶 High-Speed Fibre WiFi: '${activeProperty.checkInInstructions.wifiName}'
🔒 Password: '${activeProperty.checkInInstructions.wifiPassword}'
⚡ Our solar inverter keeps the WiFi and TV on during load shedding!`}

                {activeMsgTemplate === 'checkout' &&
                  `Hi {{guest_name}}, hope you enjoyed your stay!
Checkout is at 10:00 AM.
1. Pull front door firmly shut to lock Yale lock.
2. Leave trash in kitchen bin.
3. Need late checkout until 13:00? Reply 'LATE' (R120). Safe travels!`}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <span>Send test to:</span>
                  <input
                    type="text"
                    value={testSendNumber}
                    onChange={(e) => setTestSendNumber(e.target.value)}
                    className="p-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                  />
                </div>
                <button
                  onClick={handleSendTestMessage}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  <span>Test WhatsApp</span>
                </button>
              </div>

              {messageSentFeedback && (
                <p className="text-xs text-emerald-700 font-bold">{messageSentFeedback}</p>
              )}
            </div>

            {/* Feature 2.4: Cleaning Tasks Auto-Assignment */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Cleaning Tasks Auto-Assignment
                  </h3>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Auto Trigger on Checkout
                </span>
              </div>

              <p className="text-xs text-slate-500">
                Automatically notifies and schedules our certified hospitality cleaners immediately when a guest checks out at 10:00.
              </p>

              <div className="space-y-3 text-xs">
                {cleaningTasks.map((task) => (
                  <div key={task.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900">{task.propertyTitle}</span>
                        <span className="text-[10px] text-slate-500 block">Cleaner: {task.cleanerName} ({task.cleanerPhone})</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          task.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : task.status === 'in_progress'
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {task.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {task.checklist.slice(0, 3).map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-slate-600">
                          <input
                            type="checkbox"
                            checked={item.done}
                            onChange={() => {
                              onUpdateCleanings((prev) =>
                                prev.map((t) =>
                                  t.id === task.id
                                    ? {
                                        ...t,
                                        checklist: t.checklist.map((c, idx) =>
                                          idx === i ? { ...c, done: !c.done } : c
                                        ),
                                      }
                                    : t
                                )
                              );
                            }}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className={item.done ? 'line-through text-slate-400' : ''}>
                            {item.item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION 3: GUEST MANAGEMENT */}
      {/* ------------------------------------------------------------- */}
      {activeCategory === 'guests' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feature 3.1: ID Verification + Deposit */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    ID Verification & Security Deposit (R1,000)
                  </h3>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded">
                  Property Protection
                </span>
              </div>

              <p className="text-xs text-slate-500">
                Protect your executive unit against damages. Validates South African ID book/card or international passport prior to door code transmission.
              </p>

              <div className="space-y-2 text-xs">
                {bookings.map((booking) => (
                  <div key={booking.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">{booking.guestName}</span>
                      <span className="text-[10px] text-slate-500">
                        {booking.checkInDate} • {booking.propertyTitle.split(' ')[0]}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          booking.idVerified
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {booking.idVerified ? 'RSA ID Verified' : 'ID Pending'}
                      </span>
                      <span className="text-[10px] bg-slate-200 text-slate-800 font-semibold px-2 py-0.5 rounded">
                        R1,000 Deposit Held
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature 3.2: Reviews Manager */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Reviews Manager & Auto-Request
                  </h3>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Auto-WhatsApp Review Request
                </span>
              </div>

              <p className="text-xs text-slate-500">
                Reply to verified guests from one central dashboard. Fast replies boost your ranking on local searches.
              </p>

              <div className="space-y-3 text-xs max-h-[360px] overflow-y-auto">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{rev.guestName}</span>
                      <span className="text-amber-500 font-bold">★ {rev.rating}.0</span>
                    </div>
                    <p className="text-slate-600 italic">"{rev.text}"</p>

                    {rev.hostReply ? (
                      <div className="p-2 bg-white rounded border border-emerald-200 text-[11px] text-slate-700">
                        <strong className="text-emerald-800">Your reply: </strong>
                        {rev.hostReply}
                      </div>
                    ) : (
                      <div className="space-y-1.5 pt-1">
                        <input
                          type="text"
                          placeholder="Type your response to guest..."
                          value={replyDrafts[rev.id] || ''}
                          onChange={(e) =>
                            setReplyDrafts({ ...replyDrafts, [rev.id]: e.target.value })
                          }
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                        <button
                          onClick={() => handleSendReviewReply(rev.id)}
                          className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          Post Reply
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION 4: GROWTH */}
      {/* ------------------------------------------------------------- */}
      {activeCategory === 'growth' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Feature 4.1: Reports / Analytics */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Global Portfolio Occupancy & Earnings Report
                  </h3>
                </div>
                <span className="text-xs text-emerald-800 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  Average Occupancy: 84%
                </span>
              </div>

              <p className="text-xs text-slate-500">
                Which month makes the most money across our portfolio? September and November peak due to business conferences at Absa and year-end travelers.
              </p>

              {/* Monthly Earnings Bar Visualization */}
              <div className="space-y-2 pt-2">
                {[
                  { month: 'Jun 2026', revenue: 38400, occupancy: 76 },
                  { month: 'Jul 2026', revenue: 42100, occupancy: 81 },
                  { month: 'Aug 2026', revenue: 46800, occupancy: 85 },
                  { month: 'Sep 2026 (Current)', revenue: 52400, occupancy: 89, isPeak: true },
                  { month: 'Oct 2026 (Projected)', revenue: 49500, occupancy: 86 },
                ].map((item) => (
                  <div key={item.month} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>{item.month}</span>
                      <span>
                        <strong className="text-slate-900">R{item.revenue.toLocaleString()}</strong> ({item.occupancy}% occupancy)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${(item.revenue / 55000) * 100}%` }}
                        className={`h-full rounded-full ${
                          item.isPeak ? 'bg-emerald-600' : 'bg-slate-700'
                        }`}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Channel Split Breakdown */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs text-center">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Direct Website</span>
                  <span className="font-extrabold text-emerald-800 text-sm">34%</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Airbnb</span>
                  <span className="font-extrabold text-slate-900 text-sm">42%</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Booking.com</span>
                  <span className="font-extrabold text-slate-900 text-sm">24%</span>
                </div>
              </div>
            </div>

            {/* Feature 4.2: Promo Codes (OXFORD10) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Promo Codes & Direct Booking
                  </h3>
                </div>
              </div>

              <p className="text-xs text-slate-500">
                Reward repeat clients with discount codes to avoid third-party OTA fees.
              </p>

              {/* Active codes */}
              <div className="space-y-2 text-xs">
                {promos.map((p) => (
                  <div key={p.code} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-slate-900 text-sm">{p.code}</span>
                      <span className="text-[10px] text-slate-500 block">{p.description}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-800 block">-{p.discountPercent}%</span>
                      <span className="text-[10px] text-slate-400">{p.uses} uses</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Create new code */}
              <form onSubmit={handleCreatePromo} className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <span className="font-bold text-slate-800 text-[11px] block">Create New Promo Code</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="CODE (e.g. OXFORD15)"
                    value={newPromoCode}
                    onChange={(e) => setNewPromoCode(e.target.value)}
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono uppercase"
                  />
                  <select
                    value={newPromoDiscount}
                    onChange={(e) => setNewPromoDiscount(Number(e.target.value))}
                    className="p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    <option value={5}>5%</option>
                    <option value={10}>10%</option>
                    <option value={15}>15%</option>
                    <option value={20}>20%</option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Short description..."
                  value={newPromoDesc}
                  onChange={(e) => setNewPromoDesc(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
                <button
                  type="submit"
                  disabled={!newPromoCode}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition-colors disabled:opacity-40"
                >
                  Create Promo Code
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION: STAFF HR & PAYROLL */}
      {/* ------------------------------------------------------------- */}
      {activeCategory === 'staff_payroll' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" /> Staff HR & Payroll Management
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage certified property staff, create new employee profiles, pend or activate staff, and process EFT paystubs.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-emerald-50 text-emerald-800 text-xs font-extrabold px-3 py-1.5 rounded-xl border border-emerald-200">
                  Total Monthly Payroll: R{staffList
                    .filter((s: any) => s.status === 'active' || s.status === 'pending')
                    .reduce((sum: number, s: any) => sum + (s.monthlyGrossZar || (s.hourlyRateZar * s.hoursWorked)), 0)
                    .toLocaleString()} ZAR
                </span>

                <button
                  onClick={() => setIsAddStaffOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>+ Add New Employee</span>
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 text-xs font-semibold overflow-x-auto pb-1">
              <button
                onClick={() => setStaffStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  staffStatusFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Staff ({staffList.length})
              </button>
              <button
                onClick={() => setStaffStatusFilter('active')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  staffStatusFilter === 'active'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/50'
                }`}
              >
                Active ({staffList.filter((s: any) => s.status === 'active').length})
              </button>
              <button
                onClick={() => setStaffStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  staffStatusFilter === 'pending'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/50'
                }`}
              >
                Pending ({staffList.filter((s: any) => s.status === 'pending').length})
              </button>
              <button
                onClick={() => setStaffStatusFilter('on_leave')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  staffStatusFilter === 'on_leave'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200/50'
                }`}
              >
                On Leave ({staffList.filter((s: any) => s.status === 'on_leave').length})
              </button>
            </div>

            {/* Staff list cards */}
            {staffList.filter((s: any) => staffStatusFilter === 'all' ? true : s.status === staffStatusFilter).length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 font-bold text-xs">
                No employees match the selected filter. Click "+ Add New Employee" above to register staff.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {staffList
                  .filter((s: any) => staffStatusFilter === 'all' ? true : s.status === staffStatusFilter)
                  .map((staff: any) => (
                    <div key={staff.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 shadow-2xs hover:border-slate-300 transition-all">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-extrabold text-slate-900 text-sm block leading-tight">{staff.name}</span>
                          <span className="text-xs text-emerald-800 font-semibold mt-0.5 block">{staff.role}</span>
                          <span className="text-[11px] text-slate-400 font-mono block mt-0.5">{staff.propertyAssigned}</span>
                        </div>
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shrink-0 ${
                          staff.status === 'active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          staff.status === 'pending' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          staff.status === 'on_leave' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          'bg-slate-200 text-slate-600'
                        }`}>
                          {staff.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Rate / Hour</span>
                          <span className="font-bold text-slate-900">R{staff.hourlyRateZar} ZAR</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Shift Hours</span>
                          <span className="font-bold text-slate-900">{staff.hoursWorked} hrs</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Est. Monthly Gross</span>
                          <span className="font-extrabold text-emerald-800">R{(staff.monthlyGrossZar || (staff.hourlyRateZar * staff.hoursWorked)).toLocaleString()} ZAR</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Last Paid</span>
                          <span className="font-mono text-[11px] text-slate-700">{staff.lastPaid || '2026-08-31'}</span>
                        </div>
                      </div>

                      {/* Kiosk Mode Login Credentials Card for Staff Created by Owner */}
                      <div className="p-2.5 rounded-xl bg-teal-50/80 border border-teal-200 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Monitor className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                          <span className="font-bold text-teal-950">Kiosk Login:</span>
                          <code className="px-1.5 py-0.5 bg-white rounded border border-teal-200 font-mono font-extrabold text-teal-900">
                            {staff.username || staff.name?.toLowerCase().replace(/[^a-z0-9]+/g, '_')}
                          </code>
                          <span className="text-teal-700">• Pw:</span>
                          <code className="px-1.5 py-0.5 bg-white rounded border border-teal-200 font-mono font-bold text-slate-800">
                            {staff.password || 'Kiosk@2026!'}
                          </code>
                        </div>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-teal-600 text-white">
                          Kiosk Access Enabled
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-xs">
                        <span className="text-[11px] text-slate-500 font-semibold">{staff.phone}</span>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {staff.status === 'active' ? (
                            <button
                              onClick={() => handleUpdateStaffStatus(staff.id, 'pending')}
                              className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                              title="Set employee status to pending"
                            >
                              Pend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStaffStatus(staff.id, 'active')}
                              className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                              title="Activate employee profile"
                            >
                              Activate
                            </button>
                          )}

                          <button
                            onClick={() => alert(`Paystub generated and sent to ${staff.name} (${staff.phone}) via WhatsApp/EFT!`)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
                          >
                            Paystub
                          </button>

                          <button
                            onClick={() => handleDeleteStaff(staff.id, staff.name)}
                            className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border border-rose-200/60"
                            title="Delete staff member from database"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                Register New Employee
              </h3>
              <button
                onClick={() => setIsAddStaffOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sibusiso Ndlovu"
                  value={newStaffName}
                  onChange={(e) => {
                    setNewStaffName(e.target.value);
                    if (!newStaffUsername) {
                      setNewStaffUsername(
                        e.target.value
                          .trim()
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '_')
                      );
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-hidden focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
                />
              </div>

              {/* Kiosk Login Username & Password Created by Owner */}
              <div className="p-3 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-teal-900 flex items-center gap-1">
                    <Monitor className="w-3.5 h-3.5 text-teal-700" />
                    Kiosk Mode Login Credentials (Created by Owner)
                  </span>
                  <span className="text-[9px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded">
                    Can Log Into Kiosk Mode
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-teal-950 font-bold text-[11px] mb-1">
                      Staff Username *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. sibusiso_kiosk"
                      value={newStaffUsername}
                      onChange={(e) => setNewStaffUsername(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-teal-300 rounded-xl font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-teal-950 font-bold text-[11px] mb-1">
                      Staff Password *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kiosk@2026!"
                      value={newStaffPassword}
                      onChange={(e) => setNewStaffPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-teal-300 rounded-xl font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-teal-950 font-bold text-[11px] mb-1">
                    Staff Email (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="sibusiso@scopebridg.co.za"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-teal-300 rounded-xl text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Role / Job Title *</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-hidden bg-white font-semibold text-slate-800"
                >
                  <option value="Receptionist & Kiosk Concierge">Receptionist & Kiosk Concierge</option>
                  <option value="Certified Lead Super Nanny">Certified Lead Super Nanny</option>
                  <option value="Executive Airport Chauffeur">Executive Airport Chauffeur</option>
                  <option value="Head Hospitality Cleaner">Head Hospitality Cleaner</option>
                  <option value="Solar & HVAC Specialist">Solar & HVAC Specialist</option>
                  <option value="Property Maintenance Specialist">Property Maintenance Specialist</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Hourly Rate (ZAR)</label>
                  <input
                    type="number"
                    min={50}
                    value={newStaffRate}
                    onChange={(e) => setNewStaffRate(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-extrabold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Shift Hours / Month</label>
                  <input
                    type="number"
                    min={1}
                    value={newStaffHours}
                    onChange={(e) => setNewStaffHours(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-extrabold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+27 82 123 4567"
                    value={newStaffPhone}
                    onChange={(e) => setNewStaffPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Initial Status</label>
                  <select
                    value={newStaffStatus}
                    onChange={(e) => setNewStaffStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Assigned Property / Unit</label>
                <input
                  type="text"
                  placeholder="Search or enter property name..."
                  value={newStaffProperty}
                  onChange={(e) => setNewStaffProperty(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-4 py-2 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold transition-colors shadow-xs"
                >
                  Create Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION: LOBBY KIOSK SETUP & OWNER ACTIVATION LINK */}
      {/* ------------------------------------------------------------- */}
      {activeCategory === 'kiosk_config' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-teal-600" /> Lobby Kiosk Mode &amp; Staff Login Access
                </h3>
                <p className="text-xs text-slate-500">
                  Property Owners, Admins, and Staff created by the Owner can log into Kiosk Mode directly from the Login Kiosk Mode tab (in-between Sign In and Register).
                </p>
              </div>
              <div className="flex items-center gap-2">
                {onEnterKioskMode && (
                  <button
                    type="button"
                    onClick={onEnterKioskMode}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                  >
                    <Monitor className="w-4 h-4" />
                    <span>Launch Kiosk Mode Now</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>+ Create Staff Kiosk Login</span>
                </button>
              </div>
            </div>

            {kioskCopyFeedback && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between">
                <span>{kioskCopyFeedback}</span>
                <button
                  type="button"
                  onClick={() => setKioskCopyFeedback(null)}
                  className="text-emerald-700 font-black cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] text-teal-400 font-extrabold uppercase tracking-wider block">
                    Owner Activation Token &amp; Kiosk Access
                  </span>
                  <h4 className="text-lg font-mono font-extrabold text-amber-300">
                    KSK-OXFORD-8891
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const link = `https://${window.location.host}/?role=kiosk&token=KSK-OXFORD-8891`;
                      navigator.clipboard.writeText(link);
                      setKioskCopyFeedback(`Lobby Kiosk Activation Link copied: ${link}`);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Copy Kiosk Link</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700 text-xs font-mono text-slate-300 break-all">
                https://{window.location.host}/?role=kiosk&amp;token=KSK-OXFORD-8891
              </div>

              <p className="text-xs text-slate-400">
                Owners, Admins, and Staff created by the Owner can log into Kiosk Mode using their username and password on the <strong>Login Kiosk Mode</strong> screen (located between Sign In and Register Profile).
              </p>
            </div>

            {/* Staff Created by Owner with Kiosk Login Access */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Key className="w-4 h-4 text-teal-600" />
                  <span>Owner-Created Staff Authorized for Kiosk Mode Login ({staffList.length})</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(true)}
                  className="text-xs font-bold text-teal-700 hover:underline cursor-pointer"
                >
                  + Add New Staff Login
                </button>
              </div>

              {staffList.length === 0 ? (
                <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-500">
                  No staff logins created yet. Click <strong>&quot;+ Create Staff Kiosk Login&quot;</strong> above to create a username and password for your receptionist or staff member to log into Kiosk Mode.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {staffList.map((st: any) => {
                    const uName = st.username || st.name?.toLowerCase().replace(/[^a-z0-9]+/g, '_');
                    const uPass = st.password || 'Kiosk@2026!';
                    return (
                      <div
                        key={st.id}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-extrabold text-slate-900">{st.name}</div>
                          <div className="text-[11px] text-teal-800 font-semibold">{st.role}</div>
                          <div className="flex items-center gap-2 pt-1 font-mono text-[11px]">
                            <span className="px-2 py-0.5 bg-white rounded border border-slate-200 text-slate-900 font-bold">
                              User: {uName}
                            </span>
                            <span className="px-2 py-0.5 bg-white rounded border border-slate-200 text-emerald-800 font-bold">
                              Pass: {uPass}
                            </span>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-teal-100 text-teal-900 border border-teal-200 text-[10px] font-black uppercase shrink-0">
                          Kiosk Login Ready
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION: OWNER NANNY BOOKING PORTAL (BOOK ON BEHALF OF GUEST) */}
      {/* ------------------------------------------------------------- */}
      {activeCategory === 'nanny_booking' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Baby className="w-5 h-5 text-purple-600" /> Owner Nanny Booking Portal
                </h3>
                <p className="text-xs text-slate-500">
                  Arrange verified in-residence childcare for your staying guests with CPR & First-Aid certified caregivers.
                </p>
              </div>
              <span className="bg-purple-50 text-purple-800 text-xs font-bold px-3 py-1 rounded-lg border border-purple-200">
                {nannies.length} Certified Nannies Available
              </span>
            </div>

            {ownerNannySuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>{ownerNannySuccessMsg}</span>
                </div>
                <button
                  onClick={() => setOwnerNannySuccessMsg(null)}
                  className="text-slate-500 hover:text-slate-800 font-bold"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Form & Active Nannies Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Column */}
              <div className="lg:col-span-7 bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-purple-600" /> Book Childcare Session
                </h4>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const selectedNannyObj = nannies.find((n) => n.id === ownerNannySelectedNanny) || nannies[0];
                    const selectedPropObj = properties.find((p) => p.id === ownerNannySelectedProperty) || properties[0];
                    const hourlyRate = selectedNannyObj?.hourlyRateZar || 180;
                    const totalCost = ownerNannyHours * hourlyRate;

                    const newNannyBooking: NannyBooking = {
                      id: `NAN-${Date.now().toString().slice(-4)}`,
                      nannyId: selectedNannyObj?.id || 'nanny-1',
                      nannyName: selectedNannyObj?.name || 'Sebenele Mathunywa',
                      nannyAvatar: selectedNannyObj?.avatar,
                      nannyPhone: selectedNannyObj?.phone || '+27 72 888 3344',
                      parentName: ownerNannyGuestName,
                      parentPhone: ownerNannyGuestPhone,
                      propertyId: selectedPropObj?.id || 'prop-1',
                      propertyTitle: selectedPropObj?.title || 'Executive Suite',
                      unitCode: selectedPropObj?.unitCode || 'UNIT-101',
                      date: ownerNannyDate,
                      startTime: ownerNannyStartTime,
                      endTime: '18:00',
                      hours: ownerNannyHours,
                      hourlyRateZar: hourlyRate,
                      totalAmountZar: totalCost,
                      childrenCount: ownerNannyChildrenCount,
                      childrenAges: ownerNannyChildrenAges,
                      specialNotes: ownerNannyNotes,
                      status: 'confirmed',
                      activityLogs: [],
                      createdAt: new Date().toISOString(),
                    };

                    if (onAddNannyBooking) {
                      onAddNannyBooking(newNannyBooking);
                    }
                    setOwnerNannySuccessMsg(
                      `Nanny session successfully booked! Reserved ${selectedNannyObj?.name} for guest ${ownerNannyGuestName} on ${ownerNannyDate} (${ownerNannyHours} hrs • R${totalCost} ZAR).`
                    );
                  }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Guest / Parent Name
                      </label>
                      <input
                        type="text"
                        value={ownerNannyGuestName}
                        onChange={(e) => setOwnerNannyGuestName(e.target.value)}
                        placeholder="e.g. Nyasha Michaels"
                        required
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Guest Mobile Phone
                      </label>
                      <input
                        type="text"
                        value={ownerNannyGuestPhone}
                        onChange={(e) => setOwnerNannyGuestPhone(e.target.value)}
                        placeholder="+27 82 999 1122"
                        required
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Assigned Suite / Property
                      </label>
                      <select
                        value={ownerNannySelectedProperty}
                        onChange={(e) => setOwnerNannySelectedProperty(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-purple-500"
                      >
                        {properties.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title} ({p.area})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Select Certified Nanny
                      </label>
                      <select
                        value={ownerNannySelectedNanny}
                        onChange={(e) => setOwnerNannySelectedNanny(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-purple-500"
                      >
                        {nannies.map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.name} — R{n.hourlyRateZar}/hr ({n.badge || 'Certified'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Session Date
                      </label>
                      <input
                        type="date"
                        value={ownerNannyDate}
                        onChange={(e) => setOwnerNannyDate(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={ownerNannyStartTime}
                        onChange={(e) => setOwnerNannyStartTime(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Duration (Hours)
                      </label>
                      <select
                        value={ownerNannyHours}
                        onChange={(e) => setOwnerNannyHours(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-purple-500"
                      >
                        <option value={2}>2 Hours</option>
                        <option value={3}>3 Hours</option>
                        <option value={4}>4 Hours</option>
                        <option value={6}>6 Hours (Half Day)</option>
                        <option value={8}>8 Hours (Full Day)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Number of Children
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={ownerNannyChildrenCount}
                        onChange={(e) => setOwnerNannyChildrenCount(Number(e.target.value))}
                        required
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Children Ages / Details
                      </label>
                      <input
                        type="text"
                        value={ownerNannyChildrenAges}
                        onChange={(e) => setOwnerNannyChildrenAges(e.target.value)}
                        placeholder="e.g. 2 yrs & 4 yrs"
                        required
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Special Notes / Allergies / Requests
                    </label>
                    <textarea
                      rows={2}
                      value={ownerNannyNotes}
                      onChange={(e) => setOwnerNannyNotes(e.target.value)}
                      placeholder="e.g. Peanut allergy, bedtime routine instructions..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs cursor-pointer transition-colors shadow-md shadow-purple-700/20 flex items-center justify-center gap-2"
                  >
                    <Baby className="w-4 h-4" />
                    <span>Confirm & Dispatch Nanny on Behalf of Guest</span>
                  </button>
                </form>
              </div>

              {/* Certified Caregivers Preview Column */}
              <div className="lg:col-span-5 space-y-4">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Verified Caregivers Directory
                </h4>

                <div className="space-y-3">
                  {nannies.map((nanny) => (
                    <div
                      key={nanny.id}
                      className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2 flex items-start gap-3"
                    >
                      <img
                        src={nanny.avatar}
                        alt={nanny.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h5 className="font-extrabold text-slate-900 text-xs truncate">{nanny.name}</h5>
                          <span className="text-[10px] font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                            R{nanny.hourlyRateZar}/hr
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{nanny.badge || nanny.certifications?.[0] || 'Certified Childcare Specialist'}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-600">
                          <span className="text-amber-500 font-bold">★ {nanny.rating}</span>
                          <span>• {nanny.experienceYears} yrs exp</span>
                          <span>• {nanny.languages?.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* List of Active Owner Nanny Bookings */}
            <div className="border-t border-slate-200 pt-6 space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" /> Current & Scheduled Nanny Sessions
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {nannyBookings.map((bk) => (
                  <div
                    key={bk.id}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">{bk.parentName}</span>
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-full uppercase">
                        {bk.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-0.5">
                      <p>
                        <strong className="text-slate-800">Caregiver:</strong> {bk.nannyName}
                      </p>
                      <p>
                        <strong className="text-slate-800">Suite:</strong> {bk.propertyTitle}
                      </p>
                      <p>
                        <strong className="text-slate-800">Session:</strong> {bk.date} @ {bk.startTime} ({bk.hours} hrs)
                      </p>
                      <p>
                        <strong className="text-slate-800">Children:</strong> {bk.childrenCount} ({bk.childrenAges})
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                      <span className="font-mono text-slate-500 text-[11px]">{bk.id}</span>
                      <span className="font-extrabold text-purple-800">R{bk.totalAmountZar} ZAR</span>
                    </div>

                    {onUpdateNannyBookingStatus && (
                      <div className="flex gap-2 justify-end pt-2 border-t border-slate-200/40">
                        {bk.status === 'confirmed' && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Cancel this scheduled nanny session?')) {
                                onUpdateNannyBookingStatus(bk.id, 'cancelled');
                              }
                            }}
                            className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Cancel Session
                          </button>
                        )}
                        {(bk.status === 'cancelled' || bk.status === 'completed') && (
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateNannyBookingStatus(bk.id, 'confirmed');
                            }}
                            className="px-2 py-1 bg-purple-700 hover:bg-purple-800 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Re-Book Caregiver
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* SECTION: SHUTTLE BOOKING & FLEET MANAGEMENT */}
      {activeCategory === 'shuttle_fleet' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Car className="w-5 h-5 text-emerald-600" /> Executive Airport Chauffeur & Shuttle Fleet Hub
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Dispatch airport transfers, manage executive chauffeur drivers, and track fleet vehicle disk renewals & servicing.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-200">
                {shuttleBookingsList.length} Active Chauffeur Shuttles
              </span>
            </div>
          </div>

          {/* Add Shuttle Booking Form */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" /> Dispatch New Airport Shuttle Transfer
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newShtPassenger.trim()) return;
                const newSht = {
                  id: `SHT-${Math.floor(100 + Math.random() * 900)}`,
                  passengerName: newShtPassenger.trim(),
                  passengerPhone: newShtPhone.trim() || '+27 82 000 0000',
                  driverName: newShtDriver,
                  vehicleModel: newShtVehicle.split('(')[0].trim(),
                  vehiclePlate: newShtVehicle.includes('(') ? newShtVehicle.split('(')[1].replace(')', '') : 'GP 100-200',
                  pickupLocation: newShtPickup,
                  dropoffLocation: newShtDropoff,
                  date: new Date().toISOString().slice(0, 10),
                  time: '14:30',
                  passengersCount: 2,
                  totalAmountZar: newShtAmount,
                  status: 'confirmed',
                };
                setShuttleBookingsList((prev: any) => [newSht, ...prev]);
                setNewShtPassenger('');
              }}
              className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs"
            >
              <input
                type="text"
                value={newShtPassenger}
                onChange={(e) => setNewShtPassenger(e.target.value)}
                placeholder="Passenger Name *"
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                required
              />
              <input
                type="text"
                value={newShtPhone}
                onChange={(e) => setNewShtPhone(e.target.value)}
                placeholder="Passenger Phone"
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              />
              <input
                type="text"
                value={newShtPickup}
                onChange={(e) => setNewShtPickup(e.target.value)}
                placeholder="Pickup Location"
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              />
              <input
                type="text"
                value={newShtDropoff}
                onChange={(e) => setNewShtDropoff(e.target.value)}
                placeholder="Dropoff Location"
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              />
              <select
                value={newShtDriver}
                onChange={(e) => setNewShtDriver(e.target.value)}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
              >
                <option value="Sipho Zulu (Airport Chauffeur)">Sipho Zulu (Airport Chauffeur)</option>
                <option value="Thabo Mbeki (Sandton Chauffeur)">Thabo Mbeki (Sandton Chauffeur)</option>
                <option value="Sibusiso Ndlovu (Fleet Driver)">Sibusiso Ndlovu (Fleet Driver)</option>
              </select>
              <select
                value={newShtVehicle}
                onChange={(e) => setNewShtVehicle(e.target.value)}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
              >
                <option value="Mercedes Vito VIP V300 (ND 881-229)">Mercedes Vito VIP V300 (ND 881-229)</option>
                <option value="Mercedes E-Class Executive (GP 772-001)">Mercedes E-Class Executive (GP 772-001)</option>
                <option value="Toyota Quantum 14-Seater (CA 991-304)">Toyota Quantum 14-Seater (CA 991-304)</option>
              </select>
              <input
                type="number"
                value={newShtAmount}
                onChange={(e) => setNewShtAmount(Number(e.target.value))}
                placeholder="Cost (ZAR)"
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              />
              <button
                type="submit"
                className="p-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Add Shuttle Transfer
              </button>
            </form>
          </div>

          {/* Fleet Vehicle Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-900">Mercedes Vito VIP V300</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">ACTIVE</span>
              </div>
              <p className="text-xs text-slate-500">Plate: ND 881-229 • Driver: Sipho Zulu</p>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px]">
                <span className="text-slate-400">License Disk Expiry:</span>
                <span className="font-bold text-slate-700">2027-04-30</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-900">Mercedes E-Class Executive</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">IN TRANSIT</span>
              </div>
              <p className="text-xs text-slate-500">Plate: GP 772-001 • Driver: Thabo Mbeki</p>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px]">
                <span className="text-slate-400">License Disk Expiry:</span>
                <span className="font-bold text-slate-700">2027-02-15</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-900">Toyota Quantum 14-Seater</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded-full">READY</span>
              </div>
              <p className="text-xs text-slate-500">Plate: CA 991-304 • Driver: Sibusiso Ndlovu</p>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px]">
                <span className="text-slate-400">License Disk Expiry:</span>
                <span className="font-bold text-slate-700">2026-11-20</span>
              </div>
            </div>
          </div>

          {/* Active Shuttle Dispatch List */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Active Guest Shuttle Reservations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shuttleBookingsList.map((sht: any) => (
                <div key={sht.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-extrabold text-slate-900 text-sm block">{sht.passengerName}</span>
                      <span className="text-xs text-slate-500 font-medium">{sht.passengerPhone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase">
                        {sht.status.replace('_', ' ')}
                      </span>
                      <button
                        onClick={() => setShuttleBookingsList((prev: any) => prev.filter((item: any) => item.id !== sht.id))}
                        className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                        title="Cancel Shuttle"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                    <p><strong className="text-slate-700">Driver:</strong> {sht.driverName}</p>
                    <p><strong className="text-slate-700">Vehicle:</strong> {sht.vehicleModel} ({sht.vehiclePlate})</p>
                    <p><strong className="text-slate-700">Pickup:</strong> {sht.pickupLocation}</p>
                    <p><strong className="text-slate-700">Dropoff:</strong> {sht.dropoffLocation}</p>
                    <p><strong className="text-slate-700">Time:</strong> {sht.date} @ {sht.time}</p>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-xs font-bold">
                    <span className="font-mono text-slate-400">{sht.id}</span>
                    <span className="text-emerald-800 font-extrabold text-sm">R{sht.totalAmountZar} ZAR</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION: PROPERTY MAINTENANCE & BUILTSKILLS SA PARTNER */}
      {activeCategory === 'maintenance_built_skills' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-600" /> Property Maintenance & BuiltSkills SA Network
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Official property maintenance hub integrated with <span className="font-bold text-slate-800">BuiltSkills SA Certified Artisans</span>.
              </p>
            </div>
            <a
              href="https://builtskillsa.netlify.app"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer shrink-0"
            >
              <span>Launch BuiltSkills SA Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* BuiltSkills SA Banner Card */}
          <div className="bg-gradient-to-r from-amber-900 via-slate-900 to-slate-900 text-white p-6 rounded-3xl shadow-md border border-amber-800/40 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-400 font-extrabold">
                  <Hammer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-amber-200">BuiltSkills SA Certified Contracting Network</h3>
                  <p className="text-xs text-slate-300">Direct artisan dispatch for Solar Inverters, Electrical, Plumbing, and Smart Locksmithing.</p>
                </div>
              </div>
              <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold px-3 py-1 rounded-full uppercase">
                Partner: builtskillsa.netlify.app
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-amber-800/50 text-xs">
              <div className="flex gap-4 text-slate-300 text-[11px]">
                <span>✓ Vetted Artisans</span>
                <span>✓ 24/7 Emergency Repairs</span>
                <span>✓ Solar Substation Warranty</span>
              </div>

              <a
                href="https://builtskillsa.netlify.app"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs transition-colors flex items-center gap-1.5"
              >
                <span>Dispatch Maintenance Request</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Add Maintenance Ticket Form */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-600" /> Log Maintenance Work Order (BuiltSkills SA)
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newMntTitle.trim()) return;
                const newTicket = {
                  id: `MNT-${Math.floor(100 + Math.random() * 900)}`,
                  propertyTitle: newMntProp,
                  title: newMntTitle.trim(),
                  category: newMntCategory,
                  priority: 'high',
                  contractor: 'BuiltSkills SA Certified Artisan Network',
                  externalPartnerUrl: 'https://builtskillsa.netlify.app',
                  status: 'in_progress',
                  createdAt: new Date().toISOString().slice(0, 10),
                  costZar: newMntCost,
                  notes: 'Dispatched via BuiltSkills SA portal.',
                };
                setMaintenanceTickets((prev: any) => [newTicket, ...prev]);
                setNewMntTitle('');
              }}
              className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs"
            >
              <input
                type="text"
                value={newMntTitle}
                onChange={(e) => setNewMntTitle(e.target.value)}
                placeholder="Maintenance Task Title *"
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                required
              />
              <select
                value={newMntProp}
                onChange={(e) => setNewMntProp(e.target.value)}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.title}>{p.title}</option>
                ))}
              </select>
              <select
                value={newMntCategory}
                onChange={(e) => setNewMntCategory(e.target.value)}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
              >
                <option value="Solar & Electrical">Solar & Electrical</option>
                <option value="Plumbing & Geyser">Plumbing & Geyser</option>
                <option value="Access Control & Locksmith">Access Control & Locksmith</option>
                <option value="Appliance Repair">Appliance Repair</option>
              </select>
              <button
                type="submit"
                className="p-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Log Work Order
              </button>
            </form>
          </div>

          {/* Active Maintenance Tickets */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Active Property Repair & Service Orders</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {maintenanceTickets.map((ticket: any) => (
                <div key={ticket.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-extrabold text-slate-900 text-sm block">{ticket.title}</span>
                      <span className="text-xs text-amber-800 font-semibold">{ticket.propertyTitle}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                        ticket.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <button
                        onClick={() => setMaintenanceTickets((prev: any) => prev.filter((t: any) => t.id !== ticket.id))}
                        className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                    <p><strong className="text-slate-700">Contractor:</strong> {ticket.contractor}</p>
                    <p><strong className="text-slate-700">Category:</strong> {ticket.category}</p>
                    <p><strong className="text-slate-700">Notes:</strong> {ticket.notes}</p>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-xs">
                    <a
                      href={ticket.externalPartnerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-700 font-bold hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <span>Track on BuiltSkills SA</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <span className="font-extrabold text-slate-900 text-sm">R{ticket.costZar} ZAR</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION: FLIGHT BOOKINGS & CAR HIRE */}
      {activeCategory === 'flights_car_hire' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Plane className="w-5 h-5 text-blue-600" /> Guest Flight Bookings & Executive Car Hire Hub
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Manage domestic flight reservations (FlySafair, SAA, Airlink) and executive self-drive car rentals for corporate guests.
              </p>
            </div>
          </div>

          {/* Quick Add Forms Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Add Flight Form */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" /> Add Flight Booking
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newFltGuest.trim()) return;
                  const newFlt = {
                    id: `FLT-${Math.floor(100 + Math.random() * 900)}`,
                    guestName: newFltGuest.trim(),
                    carrier: newFltCarrier,
                    route: newFltRoute,
                    flightNumber: `FA-${Math.floor(100 + Math.random() * 900)}`,
                    date: new Date().toISOString().slice(0, 10),
                    status: 'confirmed',
                    ticketPriceZar: newFltPrice,
                  };
                  setFlightBookings((prev: any) => [newFlt, ...prev]);
                  setNewFltGuest('');
                }}
                className="grid grid-cols-2 gap-2 text-xs"
              >
                <input
                  type="text"
                  value={newFltGuest}
                  onChange={(e) => setNewFltGuest(e.target.value)}
                  placeholder="Guest Name *"
                  className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  required
                />
                <select
                  value={newFltCarrier}
                  onChange={(e) => setNewFltCarrier(e.target.value)}
                  className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="FlySafair">FlySafair</option>
                  <option value="South African Airways">South African Airways</option>
                  <option value="Airlink">Airlink</option>
                </select>
                <input
                  type="text"
                  value={newFltRoute}
                  onChange={(e) => setNewFltRoute(e.target.value)}
                  placeholder="Route (e.g. CPT -> JNB)"
                  className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
                <button
                  type="submit"
                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Add Flight
                </button>
              </form>
            </div>

            {/* Add Car Rental Form */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" /> Add Car Rental
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newCarGuest.trim()) return;
                  const newCar = {
                    id: `CAR-${Math.floor(100 + Math.random() * 900)}`,
                    guestName: newCarGuest.trim(),
                    vehicleModel: newCarModel,
                    rentalDays: newCarDays,
                    dailyRateZar: newCarRate,
                    totalAmountZar: newCarDays * newCarRate,
                    pickupBranch: 'OR Tambo Hub',
                    status: 'confirmed',
                  };
                  setCarHireBookings((prev: any) => [newCar, ...prev]);
                  setNewCarGuest('');
                }}
                className="grid grid-cols-2 gap-2 text-xs"
              >
                <input
                  type="text"
                  value={newCarGuest}
                  onChange={(e) => setNewCarGuest(e.target.value)}
                  placeholder="Guest Name *"
                  className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  required
                />
                <select
                  value={newCarModel}
                  onChange={(e) => setNewCarModel(e.target.value)}
                  className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="Toyota Fortuner 2.8 GD-6 4x4">Toyota Fortuner 4x4</option>
                  <option value="BMW 3 Series Executive Sedan">BMW 3 Series</option>
                  <option value="VW Polo TSI Auto">VW Polo Hatch</option>
                </select>
                <input
                  type="number"
                  value={newCarDays}
                  onChange={(e) => setNewCarDays(Number(e.target.value))}
                  placeholder="Days"
                  className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
                <button
                  type="submit"
                  className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Add Car Hire
                </button>
              </form>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Flight Bookings Column */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Plane className="w-4 h-4 text-blue-600" /> Guest Domestic Flight Reservations
                </h3>
                <span className="text-xs bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                  {flightBookings.length} Booked
                </span>
              </div>

              <div className="space-y-3">
                {flightBookings.map((flt: any) => (
                  <div key={flt.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">{flt.guestName}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-extrabold rounded-full uppercase">
                          {flt.status}
                        </span>
                        <button
                          onClick={() => setFlightBookings((prev: any) => prev.filter((f: any) => f.id !== flt.id))}
                          className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-700 font-semibold">{flt.carrier} • {flt.flightNumber}</p>
                    <p className="text-slate-500 font-mono text-[11px]">{flt.route}</p>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-bold">
                      <span className="text-slate-400 text-[11px]">{flt.date}</span>
                      <span className="text-blue-900">R{flt.ticketPriceZar} ZAR</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Car Hire Column */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Car className="w-4 h-4 text-emerald-600" /> Executive Car Rental Dispatches
                </h3>
                <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  {carHireBookings.length} Active
                </span>
              </div>

              <div className="space-y-3">
                {carHireBookings.map((car: any) => (
                  <div key={car.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">{car.guestName}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full uppercase">
                          {car.status}
                        </span>
                        <button
                          onClick={() => setCarHireBookings((prev: any) => prev.filter((c: any) => c.id !== car.id))}
                          className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-800 font-bold">{car.vehicleModel}</p>
                    <p className="text-slate-500">{car.rentalDays} Days @ R{car.dailyRateZar}/day ({car.pickupBranch})</p>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-bold">
                      <span className="text-slate-400 font-mono text-[11px]">{car.id}</span>
                      <span className="text-emerald-800">R{car.totalAmountZar} ZAR</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <AddPropertyModal
        isOpen={isAddPropertyModalOpen}
        onClose={() => setIsAddPropertyModalOpen(false)}
        onAddProperty={(newProp) => {
          if (onAddProperty) {
            onAddProperty(newProp);
          } else {
            onUpdateProperties((prev) => [newProp, ...prev]);
          }
          setSelectedPropertyId(newProp.id);
        }}
      />
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { Property, Review, Booking, GlobalCurrency, RoomBid, VirtualWalletData, NannyProfile, NannyBooking, ShuttleDriverProfile, ShuttleBooking, CalendarPlanEvent, ChannelConfig, UserAccount } from '../../types';
import { CURRENCY_RATES } from '../../data/usersData';
import { GLOBAL_AREA_GROUPS } from '../../data/globalAreas';
import { IS_PROD } from '../../lib/env';
import { SYNDICATED_GLOBAL_PROPERTIES } from '../../utils/searchSyndicate';
import { getRoomOccupancyStatus } from '../../utils/bookingAvailability';
import { UniversalCalendarPlanner } from '../common/UniversalCalendarPlanner';
import { InteractiveMap } from './InteractiveMap';
import { PropertyDetailModal } from './PropertyDetailModal';
import { WishlistDrawer } from './WishlistDrawer';
import { TripToolsModal } from './TripToolsModal';
import { LiveChatModal } from './LiveChatModal';
import { GuestAreaGuideModal } from './GuestAreaGuideModal';
import { GuestEmergencyModal } from './GuestEmergencyModal';
import { VirtualWallet } from './VirtualWallet';
import { RoomBidModal } from './RoomBidModal';
import { GuestNannyOnCallModal } from './GuestNannyOnCallModal';
import { GuestShuttleOnCallModal } from './GuestShuttleOnCallModal';
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Heart,
  Star,
  Compass,
  ShieldCheck,
  Wifi,
  Car,
  Utensils,
  PawPrint,
  Users,
  SunMedium,
  Sparkles,
  MessageSquare,
  Navigation,
  Check,
  ArrowUpDown,
  ChevronRight,
  ShoppingBag,
  Building,
  Coffee,
  ShieldAlert,
  Globe,
  Baby,
  Plane,
  Wallet,
  Building2,
  CalendarDays,
  BedDouble,
  Tag,
  BadgePercent,
  ExternalLink,
  Link2
} from 'lucide-react';

interface GuestViewProps {
  properties: Property[];
  reviews: Review[];
  bookings: Booking[];
  wishlistIds: string[];
  selectedCurrency?: GlobalCurrency;
  walletData?: VirtualWalletData;
  onUpdateWalletData?: (newWalletData: VirtualWalletData) => void;
  onToggleWishlist: (propertyId: string) => void;
  onBookProperty: (bookingData: Omit<Booking, 'id' | 'createdAt'>) => void;
  onAddRoomBid?: (bid: Omit<RoomBid, 'id' | 'createdAt' | 'status'>) => void;
  isWishlistOpen: boolean;
  setIsWishlistOpen: (open: boolean) => void;
  isTripToolsOpen: boolean;
  setIsTripToolsOpen: (open: boolean) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  nannies: NannyProfile[];
  nannyBookings: NannyBooking[];
  shuttleDrivers: ShuttleDriverProfile[];
  shuttleBookings: ShuttleBooking[];
  onAddNannyBooking: (booking: NannyBooking) => void;
  onUpdateNannyBookingStatus: (id: string, status: NannyBooking['status']) => void;
  onAddShuttleBooking: (booking: ShuttleBooking) => void;
  onUpdateShuttleBookingStatus: (id: string, status: ShuttleBooking['status']) => void;
  currentUser?: any;
  calendarEvents?: CalendarPlanEvent[];
  channels?: ChannelConfig[];
  registeredUsers?: UserAccount[];
  onUpdateBookings?: React.Dispatch<React.SetStateAction<Booking[]>>;
  onUpdateCalendarEvents?: React.Dispatch<React.SetStateAction<CalendarPlanEvent[]>>;
  onUpdateProperties?: React.Dispatch<React.SetStateAction<Property[]>>;
  onPublishPropertyToChannel?: (propertyId: string, channelId: string, publish: boolean) => void;
  onOpenGuestBookingLink?: () => void;
  onUpdateUser?: (updatedUser: UserAccount) => void;
}

export const GuestView: React.FC<GuestViewProps> = ({
  properties,
  reviews,
  bookings,
  wishlistIds,
  selectedCurrency = 'ZAR',
  walletData,
  onUpdateWalletData,
  onToggleWishlist,
  onBookProperty,
  onAddRoomBid,
  isWishlistOpen,
  setIsWishlistOpen,
  isTripToolsOpen,
  setIsTripToolsOpen,
  isChatOpen,
  setIsChatOpen,
  nannies,
  nannyBookings,
  shuttleDrivers,
  shuttleBookings,
  onAddNannyBooking,
  onUpdateNannyBookingStatus,
  onAddShuttleBooking,
  onUpdateShuttleBookingStatus,
  currentUser,
  calendarEvents = [],
  channels = [],
  registeredUsers = [],
  onUpdateBookings = () => {},
  onUpdateCalendarEvents = () => {},
  onUpdateProperties = () => {},
  onPublishPropertyToChannel,
  onOpenGuestBookingLink,
  onUpdateUser,
}) => {
  // Navigation tab state inside Guest profile
  const [activeGuestTab, setActiveGuestTab] = useState<'stays' | 'wallet' | 'my_trips' | 'calendar'>('stays');
  
  // Nanny and Shuttle On-call modal open states
  const [isNannyOnCallOpen, setIsNannyOnCallOpen] = useState(false);
  const [isShuttleOnCallOpen, setIsShuttleOnCallOpen] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBedConfig, setSelectedBedConfig] = useState<string>('all');
  const [selectedAccommodationType, setSelectedAccommodationType] = useState<string>('all');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('all');
  const [checkInDate, setCheckInDate] = useState<string>('2026-10-10');
  const [checkOutDate, setCheckOutDate] = useState<string>('2026-10-13');
  const [stayNights, setStayNights] = useState<number>(3);
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string>('all');
  const [selectedGlobalRegion, setSelectedGlobalRegion] = useState<
    'all' | 'South Africa' | 'Europe' | 'Middle East' | 'North America' | 'Asia Pacific'
  >('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [targetLandmark, setTargetLandmark] = useState<
    'all' | 'shopping' | 'business' | 'transit' | 'dining'
  >('all');

  // Calculate nights from dates
  const calculatedNights = useMemo(() => {
    const d1 = new Date(checkInDate);
    const d2 = new Date(checkOutDate);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return stayNights || 3;
    const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }, [checkInDate, checkOutDate, stayNights]);

  const handleStayNightsSelect = (nights: number) => {
    setStayNights(nights);
    const d = new Date(checkInDate);
    if (!isNaN(d.getTime())) {
      d.setDate(d.getDate() + nights);
      setCheckOutDate(d.toISOString().slice(0, 10));
    }
  };

  const handleCheckInDateChange = (newIn: string) => {
    setCheckInDate(newIn);
    const d1 = new Date(newIn);
    const d2 = new Date(checkOutDate);
    if (isNaN(d2.getTime()) || d2 <= d1) {
      const nextD = new Date(d1);
      nextD.setDate(nextD.getDate() + calculatedNights);
      setCheckOutDate(nextD.toISOString().slice(0, 10));
    }
  };

  const handleCheckOutDateChange = (newOut: string) => {
    setCheckOutDate(newOut);
    const d1 = new Date(checkInDate);
    const d2 = new Date(newOut);
    if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
      const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
      if (diff > 0) setStayNights(diff);
    }
  };

  // Flexible Filter controls
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [filterSelfCheckIn, setFilterSelfCheckIn] = useState(false);
  const [filterParking, setFilterParking] = useState(false);
  const [filterWifi, setFilterWifi] = useState(false);
  const [filterKitchen, setFilterKitchen] = useState(false);
  const [filterPetFriendly, setFilterPetFriendly] = useState(false);
  const [filterFamilyFriendly, setFilterFamilyFriendly] = useState(false);
  const [filterSolar, setFilterSolar] = useState(false);

  // Area Guide & Emergency Modals
  const [isAreaGuideOpen, setIsAreaGuideOpen] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);

  // Selected property for modal
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [biddingProperty, setBiddingProperty] = useState<Property | null>(null);
  const [chatTargetProperty, setChatTargetProperty] = useState<Property | null>(null);

  // Default Wallet fallback
  const effectiveWalletData: VirtualWalletData = walletData || (IS_PROD ? {
    holidayFundBalanceZar: 0,
    cashbackRewardsZar: 0,
    referralCreditsZar: 0,
    goalName: 'Next Stay Holiday Fund',
    goalTargetZar: 10000,
    transactions: [],
  } : {
    holidayFundBalanceZar: 12450,
    cashbackRewardsZar: 850,
    referralCreditsZar: 350,
    goalName: 'December Family Holiday',
    goalTargetZar: 20000,
    transactions: [
      {
        id: 'TX-901',
        date: '2026-09-15',
        title: '5% Direct Booking Cashback',
        category: 'cashback_reward',
        amountZar: 420,
        status: 'completed',
        reference: 'CB-8821',
        notes: 'Earned on Executive Loft stay',
      },
      {
        id: 'TX-900',
        date: '2026-09-10',
        title: 'Instant Ozow Top-Up',
        category: 'deposit',
        amountZar: 2500,
        status: 'completed',
        reference: 'OZ-3391',
        notes: 'Holiday fund deposit',
      },
      {
        id: 'TX-899',
        date: '2026-08-28',
        title: 'Executive Shuttle Ride',
        category: 'shuttle_payment',
        amountZar: -450,
        status: 'completed',
        reference: 'SH-1102',
        notes: 'OR Tambo to Republic Rd transfer',
      },
    ],
  });

  const handleWalletUpdate = onUpdateWalletData || (() => {});
  const currencyRateInfo = CURRENCY_RATES[selectedCurrency] || CURRENCY_RATES.ZAR;
  const currencySymbol = currencyRateInfo.symbol;


  // Combined pool of active local database properties and syndicated global listings
  const allPropertiesPool = useMemo(() => {
    const localIds = new Set(properties.map((p) => p.id));
    return [...properties, ...SYNDICATED_GLOBAL_PROPERTIES.filter((p) => !localIds.has(p.id))];
  }, [properties]);

  // Filtered Properties logic
  const filteredProperties = useMemo(() => {
    return allPropertiesPool.filter((prop) => {
      // Show active, maintenance, or newly added/published properties (filter out only suspended)
      const isAvailable = prop.status !== 'suspended';
      if (!isAvailable) return false;

      const publishedList = prop.publishedChannels || ['ch-direct', 'direct', 'ScopeBridge Direct'];
      const registeredList = prop.requestedChannels || ['ScopeBridge Direct', 'Booking.com', 'Airbnb'];
      const allChannelStrings = [...publishedList, ...registeredList, 'scopebridge direct', 'scopebridge', 'direct'].map((c) =>
        c.toLowerCase()
      );
      const normalizedPublished = ['direct', 'scopebridgedirect', ...publishedList.map((c) => c.toLowerCase().replace(/[_\s.-]/g, ''))];

      // Channel Filter Bar matching (Reflects properties published to each channel when owner selects publish)
      if (selectedChannelFilter !== 'all') {
        const filterLower = selectedChannelFilter.toLowerCase();
        const filterNorm = filterLower.replace(/[_\s.-]/g, '');
        if (filterLower.includes('scopebridge') || filterLower === 'direct') {
          // ScopeBridge direct is supported on all on-platform properties
        } else {
          const matchesSelectedChannel = normalizedPublished.some(
            (c) => c.includes(filterNorm) || filterNorm.includes(c.replace('ch', ''))
          );
          if (!matchesSelectedChannel) return false;
        }
      }

      // Accommodation Type Filter (Hotels, Villas, Safari, Apartments, Penthouses, B&Bs, Resorts)
      if (selectedAccommodationType !== 'all') {
        const propType = (prop.propertyType || '').toLowerCase();
        const titleLower = prop.title.toLowerCase();
        const descLower = (prop.description || '').toLowerCase();
        const areaLower = prop.area.toLowerCase();

        if (selectedAccommodationType === 'hotel') {
          const isHotel = propType.includes('hotel') || titleLower.includes('hotel') || descLower.includes('hotel') || titleLower.includes('suite');
          if (!isHotel) return false;
        } else if (selectedAccommodationType === 'villa') {
          const isVilla = propType.includes('villa') || titleLower.includes('villa') || descLower.includes('villa');
          if (!isVilla) return false;
        } else if (selectedAccommodationType === 'safari') {
          const isSafari = propType.includes('safari') || propType.includes('lodge') || titleLower.includes('safari') || titleLower.includes('lodge') || areaLower.includes('kruger') || descLower.includes('safari');
          if (!isSafari) return false;
        } else if (selectedAccommodationType === 'apartment') {
          const isApt = propType.includes('apartment') || propType.includes('loft') || titleLower.includes('apartment') || titleLower.includes('loft') || titleLower.includes('residence');
          if (!isApt) return false;
        } else if (selectedAccommodationType === 'penthouse') {
          const isPent = propType.includes('penthouse') || titleLower.includes('penthouse') || descLower.includes('penthouse') || (prop.rooms || []).some(r => r.name.toLowerCase().includes('penthouse'));
          if (!isPent) return false;
        } else if (selectedAccommodationType === 'bnb') {
          const isBnb = propType.includes('bnb') || propType.includes('bed') || titleLower.includes('bnb') || titleLower.includes('b&b') || descLower.includes('breakfast');
          if (!isBnb) return false;
        } else if (selectedAccommodationType === 'resort') {
          const isResort = propType.includes('resort') || titleLower.includes('resort') || titleLower.includes('estate') || descLower.includes('resort');
          if (!isResort) return false;
        }
      }

      // Room Type & Suite filter
      if (selectedRoomType !== 'all') {
        const hasRoomType = (prop.rooms || []).some((r) => {
          const rType = (r.type || '').toLowerCase();
          const rName = (r.name || '').toLowerCase();
          if (selectedRoomType === 'master_suite') {
            return rType.includes('master') || rName.includes('master') || rName.includes('executive');
          }
          if (selectedRoomType === 'deluxe_room') {
            return rType.includes('deluxe') || rName.includes('deluxe') || rName.includes('king');
          }
          if (selectedRoomType === 'studio') {
            return rType.includes('studio') || rName.includes('studio') || rName.includes('loft');
          }
          if (selectedRoomType === 'family_room') {
            return rType.includes('family') || rName.includes('family') || (r.maxGuests && r.maxGuests >= 4);
          }
          if (selectedRoomType === 'entire_unit') {
            return rType.includes('entire') || rName.includes('entire') || rName.includes('villa') || rName.includes('penthouse');
          }
          return true;
        });
        if (!hasRoomType && (prop.rooms || []).length > 0) return false;
      }

      // Bed configuration and suite type filter
      if (selectedBedConfig !== 'all') {
        const hasMatchingRoom = (prop.rooms || []).some((r) => {
          const bedStr = (r.bedConfiguration || '').toLowerCase();
          const nameStr = (r.name || '').toLowerCase();
          const typeStr = (r.type || '').toLowerCase();
          if (selectedBedConfig === 'king') {
            return bedStr.includes('king') || nameStr.includes('king');
          }
          if (selectedBedConfig === 'queen') {
            return bedStr.includes('queen') || nameStr.includes('queen');
          }
          if (selectedBedConfig === 'master_suite') {
            return typeStr.includes('master') || nameStr.includes('executive') || nameStr.includes('suite');
          }
          if (selectedBedConfig === 'loft') {
            return nameStr.includes('loft') || typeStr.includes('loft');
          }
          if (selectedBedConfig === 'pool_view') {
            return nameStr.includes('pool') || (r.amenities || []).some((a) => a.toLowerCase().includes('pool'));
          }
          return true;
        });
        if (!hasMatchingRoom) return false;
      }

      // Enhanced Search text query matching titles, areas, countries, cities, room details, channels, and amenities
      const query = searchQuery.toLowerCase().trim();
      let matchSearch = true;
      if (query) {
        // Direct search on ScopeBridge channel returns all registered ScopeBridge properties
        if (
          query === 'scopebridge' ||
          query === 'scope bridge' ||
          query === 'scopebridge direct' ||
          query === 'direct' ||
          query === 'direct channel' ||
          query === 'all channels'
        ) {
          matchSearch = true;
        } else {
          const matchesTitle = prop.title.toLowerCase().includes(query);
          const matchesArea = prop.area.toLowerCase().includes(query);
          const matchesAddress = prop.address?.toLowerCase().includes(query) || false;
          const matchesCity = prop.city?.toLowerCase().includes(query) || false;
          const matchesCountry = prop.country?.toLowerCase().includes(query) || false;
          const matchesRegion = prop.globalRegion?.toLowerCase().includes(query) || false;
          const matchesType = prop.propertyType?.toLowerCase().includes(query) || false;
          const matchesDescription = prop.description?.toLowerCase().includes(query) || false;
          const matchesSummary = prop.summary?.toLowerCase().includes(query) || false;
          const matchesChannel = allChannelStrings.some((c) => c.includes(query));

          // Rooms and bed configuration matching
          const matchesRooms = (prop.rooms || []).some(
            (room) =>
              room.name.toLowerCase().includes(query) ||
              room.type.toLowerCase().includes(query) ||
              (room.bedConfiguration && room.bedConfiguration.toLowerCase().includes(query)) ||
              (room.amenities && room.amenities.some((a) => a.toLowerCase().includes(query)))
          );

          // Individual amenities search matches (e.g. searching "wifi", "solar", "kitchen", "parking", "pet", "pool")
          const matchesAmenities =
            (query.includes('wifi') && prop.amenities.wifi) ||
            (query.includes('solar') && prop.amenities.solarInverter) ||
            (query.includes('parking') && prop.amenities.parking) ||
            (query.includes('kitchen') && prop.amenities.kitchen) ||
            (query.includes('pet') && prop.amenities.petFriendly) ||
            (query.includes('family') && prop.amenities.familyFriendly) ||
            (query.includes('self') && prop.amenities.selfCheckIn);

          matchSearch =
            matchesTitle ||
            matchesArea ||
            matchesAddress ||
            matchesCity ||
            matchesCountry ||
            matchesRegion ||
            matchesType ||
            matchesDescription ||
            matchesSummary ||
            matchesChannel ||
            matchesRooms ||
            matchesAmenities;
        }
      }

      // Global Region & City filter
      let matchRegion = true;
      if (selectedGlobalRegion !== 'all') {
        matchRegion = prop.globalRegion === selectedGlobalRegion;
      }

      let matchCity = true;
      if (selectedCity !== 'all') {
        matchCity = prop.city === selectedCity;
      }

      // Price slider (calculated in ZAR)
      const matchPrice = prop.basePrice <= maxPrice;

      // Amenity filters
      if (filterSelfCheckIn && !prop.amenities.selfCheckIn) return false;
      if (filterParking && !prop.amenities.parking) return false;
      if (filterWifi && !prop.amenities.wifi) return false;
      if (filterKitchen && !prop.amenities.kitchen) return false;
      if (filterPetFriendly && !prop.amenities.petFriendly) return false;
      if (filterFamilyFriendly && !prop.amenities.familyFriendly) return false;
      if (filterSolar && !prop.amenities.solarInverter) return false;

      // Landmark & Proximity filter
      if (targetLandmark === 'shopping' && prop.distances) {
        const isNear =
          prop.distances.ferndaleOnRepublic?.includes('m') ||
          parseFloat(prop.distances.ferndaleOnRepublic || '99') <= 1.0;
        if (!isNear) return false;
      }
      if (targetLandmark === 'business' && prop.distances) {
        const isNear = parseFloat(prop.distances.absaCampus || '99') <= 2.5;
        if (!isNear) return false;
      }
      if (targetLandmark === 'dining' && prop.distances) {
        const isNear =
          prop.distances.spar?.includes('m') ||
          parseFloat(prop.distances.spar || '99') <= 1.0;
        if (!isNear) return false;
      }
      if (targetLandmark === 'transit' && prop.distances) {
        const isNear = parseFloat(prop.distances.gautrainSandton || '99') <= 10.0;
        if (!isNear) return false;
      }

      return matchSearch && matchRegion && matchCity && matchPrice;
    });
  }, [
    allPropertiesPool,
    selectedBedConfig,
    selectedAccommodationType,
    selectedRoomType,
    searchQuery,
    selectedChannelFilter,
    selectedGlobalRegion,
    selectedCity,
    maxPrice,
    filterSelfCheckIn,
    filterParking,
    filterWifi,
    filterKitchen,
    filterPetFriendly,
    filterFamilyFriendly,
    filterSolar,
    targetLandmark,
  ]);

  const openChatForProperty = (prop: Property) => {
    setChatTargetProperty(prop);
    setIsChatOpen(true);
  };

  const formatPrice = (zarAmount: number) => {
    const rateInfo = CURRENCY_RATES[selectedCurrency] || CURRENCY_RATES.ZAR;
    const converted = Math.round(zarAmount * rateInfo.rateToZar);
    return `${rateInfo.symbol}${converted.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Global Brand & Scope Announcement Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-5 text-white shadow-lg border border-emerald-800/30 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500 text-slate-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <Globe className="w-3 h-3" /> ScopeBridg Worldwide
            </span>
            <span className="text-xs text-emerald-200 font-medium">
              Global Executive Serviced Residences & Chauffeur Services
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
            Book Curated Executive Residences Worldwide
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Direct host booking with zero commissions, verified backup solar power in South Africa,
            airport meet & greet chauffeur options, and certified early childhood super nannies.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveGuestTab('calendar')}
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-extrabold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Calendar & Planner</span>
          </button>

          {onOpenGuestBookingLink && (
            <button
              onClick={onOpenGuestBookingLink}
              className="px-3.5 py-2 bg-indigo-500/30 hover:bg-indigo-500/40 text-indigo-200 rounded-xl text-xs font-extrabold border border-indigo-400/50 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Add Booking Link (Guest Calendar)</span>
            </button>
          )}

          <button
            onClick={() => setIsShuttleOnCallOpen(true)}
            className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-xs font-bold border border-amber-500/40 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Car className="w-3.5 h-3.5" />
            <span>Airport Shuttle</span>
          </button>

          <button
            onClick={() => setIsNannyOnCallOpen(true)}
            className="px-3.5 py-2 bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 rounded-xl text-xs font-bold border border-pink-500/40 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Baby className="w-3.5 h-3.5" />
            <span>Book Nanny</span>
          </button>

          <button
            onClick={() => setIsAreaGuideOpen(true)}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Area guide, attractions, shopping, transit & dining"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Area Guide</span>
          </button>

          <button
            onClick={() => setIsEmergencyOpen(true)}
            className="px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl text-xs font-bold border border-rose-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Safety 24/7</span>
          </button>

          <button
            onClick={() => setIsWishlistOpen(true)}
            className="px-3.5 py-2 bg-white text-slate-900 hover:bg-emerald-50 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
            <span>Saved ({wishlistIds.length})</span>
          </button>
        </div>
      </div>

      {/* Main Guest Navigation Sub-Bar */}
      <div className="bg-slate-900 p-2 rounded-2xl border border-slate-800 text-white flex flex-wrap items-center justify-between gap-2 shadow-md">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveGuestTab('stays')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeGuestTab === 'stays'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4 text-emerald-300" />
            <span>Residences & Stays</span>
          </button>

          <button
            onClick={() => setActiveGuestTab('wallet')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeGuestTab === 'wallet'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Wallet className="w-4 h-4 text-amber-300" />
            <span>Virtual Wallet</span>
            <span className="bg-amber-400/20 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-amber-400/30 font-bold">
              {currencySymbol}{(effectiveWalletData.holidayFundBalanceZar + effectiveWalletData.cashbackRewardsZar + effectiveWalletData.referralCreditsZar).toLocaleString()}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveGuestTab('my_trips');
              setIsTripToolsOpen(true);
            }}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeGuestTab === 'my_trips'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CalendarDays className="w-4 h-4 text-indigo-300" />
            <span>My Trips & Access Codes</span>
            <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
              {bookings.length}
            </span>
          </button>

          <button
            onClick={() => setActiveGuestTab('calendar')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeGuestTab === 'calendar'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CalendarDays className="w-4 h-4 text-emerald-300" />
            <span>Calendar & Holiday Planner (Daily / Weekly / Monthly)</span>
            <span className="bg-emerald-400/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-400/30 font-bold">
              {bookings.length + calendarEvents.length}
            </span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 font-medium px-2 hidden md:block">
          Welcome back, Valued Guest • 5% Cashback Active
        </div>
      </div>

      {/* Render Virtual Wallet or Universal Calendar Planner view when selected */}
      {activeGuestTab === 'wallet' ? (
        <VirtualWallet
          walletData={effectiveWalletData}
          onUpdateWalletData={handleWalletUpdate}
          currencySymbol={currencySymbol}
          selectedCurrency={selectedCurrency}
          currentUser={currentUser}
          onUpdateUser={onUpdateUser}
        />
      ) : activeGuestTab === 'calendar' ? (
        <UniversalCalendarPlanner
          currentRole="guest"
          currentUser={currentUser || {
            id: 'guest-1',
            name: 'Guest',
            fullName: 'Guest Traveler',
            username: 'guest',
            role: 'guest',
            email: 'guest@scopebridg.co.za',
            phone: '+27 82 000 0000',
            avatar: '',
            title: 'Guest Profile',
            location: 'South Africa',
            registeredHolidayChannels: ['direct', 'airbnb', 'booking_com', 'lekkeslaap', 'safarinow'],
          }}
          properties={properties}
          bookings={bookings}
          nannyBookings={nannyBookings}
          shuttleBookings={shuttleBookings}
          calendarEvents={calendarEvents}
          channels={channels}
          registeredUsers={registeredUsers}
          selectedCurrency={selectedCurrency}
          onBookProperty={onBookProperty}
          onUpdateBookings={onUpdateBookings}
          onUpdateCalendarEvents={onUpdateCalendarEvents}
          onUpdateProperties={onUpdateProperties}
          onPublishPropertyToChannel={onPublishPropertyToChannel}
        />
      ) : (
        <>
          {/* Global Destination & Region Tabs */}
          <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto">

        {[
          { id: 'all', label: '🌍 All Global Destinations', city: 'all' },
          { id: 'South Africa', label: '🇿🇦 South Africa (All Areas & Suburbs)', city: 'all' },
          { id: 'Europe', label: '🇬🇧 London, Mayfair', city: 'London' },
          { id: 'Middle East', label: '🇦🇪 Dubai, Downtown', city: 'Dubai' },
          { id: 'North America', label: '🇺🇸 New York, Tribeca', city: 'New York' },
          { id: 'Europe', label: '🇫🇷 Paris, Le Marais', city: 'Paris' },
          { id: 'Asia Pacific', label: '🇮🇩 Bali, Ubud Villa', city: 'Bali' },
        ].map((dest, idx) => {
          const isActive =
            dest.id === 'all'
              ? selectedGlobalRegion === 'all' && selectedCity === 'all'
              : dest.city === 'all'
              ? selectedGlobalRegion === dest.id && selectedCity === 'all'
              : selectedCity === dest.city;
          return (
            <button
              key={idx}
              onClick={() => {
                if (dest.id === 'all') {
                  setSelectedGlobalRegion('all');
                  setSelectedCity('all');
                } else {
                  setSelectedGlobalRegion(dest.id as any);
                  setSelectedCity(dest.city);
                }
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                isActive
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{dest.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Search & Proximity Selector Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-md space-y-4">
        {/* Row 1: Destination, Check-In, Check-Out, and Nights Calculation */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Destination Search & Suburb Dropdown */}
          <div className="md:col-span-5 space-y-1">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>1. Global Destination / City / Suburb</span>
            </label>
            <div className="flex gap-1.5">
              <select
                aria-label="Area / Suburb Preset"
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  setSelectedGlobalRegion('all');
                  setSelectedCity('all');
                }}
                className="px-2.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-emerald-600 cursor-pointer max-w-[140px] shrink-0"
                title="Select any Global Area / Suburb"
              >
                <option value="">🌍 All Areas</option>
                <optgroup label="📍 Active Portfolio Areas">
                  {Array.from(new Set(allPropertiesPool.map((p) => p.area).filter(Boolean))).map((areaStr) => (
                    <option key={`active-${areaStr}`} value={areaStr}>
                      {areaStr}
                    </option>
                  ))}
                </optgroup>
                {GLOBAL_AREA_GROUPS.map((grp) => (
                  <optgroup key={grp.groupLabel} label={grp.groupLabel}>
                    {grp.options.map((opt) => (
                      <option key={opt.area} value={opt.area}>
                        {opt.flag} {opt.area}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Type city, suburb, hotel, or country (e.g. Camps Bay, Sandton, Dubai)..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.trim()) {
                      setSelectedGlobalRegion('all');
                      setSelectedCity('all');
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      document.getElementById('residences-grid')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-emerald-600 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Check-In Date */}
          <div className="md:col-span-2 space-y-1">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
              <span>Check-In</span>
            </label>
            <input
              type="date"
              value={checkInDate}
              onChange={(e) => handleCheckInDateChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-emerald-600 cursor-pointer"
            />
          </div>

          {/* Check-Out Date */}
          <div className="md:col-span-2 space-y-1">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
              <span>Check-Out</span>
            </label>
            <input
              type="date"
              value={checkOutDate}
              min={checkInDate}
              onChange={(e) => handleCheckOutDateChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-emerald-600 cursor-pointer"
            />
          </div>

          {/* Stay Nights Calculator */}
          <div className="md:col-span-3 space-y-1">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-emerald-950 flex items-center justify-between">
              <span>Stay Duration</span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">
                ⚡ Auto Nights
              </span>
            </label>
            <div className="flex items-center gap-2">
              <select
                aria-label="Stay Nights"
                value={calculatedNights}
                onChange={(e) => handleStayNightsSelect(Number(e.target.value))}
                className="flex-1 px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-black text-emerald-950 focus:outline-hidden cursor-pointer"
                title="Select number of nights"
              >
                <option value={1}>1 Night Stay</option>
                <option value={2}>2 Nights Stay</option>
                <option value={3}>3 Nights (Weekend)</option>
                <option value={4}>4 Nights Stay</option>
                <option value={5}>5 Nights (Business)</option>
                <option value={7}>7 Nights (1 Week)</option>
                <option value={10}>10 Nights Stay</option>
                <option value={14}>14 Nights (2 Weeks)</option>
                <option value={21}>21 Nights Stay</option>
                <option value={30}>30 Nights (Monthly)</option>
              </select>
              <div className="px-2.5 py-2 rounded-xl bg-emerald-900 text-white text-xs font-black shrink-0">
                {calculatedNights}N
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Accommodation Type, Room Type, Channel Source, and Search Action */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 pt-2 border-t border-slate-100">
          {/* Accommodation Type */}
          <div className="md:col-span-3 space-y-1">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Accommodation Type</span>
            </label>
            <select
              value={selectedAccommodationType}
              onChange={(e) => setSelectedAccommodationType(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-emerald-600 cursor-pointer"
            >
              <option value="all">🏨 All Holiday Accommodation Types</option>
              <option value="hotel">🏢 Luxury Hotel & Boutique Suites</option>
              <option value="villa">🏖️ Private Beachfront & Pool Villa</option>
              <option value="safari">🦁 Safari & Game Reserve Lodge</option>
              <option value="apartment">🏙️ Serviced Executive Apartment</option>
              <option value="penthouse">🛋️ Penthouse & Sky Loft Suite</option>
              <option value="bnb">☕ Bed & Breakfast / Estate</option>
              <option value="resort">🏡 Holiday Resort & Country Estate</option>
            </select>
          </div>

          {/* Room / Suite Type */}
          <div className="md:col-span-3 space-y-1">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <BedDouble className="w-3.5 h-3.5 text-emerald-600" />
              <span>Room / Suite Type</span>
            </label>
            <select
              value={selectedRoomType}
              onChange={(e) => setSelectedRoomType(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-emerald-600 cursor-pointer"
            >
              <option value="all">🛏️ All Suite & Room Types</option>
              <option value="master_suite">👑 Master En-Suite Executive</option>
              <option value="deluxe_room">🛌 Deluxe King / Queen Room</option>
              <option value="studio">💻 Executive Workstation Studio</option>
              <option value="family_room">👨‍👩‍👧 Family Multi-Bedroom Suite</option>
              <option value="entire_unit">🏡 Entire Residence / Unit</option>
            </select>
          </div>

          {/* Channel Filter */}
          <div className="md:col-span-3 space-y-1">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>Source Channel</span>
            </label>
            <select
              value={selectedChannelFilter}
              onChange={(e) => setSelectedChannelFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-emerald-600 cursor-pointer"
            >
              <option value="all">🌐 All Channels & Direct</option>
              <option value="ScopeBridge Direct">🟢 ScopeBridge Direct (Host Official)</option>
              <option value="Booking.com">🔵 Booking.com Channel</option>
              <option value="Airbnb">🔴 Airbnb Superhost Channel</option>
              <option value="Agoda">🟡 Agoda Global Channel</option>
              <option value="Expedia">🟣 Expedia Partner Channel</option>
              <option value="LekkeSlaap">🟠 LekkeSlaap SA Verified</option>
              <option value="SafariNow">🦏 SafariNow Safari Channel</option>
              <option value="Vrbo">🧭 Vrbo Vacation Channel</option>
            </select>
          </div>

          {/* Search Button */}
          <div className="md:col-span-3 flex items-end">
            <button
              type="button"
              onClick={() => {
                document.getElementById('residences-grid')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-[0.99] text-white font-black text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4 text-amber-300" />
              <span>Search All Channels ({filteredProperties.length})</span>
            </button>
          </div>
        </div>

        {/* Row 3: Active Results Summary Banner & Breakdown */}
        <div className="p-3 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 rounded-2xl text-white flex flex-wrap items-center justify-between gap-3 text-xs border border-emerald-800/40">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-extrabold text-slate-200">
              Found <strong className="text-emerald-300 font-mono text-sm">{filteredProperties.length}</strong> Accommodations
              {searchQuery ? ` matching "${searchQuery}"` : ''} for{' '}
              <strong className="text-amber-300">{calculatedNights} Night{calculatedNights > 1 ? 's' : ''}</strong>{' '}
              ({checkInDate} → {checkOutDate})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400">Channels Connected & Aggregated:</span>
            <span className="text-[10px] bg-emerald-900/80 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-700">
              ✓ ScopeBridge Direct
            </span>
            <span className="text-[10px] bg-blue-900/80 text-blue-200 px-2 py-0.5 rounded-full border border-blue-700">
              ✓ Booking.com
            </span>
            <span className="text-[10px] bg-rose-900/80 text-rose-200 px-2 py-0.5 rounded-full border border-rose-700">
              ✓ Airbnb
            </span>
            <span className="text-[10px] bg-amber-900/80 text-amber-200 px-2 py-0.5 rounded-full border border-amber-700">
              ✓ LekkeSlaap
            </span>
            <span className="text-[10px] bg-sky-900/80 text-sky-200 px-2 py-0.5 rounded-full border border-sky-700">
              ✓ Expedia
            </span>
            <span className="text-[10px] bg-teal-900/80 text-teal-200 px-2 py-0.5 rounded-full border border-teal-700">
              ✓ SafariNow
            </span>
            <span className="text-[10px] bg-indigo-900/80 text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-700">
              ✓ Agoda
            </span>
            <span className="text-[10px] bg-purple-900/80 text-purple-200 px-2 py-0.5 rounded-full border border-purple-700">
              ✓ Trip.com
            </span>
            <span className="text-[10px] bg-yellow-900/80 text-yellow-200 px-2 py-0.5 rounded-full border border-yellow-700">
              ✓ Marriott Bonvoy
            </span>
            <span className="text-[10px] bg-emerald-800/80 text-emerald-100 px-2 py-0.5 rounded-full border border-emerald-600">
              ✓ TripAdvisor
            </span>
          </div>
        </div>

        {/* Row 4: Filters Trigger & View Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          {/* Flexible Filters trigger */}
          <button
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              showFilterDrawer ||
              maxPrice < 5000 ||
              filterSelfCheckIn ||
              filterParking ||
              filterWifi ||
              filterKitchen ||
              filterPetFriendly ||
              filterFamilyFriendly ||
              filterSolar
                ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
            <span>Filters</span>
            {(filterSelfCheckIn ||
              filterParking ||
              filterWifi ||
              filterKitchen ||
              filterPetFriendly ||
              filterFamilyFriendly ||
              filterSolar ||
              maxPrice < 5000) && <span className="w-2 h-2 bg-emerald-600 rounded-full"></span>}
          </button>

          {/* View Switcher (Grid vs Map View) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Listings ({filteredProperties.length})
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Map View</span>
            </button>
          </div>
        </div>

        {/* Real Live Location Search Corridors (Bryanston, Sandton, Ferndale, Johannesburg, Cape Town, London, Dubai) */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-800 font-extrabold text-[11px] flex items-center gap-1 mr-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            Live Search Corridors:
          </span>
          {[
            { label: 'Bryanston (17onBuffalo Suites)', query: 'Bryanston' },
            { label: 'Sandton (Rivonia & Executive)', query: 'Sandton' },
            { label: 'Ferndale (Republic Lofts)', query: 'Ferndale' },
            { label: 'Johannesburg (All Suburbs)', query: 'Johannesburg' },
            { label: 'Cape Town (Camps Bay & Waterfront)', query: 'Cape Town' },
            { label: 'London (Mayfair Executive Mews)', query: 'London' },
            { label: 'Dubai (Burj Khalifa Penthouse)', query: 'Dubai' },
          ].map((loc) => {
            const isActive = searchQuery.toLowerCase().includes(loc.query.toLowerCase());
            return (
              <button
                key={loc.query}
                type="button"
                onClick={() => {
                  setSearchQuery(loc.query);
                  setSelectedGlobalRegion('all');
                  setSelectedCity('all');
                  document.getElementById('residences-grid')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs ring-2 ring-emerald-400'
                    : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border-slate-200'
                }`}
                title={`Filter real suites in ${loc.label}`}
              >
                📍 {loc.label}
              </button>
            );
          })}
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-[11px] text-rose-600 hover:text-rose-800 hover:underline font-bold ml-1 cursor-pointer"
              title="Reset location search"
            >
              ✕ Reset
            </button>
          )}
        </div>

        {/* Direct Channel Search Filter Bar */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-700 font-extrabold text-[11px] flex items-center gap-1 mr-1">
            <Globe className="w-3.5 h-3.5 text-emerald-700" />
            Search Direct by Channel:
          </span>
          {[
            { id: 'all', label: 'All Channels' },
            { id: 'ScopeBridge Direct', label: '✓ ScopeBridge Direct (All Registered)' },
            { id: 'Booking.com', label: 'Booking.com' },
            { id: 'Airbnb', label: 'Airbnb' },
            { id: 'Agoda', label: 'Agoda' },
            { id: 'Trip.com', label: 'Trip.com' },
            { id: 'LekkeSlaap', label: 'LekkeSlaap' },
            { id: 'Expedia', label: 'Expedia' },
          ].map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => setSelectedChannelFilter(ch.id)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                selectedChannelFilter === ch.id
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200'
              }`}
            >
              {ch.label}
            </button>
          ))}
        </div>

        {/* Google Discovery Quick Links Bar */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-semibold text-[11px] flex items-center gap-1">
            <Globe className="w-3 h-3 text-blue-600" />
            Google Travel Tools:
          </span>

          <a
            href={`https://www.google.com/search?q=${encodeURIComponent((searchQuery.trim() || 'executive luxury') + ' accommodation hotel stays')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full font-medium transition-all bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 cursor-pointer"
          >
            <Search className="w-3 h-3" />
            <span>Google Accommodations</span>
            <ExternalLink className="w-2.5 h-2.5 text-blue-500" />
          </a>

          <a
            href={`https://www.google.com/maps/search/${encodeURIComponent(searchQuery.trim() || 'hotels and vacation stays')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full font-medium transition-all bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-pointer"
          >
            <MapPin className="w-3 h-3" />
            <span>Google Maps</span>
            <ExternalLink className="w-2.5 h-2.5 text-emerald-500" />
          </a>

          <a
            href={`https://www.google.com/travel/flights?q=${encodeURIComponent(searchQuery.trim() || 'flights')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full font-medium transition-all bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 cursor-pointer"
          >
            <Plane className="w-3 h-3" />
            <span>Google Flights</span>
            <ExternalLink className="w-2.5 h-2.5 text-sky-500" />
          </a>

          <a
            href={`https://www.google.com/search?q=${encodeURIComponent((searchQuery.trim() || 'local area') + ' best restaurants and dining guide')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full font-medium transition-all bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 cursor-pointer"
          >
            <Utensils className="w-3 h-3" />
            <span>Local Dining on Google</span>
            <ExternalLink className="w-2.5 h-2.5 text-amber-500" />
          </a>
        </div>

        {/* Proximity Quick Badges */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-semibold text-[11px] flex items-center gap-1">
            <MapPin className="w-3 h-3 text-emerald-600" />
            Proximity Focus:
          </span>

          <button
            onClick={() =>
              setTargetLandmark(
                targetLandmark === 'shopping' ? 'all' : 'shopping'
              )
            }
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer ${
              targetLandmark === 'shopping'
                ? 'bg-indigo-600 text-white shadow-xs font-bold'
                : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            <ShoppingBag className="w-3 h-3" />
            <span>Near Shopping & Malls (&lt;1km)</span>
          </button>

          <button
            onClick={() => setTargetLandmark(targetLandmark === 'business' ? 'all' : 'business')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer ${
              targetLandmark === 'business'
                ? 'bg-rose-600 text-white shadow-xs font-bold'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <Building className="w-3 h-3" />
            <span>Near Business Hubs (&lt;2.5km)</span>
          </button>

          <button
            onClick={() => setTargetLandmark(targetLandmark === 'transit' ? 'all' : 'transit')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer ${
              targetLandmark === 'transit'
                ? 'bg-cyan-600 text-white shadow-xs font-bold'
                : 'bg-cyan-50 text-cyan-800 hover:bg-cyan-100 border border-cyan-200'
            }`}
          >
            <Car className="w-3 h-3" />
            <span>Near Transit & Shuttles</span>
          </button>

          <button
            onClick={() => setTargetLandmark(targetLandmark === 'dining' ? 'all' : 'dining')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer ${
              targetLandmark === 'dining'
                ? 'bg-amber-600 text-white shadow-xs font-bold'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Coffee className="w-3 h-3" />
            <span>Near Dining & Cafes</span>
          </button>

          {targetLandmark !== 'all' && (
            <button
              onClick={() => setTargetLandmark('all')}
              className="text-[11px] text-slate-500 hover:text-slate-800 font-bold underline ml-1 cursor-pointer"
            >
              Clear proximity
            </button>
          )}
        </div>

        {/* Flexible Filters Drawer Panel */}
        {showFilterDrawer && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4 pt-4 mt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Search & Amenity Filters
              </h3>
              <button
                onClick={() => {
                  setMaxPrice(5000);
                  setFilterSelfCheckIn(false);
                  setFilterParking(false);
                  setFilterWifi(false);
                  setFilterKitchen(false);
                  setFilterPetFriendly(false);
                  setFilterFamilyFriendly(false);
                  setFilterSolar(false);
                }}
                className="text-[11px] text-slate-500 hover:text-emerald-700 font-bold cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>

            {/* Price slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Maximum Nightly Rate:</span>
                <span className="font-bold text-emerald-800 text-sm">
                  {formatPrice(maxPrice)} / night
                </span>
              </div>
              <input
                type="range"
                min="500"
                max="5000"
                step="100"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-emerald-700 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>{formatPrice(500)}</span>
                <span>{formatPrice(2500)}</span>
                <span>{formatPrice(5000)}</span>
              </div>
            </div>

            {/* Checkbox pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-emerald-400">
                <input
                  type="checkbox"
                  checked={filterSelfCheckIn}
                  onChange={(e) => setFilterSelfCheckIn(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Self check-in</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-emerald-400">
                <input
                  type="checkbox"
                  checked={filterParking}
                  onChange={(e) => setFilterParking(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <Car className="w-3.5 h-3.5 text-emerald-600" />
                <span>Free Parking</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-emerald-400">
                <input
                  type="checkbox"
                  checked={filterWifi}
                  onChange={(e) => setFilterWifi(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span>Fibre WiFi</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-emerald-400">
                <input
                  type="checkbox"
                  checked={filterKitchen}
                  onChange={(e) => setFilterKitchen(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                <span>Full Kitchen</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-emerald-400">
                <input
                  type="checkbox"
                  checked={filterPetFriendly}
                  onChange={(e) => setFilterPetFriendly(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <PawPrint className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pet-friendly</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-emerald-400">
                <input
                  type="checkbox"
                  checked={filterFamilyFriendly}
                  onChange={(e) => setFilterFamilyFriendly(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span>Family-friendly</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-emerald-400 col-span-2">
                <input
                  type="checkbox"
                  checked={filterSolar}
                  onChange={(e) => setFilterSolar(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <SunMedium className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-semibold text-slate-800">Solar & Inverter Backup</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Main View: Grid vs Interactive Map */}
      {viewMode === 'map' ? (
        <InteractiveMap
          properties={filteredProperties}
          selectedProperty={selectedProperty}
          onSelectProperty={(prop) => setSelectedProperty(prop)}
          targetLandmark={targetLandmark}
          onSelectLandmark={(lm) => setTargetLandmark(lm)}
          onBookPropertyClick={(prop) => setSelectedProperty(prop)}
        />
      ) : (
        /* Listings Grid View */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Showing <strong className="text-slate-800">{filteredProperties.length}</strong>{' '}
              verified ScopeBridg residences
            </span>
            <span className="text-[11px] text-emerald-800 font-semibold">
              🔒 Direct booking guarantee • Verified Host: Mdluli Nhlanhla & Partners
            </span>
          </div>

          {filteredProperties.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 shadow-xs">
              <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">No matching residences found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  We couldn't find any properties matching "{searchQuery}" on our list. Would you like to check real-time availability on Google?
                </p>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    const query = searchQuery.trim() || 'executive luxury stays';
                    window.open(`https://www.google.com/search?q=${encodeURIComponent(query + ' accommodation hotel bnb stays')}`, '_blank', 'noopener,noreferrer');
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Search "{searchQuery || 'luxury stays'}" on Google</span>
                  <ExternalLink className="w-3 h-3 text-blue-200" />
                </button>

                <button
                  onClick={() => {
                    const query = searchQuery.trim() || 'hotels and holiday apartments';
                    window.open(`https://www.google.com/maps/search/${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer');
                  }}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Explore on Google Maps</span>
                  <ExternalLink className="w-3 h-3 text-emerald-200" />
                </button>

                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedGlobalRegion('all');
                    setSelectedCity('all');
                    setTargetLandmark('all');
                    setMaxPrice(5000);
                    setFilterSelfCheckIn(false);
                    setFilterParking(false);
                    setFilterWifi(false);
                    setFilterKitchen(false);
                    setFilterPetFriendly(false);
                    setFilterFamilyFriendly(false);
                    setFilterSolar(false);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200"
                >
                  Reset All Filters
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProperties.map((property) => {
              const isWishlisted = wishlistIds.includes(property.id);
              const isHighInterest = property.rating >= 4.7 || property.reviewCount >= 8 || property.basePrice >= 1200;

              return (
                <div
                  key={property.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group relative"
                >
                  {/* Image container */}
                  <div className="relative aspect-16/10 overflow-hidden bg-slate-100">
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80';
                      }}
                    />

                    {/* Wishlist Heart Button */}
                    <button
                      onClick={() => onToggleWishlist(property.id)}
                      className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-xs transition-all cursor-pointer z-10 ${
                        isWishlisted
                          ? 'bg-white text-rose-600 shadow-md'
                          : 'bg-slate-900/40 text-white hover:bg-white hover:text-rose-600'
                      }`}
                      title={isWishlisted ? 'Saved' : 'Save to wishlist'}
                    >
                      <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600' : ''}`} />
                    </button>

                    {/* Primary Channel Origin Badge */}
                    <div className="absolute top-3 right-12 bg-slate-900/90 text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md border border-slate-700">
                      <span>
                        {property.requestedChannels?.includes('Booking.com') || property.publishedChannels?.includes('booking_com')
                          ? '🔵 Booking.com'
                          : property.requestedChannels?.includes('Airbnb') || property.publishedChannels?.includes('airbnb')
                          ? '🔴 Airbnb'
                          : property.requestedChannels?.includes('LekkeSlaap') || property.publishedChannels?.includes('lekkeslaap')
                          ? '🟠 LekkeSlaap'
                          : property.requestedChannels?.includes('SafariNow')
                          ? '🦏 SafariNow'
                          : property.requestedChannels?.includes('Agoda')
                          ? '🟡 Agoda'
                          : '🟢 ScopeBridg Direct'}
                      </span>
                    </div>

                    {/* High Interest Bidding Badge */}
                    {isHighInterest && (
                      <div className="absolute bottom-3 right-3 bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                        <Tag className="w-3 h-3 text-slate-950" />
                        <span>Bids Open</span>
                      </div>
                    )}

                    {/* Country & Global Flag Badge + Accommodation Type */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
                      <div className="bg-slate-900/90 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                        <span>{property.flag || '📍'}</span>
                        <span>
                          {property.city ? `${property.city}, ${property.country}` : property.area}
                        </span>
                      </div>
                      <span className="bg-emerald-950/90 text-emerald-300 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-700 uppercase tracking-wider">
                        {(property.propertyType as string) === 'villa'
                          ? '🏖️ Beach & Pool Villa'
                          : (property.propertyType as string) === 'safari' || property.title.toLowerCase().includes('safari')
                          ? '🦁 Safari Game Lodge'
                          : (property.propertyType as string) === 'penthouse' || property.title.toLowerCase().includes('penthouse')
                          ? '🛋️ Sky Penthouse Loft'
                          : (property.propertyType as string) === 'hotel'
                          ? '🏢 Luxury Hotel'
                          : (property.propertyType as string) === 'bnb'
                          ? '☕ Bed & Breakfast'
                          : '🏙️ Serviced Residence'}
                      </span>
                    </div>

                    {/* Real photos counter badge */}
                    <div className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur-xs text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border border-slate-800">
                      <span>📸 {(property.images?.length || 0) + (property.rooms?.reduce((acc, r) => acc + (r.images?.length || 0), 0) || 0) + (property.guestPhotos?.length || 0)} photos</span>
                    </div>
                  </div>

                  {/* Content card */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      {/* Rating & Area */}
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          {property.area}
                        </span>
                        <div className="flex items-center gap-1 text-slate-800 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          <span>{property.rating}</span>
                          <span className="text-slate-400 font-normal">
                            ({property.reviewCount})
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <h3
                        onClick={() => setSelectedProperty(property)}
                        className="font-bold text-slate-900 text-sm leading-snug hover:text-emerald-700 cursor-pointer"
                      >
                        {property.title}
                      </h3>

                      {/* Distances & Perks */}
                      <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px]">
                        {property.id.startsWith('syn-') && (
                          <span className="bg-indigo-600 text-white px-2 py-0.5 rounded font-bold flex items-center gap-1 shadow-xs">
                            <Globe className="w-2.5 h-2.5" />
                            <span>Worldwide Syndicate</span>
                          </span>
                        )}
                        {property.distances?.ferndaleOnRepublic && !property.id.startsWith('syn-') && (
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium border border-slate-200">
                            🚶 {property.distances.ferndaleOnRepublic} to Shopping
                          </span>
                        )}
                        {property.amenities.solarInverter && (
                          <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-medium border border-emerald-100 flex items-center gap-1">
                            <SunMedium className="w-2.5 h-2.5" />
                            <span>Solar Backup</span>
                          </span>
                        )}
                        {property.amenities.selfCheckIn && (
                          <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-medium border border-blue-100">
                            Smart Lock
                          </span>
                        )}
                      </div>

                      {/* Rooms & Channel Visibility / Registration */}
                      <div className="mt-2 pt-2 border-t border-dashed border-slate-200 space-y-1.5">
                        {/* Rooms Added with Real-Time Occupancy Status */}
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-[9px] text-slate-600 uppercase font-extrabold">
                            🛏️ Rooms ({(property.rooms || []).length || 1}):
                          </span>
                          {(property.rooms || []).length === 0 ? (
                            <span className="text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded font-bold">
                              🟢 Executive Suite ({formatPrice(property.basePrice)})
                            </span>
                          ) : (
                            (property.rooms || []).map((rm) => {
                              const st = getRoomOccupancyStatus({ room: rm, property, bookings });
                              return (
                                <span
                                  key={rm.id}
                                  className={`text-[9px] px-2 py-0.5 rounded-lg font-bold border flex items-center gap-1 ${
                                    st.status === 'occupied'
                                      ? 'bg-rose-50 text-rose-800 border-rose-300'
                                      : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  }`}
                                  title={`${rm.name} (${rm.bedConfiguration || 'Suite'}): ${formatPrice(rm.basePrice)}/night — ${formatPrice(rm.basePrice * calculatedNights)} for ${calculatedNights} nights`}
                                >
                                  <span>{st.status === 'occupied' ? '🔴' : '🟢'}</span>
                                  <span className="font-extrabold">{rm.name}</span>
                                  {rm.bedConfiguration && (
                                    <span className="text-[8px] bg-white/80 px-1 rounded text-slate-600 font-semibold border border-slate-200">
                                      {rm.bedConfiguration.includes('King') ? '👑 King' : rm.bedConfiguration.includes('Queen') ? '🛏️ Queen' : rm.bedConfiguration}
                                    </span>
                                  )}
                                  <span className="text-emerald-950 font-black">
                                    {formatPrice(rm.basePrice)}/n
                                  </span>
                                </span>
                              );
                            })
                          )}
                        </div>

                        {/* Visible Channels */}
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-[9px] text-emerald-800 uppercase font-extrabold">
                            📡 Visible Channels:
                          </span>
                          <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-extrabold">
                            ✓ ScopeBridge Direct
                          </span>
                          {(property.publishedChannels || ['ch-booking', 'ch-airbnb'])
                            .filter((c) => !c.toLowerCase().includes('direct'))
                            .map((ch, idx) => (
                              <span
                                key={idx}
                                className="text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-extrabold"
                              >
                                ✓ {ch.replace('ch-', '').toUpperCase()}
                              </span>
                            ))}
                        </div>

                        {/* Registered Channels */}
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-[9px] text-indigo-800 uppercase font-extrabold">
                            📋 Registered (Owner & Property):
                          </span>
                          {(property.requestedChannels && property.requestedChannels.length > 0
                            ? property.requestedChannels
                            : ['ScopeBridge Direct', 'Booking.com', 'Airbnb']
                          ).map((ch, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] bg-indigo-50 text-indigo-800 border border-indigo-200 px-1.5 py-0.5 rounded font-bold"
                            >
                              {ch}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Pricing & Instant Stay Calculation */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1">
                      <div>
                        <div className="text-base font-black text-slate-900 flex items-baseline gap-1">
                          <span>{formatPrice(property.basePrice)}</span>
                          <span className="text-[11px] text-slate-500 font-normal">/ night</span>
                        </div>
                        <div className="text-[11px] font-extrabold text-emerald-800 flex items-center gap-1 mt-0.5">
                          <span className="bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded text-[10px]">
                            ⚡ {formatPrice(property.basePrice * calculatedNights)} total
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold">
                            ({calculatedNights} night{calculatedNights > 1 ? 's' : ''})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isHighInterest && (
                          <button
                            onClick={() => setBiddingProperty(property)}
                            className="px-2.5 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 rounded-xl text-xs font-black shadow-xs transition-all flex items-center gap-1 cursor-pointer hover:scale-[1.02]"
                            title="Make custom price offer on this room"
                          >
                            <Tag className="w-3.5 h-3.5 text-slate-950" />
                            <span>Bid Now</span>
                          </button>
                        )}

                        <button
                          onClick={() => openChatForProperty(property)}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          title="Chat with Host"
                        >
                          <MessageSquare className="w-4 h-4 text-emerald-700" />
                        </button>

                        <button
                          onClick={() => setSelectedProperty(property)}
                          className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Book
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      )}
      </>
      )}

      {/* Room Bid Modal */}
      {biddingProperty && (
        <RoomBidModal
          property={biddingProperty}
          onClose={() => setBiddingProperty(null)}
          onSubmitBid={(bid) => {
            if (onAddRoomBid) {
              onAddRoomBid(bid);
            }
          }}
        />
      )}

      {/* Property Detail Modal */}
      {selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          reviews={reviews.filter((r) => r.propertyId === selectedProperty.id)}
          bookings={bookings}
          isWishlisted={wishlistIds.includes(selectedProperty.id)}
          onToggleWishlist={onToggleWishlist}
          onClose={() => setSelectedProperty(null)}
          onBookProperty={onBookProperty}
          onAddRoomBid={onAddRoomBid}
          onOpenChat={openChatForProperty}
          currentUser={currentUser}
        />
      )}

      {/* Wishlist Drawer */}
      {isWishlistOpen && (
        <WishlistDrawer
          wishlistIds={wishlistIds}
          properties={properties}
          onRemoveWishlist={onToggleWishlist}
          onSelectProperty={(prop) => setSelectedProperty(prop)}
          onClose={() => setIsWishlistOpen(false)}
        />
      )}

      {/* Trip Tools Modal */}
      {isTripToolsOpen && (
        <TripToolsModal
          bookings={bookings}
          properties={properties}
          onClose={() => setIsTripToolsOpen(false)}
          onOpenWhatsApp={(phone, text) => {
            window.open(
              `https://wa.me/${phone.replace(/\+/g, '')}?text=${encodeURIComponent(text)}`,
              '_blank'
            );
          }}
        />
      )}

      {/* 24/7 AI Host & WhatsApp Chat Modal */}
      {isChatOpen && (
        <LiveChatModal
          property={chatTargetProperty}
          onClose={() => setIsChatOpen(false)}
        />
      )}

      {/* Guest Area Guide Modal */}
      <GuestAreaGuideModal
        isOpen={isAreaGuideOpen}
        onClose={() => setIsAreaGuideOpen(false)}
      />

      {/* Guest Safety & Emergency Modal */}
      <GuestEmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
      />

      {/* Guest On-Call Nanny Modal */}
      <GuestNannyOnCallModal
        isOpen={isNannyOnCallOpen}
        onClose={() => setIsNannyOnCallOpen(false)}
        nannies={nannies}
        nannyBookings={nannyBookings}
        properties={properties}
        onAddNannyBooking={onAddNannyBooking}
        onUpdateNannyBookingStatus={onUpdateNannyBookingStatus}
      />

      {/* Guest On-Call Shuttle Modal */}
      <GuestShuttleOnCallModal
        isOpen={isShuttleOnCallOpen}
        onClose={() => setIsShuttleOnCallOpen(false)}
        drivers={shuttleDrivers}
        shuttleBookings={shuttleBookings}
        properties={properties}
        selectedCurrency={selectedCurrency}
        onAddShuttleBooking={onAddShuttleBooking}
        onUpdateShuttleBookingStatus={onUpdateShuttleBookingStatus}
      />
    </div>
  );
};

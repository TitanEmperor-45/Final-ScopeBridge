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

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedAccommodationType !== 'all') count++;
    if (selectedRoomType !== 'all') count++;
    if (selectedChannelFilter !== 'all') count++;
    if (selectedBedConfig !== 'all') count++;
    if (targetLandmark !== 'all') count++;
    if (maxPrice < 5000) count++;
    if (filterSelfCheckIn) count++;
    if (filterParking) count++;
    if (filterWifi) count++;
    if (filterKitchen) count++;
    if (filterPetFriendly) count++;
    if (filterFamilyFriendly) count++;
    if (filterSolar) count++;
    return count;
  }, [
    selectedAccommodationType,
    selectedRoomType,
    selectedChannelFilter,
    selectedBedConfig,
    targetLandmark,
    maxPrice,
    filterSelfCheckIn,
    filterParking,
    filterWifi,
    filterKitchen,
    filterPetFriendly,
    filterFamilyFriendly,
    filterSolar,
  ]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedAccommodationType('all');
    setSelectedRoomType('all');
    setSelectedChannelFilter('all');
    setSelectedBedConfig('all');
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
          {/* 1. Sleek One-Touch Discovery & Suburb Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {[
              {
                id: 'all',
                label: `🌍 All Stays (${allPropertiesPool.length})`,
                action: () => handleResetFilters(),
                isActive: !searchQuery && selectedAccommodationType === 'all' && selectedChannelFilter === 'all' && !filterSolar && !filterSelfCheckIn,
              },
              {
                id: 'rivonia',
                label: '📍 Rivonia, Sandton',
                action: () => {
                  setSearchQuery('Rivonia');
                  setSelectedGlobalRegion('all');
                  setSelectedCity('all');
                },
                isActive: searchQuery.toLowerCase().includes('rivonia'),
              },
              {
                id: 'bryanston',
                label: '📍 Bryanston & Morningside',
                action: () => {
                  setSearchQuery('Bryanston');
                  setSelectedGlobalRegion('all');
                  setSelectedCity('all');
                },
                isActive: searchQuery.toLowerCase().includes('bryanston'),
              },
              {
                id: 'solar',
                label: '☀️ 100% Solar & Inverter Backup',
                action: () => setFilterSolar(!filterSolar),
                isActive: filterSolar,
              },
              {
                id: 'self-checkin',
                label: '🔑 Smart Lock Self Check-in',
                action: () => setFilterSelfCheckIn(!filterSelfCheckIn),
                isActive: filterSelfCheckIn,
              },
              {
                id: 'parking',
                label: '🚗 Free Covered Parking',
                action: () => setFilterParking(!filterParking),
                isActive: filterParking,
              },
              {
                id: 'direct',
                label: '🟢 ScopeBridge Direct (0% Fee)',
                action: () => setSelectedChannelFilter(selectedChannelFilter === 'ScopeBridge Direct' ? 'all' : 'ScopeBridge Direct'),
                isActive: selectedChannelFilter === 'ScopeBridge Direct',
              },
              {
                id: 'booking',
                label: '🔵 Booking.com',
                action: () => setSelectedChannelFilter(selectedChannelFilter === 'Booking.com' ? 'all' : 'Booking.com'),
                isActive: selectedChannelFilter === 'Booking.com',
              },
              {
                id: 'airbnb',
                label: '🔴 Airbnb Superhost',
                action: () => setSelectedChannelFilter(selectedChannelFilter === 'Airbnb' ? 'all' : 'Airbnb'),
                isActive: selectedChannelFilter === 'Airbnb',
              },
              {
                id: 'lekkeslaap',
                label: '🟠 LekkeSlaap SA',
                action: () => setSelectedChannelFilter(selectedChannelFilter === 'LekkeSlaap' ? 'all' : 'LekkeSlaap'),
                isActive: selectedChannelFilter === 'LekkeSlaap',
              },
            ].map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={pill.action}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border shadow-2xs ${
                  pill.isActive
                    ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs ring-2 ring-emerald-500/30'
                    : 'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 border-slate-200'
                }`}
              >
                <span>{pill.label}</span>
              </button>
            ))}
          </div>

      {/* Unified Single Easy Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-3xl border border-slate-200 shadow-md space-y-3">
        {/* The Single Unified Search Bar Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 sm:gap-3 items-center">
          {/* 1. Destination / Where */}
          <div className="md:col-span-5 flex items-center gap-3 px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/40 border border-slate-200 rounded-2xl transition-all">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500 leading-none mb-1">
                Where
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  list="stay-search-suggestions"
                  placeholder="Search residence, suburb (Rivonia, Bryanston), or amenity..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedGlobalRegion('all');
                    setSelectedCity('all');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      document.getElementById('residences-grid')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="w-full bg-transparent border-none p-0 text-xs sm:text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-0"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer p-0.5"
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
              <datalist id="stay-search-suggestions">
                <option value="Rivonia Laxe (Rivonia, Sandton)" />
                <option value="17onBuffalo (Bryanston & Morningside)" />
                <option value="Rivonia, Sandton" />
                <option value="Bryanston, Sandton" />
                <option value="Sandton, Johannesburg" />
                <option value="Solar & Inverter Backup" />
                <option value="Self Check-in Smart Lock" />
                <option value="ScopeBridge Direct" />
              </datalist>
            </div>
          </div>

          {/* 2. Dates / When */}
          <div className="md:col-span-4 flex items-center gap-3 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <CalendarDays className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-1 leading-none">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  When
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full">
                  {calculatedNights} Night{calculatedNights > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => handleCheckInDateChange(e.target.value)}
                  className="bg-transparent border-none p-0 text-xs font-bold text-slate-900 focus:outline-none cursor-pointer w-[105px]"
                />
                <span className="text-slate-400 font-normal">→</span>
                <input
                  type="date"
                  value={checkOutDate}
                  min={checkInDate}
                  onChange={(e) => handleCheckOutDateChange(e.target.value)}
                  className="bg-transparent border-none p-0 text-xs font-bold text-slate-900 focus:outline-none cursor-pointer w-[105px]"
                />
              </div>
            </div>
          </div>

          {/* 3. Action Buttons: Filters & Search */}
          <div className="md:col-span-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilterDrawer(!showFilterDrawer)}
              className={`px-3 py-3 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
                showFilterDrawer || activeFiltersCount > 0
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-extrabold shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
              title="Advanced Filters"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                document.getElementById('residences-grid')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-600 hover:to-teal-700 active:scale-[0.99] text-white font-black text-xs sm:text-sm rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="truncate">Search ({filteredProperties.length})</span>
            </button>
          </div>
        </div>

        {/* Collapsible Secondary Filters (Accommodation type, Room type, Channel Source) */}
        {showFilterDrawer && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-3 pt-3 transition-all animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                Advanced Stay & Channel Filters
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedAccommodationType('all');
                  setSelectedRoomType('all');
                  setSelectedChannelFilter('all');
                  setMaxPrice(5000);
                  setFilterSelfCheckIn(false);
                  setFilterParking(false);
                  setFilterWifi(false);
                  setFilterKitchen(false);
                  setFilterPetFriendly(false);
                  setFilterFamilyFriendly(false);
                  setFilterSolar(false);
                }}
                className="text-[11px] font-bold text-slate-500 hover:text-emerald-700 cursor-pointer"
              >
                Reset Filters
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Accommodation Type */}
              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold uppercase text-slate-600">
                  Accommodation Type
                </label>
                <select
                  value={selectedAccommodationType}
                  onChange={(e) => setSelectedAccommodationType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-emerald-600 cursor-pointer"
                >
                  <option value="all">🏨 All Accommodation Types</option>
                  <option value="hotel">🏢 Luxury Hotel & Suites</option>
                  <option value="villa">🏖️ Private Beach & Pool Villa</option>
                  <option value="safari">🦁 Safari & Game Lodge</option>
                  <option value="apartment">🏙️ Serviced Apartment</option>
                  <option value="penthouse">🛋️ Penthouse & Loft</option>
                  <option value="bnb">☕ Bed & Breakfast</option>
                  <option value="resort">🏡 Holiday Resort Estate</option>
                </select>
              </div>

              {/* Room / Suite Type */}
              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold uppercase text-slate-600">
                  Room / Suite Type
                </label>
                <select
                  value={selectedRoomType}
                  onChange={(e) => setSelectedRoomType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-emerald-600 cursor-pointer"
                >
                  <option value="all">🛏️ All Suite & Room Types</option>
                  <option value="master_suite">👑 Master En-Suite</option>
                  <option value="deluxe_room">🛌 Deluxe King/Queen</option>
                  <option value="studio">💻 Executive Studio</option>
                  <option value="family_room">👨‍👩‍👧 Family Suite</option>
                  <option value="entire_unit">🏡 Entire Residence</option>
                </select>
              </div>

              {/* Channel Filter */}
              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold uppercase text-slate-600">
                  OTA Channel Source
                </label>
                <select
                  value={selectedChannelFilter}
                  onChange={(e) => setSelectedChannelFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-emerald-600 cursor-pointer"
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
            </div>

            {/* Price Range Slider */}
            <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
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

            {/* Key Amenities */}
            <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-emerald-400">
                <input
                  type="checkbox"
                  checked={filterSelfCheckIn}
                  onChange={(e) => setFilterSelfCheckIn(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Self check-in</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-emerald-400">
                <input
                  type="checkbox"
                  checked={filterParking}
                  onChange={(e) => setFilterParking(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <Car className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Free Parking</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-emerald-400">
                <input
                  type="checkbox"
                  checked={filterWifi}
                  onChange={(e) => setFilterWifi(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <Wifi className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Fibre WiFi</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-emerald-400">
                <input
                  type="checkbox"
                  checked={filterKitchen}
                  onChange={(e) => setFilterKitchen(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <Utensils className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Full Kitchen</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-emerald-400">
                <input
                  type="checkbox"
                  checked={filterPetFriendly}
                  onChange={(e) => setFilterPetFriendly(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <PawPrint className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Pet-friendly</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-emerald-400">
                <input
                  type="checkbox"
                  checked={filterFamilyFriendly}
                  onChange={(e) => setFilterFamilyFriendly(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Family-friendly</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-emerald-400 col-span-2">
                <input
                  type="checkbox"
                  checked={filterSolar}
                  onChange={(e) => setFilterSolar(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <SunMedium className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="font-semibold text-slate-800">Solar & Inverter Backup</span>
              </label>
            </div>
          </div>
        )}

        {/* 3. Live Results Status Bar & View Mode Toggle */}
        <div className="px-4 py-2.5 bg-slate-900 rounded-2xl text-white flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <span className="text-[11px] font-bold text-slate-200">
              Found <strong className="text-emerald-300 font-mono text-xs">{filteredProperties.length}</strong> Verified Accommodation{filteredProperties.length !== 1 ? "s" : ""}
              {searchQuery ? " for \"" + searchQuery + "\"" : ""} · <span className="text-amber-300 font-bold">{calculatedNights} Night{calculatedNights > 1 ? "s" : ""}</span> ({checkInDate} → {checkOutDate})
            </span>
            {(searchQuery || activeFiltersCount > 0) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[10px] text-emerald-300 hover:text-white underline font-bold cursor-pointer ml-1"
              >
                Reset Search
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
              <span>Synced Channels:</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">Direct</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">Booking.com</span>
              <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">Airbnb</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">LekkeSlaap</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">Expedia</span>
            </div>

            <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-xs">
              <button
                onClick={() => setViewMode("grid")}
                className={"px-3 py-1 rounded-lg font-bold transition-all cursor-pointer " + (
                  viewMode === "grid"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-300 hover:text-white"
                )}
              >
                Listings ({filteredProperties.length})
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={"flex items-center gap-1 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer " + (
                  viewMode === "map"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-300 hover:text-white"
                )}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Map View</span>
              </button>
            </div>
          </div>
        </div>
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
        <div id="residences-grid" className="space-y-4 scroll-mt-6">
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
                  We couldn't find any properties matching "{searchQuery}" with current filters. Reset filters to see all available verified residences.
                </p>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>View All Available Stays ({allPropertiesPool.length})</span>
                </button>
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

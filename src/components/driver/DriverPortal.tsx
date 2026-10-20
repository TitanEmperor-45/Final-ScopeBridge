import React, { useState } from 'react';
import { ShuttleDriverProfile, ShuttleBooking, Property, GlobalCurrency, FleetServiceRequest, FleetServiceType, Booking, CalendarPlanEvent, ChannelConfig, UserAccount } from '../../types';
import { CURRENCY_RATES } from '../../data/usersData';
import { BookShuttleModal } from './BookShuttleModal';
import { UniversalCalendarPlanner } from '../common/UniversalCalendarPlanner';
import {
  Car,
  Plane,
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Navigation,
  Activity,
  Award,
  AlertTriangle,
  Send,
  Plus,
  Compass,
  ArrowRight,
  TrendingUp,
  Fuel,
  Users,
  Luggage,
  Wrench,
  FileText,
  CreditCard,
  Check
} from 'lucide-react';

interface DriverPortalProps {
  drivers: ShuttleDriverProfile[];
  bookings: ShuttleBooking[];
  properties: Property[];
  selectedCurrency: GlobalCurrency;
  fleetServiceRequests?: FleetServiceRequest[];
  onUpdateBookingStatus: (bookingId: string, status: ShuttleBooking['status']) => void;
  onAddBooking: (booking: ShuttleBooking) => void;
  onAddFleetServiceRequest?: (req: Omit<FleetServiceRequest, 'id' | 'createdAt' | 'status'>) => void;
  stayBookings?: Booking[];
  calendarEvents?: CalendarPlanEvent[];
  channels?: ChannelConfig[];
  registeredUsers?: UserAccount[];
  currentUser?: UserAccount;
  onBookProperty?: (bookingData: Omit<Booking, 'id' | 'createdAt'>) => void;
  onUpdateStayBookings?: React.Dispatch<React.SetStateAction<Booking[]>>;
  onUpdateCalendarEvents?: React.Dispatch<React.SetStateAction<CalendarPlanEvent[]>>;
  onUpdateProperties?: React.Dispatch<React.SetStateAction<Property[]>>;
}

export const DriverPortal: React.FC<DriverPortalProps> = ({
  drivers,
  bookings,
  properties,
  selectedCurrency,
  fleetServiceRequests,
  onUpdateBookingStatus,
  onAddBooking,
  onAddFleetServiceRequest,
  stayBookings = [],
  calendarEvents = [],
  channels = [],
  registeredUsers = [],
  currentUser,
  onBookProperty = () => {},
  onUpdateStayBookings = () => {},
  onUpdateCalendarEvents = () => {},
  onUpdateProperties = () => {},
}) => {
  const [activeTab, setActiveTab] = useState<'active_trips' | 'calendar_planner' | 'fleet' | 'fleet_services' | 'gps_radar' | 'earnings'>('active_trips');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedDriverForBooking, setSelectedDriverForBooking] = useState<ShuttleDriverProfile | null>(null);

  // Fleet Service Form state
  const [serviceType, setServiceType] = useState<FleetServiceType>('disk_renewal');
  const [vehicleName, setVehicleName] = useState<string>('Toyota Quantum HiAce Luxury');
  const [plateNumber, setPlateNumber] = useState<string>('CA 482-910 GP');
  const [amountZar, setAmountZar] = useState<number>(650);
  const [description, setDescription] = useState<string>('Annual license disc renewal for Ferndale route transport vehicle');
  const [requestSubmittedSuccess, setRequestSubmittedSuccess] = useState<boolean>(false);

  // Mthokozisi Mbele is the primary logged-in driver (drv-1)
  const currentDriver = drivers.find((d) => d.id === 'drv-1') || drivers[0] || {
    id: 'drv-1',
    name: 'Mthokozisi Mbele',
    phone: '+27 76 419 8821',
    email: 'mthokozisi.mbele@scopebridg.co.za',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    vehicleModel: 'Mercedes-Benz V300d Avantgarde Executive',
    vehiclePlate: 'SB 01 GP',
    vehicleType: 'executive_van' as const,
    capacity: 7,
    rating: 4.98,
    totalTrips: 642,
    pdpCertified: true,
    languages: ['English', 'isiZulu'],
    status: 'available' as const,
    currentLocation: 'Ferndale / Sandton Executive Corridor',
    baseRateZar: 450,
    perKmRateZar: 18,
  };

  const activeTrip = bookings.find((b) => b.status === 'in_progress' || b.status === 'en_route') || bookings[0];

  const totalCompletedTrips = bookings.filter((b) => b.status === 'completed').length;
  const totalRevenueZar = bookings.reduce((sum, b) => sum + b.totalAmountZar, 0);
  const currencyInfo = CURRENCY_RATES[selectedCurrency] || CURRENCY_RATES.ZAR;
  const convertedRevenue = Math.round(totalRevenueZar * currencyInfo.rateToZar);

  return (
    <div className="space-y-6">
      {/* Driver Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-amber-900/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={currentDriver.avatar}
                alt={currentDriver.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400/60 shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">{currentDriver.name}</h2>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  ScopeBridg Fleet Lead
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-2">
                <Car className="w-3.5 h-3.5 text-amber-400" />
                <span>{currentDriver.vehicleModel}</span>
                <span className="font-mono bg-white/10 px-1.5 py-0.2 rounded text-[11px] text-amber-200">
                  {currentDriver.vehiclePlate}
                </span>
                <span>• ★ {currentDriver.rating} ({currentDriver.totalTrips} rides)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="schedule-new-transfer-btn"
              onClick={() => {
                setSelectedDriverForBooking(currentDriver);
                setIsBookModalOpen(true);
              }}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Schedule New Transfer
            </button>
            <a
              href={`https://wa.me/${currentDriver.phone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp Dispatch
            </a>
          </div>
        </div>

        {/* Quick Driver Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-xs p-3 rounded-xl border border-white/10">
            <span className="text-[11px] text-slate-400">Current Status</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-bold text-white uppercase tracking-wider">
                {currentDriver.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3 rounded-xl border border-white/10">
            <span className="text-[11px] text-slate-400">Total Completed Rides</span>
            <div className="text-sm font-bold text-white mt-1">
              {currentDriver.totalTrips} Trips (100% On-Time)
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3 rounded-xl border border-white/10">
            <span className="text-[11px] text-slate-400">Today’s Earnings</span>
            <div className="text-sm font-bold text-amber-300 mt-1">
              {selectedCurrency} {convertedRevenue}{' '}
              <span className="text-[11px] text-slate-400 font-mono">(R{totalRevenueZar})</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3 rounded-xl border border-white/10">
            <span className="text-[11px] text-slate-400">Security Clearance</span>
            <div className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Vetted PrDP & VIP
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        {[
          { id: 'active_trips', label: 'Assigned Transfers & Bookings', icon: Calendar, badge: bookings.length },
          { id: 'calendar_planner', label: 'Calendar & Planner (Daily/Weekly/Monthly)', icon: Calendar, badge: bookings.length + calendarEvents.length },
          { id: 'fleet', label: 'Fleet & Vehicle Roster', icon: Car, badge: drivers.length },
          { id: 'fleet_services', label: 'Fleet Approvals & Services', icon: Wrench, badge: fleetServiceRequests?.filter(r => r.status === 'pending_admin_approval').length || 0 },
          { id: 'gps_radar', label: 'Live Airport Route Radar', icon: Navigation },
          { id: 'earnings', label: 'Driver Earnings & Payouts', icon: TrendingUp },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`driver-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab: Universal Calendar & Planner */}
      {activeTab === 'calendar_planner' && (
        <UniversalCalendarPlanner
          currentRole="driver"
          currentUser={
            currentUser || {
              id: 'driver-1',
              name: currentDriver.name,
              fullName: currentDriver.name,
              username: 'driver',
              role: 'driver',
              email: 'driver@scopebridg.co.za',
              phone: currentDriver.phone,
              avatar: currentDriver.avatar,
              title: 'Executive Airport Chauffeur',
              location: 'OR Tambo & Sandton Corridor',
              registeredHolidayChannels: ['direct', 'airbnb', 'booking_com', 'expedia'],
            }
          }
          properties={properties}
          bookings={stayBookings}
          nannyBookings={[]}
          shuttleBookings={bookings}
          calendarEvents={calendarEvents}
          channels={channels}
          registeredUsers={registeredUsers}
          selectedCurrency={selectedCurrency}
          onBookProperty={onBookProperty}
          onUpdateBookings={onUpdateStayBookings}
          onUpdateCalendarEvents={onUpdateCalendarEvents}
          onUpdateProperties={onUpdateProperties}
        />
      )}

      {/* Tab 1: Active Trips & Dispatch */}
      {activeTab === 'active_trips' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Live Passenger Manifest ({bookings.length})
            </h3>
            <span className="text-xs text-slate-500">Live GPS Telemetry Connected</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {bookings.map((booking) => {
              const isEnRoute = booking.status === 'en_route' || booking.status === 'in_progress';
              const currencyInfo = CURRENCY_RATES[selectedCurrency] || CURRENCY_RATES.ZAR;
              const convertedPrice = Math.round(booking.totalAmountZar * currencyInfo.rateToZar);

              return (
                <div
                  key={booking.id}
                  className={`bg-white rounded-2xl p-5 border transition-all ${
                    isEnRoute
                      ? 'border-amber-400 ring-2 ring-amber-500/20 shadow-md'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                          {booking.id}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            booking.status === 'in_progress'
                              ? 'bg-emerald-100 text-emerald-800'
                              : booking.status === 'en_route'
                              ? 'bg-amber-100 text-amber-800'
                              : booking.status === 'completed'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          ● {booking.status.replace('_', ' ')}
                        </span>
                        {booking.flightNumber && (
                          <span className="text-[11px] bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded font-mono font-semibold flex items-center gap-1">
                            <Plane className="w-3 h-3 text-sky-600" /> Flight: {booking.flightNumber}
                          </span>
                        )}
                      </div>

                      {/* Route Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-600" /> Pickup Point
                          </span>
                          <p className="text-xs font-bold text-slate-900 mt-0.5">{booking.pickupLocation}</p>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {booking.date} at {booking.time}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                            <Compass className="w-3 h-3 text-blue-600" /> Destination
                          </span>
                          <p className="text-xs font-bold text-slate-900 mt-0.5">{booking.dropoffLocation}</p>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {booking.passengers} Passengers • {booking.luggageCount || 2} Luggage Bags
                          </span>
                        </div>
                      </div>

                      {/* Passenger Details */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                        <span className="font-semibold text-slate-900 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" /> {booking.passengerName}
                        </span>
                        <a
                          href={`tel:${booking.passengerPhone}`}
                          className="text-slate-600 hover:text-emerald-700 flex items-center gap-1"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-400" /> {booking.passengerPhone}
                        </a>
                        <span className="text-slate-500 italic">"{booking.specialInstructions}"</span>
                      </div>
                    </div>

                    {/* Actions and Status Controls */}
                    <div className="flex flex-col items-end gap-3 w-full lg:w-auto border-t lg:border-t-0 pt-3 lg:pt-0">
                      <div className="text-right">
                        <span className="text-xs text-slate-400">Total Fare:</span>
                        <div className="text-lg font-bold text-slate-900">
                          {selectedCurrency} {convertedPrice}{' '}
                          <span className="text-xs text-slate-500 font-mono">(R{booking.totalAmountZar})</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => onUpdateBookingStatus(booking.id, 'en_route')}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Mark En Route to Pickup
                          </button>
                        )}
                        {booking.status === 'en_route' && (
                          <button
                            onClick={() => onUpdateBookingStatus(booking.id, 'in_progress')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Passenger Picked Up
                          </button>
                        )}
                        {booking.status === 'in_progress' && (
                          <button
                            onClick={() => onUpdateBookingStatus(booking.id, 'completed')}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Mark Drop-Off Completed
                          </button>
                        )}
                        {Boolean(booking.passengerPhone || booking.guestPhone) && (
                          <a
                            href={`https://wa.me/${(booking.passengerPhone || booking.guestPhone || '').replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 border border-slate-200 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="WhatsApp Passenger"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Fleet & Drivers */}
      {activeTab === 'fleet' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Car className="w-4 h-4 text-amber-600" />
              ScopeBridg Chauffeur Vehicle Fleet
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {drivers.map((drv) => (
              <div key={drv.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={drv.avatar}
                      alt={drv.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{drv.name}</h4>
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                          ★ {drv.rating} ({drv.reviewCount})
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-semibold">{drv.vehicleModel}</p>
                      <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        Plate: {drv.vehiclePlate}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      drv.status === 'on_duty'
                        ? 'bg-emerald-100 text-emerald-800'
                        : drv.status === 'on_trip'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    ● {drv.status.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{drv.bio}</p>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Service Hubs:</span>
                    <span className="font-semibold text-slate-800">{(drv.serviceAreas || ['Johannesburg', 'Randburg', 'OR Tambo']).join(', ')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Capacity:</span>
                    <span className="font-semibold text-slate-800">
                      {drv.maxPassengers || drv.vehicleCapacity || 4} Pax • {drv.maxLuggage || 4} Large Cases
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Airport Transfer Base:</span>
                    <span className="font-bold text-emerald-700">R{drv.baseRateAirportZar || 450} ZAR</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Certifications & Vetting
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(drv.certifications || ['Professional Driver Permit (PrDP)', 'Advanced Defensive Driving']).map((c, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200"
                      >
                        ✓ {c}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedDriverForBooking(drv);
                    setIsBookModalOpen(true);
                  }}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" /> Book with {drv.name.split(' ')[0]}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: GPS Radar */}
      {activeTab === 'gps_radar' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Navigation className="w-4 h-4 text-emerald-600" />
                Live Corridor & Navigation Radar
              </h3>
              <p className="text-xs text-slate-500">
                Johannesburg Airport Highway (R24/N1/N3) & Global Flight Arrival Sync
              </p>
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Telemetry
            </span>
          </div>

          <div className="relative h-64 bg-slate-900 rounded-xl overflow-hidden p-4 text-white flex flex-col justify-between border border-slate-800">
            {/* Background Grid Accent */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-700">
                <Car className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold">Vehicle: {currentDriver.vehicleModel}</span>
                <span className="text-xs text-slate-400 font-mono">({currentDriver.vehiclePlate})</span>
              </div>
              <span className="text-xs text-emerald-400 font-mono">Speed: 78 km/h • ETA: 18 mins</span>
            </div>

            <div className="relative z-10 grid grid-cols-3 gap-3">
              <div className="bg-slate-800/90 backdrop-blur-xs p-2.5 rounded-lg border border-slate-700 text-center">
                <span className="text-[10px] text-slate-400 block">Current Location</span>
                <span className="text-xs font-bold text-white">N1 Western Bypass North</span>
              </div>
              <div className="bg-slate-800/90 backdrop-blur-xs p-2.5 rounded-lg border border-slate-700 text-center">
                <span className="text-[10px] text-slate-400 block">Next Destination</span>
                <span className="text-xs font-bold text-amber-300">Sandton &amp; Rosebank</span>
              </div>
              <div className="bg-slate-800/90 backdrop-blur-xs p-2.5 rounded-lg border border-slate-700 text-center">
                <span className="text-[10px] text-slate-400 block">Traffic Status</span>
                <span className="text-xs font-bold text-emerald-400">Clear Corridor (Green)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Earnings */}
      {activeTab === 'earnings' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Chauffeur Payouts & Performance Summary
            </h3>
            <p className="text-xs text-slate-500">Multi-currency automated settlement powered by ScopeBridg</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
              <span className="text-xs text-emerald-700 font-semibold">Weekly Gross Revenue</span>
              <div className="text-2xl font-bold text-emerald-900 mt-1">
                {selectedCurrency} {convertedRevenue}
              </div>
              <span className="text-[11px] text-emerald-600 font-mono">(R{totalRevenueZar} ZAR)</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold">Trips Completed</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{currentDriver.totalTrips}</div>
              <span className="text-[11px] text-emerald-600 font-semibold">★ 4.97 High Guest Satisfaction</span>
            </div>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
              <span className="text-xs text-amber-800 font-semibold">Next Scheduled Payout</span>
              <div className="text-2xl font-bold text-amber-950 mt-1">Friday 16:00</div>
              <span className="text-[11px] text-amber-700">Instant EFT to Capitec / FNB</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Fleet Services & Approvals */}
      {activeTab === 'fleet_services' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-amber-600" />
                  Fleet Management & Admin Service Requests
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Submit vehicles registered in fleet for annual license disk renewals, traffic fine settlements, and mechanical workshop services.
                </p>
              </div>
              <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200">
                {fleetServiceRequests ? fleetServiceRequests.length : 0} Total Requests
              </span>
            </div>

            {requestSubmittedSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-emerald-950 text-base">Fleet Service Request Submitted!</h4>
                <p className="text-xs text-slate-600">
                  Your request for <strong className="text-emerald-700">{serviceType.replace('_', ' ').toUpperCase()}</strong> has been routed to Super Admin for approval and payment disbursement.
                </p>
                <button
                  onClick={() => setRequestSubmittedSuccess(false)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Submit Another Request
                </button>
              </div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                if (onAddFleetServiceRequest) {
                  onAddFleetServiceRequest({
                    driverId: currentDriver.id,
                    driverName: currentDriver.name,
                    vehicleModel: vehicleName,
                    vehiclePlate: plateNumber,
                    serviceType,
                    title: serviceType.replace('_', ' ').toUpperCase(),
                    estimatedCostZar: amountZar,
                    description,
                  });
                  setRequestSubmittedSuccess(true);
                }
              }} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Service Type</label>
                    <select
                      value={serviceType}
                      onChange={(e) => {
                        const val = e.target.value as FleetServiceType;
                        setServiceType(val);
                        if (val === 'disk_renewal') { setAmountZar(650); setDescription('Annual license disc renewal fee'); }
                        else if (val === 'fine_payment') { setAmountZar(1250); setDescription('Traffic infringement fine settlement'); }
                        else if (val === 'mechanical_service') { setAmountZar(3400); setDescription('Scheduled service / brake pads / oil change'); }
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="disk_renewal">Vehicle Disk Renewal (Licensing)</option>
                      <option value="fine_payment">Traffic Fine Payment / Settlement</option>
                      <option value="mechanical_service">Mechanical Service / Maintenance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Vehicle Name / Model</label>
                    <input
                      type="text"
                      value={vehicleName}
                      onChange={(e) => setVehicleName(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">License Plate Number</label>
                    <input
                      type="text"
                      value={plateNumber}
                      onChange={(e) => setPlateNumber(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Estimated Cost (ZAR)</label>
                    <input
                      type="number"
                      value={amountZar}
                      onChange={(e) => setAmountZar(Number(e.target.value))}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Description / Notes</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. Ferndale route vehicle routine maintenance"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <Wrench className="w-4 h-4" />
                  Submit Request for Admin Approval (R{amountZar} ZAR)
                </button>
              </form>
            )}
          </div>

          {/* Existing Fleet Requests Table / List */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-900">Your Submitted Fleet Requests & Approval Status</h4>
            <div className="space-y-3">
              {(!fleetServiceRequests || fleetServiceRequests.length === 0) ? (
                <p className="text-xs text-slate-500 py-4 text-center">No service requests found.</p>
              ) : (
                fleetServiceRequests.map((req) => (
                  <div key={req.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                          {req.id}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          req.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                          req.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          req.status === 'approved' ? 'bg-indigo-100 text-indigo-800' :
                          req.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {req.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">{req.vehiclePlate}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-900">
                        {req.vehicleModel} • <span className="text-amber-700 capitalize">{req.serviceType.replace('_', ' ')}</span> (R{(req.estimatedCostZar || 0).toLocaleString()})
                      </p>
                      <p className="text-xs text-slate-500">{req.description}</p>
                      {req.adminNotes && (
                        <p className="text-xs text-emerald-700 font-medium">Admin Notes: {req.adminNotes}</p>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-slate-400">
                      {req.createdAt.slice(0, 10)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <BookShuttleModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        driver={selectedDriverForBooking}
        allDrivers={drivers}
        properties={properties}
        selectedCurrency={selectedCurrency}
        onConfirmBooking={(b) => {
          onAddBooking(b);
          setIsBookModalOpen(false);
        }}
      />
    </div>
  );
};

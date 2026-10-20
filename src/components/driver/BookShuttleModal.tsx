import React, { useState } from 'react';
import { ShuttleDriverProfile, ShuttleBooking, Property, GlobalCurrency } from '../../types';
import { CURRENCY_RATES } from '../../data/usersData';
import {
  Car,
  Plane,
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  X,
  CreditCard,
  Briefcase,
  Users,
  Compass,
} from 'lucide-react';

interface BookShuttleModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver?: ShuttleDriverProfile | null;
  allDrivers: ShuttleDriverProfile[];
  properties: Property[];
  selectedCurrency: GlobalCurrency;
  onConfirmBooking: (booking: ShuttleBooking) => void;
}

export const BookShuttleModal: React.FC<BookShuttleModalProps> = ({
  isOpen,
  onClose,
  driver,
  allDrivers,
  properties,
  selectedCurrency,
  onConfirmBooking,
}) => {
  const defaultDriver = driver || allDrivers[0];
  const [selectedDriverId, setSelectedDriverId] = useState(defaultDriver?.id || 'drv-1');
  const [serviceType, setServiceType] = useState<ShuttleBooking['serviceType']>('airport_transfer');
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupSearch, setPickupSearch] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [dropoffSearch, setDropoffSearch] = useState('');
  const [date, setDate] = useState('2026-09-28');
  const [time, setTime] = useState('14:30');
  const [passengers, setPassengers] = useState(1);
  const [luggageCount, setLuggageCount] = useState(1);
  const [flightNumber, setFlightNumber] = useState('');
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [passengerEmail, setPassengerEmail] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  if (!isOpen) return null;

  const currentDriver = allDrivers.find((d) => d.id === selectedDriverId) || defaultDriver;
  const baseRateZar = currentDriver?.baseRateAirportZar || 450;
  const currencyInfo = CURRENCY_RATES[selectedCurrency] || CURRENCY_RATES.ZAR;
  const convertedAmount = Math.round(baseRateZar * currencyInfo.rateToZar);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newBooking: ShuttleBooking = {
      id: `SB-${Math.floor(100 + Math.random() * 900)}`,
      driverId: currentDriver.id,
      driverName: currentDriver.name,
      driverPhone: currentDriver.phone,
      vehicleModel: currentDriver.vehicleModel,
      vehiclePlate: currentDriver.vehiclePlate,
      passengerName,
      passengerPhone,
      passengerEmail,
      pickupLocation,
      dropoffLocation,
      date,
      time,
      passengers,
      luggageCount,
      flightNumber: serviceType === 'airport_transfer' ? flightNumber : undefined,
      serviceType,
      totalAmountZar: baseRateZar,
      status: 'confirmed',
      specialInstructions,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    onConfirmBooking(newBooking);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 p-6 text-white relative">
          <button
            id="close-shuttle-modal-btn"
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white tracking-tight">ScopeBridg Executive Chauffeur</h3>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Flight Tracking & Meet & Greet
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Private airport transfers & chauffeur rides in luxury vehicles with vetted professional drivers
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Driver Selection & Details */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Chauffeur & Vehicle Class
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allDrivers.map((drv) => {
                const isSel = drv.id === selectedDriverId;
                return (
                  <div
                    key={drv.id}
                    onClick={() => setSelectedDriverId(drv.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                      isSel
                        ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-500/20 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <img
                      src={drv.avatar}
                      alt={drv.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{drv.name}</span>
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                          ★ {drv.rating}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium truncate">{drv.vehicleModel}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        Plate: {drv.vehiclePlate} • Max {drv.maxPassengers} pax
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Service Type */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'airport_transfer', label: 'Airport Transfer', icon: Plane },
              { id: 'city_ride', label: 'City Point-to-Point', icon: MapPin },
              { id: 'hourly_hire', label: 'Hourly Chauffeur', icon: Clock },
            ].map((st) => {
              const Icon = st.icon;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setServiceType(st.id as any)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    serviceType === st.id
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{st.label}</span>
                </button>
              );
            })}
          </div>

          {/* Pickup & Dropoff (Empty until searched) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Pickup Location (Search to Populate)
              </label>
              <input
                type="text"
                value={pickupSearch}
                onChange={(e) => setPickupSearch(e.target.value)}
                placeholder="Search airport, station, or address..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
              />
              {pickupSearch.trim().length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-md max-h-32 overflow-y-auto divide-y divide-slate-100">
                  {[
                    'O.R. Tambo International Airport (JNB) - Terminal A',
                    'Lanseria International Airport (HLA)',
                    'Sandton Gautrain Station',
                    'Cape Town International Airport (CPT)',
                    'King Shaka International Airport (DUR)',
                    ...properties.map((p) => `${p.title} (${p.city || p.area})`),
                  ]
                    .filter((loc) => loc.toLowerCase().includes(pickupSearch.toLowerCase().trim()))
                    .map((loc, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setPickupLocation(loc);
                          setPickupSearch('');
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-amber-50 text-xs font-medium text-slate-800 block cursor-pointer"
                      >
                        {loc}
                      </button>
                    ))}
                  <button
                    type="button"
                    onClick={() => {
                      setPickupLocation(pickupSearch.trim());
                      setPickupSearch('');
                    }}
                    className="w-full text-left px-3 py-1.5 bg-slate-50 hover:bg-amber-50 text-xs font-bold text-amber-900 block cursor-pointer"
                  >
                    Use searched address: &ldquo;{pickupSearch.trim()}&rdquo;
                  </button>
                </div>
              )}
              <input
                type="text"
                value={pickupLocation}
                readOnly
                placeholder="Empty — search above to populate"
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-blue-600" /> Destination / Address (Search to Populate)
              </label>
              <input
                type="text"
                value={dropoffSearch}
                onChange={(e) => setDropoffSearch(e.target.value)}
                placeholder="Search destination residence or address..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
              />
              {dropoffSearch.trim().length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-md max-h-32 overflow-y-auto divide-y divide-slate-100">
                  {[
                    ...properties.map((p) => `${p.title} (${p.city || p.area})`),
                    'Sandton City & Nelson Mandela Square',
                    'Rosebank Mall & Gautrain Precinct',
                    'O.R. Tambo International Airport (JNB)',
                    'V&A Waterfront, Cape Town',
                  ]
                    .filter((loc) => loc.toLowerCase().includes(dropoffSearch.toLowerCase().trim()))
                    .map((loc, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setDropoffLocation(loc);
                          setDropoffSearch('');
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-amber-50 text-xs font-medium text-slate-800 block cursor-pointer"
                      >
                        {loc}
                      </button>
                    ))}
                  <button
                    type="button"
                    onClick={() => {
                      setDropoffLocation(dropoffSearch.trim());
                      setDropoffSearch('');
                    }}
                    className="w-full text-left px-3 py-1.5 bg-slate-50 hover:bg-amber-50 text-xs font-bold text-amber-900 block cursor-pointer"
                  >
                    Use searched address: &ldquo;{dropoffSearch.trim()}&rdquo;
                  </button>
                </div>
              )}
              <input
                type="text"
                value={dropoffLocation}
                readOnly
                placeholder="Empty — search above to populate"
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400"
                required
              />
            </div>
          </div>

          {/* Date, Time, Flight Number */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" /> Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" /> Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Plane className="w-3.5 h-3.5 text-slate-500" /> Flight # (optional)
              </label>
              <input
                type="text"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value)}
                placeholder="e.g. BA 055 / EK 761"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs uppercase"
              />
            </div>
          </div>

          {/* Passenger details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Passenger Name</label>
              <input
                type="text"
                value={passengerName}
                onChange={(e) => setPassengerName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp / Phone</label>
              <input
                type="text"
                value={passengerPhone}
                onChange={(e) => setPassengerPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={passengerEmail}
                onChange={(e) => setPassengerEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                required
              />
            </div>
          </div>

          {/* Total Pricing and Submit */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500">Fixed Rate:</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-slate-900">
                  {selectedCurrency} {convertedAmount}
                </span>
                <span className="text-xs text-slate-500 font-mono">(R{baseRateZar} ZAR)</span>
              </div>
              <p className="text-[10px] text-emerald-800 font-semibold mt-0.5">
                ✓ Includes flight delay buffer, tolls, water bottles & WiFi • 🏦 Configured In-App Real Online Banking (RTC)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="cancel-shuttle-booking-btn"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="confirm-shuttle-booking-btn"
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirm Transfer
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

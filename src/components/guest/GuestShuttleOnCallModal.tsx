import React, { useState } from 'react';
import { ShuttleDriverProfile, ShuttleBooking, Property, GlobalCurrency } from '../../types';
import { BookShuttleModal } from '../driver/BookShuttleModal';
import {
  X,
  Car,
  ShieldCheck,
  Check,
  Phone,
  AlertTriangle,
  Clock,
  Calendar,
  XCircle,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Plane,
  Briefcase,
  Users,
  MapPin,
  FileText
} from 'lucide-react';

interface GuestShuttleOnCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  drivers: ShuttleDriverProfile[];
  shuttleBookings: ShuttleBooking[];
  properties: Property[];
  selectedCurrency: GlobalCurrency;
  onAddShuttleBooking: (booking: ShuttleBooking) => void;
  onUpdateShuttleBookingStatus: (id: string, status: ShuttleBooking['status']) => void;
}

export const GuestShuttleOnCallModal: React.FC<GuestShuttleOnCallModalProps> = ({
  isOpen,
  onClose,
  drivers,
  shuttleBookings,
  properties,
  selectedCurrency,
  onAddShuttleBooking,
  onUpdateShuttleBookingStatus,
}) => {
  const [selectedDriver, setSelectedDriver] = useState<ShuttleDriverProfile | null>(null);
  const [isBookShuttleModalOpen, setIsBookShuttleModalOpen] = useState(false);

  if (!isOpen) return null;

  const handleConfirmShuttleBooking = (booking: ShuttleBooking) => {
    onAddShuttleBooking(booking);
    setIsBookShuttleModalOpen(false);
    setSelectedDriver(null);
  };

  const handleCancelBooking = (bookingId: string) => {
    if (window.confirm('Are you sure you want to cancel this executive shuttle transfer?')) {
      onUpdateShuttleBookingStatus(bookingId, 'cancelled');
    }
  };

  const handleRebook = (oldBooking: ShuttleBooking) => {
    const matchedDriver = drivers.find((d) => d.id === oldBooking.driverId) || drivers[0];
    if (matchedDriver) {
      setSelectedDriver(matchedDriver);
      setIsBookShuttleModalOpen(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                ScopeBridg™ Executive Shuttle & Chauffeur
              </h2>
              <p className="text-xs text-slate-400">
                VIP airport transfers & local private hires. Professional verified drivers and high-security fleets.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Scroll */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-6 bg-slate-50/50">
          
          {/* Trust Banner */}
          <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
            <div className="p-2 bg-amber-600 text-slate-950 rounded-xl shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-slate-900">
              <p className="font-extrabold text-amber-950 text-xs">Premium Executive Chauffeur Guarantee</p>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                All transfers include dynamic real-time flight tracking, professional passenger greeting boards in arrivals terminal, full luggage assist, and mineral bottled water inside our air-conditioned premium vehicle class.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Driver Profiles */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Executive Drivers & Fleet
                </h3>
                <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full border border-slate-200">
                  {drivers.length} Premium Drivers Active
                </span>
              </div>

              <div className="space-y-3">
                {drivers.map((drv) => (
                  <div
                    key={drv.id}
                    className="bg-white p-4 rounded-xl border border-slate-200 hover:border-amber-500/30 transition-all flex flex-col sm:flex-row gap-4 shadow-2xs hover:shadow-xs"
                  >
                    <div className="shrink-0 text-center space-y-2 sm:space-y-0 sm:text-left">
                      <img
                        src="https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80"
                        alt={drv.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-100 shrink-0 mx-auto sm:mx-0"
                      />
                      <div className="sm:hidden">
                        <span className="bg-amber-50 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded-full border border-amber-100">
                          {drv.vehicleModel.split(' ')[0]} Class
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1 text-center sm:text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm leading-tight truncate">
                            {drv.name}
                          </h4>
                          <span className="inline-block text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full mt-0.5 border border-slate-200">
                            ★ {drv.rating} ({drv.reviewCount} Reviews)
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-black text-slate-900">R{drv.baseRateAirportZar}</p>
                          <p className="text-[10px] text-slate-500">Airport Transfer Base</p>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-600 space-y-1">
                        <p>
                          <strong className="text-slate-800">Vehicle:</strong> {drv.vehicleModel}
                        </p>
                        <p className="text-slate-500">
                          {drv.vehicleColor} • Plate: {drv.vehiclePlate}
                        </p>
                      </div>

                      <div className="pt-3 flex flex-wrap items-center justify-center sm:justify-between gap-2 border-t border-slate-100 mt-2">
                        <span className="text-[10px] text-emerald-800 font-semibold">
                          ✓ Airport VIP Meet & Greet Included
                        </span>
                        <button
                          onClick={() => {
                            setSelectedDriver(drv);
                            setIsBookShuttleModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 bg-amber-500 text-slate-950 hover:bg-amber-600 font-extrabold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          <Car className="w-3 h-3 text-slate-950" />
                          <span>Book Shuttle</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Booking Ledger */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                Your Shuttle Bookings
              </h3>

              {shuttleBookings.length === 0 ? (
                <div className="bg-white p-6 rounded-xl border border-slate-200 text-center space-y-2">
                  <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                    <Car className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-slate-600 font-bold">No Active Shuttle Transfers</p>
                  <p className="text-[11px] text-slate-400">
                    Your scheduled private airport transfers, terminal pickups, and city hires will be logged here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {shuttleBookings.map((bk) => (
                    <div
                      key={bk.id}
                      className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-2xs relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                            <Car className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-950 text-xs block leading-tight">
                              {bk.driverName}
                            </span>
                            <span className="text-[10px] text-slate-500">ID: {bk.id}</span>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase border shrink-0 ${
                            bk.status === 'confirmed'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : bk.status === 'completed'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {bk.status}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <p className="flex justify-between">
                          <span className="text-slate-400">Passenger:</span>
                          <span className="font-semibold text-slate-800">{bk.passengerName || bk.guestName}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-400">Date & Time:</span>
                          <span className="font-semibold text-slate-800">{bk.date} @ {bk.time}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-400">Pickup:</span>
                          <span className="font-semibold text-slate-800 truncate max-w-[140px] block" title={bk.pickupLocation}>
                            {bk.pickupLocation}
                          </span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-400">Dropoff:</span>
                          <span className="font-semibold text-slate-800 truncate max-w-[140px] block" title={bk.dropoffLocation}>
                            {bk.dropoffLocation}
                          </span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-400">Vehicle Class:</span>
                          <span className="font-semibold text-slate-800">{bk.vehicleModel.split(' ')[0]} Luxury</span>
                        </p>
                        <div className="border-t border-slate-200/60 pt-1.5 mt-1.5 flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-900">Total Price:</span>
                          <span className="font-black text-amber-700">R{bk.totalAmountZar || bk.totalPriceZar}</span>
                        </div>
                      </div>

                      {/* Cancel / Re-book Actions */}
                      <div className="flex gap-2 justify-end pt-1">
                        {bk.status === 'confirmed' && (
                          <button
                            onClick={() => handleCancelBooking(bk.id)}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[10px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            title="Cancel scheduled chauffeur transfer"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>Cancel Ride</span>
                          </button>
                        )}
                        {(bk.status === 'cancelled' || bk.status === 'completed') && (
                          <button
                            onClick={() => handleRebook(bk)}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3 text-emerald-400" />
                            <span>Re-Book Shuttle</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* Embedded BookShuttleModal */}
      <BookShuttleModal
        isOpen={isBookShuttleModalOpen}
        onClose={() => {
          setIsBookShuttleModalOpen(false);
          setSelectedDriver(null);
        }}
        driver={selectedDriver}
        allDrivers={drivers}
        properties={properties}
        selectedCurrency={selectedCurrency}
        onConfirmBooking={handleConfirmShuttleBooking}
      />
    </div>
  );
};

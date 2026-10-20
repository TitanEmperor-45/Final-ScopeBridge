import React, { useState } from 'react';
import { Booking, Property } from '../../types';
import { FERNDALE_LOCAL_TIPS } from '../../data/mockData';
import { LocalTip } from '../../types';
import {
  X, MapPin, ShieldCheck, Key, Wifi, Car, Navigation, Coffee, ShoppingBag,
  Building, Phone, ExternalLink, Calendar, CheckCircle2
} from 'lucide-react';

interface TripToolsModalProps {
  bookings: Booking[];
  properties: Property[];
  onClose: () => void;
  onOpenWhatsApp: (phone: string, text: string) => void;
}

export const TripToolsModal: React.FC<TripToolsModalProps> = ({
  bookings,
  properties,
  onClose,
  onOpenWhatsApp,
}) => {
  const [selectedBookingIndex, setSelectedBookingIndex] = useState(0);
  const activeBooking = bookings[selectedBookingIndex] || bookings[0];
  const activeProperty = properties.find((p) => p.id === activeBooking?.propertyId) || properties[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Itinerary & Trip Tools (Ferndale & Randburg)
              </h2>
              <p className="text-xs text-slate-500">
                Check-in instructions, Absa route directions & local dining
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-booking switcher */}
        {bookings.length > 1 && (
          <div className="flex items-center gap-2 p-3 bg-slate-100 border-b border-slate-200 overflow-x-auto text-xs">
            <span className="text-slate-500 font-semibold shrink-0">Your Stays:</span>
            {bookings.map((b, idx) => (
              <button
                key={b.id}
                onClick={() => setSelectedBookingIndex(idx)}
                className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all ${
                  selectedBookingIndex === idx
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {b.propertyTitle.split(' ')[0]} ({b.checkInDate})
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-6 bg-slate-50/50">
          {/* Active Booking Card */}
          {activeBooking && activeProperty && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">
                    Confirmed Stay
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">
                    {activeProperty.title}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    {activeProperty.address}
                  </p>
                </div>
                <div className="text-right text-xs">
                  <span className="font-bold text-slate-900 block">
                    {activeBooking.checkInDate} → {activeBooking.checkOutDate}
                  </span>
                  <span className="text-slate-500">
                    {activeBooking.nights} nights • {activeBooking.guestsCount} guests
                  </span>
                </div>
              </div>

              {/* MUST-ADD 7: Check-in instructions auto-sent */}
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-emerald-700" />
                  <span>Keyless Check-in Codes & Access Credentials</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-2xs">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Digital Door Code</span>
                    <p className="text-lg font-mono font-extrabold text-emerald-700 mt-0.5">
                      {activeProperty.checkInInstructions.smartLockPin}
                    </p>
                    <span className="text-[10px] text-slate-400">Yale Smart Lock Keypad + #</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-2xs">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Fibre WiFi Details</span>
                    <p className="text-xs font-bold text-slate-900 mt-1">
                      {activeProperty.checkInInstructions.wifiName}
                    </p>
                    <p className="text-[11px] font-mono text-emerald-800">
                      {activeProperty.checkInInstructions.wifiPassword}
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-2xs">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Covered Bay / Gate</span>
                    <p className="text-xs font-bold text-slate-900 mt-1">
                      {activeProperty.checkInInstructions.parkingBay}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Gate: {activeProperty.checkInInstructions.gateCode}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-3 bg-white p-2.5 rounded-lg border border-emerald-100 leading-relaxed">
                  <strong>Access guide:</strong> {activeProperty.checkInInstructions.instructions}
                </p>
              </div>

              {/* MUST-ADD 7: Google Maps directions (like we did for Absa) */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-rose-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Directions to Absa Campus & Republic Road Hub
                    </h4>
                  </div>
                  <span className="text-[11px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded border border-rose-200">
                    Corporate Route
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-1">
                      To Absa Randburg Campus (1.2 km / 3 min drive)
                    </span>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Head north on Oxford St toward Republic Rd. Turn right onto Republic Rd, then merge onto Malibongwe Dr (Hans Strijdom). Absa Corporate Park entrance is on your right.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-1">
                      To Ferndale on Republic Mall (350m / 3 min walk)
                    </span>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Walk down Oxford St directly to Republic Rd. Mall entrance is opposite, with secure pedestrian boom gates for Checkers, Woolies, and Tiger's Milk.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-slate-500">
                    Host: {activeProperty.ownerName} ({activeProperty.ownerWhatsApp})
                  </span>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${activeProperty.coordinates.lat},${activeProperty.coordinates.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <span>Launch GPS Navigation</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* MUST-ADD 7: Local tips: Where to eat in Ferndale, nearest Absa, Spar etc. */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-1.5">
              <Coffee className="w-4 h-4 text-amber-600" />
              <span>Ferndale Local Recommendations (Dining, Groceries, Gym)</span>
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
      </div>
    </div>
  );
};

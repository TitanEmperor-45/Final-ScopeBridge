import React, { useState } from 'react';
import { NannyProfile, NannyBooking, Property } from '../../types';
import { BookNannyModal } from '../nanny/BookNannyModal';
import {
  X,
  Baby,
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
  Heart,
  FileText
} from 'lucide-react';

interface GuestNannyOnCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  nannies: NannyProfile[];
  nannyBookings: NannyBooking[];
  properties: Property[];
  onAddNannyBooking: (booking: NannyBooking) => void;
  onUpdateNannyBookingStatus: (id: string, status: NannyBooking['status']) => void;
}

export const GuestNannyOnCallModal: React.FC<GuestNannyOnCallModalProps> = ({
  isOpen,
  onClose,
  nannies,
  nannyBookings,
  properties,
  onAddNannyBooking,
  onUpdateNannyBookingStatus,
}) => {
  const [selectedNanny, setSelectedNanny] = useState<NannyProfile | null>(null);

  if (!isOpen) return null;

  const handleConfirmNannyBooking = (bookingData: Omit<NannyBooking, 'id' | 'createdAt' | 'activityLogs'>) => {
    const newBooking: NannyBooking = {
      ...bookingData,
      id: `NB-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      activityLogs: [],
    };
    onAddNannyBooking(newBooking);
    setSelectedNanny(null);
  };

  const handleCancelBooking = (bookingId: string) => {
    if (window.confirm('Are you sure you want to cancel this nanny session?')) {
      onUpdateNannyBookingStatus(bookingId, 'cancelled');
    }
  };

  const handleRebook = (oldBooking: NannyBooking) => {
    const matchedNanny = nannies.find((n) => n.id === oldBooking.nannyId) || nannies[0];
    if (matchedNanny) {
      setSelectedNanny(matchedNanny);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-pink-500/10 text-pink-400 rounded-xl border border-pink-500/20">
              <Baby className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                ScopeBridg™ Childcare-on-Call
              </h2>
              <p className="text-xs text-slate-400">
                Verified early childhood professionals, real-time tracking, & 100% vetted security clearance
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
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-start gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="font-extrabold text-emerald-950 text-xs">Vetted Childcare & SAPS Clean Criminal Record 2026</p>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Every ScopeBridg nanny undergoes rigorous background clearance (SAPS, SACE), holds certified pediatric first aid/CPR accreditations, and provides a digital, real-time shift activity log directly to parents.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Nanny Profiles */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Available Certified Caregivers
                </h3>
                <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full border border-slate-200">
                  {nannies.length} On Duty
                </span>
              </div>

              <div className="space-y-3">
                {nannies.map((nanny) => (
                  <div
                    key={nanny.id}
                    className="bg-white p-4 rounded-xl border border-slate-200 hover:border-pink-500/30 transition-all flex flex-col sm:flex-row gap-4 shadow-2xs hover:shadow-xs"
                  >
                    <img
                      src={nanny.avatar}
                      alt={nanny.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-100 shrink-0 mx-auto sm:mx-0"
                    />
                    <div className="flex-1 min-w-0 space-y-1 text-center sm:text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm leading-tight truncate">
                            {nanny.name}
                          </h4>
                          <span className="inline-block text-[10px] bg-pink-50 text-pink-700 font-bold px-2 py-0.5 rounded-full mt-0.5">
                            {nanny.badge || 'ScopeBridg Elite Nanny'}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-black text-slate-900">R{nanny.hourlyRateZar}/hr</p>
                          <p className="text-[10px] text-slate-500">Hourly Rate</p>
                        </div>
                      </div>

                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        {nanny.experienceYears} yrs experience • Specialist in {nanny.specialties?.slice(0, 3).join(', ')}
                      </p>

                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1 pt-1 text-[10px]">
                        {nanny.certifications?.slice(0, 2).map((cert, i) => (
                          <span
                            key={i}
                            className="bg-emerald-50 text-emerald-800 border border-emerald-100 px-2 py-0.5 rounded"
                          >
                            ✓ {cert}
                          </span>
                        ))}
                      </div>

                      <div className="pt-3 flex flex-wrap items-center justify-center sm:justify-between gap-2 border-t border-slate-100 mt-2">
                        <span className="text-[10px] text-slate-400">
                          Rating: <strong className="text-amber-500">★ {nanny.rating}</strong> ({nanny.reviewCount} reviews)
                        </span>
                        <button
                          onClick={() => setSelectedNanny(nanny)}
                          className="px-3.5 py-1.5 bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Baby className="w-3 h-3" />
                          <span>Book Childcare</span>
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
                <FileText className="w-3.5 h-3.5 text-pink-500" />
                Your Childcare Sessions
              </h3>

              {nannyBookings.length === 0 ? (
                <div className="bg-white p-6 rounded-xl border border-slate-200 text-center space-y-2">
                  <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                    <Baby className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-slate-600 font-bold">No Active Nanny Sessions</p>
                  <p className="text-[11px] text-slate-400">
                    Your scheduled childminder, babysitter, and infant shift receipts will be tracked here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {nannyBookings.map((bk) => (
                    <div
                      key={bk.id}
                      className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-2xs relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <img
                            src={bk.nannyAvatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80'}
                            alt={bk.nannyName}
                            className="w-7 h-7 rounded-full object-cover border border-slate-100"
                          />
                          <div>
                            <span className="font-extrabold text-slate-950 text-xs block leading-tight">
                              {bk.nannyName}
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
                          <span className="text-slate-400">Parent/Contact:</span>
                          <span className="font-semibold text-slate-800">{bk.parentName}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-400">Date:</span>
                          <span className="font-semibold text-slate-800">{bk.date}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-400">Time / Duration:</span>
                          <span className="font-semibold text-slate-800">
                            {bk.startTime} ({bk.hours} hours)
                          </span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-400">Ages:</span>
                          <span className="font-semibold text-slate-800">{bk.childrenAges} ({bk.childrenCount} kids)</span>
                        </p>
                        <div className="border-t border-slate-200/60 pt-1.5 mt-1.5 flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-900">Total ZAR:</span>
                          <span className="font-black text-pink-700">R{bk.totalAmountZar}</span>
                        </div>
                      </div>

                      {/* Cancel / Re-book Actions */}
                      <div className="flex gap-2 justify-end pt-1">
                        {bk.status === 'confirmed' && (
                          <button
                            onClick={() => handleCancelBooking(bk.id)}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[10px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            title="Cancel scheduled caregiver session"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>Cancel Shift</span>
                          </button>
                        )}
                        {(bk.status === 'cancelled' || bk.status === 'completed') && (
                          <button
                            onClick={() => handleRebook(bk)}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3 text-emerald-400" />
                            <span>Re-Book caregiver</span>
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

      {/* Embedded BookNannyModal */}
      {selectedNanny && (
        <BookNannyModal
          nanny={selectedNanny}
          properties={properties}
          onClose={() => setSelectedNanny(null)}
          onConfirmBooking={handleConfirmNannyBooking}
        />
      )}
    </div>
  );
};

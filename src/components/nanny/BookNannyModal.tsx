import React, { useState } from 'react';
import { NannyProfile, Property, NannyBooking } from '../../types';
import { X, Calendar, Clock, Baby, ShieldCheck, Heart, Sparkles, Check, Phone, AlertTriangle } from 'lucide-react';

interface BookNannyModalProps {
  nanny: NannyProfile | null;
  properties: Property[];
  selectedPropertyId?: string;
  initialDurationHours?: number;
  initialPreferredLanguages?: string[];
  matchScore?: number;
  onClose: () => void;
  onConfirmBooking: (bookingData: Omit<NannyBooking, 'id' | 'createdAt' | 'activityLogs'>) => void;
}

export const BookNannyModal: React.FC<BookNannyModalProps> = ({
  nanny,
  properties,
  selectedPropertyId,
  initialDurationHours = 4,
  initialPreferredLanguages = [],
  matchScore,
  onClose,
  onConfirmBooking,
}) => {
  const [propertyId, setPropertyId] = useState(selectedPropertyId || properties[0]?.id || 'prop-1');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('+27 ');
  const [parentEmail, setParentEmail] = useState('');
  const [date, setDate] = useState('2026-09-28');
  const [startTime, setStartTime] = useState('14:00');
  const [hours, setHours] = useState(initialDurationHours);
  const [childrenCount, setChildrenCount] = useState(1);
  const [childrenAges, setChildrenAges] = useState('3 years old');
  const [specialNotes, setSpecialNotes] = useState(
    initialPreferredLanguages.length > 0
      ? `Preferred childcare communication language(s): ${initialPreferredLanguages.join(', ')}.`
      : ''
  );
  const [allergies, setAllergies] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!nanny) return null;

  const selectedProp = properties.find((p) => p.id === propertyId);
  const hourlyRate = nanny.hourlyRateZar;
  const subtotal = hourlyRate * hours;
  const vettingSafetyFee = 35; // R35 safety & vetting insurance
  const total = subtotal + vettingSafetyFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentName.trim() || !parentPhone.trim()) {
      setValidationError('Please provide parent contact name and phone number.');
      return;
    }
    setValidationError(null);

    // Calculate end time
    const [startH, startM] = startTime.split(':').map(Number);
    const endH = (startH + Math.floor(hours)) % 24;
    const endFormatted = `${String(endH).padStart(2, '0')}:${String(startM || 0).padStart(2, '0')}`;

    onConfirmBooking({
      nannyId: nanny.id,
      nannyName: nanny.name,
      nannyAvatar: nanny.avatar,
      nannyPhone: nanny.phone,
      parentName,
      parentPhone,
      parentEmail,
      propertyId,
      propertyTitle: selectedProp?.title || 'FerndaleStay Property',
      unitCode: selectedProp?.unitCode || 'UNIT',
      date,
      startTime,
      endTime: endFormatted,
      hours,
      hourlyRateZar: hourlyRate,
      totalAmountZar: total,
      childrenCount,
      childrenAges,
      specialNotes,
      allergies,
      emergencyContact,
      status: 'confirmed',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={nanny.avatar ? nanny.avatar : undefined}
              alt={nanny.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-emerald-300 shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold leading-tight">Book Childcare with {nanny.name}</h3>
                <span className="text-[10px] bg-emerald-700/80 text-emerald-100 font-bold px-2 py-0.5 rounded-full border border-emerald-500">
                  {nanny.badge}
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                ★ {nanny.rating} ({nanny.reviewCount} reviews) • R{nanny.hourlyRateZar}/hr • {nanny.experienceYears} yrs experience
                {typeof matchScore === 'number' && ` • ${matchScore}% Qualification Match`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
          {validationError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}
          {/* Vetting Trust Banner */}
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-emerald-950 text-xs">Verified South African Professional</p>
              <p className="text-[11px] text-emerald-800">
                Red Cross / St John Infant CPR certified & SAPS Police Clearance confirmed. Real-time shift log provided.
              </p>
            </div>
          </div>

          {/* Stay Unit Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">
              Select Global Stay Unit / Room (All Areas & Suburbs)
            </label>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.unitCode}) - {p.area}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-emerald-600" />
                Shift Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-600" />
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Duration (Hours)
              </label>
              <select
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              >
                <option value={2}>2 Hours (Quick Errand)</option>
                <option value={3}>3 Hours</option>
                <option value={4}>4 Hours (Half Day)</option>
                <option value={5}>5 Hours</option>
                <option value={6}>6 Hours (Corporate Meeting)</option>
                <option value={8}>8 Hours (Full Day)</option>
                <option value={10}>10 Hours (Night Nanny)</option>
                <option value={12}>12 Hours (Overnight Maternity)</option>
              </select>
            </div>
          </div>

          {/* Children Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Baby className="w-3 h-3 text-emerald-600" />
                Number of Children
              </label>
              <select
                value={childrenCount}
                onChange={(e) => setChildrenCount(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              >
                <option value={1}>1 Child</option>
                <option value={2}>2 Children</option>
                <option value={3}>3 Children (+R30/hr)</option>
                <option value={4}>4 Children (+R50/hr)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Children Age(s) & Name(s)
              </label>
              <input
                type="text"
                value={childrenAges}
                onChange={(e) => setChildrenAges(e.target.value)}
                placeholder="e.g., 2 yrs (Liam) & 5 yrs (Emma)"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                required
              />
            </div>
          </div>

          {/* Parent Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Parent Full Name
              </label>
              <input
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="e.g., Sarah Jenkins"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-600" />
                Parent WhatsApp / Phone (SA)
              </label>
              <input
                type="tel"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="+27 82 123 4567"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                required
              />
            </div>
          </div>

          {/* Special notes & allergies */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Allergies or Dietary Needs
              </label>
              <input
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="e.g., Dairy free, peanut allergy"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Emergency Contact / Paediatrician
              </label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="e.g., Sandton Mediclinic +27 11 709 2000"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Care Instructions & Routine Notes
            </label>
            <textarea
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              placeholder="e.g. Afternoon nap at 14:30 in cot with white noise fan. Likes coloring books. Parents attending meeting at Absa Campus."
              rows={2}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Price Summary Breakdown */}
          <div className="bg-slate-100 rounded-xl p-3.5 border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-600">
              <span>Childcare ({hours} hrs @ R{hourlyRate}/hr)</span>
              <span className="font-mono font-medium">R{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-600">
              <span className="flex items-center gap-1">
                <span>Vetting & Safety Protocol Fee</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1 rounded font-semibold">Verified</span>
              </span>
              <span className="font-mono font-medium">R{vettingSafetyFee.toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-200 pt-1.5 flex items-center justify-between font-bold text-slate-900 text-xs">
              <span>Total Payable (ZAR)</span>
              <span className="text-emerald-800 text-sm font-mono font-black">R{total.toFixed(2)}</span>
            </div>
            <p className="text-[10px] text-emerald-800 font-semibold pt-0.5 flex items-center gap-1">
              <span>🏦 Direct Payment via Configured In-App Real Online Banking (RTC Direct Interbank Clearance across Absa, FNB, Standard Bank, Nedbank, Capitec Pay, Investec & TymeBank).</span>
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 text-emerald-300" />
              <span>Confirm Childcare Booking (R{total.toFixed(2)})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Property, RoomBid } from '../../types';
import {
  X,
  Sparkles,
  Calendar,
  Users,
  DollarSign,
  Tag,
  CheckCircle2,
  Clock,
  Send,
  MessageSquare,
  ShieldCheck,
  Building2,
  TrendingDown
} from 'lucide-react';

interface RoomBidModalProps {
  property: Property;
  onClose: () => void;
  onSubmitBid: (bid: Omit<RoomBid, 'id' | 'createdAt' | 'status'>) => void;
}

export const RoomBidModal: React.FC<RoomBidModalProps> = ({
  property,
  onClose,
  onSubmitBid,
}) => {
  // Dates & Occupancy
  const [checkInDate, setCheckInDate] = useState<string>('2026-09-25');
  const [checkOutDate, setCheckOutDate] = useState<string>('2026-09-28');
  const [guestsCount, setGuestsCount] = useState<number>(2);

  // Price calculations
  const defaultDiscountedPrice = Math.round(property.basePrice * 0.85);
  const [offeredPricePerNight, setOfferedPricePerNight] = useState<number>(defaultDiscountedPrice);

  // Contact Info
  const [guestName, setGuestName] = useState<string>('Kenneth Mathunywa');
  const [guestEmail, setGuestEmail] = useState<string>('nightscope58@gmail.com');
  const [guestPhone, setGuestPhone] = useState<string>('+27 82 555 9812');
  const [message, setMessage] = useState<string>('Corporate guest visiting Absa campus. Requesting special rate for 3-night stay.');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedBid, setSubmittedBid] = useState<RoomBid | null>(null);

  // Calculate nights
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
  const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const totalOfferedZar = offeredPricePerNight * nights;
  const standardTotalZar = property.basePrice * nights;
  const savingsZar = Math.max(0, standardTotalZar - totalOfferedZar);
  const discountPercent = Math.round((savingsZar / standardTotalZar) * 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const bidData: Omit<RoomBid, 'id' | 'createdAt' | 'status'> = {
        propertyId: property.id,
        propertyName: property.title,
        guestName,
        guestEmail,
        guestPhone,
        checkInDate,
        checkOutDate,
        guestsCount,
        offeredPricePerNightZar: offeredPricePerNight,
        totalOfferedZar,
        message,
      };

      onSubmitBid(bidData);
      setIsSubmitting(false);
      setSubmittedBid({
        ...bidData,
        id: `BID-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 p-5 text-slate-950 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-950/10 rounded-2xl backdrop-blur-xs border border-slate-950/10">
              <Tag className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="bg-slate-950 text-amber-300 text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider">
                  🔥 High Interest Room
                </span>
                <span className="text-xs font-bold text-slate-900">Direct Price Bidding</span>
              </div>
              <h2 className="text-lg font-extrabold text-slate-950 leading-tight mt-0.5">
                Submit Custom Nightly Offer
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-slate-950/10 hover:bg-slate-950/20 text-slate-950 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Property Summary Header Card */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3.5">
            <img
              src={property.images[0]}
              alt={property.title}
              className="w-16 h-16 rounded-xl object-cover shadow-2xs border border-slate-200"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-extrabold text-slate-900 truncate">
                {property.title}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{property.area} • Standard: <strong>R{property.basePrice}/night</strong></span>
              </p>
            </div>
          </div>

          {submittedBid ? (
            /* SUCCESS CONFIRMATION VIEW */
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-4 my-2">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <span className="bg-emerald-100 text-emerald-800 font-mono text-xs font-bold px-3 py-1 rounded-full border border-emerald-300">
                  Ref: {submittedBid.id}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                  Bid Offer Submitted Successfully!
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  Your custom offer of <strong className="text-emerald-800 font-bold">R{submittedBid.offeredPricePerNightZar}/night</strong> (Total: R{submittedBid.totalOfferedZar}) for {nights} nights has been routed to the Super Admin Hub.
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-emerald-200 text-xs text-slate-700 text-left space-y-2">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Property:</span>
                  <span className="font-bold text-slate-900">{submittedBid.propertyName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Dates & Guests:</span>
                  <span className="font-bold text-slate-900">{submittedBid.checkInDate} to {submittedBid.checkOutDate} ({submittedBid.guestsCount} guests)</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Guest Contact:</span>
                  <span className="font-bold text-slate-900">{submittedBid.guestName} ({submittedBid.guestPhone})</span>
                </div>
                <div className="flex justify-between text-emerald-800 font-extrabold pt-1">
                  <span>Current Status:</span>
                  <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full uppercase flex items-center gap-1 font-bold">
                    <Clock className="w-3 h-3" /> Pending Admin Review
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Close & Return to Stays
              </button>
            </div>
          ) : (
            /* BID FORM */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Dates & Guests Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Check-In</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Check-Out</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Guests</span>
                  </label>
                  <select
                    value={guestsCount}
                    onChange={(e) => setGuestsCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'Guest' : 'Guests'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* BID PRICE SLIDER & INPUT */}
              <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Your Proposed Nightly Offer (ZAR)</span>
                  </span>
                  <span className="text-xs font-extrabold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                    {discountPercent > 0 ? `${discountPercent}% Discount` : 'Standard Rate'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-xs font-extrabold text-slate-400">R</span>
                    <input
                      type="number"
                      required
                      min={Math.round(property.basePrice * 0.5)}
                      max={property.basePrice * 1.5}
                      step={50}
                      value={offeredPricePerNight}
                      onChange={(e) => setOfferedPricePerNight(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 bg-white border border-amber-300 rounded-xl text-base font-extrabold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-600">/ night</span>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min={Math.round(property.basePrice * 0.5)}
                  max={property.basePrice}
                  step={25}
                  value={offeredPricePerNight}
                  onChange={(e) => setOfferedPricePerNight(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />

                <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
                  <span>Min (50%): R{Math.round(property.basePrice * 0.5)}</span>
                  <span className="text-amber-800 font-bold">Suggested (15% off): R{defaultDiscountedPrice}</span>
                  <span>Base: R{property.basePrice}</span>
                </div>

                {/* Total stay breakdown card */}
                <div className="p-3 bg-white rounded-xl border border-amber-200/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 block">Total Stay Estimate ({nights} nights):</span>
                    <span className="text-base font-black text-slate-900">
                      R{totalOfferedZar.toLocaleString()} ZAR
                    </span>
                  </div>
                  {savingsZar > 0 && (
                    <div className="text-right">
                      <span className="text-[10px] text-emerald-700 font-bold uppercase block">Your Total Savings</span>
                      <span className="text-xs font-extrabold text-emerald-700 flex items-center gap-0.5 justify-end">
                        <TrendingDown className="w-3.5 h-3.5" />
                        R{savingsZar.toLocaleString()} ZAR
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Guest Details */}
              <div className="space-y-3 pt-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Guest Contact Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Full Name</label>
                    <input
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">WhatsApp / Phone</label>
                    <input
                      type="text"
                      required
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">Email Address</label>
                  <input
                    type="email"
                    required
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block flex items-center justify-between">
                    <span>Message / Note to Admin (Optional)</span>
                    <span className="text-[10px] text-slate-400 font-normal">e.g., reason for stay</span>
                  </label>
                  <textarea
                    rows={2}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Mention corporate affiliation, long stays, or check-in preferences..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden resize-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Submitting Offer...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Price Offer to Super Admin Hub</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

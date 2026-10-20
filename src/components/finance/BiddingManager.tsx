import React, { useState } from 'react';
import { Property, Quotation, RoomBid } from '../../types';
import {
  Gavel,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  User,
  Calendar,
  MessageSquare,
  DollarSign,
  Building2,
  TrendingUp,
  Sparkles,
  Send,
  Plus,
} from 'lucide-react';

interface BiddingManagerProps {
  role: 'owner' | 'admin' | 'guest';
  currentUserName?: string;
  currentUserEmail?: string;
  roomBids: RoomBid[];
  properties: Property[];
  onUpdateBidStatus: (bidId: string, status: 'approved' | 'declined' | 'pending' | 'countered', counterRate?: number, counterMessage?: string) => void;
  onCreateQuotationFromBid?: (bid: RoomBid) => void;
  onOpenBidModal?: () => void;
}

export const BiddingManager: React.FC<BiddingManagerProps> = ({
  role,
  currentUserName = 'Kenneth Mathunywa',
  currentUserEmail = 'nightscope58@gmail.com',
  roomBids,
  properties,
  onUpdateBidStatus,
  onCreateQuotationFromBid,
  onOpenBidModal,
}) => {
  const [selectedBidForCounter, setSelectedBidForCounter] = useState<RoomBid | null>(null);
  const [counterRateZar, setCounterRateZar] = useState<number>(0);
  const [counterMessage, setCounterMessage] = useState<string>('');

  // Filter bids by role
  const filteredBids = roomBids.filter((bid) => {
    if (role === 'guest') {
      return (
        bid.guestEmail.toLowerCase().includes(currentUserEmail.toLowerCase()) ||
        bid.guestName.toLowerCase().includes(currentUserName.toLowerCase())
      );
    }
    return true;
  });

  const handleOpenCounterModal = (bid: RoomBid) => {
    setSelectedBidForCounter(bid);
    setCounterRateZar(Math.round(bid.offeredPricePerNightZar * 1.15));
    setCounterMessage('We can accommodate your stay at this counter-offer rate per night. Let us know if you accept!');
  };

  const handleSendCounterOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBidForCounter) return;

    onUpdateBidStatus(selectedBidForCounter.id, 'countered', counterRateZar, counterMessage);
    setSelectedBidForCounter(null);
  };

  const handleAcceptBidAndGenerateDoc = (bid: RoomBid) => {
    onUpdateBidStatus(bid.id, 'approved');
    if (onCreateQuotationFromBid) {
      onCreateQuotationFromBid(bid);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Direct Guest Nightly Rate Bidding Engine
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white pt-1">
              Room Bids & Negotiated Offers
            </h2>
            <p className="text-xs text-slate-300">
              {role === 'guest'
                ? 'Submit custom nightly rate bids directly to property hosts & track counter-offers'
                : 'Review incoming room bids, accept offers, send counter-rates, or generate instant quotations'}
            </p>
          </div>

          {role === 'guest' && onOpenBidModal && (
            <button
              onClick={onOpenBidModal}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-2xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Gavel className="w-4 h-4" />
              Submit Custom Room Offer
            </button>
          )}
        </div>
      </div>

      {/* Bids List */}
      <div className="space-y-4">
        {filteredBids.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3 shadow-xs">
            <Gavel className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-700">No Room Bids Available</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {role === 'guest'
                ? 'You have not submitted any room bids yet. Browse properties and click "Make a Bid" to get started!'
                : 'There are currently no active room bids waiting for owner review.'}
            </p>
            {role === 'guest' && onOpenBidModal && (
              <button
                onClick={onOpenBidModal}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl inline-flex items-center gap-2 mt-2"
              >
                <Plus className="w-4 h-4" />
                Submit Your First Room Bid
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBids.map((bid) => (
              <div
                key={bid.id}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      Bid #{bid.id}
                    </span>
                    <h3 className="text-sm font-black text-slate-900 pt-1">{bid.propertyName}</h3>
                    <p className="text-xs text-slate-500">{bid.roomName || 'Master Executive Room'}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      bid.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : bid.status === 'declined'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : bid.status === 'countered'
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {bid.status === 'approved' ? 'Accepted' : bid.status}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Guest Name</span>
                    <p className="font-extrabold text-slate-900">{bid.guestName}</p>
                    <p className="text-[10px] text-slate-500">{bid.guestEmail}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Dates & Guests</span>
                    <p className="font-extrabold text-slate-900">
                      {bid.checkInDate} to {bid.checkOutDate}
                    </p>
                    <p className="text-[10px] text-slate-500">{bid.guestsCount} Guests</p>
                  </div>
                  <div className="pt-1 border-t border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Offered Rate / Night</span>
                    <p className="text-sm font-black text-amber-700">R {bid.offeredPricePerNightZar.toLocaleString()}</p>
                  </div>
                  <div className="pt-1 border-t border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Total Bid Value</span>
                    <p className="text-sm font-black text-slate-900">R {bid.totalOfferedZar.toLocaleString()}</p>
                  </div>
                </div>

                {/* Message if any */}
                {bid.message && (
                  <p className="text-xs text-slate-600 bg-amber-50/60 p-3 rounded-xl border border-amber-100 italic">
                    "{bid.message}"
                  </p>
                )}

                {/* Counter Offer Info if present */}
                {bid.status === 'countered' && bid.counterOfferRateZar && (
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between text-xs font-black text-indigo-950">
                      <span>Host Counter Offer Rate:</span>
                      <span className="text-indigo-700 text-sm">R {bid.counterOfferRateZar.toLocaleString()} / night</span>
                    </div>
                    {bid.counterOfferMessage && (
                      <p className="text-[11px] text-indigo-800">{bid.counterOfferMessage}</p>
                    )}
                  </div>
                )}

                {/* Role Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                  {/* Host / Admin Actions */}
                  {(role === 'owner' || role === 'admin') && bid.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleAcceptBidAndGenerateDoc(bid)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Accept & Issue Quote
                      </button>
                      <button
                        onClick={() => handleOpenCounterModal(bid)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-all"
                      >
                        Counter Offer
                      </button>
                      <button
                        onClick={() => onUpdateBidStatus(bid.id, 'declined')}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-all"
                      >
                        Decline
                      </button>
                    </>
                  )}

                  {/* Guest Counter Accept */}
                  {role === 'guest' && bid.status === 'countered' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAcceptBidAndGenerateDoc(bid)}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Accept Host Counter Offer
                      </button>
                      <button
                        onClick={() => onUpdateBidStatus(bid.id, 'declined')}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                      >
                        Decline Counter
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* COUNTER OFFER MODAL */}
      {selectedBidForCounter && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Gavel className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-black">Submit Host Counter Offer</h3>
              </div>
              <button
                onClick={() => setSelectedBidForCounter(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendCounterOffer} className="p-5 space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-1">
                <span className="font-bold text-amber-900">Guest Offered:</span>
                <p className="text-sm font-black text-amber-950">
                  R {selectedBidForCounter.offeredPricePerNightZar.toLocaleString()} / night (Total R {selectedBidForCounter.totalOfferedZar.toLocaleString()})
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Your Counter Rate per Night (ZAR) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={counterRateZar}
                  onChange={(e) => setCounterRateZar(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-extrabold text-indigo-950"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Counter Message to Guest</label>
                <textarea
                  rows={3}
                  value={counterMessage}
                  onChange={(e) => setCounterMessage(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedBidForCounter(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send Counter Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

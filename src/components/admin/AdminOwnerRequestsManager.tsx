import React, { useState } from 'react';
import { OwnerAccessRequest, Property } from '../../types';
import { Clock, CheckCircle2, XCircle, AlertCircle, Building, Check, X, MessageSquare, Send } from 'lucide-react';

interface AdminOwnerRequestsManagerProps {
  requests: OwnerAccessRequest[];
  properties: Property[];
  onReviewRequest: (requestId: string, status: 'approved' | 'rejected', notes?: string) => void;
}

export const AdminOwnerRequestsManager: React.FC<AdminOwnerRequestsManagerProps> = ({
  requests,
  properties,
  onReviewRequest,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [reviewingRequestId, setReviewingRequestId] = useState<string | null>(null);
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected'>('approved');
  const [adminNotes, setAdminNotes] = useState('');

  const filteredRequests = requests.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;

  const handleOpenReview = (requestId: string, action: 'approved' | 'rejected') => {
    setReviewingRequestId(requestId);
    setReviewAction(action);
    setAdminNotes(action === 'approved' ? 'Approved by Super Admin.' : 'Declined. Please update listing details.');
  };

  const handleConfirmReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingRequestId) return;
    onReviewRequest(reviewingRequestId, reviewAction, adminNotes);
    setReviewingRequestId(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Owner Access Requests Moderation Queue</h2>
            <span className="text-[11px] bg-amber-50 text-amber-800 font-semibold px-2 py-0.5 rounded-full border border-amber-200">
              {pendingCount} Pending Review
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review channel distribution and payment gateway linkage requests submitted by property hosts.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                filter === tab
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No requests found matching the current filter.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredRequests.map((req) => {
              const isPending = req.status === 'pending';

              return (
                <div
                  key={req.id}
                  className="p-5 hover:bg-slate-50/60 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {req.id}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">{req.targetName}</span>
                      <span className="text-[11px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                        {req.action}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        ({req.requestType === 'channel' ? 'OTA Distribution' : 'Merchant Gateway'})
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          req.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {req.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900">{req.propertyTitle}</span>
                      <span>•</span>
                      <span>Owner: <strong>{req.ownerName}</strong></span>
                      <span>•</span>
                      <span className="text-slate-400 font-mono">{req.createdAt}</span>
                    </div>

                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <strong>Host Reason:</strong> {req.reason}
                    </p>

                    {req.bankName && (
                      <p className="text-xs text-slate-700">
                        🏦 <strong>Payout Account:</strong> {req.bankName} ({req.accountNumberMasked})
                      </p>
                    )}

                    {req.adminNotes && (
                      <p className="text-xs text-emerald-900 bg-emerald-50/70 p-2 rounded-lg border border-emerald-200">
                        <strong>Super Admin Note:</strong> {req.adminNotes} (Reviewed: {req.reviewedAt})
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {isPending && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleOpenReview(req.id, 'approved')}
                        className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleOpenReview(req.id, 'rejected')}
                        className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewingRequestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {reviewAction === 'approved' ? 'Approve Access Request' : 'Decline Access Request'}
              </h3>
              <button onClick={() => setReviewingRequestId(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmReview} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Administrative Review Notes
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Feedback sent to host..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setReviewingRequestId(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold text-white transition-colors ${
                    reviewAction === 'approved'
                      ? 'bg-emerald-700 hover:bg-emerald-800'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Confirm {reviewAction === 'approved' ? 'Approval' : 'Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

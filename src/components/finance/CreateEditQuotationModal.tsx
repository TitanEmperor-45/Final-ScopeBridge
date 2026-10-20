import React, { useState } from 'react';
import { Property, Quotation, QuotationItem, QuotationStatus } from '../../types';
import { X, Plus, Trash2, FileText, Calendar, User, Mail, DollarSign, Calculator, CheckCircle2 } from 'lucide-react';

interface CreateEditQuotationModalProps {
  quotation?: Quotation | null;
  properties: Property[];
  onClose: () => void;
  onSave: (quoteData: Omit<Quotation, 'id' | 'createdAt'> | Quotation) => void;
  currentUserRole: 'owner' | 'admin' | 'guest';
}

export const CreateEditQuotationModal: React.FC<CreateEditQuotationModalProps> = ({
  quotation,
  properties,
  onClose,
  onSave,
  currentUserRole,
}) => {
  const isEditing = !!quotation;

  const [propertyId, setPropertyId] = useState(quotation?.propertyId || properties[0]?.id || '');
  const [propertyTitle, setPropertyTitle] = useState(quotation?.propertyTitle || properties[0]?.title || 'Executive Solar Loft');
  const [guestName, setGuestName] = useState(quotation?.guestName || 'Kenneth Mathunywa');
  const [guestEmail, setGuestEmail] = useState(quotation?.guestEmail || 'nightscope58@gmail.com');
  const [guestPhone, setGuestPhone] = useState(quotation?.guestPhone || '+27 82 555 9812');
  const [checkInDate, setCheckInDate] = useState(quotation?.checkInDate || '2026-10-01');
  const [checkOutDate, setCheckOutDate] = useState(quotation?.checkOutDate || '2026-10-05');
  const [validUntil, setValidUntil] = useState(quotation?.validUntil || '2026-10-01');
  const [discountZar, setDiscountZar] = useState(quotation?.discountZar || 0);
  const [notes, setNotes] = useState(quotation?.notes || 'Includes complimentary Wi-Fi, generator backup, and parking.');
  const [status, setStatus] = useState<QuotationStatus>(quotation?.status || 'sent');

  const [items, setItems] = useState<QuotationItem[]>(
    quotation?.items || [
      { id: 'item-1', description: '4 Nights Accommodation (Executive Loft)', quantity: 4, unitPriceZar: 1200, amountZar: 4800 },
      { id: 'item-2', description: 'Airport Shuttle VIP Transfer', quantity: 1, unitPriceZar: 450, amountZar: 450 },
    ]
  );

  const handlePropertyChange = (selectedId: string) => {
    setPropertyId(selectedId);
    const selectedProp = properties.find((p) => p.id === selectedId);
    if (selectedProp) {
      setPropertyTitle(selectedProp.title);
    }
  };

  const handleItemChange = (index: number, field: keyof QuotationItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    if (field === 'quantity' || field === 'unitPriceZar') {
      const q = field === 'quantity' ? Number(value) : item.quantity;
      const u = field === 'unitPriceZar' ? Number(value) : item.unitPriceZar;
      item.amountZar = q * u;
    }

    updated[index] = item;
    setItems(updated);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        id: `item-${Date.now()}`,
        description: 'Additional Hospitality Service',
        quantity: 1,
        unitPriceZar: 200,
        amountZar: 200,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotalBeforeVat = items.reduce((sum, item) => sum + item.amountZar, 0) - discountZar;
  const grossTotal = Math.max(0, subtotalBeforeVat);
  const vatAmountZar = Math.round(grossTotal * 0.13043 * 100) / 100; // 15% inclusive VAT breakdown
  const subtotalZar = grossTotal - vatAmountZar;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const quoteData = isEditing ? {
      ...quotation!,
      propertyId,
      propertyTitle,
      guestName,
      guestEmail,
      guestPhone,
      checkInDate,
      checkOutDate,
      items,
      subtotalZar,
      vatAmountZar,
      totalZar: grossTotal,
      discountZar,
      notes,
      validUntil,
      status,
    } : {
      quotationNumber: `QT-2026-${Math.floor(100 + Math.random() * 900)}`,
      propertyId,
      propertyTitle,
      ownerId: 'owner-1',
      ownerName: 'Lindiwe Khumalo',
      guestName,
      guestEmail,
      guestPhone,
      checkInDate,
      checkOutDate,
      items,
      subtotalZar,
      vatAmountZar,
      totalZar: grossTotal,
      discountZar,
      notes,
      validUntil,
      status,
      paymentStatus: 'unpaid' as const,
      createdBy: currentUserRole,
    };

    onSave(quoteData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-wide">
                {isEditing ? `Edit Quotation (${quotation.quotationNumber})` : 'Create New Official Quotation'}
              </h3>
              <p className="text-xs text-slate-400">Specify property stay, custom line items, VAT & pricing breakdown</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {/* Section 1: Property & Guest Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Property / Listing *</label>
              <select
                value={propertyId}
                onChange={(e) => handlePropertyChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 text-slate-800"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.city})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Quotation Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as QuotationStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 text-slate-800"
              >
                <option value="draft">Draft (Private)</option>
                <option value="sent">Sent to Guest</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Declined</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Guest Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                  placeholder="Guest Full Name"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Guest Email *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                  placeholder="guest@example.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Check-in Date</label>
              <input
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Check-out Date</label>
              <input
                type="date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-slate-700">Quotation Expiry Date (Valid Until)</label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
              />
            </div>
          </div>

          {/* Section 2: Line Items Table */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-emerald-600" />
                Quotation Line Items & Services
              </h4>
              <button
                type="button"
                onClick={addItem}
                className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-12 gap-2 items-center"
                >
                  <div className="col-span-12 sm:col-span-5">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Description</label>
                    <input
                      type="text"
                      required
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Qty</label>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 text-center"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Rate (ZAR)</label>
                    <input
                      type="number"
                      min={0}
                      value={item.unitPriceZar}
                      onChange={(e) => handleItemChange(idx, 'unitPriceZar', e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 text-right"
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-2 text-right">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Total</label>
                    <span className="text-xs font-extrabold text-slate-900">R {item.amountZar.toLocaleString()}</span>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      disabled={items.length === 1}
                      className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Summary Totals */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 border border-slate-800">
            <div className="flex justify-between items-center text-xs text-slate-300">
              <span>Subtotal (Excl. 15% VAT):</span>
              <span className="font-semibold">R {subtotalZar.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-300">
              <span>SARS VAT (15% Included):</span>
              <span className="font-semibold text-emerald-400">R {vatAmountZar.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-300">
              <span className="flex items-center gap-1">Discount (ZAR):</span>
              <input
                type="number"
                min={0}
                value={discountZar}
                onChange={(e) => setDiscountZar(Number(e.target.value))}
                className="w-24 px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-right text-xs font-bold text-amber-400"
              />
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-black">
              <span className="text-white">Total Amount Due:</span>
              <span className="text-emerald-400 text-base">R {grossTotal.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Section 4: Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Terms & Special Guest Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900"
              placeholder="E.g., Payment required 48 hours prior to check-in."
            />
          </div>

          {/* Submit Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isEditing ? 'Save Quotation Changes' : 'Issue Official Quotation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

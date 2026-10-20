import React, { useState } from 'react';
import { Invoice, InvoiceItem, InvoiceStatus, Property } from '../../types';
import { X, Plus, Trash2, Receipt, Calendar, User, Mail, Calculator, CheckCircle2, ShieldCheck } from 'lucide-react';

interface CreateEditInvoiceModalProps {
  invoice?: Invoice | null;
  properties: Property[];
  onClose: () => void;
  onSave: (invoiceData: Omit<Invoice, 'id' | 'createdAt'> | Invoice) => void;
  currentUserRole: 'owner' | 'admin' | 'guest';
}

export const CreateEditInvoiceModal: React.FC<CreateEditInvoiceModalProps> = ({
  invoice,
  properties,
  onClose,
  onSave,
  currentUserRole,
}) => {
  const isEditing = !!invoice;

  const [propertyId, setPropertyId] = useState(invoice?.propertyId || properties[0]?.id || '');
  const [propertyTitle, setPropertyTitle] = useState(invoice?.propertyTitle || properties[0]?.title || 'Executive Solar Loft');
  const [guestName, setGuestName] = useState(invoice?.guestName || 'Kenneth Mathunywa');
  const [guestEmail, setGuestEmail] = useState(invoice?.guestEmail || 'nightscope58@gmail.com');
  const [guestPhone, setGuestPhone] = useState(invoice?.guestPhone || '+27 82 555 9812');
  const [taxNumber, setTaxNumber] = useState(invoice?.taxNumber || 'SARS-VAT-4920192837');
  const [issueDate, setIssueDate] = useState(invoice?.issueDate || new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(invoice?.dueDate || '2026-09-28');
  const [amountPaidZar, setAmountPaidZar] = useState(invoice?.amountPaidZar || 0);
  const [status, setStatus] = useState<InvoiceStatus>(invoice?.status || 'pending_payment');
  const [notes, setNotes] = useState(invoice?.notes || 'SARS VAT Tax Invoice. Payment due upon arrival.');

  const [items, setItems] = useState<InvoiceItem[]>(
    invoice?.items || [
      { id: 'inv-item-1', description: '4 Nights Accommodation (Executive Loft)', quantity: 4, unitPriceZar: 1200, amountZar: 4800 },
      { id: 'inv-item-2', description: 'Airport Shuttle VIP Transfer', quantity: 1, unitPriceZar: 450, amountZar: 450 },
    ]
  );

  const handlePropertyChange = (selectedId: string) => {
    setPropertyId(selectedId);
    const selectedProp = properties.find((p) => p.id === selectedId);
    if (selectedProp) {
      setPropertyTitle(selectedProp.title);
    }
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
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
        id: `inv-item-${Date.now()}`,
        description: 'Additional Hospitality Charge',
        quantity: 1,
        unitPriceZar: 250,
        amountZar: 250,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const totalZar = items.reduce((sum, item) => sum + item.amountZar, 0);
  const vatAmountZar = Math.round(totalZar * 0.13043 * 100) / 100; // 15% inclusive VAT breakdown
  const subtotalZar = totalZar - vatAmountZar;
  const balanceDueZar = Math.max(0, totalZar - amountPaidZar);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let computedPaymentStatus = invoice?.paymentStatus || 'unpaid';
    if (amountPaidZar >= totalZar && totalZar > 0) {
      computedPaymentStatus = 'paid';
    } else if (amountPaidZar > 0) {
      computedPaymentStatus = 'partially_paid';
    }

    const invoiceData = isEditing ? {
      ...invoice!,
      propertyId,
      propertyTitle,
      guestName,
      guestEmail,
      guestPhone,
      taxNumber,
      items,
      subtotalZar,
      vatAmountZar,
      totalZar,
      amountPaidZar,
      balanceDueZar,
      status: amountPaidZar >= totalZar ? ('paid' as const) : status,
      paymentStatus: (amountPaidZar >= totalZar ? 'paid' : amountPaidZar > 0 ? 'partially_paid' : 'unpaid') as any,
      issueDate,
      dueDate,
      notes,
    } : {
      invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      quotationRef: '',
      propertyId,
      propertyTitle,
      ownerId: 'owner-1',
      ownerName: 'Lindiwe Khumalo',
      guestName,
      guestEmail,
      guestPhone,
      taxNumber,
      items,
      subtotalZar,
      vatAmountZar,
      totalZar,
      amountPaidZar,
      balanceDueZar,
      status: amountPaidZar >= totalZar ? ('paid' as const) : status,
      paymentStatus: (amountPaidZar >= totalZar ? 'paid' : amountPaidZar > 0 ? 'partially_paid' : 'unpaid') as any,
      issueDate,
      dueDate,
      notes,
      createdBy: currentUserRole,
    };

    onSave(invoiceData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-wide">
                {isEditing ? `Edit Tax Invoice (${invoice.invoiceNumber})` : 'Create Official Tax Invoice'}
              </h3>
              <p className="text-xs text-slate-400">SARS VAT Compliant Billing & Payment Tracking</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {/* Section 1: Property & Guest Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Property / Listing *</label>
              <select
                value={propertyId}
                onChange={(e) => handlePropertyChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 text-slate-800"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.city})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Invoice Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 text-slate-800"
              >
                <option value="pending_payment">Pending Payment</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="paid">Paid in Full</option>
                <option value="overdue">Overdue</option>
                <option value="draft">Draft</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Guest Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
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
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">SARS Tax Number</label>
              <input
                type="text"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Issue Date</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Payment Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Amount Paid (Deposit / Settle)</label>
              <input
                type="number"
                min={0}
                value={amountPaidZar}
                onChange={(e) => setAmountPaidZar(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-emerald-700"
              />
            </div>
          </div>

          {/* Section 2: Items */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-blue-600" />
                Invoice Line Items
              </h4>
              <button
                type="button"
                onClick={addItem}
                className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
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
              <span>Subtotal (Excl. VAT):</span>
              <span className="font-semibold">R {subtotalZar.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-300">
              <span>SARS 15% VAT Breakdown:</span>
              <span className="font-semibold text-blue-400">R {vatAmountZar.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-300">
              <span>Amount Paid to Date:</span>
              <span className="font-semibold text-emerald-400">R {amountPaidZar.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-black">
              <span className="text-white">Outstanding Balance Due:</span>
              <span className={`text-base ${balanceDueZar === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                R {balanceDueZar.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Section 4: Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Invoice Terms & Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900"
            />
          </div>

          {/* Submit Actions */}
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
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isEditing ? 'Save Invoice Updates' : 'Issue Official Tax Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

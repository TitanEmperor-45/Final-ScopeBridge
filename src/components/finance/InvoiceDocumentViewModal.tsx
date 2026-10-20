import React from 'react';
import { Invoice, Quotation } from '../../types';
import { X, Printer, Download, CheckCircle2, ShieldCheck, Building2, Calendar, FileText, Receipt } from 'lucide-react';

interface InvoiceDocumentViewModalProps {
  document: Invoice | Quotation;
  type: 'invoice' | 'quotation';
  onClose: () => void;
  onPayNow?: () => void;
}

export const InvoiceDocumentViewModal: React.FC<InvoiceDocumentViewModalProps> = ({
  document,
  type,
  onClose,
  onPayNow,
}) => {
  const isInvoice = type === 'invoice';
  const inv = isInvoice ? (document as Invoice) : null;
  const quote = !isInvoice ? (document as Quotation) : null;

  const docNumber = isInvoice ? inv?.invoiceNumber : quote?.quotationNumber;
  const issueDate = isInvoice ? inv?.issueDate : quote?.createdAt?.split('T')[0];
  const dueDate = isInvoice ? inv?.dueDate : quote?.validUntil;
  const taxNumber = isInvoice ? inv?.taxNumber : 'SARS-VAT-4920192837';
  const status = document.status;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Control Bar */}
        <div className="bg-slate-900 p-4 text-white flex items-center justify-between print:hidden border-b border-slate-800">
          <div className="flex items-center gap-2">
            {isInvoice ? <Receipt className="w-5 h-5 text-blue-400" /> : <FileText className="w-5 h-5 text-emerald-400" />}
            <span className="text-sm font-extrabold uppercase tracking-wide">
              {isInvoice ? 'Official Tax Invoice Document' : 'Official Quotation Document'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isInvoice && inv?.status !== 'paid' && onPayNow && (
              <button
                onClick={onPayNow}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Pay Invoice
              </button>
            )}
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex items-center gap-1 transition-all"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Printable Body */}
        <div className="p-8 overflow-y-auto bg-white text-slate-900 space-y-6 print:p-0 print:overflow-visible">
          {/* Header Banner */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-slate-950 text-emerald-400 font-black text-lg flex items-center justify-center">
                  SB
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-950 tracking-tight">ScopeBridg</h1>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Hospitality & Asset Management</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 pt-1">
                ScopeBridg Global &amp; Executive Stays<br />
                SARS Tax Reg No: <span className="font-semibold text-slate-700">{taxNumber}</span>
              </p>
            </div>

            <div className="text-right space-y-1">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                status === 'paid'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : status === 'overdue'
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                {status.replace('_', ' ')}
              </span>
              <h2 className="text-lg font-black text-slate-900 pt-1">{docNumber}</h2>
              <p className="text-xs text-slate-500">Date Issued: <span className="font-bold text-slate-800">{issueDate}</span></p>
              <p className="text-xs text-slate-500">
                {isInvoice ? 'Due Date:' : 'Valid Until:'} <span className="font-bold text-slate-800">{dueDate}</span>
              </p>
            </div>
          </div>

          {/* Bill To & Property Details */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Bill To / Billed Guest</span>
              <p className="text-sm font-black text-slate-900 pt-1">{document.guestName}</p>
              <p className="text-xs text-slate-600">{document.guestEmail}</p>
              {document.guestPhone && <p className="text-xs text-slate-600">{document.guestPhone}</p>}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Property & Location</span>
              <p className="text-sm font-black text-slate-900 pt-1">{document.propertyTitle}</p>
              <p className="text-xs text-slate-600">Host: {document.ownerName || 'ScopeBridg Host'}</p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 text-[11px] font-black uppercase text-slate-500">
                  <th className="py-2.5">Item & Description</th>
                  <th className="py-2.5 text-center">Qty</th>
                  <th className="py-2.5 text-right">Unit Rate</th>
                  <th className="py-2.5 text-right">Total (ZAR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs font-medium">
                {document.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 font-semibold text-slate-900">{item.description}</td>
                    <td className="py-3 text-center">{item.quantity}</td>
                    <td className="py-3 text-right">R {item.unitPriceZar.toLocaleString()}</td>
                    <td className="py-3 text-right font-bold text-slate-900">R {item.amountZar.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Calculation Box */}
          <div className="pt-4 border-t-2 border-slate-900 flex justify-end">
            <div className="w-full max-w-xs space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Excl. VAT):</span>
                <span className="font-semibold">R {document.subtotalZar.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>SARS VAT Breakdown (15%):</span>
                <span className="font-semibold text-slate-900">R {document.vatAmountZar.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
              </div>
              {isInvoice && inv && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Amount Paid:</span>
                  <span className="font-bold">R {inv.amountPaidZar.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-300 flex justify-between items-center text-sm font-black text-slate-950">
                <span>{isInvoice ? 'Balance Due:' : 'Total Quoted:'}</span>
                <span className="text-base text-emerald-700">
                  R {(isInvoice ? inv?.balanceDueZar || 0 : document.totalZar).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Terms & Footer */}
          <div className="pt-6 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
            <p className="font-bold text-slate-800">Terms & Conditions:</p>
            <p>{document.notes || 'SARS VAT compliant hospitality document generated via ScopeBridg.'}</p>
            <p className="pt-2 text-[10px] text-slate-400 text-center">
              Generated by ScopeBridg Platform System • Official Copy • All rights reserved
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Invoice, InvoiceStatus, Property, Quotation, QuotationStatus } from '../../types';
import {
  FileText,
  Receipt,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Edit2,
  Trash2,
  Eye,
  ArrowRight,
  CreditCard,
  Building2,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Download,
  Printer,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { CreateEditQuotationModal } from './CreateEditQuotationModal';
import { CreateEditInvoiceModal } from './CreateEditInvoiceModal';
import { InvoiceDocumentViewModal } from './InvoiceDocumentViewModal';

interface QuotationsAndInvoicesManagerProps {
  role: 'owner' | 'admin' | 'guest';
  currentUserName?: string;
  currentUserEmail?: string;
  quotations: Quotation[];
  invoices: Invoice[];
  properties: Property[];
  onCreateQuotation: (quote: Omit<Quotation, 'id' | 'createdAt'>) => void;
  onEditQuotation: (quote: Quotation) => void;
  onDeleteQuotation: (quoteId: string) => void;
  onConvertQuoteToInvoice: (quoteId: string) => void;
  onAcceptQuotation?: (quoteId: string) => void;
  onDeclineQuotation?: (quoteId: string) => void;
  onCreateInvoice: (inv: Omit<Invoice, 'id' | 'createdAt'>) => void;
  onEditInvoice: (inv: Invoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onPayInvoice: (invoiceId: string, paymentMethod: string, amountPaid: number) => void;
  onUpdateInvoiceStatus?: (invoiceId: string, status: InvoiceStatus) => void;
}

export const QuotationsAndInvoicesManager: React.FC<QuotationsAndInvoicesManagerProps> = ({
  role,
  currentUserName = 'Kenneth Mathunywa',
  currentUserEmail = 'nightscope58@gmail.com',
  quotations,
  invoices,
  properties,
  onCreateQuotation,
  onEditQuotation,
  onDeleteQuotation,
  onConvertQuoteToInvoice,
  onAcceptQuotation,
  onDeclineQuotation,
  onCreateInvoice,
  onEditInvoice,
  onDeleteInvoice,
  onPayInvoice,
  onUpdateInvoiceStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'quotations'>('invoices');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [isCreateQuoteOpen, setIsCreateQuoteOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quotation | null>(null);

  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const [viewingDoc, setViewingDoc] = useState<{ doc: Invoice | Quotation; type: 'invoice' | 'quotation' } | null>(null);

  // Pay Invoice Modal State
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'ozow' | 'wallet'>('ozow');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Filter lists according to role and search
  const filteredQuotations = quotations.filter((q) => {
    if (role === 'guest') {
      const matchGuest =
        q.guestEmail.toLowerCase().includes(currentUserEmail.toLowerCase()) ||
        q.guestName.toLowerCase().includes(currentUserName.toLowerCase());
      if (!matchGuest) return false;
    }

    const matchesSearch =
      q.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter !== 'all' && q.status !== statusFilter) return false;
    return matchesSearch;
  });

  const filteredInvoices = invoices.filter((inv) => {
    if (role === 'guest') {
      const matchGuest =
        inv.guestEmail.toLowerCase().includes(currentUserEmail.toLowerCase()) ||
        inv.guestName.toLowerCase().includes(currentUserName.toLowerCase());
      if (!matchGuest) return false;
    }

    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter !== 'all') {
      if (statusFilter === 'paid' && inv.status !== 'paid') return false;
      if (statusFilter === 'unpaid' && inv.status !== 'pending_payment' && inv.status !== 'partially_paid') return false;
      if (statusFilter === 'overdue' && inv.status !== 'overdue') return false;
    }

    return matchesSearch;
  });

  // Financial Stats
  const totalInvoicedZar = invoices.reduce((sum, inv) => sum + inv.totalZar, 0);
  const totalPaidZar = invoices.reduce((sum, inv) => sum + inv.amountPaidZar, 0);
  const totalBalanceDueZar = invoices.reduce((sum, inv) => sum + inv.balanceDueZar, 0);
  const totalQuotedZar = quotations.reduce((sum, q) => sum + q.totalZar, 0);

  const handleExecutePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice) return;

    setIsProcessingPayment(true);
    setTimeout(() => {
      onPayInvoice(
        payingInvoice.id,
        paymentMethod === 'ozow' ? 'Instant Ozow EFT' : paymentMethod === 'wallet' ? 'ScopeBridg Virtual Wallet' : 'Credit Card',
        payingInvoice.balanceDueZar
      );
      setIsProcessingPayment(false);
      setPayingInvoice(null);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats Overview */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {role === 'owner' ? 'Property Owner Portal' : role === 'admin' ? 'Super Admin Billing Center' : 'Guest Financial Desk'}
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white pt-1">
              Quotations & Invoicing Hub
            </h2>
            <p className="text-xs text-slate-300">
              {role === 'guest'
                ? 'Review quotations, track tax invoices, and settle stay balances with 100% security'
                : 'Issue official SARS VAT tax invoices, generate quotations, and monitor real-time payment statuses'}
            </p>
          </div>

          {(role === 'owner' || role === 'admin') && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCreateQuoteOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                New Quotation
              </button>
              <button
                onClick={() => setIsCreateInvoiceOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                New Tax Invoice
              </button>
            </div>
          )}
        </div>

        {/* Quick Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total Quoted Value</span>
            <p className="text-lg font-black text-emerald-400 pt-1">R {totalQuotedZar.toLocaleString('en-ZA')}</p>
            <span className="text-[10px] text-slate-400">{quotations.length} Active Quotations</span>
          </div>
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total Invoiced</span>
            <p className="text-lg font-black text-blue-400 pt-1">R {totalInvoicedZar.toLocaleString('en-ZA')}</p>
            <span className="text-[10px] text-slate-400">{invoices.length} Issued Invoices</span>
          </div>
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total Collected</span>
            <p className="text-lg font-black text-emerald-400 pt-1">R {totalPaidZar.toLocaleString('en-ZA')}</p>
            <span className="text-[10px] text-emerald-400/80">Paid in Full</span>
          </div>
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Outstanding Balance</span>
            <p className="text-lg font-black text-amber-400 pt-1">R {totalBalanceDueZar.toLocaleString('en-ZA')}</p>
            <span className="text-[10px] text-amber-300">Awaiting Settlement</span>
          </div>
        </div>
      </div>

      {/* Tabs & Filters Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Main Tab Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex-1 md:flex-none px-5 py-2 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'invoices'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Tax Invoices ({filteredInvoices.length})
          </button>
          <button
            onClick={() => setActiveTab('quotations')}
            className={`flex-1 md:flex-none px-5 py-2 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'quotations'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            Quotations ({filteredQuotations.length})
          </button>
        </div>

        {/* Search & Status Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search document no, guest, or property..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
          >
            <option value="all">All Statuses</option>
            {activeTab === 'invoices' ? (
              <>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid / Pending</option>
                <option value="overdue">Overdue</option>
              </>
            ) : (
              <>
                <option value="sent">Sent</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Declined</option>
                <option value="draft">Draft</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* INVOICES LIST VIEW */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {filteredInvoices.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Receipt className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-700">No Tax Invoices Found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No invoices match your active filters or search queries.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                    <th className="py-3 px-4">Invoice No</th>
                    <th className="py-3 px-4">Guest / Email</th>
                    <th className="py-3 px-4">Property Stay</th>
                    <th className="py-3 px-4 text-right">Total Amount</th>
                    <th className="py-3 px-4 text-right">Balance Due</th>
                    <th className="py-3 px-4 text-center">Payment Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs font-semibold text-slate-800">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-black text-slate-900">
                        {inv.invoiceNumber}
                        {inv.quotationRef && (
                          <span className="block text-[10px] text-slate-400 font-medium">Ref: {inv.quotationRef}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-slate-900 block">{inv.guestName}</span>
                        <span className="text-[11px] text-slate-500 font-medium">{inv.guestEmail}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800">{inv.propertyTitle}</span>
                        <span className="block text-[10px] text-slate-400">Due: {inv.dueDate}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900">
                        R {inv.totalZar.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black">
                        <span className={inv.balanceDueZar === 0 ? 'text-emerald-600' : 'text-amber-600'}>
                          R {inv.balanceDueZar.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          inv.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : inv.status === 'overdue'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : inv.status === 'partially_paid'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {inv.status === 'paid' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {inv.status === 'overdue' && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                          {inv.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Guest Pay Action */}
                          {role === 'guest' && inv.status !== 'paid' && (
                            <button
                              onClick={() => setPayingInvoice(inv)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              Pay Now
                            </button>
                          )}

                          {/* Document Preview */}
                          <button
                            onClick={() => setViewingDoc({ doc: inv, type: 'invoice' })}
                            className="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                            title="View / Print Tax Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Owner & Admin Edit/Delete */}
                          {(role === 'owner' || role === 'admin') && (
                            <>
                              <button
                                onClick={() => setEditingInvoice(inv)}
                                className="p-1.5 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Edit Invoice"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete Invoice ${inv.invoiceNumber}?`)) {
                                    onDeleteInvoice(inv.id);
                                  }
                                }}
                                className="p-1.5 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                                title="Delete Invoice"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* QUOTATIONS LIST VIEW */}
      {activeTab === 'quotations' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {filteredQuotations.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-700">No Quotations Found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No active quotations match your selected search or filter settings.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                    <th className="py-3 px-4">Quote No</th>
                    <th className="py-3 px-4">Guest / Email</th>
                    <th className="py-3 px-4">Property</th>
                    <th className="py-3 px-4 text-right">Quoted Total</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs font-semibold text-slate-800">
                  {filteredQuotations.map((quote) => (
                    <tr key={quote.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-black text-slate-900">
                        {quote.quotationNumber}
                        <span className="block text-[10px] text-slate-400 font-medium">Valid: {quote.validUntil}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-slate-900 block">{quote.guestName}</span>
                        <span className="text-[11px] text-slate-500 font-medium">{quote.guestEmail}</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">{quote.propertyTitle}</td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-700">
                        R {quote.totalZar.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          quote.status === 'accepted'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : quote.status === 'declined'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-blue-100 text-blue-800 border border-blue-300'
                        }`}>
                          {quote.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Guest Accept / Decline */}
                          {role === 'guest' && quote.status === 'sent' && (
                            <>
                              <button
                                onClick={() => onAcceptQuotation && onAcceptQuotation(quote.id)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Accept Quote
                              </button>
                              <button
                                onClick={() => onDeclineQuotation && onDeclineQuotation(quote.id)}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-all"
                              >
                                Decline
                              </button>
                            </>
                          )}

                          {/* Owner / Admin Convert to Invoice */}
                          {(role === 'owner' || role === 'admin') && quote.status !== 'accepted' && (
                            <button
                              onClick={() => onConvertQuoteToInvoice(quote.id)}
                              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                              title="Convert Quote to Official Tax Invoice"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                              To Invoice
                            </button>
                          )}

                          {/* View Preview */}
                          <button
                            onClick={() => setViewingDoc({ doc: quote, type: 'quotation' })}
                            className="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                            title="View / Print Quotation"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Owner / Admin Edit/Delete */}
                          {(role === 'owner' || role === 'admin') && (
                            <>
                              <button
                                onClick={() => setEditingQuote(quote)}
                                className="p-1.5 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Delete Quotation ${quote.quotationNumber}?`)) {
                                    onDeleteQuotation(quote.id);
                                  }
                                }}
                                className="p-1.5 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT QUOTATION MODAL */}
      {(isCreateQuoteOpen || editingQuote) && (
        <CreateEditQuotationModal
          quotation={editingQuote}
          properties={properties}
          onClose={() => {
            setIsCreateQuoteOpen(false);
            setEditingQuote(null);
          }}
          onSave={(data) => {
            if (editingQuote) {
              onEditQuotation(data as Quotation);
            } else {
              onCreateQuotation(data as Omit<Quotation, 'id' | 'createdAt'>);
            }
            setIsCreateQuoteOpen(false);
            setEditingQuote(null);
          }}
          currentUserRole={role}
        />
      )}

      {/* CREATE / EDIT INVOICE MODAL */}
      {(isCreateInvoiceOpen || editingInvoice) && (
        <CreateEditInvoiceModal
          invoice={editingInvoice}
          properties={properties}
          onClose={() => {
            setIsCreateInvoiceOpen(false);
            setEditingInvoice(null);
          }}
          onSave={(data) => {
            if (editingInvoice) {
              onEditInvoice(data as Invoice);
            } else {
              onCreateInvoice(data as Omit<Invoice, 'id' | 'createdAt'>);
            }
            setIsCreateInvoiceOpen(false);
            setEditingInvoice(null);
          }}
          currentUserRole={role}
        />
      )}

      {/* DOCUMENT VIEW & PRINT MODAL */}
      {viewingDoc && (
        <InvoiceDocumentViewModal
          document={viewingDoc.doc}
          type={viewingDoc.type}
          onClose={() => setViewingDoc(null)}
          onPayNow={() => {
            if (viewingDoc.type === 'invoice') {
              setPayingInvoice(viewingDoc.doc as Invoice);
              setViewingDoc(null);
            }
          }}
        />
      )}

      {/* GUEST PAY INVOICE MODAL */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-wide">Settle Tax Invoice Balance</h3>
                  <p className="text-[10px] text-slate-400">{payingInvoice.invoiceNumber} • {payingInvoice.propertyTitle}</p>
                </div>
              </div>
              <button
                onClick={() => setPayingInvoice(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecutePayment} className="p-5 space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-emerald-800">Outstanding Amount Due</span>
                  <p className="text-xl font-black text-emerald-950">
                    R {payingInvoice.balanceDueZar.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <ShieldCheck className="w-8 h-8 text-emerald-600" />
              </div>

              {/* Select Gateway / Payment Method */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Choose Secure Payment Method</label>

                <div
                  onClick={() => setPaymentMethod('ozow')}
                  className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    paymentMethod === 'ozow'
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Instant Ozow EFT (Zero Fee)</p>
                      <p className="text-[10px] text-slate-500">Instant bank clearance across Capitec, FNB, ABSA & Nedbank</p>
                    </div>
                  </div>
                  {paymentMethod === 'ozow' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>

                <div
                  onClick={() => setPaymentMethod('wallet')}
                  className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    paymentMethod === 'wallet'
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Wallet className="w-5 h-5 text-indigo-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">ScopeBridg Virtual Wallet</p>
                      <p className="text-[10px] text-slate-500">Pay directly using accumulated rewards & holiday fund</p>
                    </div>
                  </div>
                  {paymentMethod === 'wallet' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>

                <div
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    paymentMethod === 'card'
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Credit / Debit Card (Visa & Mastercard)</p>
                      <p className="text-[10px] text-slate-500">3D Secure 256-Bit SSL Encrypted Card Checkout</p>
                    </div>
                  </div>
                  {paymentMethod === 'card' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
              </div>

              {/* Action */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayingInvoice(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingPayment}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  {isProcessingPayment ? (
                    'Processing Payment...'
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Authorize R {payingInvoice.balanceDueZar.toLocaleString('en-ZA')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

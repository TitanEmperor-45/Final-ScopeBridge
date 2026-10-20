import React, { useEffect, useState } from 'react';
import {
  X,
  Send,
  CheckCircle2,
  Image as ImageIcon,
  FileText,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Mail,
  Copy,
} from 'lucide-react';
import {
  OpenWaSupportRequest,
  subscribeToOpenWaModal,
  closeOpenWaSupportModal,
  dispatchOpenWaApiMessage,
} from '../../lib/openwaBridge';
import { WhatsAppIcon } from './WhatsAppIcon';

export const OpenWaSupportModal: React.FC = () => {
  const [activeRequest, setActiveRequest] = useState<OpenWaSupportRequest | null>(null);
  const [phone, setPhone] = useState('27694977018');
  const [message, setMessage] = useState('');
  const [operation, setOperation] = useState<
    'send-text' | 'send-image' | 'send-document' | 'send-location'
  >('send-text');
  const [imageUrl, setImageUrl] = useState(
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'
  );
  const [documentUrl, setDocumentUrl] = useState(
    'https://scopebridg.co.za/api/user-guide/download.pdf'
  );
  const [filename, setFilename] = useState('ScopeBridg_Support_Document.pdf');
  const [latitude, setLatitude] = useState('-26.1467');
  const [longitude, setLongitude] = useState('28.0436');
  const [locTitle, setLocTitle] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [receiptLog, setReceiptLog] = useState<
    Array<{
      messageId: string;
      operation: string;
      phone: string;
      text: string;
      timestamp: string;
    }>
  >([]);

  useEffect(() => {
    return subscribeToOpenWaModal((req) => {
      setActiveRequest(req);
      if (req) {
        setPhone(req.phone || '27694977018');
        setMessage(req.message || '');
        setOperation('send-text');
        if (req.autoDispatchedReceipt) {
          setReceiptLog((prev) => [
            {
              messageId: req.autoDispatchedReceipt!.messageId,
              operation: req.autoDispatchedReceipt!.operation,
              phone: req.autoDispatchedReceipt!.phone,
              text: req.message,
              timestamp: req.autoDispatchedReceipt!.timestamp,
            },
            ...prev.slice(0, 9),
          ]);
        }
      }
    });
  }, []);

  if (!activeRequest) return null;

  const handleSendViaScopeBridge = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      const res = await dispatchOpenWaApiMessage({
        phone,
        message,
        operation,
        imageUrl,
        documentUrl,
        filename,
        caption: message,
        latitude: Number(latitude) || -26.1467,
        longitude: Number(longitude) || 28.0436,
        title: locTitle,
      });
      if (res && res.openWaReceipt) {
        setReceiptLog((prev) => [
          {
            messageId: res.openWaReceipt.messageId,
            operation: res.openWaReceipt.operation,
            phone: res.openWaReceipt.phone,
            text:
              operation === 'send-text'
                ? message
                : `[${operation}] ${message || locTitle || filename}`,
            timestamp: new Date().toISOString(),
          },
          ...prev.slice(0, 9),
        ]);
      }
    } finally {
      setIsSending(false);
    }
  };

  const cleanDigits = phone.replace(/[^\d]/g, '') || '27694977018';
  const whatsappDirectUrl = `https://wa.me/${cleanDigits}?text=${encodeURIComponent(message || 'Hello Scope Bridge Support, I need assistance.')}`;
  const mailtoUri = `mailto:nightscope58@gmail.com?subject=${encodeURIComponent('Scope Bridge Support Inquiry')}&body=${encodeURIComponent(message || 'Hello Scope Bridge Support, I need assistance.')}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-slate-950 text-white border border-emerald-500/40 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
              <WhatsAppIcon className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Scope Bridge Support Active
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  +27 69 497 7018
                </span>
              </div>
              <h3 className="text-sm font-black text-white mt-0.5">
                {activeRequest.recipientLabel || 'Scope Bridge Support Communicator'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={closeOpenWaSupportModal}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[82vh] overflow-y-auto text-xs">
          {/* Quick Direct Launch Action Strip */}
          <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                Direct External Delivery Actions
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Admin: nightscope58@gmail.com
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                href={whatsappDirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-openwa-bypass="true"
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
              >
                <WhatsAppIcon className="w-4 h-4 text-white" />
                <span>Open WhatsApp App / Web</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <a
                href={mailtoUri}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 hover:border-emerald-500/40 font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Mail className="w-4 h-4 text-emerald-400" />
                <span>Open Mail Client</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Auto-dispatched confirmation banner */}
          {receiptLog.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black text-emerald-300">
                    Dispatched via Scope Bridge Gateway!
                  </span>
                  <span className="font-mono text-[10px] text-emerald-400">
                    #{receiptLog[0].messageId}
                  </span>
                </div>
                <p className="text-[11px] text-slate-200 break-words">
                  Delivered to <strong className="font-mono text-white">{receiptLog[0].phone}@c.us</strong>:{' '}
                  &ldquo;{receiptLog[0].text}&rdquo;
                </p>
              </div>
            </div>
          )}

          {/* Operation selector */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'send-text', label: 'Text Message', icon: WhatsAppIcon },
                { id: 'send-image', label: 'Send Image', icon: ImageIcon },
                { id: 'send-document', label: 'Send Document', icon: FileText },
                { id: 'send-location', label: 'Send GPS Pin', icon: MapPin },
              ] as const
            ).map((op) => {
              const Icon = op.icon;
              const active = operation === op.id;
              return (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => setOperation(op.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                    active
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{op.label}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSendViaScopeBridge} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Scope Bridge WhatsApp Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Scope Bridge Session &amp; Status
                </label>
                <div className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-emerald-300 font-mono text-xs flex items-center justify-between">
                  <span>session: default</span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ONLINE
                  </span>
                </div>
              </div>
            </div>

            {operation === 'send-image' && (
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs"
                  required
                />
              </div>
            )}

            {operation === 'send-document' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Document URL
                  </label>
                  <input
                    type="text"
                    value={documentUrl}
                    onChange={(e) => setDocumentUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Filename
                  </label>
                  <input
                    type="text"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs"
                    required
                  />
                </div>
              </div>
            )}

            {operation === 'send-location' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Latitude
                  </label>
                  <input
                    type="text"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Longitude
                  </label>
                  <input
                    type="text"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Location Title
                  </label>
                  <input
                    type="text"
                    value={locTitle}
                    onChange={(e) => setLocTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold uppercase text-slate-400">
                  {operation === 'send-text' ? 'Message (WhatsApp & Scope Bridge)' : 'Message Caption'}
                </label>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer font-bold"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedToast ? 'Copied!' : 'Copy Text'}</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                required
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                type="submit"
                disabled={isSending}
                className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {isSending
                    ? `Sending via Scope Bridge (${operation})...`
                    : `Send via Scope Bridge API (${operation})`}
                </span>
              </button>
            </div>
          </form>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Scope Bridge Support: Verified Active
            </span>
            <span className="font-mono text-slate-400">
              WhatsApp: +27 69 497 7018
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

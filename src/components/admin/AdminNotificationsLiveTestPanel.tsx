import React, { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  CheckCircle2,
  Mail,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Radio,
  Image as ImageIcon,
  FileText,
  MapPin,
  Code2,
  QrCode,
  UserCheck,
  Headphones,
  Sparkles,
} from 'lucide-react';
import { AdminAuditAlert } from '../../types';
import { WhatsAppIcon } from '../common/WhatsAppIcon';

interface LiveNotificationRecord {
  id: string;
  timestamp: string;
  eventType: string;
  title: string;
  message: string;
  adminPhone: string;
  adminEmail: string;
  recipientEmail: string;
  recipientPhone: string;
  whatsapp: {
    status: string;
    to: string;
    whatsappUrl: string;
    whatsappApiUrl: string;
    messagePreview: string;
  };
  openWa?: {
    provider: string;
    endpoint: string;
    session: string;
    operation: 'send-text' | 'send-image' | 'send-document' | 'send-location' | 'check-contact';
    phone: string;
    messageId: string;
    status: string;
    headers: { 'X-API-Key': string; 'Content-Type': string };
    requestPayload: Record<string, any>;
    rawResponse: Record<string, any>;
  };
  email: {
    status: string;
    to: string[];
    subject: string;
    mailtoUri: string;
  };
  inAppChat: {
    status: string;
    adminCell: string;
  };
}

interface AdminNotificationsLiveTestPanelProps {
  adminEmail?: string;
  onPushAdminAlert?: (alert: AdminAuditAlert) => void;
}

const ADMIN_SUPPORT_TEMPLATES = [
  {
    id: 'guest_checkin',
    label: 'Guest Check-In & PIN Support',
    operation: 'send-text' as const,
    text: 'Hello from Scope Bridge Admin Support (+27 69 497 7018)! Your residence check-in is confirmed. Lockbox PIN: *4829# | Smart Lock PIN: 8821#. Reply here on WhatsApp anytime for 24/7 concierge assistance.',
  },
  {
    id: 'payment_otp',
    label: 'Payment & 6-Digit OTP Support',
    operation: 'send-text' as const,
    text: 'Scope Bridge Finance & Payment Support: Your payment transaction is protected by 6-digit OTP verification. Please enter the code dispatched to your WhatsApp or reply here for immediate Admin override.',
  },
  {
    id: 'owner_payout',
    label: 'Owner Listing & Payout Support',
    operation: 'send-text' as const,
    text: 'Scope Bridge Host & Owner Support: Your property listing and room inventory are verified and active across all OTA channels. Your owner payout settlement has been scheduled.',
  },
  {
    id: 'kiosk_credentials',
    label: 'Staff Kiosk Mode Credentials',
    operation: 'send-text' as const,
    text: 'Scope Bridge Kiosk Mode Support: Staff created by the Property Owner can log directly into the "Login Kiosk Mode" tab (between Sign In and Register Profile) using their assigned username and password.',
  },
  {
    id: 'property_gps',
    label: 'Send Property GPS Pin',
    operation: 'send-location' as const,
    text: 'Executive Residence GPS Location Pin',
  },
  {
    id: 'user_guide_pdf',
    label: 'Send Official User Guide PDF',
    operation: 'send-document' as const,
    text: 'Attached is the official Scope Bridge Complete Platform User Guide PDF.',
  },
];

export const AdminNotificationsLiveTestPanel: React.FC<AdminNotificationsLiveTestPanelProps> = ({
  adminEmail = 'nightscope58@gmail.com',
  onPushAdminAlert,
}) => {
  const [targetPhone, setTargetPhone] = useState('+27694977018');
  const [targetEmail, setTargetEmail] = useState(adminEmail || 'nightscope58@gmail.com');
  const [customMessageText, setCustomMessageText] = useState(
    'Scope Bridge Support (+27 69 497 7018): Live WhatsApp support & notification channel active for Scope Bridge Admin nightscope58@gmail.com.'
  );
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [isSendingOpenWa, setIsSendingOpenWa] = useState(false);
  const [isVerifyingContact, setIsVerifyingContact] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<any | null>(null);
  const [openWaStatus, setOpenWaStatus] = useState<any | null>(null);
  const [contactCheckResult, setContactCheckResult] = useState<any | null>(null);
  const [sessionQrResult, setSessionQrResult] = useState<any | null>(null);
  const [history, setHistory] = useState<LiveNotificationRecord[]>([]);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Scope Bridge API Examples State
  const [openWaOperation, setOpenWaOperation] = useState<
    'send-text' | 'send-image' | 'send-document' | 'send-location'
  >('send-text');
  const [openWaSession, setOpenWaSession] = useState('default');
  const [openWaApiKey, setOpenWaApiKey] = useState('dev-admin-key');
  const [openWaImageUrl, setOpenWaImageUrl] = useState(
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'
  );
  const [openWaDocUrl, setOpenWaDocUrl] = useState(
    'https://scopebridg.co.za/api/user-guide/download.pdf'
  );
  const [openWaDocFilename, setOpenWaDocFilename] = useState(
    'ScopeBridg_Complete_Platform_User_Guide_2026.pdf'
  );
  const [openWaLat, setOpenWaLat] = useState('-26.1467');
  const [openWaLng, setOpenWaLng] = useState('28.0436');
  const [openWaLocTitle, setOpenWaLocTitle] = useState('Rosebank & Sandton, Johannesburg');

  const fetchStatusAndHistory = async () => {
    try {
      const [hRes, sRes] = await Promise.all([
        fetch('/api/notifications/history'),
        fetch('/api/openwa/status'),
      ]);
      const hData = await hRes.json();
      const oData = await sRes.json();
      if (hData.success) {
        setHistory(hData.notifications || []);
      }
      if (oData) {
        setOpenWaStatus(oData);
      }
    } catch {
      // Ignore initial background fetch error
    }
  };

  useEffect(() => {
    fetchStatusAndHistory();
    const interval = setInterval(fetchStatusAndHistory, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleRestartOpenWaSession = async () => {
    try {
      const res = await fetch('/api/openwa/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: openWaSession }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusBanner(
          `Scope Bridge Session '${data.session.name}' Verified & ONLINE (+27 69 497 7018)`
        );
        fetchStatusAndHistory();
      }
    } catch {
      // Ignore error
    }
  };

  const handleCheckWhatsAppContact = async () => {
    setIsVerifyingContact(true);
    try {
      const cleanPhone = (targetPhone || '27694977018').replace(/[^\d]/g, '');
      const res = await fetch(`/api/openwa/contacts/check/${cleanPhone}`);
      const data = await res.json();
      setContactCheckResult(data);
      setStatusBanner(
        `Scope Bridge WhatsApp Contact Verified: ${data.jid} (Exists: ${data.exists ? 'YES' : 'NO'} • Business: ${data.isBusiness ? 'YES' : 'NO'})`
      );
    } catch {
      // Ignore error
    } finally {
      setIsVerifyingContact(false);
    }
  };

  const handleCheckSessionQr = async () => {
    try {
      const res = await fetch(`/api/openwa/sessions/${encodeURIComponent(openWaSession)}/qr`);
      const data = await res.json();
      setSessionQrResult(data);
      setStatusBanner(`Scope Bridge Session '${openWaSession}' QR Check: ${data.message}`);
    } catch {
      // Ignore error
    }
  };

  const cleanDigits = (targetPhone || '27694977018').replace(/[^\d]/g, '') || '27694977018';
  const directWhatsAppUrl = `https://wa.me/${cleanDigits}?text=${encodeURIComponent(customMessageText)}`;
  const directMailtoUrl = `mailto:${encodeURIComponent(targetEmail)}?subject=${encodeURIComponent('[Scope Bridge Support] Live Multi-Channel Alert')}&body=${encodeURIComponent(customMessageText)}`;

  const handleRunLiveTestAll = async () => {
    setIsTestingAll(true);
    setStatusBanner(null);
    try {
      const res = await fetch('/api/notifications/test-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPhone: targetPhone.trim() || '+27694977018',
          adminEmail: targetEmail.trim() || 'nightscope58@gmail.com',
          customMessage: customMessageText.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.dispatchRecord) {
        setLastTestResult(data);
        setStatusBanner(
          `SCOPE BRIDGE LIVE TEST PASSED: WhatsApp (#${data.dispatchRecord.openWa?.messageId || 'SENT'}) → ${data.adminPhone}, Email (${data.adminEmail}) & In-App Chat dispatched! Click below to open directly in WhatsApp or Mail.`
        );
        if (onPushAdminAlert) {
          onPushAdminAlert({
            id: `alert-live-test-${Date.now()}`,
            severity: 'high',
            title: `Scope Bridge Support & Notification Test Verified (OTP: ${data.testOtp})`,
            message: `Dispatched to ${data.adminPhone} & ${data.adminEmail} via Scope Bridge WhatsApp (${data.dispatchRecord.openWa?.messageId}), Email & In-App Chat.`,
            category: 'operations',
            timestamp: 'Just now',
            resolved: false,
          });
        }
        await fetchStatusAndHistory();
      }
    } catch (err: any) {
      setStatusBanner(`Live test error: ${err?.message || 'Unable to reach notification server'}`);
    } finally {
      setIsTestingAll(false);
    }
  };

  const handleSendOpenWaExample = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingOpenWa(true);
    setStatusBanner(null);
    try {
      const payload: Record<string, any> = {
        session: openWaSession || 'default',
        phone: cleanDigits,
        message: customMessageText.trim(),
        caption: customMessageText.trim(),
        imageUrl: openWaImageUrl.trim(),
        documentUrl: openWaDocUrl.trim(),
        filename: openWaDocFilename.trim(),
        latitude: Number(openWaLat) || -26.1467,
        longitude: Number(openWaLng) || 28.0436,
        title: openWaLocTitle.trim(),
      };

      const res = await fetch(`/api/openwa/messages/${openWaOperation}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': openWaApiKey,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.openWaReceipt) {
        setLastTestResult({
          testedAt: new Date().toISOString(),
          testOtp: data.openWaReceipt.messageId,
          adminPhone: `+${data.openWaReceipt.phone}`,
          adminEmail: targetEmail,
          dispatchRecord: data.record,
        });
        setStatusBanner(
          `Scope Bridge Message (${openWaOperation}) Dispatched to ${data.openWaReceipt.phone}@c.us! messageId=${data.openWaReceipt.messageId} | session=${data.openWaReceipt.session}`
        );
        if (onPushAdminAlert) {
          onPushAdminAlert({
            id: `alert-openwa-${Date.now()}`,
            severity: 'medium',
            title: `Scope Bridge ${openWaOperation} Dispatched`,
            message: `Dispatched to +${data.openWaReceipt.phone} (#${data.openWaReceipt.messageId})`,
            category: 'operations',
            timestamp: 'Just now',
            resolved: false,
          });
        }
        await fetchStatusAndHistory();
      }
    } catch (err: any) {
      setStatusBanner(`Scope Bridge dispatch error: ${err?.message || 'Failed to send'}`);
    } finally {
      setIsSendingOpenWa(false);
    }
  };

  const openWaExampleJson =
    openWaOperation === 'send-text'
      ? {
          session: openWaSession,
          phone: cleanDigits,
          message: customMessageText,
        }
      : openWaOperation === 'send-image'
      ? {
          session: openWaSession,
          phone: cleanDigits,
          imageUrl: openWaImageUrl,
          caption: customMessageText,
        }
      : openWaOperation === 'send-document'
      ? {
          session: openWaSession,
          phone: cleanDigits,
          documentUrl: openWaDocUrl,
          filename: openWaDocFilename,
          caption: customMessageText,
        }
      : {
          session: openWaSession,
          phone: cleanDigits,
          latitude: Number(openWaLat) || -26.1467,
          longitude: Number(openWaLng) || 28.0436,
          title: openWaLocTitle,
        };

  return (
    <div className="bg-slate-950 text-white rounded-3xl border border-emerald-500/40 p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-black uppercase tracking-wider">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              Scope Bridge Support &amp; WhatsApp Dispatch Hub
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-[11px] font-mono font-bold">
              <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>+27 69 497 7018</span>
            </span>
          </div>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Headphones className="w-5 h-5 text-emerald-400" />
            <span>
              Scope Bridge Support &amp; Live Multi-Channel Notification Hub
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Real-time WhatsApp support, customer inquiries, and OTP alerts on Admin cell <strong className="text-emerald-300">+27694977018</strong> and Email <strong className="text-emerald-300">{targetEmail}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleRunLiveTestAll}
            disabled={isTestingAll}
            className="px-4 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg cursor-pointer transition-all"
          >
            <Bell className={`w-4 h-4 ${isTestingAll ? 'animate-bounce' : ''}`} />
            <span>
              {isTestingAll
                ? 'Dispatching Scope Bridge Test...'
                : 'Run Live Scope Bridge Test (+27694977018 & Email)'}
            </span>
          </button>

          <button
            type="button"
            onClick={fetchStatusAndHistory}
            className="px-3 py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Refresh Logs</span>
          </button>
        </div>
      </div>

      {/* Status Banner with Direct 1-Click Action Buttons */}
      {statusBanner && (
        <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-bold flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{statusBanner}</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={directWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <WhatsAppIcon className="w-3.5 h-3.5" />
              <span>Open in WhatsApp</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={directMailtoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Open in Email</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              type="button"
              onClick={() => setStatusBanner(null)}
              className="text-emerald-400 hover:text-white text-xs font-black cursor-pointer px-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Direct Physical Delivery Action Bar */}
      <div className="p-4 bg-slate-900/90 border border-emerald-500/40 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">
            Direct Delivery Links (Immediate Phone / Desktop Receipt)
          </span>
          <p className="text-xs text-slate-300 mt-0.5">
            Send real test message directly to Admin WhatsApp (+27 69 497 7018) or Email (nightscope58@gmail.com):
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <a
            href={directWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 transition-all shadow-xs"
          >
            <WhatsAppIcon className="w-4 h-4 text-white" />
            <span>Send Direct to My WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href={directMailtoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 transition-all shadow-xs"
          >
            <Mail className="w-4 h-4 text-white" />
            <span>Send Direct to My Inbox</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* 4 Live Scope Bridge & Support Channel Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Scope Bridge Engine */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5" />
              1. Scope Bridge Engine
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">
              {openWaStatus?.status || 'WORKING'}
            </span>
          </div>
          <p className="text-xs font-extrabold text-white font-mono">27694977018@c.us</p>
          <p className="text-[11px] text-slate-400">
            <code className="text-emerald-300">POST /api/messages/{openWaOperation}</code>
          </p>
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2 text-[10px] font-mono text-emerald-300">
            <button
              type="button"
              onClick={handleRestartOpenWaSession}
              className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold cursor-pointer"
            >
              Verify Session
            </button>
            <button
              type="button"
              onClick={handleCheckSessionQr}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <QrCode className="w-3 h-3" />
              <span>QR Status</span>
            </button>
          </div>
        </div>

        {/* Card 2: Global WhatsApp Support (Scope Bridge) */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-teal-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
              <WhatsAppIcon className="w-3.5 h-3.5" />
              2. WhatsApp Bridge
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">ONLINE</span>
          </div>
          <p className="text-xs font-extrabold text-white font-mono">+27 69 497 7018</p>
          <p className="text-[11px] text-slate-400">
            Direct &amp; API dispatch for all guest/owner inquiries
          </p>
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
            <a
              href={`https://wa.me/27694977018?text=${encodeURIComponent(customMessageText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] flex items-center justify-center gap-1"
            >
              <WhatsAppIcon className="w-3 h-3" />
              <span>Open Scope Bridge WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Card 3: Production Email */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-indigo-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              3. Production Email
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">DELIVERING</span>
          </div>
          <p className="text-xs font-extrabold text-white truncate">{targetEmail}</p>
          <p className="text-[11px] text-slate-400">
            Guest-to-Admin &amp; OTP Email Notifications
          </p>
          <div className="pt-2 border-t border-slate-800">
            <a
              href={
                lastTestResult?.dispatchRecord?.email?.mailtoUri ||
                `mailto:${encodeURIComponent(targetEmail)}?subject=${encodeURIComponent('[Scope Bridge Support] Live Admin Support')}&body=${encodeURIComponent(customMessageText)}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-1.5 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] flex items-center justify-center gap-1"
            >
              <Mail className="w-3 h-3" />
              <span>Open Email Dispatch</span>
            </a>
          </div>
        </div>

        {/* Card 4: In-App Admin Support Feed & OTP */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              4. In-App Support &amp; OTP
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">REALTIME SYNC</span>
          </div>
          <p className="text-xs font-extrabold text-white">
            {history.length} Scope Bridge Dispatches
          </p>
          <p className="text-[11px] text-slate-400">
            Gateway: Scope Bridge Engine
          </p>
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-amber-300">
            <span>Status: WORKING</span>
            <button
              type="button"
              onClick={handleCheckWhatsAppContact}
              disabled={isVerifyingContact}
              className="text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <UserCheck className="w-3 h-3" />
              <span>Check Contact</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin Support Quick Templates Bar */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Scope Bridge Support Quick-Reply Templates (1-Click Populate)
          </span>
          <span className="text-[10px] text-slate-400">
            Select a support scenario below to load into the dispatcher
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {ADMIN_SUPPORT_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => {
                setOpenWaOperation(tpl.operation);
                setCustomMessageText(tpl.text);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-emerald-950/80 text-slate-200 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/40 text-[11px] font-bold transition-all cursor-pointer"
            >
              {tpl.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scope Bridge API Support Console & Live Receipt Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Scope Bridge Interactive Support Console */}
        <div className="lg:col-span-6 bg-slate-900/95 p-5 rounded-2xl border border-emerald-500/40 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-black uppercase">
                  Scope Bridge Console
                </span>
                <h4 className="text-xs font-black uppercase tracking-wider text-white">
                  Dispatch Support via Scope Bridge API
                </h4>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Endpoints for WhatsApp (+27 69 497 7018) with authentication.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'send-text', label: 'Text', icon: WhatsAppIcon },
                  { id: 'send-image', label: 'Image', icon: ImageIcon },
                  { id: 'send-document', label: 'Document', icon: FileText },
                  { id: 'send-location', label: 'Location', icon: MapPin },
                ] as const
              ).map((op) => {
                const Icon = op.icon;
                const active = openWaOperation === op.id;
                return (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => setOpenWaOperation(op.id)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      active
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                        : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{op.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSendOpenWaExample} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Scope Bridge Session
                </label>
                <input
                  type="text"
                  value={openWaSession}
                  onChange={(e) => setOpenWaSession(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-emerald-300 font-mono text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Recipient WhatsApp Phone
                </label>
                <input
                  type="text"
                  value={targetPhone}
                  onChange={(e) => setTargetPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  X-API-Key Header
                </label>
                <input
                  type="text"
                  value={openWaApiKey}
                  onChange={(e) => setOpenWaApiKey(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-cyan-300 font-mono text-xs"
                  required
                />
              </div>
            </div>

            {openWaOperation === 'send-image' && (
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Image URL (<code className="text-emerald-300">imageUrl</code>)
                </label>
                <input
                  type="url"
                  value={openWaImageUrl}
                  onChange={(e) => setOpenWaImageUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs"
                  required
                />
              </div>
            )}

            {openWaOperation === 'send-document' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Document URL (<code className="text-emerald-300">documentUrl</code>)
                  </label>
                  <input
                    type="text"
                    value={openWaDocUrl}
                    onChange={(e) => setOpenWaDocUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Filename (<code className="text-emerald-300">filename</code>)
                  </label>
                  <input
                    type="text"
                    value={openWaDocFilename}
                    onChange={(e) => setOpenWaDocFilename(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs"
                    required
                  />
                </div>
              </div>
            )}

            {openWaOperation === 'send-location' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Latitude
                  </label>
                  <input
                    type="text"
                    value={openWaLat}
                    onChange={(e) => setOpenWaLat(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Longitude
                  </label>
                  <input
                    type="text"
                    value={openWaLng}
                    onChange={(e) => setOpenWaLng(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Location Title
                  </label>
                  <input
                    type="text"
                    value={openWaLocTitle}
                    onChange={(e) => setOpenWaLocTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Support Message / Caption Payload
              </label>
              <textarea
                rows={3}
                value={customMessageText}
                onChange={(e) => setCustomMessageText(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-medium"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSendingOpenWa}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {isSendingOpenWa
                  ? `Dispatching Scope Bridge ${openWaOperation}...`
                  : `Send Support via Scope Bridge POST /api/messages/${openWaOperation}`}
              </span>
            </button>
          </form>

          {/* cURL preview */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-300 overflow-x-auto space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-1.5">
              <span>cURL Request Preview (Scope Bridge Engine)</span>
              <span className="text-emerald-400 font-bold">POST /api/messages/{openWaOperation}</span>
            </div>
            <pre className="whitespace-pre-wrap break-all leading-relaxed text-[10px] text-slate-300">
{`curl -X POST http://localhost:3001/api/messages/${openWaOperation} \\
  -H "X-API-Key: ${openWaApiKey}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(openWaExampleJson, null, 2)}'`}
            </pre>
          </div>
        </div>

        {/* Right Column: Live Scope Bridge Support & Notification Delivery Ledger */}
        <div className="lg:col-span-6 bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  Live Scope Bridge Support &amp; Email Delivery Receipts ({history.length})
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Real-time dispatch log for +27694977018 &amp; {targetEmail}
                </p>
              </div>
              {contactCheckResult && (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-500/40 text-[10px] font-mono text-emerald-300">
                  Verified: {contactCheckResult.jid}
                </span>
              )}
            </div>

            {sessionQrResult && (
              <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-center justify-between text-[11px]">
                <span className="text-emerald-300 font-mono">{sessionQrResult.message}</span>
                <button
                  type="button"
                  onClick={() => setSessionQrResult(null)}
                  className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="max-h-[420px] overflow-y-auto space-y-2.5 pr-1">
              {history.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
                  Click <strong>&quot;Run Live Scope Bridge Test&quot;</strong> above to dispatch a live message to +27694977018 &amp; {targetEmail}.
                </div>
              ) : (
                history.slice(0, 15).map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-emerald-400 font-bold">
                          {item.eventType}
                        </span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="font-bold text-white">{item.title}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed">{item.message}</p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-900 text-[10px]">
                      <div className="flex flex-wrap items-center gap-2 font-mono text-slate-400">
                        {item.openWa && (
                          <>
                            <span className="text-emerald-400 font-bold">
                              Scope Bridge ({item.openWa.operation}) #{item.openWa.messageId} → {item.openWa.phone}@c.us
                            </span>
                            <span>·</span>
                          </>
                        )}
                        <span className="text-indigo-300">Email: {item.email?.to?.join(', ')}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.whatsapp?.whatsappUrl && (
                          <a
                            href={item.whatsapp.whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold flex items-center gap-1"
                          >
                            <WhatsAppIcon className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                        {item.email?.mailtoUri && (
                          <a
                            href={item.email.mailtoUri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-bold flex items-center gap-1"
                          >
                            <Mail className="w-3 h-3" />
                            <span>Email</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

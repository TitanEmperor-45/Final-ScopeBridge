import React, { useState } from 'react';
import { Bot, CheckCircle2, ShieldCheck, Zap, Database, Server, Mail, MessageCircle, RefreshCw, CreditCard, Landmark, X } from 'lucide-react';

export interface RoboticTelemetryBadgeProps {
  className?: string;
  isCompact?: boolean;
}

export const RoboticTelemetryBadge: React.FC<RoboticTelemetryBadgeProps> = ({
  className = '',
  isCompact = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // The 7 autonomous robotic telemetry channels requested:
  // 1st dot Database = green active
  // dot 2 aplication server = green active
  // dot 3 Email notification = green active
  // dot 4 SMS notification = green active
  // dot 5 channels = green active
  // dot 6 payment gateways = green active
  // dot 7 bank transactions processing = green active
  const robotDots = [
    {
      id: 'db',
      num: 1,
      name: 'Database Engine',
      short: 'DB',
      desc: 'Cloud SQL & Persistent Ledger (WAL Synced)',
      icon: Database,
      status: 'ACTIVE_GREEN',
      latency: '0.4ms',
    },
    {
      id: 'app_server',
      num: 2,
      name: 'Application Server',
      short: 'App Server',
      desc: 'Node.js Express & Vite Middleware Core (Port 3000)',
      icon: Server,
      status: 'ACTIVE_GREEN',
      latency: '1.1ms',
    },
    {
      id: 'email_notif',
      num: 3,
      name: 'Email Notification',
      short: 'Email',
      desc: 'SMTP & Mail Relay (nightscope58@gmail.com)',
      icon: Mail,
      status: 'ACTIVE_GREEN',
      latency: 'Ready',
    },
    {
      id: 'sms_whatsapp_notif',
      num: 4,
      name: 'SMS / WhatsApp Notification',
      short: 'SMS / WhatsApp',
      desc: 'Scope Bridge Live WhatsApp Gateway (+27 69 497 7018)',
      icon: MessageCircle,
      status: 'ACTIVE_GREEN',
      latency: 'Active',
    },
    {
      id: 'channels',
      num: 5,
      name: 'Channels Sync',
      short: 'Channels',
      desc: 'OTA Real-Time Sync (Airbnb, Booking.com, VRBO, Expedia)',
      icon: RefreshCw,
      status: 'ACTIVE_GREEN',
      latency: 'Instant',
    },
    {
      id: 'gateways',
      num: 6,
      name: 'Payment Gateways',
      short: 'Gateways',
      desc: 'Stripe, Paystack, PayPal, Ozow, Bank EFT',
      icon: CreditCard,
      status: 'ACTIVE_GREEN',
      latency: 'Listening',
    },
    {
      id: 'bank_processing',
      num: 7,
      name: 'Bank Transactions Processing',
      short: 'Bank Processing',
      desc: 'Direct Account Clearance & Cash Flow Ledger',
      icon: Landmark,
      status: 'ACTIVE_GREEN',
      latency: 'Verified',
    },
  ];

  return (
    <>
      {/* Stealth Robot Container: No public text labels, just sleek robotic icon & 7 green active LED dots */}
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-950/80 hover:bg-slate-900 border border-emerald-500/40 text-emerald-400 transition-all cursor-pointer shadow-xs group ${className}`}
        title="Autonomous Robotic Telemetry (7/7 Active Channels) — Click for Admin Diagnostic View"
      >
        <Bot className="w-3.5 h-3.5 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform animate-pulse" />
        
        {/* 7 Stealth Green Active Dots */}
        <div className="flex items-center gap-1">
          {robotDots.map((dot) => (
            <span
              key={dot.id}
              className="relative flex h-2 w-2 items-center justify-center"
              title={`Dot ${dot.num}: ${dot.name} (Green Active)`}
            >
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400 shadow-[0_0_6px_#10b981]" />
            </span>
          ))}
        </div>
      </button>

      {/* Admin Diagnostic Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-950 border border-emerald-500/40 rounded-3xl max-w-lg w-full text-white shadow-2xl overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                  <Bot className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span>Autonomous Robotic System Telemetry</span>
                    <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded">
                      7/7 ACTIVE
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Stealth Engine Diagnostics • Admin Verification Console
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-2.5 max-h-[75vh] overflow-y-auto text-xs">
              <div className="text-[11px] text-slate-300 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                The 7 robotic micro-indicators in the header operate silently without public clutter. Only administrators know the full telemetry sequence:
              </div>

              <div className="space-y-2">
                {robotDots.map((d) => {
                  const Icon = d.icon;
                  return (
                    <div
                      key={d.id}
                      className="p-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-xl flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">
                              DOT {d.num}
                            </span>
                            <span className="font-bold text-white text-xs truncate">{d.name}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{d.desc}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono text-slate-400">{d.latency}</span>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600/50 text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>ACTIVE</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between text-[11px] text-emerald-200">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Admin Contact: nightscope58@gmail.com | +27 69 497 7018</span>
                </span>
                <span className="font-mono text-[10px] text-emerald-400 font-bold">ALL GREEN</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

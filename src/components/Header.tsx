import React, { useState } from 'react';
import { AppRole, UserAccount, GlobalCurrency, AdminAuditAlert } from '../types';
import pandaLogo from '../assets/images/panda_family_cubs_1789920270586.jpg';
import { StaySyncLogo } from './common/StaySyncLogo';
import { WhatsAppIcon } from './common/WhatsAppIcon';
import { getAppEnvironmentInfo } from '../utils/environment';
import { IS_DEV } from '../lib/env';
import {
  Building2,
  User,
  ShieldCheck,
  Heart,
  Bell,
  Sparkles,
  MapPin,
  Globe,
  Baby,
  Car,
  LogIn,
  KeyRound,
  CheckCircle2,
  Monitor,
  Mail,
  Phone,
  MessageSquare,
  X,
  Send,
  Calendar,
  Link2,
  Film,
  Scale,
} from 'lucide-react';
import { MarketingVideoDemoModal } from './common/MarketingVideoDemoModal';
import { GlobalComplianceModal } from './common/GlobalComplianceModal';

interface HeaderProps {
  currentRole: AppRole;
  currentUser: UserAccount;
  onSelectRole: (role: AppRole) => void;
  selectedCurrency: GlobalCurrency;
  onSelectCurrency: (curr: GlobalCurrency) => void;
  onOpenLoginModal: () => void;
  onOpenAuthPage?: () => void;
  isAuthPageActive?: boolean;
  savedCount?: number;
  wishlistCount?: number;
  onOpenWishlist: () => void;
  alertCount?: number;
  alerts?: AdminAuditAlert[];
  onOpenAlerts?: () => void;
  onSendNotificationToAdmin?: (subject: string, message: string, senderEmail: string, senderPhone: string) => void;
  onOpenAiChat?: () => void;
  onOpenChat?: () => void;
  onOpenTripTools?: () => void;
  onOpenGroundingAdvisor?: () => void;
  onOpenCalendarPlanner?: () => void;
  onOpenGuestBookingLink?: () => void;
  onLogout?: () => void;
  isSuperAdminSession?: boolean;
  isSuperAdminTesting?: boolean;
  onReturnToSuperAdmin?: () => void;
  offlinePropertiesCount?: number;
  offlineBookingsCount?: number;
  onSyncOfflineCache?: () => void;
  onUpdateUser?: (user: UserAccount) => Promise<void> | void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  currentUser,
  onSelectRole,
  selectedCurrency,
  onSelectCurrency,
  onOpenLoginModal,
  onOpenAuthPage,
  isAuthPageActive = false,
  savedCount,
  wishlistCount,
  onOpenWishlist,
  alertCount,
  alerts = [],
  onOpenAlerts,
  onSendNotificationToAdmin,
  onOpenAiChat,
  onOpenChat,
  onOpenTripTools,
  onOpenGroundingAdvisor,
  onOpenCalendarPlanner,
  onOpenGuestBookingLink,
  onLogout,
  isSuperAdminTesting = false,
  onReturnToSuperAdmin,
  offlinePropertiesCount,
  offlineBookingsCount,
  onSyncOfflineCache,
  onUpdateUser,
}) => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [currentPwInput, setCurrentPwInput] = useState('');
  const [newPwInput, setNewPwInput] = useState('');
  const [confirmPwInput, setConfirmPwInput] = useState('');
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingPw, setIsUpdatingPw] = useState(false);
  const effectiveSavedCount = wishlistCount !== undefined ? wishlistCount : savedCount || 0;
  const effectiveAlertCount = alertCount !== undefined ? alertCount : alerts.filter((a) => !a.resolved).length || 0;
  const handleChat = onOpenChat || onOpenAiChat;
  const isSuperAdmin =
    currentRole === 'super_admin' ||
    currentRole === 'admin' ||
    currentUser.role === 'super_admin' ||
    currentUser.role === 'admin' ||
    isSuperAdminTesting;

  const [isNotificationHubOpen, setIsNotificationHubOpen] = useState(false);
  const [isPromoVideoOpen, setIsPromoVideoOpen] = useState(false);
  const [isComplianceModalOpen, setIsComplianceModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('Booking & Payment Inquiry');
  const [emailBody, setEmailBody] = useState('');
  const [emailSentToast, setEmailSentToast] = useState<string | null>(null);

  const roleOptions: { id: AppRole; label: string; icon: React.FC<{ className?: string }>; color: string }[] = [
    { id: 'guest', label: 'Guest Stay', icon: User, color: 'text-blue-600' },
    { id: 'owner', label: 'Owner Portal', icon: Building2, color: 'text-emerald-600' },
    { id: 'super_admin', label: 'Super Admin & DB Hub', icon: ShieldCheck, color: 'text-purple-600' },
    { id: 'nanny', label: 'Nanny Portal', icon: Baby, color: 'text-pink-600' },
    { id: 'driver', label: 'Shuttle Driver', icon: Car, color: 'text-amber-600' },
    { id: 'kiosk', label: 'Lobby Kiosk', icon: Monitor, color: 'text-teal-600' },
  ];

  const currencyList: { code: GlobalCurrency; symbol: string; label: string }[] = [
    { code: 'ZAR', symbol: 'R', label: 'ZAR (South Africa)' },
    { code: 'USD', symbol: '$', label: 'USD (United States)' },
    { code: 'EUR', symbol: '€', label: 'EUR (Europe / Paris)' },
    { code: 'GBP', symbol: '£', label: 'GBP (United Kingdom)' },
    { code: 'AED', symbol: 'AED', label: 'AED (Dubai / UAE)' },
  ];

  const baseAuthClick = onOpenAuthPage || onOpenLoginModal;
  const handleAuthClick = () => {
    if (currentUser.id !== 'guest-1' && Boolean(currentUser.email)) {
      setIsProfileModalOpen(true);
      setPwMsg(null);
    } else if (baseAuthClick) {
      baseAuthClick();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Global & Multi-Currency Top Bar */}
      <div className="bg-slate-900 text-white text-xs py-1.5 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-600 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider flex items-center gap-1">
              <Globe className="w-3 h-3" /> Global Stays
            </span>
            {IS_DEV && (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider flex items-center gap-1">
                🧪 Test Sandbox (Isolated)
              </span>
            )}
            <span className="text-slate-300 hidden lg:inline">
              Johannesburg • Cape Town • London • Dubai • New York • Paris • Bali
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <a
              href="https://wa.me/27694977018?text=Hi%20Scope%20Bridge%20Support%2C%20I%20need%20assistance"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 font-bold hidden sm:inline-flex items-center gap-1.5 transition-colors"
              title="Scope Bridge Support WhatsApp (+27 69 497 7018)"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>Scope Bridge Support: +27 69 497 7018</span>
            </a>
            
            {/* Currency Selector */}
            <div className="flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
              <span className="text-slate-400 text-[10px] uppercase">Currency:</span>
              <select
                id="header-currency-select"
                value={selectedCurrency}
                onChange={(e) => onSelectCurrency(e.target.value as GlobalCurrency)}
                className="bg-transparent text-white font-bold text-xs focus:outline-hidden cursor-pointer"
              >
                {currencyList.map((c) => (
                  <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Login Page Trigger */}
            <button
              id="header-user-account-btn"
              onClick={handleAuthClick}
              className="flex items-center gap-1.5 bg-emerald-700/80 hover:bg-emerald-700 text-white font-semibold px-2.5 py-0.5 rounded-lg border border-emerald-600 transition-colors cursor-pointer"
              title="Log In / Register"
            >
              <KeyRound className="w-3 h-3" />
              {currentUser.id !== 'guest-1' && Boolean(currentUser.email) ? (
                <>
                  <span className="hidden md:inline">Account:</span>
                  <span className="font-bold">{(currentUser.fullName || currentUser.name).split(' ')[0]}</span>
                </>
              ) : (
                <span className="font-bold">Sign In / Register</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between py-3 gap-3">
            {/* Brand & Global Hub Info */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-xl overflow-hidden shadow-xs border border-amber-500/40 shrink-0 bg-slate-950 flex items-center justify-center p-0.5">
                  <StaySyncLogo size={36} />
                </div>
                <div className="min-w-0">
                  <h1 className="font-extrabold text-slate-900 text-base sm:text-lg leading-tight tracking-tight flex items-center gap-1.5">
                    <span>StaySync</span>
                    <span className="text-emerald-700 font-bold text-xs bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      ScopeBridg™
                    </span>
                  </h1>
                  <p className="text-[11px] sm:text-xs font-medium text-slate-500 flex items-center gap-1 leading-tight mt-0.5">
                    <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="truncate">Worldwide Luxury, Vacation &amp; Executive Portfolios</span>
                  </p>
                </div>
              </div>

              {/* Mobile Active Role & Log In Badge (visible on small screens) */}
              <div className="flex lg:hidden items-center gap-1.5 shrink-0">
                {!isAuthPageActive && currentUser.id !== 'guest-1' && Boolean(currentUser.email) && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="capitalize">
                      {currentRole === 'guest' && 'Guest'}
                      {currentRole === 'nanny' && 'Nanny'}
                      {currentRole === 'driver' && 'Driver'}
                      {currentRole === 'owner' && 'Owner'}
                      {(currentRole === 'admin' || currentRole === 'super_admin') && 'Admin'}
                      {currentRole === 'kiosk' && 'Kiosk'}
                    </span>
                  </div>
                )}
                {isAuthPageActive ? (
                  currentUser.id !== 'guest-1' && Boolean(currentUser.email) ? (
                    <button
                      type="button"
                      onClick={() => onSelectRole(currentRole)}
                      className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold shrink-0"
                    >
                      Back
                    </button>
                  ) : null
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (onLogout) onLogout();
                      else {
                        onSelectRole('guest');
                        if (onOpenAuthPage) onOpenAuthPage();
                      }
                    }}
                    className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold shrink-0"
                  >
                    Log Off
                  </button>
                )}
              </div>
            </div>

            {/* Actions & Utilities Bar (Properly Wrapped with Clean Spacing) */}
            <div className="flex flex-wrap items-center gap-2 pt-1 lg:pt-0">
              {/* Desktop Active Role & Account Indicator */}
              <div className="hidden lg:flex items-center gap-2">
                {!isAuthPageActive && currentUser.id !== 'guest-1' && Boolean(currentUser.email) && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-slate-800 capitalize">
                      {currentRole === 'guest' && 'Guest Profile'}
                      {currentRole === 'nanny' && 'Nanny Logged In'}
                      {currentRole === 'driver' && 'Shuttle Driver'}
                      {currentRole === 'owner' && 'Owner Portal'}
                      {(currentRole === 'admin' || currentRole === 'super_admin') && 'Administrator'}
                      {currentRole === 'kiosk' && 'Lobby Kiosk Mode'}
                    </span>
                  </div>
                )}

                {isAuthPageActive ? (
                  currentUser.id !== 'guest-1' && Boolean(currentUser.email) ? (
                    <button
                      type="button"
                      onClick={() => onSelectRole(currentRole)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 rounded-xl text-xs font-extrabold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
                      title="Return to active portal"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      <span>Back to Portal</span>
                    </button>
                  ) : null
                ) : (
                  <div className="flex items-center gap-1.5">
                    {isSuperAdmin && (
                      <button
                        type="button"
                        onClick={onOpenLoginModal}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                        title="Super Admin &amp; Portal Test Accounts"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Portal Accounts</span>
                      </button>
                    )}
                    {isSuperAdminTesting && currentRole !== 'super_admin' && onReturnToSuperAdmin && (
                      <button
                        type="button"
                        onClick={onReturnToSuperAdmin}
                        className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-extrabold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
                        title="Return to Super Admin Account"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-200" />
                        <span>Back to Super Admin</span>
                      </button>
                    )}
                    <button
                      id="header-logout-btn"
                      type="button"
                      onClick={() => {
                        if (onLogout) {
                          onLogout();
                        } else {
                          onSelectRole('guest');
                          if (onOpenAuthPage) onOpenAuthPage();
                        }
                      }}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                      title="Log off current account session"
                    >
                      <LogIn className="w-3.5 h-3.5 rotate-180" />
                      <span>Log Off</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Universal Calendar & Multi-Channel Life Planner Button */}
              {onOpenCalendarPlanner && (
                <button
                  id="header-calendar-planner-btn"
                  type="button"
                  onClick={onOpenCalendarPlanner}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold border border-emerald-600 shadow-xs transition-all cursor-pointer shrink-0"
                  title="Open Daily, Weekly &amp; Monthly Calendar &amp; Multi-Channel Holiday Planner"
                >
                  <Calendar className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Calendar &amp; Planner</span>
                </button>
              )}

              {/* Add Booking Link for Guest with Calendar */}
              {onOpenGuestBookingLink && (
                <button
                  id="header-guest-booking-link-btn"
                  type="button"
                  onClick={onOpenGuestBookingLink}
                  className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 rounded-xl text-xs font-extrabold border border-indigo-200 transition-colors cursor-pointer shadow-xs shrink-0"
                  title="Guest Booking Link with Interactive Calendar"
                >
                  <Link2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Guest Booking Link</span>
                </button>
              )}

              {/* Notifications Hub */}
              <button
                id="header-notifications-btn"
                type="button"
                onClick={() => setIsNotificationHubOpen(true)}
                className="relative flex items-center gap-1 px-2.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold border border-amber-200 transition-colors cursor-pointer shrink-0"
                title="Email, OTP, In-App Chat &amp; WhatsApp Notifications Hub"
              >
                <Bell className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Alerts</span>
                {effectiveAlertCount > 0 && (
                  <span className="bg-amber-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
                    {effectiveAlertCount}
                  </span>
                )}
              </button>

              {/* Google Search & Maps Grounding Advisor */}
              {onOpenGroundingAdvisor && (
                <button
                  type="button"
                  onClick={onOpenGroundingAdvisor}
                  className="flex items-center gap-1 px-2.5 py-2 bg-purple-50 text-purple-800 hover:bg-purple-100 rounded-xl text-xs font-bold border border-purple-200 transition-colors cursor-pointer shrink-0"
                  title="Google Search &amp; Maps Grounding Advisor"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span className="hidden sm:inline">Grounding</span>
                </button>
              )}

              {/* Promo Video & Walkthrough Demo */}
              <button
                type="button"
                onClick={() => setIsPromoVideoOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-800 hover:bg-indigo-100 rounded-xl text-xs font-bold border border-indigo-200 transition-colors cursor-pointer shrink-0"
                title="Marketing & App Walkthrough Video Demo"
              >
                <Film className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                <span>🎬 Promo Video</span>
              </button>

              {/* Global Legal & Regulatory Compliance */}
              <button
                type="button"
                onClick={() => setIsComplianceModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-800 hover:bg-slate-200 rounded-xl text-xs font-bold border border-slate-300 transition-colors cursor-pointer shrink-0"
                title="Global Legal & Regulatory Compliance (SA, US, EU Laws & Bylaws)"
              >
                <Scale className="w-3.5 h-3.5 text-slate-700" />
                <span>⚖️ Legal & Laws</span>
              </button>

              {/* 24/7 AI Host / WhatsApp Concierge */}
              <button
                id="header-ai-chat-btn"
                type="button"
                onClick={handleChat}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-bold border border-emerald-200 transition-colors cursor-pointer shrink-0"
                title="24/7 Virtual Host &amp; Gemini Assistant"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span>24/7 Concierge</span>
              </button>

              {/* Wishlist */}
              {!isAuthPageActive && (
                <button
                  id="header-wishlist-btn"
                  type="button"
                  onClick={onOpenWishlist}
                  className="relative p-2 text-slate-600 hover:text-rose-600 hover:bg-slate-50 rounded-xl transition-colors border border-slate-200 cursor-pointer shrink-0"
                  title="Saved Wishlist"
                >
                  <Heart
                    className={`w-4 h-4 ${effectiveSavedCount > 0 ? 'text-rose-600 fill-rose-600' : ''}`}
                  />
                  {effectiveSavedCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                      {effectiveSavedCount}
                    </span>
                  )}
                </button>
              )}

              {/* Profile Avatar */}
              {!isAuthPageActive && (
                <button
                  id="header-auth-badge-btn"
                  type="button"
                  onClick={handleAuthClick}
                  className="flex items-center gap-2 p-1 pl-2 pr-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer shrink-0"
                  title={`Logged in as ${currentUser.fullName || currentUser.name} (${currentUser.title})`}
                >
                  <img
                    src={currentUser.avatar ? currentUser.avatar : pandaLogo}
                    alt={currentUser.fullName || currentUser.name}
                    className="w-7 h-7 rounded-lg object-cover border border-slate-300"
                  />
                  <div className="hidden sm:block text-left">
                    <div className="text-[11px] font-bold text-slate-900 leading-tight truncate max-w-24">
                      {(currentUser.fullName || currentUser.name).split(' ')[0]}
                    </div>
                    <div className="text-[9px] text-emerald-700 font-semibold uppercase tracking-wider">
                      {currentUser.role}
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Left-Aligned Sub-Header Badge Below the Line */}
      {(() => {
        const envInfo = getAppEnvironmentInfo();
        return (
          <div className="bg-slate-50/95 border-b border-slate-200/70">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-black px-3 py-1 rounded-full border shadow-2xs ${envInfo.badgeStyleClass}`}>
                  <Globe className={`w-3.5 h-3.5 flex-shrink-0 ${envInfo.globeIconColorClass}`} />
                  <span>{envInfo.badgeLabel}</span>
                </span>
                <a
                  href="https://wa.me/27694977018?text=Hello%20Scope%20Bridge%20Support%2C%20I%20am%20connecting%20for%20assistance."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold px-3 py-1 rounded-full border border-emerald-600 shadow-2xs transition-colors cursor-pointer"
                  title="Scope Bridge Support (+27 69 497 7018) — WhatsApp Support"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-200 flex-shrink-0" />
                  <span>Scope Bridge Support (+27 69 497 7018)</span>
                </a>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Super Admin Interactive Portal & Environment Strip (Strictly Inside Super Admin Account / Session) */}
      {isSuperAdmin && (
        <div className="bg-slate-900 text-white border-t border-slate-800 px-4 py-1.5">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-300 bg-purple-950/90 border border-purple-700/60 px-2 py-0.5 rounded-md mr-1 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-purple-400" />
                Super Admin Portals:
              </span>
              {roleOptions.map((opt) => {
                const Icon = opt.icon;
                const isActive =
                  !isAuthPageActive &&
                  (currentRole === opt.id ||
                    (opt.id === 'super_admin' && (currentRole === 'admin' || currentRole === 'super_admin')));
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onSelectRole(opt.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Email, OTP, In-App Chat & WhatsApp Notification Hub Modal */}
      {isNotificationHubOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[88vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold">Global Notifications & Admin Dispatch Center</h3>
                  <p className="text-xs text-slate-400">
                    Real-time E-mail, Payment OTP, In-App Chat & WhatsApp (+27 69 497 7018)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNotificationHubOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 flex-1 bg-slate-50 text-xs">
              {/* Admin Contact Card */}
              <div className="bg-emerald-900 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-300 block">
                    Verified Super Admin Contact Details
                  </span>
                  <div className="text-sm font-black mt-0.5">
                    Cell & WhatsApp: +27 69 497 7018 • Email: nightscope58@gmail.com
                  </div>
                  <p className="text-[11px] text-emerald-100 mt-0.5">
                    All Guest bookings, Payment Gateway OTPs, and Chat inquiries are routed here automatically.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="https://wa.me/27694977018?text=Hi%20Scope%20Bridge%20Support%2C%20I%20am%20reaching%20out%20from%20the%20app."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5" />
                    <span>WhatsApp Admin</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNotificationHubOpen(false);
                      if (handleChat) handleChat();
                    }}
                    className="px-3 py-2 bg-white/15 hover:bg-white/25 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>In-App Chat</span>
                  </button>
                </div>
              </div>

              {/* Send Direct E-mail & Notification from Guest/Owner to Admin */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!emailBody.trim()) return;
                  try {
                    await fetch('/api/notifications/dispatch', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        type: 'GUEST_TO_ADMIN_EMAIL',
                        subject: emailSubject,
                        message: emailBody,
                        senderName: currentUser.fullName || currentUser.name,
                        senderEmail: currentUser.email || 'guest@scopebridg.co.za',
                        senderPhone: currentUser.phone || '+27 82 000 0000',
                        adminPhone: '+27 69 497 7018',
                        adminEmail: 'nightscope58@gmail.com',
                      }),
                    });
                  } catch {
                    // Fallback handled locally
                  }
                  if (onSendNotificationToAdmin) {
                    onSendNotificationToAdmin(
                      emailSubject,
                      emailBody,
                      currentUser.email || 'guest@scopebridg.co.za',
                      currentUser.phone || '+27 82 000 0000'
                    );
                  }
                  setEmailSentToast(
                    `E-mail, In-App Alert & WhatsApp notification dispatched to Admin (+27 69 497 7018 & nightscope58@gmail.com)!`
                  );
                  setEmailBody('');
                  setTimeout(() => setEmailSentToast(null), 4500);
                }}
                className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-emerald-600" />
                    <span>Send Instant E-Mail & WhatsApp Alert to Admin</span>
                  </h4>
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    SMTP + WhatsApp Bridge Active
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Subject</label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Recipient Admin</label>
                    <input
                      type="text"
                      readOnly
                      value="nightscope58@gmail.com | +27 69 497 7018"
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Message to Admin</label>
                  <textarea
                    rows={2}
                    required
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Write your message, booking question, or payment approval note to Admin..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>

                {emailSentToast && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{emailSentToast}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400">
                    From: {currentUser.fullName || currentUser.name} ({currentUser.email || 'guest@scopebridg.co.za'})
                  </span>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send E-Mail & Notify Admin</span>
                  </button>
                </div>
              </form>

              {/* Live Notifications Feed */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">
                  Recent E-Mail, Payment OTP & System Notifications ({alerts.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {alerts.length === 0 ? (
                    <div className="p-4 bg-white rounded-xl border border-slate-200 text-slate-400 text-center">
                      No notifications recorded yet.
                    </div>
                  ) : (
                    alerts.slice(0, 15).map((al) => (
                      <div
                        key={al.id}
                        className="p-3 bg-white rounded-xl border border-slate-200 flex items-start justify-between gap-3 shadow-2xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{al.title}</span>
                            <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded font-bold uppercase">
                              {al.category}
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px] leading-relaxed">{al.message}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">{al.timestamp}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOGGED-IN USER PROFILE & RESET PASSWORD MODAL */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.avatar || pandaLogo}
                  alt={currentUser.name}
                  className="w-11 h-11 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm"
                />
                <div>
                  <h3 className="font-extrabold text-white text-base leading-tight">
                    {currentUser.fullName || currentUser.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md font-bold">
                      ID: {currentUser.id}
                    </span>
                    <span className="text-[10px] bg-slate-800 text-amber-300 border border-slate-700 px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wider">
                      {currentUser.role}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-black transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Account Info Details Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  Profile Account Details
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="font-bold text-slate-900">Username:</span> @{currentUser.username}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">User ID:</span>{' '}
                    <span className="font-mono text-purple-700 font-bold">{currentUser.id}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-bold text-slate-900">Email:</span> {currentUser.email}
                  </div>
                  <div className="col-span-2">
                    <span className="font-bold text-slate-900">Phone:</span> {currentUser.phone || 'Not specified'}
                  </div>
                </div>
              </div>

              {/* Password Reset Section */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-purple-600" />
                      Reset / Change Password
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Logged-in users can reset their account password at any time.
                    </p>
                  </div>
                </div>

                {pwMsg && (
                  <div
                    className={`p-3.5 rounded-2xl text-xs font-bold border flex items-center gap-2 ${
                      pwMsg.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-rose-50 text-rose-800 border-rose-300'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{pwMsg.text}</span>
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newPwInput || newPwInput.length < 6) {
                      setPwMsg({ type: 'error', text: 'New password must be at least 6 characters long.' });
                      return;
                    }
                    if (newPwInput !== confirmPwInput) {
                      setPwMsg({ type: 'error', text: 'New password and confirmation password do not match.' });
                      return;
                    }

                    setIsUpdatingPw(true);
                    const updated: UserAccount = {
                      ...currentUser,
                      password: newPwInput,
                    };

                    if (onUpdateUser) {
                      onUpdateUser(updated);
                    }

                    // Dispatch notification
                    fetch('/api/notifications/dispatch', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        eventType: 'USER_PASSWORD_RESET',
                        recipientName: currentUser.fullName || currentUser.name,
                        recipientEmail: currentUser.email,
                        recipientPhone: currentUser.phone,
                        subject: 'Security Alert: Password Changed Successfully',
                        message: `Your ScopeBridg account (@${currentUser.username}) password has been changed while logged in. If you did not authorize this, contact support immediately (+27 69 497 7018).`,
                        channels: ['email', 'sms', 'whatsapp'],
                      }),
                    }).catch(() => {});

                    setTimeout(() => {
                      setIsUpdatingPw(false);
                      setPwMsg({
                        type: 'success',
                        text: 'Your password has been successfully reset & saved! Confirmation sent to your email.',
                      });
                      setCurrentPwInput('');
                      setNewPwInput('');
                      setConfirmPwInput('');
                    }, 400);
                  }}
                  className="space-y-3"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">New Password *</label>
                    <input
                      type="password"
                      value={newPwInput}
                      onChange={(e) => setNewPwInput(e.target.value)}
                      placeholder="Enter new strong password (min 6 chars)"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password *</label>
                    <input
                      type="password"
                      value={confirmPwInput}
                      onChange={(e) => setConfirmPwInput(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                      required
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (onLogout) {
                          setIsProfileModalOpen(false);
                          onLogout();
                        }
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold rounded-xl cursor-pointer"
                    >
                      Log Out
                    </button>

                    <button
                      type="submit"
                      disabled={isUpdatingPw}
                      className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-extrabold rounded-xl shadow-sm cursor-pointer transition-all flex items-center gap-2"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{isUpdatingPw ? 'Updating Password...' : 'Save & Reset Password'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Marketing Video & Walkthrough Demo Modal */}
      <MarketingVideoDemoModal
        isOpen={isPromoVideoOpen}
        onClose={() => setIsPromoVideoOpen(false)}
      />
      {/* Global Legal & Regulatory Compliance Modal */}
      <GlobalComplianceModal
        isOpen={isComplianceModalOpen}
        onClose={() => setIsComplianceModalOpen(false)}
      />
    </header>
  );
};

import React, { useState } from 'react';
import {
  NannyProfile,
  NannyBooking,
  NannyActivityLog,
  Property,
  AiChildcareActivityPlan,
  Booking,
  CalendarPlanEvent,
  ChannelConfig,
  UserAccount,
} from '../../types';
import { BookNannyModal } from './BookNannyModal';
import { NannySmartMatcherPanel } from './NannySmartMatcherPanel';
import { rankAndMatchNannies } from '../../utils/nannyMatchingAlgorithm';
import { openOpenWaSupportModal } from '../../lib/openwaBridge';
import { UniversalCalendarPlanner } from '../common/UniversalCalendarPlanner';
import {
  Baby,
  ShieldCheck,
  Award,
  Heart,
  Calendar,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  Plus,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Send,
  Camera,
  Activity,
  UserCheck,
  RefreshCw,
  Info,
  ShieldAlert,
  HelpCircle,
  ChevronRight,
  Coffee,
  Moon,
  BookOpen,
  Smile,
} from 'lucide-react';

interface NannyPortalProps {
  nannies: NannyProfile[];
  bookings: NannyBooking[];
  properties: Property[];
  onAddBooking: (booking: NannyBooking) => void;
  onUpdateBookingStatus: (bookingId: string, status: NannyBooking['status']) => void;
  onAddActivityLog: (bookingId: string, log: Omit<NannyActivityLog, 'id'>) => void;
  stayBookings?: Booking[];
  calendarEvents?: CalendarPlanEvent[];
  channels?: ChannelConfig[];
  registeredUsers?: UserAccount[];
  currentUser?: UserAccount;
  onBookProperty?: (bookingData: Omit<Booking, 'id' | 'createdAt'>) => void;
  onUpdateStayBookings?: React.Dispatch<React.SetStateAction<Booking[]>>;
  onUpdateCalendarEvents?: React.Dispatch<React.SetStateAction<CalendarPlanEvent[]>>;
  onUpdateProperties?: React.Dispatch<React.SetStateAction<Property[]>>;
}

export const NannyPortal: React.FC<NannyPortalProps> = ({
  nannies,
  bookings,
  properties,
  onAddBooking,
  onUpdateBookingStatus,
  onAddActivityLog,
  stayBookings = [],
  calendarEvents = [],
  channels = [],
  registeredUsers = [],
  currentUser,
  onBookProperty = () => {},
  onUpdateStayBookings = () => {},
  onUpdateCalendarEvents = () => {},
  onUpdateProperties = () => {},
}) => {
  const [activeTab, setActiveTab] = useState<'directory' | 'shifts' | 'calendar_planner' | 'live_tracker' | 'safety' | 'ai_assistant'>('directory');
  const [selectedNannyForBooking, setSelectedNannyForBooking] = useState<NannyProfile | null>(null);
  
  // Filter state for directory
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');

  // Smart Matching Algorithm State (Booking Duration & Language Preferences)
  const [requestedDurationHours, setRequestedDurationHours] = useState<number>(4);
  const [preferredLanguages, setPreferredLanguages] = useState<string[]>(['English', 'isiZulu']);
  const [onlyAvailableNow, setOnlyAvailableNow] = useState<boolean>(false);
  const [requestedDate, setRequestedDate] = useState<string>('2026-09-28');
  const [requestedStartTime, setRequestedStartTime] = useState<string>('14:00');
  const [selectedMatchScore, setSelectedMatchScore] = useState<number | undefined>(undefined);

  const availableLanguages = Array.from(
    new Set(['English', 'isiZulu', 'Afrikaans', 'Sesotho', 'isiXhosa', 'Siswati', 'French', ...nannies.flatMap((n) => n.languages)])
  );

  const handleTogglePreferredLanguage = (lang: string) => {
    setPreferredLanguages((prev) => {
      if (prev.includes(lang)) {
        return prev.length > 1 ? prev.filter((l) => l !== lang) : prev;
      }
      return [...prev, lang];
    });
  };

  const rankedMatches = rankAndMatchNannies(
    nannies,
    {
      requestedDurationHours,
      preferredLanguages: selectedLanguage !== 'all' && !preferredLanguages.includes(selectedLanguage)
        ? [...preferredLanguages, selectedLanguage]
        : preferredLanguages,
      onlyAvailableNow,
      requestedDate,
      requestedStartTime,
    },
    bookings
  );

  const matchByNannyId = new Map(rankedMatches.map((m) => [m.nanny.id, m]));

  // Selected booking for live tracker
  const inProgressBooking = bookings.find((b) => b.status === 'in_progress') || bookings[0];
  const [activeTrackingBookingId, setActiveTrackingBookingId] = useState<string>(inProgressBooking?.id || '');

  // New activity log input
  const [newLogCategory, setNewLogCategory] = useState<NannyActivityLog['category']>('meal');
  const [newLogTitle, setNewLogTitle] = useState('');
  const [newLogNote, setNewLogNote] = useState('');

  // AI Planner state
  const [aiChildAge, setAiChildAge] = useState('3 years old');
  const [aiDuration, setAiDuration] = useState(4);
  const [aiNotes, setAiNotes] = useState('Energetic child, afternoon nap at 14:30. Loves safari animals.');
  const [aiSetting, setAiSetting] = useState('Ferndale serviced apartment with lawn & inverter');
  const [aiPlan, setAiPlan] = useState<AiChildcareActivityPlan | null>(null);
  const [isAiPlanning, setIsAiPlanning] = useState(false);

  // Filtered nannies sorted by qualification match score
  const filteredNannies = rankedMatches
    .map((m) => m.nanny)
    .filter((nan) => {
      const matchesSearch =
        nan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nan.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nan.specialties.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesSpecialty =
        selectedSpecialty === 'all' || nan.specialties.some((s) => s.toLowerCase().includes(selectedSpecialty.toLowerCase()));

      const matchesLanguage =
        selectedLanguage === 'all' || nan.languages.includes(selectedLanguage);

      return matchesSearch && matchesSpecialty && matchesLanguage;
    });

  const currentTrackedBooking = bookings.find((b) => b.id === activeTrackingBookingId) || inProgressBooking;

  // Handle new log submission
  const handleAddLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTrackedBooking || !newLogTitle.trim()) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    onAddActivityLog(currentTrackedBooking.id, {
      time: timeStr,
      category: newLogCategory,
      title: newLogTitle.trim(),
      note: newLogNote.trim() || 'Activity completed smoothly in accordance with safety protocol.',
      verifiedByParent: false,
    });

    setNewLogTitle('');
    setNewLogNote('');
  };

  // Generate AI Activity Plan via backend
  const handleGenerateAiPlan = async () => {
    setIsAiPlanning(true);
    try {
      const res = await fetch('/api/gemini/nanny-activity-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childAge: aiChildAge,
          durationHours: aiDuration,
          specialNotes: aiNotes,
          weatherOrSetting: aiSetting,
        }),
      });
      const data = await res.json();
      if (data.plan) {
        setAiPlan(data.plan);
      }
    } catch (err) {
      console.error('Failed to generate AI plan:', err);
    } finally {
      setIsAiPlanning(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Nanny Portal Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SAPS Police Cleared & Red Cross Infant First Aid Certified</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Global Executive Childcare & Nanny Portal
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              On-demand, vetted professional childcare tailored for traveling families, corporate stays, and luxury holiday getaways across all global areas and suburbs. Complete with live shift logs and Gemini AI activity scheduling.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setSelectedNannyForBooking(nannies[0])}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold rounded-xl text-xs transition-all shadow-lg hover:shadow-emerald-500/25 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Book a Nanny Now</span>
            </button>
            <button
              onClick={() => setActiveTab('ai_assistant')}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl text-xs backdrop-blur-xs transition-all border border-white/20 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>AI Childcare Planner</span>
            </button>
          </div>
        </div>

        {/* Quick Portal KPI Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Vetted Local Nannies</span>
            <span className="text-lg font-bold font-mono text-white">{nannies.length} Active</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Avg. Parent Rating</span>
            <span className="text-lg font-bold font-mono text-emerald-300">★ 4.96 / 5.0</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Active Childcare Shifts</span>
            <span className="text-lg font-bold font-mono text-white">
              {bookings.filter((b) => b.status === 'in_progress').length} In Progress
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Average Rate</span>
            <span className="text-lg font-bold font-mono text-white">R95 - R135 / hr</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveTab('directory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'directory'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Baby className="w-4 h-4" />
          <span>Vetted Nannies Directory</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-700/50 text-emerald-100">
            {nannies.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('shifts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'shifts'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Bookings & Shifts</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-700/50 text-emerald-100">
            {bookings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('calendar_planner')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'calendar_planner'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4 text-emerald-500" />
          <span>Calendar &amp; Planner (Daily / Weekly / Monthly)</span>
        </button>

        <button
          onClick={() => setActiveTab('live_tracker')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'live_tracker'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>Live Shift Activity Log</span>
          {bookings.some((b) => b.status === 'in_progress') && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ai_assistant')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'ai_assistant'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-300" />
          <span>AI Childcare Planner (Gemini)</span>
        </button>

        <button
          onClick={() => setActiveTab('safety')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'safety'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Child Safety & Emergency Hub</span>
        </button>
      </div>

      {/* TAB: UNIVERSAL CALENDAR & MULTI-CHANNEL PLANNER */}
      {activeTab === 'calendar_planner' && (
        <UniversalCalendarPlanner
          currentRole="nanny"
          currentUser={
            currentUser || {
              id: 'nanny-1',
              name: nannies[0]?.name || 'Certified Lead Super Nanny',
              fullName: nannies[0]?.name || 'Certified Lead Super Nanny',
              username: 'nanny',
              role: 'nanny',
              email: 'nanny@scopebridg.co.za',
              phone: nannies[0]?.phone || '+27 83 491 0021',
              avatar: nannies[0]?.avatar || '',
              title: 'Certified Lead Super Nanny',
              location: 'Rosebank & Sandton',
              registeredHolidayChannels: ['direct', 'airbnb', 'booking_com', 'lekkeslaap'],
            }
          }
          properties={properties}
          bookings={stayBookings}
          nannyBookings={bookings}
          shuttleBookings={[]}
          calendarEvents={calendarEvents}
          channels={channels}
          registeredUsers={registeredUsers}
          selectedCurrency="ZAR"
          onBookProperty={onBookProperty}
          onUpdateBookings={onUpdateStayBookings}
          onUpdateCalendarEvents={onUpdateCalendarEvents}
          onUpdateProperties={onUpdateProperties}
        />
      )}

      {/* TAB 1: VETTED NANNIES DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-6">
          {/* Intelligent Nanny Qualification & Availability Matching Engine */}
          <NannySmartMatcherPanel
            requestedDurationHours={requestedDurationHours}
            onChangeDurationHours={setRequestedDurationHours}
            preferredLanguages={preferredLanguages}
            onTogglePreferredLanguage={handleTogglePreferredLanguage}
            onResetLanguages={() => setPreferredLanguages(['English'])}
            availableLanguages={availableLanguages}
            onlyAvailableNow={onlyAvailableNow}
            onToggleOnlyAvailableNow={setOnlyAvailableNow}
            requestedDate={requestedDate}
            onChangeRequestedDate={setRequestedDate}
            requestedStartTime={requestedStartTime}
            onChangeRequestedStartTime={setRequestedStartTime}
            rankedMatches={rankedMatches}
            onSelectNannyForBooking={(nanny, score) => {
              setSelectedMatchScore(score);
              setSelectedNannyForBooking(nanny);
            }}
          />

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search nanny by name, specialty, infant care..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1 text-slate-500 font-medium">
                <Filter className="w-3.5 h-3.5" />
                <span>Specialty:</span>
              </div>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Specialties</option>
                <option value="infant">Infants (0-12m)</option>
                <option value="toddler">Toddler Sensory Play</option>
                <option value="night">Night Nanny</option>
                <option value="corporate">Corporate Au Pair</option>
                <option value="evening">Evening / Date-Night</option>
              </select>

              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Languages</option>
                <option value="English">English</option>
                <option value="isiZulu">isiZulu</option>
                <option value="Sesotho">Sesotho</option>
                <option value="Afrikaans">Afrikaans</option>
                <option value="isiXhosa">isiXhosa</option>
              </select>
            </div>
          </div>

          {/* Nannies Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredNannies.map((nanny) => (
              <div
                key={nanny.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top row: Avatar, Name, Rating, Status */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        <img
                          src={nanny.avatar ? nanny.avatar : undefined}
                          alt={nanny.name}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 shadow-xs"
                        />
                        <span
                          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                            nanny.currentStatus === 'available'
                              ? 'bg-emerald-500'
                              : nanny.currentStatus === 'on_shift'
                              ? 'bg-amber-500'
                              : 'bg-slate-400'
                          }`}
                          title={`Status: ${nanny.currentStatus}`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">{nanny.name}</h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {nanny.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="text-amber-500 font-bold">★ {nanny.rating}</span>
                          <span>({nanny.reviewCount} parent reviews)</span>
                          <span>•</span>
                          <span>{nanny.experienceYears} yrs experience</span>
                        </p>
                        <p className="text-xs font-semibold text-emerald-800 mt-1">
                          R{nanny.hourlyRateZar} <span className="text-slate-400 font-normal">/ hour</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <span
                        className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          nanny.currentStatus === 'available'
                            ? 'bg-emerald-100 text-emerald-800'
                            : nanny.currentStatus === 'on_shift'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {nanny.currentStatus === 'on_shift' ? 'On Active Shift' : 'Available'}
                      </span>
                      {matchByNannyId.get(nanny.id) && (
                        <div className="text-[11px] font-mono font-bold text-emerald-800">
                          {matchByNannyId.get(nanny.id)?.matchScore}% Qualification Match
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    {nanny.bio}
                  </p>

                  {/* Certifications Badges */}
                  <div className="mt-3.5 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-900 block">Verified Accreditations:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {nanny.certifications.map((cert, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                        >
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>{cert}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Specialties & Languages */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                    <div>
                      <span className="font-bold text-slate-800 block text-[10px] uppercase tracking-wider">Specialties</span>
                      <p className="truncate mt-0.5">{nanny.specialties.join(', ')}</p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block text-[10px] uppercase tracking-wider">Languages</span>
                      <p className="truncate mt-0.5">{nanny.languages.join(', ')}</p>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{nanny.availableNeighborhoods.join(' • ')}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`https://wa.me/${nanny.whatsapp.replace('+', '')}?text=Hi%20${nanny.name},%20I'm%20staying%20at%20FerndaleStay%20and%20interested%20in%20childcare%20support!`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                      title="Direct WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => setSelectedNannyForBooking(nanny)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                    >
                      <Calendar className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Book Childcare</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: BOOKINGS & SHIFTS */}
      {activeTab === 'shifts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Childcare Bookings & Shifts</h2>
              <p className="text-xs text-slate-500">
                Track confirmed babysitting sessions, shift logs, and parent contact information.
              </p>
            </div>
            <button
              onClick={() => setSelectedNannyForBooking(nannies[0])}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule New Booking</span>
            </button>
          </div>

          <div className="space-y-3">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all ${
                  booking.status === 'in_progress'
                    ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500/20'
                    : 'border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={booking.nannyAvatar || nannies[0].avatar}
                      alt={booking.nannyName}
                      className="w-11 h-11 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{booking.nannyName}</h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            booking.status === 'in_progress'
                              ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                              : booking.status === 'confirmed'
                              ? 'bg-blue-100 text-blue-800'
                              : booking.status === 'completed'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {booking.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Stay: <strong className="text-slate-700">{booking.propertyTitle}</strong> ({booking.unitCode})
                      </p>
                    </div>
                  </div>

                  <div className="text-right sm:text-right">
                    <span className="text-xs font-black font-mono text-emerald-800 text-base">
                      R{booking.totalAmountZar.toFixed(2)} ZAR
                    </span>
                    <p className="text-[11px] text-slate-500">
                      {booking.hours} hrs @ R{booking.hourlyRateZar}/hr
                    </p>
                  </div>
                </div>

                {/* Booking Meta Details */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 py-3 text-xs text-slate-600">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Date & Shift Window</span>
                    <span className="font-semibold text-slate-900 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      {booking.date} ({booking.startTime} - {booking.endTime})
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Parent Contact</span>
                    <span className="font-semibold text-slate-900 block mt-0.5">{booking.parentName}</span>
                    <span className="text-[11px] text-slate-500">{booking.parentPhone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Children in Care</span>
                    <span className="font-semibold text-slate-900 block mt-0.5">
                      {booking.childrenCount} child ({booking.childrenAges})
                    </span>
                    {booking.allergies && (
                      <span className="text-[10px] text-amber-700 block">⚠️ {booking.allergies}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Shift Activity Logs</span>
                    <span className="font-semibold text-slate-900 block mt-0.5">
                      {booking.activityLogs.length} updates logged
                    </span>
                    <span className="text-[10px] text-emerald-700">
                      {booking.activityLogs.filter((l) => l.verifiedByParent).length} parent verified
                    </span>
                  </div>
                </div>

                {/* Special Instructions Note */}
                {booking.specialNotes && (
                  <div className="bg-slate-50 p-2.5 rounded-xl text-xs text-slate-600 mb-3 border border-slate-100">
                    <strong className="text-slate-800">Care Instructions: </strong>
                    {booking.specialNotes}
                  </div>
                )}

                {/* Status Switchers & Log Link */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveTrackingBookingId(booking.id);
                        setActiveTab('live_tracker');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      <Activity className="w-3.5 h-3.5 text-emerald-600" />
                      <span>View / Add Live Shift Logs</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => onUpdateBookingStatus(booking.id, 'in_progress')}
                        className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs cursor-pointer"
                      >
                        Start Shift (Check-in)
                      </button>
                    )}
                    {booking.status === 'in_progress' && (
                      <button
                        onClick={() => onUpdateBookingStatus(booking.id, 'completed')}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-xs cursor-pointer"
                      >
                        Complete Shift & Checkout
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: LIVE SHIFT ACTIVITY TRACKER */}
      {activeTab === 'live_tracker' && currentTrackedBooking && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Active Session Header Banner */}
            <div className="bg-emerald-900 text-white p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                    Live Babysitting Shift Feed
                  </span>
                </div>
                <h3 className="text-lg font-bold mt-1 text-white">
                  {currentTrackedBooking.nannyName} caring for {currentTrackedBooking.childrenAges}
                </h3>
                <p className="text-xs text-emerald-200 mt-0.5">
                  Property: {currentTrackedBooking.propertyTitle} ({currentTrackedBooking.unitCode}) • Parent: {currentTrackedBooking.parentName}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`tel:${currentTrackedBooking.nannyPhone}`}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Nanny</span>
                </a>
              </div>
            </div>

            {/* Quick Log Entry Form */}
            <form onSubmit={handleAddLogSubmit} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>Log Shift Event for Parents</span>
              </h4>

              {/* Quick Category Selector */}
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { key: 'meal', label: '🍎 Meal / Snack', icon: Coffee },
                    { key: 'nap', label: '💤 Nap Time', icon: Moon },
                    { key: 'play', label: '🎨 Creative Play', icon: Smile },
                    { key: 'hygiene', label: '🧷 Diaper / Hygiene', icon: FileCheck },
                    { key: 'safety_check', label: '🛡️ Safety Check', icon: ShieldCheck },
                  ] as const
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setNewLogCategory(key);
                      if (!newLogTitle) {
                        setNewLogTitle(
                          key === 'meal'
                            ? 'Nutritious Snack & Water'
                            : key === 'nap'
                            ? 'Down for Nap in Travel Cot'
                            : key === 'play'
                            ? 'Puzzle & Craft Time'
                            : key === 'hygiene'
                            ? 'Fresh Diaper & Clean Hands'
                            : 'Pool Net & Room Latch Verified'
                        );
                      }
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                      newLogCategory === key
                        ? 'bg-emerald-700 text-white font-bold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Event Title</label>
                  <input
                    type="text"
                    value={newLogTitle}
                    onChange={(e) => setNewLogTitle(e.target.value)}
                    placeholder="e.g., Afternoon Nap Started (Liam)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Notes / Temperature / Food Eaten</label>
                  <input
                    type="text"
                    value={newLogNote}
                    onChange={(e) => setNewLogNote(e.target.value)}
                    placeholder="e.g., Ate 1 banana, drank 150ml water, calm mood."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 text-slate-400" />
                  <span>Photo verification automatically shared with parents via WhatsApp</span>
                </span>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish Shift Log</span>
                </button>
              </div>
            </form>

            {/* Timeline Stream of Logs */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Shift Activity Timeline ({currentTrackedBooking.activityLogs.length} updates)
              </h4>

              {currentTrackedBooking.activityLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No activity logs recorded yet for this shift.</p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {currentTrackedBooking.activityLogs.map((log) => (
                    <div key={log.id} className="relative group">
                      {/* Timeline dot */}
                      <span
                        className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
                          log.category === 'meal'
                            ? 'bg-amber-500'
                            : log.category === 'nap'
                            ? 'bg-indigo-500'
                            : log.category === 'play'
                            ? 'bg-teal-500'
                            : 'bg-emerald-500'
                        }`}
                      />

                      <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 hover:border-slate-300 transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{log.title}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 bg-white rounded-md border border-slate-200 text-slate-600 font-semibold">
                              {log.time}
                            </span>
                          </div>
                          {log.verifiedByParent && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Parent Acknowledged</span>
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{log.note}</p>

                        {log.photoUrl && (
                          <div className="mt-2.5">
                            <img
                              src={log.photoUrl}
                              alt={log.title}
                              className="w-48 h-32 object-cover rounded-lg border border-slate-200 shadow-xs"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Shift Details & Emergency Info */}
          <div className="space-y-4 text-xs">
            {/* Shift Selector if multiple bookings exist */}
            {bookings.length > 1 && (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <span className="font-bold text-slate-900 block">Switch Booking Tracker</span>
                <select
                  value={activeTrackingBookingId}
                  onChange={(e) => setActiveTrackingBookingId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                >
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.id} - {b.nannyName} ({b.parentName})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quick Emergency Paediatric Card */}
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-950 space-y-2">
              <div className="flex items-center gap-2 font-bold text-rose-900">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Emergency Childcare Protocol</span>
              </div>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                Sandton Paediatric Emergency ER is 12 mins away. In case of acute medical need:
              </p>
              <div className="space-y-1 font-mono font-bold text-xs pt-1">
                <div className="flex justify-between">
                  <span>Netcare 911:</span>
                  <a href="tel:082911" className="underline text-rose-700">082 911</a>
                </div>
                <div className="flex justify-between">
                  <span>Mediclinic Sandton:</span>
                  <a href="tel:+27117092000" className="underline text-rose-700">+27 11 709 2000</a>
                </div>
                <div className="flex justify-between">
                  <span>Parent WhatsApp:</span>
                  <a href={`https://wa.me/${currentTrackedBooking.parentPhone}`} className="underline text-rose-700">
                    {currentTrackedBooking.parentPhone}
                  </a>
                </div>
              </div>
            </div>

            {/* Property Childproofing Highlights */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2.5">
              <h4 className="font-bold text-slate-900 text-xs">Stay Safety Features</h4>
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>5kVA Solar Inverter (Monitor/Fan remains on)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Pool Safety Net with Lock in place</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Safety socket plugs installed</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>First Aid kit in kitchen upper cupboard</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AI CHILDCARE ASSISTANT & ACTIVITY PLANNER */}
      {activeTab === 'ai_assistant' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 rounded-3xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
            <div className="max-w-xl space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-semibold border border-emerald-400/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Powered by Gemini 3.8 Flash</span>
              </div>
              <h2 className="text-xl font-bold">AI Childcare Schedule & Activity Planner</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Generate an individualized, safe daily schedule for nannies tailored to child age, energy levels, and South African outdoor or indoor amenities in Ferndale.
              </p>
            </div>

            <button
              onClick={handleGenerateAiPlan}
              disabled={isAiPlanning}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold rounded-xl text-xs shadow-lg transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              {isAiPlanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Plan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Activity Schedule</span>
                </>
              )}
            </button>
          </div>

          {/* Configuration Inputs */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Child Age(s)</label>
              <input
                type="text"
                value={aiChildAge}
                onChange={(e) => setAiChildAge(e.target.value)}
                placeholder="e.g., 3 years old"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Session Duration</label>
              <select
                value={aiDuration}
                onChange={(e) => setAiDuration(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              >
                <option value={2}>2 Hours</option>
                <option value={3}>3 Hours</option>
                <option value={4}>4 Hours (Half Day)</option>
                <option value={6}>6 Hours (Corporate Meeting)</option>
                <option value={8}>8 Hours (Full Day)</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Special Preferences / Routines</label>
              <input
                type="text"
                value={aiNotes}
                onChange={(e) => setAiNotes(e.target.value)}
                placeholder="e.g., Loves coloring, afternoon nap at 14:30, peanut allergy."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Generated Plan Output */}
          {aiPlan && (
            <div className="bg-white rounded-2xl border border-emerald-300 p-6 shadow-md space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {aiPlan.theme}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">
                    Customized Schedule for {aiPlan.childAge} ({aiPlan.durationHours} Hours)
                  </h3>
                </div>
                <button
                  onClick={handleGenerateAiPlan}
                  className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Regenerate with Gemini</span>
                </button>
              </div>

              {/* Step by step timetable */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Hour-by-Hour Activity Timetable
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {aiPlan.schedule.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200"
                    >
                      <span className="px-2.5 py-1 bg-emerald-800 text-white rounded-lg font-mono font-bold text-xs shrink-0 self-start">
                        {item.timeSlot}
                      </span>
                      <div className="space-y-1 grow">
                        <div className="flex items-center gap-2">
                          <strong className="text-sm text-slate-900">{item.activityName}</strong>
                          <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-700 font-medium rounded-full uppercase">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                        <p className="text-[11px] text-emerald-800 font-medium flex items-center gap-1 pt-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Safety protocol: {item.safetyTip}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Snacks & Bedtime Tips */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs">
                  <h5 className="font-bold text-amber-950 flex items-center gap-1.5 mb-2">
                    <Coffee className="w-4 h-4 text-amber-600" />
                    <span>Healthy South African Snack Suggestions</span>
                  </h5>
                  <ul className="space-y-1.5 text-amber-900">
                    {aiPlan.healthySnackSuggestions.map((snack, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-600">•</span>
                        <span>{snack}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-xs">
                  <h5 className="font-bold text-indigo-950 flex items-center gap-1.5 mb-2">
                    <Moon className="w-4 h-4 text-indigo-600" />
                    <span>Calming Bedtime & Wind-Down Protocol</span>
                  </h5>
                  <p className="text-indigo-900 leading-relaxed">{aiPlan.calmingBedtimeTip}</p>
                  <p className="text-[10px] text-indigo-700 mt-2">
                    💡 FerndaleStay units feature inverter-backed ambient lighting and dimmable bedside lamps.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: CHILD SAFETY & EMERGENCY HUB */}
      {activeTab === 'safety' && (
        <div className="space-y-6">
          {/* Emergency Fast Dial Grid */}
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Immediate Emergency Services (Johannesburg & Randburg)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              All contacts are verified 24/7 emergency centers servicing Ferndale and Randburg.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: 'Netcare 911 Ambulance',
                  number: '082 911',
                  desc: 'Rapid paramedic & pediatric response in Randburg',
                  tag: 'Medical Emergency',
                  color: 'rose',
                },
                {
                  title: 'Mediclinic Sandton Pediatric ER',
                  number: '+27 11 709 2000',
                  desc: 'Specialized 24h children trauma & inpatient care (12 mins away)',
                  tag: 'Hospital',
                  color: 'blue',
                },
                {
                  title: 'Randburg SAPS Police Station',
                  number: '+27 11 449 9000',
                  desc: 'Corner Bram Fischer & Jan Smuts (5 mins from Oxford St)',
                  tag: 'Police',
                  color: 'emerald',
                },
                {
                  title: 'Red Cross Poison Helpline',
                  number: '+27 21 689 5227',
                  desc: 'National 24/7 pediatric poison & accidental ingestion center',
                  tag: 'Toxicology',
                  color: 'amber',
                },
              ].map((item, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {item.tag}
                    </span>
                    <ShieldAlert className="w-4 h-4 text-slate-400" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                  <p className="text-[11px] text-slate-500">{item.desc}</p>
                  <a
                    href={`tel:${item.number.replace(/\s+/g, '')}`}
                    className="block text-center w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-mono font-bold text-xs transition-colors"
                  >
                    📞 Call {item.number}
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Childproofing Checklist for Properties */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">
                FerndaleStay Property Childproofing & Safety Standard
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every FerndaleStay home undergoes a strict safety inspection before family check-in to ensure parents can rest with complete confidence.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <strong className="text-slate-900 font-bold block">🏊 Swimming Pool Netting</strong>
                <p className="text-slate-600 leading-relaxed">
                  Villa properties feature certified swimming pool safety nets secured with tension ratchets. Nannies are certified in water safety supervision.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <strong className="text-slate-900 font-bold block">⚡ Continuous Power for Nursery</strong>
                <p className="text-slate-600 leading-relaxed">
                  Lithium inverter guarantees baby monitors, sterilizers, bottle warmers, and white noise machines stay powered during city load shedding.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <strong className="text-slate-900 font-bold block">🛏️ Cots & High Chairs on Demand</strong>
                <p className="text-slate-600 leading-relaxed">
                  Disinfected wooden travel cots, fresh linen, silicone dinnerware, and high chairs are placed in the unit before arrival free of charge.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {selectedNannyForBooking && (
        <BookNannyModal
          nanny={selectedNannyForBooking}
          properties={properties}
          initialDurationHours={requestedDurationHours}
          initialPreferredLanguages={preferredLanguages}
          matchScore={selectedMatchScore ?? matchByNannyId.get(selectedNannyForBooking.id)?.matchScore}
          onClose={() => {
            setSelectedNannyForBooking(null);
            setSelectedMatchScore(undefined);
          }}
          onConfirmBooking={(bookingData) => {
            const newBooking: NannyBooking = {
              id: `NB-${Date.now().toString().slice(-4)}`,
              ...bookingData,
              activityLogs: [],
              createdAt: new Date().toISOString(),
            };
            onAddBooking(newBooking);
            setActiveTrackingBookingId(newBooking.id);
            setActiveTab('shifts');
          }}
        />
      )}
    </div>
  );
};

import React from 'react';
import { NannyProfile } from '../../types';
import { NannyMatchResult } from '../../utils/nannyMatchingAlgorithm';
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Globe,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { openOpenWaSupportModal } from '../../lib/openwaBridge';

interface NannySmartMatcherPanelProps {
  requestedDurationHours: number;
  onChangeDurationHours: (hours: number) => void;
  preferredLanguages: string[];
  onTogglePreferredLanguage: (lang: string) => void;
  onResetLanguages: () => void;
  availableLanguages: string[];
  onlyAvailableNow: boolean;
  onToggleOnlyAvailableNow: (val: boolean) => void;
  requestedDate: string;
  onChangeRequestedDate: (date: string) => void;
  requestedStartTime: string;
  onChangeRequestedStartTime: (time: string) => void;
  rankedMatches: NannyMatchResult[];
  onSelectNannyForBooking: (nanny: NannyProfile, matchScore: number) => void;
}

const DURATION_PRESETS = [
  { hours: 2, label: '2 hrs', desc: 'Express / Errand' },
  { hours: 4, label: '4 hrs', desc: 'Half-Day Stay' },
  { hours: 6, label: '6 hrs', desc: 'Corporate Session' },
  { hours: 8, label: '8 hrs', desc: 'Full-Day Executive' },
  { hours: 10, label: '10 hrs', desc: 'Night Nanny' },
  { hours: 12, label: '12 hrs', desc: 'Overnight Care' },
];

export const NannySmartMatcherPanel: React.FC<NannySmartMatcherPanelProps> = ({
  requestedDurationHours,
  onChangeDurationHours,
  preferredLanguages,
  onTogglePreferredLanguage,
  onResetLanguages,
  availableLanguages,
  onlyAvailableNow,
  onToggleOnlyAvailableNow,
  requestedDate,
  onChangeRequestedDate,
  requestedStartTime,
  onChangeRequestedStartTime,
  rankedMatches,
  onSelectNannyForBooking,
}) => {
  const topSuggestions = rankedMatches.slice(0, 3);

  return (
    <div className="bg-white rounded-2xl border border-emerald-200 shadow-xs overflow-hidden">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 px-5 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Intelligent Nanny Qualification &amp; Availability Matcher
            </h2>
            <p className="text-xs text-slate-300">
              Ranks the most qualified available nannies by requested shift duration, multilingual fluency, and real-time schedule availability.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-emerald-200">
          <span>
            Showing top {topSuggestions.length} of {rankedMatches.length} qualified candidates
          </span>
        </div>
      </div>

      {/* Controls Section */}
      <div className="p-5 bg-slate-50/70 border-b border-slate-200 space-y-4 text-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Duration Selector (5 cols) */}
          <div className="lg:col-span-5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                <span>1. Requested Booking Duration:</span>
              </label>
              <span className="font-mono font-bold text-emerald-800">
                {requestedDurationHours} Hours Selected
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-3 gap-1.5">
              {DURATION_PRESETS.map((preset) => {
                const isSelected = requestedDurationHours === preset.hours;
                return (
                  <button
                    key={preset.hours}
                    type="button"
                    onClick={() => onChangeDurationHours(preset.hours)}
                    className={`px-2.5 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400'
                    }`}
                  >
                    <div className="font-bold text-xs">{preset.label}</div>
                    <div
                      className={`text-[10px] truncate ${
                        isSelected ? 'text-emerald-200' : 'text-slate-400'
                      }`}
                    >
                      {preset.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Language Preferences Multi-Select (4 cols) */}
          <div className="lg:col-span-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-700" />
                <span>2. Guest Language Preferences:</span>
              </label>
              {preferredLanguages.length > 1 && (
                <button
                  type="button"
                  onClick={onResetLanguages}
                  className="text-[11px] text-emerald-700 hover:underline font-medium cursor-pointer"
                >
                  Reset to English
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {availableLanguages.map((lang) => {
                const isSelected = preferredLanguages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => onTogglePreferredLanguage(lang)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400'
                    }`}
                  >
                    {lang}
                    {isSelected ? ' ✓' : ''}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500">
              Select one or multiple languages required for your children&apos;s routine and communication.
            </p>
          </div>

          {/* Shift Window & Immediate Availability Filter (3 cols) */}
          <div className="lg:col-span-3 space-y-2">
            <label className="font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              <span>3. Shift Window &amp; Status:</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={requestedDate}
                onChange={(e) => onChangeRequestedDate(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700"
              />
              <input
                type="time"
                value={requestedStartTime}
                onChange={(e) => onChangeRequestedStartTime(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700"
              />
            </div>
            <label className="flex items-center gap-2 pt-1 cursor-pointer select-none text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={onlyAvailableNow}
                onChange={(e) => onToggleOnlyAvailableNow(e.target.checked)}
                className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
              />
              <span>Only show nannies available right now</span>
            </label>
          </div>
        </div>
      </div>

      {/* Top Suggested Matches Grid */}
      <div className="p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
              Top Suggested Nannies for {requestedDurationHours}h Shift •{' '}
              {preferredLanguages.join(' + ')}
            </h3>
          </div>
          <div className="text-[11px] text-slate-500">
            Algorithm weights: Language Fluency (35%) · Duration Fit (25%) · Availability (25%) · Vetting &amp; Rating (15%)
          </div>
        </div>

        {topSuggestions.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
            No nannies match the current availability filter. Uncheck &ldquo;Only show nannies available right now&rdquo; to view all vetted candidates.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topSuggestions.map((match, index) => {
              const { nanny, matchScore, matchedLanguages, missingLanguages, breakdown } = match;
              const isTopPick = index === 0;

              return (
                <div
                  key={nanny.id}
                  className={`rounded-2xl p-4 flex flex-col justify-between transition-all border ${
                    isTopPick
                      ? 'bg-emerald-50/50 border-emerald-500 ring-1 ring-emerald-500/30 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Rank Header */}
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span
                        className={`font-bold ${
                          isTopPick ? 'text-emerald-900' : 'text-slate-600'
                        }`}
                      >
                        #{index + 1} {isTopPick ? 'Best Qualification Match' : match.matchTier}
                      </span>
                      <span className="font-mono font-black text-sm text-emerald-800">
                        {matchScore}% Match
                      </span>
                    </div>

                    {/* Score Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          matchScore >= 85
                            ? 'bg-emerald-600'
                            : matchScore >= 70
                            ? 'bg-teal-600'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${matchScore}%` }}
                      />
                    </div>

                    {/* Nanny Identity */}
                    <div className="flex items-center gap-3 pt-1">
                      <img
                        src={nanny.avatar}
                        alt={nanny.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{nanny.name}</h4>
                        <p className="text-[11px] text-slate-500">
                          ★ {nanny.rating} ({nanny.reviewCount}) · {nanny.experienceYears} yrs exp ·{' '}
                          {nanny.totalCompletedShifts} shifts
                        </p>
                        <p className="text-[11px] font-semibold text-emerald-800 mt-0.5">
                          R{nanny.hourlyRateZar}/hr · Est. R{match.estimatedTotalZar} ({requestedDurationHours}h)
                        </p>
                      </div>
                    </div>

                    {/* Qualification & Language Breakdown */}
                    <div className="bg-white/90 rounded-xl p-2.5 border border-slate-200/80 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="font-semibold">Languages Matched:</span>
                        <span className="font-bold text-emerald-800">
                          {matchedLanguages.length > 0 ? matchedLanguages.join(', ') : 'Partial'}
                        </span>
                      </div>
                      {missingLanguages.length > 0 && (
                        <div className="text-[10px] text-amber-700">
                          Note: Does not list {missingLanguages.join(', ')} (Speaks {nanny.languages.join(', ')})
                        </div>
                      )}
                      <div className="text-slate-600 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate">{match.durationSuitabilityLabel}</span>
                      </div>
                      <div className="text-slate-600 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate">{match.availabilityLabel}</span>
                      </div>

                      {/* Sub-score metrics */}
                      <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>Lang: {breakdown.languageScore}/35</span>
                        <span>·</span>
                        <span>Dur: {breakdown.durationScore}/25</span>
                        <span>·</span>
                        <span>Avail: {breakdown.availabilityScore}/25</span>
                        <span>·</span>
                        <span>Vet: {breakdown.qualificationScore}/15</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 mt-3 border-t border-slate-200/70 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openOpenWaSupportModal({
                          phone: nanny.whatsapp,
                          recipientLabel: `${nanny.name} (${matchScore}% Match)`,
                          message: `Hi ${nanny.name}, you were matched at ${matchScore}% in the ScopeBridg Nanny Portal for a ${requestedDurationHours}-hour shift (${preferredLanguages.join(
                            ', '
                          )}). Are you available on ${requestedDate} at ${requestedStartTime}?`,
                          autoSend: true,
                        })
                      }
                      className="p-2 text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200/80 rounded-xl transition-colors cursor-pointer"
                      title="Message via Scope Bridge WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectNannyForBooking(nanny, matchScore)}
                      className="flex-1 py-2 px-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Book {requestedDurationHours}h Shift</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

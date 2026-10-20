import React, { useState } from 'react';
import { X, MapPin, Navigation, ShoppingBag, Coffee, Utensils, Building2, Train, Search, Globe, ExternalLink, Calendar, CloudSun } from 'lucide-react';

interface GuestAreaGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuestAreaGuideModal: React.FC<GuestAreaGuideModalProps> = ({ isOpen, onClose }) => {
  const [guideQuery, setGuideQuery] = useState('');

  if (!isOpen) return null;

  const handleSearchOnGoogle = (topic: string) => {
    const q = guideQuery.trim() ? `${guideQuery.trim()} ${topic}` : topic;
    window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, '_blank', 'noopener,noreferrer');
  };

  const handleSearchOnMaps = (topic: string) => {
    const q = guideQuery.trim() ? `${guideQuery.trim()} ${topic}` : topic;
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(q)}`, '_blank', 'noopener,noreferrer');
  };

  const quickCategories = [
    {
      title: 'Local Dining & Cafes',
      description: 'Search for top-rated restaurants, coffee shops, and local culinary experiences on Google.',
      icon: Coffee,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      actionText: 'Search Dining on Google',
      onClick: () => handleSearchOnGoogle('best restaurants and local cafes')
    },
    {
      title: 'Supermarkets & Groceries',
      description: 'Find nearby hypermarkets, organic food shops, and retail stores on Google Maps.',
      icon: ShoppingBag,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      actionText: 'Find on Google Maps',
      onClick: () => handleSearchOnMaps('supermarket grocery store shopping center')
    },
    {
      title: 'Top Tourist Attractions',
      description: 'Explore museums, public parks, scenic landmarks, and guided tour packages on Google.',
      icon: Globe,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      actionText: 'Explore Attractions on Google',
      onClick: () => handleSearchOnGoogle('must see tourist attractions and tours')
    },
    {
      title: 'Transit & Transportation',
      description: 'Check train stations, bus stops, taxi ranks, and airport directions on Google Maps.',
      icon: Train,
      color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
      actionText: 'Map Public Transit',
      onClick: () => handleSearchOnMaps('train station bus stop airport transit terminal')
    },
    {
      title: 'Live Weather Forecast',
      description: 'Get immediate real-time weather forecasts, packing recommendations, and climate info.',
      icon: CloudSun,
      color: 'text-orange-600 bg-orange-50 border-orange-200',
      actionText: 'Check Live Weather',
      onClick: () => handleSearchOnGoogle('current weather forecast and packing guide')
    },
    {
      title: 'Local Events & Conferences',
      description: 'Discover upcoming business conferences, community events, and concerts on Google Search.',
      icon: Calendar,
      color: 'text-rose-600 bg-rose-50 border-rose-200',
      actionText: 'Search Events on Google',
      onClick: () => handleSearchOnGoogle('upcoming local events conferences concerts')
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Destination & Neighborhood Area Guide</h2>
              <p className="text-xs text-slate-500">Live lookup powered by Google Search & Google Maps</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Active Area Guide Input Search Launcher */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
            <label className="block text-xs font-bold text-slate-700">
              Customize Guide for Your Location / Destination:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Type city or area (e.g. Cape Town, Sandton, London, Dubai, New York)..."
                  value={guideQuery}
                  onChange={(e) => setGuideQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-emerald-600 transition-all text-slate-900 font-medium"
                />
              </div>
              <button
                onClick={() => {
                  const target = guideQuery.trim() || 'luxury travel stays';
                  window.open(`https://www.google.com/search?q=${encodeURIComponent(target + ' tourism guide local highlights')}`, '_blank', 'noopener,noreferrer');
                }}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search Google Guide</span>
              </button>
            </div>
            {guideQuery.trim() && (
              <p className="text-[10px] text-emerald-800 font-semibold">
                ✨ Currently customized for: "{guideQuery}" (Quick cards below will search within this destination!)
              </p>
            )}
          </div>

          {/* Quick Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickCategories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${cat.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 text-sm">{cat.title}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">{cat.description}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={cat.onClick}
                      className="px-3.5 py-1.5 bg-slate-950 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 hover:shadow-xs"
                    >
                      <span>{cat.actionText}</span>
                      <ExternalLink className="w-3 h-3 text-emerald-200" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-3">
            <span className="text-xl shrink-0">💡</span>
            <p className="leading-relaxed">
              <strong>Seamless Web Grounding:</strong> By launching your queries through Google Search and Maps, you bypass outdated databases and access dynamic live restaurant listings, flight tickets, subway timetables, and exact geo-coordinates.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center px-6">
          <span className="text-[11px] font-semibold text-slate-500">
            Powered by ScopeBridg Google Integration
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};

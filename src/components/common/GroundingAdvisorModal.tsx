import React, { useState } from 'react';
import { Search, MapPin, Sparkles, X, Globe, ExternalLink, Loader2 } from 'lucide-react';

interface GroundingAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GroundingAdvisorModal: React.FC<GroundingAdvisorModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'search' | 'maps'>('search');
  const [query, setQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('Ferndale, Randburg');
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [chunks, setChunks] = useState<any[]>([]);
  const [sourceInfo, setSourceInfo] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResultText(null);
    setChunks([]);
    setSourceInfo(null);

    const endpoint = activeTab === 'search' ? '/api/gemini/search-grounding' : '/api/gemini/maps-grounding';
    const bodyPayload = activeTab === 'search' ? { query } : { query, location: locationFilter };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      setResultText(data.reply || 'No information retrieved.');
      setChunks(data.groundingChunks || []);
      setSourceInfo(data.source || (activeTab === 'search' ? 'Google Search Grounding' : 'Google Maps Grounding'));
    } catch (err: any) {
      console.error('Grounding API Error:', err);
      setResultText('An error occurred while fetching information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">ScopeBridg AI Grounding Advisor</h3>
                <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Real-time Google Search & Google Maps location insights for Randburg & worldwide.
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => {
                setActiveTab('search');
                setResultText(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'search'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Google Search Grounding</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('maps');
                setResultText(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'maps'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Google Maps Grounding</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <form onSubmit={handleSearchSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {activeTab === 'search' ? 'Ask any real-time question or search query:' : 'Search place, route, or local venue details:'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    activeTab === 'search'
                      ? 'e.g. Latest weather and flight status from Cape Town to Johannesburg OR Tambo'
                      : 'e.g. Best coffee shops or gyms near Ferndale on Republic Mall'
                  }
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-purple-600"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Ask AI</span>
                </button>
              </div>
            </div>

            {activeTab === 'maps' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Location Context:</label>
                <input
                  type="text"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  placeholder="e.g. Ferndale, Randburg"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                />
              </div>
            )}
          </form>

          {/* Results Display */}
          {resultText && (
            <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-[11px] font-bold text-purple-900 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-purple-600" />
                  Grounded Response ({sourceInfo})
                </span>
              </div>
              <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">{resultText}</div>

              {chunks.length > 0 && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Retrieved Grounding Sources:
                  </span>
                  <div className="space-y-1">
                    {chunks.map((chk, idx) => (
                      <div key={idx} className="text-[11px] text-purple-700 font-medium flex items-center gap-1">
                        <ExternalLink className="w-3 h-3 text-purple-500 shrink-0" />
                        <a
                          href={chk.web?.uri || chk.maps?.uri || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline truncate"
                        >
                          {chk.web?.title || chk.maps?.title || chk.web?.uri || 'Grounded Source Link'}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

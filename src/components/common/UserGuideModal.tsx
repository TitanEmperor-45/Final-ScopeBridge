import React, { useState } from 'react';
import {
  FileText,
  Download,
  X,
  Search,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import {
  USER_GUIDE_CHAPTERS,
  downloadUserGuidePdf,
} from '../../utils/userGuidePdfGenerator';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose }) => {
  const [selectedChapterId, setSelectedChapterId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [downloadConfirm, setDownloadConfirm] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDownloadPdf = () => {
    downloadUserGuidePdf();
    setDownloadConfirm(true);
    setTimeout(() => setDownloadConfirm(false), 4000);
  };

  const filteredChapters = USER_GUIDE_CHAPTERS.filter((ch) => {
    if (selectedChapterId !== 'all' && ch.id !== selectedChapterId) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      ch.title.toLowerCase().includes(q) ||
      ch.summary.toLowerCase().includes(q) ||
      ch.items.some(
        (it) =>
          it.title.toLowerCase().includes(q) ||
          it.roleOrScope.toLowerCase().includes(q) ||
          it.steps.some((s) => s.toLowerCase().includes(q))
      )
    );
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[92vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="bg-slate-950 text-white p-5 sm:p-6 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <BookOpen className="w-3.5 h-3.5" />
                OFFICIAL USER EXPERIENCE GUIDE (PDF)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-200 border border-emerald-500/20">
                Guests • Property Hosts • Nannies • Chauffeurs • Lobby Kiosk
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>ScopeBridg Global &amp; Executive Stays — Customer &amp; User Experience Guide</span>
            </h2>
            <p className="text-xs text-slate-400">
              Step-by-step guide covering account registration, searching &amp; booking stays, keyless self check-in, virtual holiday wallet rewards, childcare &amp; chauffeur concierge, and host portfolio tools.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg cursor-pointer transition-all"
            >
              <Download className="w-4 h-4" />
              <span>{downloadConfirm ? '✓ PDF Downloaded!' : 'Download User Guide (.PDF)'}</span>
            </button>

            <a
              href="/api/user-guide/download.pdf"
              download="ScopeBridg_User_Experience_Guide.pdf"
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Save PDF Copy</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 cursor-pointer"
              title="Close User Guide"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Welcome Highlights Bar */}
        <div className="bg-slate-900 text-white px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-300 font-bold">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Designed for an Effortless Travel, Hosting &amp; Concierge Experience</span>
          </div>
          <div className="text-[11px] text-slate-300">
            24/7 In-App Concierge • Smart Lock Self Check-In • Vetted Childcare &amp; Chauffeurs
          </div>
        </div>

        {/* Chapter Filter & Search Controls */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedChapterId('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedChapterId === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All 6 Chapters
            </button>
            {USER_GUIDE_CHAPTERS.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => setSelectedChapterId(ch.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedChapterId === ch.id
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {ch.number}. {ch.title.split(' ')[0]} {ch.title.split(' ')[1]}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bookings, wallet, check-in, nanny..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Main Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 bg-slate-100/70">
          {filteredChapters.map((chapter) => (
            <div
              key={chapter.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
            >
              <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-xs font-black">
                      CHAPTER {chapter.number}
                    </span>
                    <h3 className="text-sm sm:text-base font-black text-white">{chapter.title}</h3>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{chapter.summary}</p>
                </div>
              </div>

              <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {chapter.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200 pb-2">
                        <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                          {item.title}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {item.roleOrScope}
                        </span>
                      </div>

                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {item.steps.map((step, sIdx) => (
                          <li key={sIdx} className="flex items-start gap-2 leading-relaxed">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Action Bar */}
        <div className="bg-white p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              Complete Step-by-Step User Experience Guide • Designed for Guests, Hosts &amp; Concierge Partners
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Download User Guide PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs cursor-pointer"
            >
              Close Guide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

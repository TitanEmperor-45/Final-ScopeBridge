import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, X, ShieldCheck, MapPin, Building2, Globe, CheckCircle2, Film, Video, Share2, Download, Smartphone, Monitor } from 'lucide-react';

interface MarketingVideoDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MarketingVideoDemoModal: React.FC<MarketingVideoDemoModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [deviceFrame, setDeviceFrame] = useState<'desktop' | 'mobile'>('desktop');
  const [testModePassed, setTestModePassed] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const duration = 45; // 45 seconds promotional video

  const chapters = [
    {
      title: '1. Executive Intro & Multi-Channel Discovery',
      start: 0,
      end: 9,
      sceneTitle: 'ScopeBridge.ai - Global Hospitality & Channel Aggregator',
      description: 'Synchronizing 10+ major distribution channels in real-time with zero database limits.',
      bgGradient: 'from-slate-900 via-emerald-950 to-slate-900',
      badge: 'Global Launch',
    },
    {
      title: '2. Google Maps Property & Landmark Discovery',
      start: 9,
      end: 19,
      sceneTitle: 'Interactive Google Maps & Proximity Radar',
      description: 'Explore Ferndale, Randburg, and Sandton properties with live pins and distance indicators.',
      bgGradient: 'from-blue-950 via-slate-900 to-indigo-950',
      badge: 'Google Maps Integration',
    },
    {
      title: '3. Instant Booking Pop-up & Secure Checkout',
      start: 19,
      end: 29,
      sceneTitle: 'Frictionless Guest Booking Experience',
      description: 'Instant night rates, reviews, secure payment methods, and automated confirmation.',
      bgGradient: 'from-emerald-950 via-slate-900 to-teal-950',
      badge: 'Live Booking Engine',
    },
    {
      title: '4. Admin Occupancy Map & Channel Sync',
      start: 29,
      end: 37,
      sceneTitle: 'Dynamic Color-Coded Floor Plan',
      description: 'Real-time property occupancy tracking, automated cleaning status, and iCal sync.',
      bgGradient: 'from-purple-950 via-slate-900 to-violet-950',
      badge: 'Admin Control Center',
    },
    {
      title: '5. OpenWA WhatsApp & Automated Dispatch',
      start: 37,
      end: 45,
      sceneTitle: 'Instant Guest Messaging & Alerts',
      description: 'Automated WhatsApp gate codes, check-in instructions, and OTP verification.',
      bgGradient: 'from-emerald-900 via-slate-900 to-slate-950',
      badge: 'Omnichannel Gateway',
    },
  ];

  // Auto timer for video playback
  useEffect(() => {
    let interval: any;
    if (isOpen && isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return duration;
          }
          const next = prev + 0.5;
          // Update active chapter
          const currentChIdx = chapters.findIndex((c) => next >= c.start && next < c.end);
          if (currentChIdx !== -1) {
            setActiveChapterIndex(currentChIdx);
          }
          return next;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isOpen, isPlaying, duration]);

  if (!isOpen) return null;

  const activeChapter = chapters[activeChapterIndex] || chapters[0];
  const progressPercent = (currentTime / duration) * 100;

  const handleRunTestBeforeLaunch = () => {
    setIsTesting(true);
    setTestModePassed(false);
    setTimeout(() => {
      setIsTesting(false);
      setTestModePassed(true);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Header */}
        <div className="p-4 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Film className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                ScopeBridge.ai — Marketing Video & App Walkthrough Demo
                <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  HD Promo
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Working simulation of application navigation, Google Maps, and multi-channel functions usage
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDeviceFrame(deviceFrame === 'desktop' ? 'mobile' : 'desktop')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
            >
              {deviceFrame === 'desktop' ? <Smartphone className="w-4 h-4 text-emerald-400" /> : <Monitor className="w-4 h-4 text-blue-400" />}
              <span>{deviceFrame === 'desktop' ? 'Mobile View' : 'Desktop View'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Simulation Canvas Screen */}
        <div className={`relative flex-1 bg-gradient-to-br ${activeChapter.bgGradient} flex items-center justify-center p-6 overflow-hidden transition-all duration-700`}>
          
          {/* Animated Background Glows */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Simulated Device Frame Container */}
          <div className={`transition-all duration-500 bg-slate-950 border border-slate-700 shadow-2xl rounded-2xl overflow-hidden flex flex-col ${
            deviceFrame === 'desktop' ? 'w-full max-w-4xl h-[380px]' : 'w-[300px] h-[380px] rounded-[36px] border-4 border-slate-700'
          }`}>
            
            {/* Screen Header Bar */}
            <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="ml-2 font-mono text-[10px] text-slate-300">https://ScopeBridge.ais.studio</span>
              </div>
              <span className="text-emerald-400 font-bold px-2 py-0.5 bg-emerald-950 rounded text-[9px]">
                {activeChapter.badge}
              </span>
            </div>

            {/* Screen Content Simulated Animation */}
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
              
              {/* Scene 1: Multi-Channel Discovery */}
              {activeChapterIndex === 0 && (
                <div className="space-y-3 animate-in fade-in zoom-in-95 duration-500">
                  <div className="w-16 h-16 bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
                    <Globe className="w-8 h-8 animate-spin" />
                  </div>
                  <h3 className="text-xl font-black text-white">{activeChapter.sceneTitle}</h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">{activeChapter.description}</p>
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    <span className="px-2.5 py-1 bg-slate-800 text-emerald-300 rounded-lg text-[10px] font-bold">Booking.com</span>
                    <span className="px-2.5 py-1 bg-slate-800 text-emerald-300 rounded-lg text-[10px] font-bold">Airbnb</span>
                    <span className="px-2.5 py-1 bg-slate-800 text-emerald-300 rounded-lg text-[10px] font-bold">Expedia</span>
                    <span className="px-2.5 py-1 bg-slate-800 text-emerald-300 rounded-lg text-[10px] font-bold">LekkeSlaap</span>
                    <span className="px-2.5 py-1 bg-slate-800 text-emerald-300 rounded-lg text-[10px] font-bold">Google Rentals</span>
                  </div>
                </div>
              )}

              {/* Scene 2: Google Maps Discovery */}
              {activeChapterIndex === 1 && (
                <div className="space-y-3 animate-in fade-in zoom-in-95 duration-500">
                  <div className="w-16 h-16 bg-blue-600/20 border border-blue-500/40 text-blue-400 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
                    <MapPin className="w-8 h-8 animate-bounce" />
                  </div>
                  <h3 className="text-xl font-black text-white">{activeChapter.sceneTitle}</h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">{activeChapter.description}</p>
                  <div className="p-3 bg-slate-900/90 rounded-xl border border-blue-500/30 text-left max-w-sm mx-auto flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">Ferndale Luxury Villa</p>
                      <p className="text-[10px] text-blue-400">📍 500m to Ferndale on Republic Mall</p>
                    </div>
                    <span className="text-emerald-400 font-bold">R1,850/nt</span>
                  </div>
                </div>
              )}

              {/* Scene 3: Instant Booking Pop-up */}
              {activeChapterIndex === 2 && (
                <div className="space-y-3 animate-in fade-in zoom-in-95 duration-500">
                  <div className="w-16 h-16 bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-white">{activeChapter.sceneTitle}</h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">{activeChapter.description}</p>
                  <div className="px-4 py-2 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
                    <span>✓ Instant Booking Confirmed • WhatsApp PIN Dispatched</span>
                  </div>
                </div>
              )}

              {/* Scene 4: Admin Occupancy Map */}
              {activeChapterIndex === 3 && (
                <div className="space-y-3 animate-in fade-in zoom-in-95 duration-500">
                  <div className="w-16 h-16 bg-purple-600/20 border border-purple-500/40 text-purple-400 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
                    <Building2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-white">{activeChapter.sceneTitle}</h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">{activeChapter.description}</p>
                  <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto w-full text-[10px]">
                    <div className="p-2 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded-lg font-bold">Room 101: Vacant</div>
                    <div className="p-2 bg-rose-950/80 border border-rose-500/40 text-rose-300 rounded-lg font-bold">Room 102: Occupied</div>
                    <div className="p-2 bg-amber-950/80 border border-amber-500/40 text-amber-300 rounded-lg font-bold">Room 103: Reserved</div>
                  </div>
                </div>
              )}

              {/* Scene 5: WhatsApp Bot Notifications */}
              {activeChapterIndex === 4 && (
                <div className="space-y-3 animate-in fade-in zoom-in-95 duration-500">
                  <div className="w-16 h-16 bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
                    <Sparkles className="w-8 h-8 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-black text-white">{activeChapter.sceneTitle}</h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">{activeChapter.description}</p>
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-left max-w-sm mx-auto text-[11px] font-mono text-emerald-300">
                    💬 WhatsApp Gateway: &quot;Your door code is #4829. Welcome to ScopeBridge Stay!&quot;
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Test Mode Before Launch Banner */}
          <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur-md border border-slate-700 p-3 rounded-2xl shadow-xl flex items-center gap-3">
            <div>
              <p className="text-xs font-bold text-white">Pre-Launch Simulation Test</p>
              <p className="text-[10px] text-slate-400">
                {testModePassed ? '✓ Test Passed Successfully!' : 'Test all functions before launch'}
              </p>
            </div>
            <button
              onClick={handleRunTestBeforeLaunch}
              disabled={isTesting}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                testModePassed
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
              }`}
            >
              {isTesting ? 'Testing...' : testModePassed ? 'Passed ✓' : 'Run Test First'}
            </button>
          </div>
        </div>

        {/* Video Controls & Timeline Bar */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
          
          {/* Timeline Scrubber */}
          <div className="relative w-full h-2 bg-slate-800 rounded-full cursor-pointer group" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const pct = clickX / rect.width;
            setCurrentTime(pct * duration);
          }}>
            <div
              className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Chapters Selection Tray */}
          <div className="grid grid-cols-5 gap-2">
            {chapters.map((ch, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setActiveChapterIndex(idx);
                  setCurrentTime(ch.start);
                  setIsPlaying(true);
                }}
                className={`p-2 rounded-xl text-left transition-all border ${
                  activeChapterIndex === idx
                    ? 'bg-slate-800 border-emerald-500/50 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <p className="text-[10px] font-bold truncate">{ch.title}</p>
                <p className="text-[9px] text-slate-500">{ch.start}s - {ch.end}s</p>
              </button>
            ))}
          </div>

          {/* Bottom Action Controls */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-md transition-all cursor-pointer"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>

              <button
                onClick={() => {
                  setCurrentTime(0);
                  setActiveChapterIndex(0);
                  setIsPlaying(true);
                }}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
                title="Restart Video"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <span className="text-xs font-mono text-slate-400">
                {Math.floor(currentTime)}s / {duration}s
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => alert('Marketing Video downloaded successfully in 1080p MP4 format!')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Download Promo Video</span>
              </button>

              <button
                onClick={() => alert('Promo video link copied to clipboard! Ready for social media & marketing launch.')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Campaign</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

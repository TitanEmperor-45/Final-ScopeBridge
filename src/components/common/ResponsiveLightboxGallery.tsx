import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, Minimize,
  Camera, BedDouble, Download, Share2, Sparkles, Check, RefreshCw
} from 'lucide-react';

export interface LightboxPhotoItem {
  url: string;
  label?: string;
  category?: string;
  roomId?: string;
  roomName?: string;
  description?: string;
}

export interface ResponsiveLightboxGalleryProps {
  isOpen: boolean;
  photos: (string | LightboxPhotoItem)[];
  initialIndex?: number;
  propertyTitle?: string;
  propertyArea?: string;
  onClose: () => void;
  onSelectPhotoIndex?: (index: number) => void;
  onBookRoom?: (roomId: string) => void;
}

export const ResponsiveLightboxGallery: React.FC<ResponsiveLightboxGalleryProps> = ({
  isOpen,
  photos,
  initialIndex = 0,
  propertyTitle = 'Luxury StaySync Residence',
  propertyArea,
  onClose,
  onSelectPhotoIndex,
  onBookRoom,
}) => {
  // Normalize photo array
  const normalizedPhotos: LightboxPhotoItem[] = useMemo(() => {
    return photos.map((p, idx) => {
      if (typeof p === 'string') {
        return {
          url: p,
          label: `Photo ${idx + 1}`,
          category: 'all',
        };
      }
      return {
        ...p,
        label: p.label || `Photo ${idx + 1}`,
      };
    });
  }, [photos]);

  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    if (initialIndex >= 0 && initialIndex < normalizedPhotos.length) return initialIndex;
    return 0;
  });

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Touch Swipe State for Mobile / Tablet Gestures
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchDeltaX = useRef<number>(0);
  const [touchOffset, setTouchOffset] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const lastTapTime = useRef<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const filmstripRef = useRef<HTMLDivElement>(null);

  // Categories extraction
  const categories = useMemo(() => {
    const map = new Map<string, { id: string; label: string; count: number }>();
    map.set('all', { id: 'all', label: 'All Photos', count: normalizedPhotos.length });

    normalizedPhotos.forEach((item) => {
      const catKey = item.roomId || item.category || 'property';
      const catLabel = item.roomName || (catKey === 'property' ? 'Property & Common Areas' : catKey === 'guest' ? 'Guest Photos' : item.label?.split('(')[0]?.trim() || 'General');
      
      if (!map.has(catKey)) {
        map.set(catKey, { id: catKey, label: catLabel, count: 1 });
      } else {
        const existing = map.get(catKey)!;
        existing.count += 1;
      }
    });

    return Array.from(map.values());
  }, [normalizedPhotos]);

  // Filtered photo list based on category tab
  const filteredPhotos = useMemo(() => {
    if (activeCategory === 'all') return normalizedPhotos;
    return normalizedPhotos.filter((p) => (p.roomId === activeCategory) || (p.category === activeCategory));
  }, [normalizedPhotos, activeCategory]);

  // Sync initialIndex when changed
  useEffect(() => {
    if (initialIndex >= 0 && initialIndex < normalizedPhotos.length) {
      setCurrentIndex(initialIndex);
      setZoomLevel(1);
      setImageLoading(true);
      setImageError(false);
    }
  }, [initialIndex, normalizedPhotos.length]);

  // Current photo item
  const currentPhoto = normalizedPhotos[currentIndex] || normalizedPhotos[0];

  // Navigation handlers
  const handlePrev = useCallback(() => {
    setZoomLevel(1);
    setImageLoading(true);
    setImageError(false);
    setCurrentIndex((prev) => {
      const nextIdx = prev > 0 ? prev - 1 : normalizedPhotos.length - 1;
      if (onSelectPhotoIndex) onSelectPhotoIndex(nextIdx);
      return nextIdx;
    });
  }, [normalizedPhotos.length, onSelectPhotoIndex]);

  const handleNext = useCallback(() => {
    setZoomLevel(1);
    setImageLoading(true);
    setImageError(false);
    setCurrentIndex((prev) => {
      const nextIdx = prev < normalizedPhotos.length - 1 ? prev + 1 : 0;
      if (onSelectPhotoIndex) onSelectPhotoIndex(nextIdx);
      return nextIdx;
    });
  }, [normalizedPhotos.length, onSelectPhotoIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === '+' || e.key === '=') {
        setZoomLevel((z) => Math.min(3, z + 0.5));
      } else if (e.key === '-' || e.key === '_') {
        setZoomLevel((z) => Math.max(1, z - 0.5));
      } else if (e.key.toLowerCase() === 'f') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrev, handleNext, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Scroll active thumbnail into center view
  useEffect(() => {
    if (!filmstripRef.current) return;
    const activeThumb = filmstripRef.current.querySelector(`[data-index="${currentIndex}"]`) as HTMLElement;
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentIndex]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Touch handlers for Mobile Swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoomLevel > 1) return; // Allow pinch / pan when zoomed in
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    touchDeltaX.current = 0;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping || zoomLevel > 1) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;

    // If horizontal motion is greater than vertical, track swipe
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      touchDeltaX.current = deltaX;
      setTouchOffset(deltaX * 0.4); // Elastic damping
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping || zoomLevel > 1) return;
    setIsSwiping(false);
    const threshold = 45; // 45px swipe threshold

    if (touchDeltaX.current < -threshold) {
      handleNext();
    } else if (touchDeltaX.current > threshold) {
      handlePrev();
    }

    setTouchOffset(0);
    touchDeltaX.current = 0;
  };

  // Double tap to zoom
  const handleImageTap = () => {
    const now = Date.now();
    if (now - lastTapTime.current < 300) {
      // Double tap detected
      setZoomLevel((prev) => (prev > 1 ? 1 : 2));
    }
    lastTapTime.current = now;
  };

  // Copy photo link
  const handleCopyLink = () => {
    if (!currentPhoto?.url) return;
    navigator.clipboard.writeText(currentPhoto.url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!isOpen || normalizedPhotos.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-100 bg-slate-950/98 backdrop-blur-xl flex flex-col justify-between select-none animate-in fade-in duration-200 text-white"
      role="dialog"
      aria-modal="true"
      aria-label="High-Resolution Photo Gallery"
    >
      {/* TOP BAR: Title, Categories, Tools & Close Button */}
      <div className="shrink-0 p-3 sm:p-4 bg-slate-950/90 border-b border-slate-800/80 flex flex-col gap-2.5 z-20">
        <div className="flex items-center justify-between gap-3">
          {/* Property & Room Details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-black text-white truncate max-w-[220px] sm:max-w-md">
                {propertyTitle}
              </span>
              {propertyArea && (
                <span className="text-[11px] text-emerald-400 hidden sm:inline">
                  • {propertyArea}
                </span>
              )}
              <span className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded-md">
                {currentIndex + 1} / {normalizedPhotos.length}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-300 truncate mt-0.5 font-medium">
              {currentPhoto?.label || 'High-Resolution Picture'}
              {currentPhoto?.roomName && (
                <span className="text-purple-300 font-bold ml-1.5">
                  ({currentPhoto.roomName})
                </span>
              )}
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Direct Book Suite Action if Room-Specific */}
            {currentPhoto?.roomId && onBookRoom && (
              <button
                type="button"
                onClick={() => {
                  onBookRoom(currentPhoto.roomId!);
                  onClose();
                }}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer"
              >
                <BedDouble className="w-3.5 h-3.5" />
                <span>Book This Suite</span>
              </button>
            )}

            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(1, z - 0.5))}
                disabled={zoomLevel <= 1}
                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer rounded-lg hover:bg-slate-800 transition-colors"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-mono text-slate-300 px-1.5">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(3, z + 0.5))}
                disabled={zoomLevel >= 3}
                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer rounded-lg hover:bg-slate-800 transition-colors"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl cursor-pointer transition-colors"
              title={isFullscreen ? 'Exit Fullscreen (F)' : 'Enter Fullscreen (F)'}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>

            {/* Share / Copy URL */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl cursor-pointer transition-colors"
              title="Copy Photo Link"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-200 hover:text-white rounded-xl cursor-pointer transition-all active:scale-95"
              title="Close Gallery (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Filter Pills Bar (All, Exterior, Suite 1, Suite 2, Guests) */}
        {categories.length > 2 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat.id);
                    // Find first photo matching this category
                    const targetIdx = normalizedPhotos.findIndex(
                      (p) => cat.id === 'all' || p.roomId === cat.id || p.category === cat.id
                    );
                    if (targetIdx !== -1) {
                      setCurrentIndex(targetIdx);
                      setZoomLevel(1);
                    }
                  }}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                      : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {cat.label} ({cat.count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* MAIN VIEWPORT: Photo Display + Gesture Swipe + Navigation Arrows */}
      <div
        className="relative flex-1 flex items-center justify-center overflow-hidden px-2 sm:px-6 my-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleImageTap}
      >
        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          className="absolute left-2 sm:left-4 z-20 p-3 sm:p-3.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white border border-slate-700/80 cursor-pointer shadow-2xl transition-all hover:scale-110 active:scale-95 touch-manipulation"
          title="Previous Photo (Left Arrow / Swipe Right)"
          aria-label="Previous Photo"
        >
          <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>

        {/* Main Center Image Container */}
        <div
          className="relative max-h-[70vh] sm:max-h-[76vh] max-w-full flex items-center justify-center transition-transform duration-150 ease-out"
          style={{
            transform: `translateX(${touchOffset}px) scale(${zoomLevel})`,
          }}
        >
          {imageLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 rounded-2xl">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-2" />
              <span className="text-xs text-slate-400 font-medium">Loading high-resolution picture...</span>
            </div>
          )}

          <img
            key={currentPhoto?.url}
            src={currentPhoto?.url}
            alt={currentPhoto?.label || 'Property High-Resolution View'}
            onLoad={() => setImageLoading(false)}
            onError={(e) => {
              setImageLoading(false);
              setImageError(true);
              (e.currentTarget as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1600&q=80';
            }}
            className="max-h-[68vh] sm:max-h-[75vh] max-w-[94vw] sm:max-w-[85vw] object-contain rounded-2xl shadow-2xl border border-slate-800/80 pointer-events-auto"
            draggable={false}
          />
        </div>

        {/* Right Arrow Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="absolute right-2 sm:right-4 z-20 p-3 sm:p-3.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white border border-slate-700/80 cursor-pointer shadow-2xl transition-all hover:scale-110 active:scale-95 touch-manipulation"
          title="Next Photo (Right Arrow / Swipe Left)"
          aria-label="Next Photo"
        >
          <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>

        {/* Mobile Swipe Guidance Banner (visible on mobile touch) */}
        <div className="absolute bottom-2 inset-x-0 flex justify-center pointer-events-none sm:hidden">
          <span className="bg-slate-950/80 backdrop-blur-md text-[10px] text-slate-400 px-3 py-1 rounded-full border border-slate-800">
            👈 Swipe left/right to browse • Double tap to zoom
          </span>
        </div>
      </div>

      {/* BOTTOM FILMSTRIP: Thumbnail Strip & Quick Selection */}
      <div className="shrink-0 p-3 bg-slate-950/95 border-t border-slate-800/80 flex flex-col gap-2 z-20">
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-emerald-400" />
            <span>All Gallery Thumbnails ({normalizedPhotos.length} Total Pictures)</span>
          </span>
          <span className="hidden sm:inline text-[10px] text-slate-500">
            Use ◄ ► Arrow keys, Swipe gestures, or click any thumbnail
          </span>
        </div>

        {/* Thumbnails Row */}
        <div
          ref={filmstripRef}
          className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
        >
          {normalizedPhotos.map((item, idx) => {
            const isSelected = currentIndex === idx;
            return (
              <button
                key={`gallery-thumb-${idx}`}
                data-index={idx}
                type="button"
                onClick={() => {
                  setCurrentIndex(idx);
                  setZoomLevel(1);
                  setImageLoading(true);
                  setImageError(false);
                  if (onSelectPhotoIndex) onSelectPhotoIndex(idx);
                }}
                className={`relative shrink-0 w-16 h-12 sm:w-20 sm:h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-400 scale-105 ring-2 ring-emerald-500/50 shadow-lg'
                    : 'border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-600'
                }`}
              >
                <img
                  src={item.url}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=300&q=80';
                  }}
                />
                <span className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[8px] font-bold text-slate-200 px-1 py-0.2 truncate block text-center">
                  #{idx + 1}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

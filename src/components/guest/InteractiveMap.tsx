import React, { useState } from 'react';
import { Property } from '../../types';
import { MapPin, Navigation, Compass, ExternalLink, ShieldAlert, Sparkles, Building, Coffee, ShoppingBag, Car, Star, CheckCircle2, BedDouble, Calendar } from 'lucide-react';

interface InteractiveMapProps {
  properties: Property[];
  selectedProperty: Property | null;
  onSelectProperty: (property: Property) => void;
  targetLandmark: 'all' | 'shopping' | 'business' | 'transit' | 'dining';
  onSelectLandmark: (landmark: 'all' | 'shopping' | 'business' | 'transit' | 'dining') => void;
  onBookPropertyClick?: (property: Property) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  properties,
  selectedProperty,
  onSelectProperty,
  targetLandmark,
  onSelectLandmark,
  onBookPropertyClick,
}) => {
  const [hoveredPropId, setHoveredPropId] = useState<string | null>(null);
  const [mapLayerMode, setMapLayerMode] = useState<'vector' | 'google_satellite' | 'google_roadmap'>('google_roadmap');

  // Key Regional Landmarks coordinates on our map canvas (0 - 100%)
  const landmarks = [
    {
      id: 'shopping',
      name: 'Ferndale on Republic Mall',
      type: 'Shopping & Dining Hub',
      x: 42,
      y: 28,
      icon: ShoppingBag,
      color: 'bg-indigo-600',
      description: 'Supermarkets, boutique shops, organic markets, and dining terrace',
    },
    {
      id: 'business',
      name: 'Absa Financial District',
      type: 'Corporate Banking District',
      x: 68,
      y: 32,
      icon: Building,
      color: 'bg-rose-600',
      description: 'Key business headquarters and business centers for executive travelers',
    },
    {
      id: 'dining',
      name: 'Spar & Artisan Groceries',
      type: 'Neighborhood Groceries',
      x: 36,
      y: 52,
      icon: Coffee,
      color: 'bg-amber-600',
      description: 'Fresh bakeries, hot deli, local cafes, and daily essentials',
    },
    {
      id: 'transit',
      name: 'Sandton Gautrain Hub',
      type: 'City Center & Transit',
      x: 75,
      y: 65,
      icon: MapPin,
      color: 'bg-slate-700',
      description: 'Express trains, shuttle pickup, and highway connection points',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Map Control Toolbar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Google Maps & Interactive Destination Explorer
            </h3>
            <p className="text-xs text-slate-500">
              Live Google Maps view with markers, satellite toggle, & instant booking pop-ups
            </p>
          </div>
        </div>

        {/* Map Layer Mode Toggles */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-medium">
          <button
            onClick={() => setMapLayerMode('google_roadmap')}
            className={`px-3 py-1 rounded-lg transition-all ${
              mapLayerMode === 'google_roadmap'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Google Roadmap
          </button>
          <button
            onClick={() => setMapLayerMode('google_satellite')}
            className={`px-3 py-1 rounded-lg transition-all ${
              mapLayerMode === 'google_satellite'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Google Satellite
          </button>
          <button
            onClick={() => setMapLayerMode('vector')}
            className={`px-3 py-1 rounded-lg transition-all ${
              mapLayerMode === 'vector'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Vector Grid
          </button>
        </div>

        {/* Quick Landmark Proximity Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs w-full sm:w-auto">
          <span className="text-slate-500 font-medium mr-1 text-[11px]">Focus:</span>
          <button
            onClick={() => onSelectLandmark('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              targetLandmark === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Areas
          </button>
          <button
            onClick={() => onSelectLandmark('shopping')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
              targetLandmark === 'shopping'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ShoppingBag className="w-3 h-3" />
            <span>Shopping</span>
          </button>
          <button
            onClick={() => onSelectLandmark('business')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
              targetLandmark === 'business'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Building className="w-3 h-3" />
            <span>Business</span>
          </button>
          <button
            onClick={() => onSelectLandmark('dining')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
              targetLandmark === 'dining'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Coffee className="w-3 h-3" />
            <span>Dining</span>
          </button>
        </div>
      </div>

      {/* Map Graphic Canvas / Google Maps Embed */}
      <div className="relative w-full h-[520px] bg-slate-900 overflow-hidden select-none border-b border-slate-200">
        {mapLayerMode === 'google_roadmap' && (
          <iframe
            title="Google Maps Roadmap View"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3582.529841829281!2d27.9934!3d-26.0936!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1e95747472859739%3A0x6b3b55ff3bc95764!2sFerndale%2C%20Randburg%2C%202194%2C%20South%20Africa!5e0!3m2!1sen!2sus!4v1650000000000!5m2!1sen!2sus"
            className="absolute inset-0 w-full h-full border-0 opacity-90 filter contrast-105"
            loading="lazy"
          />
        )}

        {mapLayerMode === 'google_satellite' && (
          <iframe
            title="Google Maps Satellite View"
            src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d14330.12!2d27.9934!3d-26.0936!2m3!1f0!2f35!3f0!3m2!1i1024!2i768!4f35!5e1!3m2!1sen!2sus!4v1650000000000!5m2!1sen!2sus"
            className="absolute inset-0 w-full h-full border-0 opacity-95"
            loading="lazy"
          />
        )}

        {mapLayerMode === 'vector' && (
          <div className="absolute inset-0 bg-slate-100">
            <svg className="absolute inset-0 w-full h-full text-slate-300" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              <path d="M 0 160 Q 300 180 800 140" fill="none" stroke="#cbd5e1" strokeWidth="14" strokeLinecap="round" />
              <path d="M 520 0 L 640 480" fill="none" stroke="#cbd5e1" strokeWidth="16" strokeLinecap="round" />
            </svg>
          </div>
        )}

        {/* Overlay Interactive Property Markers */}
        {properties.map((property) => {
          const isSelected = selectedProperty?.id === property.id;
          const isHovered = hoveredPropId === property.id;

          let distanceLabel = property.distances.ferndaleOnRepublic || '500m';
          if (targetLandmark === 'business') distanceLabel = property.distances.absaCampus || '1.0km';
          if (targetLandmark === 'dining') distanceLabel = property.distances.spar || '300m';
          if (targetLandmark === 'transit') distanceLabel = property.distances.gautrainSandton || '8.2km';

          return (
            <div
              key={property.id}
              style={{ left: `${property.coordinates.x}%`, top: `${property.coordinates.y}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 transition-all ${
                isSelected ? 'scale-125 z-40' : 'hover:scale-110'
              }`}
              onMouseEnter={() => setHoveredPropId(property.id)}
              onMouseLeave={() => setHoveredPropId(null)}
              onClick={() => onSelectProperty(property)}
            >
              <div
                className={`flex flex-col items-center cursor-pointer shadow-xl rounded-2xl transition-all ${
                  isSelected ? 'ring-4 ring-emerald-500 bg-emerald-900 text-white' : 'bg-white text-slate-900 border border-emerald-500'
                }`}
              >
                <div className="flex items-center gap-1 px-3 py-1.5 text-xs font-black">
                  <span className="text-[10px] text-emerald-600">R</span>
                  <span>{property.basePrice}</span>
                  <span className="text-[9px] opacity-70">/nt</span>
                </div>
                <div className="px-2 py-0.5 bg-slate-900 text-white text-[9px] font-bold rounded-b-xl w-full text-center">
                  {property.title.split(' ')[0]}
                </div>
              </div>

              {/* Integrated Booking Pop-up Card when Selected */}
              {isSelected && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-white rounded-2xl shadow-2xl border-2 border-emerald-500 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="relative h-32">
                    <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span>{property.rating} ({property.reviewCount})</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="font-bold text-sm text-slate-900 truncate">{property.title}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-emerald-600" />
                      <span>{property.area} • {distanceLabel}</span>
                    </p>

                    <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-400">Nightly Rate</span>
                        <p className="text-sm font-black text-emerald-700">R{property.basePrice} <span className="text-xs font-normal text-slate-500">incl. VAT</span></p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onBookPropertyClick) onBookPropertyClick(property);
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Instant Book</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Map Footer Proximity Summary */}
      <div className="p-4 bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 text-indigo-700 font-semibold text-xs">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Ferndale on Republic Mall</span>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">2 to 7 mins walking distance</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 text-rose-700 font-semibold text-xs">
            <Building className="w-3.5 h-3.5" />
            <span>Absa Randburg Campus</span>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">1.0km - 1.4km (Corporate Hub)</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 text-amber-700 font-semibold text-xs">
            <Coffee className="w-3.5 h-3.5" />
            <span>Spar & Groceries</span>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">300m - 600m (Daily Essentials)</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 text-sky-700 font-semibold text-xs">
            <Car className="w-3.5 h-3.5" />
            <span>Sandton Gautrain Station</span>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">8.2km (~15 min highway drive)</p>
        </div>
      </div>
    </div>
  );
};

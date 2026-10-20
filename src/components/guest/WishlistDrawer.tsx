import React from 'react';
import { Property } from '../../types';
import { X, Heart, Trash2, MapPin, ArrowRight, ShieldCheck } from 'lucide-react';

interface WishlistDrawerProps {
  wishlistIds: string[];
  properties: Property[];
  onRemoveWishlist: (propertyId: string) => void;
  onSelectProperty: (property: Property) => void;
  onClose: () => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  wishlistIds,
  properties,
  onRemoveWishlist,
  onSelectProperty,
  onClose,
}) => {
  const savedProperties = properties.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-full">
              <Heart className="w-4 h-4 fill-rose-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Your Saved Places</h2>
              <p className="text-xs text-slate-500">
                {savedProperties.length} {savedProperties.length === 1 ? 'place' : 'places'} saved in Ferndale & Randburg
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {savedProperties.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Heart className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Your wishlist is empty</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Heart places while browsing Ferndale on Republic & Randburg lofts to save them for later!
              </p>
            </div>
          ) : (
            savedProperties.map((prop) => (
              <div
                key={prop.id}
                className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all flex gap-3 group"
              >
                <img
                  src={prop.images[0]}
                  alt={prop.title}
                  className="w-24 h-20 rounded-lg object-cover"
                />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <h3
                        onClick={() => {
                          onSelectProperty(prop);
                          onClose();
                        }}
                        className="text-xs font-bold text-slate-900 hover:text-emerald-700 cursor-pointer line-clamp-1"
                      >
                        {prop.title}
                      </h3>
                      <button
                        onClick={() => onRemoveWishlist(prop.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-emerald-600" />
                      {prop.area}
                    </p>
                    <span className="text-[10px] text-indigo-700 font-semibold mt-1 block">
                      {prop.distances.ferndaleOnRepublic} to Mall
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                    <span className="font-bold text-xs text-slate-900">
                      R{prop.basePrice} <span className="text-[10px] font-normal text-slate-500">/ night</span>
                    </span>
                    <button
                      onClick={() => {
                        onSelectProperty(prop);
                        onClose();
                      }}
                      className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:underline"
                    >
                      <span>Book now</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {savedProperties.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
            <span className="flex items-center gap-1 text-emerald-800 font-semibold mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Repeat guest discount: FERNDALE10
            </span>
            Direct booking ensures lowest rates and no double booking fees.
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Building2, Image as ImageIcon, MapPin, DollarSign, Bed, Bath, Users, Zap, Shield, Plus, Upload, Video, BedDouble, Trash2, Globe, Check, Edit3 } from 'lucide-react';
import { Property, PropertyRoom } from '../../types';
import { parseMediaUrls, compressImageToDataUrl } from '../../lib/firebase';
import { GLOBAL_AREA_GROUPS, ALL_GLOBAL_AREAS, findGlobalAreaMeta } from '../../data/globalAreas';

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProperty: (newProp: Property) => void;
}

const AVAILABLE_CHANNELS = [
  { id: 'direct', name: 'ScopeBridge Direct', badge: 'Official Direct Channel' },
  { id: 'booking_com', name: 'Booking.com', badge: 'Global OTA' },
  { id: 'airbnb', name: 'Airbnb', badge: 'Global Stays' },
  { id: 'safarinow', name: 'SafariNow', badge: 'SA Regional' },
  { id: 'lekkeslaap', name: 'LekkeSlaap', badge: 'SA Regional' },
  { id: 'expedia', name: 'Expedia', badge: 'Global OTA' },
  { id: 'agoda', name: 'Agoda', badge: 'Global OTA' },
  { id: 'hotels_com', name: 'Hotels.com', badge: 'Global OTA' },
  { id: 'tripadvisor', name: 'TripAdvisor', badge: 'Metasearch' },
  { id: 'vrbo', name: 'VRBO', badge: 'Vacation Rentals' },
];

export const AddPropertyModal: React.FC<AddPropertyModalProps> = ({
  isOpen,
  onClose,
  onAddProperty,
}) => {
  const [title, setTitle] = useState('');
  const [unitCode, setUnitCode] = useState('UNIT-' + Math.floor(100 + Math.random() * 900));
  const [area, setArea] = useState('');
  const [areaSearchQuery, setAreaSearchQuery] = useState('');
  const [isCustomArea, setIsCustomArea] = useState(false);
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [globalRegion, setGlobalRegion] = useState<'South Africa' | 'Europe' | 'Middle East' | 'North America' | 'Asia Pacific'>('South Africa');
  const [flag, setFlag] = useState('🇿🇦');
  const [address, setAddress] = useState('');
  const [basePrice, setBasePrice] = useState(1450);
  const [weekendPrice, setWeekendPrice] = useState(1750);
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(2);
  const [maxGuests, setMaxGuests] = useState(4);

  // Interactive Property Photos array (Add, Delete, Update)
  const [propertyPhotoList, setPropertyPhotoList] = useState<string[]>([
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
  ]);
  const [newPropertyPhotoUrl, setNewPropertyPhotoUrl] = useState('');
  const [videoUrls, setVideoUrls] = useState('https://assets.mixkit.co/videos/preview/mixkit-modern-apartment-interior-tour-42023-large.mp4');
  const [solarInverter, setSolarInverter] = useState(true);
  const [selfCheckIn, setSelfCheckIn] = useState(true);
  const [parking, setParking] = useState(true);
  const [wifi, setWifi] = useState(true);

  // Registered & Visible Channels for Owner and Property
  const [selectedChannels, setSelectedChannels] = useState<string[]>([
    'direct',
    'booking_com',
    'airbnb',
    'safarinow',
    'lekkeslaap',
  ]);

  // Multiple Rooms Configuration with Add, Delete, Update Room Photos
  const [draftRooms, setDraftRooms] = useState<
    Array<{
      id: string;
      name: string;
      type: PropertyRoom['type'];
      basePrice: number;
      weekendPrice: number;
      maxGuests: number;
      bedConfiguration: string;
      photos: string[];
      newPhotoInput: string;
      videos: string;
    }>
  >([
    {
      id: 'draft-room-1',
      name: 'Main Executive Suite',
      type: 'master_suite',
      basePrice: 850,
      weekendPrice: 1050,
      maxGuests: 2,
      bedConfiguration: '1 Extra-length King Bed',
      photos: [
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1000&q=80',
      ],
      newPhotoInput: '',
      videos: 'https://assets.mixkit.co/videos/preview/mixkit-modern-apartment-interior-tour-42023-large.mp4',
    },
  ]);

  // Owner Bank Account Details for payouts
  const [bankName, setBankName] = useState('First National Bank (FNB)');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [branchCode, setBranchCode] = useState('250655');
  const [accountType, setAccountType] = useState('Cheque / Current Account');

  if (!isOpen) return null;

  const toggleChannel = (channelId: string) => {
    if (channelId === 'direct') return; // ScopeBridge Direct is always registered & active
    setSelectedChannels((prev) =>
      prev.includes(channelId) ? prev.filter((c) => c !== channelId) : [...prev, channelId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const allImages = propertyPhotoList.map((u) => u.trim()).filter(Boolean);
    const finalImages =
      allImages.length > 0
        ? allImages
        : ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80'];
    const parsedVideos = parseMediaUrls(videoUrls);
    const propId = `prop-${Date.now()}`;
    const finalChannels = Array.from(new Set(['direct', ...selectedChannels]));

    const builtRooms: PropertyRoom[] = draftRooms.map((dr, idx) => {
      const cleanRoomPhotos = dr.photos.map((p) => p.trim()).filter(Boolean);
      return {
        id: `room-${Date.now()}-${idx + 1}`,
        propertyId: propId,
        name: dr.name.trim() || `Suite ${idx + 1}`,
        type: dr.type,
        basePrice: Number(dr.basePrice) || Number(basePrice),
        weekendPrice: Number(dr.weekendPrice) || Number(weekendPrice),
        maxGuests: Number(dr.maxGuests) || 2,
        bedConfiguration: dr.bedConfiguration || '1 Extra-length King Bed',
        amenities: ['Aircon', 'En-suite bathroom', 'Work desk', 'Uncapped Fibre'],
        images: cleanRoomPhotos.length > 0 ? cleanRoomPhotos : [finalImages[0]],
        videos: parseMediaUrls(dr.videos),
        publishedChannels: finalChannels,
        status: 'available',
      };
    });

    const matchedMeta = findGlobalAreaMeta(area);
    const resolvedCity = city.trim() || matchedMeta?.city || '';
    const resolvedCountry = country.trim() || matchedMeta?.country || 'South Africa';
    const resolvedRegion = globalRegion || matchedMeta?.globalRegion || 'South Africa';
    const resolvedFlag = flag || matchedMeta?.flag || '🌍';

    const newProperty: Property = {
      id: propId,
      title: title.trim(),
      unitCode: unitCode.trim() || `UNIT-${Math.floor(100 + Math.random() * 900)}`,
      area: area.trim() || resolvedCity,
      city: resolvedCity,
      country: resolvedCountry,
      globalRegion: resolvedRegion,
      flag: resolvedFlag,
      currencyCode: matchedMeta?.currencyCode || 'ZAR',
      address: address.trim(),
      basePrice: Number(basePrice),
      weekendPrice: Number(weekendPrice),
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      maxGuests: Number(maxGuests),
      rating: 5.0,
      reviewCount: 1,
      photoCount: finalImages.length,
      images: finalImages,
      videos: parsedVideos,
      guestPhotos: [],
      bankAccount: {
        bankName,
        accountName: accountName.trim() || title.trim(),
        accountNumber: accountNumber.trim() || 'Pending Verification',
        branchCode: branchCode.trim() || '250655',
        accountType,
      },
      amenities: {
        selfCheckIn,
        parking,
        wifi,
        kitchen: true,
        petFriendly: false,
        familyFriendly: true,
        solarInverter,
        swimmingPool: false,
        aircon: true,
        workspace: true,
      },
      distances: {
        ferndaleOnRepublic: '350m',
        absaCampus: '1.2 km',
        spar: '450m',
        randburgSquare: '1.6 km',
        gautrainSandton: '8.2 km',
        crestaMall: '4.5 km',
      },
      coordinates: {
        x: 35 + Math.floor(Math.random() * 35),
        y: 35 + Math.floor(Math.random() * 35),
        lat: (matchedMeta?.lat ?? -26.1076) + (Math.random() - 0.5) * 0.01,
        lng: (matchedMeta?.lng ?? 28.0567) + (Math.random() - 0.5) * 0.01,
      },
      checkInInstructions: {
        lockboxCode: String(Math.floor(1000 + Math.random() * 9000)),
        smartLockPin: `${Math.floor(1000 + Math.random() * 9000)}#`,
        wifiName: `${unitCode}_Fibre_Guest`,
        wifiPassword: 'ScopeBridgeGuest2026',
        parkingBay: 'Designated Bay #1',
        gateCode: '#8899',
        instructions: 'Enter gate code at the boom gate and enter PIN on the Yale smart keypad.',
      },
      qualityScore: 95,
      status: 'active',
      ownerId: 'owner-1',
      ownerName: accountName.trim() || 'Mdluli Nhlanhla',
      ownerWhatsApp: '+27 69 497 7018',
      channelSync: {
        airbnb: finalChannels.includes('airbnb'),
        bookingCom: finalChannels.includes('booking_com'),
        direct: true,
        lastSynced: 'Just now',
      },
      blockedDates: [],
      publishedChannels: finalChannels,
      requestedChannels: finalChannels,
      requestedGateways: ['paystack', 'ozow', 'yoco', 'payfast'],
      rooms: builtRooms,
    };

    onAddProperty(newProperty);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Add New Property to Global Portfolio</h2>
              <p className="text-xs text-slate-500">Configure global area/suburb, unit details, pricing, and amenities</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Property Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Executive Penthouse Suite, Sandton / London / Dubai"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Unit Code
              </label>
              <input
                type="text"
                value={unitCode}
                onChange={(e) => setUnitCode(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Search Location / Address *
              </label>
              <input
                type="text"
                value={areaSearchQuery}
                onChange={(e) => setAreaSearchQuery(e.target.value)}
                placeholder="Search suburb, city, or street address..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
              />
              {areaSearchQuery.trim().length > 0 && (
                <div className="mt-1 bg-white border border-slate-200 rounded-xl shadow-md max-h-40 overflow-y-auto divide-y divide-slate-100">
                  {ALL_GLOBAL_AREAS.filter((opt) => {
                    const q = areaSearchQuery.toLowerCase().trim();
                    return (
                      opt.area.toLowerCase().includes(q) ||
                      opt.city.toLowerCase().includes(q) ||
                      opt.country.toLowerCase().includes(q) ||
                      opt.defaultAddress.toLowerCase().includes(q)
                    );
                  })
                    .slice(0, 6)
                    .map((opt) => (
                      <button
                        key={opt.area}
                        type="button"
                        onClick={() => {
                          setArea(opt.area);
                          setCity(opt.city);
                          setCountry(opt.country);
                          setGlobalRegion(opt.globalRegion);
                          setFlag(opt.flag);
                          setAddress(opt.defaultAddress);
                          setAreaSearchQuery('');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-xs flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <span>
                          {opt.flag} {opt.area}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700">Populate</span>
                      </button>
                    ))}
                  <button
                    type="button"
                    onClick={() => {
                      const val = areaSearchQuery.trim();
                      setAddress(val);
                      if (!area) setArea(val);
                      setAreaSearchQuery('');
                    }}
                    className="w-full text-left px-3 py-2 bg-slate-50 hover:bg-emerald-50 text-xs font-bold text-emerald-800 cursor-pointer"
                  >
                    + Populate with searched address: &ldquo;{areaSearchQuery.trim()}&rdquo;
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Populated Area / Suburb
              </label>
              <input
                type="text"
                value={area}
                readOnly
                placeholder="Empty — search above"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                City
              </label>
              <input
                type="text"
                value={city}
                readOnly
                placeholder="Empty — search above"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Country & Global Region
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={country}
                  readOnly
                  placeholder="Country"
                  className="w-1/2 px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-hidden"
                />
                <select
                  value={globalRegion}
                  onChange={(e) => setGlobalRegion(e.target.value as any)}
                  className="w-1/2 px-2 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                >
                  <option value="South Africa">🇿🇦 SA / Africa</option>
                  <option value="Europe">🇪🇺 Europe & UK</option>
                  <option value="Middle East">🇦🇪 Middle East</option>
                  <option value="North America">🇺🇸 Americas</option>
                  <option value="Asia Pacific">🌏 Asia-Pacific</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Physical Street Address (Populated When Searched)
              </label>
              {(address || area) && (
                <button
                  type="button"
                  onClick={() => {
                    setAddress('');
                    setArea('');
                    setCity('');
                    setCountry('');
                  }}
                  className="text-[10px] font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                >
                  Clear Address
                </button>
              )}
            </div>
            <input
              type="text"
              value={address}
              readOnly
              placeholder="Address field is empty — search above to populate"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-100 text-sm text-slate-800 placeholder:text-slate-400 outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Base Nightly Rate (ZAR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm font-bold text-slate-500">R</span>
                <input
                  type="number"
                  min="200"
                  step="10"
                  value={basePrice}
                  onChange={(e) => setBasePrice(Number(e.target.value))}
                  className="w-full pl-8 pr-3.5 py-2 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Weekend Rate (ZAR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm font-bold text-slate-500">R</span>
                <input
                  type="number"
                  min="200"
                  step="10"
                  value={weekendPrice}
                  onChange={(e) => setWeekendPrice(Number(e.target.value))}
                  className="w-full pl-8 pr-3.5 py-2 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Bedrooms
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={bedrooms}
                onChange={(e) => setBedrooms(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Bathrooms
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={bathrooms}
                onChange={(e) => setBathrooms(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Max Guests
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={maxGuests}
                onChange={(e) => setMaxGuests(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>
          </div>

          {/* Interactive Property Photos (Add, Update, Delete) */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <span>Property Photos — Add, Update & Delete ({propertyPhotoList.length} Photos)</span>
              </h3>
              <label className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors">
                <Upload className="w-3 h-3" />
                <span>Upload Photo from Device</span>
                <input
                  type="file"
                  accept="image/*,.heic,.heif,.jpg,.jpeg,.png,.webp,.gif,.svg,.bmp,.avif"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const dataUrl = await compressImageToDataUrl(file);
                    setPropertyPhotoList((prev) => [...prev, dataUrl]);
                  }}
                />
              </label>
            </div>

            {/* Add Property Photo by URL */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newPropertyPhotoUrl}
                onChange={(e) => setNewPropertyPhotoUrl(e.target.value)}
                placeholder="Paste image URL to add to property gallery..."
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newPropertyPhotoUrl.trim()) return;
                  setPropertyPhotoList((prev) => [...prev, newPropertyPhotoUrl.trim()]);
                  setNewPropertyPhotoUrl('');
                }}
                className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Photo
              </button>
            </div>

            {/* Visual Property Photos Grid with Update & Delete */}
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {propertyPhotoList.map((photoUrl, pIdx) => (
                <div
                  key={`prop-photo-${pIdx}`}
                  className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-xl border border-slate-200"
                >
                  <img
                    src={photoUrl}
                    alt={`Property ${pIdx + 1}`}
                    className="w-14 h-11 rounded-lg object-cover border border-slate-300 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900">
                        {pIdx === 0 ? 'Primary Cover' : `Photo #${pIdx + 1}`}
                      </span>
                      {pIdx > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setPropertyPhotoList((prev) => {
                              const copy = [...prev];
                              const [selected] = copy.splice(pIdx, 1);
                              return [selected, ...copy];
                            });
                          }}
                          className="text-[9px] font-bold text-emerald-700 hover:underline cursor-pointer"
                        >
                          Set as Cover
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={photoUrl}
                      onChange={(e) => {
                        const updatedVal = e.target.value;
                        setPropertyPhotoList((prev) =>
                          prev.map((item, idx) => (idx === pIdx ? updatedVal : item))
                        );
                      }}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-mono text-slate-700"
                      title="Update photo URL"
                    />
                  </div>
                  <label
                    className="p-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 rounded-lg cursor-pointer"
                    title="Replace Photo from Device"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <input
                      type="file"
                      accept="image/*,.heic,.heif,.jpg,.jpeg,.png,.webp,.gif,.svg,.bmp,.avif"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const dataUrl = await compressImageToDataUrl(file);
                        setPropertyPhotoList((prev) =>
                          prev.map((item, idx) => (idx === pIdx ? dataUrl : item))
                        );
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setPropertyPhotoList((prev) => prev.filter((_, idx) => idx !== pIdx))
                    }
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg cursor-pointer"
                    title="Delete Property Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Property Walkthrough Video URLs (MP4 / YouTube / Vimeo)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const sample = 'https://assets.mixkit.co/videos/preview/mixkit-modern-apartment-interior-tour-42023-large.mp4';
                    setVideoUrls((prev) => (prev.trim() ? `${prev.trim()}, ${sample}` : sample));
                  }}
                  className="px-2.5 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Video className="w-3 h-3" />
                  <span>+ Sample HD Video</span>
                </button>
              </div>
              <textarea
                rows={2}
                value={videoUrls}
                onChange={(e) => setVideoUrls(e.target.value)}
                placeholder="https://example.com/property-tour.mp4"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono"
              />
            </div>
          </div>

          {/* Rooms & Room Photos Manager (Add, Update, Delete Room Photos & Add Rooms) */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <BedDouble className="w-4 h-4 text-indigo-600" />
                <span>Rooms & Room Photos ({draftRooms.length} Rooms Added)</span>
              </h3>
              <button
                type="button"
                onClick={() =>
                  setDraftRooms((prev) => [
                    ...prev,
                    {
                      id: `draft-room-${Date.now()}`,
                      name: `Deluxe Suite #${prev.length + 1}`,
                      type: 'deluxe_room',
                      basePrice: Number(basePrice),
                      weekendPrice: Number(weekendPrice),
                      maxGuests: 2,
                      bedConfiguration: '1 Queen Bed',
                      photos: [
                        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1000&q=80',
                      ],
                      newPhotoInput: '',
                      videos: '',
                    },
                  ])
                }
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Add Another Room
              </button>
            </div>

            <div className="space-y-3">
              {draftRooms.map((dr, rIdx) => (
                <div
                  key={dr.id}
                  className="p-3.5 bg-indigo-50/40 rounded-2xl border border-indigo-200/80 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-indigo-950">
                      Room #{rIdx + 1}: {dr.name}
                    </span>
                    {draftRooms.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setDraftRooms((prev) => prev.filter((_, idx) => idx !== rIdx))
                        }
                        className="text-[10px] font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" /> Remove Room
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                        Room Name
                      </label>
                      <input
                        type="text"
                        value={dr.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDraftRooms((prev) =>
                            prev.map((item, idx) => (idx === rIdx ? { ...item, name: val } : item))
                          );
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                        Room Nightly Rate (ZAR)
                      </label>
                      <input
                        type="number"
                        value={dr.basePrice}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setDraftRooms((prev) =>
                            prev.map((item, idx) =>
                              idx === rIdx ? { ...item, basePrice: val } : item
                            )
                          );
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                      />
                    </div>
                  </div>

                  {/* Room Photos Add / Update / Delete */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-700 uppercase">
                        Room Photos ({dr.photos.length}) — Add, Update or Delete
                      </span>
                      <label className="px-2 py-0.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-900 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer">
                        <Upload className="w-3 h-3" /> Upload Room Photo
                        <input
                          type="file"
                          accept="image/*,.heic,.heif,.jpg,.jpeg,.png,.webp,.gif,.svg,.bmp,.avif"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const dataUrl = await compressImageToDataUrl(file);
                            setDraftRooms((prev) =>
                              prev.map((item, idx) =>
                                idx === rIdx
                                  ? { ...item, photos: [...item.photos, dataUrl] }
                                  : item
                              )
                            );
                          }}
                        />
                      </label>
                    </div>

                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={dr.newPhotoInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDraftRooms((prev) =>
                            prev.map((item, idx) =>
                              idx === rIdx ? { ...item, newPhotoInput: val } : item
                            )
                          );
                        }}
                        placeholder="Paste room photo URL..."
                        className="flex-1 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-[11px] font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!dr.newPhotoInput.trim()) return;
                          setDraftRooms((prev) =>
                            prev.map((item, idx) =>
                              idx === rIdx
                                ? {
                                    ...item,
                                    photos: [...item.photos, item.newPhotoInput.trim()],
                                    newPhotoInput: '',
                                  }
                                : item
                            )
                          );
                        }}
                        className="px-2.5 py-1 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        + Add
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {dr.photos.map((rPhoto, rpIdx) => (
                        <div
                          key={`rm-${rIdx}-ph-${rpIdx}`}
                          className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-slate-200"
                        >
                          <img
                            src={rPhoto}
                            alt="Room"
                            className="w-11 h-9 rounded object-cover border border-slate-200 shrink-0"
                          />
                          <input
                            type="text"
                            value={rPhoto}
                            onChange={(e) => {
                              const newUrl = e.target.value;
                              setDraftRooms((prev) =>
                                prev.map((item, idx) =>
                                  idx === rIdx
                                    ? {
                                        ...item,
                                        photos: item.photos.map((p, i) =>
                                          i === rpIdx ? newUrl : p
                                        ),
                                      }
                                    : item
                                )
                              );
                            }}
                            className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] font-mono"
                            title="Update Room Photo URL"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setDraftRooms((prev) =>
                                prev.map((item, idx) =>
                                  idx === rIdx
                                    ? {
                                        ...item,
                                        photos: item.photos.filter((_, i) => i !== rpIdx),
                                      }
                                    : item
                                )
                              )
                            }
                            className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded border border-rose-200 cursor-pointer"
                            title="Delete Room Photo"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Registered & Visible Booking Channels Selector */}
          <div className="space-y-2.5 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span>Channels Property is Visible On & Owner Registered In</span>
              </h3>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full">
                {selectedChannels.length} Channels Selected
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Select the channels where this property and all its rooms are registered and visible when published. ScopeBridge Direct is always active.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AVAILABLE_CHANNELS.map((ch) => {
                const active = selectedChannels.includes(ch.id);
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => toggleChannel(ch.id)}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      active
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <div className="truncate pr-1">
                      <span className="text-[11px] block truncate">{ch.name}</span>
                      <span className="text-[9px] text-slate-400 block">{ch.badge}</span>
                    </div>
                    <span
                      className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] shrink-0 ${
                        active ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      {active ? '✓' : '+'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-purple-600" />
              <span>Owner Bank Account (For Direct Rental Payouts)</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Bank Name
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
                >
                  <option value="First National Bank (FNB)">First National Bank (FNB)</option>
                  <option value="Standard Bank">Standard Bank</option>
                  <option value="Absa Bank">Absa Bank</option>
                  <option value="Nedbank">Nedbank</option>
                  <option value="Capitec Bank">Capitec Bank</option>
                  <option value="TymeBank">TymeBank</option>
                  <option value="Investec">Investec</option>
                  <option value="Barclays / HSBC / International">Barclays / HSBC / International</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Account Type
                </label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
                >
                  <option value="Cheque / Current Account">Cheque / Current Account</option>
                  <option value="Savings Account">Savings Account</option>
                  <option value="Business Account">Business Account</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. Nhlanhla Mdluli Trading"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 62890192837"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Branch Code
                </label>
                <input
                  type="text"
                  value={branchCode}
                  onChange={(e) => setBranchCode(e.target.value)}
                  placeholder="e.g. 250655"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200">
            <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Key Amenities
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={solarInverter}
                  onChange={(e) => setSolarInverter(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Solar & Lithium Inverter (Load shedding free)</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selfCheckIn}
                  onChange={(e) => setSelfCheckIn(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Self Check-in (Smart Lock)</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={parking}
                  onChange={(e) => setParking(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Covered Parking Bay</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wifi}
                  onChange={(e) => setWifi(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Uncapped High-Speed Fibre</span>
              </label>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Property</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

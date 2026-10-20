import React, { useState } from 'react';
import { Property, ChannelConfig, PropertyRoom } from '../../types';
import { BedDouble, Plus, DollarSign, Globe, Check, Tag, Sparkles, Building, Sliders, Trash2, Edit3, Save, X, Upload, Video } from 'lucide-react';
import { parseMediaUrls, compressImageToDataUrl } from '../../lib/firebase';

interface RoomsPricingManagerProps {
  properties: Property[];
  channels: ChannelConfig[];
  onUpdateProperties: React.Dispatch<React.SetStateAction<Property[]>>;
  onPublishRoomToChannel: (propertyId: string, roomId: string, channelId: string, publish: boolean) => void;
}

export const RoomsPricingManager: React.FC<RoomsPricingManagerProps> = ({
  properties,
  channels,
  onUpdateProperties,
  onPublishRoomToChannel,
}) => {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(properties[0]?.id || '');
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);

  // New room state
  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState<PropertyRoom['type']>('master_suite');
  const [bedConfig, setBedConfig] = useState('1 Extra-length King Bed');
  const [basePrice, setBasePrice] = useState(850);
  const [weekendPrice, setWeekendPrice] = useState(1050);
  const [corporatePrice, setCorporatePrice] = useState(780);
  const [surgeMultiplier, setSurgeMultiplier] = useState(1.15);
  const [maxGuests, setMaxGuests] = useState(2);
  const [roomImages, setRoomImages] = useState('');
  const [roomVideos, setRoomVideos] = useState('');

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId) || properties[0];

  // Default rooms if property doesn't have rooms yet
  const rooms: PropertyRoom[] = selectedProperty?.rooms && selectedProperty.rooms.length > 0
    ? selectedProperty.rooms
    : [
        {
          id: `room-${selectedProperty?.id || '1'}-main`,
          propertyId: selectedProperty?.id || 'prop-1',
          name: 'Main Executive Suite',
          type: 'master_suite',
          basePrice: selectedProperty?.basePrice || 850,
          weekendPrice: selectedProperty?.weekendPrice || 1050,
          corporatePrice: Math.round((selectedProperty?.basePrice || 850) * 0.9),
          surgeMultiplier: 1.15,
          maxGuests: selectedProperty?.maxGuests || 2,
          bedConfiguration: '1 Extra-length King Bed',
          amenities: ['En-suite Bathroom', 'Aircon', 'Workstation', 'Balcony'],
          images: selectedProperty?.images || [],
          publishedChannels: selectedProperty?.publishedChannels || ['direct', 'airbnb', 'booking_com'],
          status: 'available',
        },
      ];

  const handleSaveRoomPrice = (roomId: string, newBase: number, newWeekend: number, newCorp: number) => {
    onUpdateProperties((prev) =>
      prev.map((p) => {
        if (p.id === selectedPropertyId) {
          const currentRooms = p.rooms || rooms;
          const updatedRooms = currentRooms.map((r) =>
            r.id === roomId
              ? {
                  ...r,
                  basePrice: newBase,
                  weekendPrice: newWeekend,
                  corporatePrice: newCorp,
                }
              : r
          );
          return { ...p, rooms: updatedRooms };
        }
        return p;
      })
    );
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim() || !selectedProperty) return;

    const parsedImages = parseMediaUrls(roomImages);
    const parsedVideos = parseMediaUrls(roomVideos);

    const newRoom: PropertyRoom = {
      id: `room-${Date.now()}`,
      propertyId: selectedProperty.id,
      name: roomName.trim(),
      type: roomType,
      basePrice: Number(basePrice),
      weekendPrice: Number(weekendPrice),
      corporatePrice: Number(corporatePrice),
      surgeMultiplier: Number(surgeMultiplier),
      maxGuests: Number(maxGuests),
      bedConfiguration: bedConfig,
      amenities: ['Aircon', 'En-suite bathroom', 'Fast WiFi'],
      images: parsedImages.length > 0 ? parsedImages : selectedProperty.images,
      videos: parsedVideos,
      publishedChannels: ['direct', 'airbnb'],
      status: 'available',
    };

    onUpdateProperties((prev) =>
      prev.map((p) => {
        if (p.id === selectedProperty.id) {
          const existing = p.rooms || rooms;
          return { ...p, rooms: [...existing, newRoom] };
        }
        return p;
      })
    );

    setRoomName('');
    setIsAddRoomOpen(false);
  };

  if (!selectedProperty) {
    return (
      <div className="p-8 text-center text-slate-500">
        No properties found. Please add a property first.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Property Selector Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Rooms & Dynamic Pricing Manager</h2>
            <span className="text-[11px] bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
              Live Room Control
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure room types, weekend rates, corporate discounts, and channel distribution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-slate-50 outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            {properties.map((prop) => (
              <option key={prop.id} value={prop.id}>
                {prop.title} ({prop.unitCode})
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsAddRoomOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Room</span>
          </button>
        </div>
      </div>

      {/* Add Room Modal */}
      {isAddRoomOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Add Room to {selectedProperty.title}</h3>
              <button onClick={() => setIsAddRoomOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Room / Suite Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Executive Suite or Garden Studio"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Room Category</label>
                  <select
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value as PropertyRoom['type'])}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-hidden bg-white"
                  >
                    <option value="master_suite">Master En-Suite</option>
                    <option value="deluxe_room">Deluxe Room</option>
                    <option value="studio">Studio</option>
                    <option value="family_room">Family Suite</option>
                    <option value="cottage">Private Garden Cottage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bed Configuration</label>
                  <input
                    type="text"
                    value={bedConfig}
                    onChange={(e) => setBedConfig(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Base Rate (ZAR)</label>
                  <input
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-hidden font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Weekend Rate</label>
                  <input
                    type="number"
                    value={weekendPrice}
                    onChange={(e) => setWeekendPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-hidden font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Corporate Rate</label>
                  <input
                    type="number"
                    value={corporatePrice}
                    onChange={(e) => setCorporatePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-hidden font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Room Pictures (Comma-separated Image URLs)</label>
                  <label className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer">
                    <Upload className="w-3 h-3" />
                    <span>Upload Room Photo</span>
                    <input
                      type="file"
                      accept="image/*,.heic,.heif,.jpg,.jpeg,.png,.webp,.gif,.svg,.bmp,.avif"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const dataUrl = await compressImageToDataUrl(file);
                        setRoomImages((prev) => (prev.trim() ? `${prev.trim()}\n${dataUrl}` : dataUrl));
                      }}
                    />
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="https://image1.jpg, https://image2.jpg"
                  value={roomImages}
                  onChange={(e) => setRoomImages(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-hidden font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Room Video Tour URLs (Comma-separated MP4/YouTube/Vimeo)</label>
                  <button
                    type="button"
                    onClick={() => {
                      const sampleVid = 'https://assets.mixkit.co/videos/preview/mixkit-modern-apartment-interior-tour-42023-large.mp4';
                      setRoomVideos((prev) => (prev.trim() ? `${prev.trim()}, ${sampleVid}` : sampleVid));
                    }}
                    className="px-2 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Video className="w-3 h-3" />
                    <span>+ Sample Room Video</span>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="https://example.com/room-video.mp4"
                  value={roomVideos}
                  onChange={(e) => setRoomVideos(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-hidden font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddRoomOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rooms Grid */}
      <div className="space-y-4">
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            propertyId={selectedProperty.id}
            channels={channels}
            onSavePrice={(newBase, newWeekend, newCorp) =>
              handleSaveRoomPrice(room.id, newBase, newWeekend, newCorp)
            }
            onToggleChannel={(channelId, publish) =>
              onPublishRoomToChannel(selectedProperty.id, room.id, channelId, publish)
            }
            onRemoveRoom={() => {
              if (window.confirm(`Are you absolutely sure you want to permanently remove the room "${room.name}"?`)) {
                onUpdateProperties((prev) =>
                  prev.map((p) => {
                    if (p.id === selectedProperty.id) {
                      const currentRooms = p.rooms || rooms;
                      const updatedRooms = currentRooms.filter((r) => r.id !== room.id);
                      return { ...p, rooms: updatedRooms };
                    }
                    return p;
                  })
                );
              }
            }}
            onEditRoom={(updated) => {
              onUpdateProperties((prev) =>
                prev.map((p) => {
                  if (p.id === selectedProperty.id) {
                    const currentRooms = p.rooms || rooms;
                    const updatedRooms = currentRooms.map((r) =>
                      r.id === room.id ? { ...r, ...updated } : r
                    );
                    return { ...p, rooms: updatedRooms };
                  }
                  return p;
                })
              );
            }}
          />
        ))}
      </div>
    </div>
  );
};

interface RoomCardProps {
  room: PropertyRoom;
  propertyId: string;
  channels: ChannelConfig[];
  onSavePrice: (base: number, weekend: number, corp: number) => void;
  onToggleChannel: (channelId: string, publish: boolean) => void;
  onRemoveRoom: () => void;
  onEditRoom: (updatedFields: Partial<PropertyRoom>) => void;
}

const RoomCard: React.FC<RoomCardProps> = ({
  room,
  channels,
  onSavePrice,
  onToggleChannel,
  onRemoveRoom,
  onEditRoom,
}) => {
  const [base, setBase] = useState(room.basePrice);
  const [weekend, setWeekend] = useState(room.weekendPrice);
  const [corp, setCorp] = useState(room.corporatePrice || Math.round(room.basePrice * 0.9));
  const [isSaved, setIsSaved] = useState(false);

  // States for local editing
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editName, setEditName] = useState(room.name);
  const [editType, setEditType] = useState<PropertyRoom['type']>(room.type);
  const [editBedConfig, setEditBedConfig] = useState(room.bedConfiguration);
  const [editMaxGuests, setEditMaxGuests] = useState(room.maxGuests);
  const [editImages, setEditImages] = useState((room.images || []).join(', '));
  const [editVideos, setEditVideos] = useState((room.videos || []).join(', '));

  const handleSaveDetails = () => {
    const parsedImages = parseMediaUrls(editImages);
    const parsedVideos = parseMediaUrls(editVideos);

    onEditRoom({
      name: editName,
      type: editType,
      bedConfiguration: editBedConfig,
      maxGuests: Number(editMaxGuests),
      images: parsedImages,
      videos: parsedVideos,
    });
    setIsEditingDetails(false);
  };

  const handleSave = () => {
    onSavePrice(base, weekend, corp);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const publishedChannels = room.publishedChannels || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 hover:border-slate-300 transition-all space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <BedDouble className="w-5 h-5 text-emerald-800" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm">{room.name}</h3>
              <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                {room.bedConfiguration}
              </span>
            </div>
            <p className="text-xs text-slate-500">Max {room.maxGuests} guests • {room.type.replace('_', ' ')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsEditingDetails(!isEditingDetails)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer"
              title="Edit Room Details"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onRemoveRoom}
              className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              title="Remove Room"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
            <span className="text-[11px] text-slate-500">Channels:</span>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              {publishedChannels.length} active
            </span>
          </div>
        </div>
      </div>

      {/* Details Editing Form Toggle */}
      {isEditingDetails && (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
            <span className="font-bold text-slate-800">Edit Room Configuration</span>
            <button
              onClick={() => setIsEditingDetails(false)}
              className="text-slate-400 hover:text-slate-600 text-[11px] font-bold cursor-pointer"
            >
              ✕ Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                Room Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg outline-hidden text-slate-800 focus:ring-1 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                Room Type
              </label>
              <select
                value={editType}
                onChange={(e) => setEditType(e.target.value as any)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white outline-hidden text-slate-800 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="master_suite">Master Suite</option>
                <option value="deluxe_room">Deluxe Room</option>
                <option value="studio">Studio</option>
                <option value="family_room">Family Room</option>
                <option value="cottage">Cottage</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                Bed Configuration
              </label>
              <input
                type="text"
                value={editBedConfig}
                onChange={(e) => setEditBedConfig(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg outline-hidden text-slate-800 focus:ring-1 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                Max Guests Capacity
              </label>
              <input
                type="number"
                value={editMaxGuests}
                onChange={(e) => setEditMaxGuests(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg outline-hidden text-slate-800 focus:ring-1 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-slate-200/60">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                  Room Photos — Add, Update or Delete ({parseMediaUrls(editImages).length} Photos)
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const sampleImg = 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80';
                      const list = parseMediaUrls(editImages);
                      setEditImages([...list, sampleImg].join(', '));
                    }}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold cursor-pointer"
                  >
                    + Add Photo URL
                  </button>
                  <label className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer">
                    <Upload className="w-3 h-3" />
                    <span>Upload Room Photo</span>
                    <input
                      type="file"
                      accept="image/*,.heic,.heif,.jpg,.jpeg,.png,.webp,.gif,.svg,.bmp,.avif"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const dataUrl = await compressImageToDataUrl(file);
                        setEditImages((prev) => (prev.trim() ? `${prev.trim()}\n${dataUrl}` : dataUrl));
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Individual Room Photo Rows for Update & Delete */}
              <div className="space-y-1.5 mb-2">
                {parseMediaUrls(editImages).map((imgUrl, idx) => (
                  <div key={`edit-rm-img-${idx}`} className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-slate-200">
                    <img src={imgUrl} alt="Room preview" className="w-12 h-9 rounded object-cover border border-slate-200 shrink-0" />
                    <input
                      type="text"
                      value={imgUrl}
                      onChange={(e) => {
                        const list = parseMediaUrls(editImages);
                        list[idx] = e.target.value;
                        setEditImages(list.join(', '));
                      }}
                      className="flex-1 px-2 py-1 border border-slate-200 rounded text-[10px] font-mono text-slate-800 bg-slate-50"
                      placeholder="Update room photo URL..."
                    />
                    <label
                      className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded border border-emerald-200 cursor-pointer"
                      title="Replace Photo from Device"
                    >
                      <Upload className="w-3 h-3" />
                      <input
                        type="file"
                        accept="image/*,.heic,.heif,.jpg,.jpeg,.png,.webp,.gif,.svg,.bmp,.avif"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const dataUrl = await compressImageToDataUrl(file);
                          const list = parseMediaUrls(editImages);
                          list[idx] = dataUrl;
                          setEditImages(list.join('\n'));
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const list = parseMediaUrls(editImages).filter((_, i) => i !== idx);
                        setEditImages(list.join(', '));
                      }}
                      className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded border border-rose-200 cursor-pointer"
                      title="Delete Room Photo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              <input
                type="text"
                value={editImages}
                onChange={(e) => setEditImages(e.target.value)}
                placeholder="https://image1.jpg, https://image2.jpg"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg outline-hidden text-slate-800 text-[11px] font-mono focus:ring-1 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Room Video Tour URLs (Comma-separated MP4/YouTube/Vimeo)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const sampleVid = 'https://assets.mixkit.co/videos/preview/mixkit-modern-apartment-interior-tour-42023-large.mp4';
                    setEditVideos((prev) => (prev.trim() ? `${prev.trim()}, ${sampleVid}` : sampleVid));
                  }}
                  className="px-2 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Video className="w-3 h-3" />
                  <span>+ Add Sample Room Video</span>
                </button>
              </div>
              <input
                type="text"
                value={editVideos}
                onChange={(e) => setEditVideos(e.target.value)}
                placeholder="https://example.com/room-video.mp4"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg outline-hidden text-slate-800 text-[11px] font-mono focus:ring-1 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1 border-t border-slate-200/50">
            <button
              onClick={() => setIsEditingDetails(false)}
              className="px-3 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveDetails}
              className="px-4 py-1 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <Save className="w-3 h-3" />
              <span>Apply Details</span>
            </button>
          </div>
        </div>
      )}

      {/* Room Media Strip (Pictures & Videos with Quick Add, Update & Delete) */}
      <div className="flex items-center gap-2 overflow-x-auto py-1">
        {(room.images || []).map((img, idx) => (
          <div key={`r-img-${idx}`} className="relative group shrink-0">
            <img
              src={img}
              alt={`${room.name} ${idx + 1}`}
              className="w-24 h-16 rounded-lg object-cover border border-slate-200"
            />
            <button
              type="button"
              onClick={() => {
                const updatedImgs = (room.images || []).filter((_, i) => i !== idx);
                setEditImages(updatedImgs.join(', '));
                onEditRoom({ images: updatedImgs });
              }}
              className="absolute top-1 right-1 p-1 bg-rose-600/90 hover:bg-rose-700 text-white rounded-md opacity-90 group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Delete Room Photo"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
        <label className="w-24 h-16 rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800 flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold shrink-0 cursor-pointer transition-colors">
          <Plus className="w-4 h-4 text-emerald-700" />
          <span>Add Photo</span>
          <input
            type="file"
            accept="image/*,.heic,.heif,.jpg,.jpeg,.png,.webp,.gif,.svg,.bmp,.avif"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const dataUrl = await compressImageToDataUrl(file);
              const nextImgs = [...(room.images || []), dataUrl];
              setEditImages(nextImgs.join('\n'));
              onEditRoom({ images: nextImgs });
            }}
          />
        </label>
        {room.videos?.map((vid, vIdx) => (
          <div
            key={`r-vid-${vIdx}`}
            className="w-28 h-16 rounded-lg overflow-hidden border border-purple-300 bg-slate-900 shrink-0 relative"
          >
            {vid.includes('mp4') || vid.includes('mixkit') || vid.includes('video') ? (
              <video src={vid} controls className="w-full h-full object-cover" />
            ) : (
              <a
                href={vid}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-full flex items-center justify-center text-[10px] font-bold text-purple-300 hover:underline px-1 text-center"
              >
                🎥 Room Video #{vIdx + 1}
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Pricing Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
            Base Nightly (Mon-Thu)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">R</span>
            <input
              type="number"
              value={base}
              onChange={(e) => setBase(Number(e.target.value))}
              className="w-full pl-7 pr-3 py-1.5 text-xs font-bold border border-slate-300 rounded-xl outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
            Weekend (Fri-Sun)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">R</span>
            <input
              type="number"
              value={weekend}
              onChange={(e) => setWeekend(Number(e.target.value))}
              className="w-full pl-7 pr-3 py-1.5 text-xs font-bold border border-slate-300 rounded-xl outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
            Absa Corporate Rate
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">R</span>
            <input
              type="number"
              value={corp}
              onChange={(e) => setCorp(Number(e.target.value))}
              className="w-full pl-7 pr-3 py-1.5 text-xs font-bold text-emerald-800 border border-slate-300 rounded-xl outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <button
            onClick={handleSave}
            className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
              isSaved
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : null}
            <span>{isSaved ? 'Rates Saved!' : 'Save Pricing'}</span>
          </button>
        </div>
      </div>

      {/* Channel Distribution Checklist */}
      <div className="pt-2 border-t border-slate-100">
        <span className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
          Distribute Room to Connected OTA Channels
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {channels
            .filter((c) => c.status === 'connected')
            .map((ch) => {
              const isPublished = publishedChannels.includes(ch.id);
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => onToggleChannel(ch.id, !isPublished)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    isPublished
                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <span>{ch.logo}</span>
                    <span className="truncate">{ch.name.split(' ')[0]}</span>
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                      isPublished ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isPublished ? 'Live' : 'Off'}
                  </span>
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
};

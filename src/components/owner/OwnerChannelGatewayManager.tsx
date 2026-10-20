import React, { useState, useEffect } from 'react';
import { Property, ChannelConfig, PaymentGatewayConfig, OwnerAccessRequest, Booking, BankAccountDetails } from '../../types';
import { Globe, CreditCard, Send, Plus, CheckCircle2, Clock, XCircle, AlertCircle, Building, Check, Key, Code, MonitorPlay, ExternalLink, RefreshCw, Star, MapPin, Calendar, Users, Eye, Coffee, Shield, Building2, Wallet, ArrowUpRight, DollarSign, ShieldCheck, Copy } from 'lucide-react';
import { PLATFORM_CONFIG } from '../../data/platformConfig';

interface OwnerChannelGatewayManagerProps {
  properties: Property[];
  channels: ChannelConfig[];
  gateways: PaymentGatewayConfig[];
  requests: OwnerAccessRequest[];
  onSubmitRequest: (request: Omit<OwnerAccessRequest, 'id' | 'createdAt' | 'status'>) => void;
  onPublishPropertyToChannel: (propertyId: string, channelId: string, publish: boolean) => void;
  onBookProperty?: (bookingData: Omit<Booking, 'id' | 'createdAt'>) => void;
}

export const OwnerChannelGatewayManager: React.FC<OwnerChannelGatewayManagerProps> = ({
  properties,
  channels,
  gateways,
  requests,
  onSubmitRequest,
  onPublishPropertyToChannel,
  onBookProperty,
}) => {
  const [selectedPropertyId, setSelectedPropertyId] = useState(properties[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'channels' | 'gateways' | 'banking' | 'requests'>('channels');

  // Owner Payout Bank Accounts State
  const [ownerBankAccounts, setOwnerBankAccounts] = useState<BankAccountDetails[]>(() => {
    try {
      const stored = localStorage.getItem('scopebridg_owner_bank_accounts');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      {
        bankName: 'First National Bank (FNB)',
        accountName: 'Mdluli Nhlanhla (Host)',
        accountNumber: '62819204918',
        branchCode: '250655',
        accountType: 'Cheque / Current Account',
      },
    ];
  });
  const [isAddOwnerBankOpen, setIsAddOwnerBankOpen] = useState(false);
  const [ownerNewBankName, setOwnerNewBankName] = useState('First National Bank (FNB)');
  const [ownerNewAccountName, setOwnerNewAccountName] = useState('Mdluli Nhlanhla');
  const [ownerNewAccountNumber, setOwnerNewAccountNumber] = useState('');
  const [ownerNewBranchCode, setOwnerNewBranchCode] = useState('250655');
  const [ownerNewAccountType, setOwnerNewAccountType] = useState('Cheque / Current Account');

  // Payout & Commission Action State
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState<string | null>(null);
  const [isPayingCommission, setIsPayingCommission] = useState(false);
  const [commissionAmount, setCommissionAmount] = useState(650);

  const adminBank = PLATFORM_CONFIG.mainAdminBankAccount;

  // Request modal state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestType, setRequestType] = useState<'channel' | 'payment_gateway'>('channel');
  const [targetId, setTargetId] = useState('');
  const [action, setAction] = useState<'connect' | 'disconnect'>('connect');
  const [reason, setReason] = useState('');
  const [bankName, setBankName] = useState('First National Bank (FNB)');
  const [accountNumber, setAccountNumber] = useState('');

  // Real-world channel syncing variables
  const [channelCredentials, setChannelCredentials] = useState<Record<string, { apiKey: string; clientId: string }>>(() => {
    try {
      const stored = localStorage.getItem('ferndalestay_channel_creds');
      return stored ? JSON.parse(stored) : {
        airbnb: { apiKey: 'ab_live_94k20kdls8d', clientId: 'c-8820' },
        booking_com: { apiKey: 'bk_prod_381018274kld', clientId: 'bk-hotel-8902' },
        agoda: { apiKey: 'ag_token_881920dkla', clientId: 'agoda-direct-2' }
      };
    } catch {
      return {};
    }
  });

  const [syncLogs, setSyncLogs] = useState<string[]>([
    `[${new Date().toISOString()}] OTA Distribution Engine ready. Check connection status or toggle publish.`
  ]);
  const [isSyncingChannelId, setIsSyncingChannelId] = useState<string | null>(null);
  const [editingCredsChannelId, setEditingCredsChannelId] = useState<string | null>(null);
  const [tempApiKey, setTempApiKey] = useState<string>('');
  const [tempClientId, setTempClientId] = useState<string>('');
  const [testingGatewayId, setTestingGatewayId] = useState<string | null>(null);
  const [gatewayTestResult, setGatewayTestResult] = useState<Record<string, string>>({});
  const [showPortalSimulator, setShowPortalSimulator] = useState<boolean>(false);
  const [simulatorChannelId, setSimulatorChannelId] = useState<string>('booking_com');

  // Simulator booking state
  const [simCheckIn, setSimCheckIn] = useState('2026-09-24');
  const [simNights, setSimNights] = useState(3);
  const [simGuests, setSimGuests] = useState(2);
  const [simName, setSimName] = useState('Sarah Jenkins');
  const [simEmail, setSimEmail] = useState('sarah.j@example.com');
  const [simPhone, setSimPhone] = useState('+27 71 888 2911');
  const [simBookingConfirmed, setSimBookingConfirmed] = useState<boolean>(false);

  const saveCredentials = (channelId: string, apiKey: string, clientId: string) => {
    const updated = {
      ...channelCredentials,
      [channelId]: { apiKey, clientId }
    };
    setChannelCredentials(updated);
    localStorage.setItem('ferndalestay_channel_creds', JSON.stringify(updated));
    setSyncLogs((prev) => [...prev, `[CLIENT] Credentials updated & saved securely for ${channelId.toUpperCase()}`]);
  };

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId) || properties[0];

  const triggerChannelPublish = async (channelId: string, publish: boolean) => {
    if (!selectedProperty) return;
    setIsSyncingChannelId(channelId);
    
    setSyncLogs((prev) => [
      ...prev,
      `[${new Date().toISOString()}] Preparing real-world API sync for "${selectedProperty.title}"`,
      `[${new Date().toISOString()}] Target Channel Service Provider: ${channelId.toUpperCase()}`
    ]);

    try {
      const res = await fetch('/api/channels/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: selectedProperty.id,
          propertyTitle: selectedProperty.title,
          address: selectedProperty.address,
          basePrice: selectedProperty.basePrice,
          currencyCode: selectedProperty.currencyCode || 'ZAR',
          channelId,
          publish,
          credentials: channelCredentials[channelId] || null
        })
      });

      const data = await res.json();
      if (data.success) {
        setSyncLogs((prev) => [...prev, ...data.apiLogs, `[${new Date().toISOString()}] SYNC VERIFIED: Property is now active and live on ${channelId}.`]);
        onPublishPropertyToChannel(selectedProperty.id, channelId, publish);
      } else {
        setSyncLogs((prev) => [...prev, `[${new Date().toISOString()}] ERROR: Connection handshakes failed. ${data.details || 'Server timeout'}`]);
      }
    } catch (err: any) {
      setSyncLogs((prev) => [...prev, `[${new Date().toISOString()}] EXCEPTION: Network error. Failed to reach external server: ${err.message}`]);
    } finally {
      setIsSyncingChannelId(null);
    }
  };

  const handleOpenRequest = (type: 'channel' | 'payment_gateway', defaultTargetId?: string) => {
    setRequestType(type);
    if (defaultTargetId) {
      setTargetId(defaultTargetId);
    } else {
      setTargetId(type === 'channel' ? channels[0]?.id || '' : gateways[0]?.id || '');
    }
    setAction('connect');
    setReason('');
    setIsRequestModalOpen(true);
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty || !targetId) return;

    let targetName = '';
    if (requestType === 'channel') {
      targetName = channels.find((c) => c.id === targetId)?.name || targetId;
    } else {
      targetName = gateways.find((g) => g.id === targetId)?.name || targetId;
    }

    onSubmitRequest({
      ownerId: selectedProperty.ownerId || 'owner-1',
      ownerName: selectedProperty.ownerName || 'Property Owner',
      propertyId: selectedProperty.id,
      propertyTitle: selectedProperty.title,
      requestType,
      targetId,
      targetName,
      action,
      reason: reason.trim() || 'Request submitted via Owner Portal.',
      ...(requestType === 'payment_gateway'
        ? {
            bankName,
            accountNumberMasked: accountNumber ? `•••• •••• ${accountNumber.slice(-4)}` : undefined,
          }
        : {}),
    });

    setIsRequestModalOpen(false);
  };

  const propertyPublishedChannels = selectedProperty?.publishedChannels || ['direct', 'airbnb'];
  const propertyRequests = requests.filter((r) => r.propertyId === selectedProperty?.id);

  return (
    <div className="space-y-6">
      {/* Property Selector Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Distribution Channels & Payment Gateways</h2>
            <span className="text-[11px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
              OTA & Banking Hub
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage channel synchronization, publish all properties & rooms to ScopeBridge Direct, and view registered & visible channels.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-slate-50 outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            {properties.map((prop) => (
              <option key={prop.id} value={prop.id}>
                {prop.title} ({prop.unitCode}) • {(prop.rooms || []).length} Room(s)
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              if (!selectedProperty) return;
              // Publish property to ScopeBridge Direct ('ch-direct' / 'direct') and all connected channels
              triggerChannelPublish('ch-direct', true);
              ['ch-booking', 'ch-airbnb', 'ch-agoda'].forEach((ch) => {
                if (!propertyPublishedChannels.includes(ch)) {
                  onPublishPropertyToChannel(selectedProperty.id, ch, true);
                }
              });
              setSyncLogs((prev) => [
                ...prev,
                `[${new Date().toISOString()}] GLOBAL PUBLISH: Property "${selectedProperty.title}" and all ${(selectedProperty.rooms || []).length || 1} room(s) published & searchable on ScopeBridge Direct and registered OTA channels.`
              ]);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Publish to ScopeBridge Direct & Channels</span>
          </button>

          <button
            onClick={() => handleOpenRequest('channel')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Request Access</span>
          </button>
        </div>
      </div>

      {/* Registered & Visible Channel Status Summary for Selected Property */}
      {selectedProperty && (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-white p-3 rounded-xl border border-emerald-100 space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 block">
              📡 Visible / Published Channels (Live Search):
            </span>
            <div className="flex flex-wrap gap-1">
              <span className="px-2 py-0.5 bg-emerald-700 text-white rounded-md text-[10px] font-bold">
                ✓ ScopeBridge Direct
              </span>
              {propertyPublishedChannels.map((chId) => {
                const chObj = channels.find((c) => c.id === chId);
                return (
                  <span key={chId} className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-md text-[10px] font-bold">
                    ✓ {chObj ? chObj.name : chId.replace('ch-', '').toUpperCase()}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-indigo-100 space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-900 block">
              📋 Registered Channels (Owner & Property):
            </span>
            <div className="flex flex-wrap gap-1">
              {Array.from(
                new Set([
                  'ScopeBridge Direct',
                  ...(selectedProperty.requestedChannels || []),
                  ...propertyPublishedChannels.map((id) => channels.find((c) => c.id === id)?.name || id),
                ])
              ).map((chName, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-indigo-50 text-indigo-900 border border-indigo-200 rounded-md text-[10px] font-bold">
                  {chName}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-800 block">
              🛏️ Rooms Published on ScopeBridge ({(selectedProperty.rooms || []).length} Room(s)):
            </span>
            <div className="flex flex-wrap gap-1">
              {(selectedProperty.rooms || []).length === 0 ? (
                <span className="text-[11px] text-slate-500">Main Residence Suite (R{selectedProperty.basePrice}/night)</span>
              ) : (
                (selectedProperty.rooms || []).map((rm) => (
                  <span key={rm.id} className="px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-200 rounded-md text-[10px] font-bold">
                    {rm.name} (R{rm.basePrice})
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('channels')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'channels'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>OTA Distribution Channels</span>
        </button>
        <button
          onClick={() => setActiveTab('gateways')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'gateways'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payment Gateways</span>
        </button>
        <button
          onClick={() => setActiveTab('banking')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'banking'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Banking &amp; Settlement Rails</span>
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'requests'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>My Requests History ({propertyRequests.length})</span>
        </button>
      </div>

      {/* Tab 1: OTA Distribution Channels */}
      {activeTab === 'channels' && (
        <div className="space-y-6">
          {/* ScopeBridge Channel Detector & Portfolio Listing Matrix */}
          <div className="bg-white rounded-2xl border border-emerald-200 shadow-xs p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                    ScopeBridge Channel Detector Active
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    Detects &amp; lists all channels where Owner &amp; Properties are listed
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 mt-1">
                  Owner &amp; Property Multi-Channel Listing Matrix ({properties.length} Properties Scanned)
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/channels/detect-listings');
                      const data = await res.json();
                      if (data.ok) {
                        setSyncLogs((prev) => [
                          ...prev,
                          `[${new Date().toISOString()}] SCOPEBRIDGE DETECTOR: Scanned ${data.totalPropertiesScanned} properties & ${data.totalProfilesScanned} profiles across ${data.totalActiveChannels} active channels.`,
                        ]);
                      }
                    } catch {
                      // Ignore
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Detect &amp; Verify All Channel Listings</span>
                </button>

                {selectedProperty && (
                  <button
                    type="button"
                    onClick={() => {
                      channels
                        .filter((c) => c.status === 'connected')
                        .forEach((c) => triggerChannelPublish(c.id, true));
                    }}
                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Publish "{selectedProperty.title}" to All Channels</span>
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] uppercase font-extrabold">
                    <th className="py-2.5 px-3">Property &amp; Unit</th>
                    <th className="py-2.5 px-3">Owner Profile</th>
                    <th className="py-2.5 px-3">Detected Published Channels (Live Reflection)</th>
                    <th className="py-2.5 px-3 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {properties.map((prop) => {
                    const pubChannels = Array.from(new Set(['direct', ...(prop.publishedChannels || [])]));
                    return (
                      <tr key={`det-${prop.id}`} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {prop.title}{' '}
                          <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {prop.unitCode}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 font-semibold">
                          {prop.ownerName || 'Property Owner'}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-wrap gap-1">
                            {channels.map((ch) => {
                              const isLive = ch.id === 'direct' || pubChannels.includes(ch.id);
                              return (
                                <button
                                  key={`mat-${prop.id}-${ch.id}`}
                                  type="button"
                                  onClick={() => {
                                    if (ch.id === 'direct') return;
                                    onPublishPropertyToChannel(prop.id, ch.id, !isLive);
                                  }}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                                    isLive
                                      ? 'bg-emerald-600 text-white border-emerald-700'
                                      : 'bg-slate-100 text-slate-500 border-slate-200 hover:border-emerald-400'
                                  }`}
                                  title={isLive ? `Listed on ${ch.name} (Click to pause)` : `Click to publish on ${ch.name}`}
                                >
                                  {ch.logo} {isLive ? '✓ ' : '+ '}{ch.name.split(' ')[0]}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              channels
                                .filter((c) => c.status === 'connected')
                                .forEach((c) => onPublishPropertyToChannel(prop.id, c.id, true));
                            }}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-lg text-[10px] font-extrabold cursor-pointer"
                          >
                            Publish All
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Real-time OTA Synchronizer Console Panel */}
          <div className="bg-slate-950 text-emerald-400 p-5 rounded-2xl border border-slate-800 shadow-lg font-mono text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="font-bold uppercase text-slate-100">Live OTA Feed API Handshake Terminal</span>
              </div>
              <button
                onClick={() => setSyncLogs([`[${new Date().toISOString()}] Terminal reset. Distribution pipeline online.`])}
                className="text-[10px] text-slate-400 hover:text-emerald-300 border border-slate-800 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Clear Console
              </button>
            </div>
            
            <div className="max-h-[160px] overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
              {syncLogs.map((log, index) => (
                <div key={index} className="leading-relaxed whitespace-pre-wrap">
                  {log}
                </div>
              ))}
            </div>
          </div>

          {/* Channels Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {channels.map((channel) => {
              const isPublished = propertyPublishedChannels.includes(channel.id);
              const isGlobalConnected = channel.status === 'connected';
              const creds = channelCredentials[channel.id] || { apiKey: '', clientId: '' };
              const isEditingCreds = editingCredsChannelId === channel.id;

              return (
                <div
                  key={channel.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-3xl">{channel.logo}</span>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{channel.name}</h3>
                          <span className="text-[11px] text-slate-500 capitalize">{channel.category.replace('_', ' ')}</span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          isGlobalConnected
                            ? 'bg-emerald-500/10 text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {isGlobalConnected ? 'API Connectivity Enabled' : 'Platform Disabled'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {channel.description}
                    </p>

                    <div className="pt-2.5 border-t border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Standard Commission:</span>
                        <span className="font-bold text-slate-900">{channel.commissionRate}%</span>
                      </div>
                      
                      {/* Connection Credentials Form */}
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2 mt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                            <Key className="w-3 h-3" /> API Sync Credentials
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (isEditingCreds) {
                                saveCredentials(channel.id, tempApiKey, tempClientId);
                                setEditingCredsChannelId(null);
                              } else {
                                setTempApiKey(creds.apiKey || '');
                                setTempClientId(creds.clientId || '');
                                setEditingCredsChannelId(channel.id);
                              }
                            }}
                            className="text-[10px] text-emerald-800 hover:text-emerald-700 font-bold transition-colors cursor-pointer"
                          >
                            {isEditingCreds ? '✓ Save Setup' : '⚙ Edit API Keys'}
                          </button>
                        </div>
                        
                        {isEditingCreds ? (
                          <div className="space-y-1.5">
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500">Client Partner ID</label>
                              <input
                                type="text"
                                value={tempClientId}
                                onChange={(e) => setTempClientId(e.target.value)}
                                className="w-full px-2 py-1 text-[10px] bg-white border border-slate-200 rounded-lg font-mono text-slate-700"
                                placeholder="Partner ID"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500">Secure Token / API Key</label>
                              <input
                                type="password"
                                value={tempApiKey}
                                onChange={(e) => setTempApiKey(e.target.value)}
                                className="w-full px-2 py-1 text-[10px] bg-white border border-slate-200 rounded-lg font-mono text-slate-700"
                                placeholder="Token secret key"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-600 space-y-0.5 font-mono">
                            <div>ClientID: <span className="font-bold text-slate-800">{creds.clientId || 'Default sandbox'}</span></div>
                            <div>Token: <span className="text-slate-800 font-bold">{creds.apiKey ? '••••••••' + creds.apiKey.slice(-4) : 'Direct sandbox feed'}</span></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Distribution Status:</span>
                      {isGlobalConnected ? (
                        <button
                          type="button"
                          disabled={isSyncingChannelId !== null}
                          onClick={() => triggerChannelPublish(channel.id, !isPublished)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            isPublished
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                          }`}
                        >
                          {isSyncingChannelId === channel.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : isPublished ? (
                            '✓ Published Active'
                          ) : (
                            'Publish Property'
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenRequest('channel', channel.id)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          Request Access
                        </button>
                      )}
                    </div>

                    {isPublished && (
                      <button
                        onClick={() => {
                          setSimulatorChannelId(channel.id);
                          setSimBookingConfirmed(false);
                          setShowPortalSimulator(true);
                        }}
                        className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 active:scale-[0.99] text-emerald-900 border border-emerald-100 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        title="Simulate going to this channel to verify and check real-world publishing"
                      >
                        <MonitorPlay className="w-3.5 h-3.5" />
                        <span>Go to {channel.name} Listing</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Payment Gateways */}
      {activeTab === 'gateways' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gateways.map((gw) => (
              <div
                key={gw.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{gw.name}</h3>
                      <span className="text-[11px] text-slate-500 capitalize">{gw.type.replace('_', ' ')}</span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        gw.status === 'connected'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {gw.status === 'connected' ? 'Active' : 'Offline'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {gw.description}
                  </p>

                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Transaction Fee:</span>
                      <span className="font-bold text-slate-900">{gw.feePercent}% + R{gw.fixedFee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Settlement Time:</span>
                      <span className="font-medium text-slate-700">{gw.settlementTime}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  {gatewayTestResult[gw.id] && (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-[10px] font-mono text-emerald-800">
                      {gatewayTestResult[gw.id]}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={testingGatewayId === gw.id}
                      onClick={async () => {
                        setTestingGatewayId(gw.id);
                        try {
                          const res = await fetch('/api/payments/process', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              gatewayId: gw.id,
                              amountZar: selectedProperty?.basePrice || 1250,
                              guestName: 'Gateway Verification Ping',
                            }),
                          });
                          const data = await res.json();
                          if (data.success) {
                            setGatewayTestResult((prev) => ({
                              ...prev,
                              [gw.id]: `✓ Verified (${data.transactionId})`,
                            }));
                          }
                        } catch (e) {
                          setGatewayTestResult((prev) => ({
                            ...prev,
                            [gw.id]: '✗ Handshake failed',
                          }));
                        } finally {
                          setTestingGatewayId(null);
                        }
                      }}
                      className="py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{testingGatewayId === gw.id ? 'Testing...' : 'Test Gateway'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenRequest('payment_gateway', gw.id)}
                      className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Merchant Link</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2.5: Owner Banking & Settlement Rails */}
      {activeTab === 'banking' && (
        <div className="space-y-6">
          {payoutSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-950 text-xs font-bold flex items-center justify-between shadow-xs animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{payoutSuccessMsg}</span>
              </div>
              <button onClick={() => setPayoutSuccessMsg(null)} className="text-emerald-700 font-extrabold cursor-pointer">
                ✕
              </button>
            </div>
          )}

          {/* Owner Official Settlement Bank Accounts */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900">Owner Payout Bank Accounts</h3>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    Real-Time Clearing Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct net revenue settlements for stay bookings, nanny services, and shuttle transfers clear to your linked account.
                </p>
              </div>

              <button
                onClick={() => setIsAddOwnerBankOpen(true)}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Bank Account</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ownerBankAccounts.map((acc, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 text-xs">{acc.bankName}</span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        Active Payout Rail
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-semibold mt-1">{acc.accountName}</p>
                    <div className="mt-2 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-[11px]">Account No:</span>
                        <span className="font-mono font-bold text-slate-800 text-[11px]">•••• •••• {acc.accountNumber.slice(-4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-[11px]">Branch / Type:</span>
                        <span className="text-slate-700 text-[11px]">{acc.branchCode} • {acc.accountType}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                    <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified Rail
                    </span>
                    <button
                      type="button"
                      disabled={isProcessingPayout}
                      onClick={async () => {
                        setIsProcessingPayout(true);
                        try {
                          const res = await fetch('/api/payments/payout-disburse', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              payeeName: acc.accountName,
                              payeeRole: 'owner',
                              bankName: acc.bankName,
                              accountNumber: acc.accountNumber,
                              branchCode: acc.branchCode,
                              amountZar: 4995,
                              purpose: `Net Revenue Payout for ${selectedProperty.title}`,
                            }),
                          });
                          const data = await res.json();
                          if (data.success) {
                            setPayoutSuccessMsg(`Instant payout of R${data.amountZar?.toLocaleString()} successfully disbursed to ${acc.bankName} (Ref: ${data.payoutId})!`);
                          }
                        } catch {
                        } finally {
                          setIsProcessingPayout(false);
                        }
                      }}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      {isProcessingPayout ? 'Clearing Payout...' : 'Request Instant Payout (R4,995)'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ScopeBridg Platform Escrow & Direct Commission Payment */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-lg space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="font-bold text-white text-sm">ScopeBridg Main Admin Bank Account (Absa Escrow)</h4>
                  <span className="text-[10px] text-slate-400">Direct wire clearing for channel commission, contractor fees &amp; deposit escrow</span>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-2.5 py-1 rounded-full">
                Acc: {adminBank.accountNumber}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-0.5">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Bank Name</span>
                <p className="font-bold text-white">{adminBank.bankName}</p>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-0.5">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Account Holder</span>
                <p className="font-bold text-white truncate">{adminBank.accountName}</p>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-0.5">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Account Number</span>
                <p className="font-mono font-black text-emerald-400">{adminBank.accountNumber}</p>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-0.5">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Branch Code</span>
                <p className="font-mono font-bold text-white">{adminBank.branchCode}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-[11px] text-slate-400">
                Need to settle platform fees or artisan invoices? Make a direct EFT or pay via integrated card rails.
              </p>
              <button
                type="button"
                disabled={isPayingCommission}
                onClick={async () => {
                  setIsPayingCommission(true);
                  try {
                    const res = await fetch('/api/payments/process-real', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        gatewayId: 'absa_direct_eft',
                        amountZar: commissionAmount,
                        purpose: `Platform Fee Settlement for ${selectedProperty.title}`,
                        payerName: 'Mdluli Nhlanhla (Owner)',
                        payerPhone: '+27821234567',
                        targetBank: `${adminBank.bankName} (Acc: ${adminBank.accountNumber})`,
                      }),
                    });
                    const data = await res.json();
                    if (data.success) {
                      setPayoutSuccessMsg(`Platform commission of R${data.amountZar} settled to Admin Absa Account (Ref: ${data.transactionId})!`);
                    }
                  } catch {
                  } finally {
                    setIsPayingCommission(false);
                  }
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition-colors cursor-pointer shrink-0"
              >
                {isPayingCommission ? 'Settling...' : 'Pay Commission to Admin (R650)'}
              </button>
            </div>
          </div>

          {/* Add Owner Bank Modal */}
          {isAddOwnerBankOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl animate-scaleIn">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm">Add Owner Settlement Bank Account</h3>
                  <button onClick={() => setIsAddOwnerBankOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">
                    ✕
                  </button>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!ownerNewAccountNumber.trim()) return;
                    const newAcc: BankAccountDetails = {
                      bankName: ownerNewBankName,
                      accountName: ownerNewAccountName.trim() || 'Owner Account Holder',
                      accountNumber: ownerNewAccountNumber.trim(),
                      branchCode: ownerNewBranchCode || '250655',
                      accountType: ownerNewAccountType,
                    };
                    const updated = [...ownerBankAccounts, newAcc];
                    setOwnerBankAccounts(updated);
                    try {
                      localStorage.setItem('scopebridg_owner_bank_accounts', JSON.stringify(updated));
                      await fetch('/api/banking/save-details', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          userId: 'owner-01',
                          userRole: 'owner',
                          ...newAcc,
                          recipientPhone: '+27694977018',
                        }),
                      });
                    } catch {}
                    setIsAddOwnerBankOpen(false);
                    setOwnerNewAccountNumber('');
                    setPayoutSuccessMsg(`Successfully registered ${newAcc.bankName} (****${newAcc.accountNumber.slice(-4)}) for instant settlements!`);
                  }}
                  className="space-y-3 text-xs"
                >
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Bank Name *</label>
                    <select
                      value={ownerNewBankName}
                      onChange={(e) => setOwnerNewBankName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold text-slate-800 text-xs"
                    >
                      <option value="First National Bank (FNB)">First National Bank (FNB)</option>
                      <option value="Standard Bank">Standard Bank</option>
                      <option value="Capitec Bank">Capitec Bank</option>
                      <option value="Absa Bank">Absa Bank</option>
                      <option value="Nedbank">Nedbank</option>
                      <option value="Investec Bank">Investec Bank</option>
                      <option value="TymeBank">TymeBank</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Account Holder Name *</label>
                    <input
                      type="text"
                      required
                      value={ownerNewAccountName}
                      onChange={(e) => setOwnerNewAccountName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Account Number *</label>
                    <input
                      type="text"
                      required
                      value={ownerNewAccountNumber}
                      onChange={(e) => setOwnerNewAccountNumber(e.target.value)}
                      placeholder="e.g. 62819204918"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-slate-800 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Branch Code</label>
                      <input
                        type="text"
                        value={ownerNewBranchCode}
                        onChange={(e) => setOwnerNewBranchCode(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Account Type</label>
                      <select
                        value={ownerNewAccountType}
                        onChange={(e) => setOwnerNewAccountType(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 text-xs font-semibold"
                      >
                        <option value="Cheque / Current Account">Cheque / Current Account</option>
                        <option value="Business Account">Business Account</option>
                        <option value="Savings Account">Savings Account</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsAddOwnerBankOpen(false)}
                      className="px-4 py-2 text-slate-600 font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer"
                    >
                      Register Account
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Request History */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-sm font-bold text-slate-900">Access Requests for {selectedProperty.title}</h3>
          </div>

          {propertyRequests.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No access requests submitted yet for this property.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {propertyRequests.map((req) => (
                <div key={req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700">{req.id}</span>
                      <span className="text-xs font-bold text-slate-900">{req.targetName}</span>
                      <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 uppercase font-bold">
                        {req.action}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          req.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{req.reason}</p>
                    {req.adminNotes && (
                      <p className="text-xs text-emerald-800 bg-emerald-50 p-2 rounded-lg mt-1.5 border border-emerald-200">
                        <strong>Admin Note:</strong> {req.adminNotes}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 shrink-0 font-mono">{req.createdAt}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Request Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Submit Request to Super Admin
              </h3>
              <button onClick={() => setIsRequestModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target</label>
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-hidden bg-white"
                >
                  {requestType === 'channel'
                    ? channels.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.category})
                        </option>
                      ))
                    : gateways.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({g.type})
                        </option>
                      ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Action</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAction('connect')}
                    className={`py-1.5 text-xs font-bold rounded-xl border ${
                      action === 'connect'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Connect
                  </button>
                  <button
                    type="button"
                    onClick={() => setAction('disconnect')}
                    className={`py-1.5 text-xs font-bold rounded-xl border ${
                      action === 'disconnect'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Disconnect
                  </button>
                </div>
              </div>

              {requestType === 'payment_gateway' && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name</label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-hidden bg-white"
                    >
                      <option value="First National Bank (FNB)">First National Bank (FNB)</option>
                      <option value="Standard Bank">Standard Bank</option>
                      <option value="Capitec Bank">Capitec Bank</option>
                      <option value="Nedbank">Nedbank</option>
                      <option value="Absa Bank">Absa Bank</option>
                      <option value="Investec">Investec</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Account Number (Last 4 digits)</label>
                    <input
                      type="text"
                      placeholder="e.g. 4920"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-hidden font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Business Reason</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain why you want to connect/disconnect this channel or gateway..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Immersive OTA Live Portal Simulator (Booking.com / Airbnb Styles) */}
      {showPortalSimulator && selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-100 rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-y-auto shadow-2xl relative flex flex-col font-sans">
            
            {/* Simulation Header Badge */}
            <div className="bg-amber-500 text-amber-950 text-xs font-bold px-4 py-2.5 flex items-center justify-between sticky top-0 z-50 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-900 rounded-full animate-ping" />
                <span>REAL-WORLD OTA PORTAL SIMULATION: Verifying active feed and pricing for "{selectedProperty.title}"</span>
              </div>
              <button
                onClick={() => setShowPortalSimulator(false)}
                className="bg-amber-900/15 hover:bg-amber-900/30 text-amber-950 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Exit Simulator
              </button>
            </div>

            {/* Simulated Booking.com Style Portal */}
            {simulatorChannelId === 'booking_com' ? (
              <div className="flex-1 bg-[#f5f5f5] text-slate-900 pb-12">
                {/* Blue Top Nav Bar */}
                <div className="bg-[#003580] text-white px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <span className="text-xl font-black tracking-tight font-serif">Booking.com</span>
                    <span className="text-xs bg-emerald-600 font-bold px-2.5 py-0.5 rounded-md">Verified Channel Feed</span>
                  </div>
                  <div className="text-xs font-medium text-slate-200">
                    Host: {selectedProperty.ownerName || 'Property Owner'} • Unit: {selectedProperty.unitCode}
                  </div>
                </div>

                {/* Sub Bar */}
                <div className="bg-[#00224f] text-white text-xs px-6 py-2.5 flex gap-4 overflow-x-auto">
                  <span className="underline cursor-pointer font-bold">Stays</span>
                  <span className="opacity-70 cursor-pointer">Flights</span>
                  <span className="opacity-70 cursor-pointer">Flight + Hotel</span>
                  <span className="opacity-70 cursor-pointer">Car rentals</span>
                  <span className="opacity-70 cursor-pointer">Attractions</span>
                  <span className="opacity-70 cursor-pointer">Airport taxis</span>
                </div>

                {/* Main Body */}
                <div className="max-w-4xl mx-auto mt-6 px-4 space-y-6">
                  {/* Hotel Header Section */}
                  <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <span className="bg-[#febb02] text-xs font-bold text-slate-900 px-1.5 py-0.5 rounded-sm">Hotel / Resort</span>
                          <div className="flex text-[#febb02]">★ ★ ★ ★ ★</div>
                        </div>
                        <h1 className="text-2xl font-black text-slate-900">{selectedProperty.title}</h1>
                        <p className="text-xs text-blue-600 flex items-center gap-1 hover:underline cursor-pointer">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          <span>{selectedProperty.address || selectedProperty.area || 'Global Portfolio Location'}</span> — Great location - show map
                        </p>
                      </div>

                      {/* Score Rating */}
                      <div className="flex items-center gap-2.5">
                        <div className="text-right">
                          <span className="font-bold text-sm block text-[#003580]">Exceptional</span>
                          <span className="text-[10px] text-slate-500 block">48 verified reviews</span>
                        </div>
                        <div className="bg-[#003580] text-white p-2.5 rounded-lg text-lg font-black leading-none">
                          9.5
                        </div>
                      </div>
                    </div>

                    {/* Image Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-lg overflow-hidden h-[240px]">
                      <div className="sm:col-span-2 h-full">
                        <img
                          src={selectedProperty.images[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945'}
                          alt="Main"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="grid grid-rows-2 gap-2 h-full">
                        <img
                          src={selectedProperty.images[1] || 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4'}
                          alt="Detail 1"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <img
                          src={selectedProperty.images[2] || 'https://images.unsplash.com/photo-1582719508461-905c673771fd'}
                          alt="Detail 2"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Booking Simulation Box */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left & Mid: Description & Details */}
                    <div className="md:col-span-2 space-y-4">
                      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
                        <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-2">
                          Experience the Luxury Property
                        </h2>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {(selectedProperty as any).description || 'Located in a secure neighborhood, this modern residence provides high-speed solar backup electricity, stylish interior layouts, pristine cleanliness, and standard wellness amenities for a supreme getaway.'}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                          <div className="flex items-center gap-2 text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <Coffee className="w-4 h-4 text-emerald-800" />
                            <span>Premium Breakfast Included</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <Shield className="w-4 h-4 text-emerald-800" />
                            <span>Solar Power Inverter Active</span>
                          </div>
                        </div>
                      </div>

                      {/* Room types table */}
                      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-3">
                        <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Available Room Types</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-100 text-slate-400">
                                <th className="pb-2 font-semibold">Room Name</th>
                                <th className="pb-2 font-semibold">Max Guests</th>
                                <th className="pb-2 font-semibold">Base Price</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedProperty.rooms && selectedProperty.rooms.length > 0 ? (
                                selectedProperty.rooms.map((room) => (
                                  <tr key={room.id} className="border-b border-slate-50 text-slate-700 font-medium">
                                    <td className="py-2.5">{room.name}</td>
                                    <td className="py-2.5">{room.maxGuests || 2} adults</td>
                                    <td className="py-2.5 text-[#003580] font-bold">ZAR {room.basePrice} / night</td>
                                  </tr>
                                ))
                              ) : (
                                <tr className="text-slate-700 font-medium">
                                  <td className="py-2.5">Entire Luxury Unit</td>
                                  <td className="py-2.5">Up to {selectedProperty.maxGuests || 4} guests</td>
                                  <td className="py-2.5 text-[#003580] font-bold">ZAR {selectedProperty.basePrice} / night</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Interactive Real Reservation Form */}
                    <div className="space-y-4">
                      <div className="bg-white rounded-xl p-5 border border-[#003580] shadow-sm space-y-4">
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-[11px] text-blue-900 font-medium leading-normal">
                          💡 Book from this simulated Booking.com portal to test database synchronization instantly!
                        </div>

                        <div>
                          <span className="text-slate-500 text-xs">Price for 1 night</span>
                          <div className="text-2xl font-black text-slate-900">ZAR {selectedProperty.basePrice}</div>
                        </div>

                        {simBookingConfirmed ? (
                          <div className="bg-emerald-50 text-emerald-950 p-4 rounded-xl border border-emerald-200 text-center space-y-2">
                            <Check className="w-8 h-8 text-emerald-600 mx-auto" />
                            <p className="font-extrabold text-xs">Simulated Booking Sync Successful!</p>
                            <p className="text-[10px] text-emerald-800 leading-normal">
                              This reservation has been successfully dispatched from the simulated Booking.com feed. It is now registered in your main reservations database!
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3.5">
                            {/* Form Fields */}
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 mb-1">Check-in Date</label>
                              <input
                                type="date"
                                value={simCheckIn}
                                onChange={(e) => setSimCheckIn(e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-1">Nights</label>
                                <input
                                  type="number"
                                  min={1}
                                  value={simNights}
                                  onChange={(e) => setSimNights(parseInt(e.target.value) || 1)}
                                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-1">Guests</label>
                                <input
                                  type="number"
                                  min={1}
                                  value={simGuests}
                                  onChange={(e) => setSimGuests(parseInt(e.target.value) || 1)}
                                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                                />
                              </div>
                            </div>

                            <div className="border-t border-slate-100 pt-3 space-y-2">
                              <label className="block text-[10px] font-bold text-slate-700">Lead Guest Details</label>
                              <input
                                type="text"
                                placeholder="Full Name"
                                value={simName}
                                onChange={(e) => setSimName(e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                              />
                              <input
                                type="email"
                                placeholder="Email Address"
                                value={simEmail}
                                onChange={(e) => setSimEmail(e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                              />
                              <input
                                type="text"
                                placeholder="Phone Number"
                                value={simPhone}
                                onChange={(e) => setSimPhone(e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                              />
                            </div>

                            <button
                              onClick={() => {
                                if (!simName.trim() || !simEmail.trim()) {
                                  return;
                                }
                                if (onBookProperty) {
                                  const cIn = simCheckIn || new Date().toISOString().split('T')[0];
                                  const checkOutCalculated = new Date(new Date(cIn).getTime() + simNights * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                                  onBookProperty({
                                    propertyId: selectedProperty.id,
                                    propertyTitle: selectedProperty.title,
                                    propertyImage: selectedProperty.images[0] || '',
                                    guestName: simName,
                                    guestEmail: simEmail,
                                    guestPhone: simPhone,
                                    checkInDate: cIn,
                                    checkOutDate: checkOutCalculated,
                                    nights: simNights,
                                    guestsCount: simGuests,
                                    totalAmount: selectedProperty.basePrice * simNights,
                                    paymentMethod: 'paystack',
                                    paymentStatus: 'pending',
                                    addOns: {
                                      lateCheckout: false,
                                      airportPickup: false,
                                      breakfast: true
                                    },
                                    doorCode: 'A' + Math.floor(1000 + Math.random() * 9000),
                                    channel: 'booking.com',
                                    commission: {
                                      ownerAmount: Math.round((selectedProperty.basePrice * simNights) * 0.92),
                                      adminAmount: Math.round((selectedProperty.basePrice * simNights) * 0.08),
                                    },
                                    idVerified: true,
                                    depositStatus: 'held',
                                  });
                                }
                                setSimBookingConfirmed(true);
                                setSyncLogs((prev) => [
                                  ...prev,
                                  `[${new Date().toISOString()}] SIMULATED BOOKING RECEIVED: Lead Guest "${simName}" from Booking.com.`,
                                  `[${new Date().toISOString()}] Syncing reservation instantly to PMS reservations database...`
                                ]);
                              }}
                              className="w-full py-2.5 bg-[#003580] hover:bg-[#00224f] text-white text-xs font-black rounded-lg transition-colors cursor-pointer"
                            >
                              Reserve Now
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Simulated Airbnb Style Portal */
              <div className="flex-1 bg-white text-slate-900 pb-12">
                {/* Minimalist Top Nav Bar */}
                <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[#FF385C]">
                    <Globe className="w-6 h-6" />
                    <span className="text-lg font-black tracking-tight font-serif">airbnb</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
                    Verified Partner Sync: Airbnb Live Feed API active
                  </div>
                </div>

                {/* Main Body */}
                <div className="max-w-4xl mx-auto mt-6 px-4 space-y-6">
                  {/* Header Title */}
                  <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">{selectedProperty.title}</h1>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 font-semibold">
                      <span className="text-slate-900 flex items-center gap-0.5">★ 4.95 •</span>
                      <span className="underline cursor-pointer">128 reviews</span>
                      <span>• Superhost •</span>
                      <span className="underline cursor-pointer">{selectedProperty.address || selectedProperty.area || 'Global Portfolio Location'}</span>
                    </div>
                  </div>

                  {/* Image Gallery */}
                  <div className="grid grid-cols-4 gap-2 rounded-2xl overflow-hidden h-[260px]">
                    <div className="col-span-2 h-full">
                      <img
                        src={selectedProperty.images[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945'}
                        alt="Main"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="grid grid-cols-2 col-span-2 gap-2 h-full">
                      <img
                        src={selectedProperty.images[1] || 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4'}
                        alt="Detail 1"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <img
                        src={selectedProperty.images[2] || 'https://images.unsplash.com/photo-1582719508461-905c673771fd'}
                        alt="Detail 2"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                  {/* Details and Sidebar Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left: Info */}
                    <div className="md:col-span-2 space-y-5">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-5">
                        <div>
                          <h2 className="text-base font-bold text-slate-900">
                            Entire luxury stay hosted by {selectedProperty.ownerName || 'Property Owner'}
                          </h2>
                          <p className="text-xs text-slate-500 mt-1">
                            {selectedProperty.maxGuests || 4} guests • {selectedProperty.rooms?.length || 2} bedrooms • {selectedProperty.rooms?.length || 2} beds • 2 baths
                          </p>
                        </div>
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-sm text-slate-700">
                          {selectedProperty.ownerName?.[0] || 'H'}
                        </div>
                      </div>

                      {/* Highlights */}
                      <div className="space-y-4 border-b border-slate-100 pb-5 text-xs text-slate-700">
                        <div className="flex gap-3">
                          <Coffee className="w-5 h-5 text-slate-500 shrink-0" />
                          <div>
                            <p className="font-bold">Complimentary Morning Artisan Breakfast</p>
                            <p className="text-slate-500 text-[11px]">Sourced fresh daily and cooked specifically for guests.</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Shield className="w-5 h-5 text-slate-500 shrink-0" />
                          <div>
                            <p className="font-bold">Continuous Solar Energy Inverter Backup</p>
                            <p className="text-slate-500 text-[11px]">Uninterrupted entertainment, cooling, and charging systems.</p>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="space-y-2 text-xs text-slate-600 leading-relaxed border-b border-slate-100 pb-5">
                        <p>{(selectedProperty as any).description || 'Enjoy a refined stay at this luxury residence. Includes elegant modern spaces, private safe parking lot, high speed wireless network, automated solar power inverter, and dedicated hospitality staff.'}</p>
                      </div>
                    </div>

                    {/* Right: Floating Booking Widget */}
                    <div className="space-y-4">
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-lg space-y-4 sticky top-16">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-lg font-extrabold text-slate-900">ZAR {selectedProperty.basePrice}</span>
                            <span className="text-slate-500 text-xs"> / night</span>
                          </div>
                          <span className="text-[11px] font-bold text-slate-800 flex items-center gap-0.5">★ 4.95</span>
                        </div>

                        {simBookingConfirmed ? (
                          <div className="bg-emerald-50 text-emerald-950 p-4 rounded-xl border border-emerald-200 text-center space-y-2">
                            <Check className="w-8 h-8 text-emerald-600 mx-auto" />
                            <p className="font-extrabold text-xs">Airbnb Booking Dispatched!</p>
                            <p className="text-[10px] text-emerald-800 leading-normal">
                              This reservation has been successfully booked from the simulated Airbnb listing. It is instantly synced to your main reservations log.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3 text-xs">
                            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-[10px] text-amber-900 font-medium leading-normal">
                              📝 Confirming a booking here creates an active Airbnb channel booking in your PMS feed!
                            </div>

                            <div className="border border-slate-300 rounded-lg overflow-hidden">
                              <div className="p-2 border-b border-slate-300">
                                <label className="block text-[8px] font-bold text-slate-500">CHECK-IN</label>
                                <input
                                  type="date"
                                  value={simCheckIn}
                                  onChange={(e) => setSimCheckIn(e.target.value)}
                                  className="w-full bg-transparent focus:outline-hidden text-xs"
                                />
                              </div>
                              <div className="grid grid-cols-2">
                                <div className="p-2 border-r border-slate-300">
                                  <label className="block text-[8px] font-bold text-slate-500">NIGHTS</label>
                                  <input
                                    type="number"
                                    min={1}
                                    value={simNights}
                                    onChange={(e) => setSimNights(parseInt(e.target.value) || 1)}
                                    className="w-full bg-transparent focus:outline-hidden text-xs font-bold text-slate-800"
                                  />
                                </div>
                                <div className="p-2">
                                  <label className="block text-[8px] font-bold text-slate-500">GUESTS</label>
                                  <input
                                    type="number"
                                    min={1}
                                    value={simGuests}
                                    onChange={(e) => setSimGuests(parseInt(e.target.value) || 1)}
                                    className="w-full bg-transparent focus:outline-hidden text-xs font-bold text-slate-800"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2 border-t border-slate-100 pt-3">
                              <label className="block text-[10px] font-bold text-slate-600">Guest Contact Info</label>
                              <input
                                type="text"
                                placeholder="Lead Guest Name"
                                value={simName}
                                onChange={(e) => setSimName(e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                              />
                              <input
                                type="email"
                                placeholder="Email Address"
                                value={simEmail}
                                onChange={(e) => setSimEmail(e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                              />
                              <input
                                type="text"
                                placeholder="Phone Number"
                                value={simPhone}
                                onChange={(e) => setSimPhone(e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                              />
                            </div>

                            <button
                              onClick={() => {
                                if (!simName.trim() || !simEmail.trim()) {
                                  return;
                                }
                                if (onBookProperty) {
                                  const cIn = simCheckIn || new Date().toISOString().split('T')[0];
                                  const checkOutCalculated = new Date(new Date(cIn).getTime() + simNights * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                                  onBookProperty({
                                    propertyId: selectedProperty.id,
                                    propertyTitle: selectedProperty.title,
                                    propertyImage: selectedProperty.images[0] || '',
                                    guestName: simName,
                                    guestEmail: simEmail,
                                    guestPhone: simPhone,
                                    checkInDate: cIn,
                                    checkOutDate: checkOutCalculated,
                                    nights: simNights,
                                    guestsCount: simGuests,
                                    totalAmount: selectedProperty.basePrice * simNights,
                                    paymentMethod: 'paystack',
                                    paymentStatus: 'pending',
                                    addOns: {
                                      lateCheckout: false,
                                      airportPickup: false,
                                      breakfast: true
                                    },
                                    doorCode: 'A' + Math.floor(1000 + Math.random() * 9000),
                                    channel: 'airbnb',
                                    commission: {
                                      ownerAmount: Math.round((selectedProperty.basePrice * simNights) * 0.92),
                                      adminAmount: Math.round((selectedProperty.basePrice * simNights) * 0.08),
                                    },
                                    idVerified: true,
                                    depositStatus: 'held',
                                  });
                                }
                                setSimBookingConfirmed(true);
                                setSyncLogs((prev) => [
                                  ...prev,
                                  `[${new Date().toISOString()}] SIMULATED BOOKING RECEIVED: Lead Guest "${simName}" from Airbnb.`,
                                  `[${new Date().toISOString()}] Syncing reservation instantly to PMS reservations database...`
                                ]);
                              }}
                              className="w-full py-3 bg-[#FF385C] hover:bg-[#e61e4d] text-white text-xs font-bold rounded-lg tracking-wide shadow-md hover:shadow-lg transition-all cursor-pointer"
                            >
                              Reserve Now
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Simulated Frame Footer */}
            <div className="bg-slate-900 text-slate-400 text-[10px] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
              <span>Channel Connectivity Engine Version 2.8.1 (Stable Release)</span>
              <div className="flex gap-4">
                <span className="text-emerald-400 font-bold">✓ Live Connection Stable</span>
                <span>Port: 3000 (Secure SSL)</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

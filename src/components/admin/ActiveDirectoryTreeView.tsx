import React, { useState, useMemo } from 'react';
import { Property, UserAccount } from '../../types';
import {
  FolderTree,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Search,
  Building2,
  BedDouble,
  User,
  Users,
  ShieldCheck,
  CheckCircle2,
  Globe,
  Sparkles,
  MapPin,
  ExternalLink,
  Plus,
  RefreshCw,
  Car,
  Baby,
  Landmark,
  Edit3,
  Layers,
  Copy,
  Check,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Radio,
  FileSpreadsheet,
} from 'lucide-react';
import { WhatsAppIcon } from '../common/WhatsAppIcon';
import { DEVELOPMENT_TEST_USERS, PRODUCTION_SUPER_ADMIN } from '../../data/usersData';
import { IS_DEV, IS_PROD } from '../../lib/env';

export interface ActiveDirectoryTreeViewProps {
  registeredUsers?: UserAccount[];
  properties: Property[];
  onSelectProperty?: (propertyId: string) => void;
  onEditUser?: (user: UserAccount) => void;
  currentUser?: UserAccount;
  onOpenAuthPage?: () => void;
  onLogout?: () => void;
  onLoginTestAccount?: (user: UserAccount) => void;
  onSelectRole?: (role: any) => void;
}

// Tree Node Types
type NodeType =
  | 'domain_root'
  | 'ou_owners'
  | 'owner'
  | 'property'
  | 'room'
  | 'ou_fleet'
  | 'driver'
  | 'ou_nannies'
  | 'nanny'
  | 'ou_admins'
  | 'admin';

interface SelectedNodeState {
  type: NodeType;
  id: string;
  name: string;
  code?: string;
  data?: any;
  parentOwner?: any;
  parentProperty?: any;
}

export const ActiveDirectoryTreeView: React.FC<ActiveDirectoryTreeViewProps> = ({
  registeredUsers = [],
  properties = [],
  onSelectProperty,
  onEditUser,
  currentUser,
  onOpenAuthPage,
  onLogout,
  onLoginTestAccount,
  onSelectRole,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<{ [key: string]: boolean }>({
    domain_root: true,
    ou_owners: true,
    ou_fleet: true,
    ou_nannies: true,
    ou_admins: true,
  });
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Collect owners from registered users and properties
  const ownerUsers = registeredUsers.filter((u) => u.role === 'owner');
  const driverUsers = registeredUsers.filter((u) => u.role === 'driver');
  const nannyUsers = registeredUsers.filter((u) => u.role === 'nanny');
  const adminUsers = registeredUsers.filter((u) => u.role === 'admin' || u.role === 'super_admin');

  const extraOwnersFromProps: UserAccount[] = [];
  properties.forEach((p) => {
    if (p.ownerName) {
      const exists = ownerUsers.some(
        (u) =>
          u.id === p.ownerId ||
          u.name?.toLowerCase() === p.ownerName?.toLowerCase() ||
          (u.fullName && u.fullName.toLowerCase() === p.ownerName?.toLowerCase())
      );
      if (!exists && !extraOwnersFromProps.some((e) => e.name.toLowerCase() === p.ownerName.toLowerCase())) {
        extraOwnersFromProps.push({
          id: p.ownerId || `owner-extra-${p.id}`,
          name: p.ownerName,
          fullName: p.ownerName,
          username: p.ownerName.toLowerCase().replace(/\s+/g, '_'),
          password: '',
          role: 'owner',
          email: `${p.ownerName.toLowerCase().replace(/\s+/g, '.')}@scopebridge.com`,
          phone: p.ownerWhatsApp || '+27 69 497 7018',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          title: 'Registered Property Owner',
          location: p.city || 'Johannesburg, South Africa',
          status: 'active',
          registeredAt: new Date().toISOString().slice(0, 10),
        });
      }
    }
  });

  const allOwners = [...ownerUsers, ...extraOwnersFromProps];

  // Map each owner to systematic tree
  const ownerDataTree = useMemo(() => {
    return allOwners.map((owner, ownerIdx) => {
      const ownerCode = `OWN${String(ownerIdx + 1).padStart(3, '0')}`;

      const ownerProps = properties.filter(
        (p) =>
          p.ownerId === owner.id ||
          p.ownerName?.toLowerCase() === owner.name?.toLowerCase() ||
          (owner.fullName && p.ownerName?.toLowerCase() === owner.fullName.toLowerCase())
      );

      const mappedProps = ownerProps.map((prop, propIdx) => {
        const propCode = `P${String(propIdx + 1).padStart(3, '0')}`;
        const mappedRooms = (prop.rooms || []).map((room, roomIdx) => {
          const roomCode = `Pr${String(roomIdx + 1).padStart(3, '0')}`;
          return {
            ...room,
            roomCode,
          };
        });

        return {
          ...prop,
          propCode,
          mappedRooms,
        };
      });

      return {
        owner,
        ownerCode,
        ownerProps: mappedProps,
      };
    });
  }, [allOwners, properties]);

  // Initial selection (first owner or root)
  const [selectedNode, setSelectedNode] = useState<SelectedNodeState>(() => {
    if (ownerDataTree.length > 0) {
      const first = ownerDataTree[0];
      return {
        type: 'owner',
        id: first.owner.id,
        name: first.owner.fullName || first.owner.name,
        code: first.ownerCode,
        data: first,
      };
    }
    return {
      type: 'domain_root',
      id: 'domain_root',
      name: 'DC=scopebridg,DC=co,DC=za',
    };
  });

  const toggleNode = (nodeKey: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeKey]: !prev[nodeKey] }));
  };

  const handleExpandAll = () => {
    const next: { [key: string]: boolean } = {
      domain_root: true,
      ou_owners: true,
      ou_fleet: true,
      ou_nannies: true,
      ou_admins: true,
    };
    ownerDataTree.forEach((item) => {
      next[`owner_${item.owner.id}`] = true;
      item.ownerProps.forEach((p) => {
        next[`prop_${p.id}`] = true;
      });
    });
    setExpandedNodes(next);
  };

  const handleCollapseAll = () => {
    setExpandedNodes({});
  };

  const handleCopyLink = (text: string, key: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedLink(key);
      setTimeout(() => setCopiedLink(null), 2000);
    }
  };

  // Filtered owners
  const filteredOwners = useMemo(() => {
    if (!searchTerm) return ownerDataTree;
    const q = searchTerm.toLowerCase();
    return ownerDataTree.filter((item) => {
      const ownerMatch =
        item.owner.name?.toLowerCase().includes(q) ||
        (item.owner.fullName && item.owner.fullName.toLowerCase().includes(q)) ||
        item.ownerCode.toLowerCase().includes(q) ||
        item.owner.email?.toLowerCase().includes(q);

      const propMatch = item.ownerProps.some(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.propCode.toLowerCase().includes(q) ||
          p.unitCode?.toLowerCase().includes(q) ||
          (p.city && p.city.toLowerCase().includes(q)) ||
          p.mappedRooms.some(
            (r) => r.name?.toLowerCase().includes(q) || r.roomCode.toLowerCase().includes(q)
          )
      );

      return ownerMatch || propMatch;
    });
  }, [ownerDataTree, searchTerm]);

  // Directory Stats
  const totalOwnersCount = ownerDataTree.length;
  const totalPropsCount = ownerDataTree.reduce((sum, o) => sum + o.ownerProps.length, 0);
  const totalRoomsCount = ownerDataTree.reduce(
    (sum, o) => sum + o.ownerProps.reduce((pSum, p) => pSum + p.mappedRooms.length, 0),
    0
  );

  return (
    <div className="bg-slate-950 text-white rounded-3xl border border-slate-800 shadow-2xl overflow-hidden space-y-0">
      {/* 1. TOP ACTIVE DIRECTORY COMMAND & BREADCRUMB BAR */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950 border-b border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Active Directory Organizational Explorer
                </h2>
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  AD Tree View
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  LDAP Directory Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Hierarchical directory tree mapping Organizational Units (OUs) to Owner Accounts, Properties, and Configured Rooms.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExpandAll}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Expand Tree</span>
            </button>
            <button
              type="button"
              onClick={handleCollapseAll}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-800 flex items-center gap-1.5 cursor-pointer"
            >
              <Folder className="w-3.5 h-3.5 text-slate-400" />
              <span>Collapse All</span>
            </button>
          </div>
        </div>

        {/* Directory Breadcrumb Path */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center gap-1.5 text-xs text-slate-400 font-mono overflow-x-auto whitespace-nowrap">
          <button
            type="button"
            onClick={() =>
              setSelectedNode({
                type: 'domain_root',
                id: 'domain_root',
                name: 'DC=scopebridg,DC=co,DC=za',
              })
            }
            className="hover:text-amber-300 flex items-center gap-1 text-slate-300 font-bold"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>DC=scopebridg,DC=co,DC=za</span>
          </button>

          {selectedNode.type !== 'domain_root' && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
              <button
                type="button"
                onClick={() =>
                  setSelectedNode({
                    type: 'ou_owners',
                    id: 'ou_owners',
                    name: 'OU=Owners & Portfolios',
                  })
                }
                className="hover:text-amber-300 text-slate-400"
              >
                OU=Owners
              </button>
            </>
          )}

          {selectedNode.parentOwner && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
              <button
                type="button"
                onClick={() =>
                  setSelectedNode({
                    type: 'owner',
                    id: selectedNode.parentOwner.owner.id,
                    name: selectedNode.parentOwner.owner.fullName || selectedNode.parentOwner.owner.name,
                    code: selectedNode.parentOwner.ownerCode,
                    data: selectedNode.parentOwner,
                  })
                }
                className="hover:text-amber-300 text-amber-300 font-bold"
              >
                CN={selectedNode.parentOwner.ownerCode} ({selectedNode.parentOwner.owner.name})
              </button>
            </>
          )}

          {selectedNode.parentProperty && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
              <button
                type="button"
                onClick={() =>
                  setSelectedNode({
                    type: 'property',
                    id: selectedNode.parentProperty.id,
                    name: selectedNode.parentProperty.title,
                    code: selectedNode.parentProperty.propCode,
                    data: selectedNode.parentProperty,
                    parentOwner: selectedNode.parentOwner,
                  })
                }
                className="hover:text-emerald-300 text-emerald-300 font-bold"
              >
                CN={selectedNode.parentProperty.propCode} ({selectedNode.parentProperty.title})
              </button>
            </>
          )}

          {selectedNode.type === 'room' && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
              <span className="text-amber-400 font-black">
                CN={selectedNode.code} ({selectedNode.name})
              </span>
            </>
          )}
        </div>
      </div>

      {/* ACTIVE SESSION & LOGGED IN ACCOUNTS (1-CLICK INSTANT SIGN-IN) */}
      <div className="p-5 bg-slate-950/80 border-b border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60 pb-3.5">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-extrabold text-white">
                  Active Session: {currentUser?.fullName || currentUser?.name || PRODUCTION_SUPER_ADMIN.fullName}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {currentUser?.role || 'super_admin'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {IS_PROD && 'Production Cloud SQL Database'}
                  {IS_DEV && 'Development JSON Database (/data/dev-database.json)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {currentUser?.email || PRODUCTION_SUPER_ADMIN.email} • Cell & WhatsApp: +27 69 497 7018
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenAuthPage && (
              <button
                type="button"
                onClick={onOpenAuthPage}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Open Profile Registration
              </button>
            )}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Log Off
              </button>
            )}
          </div>
        </div>

        {/* 1-CLICK INSTANT SIGN-IN */}
        {(IS_PROD ? registeredUsers : DEVELOPMENT_TEST_USERS).length > 0 && (
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300">
                1-CLICK INSTANT SIGN-IN (LIVE REGISTERED PRODUCTION ACCOUNTS)
              </span>
              <span className="text-[11px] text-emerald-400 font-bold">
                {IS_PROD
                  ? 'Synced with Production Cloud SQL & Firestore'
                  : 'Stored in Development JSON DB (/data/dev-database.json)'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
              {(IS_PROD ? registeredUsers : DEVELOPMENT_TEST_USERS).map((preset) => (
                <div
                  key={preset.id}
                  className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-2 shadow-xs"
                >
                  <div>
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/20">
                      {preset.role.replace('_', ' ')}
                    </span>
                    <p className="text-xs font-bold text-white truncate mt-1.5" title={preset.fullName || preset.name}>
                      {preset.fullName || preset.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                      @{preset.username || preset.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (onLoginTestAccount) {
                          onLoginTestAccount(preset);
                        } else if (onSelectRole) {
                          onSelectRole(preset.role);
                        }
                      }}
                      className="flex-1 h-8 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-extrabold transition-colors cursor-pointer"
                    >
                      Instant Login
                    </button>
                    {onEditUser && (
                      <button
                        type="button"
                        onClick={() => onEditUser(preset)}
                        className="h-8 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                        title="Edit / Manage Account"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. ACTIVE DIRECTORY SPLIT PANE (LEFT TREE + RIGHT VIEW PANEL) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[680px]">
        {/* ============================================================ */}
        {/* LEFT COLUMN: DIRECTORY TREE DRILL-DOWN HIERARCHY */}
        {/* ============================================================ */}
        <div className="lg:col-span-4 xl:col-span-4 border-r border-slate-800 bg-slate-950/80 p-4 space-y-4 flex flex-col">
          {/* Quick Filter Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Directory (Name, Code, Room)..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-slate-900/90 transition-all font-mono"
            />
          </div>

          {/* Directory Tree Nodes */}
          <div className="flex-1 overflow-y-auto space-y-1 font-sans text-xs pr-1">
            {/* DOMAIN ROOT NODE */}
            <div className="space-y-1">
              <div
                onClick={() =>
                  setSelectedNode({
                    type: 'domain_root',
                    id: 'domain_root',
                    name: 'DC=scopebridg,DC=co,DC=za',
                  })
                }
                className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${
                  selectedNode.type === 'domain_root'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'hover:bg-slate-900 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleNode('domain_root');
                    }}
                    className="p-0.5 text-slate-400 hover:text-white"
                  >
                    {expandedNodes.domain_root ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-mono text-xs truncate">DC=scopebridg,DC=co,DC=za</span>
                </div>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-mono">
                  Domain
                </span>
              </div>

              {/* OU: OWNERS & PORTFOLIOS */}
              {expandedNodes.domain_root && (
                <div className="pl-4 space-y-1 border-l border-slate-800 ml-3">
                  <div
                    onClick={() =>
                      setSelectedNode({
                        type: 'ou_owners',
                        id: 'ou_owners',
                        name: 'OU=Owners & Portfolios',
                      })
                    }
                    className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${
                      selectedNode.type === 'ou_owners'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                        : 'hover:bg-slate-900 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleNode('ou_owners');
                        }}
                        className="p-0.5 text-slate-400 hover:text-white"
                      >
                        {expandedNodes.ou_owners ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="font-bold text-xs truncate">OU=Owners &amp; Portfolios</span>
                    </div>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono font-bold">
                      {totalOwnersCount}
                    </span>
                  </div>

                  {/* LEVEL 2: INDIVIDUAL OWNERS */}
                  {expandedNodes.ou_owners && (
                    <div className="pl-4 space-y-1 border-l border-slate-800/80 ml-3">
                      {filteredOwners.length === 0 ? (
                        <p className="text-[11px] text-slate-500 italic p-1">No owners found.</p>
                      ) : (
                        filteredOwners.map((item) => {
                          const ownerNodeKey = `owner_${item.owner.id}`;
                          const isOwnerExpanded = expandedNodes[ownerNodeKey] ?? true;
                          const isSelected =
                            selectedNode.type === 'owner' && selectedNode.id === item.owner.id;

                          return (
                            <div key={item.owner.id} className="space-y-1">
                              {/* OWNER ITEM */}
                              <div
                                onClick={() =>
                                  setSelectedNode({
                                    type: 'owner',
                                    id: item.owner.id,
                                    name: item.owner.fullName || item.owner.name,
                                    code: item.ownerCode,
                                    data: item,
                                  })
                                }
                                className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                                    : 'hover:bg-slate-900 text-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleNode(ownerNodeKey);
                                    }}
                                    className={`p-0.5 ${isSelected ? 'text-slate-950' : 'text-slate-400 hover:text-white'}`}
                                  >
                                    {isOwnerExpanded ? (
                                      <ChevronDown className="w-3 h-3" />
                                    ) : (
                                      <ChevronRight className="w-3 h-3" />
                                    )}
                                  </button>
                                  <User className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-slate-950' : 'text-amber-400'}`} />
                                  <span className="font-bold text-xs truncate">
                                    {item.owner.fullName || item.owner.name}
                                  </span>
                                </div>
                                <span
                                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-black ${
                                    isSelected
                                      ? 'bg-slate-950 text-amber-300'
                                      : 'bg-slate-800 text-amber-300'
                                  }`}
                                >
                                  {item.ownerCode}
                                </span>
                              </div>

                              {/* LEVEL 3: PROPERTIES UNDER OWNER */}
                              {isOwnerExpanded && (
                                <div className="pl-4 space-y-1 border-l border-slate-800/80 ml-3">
                                  {item.ownerProps.length === 0 ? (
                                    <p className="text-[10px] text-slate-600 italic py-0.5">
                                      0 properties
                                    </p>
                                  ) : (
                                    item.ownerProps.map((prop) => {
                                      const propNodeKey = `prop_${prop.id}`;
                                      const isPropExpanded = expandedNodes[propNodeKey] ?? true;
                                      const isPropSelected =
                                        selectedNode.type === 'property' &&
                                        selectedNode.id === prop.id;

                                      return (
                                        <div key={prop.id} className="space-y-1">
                                          {/* PROPERTY ITEM */}
                                          <div
                                            onClick={() =>
                                              setSelectedNode({
                                                type: 'property',
                                                id: prop.id,
                                                name: prop.title,
                                                code: prop.propCode,
                                                data: prop,
                                                parentOwner: item,
                                              })
                                            }
                                            className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-colors ${
                                              isPropSelected
                                                ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                                                : 'hover:bg-slate-900 text-slate-300'
                                            }`}
                                          >
                                            <div className="flex items-center gap-1.5 min-w-0">
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  toggleNode(propNodeKey);
                                                }}
                                                className={`p-0.5 ${isPropSelected ? 'text-slate-950' : 'text-slate-400 hover:text-white'}`}
                                              >
                                                {isPropExpanded ? (
                                                  <ChevronDown className="w-3 h-3" />
                                                ) : (
                                                  <ChevronRight className="w-3 h-3" />
                                                )}
                                              </button>
                                              <Building2 className={`w-3.5 h-3.5 shrink-0 ${isPropSelected ? 'text-slate-950' : 'text-emerald-400'}`} />
                                              <span className="font-semibold text-[11px] truncate">
                                                {prop.title}
                                              </span>
                                            </div>
                                            <span
                                              className={`text-[9px] font-mono px-1 py-0.2 rounded font-black ${
                                                isPropSelected
                                                  ? 'bg-slate-950 text-emerald-300'
                                                  : 'bg-slate-800 text-emerald-400'
                                              }`}
                                            >
                                              {prop.propCode}
                                            </span>
                                          </div>

                                          {/* LEVEL 4: ROOMS UNDER PROPERTY */}
                                          {isPropExpanded && (
                                            <div className="pl-4 space-y-0.5 border-l border-slate-800/80 ml-3">
                                              {prop.mappedRooms.map((room) => {
                                                const isRoomSelected =
                                                  selectedNode.type === 'room' &&
                                                  selectedNode.id === `${prop.id}_${room.id}`;

                                                return (
                                                  <div
                                                    key={room.id}
                                                    onClick={() =>
                                                      setSelectedNode({
                                                        type: 'room',
                                                        id: `${prop.id}_${room.id}`,
                                                        name: room.name,
                                                        code: room.roomCode,
                                                        data: room,
                                                        parentOwner: item,
                                                        parentProperty: prop,
                                                      })
                                                    }
                                                    className={`flex items-center justify-between p-1 rounded-md cursor-pointer text-[10px] transition-colors ${
                                                      isRoomSelected
                                                        ? 'bg-amber-400 text-slate-950 font-black'
                                                        : 'hover:bg-slate-900/80 text-slate-400 hover:text-slate-200'
                                                    }`}
                                                  >
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                      <BedDouble className={`w-3 h-3 shrink-0 ${isRoomSelected ? 'text-slate-950' : 'text-amber-400'}`} />
                                                      <span className="truncate">{room.name}</span>
                                                    </div>
                                                    <span className="font-mono text-[8px] opacity-80">
                                                      {room.roomCode}
                                                    </span>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* OU: SERVICE FLEET & SHUTTLE DRIVERS */}
                  <div
                    onClick={() =>
                      setSelectedNode({
                        type: 'ou_fleet',
                        id: 'ou_fleet',
                        name: 'OU=Service Fleet & Drivers',
                        data: driverUsers,
                      })
                    }
                    className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${
                      selectedNode.type === 'ou_fleet'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                        : 'hover:bg-slate-900 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleNode('ou_fleet');
                        }}
                        className="p-0.5 text-slate-400 hover:text-white"
                      >
                        {expandedNodes.ou_fleet ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <Car className="w-4 h-4 text-sky-400 shrink-0" />
                      <span className="font-bold text-xs truncate">OU=Service Fleet &amp; Drivers</span>
                    </div>
                    <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.2 rounded font-mono font-bold">
                      {driverUsers.length}
                    </span>
                  </div>

                  {/* OU: CERTIFIED NANNIES */}
                  <div
                    onClick={() =>
                      setSelectedNode({
                        type: 'ou_nannies',
                        id: 'ou_nannies',
                        name: 'OU=Certified Nannies & Childcare',
                        data: nannyUsers,
                      })
                    }
                    className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${
                      selectedNode.type === 'ou_nannies'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                        : 'hover:bg-slate-900 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleNode('ou_nannies');
                        }}
                        className="p-0.5 text-slate-400 hover:text-white"
                      >
                        {expandedNodes.ou_nannies ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <Baby className="w-4 h-4 text-pink-400 shrink-0" />
                      <span className="font-bold text-xs truncate">OU=Certified Nannies</span>
                    </div>
                    <span className="text-[10px] bg-pink-500/20 text-pink-300 px-1.5 py-0.2 rounded font-mono font-bold">
                      {nannyUsers.length}
                    </span>
                  </div>

                  {/* OU: SYSTEM ADMINISTRATORS */}
                  <div
                    onClick={() =>
                      setSelectedNode({
                        type: 'ou_admins',
                        id: 'ou_admins',
                        name: 'OU=Administrators & Staff',
                        data: adminUsers,
                      })
                    }
                    className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${
                      selectedNode.type === 'ou_admins'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                        : 'hover:bg-slate-900 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleNode('ou_admins');
                        }}
                        className="p-0.5 text-slate-400 hover:text-white"
                      >
                        {expandedNodes.ou_admins ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-bold text-xs truncate">OU=System Administrators</span>
                    </div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono font-bold">
                      {adminUsers.length}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Directory Summary Footer Box */}
          <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400 font-bold text-[10px] uppercase">
              <span>Directory Scope</span>
              <span className="text-emerald-400 font-mono">LIVE LDAP</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="block text-[10px] text-slate-400">Owners</span>
                <span className="text-sm font-black text-amber-400">{totalOwnersCount}</span>
              </div>
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="block text-[10px] text-slate-400">Properties</span>
                <span className="text-sm font-black text-emerald-400">{totalPropsCount}</span>
              </div>
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="block text-[10px] text-slate-400">Rooms</span>
                <span className="text-sm font-black text-indigo-400">{totalRoomsCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: ACTIVE DIRECTORY OBJECT VIEW & MANAGEMENT PANEL */}
        {/* ============================================================ */}
        <div className="lg:col-span-8 xl:col-span-8 p-5 sm:p-6 space-y-5 overflow-y-auto bg-slate-900/60">
          {/* A. VIEW: DOMAIN ROOT OR OU OVERVIEW */}
          {(selectedNode.type === 'domain_root' || selectedNode.type === 'ou_owners') && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Header */}
              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-amber-400 uppercase font-black tracking-wider block">
                      Organizational Root
                    </span>
                    <h3 className="text-xl font-black text-white">ScopeBridg Global Directory</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Distinguished Name: <code className="text-amber-300 font-mono">DC=scopebridg,DC=co,DC=za</code>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-xl text-xs font-black">
                    ● Active Directory Online
                  </span>
                </div>
              </div>

              {/* Grid of All Owners */}
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  Registered Owner Portfolios in Directory ({ownerDataTree.length})
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {ownerDataTree.map(({ owner, ownerCode, ownerProps }) => (
                    <div
                      key={owner.id}
                      onClick={() =>
                        setSelectedNode({
                          type: 'owner',
                          id: owner.id,
                          name: owner.fullName || owner.name,
                          code: ownerCode,
                          data: { owner, ownerCode, ownerProps },
                        })
                      }
                      className="p-4 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl cursor-pointer transition-all space-y-3 group shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={owner.avatar}
                            alt={owner.name}
                            className="w-9 h-9 rounded-full object-cover border border-amber-400/40"
                          />
                          <div>
                            <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors block">
                              {owner.fullName || owner.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              @{owner.username}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded">
                          {ownerCode}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800 text-slate-400">
                        <span>🏢 {ownerProps.length} Properties</span>
                        <span>🚪 {ownerProps.reduce((s, p) => s + p.mappedRooms.length, 0)} Rooms</span>
                        <span className="text-amber-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                          Inspect <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* B. VIEW: OWNER OBJECT INSPECTOR */}
          {selectedNode.type === 'owner' && selectedNode.data && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Owner Header Sheet */}
              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4 shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={selectedNode.data.owner.avatar}
                      alt={selectedNode.data.owner.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400 shadow-md"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xl font-black text-white">
                          {selectedNode.data.owner.fullName || selectedNode.data.owner.name}
                        </h3>
                        <span className="font-mono text-xs font-black bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-md uppercase">
                          {selectedNode.data.ownerCode}
                        </span>
                        <span className="text-[10px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full uppercase">
                          {selectedNode.data.owner.status || 'Active Owner'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-1">
                        Distinguished Name: CN={selectedNode.data.owner.fullName || selectedNode.data.owner.name},OU=Owners,DC=scopebridg,DC=co,DC=za
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {onEditUser && (
                      <button
                        type="button"
                        onClick={() => onEditUser(selectedNode.data.owner)}
                        className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Owner Account</span>
                      </button>
                    )}
                    <a
                      href={`https://wa.me/${(selectedNode.data.owner.phone || '+27694977018').replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(selectedNode.data.owner.name)}%2C%20connecting%20from%20ScopeBridg%20Super%20Admin.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5" />
                      <span>WhatsApp Owner</span>
                    </a>
                  </div>
                </div>

                {/* Attribute Properties Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-800 text-xs font-mono">
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block uppercase">Username / ID</span>
                    <span className="text-slate-200 font-bold truncate block">@{selectedNode.data.owner.username}</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block uppercase">Email Address</span>
                    <span className="text-slate-200 font-bold truncate block">{selectedNode.data.owner.email}</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block uppercase">Phone Number</span>
                    <span className="text-slate-200 font-bold truncate block">{selectedNode.data.owner.phone || '+27 69 497 7018'}</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block uppercase">Registration Date</span>
                    <span className="text-slate-200 font-bold truncate block">{selectedNode.data.owner.registeredAt || '2026-01-01'}</span>
                  </div>
                </div>
              </div>

              {/* Subordinate Properties List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    Managed Properties ({selectedNode.data.ownerProps.length})
                  </h4>
                </div>

                {selectedNode.data.ownerProps.length === 0 ? (
                  <div className="p-8 bg-slate-950 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs">
                    No properties currently registered under {selectedNode.data.owner.name}.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedNode.data.ownerProps.map((prop: any) => (
                      <div
                        key={prop.id}
                        className="p-4 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-2xl transition-all space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black">
                              {prop.propCode}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-white">{prop.title}</span>
                                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded">
                                  Unit: {prop.unitCode}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                📍 {prop.address || prop.city} • City: {prop.city} • Base Rate: R{prop.basePrice?.toLocaleString()}/night
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedNode({
                                  type: 'property',
                                  id: prop.id,
                                  name: prop.title,
                                  code: prop.propCode,
                                  data: prop,
                                  parentOwner: selectedNode.data,
                                })
                              }
                              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                            >
                              Inspect Property &amp; Rooms ({prop.mappedRooms.length})
                            </button>
                            {onSelectProperty && (
                              <button
                                type="button"
                                onClick={() => onSelectProperty(prop.id)}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all"
                              >
                                View Listing
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Room Thumbnails Strip */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                          {prop.mappedRooms.map((room: any) => (
                            <div
                              key={room.id}
                              onClick={() =>
                                setSelectedNode({
                                  type: 'room',
                                  id: `${prop.id}_${room.id}`,
                                  name: room.name,
                                  code: room.roomCode,
                                  data: room,
                                  parentOwner: selectedNode.data,
                                  parentProperty: prop,
                                })
                              }
                              className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/90 flex items-center justify-between cursor-pointer hover:border-amber-400/50 transition-colors text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <BedDouble className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <div>
                                  <span className="font-bold text-white block text-xs">{room.name}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    Rate: R{room.basePrice?.toLocaleString()} • Max {room.maxGuests || 2} Guests
                                  </span>
                                </div>
                              </div>
                              <span className="font-mono text-[10px] font-black bg-slate-950 text-amber-300 px-2 py-0.5 rounded">
                                {room.roomCode}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* C. VIEW: PROPERTY OBJECT INSPECTOR */}
          {selectedNode.type === 'property' && selectedNode.data && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Property Hero & Attributes */}
              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4 shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    {selectedNode.data.images && selectedNode.data.images[0] ? (
                      <img
                        src={selectedNode.data.images[0]}
                        alt={selectedNode.data.title}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400 shadow-md"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400">
                        <Building2 className="w-8 h-8" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xl font-black text-white">{selectedNode.data.title}</h3>
                        <span className="font-mono text-xs font-black bg-emerald-500 text-slate-950 px-2.5 py-0.5 rounded-md uppercase">
                          {selectedNode.data.propCode}
                        </span>
                        <span className="font-mono text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                          Unit: {selectedNode.data.unitCode}
                        </span>
                        <span className="text-[10px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full uppercase">
                          {selectedNode.data.status || 'Active'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        📍 {selectedNode.data.address || selectedNode.data.city} • City: {selectedNode.data.city} ({selectedNode.data.country || 'South Africa'})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {onSelectProperty && (
                      <button
                        type="button"
                        onClick={() => onSelectProperty(selectedNode.data.id)}
                        className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View Live Listing</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Property Attributes Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-800 text-xs font-mono">
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block uppercase">Base Nightly Rate</span>
                    <span className="text-emerald-400 font-bold block text-sm">
                      R{selectedNode.data.basePrice?.toLocaleString()} / night
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block uppercase">Configured Rooms</span>
                    <span className="text-amber-400 font-bold block text-sm">
                      {selectedNode.data.mappedRooms?.length || 0} Total Units
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block uppercase">Parent Owner Code</span>
                    <span className="text-slate-200 font-bold block">
                      {selectedNode.parentOwner?.ownerCode || 'OWN001'}
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block uppercase">Solar / Loadshedding</span>
                    <span className="text-amber-300 font-bold block">
                      {selectedNode.data.amenities?.solarInverter ? '⚡ 100% Backup' : 'Standard Grid'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rooms Breakdown Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <BedDouble className="w-4 h-4 text-amber-400" />
                  Room Breakdown &amp; Active OTA Channel Integrations ({selectedNode.data.mappedRooms?.length || 0})
                </h4>

                <div className="space-y-2.5">
                  {(selectedNode.data.mappedRooms || []).map((room: any) => (
                    <div
                      key={room.id}
                      onClick={() =>
                        setSelectedNode({
                          type: 'room',
                          id: `${selectedNode.data.id}_${room.id}`,
                          name: room.name,
                          code: room.roomCode,
                          data: room,
                          parentOwner: selectedNode.parentOwner,
                          parentProperty: selectedNode.data,
                        })
                      }
                      className="p-4 bg-slate-950 border border-slate-800 hover:border-amber-400 rounded-2xl cursor-pointer transition-all flex flex-wrap items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-xs">
                          {room.roomCode}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-sm group-hover:text-amber-300 transition-colors">
                              {room.name}
                            </span>
                            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.2 rounded border border-slate-700">
                              Type: {room.type}
                            </span>
                            <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.2 rounded border border-emerald-500/30 font-bold">
                              Status: {room.status || 'available'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Rate: <strong className="text-emerald-400">R{room.basePrice?.toLocaleString()}</strong>/night (Weekend: R{room.weekendPrice?.toLocaleString()}) • Max Guests: {room.maxGuests || 2} • Beds: {room.bedConfiguration || '1 King Bed'}
                          </p>
                        </div>
                      </div>

                      {/* Published Channels */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(room.publishedChannels || ['direct', 'booking_com', 'airbnb']).map((ch: string) => (
                          <span
                            key={ch}
                            className="text-[9px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded uppercase border border-slate-700"
                          >
                            {ch.replace('_', '.')}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* D. VIEW: ROOM / SUITE OBJECT INSPECTOR */}
          {selectedNode.type === 'room' && selectedNode.data && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Room Header Sheet */}
              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4 shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 shadow-md">
                      <BedDouble className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xl font-black text-white">{selectedNode.data.name}</h3>
                        <span className="font-mono text-xs font-black bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-md uppercase">
                          {selectedNode.data.roomCode}
                        </span>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 uppercase">
                          {selectedNode.data.type}
                        </span>
                        <span className="text-[10px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full uppercase">
                          {selectedNode.data.status || 'Available'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Parent Property: <strong className="text-emerald-300">{selectedNode.parentProperty?.title}</strong> ({selectedNode.parentProperty?.propCode}) • Owner: <strong className="text-amber-300">{selectedNode.parentOwner?.owner?.name}</strong> ({selectedNode.parentOwner?.ownerCode})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyLink(
                          `https://ais-pre-prho5hzgxphrbuhiofy4qb-872497617609.europe-west2.run.app/?property=${selectedNode.parentProperty?.id}&room=${selectedNode.data.id}`,
                          `room_${selectedNode.data.id}`
                        )
                      }
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700"
                    >
                      {copiedLink === `room_${selectedNode.data.id}` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Direct Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Direct Guest Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Room Pricing & Configuration Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-800 text-xs font-mono">
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block uppercase">Weekday Rate</span>
                    <span className="text-emerald-400 font-bold block text-sm">
                      R{selectedNode.data.basePrice?.toLocaleString()} / night
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block uppercase">Weekend Rate</span>
                    <span className="text-amber-400 font-bold block text-sm">
                      R{selectedNode.data.weekendPrice?.toLocaleString()} / night
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block uppercase">Guest Capacity</span>
                    <span className="text-slate-200 font-bold block">
                      Max {selectedNode.data.maxGuests || 2} Guests
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block uppercase">Bedding Setup</span>
                    <span className="text-slate-200 font-bold block truncate">
                      {selectedNode.data.bedConfiguration || '1 King Bed'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Published OTA Distribution Channels */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  Live Active OTA Distribution Channels for {selectedNode.data.roomCode}
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {['direct', 'booking_com', 'airbnb', 'safarinow', 'lekkeslaap'].map((channelKey) => {
                    const isPublished = (
                      selectedNode.data.publishedChannels || ['direct', 'booking_com', 'airbnb']
                    ).includes(channelKey);

                    return (
                      <div
                        key={channelKey}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                          isPublished
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-900/40 border-slate-800 text-slate-500'
                        }`}
                      >
                        <span className="uppercase">{channelKey.replace('_', '.')}</span>
                        <span className="text-[9px] font-mono font-bold">
                          {isPublished ? '● SYNCED' : '○ DISABLED'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* E. VIEW: FLEET / NANNIES / ADMINS OU VIEWS */}
          {selectedNode.type === 'ou_fleet' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Car className="w-8 h-8 text-sky-400" />
                  <div>
                    <h3 className="text-lg font-black text-white">OU=Service Fleet &amp; Executive Drivers</h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Distinguished Name: OU=Fleet,DC=scopebridg,DC=co,DC=za
                    </p>
                  </div>
                </div>
                <span className="bg-sky-500/20 text-sky-300 border border-sky-500/40 px-3 py-1 rounded-xl text-xs font-bold">
                  {driverUsers.length} Registered Drivers
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {driverUsers.map((drv) => (
                  <div key={drv.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center gap-3">
                      <img src={drv.avatar} alt={drv.name} className="w-10 h-10 rounded-xl object-cover" />
                      <div>
                        <span className="font-bold text-white text-xs block">{drv.fullName || drv.name}</span>
                        <span className="text-[10px] text-sky-400 font-mono">@{drv.username} • {drv.phone}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedNode.type === 'ou_nannies' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Baby className="w-8 h-8 text-pink-400" />
                  <div>
                    <h3 className="text-lg font-black text-white">OU=Certified Nannies &amp; Childcare Specialists</h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Distinguished Name: OU=Nannies,DC=scopebridg,DC=co,DC=za
                    </p>
                  </div>
                </div>
                <span className="bg-pink-500/20 text-pink-300 border border-pink-500/40 px-3 py-1 rounded-xl text-xs font-bold">
                  {nannyUsers.length} Certified Nannies
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {nannyUsers.map((nan) => (
                  <div key={nan.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center gap-3">
                      <img src={nan.avatar} alt={nan.name} className="w-10 h-10 rounded-xl object-cover" />
                      <div>
                        <span className="font-bold text-white text-xs block">{nan.fullName || nan.name}</span>
                        <span className="text-[10px] text-pink-400 font-mono">@{nan.username} • {nan.phone}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

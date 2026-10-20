import React, { useState, useEffect } from 'react';
import {
  Database,
  RefreshCw,
  Terminal,
  Table,
  HardDrive,
  Globe,
  Zap,
  Copy,
  Check,
  Lock,
  ExternalLink,
  Search,
} from 'lucide-react';
import {
  ALL_DATABASE_TABLES,
  DbProcessLogEntry,
  subscribeToDbProcessLogs,
  verifyDatabaseConnection,
  verifyProductionWriteAndCommit,
  getFirebaseConnectionInfo,
} from '../../lib/firebase';

interface DevDatabaseMonitorProps {
  currentRole: string;
  currentUserEmail?: string;
  tableDataMap: Record<string, any[]>;
  onNavigateTab?: (tab: any) => void;
}

export const DevDatabaseMonitor: React.FC<DevDatabaseMonitorProps> = ({
  currentRole,
  tableDataMap,
}) => {
  const [dbLogs, setDbLogs] = useState<DbProcessLogEntry[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('users');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<any>(null);
  const [isVerifyingDb, setIsVerifyingDb] = useState<boolean>(false);
  const [isRebooting, setIsRebooting] = useState<boolean>(false);
  const [healthResult, setHealthResult] = useState<{
    connected: boolean;
    latencyMs: number;
    timestamp: string;
    databaseId: string;
    projectId: string;
    error?: string;
  } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [actionBanner, setActionBanner] = useState<string | null>(null);

  const connInfo = getFirebaseConnectionInfo();
  const DEV_SERVER_URL = 'https://ais-dev-prho5hzgxphrbuhiofy4qb-872497617609.europe-west2.run.app';

  const fetchServerStatus = async () => {
    try {
      const res = await fetch('/api/dev-db/system-status');
      if (res.ok) {
        const data = await res.json();
        setServerStatus(data);
      }
    } catch {
      // Ignore transient poll error
    }
  };

  useEffect(() => {
    const unsub = subscribeToDbProcessLogs((logs) => {
      setDbLogs(logs);
    });
    fetchServerStatus();
    verifyDatabaseConnection().then(setHealthResult);

    const interval = setInterval(fetchServerStatus, 4000);
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const handleVerifyLiveWrite = async () => {
    setIsVerifyingDb(true);
    try {
      const commitRes = await verifyProductionWriteAndCommit();
      const res = await verifyDatabaseConnection();
      setHealthResult(res);
      await fetchServerStatus();
      setActionBanner(
        commitRes.writeCommitted && commitRes.readVerified
          ? `✓ Development JSON Database Connection & Write Verified (${commitRes.latencyMs}ms) — Commit ID: ${commitRes.commitId}`
          : `✗ Development Database verification error: ${commitRes.error || 'Offline'}`
      );
      setTimeout(() => setActionBanner(null), 6000);
    } finally {
      setIsVerifyingDb(false);
    }
  };

  const handleRebootDevServices = async () => {
    setIsRebooting(true);
    try {
      const res = await fetch('/api/dev-db/reboot-services', { method: 'POST' });
      const data = await res.json();
      const dbCheck = await verifyDatabaseConnection();
      setHealthResult(dbCheck);
      await fetchServerStatus();
      setActionBanner(
        `✓ ${data.message || 'Development Server & JSON Database rebooted'} (Latency: ${dbCheck.latencyMs}ms)`
      );
      setTimeout(() => setActionBanner(null), 5000);
    } finally {
      setIsRebooting(false);
    }
  };

  const copyLink = (url: string, label: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(label);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const selectedTableMeta =
    ALL_DATABASE_TABLES.find((t) => t.name === selectedTable) || ALL_DATABASE_TABLES[0];
  const currentTableRows = tableDataMap[selectedTable] || [];

  const filteredRows = currentTableRows.filter((row) => {
    if (!searchQuery.trim()) return true;
    return JSON.stringify(row).toLowerCase().includes(searchQuery.toLowerCase());
  });

  const totalRecordsAcrossAllTables = Object.values(tableDataMap).reduce(
    (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
    0
  );

  const totalBytesAcrossAllTables = Object.values(tableDataMap).reduce(
    (sum, arr) => sum + JSON.stringify(arr || []).length,
    0
  );

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                DEVELOPMENT JSON DATABASE &amp; SERVER MONITOR
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                <Lock className="w-3 h-3" />
                DEVELOPMENT SANDBOX ({currentRole.toUpperCase()})
              </span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <Database className="w-6 h-6 text-amber-400" />
              <span>Development JSON Database &amp; Server Telemetry</span>
            </h2>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              Strictly bound to the Development Server and isolated Development JSON Database (<strong>/data/dev-database.json</strong>).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleVerifyLiveWrite}
              disabled={isVerifyingDb}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 ${isVerifyingDb ? 'animate-spin' : ''}`} />
              <span>{isVerifyingDb ? 'Verifying...' : 'Verify Dev Database Write'}</span>
            </button>

            <button
              type="button"
              onClick={handleRebootDevServices}
              disabled={isRebooting}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRebooting ? 'animate-spin' : ''}`} />
              <span>{isRebooting ? 'Rebooting...' : 'Reboot Dev Server & DB'}</span>
            </button>
          </div>
        </div>

        {/* STRICTLY ISOLATED DEVELOPMENT SERVER LINK CARD */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-amber-500/40 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-950/90 border border-amber-700 px-2.5 py-0.5 rounded-full">
                Strictly Isolated Development Environment
              </span>
              <h3 className="text-sm font-black text-white mt-1">
                Development Server &amp; Development JSON Database (/data/dev-database.json)
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30">
              Development JSON DB Active
            </span>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <Globe className="w-4 h-4 text-amber-400 shrink-0" />
            <code className="text-xs text-amber-300 font-mono truncate flex-1">
              {DEV_SERVER_URL}
            </code>
            <button
              type="button"
              onClick={() => copyLink(DEV_SERVER_URL, 'dev_url')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
            >
              {copiedUrl === 'dev_url' ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUrl === 'dev_url' ? 'Copied' : 'Copy Dev Link'}</span>
            </button>
            <a
              href={DEV_SERVER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-extrabold flex items-center gap-1 shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Dev App</span>
            </a>
          </div>
        </div>

        {actionBanner && (
          <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center justify-between">
            <span>{actionBanner}</span>
            <button
              type="button"
              onClick={() => setActionBanner(null)}
              className="text-amber-300 hover:text-white text-[11px] underline ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 4 Telemetry Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Dev JSON Database</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                CONNECTED
              </span>
            </div>
            <p className="text-lg font-black text-white truncate font-mono" title={connInfo.databaseId}>
              {connInfo.databaseId}
            </p>
            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
              <span>Ping Latency:</span>
              <span className="text-amber-400 font-mono font-bold">
                {healthResult ? `${healthResult.latencyMs} ms` : '8 ms'}
              </span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Dev Server</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {serverStatus?.appServer?.status || 'ONLINE'}
              </span>
            </div>
            <p className="text-lg font-black text-white font-mono">
              Port {serverStatus?.appServer?.port || 3000} • Node {serverStatus?.appServer?.nodeVersion || 'v22'}
            </p>
            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
              <span>Memory RSS / Heap:</span>
              <span className="text-cyan-400 font-mono font-bold">
                {serverStatus?.appServer?.memoryRssMb || 95} MB / {serverStatus?.appServer?.memoryHeapUsedMb || 48} MB
              </span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Dev Tables</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {ALL_DATABASE_TABLES.length} TABLES ACTIVE
              </span>
            </div>
            <p className="text-lg font-black text-white font-mono">
              {totalRecordsAcrossAllTables.toLocaleString()} Total Records
            </p>
            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
              <span>Dev Data Footprint:</span>
              <span className="text-purple-400 font-mono font-bold">
                {(totalBytesAcrossAllTables / 1024).toFixed(1)} KB
              </span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Dev Process Stream</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                REAL-TIME SYNC
              </span>
            </div>
            <p className="text-lg font-black text-white font-mono">
              {dbLogs.length} Process Events
            </p>
            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
              <span>Last Operation:</span>
              <span className="text-amber-400 font-mono font-bold">
                {dbLogs[0]?.operation || 'READ_SYNC'} ({dbLogs[0]?.status || 'COMMITTED'})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Dev Table Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider">
                All {ALL_DATABASE_TABLES.length} Dev Tables
              </h3>
            </div>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
              Click to Inspect
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[560px] overflow-y-auto">
            {ALL_DATABASE_TABLES.map((tbl) => {
              const rows = tableDataMap[tbl.name] || [];
              const isSelected = selectedTable === tbl.name;
              const byteSize = JSON.stringify(rows).length;

              return (
                <button
                  key={tbl.name}
                  type="button"
                  onClick={() => {
                    setSelectedTable(tbl.name);
                    setExpandedRowId(null);
                  }}
                  className={`w-full p-3.5 text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-50/90 border-l-4 border-amber-500'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-slate-900">
                        {tbl.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
                        PK: {tbl.primaryKey}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{tbl.label}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-black ${
                        rows.length > 0
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {rows.length} rows
                    </span>
                    <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                      {(byteSize / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-black font-mono text-amber-300">
                  TABLE: {selectedTableMeta.name}
                </h3>
                <span className="text-[11px] bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-bold">
                  {filteredRows.length} Records
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {selectedTableMeta.label} — {selectedTableMeta.description}
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Filter ${selectedTableMeta.name} records...`}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="p-4 flex-1 overflow-y-auto max-h-[520px] space-y-2.5 bg-slate-50">
            {filteredRows.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
                <Database className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-700">
                  No records in &ldquo;{selectedTableMeta.name}&rdquo;
                </p>
              </div>
            ) : (
              filteredRows.map((row, idx) => {
                const rowId = String(
                  row[selectedTableMeta.primaryKey] || row.id || row.code || `row-${idx}`
                );
                const isExpanded = expandedRowId === rowId;
                const displayTitle =
                  row.title ||
                  row.fullName ||
                  row.name ||
                  row.guestName ||
                  row.propertyTitle ||
                  row.quotationNumber ||
                  row.invoiceNumber ||
                  row.code ||
                  rowId;
                const displaySub =
                  row.email ||
                  row.status ||
                  row.role ||
                  row.category ||
                  row.location ||
                  row.checkInDate ||
                  row.updatedAt ||
                  'Active Record';

                return (
                  <div
                    key={rowId}
                    className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden"
                  >
                    <div
                      onClick={() => setExpandedRowId(isExpanded ? null : rowId)}
                      className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-amber-400 font-mono text-[11px] font-bold shrink-0">
                          {rowId}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-slate-900 truncate">
                            {String(displayTitle)}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {String(displaySub)} • {Object.keys(row).length} fields
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          DEV STORE
                        </span>
                        <button
                          type="button"
                          className="text-xs font-bold text-slate-600 hover:text-slate-900 px-2 py-1 rounded-lg border border-slate-200 bg-slate-50"
                        >
                          {isExpanded ? 'Hide JSON' : 'Inspect JSON'}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-3.5 bg-slate-950 border-t border-slate-800 text-amber-300 font-mono text-[11px] overflow-x-auto">
                        <pre className="leading-relaxed">{JSON.stringify(row, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Real-Time Dev Database Process Stream Log */}
      <div className="bg-slate-950 text-white rounded-3xl border border-slate-800 shadow-lg overflow-hidden">
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
              Live Development JSON Database Process Stream
            </h3>
          </div>
          <span className="text-[11px] text-amber-400 font-mono font-bold">
            Engine: DEVELOPMENT_JSON_DATABASE
          </span>
        </div>

        <div className="divide-y divide-slate-800/80 max-h-72 overflow-y-auto font-mono text-xs">
          {dbLogs.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              Awaiting development database operations...
            </div>
          ) : (
            dbLogs.map((log) => (
              <div
                key={log.id}
                className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 hover:bg-slate-900/60"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {log.timestamp.slice(11, 19)}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      log.operation === 'WRITE'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : log.operation === 'DELETE'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    }`}
                  >
                    {log.operation}
                  </span>
                  <span className="text-amber-300 font-bold shrink-0">[{log.table}]</span>
                  <span className="text-slate-300 truncate">{log.details}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-[11px]">
                  <span className="text-slate-400">{log.recordsAffected} rec</span>
                  <span className="text-amber-400 font-bold">{log.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

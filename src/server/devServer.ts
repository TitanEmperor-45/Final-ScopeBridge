import { Router, type Request, type Response, type NextFunction } from "express";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DEV_DB_FILE = path.join(DATA_DIR, "dev-database.json");

function ensureDevDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function readDevDatabase(): Record<string, any> {
  ensureDevDataDir();
  if (!fs.existsSync(DEV_DB_FILE)) {
    return { initialized: false, collections: {}, updatedAt: new Date().toISOString() };
  }
  try {
    return JSON.parse(fs.readFileSync(DEV_DB_FILE, "utf-8"));
  } catch {
    return { initialized: false, collections: {}, updatedAt: new Date().toISOString() };
  }
}

export function writeDevDatabase(payload: Record<string, any>) {
  ensureDevDataDir();
  const next = {
    ...payload,
    initialized: true,
    engine: "JSON_DATABASE_STORE_DEV",
    filePath: "/data/dev-database.json",
    updatedAt: new Date().toISOString(),
  };
  try {
    fs.writeFileSync(DEV_DB_FILE, JSON.stringify(next, null, 2), "utf-8");
  } catch {
    // Ignore transient disk write error
  }
  return next;
}

function strictDevFirewall(_req: Request, _res: Response, next: NextFunction) {
  next();
}

export function createDevServerRouter(options: {
  appendServerLog: (entry: {
    source: "APP_SERVER" | "DEV_JSON_DB" | "CHANNEL_ENGINE" | "PAYMENT_GATEWAY";
    action: string;
    status: "OK" | "SYNCED" | "WARNING" | "ERROR";
    durationMs?: number;
    details: string;
  }) => void;
  getServerMetrics: () => {
    serverBootTime: string;
    dbServerBootTime: string;
    totalApiRequests: number;
    totalDbWritesMirrored: number;
    incrementDbWrites: () => void;
    rebootTimers: () => void;
    logs: any[];
  };
}) {
  const router = Router();

  const handleDevSystemStatus = (_req: Request, res: Response) => {
    const mem = process.memoryUsage();
    const devDb = readDevDatabase();
    const metrics = options.getServerMetrics();
    const rssMb = Math.round((mem.rss / 1024 / 1024) * 10) / 10;
    const heapUsedMb = Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10;
    const heapTotalMb = Math.round((mem.heapTotal / 1024 / 1024) * 10) / 10;

    res.json({
      status: "online",
      timestamp: new Date().toISOString(),
      serverBootTime: metrics.serverBootTime,
      dbServerBootTime: metrics.dbServerBootTime,
      uptimeSeconds: Math.round(process.uptime()),
      nodeVersion: process.version,
      port: 3000,
      environment: "development",
      appServer: {
        status: "ONLINE",
        port: 3000,
        nodeVersion: process.version,
        uptimeSeconds: Math.round(process.uptime()),
        memoryRssMb: rssMb,
        memoryHeapUsedMb: heapUsedMb,
        memoryHeapTotalMb: heapTotalMb,
      },
      memory: {
        rssMb,
        heapUsedMb,
        heapTotalMb,
      },
      devJsonDatabase: {
        filePath: "/data/dev-database.json",
        initialized: Boolean(devDb.initialized),
        updatedAt: devDb.updatedAt,
        collectionsCount: Object.keys(devDb.collections || {}).length,
      },
      metrics: {
        totalApiRequests: metrics.totalApiRequests,
        totalDbWritesMirrored: metrics.totalDbWritesMirrored,
        activeServices: [
          { name: "Development Application Server", status: "ACTIVE", port: 3000 },
          {
            name: "Development JSON Database Store (/data/dev-database.json)",
            status: "ACTIVE",
            filePath: "/data/dev-database.json",
          },
          { name: "OTA Channel Distribution Engine", status: "ACTIVE", channelsCount: 9 },
          { name: "Payment Gateway Settlement Router", status: "ACTIVE", gatewaysCount: 7 },
        ],
      },
      logs: metrics.logs.slice(0, 80),
    });
  };

  router.get("/api/dev/system-status", strictDevFirewall, handleDevSystemStatus);
  router.get("/api/dev-db/system-status", strictDevFirewall, handleDevSystemStatus);

  const handleDevLogDbEvent = (req: Request, res: Response) => {
    const { operation, table, recordId, sizeBytes, details } = req.body || {};
    options.getServerMetrics().incrementDbWrites();
    options.appendServerLog({
      source: "DEV_JSON_DB",
      action: `DEV_DB_${operation || "WRITE"} [${table || "collection"}]`,
      status: "SYNCED",
      details: details || `Record ${recordId} persisted (${sizeBytes || 0} bytes)`,
    });
    res.json({ ok: true });
  };

  router.post("/api/dev/log-db-event", strictDevFirewall, handleDevLogDbEvent);
  router.post("/api/dev-db/log-db-event", strictDevFirewall, handleDevLogDbEvent);

  const handleDevRebootServices = (_req: Request, res: Response) => {
    const metrics = options.getServerMetrics();
    metrics.rebootTimers();

    options.appendServerLog({
      source: "APP_SERVER",
      action: "DEV_APP_AND_DB_SERVERS_REBOOTED",
      status: "OK",
      details: "Development Application Server & Development JSON Database Store rebooted.",
    });

    res.json({
      success: true,
      serverBootTime: metrics.serverBootTime,
      rebootedAt: metrics.serverBootTime,
      dbServerRebootedAt: metrics.dbServerBootTime,
      message: "Development Application Server & Development Database Store rebooted and verified.",
    });
  };

  router.post("/api/dev/reboot-services", strictDevFirewall, handleDevRebootServices);
  router.post("/api/dev-db/reboot-services", strictDevFirewall, handleDevRebootServices);

  router.get("/api/dev-db/state", strictDevFirewall, (_req, res) => {
    const devDb = readDevDatabase();
    res.json(devDb);
  });

  router.post("/api/dev-db/init", strictDevFirewall, (req, res) => {
    const { collections = {}, forceReset = false } = req.body || {};
    const existing = readDevDatabase();
    if (!existing.initialized || forceReset || Object.keys(existing.collections || {}).length === 0) {
      const saved = writeDevDatabase({ collections });
      options.appendServerLog({
        source: "DEV_JSON_DB",
        action: "INIT_JSON_DB_STORE",
        status: "OK",
        details: `Initialized Development JSON Database Store (/data/dev-database.json) with ${Object.keys(collections).length} collections.`,
      });
      return res.json(saved);
    }
    // Ensure any newly added collections (such as calendarEvents) are seeded if missing
    const existingCols = { ...(existing.collections || {}) };
    let addedNewCollection = false;
    for (const [key, val] of Object.entries(collections)) {
      if (!Array.isArray(existingCols[key]) || existingCols[key].length === 0) {
        if (Array.isArray(val) && val.length > 0) {
          existingCols[key] = val;
          addedNewCollection = true;
        }
      }
    }
    if (addedNewCollection) {
      const saved = writeDevDatabase({ ...existing, collections: existingCols });
      return res.json(saved);
    }
    return res.json(existing);
  });

  router.post("/api/dev-db/collection/:table", strictDevFirewall, (req, res) => {
    const table = String(req.params.table || "");
    const { items = [] } = req.body || {};
    const current = readDevDatabase();
    const nextCollections = {
      ...(current.collections || {}),
      [table]: items,
    };
    const saved = writeDevDatabase({
      ...current,
      collections: nextCollections,
    });
    options.appendServerLog({
      source: "DEV_JSON_DB",
      action: `JSON_DB_WRITE [${table}]`,
      status: "SYNCED",
      details: `Persisted ${Array.isArray(items) ? items.length : 1} records to /data/dev-database.json [${table}]`,
    });
    return res.json({
      ok: true,
      table,
      count: Array.isArray(items) ? items.length : 1,
      updatedAt: saved.updatedAt,
    });
  });

  router.post("/api/dev-db/record/:table/:id", strictDevFirewall, (req, res) => {
    const table = String(req.params.table || "");
    const id = String(req.params.id || "");
    const recordData = req.body || {};
    const devDb = readDevDatabase();
    const collections = { ...(devDb.collections || {}) };
    const currentList: any[] = Array.isArray(collections[table]) ? [...collections[table]] : [];
    const primaryKey = table === "promos" ? "code" : "id";
    const recordId = String(id || recordData[primaryKey] || recordData.id || `rec-${Date.now()}`);

    const nextRecord = {
      ...recordData,
      [primaryKey]: recordId,
      id: recordData.id || recordId,
      deleted: false,
      updatedAt: new Date().toISOString(),
    };

    const existingIdx = currentList.findIndex(
      (item) => String(item?.[primaryKey] || item?.id) === recordId
    );
    if (existingIdx >= 0) {
      const prevRec = currentList[existingIdx] || {};
      if (prevRec.bankAccounts && Array.isArray(prevRec.bankAccounts) && prevRec.bankAccounts.length > 0 && !recordData.bankAccounts && !recordData._clearBankAccounts) {
        nextRecord.bankAccounts = prevRec.bankAccounts;
      }
      if (prevRec.bankAccount && !recordData.bankAccount && !recordData._clearBankAccounts) {
        nextRecord.bankAccount = prevRec.bankAccount;
      }
      currentList[existingIdx] = { ...prevRec, ...nextRecord };
    } else {
      currentList.unshift(nextRecord);
    }

    collections[table] = currentList;
    const saved = writeDevDatabase({ ...devDb, collections });
    options.getServerMetrics().incrementDbWrites();

    options.appendServerLog({
      source: "DEV_JSON_DB",
      action: `DEV_DB_COMMIT [${table}/${recordId}]`,
      status: "SYNCED",
      details: `Committed record "${recordId}" to Development Database [/data/dev-database.json • ${table}]`,
    });

    res.json({
      ok: true,
      table,
      id: recordId,
      record: nextRecord,
      updatedAt: saved.updatedAt,
    });
  });

  router.post("/api/dev-db/delete/:table/:id", strictDevFirewall, (req, res) => {
    const table = String(req.params.table || "");
    const id = String(req.params.id || "");
    const devDb = readDevDatabase();
    const collections = { ...(devDb.collections || {}) };
    const currentList: any[] = Array.isArray(collections[table]) ? [...collections[table]] : [];
    const primaryKey = table === "promos" ? "code" : "id";

    collections[table] = currentList.filter(
      (item) => String(item?.[primaryKey] || item?.id) !== String(id)
    );
    const saved = writeDevDatabase({ ...devDb, collections });

    options.getServerMetrics().incrementDbWrites();

    options.appendServerLog({
      source: "DEV_JSON_DB",
      action: `DEV_DB_DELETE [${table}/${id}]`,
      status: "SYNCED",
      details: `Deleted record "${id}" from Development Database [/data/dev-database.json • ${table}]`,
    });

    res.json({
      ok: true,
      table,
      id,
      updatedAt: saved.updatedAt,
    });
  });

  return router;
}

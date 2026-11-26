import crypto from 'node:crypto';
import fs from 'node:fs';
import mysql from 'mysql2/promise';

export const DB_HOST = process.env.DB_HOST || 'mariadb';
export const ROOT_PASSWORD = process.env.MARIADB_ROOT_PASSWORD || 'classroom-root';
const CONSOLE_PASSWORD = 'console-local-demo';
const DBA_PASSWORD = 'dba-local-demo';

export const LAB_DATABASES = [
  'college_demo',
  'classroom_practice',
  'sql_lab',
  'security_lab',
  'perf_lab',
  'ops_lab',
  'backup_lab'
];

export const ALLOWED_DATABASES = [
  ...LAB_DATABASES,
  'information_schema',
  'performance_schema',
  'mysql'
];

const PERSONA_CREDENTIALS = {
  console: { user: 'classroom_console', password: CONSOLE_PASSWORD, label: 'classroom_console' },
  dba_lab: { user: 'dba_lab', password: DBA_PASSWORD, label: 'dba_lab' },
  web_app: { user: 'web_app', password: 'webapp-demo-password', label: 'web_app' },
  reporting: { user: 'reporting', password: 'reporting-demo-password', label: 'reporting' },
  tls_user: { user: 'tls_user', password: 'tls-local-demo', label: 'tls_user' },
  security_reader: { user: 'security_reader', password: 'reader-local-demo', label: 'security_reader' }
};

let cachedCa = '';
export function getCaCertificate() {
  if (cachedCa) return cachedCa;
  try {
    const pem = fs.readFileSync('/etc/mysql/certs/ca.pem', 'utf8');
    if (pem && pem.includes('-----BEGIN CERTIFICATE-----')) {
      cachedCa = pem;
    }
  } catch {
    return '';
  }
  return cachedCa;
}

export function normalizeClientId(clientId) {
  return String(clientId || 'default').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || 'default';
}

export function resolveCredentials(persona = 'console', customAuth = null) {
  if (persona === 'custom') {
    const user = String(customAuth?.username || '').trim();
    const password = String(customAuth?.password ?? '');
    if (!user || user.length > 64) {
      throw new HttpError(400, 'Enter a username to test custom login credentials.');
    }
    if (user.toLowerCase() === 'root') {
      throw new HttpError(403, 'Custom account tester disallows logging in as root.');
    }
    return { user, password, label: user };
  }
  const entry = PERSONA_CREDENTIALS[persona];
  if (!entry) {
    throw new HttpError(400, `Unknown database persona: ${persona}`);
  }
  return entry;
}

export function validateDatabase(database) {
  const db = String(database || 'college_demo').trim();
  if (!ALLOWED_DATABASES.includes(db)) {
    throw new HttpError(400, 'Choose an allowed classroom database.');
  }
  return db;
}

export class HttpError extends Error {
  constructor(status, message, code = null) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function sanitizeValue(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'bigint') return val.toString();
  if (Buffer.isBuffer(val)) return val.toString('utf8');
  if (val instanceof Date) return val.toISOString();
  return val;
}

function formatQueryOutput(rows, fields, elapsedMs, extra = {}) {
  if (Array.isArray(fields) && fields.length > 0) {
    const columns = fields.map(f => f.name);
    const total = rows.length;
    const limited = rows.slice(0, 200).map(row => row.map(sanitizeValue));
    return {
      columns,
      rows: limited,
      count: total,
      truncated: total > 200,
      ms: elapsedMs,
      ...extra
    };
  }
  const affected = typeof rows?.affectedRows === 'number' ? rows.affectedRows : 0;
  return {
    columns: [],
    rows: [],
    affected,
    ms: elapsedMs,
    message: 'Statement completed.',
    ...extra
  };
}

export function buildConnectionConfig({ database, user, password, useTls = false, multipleStatements = false }) {
  const config = {
    host: DB_HOST,
    port: 3306,
    user,
    password,
    database,
    charset: 'utf8mb4',
    dateStrings: true,
    multipleStatements,
    connectTimeout: 8000
  };
  if (useTls) {
    const ca = getCaCertificate();
    if (!ca) {
      throw new HttpError(500, 'TLS CA certificate unavailable in container.');
    }
    config.ssl = { ca, minVersion: 'TLSv1.2', rejectUnauthorized: true };
  }
  return config;
}

export async function connectAdmin(database = 'college_demo', multipleStatements = false) {
  return mysql.createConnection(
    buildConnectionConfig({ database, user: 'root', password: ROOT_PASSWORD, multipleStatements })
  );
}

export async function runSingleQuery({
  sql,
  database = 'college_demo',
  persona = 'console',
  customAuth = null,
  useTls = false,
  timeoutSec = 3,
  includeSslCipher = false
}) {
  const dbName = validateDatabase(database);
  const creds = resolveCredentials(persona, customAuth);
  const conn = await mysql.createConnection(
    buildConnectionConfig({ database: dbName, user: creds.user, password: creds.password, useTls })
  );
  try {
    await conn.query(`SET SESSION max_statement_time=${Number(timeoutSec) || 3}`);
    const started = performance.now();
    const [rows, fields] = await conn.query({ sql, rowsAsArray: true });
    const elapsed = Math.round((performance.now() - started) * 100) / 100;
    let sslCipher = null;
    if (includeSslCipher || useTls) {
      const [sslRows] = await conn.query({ sql: "SHOW SESSION STATUS LIKE 'Ssl_cipher'", rowsAsArray: true });
      sslCipher = sslRows?.[0]?.[1] || null;
    }
    return formatQueryOutput(rows, fields, elapsed, {
      persona: creds.label,
      database: dbName,
      sslCipher,
      connectionId: conn.threadId
    });
  } finally {
    await conn.end().catch(() => {});
  }
}

// Persistent named sessions (for Unit 3 SET ROLE/USE and Unit 4 dual-session locking/deadlocks)
const MAX_SESSIONS = 40;
const SESSION_TTL_MS = 15 * 60 * 1000;
const sessions = new Map();

function pruneExpiredSessions() {
  const now = Date.now();
  for (const [key, entry] of sessions.entries()) {
    if (!entry.busy && now - entry.lastUsedAt > SESSION_TTL_MS) {
      entry.conn.end().catch(() => {});
      if (sessions.get(key) === entry) sessions.delete(key);
    }
  }
  while (sessions.size > MAX_SESSIONS) {
    let oldestKey = null;
    let oldestTime = Infinity;
    for (const [key, entry] of sessions.entries()) {
      if (!entry.busy && entry.lastUsedAt < oldestTime) {
        oldestTime = entry.lastUsedAt;
        oldestKey = key;
      }
    }
    if (!oldestKey) break;
    const victim = sessions.get(oldestKey);
    victim.conn.end().catch(() => {});
    sessions.delete(oldestKey);
  }
}

setInterval(pruneExpiredSessions, 60000).unref();

async function ensureSession(clientId, slot, { database, persona, customAuth, useTls }) {
  const safeClient = normalizeClientId(clientId);
  const safeSlot = ['A', 'B', 'unit3'].includes(slot) ? slot : 'A';
  const key = `${safeClient}:${safeSlot}`;
  const dbName = validateDatabase(database);
  const creds = resolveCredentials(persona, customAuth);
  const pwHash = crypto.createHash('sha256').update(creds.password).digest('hex').slice(0, 12);
  const personaKey = `${persona}:${creds.label}:${pwHash}:${Boolean(useTls)}`;

  const existing = sessions.get(key);
  if (existing?.busy) {
    throw new HttpError(409, `Session ${existing.slot} is currently busy or waiting on a database lock.`);
  }

  let entry = existing;
  if (!entry || entry.personaKey !== personaKey) {
    if (entry) {
      await entry.conn.end().catch(() => {});
      if (sessions.get(key) === entry) sessions.delete(key);
    }
    const conn = await mysql.createConnection(
      buildConnectionConfig({ database: dbName, user: creds.user, password: creds.password, useTls })
    );
    let sslCipher = null;
    try {
      const [sslRows] = await conn.query({ sql: "SHOW SESSION STATUS LIKE 'Ssl_cipher'", rowsAsArray: true });
      sslCipher = sslRows?.[0]?.[1] || null;
    } catch (err) {
      conn.destroy();
      throw err;
    }
    entry = {
      key,
      clientId: safeClient,
      slot: safeSlot,
      conn,
      personaKey,
      personaLabel: creds.label,
      requestedDatabase: dbName,
      database: dbName,
      sslCipher,
      threadId: conn.threadId,
      busy: false,
      lastUsedAt: Date.now()
    };
    conn.on('error', () => {
      if (sessions.get(key) === entry) sessions.delete(key);
    });
    const raced = sessions.get(key);
    if (raced && raced !== entry) {
      if (raced.busy) {
        conn.destroy();
        throw new HttpError(409, `Session ${raced.slot} is currently busy or waiting on a database lock.`);
      }
      await raced.conn.end().catch(() => {});
    }
    sessions.set(key, entry);
    pruneExpiredSessions();
  } else if (dbName !== entry.requestedDatabase) {
    await entry.conn.query(`USE \`${dbName}\``);
    entry.requestedDatabase = dbName;
    entry.database = dbName;
  }

  entry.lastUsedAt = Date.now();
  return entry;
}

export async function runSessionQuery({
  clientId = 'default',
  slot = 'A',
  sql,
  database = 'ops_lab',
  persona = 'dba_lab',
  customAuth = null,
  useTls = false
}) {
  const entry = await ensureSession(clientId, slot, { database, persona, customAuth, useTls });
  if (entry.busy) {
    throw new HttpError(409, `Session ${entry.slot} is currently busy or waiting on a database lock.`);
  }
  entry.busy = true;
  entry.lastUsedAt = Date.now();
  try {
    const started = performance.now();
    const [rows, fields] = await entry.conn.query({ sql, rowsAsArray: true });
    const elapsed = Math.round((performance.now() - started) * 100) / 100;
    try {
      const [dbRows] = await entry.conn.query({ sql: 'SELECT DATABASE()', rowsAsArray: true });
      entry.database = dbRows?.[0]?.[0] ?? null;
    } catch {
      // Ignore secondary metadata query errors
    }
    return formatQueryOutput(rows, fields, elapsed, {
      sessionSlot: entry.slot,
      connectionId: entry.threadId,
      persona: entry.personaLabel,
      database: entry.database,
      sslCipher: entry.sslCipher
    });
  } catch (err) {
    if (err && (err.code === 'PROTOCOL_CONNECTION_LOST' || err.fatal)) {
      if (sessions.get(entry.key) === entry) sessions.delete(entry.key);
    }
    throw err;
  } finally {
    entry.busy = false;
    entry.lastUsedAt = Date.now();
  }
}

export async function closeClientSessions(clientId = 'default', slot = null) {
  const safeClient = normalizeClientId(clientId);
  const closed = [];
  for (const [key, entry] of sessions.entries()) {
    if (entry.clientId === safeClient && (!slot || entry.slot === slot)) {
      if (entry.busy && Number.isInteger(entry.threadId)) {
        let killer = null;
        try {
          killer = await connectAdmin('information_schema');
          await killer.query(`KILL ${entry.threadId}`).catch(() => {});
        } catch {
          // Best-effort kill before tearing down client socket
        } finally {
          await killer?.end().catch(() => {});
        }
      }
      entry.conn.destroy();
      if (sessions.get(key) === entry) sessions.delete(key);
      closed.push(entry.slot);
    }
  }
  return closed;
}

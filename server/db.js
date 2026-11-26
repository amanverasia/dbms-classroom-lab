import fs from 'node:fs';
import mysql from 'mysql2/promise';

const DB_HOST = process.env.DB_HOST || 'mariadb';
const ROOT_PASSWORD = process.env.MARIADB_ROOT_PASSWORD || 'classroom-root';
const CONSOLE_PASSWORD = process.env.CONSOLE_PASSWORD || 'console-local-demo';
const DBA_PASSWORD = process.env.DBA_PASSWORD || 'dba-local-demo';

export const ALLOWED_DATABASES = [
  'college_demo',
  'classroom_practice',
  'sql_lab',
  'security_lab',
  'perf_lab',
  'ops_lab',
  'backup_lab',
  'information_schema',
  'performance_schema',
  'mysql'
];

export const CONSOLE_DATABASES = ['college_demo', 'classroom_practice', 'sql_lab'];

const PERSONA_CREDENTIALS = {
  console: { user: 'classroom_console', password: CONSOLE_PASSWORD, label: 'classroom_console' },
  dba_lab: { user: 'dba_lab', password: DBA_PASSWORD, label: 'dba_lab' },
  web_app: { user: 'web_app', password: 'webapp-demo-password', label: 'web_app' },
  reporting: { user: 'reporting', password: 'reporting-demo-password', label: 'reporting' },
  tls_user: { user: 'tls_user', password: 'tls-local-demo', label: 'tls_user' },
  security_reader: { user: 'security_reader', password: 'reader-local-demo', label: 'security_reader' }
};

let cachedCa = null;
export function getCaCertificate() {
  if (cachedCa !== null) return cachedCa;
  try {
    cachedCa = fs.readFileSync('/etc/mysql/certs/ca.pem', 'utf8');
  } catch {
    cachedCa = '';
  }
  return cachedCa;
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

export function validateDatabaseForPersona(database, persona = 'console') {
  const db = String(database || 'college_demo').trim();
  if (!ALLOWED_DATABASES.includes(db)) {
    throw new HttpError(400, 'Choose an allowed classroom database.');
  }
  if (persona === 'console' && !CONSOLE_DATABASES.includes(db)) {
    throw new HttpError(400, 'The default Units 1-2 console persona only opens college_demo, classroom_practice, or sql_lab.');
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

export function formatQueryOutput(rows, fields, elapsedMs, extra = {}) {
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
    config.ssl = ca
      ? { ca, minVersion: 'TLSv1.2', rejectUnauthorized: true }
      : { minVersion: 'TLSv1.2', rejectUnauthorized: false };
  }
  return config;
}

export async function connectAdmin(database = 'college_demo', multipleStatements = false) {
  const conn = await mysql.createConnection(
    buildConnectionConfig({ database, user: 'root', password: ROOT_PASSWORD, multipleStatements })
  );
  await conn.query("SET SESSION sql_mode='STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION,ONLY_FULL_GROUP_BY'");
  return conn;
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
  const dbName = validateDatabaseForPersona(database, persona);
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
      sessions.delete(key);
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
    sessions.get(oldestKey).conn.end().catch(() => {});
    sessions.delete(oldestKey);
  }
}

setInterval(pruneExpiredSessions, 60000).unref();

async function ensureSession(clientId, slot, { database, persona, customAuth, useTls }) {
  const safeClient = String(clientId || 'default').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || 'default';
  const safeSlot = ['A', 'B', 'unit3'].includes(slot) ? slot : 'A';
  const key = `${safeClient}:${safeSlot}`;
  const dbName = validateDatabaseForPersona(database, persona);
  const creds = resolveCredentials(persona, customAuth);

  let entry = sessions.get(key);
  const needsReconnect =
    !entry ||
    entry.personaKey !== `${persona}:${creds.label}:${Boolean(useTls)}`;

  if (needsReconnect) {
    if (entry) {
      await entry.conn.end().catch(() => {});
      sessions.delete(key);
    }
    const conn = await mysql.createConnection(
      buildConnectionConfig({ database: dbName, user: creds.user, password: creds.password, useTls })
    );
    const [sslRows] = await conn.query({ sql: "SHOW SESSION STATUS LIKE 'Ssl_cipher'", rowsAsArray: true });
    entry = {
      key,
      clientId: safeClient,
      slot: safeSlot,
      conn,
      personaKey: `${persona}:${creds.label}:${Boolean(useTls)}`,
      personaLabel: creds.label,
      database: dbName,
      sslCipher: sslRows?.[0]?.[1] || null,
      threadId: conn.threadId,
      busy: false,
      lastUsedAt: Date.now()
    };
    conn.on('error', () => {
      sessions.delete(key);
    });
    sessions.set(key, entry);
    pruneExpiredSessions();
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
      if (dbRows?.[0]?.[0]) entry.database = dbRows[0][0];
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
      sessions.delete(entry.key);
    }
    throw err;
  } finally {
    entry.busy = false;
    entry.lastUsedAt = Date.now();
  }
}

export async function closeClientSessions(clientId = 'default', slot = null) {
  const safeClient = String(clientId || 'default').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || 'default';
  const closed = [];
  for (const [key, entry] of sessions.entries()) {
    if (entry.clientId === safeClient && (!slot || entry.slot === slot)) {
      try {
        if (entry.busy && entry.threadId) {
          const killer = await connectAdmin('information_schema');
          await killer.query(`KILL ${Number(entry.threadId)}`).catch(() => {});
          await killer.end().catch(() => {});
        }
      } finally {
        await entry.conn.destroy();
        sessions.delete(key);
        closed.push(entry.slot);
      }
    }
  }
  return closed;
}

export function getSessionStatus(clientId = 'default') {
  const safeClient = String(clientId || 'default').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || 'default';
  const list = [];
  for (const entry of sessions.values()) {
    if (entry.clientId === safeClient) {
      list.push({
        slot: entry.slot,
        connectionId: entry.threadId,
        persona: entry.personaLabel,
        database: entry.database,
        sslCipher: entry.sslCipher,
        busy: entry.busy
      });
    }
  }
  return list;
}

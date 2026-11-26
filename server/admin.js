import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import mysql from 'mysql2/promise';
import {
  ALLOWED_DATABASES,
  buildConnectionConfig,
  connectAdmin,
  HttpError,
  sanitizeValue
} from './db.js';
import { resetBackupLab } from './fixtures.js';

const execFileAsync = promisify(execFile);
const LOG_DIR = '/var/log/mysql';
const DATA_DIR = '/mnt/mariadb-data';
const BACKUP_DIR = '/var/backups/classroom';
const DB_HOST = process.env.DB_HOST || 'mariadb';
const ROOT_PASSWORD = process.env.MARIADB_ROOT_PASSWORD || 'classroom-root';

const LOG_FILES = {
  error: 'error.log',
  slow: 'slow.log',
  general: 'general.log',
  audit: 'audit.log'
};

export async function getSchema(database) {
  const dbName = String(database || 'college_demo').trim();
  if (!ALLOWED_DATABASES.includes(dbName)) {
    throw new HttpError(400, 'Unknown database schema.');
  }
  const conn = await connectAdmin('information_schema');
  try {
    const [tables] = await conn.query(
      `SELECT TABLE_NAME, TABLE_TYPE, ENGINE, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH
       FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ?
       ORDER BY TABLE_TYPE, TABLE_NAME`,
      [dbName]
    );
    const [columns] = await conn.query(
      `SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT, EXTRA
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ?
       ORDER BY TABLE_NAME, ORDINAL_POSITION`,
      [dbName]
    );
    const grouped = {};
    for (const t of tables) {
      grouped[t.TABLE_NAME] = {
        name: t.TABLE_NAME,
        type: t.TABLE_TYPE,
        engine: t.ENGINE,
        rows: Number(t.TABLE_ROWS || 0),
        sizeBytes: Number(t.DATA_LENGTH || 0) + Number(t.INDEX_LENGTH || 0),
        columns: []
      };
    }
    for (const c of columns) {
      if (grouped[c.TABLE_NAME]) {
        grouped[c.TABLE_NAME].columns.push({
          name: c.COLUMN_NAME,
          type: c.COLUMN_TYPE,
          nullable: c.IS_NULLABLE === 'YES',
          key: c.COLUMN_KEY,
          defaultValue: c.COLUMN_DEFAULT,
          extra: c.EXTRA
        });
      }
    }
    return { database: dbName, objects: Object.values(grouped) };
  } finally {
    await conn.end().catch(() => {});
  }
}

export async function getStorageInfo() {
  const conn = await connectAdmin('information_schema');
  try {
    const [vars] = await conn.query(`
      SHOW GLOBAL VARIABLES WHERE Variable_name IN (
        'datadir', 'innodb_data_file_path', 'innodb_file_per_table', 'innodb_page_size',
        'innodb_buffer_pool_size', 'innodb_log_buffer_size', 'innodb_redo_log_capacity',
        'innodb_log_file_size', 'table_open_cache', 'thread_cache_size', 'max_connections'
      )
    `);
    const [tables] = await conn.query(`
      SELECT TABLE_SCHEMA, TABLE_NAME, ENGINE, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH, DATA_FREE
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA IN ('college_demo','classroom_practice','sql_lab','security_lab','perf_lab','ops_lab','backup_lab')
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `);
    const [engines] = await conn.query('SHOW ENGINES');

    const rootFiles = [];
    const schemaFiles = [];
    if (fs.existsSync(DATA_DIR)) {
      const entries = fs.readdirSync(DATA_DIR, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && /^(ib|undo|aria_log|tc\.log)/.test(entry.name)) {
          const stat = fs.statSync(path.join(DATA_DIR, entry.name));
          rootFiles.push({ name: entry.name, sizeBytes: stat.size });
        } else if (
          entry.isDirectory() &&
          ['college_demo', 'classroom_practice', 'sql_lab', 'security_lab', 'perf_lab', 'ops_lab', 'backup_lab'].includes(entry.name)
        ) {
          const subDir = path.join(DATA_DIR, entry.name);
          const subEntries = fs.readdirSync(subDir, { withFileTypes: true });
          const files = subEntries
            .filter(f => f.isFile())
            .map(f => ({ name: f.name, sizeBytes: fs.statSync(path.join(subDir, f.name)).size }))
            .sort((a, b) => b.sizeBytes - a.sizeBytes);
          schemaFiles.push({ schema: entry.name, files });
        }
      }
    }

    return {
      variables: Object.fromEntries(vars.map(v => [v.Variable_name, v.Value])),
      engines: engines.map(e => ({ engine: e.Engine, support: e.Support, comment: e.Comment, transactions: e.Transactions })),
      tables: tables.map(t => ({
        schema: t.TABLE_SCHEMA,
        name: t.TABLE_NAME,
        engine: t.ENGINE,
        rows: Number(t.TABLE_ROWS || 0),
        dataBytes: Number(t.DATA_LENGTH || 0),
        indexBytes: Number(t.INDEX_LENGTH || 0),
        freeBytes: Number(t.DATA_FREE || 0)
      })),
      rootFiles: rootFiles.sort((a, b) => a.name.localeCompare(b.name)),
      schemaFiles: schemaFiles.sort((a, b) => a.schema.localeCompare(b.schema))
    };
  } finally {
    await conn.end().catch(() => {});
  }
}

export async function getMetrics() {
  const conn = await connectAdmin('information_schema');
  try {
    const [statusRows] = await conn.query(`
      SHOW GLOBAL STATUS WHERE Variable_name IN (
        'Uptime', 'Threads_connected', 'Threads_running', 'Max_used_connections',
        'Questions', 'Queries', 'Slow_queries', 'Com_select', 'Com_insert', 'Com_update', 'Com_delete',
        'Innodb_buffer_pool_read_requests', 'Innodb_buffer_pool_reads',
        'Innodb_rows_read', 'Innodb_rows_inserted', 'Innodb_rows_updated', 'Innodb_rows_deleted',
        'Innodb_row_lock_waits', 'Innodb_deadlocks'
      )
    `);
    const status = Object.fromEntries(statusRows.map(r => [r.Variable_name, Number(r.Value)]));
    const readReq = status.Innodb_buffer_pool_read_requests || 0;
    const diskReads = status.Innodb_buffer_pool_reads || 0;
    const bufferHitPct = readReq > 0 ? Math.round(((readReq - diskReads) / readReq) * 10000) / 100 : 100;

    const [processlist] = await conn.query('SHOW FULL PROCESSLIST');
    const [trx] = await conn.query(`
      SELECT trx_id, trx_state, trx_started, trx_wait_started, trx_mysql_thread_id,
             trx_rows_locked, trx_lock_structs, LEFT(COALESCE(trx_query, ''), 160) AS trx_query
      FROM information_schema.INNODB_TRX
      ORDER BY trx_started
    `);
    let dataLocks = [];
    try {
      const [lockRows] = await conn.query(`
        SELECT l.lock_id, l.lock_trx_id, t.trx_mysql_thread_id AS thread_id,
               l.lock_table, l.lock_index, l.lock_type, l.lock_mode,
               IF(w.requested_lock_id IS NOT NULL, 'WAITING', 'GRANTED') AS lock_status,
               l.lock_data
        FROM information_schema.INNODB_LOCKS l
        JOIN information_schema.INNODB_TRX t ON t.trx_id = l.lock_trx_id
        LEFT JOIN information_schema.INNODB_LOCK_WAITS w ON w.requested_lock_id = l.lock_id
        LIMIT 30
      `);
      dataLocks = lockRows.map(row =>
        Object.fromEntries(Object.entries(row).map(([k, v]) => [k, sanitizeValue(v)]))
      );
    } catch {
      dataLocks = [];
    }
    const [digests] = await conn.query(`
      SELECT SCHEMA_NAME, LEFT(DIGEST_TEXT, 140) AS digest, COUNT_STAR AS calls,
             ROUND(AVG_TIMER_WAIT / 1000000000, 2) AS avg_ms,
             SUM_ROWS_EXAMINED AS rows_examined, SUM_ROWS_SENT AS rows_sent
      FROM performance_schema.events_statements_summary_by_digest
      WHERE SCHEMA_NAME IN ('college_demo','classroom_practice','sql_lab','security_lab','perf_lab','ops_lab','backup_lab')
      ORDER BY SUM_TIMER_WAIT DESC
      LIMIT 8
    `);
    const [dbGrowth] = await conn.query(`
      SELECT TABLE_SCHEMA AS db_name,
             COUNT(*) AS table_count,
             SUM(TABLE_ROWS) AS approx_rows,
             ROUND(SUM(DATA_LENGTH) / 1024 / 1024, 3) AS data_mb,
             ROUND(SUM(INDEX_LENGTH) / 1024 / 1024, 3) AS index_mb,
             ROUND(SUM(DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 3) AS total_mb
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA IN ('college_demo','classroom_practice','sql_lab','security_lab','perf_lab','ops_lab','backup_lab')
      GROUP BY TABLE_SCHEMA
      ORDER BY total_mb DESC
    `);

    return {
      status,
      bufferHitPct,
      processlist: processlist.map(p => ({
        id: p.Id,
        user: p.User,
        host: p.Host,
        db: p.db,
        command: p.Command,
        time: p.Time,
        state: p.State,
        info: p.Info ? String(p.Info).slice(0, 140) : null
      })),
      transactions: trx.map(t => Object.fromEntries(Object.entries(t).map(([k, v]) => [k, sanitizeValue(v)]))),
      dataLocks,
      digests: digests.map(d => Object.fromEntries(Object.entries(d).map(([k, v]) => [k, sanitizeValue(v)]))),
      dbGrowth: dbGrowth.map(g => Object.fromEntries(Object.entries(g).map(([k, v]) => [k, sanitizeValue(v)])))
    };
  } finally {
    await conn.end().catch(() => {});
  }
}

export async function getLogConfig() {
  const conn = await connectAdmin('information_schema');
  try {
    const [rows] = await conn.query(`
      SHOW GLOBAL VARIABLES WHERE Variable_name IN (
        'log_error', 'general_log', 'general_log_file',
        'slow_query_log', 'slow_query_log_file', 'long_query_time',
        'log_bin', 'binlog_format', 'server_audit_logging', 'server_audit_events', 'server_audit_file_path'
      )
    `);
    return Object.fromEntries(rows.map(r => [r.Variable_name, r.Value]));
  } finally {
    await conn.end().catch(() => {});
  }
}

export async function getLogs(type = 'error', tailLines = 60) {
  const config = await getLogConfig();
  const limit = Math.max(10, Math.min(200, Number(tailLines) || 60));

  if (type === 'binlog') {
    const conn = await connectAdmin('backup_lab');
    try {
      const [binlogs] = await conn.query('SHOW BINARY LOGS');
      const files = binlogs.map(b => ({ name: b.Log_name, sizeBytes: Number(b.File_size || 0) }));
      let preview = '';
      if (files.length > 0) {
        const latest = path.basename(files[files.length - 1].name);
        const fullPath = path.join(LOG_DIR, latest);
        if (fs.existsSync(fullPath)) {
          const { stdout } = await execFileAsync(
            'mariadb-binlog',
            ['--base64-output=DECODE-ROWS', '-v', fullPath],
            { maxBuffer: 2 * 1024 * 1024 }
          );
          const lines = stdout.split('\n');
          preview = lines.slice(-limit).join('\n');
        }
      }
      return { type: 'binlog', config, binlogs: files, content: preview || '(No binary log events yet)' };
    } finally {
      await conn.end().catch(() => {});
    }
  }

  const filename = LOG_FILES[type];
  if (!filename) {
    throw new HttpError(400, `Unsupported log type: ${type}`);
  }
  const fullPath = path.join(LOG_DIR, filename);
  if (!fs.existsSync(fullPath)) {
    return {
      type,
      config,
      file: fullPath,
      exists: false,
      content: `(Log file ${fullPath} has not been written yet. Enable logging above and run a query.)`
    };
  }
  const stat = fs.statSync(fullPath);
  const readSize = Math.min(stat.size, 128 * 1024);
  const fd = fs.openSync(fullPath, 'r');
  try {
    const buffer = Buffer.alloc(readSize);
    fs.readSync(fd, buffer, 0, readSize, Math.max(0, stat.size - readSize));
    const lines = buffer.toString('utf8').split('\n');
    return {
      type,
      config,
      file: fullPath,
      exists: true,
      sizeBytes: stat.size,
      content: lines.slice(-limit).join('\n')
    };
  } finally {
    fs.closeSync(fd);
  }
}

export async function toggleLog({ target, enabled, value }) {
  const conn = await connectAdmin('information_schema');
  try {
    let executedSql = '';
    if (target === 'general') {
      const state = enabled ? 'ON' : 'OFF';
      executedSql = `SET GLOBAL general_log = ${state}`;
      await conn.query(executedSql);
    } else if (target === 'slow') {
      const state = enabled ? 'ON' : 'OFF';
      executedSql = `SET GLOBAL slow_query_log = ${state}`;
      await conn.query(executedSql);
      if (value !== undefined) {
        const threshold = Math.max(0.01, Math.min(60, Number(value)));
        const secSql = `SET GLOBAL long_query_time = ${threshold}`;
        await conn.query(secSql);
        executedSql += `; ${secSql}`;
      }
    } else if (target === 'audit') {
      const state = enabled ? 'ON' : 'OFF';
      executedSql = `SET GLOBAL server_audit_logging = ${state}`;
      await conn.query(executedSql);
      if (Array.isArray(value) && value.length > 0) {
        const allowed = ['CONNECT', 'QUERY', 'TABLE', 'QUERY_DDL', 'QUERY_DML', 'QUERY_DCL'];
        const clean = value.filter(v => allowed.includes(v));
        if (clean.length > 0) {
          const evSql = `SET GLOBAL server_audit_events = '${clean.join(',')}'`;
          await conn.query(evSql);
          executedSql += `; ${evSql}`;
        }
      }
    } else if (target === 'trigger-slow') {
      const sec = Math.max(0.6, Math.min(2.0, Number(value) || 0.7));
      executedSql = `SELECT SLEEP(${sec}) AS simulated_slow_query, 'Logged to slow.log' AS note`;
      await conn.query(executedSql);
    } else {
      throw new HttpError(400, `Unsupported log target: ${target}`);
    }
    const config = await getLogConfig();
    return { ok: true, executedSql, config };
  } finally {
    await conn.end().catch(() => {});
  }
}

export async function runSqliDemo({ username = '', password = '' }) {
  const u = String(username);
  const p = String(password);
  const conn = await mysql.createConnection(
    buildConnectionConfig({
      database: 'security_lab',
      user: 'security_reader',
      password: 'reader-local-demo',
      multipleStatements: false
    })
  );
  try {
    const vulnerableSql = `SELECT id, username, role_name, fee_balance FROM portal_users WHERE username = '${u}' AND password_hint = '${p}'`;
    const safeSql = 'SELECT id, username, role_name, fee_balance FROM portal_users WHERE username = ? AND password_hint = ?';

    let vulnerable;
    try {
      const [rows, fields] = await conn.query({ sql: vulnerableSql, rowsAsArray: true });
      vulnerable = {
        sql: vulnerableSql,
        columns: fields.map(f => f.name),
        rows: rows.map(r => r.map(sanitizeValue)),
        error: null
      };
    } catch (err) {
      vulnerable = {
        sql: vulnerableSql,
        columns: [],
        rows: [],
        error: err.message
      };
    }

    let safe;
    try {
      const [rows, fields] = await conn.execute({ sql: safeSql, values: [u, p], rowsAsArray: true });
      safe = {
        sql: safeSql,
        params: [u, p],
        columns: fields.map(f => f.name),
        rows: rows.map(r => r.map(sanitizeValue)),
        error: null
      };
    } catch (err) {
      safe = {
        sql: safeSql,
        params: [u, p],
        columns: [],
        rows: [],
        error: err.message
      };
    }

    return { vulnerable, safe };
  } finally {
    await conn.end().catch(() => {});
  }
}

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function validateBackupFilename(name) {
  const clean = path.basename(String(name || '').trim());
  if (!/^[a-zA-Z0-9._-]+\.sql$/.test(clean)) {
    throw new HttpError(400, 'Invalid backup filename.');
  }
  return clean;
}

export async function getBackupStatus() {
  ensureBackupDir();
  const files = fs
    .readdirSync(BACKUP_DIR, { withFileTypes: true })
    .filter(e => e.isFile() && e.name.endsWith('.sql'))
    .map(e => {
      const st = fs.statSync(path.join(BACKUP_DIR, e.name));
      return { name: e.name, sizeBytes: st.size, mtime: st.mtime.toISOString() };
    })
    .sort((a, b) => b.mtime.localeCompare(a.mtime));

  const conn = await connectAdmin('backup_lab');
  try {
    const [existsRows] = await conn.query(
      "SELECT COUNT(*) AS cnt FROM information_schema.TABLES WHERE TABLE_SCHEMA='backup_lab' AND TABLE_NAME='fee_ledger'"
    );
    const tableExists = Number(existsRows?.[0]?.cnt) > 0;
    let rows = [];
    if (tableExists) {
      const [dataRows] = await conn.query({
        sql: 'SELECT receipt_no, student_name, course_code, amount, recorded_on FROM backup_lab.fee_ledger ORDER BY receipt_no',
        rowsAsArray: true
      });
      rows = dataRows.map(r => r.map(sanitizeValue));
    }
    const [binlogs] = await conn.query('SHOW BINARY LOGS');
    return {
      tableExists,
      rowCount: rows.length,
      columns: ['receipt_no', 'student_name', 'course_code', 'amount', 'recorded_on'],
      rows,
      backups: files,
      binlogs: binlogs.map(b => ({ name: b.Log_name, sizeBytes: Number(b.File_size || 0) }))
    };
  } finally {
    await conn.end().catch(() => {});
  }
}

export async function runBackupAction({ action, filename }) {
  ensureBackupDir();
  if (action === 'dump' || action === 'dump-schema' || action === 'dump-data') {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const suffix = action === 'dump-schema' ? 'schema' : action === 'dump-data' ? 'data' : 'full';
    const outName = filename ? validateBackupFilename(filename) : `backup_lab_${suffix}_${stamp}.sql`;
    const outPath = path.join(BACKUP_DIR, outName);

    const args = [
      '-h',
      DB_HOST,
      '-u',
      'root',
      `--password=${ROOT_PASSWORD}`,
      '--single-transaction',
      '--skip-ssl'
    ];
    if (action === 'dump-schema') args.push('--no-data');
    if (action === 'dump-data') args.push('--no-create-info');
    if (action === 'dump') args.push('--routines', '--triggers');
    args.push('backup_lab');

    const { stdout } = await execFileAsync('mariadb-dump', args, { maxBuffer: 10 * 1024 * 1024 });
    fs.writeFileSync(outPath, stdout, 'utf8');
    const preview = stdout.split('\n').slice(0, 35).join('\n');
    const status = await getBackupStatus();
    return {
      ok: true,
      message: `Created ${suffix} logical backup ${outName} (${Buffer.byteLength(stdout)} bytes).`,
      command: `mariadb-dump --single-transaction ${action === 'dump-schema' ? '--no-data ' : action === 'dump-data' ? '--no-create-info ' : ''}backup_lab > ${outName}`,
      filename: outName,
      preview,
      status
    };
  }

  if (action === 'corrupt') {
    const conn = await connectAdmin('backup_lab');
    try {
      await conn.query('DROP TABLE IF EXISTS backup_lab.fee_ledger');
    } finally {
      await conn.end().catch(() => {});
    }
    const status = await getBackupStatus();
    return {
      ok: true,
      message: 'Simulated accidental disaster: DROP TABLE backup_lab.fee_ledger executed.',
      command: 'DROP TABLE IF EXISTS backup_lab.fee_ledger;',
      status
    };
  }

  if (action === 'restore') {
    const clean = validateBackupFilename(filename);
    const inPath = path.join(BACKUP_DIR, clean);
    if (!fs.existsSync(inPath)) {
      throw new HttpError(404, `Backup file ${clean} was not found.`);
    }
    const sqlText = fs.readFileSync(inPath, 'utf8');
    await new Promise((resolve, reject) => {
      const child = execFile(
        'mariadb',
        ['-h', DB_HOST, '-u', 'root', `--password=${ROOT_PASSWORD}`, '--skip-ssl', 'backup_lab'],
        { maxBuffer: 10 * 1024 * 1024 },
        (err, _stdout, stderr) => {
          if (err) return reject(new HttpError(500, stderr || err.message));
          resolve();
        }
      );
      child.stdin.write(sqlText);
      child.stdin.end();
    });
    const status = await getBackupStatus();
    return {
      ok: true,
      message: `Restored backup_lab from ${clean} (${status.rowCount} rows verified).`,
      command: `mariadb backup_lab < ${clean}`,
      status
    };
  }

  if (action === 'reset') {
    const msg = await resetBackupLab();
    const status = await getBackupStatus();
    return { ok: true, message: msg, status };
  }

  throw new HttpError(400, `Unsupported backup action: ${action}`);
}

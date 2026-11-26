import http from 'node:http';
import { bootstrapClassroom } from './bootstrap.js';
import {
  closeClientSessions,
  connectAdmin,
  getCaCertificate,
  getSessionStatus,
  HttpError,
  runSessionQuery,
  runSingleQuery
} from './db.js';
import {
  prepareCourseNotes,
  prepareCourseRosterView,
  prepareEditCopy,
  preparePractice,
  prepareUnit2,
  prepareUnit3,
  prepareUnit4,
  resetLocksLab,
  resetPerfIndexes,
  resetPractice
} from './fixtures.js';
import {
  getBackupStatus,
  getLogs,
  getMetrics,
  getSchema,
  getStorageInfo,
  runBackupAction,
  runSqliDemo,
  toggleLog
} from './admin.js';
import { checkStudentAnswer } from './checker.js';

const PORT = Number(process.env.PORT || 8080);
const ADMINER_PORT = Number(process.env.ADMINER_PORT || 8081);
const DB_PORT = Number(process.env.DB_PORT || 3307);

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(body));
}

async function readJsonBody(req) {
  const ctype = req.headers['content-type'] || '';
  if (!ctype.startsWith('application/json')) {
    throw new HttpError(415, 'JSON required.');
  }
  if (req.headers['sec-fetch-site'] === 'cross-site') {
    throw new HttpError(403, 'Use the local classroom console.');
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 256 * 1024) throw new HttpError(413, 'Request body too large.');
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    throw new HttpError(400, 'Malformed JSON request body.');
  }
}

async function handleRequest(req, res) {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  if (req.method === 'GET' && pathname === '/api/health') {
    const conn = await connectAdmin('college_demo');
    try {
      const [verRows] = await conn.query('SELECT VERSION() AS ver');
      const [vars] = await conn.query(
        "SHOW GLOBAL VARIABLES WHERE Variable_name IN ('have_ssl', 'performance_schema', 'general_log', 'slow_query_log', 'server_audit_logging')"
      );
      const varMap = Object.fromEntries(vars.map(v => [v.Variable_name, v.Value]));
      return sendJson(res, 200, {
        ok: true,
        engine: 'MariaDB',
        version: verRows?.[0]?.ver || '11.4',
        adminerPort: ADMINER_PORT,
        dbPort: DB_PORT,
        ssl: varMap.have_ssl === 'YES',
        performanceSchema: varMap.performance_schema === 'ON',
        auditPlugin: Object.prototype.hasOwnProperty.call(varMap, 'server_audit_logging')
      });
    } finally {
      await conn.end().catch(() => {});
    }
  }

  if (req.method === 'GET' && pathname === '/api/certs/ca.pem') {
    const pem = getCaCertificate();
    if (!pem) {
      return sendJson(res, 404, { error: 'TLS CA certificate is not available.' });
    }
    res.writeHead(200, {
      'Content-Type': 'application/x-pem-file; charset=utf-8',
      'Content-Disposition': 'attachment; filename="dbms-classroom-ca.pem"',
      'Cache-Control': 'no-store'
    });
    return res.end(pem);
  }

  if (req.method === 'GET' && pathname === '/api/schema') {
    const db = url.searchParams.get('database') || 'college_demo';
    return sendJson(res, 200, await getSchema(db));
  }

  if (req.method === 'GET' && pathname === '/api/admin/storage') {
    return sendJson(res, 200, await getStorageInfo());
  }

  if (req.method === 'GET' && pathname === '/api/admin/metrics') {
    return sendJson(res, 200, await getMetrics());
  }

  if (req.method === 'GET' && pathname === '/api/admin/logs') {
    const type = url.searchParams.get('type') || 'error';
    const lines = url.searchParams.get('lines') || '60';
    return sendJson(res, 200, await getLogs(type, lines));
  }

  if (req.method === 'GET' && pathname === '/api/admin/backup/status') {
    return sendJson(res, 200, await getBackupStatus());
  }

  if (req.method === 'GET' && pathname === '/api/session/status') {
    const clientId = url.searchParams.get('clientId') || 'default';
    return sendJson(res, 200, { sessions: getSessionStatus(clientId) });
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'POST required.' });
  }

  const body = await readJsonBody(req);

  if (pathname === '/api/query') {
    const sql = String(body.sql || '').trim();
    if (!sql || sql.length > 12000) {
      throw new HttpError(400, 'Enter one SQL statement (up to 12,000 characters).');
    }
    const result = await runSingleQuery({
      sql,
      database: body.database || 'college_demo',
      persona: body.persona || 'console',
      customAuth: body.customAuth || null,
      useTls: Boolean(body.useTls),
      includeSslCipher: Boolean(body.includeSslCipher)
    });
    return sendJson(res, 200, result);
  }

  if (pathname === '/api/session/query') {
    const sql = String(body.sql || '').trim();
    if (!sql || sql.length > 12000) {
      throw new HttpError(400, 'Enter one SQL statement (up to 12,000 characters).');
    }
    const result = await runSessionQuery({
      clientId: body.clientId || 'default',
      slot: body.slot || 'A',
      sql,
      database: body.database || 'ops_lab',
      persona: body.persona || 'dba_lab',
      customAuth: body.customAuth || null,
      useTls: Boolean(body.useTls)
    });
    return sendJson(res, 200, result);
  }

  if (pathname === '/api/session/reset') {
    const closed = await closeClientSessions(body.clientId || 'default', body.slot || null);
    return sendJson(res, 200, { ok: true, closed, message: 'Session connection(s) reset cleanly.' });
  }

  if (pathname === '/api/check-answer') {
    return sendJson(
      res,
      200,
      await checkStudentAnswer({
        sql: body.sql,
        database: body.database,
        checkSpec: body.checkSpec
      })
    );
  }

  if (pathname === '/api/prepare-unit2' || pathname === '/api/reset-unit2') {
    const conn = await connectAdmin('sql_lab', true);
    try {
      const message = await prepareUnit2(conn, pathname === '/api/reset-unit2');
      return sendJson(res, 200, { ok: true, message });
    } finally {
      await conn.end().catch(() => {});
    }
  }

  if (pathname === '/api/prepare-course-notes') {
    const conn = await connectAdmin('sql_lab', true);
    try {
      return sendJson(res, 200, { ok: true, message: await prepareCourseNotes(conn) });
    } finally {
      await conn.end().catch(() => {});
    }
  }

  if (pathname === '/api/prepare-course-roster') {
    const conn = await connectAdmin('sql_lab', true);
    try {
      return sendJson(res, 200, { ok: true, message: await prepareCourseRosterView(conn) });
    } finally {
      await conn.end().catch(() => {});
    }
  }

  if (pathname === '/api/reset-edit-copy') {
    const conn = await connectAdmin('sql_lab', true);
    try {
      return sendJson(res, 200, { ok: true, message: await prepareEditCopy(conn) });
    } finally {
      await conn.end().catch(() => {});
    }
  }

  if (pathname === '/api/prepare-practice') {
    const conn = await connectAdmin('classroom_practice', true);
    try {
      return sendJson(res, 200, { ok: true, message: await preparePractice(conn, Boolean(body.seed)) });
    } finally {
      await conn.end().catch(() => {});
    }
  }

  if (pathname === '/api/reset-practice') {
    const conn = await connectAdmin('classroom_practice', true);
    try {
      return sendJson(res, 200, { ok: true, message: await resetPractice(conn) });
    } finally {
      await conn.end().catch(() => {});
    }
  }

  if (pathname === '/api/reset-unit3') {
    await closeClientSessions(body.clientId || 'default', 'unit3');
    const conn = await connectAdmin('security_lab', true);
    try {
      return sendJson(res, 200, { ok: true, message: await prepareUnit3(conn, true) });
    } finally {
      await conn.end().catch(() => {});
    }
  }

  if (pathname === '/api/reset-unit4') {
    await closeClientSessions(body.clientId || 'default', null);
    const conn = await connectAdmin('perf_lab', true);
    try {
      return sendJson(res, 200, { ok: true, message: await prepareUnit4(conn, true) });
    } finally {
      await conn.end().catch(() => {});
    }
  }

  if (pathname === '/api/reset-unit4-perf') {
    const conn = await connectAdmin('perf_lab', true);
    try {
      return sendJson(res, 200, { ok: true, message: await resetPerfIndexes(conn) });
    } finally {
      await conn.end().catch(() => {});
    }
  }

  if (pathname === '/api/reset-unit4-locks') {
    return sendJson(res, 200, { ok: true, message: await resetLocksLab(body.clientId || 'default') });
  }

  if (pathname === '/api/admin/sqli-demo') {
    return sendJson(res, 200, await runSqliDemo(body));
  }

  if (pathname === '/api/admin/logs/toggle') {
    return sendJson(res, 200, await toggleLog(body));
  }

  if (pathname === '/api/admin/backup') {
    return sendJson(res, 200, await runBackupAction(body));
  }

  return sendJson(res, 404, { error: 'Unknown endpoint.' });
}

await bootstrapClassroom();

const server = http.createServer(async (req, res) => {
  try {
    await handleRequest(req, res);
  } catch (err) {
    if (err instanceof HttpError) {
      return sendJson(res, err.status, { error: err.message, code: err.code || undefined });
    }
    if (err && typeof err.errno === 'number') {
      return sendJson(res, 400, {
        error: err.sqlMessage || err.message,
        code: err.errno,
        sqlState: err.sqlState
      });
    }
    console.error('[api] Unexpected error:', err);
    return sendJson(res, 500, {
      error: 'The classroom service could not handle this request. Check that the Docker lab is ready.'
    });
  }
});

server.requestTimeout = 65000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[api] DBMS Classroom API listening on :${PORT}`);
});

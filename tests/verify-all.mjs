import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

if (process.env.RUN_FULL_REHEARSAL !== '1') {
  console.error('Set RUN_FULL_REHEARSAL=1 to run the full classroom verification suite.');
  process.exit(1);
}

const API_BASE = 'http://127.0.0.1:8080/api';
const WEB_BASE = 'http://teacher-console';

async function rawRequest(route, { method = 'POST', headers = {}, body = undefined } = {}) {
  const res = await fetch(`${API_BASE}/${route}`, { method, headers, body });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return [res.status, json];
}

async function api(route, body = null) {
  const res = await fetch(`${API_BASE}/${route}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined
  });
  const json = await res.json();
  return [res.status, json];
}

function sql(query, database = 'sql_lab', extra = {}) {
  return api('query', { sql: query, database, ...extra });
}

function ok([status, data], label) {
  assert.equal(status, 200, `${label} failed (${status}): ${data?.error || ''}`);
  return data;
}

function fail([status, data], expectedCode, label) {
  assert.equal(status, 400, `${label} expected 400, got ${status}`);
  if (expectedCode !== undefined) {
    assert.equal(data.code, expectedCode, `${label} expected MariaDB code ${expectedCode}, got ${data.code} (${data.error})`);
  }
  return data;
}

// 1. Verify Web Assets, DOM Shell, Nginx Proxy & Complete 4-Unit Curriculum Registry
console.log('1. Verifying web shell, Nginx proxy, curriculum registry, diagrams, and DBeaver worksheets...');
const shellTexts = {};
for (const shellAsset of ['index.html', 'styles.css', 'app.js']) {
  const res = await fetch(`${WEB_BASE}/${shellAsset}`);
  assert.equal(res.status, 200, `Failed fetching ${WEB_BASE}/${shellAsset}`);
  const text = await res.text();
  assert.ok(!text.includes('localhost:8081'), `Hardcoded localhost:8081 found in ${shellAsset}`);
  assert.equal(/https?:\/\//i.test(text), false, `Unexpected external URL found in ${shellAsset}`);
  shellTexts[shellAsset] = text;
}

const expectedShellIds = [
  'drawerToggle', 'sectionLabel', 'stepCount', 'health', 'modeInstructor', 'modeStudent',
  'dbeaverButton', 'themeButton', 'commandButton', 'curriculumDrawer', 'drawerUnitTabs',
  'sectionNav', 'stepRail', 'lesson', 'discussion', 'studioPane', 'studioMount',
  'prevButton', 'nextButton', 'studioToggleBtn', 'notesButton', 'presentButton',
  'exitPresent', 'commandDialog', 'commandInput', 'adminerLink', 'notesDialog',
  'dbeaverDialog', 'cheatsheetDialog', 'resetDialog'
];
for (const id of expectedShellIds) {
  assert.ok(new RegExp(`id="${id}"`).test(shellTexts['index.html']), `Missing static shell id="${id}" in index.html`);
}

const proxyHealthRes = await fetch(`${WEB_BASE}/api/health`);
assert.equal(proxyHealthRes.status, 200, 'Nginx /api/health proxy check failed');
const proxyHealth = await proxyHealthRes.json();
assert.equal(proxyHealth.ok, true, 'Nginx /api/health proxy returned ok !== true');

const assetNames = ['diagrams.js', 'lessons-unit1.js', 'lessons-unit2.js', 'lessons-unit3.js', 'lessons-unit4.js'];
const sandbox = { window: {} };
sandbox.window = sandbox;
vm.createContext(sandbox);

for (const name of assetNames) {
  const res = await fetch(`${WEB_BASE}/${name}`);
  assert.equal(res.status, 200, `Failed fetching ${WEB_BASE}/${name}`);
  vm.runInContext(await res.text(), sandbox, { filename: name });
}

for (const sheet of [
  'unit1-fundamentals.sql',
  'unit2-sql-practice.sql',
  'unit3-security-admin.sql',
  'unit4-monitoring-locks-backup.sql'
]) {
  const wsRes = await fetch(`${WEB_BASE}/worksheets/${sheet}`);
  assert.equal(wsRes.status, 200, `Missing worksheet ${sheet}`);
}

const COURSE = JSON.parse(JSON.stringify(sandbox.COURSE));
const CLASSROOM_DIAGRAMS = sandbox.CLASSROOM_DIAGRAMS;
assert.equal(COURSE.units.length, 4, 'Expected 4 units');
assert.ok(COURSE.units.every(u => u.status === 'ready'), 'All 4 units should be marked ready');

const sectionIds = new Set();
const allSteps = [];
const noteSet = new Set();

for (const sec of COURSE.sections) {
  assert.ok(['u1', 'u2', 'u3', 'u4'].includes(sec.unit), `Section ${sec.id} missing valid unit`);
  assert.ok(!sectionIds.has(sec.id), `Duplicate section id: ${sec.id}`);
  sectionIds.add(sec.id);

  const localStepIds = new Set();
  for (const st of sec.steps) {
    assert.ok(!localStepIds.has(st.id), `Duplicate step id ${st.id} in ${sec.id}`);
    localStepIds.add(st.id);
    assert.ok(st.title && st.lead && st.question && st.answer && st.notes, `Missing core text on ${sec.id}/${st.id}`);
    assert.ok(!noteSet.has(st.notes), `Duplicate/boilerplate teacher notes detected on ${sec.id}/${st.id}`);
    noteSet.add(st.notes);
    if (st.type === 'diagram') {
      assert.ok(CLASSROOM_DIAGRAMS[st.diagram], `Missing diagram ${st.diagram}`);
    }
    allSteps.push({ section: sec, step: st });
  }
}
console.log(`PASS: ${COURSE.sections.length} sections, ${allSteps.length} steps, 100% unique tailored teacher notes.`);

// 2. Health, API Guards, 10-DB Persona Isolation & Query Behavior Checks
console.log('2. Verifying API health, contract guards, 10-DB persona isolation, and query behavior...');
const health = ok(await api('health'), 'GET /api/health');
assert.equal(health.ok, true);
assert.ok(Number(health.adminerPort) > 0, 'Expected adminerPort in /api/health');
assert.ok(Number(health.dbPort) > 0, 'Expected dbPort in /api/health');
assert.equal(health.ssl, true, 'TLS must be enabled on MariaDB');
assert.equal(health.performanceSchema, true, 'performance_schema must be ON');
assert.equal(health.auditPlugin, true, 'server_audit plugin must be loaded');

// API security & contract guards
const [s415] = await rawRequest('query', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: '{"sql":"SELECT 1"}' });
assert.equal(s415, 415, 'Expected 415 for non-JSON Content-Type');

const [s403] = await rawRequest('query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'cross-site' },
  body: JSON.stringify({ sql: 'SELECT 1' })
});
assert.equal(s403, 403, 'Expected 403 for Sec-Fetch-Site: cross-site');

for (const badBody of ['null', '[]']) {
  const [s400] = await rawRequest('query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: badBody
  });
  assert.equal(s400, 400, `Expected 400 for non-object JSON body ${badBody}`);
}

const [s405] = await rawRequest('query', { method: 'GET' });
assert.equal(s405, 405, 'Expected 405 for GET /api/query');

const [s404] = await api('unknown-route', { ping: true });
assert.equal(s404, 404, 'Expected 404 for unknown route');

const [badBkStatus] = await api('admin/backup', { action: 'dump', filename: '../evil.sql' });
assert.equal(badBkStatus, 400, 'Expected 400 for invalid backup filename');

const caRes = await fetch(`${API_BASE}/certs/ca.pem`);
assert.equal(caRes.status, 200, 'Expected /api/certs/ca.pem download to succeed');
const caText = await caRes.text();
assert.ok(caText.includes('-----BEGIN CERTIFICATE-----'), 'Expected valid PEM CA certificate');

// 10-DB persona isolation matrix
ok(await sql('SELECT COUNT(*) FROM students', 'college_demo', { persona: 'console' }), 'console reads college_demo');
ok(await sql('SELECT 1 AS ok', 'sql_lab', { persona: 'console' }), 'console queries sql_lab');
const consoleTemp = `verify_c_${Date.now()}`;
ok(await sql(`CREATE TABLE ${consoleTemp} (id INT PRIMARY KEY)`, 'classroom_practice', { persona: 'console' }), 'console creates temp table');
ok(await sql(`DROP TABLE ${consoleTemp}`, 'classroom_practice', { persona: 'console' }), 'console drops temp table');

for (const restrictedDb of ['security_lab', 'perf_lab', 'mysql']) {
  fail(await sql('SELECT 1', restrictedDb, { persona: 'console' }), 1044, `console denied database access on ${restrictedDb}`);
}

for (const dbName of [
  'college_demo', 'classroom_practice', 'sql_lab', 'security_lab',
  'perf_lab', 'ops_lab', 'backup_lab', 'information_schema',
  'performance_schema', 'mysql'
]) {
  ok(await sql('SELECT 1 AS ok', dbName, { persona: 'dba_lab' }), `dba_lab SELECT 1 on ${dbName}`);
}

fail(
  await sql("INSERT INTO college_demo.students (name, city, age) VALUES ('X', 'Pune', 20)", 'college_demo', { persona: 'web_app' }),
  1142,
  'web_app denied INSERT on college_demo.students'
);

const dupCols = ok(await sql('SELECT 1 AS same, 2 AS same', 'classroom_practice'), 'Duplicate column aliases');
assert.deepEqual(dupCols.columns, ['same', 'same']);
assert.deepEqual(dupCols.rows[0].map(Number), [1, 2]);

const emptyMeta = ok(await sql('SELECT id, name FROM students WHERE id < 0', 'college_demo'), 'Empty query column preservation');
assert.deepEqual(emptyMeta.columns, ['id', 'name']);
assert.deepEqual(emptyMeta.rows, []);

fail(await sql('SELECT 1; SELECT 2;', 'classroom_practice'), undefined, 'Reject multi-statement');
fail(await sql('UPDATE college_demo.students SET age=25 WHERE id=1', 'classroom_practice'), 1142, 'Reject college_demo write by console');
fail(await sql('SELECT User FROM mysql.user', 'classroom_practice'), 1142, 'Reject mysql.user read by console');

const schemaRes = ok(await api('schema?database=college_demo'), 'Schema reference endpoint');
assert.ok(schemaRes.objects.some(o => o.name === 'students'));
console.log('PASS: Health, API guards, 10-DB persona isolation, duplicate aliases, and schema reference verified.');

// 3. Unit 1 Rehearsal & Auto-Checker
console.log('3. Rehearsing Unit 1 queries & challenge checker...');
const baselineCollege = ok(await sql('SELECT * FROM students ORDER BY id', 'college_demo'), 'Read college_demo baseline').rows;
assert.equal(baselineCollege.length, 5);

ok(await api('reset-practice', { database: 'classroom_practice' }), 'Reset lab_students');
const u1Guard = `verify_u1_${Date.now()}`;
ok(await sql(`CREATE TABLE ${u1Guard} (id INT PRIMARY KEY)`, 'classroom_practice'), 'Create U1 guard table');
ok(await sql(`INSERT INTO ${u1Guard} VALUES (99)`, 'classroom_practice'), 'Insert into U1 guard table');
try {
  for (const { step } of allSteps.filter(x => x.section.unit === 'u1' && x.step.type === 'query')) {
    if (step.setup) {
      ok(await api('prepare-practice', { database: 'classroom_practice', seed: Boolean(step.seedPractice) }), `Prepare ${step.id}`);
    }
    if (step.id === 'lab-constraints') {
      for (const [pname, psql] of step.presets) {
        fail(await sql(psql, 'classroom_practice'), undefined, `U1 constraint ${pname}`);
      }
    } else {
      ok(await sql(step.sql, step.database), `U1 ${step.id}`);
      for (const [pname, psql] of step.presets || []) {
        ok(await sql(psql, step.database), `U1 preset ${pname}`);
      }
    }
  }

  ok(await api('reset-practice', { database: 'classroom_practice' }), 'Reset lab_students after U1');
  const guardCheckU1 = ok(await sql(`SELECT id FROM ${u1Guard}`, 'classroom_practice'), 'Guard table survived reset');
  assert.equal(Number(guardCheckU1.rows[0][0]), 99);
} finally {
  await sql(`DROP TABLE IF EXISTS ${u1Guard}`, 'classroom_practice');
}

// Test U1 table-check auto-checker before and after creating lab_courses
const u1ChallengeCheck = allSteps.find(x => x.step.id === 'lab-challenge').step.check;
ok(await sql('DROP TABLE IF EXISTS lab_courses', 'classroom_practice'), 'Ensure clean lab_courses before check');
const chkU1Missing = ok(await api('check-answer', { sql: '', database: 'classroom_practice', checkSpec: u1ChallengeCheck }), 'U1 table-check fails before table exists');
assert.equal(chkU1Missing.passed, false);
ok(
  await sql(
    'CREATE TABLE IF NOT EXISTS lab_courses (id INT PRIMARY KEY AUTO_INCREMENT, course_name VARCHAR(100) NOT NULL, duration_months INT NOT NULL CHECK (duration_months > 0))',
    'classroom_practice'
  ),
  'Create lab_courses for checker test'
);
ok(
  await sql("INSERT INTO lab_courses (course_name, duration_months) VALUES ('A',1),('B',2),('C',3)", 'classroom_practice'),
  'Seed lab_courses for checker test'
);
const chkU1 = ok(await api('check-answer', { sql: '', database: 'classroom_practice', checkSpec: u1ChallengeCheck }), 'Run U1 check-answer with empty sql');
assert.equal(chkU1.passed, true, chkU1.message);
ok(await sql('DROP TABLE lab_courses', 'classroom_practice'), 'Clean up lab_courses');
console.log('PASS: Unit 1 live queries, resets, and auto-checker verified.');

// 4. Unit 2 Complete Rehearsal
console.log('4. Rehearsing all Unit 2 steps, presets, constraint errors, and challenges...');
ok(await api('reset-unit2', { database: 'sql_lab' }), 'Reset Unit 2');
// Regression check: reset-edit-copy works right after fresh reset
ok(await api('reset-edit-copy', { database: 'sql_lab' }), 'Reset edit copy on clean state');

// Regression check: ONLY_FULL_GROUP_BY rejects ungrouped column
fail(await sql('SELECT city, name FROM students GROUP BY city', 'sql_lab'), 1055, 'ONLY_FULL_GROUP_BY enforcement');

const u2Guard = `verify_u2_${Date.now()}`;
ok(await sql(`CREATE TABLE ${u2Guard} (id INT PRIMARY KEY)`, 'sql_lab'), 'Create U2 guard table');

let u2Count = 0;
let testedNegativeU2Check = false;
try {
  for (const { step } of allSteps.filter(x => x.section.unit === 'u2')) {
    if (step.type === 'challenge' && step.check) {
      const chk = ok(
        await api('check-answer', { sql: `-- student answer\n${step.check.expectedSql}`, database: step.database, checkSpec: step.check }),
        `U2 auto-check ${step.id}`
      );
      assert.equal(chk.passed, true, chk.message);
      if (step.id === 'sql-filter-practice') {
        const nonSelectChk = ok(await api('check-answer', { sql: 'DROP TABLE nonexistent_x;', database: step.database, checkSpec: step.check }), 'U2 query-match rejects non-SELECT');
        assert.equal(nonSelectChk.passed, false);
        const negChk = ok(await api('check-answer', { sql: 'SELECT 1 AS wrong_col;', database: step.database, checkSpec: step.check }), 'U2 negative check-answer');
        assert.equal(negChk.passed, false);
        testedNegativeU2Check = true;
      }
      continue;
    }
    if (step.type !== 'query') continue;

    if (step.prepare) {
      ok(await api(step.prepare, { database: 'sql_lab' }), `Prepare ${step.prepare} for ${step.id}`);
    }
    const res = await sql(step.sql, step.database, { persona: step.persona || 'console' });
    u2Count++;

    if (step.expectedError) {
      fail(res, step.expectedError, `U2 expected error ${step.id}`);
    } else {
      const data = ok(res, `U2 query ${step.id}`);
      if (step.expectedRows !== undefined) {
        assert.equal(data.count, step.expectedRows, `U2 row count ${step.id}`);
      }
      if (step.expectedValues !== undefined) {
        assert.deepEqual(
          data.rows.map(r => r.map(String)),
          step.expectedValues.map(r => r.map(String)),
          `U2 exact values ${step.id}`
        );
      }
    }

    for (const [pname, psql] of step.presets || []) {
      const pRes = await sql(psql, step.database, { persona: step.persona || 'console' });
      u2Count++;
      if (step.id === 'sql-constraint-errors' || (step.id === 'sql-view-types' && pname.includes('1369'))) {
        fail(pRes, undefined, `U2 preset rejection ${pname}`);
      } else {
        ok(pRes, `U2 preset ${pname}`);
      }
    }

    if (step.inspectSql) {
      ok(await sql(step.inspectSql, step.database, { persona: step.persona || 'console' }), `U2 inspect ${step.id}`);
      u2Count++;
    }

    if (step.id === 'sql-missing-where') {
      const emptyEdits = ok(await sql('SELECT COUNT(*) FROM student_edits', 'sql_lab'), 'Check empty student_edits');
      assert.equal(Number(emptyEdits.rows[0][0]), 0);
      ok(await api('reset-edit-copy', { database: 'sql_lab' }), 'Restore edit copy after missing WHERE');
      const fullEdits = ok(await sql('SELECT COUNT(*) FROM student_edits', 'sql_lab'), 'Check restored student_edits');
      assert.equal(Number(fullEdits.rows[0][0]), 6);
    }
  }

  assert.equal(testedNegativeU2Check, true, 'Expected negative U2 check-answer assertions to run');
  ok(await api('reset-unit2', { database: 'sql_lab' }), 'Reset Unit 2 after rehearsal');
  ok(await sql(`SELECT * FROM ${u2Guard}`, 'sql_lab'), 'U2 guard table survived reset');
} finally {
  await sql(`DROP TABLE IF EXISTS ${u2Guard}`, 'sql_lab');
}
console.log(`PASS: Rehearsed ${u2Count} Unit 2 SQL statements/presets/inspections and all challenges.`);

// 5. Unit 3 Complete Rehearsal
console.log('5. Rehearsing Unit 3 storage, Data Dictionary, persistent CRUD, roles, ed25519, SQLi, TLS, and password policy...');
ok(await api('reset-unit3', { database: 'security_lab', clientId: 'verify-suite' }), 'Reset Unit 3');

const storageInfo = ok(await api('admin/storage'), 'GET /api/admin/storage');
assert.ok(storageInfo.rootFiles.some(f => f.name.startsWith('ibdata')), 'Expected ibdata1 in storage files');
assert.ok(storageInfo.schemaFiles.some(s => s.schema === 'perf_lab'), 'Expected perf_lab files');

for (const { step } of allSteps.filter(x => x.section.unit === 'u3')) {
  if (step.type === 'challenge' && step.check) {
    const chk = ok(
      await api('check-answer', { sql: step.check.expectedSql, database: step.database, checkSpec: step.check }),
      `U3 auto-check ${step.id}`
    );
    assert.equal(chk.passed, true, chk.message);
    continue;
  }
  if (step.type !== 'query') continue;

  if (step.id === 'u3-tls-live') {
    fail(await sql(step.sql, step.database, { persona: 'tls_user', useTls: false }), 1045, 'TLS user rejected without SSL');
    const tlsOk = ok(
      await sql(step.sql, step.database, { persona: 'tls_user', useTls: true, includeSslCipher: true }),
      'TLS user succeeds with SSL'
    );
    assert.ok(tlsOk.sslCipher, 'Expected active TLS cipher');
    continue;
  }

  if (step.persistent) {
    for (const [pname, psql] of step.presets) {
      ok(
        await api('session/query', {
          clientId: 'verify-suite',
          slot: 'unit3',
          sql: psql,
          database: step.database,
          persona: step.persona
        }),
        `U3 persistent ${step.id} -> ${pname}`
      );
    }
    continue;
  }

  ok(await sql(step.sql, step.database, { persona: step.persona }), `U3 query ${step.id}`);
  for (const [pname, psql] of step.presets || []) {
    const r = await sql(psql, step.database, { persona: step.persona });
    if (step.id === 'u3-password-policy' && pname.includes('1819')) {
      fail(r, 1819, `U3 weak password rejected (${pname})`);
    } else {
      ok(r, `U3 preset ${step.id} -> ${pname}`);
    }
  }
}

// Persona lab checks (including analyst_u3 created during u3-roles-lifecycle)
fail(await sql('DELETE FROM students WHERE id = 1', 'college_demo', { persona: 'reporting' }), 1142, 'Reporting denied DELETE');
fail(await sql('DROP TABLE course_records', 'security_lab', { persona: 'web_app' }), 1142, 'web_app denied DROP');
const customUserRes = ok(
  await sql('SELECT id, title FROM course_records ORDER BY id', 'security_lab', {
    persona: 'custom',
    customAuth: { username: 'analyst_u3', password: 'Analyst#2026' }
  }),
  'Custom analyst_u3 login with default role_reader'
);
assert.equal(customUserRes.count, 3);
const [rootStatus] = await sql('SELECT 1', 'college_demo', {
  persona: 'custom',
  customAuth: { username: 'root', password: 'classroom-root' }
});
assert.equal(rootStatus, 403, 'Custom auth tester must forbid root');

// SQLi Demo checks
const sqliNormal = ok(await api('admin/sqli-demo', { username: 'aman', password: 'aman@2026' }), 'SQLi normal login');
assert.equal(sqliNormal.vulnerable.rows.length, 1);
assert.equal(sqliNormal.safe.rows.length, 1);

const sqliAttack = ok(await api('admin/sqli-demo', { username: "' OR '1'='1", password: "' OR '1'='1" }), 'SQLi bypass payload');
assert.equal(sqliAttack.vulnerable.rows.length, 4, 'Vulnerable query leaks all portal_users');
assert.equal(sqliAttack.safe.rows.length, 0, 'Parameterized query returns 0 rows safely');

const sqliComment = ok(await api('admin/sqli-demo', { username: "admin_portal' -- ", password: 'wrong' }), 'SQLi comment-hijack payload');
assert.ok(sqliComment.vulnerable.rows.length >= 1, 'Vulnerable query hijacks admin_portal row');
assert.equal(sqliComment.safe.rows.length, 0, 'Parameterized query blocks comment-hijack safely');

ok(await api('reset-unit3', { database: 'security_lab', clientId: 'verify-suite' }), 'Cleanup reset Unit 3');
console.log('PASS: Unit 3 storage, CRUD, roles, ed25519, personas, SQLi, TLS, and password policy verified.');

// 6. Unit 4 Complete Rehearsal
console.log('6. Rehearsing Unit 4 logs, audit, metrics, 25k EXPLAIN, concurrent locks/deadlock, and backup/restore...');
ok(await api('reset-unit4', { database: 'perf_lab', clientId: 'verify-suite' }), 'Reset Unit 4');

// Logs & Audit plugin
ok(await api('admin/logs/toggle', { target: 'general', enabled: true }), 'Enable general_log');
ok(await sql('SELECT 1 AS ping_general_log', 'college_demo'), 'Generate general log query');
ok(await api('admin/logs/toggle', { target: 'general', enabled: false }), 'Disable general_log');
const genLog = ok(await api('admin/logs?type=general&lines=30'), 'Read general_log');
assert.ok(genLog.content.includes('ping_general_log'), 'Expected query in general.log');

ok(await api('admin/logs/toggle', { target: 'trigger-slow', value: 0.7 }), 'Trigger slow query');
const slowLog = ok(await api('admin/logs?type=slow&lines=40'), 'Read slow.log');
assert.ok(slowLog.content.includes('SLEEP(0.7)'), 'Expected slow query in slow.log');

ok(await api('admin/logs/toggle', { target: 'audit', enabled: true, value: ['CONNECT', 'QUERY', 'TABLE'] }), 'Enable server_audit');
ok(await sql('SELECT COUNT(*) FROM students', 'college_demo', { persona: 'dba_lab' }), 'Generate audited query');
ok(await api('admin/logs/toggle', { target: 'audit', enabled: false }), 'Disable server_audit');
const auditLog = ok(await api('admin/logs?type=audit&lines=30'), 'Read audit.log');
assert.ok(auditLog.content.includes('SELECT COUNT(*) FROM students'), 'Expected audited statement in audit.log');

// Metrics
const metrics = ok(await api('admin/metrics'), 'GET /api/admin/metrics');
assert.ok(metrics.bufferHitPct >= 0 && metrics.processlist.length > 0, 'Expected live metrics & processlist');

// Rehearse all Unit 4 query steps & presets + 25k EXPLAIN indexing check
for (const { step } of allSteps.filter(x => x.section.unit === 'u4' && x.step.type === 'query')) {
  if (step.id === 'u4-explain-before') {
    ok(await api('reset-unit4-perf', { database: 'perf_lab' }), 'Reset perf_lab indexes before u4-explain-before');
  }
  ok(await sql(step.sql, step.database, { persona: step.persona || 'dba_lab' }), `U4 query ${step.id}`);
  for (const [pname, psql] of step.presets || []) {
    ok(await sql(psql, step.database, { persona: step.persona || 'dba_lab' }), `U4 preset ${step.id} -> ${pname}`);
  }
  if (step.inspectSql) {
    ok(await sql(step.inspectSql, step.database, { persona: step.persona || 'dba_lab' }), `U4 inspect ${step.id}`);
  }
  if (step.id === 'u4-create-index-after') {
    ok(await api('reset-unit4-perf', { database: 'perf_lab' }), 'Reset perf_lab indexes after u4-create-index-after');
  }
}

ok(await api('reset-unit4-perf', { database: 'perf_lab' }), 'Reset perf_lab indexes');
const expBefore = ok(await sql('EXPLAIN SELECT id, event_type, duration_ms FROM activity_events WHERE student_id = 42', 'perf_lab', { persona: 'dba_lab' }), 'EXPLAIN before index');
const typeColIdx = expBefore.columns.indexOf('type');
const keyColIdx = expBefore.columns.indexOf('key');
const rowsColIdx = expBefore.columns.indexOf('rows');
assert.equal(expBefore.rows[0][typeColIdx], 'ALL', 'Expected full table scan ALL before index');
assert.ok(Number(expBefore.rows[0][rowsColIdx]) >= 20000, 'Expected ~25000 estimated rows before index');

ok(await sql('CREATE INDEX idx_activity_student ON activity_events(student_id)', 'perf_lab', { persona: 'dba_lab' }), 'Create idx_activity_student');
const expAfter = ok(await sql('EXPLAIN SELECT id, event_type, duration_ms FROM activity_events WHERE student_id = 42', 'perf_lab', { persona: 'dba_lab' }), 'EXPLAIN after index');
assert.equal(expAfter.rows[0][typeColIdx], 'ref', 'Expected ref scan after index');
assert.equal(expAfter.rows[0][keyColIdx], 'idx_activity_student', 'Expected idx_activity_student chosen');
assert.ok(Number(expAfter.rows[0][rowsColIdx]) <= 100, 'Expected ~50 rows examined after index');

// Concurrent Dual-Session Lock Wait Test (with bounded polling)
ok(await api('reset-unit4-locks', { clientId: 'verify-locks' }), 'Prepare lock sessions');
ok(await api('session/query', { clientId: 'verify-locks', slot: 'A', sql: 'START TRANSACTION;', database: 'ops_lab', persona: 'dba_lab' }), 'Lock wait A start');
ok(await api('session/query', { clientId: 'verify-locks', slot: 'A', sql: 'UPDATE accounts SET budget = budget - 5000 WHERE id = 1;', database: 'ops_lab', persona: 'dba_lab' }), 'Lock wait A holds row 1');

const pendingB = api('session/query', { clientId: 'verify-locks', slot: 'B', sql: 'UPDATE accounts SET budget = budget - 1000 WHERE id = 1;', database: 'ops_lab', persona: 'dba_lab' });
let lockMetrics = null;
for (let attempt = 0; attempt < 20; attempt++) {
  await new Promise(r => setTimeout(r, 100));
  const candidate = ok(await api('admin/metrics'), 'Poll metrics during active lock wait');
  if (candidate.transactions.some(t => t.trx_state === 'LOCK WAIT') && candidate.dataLocks.some(l => l.lock_status === 'WAITING')) {
    lockMetrics = candidate;
    break;
  }
}
assert.ok(lockMetrics?.transactions?.some(t => t.trx_state === 'LOCK WAIT'), 'Expected active LOCK WAIT in INNODB_TRX');
assert.ok(lockMetrics?.dataLocks?.some(l => l.lock_status === 'WAITING'), 'Expected WAITING lock in INNODB_LOCKS');

ok(await api('session/query', { clientId: 'verify-locks', slot: 'A', sql: 'COMMIT;', database: 'ops_lab', persona: 'dba_lab' }), 'Commit Session A');
ok(await pendingB, 'Blocked Session B finished after Session A COMMIT');
const sessReset = ok(await api('session/reset', { clientId: 'verify-locks' }), 'Reset lock sessions explicitly');
assert.equal(sessReset.ok, true);

// Reproducible Error 1213 Deadlock Test
ok(await api('reset-unit4-locks', { clientId: 'verify-dl' }), 'Reset for deadlock test');
ok(await api('session/query', { clientId: 'verify-dl', slot: 'A', sql: 'START TRANSACTION;', database: 'ops_lab', persona: 'dba_lab' }), 'DL A begin');
ok(await api('session/query', { clientId: 'verify-dl', slot: 'A', sql: 'UPDATE accounts SET budget = budget - 100 WHERE id = 1;', database: 'ops_lab', persona: 'dba_lab' }), 'DL A locks 1');
ok(await api('session/query', { clientId: 'verify-dl', slot: 'B', sql: 'START TRANSACTION;', database: 'ops_lab', persona: 'dba_lab' }), 'DL B begin');
ok(await api('session/query', { clientId: 'verify-dl', slot: 'B', sql: 'UPDATE accounts SET budget = budget - 100 WHERE id = 2;', database: 'ops_lab', persona: 'dba_lab' }), 'DL B locks 2');

const dlWaitA = api('session/query', { clientId: 'verify-dl', slot: 'A', sql: 'UPDATE accounts SET budget = budget + 100 WHERE id = 2;', database: 'ops_lab', persona: 'dba_lab' });
await new Promise(r => setTimeout(r, 250));
const dlResB = await api('session/query', { clientId: 'verify-dl', slot: 'B', sql: 'UPDATE accounts SET budget = budget + 100 WHERE id = 1;', database: 'ops_lab', persona: 'dba_lab' });
const dlResA = await dlWaitA;
assert.ok(
  (dlResA[0] === 400 && dlResA[1].code === 1213) || (dlResB[0] === 400 && dlResB[1].code === 1213),
  `Expected MariaDB deadlock Error 1213, got A=${JSON.stringify(dlResA)} B=${JSON.stringify(dlResB)}`
);
ok(await api('reset-unit4-locks', { clientId: 'verify-dl' }), 'Cleanup deadlock sessions');

// Live Backup (schema, data, full), Corrupt, Restore, Binlog & Reset Test
const tempBackups = ['verify_schema.sql', 'verify_data.sql', 'verify_full.sql'];
try {
  const bkSchema = ok(await api('admin/backup', { action: 'dump-schema', filename: 'verify_schema.sql' }), 'Schema backup');
  assert.ok(bkSchema.preview.includes('CREATE TABLE'), 'Expected CREATE TABLE in schema dump');
  const bkData = ok(await api('admin/backup', { action: 'dump-data', filename: 'verify_data.sql' }), 'Data-only backup');
  assert.ok(bkData.preview.includes('INSERT INTO'), 'Expected INSERT INTO in data dump');
  const bkDump = ok(await api('admin/backup', { action: 'dump', filename: 'verify_full.sql' }), 'Take full backup via mariadb-dump');
  assert.equal(bkDump.status.rowCount, 8);
  const bkDrop = ok(await api('admin/backup', { action: 'corrupt' }), 'Simulate DROP TABLE fee_ledger');
  assert.equal(bkDrop.status.tableExists, false);
  const bkRestore = ok(await api('admin/backup', { action: 'restore', filename: 'verify_full.sql' }), 'Restore fee_ledger from backup');
  assert.equal(bkRestore.status.tableExists, true);
  assert.equal(bkRestore.status.rowCount, 8);
  const binlogView = ok(await api('admin/logs?type=binlog&lines=30'), 'Inspect binary log via mariadb-binlog');
  assert.ok(binlogView.binlogs.length >= 1, 'Expected active binary log files');
  const bkReset = ok(await api('admin/backup', { action: 'reset' }), 'Reset backup_lab cleanly');
  assert.equal(bkReset.status.tableExists, true);
  assert.equal(bkReset.status.rowCount, 8);
} finally {
  for (const fname of tempBackups) {
    try {
      fs.unlinkSync(path.join('/var/backups/classroom', fname));
    } catch {
      // Ignore if absent
    }
  }
}

// Unit 4 capstone auto-checker
const u4Check = allSteps.find(x => x.step.id === 'u4-capstone-incident').step.check;
const chkU4 = ok(await api('check-answer', { sql: u4Check.expectedSql, database: 'information_schema', checkSpec: u4Check }), 'U4 capstone auto-check');
assert.equal(chkU4.passed, true, chkU4.message);

// Final clean reset across Units 2, 3, 4 & verify college_demo untouched
ok(await api('reset-unit2', { database: 'sql_lab' }), 'Final clean reset Unit 2');
ok(await api('reset-unit3', { database: 'security_lab', clientId: 'verify-suite' }), 'Final clean reset Unit 3');
ok(await api('reset-unit4', { database: 'perf_lab', clientId: 'verify-suite' }), 'Final clean reset Unit 4');

const afterCollege = ok(await sql('SELECT * FROM students ORDER BY id', 'college_demo'), 'Verify college_demo untouched').rows;
assert.deepEqual(afterCollege, baselineCollege);

console.log('ALL VERIFICATION CHECKS PASSED!');

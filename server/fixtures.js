import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { closeClientSessions, connectAdmin, HttpError } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadSql(name) {
  return fs.readFileSync(path.join(__dirname, name), 'utf8');
}

export async function prepareUnit2(conn, reset = false) {
  const [lockRows] = await conn.query("SELECT GET_LOCK('classroom_unit2_setup', 10) AS got");
  if (Number(lockRows?.[0]?.got) !== 1) {
    throw new HttpError(409, 'Unit 2 preparation is busy. Try again.');
  }
  try {
    await conn.query('USE sql_lab');
    const [markerRows] = await conn.query(
      "SELECT COUNT(*) AS cnt FROM information_schema.TABLES WHERE TABLE_SCHEMA='sql_lab' AND TABLE_NAME='lesson_state'"
    );
    const hasMarker = Number(markerRows?.[0]?.cnt) > 0;
    if (!reset && hasMarker) {
      const [verRows] = await conn.query('SELECT COUNT(*) AS cnt FROM sql_lab.lesson_state WHERE fixture_version=1');
      if (Number(verRows?.[0]?.cnt) === 1) {
        return 'Unit 2 dataset is ready. Existing edits were preserved.';
      }
    }
    const [existingRows] = await conn.query(
      "SELECT COUNT(*) AS cnt FROM information_schema.TABLES WHERE TABLE_SCHEMA='sql_lab'"
    );
    if (!reset && Number(existingRows?.[0]?.cnt) > 0) {
      throw new HttpError(
        409,
        'An incomplete or existing SQL dataset was found. Use Reset Unit 2 data to rebuild the named lesson tables.'
      );
    }
    await conn.query(loadSql('unit2-fixture.sql'));
    return reset
      ? 'Unit 2 lesson tables restored to their original sample records.'
      : 'Unit 2 sample tables are ready.';
  } finally {
    await conn.query("SELECT RELEASE_LOCK('classroom_unit2_setup')").catch(() => {});
  }
}

export async function prepareEditCopy(conn) {
  await prepareUnit2(conn, false);
  await conn.query('USE sql_lab');
  await conn.query('DROP TABLE IF EXISTS student_edits');
  await conn.query('CREATE TABLE student_edits LIKE students');
  await conn.query('INSERT INTO student_edits SELECT * FROM students');
  return 'student_edits restored from the Unit 2 students table. Other tables are unchanged.';
}

export async function prepareCourseNotes(conn) {
  await prepareUnit2(conn, false);
  await conn.query('USE sql_lab');
  await conn.query('DROP TABLE IF EXISTS course_notes');
  await conn.query(`
    CREATE TABLE course_notes (
      id INT PRIMARY KEY AUTO_INCREMENT,
      course_id INT NOT NULL,
      note VARCHAR(200) NOT NULL,
      created_on DATE NOT NULL,
      FOREIGN KEY (course_id) REFERENCES courses(id)
    ) ENGINE=InnoDB
  `);
  return 'course_notes prepared in its initial state (without the priority column), ready for ALTER TABLE.';
}

export async function prepareCourseRosterView(conn) {
  await prepareUnit2(conn, false);
  await conn.query('USE sql_lab');
  await conn.query(`
    CREATE OR REPLACE SQL SECURITY INVOKER VIEW course_roster AS
    SELECT s.id AS student_id, s.name, c.id AS course_id, c.course_name, e.score
    FROM students s
    JOIN enrollments e ON e.student_id = s.id
    JOIN courses c ON c.id = e.course_id
  `);
  return 'course_roster view is ready in sql_lab.';
}

export async function preparePractice(conn, seed = false) {
  await conn.query('USE classroom_practice');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS lab_students (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(120) NOT NULL UNIQUE,
      age INT CHECK (age >= 16)
    ) ENGINE=InnoDB
  `);
  if (seed) {
    const samples = [
      ['Aman', 'aman.lab@example.com', 25],
      ['Riya', 'riya.lab@example.com', 19],
      ['Kabir', 'kabir.lab@example.com', 22]
    ];
    for (const [name, email, age] of samples) {
      await conn.query(
        'INSERT INTO lab_students (name, email, age) SELECT ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM lab_students WHERE email = ?)',
        [name, email, age, email]
      );
    }
  }
  return seed
    ? 'lab_students table and sample rows prepared in classroom_practice.'
    : 'lab_students table prepared in classroom_practice.';
}

export async function resetPractice(conn) {
  await conn.query('USE classroom_practice');
  await conn.query('DROP TABLE IF EXISTS lab_students');
  return 'lab_students removed. Ready to repeat the CREATE TABLE step.';
}

export async function prepareUnit3(conn, reset = false) {
  await conn.query('CREATE DATABASE IF NOT EXISTS security_lab');
  await conn.query('USE security_lab');
  const [marker] = await conn.query(
    "SELECT COUNT(*) AS cnt FROM information_schema.TABLES WHERE TABLE_SCHEMA='security_lab' AND TABLE_NAME='lesson_state'"
  );
  if (reset || Number(marker?.[0]?.cnt) === 0) {
    await conn.query(loadSql('unit3-fixture.sql'));
  }
  if (reset) {
    // Clean up lab-created demo objects, accounts, roles, and password validation plugin
    await conn.query('DROP DATABASE IF EXISTS demo_scratch');
    for (const userHost of [
      "'intern'@'%'",
      "'analyst_u3'@'%'",
      "'ed_user'@'%'",
      "'locked_user'@'%'",
      "'report_dev'@'%'",
      "'app_u3'@'%'"
    ]) {
      await conn.query(`DROP USER IF EXISTS ${userHost}`).catch(() => {});
    }
    await conn.query("DROP ROLE IF EXISTS 'role_reader'").catch(() => {});
    await conn.query("DROP ROLE IF EXISTS 'role_analyst'").catch(() => {});
    await conn.query('UNINSTALL PLUGIN IF EXISTS simple_password_check').catch(() => {});
    // Restore canonical demo permissions
    await conn.query("CREATE USER IF NOT EXISTS 'web_app'@'%' IDENTIFIED BY 'webapp-demo-password'");
    await conn.query("GRANT SELECT, INSERT, UPDATE ON college_demo.* TO 'web_app'@'%'");
    await conn.query("GRANT SELECT, INSERT, UPDATE ON security_lab.* TO 'web_app'@'%'");
    await conn.query("CREATE USER IF NOT EXISTS 'reporting'@'%' IDENTIFIED BY 'reporting-demo-password'");
    await conn.query("GRANT SELECT ON college_demo.* TO 'reporting'@'%'");
    await conn.query("GRANT SELECT ON sql_lab.* TO 'reporting'@'%'");
    await conn.query("GRANT SELECT ON security_lab.* TO 'reporting'@'%'");
    await conn.query("CREATE USER IF NOT EXISTS 'tls_user'@'%' IDENTIFIED BY 'tls-local-demo' REQUIRE SSL");
    await conn.query("GRANT SELECT ON college_demo.* TO 'tls_user'@'%'");
    await conn.query("GRANT SELECT ON security_lab.* TO 'tls_user'@'%'");
    await conn.query('FLUSH PRIVILEGES');
    return 'Unit 3 security_lab tables, demo accounts, and roles restored to baseline.';
  }
  return 'Unit 3 security_lab is ready.';
}

export async function seedPerfLab(conn, reset = false) {
  await conn.query('CREATE DATABASE IF NOT EXISTS perf_lab');
  await conn.query('USE perf_lab');

  const [existsRows] = await conn.query(
    "SELECT COUNT(*) AS cnt FROM information_schema.TABLES WHERE TABLE_SCHEMA='perf_lab' AND TABLE_NAME='activity_events'"
  );
  let rowCount = 0;
  if (Number(existsRows?.[0]?.cnt) > 0) {
    const [cntRows] = await conn.query('SELECT COUNT(*) AS cnt FROM perf_lab.activity_events');
    rowCount = Number(cntRows?.[0]?.cnt || 0);
  }

  if (reset || rowCount !== 25000) {
    await conn.query('DROP TABLE IF EXISTS perf_lab.activity_events');
    await conn.query(`
      CREATE TABLE perf_lab.activity_events (
        id INT PRIMARY KEY AUTO_INCREMENT,
        student_id INT NOT NULL,
        event_type VARCHAR(32) NOT NULL,
        duration_ms INT NOT NULL,
        created_at DATETIME NOT NULL,
        payload VARCHAR(120) NOT NULL
      ) ENGINE=InnoDB
    `);
    await conn.query(`
      INSERT INTO perf_lab.activity_events (student_id, event_type, duration_ms, created_at, payload)
      WITH RECURSIVE
        a(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM a WHERE n < 500),
        b(m) AS (SELECT 1 UNION ALL SELECT m + 1 FROM b WHERE m < 50)
      SELECT
        a.n AS student_id,
        ELT(((a.n + b.m) % 6) + 1, 'login', 'query_run', 'lab_submit', 'view_lesson', 'export_report', 'logout') AS event_type,
        20 + ((a.n * 17 + b.m * 31) % 950) AS duration_ms,
        TIMESTAMPADD(MINUTE, (a.n * 50 + b.m), '2026-07-01 08:00:00') AS created_at,
        CONCAT('session-', LPAD(a.n, 3, '0'), '-step-', b.m) AS payload
      FROM a CROSS JOIN b
    `);
    await conn.query('ANALYZE TABLE perf_lab.activity_events');
    return 'perf_lab.activity_events reset to 25,000 unindexed baseline rows.';
  }

  if (reset) {
    // Also drop any student-added secondary indexes
    const [idxRows] = await conn.query(`
      SELECT DISTINCT INDEX_NAME
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA='perf_lab' AND TABLE_NAME='activity_events' AND INDEX_NAME <> 'PRIMARY'
    `);
    for (const row of idxRows) {
      await conn.query(`DROP INDEX \`${row.INDEX_NAME}\` ON perf_lab.activity_events`);
    }
    await conn.query('ANALYZE TABLE perf_lab.activity_events');
  }
  return 'perf_lab.activity_events is ready (25,000 rows).';
}

export async function resetPerfIndexes(conn) {
  await seedPerfLab(conn, false);
  const [idxRows] = await conn.query(`
    SELECT DISTINCT INDEX_NAME
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA='perf_lab' AND TABLE_NAME='activity_events' AND INDEX_NAME <> 'PRIMARY'
  `);
  for (const row of idxRows) {
    await conn.query(`DROP INDEX \`${row.INDEX_NAME}\` ON perf_lab.activity_events`);
  }
  await conn.query('ANALYZE TABLE perf_lab.activity_events');
  return 'Secondary indexes removed from perf_lab.activity_events (25,000 rows ready for baseline EXPLAIN).';
}

export async function prepareUnit4(conn, reset = false) {
  await conn.query('CREATE DATABASE IF NOT EXISTS ops_lab');
  await conn.query('CREATE DATABASE IF NOT EXISTS backup_lab');
  const [opsExists] = await conn.query(
    "SELECT COUNT(*) AS cnt FROM information_schema.TABLES WHERE TABLE_SCHEMA='ops_lab' AND TABLE_NAME='accounts'"
  );
  const [bkExists] = await conn.query(
    "SELECT COUNT(*) AS cnt FROM information_schema.TABLES WHERE TABLE_SCHEMA='backup_lab' AND TABLE_NAME='fee_ledger'"
  );
  if (reset || Number(opsExists?.[0]?.cnt) === 0 || Number(bkExists?.[0]?.cnt) === 0) {
    await conn.query(loadSql('unit4-fixture.sql'));
  }
  await seedPerfLab(conn, reset);
  if (reset) {
    await conn.query("SET GLOBAL general_log = 'OFF'").catch(() => {});
    await conn.query("SET GLOBAL slow_query_log = 'ON'").catch(() => {});
    await conn.query('SET GLOBAL long_query_time = 0.5').catch(() => {});
    await conn.query("SET GLOBAL server_audit_logging = 'OFF'").catch(() => {});
    return 'Unit 4 perf_lab, ops_lab, backup_lab, and logging flags restored to baseline.';
  }
  return 'Unit 4 monitoring, locking, and backup labs are ready.';
}

export async function resetLocksLab(clientId) {
  await closeClientSessions(clientId, 'A');
  await closeClientSessions(clientId, 'B');
  const conn = await connectAdmin('ops_lab', true);
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS ops_lab.accounts (
        id INT PRIMARY KEY,
        department VARCHAR(80) NOT NULL,
        budget DECIMAL(12,2) NOT NULL
      ) ENGINE=InnoDB;
      TRUNCATE TABLE ops_lab.accounts;
      INSERT INTO ops_lab.accounts (id, department, budget) VALUES
        (1, 'Cybersecurity Lab', 50000.00),
        (2, 'Database Systems Lab', 40000.00),
        (3, 'Student Scholarships', 75000.00),
        (4, 'Library Acquisitions', 30000.00);
    `);
    return 'Lock sessions closed and ops_lab.accounts restored.';
  } finally {
    await conn.end().catch(() => {});
  }
}

export async function resetBackupLab() {
  const conn = await connectAdmin('backup_lab', true);
  try {
    await conn.query(`
      DROP TABLE IF EXISTS backup_lab.fee_ledger;
      CREATE TABLE backup_lab.fee_ledger (
        receipt_no INT PRIMARY KEY,
        student_name VARCHAR(100) NOT NULL,
        course_code VARCHAR(20) NOT NULL,
        amount DECIMAL(9,2) NOT NULL,
        recorded_on DATE NOT NULL
      ) ENGINE=InnoDB;
      INSERT INTO backup_lab.fee_ledger VALUES
        (5001, 'Aman Verma', 'MSCNS406', 6000.00, '2026-07-01'),
        (5002, 'Riya Sharma', 'MSCNS406', 4000.00, '2026-07-03'),
        (5003, 'Kabir Singh', 'MSCNS406', 2000.00, '2026-07-10'),
        (5004, 'Meera Nair', 'MSCNS406', 3500.00, '2026-07-15'),
        (5005, 'Zoya Khan', 'MSCNS406', 1000.00, '2026-08-01'),
        (5006, 'Dev Patel', 'MSCNS406', 4500.00, '2026-08-10'),
        (5007, 'Ananya Roy', 'MSCNS406', 5000.00, '2026-08-14'),
        (5008, 'Vikram Rao', 'MSCNS406', 3000.00, '2026-08-20');
    `);
    return 'backup_lab.fee_ledger restored to its 8 baseline receipts.';
  } finally {
    await conn.end().catch(() => {});
  }
}

import fs from 'node:fs';
import path from 'node:path';
import { connectAdmin } from './db.js';
import { prepareUnit2, prepareUnit3, prepareUnit4 } from './fixtures.js';

function loadDatabaseScript(filename) {
  const candidates = [
    path.join('/app/database', filename),
    path.resolve(process.cwd(), '..', 'database', filename)
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
  }
  throw new Error(`Missing bootstrap SQL file: ${filename}`);
}

export async function bootstrapClassroom() {
  const maxAttempts = 20;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let conn;
    try {
      conn = await connectAdmin('mysql', true);
      const [collegeCheck] = await conn.query(
        "SELECT COUNT(*) AS cnt FROM information_schema.TABLES WHERE TABLE_SCHEMA='college_demo' AND TABLE_NAME='students'"
      );
      if (Number(collegeCheck?.[0]?.cnt) === 0) {
        await conn.query(loadDatabaseScript('01-seed.sql'));
      }
      await conn.query(loadDatabaseScript('02-classroom.sql'));
      await conn.query(loadDatabaseScript('03-unit2.sql'));
      await conn.query(loadDatabaseScript('04-admin-labs.sql'));

      await prepareUnit2(conn, false);
      await prepareUnit3(conn, false);
      await prepareUnit4(conn, false);
      await conn.end();
      console.log('[bootstrap] All classroom databases, grants, and unit fixtures are ready.');
      return;
    } catch (err) {
      if (conn) await conn.end().catch(() => {});
      if (attempt === maxAttempts) {
        console.error('[bootstrap] Failed after max retries:', err);
        throw err;
      }
      console.log(`[bootstrap] Waiting for MariaDB (${attempt}/${maxAttempts}): ${err.message}`);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
}

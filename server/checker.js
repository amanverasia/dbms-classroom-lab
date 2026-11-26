import { connectAdmin, HttpError, runSingleQuery, sanitizeValue, validateDatabase } from './db.js';

function normalizeRow(row) {
  return row.map(v => {
    if (v === null || v === undefined) return null;
    const s = String(sanitizeValue(v)).trim();
    if (/^-?\d+\.\d+$/.test(s)) {
      return Number(s).toFixed(2);
    }
    return s;
  });
}

function serializeRows(rows) {
  return rows.map(r => JSON.stringify(normalizeRow(r)));
}

function stripLeadingComments(sql) {
  return sql.replace(/^(?:\s*(?:--[^\n]*(?:\n|$)|#[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/))+/g, '').trim();
}

export async function checkStudentAnswer({ sql, database, checkSpec }) {
  if (!checkSpec || typeof checkSpec !== 'object') {
    throw new HttpError(400, 'This step does not have an auto-check specification.');
  }

  const targetDb = validateDatabase(checkSpec.database || database || 'sql_lab');

  if (checkSpec.kind === 'table-check') {
    const tableName = String(checkSpec.table || '').trim();
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      throw new HttpError(400, 'Invalid target table check configuration.');
    }
    const conn = await connectAdmin('information_schema');
    try {
      const [cols] = await conn.query(
        `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, EXTRA
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
         ORDER BY ORDINAL_POSITION`,
        [targetDb, tableName]
      );
      if (cols.length === 0) {
        return {
          passed: false,
          message: `Table ${targetDb}.${tableName} does not exist yet. Run your CREATE TABLE statement first, then check again.`
        };
      }
      const colMap = Object.fromEntries(cols.map(c => [c.COLUMN_NAME.toLowerCase(), c]));
      const missing = (checkSpec.requiredColumns || []).filter(c => !colMap[c.toLowerCase()]);
      if (missing.length > 0) {
        return {
          passed: false,
          message: `Table ${tableName} exists, but is missing column(s): ${missing.join(', ')}.`
        };
      }
      if (checkSpec.primaryKey && colMap[checkSpec.primaryKey.toLowerCase()]?.COLUMN_KEY !== 'PRI') {
        return {
          passed: false,
          message: `Column "${checkSpec.primaryKey}" should be defined as the PRIMARY KEY.`
        };
      }
      const [cntRows] = await conn.query(`SELECT COUNT(*) AS cnt FROM \`${targetDb}\`.\`${tableName}\``);
      const count = Number(cntRows?.[0]?.cnt || 0);
      const minRows = Number(checkSpec.minRows || 1);
      if (count < minRows) {
        return {
          passed: false,
          message: `Table ${tableName} structure looks good, but it currently has ${count} row(s). Insert at least ${minRows} rows.`
        };
      }
      return {
        passed: true,
        message: `Verified! ${targetDb}.${tableName} exists with ${cols.length} columns and ${count} row(s).`
      };
    } finally {
      await conn.end().catch(() => {});
    }
  }

  if (checkSpec.kind === 'query-match') {
    const cleanSql = String(sql || '').trim();
    const expectedSql = String(checkSpec.expectedSql || '').trim();
    if (!cleanSql) {
      throw new HttpError(400, 'Write an SQL statement before clicking Check my answer.');
    }
    if (!expectedSql) {
      throw new HttpError(500, 'Missing reference query on step checkSpec.');
    }

    const stripped = stripLeadingComments(cleanSql);
    const firstWord = stripped.split(/\s+/)[0]?.toUpperCase();
    if (!['SELECT', 'WITH'].includes(firstWord)) {
      return {
        passed: false,
        message: 'For this reporting check, enter a SELECT query (one statement) and verify again.'
      };
    }

    const studentRes = await runSingleQuery({
      sql: cleanSql,
      database: targetDb,
      persona: checkSpec.persona || 'console'
    });
    const expectedRes = await runSingleQuery({
      sql: expectedSql,
      database: targetDb,
      persona: checkSpec.persona || 'console'
    });

    if (studentRes.columns.length !== expectedRes.columns.length) {
      return {
        passed: false,
        message: `Expected ${expectedRes.columns.length} column(s) (${expectedRes.columns.join(', ')}), but your query returned ${studentRes.columns.length}.`,
        result: studentRes
      };
    }
    if (studentRes.count !== expectedRes.count) {
      return {
        passed: false,
        message: `Expected ${expectedRes.count} row(s), but your query returned ${studentRes.count}. Check your JOIN type or WHERE/HAVING filters.`,
        result: studentRes
      };
    }

    const actualRows = serializeRows(studentRes.rows);
    const targetRows = serializeRows(expectedRes.rows);
    let matches;
    if (checkSpec.orderMatters) {
      matches = actualRows.every((r, i) => r === targetRows[i]);
    } else {
      const sortedActual = [...actualRows].sort();
      const sortedTarget = [...targetRows].sort();
      matches = sortedActual.every((r, i) => r === sortedTarget[i]);
    }

    if (!matches) {
      return {
        passed: false,
        message: 'Column and row counts match, but row values or ordering differ from expected output. Compare NULL handling, aliases/sorting, or grouping.',
        result: studentRes
      };
    }

    return {
      passed: true,
      message: `Verified! Your query matches the expected ${expectedRes.count} row(s) and ${expectedRes.columns.length} column(s).`,
      result: studentRes
    };
  }

  throw new HttpError(400, `Unsupported check kind: ${checkSpec.kind}`);
}

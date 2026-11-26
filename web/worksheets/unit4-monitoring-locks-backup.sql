-- =============================================================================
-- MSCNS406 · Unit 4 Monitoring, Locking & Backup Worksheet (Open in DBeaver)
-- Connection: Host 127.0.0.1 | Port 3307 | User: dba_lab (Password: dba-local-demo)
-- =============================================================================

-- 1. Logs & Audit Variables + Dynamic Toggle Commands
SHOW GLOBAL VARIABLES WHERE Variable_name IN (
  'log_error', 'general_log', 'slow_query_log', 'long_query_time',
  'log_bin', 'server_audit_logging', 'server_audit_events'
);
-- SET GLOBAL general_log = ON;  -- remember to turn OFF when finished debugging
-- SET GLOBAL server_audit_events = 'CONNECT,QUERY_DDL,QUERY_DCL';
-- SET GLOBAL server_audit_logging = ON;

-- 2. Processes, Status Counters & Performance Schema Digests
SHOW FULL PROCESSLIST;
SHOW GLOBAL STATUS WHERE Variable_name IN (
  'Uptime', 'Threads_connected', 'Threads_running', 'Questions', 'Slow_queries',
  'Innodb_row_lock_waits', 'Innodb_deadlocks'
);
SELECT SCHEMA_NAME, LEFT(DIGEST_TEXT, 90) AS query_pattern, COUNT_STAR AS calls,
       ROUND(AVG_TIMER_WAIT/1000000000, 2) AS avg_ms, SUM_ROWS_EXAMINED AS rows_scanned
FROM performance_schema.events_statements_summary_by_digest
WHERE SCHEMA_NAME IS NOT NULL
ORDER BY SUM_TIMER_WAIT DESC LIMIT 10;

-- 3. Query Performance (EXPLAIN before & after index on 25,000 rows)
USE perf_lab;
EXPLAIN SELECT id, event_type, duration_ms FROM activity_events WHERE student_id = 42;
CREATE INDEX IF NOT EXISTS idx_activity_student ON activity_events(student_id);
EXPLAIN SELECT id, event_type, duration_ms FROM activity_events WHERE student_id = 42;
CREATE INDEX IF NOT EXISTS idx_activity_covering ON activity_events(student_id, event_type, duration_ms);
EXPLAIN SELECT id, event_type, duration_ms FROM activity_events WHERE student_id = 42;
-- DROP INDEX IF EXISTS idx_activity_student ON activity_events;
-- DROP INDEX IF EXISTS idx_activity_covering ON activity_events;

-- 4. Database Growth, Capacity Planning & Table Maintenance
SELECT TABLE_SCHEMA AS db_name, COUNT(*) AS tables, SUM(TABLE_ROWS) AS approx_rows,
       ROUND(SUM(DATA_LENGTH + INDEX_LENGTH)/1024/1024, 3) AS total_mb
FROM information_schema.TABLES
WHERE TABLE_SCHEMA IN ('college_demo', 'sql_lab', 'security_lab', 'perf_lab', 'ops_lab', 'backup_lab')
GROUP BY TABLE_SCHEMA
ORDER BY total_mb DESC;

ANALYZE TABLE perf_lab.activity_events;
CHECK TABLE perf_lab.activity_events;

-- 5. Dual-Session Lock Wait & Deadlock in DBeaver (Manual Commit Mode!)
-- In DBeaver, switch connection Transaction Mode from Auto-commit to Manual Commit:
-- Lock Wait demo:
--   Tab A: USE ops_lab; UPDATE accounts SET budget = budget - 5000 WHERE id = 1;
--   Tab B: USE ops_lab; UPDATE accounts SET budget = budget - 1000 WHERE id = 1; -- (blocks!)
-- Deadlock (Error 1213) demo:
--   Tab A: USE ops_lab; UPDATE accounts SET budget = budget - 100 WHERE id = 1;
--   Tab B: USE ops_lab; UPDATE accounts SET budget = budget - 100 WHERE id = 2;
--   Tab A: UPDATE accounts SET budget = budget + 100 WHERE id = 2; -- waits for Tab B
--   Tab B: UPDATE accounts SET budget = budget + 100 WHERE id = 1; -- immediate Error 1213 victim rollback!
-- Inspect locks from Tab C (Auto-commit):
SELECT trx_id, trx_state, trx_mysql_thread_id, trx_rows_locked, trx_query FROM information_schema.INNODB_TRX;
SELECT l.lock_trx_id, t.trx_mysql_thread_id AS thread_id, l.lock_table, l.lock_mode,
       IF(w.requested_lock_id IS NOT NULL, 'WAITING', 'GRANTED') AS lock_status, l.lock_data
FROM information_schema.INNODB_LOCKS l
JOIN information_schema.INNODB_TRX t ON t.trx_id = l.lock_trx_id
LEFT JOIN information_schema.INNODB_LOCK_WAITS w ON w.requested_lock_id = l.lock_id;
SHOW ENGINE INNODB STATUS;

-- 6. Backup & Recovery (Cross-platform safe inside container, or use Console Step 4.6)
-- Note: Never use host '<' redirection in Windows PowerShell; run redirection inside the container shell instead:
--   Full hot backup:  docker compose exec -T mariadb sh -c 'mariadb-dump -uroot -p"$MARIADB_ROOT_PASSWORD" --single-transaction backup_lab > /tmp/backup.sql'
--   Restore backup:   docker compose exec -T mariadb sh -c 'mariadb -uroot -p"$MARIADB_ROOT_PASSWORD" backup_lab < /tmp/backup.sql'
--   List binary logs: SHOW BINARY LOGS;
--   Binary log PITR:  docker compose exec -T mariadb mariadb-binlog --base64-output=DECODE-ROWS -v /var/log/mysql/<binlog_file_from_SHOW_BINARY_LOGS>
SHOW BINARY LOGS;

-- =============================================================================
-- MSCNS406 · Unit 4 Monitoring, Locking & Backup Worksheet (Open in DBeaver)
-- Connection: Host 127.0.0.1 | Port 3307 | User: dba_lab (Password: dba-local-demo)
-- =============================================================================

-- 1. Logs & Audit Variables
SHOW GLOBAL VARIABLES WHERE Variable_name IN (
  'log_error', 'general_log', 'slow_query_log', 'long_query_time',
  'log_bin', 'server_audit_logging', 'server_audit_events'
);

-- 2. Processes & Status Counters
SHOW FULL PROCESSLIST;
SHOW GLOBAL STATUS WHERE Variable_name IN (
  'Uptime', 'Threads_connected', 'Threads_running', 'Questions', 'Slow_queries',
  'Innodb_row_lock_waits', 'Innodb_deadlocks'
);

-- 3. Query Performance (EXPLAIN before & after index on 25,000 rows)
USE perf_lab;
EXPLAIN SELECT id, event_type, duration_ms FROM activity_events WHERE student_id = 42;
CREATE INDEX idx_activity_student ON activity_events(student_id);
EXPLAIN SELECT id, event_type, duration_ms FROM activity_events WHERE student_id = 42;
-- DROP INDEX idx_activity_student ON activity_events;

-- 4. Database Growth & Capacity Planning
SELECT TABLE_SCHEMA AS db_name, COUNT(*) AS tables, SUM(TABLE_ROWS) AS approx_rows,
       ROUND(SUM(DATA_LENGTH + INDEX_LENGTH)/1024/1024, 3) AS total_mb
FROM information_schema.TABLES
WHERE TABLE_SCHEMA IN ('college_demo', 'sql_lab', 'security_lab', 'perf_lab', 'ops_lab', 'backup_lab')
GROUP BY TABLE_SCHEMA
ORDER BY total_mb DESC;

-- 5. Dual-Session Lock Wait & Deadlock in DBeaver (Manual Commit Mode!)
-- In DBeaver, switch connection Transaction Mode from Auto-commit to Manual Commit:
--   Tab A: USE ops_lab; UPDATE accounts SET budget = budget - 5000 WHERE id = 1;
--   Tab B: USE ops_lab; UPDATE accounts SET budget = budget - 1000 WHERE id = 1; -- (blocks!)
--   Tab C (Auto-commit):
SELECT trx_id, trx_state, trx_mysql_thread_id, trx_rows_locked, trx_query FROM information_schema.INNODB_TRX;
SELECT l.lock_trx_id, t.trx_mysql_thread_id AS thread_id, l.lock_table, l.lock_mode,
       IF(w.requested_lock_id IS NOT NULL, 'WAITING', 'GRANTED') AS lock_status, l.lock_data
FROM information_schema.INNODB_LOCKS l
JOIN information_schema.INNODB_TRX t ON t.trx_id = l.lock_trx_id
LEFT JOIN information_schema.INNODB_LOCK_WAITS w ON w.requested_lock_id = l.lock_id;
--   Then run COMMIT; in Tab A to unblock Tab B!

-- 6. Backup & Recovery CLI Commands (run in Docker terminal or Console Backup Lab)
-- Full hot backup:  docker compose exec -T mariadb mariadb-dump -uroot -pclassroom-root --single-transaction backup_lab > backup.sql
-- Restore backup:   docker compose exec -T mariadb mariadb -uroot -pclassroom-root backup_lab < backup.sql
-- Binary log PITR:  docker compose exec -T mariadb mariadb-binlog --base64-output=DECODE-ROWS -v /var/log/mysql/mariadb-bin.000001

/* Unit 4: Monitoring & Maintenance of MariaDB (MSCNS406). */
COURSE.sections.push(
  {
    id: 'u4-logs', unit: 'u4', number: '4.1', title: 'Configure & view MariaDB log files', minutes: 75,
    objective: 'Distinguish MariaDB’s core log files, toggle dynamic logging variables, and inspect real log output.',
    steps: [
      {
        id: 'u4-log-overview',
        title: 'Five MariaDB log files and what each tells you.',
        lead: 'A DBA chooses the right log for the investigation rather than turning every log on blindly.',
        type: 'comparison',
        columns: ['Log File', 'What it records', 'Production default & cost'],
        rows: [
          ['Error Log (error.log)', 'Startup/shutdown, crashes, plugin loads, critical warnings', 'Always ON · minimal overhead'],
          ['Slow Query Log (slow.log)', 'Queries slower than long_query_time (0.5s in this lab)', 'Usually ON · low overhead, huge tuning value'],
          ['General Query Log (general.log)', 'Every single connect and SQL statement received', 'OFF by default · heavy disk/CPU overhead (debug only)'],
          ['Binary Log (mariadb-bin.*)', 'Committed data/DDL changes for replication and PITR', 'ON for production · modest write overhead'],
          ['Audit Log (audit.log)', 'Who connected, what failed, and what tables/queries ran', 'Controlled via server_audit plugin for compliance']
        ],
        question: 'Why should general_log normally stay OFF on a busy production server?',
        answer: 'Recording every single SELECT and connection creates massive disk I/O, hurts throughput, and rapidly fills storage.',
        notes: 'Point out that all five log paths in this lab are configured in docker/mariadb/classroom.cnf under /var/log/mysql/.'
      },
      {
        id: 'u4-log-viewer',
        title: 'Live Log Configuration & Tail Viewer.',
        lead: 'Toggle general_log and slow_query_log dynamically, trigger a 0.7s slow query, and read actual log lines from /var/log/mysql/.',
        type: 'log-lab',
        defaultTab: 'slow',
        question: 'Run the 0.7s slow query and switch to the Slow Query Log tab. Which fields appear inside a slow log entry?',
        answer: 'Timestamp, User@Host, Query_time, Lock_time, Rows_sent, Rows_examined, and the exact SQL statement.',
        notes: 'Toggle general_log ON briefly, press S to run a query in SQL Studio (or advance to the next step), view general.log, then toggle general_log OFF again.'
      },
      {
        id: 'u4-slow-query-test',
        title: 'Inspect log configuration & tuning variables via SQL.',
        lead: 'Check active log paths, unindexed-scan logging, and binary log retention settings in SQL Studio.',
        type: 'query',
        persona: 'dba_lab',
        database: 'perf_lab',
        sql: "SHOW GLOBAL VARIABLES WHERE Variable_name IN ('log_error','general_log','general_log_file','slow_query_log','slow_query_log_file','long_query_time','log_bin','binlog_format');",
        presets: [
          ['Inspect log variables', "SHOW GLOBAL VARIABLES WHERE Variable_name IN ('log_error','general_log','general_log_file','slow_query_log','slow_query_log_file','long_query_time','log_bin','binlog_format');"],
          ['Trigger 0.7s slow query', "SELECT SLEEP(0.7) AS slow_demo, 'Check slow.log now' AS tip;"],
          ['Count slow queries counter', "SHOW GLOBAL STATUS LIKE 'Slow_queries';"],
          ['Unindexed & binlog retention vars', "SHOW GLOBAL VARIABLES WHERE Variable_name IN ('log_queries_not_using_indexes','binlog_expire_logs_seconds','sync_binlog');"]
        ],
        expected: 'Displays live log paths, Slow_queries counter, unindexed-query logging, and binary log retention seconds.',
        question: 'Notice long_query_time is 0.5 seconds here. Does a 0.2s query appear in slow.log?',
        answer: 'No, unless long_query_time is lowered or log_queries_not_using_indexes is turned ON.',
        notes: 'Run Preset 2, then press ← to see it in Slow Query Log or use ⌘K to jump to 4.2 Live MariaDB Activity Monitor.'
      },
      {
        id: 'u4-logs-check',
        title: 'Checkpoint: picking the right log.',
        lead: 'The MariaDB container failed to start after someone edited classroom.cnf with a typo.',
        type: 'quiz',
        options: [
          'Check the Error Log (error.log)',
          'Enable the General Query Log via SQL',
          'Inspect binary logs with SELECT'
        ],
        correct: 0,
        feedback: 'If MariaDB cannot start, SQL queries cannot run—the Error Log captures startup failures and config typos.',
        question: 'Student task: distinguish the Binary Log from the Slow Query Log.',
        answer: 'Binary logs record state-changing writes (INSERT/UPDATE/DELETE/DDL) for replication and point-in-time recovery; slow logs record high-latency queries (including SELECTs) for performance tuning.',
        notes: 'Move to Section 4.2 for process monitoring and MariaDB Enterprise Monitor concepts + live metrics.'
      }
    ]
  },
  {
    id: 'u4-monitor', unit: 'u4', number: '4.2', title: 'Processes, status & Enterprise Monitor', minutes: 90,
    objective: 'Monitor live processes and status variables, understand MariaDB Enterprise Monitor, and read real server telemetry.',
    steps: [
      {
        id: 'u4-process-status',
        title: 'Monitor active threads, status counters & KILL.',
        lead: 'Compare SHOW FULL PROCESSLIST, session vs global status counters, and performance_schema SQL digests.',
        type: 'query',
        persona: 'dba_lab',
        database: 'information_schema',
        sql: 'SHOW FULL PROCESSLIST;',
        presets: [
          ['Active connections (PROCESSLIST)', 'SHOW FULL PROCESSLIST;'],
          ['Global command counters (Com_*)', "SHOW GLOBAL STATUS WHERE Variable_name IN ('Uptime','Questions','Com_select','Com_insert','Com_update','Com_delete','Slow_queries');"],
          ['Session vs Global status compare', "SHOW SESSION STATUS LIKE 'Questions';"],
          ['Top statement digests', 'SELECT SCHEMA_NAME, LEFT(DIGEST_TEXT, 90) AS query_pattern, COUNT_STAR AS calls, ROUND(AVG_TIMER_WAIT/1000000000, 2) AS avg_ms, SUM_ROWS_EXAMINED AS rows_scanned FROM performance_schema.events_statements_summary_by_digest WHERE SCHEMA_NAME IS NOT NULL ORDER BY SUM_TIMER_WAIT DESC LIMIT 10;']
        ],
        expected: 'Shows live client sessions (Id, User, DB, Command, Time, State, Info), counters, and normalized SQL digests.',
        question: 'When an emergency runaway SELECT locks up CPU, how does KILL QUERY <id> differ from KILL <id>?',
        answer: 'KILL QUERY <thread_id> cancels only the currently executing SQL statement while keeping the connection open; KILL <thread_id> closes the entire connection and rolls back any active transaction.',
        notes: 'Also contrast SHOW PROCESSLIST (truncates Info at 100 chars) vs SHOW FULL PROCESSLIST, and SHOW STATUS (session) vs SHOW GLOBAL STATUS.'
      },
      {
        id: 'u4-enterprise-monitor',
        title: 'MariaDB Enterprise Monitor: concepts & architecture.',
        lead: 'MariaDB Enterprise Monitor is MariaDB’s commercial observability platform built atop the exact metrics exposed by MariaDB Server.',
        type: 'cards',
        cards: [
          ['What it collects', 'Polls SHOW GLOBAL STATUS, PERFORMANCE_SCHEMA, InnoDB metrics, OS CPU/disk/memory, and replication lag over time.'],
          ['Query Analyzer & Advisors', 'Ranks expensive SQL digests, detects unindexed scans, and raises automated alerts on connection/lock thresholds.'],
          ['Classroom Equivalent', 'Because Enterprise Monitor requires a commercial license, the next step provides a live built-in Activity Monitor reading real MariaDB telemetry directly.']
        ],
        question: 'Why are historical trend graphs in an Enterprise Monitor better than running SHOW GLOBAL STATUS once?',
        answer: 'Counters are cumulative since startup; graphs reveal sudden spikes, memory leaks, or 2 AM batch bottlenecks over time.',
        notes: 'Explain Enterprise Monitor architecture accurately, then open the live telemetry dashboard on the next step.'
      },
      {
        id: 'u4-monitor-live',
        title: 'Live MariaDB Activity Monitor.',
        lead: 'Watch live connections, buffer pool hit ratio, InnoDB transactions, active locks, top slow digests, and per-DB storage footprint in real time.',
        type: 'monitor-lab',
        question: 'Which panels immediately highlight if a transaction is blocked on a lock or if one query pattern scans excessive rows?',
        answer: 'Active InnoDB Transactions (INNODB_TRX) + Active InnoDB Locks expose open transactions/waits, while Top Statement Digests flags high rows_examined.',
        notes: 'Enable Auto-refresh (2s) and press S to run queries in SQL Studio (or query via DBeaver / another tab) to watch counters and digests move live!'
      },
      {
        id: 'u4-monitor-check',
        title: 'Checkpoint: interpreting server activity.',
        lead: 'Threads_running jumps from 2 to 48 and queries begin timing out.',
        type: 'quiz',
        options: [
          'Check SHOW FULL PROCESSLIST, INNODB_TRX, and top statement digests to identify lock blockers or unindexed scans',
          'Raise max_connections to 5000 immediately without inspecting queries',
          'Turn ON general_log in production to log every SELECT'
        ],
        correct: 0,
        feedback: 'Threads_running spikes point to lock contention or CPU/I/O saturation; raising max_connections or enabling general_log only worsens contention.',
        question: 'Student task: what does a high SUM_ROWS_EXAMINED compared to SUM_ROWS_SENT tell a DBA?',
        answer: 'MariaDB is reading thousands of rows to return only a few—indicating a missing index or unselective predicate.',
        notes: 'Next up: MariaDB Audit plugin configuration.'
      }
    ]
  },
  {
    id: 'u4-audit', unit: 'u4', number: '4.3', title: 'Configure MariaDB Enterprise Audit', minutes: 60,
    objective: 'Configure the MariaDB Audit plugin (server_audit), filter audited events, and inspect real audit log trails.',
    steps: [
      {
        id: 'u4-audit-concepts',
        title: 'MariaDB Enterprise Audit vs Community server_audit.',
        lead: 'Auditing creates a tamper-evident accountability trail of who accessed or attempted to access sensitive tables.',
        type: 'comparison',
        columns: ['Capability', 'Community server_audit (in this lab)', 'MariaDB Enterprise Audit additions'],
        rows: [
          ['Tracked events', 'CONNECT, QUERY, TABLE, QUERY_DDL, QUERY_DML, QUERY_DCL', 'Adds finer per-table/per-user JSON rules & masking filters'],
          ['Output destinations', 'Dedicated rotated audit.log file or syslog', 'File, syslog, and direct SIEM/Enterprise log pipelines'],
          ['Live variables', 'server_audit_logging, server_audit_events, incl/excl users', 'Full dynamic rule reloads without server restart'],
          ['Failed access capture', 'Logs rejected queries (Error 1142) and failed logins (1045)', 'Same core forensics + compliance report templates']
        ],
        question: 'Why do security auditors require Audit Logging even when general_log exists?',
        answer: 'Audit logs capture failed logins and denied permissions with user/host/retcode attribution, support strict event filtering (e.g. DDL + CONNECT only), and rotate automatically.',
        notes: 'Explain clearly that MariaDB 11.4 Community ships server_audit.so so students configure real audit logging hands-on.'
      },
      {
        id: 'u4-audit-live',
        title: 'Configure and inspect the Audit Plugin live.',
        lead: 'Turn server_audit_logging ON, choose audited event categories from the selector, press S to run a query in SQL Studio, and read /var/log/mysql/audit.log.',
        type: 'log-lab',
        defaultTab: 'audit',
        question: 'Enable audit logging, open SQL Studio (S) to run a SELECT or DDL statement, refresh Audit Log, and inspect the trailing integer on each line. What does it mean?',
        answer: 'The trailing integer is the MariaDB return code: 0 means the statement succeeded; 1142 or 1045 proves an unauthorized access attempt was blocked!',
        notes: 'Demonstrate changing the Events dropdown (e.g. CONNECT, DDL, DCL vs CONNECT, QUERY, TABLE), enabling server_audit_logging, and refreshing Audit Log.'
      },
      {
        id: 'u4-audit-check',
        title: 'Checkpoint: low-noise auditing.',
        lead: 'A compliance officer only wants to audit logins, privilege changes (DCL), and schema changes (DDL) without recording every SELECT.',
        type: 'quiz',
        options: [
          'Set server_audit_events = CONNECT,QUERY_DDL,QUERY_DCL',
          'Turn on general_log = ON forever',
          'Set server_audit_events = QUERY'
        ],
        correct: 0,
        feedback: 'Filtering server_audit_events to CONNECT, QUERY_DDL, and QUERY_DCL keeps logs compact while capturing every login, schema change, and GRANT/REVOKE.',
        question: "Student task: press S to open SQL Studio and inspect live audit variables using SHOW GLOBAL VARIABLES LIKE 'server_audit%';.",
        answer: "SHOW GLOBAL VARIABLES LIKE 'server_audit%';",
        notes: 'Remind students to use ⌘K -> Reset Unit 4 labs (or toggle audit OFF) afterwards if they want minimal log growth.'
      }
    ]
  },
  {
    id: 'u4-perf-capacity', unit: 'u4', number: '4.4', title: 'Performance, DB growth & capacity planning', minutes: 90,
    objective: 'Measure index impact with EXPLAIN on 25,000 rows, monitor database growth, and plan storage capacity.',
    steps: [
      {
        id: 'u4-explain-before',
        title: 'Measure an unindexed full table scan with EXPLAIN.',
        lead: 'perf_lab.activity_events holds 25,000 rows with no secondary index on student_id yet. Run EXPLAIN before creating an index.',
        type: 'query',
        persona: 'dba_lab',
        database: 'perf_lab',
        resetKind: 'unit4-perf',
        sql: 'EXPLAIN SELECT id, event_type, duration_ms FROM activity_events WHERE student_id = 42;',
        presets: [
          ['1. EXPLAIN query plan', 'EXPLAIN SELECT id, event_type, duration_ms FROM activity_events WHERE student_id = 42;'],
          ['2. Run actual query', 'SELECT id, event_type, duration_ms FROM activity_events WHERE student_id = 42 ORDER BY id LIMIT 10;'],
          ['3. Check current indexes', 'SHOW INDEX FROM activity_events;']
        ],
        expected: 'EXPLAIN reports type = ALL, possible_keys = NULL, key = NULL, and rows ≈ 25,000 (full table scan)!',
        question: 'Notice there are only 50 rows for student 42, yet MariaDB estimates ~25,000 rows examined. Why?',
        answer: 'With only the PRIMARY KEY on id, MariaDB must scan every clustered-index page from row 1 to row 25,000 to check student_id.',
        notes: 'Click "Reset Indexes" in SQL Studio if secondary indexes already exist from an earlier class before running EXPLAIN.'
      },
      {
        id: 'u4-create-index-after',
        title: 'Add a B+Tree index and watch EXPLAIN transform.',
        lead: 'Create idx_activity_student on activity_events(student_id), then click Inspect in SQL Studio to compare the new EXPLAIN plan!',
        type: 'query',
        persona: 'dba_lab',
        database: 'perf_lab',
        resetKind: 'unit4-perf',
        sql: 'CREATE INDEX IF NOT EXISTS idx_activity_student ON activity_events(student_id);',
        inspectSql: 'EXPLAIN SELECT id, event_type, duration_ms FROM activity_events WHERE student_id = 42;',
        presets: [
          ['1. Create index on student_id', 'CREATE INDEX IF NOT EXISTS idx_activity_student ON activity_events(student_id);'],
          ['2. Inspect EXPLAIN plan', 'EXPLAIN SELECT id, event_type, duration_ms FROM activity_events WHERE student_id = 42;'],
          ['3. Covering index (Using index)', 'CREATE INDEX IF NOT EXISTS idx_activity_covering ON activity_events(student_id, event_type, duration_ms);'],
          ['4. Drop custom indexes', 'DROP INDEX IF EXISTS idx_activity_student ON activity_events;']
        ],
        expected: 'EXPLAIN flips from type = ALL (~25,000 rows) to type = ref, key = idx_activity_student, rows = 50! Adding idx_activity_covering satisfies the query straight from the index (Extra: Using index).',
        question: 'Why did the SQL SELECT statement itself not have to change at all when we added the index?',
        answer: 'That is Physical Data Independence (from Unit 1.6!): the Conceptual–Internal mapping changed transparently inside the optimizer.',
        notes: 'Run CREATE INDEX, then immediately press Inspect to show type=ref and rows=50; try Preset 3 then Inspect to show Extra = Using index (covering index), then use Reset Indexes.'
      },
      {
        id: 'u4-growth-query',
        title: 'Monitor database growth and table sizes.',
        lead: 'Track DATA_LENGTH, INDEX_LENGTH, and fragmented free space (DATA_FREE) across every database.',
        type: 'query',
        persona: 'dba_lab',
        database: 'information_schema',
        sql: "SELECT TABLE_SCHEMA AS db_name, TABLE_NAME, ENGINE, TABLE_ROWS,\n ROUND(DATA_LENGTH / 1024, 1) AS data_kb,\n ROUND(INDEX_LENGTH / 1024, 1) AS index_kb,\n ROUND(DATA_FREE / 1024, 1) AS free_kb\nFROM information_schema.TABLES\nWHERE TABLE_SCHEMA IN ('college_demo','sql_lab','security_lab','perf_lab','ops_lab','backup_lab')\nORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC;",
        presets: [
          ['1. Per-table footprint (KB)', "SELECT TABLE_SCHEMA AS db_name, TABLE_NAME, ENGINE, TABLE_ROWS, ROUND(DATA_LENGTH / 1024, 1) AS data_kb, ROUND(INDEX_LENGTH / 1024, 1) AS index_kb, ROUND(DATA_FREE / 1024, 1) AS free_kb FROM information_schema.TABLES WHERE TABLE_SCHEMA IN ('college_demo','sql_lab','security_lab','perf_lab','ops_lab','backup_lab') ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC;"],
          ['2. Per-database summary (MB)', "SELECT TABLE_SCHEMA AS db_name, COUNT(*) AS tables, SUM(TABLE_ROWS) AS approx_rows, ROUND(SUM(DATA_LENGTH + INDEX_LENGTH)/1024/1024, 3) AS total_mb FROM information_schema.TABLES WHERE TABLE_SCHEMA IN ('college_demo','sql_lab','security_lab','perf_lab','ops_lab','backup_lab') GROUP BY TABLE_SCHEMA ORDER BY total_mb DESC;"],
          ['3. Refresh stats (ANALYZE TABLE)', 'ANALYZE TABLE perf_lab.activity_events;'],
          ['4. Verify integrity (CHECK TABLE)', 'CHECK TABLE perf_lab.activity_events;']
        ],
        expected: 'Shows perf_lab.activity_events at the top with exact data_kb and index_kb (watch index_kb jump after creating indexes!).',
        question: 'Notice how adding secondary indexes visibly increases index_kb. What does that mean for capacity planning?',
        answer: 'Indexes accelerate reads at the cost of extra disk space, extra RAM in the Buffer Pool, and slightly slower INSERT/UPDATE/DELETE maintenance.',
        notes: 'Compare index_kb before and after adding indexes in the previous step; demo ANALYZE TABLE vs CHECK TABLE.'
      },
      {
        id: 'u4-capacity-planning',
        title: 'Capacity planning & routine table maintenance.',
        lead: 'Plan storage months ahead by accounting for row growth, indexes, binary logs, backups, and temp space.',
        type: 'comparison',
        columns: ['Capacity Factor', 'What to measure', 'Maintenance / Action'],
        rows: [
          ['Data + Index growth', 'Daily net rows × avg row size × (1 + index ratio)', 'Archive old events; avoid redundant unused indexes'],
          ['Binary logs & Retention', 'Write volume per day × binlog_expire_logs_seconds', 'Tune binlog expiration (e.g. 7 days) so logs never fill /var/log'],
          ['Backup storage', 'Full + incremental retention window (local + offsite)', 'Verify compression and prune expired snapshots cleanly'],
          ['Fragmentation & Stats', 'High DATA_FREE after massive DELETEs', 'Run ANALYZE TABLE for optimizer stats; OPTIMIZE TABLE during maintenance windows'],
          ['Headroom margin', 'Temp tables for sorting + InnoDB online DDL copy space', 'Alert at 75–80% disk usage; keep ≥25% free headroom']
        ],
        question: 'Why does ALTER TABLE or OPTIMIZE TABLE require extra free disk headroom even if row count stays constant?',
        answer: 'Table rebuilds and certain online operations temporarily write a shadow copy alongside the existing .ibd file before swapping.',
        notes: 'Keep maintenance commands clear: CHECK TABLE verifies integrity, ANALYZE updates cardinality, OPTIMIZE defragments.'
      },
      {
        id: 'u4-perf-check',
        title: 'Checkpoint: diagnose slow growth and full scans.',
        lead: 'A reporting table grew to 10 million rows and queries filtering by department_id slowed from 5ms to 4 seconds.',
        type: 'quiz',
        options: [
          'Run EXPLAIN to confirm a full table scan (ALL), add an index on department_id, and check storage headroom',
          'Run OPTIMIZE TABLE without checking EXPLAIN first',
          'Set sort_buffer_size = 512M globally for every connection'
        ],
        correct: 0,
        feedback: 'Verify the execution plan with EXPLAIN first, add the targeted index, and monitor index/disk growth rather than bloating per-connection buffers.',
        question: 'Student task: check perf_lab.activity_events index size right now via information_schema.TABLES.',
        answer: "SELECT TABLE_NAME, DATA_LENGTH, INDEX_LENGTH FROM information_schema.TABLES WHERE TABLE_SCHEMA='perf_lab' AND TABLE_NAME='activity_events';",
        notes: 'Next section tackles live locked resources and deadlocks using two concurrent persistent connections.'
      }
    ]
  },
  {
    id: 'u4-locks', unit: 'u4', number: '4.5', title: 'Troubleshoot locked resources & deadlocks', minutes: 105,
    objective: 'Reproduce real InnoDB lock waits and deadlocks across two sessions, diagnose blockers, and recover cleanly.',
    steps: [
      {
        id: 'u4-lock-diagram',
        title: 'Understanding Lock Waits vs Deadlocks.',
        lead: 'Click both panels to see why Session B merely waits in Scenario 1, while Scenario 2 forces an immediate Error 1213 rollback.',
        type: 'diagram',
        diagram: 'lock-contention',
        question: 'Why does InnoDB auto-resolve a deadlock immediately instead of waiting for the 15-second lock timeout?',
        answer: 'Because a circular wait can NEVER unblock on its own—waiting would stall both transactions forever, so InnoDB picks the smaller transaction as victim.',
        notes: 'Prepare students mentally for the live dual-session console coming on the very next step.'
      },
      {
        id: 'u4-dual-session-lab',
        title: 'Live Dual-Session Locking & Deadlock Lab.',
        lead: 'Execute SQL concurrently on two independent MariaDB connections (Session A and Session B) against ops_lab.accounts, and inspect active locks in real time!',
        type: 'dual-session',
        question: 'Follow the guided Lock Wait sequence first: hold Row 1 in Session A, request Row 1 in Session B, click Inspect INNODB_TRX & INNODB_LOCKS while B is waiting, then COMMIT Session A.',
        answer: 'While Session B waits, INNODB_TRX shows Session A RUNNING and Session B in LOCK WAIT, and INNODB_LOCKS shows GRANTED vs WAITING on PRIMARY row 1. Running COMMIT in Session A wakes Session B (or in an emergency, DBA runs KILL <blocking_thread_id>).',
        notes: 'Teach: 1) Linear Lock Wait, 2) Deadlock (1213), and 3) also explain Metadata Locks ("Waiting for table metadata lock" when DDL runs behind an open transaction) + emergency KILL <trx_mysql_thread_id>. Use Reset Locks Lab between demos.'
      },
      {
        id: 'u4-locks-check',
        title: 'Checkpoint: preventing application deadlocks.',
        lead: 'Two background jobs both transfer funds between accounts A and B and occasionally hit Error 1213 deadlocks.',
        type: 'quiz',
        options: [
          'Always acquire row locks in a consistent canonical order (e.g. lowest account id first) and keep transactions short',
          'Set innodb_lock_wait_timeout = 10000',
          'Disable transactions completely'
        ],
        correct: 0,
        feedback: 'Consistent lock ordering breaks circular wait cycles, and short transactions reduce lock hold duration.',
        question: 'Student task: what should application code still do if a rare Error 1213 deadlock ever happens?',
        answer: 'Catch Error 1213 and safely retry the entire transaction from START TRANSACTION.',
        notes: 'Reiterate that short transactions + proper indexes (so InnoDB locks fewer rows) are the top two anti-lock practices.'
      }
    ]
  },
  {
    id: 'u4-backups', unit: 'u4', number: '4.6', title: 'Backups, recovery & backup types', minutes: 120,
    objective: 'Distinguish backup strategies (logical vs physical, full vs incremental/differential, hot vs cold) and perform live backup/restore.',
    steps: [
      {
        id: 'u4-backup-types',
        title: 'Distinguish between the different types of backup.',
        lead: 'Every backup strategy balances backup speed, restore speed, downtime tolerance, and point-in-time precision.',
        type: 'comparison',
        columns: ['Backup Dimension', 'Option A', 'Option B / C'],
        rows: [
          ['Representation', 'Logical (mariadb-dump): portable SQL text statements (CREATE + INSERT)', 'Physical (mariadb-backup): raw .ibd page copies + redo logs (much faster on large DBs)'],
          ['Scope over time', 'Full: complete standalone copy of all selected data', 'Incremental (changes since last backup) vs Differential (changes since last Full)'],
          ['Availability', 'Hot / Online (--single-transaction): server stays live via MVCC snapshot', 'Cold / Offline: server stopped so files are quiescent (zero traffic)'],
          ['Granularity', 'Schema-only (--no-data) or Data-only (--no-create-info)', 'Point-in-Time Recovery (PITR): Full Backup + Binary Log replay (mariadb-binlog)']
        ],
        question: 'Why does mariadb-dump --single-transaction give a consistent InnoDB snapshot without locking readers/writers?',
        answer: 'It opens a REPEATABLE READ transaction at the start, using InnoDB MVCC undo logs to read a consistent point-in-time snapshot even while live traffic runs.',
        notes: 'Cover all four dimensions explicitly for MSCNS406 exam readiness: Logical/Physical, Full/Incremental/Differential, Hot/Cold, and PITR.'
      },
      {
        id: 'u4-backup-live',
        title: 'Live Backup, Simulated Loss & Recovery Lab.',
        lead: 'Take a real mariadb-dump backup of backup_lab.fee_ledger, drop the table to simulate accidental disaster, restore from your backup, and inspect binary log events.',
        type: 'backup-lab',
        question: 'Walk through all 4 steps: 1) Take Full Backup, 2) Simulate Disaster (DROP TABLE), 3) Restore Selected Backup, 4) Inspect Binary Log events.',
        answer: 'mariadb-dump exports reproducible CREATE TABLE + INSERT SQL statements; restoring pipes them back into mariadb to recover all 8 fee receipts, while mariadb-binlog captures incremental transactions after the dump.',
        notes: 'Also click Schema-Only Backup (--no-data) vs Data-Only (--no-create-info) and inspect the preview SQL so students visually see the difference.'
      },
      {
        id: 'u4-backup-check',
        title: 'Checkpoint: recovering from an accidental DROP TABLE at 14:05.',
        lead: 'Your last nightly Full Backup ran at 02:00 AM, and binary logging is enabled.',
        type: 'quiz',
        options: [
          'Restore the 02:00 AM Full Backup, then replay binary logs up to 14:04:59 (Point-in-Time Recovery)',
          'Restore only the 02:00 AM backup and accept 12 hours of lost fees',
          'Re-run CREATE TABLE manually and leave it empty'
        ],
        correct: 0,
        feedback: 'Point-in-Time Recovery (Full backup + mariadb-binlog --stop-datetime) recovers transactions right up to the moment before the mistake.',
        question: 'Student task: why would a 500 GB production database prefer physical mariadb-backup over logical mariadb-dump?',
        answer: 'Physical page copies restore much faster than re-parsing and re-indexing 500 GB of SQL INSERT statements.',
        notes: 'Finish with Section 4.7 Capstone DBA Verification Challenge.'
      }
    ]
  },
  {
    id: 'u4-capstone', unit: 'u4', number: '4.7', title: 'Final DBA capacity & course capstone', minutes: 60,
    objective: 'Synthesize aggregation, Data Dictionary auditing, and storage capacity planning across all classroom databases.',
    steps: [
      {
        id: 'u4-capstone-incident',
        title: 'Capstone DBA capacity audit challenge.',
        lead: 'Audit table count and total data + index storage bytes across all 6 classroom lab schemas (backup_lab, college_demo, ops_lab, perf_lab, security_lab, sql_lab) in one Data Dictionary query.',
        type: 'challenge',
        database: 'information_schema',
        persona: 'dba_lab',
        hints: [
          'Query information_schema.TABLES grouping by TABLE_SCHEMA for college_demo, sql_lab, security_lab, perf_lab, ops_lab, backup_lab.',
          'Order by TABLE_SCHEMA ASC and compute COUNT(*) AS tables_count and SUM(DATA_LENGTH + INDEX_LENGTH) AS total_bytes.'
        ],
        check: {
          kind: 'query-match',
          database: 'information_schema',
          persona: 'dba_lab',
          orderMatters: true,
          expectedSql: "SELECT TABLE_SCHEMA, COUNT(*) AS tables_count, SUM(DATA_LENGTH + INDEX_LENGTH) AS total_bytes FROM information_schema.TABLES WHERE TABLE_SCHEMA IN ('backup_lab','college_demo','ops_lab','perf_lab','security_lab','sql_lab') GROUP BY TABLE_SCHEMA ORDER BY TABLE_SCHEMA ASC;"
        },
        question: 'Write a capacity audit query returning TABLE_SCHEMA, tables_count, and total_bytes for all 6 lab databases ordered alphabetically by TABLE_SCHEMA.',
        answer: "SELECT TABLE_SCHEMA, COUNT(*) AS tables_count,\n       SUM(DATA_LENGTH + INDEX_LENGTH) AS total_bytes\nFROM information_schema.TABLES\nWHERE TABLE_SCHEMA IN ('backup_lab','college_demo','ops_lab','perf_lab','security_lab','sql_lab')\nGROUP BY TABLE_SCHEMA\nORDER BY TABLE_SCHEMA ASC;",
        notes: 'Final MSCNS406 capstone combining Unit 2 GROUP BY, Unit 3 Data Dictionary, and Unit 4 storage capacity monitoring. Switch to Student Mode anytime for self-paced exam practice.'
      }
    ]
  }
);

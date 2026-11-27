/* Unit 3: MariaDB Concepts, Security & Authentication (MSCNS406). */
COURSE.sections.push(
  {
    id: 'u3-mariadb-ops', unit: 'u3', number: '3.1', title: 'MariaDB operations & client connections', minutes: 90,
    objective: 'Run full database/table lifecycle operations in a persistent session and explain client connection configuration.',
    steps: [
      {
        id: 'u3-db-crud',
        title: 'Full database & table lifecycle in MariaDB.',
        lead: 'Practice creating a database, selecting it with USE, listing databases/tables, creating/altering/querying/deleting rows, and dropping cleanly—inside one persistent connection.',
        type: 'query',
        persistent: true,
        sessionSlot: 'unit3',
        persona: 'dba_lab',
        database: 'security_lab',
        resetKind: 'unit3',
        sql: 'SHOW DATABASES;',
        explain: {
          syntax: 'CREATE DATABASE db;  USE db;  SHOW TABLES;\nCREATE/ALTER/DROP TABLE ...;  DROP DATABASE db;',
          parts: [
            ['SHOW DATABASES / SHOW TABLES', 'Lists available schemas on the server, or tables inside the currently active database.'],
            ['CREATE DATABASE / USE db', 'Creates a new schema container and switches this persistent session’s active context to it.'],
            ['CREATE / INSERT / ALTER / SELECT / DELETE', 'Builds demo_items, populates rows, adds a column, reads rows, and removes a row inside demo_scratch.'],
            ['DROP TABLE / DROP DATABASE', 'Permanently removes the table and then the entire demo_scratch schema container.']
          ]
        },
        presets: [
          ['1. List databases', 'SHOW DATABASES;'],
          ['2. Create database', 'CREATE DATABASE IF NOT EXISTS demo_scratch;'],
          ['3. Select database (USE)', 'USE demo_scratch;'],
          ['4. Create table', 'CREATE TABLE IF NOT EXISTS demo_items (id INT PRIMARY KEY AUTO_INCREMENT, label VARCHAR(80) NOT NULL, qty INT DEFAULT 1);'],
          ['5. List table names', 'SHOW TABLES;'],
          ['6. Insert data', "INSERT INTO demo_items (label, qty) VALUES ('TLS Cert', 2), ('Audit Rule', 5);"],
          ['7. Alter table', 'ALTER TABLE demo_items ADD COLUMN active TINYINT(1) NOT NULL DEFAULT 1;'],
          ['8. Query rows', 'SELECT * FROM demo_items ORDER BY id;'],
          ['9. Delete row', 'DELETE FROM demo_items WHERE id = 1;'],
          ['10. Drop table', 'DROP TABLE IF EXISTS demo_items;'],
          ['11. Drop database', 'DROP DATABASE IF EXISTS demo_scratch;']
        ],
        expected: 'Demonstrates every core MariaDB CRUD operation in sequence while USE demo_scratch persists across queries.',
        question: 'Why did USE demo_scratch persist into step 4 here, unlike Units 1 and 2?',
        answer: 'SQL Studio uses a persistent named connection (unit3), just like the mariadb CLI client, rather than opening a fresh connection per statement.',
        notes: 'Walk through presets 1–11 cleanly; notice the Session ID pill stays constant across requests. Reset Unit 3 removes demo_scratch if stopped mid-way.'
      },
      {
        id: 'u3-client-config',
        title: 'Configuring client connections to MariaDB.',
        lead: 'Clients connect over TCP/IP sockets or local Unix domain sockets using host, port, credentials, option files, and TLS.',
        type: 'comparison',
        columns: ['Setting / File', 'Example Value & CLI Usage', 'Why it matters'],
        rows: [
          ['CLI TCP + TLS connect', 'mariadb -h 127.0.0.1 -P 3307 -u dba_lab -p --ssl-ca=dbms-classroom-ca.pem', 'Direct encrypted client connection from Windows/Linux/macOS'],
          ['port / bind-address', '3306 container (127.0.0.1:3307 host); bind-address=127.0.0.1 in my.cnf', 'Restricting bind-address prevents direct public Internet exposure'],
          ['socket', '/run/mysqld/mysqld.sock (Linux/macOS local IPC)', 'Fast local IPC matching @localhost without TCP overhead'],
          ['max_connections', '151 default in classroom MariaDB (configurable in my.cnf)', 'Prevents RAM exhaustion from runaway application pools'],
          ['[client] option file', '~/.my.cnf with [client] host/user/password & chmod 600', 'Avoids leaking plaintext -p passwords in shell history or ps aux']
        ],
        question: 'Why is passing -pMyPassword directly on a Linux command line unsafe?',
        answer: 'Other local users running ps aux can read command-line arguments. Use interactive -p or protected ~/.my.cnf option files (chmod 600).',
        notes: 'Point out that students can open the DBeaver button (or ⌘K -> Connect DBeaver) to copy 127.0.0.1:3307 credentials and download dbms-classroom-ca.pem.'
      },
      {
        id: 'u3-connection-inspect',
        title: 'Inspect your live connection identity and server configuration.',
        lead: 'Query how MariaDB sees your current client connection and global networking limits.',
        type: 'query',
        persona: 'dba_lab',
        database: 'college_demo',
        sql: 'SELECT USER() AS client_sent, CURRENT_USER() AS matched_account, CONNECTION_ID() AS conn_id, DATABASE() AS active_db, @@port AS server_port, @@bind_address AS bind_addr, @@max_connections AS max_conns;',
        explain: {
          syntax: 'SELECT USER(), CURRENT_USER(), CONNECTION_ID(), DATABASE(), @@variable;\nSHOW GLOBAL STATUS / VARIABLES WHERE ...;',
          parts: [
            ['USER() vs CURRENT_USER()', 'USER() reports the username + client host you sent; CURRENT_USER() reports the mysql.user rule MariaDB matched to authorize you.'],
            ['@@port / @@bind_address / @@max_connections', 'The @@ prefix reads live system variables directly inside a SELECT expression.'],
            ['SHOW GLOBAL STATUS / VARIABLES', 'Inspects live connection thread counters (Threads_connected, Aborted_connects) and socket timeout limits.']
          ]
        },
        presets: [
          ['Connection & identity', 'SELECT USER() AS client_sent, CURRENT_USER() AS matched_account, CONNECTION_ID() AS conn_id, DATABASE() AS active_db, @@port AS server_port, @@bind_address AS bind_addr, @@max_connections AS max_conns;'],
          ['Thread counters', "SHOW GLOBAL STATUS WHERE Variable_name IN ('Threads_connected','Threads_running','Max_used_connections','Aborted_connects');"],
          ['Timeout variables', "SHOW GLOBAL VARIABLES WHERE Variable_name IN ('wait_timeout','interactive_timeout','connect_timeout','net_read_timeout');"]
        ],
        expected: 'Displays matched account (dba_lab@%), port 3306, NULL bind_addr (meaning all container interfaces), and thread counters.',
        question: 'What causes Aborted_connects to climb on an exposed database server?',
        answer: 'Failed authentication attempts, malformed handshakes, TLS rejections, or network probes failing before login completes.',
        notes: 'Point out the difference between USER() (your username + client IP) and CURRENT_USER() (the matching user@host grant row), and why bind_address is NULL inside Docker bridge networking.'
      },
      {
        id: 'u3-ops-check',
        title: 'Checkpoint: USER() vs CURRENT_USER().',
        lead: 'You connect from container 172.18.0.4 as dba_lab and match the grant entry dba_lab@%.',
        type: 'quiz',
        options: [
          'Both USER() and CURRENT_USER() return dba_lab@%',
          'USER() returns dba_lab@172.18.0.4 while CURRENT_USER() returns dba_lab@%',
          'CURRENT_USER() returns root@localhost'
        ],
        correct: 1,
        feedback: 'USER() shows where the connection actually came from; CURRENT_USER() shows which mysql.user entry authorized it.',
        question: 'Student task: why does host-specific matching matter when debugging "Access denied" errors?',
        answer: 'MariaDB may match an existing @localhost or anonymous row before a wildcard @% row, so CURRENT_USER() reveals which rule actually fired.',
        notes: 'Recap Section 3.1 before inspecting how MariaDB and InnoDB physically store data.'
      }
    ]
  },
  {
    id: 'u3-storage-innodb', unit: 'u3', number: '3.2', title: 'MariaDB storage & InnoDB internals', minutes: 90,
    objective: 'Compare storage engines and explain how MariaDB/InnoDB organize tablespaces, pages, redo logs, and undo logs.',
    steps: [
      {
        id: 'u3-engines',
        title: 'Pluggable storage engines in MariaDB.',
        lead: 'MariaDB separates the SQL parser/optimizer layer from pluggable storage engines. Inspect active engines.',
        type: 'query',
        persona: 'dba_lab',
        database: 'college_demo',
        sql: 'SHOW ENGINES;',
        explain: {
          syntax: 'SHOW ENGINES;',
          parts: [
            ['SHOW ENGINES', 'Lists every storage engine compiled or loaded in MariaDB along with its support status.'],
            ['Support / Transactions / Savepoints', 'Identifies which engine is DEFAULT (InnoDB) and whether each engine supports ACID transactions and savepoints.']
          ]
        },
        expected: 'InnoDB is DEFAULT with Transactions=YES, XA=YES, Savepoints=YES; Aria, MEMORY, and CSV serve specialized roles.',
        question: 'Why does InnoDB serve as the default engine instead of MEMORY or MyISAM/Aria?',
        answer: 'InnoDB supports full ACID transactions, row-level locking, foreign key enforcement, MVCC snapshots, and crash recovery via redo/undo logs.',
        notes: 'Explain when Aria (crash-safe internal temp tables) or MEMORY (transient fast lookup) appear in SHOW ENGINES.'
      },
      {
        id: 'u3-innodb-diagram',
        title: 'How InnoDB stores data, indexes, and logs.',
        lead: 'Click each component in memory and on disk to trace how InnoDB reads pages and guarantees crash safety.',
        type: 'diagram',
        diagram: 'innodb-storage',
        question: 'Why does InnoDB update pages in the Buffer Pool and write sequentially to Redo Logs instead of flushing random 16 KB pages on every INSERT?',
        answer: 'Sequential writes to the redo log are vastly faster than random 16 KB data-file I/O, while still guaranteeing committed transactions survive power loss (WAL).',
        notes: 'Highlight the distinction between Redo Logs (roll-forward durability after crash) and Undo Logs (ROLLBACK and MVCC snapshots).'
      },
      {
        id: 'u3-storage-explorer',
        title: 'Inspect real MariaDB storage files on disk.',
        lead: 'Read the live /var/lib/mysql directory inside the Docker volume alongside INFORMATION_SCHEMA table metrics.',
        type: 'storage-lab',
        question: 'Why does every InnoDB table have its own .ibd file, alongside .frm and db.opt files per schema directory?',
        answer: 'innodb_file_per_table=ON puts each table’s clustered B+Tree + indexes into its own .ibd tablespace so drops/optimizes reclaim OS disk space; .frm holds table structure and db.opt holds database charset defaults.',
        notes: 'Click Refresh storage inspection and compare perf_lab/activity_events.ibd (25,000 rows) against college_demo/students.ibd (5 rows).'
      },
      {
        id: 'u3-innodb-vars',
        title: 'Inspect InnoDB page, doublewrite, and log parameters.',
        lead: 'Examine live InnoDB configuration variables controlling 16 KB pages, doublewrite safety, redo logs, and durability.',
        type: 'query',
        persona: 'dba_lab',
        database: 'information_schema',
        sql: "SHOW GLOBAL VARIABLES WHERE Variable_name IN ('datadir','innodb_file_per_table','innodb_page_size','innodb_data_file_path','innodb_doublewrite','innodb_log_file_size','innodb_flush_log_at_trx_commit');",
        explain: {
          syntax: "SHOW GLOBAL VARIABLES WHERE Variable_name IN ('var1', 'var2', ...);",
          parts: [
            ['SHOW GLOBAL VARIABLES', 'Reads active server-wide InnoDB configuration parameters currently loaded from classroom.cnf / defaults.'],
            ['innodb_file_per_table & innodb_page_size', 'Controls whether each table gets its own .ibd file and confirms the 16 KB (16384 byte) B+Tree page size.'],
            ['innodb_doublewrite & flush_log_at_trx_commit', 'Verifies torn-page crash protection and whether every COMMIT fsyncs the redo log immediately (1 = full ACID).']
          ]
        },
        expected: 'Shows /var/lib/mysql/, innodb_file_per_table=ON, innodb_page_size=16384 (16 KB), doublewrite=ON, redo log file size, and flush_log_at_trx_commit=1.',
        question: 'What trade-off happens if someone changes innodb_flush_log_at_trx_commit from 1 to 2 or 0?',
        answer: '1 flushes and fsyncs redo log on every COMMIT (full ACID durability); 0/2 improve throughput slightly at the risk of losing up to ~1 second of commits in an OS crash.',
        notes: 'Point out innodb_doublewrite=ON prevents torn 16 KB page writes during crashes.'
      },
      {
        id: 'u3-storage-check',
        title: 'Checkpoint: Redo Log vs Undo Log.',
        lead: 'A long-running transaction updates 500 rows and then calls ROLLBACK.',
        type: 'quiz',
        options: [
          'InnoDB uses the Undo Log to restore the previous row versions',
          'InnoDB deletes the .ibd file and restores from backup',
          'InnoDB replays the slow query log backwards'
        ],
        correct: 0,
        feedback: 'Undo logs hold before-images for ROLLBACK and MVCC; Redo logs replay committed changes after a crash.',
        question: 'Student task: explain why innodb_file_per_table=ON helps capacity management.',
        answer: 'Dropping or optimizing a large table immediately returns .ibd disk space to the OS rather than leaving unused free space trapped inside ibdata1.',
        notes: 'Recap Section 3.2 before tuning memory buffers and inspecting the Data Dictionary.'
      }
    ]
  },
  {
    id: 'u3-buffers-dd', unit: 'u3', number: '3.3', title: 'Buffers, caches & the Data Dictionary', minutes: 90,
    objective: 'Configure and measure InnoDB buffers/caches and query INFORMATION_SCHEMA, mysql, and PERFORMANCE_SCHEMA metadata.',
    steps: [
      {
        id: 'u3-buffers-caches',
        title: 'Configure buffers and caches wisely.',
        lead: 'Distinguish global shared buffers from per-connection buffers—and know dynamic SET GLOBAL vs persistent my.cnf tuning.',
        type: 'comparison',
        columns: ['Buffer / Cache', 'Scope & Persistence', 'Classroom Value & Tuning Role'],
        rows: [
          ['innodb_buffer_pool_size', 'Global (dynamic + [mariadb] my.cnf)', '128 MB here (50–70% RAM in production); caches hot data & index pages'],
          ['innodb_log_buffer_size', 'Global (restart / my.cnf)', 'Buffers redo entries before flushing to redo logs'],
          ['table_open_cache', 'Global (SET GLOBAL + my.cnf)', 'Keeps open table file descriptors cached to avoid reopen overhead'],
          ['thread_cache_size', 'Global (SET GLOBAL + my.cnf)', 'Reuses idle worker threads across new client logins'],
          ['sort_buffer_size / join_buffer_size', 'Per-Connection!', 'Allocated per active query sort/join—oversizing causes OOM under concurrency!']
        ],
        question: 'How do you make a dynamic SET GLOBAL thread_cache_size = 32 change survive a MariaDB container restart?',
        answer: 'Unlike MySQL SET PERSIST, MariaDB does not write SQL changes to disk automatically—you must also add thread_cache_size = 32 under [mariadb] in my.cnf.',
        notes: 'Highlight both SET GLOBAL (immediate testing) and my.cnf (persistence across restarts), plus keeping per-connection buffers modest.'
      },
      {
        id: 'u3-buffer-metrics',
        title: 'Measure live buffer pool and cache effectiveness.',
        lead: 'Calculate your real InnoDB Buffer Pool Hit Ratio cleanly from GLOBAL_STATUS counters.',
        type: 'query',
        persona: 'dba_lab',
        database: 'information_schema',
        sql: "SELECT\n  MAX(CASE WHEN VARIABLE_NAME = 'Innodb_buffer_pool_read_requests' THEN CAST(VARIABLE_VALUE AS UNSIGNED) END) AS logical_reads,\n  MAX(CASE WHEN VARIABLE_NAME = 'Innodb_buffer_pool_reads' THEN CAST(VARIABLE_VALUE AS UNSIGNED) END) AS physical_disk_reads,\n  ROUND((1 - MAX(CASE WHEN VARIABLE_NAME = 'Innodb_buffer_pool_reads' THEN VARIABLE_VALUE END) /\n    GREATEST(MAX(CASE WHEN VARIABLE_NAME = 'Innodb_buffer_pool_read_requests' THEN VARIABLE_VALUE END), 1)) * 100, 3) AS buffer_hit_pct\nFROM information_schema.GLOBAL_STATUS\nWHERE VARIABLE_NAME IN ('Innodb_buffer_pool_read_requests', 'Innodb_buffer_pool_reads');",
        explain: {
          syntax: 'SELECT ... FROM information_schema.GLOBAL_STATUS WHERE VARIABLE_NAME IN (...);',
          parts: [
            ['information_schema.GLOBAL_STATUS', 'Exposes server status counters as a queryable table so you can compute ratios directly in SQL.'],
            ['Innodb_buffer_pool_read_requests vs reads', 'read_requests counts total logical page lookups; reads counts cache misses that had to hit physical disk.'],
            ['(1 - disk_reads / logical_reads) * 100', 'Computes the Buffer Pool Hit Ratio percentage (GREATEST(..., 1) prevents division by zero).']
          ]
        },
        presets: [
          ['Buffer pool hit ratio', "SELECT MAX(CASE WHEN VARIABLE_NAME='Innodb_buffer_pool_read_requests' THEN CAST(VARIABLE_VALUE AS UNSIGNED) END) AS logical_reads, MAX(CASE WHEN VARIABLE_NAME='Innodb_buffer_pool_reads' THEN CAST(VARIABLE_VALUE AS UNSIGNED) END) AS physical_disk_reads, ROUND((1 - MAX(CASE WHEN VARIABLE_NAME='Innodb_buffer_pool_reads' THEN VARIABLE_VALUE END)/GREATEST(MAX(CASE WHEN VARIABLE_NAME='Innodb_buffer_pool_read_requests' THEN VARIABLE_VALUE END),1))*100,3) AS buffer_hit_pct FROM information_schema.GLOBAL_STATUS WHERE VARIABLE_NAME IN ('Innodb_buffer_pool_read_requests','Innodb_buffer_pool_reads');"],
          ['Memory & cache variables', "SHOW GLOBAL VARIABLES WHERE Variable_name IN ('innodb_buffer_pool_size','innodb_log_buffer_size','table_open_cache','thread_cache_size','sort_buffer_size','join_buffer_size');"]
        ],
        expected: 'Shows logical RAM page hits vs physical disk reads and computed hit percentage (typically > 98%).',
        question: 'If buffer_hit_pct drops steadily below 90% on a read-heavy database, what tuning change usually helps most?',
        answer: 'Increasing innodb_buffer_pool_size (and indexing missing filters so queries scan fewer irrelevant pages).',
        notes: 'Point out that logical_reads come from RAM while Innodb_buffer_pool_reads represent cache misses hitting disk.'
      },
      {
        id: 'u3-data-dictionary',
        title: 'Understanding MariaDB’s Data Dictionary.',
        lead: 'The Data Dictionary stores authoritative metadata about schemas, tables, columns, keys, users, and runtime telemetry.',
        type: 'cards',
        cards: [
          ['INFORMATION_SCHEMA', 'Standard read-only ANSI metadata views describing tables, columns, views, constraints, engines, and InnoDB locks/transactions.'],
          ['mysql schema', 'Persistent system tables holding user accounts, password hashes, global/DB privileges, roles, and time zones.'],
          ['PERFORMANCE_SCHEMA', 'Low-overhead instrumentation exposing statement digests, metadata locks, wait events, and socket telemetry.']
        ],
        question: 'Can a DBA directly run INSERT INTO INFORMATION_SCHEMA.TABLES to register a fake table?',
        answer: 'No. INFORMATION_SCHEMA consists of read-only dynamic system views maintained automatically by DDL operations.',
        notes: 'Explain how DESCRIBE and SHOW TABLES are shortcuts over INFORMATION_SCHEMA queries.'
      },
      {
        id: 'u3-dd-queries',
        title: 'Query the Data Dictionary live.',
        lead: 'Use INFORMATION_SCHEMA and mysql tables to audit foreign keys, column domains, and configured accounts.',
        type: 'query',
        persona: 'dba_lab',
        database: 'information_schema',
        sql: "SELECT TABLE_SCHEMA, TABLE_NAME, ENGINE, TABLE_ROWS, ROUND((DATA_LENGTH + INDEX_LENGTH)/1024, 1) AS total_kb\nFROM information_schema.TABLES\nWHERE TABLE_SCHEMA IN ('college_demo','sql_lab','security_lab')\nORDER BY TABLE_SCHEMA, TABLE_NAME;",
        explain: {
          syntax: 'SELECT ... FROM information_schema.TABLES | KEY_COLUMN_USAGE | COLUMNS;\nSELECT ... FROM mysql.user;',
          parts: [
            ['information_schema.TABLES', 'Reports every table’s schema, storage engine, estimated row count, and byte footprint.'],
            ['KEY_COLUMN_USAGE & COLUMNS', 'Audits foreign-key links (REFERENCED_TABLE_NAME) and column types/nullability across any schema.'],
            ['mysql.user', 'Lists registered MariaDB accounts, host patterns, authentication plugins, roles, and SSL requirements.']
          ]
        },
        presets: [
          ['Tables & sizes', "SELECT TABLE_SCHEMA, TABLE_NAME, ENGINE, TABLE_ROWS, ROUND((DATA_LENGTH + INDEX_LENGTH)/1024, 1) AS total_kb FROM information_schema.TABLES WHERE TABLE_SCHEMA IN ('college_demo','sql_lab','security_lab') ORDER BY TABLE_SCHEMA, TABLE_NAME;"],
          ['Foreign key audit', "SELECT TABLE_SCHEMA, TABLE_NAME, CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE REFERENCED_TABLE_NAME IS NOT NULL AND TABLE_SCHEMA IN ('college_demo','sql_lab') ORDER BY TABLE_SCHEMA, TABLE_NAME;"],
          ['Column inventory', "SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='college_demo' ORDER BY TABLE_NAME, ORDINAL_POSITION;"],
          ['User accounts (mysql.user)', 'SELECT User, Host, plugin, is_role, password_expired, ssl_type FROM mysql.user ORDER BY User, Host;']
        ],
        expected: 'Displays live table sizes, foreign-key references, column metadata, and MariaDB accounts from system catalogs.',
        question: 'Which Data Dictionary table would you query to find every foreign key pointing to courses(id) before changing courses?',
        answer: 'information_schema.KEY_COLUMN_USAGE filtering WHERE REFERENCED_TABLE_NAME = "courses".',
        notes: 'Run all four presets! Note that mysql.user is a read-only view over mysql.global_priv in MariaDB 11.4.'
      },
      {
        id: 'u3-dd-check',
        title: 'Checkpoint: choosing the right metadata schema.',
        lead: 'You need to inspect which constraints exist on sql_lab.enrollments and see active InnoDB row locks.',
        type: 'quiz',
        options: [
          'Query INFORMATION_SCHEMA.TABLE_CONSTRAINTS for constraints and INFORMATION_SCHEMA.INNODB_LOCKS for row locks',
          'Query college_demo.students for both',
          'Edit ibdata1 with a text editor'
        ],
        correct: 0,
        feedback: 'INFORMATION_SCHEMA exposes table constraints as well as active InnoDB transactions/row locks (while PERFORMANCE_SCHEMA exposes statement digests and wait timers).',
        question: 'Student task: write a query checking which columns in sql_lab allow NULL values.',
        answer: "SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='sql_lab' AND IS_NULLABLE='YES' ORDER BY TABLE_NAME, ORDINAL_POSITION;",
        notes: 'Confirm Data Dictionary mastery before introducing user creation, roles, and authentication plugins.'
      }
    ]
  },
  {
    id: 'u3-users-auth', unit: 'u3', number: '3.4', title: 'User accounts, roles & auth plugins', minutes: 90,
    objective: 'Create users and roles, activate roles with SET ROLE / SET DEFAULT ROLE, and compare MariaDB auth plugins.',
    steps: [
      {
        id: 'u3-user-identity',
        title: 'How MariaDB identifies users: user@host.',
        lead: 'In MariaDB, "alice@localhost" and "alice@%" can be two completely different accounts with different passwords and privileges.',
        type: 'cards',
        cards: [
          ['Exact host / IP', "'app'@'172.18.0.5' restricts logins to one exact host or container IP."],
          ['Local socket only', "'admin'@'localhost' matches local Unix socket connections, blocking remote network logins."],
          ['Wildcard host', "'reporting'@'%' matches any remote TCP/IP host (combine with TLS and strong passwords)."]
        ],
        question: 'If both ""@"localhost" (anonymous) and "alice"@"%" exist, what unexpected match occurs when Alice connects locally?',
        answer: 'MariaDB sorts exact host "localhost" ahead of wildcard "%", so Alice matches the anonymous local account! Always drop anonymous users.',
        notes: 'Point out that MariaDB 11.4 Docker images drop anonymous users by default.'
      },
      {
        id: 'u3-roles-lifecycle',
        title: 'Create users and manage Roles with RBAC.',
        lead: 'Roles bundle reusable privilege sets cleanly so dozens of analysts do not need individual GRANT edits.',
        type: 'query',
        persona: 'dba_lab',
        database: 'security_lab',
        resetKind: 'unit3',
        sql: "CREATE ROLE IF NOT EXISTS 'role_reader';",
        explain: {
          syntax: "CREATE ROLE 'role_name';  GRANT priv ON db.* TO 'role_name';\nCREATE USER 'u'@'host' IDENTIFIED BY 'pw';\nGRANT 'role_name' TO 'u'@'host';  SET DEFAULT ROLE 'role_name' FOR 'u'@'host';",
          parts: [
            ['CREATE ROLE / GRANT ... TO role', 'Creates a reusable named permission bundle and assigns table/DB privileges to it.'],
            ['CREATE USER ... IDENTIFIED BY', 'Creates a new login account restricted to the specified host pattern and password.'],
            ['SET DEFAULT ROLE / SET ROLE', 'Automatically enables the role on login (SET DEFAULT ROLE) or activates a role inside the current session (SET ROLE).']
          ]
        },
        presets: [
          ['1. Create role', "CREATE ROLE IF NOT EXISTS 'role_reader';"],
          ['2. Grant SELECT to role', "GRANT SELECT ON security_lab.* TO 'role_reader';"],
          ['3. Create user analyst_u3', "CREATE USER IF NOT EXISTS 'analyst_u3'@'%' IDENTIFIED BY 'Analyst#2026';"],
          ['4. Grant role to user', "GRANT 'role_reader' TO 'analyst_u3'@'%';"],
          ['5. Set default role', "SET DEFAULT ROLE 'role_reader' FOR 'analyst_u3'@'%';"],
          ['6. Inspect grants & test revoke/re-grant', "SHOW GRANTS FOR 'analyst_u3'@'%';"],
          ['7. Inspect role grants', "SHOW GRANTS FOR 'role_reader';"],
          ['8. Activate role in current session', "SET ROLE 'role_reader';"]
        ],
        expected: 'Creates role_reader, grants security_lab SELECT, assigns it to analyst_u3 as default role, and activates SET ROLE.',
        question: 'What happens if you GRANT a role to a user WITHOUT running SET DEFAULT ROLE?',
        answer: 'The user logs in with 0 role privileges active (CURRENT_ROLE() is NULL) until their session explicitly executes SET ROLE role_reader;.',
        notes: 'Walk through presets 1–8! Note SET ROLE works for dba_lab or any granted user session; REVOKE role_reader FROM user detaches the role.',
      },
      {
        id: 'u3-auth-plugins',
        title: 'Authentication plugins in MariaDB (ed25519 & more).',
        lead: 'Check installed authentication plugins and create an account using modern ed25519 elliptic-curve authentication.',
        type: 'query',
        persona: 'dba_lab',
        database: 'mysql',
        resetKind: 'unit3',
        sql: "SELECT PLUGIN_NAME, PLUGIN_STATUS, PLUGIN_LIBRARY FROM information_schema.PLUGINS WHERE PLUGIN_TYPE = 'AUTHENTICATION' ORDER BY PLUGIN_NAME;",
        explain: {
          syntax: "CREATE USER 'user'@'host' IDENTIFIED VIA plugin_name USING PASSWORD('secret');",
          parts: [
            ['information_schema.PLUGINS', 'Lists all active authentication plugins installed on this MariaDB server.'],
            ['IDENTIFIED VIA ed25519', 'Tells MariaDB to authenticate this account with the elliptic-curve ed25519 plugin instead of legacy SHA1.'],
            ["USING PASSWORD('...')", 'Hashes/derives the stored authentication verifier safely on the server side.']
          ]
        },
        presets: [
          ['1. List auth plugins', "SELECT PLUGIN_NAME, PLUGIN_STATUS, PLUGIN_LIBRARY FROM information_schema.PLUGINS WHERE PLUGIN_TYPE = 'AUTHENTICATION' ORDER BY PLUGIN_NAME;"],
          ['2. Create ed25519 user', "CREATE USER IF NOT EXISTS 'ed_user'@'%' IDENTIFIED VIA ed25519 USING PASSWORD('StrongEd#2026');"],
          ['3. Inspect plugin & hash', "SELECT User, Host, plugin, LEFT(authentication_string, 32) AS auth_preview FROM mysql.user WHERE User IN ('dba_lab','ed_user','tls_user','web_app','reporting') ORDER BY User;"]
        ],
        expected: 'Lists active auth plugins, creates ed_user using ed25519, and inspects stored plugin metadata.',
        question: 'Notice ed25519 stores a public key rather than weak double-SHA1 hashes. What must the client driver also support?',
        answer: 'The client library must ship the matching client plugin (e.g. client_ed25519.so in libmariadb / MariaDB Connector).',
        notes: 'Run presets 1, 2, 3! Note MariaDB’s CLI client inside Docker supports ed25519 out of the box.'
      },
      {
        id: 'u3-auth-compare',
        title: 'Compare authentication plugins.',
        lead: 'Different environments call for password-based, OS-socket, or enterprise directory authentication.',
        type: 'comparison',
        columns: ['Plugin', 'How it verifies identity', 'Best use case'],
        rows: [
          ['mysql_native_password', 'Challenge-response using double-SHA1 hash', 'Broad compatibility with legacy MySQL/MariaDB connectors'],
          ['ed25519', 'Elliptic-curve cryptography challenge-response', 'Strong modern password authentication in MariaDB clients'],
          ['unix_socket', 'Asks OS kernel which Linux UID owns the socket', 'Passwordless local root/DBA automation on Linux servers'],
          ['pam', 'Delegates login to Linux PAM (LDAP, Kerberos, 2FA)', 'Centralized university/enterprise directory authentication'],
          ['parsec', 'Modern salted PBKDF2 + Ed25519 (MariaDB 11.6+)', 'Next-generation default replacing legacy password hashes']
        ],
        question: 'Why does unix_socket allow passwordless root login locally without letting remote attackers in?',
        answer: 'unix_socket only works over local OS sockets and verifies that the Linux user running the client process matches the DB username.',
        notes: 'Contrast unix_socket (OS kernel identity) with network plugins (mysql_native_password / ed25519).'
      },
      {
        id: 'u3-auth-check',
        title: 'Checkpoint: choosing an authentication method.',
        lead: 'A Linux cron backup script runs locally on the MariaDB server and you do not want a plaintext password in the script.',
        type: 'quiz',
        options: [
          'Use unix_socket authentication for the local backup OS account',
          'Grant ALL PRIVILEGES to anonymous @localhost',
          'Pass -p on the command line inside cron'
        ],
        correct: 0,
        feedback: 'unix_socket binds authentication to the Linux backup user UID with zero passwords stored in scripts.',
        question: 'Student task: write the SQL to create role_analyst, grant SELECT on college_demo.*, and assign it as default to intern@%.',
        answer: "CREATE ROLE 'role_analyst';\nGRANT SELECT ON college_demo.* TO 'role_analyst';\nCREATE USER 'intern'@'%' IDENTIFIED BY 'Intern#2026';\nGRANT 'role_analyst' TO 'intern'@'%';\nSET DEFAULT ROLE 'role_analyst' FOR 'intern'@'%';",
        notes: 'Transition smoothly into Section 3.5 where we exercise GRANT/REVOKE and switch personas live.'
      }
    ]
  },
  {
    id: 'u3-permissions', unit: 'u3', number: '3.5', title: 'Controlling permissions & least privilege', minutes: 90,
    objective: 'Apply GRANT and REVOKE across database, table, and column scopes and test real denied vs allowed actions.',
    steps: [
      {
        id: 'u3-priv-scopes',
        title: 'Privilege levels: Global, Database, Table, and Column.',
        lead: 'Grant permissions at the narrowest scope possible rather than handing out *.* globally.',
        type: 'comparison',
        columns: ['Scope', 'Example GRANT syntax', 'When to use'],
        rows: [
          ['Global (*.*)', 'GRANT PROCESS, RELOAD ON *.* TO ...', 'Server-wide DBA monitoring, backup, or admin accounts only'],
          ['Database (db.*)', 'GRANT SELECT, INSERT, UPDATE ON security_lab.* TO ...', 'Application microservice owning one database'],
          ['Table (db.tbl)', 'GRANT SELECT ON college_demo.courses TO ...', 'Allowing read access to public catalog tables only'],
          ['Column (col1, col2)', 'GRANT SELECT (id, name) ON college_demo.students TO ...', 'Hiding sensitive email or age columns without separate views'],
          ['WITH GRANT OPTION', 'Appended to GRANT', 'Permits recipient to pass their privileges onward—reserve strictly for admins']
        ],
        question: 'Why should an application account NEVER hold DROP, ALTER, or GRANT OPTION on production tables?',
        answer: 'Compromising the app would let an attacker destroy schemas or create hidden backdoor database accounts.',
        notes: 'Highlight column-level grants vs creating views (both solve column secrecy cleanly).'
      },
      {
        id: 'u3-persona-lab',
        title: 'Live Persona & Permission Tester.',
        lead: 'Switch between dba_lab, web_app, reporting, console, or custom users and observe which SQL operations succeed or fail with Error 1142.',
        type: 'persona-lab',
        question: 'Notice reporting can SELECT from college_demo.students, yet fails on DELETE. What happens when web_app tries INSERT on security_lab vs DROP TABLE?',
        answer: 'reporting holds SELECT only (1142 DELETE denied); web_app holds SELECT/INSERT/UPDATE on security_lab (INSERT succeeds, DROP rejected with Error 1142); dba_lab succeeds on security_lab DROP TABLE (use Reset Unit 3 to restore).',
        notes: 'Have students predict Success vs Access Denied before clicking "Execute as selected persona"! You can also test custom login analyst_u3 / Analyst#2026 if created in 3.4.'
      },
      {
        id: 'u3-grant-revoke',
        title: 'Practice GRANT and REVOKE step-by-step.',
        lead: 'Provision a temporary intern account, grant SELECT, inspect SHOW GRANTS, escalate to INSERT, then REVOKE INSERT.',
        type: 'query',
        persona: 'dba_lab',
        database: 'security_lab',
        resetKind: 'unit3',
        sql: "CREATE USER IF NOT EXISTS 'intern'@'%' IDENTIFIED BY 'Intern#2026';",
        explain: {
          syntax: "GRANT priv ON db.table TO 'user'@'host';\nREVOKE priv ON db.table FROM 'user'@'host';\nSHOW GRANTS FOR 'user'@'host';",
          parts: [
            ['GRANT ... TO', 'Adds the specified privilege(s) on a database or single table to an existing user.'],
            ['REVOKE ... FROM', 'Removes only the named privilege(s) while leaving all other privileges intact.'],
            ['SHOW GRANTS / DROP USER', 'Displays the account’s exact effective grants, and DROP USER removes the account cleanly when finished.']
          ]
        },
        presets: [
          ['1. Create intern', "CREATE USER IF NOT EXISTS 'intern'@'%' IDENTIFIED BY 'Intern#2026';"],
          ['2. Grant SELECT', "GRANT SELECT ON security_lab.course_records TO 'intern'@'%';"],
          ['3. Check SHOW GRANTS', "SHOW GRANTS FOR 'intern'@'%';"],
          ['4. Add INSERT', "GRANT INSERT ON security_lab.course_records TO 'intern'@'%';"],
          ['5. Revoke INSERT', "REVOKE INSERT ON security_lab.course_records FROM 'intern'@'%';"],
          ['6. Verify final grants', "SHOW GRANTS FOR 'intern'@'%';"],
          ['7. Clean up intern', "DROP USER IF EXISTS 'intern'@'%';"]
        ],
        expected: 'Demonstrates live incremental GRANT, REVOKE, and SHOW GRANTS verification.',
        question: 'Do changes made via GRANT or REVOKE require restarting MariaDB or running FLUSH PRIVILEGES?',
        answer: 'No. Account-management statements (CREATE USER, GRANT, REVOKE, DROP USER) update MariaDB’s in-memory privilege cache immediately.',
        notes: 'Clarify this common myth: FLUSH PRIVILEGES is only required if someone directly edited mysql.* tables with DML.'
      },
      {
        id: 'u3-priv-check',
        title: 'Checkpoint: least privilege in practice.',
        lead: 'A student-facing web app needs to read courses and insert/update student enrollments, never deleting enrollments.',
        type: 'quiz',
        options: [
          'GRANT ALL PRIVILEGES ON *.* TO web_app@%',
          'GRANT SELECT ON college_demo.courses and GRANT SELECT, INSERT, UPDATE ON college_demo.enrollments',
          'Log the web app in as root over TLS'
        ],
        correct: 1,
        feedback: 'Table-specific SELECT/INSERT/UPDATE limits blast radius even if the web app has a bug.',
        question: 'Student task: write a REVOKE statement removing UPDATE on security_lab.* from web_app@%.',
        answer: "REVOKE UPDATE ON security_lab.* FROM 'web_app'@'%';",
        notes: 'If you run that REVOKE in class to test, open ⌘K -> Reset Unit 3 security_lab (or press Reset Unit 3 in SQL Studio) afterward.'
      }
    ]
  },
  {
    id: 'u3-security-risks', unit: 'u3', number: '3.6', title: 'Common security risks & SQL injection', minutes: 60,
    objective: 'Identify common database security vulnerabilities and prove how parameterized queries prevent SQL injection.',
    steps: [
      {
        id: 'u3-risks-table',
        title: 'Recognize common database security risks.',
        lead: 'Most database breaches trace back to a handful of preventable misconfigurations and coding flaws.',
        type: 'comparison',
        columns: ['Security Risk', 'How attackers exploit it', 'Defense in MSCNS406'],
        rows: [
          ['SQL Injection (SQLi)', 'String-concatenated user input alters SQL syntax', 'Prepared / parameterized queries (?) + least privilege'],
          ['Excessive privileges', 'Web app runs as root or holds DROP/FILE/SUPER', 'Dedicated scoped accounts (web_app, reporting)'],
          ['Unencrypted network traffic', 'Plaintext TCP connections leak passwords & query rows', 'Enforce TLS/SSL (REQUIRE SSL) + bind-address'],
          ['Weak / reused passwords', 'Dictionary attacks crack accounts like "1234"', 'Password validation plugins, lockout & expiration'],
          ['Missing audit trails', 'Breaches go undetected without query/login logs', 'MariaDB Audit Plugin (server_audit) & log monitoring']
        ],
        question: 'Why does defense-in-depth matter—why not rely solely on parameterized queries?',
        answer: 'Even if one layer fails (e.g., a legacy module misses parameterization), least privilege, TLS, and audit logging limit damage and expose the attack.',
        notes: 'Tie every row in this table directly to the labs across Units 3 and 4.'
      },
      {
        id: 'u3-sqli-lab',
        title: 'Live SQL Injection: Vulnerable vs Parameterized.',
        lead: 'Submit normal vs crafted payloads against security_lab.portal_users and inspect both generated SQL statements and returned rows side-by-side.',
        type: 'sqli-lab',
        question: 'Why did "\' OR \'1\'=\'1" dump every user (including admin_portal) in the vulnerable query while returning 0 rows in the parameterized query?',
        answer: 'String concatenation turns input into executable SQL OR predicates. Parameterized queries (conn.execute with ?) send SQL structure and data values separately so quotes are treated strictly as literal text.',
        notes: 'Try all 3 presets: Normal login -> OR 1=1 auth bypass -> Comment hijack (-- ). Also highlight why security_reader holds SELECT only.'
      },
      {
        id: 'u3-risks-check',
        title: 'Checkpoint: why manual escaping is brittle.',
        lead: 'What is the gold-standard defense against SQL injection in application code?',
        type: 'quiz',
        options: [
          'Manually stripping single quotes and running the web app as root',
          'Prepared statements / parameterized queries separating SQL structure from bound data values',
          'Checking input length only in frontend JavaScript'
        ],
        correct: 1,
        feedback: 'Parameterized placeholders (?) guarantee user input can never alter the SQL parse tree regardless of quotes or encodings.',
        question: 'Student task: explain why a read-only security_reader account prevented DROP TABLE even in the vulnerable query.',
        answer: 'Database privileges enforce a second defensive boundary inside MariaDB (and single-statement driver settings block stacked ; queries).',
        notes: 'Move to Section 3.7 for TLS encryption, password policies, and login hardening.'
      }
    ]
  },
  {
    id: 'u3-tls-login', unit: 'u3', number: '3.7', title: 'TLS connections, password & login security', minutes: 60,
    objective: 'Enforce encrypted TLS connections, configure password strength plugins, and apply login/expiration controls.',
    steps: [
      {
        id: 'u3-tls-concepts',
        title: 'Securing server connections with TLS/SSL.',
        lead: 'Without TLS, returned student records and unencrypted traffic can be inspected on the wire.',
        type: 'cards',
        cards: [
          ['Server Certificates', 'ssl_ca, ssl_cert, and ssl_key configured in classroom.cnf enable encrypted handshakes on port 3306.'],
          ['REQUIRE SSL', "CREATE USER 'tls_user'@'%' ... REQUIRE SSL forces the server to reject unencrypted logins immediately."],
          ['REQUIRE X509', 'Requires mutual TLS where the client must also present a valid certificate signed by the trusted CA.']
        ],
        question: 'If ssl_cert is configured on the server, does every client automatically get forced to use TLS unless REQUIRE SSL is set?',
        answer: 'No! By default TLS is optional—clients that omit SSL connect unencrypted unless REQUIRE SSL or global require_secure_transport=ON is enforced.',
        notes: 'Point out that Docker’s MariaDB container built its own 2048-bit CA and signed server certificate in /etc/mysql/certs/ (downloadable in DBeaver setup).'
      },
      {
        id: 'u3-tls-live',
        title: 'Live TLS test: enforce REQUIRE SSL on tls_user.',
        lead: 'Toggle the TLS/SSL checkbox in SQL Studio on the right OFF vs ON while connecting as tls_user (REQUIRE SSL) and inspect the cipher.',
        type: 'query',
        persona: 'tls_user',
        database: 'security_lab',
        tlsToggle: true,
        useTls: false,
        sql: "SHOW SESSION STATUS WHERE Variable_name IN ('Ssl_cipher', 'Ssl_version');",
        explain: {
          syntax: "SHOW SESSION STATUS WHERE Variable_name IN ('Ssl_cipher', 'Ssl_version');",
          parts: [
            ['SHOW SESSION STATUS', 'Inspects status metrics for THIS connection only (not global server totals).'],
            ['Ssl_cipher & Ssl_version', 'Proves whether the active socket is encrypted (e.g. TLSv1.3 / TLS_AES_256_GCM_SHA384) or blank when plaintext.'],
            ['REQUIRE SSL (on tls_user)', 'Causes MariaDB to reject non-TLS logins immediately with Access Denied (1045).']
          ]
        },
        presets: [
          ['Check TLS cipher', "SHOW SESSION STATUS WHERE Variable_name IN ('Ssl_cipher', 'Ssl_version');"],
          ['Read protected records', 'SELECT id, title, classification FROM course_records ORDER BY id;']
        ],
        expected: 'With TLS/SSL unchecked: rejected with Access Denied (1045)! With TLS/SSL checked: connects securely (e.g. TLSv1.3 / TLS_AES_256_GCM_SHA384).',
        question: 'Why did tls_user fail even with the correct password when TLS/SSL was unchecked?',
        answer: 'MariaDB enforces REQUIRE SSL during authentication and rejects non-TLS sockets even when credentials match.',
        notes: 'Run once with TLS/SSL unchecked to demonstrate Error 1045, then check TLS/SSL and Run ⌘↵ to reveal Ssl_cipher and Ssl_version!'
      },
      {
        id: 'u3-password-policy',
        title: 'Password complexity, expiration & account locking.',
        lead: 'Install MariaDB’s simple_password_check plugin live and test rejecting weak passwords alongside expiration and locking.',
        type: 'query',
        persona: 'dba_lab',
        database: 'security_lab',
        resetKind: 'unit3',
        sql: "INSTALL PLUGIN IF NOT EXISTS simple_password_check SONAME 'simple_password_check';",
        explain: {
          syntax: "INSTALL PLUGIN IF NOT EXISTS name SONAME 'lib';\nALTER USER 'u'@'host' ACCOUNT LOCK | UNLOCK | PASSWORD EXPIRE INTERVAL N DAY;",
          parts: [
            ['INSTALL PLUGIN ... SONAME', 'Dynamically loads the simple_password_check password-strength validator into the running MariaDB server.'],
            ['PASSWORD EXPIRE INTERVAL 90 DAY', 'Forces the account to rotate its password automatically every 90 days.'],
            ['ACCOUNT LOCK / WITH MAX_QUERIES_PER_HOUR', 'Suspends logins without dropping grants, and caps query/connection quotas per account.']
          ]
        },
        presets: [
          ['1. Install password plugin', "INSTALL PLUGIN IF NOT EXISTS simple_password_check SONAME 'simple_password_check';"],
          ['2. Inspect policy variables', "SHOW GLOBAL VARIABLES LIKE 'simple_password_check%';"],
          ['3. Reject weak password (1819)', "CREATE USER 'locked_user'@'%' IDENTIFIED BY 'weak';"],
          ['4. Accept strong password', "CREATE USER IF NOT EXISTS 'locked_user'@'%' IDENTIFIED BY 'StrongLab#2026' PASSWORD EXPIRE INTERVAL 90 DAY;"],
          ['5. Lock account immediately', "ALTER USER 'locked_user'@'%' ACCOUNT LOCK;"],
          ['6. Verify lock & expiry flags', "SELECT User, Host, JSON_VALUE(Priv, '$.account_locked') AS account_locked, JSON_VALUE(Priv, '$.password_lifetime') AS password_lifetime FROM mysql.global_priv WHERE User='locked_user';"],
          ['7. Resource limits example', "ALTER USER 'locked_user'@'%' WITH MAX_QUERIES_PER_HOUR 500 MAX_USER_CONNECTIONS 5 ACCOUNT UNLOCK;"],
          ['8. Clean up locked_user', "DROP USER IF EXISTS 'locked_user'@'%';"]
        ],
        expected: 'Installs simple_password_check, rejects "weak" with Error 1819, creates locked_user with 90-day expiry, locks it, applies resource quotas, and cleans up.',
        question: 'What happens if a developer locks an account with ACCOUNT LOCK rather than running DROP USER?',
        answer: 'MariaDB preserves the user’s grants and ownership history while blocking all new logins (ideal for suspensions, incidents, or controlled offboarding).',
        notes: 'Step through presets 1–8 in class! Reset Unit 3 also uninstalls simple_password_check cleanly.'
      },
      {
        id: 'u3-checkpoint-challenge',
        title: 'Security hardening verification challenge.',
        lead: 'Audit mysql.user in SQL Studio to verify which demo accounts enforce TLS (REQUIRE SSL) and which authentication plugins are configured.',
        type: 'challenge',
        database: 'mysql',
        persona: 'dba_lab',
        hints: [
          'Query mysql.user selecting User, Host, plugin, ssl_type.',
          "Try: SELECT User, Host, plugin, ssl_type FROM mysql.user WHERE User IN ('tls_user', 'web_app', 'reporting') ORDER BY User;"
        ],
        check: {
          kind: 'query-match',
          database: 'mysql',
          persona: 'dba_lab',
          orderMatters: true,
          expectedSql: "SELECT User, Host, plugin, ssl_type FROM mysql.user WHERE User IN ('tls_user', 'web_app', 'reporting') ORDER BY User;"
        },
        question: 'Write a query returning User, Host, plugin, and ssl_type for tls_user, web_app, and reporting ordered by User, then advance to Unit 4.',
        answer: "SELECT User, Host, plugin, ssl_type\nFROM mysql.user\nWHERE User IN ('tls_user', 'web_app', 'reporting')\nORDER BY User;",
        notes: 'Notice ssl_type = "ANY" on tls_user (set by REQUIRE SSL) vs empty string on non-TLS accounts. Click Unit 4 → in the dock to start Monitoring & Maintenance.'
      }
    ]
  }
);

-- =============================================================================
-- MSCNS406 · Unit 3 Security & MariaDB Admin Worksheet (Open in DBeaver)
-- Connection: Host 127.0.0.1 | Port 3307 | User: dba_lab (Password: dba-local-demo)
-- =============================================================================

-- 1. Connection & Identity
SELECT USER() AS client_sent, CURRENT_USER() AS matched_account, CONNECTION_ID(), DATABASE(), @@port, @@max_connections;

-- 2. Storage Engines, InnoDB Buffers & Hit Ratio
SHOW ENGINES;
SHOW GLOBAL VARIABLES WHERE Variable_name IN (
  'datadir', 'innodb_file_per_table', 'innodb_page_size',
  'innodb_buffer_pool_size', 'innodb_log_buffer_size', 'table_open_cache', 'thread_cache_size'
);

-- 3. Data Dictionary Inspection
SELECT TABLE_SCHEMA, TABLE_NAME, ENGINE, TABLE_ROWS, ROUND((DATA_LENGTH + INDEX_LENGTH)/1024, 1) AS total_kb
FROM information_schema.TABLES
WHERE TABLE_SCHEMA IN ('college_demo', 'sql_lab', 'security_lab')
ORDER BY TABLE_SCHEMA, TABLE_NAME;

SELECT User, Host, plugin, is_role, password_expired, ssl_type
FROM mysql.user
ORDER BY User, Host;

-- 4. Roles & Authentication Plugins
CREATE ROLE IF NOT EXISTS 'role_reader';
GRANT SELECT ON security_lab.* TO 'role_reader';
CREATE USER IF NOT EXISTS 'analyst_u3'@'%' IDENTIFIED BY 'Analyst#2026';
GRANT 'role_reader' TO 'analyst_u3'@'%';
SET DEFAULT ROLE 'role_reader' FOR 'analyst_u3'@'%';
SHOW GRANTS FOR 'analyst_u3'@'%';

-- ed25519 authentication plugin
SELECT PLUGIN_NAME, PLUGIN_STATUS FROM information_schema.PLUGINS WHERE PLUGIN_TYPE = 'AUTHENTICATION';
CREATE USER IF NOT EXISTS 'ed_user'@'%' IDENTIFIED VIA ed25519 USING PASSWORD('StrongEd#2026');

-- 5. TLS Connection Check (create a separate DBeaver connection as tls_user / tls-local-demo)
-- Enable SSL in DBeaver SSL tab + upload dbms-classroom-ca.pem (from Connect DBeaver modal):
SHOW SESSION STATUS WHERE Variable_name IN ('Ssl_cipher', 'Ssl_version');

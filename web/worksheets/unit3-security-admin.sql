-- =============================================================================
-- MSCNS406 · Unit 3 Security & MariaDB Admin Worksheet (Open in DBeaver)
-- Connection: Host 127.0.0.1 | Port 3307 | User: dba_lab (Password: dba-local-demo)
-- =============================================================================

-- 1. MariaDB CRUD Operations Lifecycle & Client Identity
SHOW DATABASES;
CREATE DATABASE IF NOT EXISTS demo_scratch;
USE demo_scratch;
CREATE TABLE IF NOT EXISTS demo_items (id INT PRIMARY KEY AUTO_INCREMENT, label VARCHAR(80) NOT NULL, qty INT DEFAULT 1);
SHOW TABLES;
INSERT INTO demo_items (label, qty) VALUES ('TLS Cert', 2), ('Audit Rule', 5);
ALTER TABLE demo_items ADD COLUMN active TINYINT(1) NOT NULL DEFAULT 1;
SELECT * FROM demo_items ORDER BY id;
DELETE FROM demo_items WHERE id = 1;
DROP TABLE IF EXISTS demo_items;
DROP DATABASE IF EXISTS demo_scratch;

SELECT USER() AS client_sent, CURRENT_USER() AS matched_account, CONNECTION_ID(), DATABASE(), @@port, @@bind_address, @@max_connections;

-- 2. Storage Engines, InnoDB Buffers & Buffer Pool Hit Ratio
SHOW ENGINES;
SHOW GLOBAL VARIABLES WHERE Variable_name IN (
  'datadir', 'innodb_file_per_table', 'innodb_page_size', 'innodb_doublewrite',
  'innodb_buffer_pool_size', 'innodb_log_buffer_size', 'table_open_cache', 'thread_cache_size'
);

SELECT
  MAX(CASE WHEN VARIABLE_NAME = 'Innodb_buffer_pool_read_requests' THEN CAST(VARIABLE_VALUE AS UNSIGNED) END) AS logical_reads,
  MAX(CASE WHEN VARIABLE_NAME = 'Innodb_buffer_pool_reads' THEN CAST(VARIABLE_VALUE AS UNSIGNED) END) AS physical_disk_reads,
  ROUND((1 - MAX(CASE WHEN VARIABLE_NAME = 'Innodb_buffer_pool_reads' THEN VARIABLE_VALUE END) /
    GREATEST(MAX(CASE WHEN VARIABLE_NAME = 'Innodb_buffer_pool_read_requests' THEN VARIABLE_VALUE END), 1)) * 100, 3) AS buffer_hit_pct
FROM information_schema.GLOBAL_STATUS
WHERE VARIABLE_NAME IN ('Innodb_buffer_pool_read_requests', 'Innodb_buffer_pool_reads');

-- 3. Data Dictionary Inspection
SELECT TABLE_SCHEMA, TABLE_NAME, ENGINE, TABLE_ROWS, ROUND((DATA_LENGTH + INDEX_LENGTH)/1024, 1) AS total_kb
FROM information_schema.TABLES
WHERE TABLE_SCHEMA IN ('college_demo', 'sql_lab', 'security_lab')
ORDER BY TABLE_SCHEMA, TABLE_NAME;

SELECT User, Host, plugin, is_role, password_expired, ssl_type
FROM mysql.user
ORDER BY User, Host;

-- 4. Roles, GRANT/REVOKE & Authentication Plugins
CREATE ROLE IF NOT EXISTS 'role_reader';
GRANT SELECT ON security_lab.* TO 'role_reader';
CREATE USER IF NOT EXISTS 'analyst_u3'@'%' IDENTIFIED BY 'Analyst#2026';
GRANT 'role_reader' TO 'analyst_u3'@'%';
SET DEFAULT ROLE 'role_reader' FOR 'analyst_u3'@'%';
SHOW GRANTS FOR 'analyst_u3'@'%';

-- Incremental GRANT / REVOKE on a temporary account:
CREATE USER IF NOT EXISTS 'intern'@'%' IDENTIFIED BY 'Intern#2026';
GRANT SELECT, INSERT ON security_lab.course_records TO 'intern'@'%';
SHOW GRANTS FOR 'intern'@'%';
REVOKE INSERT ON security_lab.course_records FROM 'intern'@'%';
DROP USER IF EXISTS 'intern'@'%';

-- ed25519 authentication plugin
SELECT PLUGIN_NAME, PLUGIN_STATUS FROM information_schema.PLUGINS WHERE PLUGIN_TYPE = 'AUTHENTICATION';
CREATE USER IF NOT EXISTS 'ed_user'@'%' IDENTIFIED VIA ed25519 USING PASSWORD('StrongEd#2026');

-- 5. TLS Connection Check (create a separate DBeaver connection as tls_user / tls-local-demo)
-- Enable SSL in DBeaver SSL tab + select dbms-classroom-ca.pem (downloaded via the Console's DBeaver button):
SHOW SESSION STATUS WHERE Variable_name IN ('Ssl_cipher', 'Ssl_version');

-- 6. Password Policy, Expiration & Account Locking
INSTALL PLUGIN IF NOT EXISTS simple_password_check SONAME 'simple_password_check';
SHOW GLOBAL VARIABLES LIKE 'simple_password_check%';
-- Expect Error 1819 on weak password:
-- CREATE USER 'locked_user'@'%' IDENTIFIED BY 'weak';
CREATE USER IF NOT EXISTS 'locked_user'@'%' IDENTIFIED BY 'StrongLab#2026' PASSWORD EXPIRE INTERVAL 90 DAY;
ALTER USER 'locked_user'@'%' WITH MAX_QUERIES_PER_HOUR 500 MAX_USER_CONNECTIONS 5 ACCOUNT LOCK;
SELECT User, Host, JSON_VALUE(Priv, '$.account_locked') AS account_locked, JSON_VALUE(Priv, '$.password_lifetime') AS password_lifetime
FROM mysql.global_priv WHERE User = 'locked_user';
DROP USER IF EXISTS 'locked_user'@'%';

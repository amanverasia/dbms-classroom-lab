-- Additive setup for Units 3 and 4 security, performance, locking, and backup labs.
CREATE DATABASE IF NOT EXISTS security_lab;
CREATE DATABASE IF NOT EXISTS perf_lab;
CREATE DATABASE IF NOT EXISTS ops_lab;
CREATE DATABASE IF NOT EXISTS backup_lab;

-- Classroom DBA identity (used in Units 3 and 4 demonstrations)
CREATE USER IF NOT EXISTS 'dba_lab'@'%' IDENTIFIED BY 'dba-local-demo';
GRANT ALL PRIVILEGES ON *.* TO 'dba_lab'@'%' WITH GRANT OPTION;

-- Update existing demo personas with least-privilege lab scopes
CREATE USER IF NOT EXISTS 'web_app'@'%' IDENTIFIED BY 'webapp-demo-password';
REVOKE ALL PRIVILEGES, GRANT OPTION FROM 'web_app'@'%';
GRANT SELECT ON college_demo.* TO 'web_app'@'%';
GRANT SELECT, INSERT, UPDATE ON security_lab.* TO 'web_app'@'%';

CREATE USER IF NOT EXISTS 'reporting'@'%' IDENTIFIED BY 'reporting-demo-password';
GRANT SELECT ON college_demo.* TO 'reporting'@'%';
GRANT SELECT ON sql_lab.* TO 'reporting'@'%';
GRANT SELECT ON security_lab.* TO 'reporting'@'%';

-- TLS-enforced user for Unit 3 secure connection lab
CREATE USER IF NOT EXISTS 'tls_user'@'%' IDENTIFIED BY 'tls-local-demo' REQUIRE SSL;
GRANT SELECT ON college_demo.* TO 'tls_user'@'%';
GRANT SELECT ON security_lab.* TO 'tls_user'@'%';

-- Read-only account dedicated to SQL injection side-by-side demonstration
CREATE USER IF NOT EXISTS 'security_reader'@'%' IDENTIFIED BY 'reader-local-demo';
GRANT SELECT ON security_lab.* TO 'security_reader'@'%';

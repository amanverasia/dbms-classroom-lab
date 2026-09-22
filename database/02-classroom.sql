-- Additive setup: safe to apply to an existing classroom Docker volume.
CREATE DATABASE IF NOT EXISTS classroom_practice;
CREATE USER IF NOT EXISTS 'classroom_console'@'%' IDENTIFIED BY 'console-local-demo';
GRANT SELECT ON college_demo.* TO 'classroom_console'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, INDEX
  ON classroom_practice.* TO 'classroom_console'@'%';

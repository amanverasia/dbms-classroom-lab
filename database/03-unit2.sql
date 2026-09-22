-- Additive privileges; dataset initialization is performed once by the lesson service.
CREATE DATABASE IF NOT EXISTS sql_lab;
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, INDEX, CREATE VIEW, SHOW VIEW
  ON sql_lab.* TO 'classroom_console'@'%';

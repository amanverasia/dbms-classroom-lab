-- Unit 3 security and administration fixture in security_lab.
DROP TABLE IF EXISTS course_records;
DROP TABLE IF EXISTS portal_users;
DROP TABLE IF EXISTS lab_scratch;
DROP TABLE IF EXISTS lesson_state;

CREATE TABLE portal_users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hint VARCHAR(80) NOT NULL,
  role_name VARCHAR(30) NOT NULL,
  fee_balance DECIMAL(9,2) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE course_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(100) NOT NULL,
  classification VARCHAR(30) NOT NULL DEFAULT 'internal'
) ENGINE=InnoDB;

CREATE TABLE lesson_state (fixture_version INT NOT NULL);

START TRANSACTION;
INSERT INTO portal_users (username, password_hint, role_name, fee_balance) VALUES
  ('aman', 'aman@2026', 'student', 0.00),
  ('riya', 'riya@2026', 'student', 2500.00),
  ('kabir', 'kabir@2026', 'student', 1000.00),
  ('admin_portal', 'Campus#Admin99', 'staff', 0.00);

INSERT INTO course_records (title, classification) VALUES
  ('DBMS Administration Syllabus', 'public'),
  ('Exam Moderation Rubric', 'restricted'),
  ('TLS Certificate Rotation Guide', 'internal');

INSERT INTO lesson_state VALUES (1);
COMMIT;

CREATE DATABASE IF NOT EXISTS college_demo;
USE college_demo;

CREATE TABLE courses (
  id INT PRIMARY KEY,
  course_name VARCHAR(100) NOT NULL,
  duration_months INT NOT NULL CHECK (duration_months > 0),
  instructor VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE students (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  age INT CHECK (age >= 16),
  course_id INT,
  CONSTRAINT fk_students_course
    FOREIGN KEY (course_id) REFERENCES courses(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE enrollments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  enrolled_on DATE NOT NULL,
  status ENUM('active', 'completed', 'cancelled') NOT NULL DEFAULT 'active',
  CONSTRAINT uq_student_course UNIQUE (student_id, course_id),
  CONSTRAINT fk_enrollment_student FOREIGN KEY (student_id) REFERENCES students(id),
  CONSTRAINT fk_enrollment_course FOREIGN KEY (course_id) REFERENCES courses(id)
) ENGINE=InnoDB;

INSERT INTO courses (id, course_name, duration_months, instructor) VALUES
  (101, 'Cybersecurity', 6, 'Dr. Kavya Rao'),
  (102, 'Database Security', 4, 'Prof. Arjun Mehta'),
  (103, 'Python for Security', 3, 'Neha Iyer');

INSERT INTO students (id, name, email, age, course_id) VALUES
  (1, 'Aman Verma', 'aman@example.com', 25, 101),
  (2, 'Riya Sharma', 'riya@example.com', 19, 102),
  (3, 'Kabir Singh', 'kabir@example.com', 22, 101),
  (4, 'Meera Nair', 'meera@example.com', 20, 103),
  (5, 'Zoya Khan', 'zoya@example.com', 23, 102);

INSERT INTO enrollments (id, student_id, course_id, enrolled_on, status) VALUES
  (1001, 1, 101, '2026-07-01', 'active'),
  (1002, 1, 103, '2026-07-02', 'active'),
  (1003, 2, 102, '2026-07-03', 'active'),
  (1004, 3, 101, '2026-07-04', 'active'),
  (1005, 5, 102, '2026-07-05', 'active');

CREATE OR REPLACE VIEW student_course_summary AS
SELECT s.id AS student_id, s.name AS student_name, c.id AS course_id, c.course_name
FROM students s
LEFT JOIN courses c ON c.id = s.course_id;

CREATE USER IF NOT EXISTS 'web_app'@'%' IDENTIFIED BY 'webapp-demo-password';
CREATE USER IF NOT EXISTS 'reporting'@'%' IDENTIFIED BY 'reporting-demo-password';
GRANT SELECT, INSERT, UPDATE ON college_demo.* TO 'web_app'@'%';
GRANT SELECT ON college_demo.* TO 'reporting'@'%';
FLUSH PRIVILEGES;

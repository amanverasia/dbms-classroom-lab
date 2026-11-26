-- =============================================================================
-- MSCNS406 · Unit 1 Practice Worksheet (Open directly in DBeaver)
-- Connection: Host 127.0.0.1 | Port 3307 | User: classroom_console (or dba_lab)
-- =============================================================================

-- Part A: Explore read-only seed tables in college_demo
USE college_demo;
SHOW DATABASES;
SHOW TABLES;
DESCRIBE students;
SELECT * FROM students ORDER BY id;
SELECT * FROM courses ORDER BY id;
SELECT * FROM enrollments ORDER BY id;
SELECT * FROM student_course_summary;

-- Part B: Three-level query preview (join students + primary course)
SELECT s.id, s.name, c.course_name AS primary_course
FROM students AS s
LEFT JOIN courses AS c ON s.course_id = c.id
ORDER BY s.id;

-- Part C: Practice DDL/DML in classroom_practice
USE classroom_practice;

CREATE TABLE IF NOT EXISTS lab_students (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  age INT CHECK (age >= 16)
);

INSERT INTO lab_students (name, email, age)
VALUES ('Aman', 'aman.lab@example.com', 25),
       ('Riya', 'riya.lab@example.com', 19),
       ('Kabir', 'kabir.lab@example.com', 22);

SELECT name, age FROM lab_students WHERE age > 20 ORDER BY age;

-- Task (verify in Console Step 1.8 'lab-challenge'):
-- Create lab_courses (id INT PRIMARY KEY AUTO_INCREMENT, course_name VARCHAR(100) NOT NULL,
-- duration_months INT NOT NULL CHECK (duration_months > 0)) and insert at least 3 courses.

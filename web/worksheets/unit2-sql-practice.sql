-- =============================================================================
-- MSCNS406 · Unit 2 SQL Exam Practice Worksheet (Open directly in DBeaver)
-- Connection: Host 127.0.0.1 | Port 3307 | Database: sql_lab
-- User: classroom_console (Password: console-local-demo)
-- Tip: Execute one statement at a time (Ctrl+Enter in DBeaver).
-- =============================================================================

USE sql_lab;

-- 1. Inspect Unit 2 tables (note NULLs on Dev and zero enrollments on Meera/Dev/Cloud Security)
SELECT * FROM students ORDER BY id;
SELECT * FROM courses ORDER BY id;
SELECT * FROM enrollments ORDER BY student_id, course_id;
SELECT * FROM payments ORDER BY id;

-- 2. DDL: CREATE, ALTER, TRUNCATE, DROP
CREATE TABLE course_notes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT NOT NULL,
  note VARCHAR(200) NOT NULL,
  created_on DATE NOT NULL,
  FOREIGN KEY (course_id) REFERENCES courses(id)
);
ALTER TABLE course_notes ADD COLUMN priority INT NOT NULL DEFAULT 1 CHECK (priority BETWEEN 1 AND 3);
DESCRIBE course_notes;
DROP TABLE IF EXISTS course_notes;

-- 3. DML & Constraints (practice safely on disposable student_edits)
SELECT * FROM student_edits ORDER BY id;
INSERT INTO student_edits (name, email, age, city, joined_on)
VALUES ('Arun', 'arun.sql@example.com', 21, 'Pune', '2026-08-12');
UPDATE student_edits SET city = 'Pune' WHERE id = 2;
DELETE FROM student_edits WHERE id = 6;

-- Trigger all 5 constraints (expect errors when testing one by one):
-- PK:   INSERT INTO student_edits (id,name,email,age,city,joined_on) VALUES (1,'PK','pk@example.com',22,'Delhi','2026-08-01');
-- UNQ:  INSERT INTO student_edits (name,email,age,city,joined_on) VALUES ('Dup','aman@example.com',25,'Delhi','2026-08-01');
-- CHK:  INSERT INTO student_edits (name,email,age,joined_on) VALUES ('Young','y@example.com',12,'2026-08-01');
-- NN:   INSERT INTO student_edits (name,email,age,joined_on) VALUES (NULL,'nn@example.com',22,'2026-08-01');
-- FK:   INSERT INTO enrollments (student_id,course_id,score) VALUES (999,101,50);

-- 4. Filtering, IN, BETWEEN, LIKE, IS NULL, ORDER BY, LIMIT, CASE
SELECT name, city, age
FROM students
WHERE (city = 'Delhi' OR city = 'Mumbai') AND age >= 20
ORDER BY age DESC, id ASC;

SELECT id, name, age FROM students WHERE age IS NULL;

SELECT name,
  CASE
    WHEN age IS NULL THEN 'Unknown'
    WHEN age >= 21 THEN '21 or older'
    ELSE 'Under 21'
  END AS age_band
FROM students ORDER BY id;

-- 5. Aggregates, GROUP BY, HAVING (with ONLY_FULL_GROUP_BY active)
SELECT COUNT(*) AS enrollments, COUNT(score) AS graded, ROUND(AVG(score), 2) AS mean_score
FROM enrollments;

SELECT city, COUNT(*) AS students
FROM students
WHERE city IS NOT NULL
GROUP BY city
HAVING COUNT(*) >= 2
ORDER BY city;

-- 6. Joins (INNER, LEFT, RIGHT, CROSS, SELF, FULL OUTER emulation) & Set Ops
SELECT c.course_name, COUNT(e.student_id) AS enrolled
FROM courses c
LEFT JOIN enrollments e ON e.course_id = c.id
GROUP BY c.id, c.course_name
ORDER BY c.id;

SELECT s1.name AS student_a, s2.name AS student_b, s1.city
FROM students s1
JOIN students s2 ON s1.city = s2.city AND s1.id < s2.id
ORDER BY s1.city, s1.id;

SELECT student_id FROM enrollments
INTERSECT
SELECT student_id FROM payments
ORDER BY student_id;

SELECT id FROM students
EXCEPT
SELECT student_id FROM payments
ORDER BY id;

-- 7. Subqueries (IN, EXISTS, Scalar, ANY/ALL) & Views (Simple WITH CHECK OPTION vs Complex)
SELECT s.id, s.name FROM students s
WHERE NOT EXISTS (SELECT 1 FROM enrollments e WHERE e.student_id = s.id)
ORDER BY s.id;

CREATE OR REPLACE VIEW v_delhi_students AS
SELECT id, name, email, age, city, joined_on
FROM student_edits
WHERE city = 'Delhi'
WITH CHECK OPTION;

-- Try an invalid update through v_delhi_students (expects Error 1369):
-- UPDATE v_delhi_students SET city = 'Pune' WHERE id = 1;

-- 8. Built-in Functions (Numeric, String, Date, COALESCE) & Reporting Capstone
SELECT id, amount, ROUND(amount * 1.18, 2) AS with_gst, CEIL(amount / 1500) AS slots, MOD(amount, 1500) AS rem
FROM payments ORDER BY id;

SELECT name, UPPER(name) AS upper_name, CHAR_LENGTH(name) AS len, COALESCE(city, 'Not supplied') AS city_label
FROM students ORDER BY id;

-- Capstone Task (verify against Console Step 2.7 'sql-final-lab'):
SELECT c.id, c.course_name, COUNT(e.student_id) AS enrolled,
       COUNT(e.score) AS graded, ROUND(AVG(e.score), 2) AS mean_score
FROM courses c
LEFT JOIN enrollments e ON e.course_id = c.id
GROUP BY c.id, c.course_name
ORDER BY c.id;

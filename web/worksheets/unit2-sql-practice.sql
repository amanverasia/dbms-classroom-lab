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
DROP TABLE IF EXISTS course_notes;
CREATE TABLE course_notes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT NOT NULL,
  note VARCHAR(200) NOT NULL,
  created_on DATE NOT NULL,
  FOREIGN KEY (course_id) REFERENCES courses(id)
);
ALTER TABLE course_notes ADD COLUMN priority INT NOT NULL DEFAULT 1 CHECK (priority BETWEEN 1 AND 3);
DESCRIBE course_notes;
INSERT INTO course_notes (course_id, note, created_on) VALUES (101, 'Check firewall lab', '2026-08-01');
TRUNCATE TABLE course_notes;
DROP TABLE IF EXISTS course_notes;

-- 3. DML & Constraints (practice safely on disposable student_edits)
SELECT * FROM student_edits ORDER BY id;
INSERT INTO student_edits (name, email, age, city, joined_on)
VALUES ('Arun', 'arun.sql@example.com', 21, 'Pune', '2026-08-12');
UPDATE student_edits SET city = 'Pune' WHERE id = 2;
DELETE FROM student_edits WHERE id = 6;

-- Trigger all 5 constraints (expect errors when uncommenting & testing one by one):
-- PK:   INSERT INTO student_edits (id,name,email,age,city,joined_on) VALUES (1,'PK','pk@example.com',22,'Delhi','2026-08-01');
-- UNQ:  INSERT INTO student_edits (name,email,age,city,joined_on) VALUES ('Dup','aman@example.com',25,'Delhi','2026-08-01');
-- CHK:  INSERT INTO student_edits (name,email,age,joined_on) VALUES ('Young','y@example.com',12,'2026-08-01');
-- NN:   INSERT INTO student_edits (name,email,age,joined_on) VALUES (NULL,'nn@example.com',22,'2026-08-01');
-- FK:   INSERT INTO enrollments (student_id,course_id,score) VALUES (999,101,50);

-- 4. Filtering, IN, BETWEEN, LIKE, IS NULL, ORDER BY, LIMIT, CASE
SELECT name, city, age
FROM students
WHERE (city = 'Mumbai' OR city = 'Delhi') AND age > 20
ORDER BY age DESC, id ASC;

SELECT name, city FROM students WHERE city IN ('Delhi', 'Kochi') ORDER BY id;
SELECT name, age FROM students WHERE age BETWEEN 20 AND 23 ORDER BY age, id;
SELECT name FROM students WHERE name LIKE 'a%' ORDER BY name;
SELECT name FROM students WHERE age IS NOT NULL ORDER BY age DESC, id ASC LIMIT 3;
SELECT id, name, age FROM students WHERE age IS NULL;

SELECT name,
  CASE
    WHEN age IS NULL THEN 'Unknown'
    WHEN age >= 21 THEN '21 or older'
    ELSE 'Under 21'
  END AS age_band
FROM students ORDER BY id;

-- 5. Aggregates, COUNT(DISTINCT), GROUP BY, HAVING (ONLY_FULL_GROUP_BY active)
SELECT COUNT(*) AS enrollments, COUNT(score) AS graded, ROUND(AVG(score), 2) AS mean_score
FROM enrollments;

SELECT COUNT(*) AS total_rows, COUNT(city) AS with_city, COUNT(DISTINCT city) AS unique_cities
FROM students;

SELECT city, COUNT(*) AS students
FROM students
WHERE city IS NOT NULL
GROUP BY city
HAVING COUNT(*) >= 2
ORDER BY city;

-- 6. Joins (INNER, LEFT, RIGHT, CROSS, SELF, NATURAL, FULL OUTER) & Set Ops
SELECT s.name, c.course_name, e.score
FROM students s
INNER JOIN enrollments e ON e.student_id = s.id
INNER JOIN courses c ON c.id = e.course_id
ORDER BY s.id, c.id;

SELECT c.course_name, COUNT(e.student_id) AS enrolled
FROM courses c
LEFT JOIN enrollments e ON e.course_id = c.id
GROUP BY c.id, c.course_name
ORDER BY c.id;

SELECT c.id, c.course_name, e.student_id
FROM enrollments e RIGHT JOIN courses c ON e.course_id = c.id
ORDER BY c.id, e.student_id;

SELECT s1.name AS student_a, s2.name AS student_b, s1.city
FROM students s1
JOIN students s2 ON s1.city = s2.city AND s1.id < s2.id
ORDER BY s1.city, s1.id;

SELECT s.name, c.course_name FROM students s CROSS JOIN courses c ORDER BY s.id, c.id;

SELECT s.id AS student_id, s.name, c.id AS course_id, c.course_name
FROM students s LEFT JOIN enrollments e ON e.student_id = s.id LEFT JOIN courses c ON c.id = e.course_id
UNION
SELECT s.id, s.name, c.id, c.course_name
FROM courses c LEFT JOIN enrollments e ON e.course_id = c.id LEFT JOIN students s ON s.id = e.student_id
ORDER BY student_id, course_id;

SELECT student_id FROM enrollments UNION SELECT student_id FROM payments ORDER BY student_id;
SELECT student_id FROM enrollments UNION ALL SELECT student_id FROM payments ORDER BY student_id;
SELECT student_id FROM enrollments INTERSECT SELECT student_id FROM payments ORDER BY student_id;
SELECT id FROM students EXCEPT SELECT student_id FROM payments ORDER BY id;

-- 7. Subqueries (IN, EXISTS, Scalar, Correlated, ANY/ALL) & Views
SELECT id, name FROM students WHERE id IN (SELECT student_id FROM enrollments WHERE course_id = 101) ORDER BY id;
SELECT s.id, s.name FROM students s WHERE NOT EXISTS (SELECT 1 FROM enrollments e WHERE e.student_id = s.id) ORDER BY s.id;
SELECT student_id, course_id, score FROM enrollments WHERE score > (SELECT AVG(score) FROM enrollments) ORDER BY student_id;

-- Correlated comparison subquery (older than own city average):
SELECT s.name, s.city, s.age
FROM students s
WHERE s.age > (SELECT AVG(s2.age) FROM students s2 WHERE s2.city = s.city)
ORDER BY s.id;

SELECT student_id, course_id, score FROM enrollments
WHERE score > ALL (SELECT score FROM enrollments WHERE course_id = 101 AND score IS NOT NULL);
SELECT student_id, course_id, score FROM enrollments
WHERE score > ANY (SELECT score FROM enrollments WHERE course_id = 101 AND score IS NOT NULL);

-- Simple Updatable View (WITH CHECK OPTION):
CREATE OR REPLACE VIEW v_delhi_students AS
SELECT id, name, email, age, city, joined_on
FROM student_edits
WHERE city = 'Delhi'
WITH CHECK OPTION;
-- Try an invalid update through v_delhi_students (expects Error 1369):
-- UPDATE v_delhi_students SET city = 'Pune' WHERE id = 1;

-- Complex Non-Updatable View + ALTER VIEW + metadata check:
CREATE OR REPLACE ALGORITHM=TEMPTABLE SQL SECURITY INVOKER VIEW v_course_summary AS
SELECT c.id AS course_id, c.course_name, COUNT(e.student_id) AS enrolled_count, ROUND(AVG(e.score), 1) AS avg_score
FROM courses c LEFT JOIN enrollments e ON e.course_id = c.id
GROUP BY c.id, c.course_name;

ALTER ALGORITHM=TEMPTABLE SQL SECURITY INVOKER VIEW v_course_summary AS
SELECT c.id AS course_id, c.course_name, c.fee, COUNT(e.student_id) AS enrolled_count, ROUND(AVG(e.score), 1) AS avg_score
FROM courses c LEFT JOIN enrollments e ON e.course_id = c.id
GROUP BY c.id, c.course_name, c.fee;

SELECT TABLE_NAME, CHECK_OPTION, IS_UPDATABLE FROM information_schema.VIEWS WHERE TABLE_SCHEMA = 'sql_lab';

-- 8. Built-in Functions (Numeric, String, Date, COALESCE) & Reporting Capstone
SELECT id, amount, ROUND(amount * 1.18, 2) AS with_gst, TRUNCATE(amount / 1500, 1) AS trunc_slots,
       CEIL(amount / 1500) AS ceil_slots, MOD(amount, 1500) AS rem
FROM payments ORDER BY id;

SELECT name, UPPER(name) AS upper_name, CHAR_LENGTH(name) AS len,
       COALESCE(NULLIF(city, ''), 'Not supplied') AS city_label
FROM students ORDER BY id;

SELECT name, joined_on, DATE_FORMAT(joined_on, '%d %b %Y') AS formatted_date,
       DATE_ADD(joined_on, INTERVAL 30 DAY) AS review_due,
       DATEDIFF('2026-09-01', joined_on) AS days_since_joining
FROM students ORDER BY id;

-- Capstone Task (verify against Console Step 2.7 'sql-final-lab'):
SELECT c.id, c.course_name, COUNT(e.student_id) AS enrolled,
       COUNT(e.score) AS graded, ROUND(AVG(e.score), 2) AS mean_score
FROM courses c
LEFT JOIN enrollments e ON e.course_id = c.id
GROUP BY c.id, c.course_name
ORDER BY c.id;

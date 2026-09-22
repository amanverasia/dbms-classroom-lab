-- Only the explicitly named Unit 2 lesson objects are reset.
DROP VIEW IF EXISTS course_roster;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS student_edits;
DROP TABLE IF EXISTS course_notes;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS lesson_state;

CREATE TABLE courses (
  id INT PRIMARY KEY, course_name VARCHAR(100) NOT NULL UNIQUE,
  fee DECIMAL(9,2) NOT NULL CHECK (fee >= 0)
) ENGINE=InnoDB;
CREATE TABLE students (
  id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE, age INT CHECK (age >= 16),
  city VARCHAR(60), joined_on DATE NOT NULL
) ENGINE=InnoDB;
CREATE TABLE enrollments (
  student_id INT NOT NULL, course_id INT NOT NULL,
  score DECIMAL(5,2) CHECK (score BETWEEN 0 AND 100),
  PRIMARY KEY (student_id, course_id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (course_id) REFERENCES courses(id)
) ENGINE=InnoDB;
CREATE TABLE payments (
  id INT PRIMARY KEY, student_id INT NOT NULL, amount DECIMAL(9,2) NOT NULL CHECK(amount >= 0),
  paid_on DATE NOT NULL, FOREIGN KEY(student_id) REFERENCES students(id)
) ENGINE=InnoDB;
CREATE TABLE student_edits LIKE students;
CREATE TABLE lesson_state (fixture_version INT NOT NULL);

START TRANSACTION;
INSERT INTO courses VALUES (101,'Cybersecurity',6000),(102,'Database Security',4000),(103,'Python for Security',3000),(104,'Cloud Security',5000);
INSERT INTO students (id,name,email,age,city,joined_on) VALUES
  (1,'Aman','aman@example.com',25,'Delhi','2026-07-01'),
  (2,'Riya','riya@example.com',19,'Mumbai','2026-07-03'),
  (3,'Kabir','kabir@example.com',22,'Delhi','2026-07-10'),
  (4,'Meera','meera@example.com',20,'Kochi','2026-07-15'),
  (5,'Zoya','zoya@example.com',23,'Mumbai','2026-08-01'),
  (6,'Dev','dev@example.com',NULL,NULL,'2026-08-10');
INSERT INTO enrollments VALUES (1,101,88),(1,103,92),(2,102,76),(3,101,65),(5,102,NULL);
INSERT INTO payments VALUES (201,1,3000,'2026-07-01'),(202,1,3000,'2026-07-12'),(203,2,4000,'2026-07-03'),(204,3,2000,'2026-07-10'),(205,5,1000,'2026-08-01');
INSERT INTO student_edits SELECT * FROM students;
INSERT INTO lesson_state VALUES (1);
COMMIT;

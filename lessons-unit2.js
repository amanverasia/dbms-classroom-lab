/* Unit 2 SQL lessons. All examples execute in the separate sql_lab database. */
COURSE.units.find(unit => unit.id === "u2").status = "ready";
COURSE.sections.forEach(section => { section.unit = "u1"; });
COURSE.sections.push(...[
  {
    "id": "sql-language",
    "number": "2.1",
    "title": "SQL & table definitions",
    "minutes": 60,
    "objective": "Classify SQL commands and define a small table with explicit rules.",
    "steps": [
      {
        "id": "sql-start",
        "title": "A question becomes an executable statement.",
        "lead": "Unit 2 builds on the same college story. A separate dataset gives us useful edge cases for SQL.",
        "type": "cards",
        "cards": [
          [
            "Six students",
            "Two have no enrollment. Dev has a missing age and city."
          ],
          [
            "Four courses",
            "Cloud Security has no enrollments."
          ],
          [
            "Five enrollments",
            "One student takes two courses, and one score is still NULL."
          ]
        ],
        "question": "Why deliberately include missing and unmatched records?",
        "answer": "They make query behavior visible: different joins preserve different rows, and aggregates treat NULL values differently.",
        "notes": "These are new sql_lab tables. college_demo and the Unit 1 practical remain separate. Use Reset Unit 2 data to restore only the named Unit 2 objects."
      },
      {
        "id": "sql-families",
        "title": "Commands have different responsibilities.",
        "lead": "The categories help organize SQL; the effect of each command matters more than its label.",
        "type": "cards",
        "cards": [
          [
            "Definition · DDL",
            "CREATE, ALTER and DROP change database objects."
          ],
          [
            "Data · DML",
            "INSERT, UPDATE and DELETE change records. SELECT retrieves data; it is sometimes taught separately as DQL."
          ],
          [
            "Control",
            "GRANT and REVOKE manage privileges. START TRANSACTION, COMMIT and ROLLBACK control transactions."
          ]
        ],
        "question": "Can a later ROLLBACK undo every kind of SQL statement?",
        "answer": "No. Many MariaDB DDL statements cause implicit commits. Transaction control is not a universal undo button.",
        "notes": "Privilege demonstrations belong to Unit 3. The console opens a new connection per request, so do not attempt a multi-request transaction here. Use one persistent client session for that workflow."
      },
      {
        "id": "sql-inspect",
        "title": "Meet the SQL lesson dataset.",
        "lead": "Choose a table and look for records that will make later examples interesting.",
        "type": "query",
        "database": "sql_lab",
        "sql": "SELECT * FROM students ORDER BY id;",
        "expected": "Six students, including Dev with NULL age and city.",
        "question": "Which students might disappear from an inner join to enrollments?",
        "answer": "Meera and Dev have no enrollment records, so neither would appear in that inner join.",
        "notes": "Ask students to predict the result, run the statement, and explain the actual rows. Unit 2 uses its own sql_lab dataset. ",
        "expectedRows": 6,
        "presets": [
          [
            "Students",
            "SELECT * FROM students ORDER BY id;"
          ],
          [
            "Courses",
            "SELECT * FROM courses ORDER BY id;"
          ],
          [
            "Enrollments",
            "SELECT * FROM enrollments ORDER BY student_id, course_id;"
          ],
          [
            "Payments",
            "SELECT * FROM payments ORDER BY id;"
          ]
        ]
      },
      {
        "id": "sql-create",
        "title": "Define a notebook for course observations.",
        "lead": "Run CREATE, then inspect the empty table with DESCRIBE.",
        "type": "query",
        "database": "sql_lab",
        "sql": "CREATE TABLE course_notes (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  course_id INT NOT NULL,\n  note VARCHAR(200) NOT NULL,\n  created_on DATE NOT NULL,\n  FOREIGN KEY (course_id) REFERENCES courses(id)\n);",
        "expected": "The table is created with no records. Repeating CREATE reports that it already exists.",
        "question": "Why is course_id an INT rather than a course name?",
        "answer": "It refers to the course identifier. The foreign key ensures it names an existing course.",
        "notes": "If opened directly, the SQL dataset is already prepared. A repeated CREATE is expected to fail; Reset Unit 2 data removes course_notes for another rehearsal. This reset also restores the other named Unit 2 objects.",
        "inspectSql": "DESCRIBE course_notes;"
      },
      {
        "id": "sql-alter",
        "title": "Change the definition after creation.",
        "lead": "Add a priority column to course_notes; existing rows receive its default.",
        "type": "query",
        "database": "sql_lab",
        "sql": "ALTER TABLE course_notes\nADD COLUMN priority INT NOT NULL DEFAULT 1 CHECK (priority BETWEEN 1 AND 3);",
        "expected": "A new priority column with default 1. Running the same ALTER again fails because the column exists.",
        "question": "Did ALTER insert a new note?",
        "answer": "No. It changed the schema. Default values define how the new column is populated for applicable rows.",
        "notes": "Run the preceding CREATE first. Ask students to distinguish schema from instance again.",
        "inspectSql": "DESCRIBE course_notes;"
      },
      {
        "id": "sql-ddl-check",
        "title": "Checkpoint: identify the change.",
        "lead": "A teacher needs a new column for a course note, then wants to add one note.",
        "type": "quiz",
        "options": [
          "Use INSERT for both operations",
          "Use ALTER for the column, then INSERT for the row",
          "Use SELECT to change the schema"
        ],
        "correct": 1,
        "feedback": "ALTER changes the table definition. INSERT adds a record.",
        "question": "Student task: sketch a books table with an ID, title and positive price.",
        "answer": "One possible definition uses an integer primary key, a required VARCHAR title and a DECIMAL price with CHECK (price > 0). Explain why DECIMAL is appropriate for this price example.",
        "notes": "Recap DDL, DML, access control and transaction control. Let students write a small CREATE statement in the workspace."
      }
    ]
  },
  {
    "id": "sql-editing",
    "number": "2.2",
    "title": "Changing data safely",
    "minutes": 90,
    "objective": "Insert, update and delete selected records while explaining constraint errors and reset scope.",
    "steps": [
      {
        "id": "sql-edit-copy",
        "title": "Use a disposable copy for changes.",
        "lead": "student_edits starts with the six students. Restore edit copy returns just this table to its sample state.",
        "type": "query",
        "database": "sql_lab",
        "sql": "SELECT * FROM student_edits ORDER BY id;",
        "expected": "Six sample records before any editing exercises.",
        "question": "Why use a separate edit table for these demonstrations?",
        "answer": "Later SELECT and JOIN lessons need a stable source dataset. This copy lets us repeat changes without changing those source records.",
        "notes": "Restore edit copy replaces student_edits using the current students source table. It asks for confirmation. The broader Reset Unit 2 data restores the original source dataset too.",
        "expectedRows": 6,
        "editCopy": true
      },
      {
        "id": "sql-insert",
        "title": "Add a record using a column list.",
        "lead": "Let MariaDB generate the ID. Match every value to the named column.",
        "type": "query",
        "database": "sql_lab",
        "sql": "INSERT INTO student_edits (name, email, age, city, joined_on)\nVALUES ('Arun', 'arun.sql@example.com', 21, 'Pune', '2026-08-12');",
        "expected": "One new student. Inspect the table to see the generated ID. Repeating the same email is rejected.",
        "question": "What makes this email different from an ordinary text column?",
        "answer": "The UNIQUE constraint disallows a duplicate value. NOT NULL also requires an email value.",
        "notes": "Ask students to predict the result, run the statement, and explain the actual rows. Unit 2 uses its own sql_lab dataset. ",
        "editCopy": true,
        "inspectSql": "SELECT * FROM student_edits ORDER BY id;"
      },
      {
        "id": "sql-update",
        "title": "Preview the rows you intend to change.",
        "lead": "First run the SELECT preset. Then load and run the UPDATE. Inspect the table afterwards.",
        "type": "query",
        "database": "sql_lab",
        "sql": "SELECT id, name, city FROM student_edits WHERE id = 2;",
        "expected": "The preview identifies Riya. The update changes her city to Pune.",
        "question": "Which part limits the UPDATE to the intended record?",
        "answer": "WHERE id = 2 selects one identified record. Without WHERE, every row would be eligible.",
        "notes": "Ask students to predict the result, run the statement, and explain the actual rows. Unit 2 uses its own sql_lab dataset. ",
        "expectedRows": 1,
        "editCopy": true,
        "inspectSql": "SELECT id, name, city FROM student_edits ORDER BY id;",
        "presets": [
          [
            "Preview",
            "SELECT id, name, city FROM student_edits WHERE id = 2;"
          ],
          [
            "Update Riya",
            "UPDATE student_edits SET city = 'Pune' WHERE id = 2;"
          ]
        ]
      },
      {
        "id": "sql-delete",
        "title": "Delete one row deliberately.",
        "lead": "This example affects only the disposable copy, selecting Dev by ID.",
        "type": "query",
        "database": "sql_lab",
        "sql": "DELETE FROM student_edits WHERE id = 6;",
        "expected": "Dev is removed from student_edits. The source students table still contains him.",
        "question": "Does DELETE remove the table definition?",
        "answer": "No. It removes matching records. The table and its schema remain.",
        "notes": "Ask students to predict the result, run the statement, and explain the actual rows. Unit 2 uses its own sql_lab dataset. ",
        "editCopy": true,
        "inspectSql": "SELECT * FROM student_edits ORDER BY id;"
      },
      {
        "id": "sql-missing-where",
        "title": "What happens when WHERE is missing?",
        "lead": "Predict the row count. This statement intentionally removes every record from the disposable student_edits table.",
        "type": "query",
        "database": "sql_lab",
        "sql": "DELETE FROM student_edits;",
        "expected": "All rows in student_edits are removed. Inspect it, then Restore edit copy to get the six sample rows back.",
        "question": "Will SELECT still know the column names after deleting every row?",
        "answer": "Yes. The schema remains even when the table has zero rows.",
        "notes": "This is the deliberate missing-WHERE example. Point to the table name before running. Restore edit copy is a fixture reset, not a transaction rollback.",
        "editCopy": true,
        "inspectSql": "SELECT * FROM student_edits ORDER BY id;"
      },
      {
        "id": "sql-constraint-errors",
        "title": "Let the database enforce its declared rules.",
        "lead": "These statements deliberately violate UNIQUE, CHECK, NOT NULL or referential integrity.",
        "type": "query",
        "database": "sql_lab",
        "sql": "INSERT INTO student_edits (name,email,age,city,joined_on)\nVALUES ('Duplicate','aman@example.com',25,'Delhi','2026-08-01');",
        "expected": "MariaDB rejects the proposed row. Restore edit copy first if the previous demonstration left it empty.",
        "question": "Is an error always a sign that the database is broken?",
        "answer": "No. These errors prove that declared constraints are being enforced.",
        "notes": "Ask students to predict the result, run the statement, and explain the actual rows. Unit 2 uses its own sql_lab dataset. ",
        "expectedError": 1062,
        "editCopy": true,
        "presets": [
          [
            "Duplicate email",
            "INSERT INTO student_edits (name,email,age,city,joined_on) VALUES ('Duplicate','aman@example.com',25,'Delhi','2026-08-01');"
          ],
          [
            "Invalid age",
            "INSERT INTO student_edits (name,email,age,joined_on) VALUES ('Too young','young.sql@example.com',12,'2026-08-01');"
          ],
          [
            "Missing name",
            "INSERT INTO student_edits (name,email,age,joined_on) VALUES (NULL,'noname.sql@example.com',22,'2026-08-01');"
          ],
          [
            "Missing parent",
            "INSERT INTO enrollments (student_id,course_id,score) VALUES (999,101,50);"
          ]
        ]
      },
      {
        "id": "sql-edit-check",
        "title": "Checkpoint: predict the damage.",
        "lead": "An UPDATE names student_edits but has no WHERE condition.",
        "type": "quiz",
        "options": [
          "Only the first visible row changes",
          "Every row is eligible for the update",
          "The server automatically guesses which student you meant"
        ],
        "correct": 1,
        "feedback": "Without WHERE, the UPDATE applies to all rows in the target table.",
        "question": "Student task: preview and update Kabir's city, then prove which row changed.",
        "answer": "SELECT id, name, city FROM student_edits WHERE id = 3; then UPDATE student_edits SET city = 'Jaipur' WHERE id = 3; finally rerun the SELECT.",
        "notes": "Recap: name the target, preview the condition, apply the change, inspect the result. Restore the edit copy after student practice."
      }
    ]
  },
  {
    "id": "sql-filtering",
    "number": "2.3",
    "title": "Filtering & sorting",
    "minutes": 90,
    "objective": "Build precise row conditions and choose a deterministic order for results.",
    "steps": [
      {
        "id": "sql-projection",
        "title": "Choose the columns you need.",
        "lead": "Projection selects output columns; it does not remove other stored attributes.",
        "type": "query",
        "database": "sql_lab",
        "sql": "SELECT name, age FROM students ORDER BY id;",
        "expected": "Six rows with two columns. Dev's age is NULL.",
        "question": "Would SELECT DISTINCT city return six rows?",
        "answer": "No. It removes repeated city values from the result; one NULL can also appear.",
        "notes": "Ask students to predict the result, run the statement, and explain the actual rows. Unit 2 uses its own sql_lab dataset. ",
        "expectedRows": 6,
        "presets": [
          [
            "Two columns",
            "SELECT name, age FROM students ORDER BY id;"
          ],
          [
            "Distinct cities",
            "SELECT DISTINCT city FROM students ORDER BY city;"
          ]
        ]
      },
      {
        "id": "sql-and-or",
        "title": "Make the grouping of conditions explicit.",
        "lead": "Parentheses make it clear which alternatives belong together.",
        "type": "query",
        "database": "sql_lab",
        "sql": "SELECT name, city, age\nFROM students\nWHERE (city = 'Delhi' OR city = 'Mumbai') AND age > 20\nORDER BY id;",
        "expected": "Aman, Kabir and Zoya.",
        "question": "How would the unparenthesized condition be interpreted?",
        "answer": "AND has higher precedence than OR, so city = 'Delhi' OR city = 'Mumbai' AND age > 20 groups the age condition with Mumbai only.",
        "notes": "With these particular rows both expressions happen to return the same set. Explain the logical distinction using a hypothetical 18-year-old Delhi student; equal output on one dataset does not prove equivalent predicates.",
        "expectedRows": 3
      },
      {
        "id": "sql-in-between",
        "title": "Express a set or a range.",
        "lead": "IN tests membership. BETWEEN includes both endpoints.",
        "type": "query",
        "database": "sql_lab",
        "sql": "SELECT name, age FROM students\nWHERE age BETWEEN 20 AND 23 ORDER BY age, id;",
        "expected": "Meera (20), Kabir (22) and Zoya (23).",
        "question": "Does BETWEEN 20 AND 23 include exactly 20 and exactly 23?",
        "answer": "Yes. It is inclusive at both ends.",
        "notes": "Ask students to predict the result, run the statement, and explain the actual rows. Unit 2 uses its own sql_lab dataset. ",
        "expectedRows": 3,
        "presets": [
          [
            "Age range",
            "SELECT name, age FROM students WHERE age BETWEEN 20 AND 23 ORDER BY age, id;"
          ],
          [
            "City set",
            "SELECT name, city FROM students WHERE city IN ('Delhi','Kochi') ORDER BY id;"
          ]
        ]
      },
      {
        "id": "sql-like",
        "title": "Match a pattern in text.",
        "lead": "Percent means any sequence of characters; underscore means one character.",
        "type": "query",
        "database": "sql_lab",
        "sql": "SELECT name FROM students WHERE name LIKE '%a%' ORDER BY name;",
        "expected": "Aman, Kabir, Meera, Riya and Zoya contain a.",
        "question": "Is LIKE always case-sensitive?",
        "answer": "No. Its behavior depends on the character set and collation. Inspect the database collation instead of assuming a universal rule.",
        "notes": "Ask students to predict the result, run the statement, and explain the actual rows. Unit 2 uses its own sql_lab dataset. ",
        "expectedRows": 5,
        "presets": [
          [
            "Contains a",
            "SELECT name FROM students WHERE name LIKE '%a%' ORDER BY name;"
          ],
          [
            "Exactly three characters",
            "SELECT name FROM students WHERE name LIKE '___' ORDER BY name;"
          ]
        ]
      },
      {
        "id": "sql-null-filter",
        "title": "Test absence with IS NULL.",
        "lead": "Ordinary comparisons do not turn missing values into matches.",
        "type": "query",
        "database": "sql_lab",
        "sql": "SELECT id, name, age, city FROM students WHERE age IS NULL ORDER BY id;",
        "expected": "Dev is the only student whose age is NULL.",
        "question": "Why does age = NULL return no rows?",
        "answer": "That comparison evaluates to unknown, not true. WHERE retains rows whose predicate is true.",
        "notes": "Ask students to predict the result, run the statement, and explain the actual rows. Unit 2 uses its own sql_lab dataset. ",
        "expectedRows": 1,
        "presets": [
          [
            "Correct NULL test",
            "SELECT id, name, age, city FROM students WHERE age IS NULL ORDER BY id;"
          ],
          [
            "Compare to NULL",
            "SELECT name FROM students WHERE age = NULL;"
          ],
          [
            "Known values",
            "SELECT name, age FROM students WHERE age IS NOT NULL ORDER BY id;"
          ]
        ]
      },
      {
        "id": "sql-order-limit",
        "title": "Define which rows come first.",
        "lead": "Use a tie-breaker when a limited result must be reproducible.",
        "type": "query",
        "database": "sql_lab",
        "sql": "SELECT name, age FROM students\nWHERE age IS NOT NULL\nORDER BY age DESC, id ASC LIMIT 3;",
        "expected": "Aman (25), Zoya (23), Kabir (22).",
        "question": "Does LIMIT by itself mean the oldest students?",
        "answer": "No. LIMIT restricts the number of result rows. ORDER BY specifies which rows should come first.",
        "notes": "Ask students to predict the result, run the statement, and explain the actual rows. Unit 2 uses its own sql_lab dataset. ",
        "expectedRows": 3
      },
      {
        "id": "sql-case",
        "title": "Label values without changing the source.",
        "lead": "CASE creates a derived expression in the result. Handle NULL explicitly.",
        "type": "query",
        "database": "sql_lab",
        "sql": "SELECT name, age,\n CASE WHEN age IS NULL THEN 'Unknown'\n      WHEN age >= 21 THEN '21 or older'\n      ELSE 'Under 21' END AS age_band\nFROM students ORDER BY id;",
        "expected": "Six students with a computed age_band, including Unknown for Dev.",
        "question": "Does this add an age_band column to the stored table?",
        "answer": "No. It is a named expression in this query result.",
        "notes": "Ask students to predict the result, run the statement, and explain the actual rows. Unit 2 uses its own sql_lab dataset. ",
        "expectedRows": 6
      },
      {
        "id": "sql-filter-check",
        "title": "Checkpoint: select a reliable top three.",
        "lead": "A report needs the three highest scores. Several students might tie.",
        "type": "quiz",
        "options": [
          "LIMIT 3 with no ORDER BY",
          "ORDER BY score DESC, student_id ASC, course_id ASC LIMIT 3",
          "WHERE score = MAX(score)"
        ],
        "correct": 1,
        "feedback": "An explicit ordering and tie-breakers make the limited result predictable.",
        "question": "Student task: list Mumbai students aged at least 20, alphabetically.",
        "answer": "SELECT name, age FROM students WHERE city = 'Mumbai' AND age >= 20 ORDER BY name, id; returns Zoya in the sample.",
        "notes": "Recap projection, predicates, NULL, patterns, ordering and limits. Explain that source tables remain unchanged by these queries."
      }
    ]
  },
  {
    "id": "sql-groups",
    "number": "2.4",
    "title": "Aggregation & groups",
    "minutes": 75,
    "objective": "Explain what each aggregate counts and distinguish filtering rows from filtering groups.",
    "steps": [
      {
        "id": "sql-count-null",
        "title": "COUNT(*) and COUNT(column) ask different questions.",
        "lead": "One enrollment has no score yet.",
        "type": "query",
        "database": "sql_lab",
        "sql": "SELECT COUNT(*) AS enrollments, COUNT(score) AS graded,\n ROUND(AVG(score),2) AS mean_score, MIN(score) AS lowest, MAX(score) AS highest\nFROM enrollments;",
        "expected": "5 enrollments, 4 graded, mean 80.25, lowest 65, highest 92.",
        "question": "Does the missing score count as zero in AVG(score)?",
        "answer": "No. AVG ignores NULL values. Treating it as zero would be a different calculation.",
        "notes": "Ask students to predict the result, run the statement, and explain the actual rows. Unit 2 uses its own sql_lab dataset. ",
        "expectedRows": 1,
        "expectedValues": [
          [
            5,
            4,
            "80.25",
            "65.00",
            "92.00"
          ]
        ]
      },
      {
        "id": "sql-sum",
        "title": "Summarize real amounts.",
        "lead": "Payments are separate events. Aman has two of them.",
        "type": "query",
        "database": "sql_lab",
        "sql": "SELECT COUNT(*) AS payments, SUM(amount) AS total,\n ROUND(AVG(amount),2) AS mean_payment\nFROM payments;",
        "expected": "5 payments totaling 14,000; average payment 2,800.",
        "question": "Is the average payment the same as the average total paid per student?",
        "answer": "No. Those calculations use different units: payment events versus grouped student totals.",
        "notes": "Ask students to predict the result, run the statement, and explain the actual rows. Unit 2 uses its own sql_lab dataset. ",
        "expectedRows": 1
      },
      {
        "id": "sql-group-by",
        "title": "Build one result row per group.",
        "lead": "Each city becomes a group, including a group for NULL.",
        "type": "query",
        "database": "sql_lab",
        "sql": "SELECT city, COUNT(*) AS students\nFROM students GROUP BY city ORDER BY city;",
        "expected": "NULL: 1, Delhi: 2, Kochi: 1, Mumbai: 2.",
        "question": "Why does the result have fewer rows than the source?",
        "answer": "GROUP BY combines source rows with the same grouping value before computing each group's aggregate.",
        "notes": "Ask students to predict the result, run the statement, and explain the actual rows. Unit 2 uses its own sql_lab dataset. ",
        "expectedRows": 4
      },
      {
        "id": "sql-having",
        "title": "Filter groups after forming them.",
        "lead": "WHERE filters source rows; HAVING can filter aggregate results.",
        "type": "query",
        "database": "sql_lab",
        "sql": "SELECT city, COUNT(*) AS students\nFROM students WHERE city IS NOT NULL\nGROUP BY city HAVING COUNT(*) >= 2 ORDER BY city;",
        "expected": "Delhi and Mumbai, each with two students.",
        "question": "Why is COUNT(*) >= 2 in HAVING rather than WHERE?",
        "answer": "The count is calculated for a group. WHERE is evaluated on source rows before that group result exists.",
        "notes": "Ask students to predict the result, run the statement, and explain the actual rows. Unit 2 uses its own sql_lab dataset. ",
        "expectedRows": 2
      },
      {
        "id": "sql-empty-course-count",
        "title": "Count matches, not the placeholder row.",
        "lead": "A LEFT JOIN keeps Cloud Security even though it has no enrollments.",
        "type": "query",
        "database": "sql_lab",
        "sql": "SELECT c.course_name, COUNT(e.student_id) AS enrolled\nFROM courses c LEFT JOIN enrollments e ON e.course_id = c.id\nGROUP BY c.id, c.course_name ORDER BY c.id;",
        "expected": "Cybersecurity 2, Database Security 2, Python for Security 1, Cloud Security 0.",
        "question": "What would COUNT(*) report for Cloud Security?",
        "answer": "It would count the preserved outer-join row and report 1. COUNT(e.student_id) counts only non-NULL enrollment matches.",
        "notes": "Ask students to predict the result, run the statement, and explain the actual rows. Unit 2 uses its own sql_lab dataset. ",
        "expectedRows": 4
      },
      {
        "id": "sql-group-check",
        "title": "Checkpoint: choose the level of the question.",
        "lead": "Which cities have at least two students whose ages are known?",
        "type": "quiz",
        "options": [
          "WHERE age IS NOT NULL, then GROUP BY city and HAVING COUNT(*) >= 2",
          "HAVING age IS NOT NULL before grouping",
          "WHERE COUNT(*) >= 2"
        ],
        "correct": 0,
        "feedback": "Filter source rows first, then form and filter groups.",
        "question": "Student task: compute total payments by student_id, keeping totals above 2,000.",
        "answer": "SELECT student_id, SUM(amount) AS paid FROM payments GROUP BY student_id HAVING SUM(amount) > 2000 ORDER BY student_id; returns Aman's ID with 6000 and Riya's with 4000.",
        "notes": "Recap the unit of analysis. Every displayed non-aggregate column should be appropriate to the GROUP BY, not an arbitrary value from the group."
      }
    ]
  },
  {
    "id": "sql-joins",
    "number": "2.5",
    "title": "Joins & set operations",
    "minutes": 120,
    "objective": "Predict matching and unmatched rows, and distinguish joins from UNION operations.",
    "steps": [
      {
        "id": "sql-inner",
        "title": "INNER JOIN keeps matching pairs.",
        "lead": "Aman has two matches; Meera and Dev have none.",
        "type": "query",
        "database": "sql_lab",
        "sql": "SELECT s.id, s.name, e.course_id\nFROM students s INNER JOIN enrollments e ON e.student_id = s.id\nORDER BY s.id, e.course_id;",
        "expected": "Five rows: Aman twice, Riya once, Kabir once and Zoya once.",
        "question": "Is it an error for a student name to appear twice?",
        "answer": "No. The result contains one row per matching student-enrollment pair. One student can have several matches.",
        "notes": "Ask students to predict the result, run the statement, and explain the actual rows. Unit 2 uses its own sql_lab dataset. ",
        "expectedRows": 5
      },
      {
        "id": "sql-left",
        "title": "LEFT JOIN also preserves unmatched students.",
        "lead": "Compare the same inputs with a different join.",
        "type": "query",
        "database": "sql_lab",
        "sql": "SELECT s.id, s.name, e.course_id\nFROM students s LEFT JOIN enrollments e ON e.student_id = s.id\nORDER BY s.id, e.course_id;",
        "expected": "Seven rows. Meera and Dev each appear with NULL course_id.",
        "question": "Why are there seven rows when there are six students?",
        "answer": "Aman has two enrollment matches. Each unmatched student contributes one preserved row.",
        "notes": "Ask students to predict the result, run the statement, and explain the actual rows. Unit 2 uses its own sql_lab dataset. ",
        "expectedRows": 7,
        "presets": [
          [
            "Left join",
            "SELECT s.id, s.name, e.course_id FROM students s LEFT JOIN enrollments e ON e.student_id=s.id ORDER BY s.id,e.course_id;"
          ],
          [
            "Unmatched only",
            "SELECT s.id, s.name FROM students s LEFT JOIN enrollments e ON e.student_id=s.id WHERE e.student_id IS NULL ORDER BY s.id;"
          ]
        ]
      },
      {
        "id": "sql-right",
        "title": "RIGHT JOIN preserves the right-hand courses.",
        "lead": "Cloud Security should remain visible even with no enrolled students.",
        "type": "query",
        "database": "sql_lab",
        "sql": "SELECT c.id, c.course_name, e.student_id\nFROM enrollments e RIGHT JOIN courses c ON e.course_id = c.id\nORDER BY c.id, e.student_id;",
        "expected": "Six rows. Cloud Security appears with a NULL student_id.",
        "question": "Could you express the same result with a LEFT JOIN?",
        "answer": "Yes. Swap the table order: courses LEFT JOIN enrollments using the same matching condition.",
        "notes": "Ask students to predict the result, run the statement, and explain the actual rows. Unit 2 uses its own sql_lab dataset. ",
        "expectedRows": 6
      },
      {
        "id": "sql-on-where",
        "title": "A WHERE condition can remove outer-join rows.",
        "lead": "Keep every course, but include only enrollments scoring at least 80. Put that matching requirement in ON.",
        "type": "query",
        "database": "sql_lab",
        "sql": "SELECT c.course_name, e.student_id, e.score\nFROM courses c LEFT JOIN enrollments e\n ON e.course_id = c.id AND e.score >= 80\nORDER BY c.id, e.student_id;",
        "expected": "Four rows, one per course in this example. Database Security and Cloud Security have NULL match fields.",
        "question": "What changes if e.score >= 80 moves into WHERE?",
        "answer": "The NULL-extended rows fail the condition, so only two matching rows remain. The placement changes which courses survive.",
        "notes": "Ask students to predict the result, run the statement, and explain the actual rows. Unit 2 uses its own sql_lab dataset. ",
        "expectedRows": 4,
        "presets": [
          [
            "Condition in ON",
            "SELECT c.course_name, e.student_id, e.score FROM courses c LEFT JOIN enrollments e ON e.course_id=c.id AND e.score>=80 ORDER BY c.id,e.student_id;"
          ],
          [
            "Condition in WHERE",
            "SELECT c.course_name, e.student_id, e.score FROM courses c LEFT JOIN enrollments e ON e.course_id=c.id WHERE e.score>=80 ORDER BY c.id,e.student_id;"
          ]
        ]
      },
      {
        "id": "sql-three-tables",
        "title": "Follow both keys through the enrollment table.",
        "lead": "Each result row identifies a student taking a named course.",
        "type": "query",
        "database": "sql_lab",
        "sql": "SELECT s.name, c.course_name, e.score\nFROM students s\nJOIN enrollments e ON e.student_id = s.id\nJOIN courses c ON c.id = e.course_id\nORDER BY s.id, c.id;",
        "expected": "Five enrollment rows, including Zoya's missing score.",
        "question": "What makes the enrollment table useful here?",
        "answer": "It connects the many-to-many relationship and holds relationship-specific data such as the score.",
        "notes": "Ask students to predict the result, run the statement, and explain the actual rows. Unit 2 uses its own sql_lab dataset. ",
        "expectedRows": 5
      },
      {
        "id": "sql-union",
        "title": "UNION stacks compatible results.",
        "lead": "Compare duplicate removal with duplicate preservation. These queries both select one city column.",
        "type": "query",
        "database": "sql_lab",
        "sql": "SELECT city FROM students WHERE city = 'Delhi'\nUNION\nSELECT city FROM students WHERE city = 'Mumbai'\nORDER BY city;",
        "expected": "UNION returns two rows. UNION ALL returns four because each city occurs twice.",
        "question": "How is this different from a JOIN?",
        "answer": "A join combines matching records across columns. UNION combines compatible result sets vertically; the selected column counts and types must be compatible.",
        "notes": "Ask students to predict the result, run the statement, and explain the actual rows. Unit 2 uses its own sql_lab dataset. ",
        "expectedRows": 2,
        "presets": [
          [
            "UNION",
            "SELECT city FROM students WHERE city='Delhi' UNION SELECT city FROM students WHERE city='Mumbai' ORDER BY city;"
          ],
          [
            "UNION ALL",
            "SELECT city FROM students WHERE city='Delhi' UNION ALL SELECT city FROM students WHERE city='Mumbai' ORDER BY city;"
          ]
        ]
      },
      {
        "id": "sql-join-check",
        "title": "Checkpoint: preserve the empty course.",
        "lead": "A report must list every course, including courses with zero enrollments.",
        "type": "quiz",
        "options": [
          "Start from enrollments with an INNER JOIN",
          "Start from courses with a LEFT JOIN to enrollments",
          "Use UNION to match course IDs"
        ],
        "correct": 1,
        "feedback": "The courses table must be on the preserved side of the outer join.",
        "question": "Student task: list students with no enrollments.",
        "answer": "SELECT s.id, s.name FROM students s LEFT JOIN enrollments e ON e.student_id=s.id WHERE e.student_id IS NULL ORDER BY s.id; returns Meera and Dev.",
        "notes": "Recap matching pairs, multiplicity, preserved sides, NULL-extended rows, ON versus WHERE and UNION. Ask students to predict counts before running."
      }
    ]
  },
  {
    "id": "sql-subqueries",
    "number": "2.6",
    "title": "Subqueries & views",
    "minutes": 90,
    "objective": "Use nested queries and views to express membership, existence and reusable reports.",
    "steps": [
      {
        "id": "sql-in-subquery",
        "title": "Use another result as a membership set.",
        "lead": "Find students enrolled in course 101.",
        "type": "query",
        "database": "sql_lab",
        "sql": "SELECT id, name FROM students\nWHERE id IN (SELECT student_id FROM enrollments WHERE course_id = 101)\nORDER BY id;",
        "expected": "Aman and Kabir.",
        "question": "Would a duplicated student ID inside the IN result duplicate the outer student row?",
        "answer": "No. IN tests membership. It does not multiply the outer rows like a join can.",
        "notes": "Ask students to predict the result, run the statement, and explain the actual rows. Unit 2 uses its own sql_lab dataset. ",
        "expectedRows": 2
      },
      {
        "id": "sql-correlated",
        "title": "A correlated subquery refers to the outer row.",
        "lead": "EXISTS asks whether at least one matching enrollment can be found for each student.",
        "type": "query",
        "database": "sql_lab",
        "sql": "SELECT s.id, s.name FROM students s\nWHERE EXISTS (SELECT 1 FROM enrollments e WHERE e.student_id = s.id)\nORDER BY s.id;",
        "expected": "Aman, Riya, Kabir and Zoya. NOT EXISTS returns Meera and Dev.",
        "question": "Does SELECT 1 mean “find student 1”?",
        "answer": "No. EXISTS only needs to know whether a row exists. The selected value is not the criterion; the correlated WHERE condition is.",
        "notes": "Ask students to predict the result, run the statement, and explain the actual rows. Unit 2 uses its own sql_lab dataset. ",
        "expectedRows": 4,
        "presets": [
          [
            "EXISTS",
            "SELECT s.id,s.name FROM students s WHERE EXISTS (SELECT 1 FROM enrollments e WHERE e.student_id=s.id) ORDER BY s.id;"
          ],
          [
            "NOT EXISTS",
            "SELECT s.id,s.name FROM students s WHERE NOT EXISTS (SELECT 1 FROM enrollments e WHERE e.student_id=s.id) ORDER BY s.id;"
          ]
        ]
      },
      {
        "id": "sql-scalar",
        "title": "Compare a value with one calculated answer.",
        "lead": "Find enrollments scoring above the overall average of known scores.",
        "type": "query",
        "database": "sql_lab",
        "sql": "SELECT student_id, course_id, score FROM enrollments\nWHERE score > (SELECT AVG(score) FROM enrollments)\nORDER BY student_id, course_id;",
        "expected": "Two rows: Aman's scores 88 and 92, above the mean 80.25.",
        "question": "What must a scalar subquery return?",
        "answer": "At most one row and one column when used as a scalar value. More than one row is an error; no rows produce NULL.",
        "notes": "Ask students to predict the result, run the statement, and explain the actual rows. Unit 2 uses its own sql_lab dataset. ",
        "expectedRows": 2
      },
      {
        "id": "sql-any-all",
        "title": "ANY and ALL quantify comparisons.",
        "lead": "Compare each known score to the known scores in course 101: 88 and 65.",
        "type": "query",
        "database": "sql_lab",
        "sql": "SELECT student_id, course_id, score FROM enrollments\nWHERE score > ALL (SELECT score FROM enrollments WHERE course_id=101 AND score IS NOT NULL)\nORDER BY student_id, course_id;",
        "expected": "> ALL returns only 92. > ANY returns 88, 92 and 76.",
        "question": "Does > ANY mean greater than every value?",
        "answer": "No. It needs at least one true comparison. ALL requires all comparisons to be true. Empty sets and NULLs have special logical behavior, so the known, nonempty set here is deliberate.",
        "notes": "Discuss that > ALL over an empty subquery is true and > ANY over it is false. Do not substitute MIN/MAX blindly when empty sets or NULL values are possible.",
        "expectedRows": 1,
        "presets": [
          [
            "Greater than ALL",
            "SELECT student_id,course_id,score FROM enrollments WHERE score > ALL (SELECT score FROM enrollments WHERE course_id=101 AND score IS NOT NULL) ORDER BY student_id,course_id;"
          ],
          [
            "Greater than ANY",
            "SELECT student_id,course_id,score FROM enrollments WHERE score > ANY (SELECT score FROM enrollments WHERE course_id=101 AND score IS NOT NULL) ORDER BY student_id,course_id;"
          ]
        ]
      },
      {
        "id": "sql-create-view",
        "title": "Give a reusable query a name.",
        "lead": "Create course_roster, then inspect it as you would a table.",
        "type": "query",
        "database": "sql_lab",
        "sql": "CREATE OR REPLACE SQL SECURITY INVOKER VIEW course_roster AS\nSELECT s.id AS student_id, s.name, c.id AS course_id, c.course_name, e.score\nFROM students s\nJOIN enrollments e ON e.student_id=s.id\nJOIN courses c ON c.id=e.course_id;",
        "expected": "The view is defined. Inspecting it returns five rows from the underlying tables.",
        "question": "Is the view a separate stored copy of these five records?",
        "answer": "No. This ordinary view is a saved query definition. Its results reflect the underlying data when queried.",
        "notes": "SQL SECURITY INVOKER means the caller's privileges are used. Detailed security behavior comes in Unit 3.",
        "inspectSql": "SELECT * FROM course_roster ORDER BY student_id, course_id;"
      },
      {
        "id": "sql-subquery-check",
        "title": "Checkpoint: a student has no enrollments.",
        "lead": "Which pattern directly expresses “there is no matching enrollment for this student”?",
        "type": "quiz",
        "options": [
          "NOT EXISTS with a correlated enrollment condition",
          "EXISTS without a matching condition",
          "COUNT(*) in an unrelated table"
        ],
        "correct": 0,
        "feedback": "NOT EXISTS tests the absence of a matching row for the particular outer student.",
        "question": "Student task: use the course_roster view to list scores of at least 80.",
        "answer": "SELECT name, course_name, score FROM course_roster WHERE score >= 80 ORDER BY student_id, course_id; returns Aman's two graded enrollments.",
        "notes": "Recap membership, existence, scalar values, quantified comparisons and views. Mention the NOT IN / NULL trap and use NOT EXISTS when absence is intended."
      }
    ]
  },
  {
    "id": "sql-functions",
    "number": "2.7",
    "title": "Functions & reporting lab",
    "minutes": 75,
    "objective": "Use expressions and functions to build a report whose meaning and row counts are clear.",
    "steps": [
      {
        "id": "sql-text-functions",
        "title": "Transform text in the result.",
        "lead": "UPPER, CHAR_LENGTH and CONCAT create useful presentation values.",
        "type": "query",
        "database": "sql_lab",
        "sql": "SELECT name, UPPER(name) AS uppercase_name, CHAR_LENGTH(name) AS characters,\n CONCAT(name, ' <', email, '>') AS contact\nFROM students ORDER BY id;",
        "expected": "Six rows containing the original name and derived values.",
        "question": "Did UPPER(name) permanently capitalize the stored names?",
        "answer": "No. A SELECT expression changes the returned value, not the stored column.",
        "notes": "Ask students to predict the result, run the statement, and explain the actual rows. Unit 2 uses its own sql_lab dataset. ",
        "expectedRows": 6
      },
      {
        "id": "sql-date-functions",
        "title": "Use a fixed date for a reproducible demonstration.",
        "lead": "Compute the time between joining and a chosen report date.",
        "type": "query",
        "database": "sql_lab",
        "sql": "SELECT name, joined_on, DATE_FORMAT(joined_on, '%d %b %Y') AS joined,\n DATEDIFF('2026-09-01', joined_on) AS days_since_joining\nFROM students ORDER BY id;",
        "expected": "Aman: 62 days; Riya: 60; Kabir: 53; Meera: 48; Zoya: 31; Dev: 22.",
        "question": "Why is the report date a literal instead of CURRENT_DATE in this example?",
        "answer": "The same query returns the same demonstration values in every class. CURRENT_DATE would intentionally depend on when it runs.",
        "notes": "Ask students to predict the result, run the statement, and explain the actual rows. Unit 2 uses its own sql_lab dataset. ",
        "expectedRows": 6
      },
      {
        "id": "sql-coalesce",
        "title": "Make missing data explicit in a report.",
        "lead": "COALESCE chooses the first non-NULL argument.",
        "type": "query",
        "database": "sql_lab",
        "sql": "SELECT name, COALESCE(city, 'Not supplied') AS city_label\nFROM students ORDER BY id;",
        "expected": "Dev displays Not supplied. The stored city value is still NULL.",
        "question": "Would COALESCE(city, 'Unknown') replace an empty string too?",
        "answer": "No. An empty string is not NULL. Decide separately how empty strings should be handled.",
        "notes": "Ask students to predict the result, run the statement, and explain the actual rows. Unit 2 uses its own sql_lab dataset. ",
        "expectedRows": 6
      },
      {
        "id": "sql-payment-report",
        "title": "Join a student to an already-grouped payment result.",
        "lead": "Aggregate payment events first, then connect one total to each student.",
        "type": "query",
        "database": "sql_lab",
        "sql": "SELECT s.id, s.name, COALESCE(p.total_paid,0) AS total_paid\nFROM students s LEFT JOIN\n (SELECT student_id, SUM(amount) AS total_paid FROM payments GROUP BY student_id) p\n ON p.student_id=s.id\nORDER BY s.id;",
        "expected": "Six rows: Aman 6000, Riya 4000, Kabir 2000, Meera 0, Zoya 1000, Dev 0.",
        "question": "Why not join payments and enrollments before summing amounts?",
        "answer": "Both can have multiple rows per student. Joining the raw tables can multiply payment rows and overcount totals.",
        "notes": "Explain why showing zero is a reporting choice for no matching payments. It does not prove that no debt exists; fees and billing policy require additional rules.",
        "expectedRows": 6
      },
      {
        "id": "sql-final-lab",
        "title": "Build a course performance report.",
        "lead": "Work in pairs: list every course, enrollment count, number of known scores and average known score. Keep courses with zero enrollments.",
        "type": "challenge",
        "database": "sql_lab",
        "question": "Use aliases, an outer join, grouping and a predictable course-ID order. Explain how NULL changes the counts.",
        "answer": "SELECT c.id, c.course_name, COUNT(e.student_id) AS enrolled, COUNT(e.score) AS graded, ROUND(AVG(e.score),2) AS mean_score\nFROM courses c LEFT JOIN enrollments e ON e.course_id=c.id\nGROUP BY c.id,c.course_name ORDER BY c.id;\n\nExpected: Cybersecurity → 2 enrolled, 2 graded, 76.50 mean; Database Security → 2, 1, 76.00; Python for Security → 1, 1, 92.00; Cloud Security → 0, 0, NULL.",
        "notes": "Let students build and explain the query before revealing the answer. A NULL average for an empty group is different from a score of zero. Have them verify the report against the individual enrollment rows."
      },
      {
        "id": "sql-complete",
        "title": "Unit 2 complete. Explain the result, not just the syntax.",
        "lead": "You can now define data, change selected rows and build reports across related tables.",
        "type": "quiz",
        "options": [
          "A correct query is one that merely runs without an error",
          "A correct query also answers the intended question with the right rows and meaning",
          "Every report should begin with SELECT *"
        ],
        "correct": 1,
        "feedback": "Syntax, data rules, row counts and the meaning of the result all matter.",
        "question": "Exit ticket: explain one difference between WHERE and HAVING, then one difference between INNER and LEFT JOIN.",
        "answer": "WHERE filters source rows; HAVING filters group results. INNER JOIN keeps matches; LEFT JOIN additionally preserves unmatched left rows with NULLs on the right.",
        "notes": "Next milestone: Unit 3 security and administration. The course menu keeps Units 3 and 4 marked as planned."
      }
    ]
  }
].map(section => ({ ...section, unit: "u2" })));

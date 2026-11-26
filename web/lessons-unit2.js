/* Unit 2 SQL Concepts (MSCNS406). Executes in the isolated sql_lab database. */
COURSE.sections.push(
  {
    id: 'sql-language', unit: 'u2', number: '2.1', title: 'SQL families, DDL & DCL', minutes: 60,
    objective: 'Classify DDL, DML, DCL, and TCL commands; create, alter, truncate, drop tables; and inspect privileges.',
    steps: [
      {
        id: 'sql-start',
        title: 'A question becomes an executable statement.',
        lead: 'Unit 2 runs against sql_lab, a dataset deliberately crafted with missing values and unmatched rows.',
        type: 'cards',
        cards: [
          ['Six students', 'Meera and Dev have zero enrollments. Dev has NULL age and NULL city.'],
          ['Four courses', 'Cloud Security (104) has zero enrolled students.'],
          ['Five enrollments & payments', 'Aman takes two courses; Zoya’s score is NULL; payments record multiple installments.']
        ],
        question: 'Why include NULL scores and unmatched students/courses on purpose?',
        answer: 'Edge cases make INNER vs OUTER joins, COUNT(*) vs COUNT(col), and NULL comparisons visibly obvious instead of hiding bugs.',
        notes: 'Introduce sql_lab as distinct from Unit 1 college_demo; point out the Reset Unit 2 data button for repeatable demos.'
      },
      {
        id: 'sql-families',
        title: 'SQL sub-languages: DDL, DML, DCL, and TCL.',
        lead: 'Commands group by what they act upon: database structure, stored rows, permissions, or transactions.',
        type: 'cards',
        cards: [
          ['DDL (Definition)', 'CREATE, ALTER, DROP, TRUNCATE define or reshape tables, views, and indexes.'],
          ['DML (Manipulation & Query)', 'INSERT, UPDATE, DELETE modify data; SELECT (sometimes called DQL) retrieves rows.'],
          ['DCL & TCL (Control)', 'GRANT and REVOKE govern access (DCL); START TRANSACTION, COMMIT, ROLLBACK govern atomicity (TCL).']
        ],
        question: 'Can ROLLBACK undo a DROP TABLE or CREATE TABLE statement in MariaDB?',
        answer: 'No. MariaDB DDL statements (CREATE, ALTER, DROP, TRUNCATE) issue an implicit COMMIT before running.',
        notes: 'Mention that DCL commands run with GRANTs inspected next, and full user/role provisioning lives in Unit 3.'
      },
      {
        id: 'sql-datatypes-ddl-compare',
        title: 'Core SQL sub-languages & MariaDB data types.',
        lead: 'Choosing the right column type prevents storage waste, rounding errors, and broken comparisons before any query runs.',
        type: 'comparison',
        columns: ['Topic / Type', 'Syntax & Storage', 'When to choose it'],
        rows: [
          ['INT / BIGINT', '4-byte / 8-byte exact integer', 'Primary keys, ages, quantities, counters'],
          ['DECIMAL(p, s)', 'Exact fixed-point number (e.g. DECIMAL(9,2))', 'Fees, salaries, ledger balances—never FLOAT for money'],
          ['VARCHAR(n) vs CHAR(n)', 'Variable-length vs fixed-length padded text', 'VARCHAR for names/emails; CHAR only for fixed codes (e.g. ISO codes)'],
          ['DATE / DATETIME', 'YYYY-MM-DD / YYYY-MM-DD HH:MM:SS', 'Birth dates, joining dates, audit timestamps'],
          ['ENUM(\'a\',\'b\')', 'Constrained string set', 'Small closed state sets such as enrollment status'],
          ['DDL / DML / DCL / TCL', 'Structure / Rows / Access / Transactions', 'CREATE+ALTER+DROP+TRUNCATE | SELECT+INSERT+UPDATE+DELETE | GRANT+REVOKE | COMMIT+ROLLBACK']
        ],
        question: 'Why does DECIMAL(9,2) prevent silent ₹0.01 rounding bugs compared to FLOAT or DOUBLE?',
        answer: 'FLOAT/DOUBLE use binary floating-point approximations (0.1 + 0.2 != 0.3 exactly), whereas DECIMAL stores exact base-10 digits.',
        notes: 'Walk through the data types table quickly during Unit 2 theory lecture before moving into live DDL tables.'
      },
      {
        id: 'sql-inspect',
        title: 'Inspect the four Unit 2 tables.',
        lead: 'Run the presets to familiarize students with students, courses, enrollments, and payments before querying.',
        type: 'query',
        database: 'sql_lab',
        sql: 'SELECT * FROM students ORDER BY id;',
        expected: 'Six students including Dev (id 6) with NULL age and city.',
        question: 'Which two students will vanish when we INNER JOIN students to enrollments?',
        answer: 'Meera (4) and Dev (6) have no matching rows in enrollments.',
        notes: 'Click through all four presets briefly so students recognize the IDs 1–6 and course IDs 101–104.',
        expectedRows: 6,
        presets: [
          ['Students', 'SELECT * FROM students ORDER BY id;'],
          ['Courses', 'SELECT * FROM courses ORDER BY id;'],
          ['Enrollments', 'SELECT * FROM enrollments ORDER BY student_id, course_id;'],
          ['Payments', 'SELECT * FROM payments ORDER BY id;']
        ]
      },
      {
        id: 'sql-create',
        title: 'Define a table with a foreign key.',
        lead: 'Create course_notes referencing courses(id), then inspect its metadata with Inspect result.',
        type: 'query',
        database: 'sql_lab',
        sql: 'CREATE TABLE course_notes (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  course_id INT NOT NULL,\n  note VARCHAR(200) NOT NULL,\n  created_on DATE NOT NULL,\n  FOREIGN KEY (course_id) REFERENCES courses(id)\n);',
        expected: 'Table created empty. Re-running without Reset Unit 2 data reports table already exists.',
        question: 'Why store course_id INT instead of duplicating the course name text?',
        answer: 'Referencing courses(id) guarantees valid courses and prevents inconsistent course spellings.',
        notes: 'Run CREATE, then press Inspect result (DESCRIBE course_notes) to verify the MUL key marker on course_id.',
        inspectSql: 'DESCRIBE course_notes;'
      },
      {
        id: 'sql-alter',
        title: 'Alter structure after creation (ADD, MODIFY, DROP).',
        lead: 'Use ALTER TABLE to add a column with a constraint, widen a column type, or drop a column.',
        type: 'query',
        database: 'sql_lab',
        prepare: 'prepare-course-notes',
        sql: 'ALTER TABLE course_notes\nADD COLUMN priority INT NOT NULL DEFAULT 1 CHECK (priority BETWEEN 1 AND 3);',
        expected: 'Adds priority INT DEFAULT 1. Use presets to inspect widening note or dropping priority.',
        question: 'Does ALTER TABLE ADD COLUMN insert new rows into course_notes?',
        answer: 'No. It alters the table schema and assigns the DEFAULT value to existing rows (if any).',
        notes: 'Click Prepare example if jumping straight to this step so course_notes exists cleanly without priority before running ALTER.',
        inspectSql: 'DESCRIBE course_notes;',
        presets: [
          ['1. Modify note length', 'ALTER TABLE course_notes MODIFY COLUMN note VARCHAR(400) NOT NULL;'],
          ['2. Drop priority column', 'ALTER TABLE course_notes DROP COLUMN priority;'],
          ['3. Re-add priority column', 'ALTER TABLE course_notes ADD COLUMN priority INT NOT NULL DEFAULT 1 CHECK (priority BETWEEN 1 AND 3);']
        ]
      },
      {
        id: 'sql-delete-truncate-drop-theory',
        title: 'Theory compare: DELETE vs TRUNCATE vs DROP.',
        lead: 'One of the highest-frequency exam questions: how do these three removal commands differ?',
        type: 'comparison',
        columns: ['Property', 'DELETE', 'TRUNCATE', 'DROP'],
        rows: [
          ['SQL Category', 'DML (Data Manipulation)', 'DDL (Data Definition)', 'DDL (Data Definition)'],
          ['WHERE clause?', 'Yes (removes selected rows)', 'No (always removes ALL rows)', 'No (removes entire table object)'],
          ['Table schema kept?', 'Yes', 'Yes (empty table remains)', 'No (definition & indexes gone)'],
          ['AUTO_INCREMENT reset?', 'No (continues from last counter)', 'Yes (resets back to 1)', 'N/A (table no longer exists)'],
          ['Rollback inside TX?', 'Yes (if autocommit=0 / START TX)', 'No (implicit COMMIT in MariaDB)', 'No (implicit COMMIT in MariaDB)'],
          ['Speed on big tables', 'Row-by-row undo logging (slower)', 'Deallocates pages directly (very fast)', 'Removes metadata + .ibd file fast']
        ],
        question: 'If you accidentally run TRUNCATE TABLE fee_ledger inside a transaction, can ROLLBACK bring the rows back in MariaDB?',
        answer: 'No! TRUNCATE is DDL in MariaDB and triggers an implicit COMMIT, so only a backup + binary log restore can recover the data.',
        notes: 'Pause on this slide in theory lecture—students routinely assume TRUNCATE can be rolled back in MariaDB (unlike PostgreSQL).'
      },
      {
        id: 'sql-drop-truncate',
        title: 'TRUNCATE vs DELETE vs DROP.',
        lead: 'Compare emptying a table fast (TRUNCATE) with deleting structure altogether (DROP).',
        type: 'query',
        database: 'sql_lab',
        prepare: 'prepare-course-notes',
        sql: "INSERT INTO course_notes (course_id, note, created_on) VALUES (101, 'Check firewall lab', '2026-08-01');",
        presets: [
          ['1. Seed a note', "INSERT INTO course_notes (course_id, note, created_on) VALUES (101, 'Check firewall lab', '2026-08-01');"],
          ['2. TRUNCATE rows', 'TRUNCATE TABLE course_notes;'],
          ['3. DROP table', 'DROP TABLE IF EXISTS course_notes;']
        ],
        expected: 'TRUNCATE removes all rows and resets AUTO_INCREMENT while keeping the empty table; DROP removes the entire definition.',
        question: 'Which command keeps the schema intact and resets AUTO_INCREMENT back to 1?',
        answer: 'TRUNCATE TABLE empties the table and resets AUTO_INCREMENT; DROP TABLE destroys both data and schema.',
        notes: 'Run preset 1, then Inspect result (shows course_notes), then TRUNCATE, then DROP and Inspect result again (returns 0 tables). Remind students TRUNCATE is DDL and cannot be rolled back.',
        inspectSql: "SHOW TABLES LIKE 'course_notes';"
      },
      {
        id: 'sql-dcl-preview',
        title: 'Inspect DCL privileges in action.',
        lead: 'DCL commands (GRANT / REVOKE) define what each user account is permitted to do.',
        type: 'query',
        database: 'college_demo',
        persona: 'dba_lab',
        sql: "SHOW GRANTS FOR 'reporting'@'%';",
        presets: [
          ['Reporting grants', "SHOW GRANTS FOR 'reporting'@'%';"],
          ['Web app grants', "SHOW GRANTS FOR 'web_app'@'%';"],
          ['Console grants', "SHOW GRANTS FOR 'classroom_console'@'%';"]
        ],
        expected: 'Shows exact GRANT statements stored in MariaDB for each account.',
        question: 'Notice reporting only has SELECT. What happens if reporting attempts an INSERT?',
        answer: 'MariaDB rejects the statement with Error 1142 (INSERT command denied to user reporting).',
        notes: 'Point out that this step switches persona automatically to dba_lab just to read SHOW GRANTS for other users; Unit 3 practices GRANT/REVOKE directly.'
      },
      {
        id: 'sql-ddl-check',
        title: 'Checkpoint: pick the right SQL family.',
        lead: 'An instructor needs to add a room column to a table, populate it, and grant a TA read-only access.',
        type: 'quiz',
        options: [
          'Use INSERT for the column, SELECT for rows, DROP for access',
          'Use ALTER (DDL) for the column, UPDATE/INSERT (DML) for data, and GRANT (DCL) for access',
          'Use TRUNCATE for all three tasks'
        ],
        correct: 1,
        feedback: 'ALTER reshapes structure (DDL), UPDATE/INSERT changes rows (DML), and GRANT assigns permissions (DCL).',
        question: 'Student task: sketch a CREATE TABLE for books (id PK, title NOT NULL, price > 0).',
        answer: "CREATE TABLE books (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  title VARCHAR(200) NOT NULL,\n  price DECIMAL(8,2) NOT NULL CHECK (price > 0)\n);",
        notes: 'Ask students why DECIMAL(8,2) beats FLOAT for currency values.'
      }
    ]
  },
  {
    id: 'sql-editing', unit: 'u2', number: '2.2', title: 'DML & all five constraints', minutes: 90,
    objective: 'Insert, update, and delete safely using WHERE; observe PRIMARY KEY, FOREIGN KEY, UNIQUE, NOT NULL, and CHECK violations.',
    steps: [
      {
        id: 'sql-constraints-theory',
        title: 'Theory: the five SQL integrity constraints (+ DEFAULT).',
        lead: 'Constraints declare business promises right inside CREATE TABLE / ALTER TABLE so the DBMS rejects bad data automatically.',
        type: 'comparison',
        columns: ['Constraint', 'Rule Enforced', 'NULL Allowed? & Limit', 'Example Syntax'],
        rows: [
          ['PRIMARY KEY', 'Uniquely identifies each row (Entity Integrity)', 'Never NULL · 1 per table (can be composite)', 'id INT PRIMARY KEY AUTO_INCREMENT'],
          ['FOREIGN KEY', 'Matches existing parent key (Referential Integrity)', 'Yes unless NOT NULL · Many per table', 'FOREIGN KEY (course_id) REFERENCES courses(id)'],
          ['UNIQUE', 'Prevents duplicate non-NULL values (Alternate Key)', 'Yes (multiple NULLs allowed in SQL)', 'email VARCHAR(120) UNIQUE'],
          ['NOT NULL', 'Forbids missing/unknown values in column', 'Never NULL · Column-level only', 'name VARCHAR(100) NOT NULL'],
          ['CHECK', 'Boolean condition value must satisfy', 'Passes if UNKNOWN (pair with NOT NULL)', 'age INT CHECK (age >= 16)'],
          ['DEFAULT', 'Supplies fallback value when column omitted', 'Used only if column omitted on INSERT', 'status VARCHAR(20) DEFAULT \'active\'']
        ],
        question: 'If a column has age INT CHECK (age >= 16) WITHOUT NOT NULL, will MariaDB accept INSERT with age = NULL?',
        answer: 'Yes! Because NULL >= 16 evaluates to UNKNOWN (not FALSE), SQL CHECK constraints accept NULL unless NOT NULL is also declared.',
        notes: 'Use this matrix during theory lecture before switching to student_edits and triggering all 5 constraint errors live.'
      },
      {
        id: 'sql-edit-copy',
        title: 'Use a disposable copy for DML edits.',
        lead: 'student_edits mirrors students so mutations never corrupt the source tables needed by later units.',
        type: 'query',
        database: 'sql_lab',
        editCopy: true,
        sql: 'SELECT * FROM student_edits ORDER BY id;',
        expected: 'Six baseline rows copied from sql_lab.students.',
        question: 'Why keep source students untouched while practicing UPDATE and DELETE?',
        answer: 'So join and aggregation lessons in Sections 2.4–2.7 always produce deterministic outputs.',
        notes: 'Point out the "Restore edit copy" button (only resets student_edits) vs "Reset Unit 2 data".',
        expectedRows: 6
      },
      {
        id: 'sql-insert',
        title: 'Add a record using an explicit column list.',
        lead: 'Specify columns explicitly so schema order changes cannot break your INSERT.',
        type: 'query',
        database: 'sql_lab',
        editCopy: true,
        prepare: 'reset-edit-copy',
        sql: "INSERT INTO student_edits (name, email, age, city, joined_on)\nVALUES ('Arun', 'arun.sql@example.com', 21, 'Pune', '2026-08-12');",
        expected: '1 row affected; id 7 is auto-generated.',
        question: 'Why will clicking Run a second time fail immediately?',
        answer: 'The email column has a UNIQUE constraint, so inserting arun.sql@example.com again throws Error 1062.',
        notes: 'Click Inspect result after inserting to show Arun with id 7.',
        inspectSql: 'SELECT * FROM student_edits ORDER BY id;'
      },
      {
        id: 'sql-update',
        title: 'Always preview WHERE before running UPDATE.',
        lead: 'Test your WHERE filter with SELECT first, run the UPDATE, then inspect the result.',
        type: 'query',
        database: 'sql_lab',
        editCopy: true,
        sql: 'SELECT id, name, city FROM student_edits WHERE id = 2;',
        expected: 'Preview finds Riya (id 2). Updating sets her city to Pune.',
        question: 'Why filter by id = 2 instead of name = "Riya"?',
        answer: 'Primary key id uniquely identifies one row even if two students share the same first name.',
        notes: 'Run Preview first, then switch to Update Riya preset, run, and click Inspect result.',
        expectedRows: 1,
        inspectSql: 'SELECT id, name, city FROM student_edits ORDER BY id;',
        presets: [
          ['Preview', 'SELECT id, name, city FROM student_edits WHERE id = 2;'],
          ['Update Riya', "UPDATE student_edits SET city = 'Pune' WHERE id = 2;"]
        ]
      },
      {
        id: 'sql-delete',
        title: 'Delete one targeted row.',
        lead: 'Remove Dev (id 6) from the disposable edit copy only.',
        type: 'query',
        database: 'sql_lab',
        editCopy: true,
        sql: 'DELETE FROM student_edits WHERE id = 6;',
        expected: '1 row affected if Dev is present; source students table still retains Dev.',
        question: 'Does DELETE FROM student_edits WHERE id = 6 drop the table schema?',
        answer: 'No. DELETE only removes matching tuples while keeping columns and constraints intact.',
        notes: 'Run DELETE and inspect student_edits vs students to confirm isolation.',
        inspectSql: 'SELECT * FROM student_edits ORDER BY id;'
      },
      {
        id: 'sql-missing-where',
        title: 'The missing-WHERE disaster.',
        lead: 'See what happens when DELETE runs without any WHERE filter (safe here on student_edits).',
        type: 'query',
        database: 'sql_lab',
        editCopy: true,
        sql: 'DELETE FROM student_edits;',
        expected: 'Every remaining row is deleted. Click "Restore edit copy" afterward to restore the 6 baseline rows.',
        question: 'Can you still run SELECT * FROM student_edits after deleting every row?',
        answer: 'Yes. It returns 0 rows with all column headers still intact.',
        notes: 'Run DELETE, click Inspect result to show the empty table, then click Restore edit copy so the next constraint demo has Aman present!',
        inspectSql: 'SELECT * FROM student_edits ORDER BY id;'
      },
      {
        id: 'sql-constraint-errors',
        title: 'Test all 5 SQL constraints live.',
        lead: 'Trigger real PRIMARY KEY, UNIQUE, CHECK, NOT NULL, and FOREIGN KEY rejections against MariaDB.',
        type: 'query',
        database: 'sql_lab',
        editCopy: true,
        prepare: 'reset-edit-copy',
        sql: "INSERT INTO student_edits (id,name,email,age,city,joined_on)\nVALUES (1,'PK Collision','pk.collision@example.com',24,'Delhi','2026-08-01');",
        expected: 'Every preset fails with a specific MariaDB error code enforcing its declared constraint.',
        question: 'Notice Prepare example runs cleanly if student_edits was emptied. Why did PK Collision fail with Error 1062?',
        answer: 'id = 1 already exists in student_edits, so PRIMARY KEY rejects the duplicate key.',
        notes: 'Click Prepare example first if arriving straight from the empty-table step! Step through all 5 presets so students see PRIMARY KEY, UNIQUE, CHECK, NOT NULL, and FOREIGN KEY errors.',
        expectedError: 1062,
        presets: [
          ['1. Primary key (1062)', "INSERT INTO student_edits (id,name,email,age,city,joined_on) VALUES (1,'PK Collision','pk.collision@example.com',24,'Delhi','2026-08-01');"],
          ['2. Unique email (1062)', "INSERT INTO student_edits (name,email,age,city,joined_on) VALUES ('Duplicate','aman@example.com',25,'Delhi','2026-08-01');"],
          ['3. Check age >= 16 (4025)', "INSERT INTO student_edits (name,email,age,joined_on) VALUES ('Too young','young.sql@example.com',12,'2026-08-01');"],
          ['4. Not null name (1048)', "INSERT INTO student_edits (name,email,age,joined_on) VALUES (NULL,'noname.sql@example.com',22,'2026-08-01');"],
          ['5. Foreign key (1452)', 'INSERT INTO enrollments (student_id,course_id,score) VALUES (999,101,50);']
        ]
      },
      {
        id: 'sql-edit-check',
        title: 'Checkpoint: predict an unguarded UPDATE.',
        lead: 'An UPDATE targets student_edits without a WHERE clause.',
        type: 'quiz',
        options: [
          'Only the first row changes',
          'Every row in student_edits is updated',
          'MariaDB automatically cancels the command'
        ],
        correct: 1,
        feedback: 'Without WHERE, DML UPDATE/DELETE applies to every row in the table.',
        question: 'Student task: write the safe 3-step sequence to move Kabir (id=3) to Jaipur in student_edits.',
        answer: "SELECT id, name, city FROM student_edits WHERE id = 3;\nUPDATE student_edits SET city = 'Jaipur' WHERE id = 3;\nSELECT id, name, city FROM student_edits WHERE id = 3;",
        notes: 'Reinforce the habit: Preview -> Modify -> Verify, then Restore edit copy when done.'
      }
    ]
  },
  {
    id: 'sql-filtering', unit: 'u2', number: '2.3', title: 'Filtering, IN, NULL & sorting', minutes: 90,
    objective: 'Build accurate predicates using AND/OR, IN, BETWEEN, LIKE, IS NULL, ORDER BY, LIMIT, and CASE.',
    steps: [
      {
        id: 'sql-execution-order-diagram',
        title: 'How MariaDB executes SELECT (Written vs Logical Order).',
        lead: 'Click each stage on the right to see why WHERE behaves differently from HAVING and ORDER BY.',
        type: 'diagram',
        diagram: 'sql-execution-order',
        question: 'Why does SELECT age + 1 AS next_age FROM students WHERE next_age > 21 fail with Unknown column?',
        answer: 'Because WHERE (Stage 2) executes BEFORE SELECT (Stage 5) creates the alias next_age. ORDER BY (Stage 6) runs after SELECT, so aliases work there.',
        notes: 'Project this execution-order diagram early in Section 2.3—it explains almost every beginner SQL syntax error in one visual.'
      },
      {
        id: 'sql-projection',
        title: 'Projection & DISTINCT.',
        lead: 'Choose output columns with SELECT and deduplicate values with DISTINCT.',
        type: 'query',
        database: 'sql_lab',
        sql: 'SELECT name, age FROM students ORDER BY id;',
        expected: 'Six rows with two columns; Dev shows NULL age. DISTINCT city collapses repeats into 4 rows.',
        question: 'How does SELECT DISTINCT treat multiple NULL cities if there were two Dev-like rows?',
        answer: 'DISTINCT groups all NULLs into a single NULL output entry.',
        notes: 'Run both presets and point out that NULL appears first in ascending ORDER BY city.',
        expectedRows: 6,
        presets: [
          ['Two columns', 'SELECT name, age FROM students ORDER BY id;'],
          ['Distinct cities', 'SELECT DISTINCT city FROM students ORDER BY city;']
        ]
      },
      {
        id: 'sql-operators-null-theory',
        title: 'Theory: SQL operators, precedence & Three-Valued Logic.',
        lead: 'In SQL, every predicate evaluates to TRUE, FALSE, or UNKNOWN—and WHERE keeps ONLY TRUE rows.',
        type: 'comparison',
        columns: ['Operator / Rule', 'Meaning & Edge Case', 'Example'],
        rows: [
          ['Precedence: NOT > AND > OR', 'AND binds tighter than OR unless parenthesized', "(city='Delhi' OR city='Mumbai') AND age >= 20"],
          ['IN (v1, v2, ...)', 'True if equal to any item; beware NULL in NOT IN!', "WHERE city IN ('Delhi', 'Kochi')"],
          ['BETWEEN a AND b', 'Inclusive endpoints (a <= x AND x <= b)', 'WHERE age BETWEEN 20 AND 23'],
          ['LIKE pattern', '% = 0+ chars, _ = exactly 1 char (case depends on collation)', "WHERE name LIKE '___'"],
          ['IS NULL / IS NOT NULL', 'Only valid way to test missing NULL values (= NULL is UNKNOWN!)', 'WHERE age IS NULL'],
          ['3-Valued Logic', 'TRUE AND UNKNOWN = UNKNOWN · TRUE OR UNKNOWN = TRUE', 'NOT (UNKNOWN) = UNKNOWN']
        ],
        question: 'If age is NULL, what does NOT (age > 20) evaluate to?',
        answer: 'UNKNOWN—not TRUE! Therefore WHERE NOT (age > 20) still drops Dev (NULL age) unless you also allow OR age IS NULL.',
        notes: 'Review three-valued logic truth rules here before demonstrating live operator steps.'
      },
      {
        id: 'sql-and-or',
        title: 'Operator precedence: AND binds tighter than OR.',
        lead: 'Always parenthesize mixed boolean conditions so intent is explicit.',
        type: 'query',
        database: 'sql_lab',
        sql: "SELECT name, city, age\nFROM students\nWHERE (city = 'Delhi' OR city = 'Mumbai') AND age > 20\nORDER BY id;",
        expected: 'Aman (25, Delhi), Kabir (22, Delhi), Zoya (23, Mumbai).',
        question: 'What bug happens if you remove the parentheses when an 18-year-old Delhi student exists?',
        answer: 'Without parentheses, city = "Delhi" OR (city = "Mumbai" AND age > 20) would wrongly include an 18-year-old from Delhi.',
        notes: 'Make sure students understand precedence even though all current Delhi rows happen to be > 20.',
        expectedRows: 3
      },
      {
        id: 'sql-in-between',
        title: 'IN membership sets and BETWEEN ranges.',
        lead: 'IN checks membership in a discrete list; BETWEEN matches an inclusive closed range.',
        type: 'query',
        database: 'sql_lab',
        sql: 'SELECT name, age FROM students\nWHERE age BETWEEN 20 AND 23 ORDER BY age, id;',
        expected: 'Meera (20), Kabir (22), Zoya (23); City IN returns Delhi and Kochi students.',
        question: 'Does age NOT IN (20, NULL) return rows whose age is 25?',
        answer: 'No! NOT IN with a NULL inside the list evaluates to UNKNOWN (age != NULL) and returns zero rows.',
        notes: 'Warn students early about NULL inside IN / NOT IN lists; reinforce BETWEEN inclusivity.',
        expectedRows: 3,
        presets: [
          ['Age range (BETWEEN)', 'SELECT name, age FROM students WHERE age BETWEEN 20 AND 23 ORDER BY age, id;'],
          ['City set (IN)', "SELECT name, city FROM students WHERE city IN ('Delhi','Kochi') ORDER BY id;"]
        ]
      },
      {
        id: 'sql-like',
        title: 'Pattern matching with LIKE.',
        lead: '% matches zero or more characters; _ matches exactly one character.',
        type: 'query',
        database: 'sql_lab',
        sql: "SELECT name FROM students WHERE name LIKE '%a%' ORDER BY name;",
        expected: '5 names contain "a" (case-insensitive under utf8mb4_uca1400_ai_ci); "___" matches 3-letter names (Dev).',
        question: 'Why does LIKE "%a%" match "Aman" even though A is uppercase?',
        answer: 'Because the column collation uses case-insensitive (_ci) matching. Use LIKE BINARY or a _cs collation for case sensitivity.',
        notes: 'Switch between both presets and contrast % vs _ wildcard lengths.',
        expectedRows: 5,
        presets: [
          ['Contains a', "SELECT name FROM students WHERE name LIKE '%a%' ORDER BY name;"],
          ['Exactly 3 chars', "SELECT name FROM students WHERE name LIKE '___' ORDER BY name;"]
        ]
      },
      {
        id: 'sql-null-filter',
        title: 'Three-valued logic: testing NULL properly.',
        lead: 'Compare age = NULL against age IS NULL and observe the difference.',
        type: 'query',
        database: 'sql_lab',
        sql: 'SELECT id, name, age, city FROM students WHERE age IS NULL ORDER BY id;',
        expected: 'IS NULL returns Dev; age = NULL returns zero rows.',
        question: 'Why did WHERE age = NULL return an empty table rather than an error?',
        answer: 'It is valid syntax, but age = NULL yields UNKNOWN rather than TRUE for every row.',
        notes: 'Run "Compare to NULL" first to shock students with 0 rows, then switch back to "Correct NULL test".',
        expectedRows: 1,
        presets: [
          ['Correct NULL test', 'SELECT id, name, age, city FROM students WHERE age IS NULL ORDER BY id;'],
          ['Compare to NULL (=)', 'SELECT name FROM students WHERE age = NULL;'],
          ['Known values', 'SELECT name, age FROM students WHERE age IS NOT NULL ORDER BY id;']
        ]
      },
      {
        id: 'sql-order-limit',
        title: 'Deterministic sorting with ORDER BY & LIMIT.',
        lead: 'Add a unique tie-breaker column (id ASC) whenever paginating or slicing top N rows.',
        type: 'query',
        database: 'sql_lab',
        sql: 'SELECT name, age FROM students\nWHERE age IS NOT NULL\nORDER BY age DESC, id ASC LIMIT 3;',
        expected: 'Aman (25), Zoya (23), Kabir (22).',
        question: 'Why include id ASC as a second sort key if ages are all unique today?',
        answer: 'As soon as two students share an age, LIMIT without a unique tie-breaker produces arbitrary order across queries.',
        notes: 'Also show why WHERE age IS NOT NULL avoids relying on DBMS-specific NULL sort placement.',
        expectedRows: 3
      },
      {
        id: 'sql-case',
        title: 'Conditional expressions with CASE.',
        lead: 'Compute derived labels cleanly while handling NULL before inequality branches.',
        type: 'query',
        database: 'sql_lab',
        sql: "SELECT name, age,\n CASE WHEN age IS NULL THEN 'Unknown'\n      WHEN age >= 21 THEN '21 or older'\n      ELSE 'Under 21' END AS age_band\nFROM students ORDER BY id;",
        expected: '6 rows with age_band labels; Dev cleanly displays Unknown instead of falling into ELSE.',
        question: 'What would Dev be labeled if we removed the WHEN age IS NULL branch?',
        answer: 'NULL >= 21 evaluates to UNKNOWN, so Dev would falsely fall into ELSE "Under 21"!',
        notes: 'Great real-world bug catch: always place IS NULL first in searched CASE expressions.',
        expectedRows: 6
      },
      {
        id: 'sql-filter-practice',
        title: 'Practice: filter and sort Mumbai/Delhi students.',
        lead: 'Write a query on sql_lab.students returning name, city, and age for students in Delhi or Mumbai aged at least 20, ordered oldest first (then id ASC).',
        type: 'challenge',
        database: 'sql_lab',
        hints: [
          'Use city IN (\'Delhi\', \'Mumbai\') AND age >= 20.',
          'Add ORDER BY age DESC, id ASC and select exact columns: name, city, age.'
        ],
        check: {
          kind: 'query-match',
          database: 'sql_lab',
          orderMatters: true,
          expectedSql: "SELECT name, city, age FROM students WHERE city IN ('Delhi','Mumbai') AND age >= 20 ORDER BY age DESC, id ASC;"
        },
        question: 'Verify your query with Check my answer before advancing.',
        answer: "SELECT name, city, age\nFROM students\nWHERE city IN ('Delhi', 'Mumbai') AND age >= 20\nORDER BY age DESC, id ASC;",
        notes: 'In class, let students run this in Student Mode and inspect the auto-checker feedback if column order or tie-breakers are wrong.'
      },
      {
        id: 'sql-filter-check',
        title: 'Checkpoint: pick the reliable Top-3 query.',
        lead: 'A scholarship report needs the top 3 exam scores from enrollments.',
        type: 'quiz',
        options: [
          'SELECT * FROM enrollments LIMIT 3',
          'SELECT * FROM enrollments WHERE score IS NOT NULL ORDER BY score DESC, student_id ASC, course_id ASC LIMIT 3',
          'SELECT * FROM enrollments WHERE score = MAX(score)'
        ],
        correct: 1,
        feedback: 'Filter NULLs, sort descending, add composite PK tie-breakers, then apply LIMIT 3.',
        question: 'Student task: explain why WHERE score = MAX(score) causes an error.',
        answer: 'Aggregate functions like MAX() cannot appear directly in WHERE because WHERE evaluates row-by-row before aggregation.',
        notes: 'Smooth transition into Section 2.4 Aggregation.'
      }
    ]
  },
  {
    id: 'sql-groups', unit: 'u2', number: '2.4', title: 'Aggregation, GROUP BY & HAVING', minutes: 75,
    objective: 'Use COUNT, SUM, AVG, MIN, MAX accurately and understand GROUP BY + HAVING execution order.',
    steps: [
      {
        id: 'sql-where-vs-having-theory',
        title: 'Theory: aggregate functions & WHERE vs HAVING.',
        lead: 'Every aggregate except COUNT(*) ignores NULLs, and WHERE filters rows before GROUP BY while HAVING filters groups afterward.',
        type: 'comparison',
        columns: ['Concept / Clause', 'Rule & Behavior', 'Exam Tip'],
        rows: [
          ['COUNT(*) vs COUNT(col)', 'COUNT(*) counts all rows; COUNT(col) counts only non-NULL values', 'Use COUNT(child.id) in LEFT JOINs to show 0'],
          ['SUM / AVG / MIN / MAX', 'Ignore NULL inputs; AVG divides by non-NULL count only', 'All-NULL input returns NULL (except COUNT = 0)'],
          ['WHERE', 'Filters individual rows BEFORE grouping; cannot use aggregates', 'Faster: shrinks rows before grouping work'],
          ['HAVING', 'Filters aggregated groups AFTER GROUP BY; can use aggregates', 'Keep row-only checks in WHERE, not HAVING'],
          ['ONLY_FULL_GROUP_BY', 'Non-aggregated SELECT columns must appear in GROUP BY', 'MariaDB classroom mode enforces strict SQL here']
        ],
        question: 'Suppose a table has rows with scores (80, 100, NULL). What do COUNT(*), COUNT(score), SUM(score), and AVG(score) return?',
        answer: 'COUNT(*) = 3, COUNT(score) = 2, SUM(score) = 180, AVG(score) = 90 (180 / 2, NOT 180 / 3).',
        notes: 'Walk through the (80, 100, NULL) arithmetic example manually on screen before running the live enrollments query next.'
      },
      {
        id: 'sql-count-null',
        title: 'COUNT(*) vs COUNT(column) and AVG with NULL.',
        lead: 'Zoya’s Database Security score is NULL. Watch how aggregates handle it.',
        type: 'query',
        database: 'sql_lab',
        sql: 'SELECT COUNT(*) AS enrollments, COUNT(score) AS graded,\n ROUND(AVG(score),2) AS mean_score, MIN(score) AS lowest, MAX(score) AS highest\nFROM enrollments;',
        expected: '5 enrollments, 4 graded scores, mean 80.25 ((88+92+76+65)/4), min 65, max 92.',
        question: 'Does AVG(score) divide the sum by 5 enrollments or 4 non-NULL scores?',
        answer: 'It divides by 4 non-NULL scores. Including NULL as zero would lower the average to 64.20.',
        notes: 'Have students manually compute (88+92+76+65)/4 = 80.25 vs /5 = 64.20 before clicking Run.',
        expectedRows: 1,
        expectedValues: [[5, 4, '80.25', '65.00', '92.00']]
      },
      {
        id: 'sql-sum',
        title: 'Aggregate at the right grain (SUM & AVG).',
        lead: 'Each row in payments is one installment; Aman paid twice.',
        type: 'query',
        database: 'sql_lab',
        sql: 'SELECT COUNT(*) AS payments, SUM(amount) AS total,\n ROUND(AVG(amount),2) AS mean_payment\nFROM payments;',
        expected: '5 payment rows totaling 14,000.00; average per installment = 2,800.00.',
        question: 'Is 2,800 the average total paid per student?',
        answer: 'No. 2,800 is the mean per payment event, not per student (we would need GROUP BY student_id first for per-student totals).',
        notes: 'Highlight the distinction between event-level averages and entity-level averages.',
        expectedRows: 1
      },
      {
        id: 'sql-group-by',
        title: 'Collapse rows into groups with GROUP BY.',
        lead: 'Every distinct city—including one group for NULL—produces one summary row.',
        type: 'query',
        database: 'sql_lab',
        sql: 'SELECT city, COUNT(*) AS students\nFROM students GROUP BY city ORDER BY city;',
        expected: 'NULL: 1, Delhi: 2, Kochi: 1, Mumbai: 2 (4 output rows).',
        question: 'With ONLY_FULL_GROUP_BY enabled, why can you not add ungrouped name to this SELECT?',
        answer: 'Delhi has two students (Aman and Kabir). Picking one name arbitrarily for a single group row is ambiguous, so strict SQL rejects it.',
        notes: 'Demonstrate in the editor if helpful by adding ", name" to trigger MariaDB Error 1055 ONLY_FULL_GROUP_BY!',
        expectedRows: 4
      },
      {
        id: 'sql-having',
        title: 'Filter rows (WHERE) vs filter groups (HAVING).',
        lead: 'WHERE removes Dev before grouping; HAVING keeps only cities with 2+ students.',
        type: 'query',
        database: 'sql_lab',
        sql: 'SELECT city, COUNT(*) AS students\nFROM students WHERE city IS NOT NULL\nGROUP BY city HAVING COUNT(*) >= 2 ORDER BY city;',
        expected: 'Delhi (2) and Mumbai (2).',
        question: 'In what logical order does SQL evaluate FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY?',
        answer: 'FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY -> LIMIT.',
        notes: 'Write that 7-step logical execution sequence on the board or point it out verbally before moving on.',
        expectedRows: 2
      },
      {
        id: 'sql-empty-course-count',
        title: 'Count joined child keys, never COUNT(*).',
        lead: 'Cloud Security has 0 enrollments. Compare COUNT(e.student_id) vs COUNT(*).',
        type: 'query',
        database: 'sql_lab',
        sql: 'SELECT c.course_name, COUNT(e.student_id) AS enrolled\nFROM courses c LEFT JOIN enrollments e ON e.course_id = c.id\nGROUP BY c.id, c.course_name ORDER BY c.id;',
        expected: 'Cybersecurity: 2, Database Security: 2, Python: 1, Cloud Security: 0.',
        question: 'What wrong answer would COUNT(*) display for Cloud Security?',
        answer: 'COUNT(*) counts the NULL-extended LEFT JOIN row and falsely reports 1 enrolled student instead of 0.',
        notes: 'Classic interview & exam bug—edit COUNT(e.student_id) to COUNT(*) briefly in class to show Cloud Security jumping to 1.',
        expectedRows: 4
      },
      {
        id: 'sql-group-practice',
        title: 'Practice: summarize high-value student payers.',
        lead: 'Query sql_lab.payments to return student_id and SUM(amount) AS total_paid for students whose total exceeds 2,000, ordered by student_id ASC.',
        type: 'challenge',
        database: 'sql_lab',
        hints: [
          'Group payments by student_id: SELECT student_id, SUM(amount) AS total_paid FROM payments GROUP BY student_id.',
          'Filter totals after grouping using HAVING SUM(amount) > 2000 ORDER BY student_id;'
        ],
        check: {
          kind: 'query-match',
          database: 'sql_lab',
          orderMatters: true,
          expectedSql: 'SELECT student_id, SUM(amount) AS total_paid FROM payments GROUP BY student_id HAVING SUM(amount) > 2000 ORDER BY student_id;'
        },
        question: 'Run your query and verify with Check my answer.',
        answer: 'SELECT student_id, SUM(amount) AS total_paid\nFROM payments\nGROUP BY student_id\nHAVING SUM(amount) > 2000\nORDER BY student_id;',
        notes: 'Students should get Aman (1 -> 6000.00) and Riya (2 -> 4000.00), excluding Kabir (2000 is not > 2000) and Zoya (1000).'
      },
      {
        id: 'sql-group-check',
        title: 'Checkpoint: order of filtering.',
        lead: 'Find cities having at least 2 students whose ages are known (non-NULL).',
        type: 'quiz',
        options: [
          'WHERE age IS NOT NULL, then GROUP BY city, then HAVING COUNT(*) >= 2',
          'HAVING age IS NOT NULL before GROUP BY',
          'WHERE COUNT(*) >= 2'
        ],
        correct: 0,
        feedback: 'Row conditions belong in WHERE before grouping; group count thresholds belong in HAVING.',
        question: 'Student task: why does placing age IS NOT NULL inside HAVING fail under strict mode?',
        answer: 'age is an individual row attribute, not grouped or aggregated, so HAVING cannot inspect individual ages once grouped by city.',
        notes: 'Confirm group-level vs row-level thinking before Section 2.5 Joins.'
      }
    ]
  },
  {
    id: 'sql-joins', unit: 'u2', number: '2.5', title: 'All join types & set operations', minutes: 120,
    objective: 'Compare INNER, LEFT, RIGHT, FULL OUTER, CROSS, SELF, and NATURAL joins plus UNION, INTERSECT, and EXCEPT.',
    steps: [
      {
        id: 'sql-join-diagram',
        title: 'Visual guide to SQL join types.',
        lead: 'Click each join strategy in the diagram to review which rows survive before running live queries.',
        type: 'diagram',
        diagram: 'join-types',
        question: 'Which joins preserve unmatched rows, and which can multiply rows even when no key matches?',
        answer: 'LEFT, RIGHT, and FULL OUTER preserve unmatched rows with NULL padding; CROSS JOIN multiplies every left row by every right row.',
        notes: 'Use this interactive diagram as the anchor map as you work through the remaining queries in Section 2.5.'
      },
      {
        id: 'sql-inner',
        title: 'INNER JOIN keeps only matching pairs.',
        lead: 'Aman matches twice; Meera and Dev have no enrollments and drop out.',
        type: 'query',
        database: 'sql_lab',
        sql: 'SELECT s.id, s.name, e.course_id\nFROM students s INNER JOIN enrollments e ON e.student_id = s.id\nORDER BY s.id, e.course_id;',
        expected: '5 rows: Aman twice, Riya, Kabir, Zoya.',
        question: 'Why does Aman appear on two rows instead of one?',
        answer: 'A join emits one output row per matching pair of input rows.',
        notes: 'Contrast 5 output rows with 6 total students in the table.',
        expectedRows: 5
      },
      {
        id: 'sql-left',
        title: 'LEFT JOIN preserves unmatched left rows.',
        lead: 'Compare regular LEFT JOIN (7 rows) with the anti-join pattern (WHERE e.student_id IS NULL).',
        type: 'query',
        database: 'sql_lab',
        sql: 'SELECT s.id, s.name, e.course_id\nFROM students s LEFT JOIN enrollments e ON e.student_id = s.id\nORDER BY s.id, e.course_id;',
        expected: '7 rows (5 matched + Meera & Dev padded with NULL); Unmatched-only preset finds Meera and Dev.',
        question: 'Why is LEFT JOIN ... WHERE right_pk IS NULL a classic way to find orphaned/unmatched records?',
        answer: 'Outer join preserves unmatched left rows with NULL in the right columns, letting WHERE isolate exactly those missing matches.',
        notes: 'Run both presets and trace how 5 matches + 2 unmatched = 7 rows.',
        expectedRows: 7,
        presets: [
          ['Left join (all)', 'SELECT s.id, s.name, e.course_id FROM students s LEFT JOIN enrollments e ON e.student_id=s.id ORDER BY s.id,e.course_id;'],
          ['Unmatched only', 'SELECT s.id, s.name FROM students s LEFT JOIN enrollments e ON e.student_id=s.id WHERE e.student_id IS NULL ORDER BY s.id;']
        ]
      },
      {
        id: 'sql-right',
        title: 'RIGHT JOIN preserves unmatched right rows.',
        lead: 'Keep Cloud Security (104) visible even though zero students enrolled in it.',
        type: 'query',
        database: 'sql_lab',
        sql: 'SELECT c.id, c.course_name, e.student_id\nFROM enrollments e RIGHT JOIN courses c ON e.course_id = c.id\nORDER BY c.id, e.student_id;',
        expected: '6 rows: 5 enrollments plus Cloud Security with NULL student_id.',
        question: 'How would you rewrite this exact result using LEFT JOIN?',
        answer: 'Swap the tables: FROM courses c LEFT JOIN enrollments e ON e.course_id = c.id.',
        notes: 'Note that teams commonly prefer LEFT JOIN for top-to-bottom reading consistency.',
        expectedRows: 6
      },
      {
        id: 'sql-on-where',
        title: 'ON filter vs WHERE filter in outer joins.',
        lead: 'Watch Cloud Security and Database Security vanish if e.score >= 80 moves from ON into WHERE.',
        type: 'query',
        database: 'sql_lab',
        sql: 'SELECT c.course_name, e.student_id, e.score\nFROM courses c LEFT JOIN enrollments e\n ON e.course_id = c.id AND e.score >= 80\nORDER BY c.id, e.student_id;',
        expected: 'Condition in ON preserves all 4 courses; moving it into WHERE collapses to 2 rows.',
        question: 'Why does moving e.score >= 80 to WHERE turn a LEFT JOIN into an effective INNER JOIN?',
        answer: 'WHERE runs after the outer join; NULL >= 80 evaluates to UNKNOWN, discarding the NULL-padded outer rows.',
        notes: 'Click both presets back-to-back so students see the row count drop from 4 to 2.',
        expectedRows: 4,
        presets: [
          ['Condition in ON (4 rows)', 'SELECT c.course_name, e.student_id, e.score FROM courses c LEFT JOIN enrollments e ON e.course_id=c.id AND e.score>=80 ORDER BY c.id,e.student_id;'],
          ['Condition in WHERE (2 rows)', 'SELECT c.course_name, e.student_id, e.score FROM courses c LEFT JOIN enrollments e ON e.course_id=c.id WHERE e.score>=80 ORDER BY c.id,e.student_id;']
        ]
      },
      {
        id: 'sql-three-tables',
        title: 'Chain joins across a many-to-many junction table.',
        lead: 'Connect students -> enrollments -> courses to read names instead of numeric IDs.',
        type: 'query',
        database: 'sql_lab',
        sql: 'SELECT s.name, c.course_name, e.score\nFROM students s\nJOIN enrollments e ON e.student_id = s.id\nJOIN courses c ON c.id = e.course_id\nORDER BY s.id, c.id;',
        expected: '5 enrollment rows displaying student names, course titles, and scores.',
        question: 'What information lives on enrollments that does not belong on students or courses alone?',
        answer: 'Per-enrollment facts such as score (or enrollment date/status), which belong to the relationship itself.',
        notes: 'Point out how clean aliases (s, e, c) keep multi-table queries readable.',
        expectedRows: 5
      },
      {
        id: 'sql-cross-self-natural',
        title: 'CROSS JOIN, SELF JOIN, and NATURAL JOIN.',
        lead: 'Explore the remaining join forms in the syllabus and learn why NATURAL JOIN is risky in practice.',
        type: 'query',
        database: 'sql_lab',
        sql: 'SELECT s1.name AS student_a, s2.name AS student_b, s1.city\nFROM students s1\nJOIN students s2 ON s1.city = s2.city AND s1.id < s2.id\nORDER BY s1.city, s1.id;',
        expected: 'SELF JOIN finds pairs sharing a city (Aman & Kabir in Delhi; Riya & Zoya in Mumbai). CROSS JOIN yields 24 pairs.',
        question: 'Why does the SELF JOIN include AND s1.id < s2.id? And what makes NATURAL JOIN dangerous?',
        answer: 's1.id < s2.id removes self-pairs (Aman-Aman) and mirror duplicates (Kabir-Aman). NATURAL JOIN silently matches ALL same-named columns, breaking unexpectedly if schemas evolve.',
        notes: 'Run all three presets! Inspect NATURAL JOIN closely: students JOIN enrollments shares no identical column names here (id vs student_id), producing a Cartesian product (30 rows)!',
        expectedRows: 2,
        presets: [
          ['SELF JOIN (city peers)', 'SELECT s1.name AS student_a, s2.name AS student_b, s1.city FROM students s1 JOIN students s2 ON s1.city = s2.city AND s1.id < s2.id ORDER BY s1.city, s1.id;'],
          ['CROSS JOIN (6x4 = 24)', 'SELECT s.name, c.course_name FROM students s CROSS JOIN courses c ORDER BY s.id, c.id;'],
          ['NATURAL JOIN pitfall (30!)', 'SELECT s.id, s.name, e.course_id FROM students s NATURAL JOIN enrollments e ORDER BY s.id;']
        ]
      },
      {
        id: 'sql-full-join',
        title: 'FULL OUTER JOIN emulation in MariaDB.',
        lead: 'Combine LEFT JOIN and RIGHT JOIN with UNION to keep unmatched students AND unmatched courses together.',
        type: 'query',
        database: 'sql_lab',
        sql: 'SELECT s.id AS student_id, s.name, c.id AS course_id, c.course_name\nFROM students s\nLEFT JOIN enrollments e ON e.student_id = s.id\nLEFT JOIN courses c ON c.id = e.course_id\nUNION\nSELECT s.id, s.name, c.id, c.course_name\nFROM courses c\nLEFT JOIN enrollments e ON e.course_id = c.id\nLEFT JOIN students s ON s.id = e.student_id\nORDER BY student_id, course_id;',
        expected: '8 rows: all 5 matched enrollments + Meera + Dev + Cloud Security (with NULL student columns).',
        question: 'Why use UNION instead of UNION ALL when emulating FULL OUTER JOIN?',
        answer: 'UNION deduplicates the 5 matched rows that appear in both branches; UNION ALL would double-count matches.',
        notes: 'Explicitly highlight that MariaDB lacks native FULL OUTER JOIN syntax and uses this clean UNION idiom instead.',
        expectedRows: 8
      },
      {
        id: 'sql-set-ops-diagram',
        title: 'Visual guide: UNION, UNION ALL, INTERSECT & EXCEPT.',
        lead: 'Click each set operator to review how vertical result stacking differs from horizontal JOIN matching.',
        type: 'diagram',
        diagram: 'set-operations',
        question: 'Why must both SELECT branches have matching column counts and compatible types before running any set operator?',
        answer: 'Set operators stack rows vertically into one unified output table with column names taken from the first SELECT.',
        notes: 'Compare this diagram directly with the Join diagram from the start of Section 2.5: JOIN widens columns horizontally; UNION/INTERSECT/EXCEPT combine rows vertically.'
      },
      {
        id: 'sql-set-operations',
        title: 'Set operations: UNION, UNION ALL, INTERSECT & EXCEPT.',
        lead: 'Stack compatible query results vertically to combine, deduplicate, intersect, or subtract sets.',
        type: 'query',
        database: 'sql_lab',
        sql: 'SELECT id FROM students WHERE id IN (SELECT student_id FROM enrollments)\nINTERSECT\nSELECT id FROM students WHERE id IN (SELECT student_id FROM payments)\nORDER BY id;',
        expected: 'INTERSECT finds students in both sets (1,2,3,5). EXCEPT finds students enrolled/existing without payments (4,6). UNION vs UNION ALL compare deduplication.',
        question: 'What two rules must both SELECT queries obey before UNION, INTERSECT, or EXCEPT can run?',
        answer: 'Both queries must return the exact same number of columns with compatible data types; column names come from the first SELECT.',
        notes: 'Run all four presets! Note that MariaDB 10.3+ supports INTERSECT and EXCEPT natively (unlike older MySQL 8.0 versions prior to 8.0.31).',
        expectedRows: 4,
        presets: [
          ['INTERSECT (both sets)', 'SELECT student_id FROM enrollments INTERSECT SELECT student_id FROM payments ORDER BY student_id;'],
          ['EXCEPT (students unpaid)', 'SELECT id FROM students EXCEPT SELECT student_id FROM payments ORDER BY id;'],
          ['UNION (deduplicated)', "SELECT city FROM students WHERE city='Delhi' UNION SELECT city FROM students WHERE city='Mumbai' ORDER BY city;"],
          ['UNION ALL (keeps duplicates)', "SELECT city FROM students WHERE city='Delhi' UNION ALL SELECT city FROM students WHERE city='Mumbai' ORDER BY city;"]
        ]
      },
      {
        id: 'sql-join-check',
        title: 'Checkpoint: preserve courses with zero students.',
        lead: 'A curriculum audit requires listing every course along with its enrolled student count, including empty courses.',
        type: 'quiz',
        options: [
          'Start from enrollments with INNER JOIN courses',
          'Start from courses with LEFT JOIN enrollments',
          'Use CROSS JOIN'
        ],
        correct: 1,
        feedback: 'courses must sit on the preserved side of an outer join so empty courses remain visible.',
        question: 'Student task: write an EXCEPT query listing course IDs that have no enrollments.',
        answer: 'SELECT id FROM courses EXCEPT SELECT course_id FROM enrollments ORDER BY id; returns 104 (Cloud Security).',
        notes: 'Compare how LEFT JOIN + IS NULL and EXCEPT solve the same missing-enrollment question cleanly.'
      }
    ]
  },
  {
    id: 'sql-subqueries', unit: 'u2', number: '2.6', title: 'Subqueries & view types', minutes: 90,
    objective: 'Write nested, correlated, EXISTS, ANY/ALL subqueries and distinguish simple, complex, updatable, and check-option views.',
    steps: [
      {
        id: 'sql-subquery-types-theory',
        title: 'Theory: types of subqueries & correlated execution.',
        lead: 'Classify subqueries by what shape they return (scalar vs set vs derived table) and whether they depend on the outer row.',
        type: 'comparison',
        columns: ['Subquery Type', 'Shape & Operators', 'Execution Model'],
        rows: [
          ['Scalar Subquery', 'Single value (1 row × 1 col) with =, >, <', 'Runs once; Error 1242 if >1 row returned'],
          ['Multi-Row Subquery', 'Single column list with IN, NOT IN, ANY, ALL', 'Runs once independently (watch NULL in NOT IN!)'],
          ['Derived Table (FROM)', 'Virtual inline table in FROM (...) AS alias', 'Pre-aggregates results before joining (e.g. payments)'],
          ['Correlated Subquery', 'Inner WHERE references outer table alias (e.g. e.student_id = s.id)', 'Conceptually re-evaluated per outer candidate row'],
          ['EXISTS / NOT EXISTS', 'Boolean presence test returning TRUE as soon as 1 row matches', 'Short-circuits fast and ignores inner NULL traps']
        ],
        question: 'What distinguishes a correlated subquery from an ordinary nested IN subquery?',
        answer: 'An ordinary IN subquery can run completely by itself once; a correlated subquery references a column from the outer query and cannot run standalone.',
        notes: 'Contrast standalone vs correlated execution before demonstrating both live in MariaDB.'
      },
      {
        id: 'sql-in-subquery',
        title: 'Independent IN subquery.',
        lead: 'Evaluate the inner query once to build a membership set of student IDs in course 101.',
        type: 'query',
        database: 'sql_lab',
        sql: 'SELECT id, name FROM students\nWHERE id IN (SELECT student_id FROM enrollments WHERE course_id = 101)\nORDER BY id;',
        expected: 'Aman (1) and Kabir (3).',
        question: 'Could an IN subquery ever duplicate outer student rows the way a join can?',
        answer: 'No. IN evaluates a boolean membership predicate per outer student row; it never multiplies rows.',
        notes: 'Contrast membership tests (IN / EXISTS) with row-combining joins.',
        expectedRows: 2
      },
      {
        id: 'sql-correlated',
        title: 'Correlated subqueries with EXISTS & NOT EXISTS.',
        lead: 'The inner query references s.id from the outer row and stops as soon as one matching row is found.',
        type: 'query',
        database: 'sql_lab',
        sql: 'SELECT s.id, s.name FROM students s\nWHERE EXISTS (SELECT 1 FROM enrollments e WHERE e.student_id = s.id)\nORDER BY s.id;',
        expected: 'EXISTS returns 4 enrolled students; NOT EXISTS returns Meera and Dev.',
        question: 'Why is NOT EXISTS usually safer than NOT IN when NULLs could appear in the subquery?',
        answer: 'NOT EXISTS only returns true/false on row presence, whereas NOT IN returns empty if any NULL enters the subquery list.',
        notes: 'Toggle between EXISTS and NOT EXISTS presets and point out e.student_id = s.id correlation.',
        expectedRows: 4,
        presets: [
          ['EXISTS (has enrollments)', 'SELECT s.id,s.name FROM students s WHERE EXISTS (SELECT 1 FROM enrollments e WHERE e.student_id=s.id) ORDER BY s.id;'],
          ['NOT EXISTS (no enrollments)', 'SELECT s.id,s.name FROM students s WHERE NOT EXISTS (SELECT 1 FROM enrollments e WHERE e.student_id=s.id) ORDER BY s.id;']
        ]
      },
      {
        id: 'sql-scalar',
        title: 'Scalar subqueries for comparisons.',
        lead: 'Compare each enrollment score against the overall average (80.25).',
        type: 'query',
        database: 'sql_lab',
        sql: 'SELECT student_id, course_id, score FROM enrollments\nWHERE score > (SELECT AVG(score) FROM enrollments)\nORDER BY student_id, course_id;',
        expected: 'Aman’s 88 and 92.',
        question: 'What happens at runtime if a scalar subquery unexpectedly returns 2 rows?',
        answer: 'MariaDB raises Error 1242: Subquery returns more than 1 row.',
        notes: 'Explain scalar (single value) vs row vs table subqueries.',
        expectedRows: 2
      },
      {
        id: 'sql-any-all',
        title: 'Quantified comparisons: ANY and ALL.',
        lead: 'Compare scores against course 101’s known scores (65 and 88).',
        type: 'query',
        database: 'sql_lab',
        sql: 'SELECT student_id, course_id, score FROM enrollments\nWHERE score > ALL (SELECT score FROM enrollments WHERE course_id=101 AND score IS NOT NULL)\nORDER BY student_id, course_id;',
        expected: '> ALL returns 92 (beats both 88 and 65); > ANY returns 88, 92, and 76 (beats at least 65).',
        question: 'How does > ANY relate to > MIN() and > ALL relate to > MAX() on non-empty, non-NULL sets?',
        answer: 'x > ANY(set) is equivalent to x > MIN(set), while x > ALL(set) is equivalent to x > MAX(set).',
        notes: 'Warn that an empty subquery makes > ALL true and > ANY false, and NULLs in the set break > ALL.',
        expectedRows: 1,
        presets: [
          ['Greater than ALL', 'SELECT student_id,course_id,score FROM enrollments WHERE score > ALL (SELECT score FROM enrollments WHERE course_id=101 AND score IS NOT NULL) ORDER BY student_id,course_id;'],
          ['Greater than ANY', 'SELECT student_id,course_id,score FROM enrollments WHERE score > ANY (SELECT score FROM enrollments WHERE course_id=101 AND score IS NOT NULL) ORDER BY student_id,course_id;']
        ]
      },
      {
        id: 'sql-view-types-theory',
        title: 'Theory: SQL views and their types.',
        lead: 'A view is a saved named query serving as an External Schema layer—but not all views allow INSERT/UPDATE writes.',
        type: 'comparison',
        columns: ['View Type / Clause', 'Characteristics', 'Updatable? / Usage'],
        rows: [
          ['Simple View', 'Single base table, no GROUP BY, DISTINCT, HAVING, or aggregates', 'Usually YES (writes pass through to base table)'],
          ['Complex View', 'Multi-table JOINs, aggregates, GROUP BY, UNION, or subqueries', 'NO (Read-only reporting & security abstraction)'],
          ['WITH CHECK OPTION', 'Rejects INSERT/UPDATE through view if new row fails view’s WHERE rule', 'Prevents rows vanishing out of the view (Error 1369)'],
          ['Virtual vs Materialized', 'Virtual recomputes dynamically; Materialized stores snapshot rows physically', 'MariaDB views are Virtual; summary tables emulate Materialized'],
          ['ALGORITHM (MERGE/TEMPTABLE)', 'MERGE folds view SQL into caller query; TEMPTABLE builds temp result first', 'TEMPTABLE needed when GROUP BY/DISTINCT used'],
          ['SQL SECURITY', 'DEFINER (runs with creator’s rights) vs INVOKER (caller’s rights)', 'INVOKER prevents unintended privilege escalation']
        ],
        question: 'Why do DBAs expose a view instead of granting direct SELECT on base tables?',
        answer: 'Views hide sensitive columns (salary, passwords), simplify complex joins, and provide Logical Data Independence when underlying schemas refactor.',
        notes: 'Cover every bullet of "View and its types" from the MSCNS406 syllabus clearly here, then create both a Complex view and a WITH CHECK OPTION Simple view next.'
      },
      {
        id: 'sql-create-view',
        title: 'Complex (read-only) views for reusable joins.',
        lead: 'Create course_roster joining students, enrollments, and courses; inspect live data through it.',
        type: 'query',
        database: 'sql_lab',
        sql: 'CREATE OR REPLACE SQL SECURITY INVOKER VIEW course_roster AS\nSELECT s.id AS student_id, s.name, c.id AS course_id, c.course_name, e.score\nFROM students s\nJOIN enrollments e ON e.student_id=s.id\nJOIN courses c ON c.id=e.course_id;',
        expected: 'Complex view created (multi-table join). Clicking Inspect result displays 5 rows.',
        question: 'Can you INSERT a brand-new row directly into this 3-table joined course_roster view?',
        answer: 'Generally no—views using joins across multiple tables, GROUP BY, DISTINCT, or aggregates are Complex / Non-Updatable views.',
        notes: 'Point out SQL SECURITY INVOKER (caller privileges apply) vs DEFINER (covered deeply in Unit 3).',
        inspectSql: 'SELECT * FROM course_roster ORDER BY student_id, course_id;'
      },
      {
        id: 'sql-view-types',
        title: 'View types: Simple vs Complex & WITH CHECK OPTION.',
        lead: 'A Simple single-table view can accept updates—and WITH CHECK OPTION prevents inserting/updating rows outside its WHERE rule!',
        type: 'query',
        database: 'sql_lab',
        sql: "CREATE OR REPLACE VIEW v_delhi_students AS\nSELECT id, name, email, age, city, joined_on\nFROM student_edits\nWHERE city = 'Delhi'\nWITH CHECK OPTION;",
        expected: 'Simple updatable view created. Inspecting shows Delhi students; attempting to move Aman to Pune through the view fails with Error 1369!',
        question: 'What is the difference between a Virtual View (standard in MariaDB) and a Materialized View?',
        answer: 'A Virtual View stores only the query definition and recomputes on read; a Materialized View (supported in some DBMSs or emulated via summary tables) stores precomputed rows physically on disk.',
        notes: 'Run presets in order: 1) Create view -> 2) Update within rule -> 3) Try breaking the filter (Error 1369 CHECK OPTION failed) -> 4) Inspect v_delhi_students.',
        prepare: 'reset-edit-copy',
        editCopy: true,
        inspectSql: 'SELECT * FROM v_delhi_students ORDER BY id;',
        presets: [
          ['1. Inspect v_delhi_students', 'SELECT * FROM v_delhi_students ORDER BY id;'],
          ['2. Valid update inside view', 'UPDATE v_delhi_students SET age = 26 WHERE id = 1;'],
          ['3. Blocked outside-filter edit (1369)', "UPDATE v_delhi_students SET city = 'Pune' WHERE id = 1;"]
        ]
      },
      {
        id: 'sql-view-alter-drop',
        title: 'Inspect view definitions and types in metadata.',
        lead: 'Use INFORMATION_SCHEMA.VIEWS or SHOW CREATE VIEW to distinguish BASE TABLEs from VIEWs and drop temporary views.',
        type: 'query',
        database: 'sql_lab',
        prepare: 'prepare-course-roster',
        sql: "SELECT TABLE_NAME, VIEW_DEFINITION, CHECK_OPTION, IS_UPDATABLE, SECURITY_TYPE\nFROM information_schema.VIEWS\nWHERE TABLE_SCHEMA = 'sql_lab';",
        presets: [
          ['Inspect VIEWS catalog', "SELECT TABLE_NAME, CHECK_OPTION, IS_UPDATABLE, SECURITY_TYPE FROM information_schema.VIEWS WHERE TABLE_SCHEMA = 'sql_lab';"],
          ['SHOW FULL TABLES (BASE vs VIEW)', 'SHOW FULL TABLES;'],
          ['Drop v_delhi_students', 'DROP VIEW IF EXISTS v_delhi_students;']
        ],
        expected: 'Lists sql_lab views along with IS_UPDATABLE (NO for complex course_roster) and SECURITY_TYPE.',
        question: 'What are MariaDB’s view ALGORITHM options (MERGE vs TEMPTABLE)?',
        answer: 'MERGE folds the view query directly into the caller’s SQL; TEMPTABLE materializes view rows into an internal temporary table first (required for GROUP BY/aggregates).',
        notes: 'Click Prepare example if course_roster was not created earlier. Also try SHOW FULL TABLES.'
      },
      {
        id: 'sql-subquery-check',
        title: 'Checkpoint: querying through views and EXISTS.',
        lead: 'Choose the best pattern for identifying students with zero enrollments.',
        type: 'quiz',
        options: [
          'WHERE NOT EXISTS with a correlated subquery on enrollments',
          'WHERE EXISTS without any WHERE clause inside',
          'WHERE score > ALL (SELECT score FROM enrollments)'
        ],
        correct: 0,
        feedback: 'Correlated NOT EXISTS clearly expresses non-existence without NULL traps.',
        question: 'Student task: query course_roster (create/prepare if needed) for scores >= 80.',
        answer: 'SELECT name, course_name, score FROM course_roster WHERE score >= 80 ORDER BY student_id, course_id;',
        notes: 'Summarize subquery categories (scalar, IN, correlated, ANY/ALL) and view types (simple, complex, check-option, virtual vs materialized).'
      }
    ]
  },
  {
    id: 'sql-functions', unit: 'u2', number: '2.7', title: 'Built-in functions & reporting lab', minutes: 75,
    objective: 'Apply numeric, string, date, and null-handling functions and solve an end-to-end reporting challenge.',
    steps: [
      {
        id: 'sql-builtin-functions-theory',
        title: 'Theory: built-in scalar functions (Numeric, String, Date).',
        lead: 'Scalar functions transform each row’s values in the query output without altering stored table contents.',
        type: 'comparison',
        columns: ['Category', 'Key Syllabus Functions', 'Purpose & Notes'],
        rows: [
          ['Numeric', 'ABS, ROUND, TRUNCATE, CEIL, FLOOR, MOD, POWER, SQRT, SIGN', 'Rounding vs truncation, modulo remainders, mathematical expressions'],
          ['String', 'UPPER, LOWER, CHAR_LENGTH, LENGTH, CONCAT, SUBSTRING, TRIM, REPLACE', 'Case normalization, character vs byte length, slicing & cleanup'],
          ['Date & Time', 'NOW, CURDATE, YEAR, MONTHNAME, DAY, DATEDIFF, DATE_ADD, DATE_FORMAT', 'Calendar extraction, interval arithmetic, formatting dates'],
          ['Null Handling', 'COALESCE(a, b, ...), IFNULL(a, b), NULLIF(a, b)', 'Fallback labels for NULLs or turning sentinel strings into NULL']
        ],
        question: 'Do scalar functions in SELECT (like UPPER(name)) modify the stored values inside the table?',
        answer: 'No. SELECT expressions compute derived output values only; stored rows only change via UPDATE.',
        notes: 'Use this overview card to group all built-in functions cleanly before stepping through the three live SQL function demos.'
      },
      {
        id: 'sql-numeric-functions',
        title: 'Built-in numeric functions.',
        lead: 'Round, truncate, raise powers, compute remainders, and handle absolute values in SQL expressions.',
        type: 'query',
        database: 'sql_lab',
        sql: "SELECT id AS payment_id, amount,\n ROUND(amount * 1.18, 2) AS with_gst,\n CEIL(amount / 1500) AS ceiling_slots,\n FLOOR(amount / 1500) AS floor_slots,\n MOD(amount, 1500) AS remainder,\n ABS(-42) AS abs_demo\nFROM payments ORDER BY id;",
        expected: 'Demonstrates ROUND, CEIL, FLOOR, MOD, and ABS across all 5 payments.',
        question: 'How do ROUND(12.678, 1) and TRUNCATE(12.678, 1) differ?',
        answer: 'ROUND rounds to nearest (12.7), whereas TRUNCATE chops off digits beyond the decimal places (12.6).',
        notes: 'Switch to the "Math toolbox" preset to demonstrate SQRT, POWER, SIGN, and TRUNCATE as well.',
        expectedRows: 5,
        presets: [
          ['Payments math', 'SELECT id AS payment_id, amount, ROUND(amount * 1.18, 2) AS with_gst, CEIL(amount / 1500) AS ceiling_slots, FLOOR(amount / 1500) AS floor_slots, MOD(amount, 1500) AS remainder, ABS(-42) AS abs_demo FROM payments ORDER BY id;'],
          ['Math toolbox', 'SELECT POWER(2, 10) AS two_pow_10, SQRT(144) AS sqrt_144, ROUND(80.256, 2) AS rounded, TRUNCATE(80.256, 2) AS truncated, SIGN(-15) AS sign_neg;']
        ]
      },
      {
        id: 'sql-text-functions',
        title: 'Built-in string functions.',
        lead: 'Format, slice, trim, measure, and replace text in query outputs without mutating stored rows.',
        type: 'query',
        database: 'sql_lab',
        sql: "SELECT name, UPPER(name) AS upper_name, LOWER(name) AS lower_name,\n CHAR_LENGTH(name) AS chars, SUBSTRING(email, 1, 6) AS email_prefix,\n CONCAT(name, ' <', email, '>') AS formatted_contact\nFROM students ORDER BY id;",
        expected: 'Six formatted rows; stored table values remain unchanged.',
        question: 'Why prefer CHAR_LENGTH() over LENGTH() when dealing with UTF-8 strings?',
        answer: 'LENGTH() counts bytes (multi-byte characters count >1), whereas CHAR_LENGTH() counts actual characters.',
        notes: 'Run the second preset to show TRIM and REPLACE cleanup patterns.',
        expectedRows: 6,
        presets: [
          ['Student strings', "SELECT name, UPPER(name) AS upper_name, LOWER(name) AS lower_name, CHAR_LENGTH(name) AS chars, SUBSTRING(email, 1, 6) AS email_prefix, CONCAT(name, ' <', email, '>') AS formatted_contact FROM students ORDER BY id;"],
          ['Trim & replace', "SELECT TRIM('  DBMS Lab  ') AS trimmed, REPLACE('Database Security', 'Security', 'Admin') AS replaced;"]
        ]
      },
      {
        id: 'sql-date-functions',
        title: 'Built-in date functions.',
        lead: 'Extract calendar parts, shift intervals, and measure elapsed days deterministically.',
        type: 'query',
        database: 'sql_lab',
        sql: "SELECT name, joined_on,\n YEAR(joined_on) AS join_year,\n MONTHNAME(joined_on) AS join_month,\n DATE_FORMAT(joined_on, '%d %b %Y') AS formatted_date,\n DATE_ADD(joined_on, INTERVAL 30 DAY) AS review_due,\n DATEDIFF('2026-09-01', joined_on) AS days_since_joining\nFROM students ORDER BY id;",
        expected: 'Aman: 62 days, Riya: 60, Kabir: 53, Meera: 48, Zoya: 31, Dev: 22.',
        question: 'Why do we pass literal "2026-09-01" instead of CURRENT_DATE in this teaching script?',
        answer: 'A fixed reference date guarantees deterministic classroom results every semester.',
        notes: 'Remind students that LAST_DAY(), NOW(), and CURRENT_TIMESTAMP() work identically in real reports.',
        expectedRows: 6
      },
      {
        id: 'sql-coalesce',
        title: 'Replace NULL cleanly with COALESCE.',
        lead: 'COALESCE returns the first non-NULL expression in its argument list.',
        type: 'query',
        database: 'sql_lab',
        sql: "SELECT name, COALESCE(city, 'Not supplied') AS city_label\nFROM students ORDER BY id;",
        expected: 'Dev shows "Not supplied" while the underlying column remains NULL.',
        question: 'Does COALESCE(city, "Unknown") replace an empty string ""?',
        answer: 'No. "" is not NULL; combine NULLIF(city, "") inside COALESCE(NULLIF(city, ""), "Unknown") to normalize both.',
        notes: 'Share that COALESCE(NULLIF(...)) trick—very useful for dirty student/CSV imports.',
        expectedRows: 6
      },
      {
        id: 'sql-payment-report',
        title: 'Pre-aggregate before joining to prevent row multiplication.',
        lead: 'Sum payments inside a derived subquery first, then LEFT JOIN students to get true per-student totals.',
        type: 'query',
        database: 'sql_lab',
        sql: 'SELECT s.id, s.name, COALESCE(p.total_paid,0) AS total_paid\nFROM students s LEFT JOIN\n (SELECT student_id, SUM(amount) AS total_paid FROM payments GROUP BY student_id) p\n ON p.student_id=s.id\nORDER BY s.id;',
        expected: 'Aman 6000, Riya 4000, Kabir 2000, Meera 0, Zoya 1000, Dev 0.',
        question: 'What happens if someone joins students -> enrollments -> payments and sums payments directly?',
        answer: 'Aman has 2 enrollments and 2 payments, producing 4 rows and falsely doubling his paid total to 12,000!',
        notes: 'Fan-out join bug: one of the highest-value SQL lessons for real analytics work.',
        expectedRows: 6
      },
      {
        id: 'sql-final-lab',
        title: 'Capstone lab: build the Course Performance Report.',
        lead: 'Return id, course_name, enrolled (count of enrollments), graded (count of non-NULL scores), and mean_score (ROUND(AVG(score), 2)) for ALL 4 courses ordered by c.id ASC.',
        type: 'challenge',
        database: 'sql_lab',
        hints: [
          'Use FROM courses c LEFT JOIN enrollments e ON e.course_id = c.id so Cloud Security stays included.',
          'Count e.student_id (NOT *) for enrolled, e.score for graded, and ROUND(AVG(e.score), 2) for mean_score; group by c.id, c.course_name ORDER BY c.id;'
        ],
        check: {
          kind: 'query-match',
          database: 'sql_lab',
          orderMatters: true,
          expectedSql: 'SELECT c.id, c.course_name, COUNT(e.student_id) AS enrolled, COUNT(e.score) AS graded, ROUND(AVG(e.score),2) AS mean_score FROM courses c LEFT JOIN enrollments e ON e.course_id=c.id GROUP BY c.id, c.course_name ORDER BY c.id;'
        },
        question: 'Write your query against sql_lab and verify it with Check my answer.',
        answer: 'SELECT c.id, c.course_name, COUNT(e.student_id) AS enrolled,\n       COUNT(e.score) AS graded, ROUND(AVG(e.score), 2) AS mean_score\nFROM courses c\nLEFT JOIN enrollments e ON e.course_id = c.id\nGROUP BY c.id, c.course_name\nORDER BY c.id;\n\nExpected: 101 -> 2, 2, 76.50; 102 -> 2, 1, 76.00; 103 -> 1, 1, 92.00; 104 -> 0, 0, NULL.',
        notes: 'Walk through the expected output row-by-row after students verify their query; reinforce why Cloud Security shows NULL mean_score rather than 0.'
      },
      {
        id: 'sql-complete',
        title: 'Unit 2 complete. Ready for MariaDB Administration.',
        lead: 'You can now define schemas, enforce constraints, join across tables, build views, and verify query meaning.',
        type: 'quiz',
        options: [
          'Any query that executes without syntax errors is correct',
          'A query is correct only when its filters, joins, NULL handling, and row counts match the real question',
          'Every report must start with SELECT *'
        ],
        correct: 1,
        feedback: 'Silent logical bugs (fan-out sums, COUNT(*) on outer joins, NULL traps) matter far more than syntax errors.',
        question: 'Exit ticket: explain the difference between WHERE and HAVING, and between UNION and INTERSECT.',
        answer: 'WHERE filters rows before grouping; HAVING filters groups after aggregation. UNION combines rows from either query; INTERSECT keeps only rows present in both.',
        notes: 'Press Next to launch Unit 3: MariaDB Concepts, Security & Authentication.'
      }
    ]
  }
);

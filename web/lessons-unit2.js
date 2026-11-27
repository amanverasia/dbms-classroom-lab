/* Unit 2 SQL Concepts (MSCNS406). Executes in the isolated sql_lab database. */
COURSE.sections.push(
  {
    id: 'sql-language', unit: 'u2', number: '2.1', title: 'SQL families, DDL & DCL', minutes: 60,
    objective: 'Classify DDL, DML, DCL, and TCL commands; create, alter, truncate, drop tables; and inspect privileges.',
    steps: [
      {
        id: 'sql-start',
        title: 'What is SQL & meet your sql_lab database.',
        lead: 'SQL (Structured Query Language) is declarative: you tell MariaDB what table structure or data result you want, and the DBMS handles how to store and retrieve it. Unit 2 practices inside sql_lab, which has four connected tables with intentional edge cases.',
        type: 'cards',
        cards: [
          ['students (6 rows)', 'Meera (id 4) and Dev (id 6) have no course enrollments yet; Dev has NULL age and NULL city.'],
          ['courses (4 rows)', 'Four courses (101–104); Cloud Security (104) has zero enrolled students so far.'],
          ['enrollments & payments', 'Five enrollments (one missing score = NULL) and five fee installments across students.']
        ],
        question: 'How is SQL different from a procedural language like Python or C?',
        answer: 'SQL is declarative: you describe what table or result you want, and MariaDB’s Query Processor plans how to read or modify disk rows automatically.',
        notes: 'Introduce sql_lab as separate from Unit 1 college_demo, and show Reset Unit 2 in SQL Studio / ⌘K so students know they can freely experiment.'
      },
      {
        id: 'sql-families',
        title: 'The four SQL command families: DDL, DML, DCL, and TCL.',
        lead: 'Every SQL statement belongs to a family based on whether it changes table structure, table rows, user permissions, or transaction boundaries.',
        type: 'comparison',
        columns: ['Family', 'Key Statements', 'What it acts on', 'Where we practice it'],
        rows: [
          ['DDL (Data Definition)', 'CREATE, ALTER, TRUNCATE, DROP', 'Table and database blueprints (structure)', 'Right here in Section 2.1'],
          ['DML (Data Manipulation)', 'SELECT, INSERT, UPDATE, DELETE', 'Rows stored inside tables (data & queries)', 'Sections 2.2 – 2.7'],
          ['DCL (Data Control)', 'GRANT, REVOKE', 'User permissions and access rules', 'Preview in 2.1 · Live user labs in Unit 3'],
          ['TCL (Transaction Control)', 'START TRANSACTION, COMMIT, ROLLBACK', 'Grouping multi-step edits safely', 'Live concurrency labs in Unit 4']
        ],
        question: 'Suppose a college creates a new exams table, inserts 50 scores, and gives a teaching assistant read-only access. Which SQL family handles each step?',
        answer: 'Creating the table is DDL (CREATE), inserting scores is DML (INSERT), and giving access is DCL (GRANT).',
        notes: 'Walk through the "Where we practice it" column so students see the full Unit 2 -> Unit 3 -> Unit 4 learning roadmap before writing code.'
      },
      {
        id: 'sql-inspect',
        title: 'Inspect the four Unit 2 tables first.',
        lead: 'Use the presets on the left in SQL Studio to view students, courses, enrollments, and payments before creating or changing anything.',
        type: 'query',
        database: 'sql_lab',
        sql: 'SELECT * FROM students ORDER BY id;',
        explain: {
          syntax: 'SELECT * FROM table_name ORDER BY column_name;',
          parts: [
            ['SELECT *', 'Reads every column stored in the table (* means "all columns").'],
            ['FROM students', 'Names the table in sql_lab to read rows from.'],
            ['ORDER BY id', 'Sorts the output rows in ascending order of id (1, 2, 3…) instead of arbitrary storage order.']
          ]
        },
        expected: 'Six students including Dev (id 6) with NULL age and city.',
        question: 'Click through all four presets. Comparing students and enrollments by ID, which two students have not enrolled in any course yet, and which student has NULL values?',
        answer: 'Meera (id 4) and Dev (id 6) have no matching rows in enrollments, and Dev (id 6) has NULL for both age and city. Notice Cloud Security (id 104) also has zero enrollments.',
        notes: 'Have students inspect IDs, text/date/decimal formatting, and NULL cells across all four tables before learning DDL data types.',
        expectedRows: 6,
        presets: [
          ['Students', 'SELECT * FROM students ORDER BY id;'],
          ['Courses', 'SELECT * FROM courses ORDER BY id;'],
          ['Enrollments', 'SELECT * FROM enrollments ORDER BY student_id, course_id;'],
          ['Payments', 'SELECT * FROM payments ORDER BY id;']
        ]
      },
      {
        id: 'sql-datatypes-ddl-compare',
        title: 'MariaDB core data types & storage choices.',
        lead: 'Notice the numbers, fees (6000.00), titles (\'Cybersecurity\'), and dates (\'2026-07-01\') you just inspected—before writing CREATE TABLE, pick each column’s exact data type.',
        type: 'comparison',
        columns: ['Column Type', 'Syntax & Storage', 'When to choose it'],
        rows: [
          ['INT / BIGINT', '4-byte / 8-byte exact integer', 'Primary keys, ages, quantities, counters'],
          ['DECIMAL(p, s)', 'Exact fixed-point number (e.g. DECIMAL(9,2))', 'Fees, salaries, ledger balances—never FLOAT for money'],
          ['VARCHAR(n) vs CHAR(n)', 'Variable-length vs fixed-length padded text', 'VARCHAR for names/emails; CHAR only for fixed-width codes (e.g. ISO codes)'],
          ['DATE / DATETIME', 'YYYY-MM-DD / YYYY-MM-DD HH:MM:SS', 'Birth dates, joining dates, audit timestamps'],
          ["ENUM('a','b')", 'Constrained string set', 'Small closed state sets such as enrollment status']
        ],
        question: 'Why does DECIMAL(9,2) prevent silent ₹0.01 rounding bugs compared to FLOAT or DOUBLE?',
        answer: 'FLOAT/DOUBLE use binary floating-point approximations (0.1 + 0.2 != 0.3 exactly), whereas DECIMAL stores exact base-10 digits.',
        notes: 'Connect each row to columns students just saw (id, fee, email, joined_on) right before they run CREATE TABLE.'
      },
      {
        id: 'sql-create',
        title: 'DDL Practical 1: create a table with CREATE TABLE.',
        lead: 'Define a new table using CREATE TABLE name (column type rules, ...). Create course_notes linked to courses(id), then click Inspect in SQL Studio to run DESCRIBE course_notes;.',
        type: 'query',
        database: 'sql_lab',
        sql: 'CREATE TABLE course_notes (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  course_id INT NOT NULL,\n  note VARCHAR(200) NOT NULL,\n  created_on DATE NOT NULL,\n  FOREIGN KEY (course_id) REFERENCES courses(id)\n);',
        explain: {
          syntax: 'CREATE TABLE table_name (\n  col1 TYPE PRIMARY KEY AUTO_INCREMENT,\n  col2 TYPE NOT NULL,\n  FOREIGN KEY (col2) REFERENCES parent_table(parent_pk)\n);',
          parts: [
            ['CREATE TABLE course_notes', 'Creates a brand-new empty table named course_notes inside sql_lab.'],
            ['INT PRIMARY KEY AUTO_INCREMENT', 'Creates an integer ID column that uniquely identifies each row and auto-numbers 1, 2, 3…'],
            ['VARCHAR(200) / DATE NOT NULL', 'Defines required variable-length text (max 200 chars) and calendar date columns that cannot be left NULL.'],
            ['FOREIGN KEY (course_id) REFERENCES courses(id)', 'Links course_id to courses(id) so MariaDB rejects notes referencing a nonexistent course.']
          ]
        },
        expected: 'Table created empty. Re-running without Reset Unit 2 reports Error 1050 (table already exists).',
        question: 'Why store course_id INT instead of duplicating the course name text?',
        answer: 'Referencing courses(id) guarantees valid courses and prevents inconsistent course spellings.',
        notes: 'Run CREATE in SQL Studio, then click Inspect (DESCRIBE course_notes) to verify the MUL key marker on course_id.',
        inspectSql: 'DESCRIBE course_notes;'
      },
      {
        id: 'sql-alter',
        title: 'DDL Practical 2: reshape a table with ALTER TABLE.',
        lead: 'Tables evolve after creation. Use ALTER TABLE with ADD COLUMN, MODIFY COLUMN, or DROP COLUMN (DEFAULT 1 fills omitted values; CHECK restricts valid numbers to 1–3), then click Inspect after each preset.',
        type: 'query',
        database: 'sql_lab',
        prepare: 'prepare-course-notes',
        sql: 'ALTER TABLE course_notes\nADD COLUMN IF NOT EXISTS priority INT NOT NULL DEFAULT 1 CHECK (priority >= 1 AND priority <= 3);',
        explain: {
          syntax: 'ALTER TABLE tbl ADD COLUMN col TYPE ...;\nALTER TABLE tbl MODIFY COLUMN col NEW_TYPE ...;\nALTER TABLE tbl DROP COLUMN col;',
          parts: [
            ['ALTER TABLE course_notes', 'Modifies the column blueprint of an existing table without dropping its rows.'],
            ['ADD COLUMN IF NOT EXISTS ... DEFAULT 1', 'Appends a new priority column safely (skipping if already present) and sets default value 1.'],
            ['MODIFY COLUMN note VARCHAR(400)', 'Changes an existing column’s data type, length, or NULL rule in place.'],
            ['DROP COLUMN IF EXISTS priority', 'Permanently removes the priority column and its stored values from the table definition.']
          ]
        },
        expected: 'Adds priority INT DEFAULT 1. Run Presets 1 -> 2 -> 3 in order and click Inspect after each change.',
        question: 'Does ALTER TABLE ADD COLUMN insert new rows into course_notes?',
        answer: 'No. It alters the table schema and assigns the DEFAULT value to existing rows (if any).',
        notes: 'Click Prepare in SQL Studio if jumping straight to this step so course_notes starts cleanly without priority, then run Presets 1 -> 2 -> 3.',
        inspectSql: 'DESCRIBE course_notes;',
        presets: [
          ['1. Add priority column', 'ALTER TABLE course_notes ADD COLUMN IF NOT EXISTS priority INT NOT NULL DEFAULT 1 CHECK (priority >= 1 AND priority <= 3);'],
          ['2. Modify note length', 'ALTER TABLE course_notes MODIFY COLUMN note VARCHAR(400) NOT NULL;'],
          ['3. Drop priority column', 'ALTER TABLE course_notes DROP COLUMN IF EXISTS priority;']
        ]
      },
      {
        id: 'sql-delete-truncate-drop-theory',
        title: 'Theory compare: DELETE vs TRUNCATE vs DROP.',
        lead: 'Before running TRUNCATE and DROP live, compare all three removal commands side by side (we will practice DELETE row filtering in Section 2.2).',
        type: 'comparison',
        columns: ['Property', 'DELETE (DML)', 'TRUNCATE (DDL)', 'DROP (DDL)'],
        rows: [
          ['What it removes', 'Selected rows (or all rows if WHERE omitted)', 'All rows at once', 'Entire table (rows + column definitions)'],
          ['WHERE clause allowed?', 'Yes', 'No', 'No'],
          ['Table structure kept?', 'Yes', 'Yes (empty table remains)', 'No (table vanishes from SHOW TABLES)'],
          ['AUTO_INCREMENT reset?', 'No (continues from previous counter)', 'Yes (resets counter back to 1)', 'N/A (table no longer exists)'],
          ['Undoable with ROLLBACK?', 'Yes (inside a transaction)', 'No (commits immediately in MariaDB)', 'No (commits immediately in MariaDB)'],
          ['Where we practice it', 'Section 2.2 (next)', 'Next step (live demo)', 'Next step (live demo)']
        ],
        question: 'Suppose you want to clear all test rows from course_notes and restart id numbering at 1 while keeping the table ready for new notes tomorrow. Which command fits: DELETE, TRUNCATE, or DROP?',
        answer: 'TRUNCATE TABLE course_notes; — it clears all rows and resets AUTO_INCREMENT to 1 while keeping the empty table intact. (DROP removes the entire table definition; DELETE keeps the old counter.)',
        notes: 'Pause on this comparison in theory lecture—keep the focus on structure retention, WHERE filtering, AUTO_INCREMENT reset, and immediate DDL commit.'
      },
      {
        id: 'sql-drop-truncate',
        title: 'DDL Practical 3: run TRUNCATE and DROP live.',
        lead: 'Seed a note row, empty the table cleanly with TRUNCATE TABLE, then remove its definition altogether with DROP TABLE.',
        type: 'query',
        database: 'sql_lab',
        prepare: 'prepare-course-notes',
        sql: "INSERT INTO course_notes (course_id, note, created_on) VALUES (101, 'Check firewall lab', '2026-08-01');",
        explain: {
          syntax: 'TRUNCATE TABLE table_name;\nDROP TABLE [IF EXISTS] table_name;',
          parts: [
            ['INSERT INTO course_notes ...', 'Adds one sample note row so you can observe TRUNCATE emptying the table.'],
            ['TRUNCATE TABLE course_notes', 'Removes every row at once and resets AUTO_INCREMENT to 1 while keeping the empty table structure.'],
            ['DROP TABLE IF EXISTS course_notes', 'Deletes both the rows and the table definition completely (IF EXISTS avoids an error if already dropped).']
          ]
        },
        presets: [
          ['1. Seed a note', "INSERT INTO course_notes (course_id, note, created_on) VALUES (101, 'Check firewall lab', '2026-08-01');"],
          ['2. TRUNCATE rows', 'TRUNCATE TABLE course_notes;'],
          ['3. DROP table', 'DROP TABLE IF EXISTS course_notes;']
        ],
        expected: 'TRUNCATE removes all rows and resets AUTO_INCREMENT while keeping the empty table; DROP removes the entire definition.',
        question: 'Which command keeps the schema intact and resets AUTO_INCREMENT back to 1?',
        answer: 'TRUNCATE TABLE empties the table and resets AUTO_INCREMENT; DROP TABLE destroys both data and schema.',
        notes: 'Run Preset 1 -> Inspect (course_notes exists) -> Preset 2 (TRUNCATE) -> Preset 3 (DROP) -> Inspect again (empty table list).',
        inspectSql: "SHOW TABLES LIKE 'course_notes';"
      },
      {
        id: 'sql-dcl-preview',
        title: 'DCL Basics: GRANT, REVOKE & SHOW GRANTS.',
        lead: "DCL controls who can read or modify tables using two symmetric statements: GRANT <privileges> ON <db.table> TO '<user>'@'<host>'; and REVOKE <privileges> ON <db.table> FROM '<user>'@'<host>';. Inspect real server grants below (we will create users and run live GRANT/REVOKE in Unit 3).",
        type: 'query',
        database: 'college_demo',
        persona: 'dba_lab',
        sql: "SHOW GRANTS FOR 'reporting'@'%';",
        explain: {
          syntax: "SHOW GRANTS FOR 'user'@'host';\nGRANT priv ON db.tbl TO 'user'@'host';\nREVOKE priv ON db.tbl FROM 'user'@'host';",
          parts: [
            ["SHOW GRANTS FOR 'user'@'host'", 'Displays the exact permission rules currently assigned to that MariaDB account.'],
            ['GRANT ... ON db.* TO', 'Grants specific actions (like SELECT or INSERT) on a database or single table to an account.'],
            ['REVOKE ... ON db.* FROM', 'Removes previously granted actions from an account without deleting the account itself.']
          ]
        },
        presets: [
          ['Reporting grants', "SHOW GRANTS FOR 'reporting'@'%';"],
          ['Web app grants', "SHOW GRANTS FOR 'web_app'@'%';"],
          ['Console grants', "SHOW GRANTS FOR 'classroom_console'@'%';"]
        ],
        expected: 'Shows exact GRANT statements stored in MariaDB for each account.',
        question: 'Write the DCL syntax to grant INSERT on sql_lab.* to reporting, then remove it again.',
        answer: "GRANT INSERT ON sql_lab.* TO 'reporting'@'%';\nREVOKE INSERT ON sql_lab.* FROM 'reporting'@'%';",
        notes: 'Explain the symmetric syntax (GRANT ... TO vs REVOKE ... FROM); live account creation and permission changes run in Unit 3.5.'
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
        columns: ['Constraint', 'Rule Enforced', 'NULL & Delete Rules', 'Example Syntax'],
        rows: [
          ['PRIMARY KEY', 'Uniquely identifies each row (Entity Integrity)', 'Never NULL · 1 per table (may be composite)', 'id INT PRIMARY KEY AUTO_INCREMENT'],
          ['FOREIGN KEY', 'Matches existing parent key (Referential Integrity)', 'Yes unless NOT NULL · ON DELETE RESTRICT / CASCADE / SET NULL', 'FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT'],
          ['UNIQUE', 'Prevents duplicate non-NULL values (Alternate Key)', 'Yes (multiple NULLs allowed in SQL)', 'email VARCHAR(120) UNIQUE'],
          ['NOT NULL', 'Forbids missing/unknown values in column', 'Never NULL · Column-level only', 'name VARCHAR(100) NOT NULL'],
          ['CHECK', 'Boolean condition value must satisfy', 'Passes if UNKNOWN (pair with NOT NULL)', 'age INT CHECK (age >= 16)'],
          ['DEFAULT', 'Supplies fallback value when column omitted', 'Used only if column omitted on INSERT', "status VARCHAR(20) DEFAULT 'active'"]
        ],
        question: 'If a column has age INT CHECK (age >= 16) WITHOUT NOT NULL, will MariaDB accept INSERT with age = NULL?',
        answer: 'Yes! Because NULL means missing/unknown, NULL >= 16 evaluates to UNKNOWN rather than FALSE—and CHECK only rejects FALSE (we will examine SQL’s 3-valued NULL logic in Section 2.3). Pair CHECK with NOT NULL to block NULLs.',
        notes: 'Cover all 5 constraints and ON DELETE options (RESTRICT, CASCADE, SET NULL) before switching to student_edits.'
      },
      {
        id: 'sql-insert',
        title: 'Insert into a disposable edit copy using explicit columns.',
        lead: 'DML steps practice on sql_lab.student_edits (a disposable mirror of students) so source tables remain intact.',
        type: 'query',
        database: 'sql_lab',
        editCopy: true,
        prepare: 'reset-edit-copy',
        sql: "INSERT INTO student_edits (name, email, age, city, joined_on)\nVALUES ('Arun', 'arun.sql@example.com', 21, 'Pune', '2026-08-12');",
        explain: {
          syntax: "INSERT INTO table_name (col1, col2, ...) VALUES (val1, val2, ...);",
          parts: [
            ['INSERT INTO student_edits (...)', 'Adds a new row into student_edits and explicitly lists the column order you are providing.'],
            ['Omitting id', 'Safe because id is AUTO_INCREMENT, so MariaDB automatically generates id = 7.'],
            ['VALUES (...)', 'Supplies each column’s value in the exact same order (strings and dates in single quotes, numbers unquoted).']
          ]
        },
        expected: '1 row affected; id 7 is auto-generated while students remains untouched.',
        question: 'Why will clicking Run a second time fail immediately?',
        answer: 'The email column has a UNIQUE constraint, so inserting arun.sql@example.com again throws Error 1062.',
        notes: 'Click Inspect after inserting to show Arun with id 7, and show Restore edit copy in SQL Studio.',
        inspectSql: 'SELECT * FROM student_edits ORDER BY id;'
      },
      {
        id: 'sql-update',
        title: 'Always preview WHERE before running UPDATE.',
        lead: 'Test your WHERE filter with SELECT first, run the UPDATE preset, then Inspect the updated row.',
        type: 'query',
        database: 'sql_lab',
        editCopy: true,
        prepare: 'reset-edit-copy',
        sql: 'SELECT id, name, city FROM student_edits WHERE id = 2;',
        explain: {
          syntax: "UPDATE table_name SET col1 = new_val WHERE condition;",
          parts: [
            ['SELECT ... WHERE id = 2', 'Previews the exact target row(s) BEFORE changing anything—a crucial DBA safety habit.'],
            ['UPDATE student_edits SET city = \'Pune\'', 'Modifies the city column on matching rows without touching other columns.'],
            ['WHERE id = 2', 'Restricts the update to Riya’s row only—omitting WHERE would overwrite every student’s city!']
          ]
        },
        expected: 'Preview finds Riya (id 2). Updating sets her city to Pune.',
        question: 'Why filter by id = 2 instead of name = "Riya"?',
        answer: 'Primary key id uniquely identifies one row even if two students share the same first name.',
        notes: 'Click Prepare if needed, run Preview first, then load Update Riya, Run ⌘↵, and click Inspect.',
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
        prepare: 'reset-edit-copy',
        sql: 'DELETE FROM student_edits WHERE id = 6;',
        explain: {
          syntax: 'DELETE FROM table_name WHERE condition;',
          parts: [
            ['DELETE FROM student_edits', 'Removes whole rows from student_edits while leaving the table structure and constraints intact.'],
            ['WHERE id = 6', 'Targets only Dev’s primary key row so the other 5 students remain untouched.']
          ]
        },
        expected: '1 row affected when Dev is present; source students table still retains Dev.',
        question: 'Does DELETE FROM student_edits WHERE id = 6 drop the table schema?',
        answer: 'No. DELETE only removes matching tuples while keeping columns and constraints intact.',
        notes: 'Run DELETE and click Inspect to confirm only id 6 vanished from student_edits.',
        inspectSql: 'SELECT * FROM student_edits ORDER BY id;'
      },
      {
        id: 'sql-missing-where',
        title: 'The missing-WHERE disaster.',
        lead: 'See what happens when DELETE runs without any WHERE filter (safe here on student_edits).',
        type: 'query',
        database: 'sql_lab',
        editCopy: true,
        prepare: 'reset-edit-copy',
        sql: 'DELETE FROM student_edits;',
        explain: {
          syntax: 'DELETE FROM table_name;  /* NO WHERE = deletes EVERY row! */',
          parts: [
            ['DELETE FROM student_edits;', 'Valid SQL with no confirmation prompt—without a WHERE filter, every row in the table is erased immediately.'],
            ['Restore edit copy', 'Recovers all 6 baseline rows in student_edits from the untouched students table.']
          ]
        },
        expected: 'Every row is deleted. Click "Restore edit copy" afterward to restore all 6 baseline rows.',
        question: 'Can you still run SELECT * FROM student_edits after deleting every row?',
        answer: 'Yes. It returns 0 rows with all column headers still intact.',
        notes: 'Run DELETE, click Inspect to show the empty table, then use Restore edit copy in SQL Studio!',
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
        explain: {
          syntax: 'INSERT INTO ... VALUES (...);  /* Blocked by declared constraints */',
          parts: [
            ['Error 1062 (PK / UNIQUE)', 'Triggered when an INSERT duplicates an existing PRIMARY KEY id or UNIQUE email.'],
            ['Error 4025 (CHECK) & 1048 (NOT NULL)', '4025 rejects age = 12 (fails age >= 16); 1048 rejects NULL in the NOT NULL name column.'],
            ['Error 1452 (FOREIGN KEY)', 'Rejects inserting student_id = 999 into enrollments because no parent student 999 exists.']
          ]
        },
        expected: 'Every preset fails with a specific MariaDB error code enforcing its declared constraint.',
        question: 'Why does PK Collision fail with Error 1062 when student_edits has id = 1?',
        answer: 'id = 1 already exists in student_edits, so PRIMARY KEY rejects the duplicate key.',
        notes: 'Click Prepare first if arriving straight from the empty-table step! Step through all 5 presets.',
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
        lead: 'Here is the roadmap of how MariaDB evaluates a SELECT query. In this section we focus on FROM, WHERE, SELECT, and ORDER BY (and we will add GROUP BY and HAVING next in Section 2.4).',
        type: 'diagram',
        diagram: 'sql-execution-order',
        question: 'Why does SELECT age + 1 AS next_age FROM students WHERE next_age > 21 fail with Unknown column?',
        answer: 'Because WHERE (Stage 2) executes BEFORE SELECT (Stage 5) creates the alias next_age. ORDER BY (Stage 6) runs after SELECT, so aliases work there.',
        notes: 'Project this execution-order diagram early in Section 2.3—it explains almost every beginner SQL error in one visual.'
      },
      {
        id: 'sql-projection',
        title: 'Projection & DISTINCT.',
        lead: 'Choose output columns with SELECT and deduplicate values with DISTINCT.',
        type: 'query',
        database: 'sql_lab',
        sql: 'SELECT name, age FROM students ORDER BY id;',
        explain: {
          syntax: 'SELECT [DISTINCT] col1, col2 FROM table_name ORDER BY col;',
          parts: [
            ['SELECT name, age', 'Projection: returns only the columns you name instead of every column in the table.'],
            ['SELECT DISTINCT city', 'Eliminates duplicate city values from the output so each unique city (plus at most one NULL) appears once.'],
            ['ORDER BY ...', 'Sorts the projected rows predictably (NULL sorts first in ascending order in MariaDB).']
          ]
        },
        expected: 'Six rows with two columns; Dev shows NULL age. DISTINCT city collapses repeats into 4 rows.',
        question: 'How does SELECT DISTINCT treat multiple NULL cities if there were two Dev-like rows?',
        answer: 'DISTINCT groups all NULLs into a single NULL output entry.',
        notes: 'Run both presets and point out that NULL sorts first in ascending ORDER BY city.',
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
          ['Precedence: NOT > AND > OR', 'AND binds tighter than OR unless parenthesized', "(city='Mumbai' OR city='Delhi') AND age > 20"],
          ['IN (v1, v2, ...)', 'True if equal to any item; beware NULL in NOT IN!', "WHERE city IN ('Delhi', 'Kochi')"],
          ['BETWEEN a AND b', 'Inclusive endpoints (a <= x AND x <= b)', 'WHERE age BETWEEN 20 AND 23'],
          ['LIKE pattern', '% = 0+ chars, _ = exactly 1 char (case depends on collation)', "WHERE name LIKE 'a%'"],
          ['IS NULL / IS NOT NULL', 'Only valid way to test missing NULL values (= NULL is UNKNOWN!)', 'WHERE age IS NULL'],
          ['3-Valued Logic', 'TRUE AND UNKNOWN = UNKNOWN · TRUE OR UNKNOWN = TRUE', 'NOT (UNKNOWN) = UNKNOWN']
        ],
        question: 'If age is NULL, what does NOT (age > 20) evaluate to?',
        answer: 'UNKNOWN—not TRUE! Therefore WHERE NOT (age > 20) still drops Dev (NULL age) unless you also add OR age IS NULL.',
        notes: 'Review three-valued logic truth rules here before demonstrating live operator bugs.'
      },
      {
        id: 'sql-and-or',
        title: 'Operator precedence: AND binds tighter than OR.',
        lead: 'Always parenthesize mixed OR/AND conditions—remove the parentheses in Preset 2 and watch an unwanted row slip in.',
        type: 'query',
        database: 'sql_lab',
        sql: "SELECT name, city, age\nFROM students\nWHERE (city = 'Mumbai' OR city = 'Delhi') AND age > 20\nORDER BY id;",
        explain: {
          syntax: 'SELECT ... FROM tbl WHERE (cond1 OR cond2) AND cond3;',
          parts: [
            ['AND / OR', 'Combines boolean conditions: AND requires both sides true; OR requires at least one side true.'],
            ['( ... ) parentheses', 'Forces the OR check to evaluate first; without parentheses, SQL evaluates AND before OR.'],
            ['WHERE', 'Evaluates the combined condition row-by-row and keeps only rows where the result is TRUE.']
          ]
        },
        expected: 'With parentheses: 3 rows (Aman, Kabir, Zoya). Without parentheses: 4 rows (pulls in Riya, age 19, from Mumbai!).',
        question: 'Why did removing the parentheses add Riya (Mumbai, age 19) even though age > 20 was written?',
        answer: 'AND evaluates before OR, so MariaDB parsed it as: city = "Mumbai" OR (city = "Delhi" AND age > 20), matching every Mumbai student regardless of age.',
        notes: 'Click Preset 1 (3 rows) then Preset 2 (4 rows) so students see operator precedence cause a real bug live.',
        expectedRows: 3,
        presets: [
          ['With parentheses (3 rows)', "SELECT name, city, age FROM students WHERE (city = 'Mumbai' OR city = 'Delhi') AND age > 20 ORDER BY id;"],
          ['Missing parentheses (bug: 4 rows)', "SELECT name, city, age FROM students WHERE city = 'Mumbai' OR city = 'Delhi' AND age > 20 ORDER BY id;"]
        ]
      },
      {
        id: 'sql-in-between',
        title: 'IN operator sets, BETWEEN ranges & NOT IN NULL trap.',
        lead: 'IN checks membership cleanly against a list of values; BETWEEN matches an inclusive closed range.',
        type: 'query',
        database: 'sql_lab',
        sql: "SELECT name, city FROM students\nWHERE city IN ('Delhi', 'Kochi') ORDER BY id;",
        explain: {
          syntax: "WHERE col IN (v1, v2, ...)\nWHERE col BETWEEN low AND high\nWHERE col NOT IN (v1, v2)",
          parts: [
            ["IN ('Delhi', 'Kochi')", 'Shorthand for city = \'Delhi\' OR city = \'Kochi\'—checks if a value matches any item in the list.'],
            ['BETWEEN 20 AND 23', 'Matches an inclusive closed range (age >= 20 AND age <= 23), including both endpoints 20 and 23.'],
            ['NOT IN (20, NULL)', 'Expands to age <> 20 AND age <> NULL; because anything <> NULL is UNKNOWN, the entire filter drops every row!']
          ]
        },
        expected: 'IN returns 3 students (Aman, Kabir in Delhi; Meera in Kochi). BETWEEN returns 3 ages (20–23). NOT IN (20, NULL) returns 0 rows!',
        question: 'Why does age NOT IN (20, NULL) return zero rows—even for Aman whose age is 25?',
        answer: 'NOT IN (20, NULL) means (age <> 20 AND age <> NULL). Because 25 <> NULL evaluates to UNKNOWN, the AND becomes UNKNOWN and WHERE drops every row.',
        notes: 'Run all 3 presets! Preset 3 demonstrates one of SQL’s trickiest real-world NULL pitfalls live.',
        expectedRows: 3,
        presets: [
          ['1. City set (IN)', "SELECT name, city FROM students WHERE city IN ('Delhi','Kochi') ORDER BY id;"],
          ['2. Age range (BETWEEN)', 'SELECT name, age FROM students WHERE age BETWEEN 20 AND 23 ORDER BY age, id;'],
          ['3. NOT IN NULL trap (0 rows!)', 'SELECT name, age FROM students WHERE age NOT IN (20, NULL) ORDER BY id;']
        ]
      },
      {
        id: 'sql-like',
        title: 'Pattern matching with LIKE.',
        lead: '% matches zero or more characters; _ matches exactly one character.',
        type: 'query',
        database: 'sql_lab',
        sql: "SELECT name FROM students WHERE name LIKE 'a%' ORDER BY name;",
        explain: {
          syntax: "SELECT ... FROM tbl WHERE col LIKE 'pattern';",
          parts: [
            ['LIKE', 'Matches text strings against a wildcard pattern instead of requiring an exact = match.'],
            ['% wildcard', 'Matches zero, one, or many characters (\'a%\' = starts with a; \'%a%\' = contains a anywhere).'],
            ['_ wildcard', 'Matches exactly one single character (\'___\' = any name with exactly 3 characters).']
          ]
        },
        expected: '"a%" matches Aman (case-insensitive); "%a%" matches 5 names; "___" matches 3-letter names (Dev).',
        question: 'Why does LIKE "a%" match "Aman" even though A is uppercase?',
        answer: 'Because the column collation uses case-insensitive (_ci) matching. Use LIKE BINARY or a _cs collation when case matters.',
        notes: 'Contrast "a%" vs "%a%" vs "___" fixed-length wildcard matching.',
        expectedRows: 1,
        presets: [
          ['Starts with a (case-insensitive)', "SELECT name FROM students WHERE name LIKE 'a%' ORDER BY name;"],
          ['Contains a', "SELECT name FROM students WHERE name LIKE '%a%' ORDER BY name;"],
          ['Exactly 3 chars (___)', "SELECT name FROM students WHERE name LIKE '___' ORDER BY name;"]
        ]
      },
      {
        id: 'sql-null-filter',
        title: 'Three-valued logic: testing NULL properly.',
        lead: 'Compare age = NULL against age IS NULL and observe the difference.',
        type: 'query',
        database: 'sql_lab',
        sql: 'SELECT id, name, age, city FROM students WHERE age IS NULL ORDER BY id;',
        explain: {
          syntax: 'WHERE col IS NULL\nWHERE col IS NOT NULL',
          parts: [
            ['IS NULL', 'The only correct SQL predicate to find rows where a column value is missing (NULL).'],
            ['= NULL (pitfall)', 'Never matches anything because comparing with NULL evaluates to UNKNOWN, not TRUE.'],
            ['IS NOT NULL', 'Keeps only rows that have a known (non-missing) value in that column.']
          ]
        },
        expected: 'IS NULL returns Dev; age = NULL returns zero rows.',
        question: 'Why did WHERE age = NULL return an empty table rather than an error?',
        answer: 'It is valid syntax, but age = NULL yields UNKNOWN rather than TRUE for every row.',
        notes: 'Run "Compare to NULL (=)" first to show 0 rows, then switch back to "Correct NULL test".',
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
        explain: {
          syntax: 'SELECT ... FROM tbl ORDER BY col1 DESC, col2 ASC LIMIT N;',
          parts: [
            ['ORDER BY age DESC, id ASC', 'Sorts primarily by oldest age first (DESC), then breaks any ties cleanly by smallest id (ASC).'],
            ['LIMIT 3', 'Slices and returns only the first 3 rows after sorting finishes.']
          ]
        },
        expected: 'Aman (25), Zoya (23), Kabir (22).',
        question: 'Why include id ASC as a second sort key if ages are all unique today?',
        answer: 'As soon as two students share an age, LIMIT without a unique tie-breaker produces arbitrary order across queries.',
        notes: 'Also point out why WHERE age IS NOT NULL avoids relying on DBMS-specific NULL sort placement.',
        expectedRows: 3
      },
      {
        id: 'sql-case',
        title: 'Conditional expressions with CASE.',
        lead: 'Compute derived labels cleanly while handling NULL before inequality branches.',
        type: 'query',
        database: 'sql_lab',
        sql: "SELECT name, age,\n CASE WHEN age IS NULL THEN 'Unknown'\n      WHEN age >= 21 THEN '21 or older'\n      ELSE 'Under 21' END AS age_band\nFROM students ORDER BY id;",
        explain: {
          syntax: "CASE WHEN cond1 THEN val1 WHEN cond2 THEN val2 ELSE fallback END AS alias",
          parts: [
            ['CASE WHEN ... THEN ...', 'Works like an if / else-if expression inside SELECT, returning the first branch whose condition is TRUE.'],
            ['ELSE ... END AS age_band', 'Provides the fallback value when no earlier WHEN matches, closes with END, and names the output column age_band.']
          ]
        },
        expected: '6 rows with age_band labels; Dev cleanly displays Unknown instead of falling into ELSE.',
        question: 'What would Dev be labeled if we removed the WHEN age IS NULL branch?',
        answer: 'NULL >= 21 evaluates to UNKNOWN, so Dev would falsely fall into ELSE "Under 21"!',
        notes: 'Highlight putting IS NULL first in searched CASE expressions.',
        expectedRows: 6
      },
      {
        id: 'sql-filter-practice',
        title: 'Practice: filter and sort Mumbai/Delhi students.',
        lead: 'Write a query on sql_lab.students returning name, city, and age for students in Delhi or Mumbai aged at least 20, ordered oldest first (then id ASC).',
        type: 'challenge',
        database: 'sql_lab',
        hints: [
          "Use city IN ('Delhi', 'Mumbai') AND age >= 20.",
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
        notes: 'Let students run this in Student Mode and inspect the auto-checker feedback.'
      },
      {
        id: 'sql-filter-check',
        title: 'Checkpoint: pick the reliable Top-3 query.',
        lead: 'A scholarship report needs the top 3 exam scores from enrollments.',
        type: 'quiz',
        options: [
          'SELECT * FROM enrollments LIMIT 3',
          'SELECT * FROM enrollments WHERE score IS NOT NULL ORDER BY score DESC, student_id ASC, course_id ASC LIMIT 3',
          'SELECT * FROM enrollments ORDER BY score DESC LIMIT 3'
        ],
        correct: 1,
        feedback: 'Filter NULLs, sort descending, add composite PK tie-breakers, then apply LIMIT 3.',
        question: 'Student task: why does adding WHERE score IS NOT NULL and primary-key tie-breakers (student_id ASC, course_id ASC) matter before LIMIT 3?',
        answer: 'WHERE score IS NOT NULL excludes ungraded NULL rows cleanly regardless of NULL sort placement, and adding the composite primary key breaks score ties deterministically so Top-3 results stay consistent.',
        notes: 'Keep Section 2.3 focused cleanly on filtering, NULL handling, sorting, and LIMIT before introducing aggregates in Section 2.4.'
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
          ['COUNT(*) vs COUNT(col)', 'COUNT(*) counts all rows; COUNT(col) counts non-NULL values; COUNT(DISTINCT col) counts unique values', 'COUNT(score) skips NULL scores; COUNT(*) counts every row'],
          ['SUM / AVG / MIN / MAX', 'Ignore NULL inputs; AVG divides by non-NULL count only', 'All-NULL input returns NULL (except COUNT = 0)'],
          ['WHERE', 'Filters individual rows BEFORE grouping; cannot use aggregates', 'Faster: shrinks rows before grouping work'],
          ['HAVING', 'Filters aggregated groups AFTER GROUP BY; can use aggregates', 'Keep row-only checks in WHERE, not HAVING'],
          ['ONLY_FULL_GROUP_BY', 'Non-aggregated SELECT columns must appear in GROUP BY', 'MariaDB classroom mode enforces strict SQL here']
        ],
        question: 'Suppose a table has rows with scores (80, 100, NULL). What do COUNT(*), COUNT(score), SUM(score), and AVG(score) return?',
        answer: 'COUNT(*) = 3, COUNT(score) = 2, SUM(score) = 180, AVG(score) = 90 (180 / 2, NOT 180 / 3).',
        notes: 'Walk through the (80, 100, NULL) arithmetic example manually before running the live enrollments query next.'
      },
      {
        id: 'sql-count-null',
        title: 'COUNT(*) vs COUNT(column) and AVG with NULL.',
        lead: 'Zoya’s Database Security score is NULL. Watch how aggregates handle it.',
        type: 'query',
        database: 'sql_lab',
        sql: 'SELECT COUNT(*) AS enrollments, COUNT(score) AS graded,\n ROUND(AVG(score),2) AS mean_score, MIN(score) AS lowest, MAX(score) AS highest\nFROM enrollments;',
        explain: {
          syntax: 'SELECT COUNT(*), COUNT(col), AVG(col), MIN(col), MAX(col) FROM table_name;',
          parts: [
            ['COUNT(*) vs COUNT(score)', 'COUNT(*) counts every row (including NULLs); COUNT(score) counts only rows where score is NOT NULL.'],
            ['AVG / MIN / MAX', 'Compute the average, smallest, and largest non-NULL values across all matching rows.'],
            ['ROUND(expr, 2)', 'Rounds the numeric average cleanly to 2 decimal places.']
          ]
        },
        expected: '5 enrollments, 4 graded scores, mean 80.25 ((88+92+76+65)/4), min 65, max 92.',
        question: 'Does AVG(score) divide the sum by 5 enrollments or 4 non-NULL scores?',
        answer: 'It divides by 4 non-NULL scores. Including NULL as zero would lower the average to 64.20.',
        notes: 'Have students compute (88+92+76+65)/4 = 80.25 vs /5 = 64.20 before clicking Run.',
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
        explain: {
          syntax: 'SELECT COUNT(*), SUM(col), AVG(col) FROM table_name;',
          parts: [
            ['SUM(amount)', 'Adds up all non-NULL amount values across the entire table into a single total.'],
            ['AVG(amount)', 'Divides SUM(amount) by the number of payment rows (installments), not the number of distinct students.']
          ]
        },
        expected: '5 payment rows totaling 13,000.00; average per installment = 2,600.00.',
        question: 'Is 2,600 the average total paid per student?',
        answer: 'No. 2,600 is the mean per payment installment (13,000 / 5 payments), not per student (the 4 paying students average 3,250 each—use GROUP BY student_id for per-student totals).',
        notes: 'Highlight event-level vs entity-level averages: 5 installments sum to 13,000 (2,600/payment) across only 4 distinct paying students.',
        expectedRows: 1,
        expectedValues: [[5, '13000.00', '2600.00']]
      },
      {
        id: 'sql-group-by',
        title: 'Collapse rows into groups with GROUP BY & COUNT(DISTINCT).',
        lead: 'Every distinct city—including one bucket for NULL—produces one summary row.',
        type: 'query',
        database: 'sql_lab',
        sql: 'SELECT city, COUNT(*) AS students\nFROM students GROUP BY city ORDER BY city;',
        explain: {
          syntax: 'SELECT group_col, COUNT(*) FROM tbl GROUP BY group_col;\nSELECT COUNT(DISTINCT col) FROM tbl;',
          parts: [
            ['GROUP BY city', 'Buckets rows sharing the same city value into one summary row per city (with all NULLs grouped into one NULL bucket).'],
            ['COUNT(DISTINCT city)', 'Counts how many unique non-NULL city values exist across the table (ignores duplicates and NULL).']
          ]
        },
        expected: 'NULL: 1, Delhi: 2, Kochi: 1, Mumbai: 2 (4 rows). COUNT(DISTINCT city) returns 3 non-NULL cities.',
        question: 'With ONLY_FULL_GROUP_BY enabled, why can you not add ungrouped name to SELECT city, name, COUNT(*) ... GROUP BY city?',
        answer: 'Delhi has two students (Aman and Kabir). Picking one name arbitrarily for a single group row is ambiguous, so strict SQL rejects it (Error 1055).',
        notes: 'Compare Preset 1 (per-city buckets) with Preset 2 (COUNT(DISTINCT city) ignores NULL).',
        expectedRows: 4,
        presets: [
          ['Group by city', 'SELECT city, COUNT(*) AS students FROM students GROUP BY city ORDER BY city;'],
          ['COUNT(DISTINCT city)', 'SELECT COUNT(*) AS total_rows, COUNT(city) AS with_city, COUNT(DISTINCT city) AS unique_cities FROM students;']
        ]
      },
      {
        id: 'sql-having',
        title: 'Filter rows (WHERE) vs filter groups (HAVING).',
        lead: 'WHERE removes Dev before grouping; HAVING keeps only cities with 2+ students.',
        type: 'query',
        database: 'sql_lab',
        sql: 'SELECT city, COUNT(*) AS students\nFROM students WHERE city IS NOT NULL\nGROUP BY city HAVING COUNT(*) >= 2 ORDER BY city;',
        explain: {
          syntax: 'SELECT group_col, agg(col) FROM tbl WHERE row_cond GROUP BY group_col HAVING group_cond;',
          parts: [
            ['WHERE city IS NOT NULL', 'Runs BEFORE GROUP BY to drop individual rows with missing cities first.'],
            ['GROUP BY city', 'Combines the remaining rows into one bucket per city and computes COUNT(*).'],
            ['HAVING COUNT(*) >= 2', 'Runs AFTER GROUP BY to filter finished group summaries using aggregate results.']
          ]
        },
        expected: 'Delhi (2) and Mumbai (2).',
        question: 'In what logical order does SQL evaluate FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY?',
        answer: 'FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY -> LIMIT.',
        notes: 'Reinforce that WHERE filters rows while HAVING filters finished groups.',
        expectedRows: 2
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
        notes: 'Use this interactive diagram as the anchor map for Section 2.5.'
      },
      {
        id: 'sql-inner',
        title: 'INNER JOIN keeps only matching pairs.',
        lead: 'Aman matches twice; Meera and Dev have no enrollments and drop out.',
        type: 'query',
        database: 'sql_lab',
        sql: 'SELECT s.id, s.name, e.course_id\nFROM students s INNER JOIN enrollments e ON e.student_id = s.id\nORDER BY s.id, e.course_id;',
        explain: {
          syntax: 'SELECT a.col, b.col FROM left_tbl a INNER JOIN right_tbl b ON b.fk = a.pk;',
          parts: [
            ['students s / enrollments e', 'Short table aliases (s and e) let you qualify column names cleanly when joining tables.'],
            ['INNER JOIN', 'Combines rows from both tables and keeps ONLY pairs where the ON rule matches (unmatched rows are dropped).'],
            ['ON e.student_id = s.id', 'Specifies how rows in enrollments match rows in students.']
          ]
        },
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
        explain: {
          syntax: 'SELECT ... FROM left_tbl a LEFT JOIN right_tbl b ON b.fk = a.pk [WHERE b.fk IS NULL];',
          parts: [
            ['LEFT JOIN', 'Keeps EVERY row from the left table (students); if no enrollment matches, right-side columns are filled with NULL.'],
            ['WHERE e.student_id IS NULL', 'Anti-join pattern: filters the LEFT JOIN result to show ONLY left rows that had zero matches on the right.']
          ]
        },
        expected: '7 rows (5 matched + Meera & Dev padded with NULL); Unmatched-only preset finds Meera and Dev.',
        question: 'Why is LEFT JOIN ... WHERE right_pk IS NULL a classic way to find unmatched records?',
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
        explain: {
          syntax: 'SELECT ... FROM left_tbl a RIGHT JOIN right_tbl b ON a.fk = b.pk;',
          parts: [
            ['RIGHT JOIN', 'Mirror of LEFT JOIN: keeps EVERY row from the right table (courses) and pads unmatched left columns (e.student_id) with NULL.'],
            ['ON e.course_id = c.id', 'Matches each enrollment to its course ID while preserving courses that have zero enrollments.']
          ]
        },
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
        explain: {
          syntax: 'FROM left_tbl LEFT JOIN right_tbl ON match_cond AND right_filter',
          parts: [
            ['AND e.score >= 80 inside ON', 'Filters right-side rows DURING matching, so unmatched left courses still stay visible with NULL right columns.'],
            ['WHERE e.score >= 80 (Preset 2)', 'Runs AFTER the LEFT JOIN and discards NULL-padded rows because NULL >= 80 is UNKNOWN.']
          ]
        },
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
        id: 'sql-empty-course-count',
        title: 'Combine LEFT JOIN + GROUP BY: count child keys, never COUNT(*).',
        lead: 'Now combine Section 2.4 aggregation with LEFT JOIN: Cloud Security has 0 enrollments—compare COUNT(e.student_id) vs COUNT(*).',
        type: 'query',
        database: 'sql_lab',
        sql: 'SELECT c.course_name, COUNT(e.student_id) AS enrolled\nFROM courses c LEFT JOIN enrollments e ON e.course_id = c.id\nGROUP BY c.id, c.course_name ORDER BY c.id;',
        explain: {
          syntax: 'SELECT p.name, COUNT(c.fk) FROM parent p LEFT JOIN child c ON c.fk = p.pk GROUP BY p.pk, p.name;',
          parts: [
            ['LEFT JOIN enrollments e', 'Keeps empty courses like Cloud Security with e.student_id = NULL.'],
            ['COUNT(e.student_id)', 'Counts only non-NULL matched child keys, accurately returning 0 for empty courses (unlike COUNT(*) which would return 1!).'],
            ['GROUP BY c.id, c.course_name', 'Groups rows per course so strict ONLY_FULL_GROUP_BY mode stays satisfied.']
          ]
        },
        expected: 'Cybersecurity: 2, Database Security: 2, Python for Security: 1, Cloud Security: 0.',
        question: 'What wrong answer would COUNT(*) display for Cloud Security?',
        answer: 'COUNT(*) counts the NULL-extended LEFT JOIN row and falsely reports 1 enrolled student instead of 0.',
        notes: 'Edit COUNT(e.student_id) to COUNT(*) briefly in SQL Studio right after seeing LEFT JOIN padding so students observe Cloud Security falsely jumping to 1.',
        expectedRows: 4
      },
      {
        id: 'sql-three-tables',
        title: 'Chain joins across a many-to-many junction table.',
        lead: 'Connect students -> enrollments -> courses to read names instead of numeric IDs.',
        type: 'query',
        database: 'sql_lab',
        sql: 'SELECT s.name, c.course_name, e.score\nFROM students s\nJOIN enrollments e ON e.student_id = s.id\nJOIN courses c ON c.id = e.course_id\nORDER BY s.id, c.id;',
        explain: {
          syntax: 'FROM table_a a JOIN junction j ON j.a_id = a.id JOIN table_b b ON b.id = j.b_id;',
          parts: [
            ['JOIN (shorthand for INNER JOIN)', 'Chains multiple tables step-by-step: first matching students to enrollments, then matching each enrollment to courses.'],
            ['SELECT s.name, c.course_name, e.score', 'Pulls human-readable attributes from all three tables into one unified output table.']
          ]
        },
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
        explain: {
          syntax: 'FROM tbl a JOIN tbl b ON a.col = b.col AND a.id < b.id   /* SELF */\nFROM tbl_a CROSS JOIN tbl_b                              /* CARTESIAN */\nFROM tbl_a NATURAL JOIN tbl_b                            /* AUTO-NAME MATCH */',
          parts: [
            ['SELF JOIN (students s1 JOIN students s2)', 'Joins a table to itself using two distinct aliases to compare rows within the same table (s1.id < s2.id avoids duplicates).'],
            ['CROSS JOIN', 'Pairs every row of the left table with every row of the right table (no ON clause: 6 × 4 = 24 rows).'],
            ['NATURAL JOIN', 'Implicitly joins on every column sharing the exact same name—if zero column names match, it silently turns into a CROSS JOIN!']
          ]
        },
        expected: 'SELF JOIN finds pairs sharing a city (Aman & Kabir in Delhi; Riya & Zoya in Mumbai). CROSS JOIN yields 24 pairs.',
        question: 'Why does the SELF JOIN include AND s1.id < s2.id? And what makes NATURAL JOIN dangerous?',
        answer: 's1.id < s2.id removes self-pairs and mirror duplicates. NATURAL JOIN silently matches ALL same-named columns, breaking unexpectedly if columns are renamed or added later.',
        notes: 'Run all three presets! Inspect NATURAL JOIN: students JOIN enrollments shares no identical column names here (id vs student_id), producing 30 Cartesian rows!',
        expectedRows: 2,
        presets: [
          ['SELF JOIN (city peers)', 'SELECT s1.name AS student_a, s2.name AS student_b, s1.city FROM students s1 JOIN students s2 ON s1.city = s2.city AND s1.id < s2.id ORDER BY s1.city, s1.id;'],
          ['CROSS JOIN (6x4 = 24)', 'SELECT s.name, c.course_name FROM students s CROSS JOIN courses c ORDER BY s.id, c.id;'],
          ['NATURAL JOIN pitfall (30!)', 'SELECT s.id, s.name, e.course_id FROM students s NATURAL JOIN enrollments e ORDER BY s.id;']
        ]
      },
      {
        id: 'sql-set-ops-diagram',
        title: 'Visual guide: UNION, UNION ALL, INTERSECT & EXCEPT.',
        lead: 'Click each set operator to review how vertical result stacking differs from horizontal JOIN matching.',
        type: 'diagram',
        diagram: 'set-operations',
        question: 'Why must both SELECT branches have matching column counts and compatible types before running any set operator?',
        answer: 'Set operators stack rows vertically into one unified output table with column names taken from the first SELECT.',
        notes: 'Compare with the Join diagram: JOIN widens columns horizontally; set ops stack rows vertically.'
      },
      {
        id: 'sql-set-operations',
        title: 'Set operations: UNION, UNION ALL, INTERSECT & EXCEPT.',
        lead: 'Stack compatible query results vertically to intersect, subtract, or merge distinct/all sets.',
        type: 'query',
        database: 'sql_lab',
        sql: 'SELECT student_id FROM enrollments\nINTERSECT\nSELECT student_id FROM payments\nORDER BY student_id;',
        explain: {
          syntax: 'SELECT col FROM tbl_a  UNION | UNION ALL | INTERSECT | EXCEPT  SELECT col FROM tbl_b ORDER BY col;',
          parts: [
            ['UNION vs UNION ALL', 'Stacks rows from both queries vertically: UNION removes duplicates; UNION ALL keeps every row including repeats.'],
            ['INTERSECT', 'Returns distinct rows present in BOTH query results (students who both enrolled AND made a payment).'],
            ['EXCEPT', 'Returns distinct rows present in the FIRST query but absent from the SECOND (students who have not paid).']
          ]
        },
        expected: 'INTERSECT returns 4 student IDs (1,2,3,5). EXCEPT returns unpaid existing students (4=Meera, 6=Dev). UNION yields 4 unique IDs vs UNION ALL yielding 10.',
        question: 'Why does UNION return 4 rows when enrollments has 5 rows and payments has 5 rows?',
        answer: 'UNION removes duplicates across both tables (leaving student IDs 1, 2, 3, 5), whereas UNION ALL returns all 10 input rows including repeats.',
        notes: 'Run all four presets! Note MariaDB 10.3+ supports INTERSECT and EXCEPT natively.',
        expectedRows: 4,
        presets: [
          ['INTERSECT (both sets: 4)', 'SELECT student_id FROM enrollments INTERSECT SELECT student_id FROM payments ORDER BY student_id;'],
          ['EXCEPT (unpaid students: 4, 6)', 'SELECT id FROM students EXCEPT SELECT student_id FROM payments ORDER BY id;'],
          ['UNION (deduplicated: 4)', 'SELECT student_id FROM enrollments UNION SELECT student_id FROM payments ORDER BY student_id;'],
          ['UNION ALL (keeps repeats: 10)', 'SELECT student_id FROM enrollments UNION ALL SELECT student_id FROM payments ORDER BY student_id;']
        ]
      },
      {
        id: 'sql-full-join',
        title: 'FULL OUTER JOIN emulation in MariaDB (using UNION).',
        lead: 'Now combine LEFT JOIN with the UNION set operator you just learned so unmatched students AND unmatched courses both appear together.',
        type: 'query',
        database: 'sql_lab',
        sql: 'SELECT s.id AS student_id, s.name, c.id AS course_id, c.course_name\nFROM students s\nLEFT JOIN enrollments e ON e.student_id = s.id\nLEFT JOIN courses c ON c.id = e.course_id\nUNION\nSELECT s.id, s.name, c.id, c.course_name\nFROM courses c\nLEFT JOIN enrollments e ON e.course_id = c.id\nLEFT JOIN students s ON s.id = e.student_id\nORDER BY student_id, course_id;',
        explain: {
          syntax: 'SELECT ... FROM A LEFT JOIN B ...  UNION  SELECT ... FROM B LEFT JOIN A ... ORDER BY ...;',
          parts: [
            ['First LEFT JOIN branch', 'Preserves all matched enrollments PLUS unmatched students (Meera and Dev with NULL course columns).'],
            ['Second LEFT JOIN branch', 'Preserves all matched enrollments PLUS unmatched courses (Cloud Security with NULL student columns).'],
            ['UNION', 'Combines both halves vertically and automatically removes duplicate copies of the 5 matched rows.']
          ]
        },
        expected: '8 rows: all 5 matched enrollments + Meera + Dev + Cloud Security (with NULL student columns).',
        question: 'Why use UNION instead of UNION ALL when emulating FULL OUTER JOIN?',
        answer: 'UNION deduplicates the 5 matched rows that appear in both branches; UNION ALL would double-count matches.',
        notes: 'Highlight that MariaDB lacks a single FULL OUTER JOIN keyword and uses this standard LEFT JOIN + UNION idiom.',
        expectedRows: 8
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
          ['Derived Table (FROM)', 'Virtual inline table in FROM (...) AS alias', 'Pre-aggregates results before joining (practiced in Section 2.7)'],
          ['Correlated Subquery', 'Inner WHERE references outer table alias (e.g. s2.city = s.city)', 'Conceptually re-evaluated per outer candidate row'],
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
        explain: {
          syntax: 'SELECT ... FROM outer_tbl WHERE col IN (SELECT col FROM inner_tbl WHERE ...);',
          parts: [
            ['Inner SELECT (subquery)', 'Runs first and independently to produce a list of student IDs enrolled in course 101: (1, 3).'],
            ['WHERE id IN (...)', 'Checks each outer student row against that list—keeps the row if its id matches any item, without multiplying rows.']
          ]
        },
        expected: 'Aman (1) and Kabir (3).',
        question: 'Could an IN subquery ever duplicate outer student rows the way a join can?',
        answer: 'No. IN evaluates a boolean membership predicate per outer student row; it never multiplies rows.',
        notes: 'Contrast membership tests (IN / EXISTS) with row-combining joins.',
        expectedRows: 2
      },
      {
        id: 'sql-correlated',
        title: 'Correlated EXISTS & NOT EXISTS subqueries.',
        lead: 'The inner query references s.id from the outer row and stops as soon as one matching row is found.',
        type: 'query',
        database: 'sql_lab',
        sql: 'SELECT s.id, s.name FROM students s\nWHERE EXISTS (SELECT 1 FROM enrollments e WHERE e.student_id = s.id)\nORDER BY s.id;',
        explain: {
          syntax: 'SELECT ... FROM outer_tbl o WHERE [NOT] EXISTS (SELECT 1 FROM inner_tbl i WHERE i.fk = o.pk);',
          parts: [
            ['EXISTS / NOT EXISTS', 'Tests purely whether the inner query finds at least one matching row (TRUE) or zero rows (FALSE).'],
            ['WHERE e.student_id = s.id', 'Links the inner query to the current outer student row s—making this a correlated subquery.'],
            ['SELECT 1', 'Placeholder value because EXISTS cares only whether a row exists, not which columns are returned.']
          ]
        },
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
        explain: {
          syntax: 'SELECT ... FROM tbl WHERE col > (SELECT AGG(col) FROM tbl);',
          parts: [
            ['(SELECT AVG(score) FROM enrollments)', 'Scalar subquery: returns a single value (1 row × 1 column = 80.25) computed once across the table.'],
            ['WHERE score > (...)', 'Compares each row’s score against that computed number dynamically instead of hardcoding 80.25.']
          ]
        },
        expected: 'Aman’s 88 and 92.',
        question: 'What happens at runtime if a scalar subquery unexpectedly returns 2 rows?',
        answer: 'MariaDB raises Error 1242: Subquery returns more than 1 row.',
        notes: 'Explain scalar (single value) vs row vs table subqueries.',
        expectedRows: 2
      },
      {
        id: 'sql-correlated-scalar',
        title: 'Correlated comparison subquery (per-group threshold).',
        lead: 'Find students who are older than the average age of their own city (Delhi avg = 23.5, Mumbai avg = 21.0).',
        type: 'query',
        database: 'sql_lab',
        sql: 'SELECT s.name, s.city, s.age\nFROM students s\nWHERE s.age > (\n  SELECT AVG(s2.age) FROM students s2 WHERE s2.city = s.city\n)\nORDER BY s.id;',
        explain: {
          syntax: 'SELECT ... FROM tbl outer_a WHERE outer_a.val > (SELECT AVG(inner_a.val) FROM tbl inner_a WHERE inner_a.grp = outer_a.grp);',
          parts: [
            ['students s vs students s2', 'Uses two separate aliases for the same table so MariaDB distinguishes the outer row (s) from inner rows (s2).'],
            ['WHERE s2.city = s.city', 'Correlates each outer student to only the peer students in that exact same city before computing AVG(s2.age).']
          ]
        },
        expected: 'Returns Aman (25 in Delhi > 23.5) and Zoya (23 in Mumbai > 21.0); 2 rows.',
        question: 'Why can you not highlight the inner SELECT AVG(s2.age) ... WHERE s2.city = s.city and run it alone?',
        answer: 'Because s.city refers to the outer students alias s! Inside a correlated subquery, the inner AVG recomputes dynamically for each candidate outer student city.',
        notes: 'Classic textbook exam example of a non-EXISTS correlated subquery: compare it directly against the overall scalar subquery right before it!',
        expectedRows: 2
      },
      {
        id: 'sql-any-all',
        title: 'Quantified comparisons: ANY and ALL.',
        lead: 'Compare scores against course 101’s known scores (65 and 88).',
        type: 'query',
        database: 'sql_lab',
        sql: 'SELECT student_id, course_id, score FROM enrollments\nWHERE score > ALL (SELECT score FROM enrollments WHERE course_id=101 AND score IS NOT NULL)\nORDER BY student_id, course_id;',
        explain: {
          syntax: 'WHERE col > ALL (SELECT col FROM ...)\nWHERE col > ANY (SELECT col FROM ...)',
          parts: [
            ['> ALL (subquery)', 'TRUE only when score beats EVERY single value returned by the subquery (beats both 65 and 88 -> only 92).'],
            ['> ANY (subquery)', 'TRUE when score beats AT LEAST ONE value returned by the subquery (beats 65 -> 76, 88, 92).'],
            ['AND score IS NOT NULL', 'Guards against NULL values inside the subquery set, which would otherwise make > ALL evaluate to UNKNOWN.']
          ]
        },
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
          ['Simple View', 'Single base table, no GROUP BY, DISTINCT, HAVING, or aggregates', 'YES (writes pass cleanly through to base table)'],
          ['Complex View', 'Aggregates, GROUP BY, DISTINCT, UNION, subqueries, or TEMPTABLE joins', 'NO (Read-only reporting & security abstraction)'],
          ['WITH CHECK OPTION', 'Rejects INSERT/UPDATE through view if new row fails view’s WHERE rule', 'Prevents rows vanishing out of the view (Error 1369)'],
          ['Virtual vs Materialized', 'Virtual recomputes dynamically; Materialized stores snapshot rows physically', 'MariaDB views are Virtual; summary tables emulate Materialized'],
          ['ALGORITHM (MERGE/TEMPTABLE)', 'MERGE folds view SQL into caller query; TEMPTABLE builds temp result first', 'TEMPTABLE required when GROUP BY/aggregates used'],
          ['SQL SECURITY', 'DEFINER (runs with creator’s rights) vs INVOKER (caller’s rights)', 'INVOKER prevents unintended privilege escalation']
        ],
        question: 'Why do DBAs expose a view instead of granting direct SELECT on base tables?',
        answer: 'Views hide sensitive columns (salary, passwords), simplify complex joins, and provide Logical Data Independence when underlying schemas refactor.',
        notes: 'Cover every bullet of "View and its types" from the MSCNS406 syllabus clearly before creating views live.'
      },
      {
        id: 'sql-create-view',
        title: 'Reusable joined & aggregated views.',
        lead: 'Create both course_roster (joined view) and v_course_summary (complex GROUP BY + TEMPTABLE view), then inspect their rows.',
        type: 'query',
        database: 'sql_lab',
        sql: 'CREATE OR REPLACE SQL SECURITY INVOKER VIEW course_roster AS\nSELECT s.id AS student_id, s.name, c.id AS course_id, c.course_name, e.score\nFROM students s\nJOIN enrollments e ON e.student_id=s.id\nJOIN courses c ON c.id=e.course_id;',
        explain: {
          syntax: 'CREATE OR REPLACE [ALGORITHM=MERGE|TEMPTABLE] SQL SECURITY INVOKER VIEW view_name AS SELECT ...;',
          parts: [
            ['CREATE OR REPLACE VIEW name AS', 'Saves a named virtual query in the database so users can run SELECT * FROM view_name like a table.'],
            ['SQL SECURITY INVOKER', 'Checks permissions against whoever queries the view rather than whoever created it.'],
            ['ALGORITHM=TEMPTABLE (Preset 2)', 'Materializes GROUP BY / aggregate results into a temporary table before returning them (making the view read-only).']
          ]
        },
        expected: 'Preset 1 creates course_roster (5 rows via Inspect); Presets 2 & 3 create and query v_course_summary (4 courses with enrolled_count and avg_score).',
        question: 'Why is a GROUP BY view like v_course_summary completely non-updatable compared to a single-table view?',
        answer: 'An aggregated row collapses multiple students into COUNT(*) / AVG(score), so there is no unique 1-to-1 base row to receive an INSERT or UPDATE.',
        notes: 'Run Preset 1 -> Inspect (course_roster), then Presets 2 & 3 (v_course_summary), and point out SQL SECURITY INVOKER vs DEFINER.',
        inspectSql: 'SELECT * FROM course_roster ORDER BY student_id, course_id;',
        presets: [
          ['1. Joined view (course_roster)', 'CREATE OR REPLACE SQL SECURITY INVOKER VIEW course_roster AS SELECT s.id AS student_id, s.name, c.id AS course_id, c.course_name, e.score FROM students s JOIN enrollments e ON e.student_id=s.id JOIN courses c ON c.id=e.course_id;'],
          ['2. Complex view (v_course_summary)', 'CREATE OR REPLACE ALGORITHM=TEMPTABLE SQL SECURITY INVOKER VIEW v_course_summary AS SELECT c.id AS course_id, c.course_name, COUNT(e.student_id) AS enrolled_count, ROUND(AVG(e.score), 1) AS avg_score FROM courses c LEFT JOIN enrollments e ON e.course_id = c.id GROUP BY c.id, c.course_name;'],
          ['3. Query v_course_summary', 'SELECT * FROM v_course_summary ORDER BY course_id;']
        ]
      },
      {
        id: 'sql-view-types',
        title: 'Simple updatable view & WITH CHECK OPTION.',
        lead: 'A Simple single-table view accepts updates—and WITH CHECK OPTION prevents modifying rows outside its WHERE rule!',
        type: 'query',
        database: 'sql_lab',
        sql: "CREATE OR REPLACE VIEW v_delhi_students AS\nSELECT id, name, email, age, city, joined_on\nFROM student_edits\nWHERE city = 'Delhi'\nWITH CHECK OPTION;",
        explain: {
          syntax: "CREATE OR REPLACE VIEW view_name AS SELECT ... FROM single_table WHERE rule WITH CHECK OPTION;",
          parts: [
            ['Simple view on student_edits', 'Maps 1-to-1 to a single base table with no GROUP BY/aggregates, so UPDATE passes cleanly through to student_edits.'],
            ['WITH CHECK OPTION', 'Blocks any INSERT or UPDATE through the view that would cause the modified row to fail WHERE city = \'Delhi\' (Error 1369).']
          ]
        },
        expected: 'Simple updatable view created. Valid age update succeeds; moving Aman out of Delhi fails with Error 1369!',
        question: 'What is the difference between a Virtual View (standard in MariaDB) and a Materialized View?',
        answer: 'A Virtual View stores only the query definition and recomputes on read; a Materialized View stores precomputed snapshot rows physically on disk.',
        notes: 'Run presets in order: 1) Create view -> 2) Update within rule -> 3) Try breaking filter (1369) -> click Inspect to verify.',
        prepare: 'reset-edit-copy',
        editCopy: true,
        inspectSql: 'SELECT * FROM v_delhi_students ORDER BY id;',
        presets: [
          ['1. Create view (WITH CHECK OPTION)', "CREATE OR REPLACE VIEW v_delhi_students AS SELECT id, name, email, age, city, joined_on FROM student_edits WHERE city = 'Delhi' WITH CHECK OPTION;"],
          ['2. Valid update inside view', 'UPDATE v_delhi_students SET age = 26 WHERE id = 1;'],
          ['3. Blocked outside-filter edit (1369)', "UPDATE v_delhi_students SET city = 'Pune' WHERE id = 1;"]
        ]
      },
      {
        id: 'sql-view-alter-drop',
        title: 'Inspect, ALTER VIEW, and DROP VIEW.',
        lead: 'Check INFORMATION_SCHEMA.VIEWS to compare Simple Updatable (IS_UPDATABLE=YES) vs Complex Non-Updatable (NO for v_course_summary), alter a view, and drop temporary views.',
        type: 'query',
        database: 'sql_lab',
        prepare: 'prepare-course-roster',
        sql: "SELECT TABLE_NAME, CHECK_OPTION, IS_UPDATABLE, SECURITY_TYPE\nFROM information_schema.VIEWS\nWHERE TABLE_SCHEMA = 'sql_lab'\nORDER BY TABLE_NAME;",
        explain: {
          syntax: 'SELECT ... FROM information_schema.VIEWS;\nALTER [ALGORITHM=...] VIEW name AS SELECT ...;\nDROP VIEW [IF EXISTS] name;',
          parts: [
            ['information_schema.VIEWS', 'System catalog listing every view’s CHECK_OPTION, IS_UPDATABLE flag (YES/NO), and SECURITY_TYPE.'],
            ['ALTER VIEW', 'Redefines an existing view’s SELECT query (for example adding c.fee to v_course_summary) without dropping it first.'],
            ['SHOW FULL TABLES / DROP VIEW', 'SHOW FULL TABLES labels each object BASE TABLE vs VIEW; DROP VIEW deletes the saved view definition without touching base rows.']
          ]
        },
        presets: [
          ['1. Inspect VIEWS catalog', "SELECT TABLE_NAME, CHECK_OPTION, IS_UPDATABLE, SECURITY_TYPE FROM information_schema.VIEWS WHERE TABLE_SCHEMA = 'sql_lab' ORDER BY TABLE_NAME;"],
          ['2. ALTER VIEW v_course_summary', 'ALTER ALGORITHM=TEMPTABLE SQL SECURITY INVOKER VIEW v_course_summary AS SELECT c.id AS course_id, c.course_name, c.fee, COUNT(e.student_id) AS enrolled_count, ROUND(AVG(e.score), 1) AS avg_score FROM courses c LEFT JOIN enrollments e ON e.course_id = c.id GROUP BY c.id, c.course_name, c.fee;'],
          ['3. SHOW FULL TABLES (BASE vs VIEW)', 'SHOW FULL TABLES;'],
          ['4. Drop v_delhi_students', 'DROP VIEW IF EXISTS v_delhi_students;']
        ],
        expected: 'v_course_summary reports IS_UPDATABLE = NO (Complex GROUP BY + TEMPTABLE view), while course_roster (and v_delhi_students from the prior step) report YES.',
        question: 'What are MariaDB’s view ALGORITHM options (MERGE vs TEMPTABLE)?',
        answer: 'MERGE folds the view query directly into the caller’s SQL; TEMPTABLE materializes view rows into an internal temporary table first (required for GROUP BY/aggregates).',
        notes: 'Click Prepare if views were not created earlier; run presets 1–4 to inspect, alter, and clean up.'
      },
      {
        id: 'sql-subquery-check',
        title: 'Checkpoint: filtering with EXISTS and views.',
        lead: 'Choose the best pattern for identifying students with zero enrollments.',
        type: 'quiz',
        options: [
          'WHERE NOT EXISTS with a correlated subquery on enrollments',
          'WHERE EXISTS without any WHERE clause inside',
          'WHERE score > ALL (SELECT score FROM enrollments)'
        ],
        correct: 0,
        feedback: 'Correlated NOT EXISTS clearly expresses non-existence without NULL traps.',
        question: 'Student task: query course_roster for rows with score >= 80 (or query v_course_summary for courses with avg_score >= 80).',
        answer: 'SELECT name, course_name, score FROM course_roster WHERE score >= 80 ORDER BY student_id, course_id;',
        notes: 'Summarize subquery categories (scalar, IN, correlated, ANY/ALL) and view types (simple, complex, WITH CHECK OPTION).'
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
        notes: 'Group all built-in function categories here before running the live numeric, string, and date queries.'
      },
      {
        id: 'sql-numeric-functions',
        title: 'Built-in numeric functions.',
        lead: 'Round, truncate, raise powers, compute remainders, and handle absolute values in SQL expressions.',
        type: 'query',
        database: 'sql_lab',
        sql: "SELECT id AS payment_id, amount,\n ROUND(amount * 1.18, 2) AS with_gst,\n CEIL(amount / 1500) AS ceiling_slots,\n FLOOR(amount / 1500) AS floor_slots,\n MOD(amount, 1500) AS remainder,\n ABS(-42) AS abs_demo\nFROM payments ORDER BY id;",
        explain: {
          syntax: 'ROUND(x, d)  |  TRUNCATE(x, d)  |  CEIL(x)  |  FLOOR(x)  |  MOD(a, b)  |  ABS(x)  |  POWER(x, y)  |  SQRT(x)',
          parts: [
            ['ROUND(x, d) vs TRUNCATE(x, d)', 'ROUND rounds to d decimal places; TRUNCATE cuts off extra digits without rounding.'],
            ['CEIL(x) vs FLOOR(x)', 'CEIL rounds up to the next integer; FLOOR rounds down to the previous integer.'],
            ['MOD(a, b) & ABS(x)', 'MOD returns the integer division remainder; ABS strips the minus sign to return magnitude.']
          ]
        },
        expected: 'Demonstrates ROUND, CEIL, FLOOR, MOD, and ABS across all 5 payments.',
        question: 'How do ROUND(12.678, 1) and TRUNCATE(12.678, 1) differ?',
        answer: 'ROUND rounds to nearest (12.7), whereas TRUNCATE chops off digits beyond the decimal places (12.6).',
        notes: 'Switch to "Math toolbox" preset to demonstrate POWER, SQRT, TRUNCATE, and SIGN.',
        expectedRows: 5,
        presets: [
          ['Payments math', 'SELECT id AS payment_id, amount, ROUND(amount * 1.18, 2) AS with_gst, CEIL(amount / 1500) AS ceiling_slots, FLOOR(amount / 1500) AS floor_slots, MOD(amount, 1500) AS remainder, ABS(-42) AS abs_demo FROM payments ORDER BY id;'],
          ['Math toolbox', 'SELECT POWER(2, 10) AS two_pow_10, SQRT(144) AS sqrt_144, ROUND(80.256, 2) AS rounded, TRUNCATE(80.256, 2) AS truncated, SIGN(-15) AS sign_neg;']
        ]
      },
      {
        id: 'sql-text-functions',
        title: 'Built-in string & NULL-handling functions.',
        lead: 'Format, slice, trim, replace text, and normalize missing values with COALESCE / NULLIF.',
        type: 'query',
        database: 'sql_lab',
        sql: "SELECT name, UPPER(name) AS upper_name, LOWER(name) AS lower_name,\n CHAR_LENGTH(name) AS chars, SUBSTRING(email, 1, 6) AS email_prefix,\n CONCAT(name, ' <', email, '>') AS formatted_contact\nFROM students ORDER BY id;",
        explain: {
          syntax: "UPPER(s) | LOWER(s) | CHAR_LENGTH(s) | SUBSTRING(s, start, len) | CONCAT(a, b)\nTRIM(s) | REPLACE(s, old, new) | COALESCE(a, fallback) | NULLIF(a, b)",
          parts: [
            ['UPPER / LOWER / TRIM / REPLACE', 'Transforms letter case, strips outer spaces, or substitutes substrings in output text.'],
            ['CHAR_LENGTH / SUBSTRING / CONCAT', 'Counts characters (1-indexed), slices a substring starting at position 1, and joins strings together.'],
            ['COALESCE(NULLIF(city, \'\'), \'Not supplied\')', 'NULLIF converts empty string \'\' to NULL; COALESCE then returns the first non-NULL fallback value.']
          ]
        },
        expected: 'Six formatted rows; COALESCE(NULLIF(city, ""), "Not supplied") displays clean fallback text for Dev without modifying base rows.',
        question: 'Why prefer CHAR_LENGTH() over LENGTH() when dealing with UTF-8 strings? And does COALESCE replace empty string ""?',
        answer: 'CHAR_LENGTH() counts characters whereas LENGTH() counts bytes. COALESCE only replaces NULL, so combine COALESCE(NULLIF(col, ""), fallback) to handle both.',
        notes: 'Step through all 3 presets: Student strings, Trim & replace, and COALESCE / NULLIF.',
        expectedRows: 6,
        presets: [
          ['Student strings', "SELECT name, UPPER(name) AS upper_name, LOWER(name) AS lower_name, CHAR_LENGTH(name) AS chars, SUBSTRING(email, 1, 6) AS email_prefix, CONCAT(name, ' <', email, '>') AS formatted_contact FROM students ORDER BY id;"],
          ['Trim & replace', "SELECT TRIM('  DBMS Lab  ') AS trimmed, REPLACE('Database Security', 'Security', 'Admin') AS replaced;"],
          ['COALESCE & NULLIF', "SELECT name, COALESCE(NULLIF(city, ''), 'Not supplied') AS city_label FROM students ORDER BY id;"]
        ]
      },
      {
        id: 'sql-date-functions',
        title: 'Built-in date & time functions.',
        lead: 'Extract calendar parts, shift intervals, format dates, and query current server time.',
        type: 'query',
        database: 'sql_lab',
        sql: "SELECT name, joined_on,\n YEAR(joined_on) AS join_year,\n MONTHNAME(joined_on) AS join_month,\n DATE_FORMAT(joined_on, '%d %b %Y') AS formatted_date,\n DATE_ADD(joined_on, INTERVAL 30 DAY) AS review_due,\n DATEDIFF('2026-09-01', joined_on) AS days_since_joining\nFROM students ORDER BY id;",
        explain: {
          syntax: "YEAR(d) | MONTHNAME(d) | DATE_FORMAT(d, fmt)\nDATE_ADD(d, INTERVAL n DAY) | DATEDIFF(end_d, start_d) | CURDATE() | NOW()",
          parts: [
            ['YEAR / MONTHNAME / DATE_FORMAT', 'Extracts numeric year, full month name, or custom display formats like "01 Jul 2026".'],
            ['DATE_ADD / DATE_SUB / DATEDIFF', 'Shifts dates forward/backward by an INTERVAL or computes exact whole days between two dates.'],
            ['CURDATE() / NOW() / LAST_DAY()', 'Reads the MariaDB server’s current date, current timestamp, or final day of the month.']
          ]
        },
        expected: 'Aman: 62 days, Riya: 60, Kabir: 53, Meera: 48, Zoya: 31, Dev: 22.',
        question: 'Why pass literal "2026-09-01" instead of CURDATE() in deterministic classroom tests?',
        answer: 'A fixed reference date guarantees reproducible row counts every semester; CURDATE() / NOW() work identically for live dashboards.',
        notes: 'Also click "Live clock & DATE_SUB" to demonstrate NOW(), CURDATE(), and relative intervals.',
        expectedRows: 6,
        presets: [
          ['Student join dates', "SELECT name, joined_on, YEAR(joined_on) AS join_year, MONTHNAME(joined_on) AS join_month, DATE_FORMAT(joined_on, '%d %b %Y') AS formatted_date, DATE_ADD(joined_on, INTERVAL 30 DAY) AS review_due, DATEDIFF('2026-09-01', joined_on) AS days_since_joining FROM students ORDER BY id;"],
          ['Live clock & DATE_SUB', 'SELECT CURDATE() AS today, NOW() AS current_ts, DATE_SUB(CURDATE(), INTERVAL 7 DAY) AS one_week_ago, LAST_DAY(CURDATE()) AS month_end;']
        ]
      },
      {
        id: 'sql-payment-report',
        title: 'Pre-aggregate before joining to prevent row multiplication.',
        lead: 'Sum payments inside a derived subquery first, then LEFT JOIN students to get true per-student totals.',
        type: 'query',
        database: 'sql_lab',
        sql: 'SELECT s.id, s.name, COALESCE(p.total_paid,0) AS total_paid\nFROM students s LEFT JOIN\n (SELECT student_id, SUM(amount) AS total_paid FROM payments GROUP BY student_id) p\n ON p.student_id=s.id\nORDER BY s.id;',
        explain: {
          syntax: 'SELECT s.id, COALESCE(sub.total, 0) FROM students s LEFT JOIN (SELECT fk, SUM(amt) AS total FROM child GROUP BY fk) sub ON sub.fk = s.id;',
          parts: [
            ['Derived table (SELECT ... GROUP BY) p', 'Collapses multiple payment rows into exactly ONE summary row per student_id BEFORE joining.'],
            ['LEFT JOIN ... ON p.student_id = s.id', 'Preserves unpaid students (Meera and Dev) with p.total_paid = NULL.'],
            ['COALESCE(p.total_paid, 0)', 'Turns NULL totals for unpaid students into a clean 0.00 in the final report.']
          ]
        },
        expected: 'Aman 6000, Riya 4000, Kabir 2000, Meera 0, Zoya 1000, Dev 0.',
        question: 'What happens if someone joins students -> enrollments -> payments and sums payments directly?',
        answer: 'Aman has 2 enrollments and 2 payments, producing 4 rows and falsely doubling his paid total to 12,000!',
        notes: 'Highlight fan-out join multiplication: pre-aggregate child branches before joining.',
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
        question: 'Write your query against sql_lab, verify it with Check my answer, then advance to Unit 3.',
        answer: 'SELECT c.id, c.course_name, COUNT(e.student_id) AS enrolled,\n       COUNT(e.score) AS graded, ROUND(AVG(e.score), 2) AS mean_score\nFROM courses c\nLEFT JOIN enrollments e ON e.course_id = c.id\nGROUP BY c.id, c.course_name\nORDER BY c.id;\n\nExpected: 101 -> 2, 2, 76.50; 102 -> 2, 1, 76.00; 103 -> 1, 1, 92.00; 104 -> 0, 0, NULL.',
        notes: 'Walk through Cloud Security showing 0, 0, NULL after students pass, then click Unit 3 → in the dock to start MariaDB Concepts, Security & Authentication.'
      }
    ]
  }
);

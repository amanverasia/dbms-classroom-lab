/* Course registry — Unit 1: Introductory Concepts of DBMS (MSCNS406). */
window.COURSE = {
  title: 'Database Administration & Security',
  units: [
    { id: 'u1', title: 'Introductory concepts of DBMS', status: 'ready', hours: 10 },
    { id: 'u2', title: 'SQL Concepts', status: 'ready', hours: 10 },
    { id: 'u3', title: 'MariaDB Concepts, Security & Authentication', status: 'ready', hours: 10 },
    { id: 'u4', title: 'Monitoring & Maintenance of MariaDB', status: 'ready', hours: 10 }
  ],
  sections: [
    {
      id: 'why', unit: 'u1', number: '1.1', title: 'Why databases & DBMS applications', minutes: 60,
      objective: 'Explain the purpose of a DBMS, common real-world applications, and problems solved beyond raw file storage.',
      steps: [
        {
          id: 'college-problem',
          title: 'One college. Thousands of facts.',
          lead: 'Names, courses, attendance, marks and fees. Start with a familiar question: where would you keep all of this?',
          type: 'cards',
          cards: [
            ['5,000 students', 'Each has contact details, a course and a history of changes.'],
            ['Multiple teams', 'Admissions, teachers and accounts all need different parts of the data.'],
            ['Every day', 'People join, change courses, pay fees and correct mistakes.']
          ],
          question: 'Could we put everything in a spreadsheet? What would become difficult?',
          answer: 'Yes, a small spreadsheet works at first. As concurrent users, security boundaries, and linked records grow, keeping copies consistent, enforcing rules, and recovering failed writes becomes fragile.',
          notes: 'Collect answers before introducing the term DBMS. Ask what breaks when admissions, accounts, and faculty edit separate spreadsheet files.'
        },
        {
          id: 'applications-dbms',
          title: 'Where DBMS software runs every day.',
          lead: 'Nearly every multi-user software system relies on a DBMS to keep critical facts consistent under heavy activity.',
          type: 'cards',
          cards: [
            ['Banking & FinTech', 'Account balances, UPI/card transfers, and fraud audit trails requiring atomic all-or-nothing updates.'],
            ['Airlines & Rail', 'Seat inventories and reservations where two travelers must never book the exact same seat.'],
            ['Universities & Healthcare', 'Student transcripts, fee ledgers, and patient records requiring strict role-based privacy.']
          ],
          question: 'Why cannot an airline or bank simply save JSON files into a shared folder?',
          answer: 'Shared files lack atomic multi-record updates, fine-grained permissions (every file reader could see or corrupt all rows), and row-level concurrency control when thousands of users act at once.',
          notes: 'Walk through each card and tie it directly to course themes: transactions (banking), row locks (airlines), and privileges (universities/healthcare).'
        },
        {
          id: 'conflicting-copies',
          title: 'Which copy tells the truth?',
          lead: 'These are three copies of the same course name. Change one and watch the others fall behind.',
          type: 'copies',
          question: 'Has the college changed its course name, or only one file?',
          answer: 'Only one copy changed. Repetition makes it easy for copies to disagree. A shared course record eliminates update anomalies.',
          notes: 'Click "Update admissions copy" first so students see the conflict, then click "Use a shared course record". Emphasize this is a conceptual widget before touching SQL.'
        },
        {
          id: 'file-vs-dbms',
          title: 'Turn file-system flaws into DBMS guarantees.',
          lead: 'File systems solve raw byte storage; a DBMS manages structure, consistency, isolation, security, and recovery.',
          type: 'comparison',
          columns: ['Problem in file systems', 'Manual file workflow', 'DBMS capability'],
          rows: [
            ['Data redundancy & inconsistency', 'Update every duplicate file manually', 'Normalized tables and shared identifiers'],
            ['Data isolation', 'Write custom scripts per file format', 'Uniform declarative SQL querying'],
            ['Integrity & atomicity', 'Manual code checks before crashing mid-write', 'Declarative constraints and atomic ACID transactions'],
            ['Concurrent access anomalies', 'Lock whole files or overwrite concurrent edits', 'Row-level locking and isolation levels'],
            ['Security & crash loss', 'OS folder permissions & ad-hoc backups', 'User privileges, roles, and crash-safe recovery logs']
          ],
          question: 'Does installing a DBMS automatically prevent bad data or data leaks?',
          answer: 'No. Missing constraints, overpowered application accounts, or untested backups still fail even inside a relational DBMS.',
          notes: 'Highlight the classic five file-system flaws from textbooks (redundancy, isolation, integrity/atomicity, concurrency, security) in concrete terms.'
        },
        {
          id: 'why-check',
          title: 'Checkpoint: diagnose a broken record system.',
          lead: 'Accounts sees a paid fee. Admissions sees it as unpaid. A teacher can also edit bank details.',
          type: 'quiz',
          options: [
            'A disk-capacity problem only',
            'Data inconsistency and missing access control',
            'A primary-key naming problem only'
          ],
          correct: 1,
          feedback: 'Separate copies drifted out of sync, and the teacher holds excessive permissions.',
          question: 'Student task: name one more failure and the DBMS mechanism that prevents it.',
          answer: 'Server power loss mid-transfer -> atomic transactions and redo logs. Two students assigned the same ID -> PRIMARY KEY uniqueness.',
          notes: 'Wrap Section 1.1 cleanly before separating the data from the DBMS engine in Section 1.2.'
        }
      ]
    },
    {
      id: 'vocabulary', unit: 'u1', number: '1.2', title: 'Database, users & DBA', minutes: 45,
      objective: 'Distinguish database, DBMS, client interfaces, user categories, and DBA responsibilities.',
      steps: [
        {
          id: 'database-vs-dbms',
          title: 'The data and its manager are different.',
          lead: 'Use the college lab to attach every term to a concrete running component.',
          type: 'cards',
          cards: [
            ['Database', 'college_demo: the organized student, course, and enrollment data stored on disk.'],
            ['DBMS', 'MariaDB Server: the database engine that parses SQL, enforces rules, and manages storage.'],
            ['Clients', 'DBeaver, Adminer, or SQL Studio: interfaces that send SQL and display returned results.']
          ],
          question: 'If you close DBeaver or your browser tab, have you deleted the database?',
          answer: 'No. The MariaDB server and its persistent storage volume live independently of client connections.',
          notes: 'Clarify why MariaDB is the DBMS engine while college_demo is a database managed inside it.'
        },
        {
          id: 'people',
          title: 'Database users and the DBA.',
          lead: 'Syllabi classify database users by how they interact with the system rather than by job title alone.',
          type: 'comparison',
          columns: ['User Category', 'How they interact', 'College example & access'],
          rows: [
            ['Naive / End Users', 'Use pre-built forms, apps, or menus without writing SQL', 'A student checking grades via the web portal (no direct DB account)'],
            ['Application Programmers', 'Write backend code and parameterized queries that connect to the DBMS', 'Developer building the fee-payment service (scoped app DB user)'],
            ['Sophisticated Users', 'Write ad-hoc SQL queries, reports, or BI dashboards directly', 'Academic analyst querying trends in DBeaver (read-only SELECT)'],
            ['Specialized Users', 'Build domain tools (CAD, GIS, audit forensics, ML pipelines)', 'Security auditor parsing access/binary logs'],
            ['Database Administrator (DBA)', 'Controls schemas, accounts, privileges, tuning, monitoring, and recovery', 'Lab admin managing MariaDB security, logs, and backups']
          ],
          question: 'Should a Naive user ever be handed a direct SQL login to the production database?',
          answer: 'No. Naive users should interact only through validated application workflows so business rules and row-level permissions cannot be bypassed.',
          notes: 'Walk through all four user categories from the MSCNS406 syllabus plus the DBA role.'
        },
        {
          id: 'vocabulary-check',
          title: 'Checkpoint: identify the roles and layers.',
          lead: 'An analyst uses DBeaver on her laptop to run SELECT queries against college_demo on MariaDB.',
          type: 'quiz',
          options: [
            'The analyst is a Naive User and DBeaver is the DBMS',
            'The analyst is a Sophisticated User and MariaDB Server is the DBMS',
            'college_demo is the DBMS and DBeaver stores all table pages'
          ],
          correct: 1,
          feedback: 'Writing direct ad-hoc queries makes the analyst a Sophisticated User; MariaDB Server is the DBMS.',
          question: 'Student task: distinguish an Application Programmer from a DBA in one sentence each.',
          answer: 'An Application Programmer builds software modules that read/write approved data; a DBA governs schema lifecycle, security accounts, availability, tuning, and backups.',
          notes: 'Verify students distinguish user roles clearly before inspecting relational tables in Section 1.3.'
        }
      ]
    },
    {
      id: 'tables', unit: 'u1', number: '1.3', title: 'Tables, rows, domains & NULL', minutes: 60,
      objective: 'Read a relational table and explain its rows, attributes, domains and NULL values.',
      steps: [
        {
          id: 'explore-table',
          title: 'A table gives related facts a shape.',
          lead: 'These records come directly from MariaDB. Click a column heading or a row to highlight it.',
          type: 'explorer',
          table: 'students',
          question: 'What does one row represent? What does the age column represent?',
          answer: 'One row is one student record (tuple). The age column is an attribute shared across all rows, constrained to an integer domain.',
          notes: 'Switch tabs between students, courses, and enrollments. Point out Meera (id 4) in students vs her absence in enrollments.'
        },
        {
          id: 'relational-words',
          title: 'Same ideas, two vocabularies.',
          lead: 'Relational theory and everyday SQL describe the same structures with slightly different terms.',
          type: 'comparison',
          columns: ['Everyday SQL term', 'Relational theory term', 'Example'],
          rows: [
            ['Table', 'Relation', 'students'],
            ['Row / record', 'Tuple', 'The record for student 1'],
            ['Column / field', 'Attribute', 'email'],
            ['Allowed values', 'Domain', 'Valid ages (>= 16) and unique emails']
          ],
          question: 'Is the third visible row guaranteed to stay third forever without ORDER BY?',
          answer: 'No. Relations are unordered sets; only an explicit ORDER BY clause guarantees display sequence.',
          notes: 'Note briefly that SQL tables allow NULLs and duplicates unless constrained, whereas mathematical relations forbid duplicates.'
        },
        {
          id: 'null',
          title: 'NULL means an absent value.',
          lead: 'Unknown age is fundamentally different from age zero, and missing text is different from an empty string.',
          type: 'cards',
          cards: [
            ['NULL', 'Missing, unknown, or not applicable. Not equal to any value—not even another NULL.'],
            ['0', 'A known integer quantity of zero. Arithmetic and equality comparisons apply normally.'],
            ["''", 'A known zero-length string. Satisfies NOT NULL constraints!']
          ],
          question: 'Why does WHERE age = NULL fail to return students whose age is missing?',
          answer: 'In SQL three-valued logic, comparing anything with NULL evaluates to UNKNOWN, not TRUE. Use WHERE age IS NULL instead.',
          notes: 'Remind students that CHECK (age >= 16) still accepts NULL in SQL unless NOT NULL is also declared.'
        },
        {
          id: 'inspect-schema',
          title: 'Ask MariaDB about table structure.',
          lead: 'Run DESCRIBE to inspect column types, domains, nullability, and key metadata directly from SQL Studio.',
          type: 'query',
          database: 'college_demo',
          sql: 'DESCRIBE students;',
          explain: {
            syntax: 'DESCRIBE table_name;',
            parts: [
              ['DESCRIBE', 'Reads the table blueprint (column names, data types, NULL rules, keys) without returning any student rows.'],
              ['students', 'The target table inside the currently selected database (college_demo).'],
              ['Key column', 'PRI marks the Primary Key, UNI marks a UNIQUE constraint, and MUL marks an indexed/Foreign Key column.']
            ]
          },
          expected: 'Five columns. id is PRI (primary key), email is UNI (unique), age and course_id allow NULL.',
          question: 'Which columns in this output describe structure rather than student records?',
          answer: 'Field, Type, Null, Key, Default, and Extra are all schema metadata from the Data Dictionary.',
          notes: 'Run DESCRIBE live and highlight id AUTO_INCREMENT and email UNI.'
        }
      ]
    },
    {
      id: 'keys', unit: 'u1', number: '1.4', title: 'Keys & integrity', minutes: 60,
      objective: 'Choose identifiers and explain how entity, referential, and domain constraints protect integrity.',
      steps: [
        {
          id: 'key-family',
          title: 'Keys have different jobs.',
          lead: 'Human names repeat (two students can both be named Riya Sharma); schemas rely on strict keys to identify and link rows.',
          type: 'comparison',
          columns: ['Key Type', 'Meaning', 'College Lab Example'],
          rows: [
            ['Candidate Key', 'Minimal attribute(s) capable of uniquely identifying a row', 'students.id or students.email'],
            ['Primary Key', 'The chosen candidate identifier enforced as row identity', 'students.id'],
            ['Alternate Key', 'A candidate key not picked as the primary key', 'students.email (UNIQUE NOT NULL)'],
            ['Composite Key', 'A key spanning two or more columns together', '(student_id, course_id) in enrollments'],
            ['Foreign Key', 'Column(s) referencing a primary/unique key in another table', 'students.course_id -> courses.id']
          ],
          question: 'Can multiple students share the same foreign-key value?',
          answer: 'Yes. Many students can reference course 101; a foreign key restricts allowed values, not multiplicity.',
          notes: 'Point out that personal names change and collide, which is why numeric IDs or emails serve as keys.'
        },
        {
          id: 'integrity-demo',
          title: 'Will this proposed record be accepted?',
          lead: 'Test three candidate rows against entity and referential rules before writing INSERT SQL.',
          type: 'integrity',
          question: 'Why are the two rejected candidates failing for completely different reasons?',
          answer: 'Duplicate ID violates Entity Integrity (uniqueness). Missing course 999 violates Referential Integrity (dangling pointer).',
          notes: 'Have students vote Accept/Reject before clicking each candidate button.'
        },
        {
          id: 'integrity-rules',
          title: 'Protect identity, references and values.',
          lead: 'Three core integrity pillars enforced automatically by InnoDB.',
          type: 'cards',
          cards: [
            ['Entity integrity', 'Primary-key columns must be unique and never NULL so every tuple has an identity.'],
            ['Referential integrity', 'Any non-NULL foreign key must match an existing key in the parent table.'],
            ['Domain integrity', 'Types and CHECK/NOT NULL rules ensure values belong to valid ranges.']
          ],
          question: 'What happens if you try to delete a course referenced by students?',
          answer: 'InnoDB follows the declared ON DELETE rule: RESTRICT/NO ACTION blocks deletion, CASCADE deletes children, SET NULL clears the reference.',
          notes: 'Point out that college_demo.students uses ON DELETE SET NULL while enrollments restricts deletion.'
        },
        {
          id: 'keys-check',
          title: 'Checkpoint: one enrollment, two identifiers.',
          lead: 'A student can enroll in many courses, and a course holds many students, but no duplicate pairs.',
          type: 'quiz',
          options: [
            'Put UNIQUE on student_id alone',
            'Put a composite UNIQUE constraint on (student_id, course_id)',
            'Put UNIQUE on course_id alone'
          ],
          correct: 1,
          feedback: 'A composite key restricts duplicates of the pair while permitting many courses per student and many students per course.',
          question: 'Student task: classify student_id and course_id individually vs together.',
          answer: 'Individually each is a foreign key; together (student_id, course_id) forms a composite candidate key.',
          notes: 'Have students explain why making student_id alone UNIQUE would cap every student at one course total.'
        }
      ]
    },
    {
      id: 'relationships', unit: 'u1', number: '1.5', title: 'Relationships', minutes: 60,
      objective: 'Trace one-to-one, one-to-many and many-to-many relationships using keys.',
      steps: [
        {
          id: 'cardinality',
          title: 'How many records may be related?',
          lead: 'Cardinality describes allowed relationship rules in the schema, not merely today’s sample row count.',
          type: 'cards',
          cards: [
            ['One to One (1:1)', 'Each student has at most one profile row, enforced by UNIQUE(student_id) in profiles.'],
            ['One to Many (1:N)', 'One course can be the primary course for many students (students.course_id -> courses.id).'],
            ['Many to Many (M:N)', 'Students take many courses and courses hold many students via an enrollments junction table.']
          ],
          question: 'If a course currently has just one student enrolled, does that make the relationship 1:1?',
          answer: 'No. Cardinality reflects schema constraints and rules, not a temporary row snapshot.',
          notes: 'Highlight optionality: students.course_id permits NULL (zero or one primary course).'
        },
        {
          id: 'trace-primary-course',
          title: 'Follow a primary-course ID (1:N).',
          lead: 'Click a course below to trace live students in MariaDB whose course_id references it.',
          type: 'relationship',
          mode: 'primary',
          question: 'If "Cybersecurity" is renamed, how many tables actually need an UPDATE?',
          answer: 'Only one row in courses. Every student referencing course_id = 101 immediately reflects the updated name.',
          notes: 'Explain clearly that students.course_id stores primary course, separate from actual enrollments.'
        },
        {
          id: 'trace-enrollments',
          title: 'One student can take several courses (M:N).',
          lead: 'Select a student to follow their rows through the enrollments junction table.',
          type: 'relationship',
          mode: 'enrollments',
          question: 'Why does Meera have zero enrollment rows even though she has primary course 103?',
          answer: 'In this model, primary-course assignment and active course enrollments are modeled separately so students can observe empty joins.',
          notes: 'Click Aman (2 enrollments) and Meera (0 enrollments) live on screen.'
        },
        {
          id: 'joined-view',
          title: 'Bring connected facts into one result.',
          lead: 'Normalized tables stay separate on disk; queries reconnect them on demand.',
          type: 'query',
          database: 'college_demo',
          sql: 'SELECT s.name, c.course_name AS primary_course\nFROM students AS s\nJOIN courses AS c ON s.course_id = c.id\nORDER BY s.id;',
          explain: {
            syntax: 'SELECT a.col, b.col FROM table_a AS a JOIN table_b AS b ON a.fk = b.pk ORDER BY ...;',
            parts: [
              ['SELECT ... AS primary_course', 'Chooses which columns to display and gives course_name a clearer output label.'],
              ['FROM students AS s', 'Starts from students using short nickname (alias) s so columns stay easy to read.'],
              ['JOIN courses AS c ON s.course_id = c.id', 'Matches each student row to the course row whose id equals that student’s course_id (full join types are taught in Unit 2.5).'],
              ['ORDER BY s.id', 'Sorts the displayed rows by student ID ascending.']
            ]
          },
          expected: 'Five students paired with their primary course names.',
          question: 'Did running this JOIN physically combine students and courses on disk?',
          answer: 'No. JOIN computes a transient query result while keeping both base tables normalized and independent.',
          notes: 'Focus on the matching IDs rather than full JOIN syntax (which Unit 2 covers thoroughly).'
        },
        {
          id: 'relationships-check',
          title: 'Checkpoint: model a library loan.',
          lead: 'A member borrows multiple books, and the same book can be borrowed by many members over time.',
          type: 'quiz',
          options: [
            'Store comma-separated book IDs inside the members table',
            'Create a separate loans junction table with member_id and book_id',
            'Add 10 fixed book_id columns to members'
          ],
          correct: 1,
          feedback: 'A loans junction table handles M:N borrowing cleanly and stores loan/return dates per event.',
          question: 'Student task: should (member_id, book_id) alone be UNIQUE in a library loans table?',
          answer: 'No, because the same member may borrow the same book on different dates. Include a loan_id PK or (member_id, book_id, borrowed_on).',
          notes: 'Contrast historical event tables (library loans) with current-enrollment tables.'
        }
      ]
    },
    {
      id: 'abstraction', unit: 'u1', number: '1.6', title: 'Schema, mappings & independence', minutes: 60,
      objective: 'Explain schema vs instance, three-level architecture, mappings, and logical/physical data independence.',
      steps: [
        {
          id: 'schema-instance',
          title: 'The structure stays while the contents change.',
          lead: 'A table’s column definition is its schema; the rows stored at a specific moment form its instance.',
          type: 'schema-instance',
          question: 'When a student registers today, does the schema change or the instance?',
          answer: 'Only the instance changes. Schema changes occur only when running DDL such as ALTER TABLE to add/remove columns or rules.',
          notes: 'Toggle "Add illustrative row" (instance change) vs "Add an age column" (schema change).'
        },
        {
          id: 'schema-mappings',
          title: 'Three-Schema Architecture & Mappings.',
          lead: 'Click each box in the ANSI-SPARC diagram—especially the two mapping layers—to see how External, Conceptual, and Internal levels isolate changes.',
          type: 'diagram',
          diagram: 'three-schema',
          question: 'Which mapping absorbs a conceptual table split, and which absorbs adding a disk index?',
          answer: 'External–Conceptual mapping absorbs logical table splits (Logical Data Independence). Conceptual–Internal mapping absorbs storage/index changes (Physical Data Independence).',
          notes: 'Walk top-to-bottom through External Views -> External–Conceptual Mapping -> Conceptual Schema -> Conceptual–Internal Mapping -> Internal Schema.'
        },
        {
          id: 'data-independence',
          title: 'Logical vs Physical Data Independence.',
          lead: 'Both independence guarantees come directly from updating a mapping layer rather than rewriting application queries.',
          type: 'comparison',
          columns: ['Dimension', 'Logical Data Independence', 'Physical Data Independence'],
          rows: [
            ['Mapping layer changed', 'External – Conceptual Mapping', 'Conceptual – Internal Mapping'],
            ['What changes below?', 'Split/merge tables, add columns, reshape relationships', 'Add B+Tree indexes, compress pages, relocate .ibd files'],
            ['Protection guarantee', 'Existing External Views & app queries keep running', 'Logical schema & all SQL statements remain untouched'],
            ['Practical difficulty', 'Harder: multi-table joins inside views may not support writes', 'Easier: MariaDB optimizer chooses new indexes transparently']
          ],
          question: 'Why does adding a secondary index in Unit 4 demonstrate Physical Data Independence?',
          answer: 'Adding an index restructures internal B+Tree storage pages, yet existing SELECT queries require zero syntax changes.',
          notes: 'Exam staple: compare both columns row-by-row so students never swap External–Conceptual and Conceptual–Internal mappings.'
        },
        {
          id: 'abstraction-check',
          title: 'Checkpoint: classify three database changes.',
          lead: '1) A student enrolls. 2) A column is added to students. 3) A secondary index is built.',
          type: 'quiz',
          options: [
            'Instance change, Conceptual schema change, Internal storage change',
            'Internal storage change, Instance change, External view change',
            'All three alter the Conceptual schema'
          ],
          correct: 0,
          feedback: 'New rows change the instance; new columns alter the conceptual schema; indexes belong to the internal level.',
          question: 'Student task: explain both mappings in your own words without memorizing jargon.',
          answer: 'External–Conceptual maps user views to global tables; Conceptual–Internal maps global tables to physical disk pages and indexes.',
          notes: 'Confirm every student can distinguish the two mappings before advancing to DBMS architecture.'
        }
      ]
    },
    {
      id: 'architecture', unit: 'u1', number: '1.7', title: 'Architecture & queries', minutes: 60,
      objective: 'Locate Query Processor, Storage Manager, application tiers, and trace a query end-to-end.',
      steps: [
        {
          id: 'dbms-internals-diagram',
          title: 'Inside the DBMS engine: Query Processor & Storage Manager.',
          lead: 'Every database engine separates understanding SQL from reading/locking disk pages. Click each subsystem.',
          type: 'diagram',
          diagram: 'dbms-architecture',
          question: 'Which subsystem verifies user privileges and coordinates transaction locks?',
          answer: 'The Storage Manager (specifically Authorization & Integrity Manager + Transaction Manager), working together with the Buffer Manager and Disk Storage.',
          notes: 'Inspect all 4 nodes so students see DDL Interpreter, DML Optimizer, Buffer Manager, and Data Dictionary.'
        },
        {
          id: 'tiers',
          title: '1-Tier, 2-Tier, and 3-Tier deployments.',
          lead: 'Architectural tiers describe where application logic executes relative to the DBMS.',
          type: 'comparison',
          columns: ['Topology', 'Request Path', 'Typical Example'],
          rows: [
            ['1-Tier', 'App + Embedded DB in one process', 'Local SQLite inside a mobile/desktop app'],
            ['2-Tier', 'Client directly → DBMS server', 'DBeaver or mariadb CLI connecting directly to MariaDB on 127.0.0.1:3307'],
            ['3-Tier', 'Browser → App/API Server → DBMS', 'This Console → Node API → MariaDB (and Adminer / web apps)']
          ],
          question: 'Why does keeping DB credentials inside a middle API tier improve web app security?',
          answer: 'Browsers never see database usernames or passwords; the backend enforces authentication, validation, and request limits.',
          notes: 'Highlight how students use BOTH 3-Tier (this Console) and 2-Tier (DBeaver on port 3307) in this same Docker lab.'
        },
        {
          id: 'query-journey',
          title: 'Follow one query from request to result.',
          lead: 'Click through each stage of executing SELECT id, name FROM students WHERE id = 1.',
          type: 'pipeline',
          question: 'Where does MariaDB decide whether to use an index or scan the whole table?',
          answer: 'In the Plan (Query Optimizer) stage, using table statistics and index metadata before execution begins.',
          notes: 'Step slowly through Request -> Parse & resolve -> Plan -> Execute -> Return.'
        },
        {
          id: 'real-request',
          title: 'Send the query you just traced.',
          lead: 'Execute that exact traced query against live MariaDB in SQL Studio on the right.',
          type: 'query',
          database: 'college_demo',
          sql: 'SELECT id, name\nFROM students\nWHERE id = 1;',
          explain: {
            syntax: 'SELECT col1, col2 FROM table_name WHERE condition;',
            parts: [
              ['SELECT id, name', 'Retrieves only the id and name columns instead of the entire row.'],
              ['FROM students', 'Specifies which table MariaDB should read from.'],
              ['WHERE id = 1', 'Filters rows so only the record whose primary key id equals 1 is returned.']
            ]
          },
          expected: 'Returns student 1 (Aman Verma) from college_demo.',
          question: 'Did your browser have to parse .ibd binary pages to show Aman’s name?',
          answer: 'No. MariaDB’s Storage Manager and Buffer Manager read the page and returned structured rows over the network protocol.',
          notes: 'Connect this live output back to the previous pipeline step.'
        },
        {
          id: 'architecture-check',
          title: 'Checkpoint: diagnose a connection failure.',
          lead: 'The console webpage loads fine, yet pressing Run reports "MariaDB unavailable".',
          type: 'quiz',
          options: [
            'The students table must have zero rows',
            'The web server works, so check the API service, network path, or MariaDB container health',
            'The browser cannot render HTML tables'
          ],
          correct: 1,
          feedback: 'A loaded frontend proves Nginx served static files; the fault lies between the API service and MariaDB.',
          question: 'Student task: trace the round-trip components from clicking Run to seeing rows on screen.',
          answer: 'Browser fetch -> Nginx /api proxy -> Node API -> MariaDB Query Processor -> Storage/Buffer Manager -> result rows back to Browser.',
          notes: 'Transition into Section 1.8 where students run real commands against classroom_practice.'
        }
      ]
    },
    {
      id: 'practical', unit: 'u1', number: '1.8', title: 'First MariaDB practical', minutes: 90,
      objective: 'Inspect a real database, create a table, insert records and query filtered data.',
      steps: [
        {
          id: 'lab-start',
          title: 'The database is ready. Start exploring.',
          lead: 'college_demo is read-only for classroom_console; classroom_practice is your editable sandbox (you can also explore Units 3–4 DBs in the SQL Studio dropdown).',
          type: 'query',
          database: 'college_demo',
          sql: 'SHOW DATABASES;',
          explain: {
            syntax: 'SHOW DATABASES;',
            parts: [
              ['SHOW DATABASES', 'Lists every database (schema) that your currently logged-in MariaDB account has permission to see.'],
              [';', 'Marks the end of an SQL statement so MariaDB knows the command is complete.']
            ]
          },
          expected: 'Shows databases visible to the limited classroom_console identity (college_demo, classroom_practice, sql_lab, information_schema).',
          question: 'Why does classroom_console not list security_lab or root-only databases?',
          answer: 'SHOW DATABASES respects account privileges. Least-privilege accounts only see databases they hold grants on.',
          notes: 'Point out that choosing security_lab or perf_lab in the Studio dropdown switches to dba_lab automatically while college_demo stays read-only.'
        },
        {
          id: 'lab-tables',
          title: 'Inspect what already exists.',
          lead: 'Load the presets on the left to inspect table names, column metadata, and live course records.',
          type: 'query',
          database: 'college_demo',
          sql: 'SHOW TABLES;',
          explain: {
            syntax: 'SHOW TABLES;\nDESCRIBE table_name;\nSELECT * FROM table_name ORDER BY col;',
            parts: [
              ['SHOW TABLES', 'Lists all tables and views inside the active database (college_demo).'],
              ['DESCRIBE students', 'Prints each column’s name, data type, NULL setting, and key constraint.'],
              ['SELECT * FROM courses', 'Reads every column (*) and every row stored in the courses table.']
            ]
          },
          presets: [
            ['Table names', 'SHOW TABLES;'],
            ['Student definition', 'DESCRIBE students;'],
            ['Course data', 'SELECT * FROM courses ORDER BY id;']
          ],
          expected: 'Lists courses, enrollments, students, and the student_course_summary view.',
          question: 'Why does SHOW TABLES list student_course_summary even though it is a view?',
          answer: 'MariaDB lists both base tables and views in SHOW TABLES; SHOW FULL TABLES distinguishes BASE TABLE vs VIEW.',
          notes: 'Click each preset pill on the left and predict the output before clicking Run ⌘↵ on the right.'
        },
        {
          id: 'lab-create',
          title: 'Create your first practice table.',
          lead: 'Define lab_students inside classroom_practice with PRIMARY KEY, NOT NULL, UNIQUE, and CHECK rules.',
          type: 'query',
          database: 'classroom_practice',
          resetKind: 'practice',
          sql: 'CREATE TABLE lab_students (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  name VARCHAR(100) NOT NULL,\n  email VARCHAR(120) NOT NULL UNIQUE,\n  age INT CHECK (age >= 16)\n);',
          explain: {
            syntax: 'CREATE TABLE table_name (col1 TYPE constraints, col2 TYPE constraints, ...);',
            parts: [
              ['CREATE TABLE lab_students', 'Defines a brand-new empty table named lab_students inside classroom_practice.'],
              ['INT PRIMARY KEY AUTO_INCREMENT', 'Whole-number unique row ID automatically incremented (1, 2, 3…) on each insert.'],
              ['VARCHAR(100) NOT NULL', 'Variable-length text up to 100 characters that cannot be left blank (NULL).'],
              ['UNIQUE & CHECK (age >= 16)', 'UNIQUE blocks duplicate emails; CHECK rejects ages below 16.']
            ]
          },
          expected: 'Statement completed. The table now exists with zero rows.',
          question: 'What happens if you click Run a second time without resetting?',
          answer: 'MariaDB raises Error 1050 (Table already exists). Use "Reset lab_students" in SQL Studio when repeating a lecture.',
          notes: 'Run CREATE TABLE, then show how "Reset lab_students" in the Studio header safely clears just this practice table.'
        },
        {
          id: 'lab-insert',
          title: 'Add records the table will hold.',
          lead: 'Match each value list to (name, email, age) and let MariaDB assign auto-increment IDs.',
          type: 'query',
          database: 'classroom_practice',
          setup: true,
          resetKind: 'practice',
          sql: "INSERT INTO lab_students (name, email, age)\nVALUES ('Aman', 'aman.lab@example.com', 25),\n       ('Riya', 'riya.lab@example.com', 19),\n       ('Kabir', 'kabir.lab@example.com', 22);",
          explain: {
            syntax: 'INSERT INTO table_name (col1, col2, col3) VALUES (v1, v2, v3), (...);',
            parts: [
              ['INSERT INTO lab_students (...)', 'Adds new rows into lab_students and names the exact columns you are supplying (omitting AUTO_INCREMENT id).'],
              ['VALUES (...), (...)', 'Each parenthesized tuple inserts one row; text strings go in single quotes, numbers stay unquoted.']
            ]
          },
          expected: '3 row(s) affected on the first run; repeating fails due to UNIQUE(email).',
          question: 'Why is omitting id valid here when id is a NOT NULL PRIMARY KEY?',
          answer: 'AUTO_INCREMENT automatically generates the next sequential integer.',
          notes: 'If jumping directly to this step, click Prepare in SQL Studio first so lab_students exists cleanly.'
        },
        {
          id: 'lab-select',
          title: 'Query all columns, specific projections & WHERE filters.',
          lead: 'Compare SELECT *, projecting name/age columns, and filtering age > 20.',
          type: 'query',
          database: 'classroom_practice',
          setup: true,
          seedPractice: true,
          resetKind: 'practice',
          sql: 'SELECT * FROM lab_students ORDER BY id;',
          explain: {
            syntax: 'SELECT col1, col2 FROM table_name WHERE condition ORDER BY col;',
            parts: [
              ['SELECT * / SELECT name, age', '* returns every column; naming specific columns (projection) shows only what you ask for.'],
              ['WHERE age > 20', 'Keeps only rows that satisfy the condition before displaying them.'],
              ['ORDER BY id / age', 'Sorts the returned rows in ascending order (smallest to largest).']
            ]
          },
          presets: [
            ['All columns', 'SELECT * FROM lab_students ORDER BY id;'],
            ['Name and age', 'SELECT name, age FROM lab_students ORDER BY id;'],
            ['Filter age > 20', 'SELECT name, age FROM lab_students WHERE age > 20 ORDER BY age;']
          ],
          expected: 'Three sample rows; filtering age > 20 returns Kabir (22) and Aman (25), leaving out Riya (19).',
          question: 'Does omitting email in SELECT delete it from disk? And would age = 20 match age > 20?',
          answer: 'SELECT only shapes returned columns without modifying stored data. Strict > excludes age 20 (use age >= 20 to include 20).',
          notes: 'Click Prepare if arriving directly, then step through all 3 presets to demonstrate projection and WHERE filtering.'
        },
        {
          id: 'lab-constraints',
          title: 'Watch MariaDB reject invalid records.',
          lead: 'Try each preset and observe how UNIQUE, CHECK, and NOT NULL protect data quality.',
          type: 'query',
          database: 'classroom_practice',
          setup: true,
          seedPractice: true,
          resetKind: 'practice',
          sql: "INSERT INTO lab_students (name, email, age)\nVALUES ('Aman again', 'aman.lab@example.com', 25);",
          explain: {
            syntax: 'INSERT INTO lab_students (name, email, age) VALUES (...);',
            parts: [
              ['Duplicate email preset', 'Tests the UNIQUE rule on email—MariaDB rejects repeating aman.lab@example.com.'],
              ['Invalid age (12) preset', 'Tests CHECK (age >= 16)—MariaDB blocks saving an out-of-range age.'],
              ['Missing name (NULL) preset', 'Tests NOT NULL—MariaDB blocks inserting a row with no student name.']
            ]
          },
          presets: [
            ['Duplicate email', "INSERT INTO lab_students (name, email, age) VALUES ('Aman again', 'aman.lab@example.com', 25);"],
            ['Invalid age', "INSERT INTO lab_students (name, email, age) VALUES ('Young learner', 'young.lab@example.com', 12);"],
            ['Missing name', "INSERT INTO lab_students (name, email, age) VALUES (NULL, 'missing.lab@example.com', 21);"]
          ],
          expected: 'All three presets intentionally fail with MariaDB constraint errors.',
          question: 'Which specific constraint caught each of the three bad rows?',
          answer: '1) Duplicate entry -> UNIQUE(email). 2) CONSTRAINT failed -> CHECK(age >= 16). 3) Column cannot be null -> NOT NULL on name.',
          notes: 'Click Prepare in SQL Studio if arriving here directly before running each failing preset.'
        },
        {
          id: 'lab-challenge',
          title: 'Your turn: build a lab_courses table.',
          lead: 'Create classroom_practice.lab_courses with an auto-increment primary key id, required course_name, and positive integer duration_months. Insert at least 3 courses, then verify.',
          type: 'challenge',
          database: 'classroom_practice',
          hints: [
            'Start with: CREATE TABLE IF NOT EXISTS lab_courses (id INT PRIMARY KEY AUTO_INCREMENT, course_name VARCHAR(100) NOT NULL, duration_months INT NOT NULL CHECK (duration_months > 0));',
            'Run your CREATE statement first, then run an INSERT INTO lab_courses (course_name, duration_months) VALUES (...) statement with 3 rows, then click Check my answer!'
          ],
          check: {
            kind: 'table-check',
            database: 'classroom_practice',
            table: 'lab_courses',
            requiredColumns: ['id', 'course_name', 'duration_months'],
            primaryKey: 'id',
            minRows: 3
          },
          question: 'Write and execute your CREATE TABLE and INSERT statements one at a time in classroom_practice.',
          answer: "CREATE TABLE lab_courses (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  course_name VARCHAR(100) NOT NULL,\n  duration_months INT NOT NULL CHECK (duration_months > 0)\n);\n\nINSERT INTO lab_courses (course_name, duration_months)\nVALUES ('Cybersecurity', 6), ('Databases', 4), ('Python', 3);\n\nSELECT * FROM lab_courses ORDER BY id;",
          notes: 'Give students 5–8 minutes in Student Mode using Hints, Schema, and ✓ Check my answer. Note that Reset lab_students leaves lab_courses untouched.'
        }
      ]
    },
    {
      id: 'dba', unit: 'u1', number: '1.9', title: 'DBA & Unit 1 checkpoint', minutes: 45,
      objective: 'Connect DBA responsibilities to failure scenarios and verify Unit 1 mastery.',
      steps: [
        {
          id: 'dba-jobs',
          title: 'Who keeps the database service dependable?',
          lead: 'A Database Administrator bridges schema governance, security, availability, tuning, and disaster recovery.',
          type: 'comparison',
          columns: ['DBA Responsibility', 'College example', 'Operational proof'],
          rows: [
            ['Schema & Integrity', 'Approve table definitions and foreign keys', 'Invalid writes rejected by constraints'],
            ['Access Control & Security', 'Provision least-privilege accounts and TLS', 'Unauthorized queries fail with Access Denied'],
            ['Monitoring & Performance', 'Watch slow queries, locks, and disk growth', 'Index plans verified with EXPLAIN'],
            ['Backup & Recovery', 'Schedule backups and practice restores', 'Test restore passes row verification']
          ],
          question: 'Why is running a nightly backup script without ever testing a restore risky?',
          answer: 'Unverified backups may be incomplete, corrupted, or missing permissions—only a tested restore proves recoverability.',
          notes: 'Preview Units 3 and 4 directly from this summary table.'
        },
        {
          id: 'least-privilege',
          title: 'Principle of Least Privilege.',
          lead: 'Every account should hold only the exact permissions required for its job.',
          type: 'cards',
          cards: [
            ['DBA Account', 'Administers users, storage, tuning, and logs; never embedded in web forms.'],
            ['Application Account', 'Reads/writes application tables (e.g. web_app) without DROP TABLE or CREATE USER.'],
            ['Reporting Account', 'Read-only SELECT access (e.g. reporting) for analytics and dashboards.']
          ],
          question: 'What happens if a public web app connects as root and has an SQL injection bug?',
          answer: 'Attackers inherit full administrative privileges across every database on the server instead of being bounded to one app schema.',
          notes: 'Point out that SQL Studio enforces least privilege automatically whenever college_demo is selected (classroom_console cannot mutate college_demo).'
        },
        {
          id: 'incident',
          title: 'Unit 1 checkpoint: diagnose a confidentiality leak.',
          lead: 'Queries are fast and data is accurate, yet confidential student fee balances are visible to faculty.',
          type: 'quiz',
          options: [
            'Add a B+Tree index on fees',
            'Restrict privileges and expose only an approved External View without fee columns',
            'Increase innodb_buffer_pool_size'
          ],
          correct: 1,
          feedback: 'This is an authorization and external-view boundary failure, not a speed issue.',
          question: 'Student task: distinguish Authentication ("who are you?") from Authorization ("what may you do?") and advance to Unit 2.',
          answer: 'Authentication verifies identity (username, password/plugin, TLS cert); Authorization verifies permissions (GRANT SELECT/INSERT, roles) after login.',
          notes: 'Click Unit 2 → in the dock (or press →) to move straight into Unit 2: SQL Concepts.'
        }
      ]
    }
  ]
};

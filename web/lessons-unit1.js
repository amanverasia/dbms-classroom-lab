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
          notes: 'Collect answers before introducing the term DBMS. Avoid claiming spreadsheets cannot store data. Ask what breaks when admissions, accounts, and faculty edit separate copies.'
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
          notes: 'Walk through each card and tie it to MSCNS406 themes: transactions (banking), concurrency (airlines), and access control (universities/healthcare).'
        },
        {
          id: 'conflicting-copies',
          title: 'Which copy tells the truth?',
          lead: 'These are three copies of the same course name. Change one and watch the others fall behind.',
          type: 'copies',
          question: 'Has the college changed its course name, or only one file?',
          answer: 'Only one copy changed. Repetition makes it easy for copies to disagree. A shared course record eliminates update anomalies.',
          notes: 'Click "Update admissions copy" first so students see the conflict, then click "Use a shared course record". Emphasize this is a conceptual illustration, not live SQL.'
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
            ['Integrity & atomicity', 'Code checks before crashing mid-write', 'Constraints and atomic ACID transactions'],
            ['Concurrent access anomalies', 'Lock whole files or overwrite edits', 'Row-level locking and isolation levels'],
            ['Security & crash loss', 'OS folder permissions & manual copies', 'User privileges, roles, and crash-safe logs']
          ],
          question: 'Does installing a DBMS automatically prevent bad data or data leaks?',
          answer: 'No. Missing constraints, overpowered application accounts, or untested backups still fail even inside a relational DBMS.',
          notes: 'Highlight the classic five file-system disadvantages from textbooks (redundancy, isolation, integrity, atomicity/concurrency, security) in concrete terms.'
        },
        {
          id: 'concurrent-edit',
          title: 'Two people can act on the same fact.',
          lead: 'A course has one seat left. Two users read "1" before either completes an enrollment.',
          type: 'timeline',
          items: [
            ['Read', 'Both users see one available seat.'],
            ['Decide', 'Both decide they can enroll a student.'],
            ['Write', 'Without coordination, both writes succeed and oversell the course.'],
            ['Coordinate', 'Transactions and row locks enforce atomic check-and-update rules.']
          ],
          question: 'Would putting each operator on a separate laptop prevent this race condition?',
          answer: 'No. The contention is over the shared record on the server, not the client device.',
          notes: 'Use this as motivation for Unit 4 locking and transactions. Keep mechanics conceptual here.'
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
          answer: 'Example: server power loss mid-transfer -> atomic transactions and redo logs. Two students assigned the same ID -> PRIMARY KEY uniqueness.',
          notes: 'Summarize Section 1.1: a DBMS protects structure, consistency, concurrency, access, and durability.'
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
          lead: 'Use the college lab to attach every term to a concrete running piece.',
          type: 'cards',
          cards: [
            ['Database', 'college_demo: the organized student, course, and enrollment data stored on disk.'],
            ['DBMS', 'MariaDB Server: the database engine that parses SQL, enforces rules, and manages storage.'],
            ['Client', 'Adminer or this web console: interfaces that send requests and display returned results.']
          ],
          question: 'If you close your browser tab or Adminer, have you deleted the database?',
          answer: 'No. The MariaDB server and its persistent storage volume live independently of client connections.',
          notes: 'Clarify why "MariaDB" is the DBMS while "college_demo" is a database managed inside it.'
        },
        {
          id: 'people',
          title: 'Database users and the DBA.',
          lead: 'Syllabi classify database users by how they interact with the system rather than by job title alone.',
          type: 'comparison',
          columns: ['User Category', 'How they interact', 'College example & access'],
          rows: [
            ['Naive / End Users', 'Use pre-built forms, apps, or menus without writing SQL', 'A student checking grades via the web portal (no direct DB account)'],
            ['Application Programmers', 'Write backend code and parameterized queries that connect to the DBMS', 'Developer building the fee-payment microservice (dev DB access)'],
            ['Sophisticated Users', 'Write ad-hoc SQL queries, reports, or BI dashboards directly', 'Academic analyst querying enrollment trends (read-only SELECT)'],
            ['Specialized Users', 'Build domain tools (CAD, GIS, audit forensics, ML pipelines)', 'Security auditor running specialized integrity/log parsers'],
            ['Database Administrator (DBA)', 'Controls schemas, accounts, privileges, tuning, monitoring, and recovery', 'Lab admin configuring MariaDB security, logs, and backups']
          ],
          question: 'Should a Naive user ever be handed a direct SQL login to the production database?',
          answer: 'No. Naive users should interact only through validated application workflows so business rules and row-level permissions cannot be bypassed.',
          notes: 'Walk through all four user categories from the MSCNS406 syllabus plus the DBA. Ask students which group they belong to during SQL practice (Sophisticated / App programmer).'
        },
        {
          id: 'data-shapes',
          title: 'Data can have different kinds of structure.',
          lead: 'A fixed table is one way to organize facts; semi-structured documents carry per-record keys.',
          type: 'comparison',
          columns: ['Form', 'College example', 'Shape'],
          rows: [
            ['Structured', 'A student row: id, name, age', 'Fixed columns and strict data types'],
            ['Semi-structured', '{"student_id": 1, "interests": ["SQL", "Linux"]}', 'Self-describing tags/keys with flexible nesting'],
            ['Unstructured', 'A scanned handwritten exam paper', 'No predefined queryable field layout']
          ],
          question: 'Can a relational DBMS like MariaDB store JSON documents alongside tables?',
          answer: 'Yes. Modern MariaDB supports JSON validation and JSON functions, though its core strength remains relational tables with strict integrity.',
          notes: 'Keep focus on data shape before product names.'
        },
        {
          id: 'vocabulary-check',
          title: 'Checkpoint: identify the roles and layers.',
          lead: 'An analyst uses Adminer in a browser to run SELECT queries against college_demo on MariaDB.',
          type: 'quiz',
          options: [
            'The analyst is a Naive User and Chrome is the DBMS',
            'The analyst is a Sophisticated User and MariaDB Server is the DBMS',
            'college_demo is the DBMS and Adminer stores the files'
          ],
          correct: 1,
          feedback: 'Writing direct ad-hoc queries makes the analyst a Sophisticated User; MariaDB Server is the DBMS.',
          question: 'Student task: distinguish an Application Programmer from a DBA in one sentence each.',
          answer: 'An Application Programmer builds software modules that read/write approved data; a DBA governs overall schema lifecycle, security accounts, availability, tuning, and backups.',
          notes: 'Ensure students clearly separate user roles before moving to tables and attributes.'
        }
      ]
    },
    {
      id: 'tables', unit: 'u1', number: '1.3', title: 'Tables, rows & columns', minutes: 75,
      objective: 'Read a relational table and explain its rows, attributes, domains and NULL values.',
      steps: [
        {
          id: 'explore-table',
          title: 'A table gives related facts a shape.',
          lead: 'These records come directly from the MariaDB lab. Click a column heading or a row to highlight it.',
          type: 'explorer',
          table: 'students',
          question: 'What does one row represent? What does the age column represent?',
          answer: 'One row is one student record (tuple). The age column is an attribute shared across all rows, constrained to an integer domain.',
          notes: 'Switch tabs between students, courses, and enrollments. Point out Meera (id 4) in students vs her absence in enrollments.'
        },
        {
          id: 'relational-words',
          title: 'Same ideas, two vocabularies.',
          lead: 'Relational algebra/theory and everyday SQL describe the same structures with slightly different terms.',
          type: 'comparison',
          columns: ['Everyday SQL term', 'Relational theory term', 'Example'],
          rows: [
            ['Table', 'Relation', 'students'],
            ['Row / record', 'Tuple', 'The record for student 1'],
            ['Column / field', 'Attribute', 'email'],
            ['Allowed values', 'Domain', 'Valid ages (>= 16) and email strings']
          ],
          question: 'Is the third visible row guaranteed to stay third forever without ORDER BY?',
          answer: 'No. Relations are unordered sets; only an explicit ORDER BY clause guarantees display sequence.',
          notes: 'Note briefly that SQL tables allow NULLs and duplicates unless constrained, whereas pure mathematical relations prohibit duplicates.'
        },
        {
          id: 'domains',
          title: 'A value needs to fit the column.',
          lead: 'A data type controls storage format; constraints express business rules the type alone cannot enforce.',
          type: 'comparison',
          columns: ['Column', 'Type', 'Additional rule'],
          rows: [
            ['id', 'INT', 'Primary key: unique and not NULL'],
            ['name', 'VARCHAR(100)', 'NOT NULL; cannot be omitted'],
            ['email', 'VARCHAR(120)', 'UNIQUE and NOT NULL'],
            ['age', 'INT', 'CHECK (age >= 16); NULL is allowed'],
            ['course_id', 'INT', 'Must match an existing courses.id, or be NULL']
          ],
          question: 'Does VARCHAR(120) verify that a string contains an "@" email format?',
          answer: 'No. VARCHAR(120) restricts character length only; format rules require extra CHECK/application validation.',
          notes: 'Preview how the next live DESCRIBE query reflects these rules.'
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
          notes: 'Mention that CHECK (age >= 16) still permits NULL in SQL because UNKNOWN does not fail a CHECK constraint.'
        },
        {
          id: 'inspect-schema',
          title: 'Ask MariaDB about the table.',
          lead: 'Run DESCRIBE to inspect table metadata even before learning CREATE TABLE syntax.',
          type: 'query',
          database: 'college_demo',
          sql: 'DESCRIBE students;',
          expected: 'Five columns. id is PRI (primary key), email is UNI (unique), age and course_id allow NULL.',
          question: 'Which columns in this output describe structure rather than student records?',
          answer: 'Field, Type, Null, Key, Default, and Extra are all schema metadata from the Data Dictionary.',
          notes: 'Run the query live and walk across the six metadata columns, highlighting AUTO_INCREMENT on id.'
        },
        {
          id: 'tables-check',
          title: 'Checkpoint: explain one student record.',
          lead: 'Check how relations, tuples, attributes, and domains fit together.',
          type: 'quiz',
          options: [
            'A row stores one attribute across all students',
            'A column holds the entire database',
            'A row represents one complete student tuple'
          ],
          correct: 2,
          feedback: 'Each row groups attribute values describing one single entity instance.',
          question: 'Student task: propose three columns and types for a library books table.',
          answer: 'Example: book_id INT PRIMARY KEY, title VARCHAR(200) NOT NULL, published_year INT CHECK (published_year >= 1450).',
          notes: 'Recap why titles or years alone cannot uniquely identify copies of a book.'
        }
      ]
    },
    {
      id: 'keys', unit: 'u1', number: '1.4', title: 'Keys & integrity', minutes: 75,
      objective: 'Choose identifiers and explain how entity, referential, and domain constraints protect integrity.',
      steps: [
        {
          id: 'names-not-ids',
          title: 'Two students can have the same name.',
          lead: 'Humans recognize names; databases require unambiguous unique identifiers.',
          type: 'comparison',
          columns: ['id', 'name', 'email'],
          rows: [
            [21, 'Riya Sharma', 'riya21@example.com'],
            [37, 'Riya Sharma', 'riya37@example.com']
          ],
          question: 'If staff say "update Riya Sharma", which record should change?',
          answer: 'The request is ambiguous. Updating by id = 21 identifies exactly one row.',
          notes: 'Point out that personal names change (marriage/spelling fixes), making surrogate IDs far more stable.'
        },
        {
          id: 'key-family',
          title: 'Keys have different jobs.',
          lead: 'Understand candidate, primary, alternate, composite, and foreign keys in one schema.',
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
          notes: 'Clarify that a composite unique key can coexist alongside an auto-increment primary key.'
        },
        {
          id: 'integrity-demo',
          title: 'Will this proposed record be accepted?',
          lead: 'Test three candidate rows against entity and referential rules before touching real SQL.',
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
      id: 'relationships', unit: 'u1', number: '1.5', title: 'Relationships', minutes: 75,
      objective: 'Trace one-to-one, one-to-many and many-to-many relationships using keys.',
      steps: [
        {
          id: 'cardinality',
          title: 'How many records may be related?',
          lead: 'Cardinality describes the allowed relationship rules in the schema, not merely today’s sample rows.',
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
          expected: 'Five students paired with their primary course names.',
          question: 'Did running this JOIN physically combine students and courses on disk?',
          answer: 'No. JOIN computes a transient query result while keeping both base tables normalized and independent.',
          notes: 'Focus on the matching IDs rather than full JOIN syntax (covered in Unit 2).'
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
          notes: 'Toggle "Add illustrative row" (instance) vs "Add an age column" (schema).'
        },
        {
          id: 'three-levels',
          title: 'One system, three levels of abstraction.',
          lead: 'Switch between External, Conceptual, and Internal views of the exact same college system.',
          type: 'layers',
          question: 'Does an accounts clerk need to know about 16 KB InnoDB data pages to print a fee receipt?',
          answer: 'No. The three-level architecture insulates users from internal storage formats and full schema complexity.',
          notes: 'Emphasize that External, Conceptual, and Internal are abstraction levels within the DBMS, not three separate apps.'
        },
        {
          id: 'schema-mappings',
          title: 'Mappings connect the three schema levels.',
          lead: 'Click each box in the ANSI-SPARC diagram—especially the two mapping layers—to see how queries translate downward.',
          type: 'diagram',
          diagram: 'three-schema',
          question: 'Which mapping absorbs a conceptual table split, and which absorbs adding a disk index?',
          answer: 'External–Conceptual mapping absorbs logical table splits (logical data independence). Conceptual–Internal mapping absorbs storage/index changes (physical data independence).',
          notes: 'Explicitly cover External–Conceptual and Conceptual–Internal mappings from the MSCNS406 syllabus before discussing independence.'
        },
        {
          id: 'physical-independence',
          title: 'Physical data independence in action.',
          lead: 'A DBA adds a B+Tree index or reorganizes storage without changing a single application SQL query.',
          type: 'comparison',
          columns: ['Application SQL', 'Internal Storage Change', 'Impact on Query'],
          rows: [
            ['SELECT name FROM students WHERE age > 20;', 'DBA adds an index on age or moves .ibd storage', 'Query remains identical; execution path speeds up']
          ],
          question: 'Why is physical data independence usually easier to achieve than logical independence?',
          answer: 'Changing files, compression, or indexes leaves table names, columns, and relational meanings unchanged—only the Conceptual–Internal mapping updates.',
          notes: 'Tie back directly to Unit 4 indexing lab where adding an index speeds up EXPLAIN with zero SQL changes.'
        },
        {
          id: 'logical-independence',
          title: 'Logical data independence and its limits.',
          lead: 'Suppose students is split into student_core and student_contacts.',
          type: 'timeline',
          items: [
            ['Old external interface', 'Reports select id, name, email from one roster view.'],
            ['Conceptual split', 'Email moves into a separate contacts table.'],
            ['External–Conceptual mapping', 'A compatibility VIEW joins both tables to preserve the old column list.'],
            ['Practical limit', 'Reads stay compatible, though multi-table writes through a view often require code changes.']
          ],
          question: 'Can a view guarantee that every legacy INSERT/UPDATE works after splitting a table?',
          answer: 'No. Multi-table joins inside views are generally not updatable; logical independence works much better for reads than writes.',
          notes: 'Preview Unit 2 complex vs updatable views cleanly.'
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
          id: 'our-lab',
          title: 'Meet the parts of your running Docker lab.',
          lead: 'Docker isolates each architectural layer into its own clean container.',
          type: 'timeline',
          items: [
            ['Browser', 'Renders this console and Adminer UI.'],
            ['Classroom API / Service', 'Formats requests and holds database connections inside Docker.'],
            ['MariaDB Server', 'Parses SQL, enforces permissions/constraints, and executes plans.'],
            ['Docker Volume', 'Persists database files across container restarts.']
          ],
          question: 'If you stop the web container while keeping the Docker volume, do student records survive?',
          answer: 'Yes. Persistent data resides in the classroom_db named Docker volume, not inside ephemeral app containers.',
          notes: 'Remind students not to run "docker compose down -v" unless they intentionally want to erase all lab volumes.'
        },
        {
          id: 'dbms-internals-diagram',
          title: 'Inside the DBMS engine: Query Processor & Storage Manager.',
          lead: 'Every database engine separates understanding SQL from reading/locking disk pages. Click each subsystem.',
          type: 'diagram',
          diagram: 'dbms-architecture',
          question: 'Which subsystem verifies user privileges and coordinates transaction locks?',
          answer: 'The Storage Manager (specifically Authorization & Integrity Manager + Transaction Manager), working together with the Buffer Manager and Disk Storage.',
          notes: 'Use this diagram to satisfy the syllabus "Database System architecture" internal components topic before stepping through a single query.'
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
            ['3-Tier', 'Browser → App/API Server → DBMS', 'This Console → Node API → MariaDB (also web apps)']
          ],
          question: 'Which topology does this classroom console use when executing SQL?',
          answer: '3-Tier: Browser -> Nginx/Node API -> MariaDB Server. Adminer is also 3-tier (PHP runs server-side before querying MariaDB).',
          notes: 'Point out that keeping DB credentials inside the middle tier prevents exposing database passwords to browsers.'
        },
        {
          id: 'query-journey',
          title: 'Follow one query from request to result.',
          lead: 'Click through each stage of executing SELECT name FROM students WHERE id = 1.',
          type: 'pipeline',
          question: 'Where does MariaDB decide whether to use an index or scan the whole table?',
          answer: 'In the Plan (Query Optimizer) stage, using table statistics and index metadata before execution begins.',
          notes: 'Step slowly through Request -> Parse -> Plan -> Execute -> Return.'
        },
        {
          id: 'real-request',
          title: 'Send the query you just traced.',
          lead: 'Execute the exact traced query against live MariaDB.',
          type: 'query',
          database: 'college_demo',
          sql: 'SELECT id, name\nFROM students\nWHERE id = 1;',
          expected: 'Returns student 1 (Aman Verma) from college_demo.',
          question: 'Did your browser have to parse .ibd binary pages to show Aman’s name?',
          answer: 'No. MariaDB’s Storage Manager and Buffer Manager read the page and returned structured rows over the network protocol.',
          notes: 'Connect this live output back to the previous pipeline animation.'
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
          lead: 'college_demo is read-only for the console account; classroom_practice is your editable sandbox.',
          type: 'query',
          database: 'college_demo',
          sql: 'SHOW DATABASES;',
          expected: 'Shows databases visible to the limited classroom_console identity (college_demo, classroom_practice, sql_lab, information_schema).',
          question: 'Why does classroom_console not see security_lab or root-only databases?',
          answer: 'SHOW DATABASES respects account privileges. Least-privilege accounts only list databases they have grants on.',
          notes: 'Explain that each query opens a fresh connection; the Database dropdown acts like USE <db>.'
        },
        {
          id: 'lab-tables',
          title: 'Inspect what already exists.',
          lead: 'Load the three presets to inspect table names, column metadata, and live course records.',
          type: 'query',
          database: 'college_demo',
          sql: 'SHOW TABLES;',
          presets: [
            ['Table names', 'SHOW TABLES;'],
            ['Student definition', 'DESCRIBE students;'],
            ['Course data', 'SELECT * FROM courses ORDER BY id;']
          ],
          expected: 'Lists courses, enrollments, students, and the student_course_summary view.',
          question: 'Why does SHOW TABLES list student_course_summary even though it is a view?',
          answer: 'MariaDB lists both base tables and views in SHOW TABLES; SHOW FULL TABLES distinguishes BASE TABLE vs VIEW.',
          notes: 'Encourage students to click each preset and predict output before clicking Run.'
        },
        {
          id: 'lab-create',
          title: 'Create your first practice table.',
          lead: 'Define lab_students inside classroom_practice with PRIMARY KEY, NOT NULL, UNIQUE, and CHECK rules.',
          type: 'query',
          database: 'classroom_practice',
          resetKind: 'practice',
          sql: 'CREATE TABLE lab_students (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  name VARCHAR(100) NOT NULL,\n  email VARCHAR(120) NOT NULL UNIQUE,\n  age INT CHECK (age >= 16)\n);',
          expected: 'Statement completed. The table now exists with zero rows.',
          question: 'What happens if you click Run a second time without resetting?',
          answer: 'MariaDB raises Error 1050 (Table already exists). Use "Reset lab_students" when repeating a lecture.',
          notes: 'Demonstrate creating the table, then show the Reset lab_students button for safe repeats.'
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
          expected: '3 row(s) affected on the first run; repeating fails due to UNIQUE(email).',
          question: 'Why is omitting id valid here when id is a NOT NULL PRIMARY KEY?',
          answer: 'AUTO_INCREMENT automatically generates the next sequential integer.',
          notes: 'If jumping directly to this step, click Prepare example first so lab_students exists.'
        },
        {
          id: 'lab-select',
          title: 'Ask for all rows, then fewer columns.',
          lead: 'Compare SELECT * with selecting specific columns.',
          type: 'query',
          database: 'classroom_practice',
          setup: true,
          seedPractice: true,
          resetKind: 'practice',
          sql: 'SELECT * FROM lab_students ORDER BY id;',
          presets: [
            ['All columns', 'SELECT * FROM lab_students ORDER BY id;'],
            ['Name and age', 'SELECT name, age FROM lab_students ORDER BY id;']
          ],
          expected: 'Three sample rows; projecting name and age does not delete email from the table.',
          question: 'Does omitting email in SELECT remove it from disk?',
          answer: 'No. SELECT only shapes the returned result set.',
          notes: 'Use Prepare example if lab_students was not created earlier.'
        },
        {
          id: 'lab-filter',
          title: 'Return only rows matching a condition.',
          lead: 'Predict who remains when filtering by age > 20.',
          type: 'query',
          database: 'classroom_practice',
          setup: true,
          seedPractice: true,
          resetKind: 'practice',
          sql: 'SELECT name, age\nFROM lab_students\nWHERE age > 20\nORDER BY age;',
          expected: 'Kabir (22) and Aman (25); Riya (19) is filtered out.',
          question: 'Would a student aged exactly 20 match age > 20?',
          answer: 'No, > is strict. You would need age >= 20.',
          notes: 'Modify the threshold live in the editor (e.g. 22) to show live results.'
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
          presets: [
            ['Duplicate email', "INSERT INTO lab_students (name, email, age) VALUES ('Aman again', 'aman.lab@example.com', 25);"],
            ['Invalid age', "INSERT INTO lab_students (name, email, age) VALUES ('Young learner', 'young.lab@example.com', 12);"],
            ['Missing name', "INSERT INTO lab_students (name, email, age) VALUES (NULL, 'missing.lab@example.com', 21);"]
          ],
          expected: 'All three presets intentionally fail with MariaDB constraint errors.',
          question: 'Which specific constraint caught each of the three bad rows?',
          answer: '1) Duplicate entry -> UNIQUE(email). 2) CONSTRAINT failed -> CHECK(age >= 16). 3) Column cannot be null -> NOT NULL on name.',
          notes: 'Ensure Prepare example is clicked if arriving here directly.'
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
          notes: 'Give students 5–8 minutes in Student Mode using Hints and Check my answer. Note that Reset lab_students leaves lab_courses untouched.'
        },
        {
          id: 'lab-recap',
          title: 'First MariaDB workflow complete.',
          lead: 'You inspected metadata, defined constraints, inserted rows, filtered results, and saw constraint rejections.',
          type: 'quiz',
          options: [
            'CREATE defines structure; INSERT adds rows; SELECT queries data',
            'SELECT defines schemas every time it runs',
            'INSERT modifies table column definitions'
          ],
          correct: 0,
          feedback: 'DDL defines structures (CREATE), while DML inserts and retrieves data (INSERT, SELECT).',
          question: 'Student task: explain one real MariaDB error you triggered today and why it protected the table.',
          answer: 'Example: Error 4025 CHECK constraint failed prevented storing an unrealistic age (< 16).',
          notes: 'Wrap up Section 1.8 before closing Unit 1 with DBA responsibilities.'
        }
      ]
    },
    {
      id: 'dba', unit: 'u1', number: '1.9', title: 'DBA & Unit 1 checkpoint', minutes: 60,
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
          notes: 'Preview Units 3 and 4 directly from this table.'
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
          notes: 'Point out that this console itself uses least privilege (classroom_console cannot write to college_demo).'
        },
        {
          id: 'incident',
          title: 'Incident triage: a faculty account sees student fee balances.',
          lead: 'Queries are fast and data is accurate, yet confidential financial columns are visible to the wrong role.',
          type: 'quiz',
          options: [
            'Add a B+Tree index on fees',
            'Restrict privileges and expose only an approved External View without fee columns',
            'Increase innodb_buffer_pool_size'
          ],
          correct: 1,
          feedback: 'This is an authorization and external-view boundary failure, not a speed issue.',
          question: 'Student task: distinguish Authentication ("who are you?") from Authorization ("what may you do?").',
          answer: 'Authentication verifies identity (username, password/plugin, TLS cert); Authorization verifies permissions (GRANT SELECT/INSERT, roles) after login.',
          notes: 'Ensure students clearly contrast authentication vs authorization before Unit 3.'
        },
        {
          id: 'unit-challenge',
          title: 'Design a two-table college module.',
          lead: 'Pair exercise: design instructors and modules tables, choose primary/foreign keys, and describe one read-only external view.',
          type: 'challenge',
          database: 'classroom_practice',
          hints: [
            'Give instructors an id INT PRIMARY KEY AUTO_INCREMENT and unique email.',
            'Reference instructor_id INT in modules with FOREIGN KEY (instructor_id) REFERENCES instructors(id).'
          ],
          question: 'Draft your design in the workspace (optional) and verify your assumptions against the model answer.',
          answer: "CREATE TABLE lab_instructors (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  name VARCHAR(100) NOT NULL,\n  email VARCHAR(120) NOT NULL UNIQUE\n);\n\nCREATE TABLE lab_modules (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  title VARCHAR(120) NOT NULL,\n  instructor_id INT NOT NULL,\n  FOREIGN KEY (instructor_id) REFERENCES lab_instructors(id)\n);\n\nExternal view for students exposes module title + instructor name without exposing instructor email.",
          notes: 'Open-ended modeling challenge; encourage students to justify ON DELETE behavior.'
        },
        {
          id: 'unit-complete',
          title: 'Unit 1 complete. Foundations in place.',
          lead: 'You now understand why DBMSs exist, user categories, keys, relationships, three-schema mappings, architecture, and live MariaDB basics.',
          type: 'cards',
          cards: [
            ['Concepts & Mappings', 'Purpose of DBMS, applications, users/DBA, logical & physical independence via mappings.'],
            ['Relational Model', 'Tables, tuples, attributes, domains, NULL, PK/FK/Composite keys, 1:1 / 1:N / M:N.'],
            ['Architecture & Lab', 'Query Processor + Storage Manager, 1/2/3-tier, and live MariaDB table creation.']
          ],
          question: 'Exit ticket: explain both External–Conceptual and Conceptual–Internal mappings in one sentence.',
          answer: 'External–Conceptual mapping decouples user views from logical table changes; Conceptual–Internal mapping decouples logical tables from physical disk/index changes.',
          notes: 'Press Next to proceed directly into Unit 2: SQL Concepts.'
        }
      ]
    }
  ]
};

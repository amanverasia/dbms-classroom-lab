# DBMS Classroom Lab — course roadmap

## The goal

Open the teacher console, choose a unit and section, and keep pressing **Next**. The tables, example data, prompts, diagrams and demonstrations should already be ready so the teacher can concentrate on explaining and responding to students.

Build this into a companion for the entire **Database Administration and Security** subject: four units, approximately 10 teaching hours each. This plan follows the teaching outline in the [shared planning conversation](https://chatgpt.com/share/6ab2b5fd-4394-83e8-a14b-9ebb70389044); section names and timings are proposed, pending comparison with the original syllabus image. Timing includes explanation, discussion and student exercises, not just screen time.

## Current state

- [x] Local Git repository on `main`.
- [x] Docker environment with MariaDB, Adminer and the teacher console.
- [x] Seeded `students`, `courses`, `enrollments` and `student_course_summary`.
- [x] Five introductory screens: why a DBMS, tables and keys, SQL, relationships, and security.
- [x] Previous/Next navigation, arrow keys, presentation mode and browser-demo reset.
- [x] Four-unit roadmap.
- [ ] Complete Unit 1.
- [ ] Complete Units 2, 3 and 4.

**Important implementation boundary:** the current console's SQL editor uses a small JavaScript simulation. It does not execute against the MariaDB container, despite its current connection label. Adminer is the real database interface. Browser reset only resets the simulation. Resolving this distinction is an early milestone before expanding the SQL teaching experience.

## Classroom experience to preserve

1. Start Docker and open one familiar teacher console.
2. Choose **Unit → Section → Teaching step**, or resume the previous position.
3. Each step presents one teaching objective with a visible example.
4. Press Next to move through explanation, prediction, demonstration and a short check of understanding.
5. Reveal answers when ready; keep teacher notes optional and hidden from the projector by default.
6. Repeat a demonstration with a clearly scoped reset.
7. Finish a section with a recap and a student task, then continue into the next section.

The default sequence should work without typing commands, rearranging windows, creating data or remembering which example comes next. Optional exploration and a real SQL editor should remain available.

## Build order

| Milestone | Deliverable | Completion check |
|---|---|---|
| M0 — Baseline | Version the existing working demo and record this plan | Existing app remains available; local history captures the starting point |
| M1 — Course structure | Unit/section navigation and reusable lesson-step format | The current five screens work through the new structure; Next and Back follow a predictable sequence |
| M2 — Unit 1 | All sections below, prepared examples, notes and exercises | A complete 10-hour Unit 1 can be taught from the console |
| M3 — Real SQL foundation | Containerized query service, example loader, result display and scoped reset | Console queries return actual MariaDB results and changes appear in Adminer |
| M4 — Unit 2 | SQL lessons and practice | Every supplied query runs against a known starting dataset |
| M5 — Unit 3 | Administration and security demonstrations | Each persona, privilege and security scenario has a reproducible outcome |
| M6 — Unit 4 | Monitoring, maintenance and recovery scenarios | Slow-query, blocking and restore demonstrations can be repeated reliably |
| M7 — Course rehearsal | Full teaching path, instructor guide and release checklist | All four units are navigable and usable after restarting Docker |

For M1/M2, explicitly label simulated examples and provide a clear route to real MariaDB in Adminer. M3 must be finished before presenting the console editor as a general SQL environment. Move M3 earlier if Unit 1 needs integrated live SQL.

## Unit 1 — DBMS fundamentals · 10 hours

### 1.1 Why databases exist · 60 minutes

- Start with a college maintaining student, course and fee records in separate files.
- Show prepared conflicting records, duplicate entries and an update that reaches only one copy.
- Reveal the resulting problems one at a time: redundancy, inconsistency, access, concurrency and recovery.
- Compare file storage with DBMS features without suggesting that a DBMS automatically fixes poor data design.
- End with a discussion: which problem needs a rule, a relationship, a permission or a backup?

**Prepared interaction:** update a course name in a flat-file example and reveal the copies that disagree.

### 1.2 Database, DBMS and the people using them · 45 minutes

- Distinguish the organized data from the software managing it.
- Introduce users, application developers, administrators and analysts.
- Use the running college example to connect responsibilities to actions.
- Briefly introduce structured and semi-structured data.

**Prepared interaction:** classify examples as data, DBMS software, client software or a user role.

### 1.3 The relational model: tables, rows, columns and domains · 75 minutes

- Explore the seeded student and course tables.
- Highlight one table, row, column and cell at a time.
- Explain attributes, tuples, data types, domains and NULL with visible examples.
- Show valid and invalid values for a chosen column.
- Distinguish a table's rules from the current values stored in it.

**Prepared interaction:** click a column to reveal its type and allowed values; predict whether proposed records fit its rules.

### 1.4 Keys and integrity · 75 minutes

- Explain why names cannot reliably identify students.
- Cover candidate, primary, alternate, composite and foreign keys at introductory depth.
- Demonstrate uniqueness, required values and references to existing records.
- Include duplicate-ID and missing-course examples, followed by explanations of the errors.
- Explain that a foreign key may repeat and may allow NULL if its definition permits it.

**Prepared interaction:** attempt a valid record, a duplicate key and an invalid reference; reveal the corresponding rule.

### 1.5 Relationships between tables · 75 minutes

- Show one-to-one, one-to-many and many-to-many relationships.
- Trace matching key values by clicking a course or student.
- Start with a student's primary course, then introduce enrollments for students taking multiple courses.
- Explain what the enrollment table contributes and why its pair of IDs should be unique.
- Preview a joined result without requiring students to memorize JOIN syntax yet.

**Prepared interaction:** highlight all students on one course; then trace one student through multiple enrollment records.

**Dataset decision:** currently `students.course_id` and `enrollments` coexist. Give `students.course_id` an explicit meaning such as “primary course,” or migrate to a clearly staged model before teaching both. They must not imply conflicting definitions of enrollment.

### 1.6 Schema, instance and abstraction · 60 minutes

- Compare a table definition with its current contents.
- Show an insert changing the instance while the schema stays the same.
- Introduce external, conceptual and internal levels using the same college scenario.
- Show a student-facing view, the full logical structure and a simplified storage representation.
- Explain logical and physical data independence through concrete changes, including their practical limits.

**Prepared interaction:** switch between views of the same data and classify proposed changes as schema or instance changes.

### 1.7 DBMS architecture and a query's journey · 60 minutes

- Show client → server → storage using the Docker lab.
- Explain that the browser/Adminer is a client and MariaDB is the server.
- Introduce single-tier, two-tier and three-tier arrangements with familiar examples.
- Follow a query through parsing, planning, execution and result delivery at a conceptual level.
- Keep detailed InnoDB internals for Unit 3.

**Prepared interaction:** advance a query through the architecture one step at a time, labeling who does each job.

### 1.8 First MariaDB practical · 90 minutes

- Open the real server through Adminer or the container's MariaDB client.
- Demonstrate `SHOW DATABASES`, `USE`, `SHOW TABLES` and `DESCRIBE`.
- Create a small practice table, insert records and retrieve them.
- Introduce selecting columns and a simple WHERE condition as previews of Unit 2.
- Give students a matching course-table exercise with an optional answer reveal.
- Provide a starting state and a scoped reset for the practice table.

**Prepared interaction:** ready-to-load commands, expected outputs and “predict the result” pauses for every step.

### 1.9 DBA responsibilities and Unit 1 checkpoint · 60 minutes

- Connect access control, data integrity, availability, backups and monitoring to a DBA's work.
- Revisit whether an application should use the administrator account.
- Use short scenarios to connect each responsibility to a potential failure.
- Close with a recap, a small practical and an answer reveal.

**Prepared interaction:** match incidents to DBA responsibilities, then complete a short schema-and-query challenge.

### Unit 1 completion criteria

- [ ] All nine sections are accessible directly and in one continuous teaching sequence.
- [ ] Each section includes an objective, prepared example, teacher prompt, student task and recap.
- [ ] Key concepts have visible highlighting or a concrete before/after example.
- [ ] Answers are revealed intentionally rather than shown immediately.
- [ ] Simulated behavior and real MariaDB behavior are clearly distinguished.
- [ ] The real practical is rehearsed from a known database state.
- [ ] Screen content remains readable on a classroom projector.
- [ ] Restarting Docker and refreshing the page do not lose the teacher's place.

## Unit 2 — SQL · 10 hours

| Section | Time | Prepared demonstrations |
|---|---|---|
| 2.1 DDL, DML, DCL and transaction-control overview | 60 min | Classify commands; create and inspect practice tables |
| 2.2 Insert, update, delete and constraints | 90 min | Before/after rows; missing WHERE example in a disposable dataset; constraint errors |
| 2.3 Filtering, sorting and expressions | 90 min | WHERE, AND/OR, IN, LIKE, BETWEEN, NULL, ORDER BY and LIMIT |
| 2.4 Aggregation | 75 min | COUNT/SUM/AVG/MIN/MAX, GROUP BY and HAVING with visible groups |
| 2.5 Joins and set operations | 120 min | INNER/LEFT/RIGHT joins; unmatched records; UNION versus UNION ALL |
| 2.6 Subqueries and views | 90 min | IN, EXISTS, correlated subqueries, ANY/ALL, reusable views |
| 2.7 Functions and practical checkpoint | 75 min | String/date/numeric functions and a reporting challenge |

Completion requires real MariaDB execution, useful errors, empty-result handling, predictable row ordering where demonstrated, and repeatable practice data. The lesson should distinguish SQL's semantics from the particular ordering or formatting chosen by the UI.

## Unit 3 — MariaDB security and administration · 10 hours

| Section | Time | Prepared demonstrations |
|---|---|---|
| 3.1 MariaDB and InnoDB fundamentals | 90 min | Storage engine, data pages, buffer pool, redo/undo and transaction overview |
| 3.2 Users and authentication | 75 min | User/host identity, authentication options and account inspection |
| 3.3 Privileges, roles and least privilege | 105 min | Compare DBA, application, reporting and backup accounts; GRANT and REVOKE |
| 3.4 Network access and TLS | 90 min | Client/server ports, bind addresses, exposure and verified encrypted connections |
| 3.5 Application security | 90 min | Local vulnerable query example alongside parameterized queries; explain actual outcomes |
| 3.6 Administration and metadata | 90 min | Data dictionary, configuration, password policy and useful logs |
| 3.7 Secure setup checkpoint | 60 min | Configure and justify a small application's database access |

All account, network and security exercises run inside the isolated Docker lab with synthetic data. Persona examples must be exercised against MariaDB so an allowed or denied action is observable.

## Unit 4 — Monitoring, maintenance and recovery · 10 hours

| Section | Time | Prepared demonstrations |
|---|---|---|
| 4.1 Connections and server activity | 75 min | PROCESSLIST, status counters and identifying active work |
| 4.2 Query performance and indexing | 105 min | EXPLAIN before/after an index on a sufficiently large seeded dataset |
| 4.3 Transactions, blocking and deadlocks | 90 min | Two independent sessions, lock wait, commit/rollback and recovery |
| 4.4 Logs and auditing | 90 min | Distinguish error, general, slow, binary and audit logs; investigate a change |
| 4.5 Backup and restore | 120 min | Take and verify a backup; lose disposable data; restore and verify records |
| 4.6 Maintenance and capacity | 60 min | Storage growth, routine checks, retention and maintenance planning |
| 4.7 Final scenario | 60 min | Diagnose and recover a prepared incident; explain security decisions |

Provide actual server sessions and log output. Use deliberate blocking and query-plan changes rather than promising fixed performance timings. Recovery demonstrations operate on a dedicated disposable database and verify the restored data.

## Technical foundation for expansion

### Reusable lesson structure

Refactor the current hardcoded screens incrementally into a lesson registry. Each step needs a stable ID, unit, section, title, objective, visual content, optional demo action, teacher notes, discussion prompt, answer reveal and expected outcome. Keep lesson content separate from navigation and database execution.

Support direct section access, resume position in browser storage, a visible unit/section indicator, keyboard navigation and a clear exit from presentation mode. Reuse a small set of step types: explanation, table exploration, comparison, relationship, query, challenge and recap.

### Consistent course dataset

Keep the recognizable college dataset throughout the course. Introduce additional tables only when a lesson needs them: instructors, assessments, payments, accounts and activity logs. Use deterministic fictional records and reserved example email addresses. Prepare separate small tables for explanation and larger fixtures for performance lessons.

Version seeds and schema migrations. Existing Docker volumes do not automatically rerun initialization scripts when those files change; provide an explicit upgrade path and scoped lesson reset. Browser-demo reset, practice reset and complete database recreation must have different labels and effects.

### Real database connection

Add a small backend service in Docker that the teacher console calls to execute lesson queries and retrieve results. Start with predefined query examples, then enable an editable SQL workspace for practice. Keep database credentials on the service side. Use separate database identities for each privilege demonstration, and handle multiple sessions explicitly for transaction lessons.

Before the next release, bind classroom ports to loopback for local teaching, verify the Adminer version used, and make the demo/real-connection indicator truthful. Offer intentional classroom-network sharing as a separate future capability.

### Docker-only operation

All servers, package installs, build steps and test runtimes belong in containers. Reuse the Mac's existing Docker Desktop. Keep startup straightforward, add readable readiness checks, and keep data in named volumes. Verify an offline teaching launch after required images are downloaded; avoid remote font, script or image dependencies in lesson screens.

### Validation that matters for teaching

- Rehearse each section from its documented starting state.
- Check Previous/Next across section and unit boundaries, direct navigation, refresh and resume.
- Verify expected query results, intentional error cases and scoped resets against MariaDB.
- Test table readability, answer reveals and presentation controls at typical projector resolutions.
- Confirm independent sessions for transaction lessons and restored data for recovery lessons.
- Keep the first lecture usable while later units are under development.

## Suggested next development session

1. Build the unit/section/step navigation and migrate the current introduction into it.
2. Add truthful labels for the current SQL simulation and an obvious “Open real MariaDB” action.
3. Deliver Unit 1 sections 1.1–1.3 with prepared interactions and teacher notes.
4. Complete sections 1.4–1.6, resolving the course/enrollment model as part of that work.
5. Finish sections 1.7–1.9 and rehearse the entire unit.

Update this file as milestones are delivered. Checkboxes indicate completed work, not intended work. Commit each coherent milestone so a known working classroom version can always be recovered.

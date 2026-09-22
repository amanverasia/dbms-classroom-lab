# DBMS Classroom Lab

A teacher console for the whole DBMS course, with **Units 1 and 2 ready: 16 sections and 95 teaching steps**. Each unit provides approximately 10 teaching hours including discussion and student exercises. All services run in Docker; no database or runtime installation on the host is needed.

Private source repository: [amanverasia/dbms-classroom-lab](https://github.com/amanverasia/dbms-classroom-lab). The GitHub repository stores the source and history; the classroom itself runs locally in Docker.

The long-term plan is a section-by-section teacher console for all four units. See [roadmap.md](roadmap.md) for the detailed Unit 1 plan, later units and development milestones.

The console SQL editor now executes **real MariaDB queries**. The table explorer and relationship demos read the same database as Adminer. Conceptual animations are clearly labeled as illustrations.

## Start the complete lab

1. Start Docker Desktop.
2. Double-click `start.command` in this folder.
3. Visit:

- Teacher console: <http://localhost:8080>
- Real database UI: <http://localhost:8081>

The first launch may take a few minutes while Docker downloads images. Later launches use the downloaded images. The launcher waits for startup and applies the additive practice-database setup, including when upgrading from the original first-lecture release.

You can also start it from a terminal opened in this folder:

```console
docker compose up -d --wait
docker compose exec -T mariadb mariadb -uroot -pclassroom-root < database/02-classroom.sql
docker compose exec -T mariadb mariadb -uroot -pclassroom-root < database/03-unit2.sql
docker compose exec -T classroom-api php /var/www/classroom/unit2.php
```

Adminer login:

| Field | Value |
|---|---|
| System | MySQL |
| Server | `mariadb` |
| Username | `root` |
| Password | `classroom-root` |
| Database | `college_demo` |

These credentials are deliberately simple and are only for a local classroom demo. Do not reuse them on a public or production server.

Stop the lab with:

```console
docker compose down
```

Ordinary `docker compose down` preserves the database volume. Avoid deleting the volume as a routine classroom reset: that erases all database work. Use the scoped practice-table reset in the console instead.

## Teaching controls

- **Next / Previous**, or **→ / ←**, move through all 95 steps across section and unit boundaries.
- The sidebar jumps to a section; the progress segments jump to its individual steps.
- **Present** hides navigation and enlarges lesson content. **Exit presentation** or Escape returns.
- **Reveal answer** keeps the explanation hidden until you choose to show it.
- **Teacher notes** opens guidance for the current step. It appears on the same screen: close it before projecting the lesson again.
- **SQL workspace** opens an editable real-query workspace. Run one statement at a time with the button or Ctrl/⌘ + Enter.
- Your teaching position saves automatically in this browser. Each step also has its own bookmarkable URL.
- **Course contents** opens either Unit 1 or Unit 2. The sidebar, progress and default SQL workspace follow the selected unit. Units 3 and 4 remain planned.
- **Inspect result**, where offered, runs the prepared inspection query after a definition or data change. It preserves the statement in the editor.

## Unit 1 sections

| Section | Topic | Teaching time |
|---|---|---|
| 1.1 | Why databases exist | 60 min |
| 1.2 | Database, DBMS and people | 45 min |
| 1.3 | Tables, rows and columns | 75 min |
| 1.4 | Keys and integrity | 75 min |
| 1.5 | Relationships | 75 min |
| 1.6 | Schema and abstraction | 60 min |
| 1.7 | Architecture and query execution | 60 min |
| 1.8 | First MariaDB practical | 90 min |
| 1.9 | DBA responsibilities and checkpoint | 60 min |

The timing is a pacing guide, not an automatic timer. This sequence follows the shared teaching outline; compare it with the original syllabus for institution-specific wording or additional topics.

## Unit 2 sections

Unit 2 adds 46 teaching steps, prepared queries, answer reveals and a reporting challenge.

| Section | Topic | Teaching time |
|---|---|---|
| 2.1 | SQL families, CREATE and ALTER | 60 min |
| 2.2 | INSERT, UPDATE, DELETE and constraints | 90 min |
| 2.3 | Filtering, sorting, NULL and expressions | 90 min |
| 2.4 | Aggregates, GROUP BY and HAVING | 75 min |
| 2.5 | INNER/LEFT/RIGHT joins and UNION | 120 min |
| 2.6 | Subqueries, EXISTS, ANY/ALL and views | 90 min |
| 2.7 | Functions and a reporting practical | 75 min |

Open **Course contents → SQL** to start, or keep pressing Next at the end of Unit 1. Lesson queries execute when you press Run; editing a query or changing a preset does not execute it automatically.

## Real SQL and practice data

- `college_demo` contains the original seed tables and view. The console account can read them; editing them requires another appropriate database login, such as the Adminer administrator.
- `students.course_id` means **primary course**. `enrollments` records all actual course participation. The lessons explain these separately.
- `classroom_practice` is editable through the console. Section 1.8 creates `lab_students`, inserts sample records and queries them.
- **Prepare example**, available on later practical steps, creates `lab_students` if missing and adds missing sample emails where needed. It does not overwrite existing records.
- **Reset lab_students** asks for confirmation, then removes only that table and its rows. Return to the CREATE TABLE step to repeat the practical. It does not remove `lab_courses` or other practice tables.
- `sql_lab` is the separate Unit 2 dataset: six students, four courses, five enrollments and five payments. It deliberately includes unmatched rows and NULL values. Unlike the simplified Unit 1 model, its students table has no primary-course assignment; actual participation is represented by enrollments.
- The Unit 2 editing lessons target `sql_lab.student_edits`, a copy of its students table. **Restore edit copy** replaces only this copy from the current source students.
- **Reset Unit 2 data** restores the named students, courses, enrollments, payments, student_edits and lesson_state objects. It removes the lesson-created course_notes table and course_roster view. It asks for confirmation and does not reset Unit 1 or unrelated tables. A custom foreign key depending on a lesson table can prevent a reset; the server reports the error rather than silently removing your dependency.
- Unit 2 initializes automatically on first use. Starting the launcher or preparing an already initialized dataset preserves existing edits. An interrupted/incomplete initialization requires an explicit Unit 2 reset.
- The service returns at most 200 displayed rows and applies a three-second SQL statement timeout.
- Every request uses a new database connection. Choose the database in the selector each time. A `USE` statement does not persist to the next request. Persistent transaction/session demonstrations are future work; use an appropriate persistent MariaDB client for those.

Ports are bound to `127.0.0.1`: 8080 for the console, 8081 for Adminer, 3307 for MariaDB. This setup is for teaching on this computer, not network sharing.

## Project structure and verification

`lessons.js` and `lessons-unit2.js` contain the two lesson registries. `app.js` renders reusable demonstrations and navigation. `server/index.php` handles SQL requests; its database account is restricted to the teaching databases. The numbered database scripts add databases and grants. `server/unit2.php` manages the separate SQL fixture and its explicitly scoped resets.

Run the API checks inside Docker:

```console
docker compose exec -T classroom-api php < tests/verify-api.php
```

The checks create and clean up a uniquely named verification table. An optional `-e RUN_RESET_CHECK=1` on that command also tests the actual `lab_students` reset, so only use that option when the disposable lesson table can be removed.

Rehearse all Unit 2 SQL examples, including expected errors and reset isolation:

```console
docker compose exec -T -e RUN_UNIT2_RESET=1 classroom-api php < tests/verify-unit2.php
```

This opt-in test restores the named Unit 2 objects before and after the rehearsal. Do not run it while retaining edits in those disposable objects. It checks all 72 main statements, presets and inspections, expected row counts, aggregate values, payment totals, non-destructive preparation and reset isolation.

Both units were rehearsed through their teaching screens in the browser, including cross-unit navigation, saved-position reloads and live query results. No external fonts, scripts or media are required during a lesson. Dependencies must have been downloaded by Docker before an offline teaching session.

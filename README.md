# DBMS Classroom Lab

A teacher console for the whole DBMS course, with **Unit 1 ready: nine sections, 49 teaching steps and approximately 10 hours including discussion and student exercises**. All services run in Docker; no database or runtime installation on the host is needed.

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

- **Next / Previous**, or **→ / ←**, move through all 49 steps across section boundaries.
- The sidebar jumps to a section; the progress segments jump to its individual steps.
- **Present** hides navigation and enlarges lesson content. **Exit presentation** or Escape returns.
- **Reveal answer** keeps the explanation hidden until you choose to show it.
- **Teacher notes** opens guidance for the current step. It appears on the same screen: close it before projecting the lesson again.
- **SQL workspace** opens an editable real-query workspace. Run one statement at a time with the button or Ctrl/⌘ + Enter.
- Your teaching position saves automatically in this browser. Each step also has its own bookmarkable URL.
- **Course contents** shows Unit 1 as available and Units 2–4 as planned.

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

## Real SQL and practice data

- `college_demo` contains the original seed tables and view. The console account can read them; editing them requires another appropriate database login, such as the Adminer administrator.
- `students.course_id` means **primary course**. `enrollments` records all actual course participation. The lessons explain these separately.
- `classroom_practice` is editable through the console. Section 1.8 creates `lab_students`, inserts sample records and queries them.
- **Prepare example**, available on later practical steps, creates `lab_students` if missing and adds missing sample emails where needed. It does not overwrite existing records.
- **Reset lab_students** asks for confirmation, then removes only that table and its rows. Return to the CREATE TABLE step to repeat the practical. It does not remove `lab_courses` or other practice tables.
- The service returns at most 200 displayed rows and applies a three-second SQL statement timeout.
- Every request uses a new database connection. Choose the database in the selector each time. A `USE` statement does not persist to the next request. Persistent transaction/session demonstrations are future work; use an appropriate persistent MariaDB client for those.

Ports are bound to `127.0.0.1`: 8080 for the console, 8081 for Adminer, 3307 for MariaDB. This setup is for teaching on this computer, not network sharing.

## Project structure and verification

`lessons.js` contains lesson content. `app.js` renders reusable demonstrations and navigation. `server/index.php` handles SQL requests; its database account is restricted to the teaching databases. `database/02-classroom.sql` adds the practice database and console account without changing the seed tables.

Run the API checks inside Docker:

```console
docker compose exec -T classroom-api php < tests/verify-api.php
```

The checks create and clean up a uniquely named verification table. An optional `-e RUN_RESET_CHECK=1` on that command also tests the actual `lab_students` reset, so only use that option when the disposable lesson table can be removed.

The delivered Unit 1 was rehearsed through all 49 screens in the browser, including the real create/insert/select practical and expected constraint errors. No external fonts, scripts or media are required during a lesson. Dependencies must have been downloaded by Docker before an offline teaching session.

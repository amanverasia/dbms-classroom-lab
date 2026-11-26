# DBMS Classroom Lab (MSCNS406)

A self-contained, cross-platform **Database Administration and Security** teaching console and student self-practice lab powered by **MariaDB 11.4** in Docker.

- **All 4 syllabus units (MSCNS406) ready:** 30 sections, 157 teaching steps, interactive architecture/storage/locking SVG diagrams, and real MariaDB execution.
- **Two-fold design:**
  - **Instructor Mode (Projector):** Clean **Zen Stage** layout with a compact **Floating Dock** (`←`, `SQL Studio`, `Notes`, `Present`, `Next →`), slide-over **Curriculum Drawer** (`M`), **`⌘K` Command Palette**, **Split SQL Studio** (`S`) across all 10 classroom and system-catalog databases, **`Paper` / `Dark`** theme toggle, projector-scaled `Present` mode, private **Pop-out Speaker Notes** window (`BroadcastChannel` synced), and scoped lab resets (`⌘K → Reset Current Lab` / `Restore edit copy`).
  - **Student Practice Mode:** Switch to **Student** to hide instructor-only chrome, open **SQL Studio** (`S`) with an inline **Schema** drawer and **`Recent…`** history across all 10 unit/catalog databases, and verify SQL challenges with **`Hint 1 / 2`** and **`✓ Check my answer`**.
- **Runs everywhere:** Identical Docker workflow on **Windows, Linux, and macOS** — zero host database or Node/PHP installations required.

---

## Quick Start (Windows, Linux & macOS)

Make sure **Docker Desktop** (Windows/macOS) or **Docker Engine + Compose** (Linux) is running.

- **Windows:** Double-click `start.bat` (or run `.\start.bat` in PowerShell / CMD)
- **macOS:** Double-click `start.command` (or run `./start.sh`)
- **Linux:** Run `./start.sh`
- **Any OS (manual terminal command):**
  ```console
  docker compose up -d --build --wait
  ```

Once ready, open:
- **Classroom Console (Units 1–4):** <http://localhost:8080>
- **Adminer Database UI:** <http://localhost:8081>

> **Need custom ports?** Copy `.env.example` to `.env` and change `CONSOLE_PORT`, `ADMINER_PORT`, or `DB_PORT` before launching.
>
> **Stop later without losing data:** `docker compose down`

### Connect with DBeaver (Practice & Exams)

Click **DBeaver** in the console top bar (or open **`⌘K` → Connect DBeaver**) for 1-click copyable credentials, the downloadable `dbms-classroom-ca.pem` TLS certificate, and downloadable `.sql` practice worksheets (`web/worksheets/`):

| Setting | Value |
|---|---|
| Driver | MariaDB |
| Server Host | `127.0.0.1` |
| Port | `3307` (or your `DB_PORT`) |
| Units 1–2 User / Pass | `classroom_console` / `console-local-demo` |
| Units 3–4 Admin User / Pass | `dba_lab` / `dba-local-demo` |
| TLS Lab User / Pass | `tls_user` / `tls-local-demo` (import `dbms-classroom-ca.pem`) |

### Adminer Login Credentials (Local Classroom Only)

| Field | Value |
|---|---|
| System | MySQL |
| Server | `mariadb` |
| Username | `root` |
| Password | `classroom-root` |
| Database | `college_demo` |

---

## Using the Two Modes

### For Instructors (Classroom Teaching)
- Switch **Instructor / Student** in the top bar (defaults to **Instructor**); switch themes anytime with **Dark / Paper**.
- Open **Notes → Pop out speaker window ↗** on your laptop display, then click **Present** in the floating dock so speaker notes never appear on the projector screen.
- Press **Next →** / **Previous (`←`)** (or arrow keys), press **`M`** for the **Curriculum Drawer**, **`S`** to toggle **Split SQL Studio** (covering all 10 classroom & catalog databases), or **`⌘K`** for instant search, **Exam Cheat Sheet**, **Open Adminer ↗**, and **Reset Current Lab**.
- Use contextual reset actions inside **SQL Studio** (or **Restore edit copy** / **`⌘K → Reset Current Lab`**) between classes without deleting Docker volumes.

### For Students (Self-Practice)
- Switch to **Student** in the top bar.
- Press **`S`** (or click **SQL Studio**) anytime to practice across all 10 databases (`college_demo`, `classroom_practice`, `sql_lab`, `security_lab`, `perf_lab`, `ops_lab`, `backup_lab`, `information_schema`, `performance_schema`, `mysql`) with an inline **Schema** drawer and **`Recent…`** query history.
- On challenge steps, use **Hint 1 / 2** and **✓ Check my answer** to validate your SQL against MariaDB automatically and track completed checkpoints.

---

## MSCNS406 Syllabus Coverage

| Unit | Title | Highlights |
|---|---|---|
| **Unit 1** | Introductory concepts of DBMS (10 hrs) | Applications of DBMS, file flaws vs DBMS, Naive/Programmers/Sophisticated/Specialized users & DBA, keys & relationships, **Three-Schema Architecture & Mappings**, Query Processor & Storage Manager, first `classroom_practice` SQL lab. |
| **Unit 2** | SQL Concepts (10 hrs) | DDL (`CREATE`/`ALTER`/`TRUNCATE`/`DROP`), DML (`INSERT`/`UPDATE`/`DELETE`), DCL (`GRANT`/`REVOKE`), all 5 constraints (`PK`, `FK`, `UNIQUE`, `NOT NULL`, `CHECK`), filtering (`IN`, `BETWEEN`, `LIKE`, `IS NULL`, `CASE`), `GROUP BY`/`HAVING` (`ONLY_FULL_GROUP_BY`), all joins (`INNER`, `LEFT`, `RIGHT`, `FULL` emulation, `CROSS`, `SELF`, `NATURAL`), set ops (`UNION`, `UNION ALL`, `INTERSECT`, `EXCEPT`), subqueries (`IN`, `EXISTS`, `ANY`, `ALL`), view types (`WITH CHECK OPTION`, Simple vs Complex), numeric/string/date functions. |
| **Unit 3** | MariaDB Concepts, Security & Authentication (10 hrs) | Full DB/table lifecycle in persistent session, client connection config, storage engines & InnoDB internals (`*.ibd`, 16 KB pages, redo/undo, buffer pool), Data Dictionary (`INFORMATION_SCHEMA`, `mysql`, `PERFORMANCE_SCHEMA`), users & RBAC roles, `ed25519` & auth plugins, live Persona permission tester, **SQL Injection** (vulnerable vs parameterized), **TLS (`REQUIRE SSL`)**, `simple_password_check` & account locking. |
| **Unit 4** | Monitoring & Maintenance of MariaDB (10 hrs) | Live log toggling & tail viewer (`error`, `slow`, `general`, `binlog`), **Audit plugin (`server_audit`)**, **Enterprise Monitor concepts + Live Activity Monitor**, `EXPLAIN` indexing on 25,000 rows, DB growth & capacity planning, **Dual-Session Live Lock Waits & Deadlocks (Error 1213)**, **Live `mariadb-dump` Backup, Disaster Simulation, Restore & `mariadb-binlog`**. |

---

## Full Automated Verification

Run the end-to-end verification suite inside the API container (validates curriculum integrity, all Unit 1–4 SQL, personas, SQLi, TLS, password plugin, logging, 25k-row `EXPLAIN`, concurrent lock wait + deadlock, and backup/restore):

```console
docker compose exec -T -e RUN_FULL_REHEARSAL=1 classroom-api node /app/tests/verify-all.mjs
```

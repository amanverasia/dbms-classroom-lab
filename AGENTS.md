# AGENTS.md — DBMS Classroom Lab (MSCNS406)

This repository is a self-contained, Docker-based **Database Administration and Security** (`MSCNS406`) teaching console and student self-practice environment.

---

## 1. Two-Fold Purpose

1. **Instructor Classroom Console (Projector)**
   - Start Docker, open the console in a browser, and teach linearly across all four units using **Next / Previous** or arrow keys (`←` / `→`).
   - Every table, dataset, SVG diagram, multi-session lock demo, log toggle, and backup/restore demonstration runs live against MariaDB 11.4 inside Docker without host database installs.
   - **Presentation mode** (`Present`) hides navigation chrome and scales lesson typography, SQL editors, result tables, and SVG diagrams for classroom projectors.
   - **Teacher notes** remain private via a separate synced **Speaker Notes** window (`?presenter=1` via `BroadcastChannel`) so notes do not cover the projected screen.
2. **Student Self-Practice Lab**
   - Switching to **Student Mode** hides instructor-only chrome/wording and unlocks progressive **Hints**, an inline **Live Schema Reference**, saved query drafts/history, and **Check my answer** auto-verification on practical SQL challenges.
   - Students can run the identical environment on **Windows, Linux, or macOS** using Docker Desktop / Docker Engine.

---

## 2. Official Syllabus (MSCNS406 — Database Admins and Security)

Source of truth: [WhatsApp Image 2026-09-16 at 11.12.33.jpeg](WhatsApp%20Image%202026-09-16%20at%2011.12.33.jpeg).

- **Unit 1 — Introductory concepts of DBMS (1 Credit · 10 Hrs)**
  - Introduction and applications of DBMS
  - Purpose of database
  - Data Independence (logical & physical)
  - Database System architecture — levels (External, Conceptual, Internal; 1/2/3-tier; Query Processor & Storage Manager)
  - Mappings (External–Conceptual and Conceptual–Internal mappings)
  - Database, users (Naive, Application Programmers, Sophisticated, Specialized) and DBA
- **Unit 2 — SQL Concepts (1 Credit · 10 Hrs)**
  - Basics of SQL, DDL, DML, DCL
  - Structure — creation, alteration, defining (`CREATE`, `ALTER`, `DROP`, `TRUNCATE`)
  - Constraints — `PRIMARY KEY`, `FOREIGN KEY`, `UNIQUE`, `NOT NULL`, `CHECK`
  - `IN` operator (plus `BETWEEN`, `LIKE`, `IS NULL`, `ORDER BY`, `LIMIT`, `CASE`)
  - Functions — aggregate functions (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`)
  - Built-in functions — numeric, date, string functions
  - Set operations (`UNION`, `UNION ALL`, `INTERSECT`, `EXCEPT`)
  - Sub-queries, correlated sub-queries
  - Use of `GROUP BY`, `HAVING`, `ORDER BY`
  - Join and its types (`INNER`, `LEFT`, `RIGHT`, `FULL OUTER` emulation, `CROSS`, `SELF`, `NATURAL`)
  - `EXISTS`, `ANY`, `ALL`
  - View and its types (Simple/Updatable vs Complex/Read-only, `WITH CHECK OPTION`, `ALGORITHM`, `ALTER`/`DROP VIEW`, Virtual vs Materialized)
- **Unit 3 — MariaDB Concepts, Security & Authentication (1 Credit · 10 Hrs)**
  - MariaDB operations: creating database, selecting a database, listing databases, listing table names, creating a table, inserting data, altering tables, queries, deleting database, deleting data and tables
  - Configure client connections to the server (`bind-address`, port, TCP vs socket, `my.cnf`, `max_connections`, `USER()` vs `CURRENT_USER()`)
  - Understand how MariaDB stores data (storage engines, tablespaces, `.ibd` / `ibdata1`)
  - Understand how InnoDB stores data and logs (16 KB B+Tree pages, doublewrite buffer, redo log, undo log / MVCC)
  - Configure buffers and caches (`innodb_buffer_pool_size`, `innodb_log_buffer_size`, `table_open_cache`, `thread_cache_size`, hit ratio)
  - Understand and use the Data Dictionary (`INFORMATION_SCHEMA`, `mysql` grant tables, `PERFORMANCE_SCHEMA`)
  - Security: create user accounts and roles (`'user'@'host'`, `CREATE ROLE`, `SET ROLE`)
  - Use authentication plugins (`mysql_native_password`, `ed25519`, `unix_socket`, `pam`, `parsec`)
  - Control user and role permissions (`GRANT`, `REVOKE`, `SHOW GRANTS`, least privilege)
  - Recognize common security risks (SQL injection, over-privileged app accounts, weak defaults)
  - Secure MariaDB server connections (TLS/SSL with `REQUIRE SSL` and certificate verification)
  - Provide password and login security (`simple_password_check`, `PASSWORD EXPIRE`, `ACCOUNT LOCK`, resource limits)
- **Unit 4 — Monitoring and Maintenance of MariaDB (1 Credit · 10 Hrs)**
  - Configure and view MariaDB log files (error log, general query log, slow query log, binary log)
  - Monitor MariaDB processes and status (`SHOW FULL PROCESSLIST`, `SHOW GLOBAL STATUS`, `KILL`, `PERFORMANCE_SCHEMA`)
  - Configure MariaDB Enterprise Audit (demonstrated live via MariaDB Community's `server_audit` plugin + explicit comparison with Enterprise Audit features)
  - Use MariaDB Enterprise Monitor to view activity in MariaDB (concepts/architecture + built-in Live Activity Monitor backed by `SHOW GLOBAL STATUS`, `INNODB_TRX`, and `PERFORMANCE_SCHEMA`)
  - Monitor database growth and explain capacity planning (`INFORMATION_SCHEMA.TABLES`, `DATA_LENGTH`, `INDEX_LENGTH`, `DATA_FREE`, retention & `ANALYZE`/`OPTIMIZE`/`CHECK TABLE`)
  - Troubleshoot problems with locked resources (live dual-session blocking, `INNODB_TRX`, `INNODB_LOCKS`, deadlocks `1213`, `SHOW ENGINE INNODB STATUS`)
  - Backups and Recovery & distinguish between the different types of backup (Logical vs Physical, Full vs Incremental vs Differential, Hot vs Cold, PITR with binary logs via live `mariadb-dump`, `mariadb`, and `mariadb-binlog`)

---

## 3. Cross-Platform Rules (Windows, Linux, macOS)

1. **`docker compose up -d --build` (or `--wait`) must fully initialize and upgrade the database inside Docker.**
   - Never instruct users (especially Windows PowerShell users) to pipe SQL files using `<` from the host shell.
   - `server/bootstrap.js` runs automatically on container boot to create/upgrade schemas, users, and fixtures non-destructively.
2. **Line endings (`.gitattributes`):**
   - Enforce LF (`eol=lf`) for `.sh`, `.command`, `.sql`, `.cnf`, `.conf`, `.js`, `.mjs`, `.json`, `.html`, `.css`, `Dockerfile`, and `.yml`.
   - Enforce CRLF (`eol=crlf`) only for Windows `.bat` scripts.
3. **Thin cross-platform launchers:**
   - `start.bat` (Windows CMD / double-click)
   - `start.sh` (Linux & macOS POSIX `#!/usr/bin/env sh`)
   - `start.command` (macOS Finder double-click)
   - Every launcher merely `cd`s to the repo directory, runs `docker compose up -d --build --wait`, and prints the Console and Adminer URLs.
4. **Port & URL flexibility:**
   - Support `.env` overrides via `CONSOLE_PORT` (default `8080`), `ADMINER_PORT` (default `8081`), and `DB_PORT` (default `3307`).
   - Never hardcode `http://localhost:8081` in HTML; read the configured `adminerPort` from `/api/health` and adjust links using `location.hostname`.
   - Do not hardcode `container_name` in `docker-compose.yml`.

---

## 4. Architecture & Security Rules

1. **Directory bind-mounts over individual file mounts:**
   - Mount `./web`, `./database`, and `./tests` as directories (plus `./server/nginx.conf` for Nginx's `default.conf`). Never mount individual JS/PHP source files separately.
2. **Dedicated concurrent backend:**
   - `classroom-api` is built from `docker/api/Dockerfile` (`node:22-bookworm-slim` + `mysql2` + `mariadb-client`). Never hijack `adminer:4` with single-threaded `php -S`.
   - Concurrent HTTP requests and independent named DB sessions (`A`, `B`, `unit3`) must never block each other so live lock-wait and deadlock demonstrations work reliably.
3. **Network & endpoint safety:**
   - Bind all host ports to `127.0.0.1` only.
   - Keep `Content-Type: application/json` and `Sec-Fetch-Site: cross-site` guards on POST routes.
   - Keep `college_demo` read-only for the `console` persona. Isolate labs across `classroom_practice`, `sql_lab`, `security_lab`, `perf_lab`, `ops_lab`, and `backup_lab`.
   - Shell commands for `mariadb-dump`, `mariadb`, and `mariadb-binlog` must use `execFile` with strict argument arrays and whitelisted database/filename validation (never shell interpolation).
   - Never allow `root` login via custom UI user-testing inputs.
4. **Offline-first frontend:**
   - Zero external CDN fonts, scripts, stylesheets, or images. All assets and inline SVG diagrams must live in `./web/`.

---

## 5. Lesson Authoring & Quality Rules

1. Every section object in `web/lessons-unit*.js` **must explicitly declare** `unit: 'u1' | 'u2' | 'u3' | 'u4'`. Never mutate earlier sections at script load time.
2. Every step **must have tailored, step-specific**:
   - `notes`: concrete instructor guidance specific to that step (never copy-paste generic boilerplate across steps),
   - `question`: an active discussion or prediction prompt,
   - `answer`: clear, properly formatted explanation (multi-line SQL answers must format cleanly in `<pre>`).
3. Practical student challenges should provide `hints` (1–2 progressive hints) and a `check` specification for live **Check my answer** verification.
4. Steps that depend on prior mutations (e.g., `ALTER TABLE` after `CREATE TABLE`, `sql-constraint-errors` after `DELETE`, `course_roster` view queries) **must declare a `prepare` action** or self-contained setup so jumping directly to any step works out of the box.
5. **Verification requirement:** Before completing changes, verify all 4 units, API routes, error demos, persona permissions, SQLi comparison, TLS rejection/acceptance, password validation, log toggling/reading, activity metrics, 25k-row `EXPLAIN` plan change, dual-session lock wait + deadlock, and backup/restore/binlog flow via `tests/verify-all.mjs` inside Docker.

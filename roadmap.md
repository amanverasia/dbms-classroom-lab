# DBMS Classroom Lab (MSCNS406) — Course Roadmap

## Goal & Alignment

Provide a cross-platform (Windows, Linux, macOS) Docker environment serving both as an **instructor projection console** and a **student self-practice lab** covering the entire **MSCNS406 — Database Administration and Security** syllabus (4 units · 40 teaching hours).

---

## Milestone Status

| Milestone | Deliverable | Status |
|---|---|---|
| M0 — Baseline | Initial classroom demo & repository history | [x] Complete |
| M1 — Course structure | Multi-unit navigation, step rail, presentation mode, saved progress | [x] Complete |
| M2 — Unit 1 | Introductory DBMS concepts, applications, user types, mappings diagram, Query Processor/Storage Manager, first practical + auto-check | [x] Complete |
| M3 — Concurrent API & Cross-Platform Bootstrap | Node.js + `mysql2` backend, auto-bootstrapping on `docker compose up`, `.gitattributes`, Win/Linux/Mac launchers, persistent sessions | [x] Complete |
| M4 — Unit 2 | Full SQL concepts (DDL/DML/DCL, 5 constraints, joins incl. CROSS/SELF/NATURAL/FULL, INTERSECT/EXCEPT, views + CHECK OPTION, numeric/string/date functions) + tailored notes | [x] Complete |
| M5 — Unit 3 | MariaDB CRUD, client config, InnoDB storage/logs inspector, Data Dictionary, users/roles/`ed25519`, live persona permissions, SQLi lab, TLS `REQUIRE SSL`, password policy | [x] Complete |
| M6 — Unit 4 | Live logs & `server_audit`, Live Activity Monitor + Enterprise Monitor concepts, 25k-row `EXPLAIN` & growth planning, dual-session lock waits & Error 1213 deadlock, live `mariadb-dump` backup/restore + `mariadb-binlog` | [x] Complete |
| M7 — Dual-Mode UX & Full Rehearsal | Instructor vs Student Practice mode, pop-out Speaker Notes, schema drawer, query history, challenge auto-verification, and end-to-end `tests/verify-all.mjs` verification | [x] Complete |

---

## Architecture Notes

- **Databases isolated inside `mariadb:11.4`:**
  - `college_demo` — Read-only Unit 1 seed (`students`, `courses`, `enrollments`, `student_course_summary`)
  - `classroom_practice` — Unit 1 editable sandbox (`lab_students`, student-created `lab_courses`)
  - `sql_lab` — Unit 2 SQL dataset (`students`, `courses`, `enrollments`, `payments`, `student_edits`, `lesson_state`)
  - `security_lab` — Unit 3 security & SQLi dataset (`portal_users`, `course_records`)
  - `perf_lab` — Unit 4 25,000-row indexing & `EXPLAIN` dataset (`activity_events`)
  - `ops_lab` — Unit 4 concurrent dual-session locking & deadlock dataset (`accounts`)
  - `backup_lab` — Unit 4 live `mariadb-dump` / disaster / restore dataset (`fee_ledger`)
- **Enterprise Tool Notes:**
  - MariaDB Community `11.4` ships `server_audit.so` so audit logging is configured and inspected live alongside documented MariaDB Enterprise Audit deltas.
  - Because MariaDB Enterprise Monitor is proprietary/commercial, Unit 4 teaches its concepts explicitly while providing a built-in **Live Activity Monitor** powered by `SHOW GLOBAL STATUS`, `INNODB_TRX`, `information_schema.INNODB_LOCKS`, and `events_statements_summary_by_digest`.

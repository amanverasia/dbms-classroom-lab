# DBMS Classroom Lab

A projector-friendly teaching environment for the first DBMS lecture. The visual teacher console, MariaDB server, and database UI all run in Docker containers. Nothing is installed directly on the host machine.

The long-term plan is a section-by-section teacher console for all four units. See [roadmap.md](roadmap.md) for the detailed Unit 1 plan, later units and development milestones.

The current console SQL editor is a limited browser simulation with its own demo data; use Adminer to execute real MariaDB SQL. Reset data affects only the browser simulation. Connecting the console directly to MariaDB is a planned milestone.

## Start the complete lab

1. Start Docker Desktop.
2. Double-click `start.command` in this folder.
3. Visit:

- Teacher console: <http://localhost:8080>
- Real database UI: <http://localhost:8081>

The first launch may take a few minutes while Docker downloads the MariaDB, Adminer, and Nginx images. Later launches are much faster. Use the left navigation or arrow keys in the teacher console. Click **Present** for a clean projector view.

You can also start it from a terminal opened in this folder:

```console
docker compose up -d
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

If you want to erase the demo database and recreate the original seed data:

```console
docker compose down -v
docker compose up -d
```

## Suggested 45–60 minute flow

1. **Why a DBMS?** Ask students what breaks when a college stores everything in one spreadsheet.
2. **Tables & keys.** Point to a row, a column, the primary key, and the foreign key.
3. **Run SQL.** Ask students to predict each result before clicking a preset.
4. **Relationships.** Click a course and show how `course_id` connects students to courses.
5. **Security teaser.** Ask whether a website should connect as `root`.
6. Open Adminer only after the mental model is clear, then show that the same tables exist in a real MariaDB server.

## Useful live queries

```sql
SHOW TABLES;
DESCRIBE students;
SELECT * FROM students;
SELECT name, age FROM students WHERE age > 20;

SELECT s.name, c.course_name
FROM students s
JOIN courses c ON c.id = s.course_id;
```

The teacher console also supports this insert example:

```sql
INSERT INTO students (name, email, age, course_id)
VALUES ('Arun Das', 'arun@example.com', 21, 101);
```

Use **Reset data** at any time to return the browser demo to its original state.

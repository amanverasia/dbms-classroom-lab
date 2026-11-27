# DBMS Classroom Lab (MSCNS406)

An interactive **Database Management & Security (MSCNS406)** learning console and self-practice lab running a real **MariaDB 11.4** database right on your laptop inside Docker.

Whether this is your first week in college or you are preparing for practical exams, you do **not** need to manually install MySQL/MariaDB, Node, or PHP on your computer—Docker handles everything inside a tidy container that will not clutter your system.

- **All 4 syllabus units (MSCNS406) included:** **30 sections, 157 interactive steps** with architecture, storage, join, and locking diagrams, live SQL execution, and instant challenge auto-checking.
- **Two-fold design:**
  - **Student Practice Mode:** Click **`Student`** in the top bar for guided hints (**`Hint 1 / 2`**), inline **Schema** viewer, **`Recent…`** query history, **`✓ Check my answer`** auto-grading, and **Split SQL Studio** (`S`) across all 10 classroom and catalog databases.
  - **Instructor Mode (Projector):** Clean **Zen Stage** layout, **Floating Dock** (`←`, `SQL Studio`, `Notes`, `Present`, `Next →`), **Curriculum Drawer** (`M`), **`⌘K` Command Palette**, **`Paper` / `Dark`** theme toggle, projector-scaled **`Present`** mode, synced **Pop-out Speaker Notes** window, and 1-click dataset resets.
- **Works everywhere:** Identical setup on **Windows, macOS, and Linux** — works offline after your first launch.

### What You Need Before Starting

- A **Windows (10/11)**, **macOS**, or **Linux** laptop/PC
- About **2–3 GB of free disk space** and **10 minutes** for first-time setup
- Internet connection for the first download (after that, everything runs locally on your laptop)

---

## Step 1 — Install Docker (One-Time Setup)

> **What is Docker?** Docker is a free app that runs this entire classroom lab (web console + real MariaDB database) inside an isolated box on your computer, so you never have to configure database servers by hand.

Pick your operating system below:

### Windows (Windows 10 or Windows 11)

1. Download **Docker Desktop for Windows** from the official page:
   **<https://docs.docker.com/desktop/setup/install/windows-install/>**
   *(Click **Download for Windows — AMD64** on almost all laptops. Only pick ARM64 if your laptop uses a Snapdragon/ARM processor.)*
2. Double-click the downloaded installer file.
3. Keep **"Use WSL 2 instead of Hyper-V"** checked (recommended) and follow the prompts.
4. Click **Close and restart** if Windows asks you to reboot.
5. Open **Docker Desktop** from the Windows Start Menu:
   - Accept the Service Agreement.
   - You can click **Skip** / **Continue without signing in** (no paid account is required).
6. Look at the bottom-left corner of Docker Desktop and wait until it says **`Engine running`** (with a green dot). Keep Docker Desktop open in the background.

### macOS (MacBook / iMac)

1. Check which chip your Mac has: click the **Apple logo (``)** at the top-left of your screen → **About This Mac**:
   - **Apple M1 / M2 / M3 / M4…** → choose **Apple Silicon**
   - **Intel** → choose **Intel Chip**
2. Download the matching **Docker Desktop for Mac** from the official page:
   **<https://docs.docker.com/desktop/setup/install/mac-install/>**
3. Double-click `Docker.dmg`, then drag the **Docker** icon into the **Applications** folder.
4. Open **Docker** from **Applications** (click **Open** if macOS asks for confirmation).
   - You can click **Skip** / **Continue without signing in** if prompted.
5. Wait until the top menu bar icon / bottom-left status shows **`Engine running`**. Keep Docker open in the background.

### Linux (Ubuntu / Debian / Fedora, etc.)

1. Install **Docker Engine** and the **Docker Compose plugin** using the official guide for your distribution:
   **<https://docs.docker.com/engine/install/>** *(or install Docker Desktop for Linux)*.
2. Allow your regular user account to run Docker without typing `sudo` every time:
   ```sh
   sudo usermod -aG docker "$USER"
   ```
3. **Log out and log back in** (or reboot) for the group change to take effect, then make sure the Docker service is started:
   ```sh
   sudo systemctl enable --now docker
   ```

---

## Step 2 — Download This Lab Folder

### Option A — Easiest Way (No Git Required)

1. Scroll up to the top of this GitHub page, click the green **`<> Code`** button, and click **`Download ZIP`**.
2. Go to your **Downloads** folder and **unzip / extract** `dbms-classroom-lab-main.zip`:
   - **Windows:** Right-click the `.zip` file → **Extract All…** → **Extract**. *(Important: always open the extracted regular folder afterwards—do NOT double-click `start.bat` from inside the `.zip` preview window!)*
   - **macOS:** Double-click the `.zip` file to extract the folder.
3. Move the extracted folder somewhere easy to find (for example, `Desktop` or `Documents`).

### Option B — Using Git (Optional)

```console
git clone https://github.com/amanverasia/dbms-classroom-lab.git
cd dbms-classroom-lab
```

---

## Step 3 — Start the Classroom Lab

Make sure **Docker Desktop (or Docker Engine) is already running** before doing this step.

- **Windows:** Open the extracted `dbms-classroom-lab` folder and double-click **`start.bat`**.
  - *If Windows shows "Windows protected your PC":* click **More info** → **Run anyway**.
- **macOS:** Open the extracted `dbms-classroom-lab` folder and double-click **`start.command`**.
  - *If macOS blocks `start.command` or says "Permission denied" (common for downloaded ZIPs):* open the **Terminal** app, type `cd ` (with a space after `cd`), drag the `dbms-classroom-lab` folder onto the Terminal window, press **Return**, and run:
    ```sh
    sh ./start.sh
    ```
- **Linux:** Open a terminal inside the folder and run:
  ```sh
  sh ./start.sh
  ```
- **Manual terminal command (any OS):**
  ```console
  docker compose up -d --build --wait
  ```

> **First-time wait:** The very first launch takes **1–3 minutes** while Docker downloads MariaDB and builds the classroom backend. Every launch after that takes ~10 seconds!

---

## Step 4 — Open the Lab in Your Browser

Once the window prints **`DBMS Classroom Lab (MSCNS406) is ready!`**, open your web browser (Chrome, Edge, Safari, or Firefox) and visit:

- **Classroom Console (Units 1–4):** <http://localhost:8080>
- **Adminer (Visual Database Browser):** <http://localhost:8081>

### First-Time Student Walkthrough

1. Click **`Student`** in the top-right corner of the console (hides instructor-only controls and enables practice features).
2. Move through lessons using **`←`** / **`Next →`** (or your keyboard Left / Right arrow keys).
3. Press **`M`** (or click the top-left breadcrumb) to open the **Curriculum Drawer** and jump to any unit or topic.
4. Press **`S`** (or click **`SQL Studio`** in the bottom dock) to open the live MariaDB editor beside the lesson:
   - Pick any of the **10 classroom and system databases** (`college_demo`, `classroom_practice`, `sql_lab`, `security_lab`, `perf_lab`, `ops_lab`, `backup_lab`, `information_schema`, `performance_schema`, `mysql`) from the dropdown.
   - Open the inline **Schema** drawer to inspect table columns and types, or click **`Recent…`** to reuse previous queries.
5. On hands-on challenge steps, use **`Hint 1 / 2`** if you get stuck and click **`✓ Check my answer`** to auto-verify your SQL directly against MariaDB.
6. Press **`⌘K`** (Mac) or **`Ctrl+K`** (Windows/Linux) anytime to search topics, open the **Exam Cheat Sheet**, launch **Adminer ↗**, toggle **`Dark` / `Paper`** theme, or click **`Reset Current Lab`**.

### Stopping & Restarting Later

- **Closing your browser tab does NOT stop Docker.**
- **To stop the lab cleanly without losing your work:** Open **Docker Desktop → Containers →** click **Stop** on `dbms-classroom-lab` (or run `docker compose down` inside the folder).
- **To start again tomorrow:** Open Docker Desktop and double-click **`start.bat`** / **`start.command`** (or run **`sh ./start.sh`**).
- **Accidentally deleted a table?** Do not worry—press **`⌘K`** (or **`Ctrl+K`**) → **`Reset Current Lab`** (or use **Restore edit copy** / contextual Reset in SQL Studio) to restore fresh sample data in one click.

---

## Step 5 — Connect DBeaver (For Practical Labs & Exams)

If your class or exam uses **DBeaver** alongside the browser console, you can connect DBeaver directly to this same live MariaDB server:

1. Download and install the free **DBeaver Community Edition** from **<https://dbeaver.io/download/>**.
2. Make sure this Docker lab is already running (`start.bat` / `start.command` / `sh ./start.sh`).
3. Open **DBeaver** → click the **New Database Connection** icon (plug with a `+` sign, top-left) → select **MariaDB** → click **Next**.
4. Fill in the connection settings from the table below *(or click **`DBeaver`** in the console top bar for 1-click **Copy** buttons, the TLS `dbms-classroom-ca.pem` certificate, and downloadable `.sql` practice worksheets stored in [`web/worksheets/`](web/worksheets/))*:

   | Setting | Value |
   |---|---|
   | **Driver** | `MariaDB` |
   | **Server Host** | `127.0.0.1` |
   | **Port** | `3307` *(or your `DB_PORT` from `.env`)* |
   | **Database** | `sql_lab` *(or any classroom database)* |
   | **Units 1–2 User / Password** | `classroom_console` / `console-local-demo` |
   | **Units 3–4 Admin User / Password** | `dba_lab` / `dba-local-demo` |
   | **TLS Lab User / Password** | `tls_user` / `tls-local-demo` *(import `dbms-classroom-ca.pem` in SSL tab)* |

5. Click **Test Connection** at the bottom-left.
   - If DBeaver prompts **"Download Driver Files"**, click **Download**.
   - Once **Connected** appears, click **OK** → **Finish**.

### Adminer Login Credentials (Optional Web DB UI at <http://localhost:8081>)

| Field | Value |
|---|---|
| **System** | `MySQL` |
| **Server** | `mariadb` |
| **Username** | `root` |
| **Password** | `classroom-root` |
| **Database** | `college_demo` |

---

## Common Issues & Quick Fixes

| Problem | What to do |
|---|---|
| **"Docker is not running" / daemon error** | Open **Docker Desktop**, wait until the bottom-left says **`Engine running`**, then run `start.bat` / `start.command` / `sh ./start.sh` again. |
| **Windows asks about WSL 2 or Virtualization** | Open PowerShell as Administrator, run `wsl --install`, and restart your PC. If Docker still reports virtualization disabled, enable **Intel VT-x** / **AMD-V (SVM)** in BIOS/UEFI settings. |
| **macOS blocks `start.command` or says "Permission denied"** | This happens because macOS flags downloaded `.zip` files. Open **Terminal**, `cd` into the unzipped folder, and run `sh ./start.sh` instead (or right-click `start.command` → **Open**). |
| **Port `8080`, `8081`, or `3307` is already in use** | Copy `.env.example` to `.env`, change `CONSOLE_PORT`, `ADMINER_PORT`, or `DB_PORT` (for example `CONSOLE_PORT=8090`), save, and run the launcher again. |
| **Browser says "This site can't be reached"** | Wait until the terminal/command window finishes and prints **`DBMS Classroom Lab (MSCNS406) is ready!`**, then refresh `http://localhost:8080`. |
| **I messed up a table or forgot where `DROP` ran** | Press **`⌘K`** (or **`Ctrl+K`**) in the console → **`Reset Current Lab`**. All sample data and accounts restore cleanly without reinstalling Docker. |

---

## For Instructors (Classroom Teaching Mode)

- Leave the top-bar toggle on **`Instructor`** (default); switch themes anytime between **`Paper`** and **`Dark`**.
- Click **`Notes → Pop out speaker window ↗`** onto your laptop screen, then click **`Present`** in the floating dock so teacher notes never show on the classroom projector.
- Navigate via **`←` / `Next →`**, open the **Curriculum Drawer** (`M`), toggle **Split SQL Studio** (`S`) across all 10 unit and system-catalog databases, or use **`⌘K`** for instant search, **Exam Cheat Sheet**, **Open Adminer ↗**, and **Reset Current Lab** between sections.

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

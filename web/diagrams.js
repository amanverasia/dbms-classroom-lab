/* Interactive theme-matched SVG diagrams for conceptual and internal DBMS architecture lessons. */
window.CLASSROOM_DIAGRAMS = {
  'three-schema': {
    caption: 'ANSI-SPARC Three-Schema Architecture & Data Independence Mappings — click any node to inspect',
    defaultNode: 'ext-map',
    svg: `
      <svg viewBox="0 0 760 404" class="diagram-svg" role="img" aria-label="Three-Schema Architecture and Mappings">
        <defs>
          <marker id="arrow-ink" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" class="diag-marker-muted"/>
          </marker>
          <marker id="arrow-accent" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" class="diag-marker-accent"/>
          </marker>
        </defs>
        <g class="diag-node" data-node="external" tabindex="0">
          <rect x="35" y="18" width="215" height="62" rx="4" class="diag-box"/>
          <text x="142" y="44" class="diag-title">External View 1</text>
          <text x="142" y="64" class="diag-sub">Teacher Roster (name, course)</text>
          <rect x="272" y="18" width="215" height="62" rx="4" class="diag-box"/>
          <text x="380" y="44" class="diag-title">External View 2</text>
          <text x="380" y="64" class="diag-sub">Accounts (student_id, fee)</text>
          <rect x="510" y="18" width="215" height="62" rx="4" class="diag-box"/>
          <text x="617" y="44" class="diag-title">External View 3</text>
          <text x="617" y="64" class="diag-sub">Student Self-Service Portal</text>
        </g>
        <line x1="142" y1="80" x2="256" y2="112" class="diag-arrow-accent" marker-end="url(#arrow-accent)"/>
        <line x1="380" y1="80" x2="380" y2="112" class="diag-arrow-accent" marker-end="url(#arrow-accent)"/>
        <line x1="617" y1="80" x2="504" y2="112" class="diag-arrow-accent" marker-end="url(#arrow-accent)"/>
        <g class="diag-node" data-node="ext-map" tabindex="0">
          <rect x="95" y="114" width="570" height="46" rx="4" class="diag-box-accent"/>
          <text x="380" y="133" class="diag-title-accent">External – Conceptual Mapping</text>
          <text x="380" y="150" class="diag-sub-accent">Shields views from logical table splits → Logical Data Independence</text>
        </g>
        <line x1="380" y1="160" x2="380" y2="188" class="diag-arrow" marker-end="url(#arrow-ink)"/>
        <g class="diag-node" data-node="conceptual" tabindex="0">
          <rect x="35" y="190" width="690" height="62" rx="4" class="diag-box"/>
          <text x="380" y="216" class="diag-title">Conceptual Schema (Global Logical Design)</text>
          <text x="380" y="236" class="diag-sub">Tables, columns, types, PK/FK constraints &amp; relationships (students, courses, enrollments)</text>
        </g>
        <line x1="380" y1="252" x2="380" y2="282" class="diag-arrow-accent" marker-end="url(#arrow-accent)"/>
        <g class="diag-node" data-node="int-map" tabindex="0">
          <rect x="95" y="284" width="570" height="46" rx="4" class="diag-box-accent"/>
          <text x="380" y="303" class="diag-title-accent">Conceptual – Internal Mapping</text>
          <text x="380" y="320" class="diag-sub-accent">Shields logical schema from disk/index changes → Physical Data Independence</text>
        </g>
        <line x1="380" y1="330" x2="380" y2="348" class="diag-arrow" marker-end="url(#arrow-ink)"/>
        <g class="diag-node" data-node="internal" tabindex="0">
          <rect x="35" y="348" width="690" height="46" rx="4" class="diag-box"/>
          <text x="380" y="367" class="diag-title">Internal Schema (Physical Storage)</text>
          <text x="380" y="384" class="diag-sub">16 KB InnoDB pages (.ibd), B+Tree indexes, buffer pool, redo/undo logs</text>
        </g>
      </svg>
    `,
    nodes: {
      external: {
        title: 'External Level (User Views)',
        body: 'Tailored subsets or SQL VIEWs exposed to different audiences (teachers, accounts, students). Hides sensitive or irrelevant columns such as fee balances from academic staff.'
      },
      'ext-map': {
        title: 'External–Conceptual Mapping (Logical Data Independence)',
        body: 'Translates requests against a user view into operations on the conceptual tables. If a table is split or a column is added in the conceptual schema, updating this mapping keeps external views working without breaking applications.'
      },
      conceptual: {
        title: 'Conceptual Level (Logical Schema)',
        body: 'Describes the entire database structure for the organization: entities, attributes, domains, keys, and integrity rules—independent of how bytes sit on disk.'
      },
      'int-map': {
        title: 'Conceptual–Internal Mapping (Physical Data Independence)',
        body: 'Maps logical tables and columns to physical files, indexes, and page structures. Adding a secondary index, compressing pages, or moving a tablespace changes this mapping without rewriting SQL queries.'
      },
      internal: {
        title: 'Internal Level (Physical Storage)',
        body: 'Low-level storage implementation inside MariaDB / InnoDB: .ibd tablespace files, 16 KB pages, B+Tree indexes, buffer pool caching, and transaction logs.'
      }
    }
  },
  'dbms-architecture': {
    caption: 'Internal DBMS Architecture: Users → Query Processor → Storage Manager → Disk Storage',
    defaultNode: 'query-processor',
    svg: `
      <svg viewBox="0 0 760 390" class="diagram-svg" role="img" aria-label="DBMS System Architecture Components">
        <defs>
          <marker id="arch-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 1 L 10 5 L 0 9 z" class="diag-marker-muted"/>
          </marker>
        </defs>
        <g class="diag-node" data-node="users" tabindex="0">
          <rect x="35" y="16" width="690" height="58" rx="4" class="diag-box"/>
          <text x="380" y="39" class="diag-title">Database Users &amp; Clients</text>
          <text x="380" y="59" class="diag-sub">Naive Users (Forms) · App Programmers (Code) · Sophisticated Users (SQL/BI) · DBA (Admin Tools)</text>
        </g>
        <line x1="380" y1="74" x2="380" y2="96" class="diag-arrow" marker-end="url(#arch-arrow)"/>
        <g class="diag-node" data-node="query-processor" tabindex="0">
          <rect x="35" y="98" width="690" height="84" rx="4" class="diag-box-accent"/>
          <text x="380" y="120" class="diag-title-accent">Query Processor (Parser · Optimizer · Execution)</text>
          <text x="146" y="154" class="diag-sub-accent">DDL Interpreter</text>
          <text x="380" y="154" class="diag-sub-accent">DML Compiler &amp; Optimizer</text>
          <text x="614" y="154" class="diag-sub-accent">Query Evaluation Engine</text>
          <line x1="258" y1="132" x2="258" y2="170" class="diag-divider"/>
          <line x1="502" y1="132" x2="502" y2="170" class="diag-divider"/>
        </g>
        <line x1="380" y1="182" x2="380" y2="204" class="diag-arrow" marker-end="url(#arch-arrow)"/>
        <g class="diag-node" data-node="storage-manager" tabindex="0">
          <rect x="35" y="206" width="690" height="86" rx="4" class="diag-box"/>
          <text x="380" y="229" class="diag-title">Storage Manager (Integrity · Concurrency · Memory)</text>
          <text x="125" y="261" class="diag-sub">Auth &amp; Integrity</text>
          <text x="305" y="261" class="diag-sub">Transaction Manager</text>
          <text x="475" y="261" class="diag-sub">File Manager</text>
          <text x="640" y="261" class="diag-sub">Buffer Manager</text>
          <line x1="215" y1="242" x2="215" y2="278" class="diag-divider"/>
          <line x1="395" y1="242" x2="395" y2="278" class="diag-divider"/>
          <line x1="555" y1="242" x2="555" y2="278" class="diag-divider"/>
        </g>
        <line x1="380" y1="292" x2="380" y2="314" class="diag-arrow" marker-end="url(#arch-arrow)"/>
        <g class="diag-node" data-node="disk-storage" tabindex="0">
          <rect x="35" y="316" width="690" height="60" rx="4" class="diag-box"/>
          <text x="380" y="339" class="diag-title">Disk Storage</text>
          <text x="380" y="359" class="diag-sub">Data Files (.ibd / ibdata1) · Data Dictionary (Metadata) · B+Tree Indices · Transaction Logs</text>
        </g>
      </svg>
    `,
    nodes: {
      users: {
        title: 'Database Users & Interfaces',
        body: 'Different user categories interact through tailored interfaces: naive users use web/mobile forms, programmers embed SQL via drivers, analysts run ad-hoc SQL, and DBAs manage server configuration, privileges, and backups.'
      },
      'query-processor': {
        title: 'Query Processor',
        body: 'Interprets DDL statements into Data Dictionary metadata, compiles and optimizes DML/SELECT queries into low-cost execution plans, and executes plan steps via the evaluation engine.'
      },
      'storage-manager': {
        title: 'Storage Manager',
        body: 'Bridges logical execution plans and raw disk blocks: enforces privileges and constraints, coordinates ACID transactions and locks, manages OS file space, and caches hot pages in the buffer pool.'
      },
      'disk-storage': {
        title: 'Disk Storage',
        body: 'Persistent structures on disk: row/table data files, system catalog metadata (Data Dictionary), secondary index structures, and redo/undo/binary logs for durability.'
      }
    }
  },
  'join-types': {
    caption: 'SQL Join Types Compared — click any join strategy to inspect how matched and unmatched rows behave',
    defaultNode: 'left',
    svg: `
      <svg viewBox="0 0 760 270" class="diagram-svg" role="img" aria-label="SQL Join Types Visual Comparison">
        <g class="diag-node" data-node="inner" tabindex="0">
          <rect x="20" y="16" width="225" height="108" rx="4" class="diag-box"/>
          <circle cx="114" cy="60" r="24" class="diag-circle-a"/>
          <circle cx="148" cy="60" r="24" class="diag-circle-b"/>
          <path d="M 131 43.1 A 24 24 0 0 0 131 76.9 A 24 24 0 0 0 131 43.1 Z" class="diag-lens"/>
          <text x="132" y="106" class="diag-title">INNER JOIN</text>
        </g>
        <g class="diag-node" data-node="left" tabindex="0">
          <rect x="267" y="16" width="225" height="108" rx="4" class="diag-box-accent"/>
          <circle cx="362" cy="60" r="24" class="diag-circle-a-fill"/>
          <circle cx="396" cy="60" r="24" class="diag-circle-b"/>
          <text x="380" y="106" class="diag-title-accent">LEFT JOIN</text>
        </g>
        <g class="diag-node" data-node="right" tabindex="0">
          <rect x="514" y="16" width="225" height="108" rx="4" class="diag-box"/>
          <circle cx="609" cy="60" r="24" class="diag-circle-a"/>
          <circle cx="643" cy="60" r="24" class="diag-circle-b-fill"/>
          <text x="626" y="106" class="diag-title">RIGHT JOIN</text>
        </g>
        <g class="diag-node" data-node="full" tabindex="0">
          <rect x="20" y="142" width="225" height="108" rx="4" class="diag-box"/>
          <circle cx="114" cy="186" r="24" class="diag-circle-a-fill"/>
          <circle cx="148" cy="186" r="24" class="diag-circle-b-fill"/>
          <text x="132" y="232" class="diag-title">FULL OUTER (UNION)</text>
        </g>
        <g class="diag-node" data-node="cross" tabindex="0">
          <rect x="267" y="142" width="225" height="108" rx="4" class="diag-box"/>
          <text x="380" y="182" class="diag-title">A (6) × B (4) = 24</text>
          <text x="380" y="202" class="diag-sub">Every pair combined</text>
          <text x="380" y="232" class="diag-title">CROSS JOIN</text>
        </g>
        <g class="diag-node" data-node="self" tabindex="0">
          <rect x="514" y="142" width="225" height="108" rx="4" class="diag-box"/>
          <text x="626" y="182" class="diag-title">students s1 ↔ s2</text>
          <text x="626" y="202" class="diag-sub">Different aliases, same table</text>
          <text x="626" y="232" class="diag-title">SELF JOIN</text>
        </g>
      </svg>
    `,
    nodes: {
      inner: {
        title: 'INNER JOIN (Matching Pairs Only)',
        body: 'Returns only rows where the ON condition matches in both tables. Unmatched rows like Meera, Dev, and Cloud Security are excluded.'
      },
      left: {
        title: 'LEFT JOIN (Preserve Left Table)',
        body: 'Keeps every row from the left table even when no right-hand match exists, filling right columns with NULL. Essential for finding missing matches (WHERE right.id IS NULL).'
      },
      right: {
        title: 'RIGHT JOIN (Preserve Right Table)',
        body: 'Mirror of LEFT JOIN: preserves every row from the right table. Most teams standardize on LEFT JOIN for readability, except when matching existing course catalogs on the right.'
      },
      full: {
        title: 'FULL OUTER JOIN (Emulated in MariaDB)',
        body: 'MariaDB does not have a single FULL OUTER JOIN keyword. Emulate it cleanly by combining a LEFT JOIN and a RIGHT JOIN with UNION (eliminating duplicate matched pairs).'
      },
      cross: {
        title: 'CROSS JOIN (Cartesian Product)',
        body: 'Pairs every row of the first table with every row of the second table (no ON clause). Useful for generating test matrices or calendars, dangerous if triggered accidentally.'
      },
      self: {
        title: 'SELF JOIN (Table Joined to Itself)',
        body: 'Joins a table to another alias of itself (e.g., students s1 JOIN students s2 ON s1.city = s2.city AND s1.id < s2.id) to find peers, hierarchies, or manager-employee links.'
      }
    }
  },
  'innodb-storage': {
    caption: 'InnoDB Storage & Logging Internals (RAM Buffers vs Disk Structures) — click any component',
    defaultNode: 'buffer-pool',
    svg: `
      <svg viewBox="0 0 760 360" class="diagram-svg" role="img" aria-label="InnoDB Storage Engine Architecture">
        <text x="380" y="24" class="diag-sub" font-weight="600">MEMORY (RAM) — Volatile High-Speed Buffers</text>
        <g class="diag-node" data-node="buffer-pool" tabindex="0">
          <rect x="35" y="36" width="445" height="96" rx="4" class="diag-box-accent"/>
          <text x="257" y="64" class="diag-title-accent">InnoDB Buffer Pool (128 MB)</text>
          <text x="257" y="86" class="diag-sub-accent">Caches 16 KB Data &amp; B+Tree Index Pages, Change &amp; Dirty Buffers</text>
          <text x="257" y="106" class="diag-sub-accent">Reads/writes happen in RAM first; flushed asynchronously to disk</text>
        </g>
        <g class="diag-node" data-node="log-buffer" tabindex="0">
          <rect x="500" y="36" width="225" height="96" rx="4" class="diag-box"/>
          <text x="612" y="64" class="diag-title">InnoDB Log Buffer (8 MB)</text>
          <text x="612" y="88" class="diag-sub">Buffers redo entries in RAM</text>
          <text x="612" y="108" class="diag-sub">Flushed on COMMIT</text>
        </g>
        <line x1="35" y1="158" x2="725" y2="158" class="diag-divider-accent"/>
        <text x="380" y="178" class="diag-sub" font-weight="600">DISK STORAGE (/var/lib/mysql) — Persistent Tablespaces &amp; Logs</text>
        <g class="diag-node" data-node="ibd-files" tabindex="0">
          <rect x="35" y="194" width="220" height="72" rx="4" class="diag-box"/>
          <text x="145" y="222" class="diag-title">Table Files (*.ibd)</text>
          <text x="145" y="242" class="diag-sub">innodb_file_per_table=ON</text>
          <text x="145" y="256" class="diag-sub">Clustered B+Tree (PK) + Data</text>
        </g>
        <g class="diag-node" data-node="undo-logs" tabindex="0">
          <rect x="270" y="194" width="210" height="72" rx="4" class="diag-box"/>
          <text x="375" y="222" class="diag-title">Undo Logs (ibdata1 / undo)</text>
          <text x="375" y="242" class="diag-sub">ROLLBACK old row versions</text>
          <text x="375" y="256" class="diag-sub">MVCC consistent snapshots</text>
        </g>
        <g class="diag-node" data-node="redo-logs" tabindex="0">
          <rect x="500" y="194" width="225" height="72" rx="4" class="diag-box"/>
          <text x="612" y="222" class="diag-title">Redo Log (ib_logfile0)</text>
          <text x="612" y="242" class="diag-sub">Write-Ahead Logging (WAL)</text>
          <text x="612" y="256" class="diag-sub">Crash recovery durability</text>
        </g>
        <g class="diag-node" data-node="system-ts" tabindex="0">
          <rect x="35" y="280" width="690" height="60" rx="4" class="diag-box"/>
          <text x="380" y="305" class="diag-title">System Tablespace (ibdata1) &amp; Doublewrite Buffer</text>
          <text x="380" y="325" class="diag-sub">Protects against torn 16 KB page writes and holds internal InnoDB dictionary structures</text>
        </g>
      </svg>
    `,
    nodes: {
      'buffer-pool': {
        title: 'InnoDB Buffer Pool (RAM)',
        body: 'The single most important InnoDB memory area. Holds cached 16 KB table and index pages. High hit ratios (>99%) keep queries in RAM instead of hitting disk I/O.'
      },
      'log-buffer': {
        title: 'InnoDB Log Buffer',
        body: 'Small memory buffer storing sequential redo log records before flushing to disk on COMMIT (controlled by innodb_flush_log_at_trx_commit).'
      },
      'ibd-files': {
        title: 'File-Per-Table Tablespaces (*.ibd)',
        body: 'With innodb_file_per_table=ON, each InnoDB table stores its clustered B+Tree primary-key index and row pages in its own .ibd file inside its database folder.'
      },
      'undo-logs': {
        title: 'Undo Logs (Rollback & MVCC)',
        body: 'Stores pre-update images (inside ibdata1 or dedicated undo tablespaces) so transactions can ROLLBACK cleanly and concurrent SELECT readers see consistent point-in-time snapshots.'
      },
      'redo-logs': {
        title: 'Redo Log (Crash Recovery / WAL)',
        body: 'Sequential write-ahead log recording page changes before dirty pages are flushed. If the server crashes, MariaDB replays redo logs on startup to preserve committed transactions (Durability).'
      },
      'system-ts': {
        title: 'System Tablespace (ibdata1) & Doublewrite Buffer',
        body: 'ibdata1 stores system metadata, default undo logs, and the doublewrite buffer, which writes 16 KB pages safely before overwriting their destination in .ibd files.'
      }
    }
  },
  'lock-contention': {
    caption: 'InnoDB Row-Level Blocking vs Deadlock Cycle — click either scenario to inspect',
    defaultNode: 'blocking',
    svg: `
      <svg viewBox="0 0 760 280" class="diagram-svg" role="img" aria-label="Lock Wait vs Deadlock Scenario">
        <defs>
          <marker id="lock-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 1 L 10 5 L 0 9 z" class="diag-marker-danger"/>
          </marker>
        </defs>
        <g class="diag-node" data-node="blocking" tabindex="0">
          <rect x="20" y="20" width="345" height="240" rx="4" class="diag-box-accent"/>
          <text x="192" y="48" class="diag-title-accent">Scenario 1: Linear Lock Wait</text>
          <rect x="45" y="72" width="125" height="52" rx="4" class="diag-inner-box"/>
          <text x="107" y="95" class="diag-title">Session A</text>
          <text x="107" y="113" class="diag-sub">Holds X-Lock Row 1</text>
          <rect x="215" y="72" width="125" height="52" rx="4" class="diag-inner-box"/>
          <text x="277" y="95" class="diag-title">Session B</text>
          <text x="277" y="113" class="diag-sub">Requests Row 1</text>
          <line x1="212" y1="98" x2="174" y2="98" class="diag-arrow-danger" marker-end="url(#lock-arrow)"/>
          <text x="192" y="160" class="diag-sub-accent">Session B pauses (LOCK WAIT)</text>
          <text x="192" y="182" class="diag-sub-accent">until Session A runs COMMIT/ROLLBACK</text>
          <text x="192" y="204" class="diag-sub-accent">or innodb_lock_wait_timeout (15s) expires.</text>
        </g>
        <g class="diag-node" data-node="deadlock" tabindex="0">
          <rect x="395" y="20" width="345" height="240" rx="4" class="diag-box"/>
          <text x="567" y="48" class="diag-title">Scenario 2: Circular Deadlock (1213)</text>
          <rect x="420" y="72" width="125" height="52" rx="4" class="diag-inner-box"/>
          <text x="482" y="95" class="diag-title">Session A</text>
          <text x="482" y="113" class="diag-sub">Holds Row 1</text>
          <rect x="590" y="72" width="125" height="52" rx="4" class="diag-inner-box"/>
          <text x="652" y="95" class="diag-title">Session B</text>
          <text x="652" y="113" class="diag-sub">Holds Row 2</text>
          <path d="M 548 86 L 587 86" class="diag-arrow-danger" marker-end="url(#lock-arrow)"/>
          <path d="M 587 112 L 548 112" class="diag-arrow-danger" marker-end="url(#lock-arrow)"/>
          <text x="567" y="160" class="diag-sub">A waits for Row 2 · B waits for Row 1</text>
          <text x="567" y="182" class="diag-sub">Neither can ever finish!</text>
          <text x="567" y="204" class="diag-sub">InnoDB immediately aborts one victim (Error 1213).</text>
        </g>
      </svg>
    `,
    nodes: {
      blocking: {
        title: 'Row-Level Lock Wait (Troubleshooting Blocked Transactions)',
        body: 'When Session A modifies a row inside an uncommitted transaction, InnoDB grants it an exclusive (X) row lock. Any other session updating that same row enters LOCK WAIT. DBAs spot the blocker via SHOW FULL PROCESSLIST, INFORMATION_SCHEMA.INNODB_TRX, and INFORMATION_SCHEMA.INNODB_LOCKS.'
      },
      deadlock: {
        title: 'Circular Deadlock (Error 1213)',
        body: 'When two transactions acquire locks in opposite order (A locks 1 then wants 2; B locks 2 then wants 1), waiting forever would freeze both. InnoDB detects the cycle immediately, rolls back the smaller transaction with Error 1213, and lets the other proceed.'
      }
    }
  },
  'sql-execution-order': {
    caption: 'SQL Written Order vs Logical Execution Order — click any execution stage to inspect its rules',
    defaultNode: 'where',
    svg: `
      <svg viewBox="0 0 760 330" class="diagram-svg" role="img" aria-label="SQL Logical Execution Order">
        <text x="155" y="24" class="diag-sub" font-weight="600">WRITTEN ORDER (Syntax)</text>
        <text x="525" y="24" class="diag-sub" font-weight="600">LOGICAL EXECUTION ORDER (Click a stage)</text>
        <rect x="20" y="42" width="270" height="260" rx="4" class="diag-box"/>
        <text x="38" y="76" class="diag-code-line">1. SELECT  [DISTINCT] cols</text>
        <text x="38" y="108" class="diag-code-line">2. FROM    tables + JOIN ON</text>
        <text x="38" y="140" class="diag-code-line">3. WHERE   row_condition</text>
        <text x="38" y="172" class="diag-code-line">4. GROUP BY grouping_cols</text>
        <text x="38" y="204" class="diag-code-line">5. HAVING  group_condition</text>
        <text x="38" y="236" class="diag-code-line">6. ORDER BY sort_cols</text>
        <text x="38" y="268" class="diag-code-line">7. LIMIT   row_count</text>
        <g class="diag-node" data-node="from" tabindex="0">
          <rect x="310" y="42" width="210" height="54" rx="4" class="diag-box"/>
          <text x="415" y="65" class="diag-title">1. FROM / JOIN</text>
          <text x="415" y="83" class="diag-sub">Combine &amp; match tables</text>
        </g>
        <g class="diag-node" data-node="where" tabindex="0">
          <rect x="535" y="42" width="210" height="54" rx="4" class="diag-box-accent"/>
          <text x="640" y="65" class="diag-title-accent">2. WHERE</text>
          <text x="640" y="83" class="diag-sub-accent">Filter individual rows</text>
        </g>
        <g class="diag-node" data-node="groupby" tabindex="0">
          <rect x="310" y="110" width="210" height="54" rx="4" class="diag-box"/>
          <text x="415" y="133" class="diag-title">3. GROUP BY</text>
          <text x="415" y="151" class="diag-sub">Form groups &amp; aggregates</text>
        </g>
        <g class="diag-node" data-node="having" tabindex="0">
          <rect x="535" y="110" width="210" height="54" rx="4" class="diag-box-accent"/>
          <text x="640" y="133" class="diag-title-accent">4. HAVING</text>
          <text x="640" y="151" class="diag-sub-accent">Filter whole groups</text>
        </g>
        <g class="diag-node" data-node="select" tabindex="0">
          <rect x="310" y="178" width="210" height="54" rx="4" class="diag-box"/>
          <text x="415" y="201" class="diag-title">5. SELECT / DISTINCT</text>
          <text x="415" y="219" class="diag-sub">Project &amp; deduplicate</text>
        </g>
        <g class="diag-node" data-node="orderby" tabindex="0">
          <rect x="535" y="178" width="210" height="54" rx="4" class="diag-box"/>
          <text x="640" y="201" class="diag-title">6. ORDER BY</text>
          <text x="640" y="219" class="diag-sub">Sort final result rows</text>
        </g>
        <g class="diag-node" data-node="limit" tabindex="0">
          <rect x="310" y="246" width="435" height="54" rx="4" class="diag-box"/>
          <text x="527" y="269" class="diag-title">7. LIMIT / OFFSET</text>
          <text x="527" y="287" class="diag-sub">Slice final sorted output rows</text>
        </g>
      </svg>
    `,
    nodes: {
      from: {
        title: 'Stage 1: FROM & JOIN (+ ON)',
        body: 'MariaDB gathers rows from base tables and matches JOIN conditions. Because ON runs here, placing outer-join filters in ON keeps NULL-padded rows, whereas WHERE runs next and drops them.'
      },
      where: {
        title: 'Stage 2: WHERE (Row-Level Filter)',
        body: 'Filters individual source rows BEFORE grouping or SELECT aliases exist. That is why WHERE cannot use aggregate functions (like SUM or COUNT) and cannot reference a column alias defined later in SELECT.'
      },
      groupby: {
        title: 'Stage 3: GROUP BY',
        body: 'Buckets surviving rows into one group per distinct grouping key (including a single bucket for NULL) and evaluates aggregates like COUNT, SUM, AVG, MIN, MAX.'
      },
      having: {
        title: 'Stage 4: HAVING (Group-Level Filter)',
        body: 'Filters entire groups AFTER aggregation. Use HAVING for conditions on aggregates (HAVING COUNT(*) >= 2), while keeping non-aggregate row filters in WHERE for better performance.'
      },
      select: {
        title: 'Stage 5: SELECT Expressions & DISTINCT',
        body: 'Evaluates expressions (CASE, COALESCE, arithmetic) and assigns column aliases, then removes duplicate output rows if DISTINCT is present.'
      },
      orderby: {
        title: 'Stage 6: ORDER BY',
        body: 'Sorts the computed result rows. Because SELECT already ran in Stage 5, ORDER BY CAN legally reference SELECT aliases (unlike WHERE).'
      },
      limit: {
        title: 'Stage 7: LIMIT',
        body: 'Slices the first N rows after sorting. Without ORDER BY, LIMIT picks arbitrary storage-order rows; always pair LIMIT with a deterministic ORDER BY tie-breaker.'
      }
    }
  },
  'set-operations': {
    caption: 'SQL Set Operations Compared — click UNION, UNION ALL, INTERSECT, or EXCEPT',
    defaultNode: 'intersect',
    svg: `
      <svg viewBox="0 0 760 288" class="diagram-svg" role="img" aria-label="SQL Set Operations Comparison">
        <defs>
          <mask id="except-mask">
            <rect x="575" y="18" width="165" height="175" fill="white"/>
            <circle cx="675" cy="82" r="28" fill="black"/>
          </mask>
        </defs>
        <g class="diag-node" data-node="union" tabindex="0">
          <rect x="20" y="18" width="170" height="175" rx="4" class="diag-box"/>
          <circle cx="88" cy="82" r="28" class="diag-circle-a-fill"/>
          <circle cx="122" cy="82" r="28" class="diag-circle-a-fill"/>
          <text x="105" y="142" class="diag-title">UNION</text>
          <text x="105" y="162" class="diag-sub">A ∪ B (Deduplicated)</text>
        </g>
        <g class="diag-node" data-node="union-all" tabindex="0">
          <rect x="205" y="18" width="170" height="175" rx="4" class="diag-box"/>
          <circle cx="273" cy="82" r="28" class="diag-circle-a-fill"/>
          <circle cx="307" cy="82" r="28" class="diag-circle-b-fill"/>
          <text x="290" y="142" class="diag-title">UNION ALL</text>
          <text x="290" y="162" class="diag-sub">A + B (Keeps duplicates)</text>
        </g>
        <g class="diag-node" data-node="intersect" tabindex="0">
          <rect x="390" y="18" width="170" height="175" rx="4" class="diag-box-accent"/>
          <circle cx="458" cy="82" r="28" class="diag-circle-a"/>
          <circle cx="492" cy="82" r="28" class="diag-circle-b"/>
          <path d="M 475 59.8 A 28 28 0 0 0 475 104.2 A 28 28 0 0 0 475 59.8 Z" class="diag-lens"/>
          <text x="475" y="142" class="diag-title-accent">INTERSECT</text>
          <text x="475" y="162" class="diag-sub-accent">A ∩ B (Common rows)</text>
        </g>
        <g class="diag-node" data-node="except" tabindex="0">
          <rect x="575" y="18" width="165" height="175" rx="4" class="diag-box"/>
          <circle cx="641" cy="82" r="28" class="diag-circle-a-fill" mask="url(#except-mask)"/>
          <circle cx="641" cy="82" r="28" class="diag-circle-a"/>
          <circle cx="675" cy="82" r="28" class="diag-circle-b"/>
          <text x="657" y="142" class="diag-title">EXCEPT</text>
          <text x="657" y="162" class="diag-sub">A − B (In A, not B)</text>
        </g>
        <rect x="20" y="206" width="720" height="66" rx="4" class="diag-box"/>
        <text x="380" y="227" class="diag-title">Union-Compatibility Rules</text>
        <text x="380" y="246" class="diag-sub">1. Same number of SELECT columns   ·   2. Compatible column types in order</text>
        <text x="380" y="262" class="diag-sub">3. Output column names come from first SELECT; place ORDER BY at the very end</text>
      </svg>
    `,
    nodes: {
      union: {
        title: 'UNION (Combined & Deduplicated)',
        body: 'Stacks rows from Query A and Query B vertically and sorts/hashes to remove exact duplicate rows. Great for combining distinct results or emulating FULL OUTER JOIN.'
      },
      'union-all': {
        title: 'UNION ALL (Combined, Duplicates Preserved)',
        body: 'Stacks all rows from Query A and Query B without deduplication overhead. Always prefer UNION ALL when duplicates are impossible or should be preserved—it is noticeably faster.'
      },
      intersect: {
        title: 'INTERSECT (Rows in Both Sets)',
        body: 'Returns distinct rows present in BOTH Query A and Query B (for example, students present in enrollments AND payments). MariaDB 10.3+ supports INTERSECT natively.'
      },
      except: {
        title: 'EXCEPT (Set Difference: A minus B)',
        body: 'Returns distinct rows present in Query A that do NOT appear in Query B (for example, all students minus students who made a payment = unpaid students).'
      }
    }
  }
};

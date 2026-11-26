/* Interactive theme-matched SVG diagrams for conceptual and internal DBMS architecture lessons. */
window.CLASSROOM_DIAGRAMS = {
  'three-schema': {
    caption: 'ANSI-SPARC Three-Schema Architecture & Data Independence Mappings — click any node to inspect',
    defaultNode: 'ext-map',
    viewBox: '0 0 760 400',
    svg: `
      <svg viewBox="0 0 760 400" class="diagram-svg" role="img" aria-label="Three-Schema Architecture and Mappings">
        <defs>
          <marker id="arrow-ink" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#66675e"/>
          </marker>
          <marker id="arrow-accent" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#8b4b32"/>
          </marker>
        </defs>
        <g class="diag-node" data-node="external" tabindex="0">
          <rect x="40" y="18" width="205" height="62" rx="4" class="diag-box"/>
          <text x="142" y="44" class="diag-title">External View 1</text>
          <text x="142" y="64" class="diag-sub">Teacher Roster (name, course)</text>
          <rect x="278" y="18" width="205" height="62" rx="4" class="diag-box"/>
          <text x="380" y="44" class="diag-title">External View 2</text>
          <text x="380" y="64" class="diag-sub">Accounts Ledger (student_id, fee)</text>
          <rect x="515" y="18" width="205" height="62" rx="4" class="diag-box"/>
          <text x="617" y="44" class="diag-title">External View 3</text>
          <text x="617" y="64" class="diag-sub">Student Self-Service Portal</text>
        </g>
        <line x1="142" y1="80" x2="260" y2="112" stroke="#8b4b32" stroke-width="1.5" marker-end="url(#arrow-accent)"/>
        <line x1="380" y1="80" x2="380" y2="112" stroke="#8b4b32" stroke-width="1.5" marker-end="url(#arrow-accent)"/>
        <line x1="617" y1="80" x2="500" y2="112" stroke="#8b4b32" stroke-width="1.5" marker-end="url(#arrow-accent)"/>
        <g class="diag-node" data-node="ext-map" tabindex="0">
          <rect x="170" y="114" width="420" height="44" rx="4" class="diag-box-accent"/>
          <text x="380" y="133" class="diag-title-accent">External – Conceptual Mapping</text>
          <text x="380" y="149" class="diag-sub-accent">Shields views from logical table splits → Logical Data Independence</text>
        </g>
        <line x1="380" y1="158" x2="380" y2="188" stroke="#66675e" stroke-width="1.5" marker-end="url(#arrow-ink)"/>
        <g class="diag-node" data-node="conceptual" tabindex="0">
          <rect x="90" y="190" width="580" height="62" rx="4" class="diag-box"/>
          <text x="380" y="216" class="diag-title">Conceptual Schema (Global Logical Design)</text>
          <text x="380" y="236" class="diag-sub">Tables, columns, data types, PK/FK constraints, relationships (students, courses, enrollments)</text>
        </g>
        <line x1="380" y1="252" x2="380" y2="282" stroke="#8b4b32" stroke-width="1.5" marker-end="url(#arrow-accent)"/>
        <g class="diag-node" data-node="int-map" tabindex="0">
          <rect x="170" y="284" width="420" height="44" rx="4" class="diag-box-accent"/>
          <text x="380" y="303" class="diag-title-accent">Conceptual – Internal Mapping</text>
          <text x="380" y="319" class="diag-sub-accent">Shields logical schema from disk & index changes → Physical Data Independence</text>
        </g>
        <line x1="380" y1="328" x2="380" y2="346" stroke="#66675e" stroke-width="1.5" marker-end="url(#arrow-ink)"/>
        <g class="diag-node" data-node="internal" tabindex="0">
          <rect x="90" y="346" width="580" height="46" rx="4" class="diag-box"/>
          <text x="380" y="366" class="diag-title">Internal Schema (Physical Storage)</text>
          <text x="380" y="382" class="diag-sub">16 KB InnoDB pages (.ibd), B+Tree indexes, buffer pool, redo/undo logs</text>
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
    viewBox: '0 0 760 390',
    svg: `
      <svg viewBox="0 0 760 390" class="diagram-svg" role="img" aria-label="DBMS System Architecture Components">
        <defs>
          <marker id="arch-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#66675e"/>
          </marker>
        </defs>
        <g class="diag-node" data-node="users" tabindex="0">
          <rect x="35" y="16" width="690" height="58" rx="4" class="diag-box"/>
          <text x="380" y="39" class="diag-title">Database Users &amp; Clients</text>
          <text x="380" y="59" class="diag-sub">Naive Users (Forms) · App Programmers (Code) · Sophisticated Users (SQL/BI) · DBA (Admin Tools)</text>
        </g>
        <line x1="380" y1="74" x2="380" y2="96" stroke="#66675e" stroke-width="1.5" marker-end="url(#arch-arrow)"/>
        <g class="diag-node" data-node="query-processor" tabindex="0">
          <rect x="35" y="98" width="690" height="84" rx="4" class="diag-box-accent"/>
          <text x="380" y="120" class="diag-title-accent">Query Processor (Parser · Optimizer · Execution)</text>
          <text x="155" y="152" class="diag-sub">DDL Interpreter</text>
          <text x="380" y="152" class="diag-sub">DML Compiler &amp; Optimizer</text>
          <text x="605" y="152" class="diag-sub">Query Evaluation Engine</text>
          <line x1="258" y1="132" x2="258" y2="170" stroke="#d8d5cb" stroke-width="1"/>
          <line x1="502" y1="132" x2="502" y2="170" stroke="#d8d5cb" stroke-width="1"/>
        </g>
        <line x1="380" y1="182" x2="380" y2="204" stroke="#66675e" stroke-width="1.5" marker-end="url(#arch-arrow)"/>
        <g class="diag-node" data-node="storage-manager" tabindex="0">
          <rect x="35" y="206" width="690" height="86" rx="4" class="diag-box"/>
          <text x="380" y="229" class="diag-title">Storage Manager (Integrity · Concurrency · Memory)</text>
          <text x="128" y="261" class="diag-sub">Authorization &amp; Integrity</text>
          <text x="305" y="261" class="diag-sub">Transaction Manager</text>
          <text x="475" y="261" class="diag-sub">File Manager</text>
          <text x="632" y="261" class="diag-sub">Buffer Manager</text>
          <line x1="215" y1="242" x2="215" y2="278" stroke="#e2dfd4" stroke-width="1"/>
          <line x1="395" y1="242" x2="395" y2="278" stroke="#e2dfd4" stroke-width="1"/>
          <line x1="555" y1="242" x2="555" y2="278" stroke="#e2dfd4" stroke-width="1"/>
        </g>
        <line x1="380" y1="292" x2="380" y2="314" stroke="#66675e" stroke-width="1.5" marker-end="url(#arch-arrow)"/>
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
    viewBox: '0 0 760 270',
    svg: `
      <svg viewBox="0 0 760 270" class="diagram-svg" role="img" aria-label="SQL Join Types Visual Comparison">
        <g class="diag-node" data-node="inner" tabindex="0">
          <rect x="20" y="16" width="225" height="108" rx="4" class="diag-box"/>
          <circle cx="105" cy="60" r="24" fill="none" stroke="#8b4b32" stroke-width="2"/>
          <circle cx="155" cy="60" r="24" fill="none" stroke="#3f6048" stroke-width="2"/>
          <path d="M 130 42 A 24 24 0 0 1 130 78 A 24 24 0 0 1 130 42" fill="#8b4b32" fill-opacity="0.35"/>
          <text x="132" y="106" class="diag-title">INNER JOIN</text>
        </g>
        <g class="diag-node" data-node="left" tabindex="0">
          <rect x="267" y="16" width="225" height="108" rx="4" class="diag-box-accent"/>
          <circle cx="352" cy="60" r="24" fill="#8b4b32" fill-opacity="0.28" stroke="#8b4b32" stroke-width="2"/>
          <circle cx="402" cy="60" r="24" fill="none" stroke="#3f6048" stroke-width="2"/>
          <text x="380" y="106" class="diag-title-accent">LEFT JOIN</text>
        </g>
        <g class="diag-node" data-node="right" tabindex="0">
          <rect x="514" y="16" width="225" height="108" rx="4" class="diag-box"/>
          <circle cx="599" cy="60" r="24" fill="none" stroke="#8b4b32" stroke-width="2"/>
          <circle cx="649" cy="60" r="24" fill="#3f6048" fill-opacity="0.28" stroke="#3f6048" stroke-width="2"/>
          <text x="626" y="106" class="diag-title">RIGHT JOIN</text>
        </g>
        <g class="diag-node" data-node="full" tabindex="0">
          <rect x="20" y="142" width="225" height="108" rx="4" class="diag-box"/>
          <circle cx="105" cy="186" r="24" fill="#8b4b32" fill-opacity="0.24" stroke="#8b4b32" stroke-width="2"/>
          <circle cx="155" cy="186" r="24" fill="#3f6048" fill-opacity="0.24" stroke="#3f6048" stroke-width="2"/>
          <text x="132" y="232" class="diag-title">FULL OUTER (UNION)</text>
        </g>
        <g class="diag-node" data-node="cross" tabindex="0">
          <rect x="267" y="142" width="225" height="108" rx="4" class="diag-box"/>
          <text x="380" y="182" class="diag-title">A (4) × B (6) = 24</text>
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
    viewBox: '0 0 760 360',
    svg: `
      <svg viewBox="0 0 760 360" class="diagram-svg" role="img" aria-label="InnoDB Storage Engine Architecture">
        <text x="380" y="24" class="diag-sub" font-weight="600">MEMORY (RAM) — Volatile High-Speed Buffers</text>
        <g class="diag-node" data-node="buffer-pool" tabindex="0">
          <rect x="35" y="36" width="445" height="96" rx="4" class="diag-box-accent"/>
          <text x="257" y="64" class="diag-title-accent">InnoDB Buffer Pool (128 MB)</text>
          <text x="257" y="86" class="diag-sub-accent">Caches 16 KB Data Pages, B+Tree Index Pages, Change Buffer &amp; Dirty Pages</text>
          <text x="257" y="106" class="diag-sub-accent">Reads/writes happen in RAM first; flushed asynchronously to disk</text>
        </g>
        <g class="diag-node" data-node="log-buffer" tabindex="0">
          <rect x="500" y="36" width="225" height="96" rx="4" class="diag-box"/>
          <text x="612" y="64" class="diag-title">InnoDB Log Buffer (8 MB)</text>
          <text x="612" y="88" class="diag-sub">Buffers redo entries in RAM</text>
          <text x="612" y="108" class="diag-sub">Flushed on COMMIT</text>
        </g>
        <line x1="35" y1="158" x2="725" y2="158" stroke="#8b4b32" stroke-dasharray="6 4" stroke-width="1.5"/>
        <text x="380" y="178" class="diag-sub" font-weight="600">DISK STORAGE (/var/lib/mysql) — Persistent Tablespaces &amp; Logs</text>
        <g class="diag-node" data-node="ibd-files" tabindex="0">
          <rect x="35" y="194" width="220" height="72" rx="4" class="diag-box"/>
          <text x="145" y="222" class="diag-title">Table Files (*.ibd)</text>
          <text x="145" y="242" class="diag-sub">innodb_file_per_table=ON</text>
          <text x="145" y="256" class="diag-sub">Clustered B+Tree (PK) + Data</text>
        </g>
        <g class="diag-node" data-node="undo-logs" tabindex="0">
          <rect x="270" y="194" width="210" height="72" rx="4" class="diag-box"/>
          <text x="375" y="222" class="diag-title">Undo Logs (undo00*)</text>
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
        body: 'Stores pre-update images of modified rows so transactions can ROLLBACK cleanly and concurrent SELECT readers see consistent point-in-time snapshots without blocking writers.'
      },
      'redo-logs': {
        title: 'Redo Log (Crash Recovery / WAL)',
        body: 'Sequential write-ahead log recording page changes before dirty pages are flushed. If the server crashes, MariaDB replays redo logs on startup to preserve committed transactions (Durability).'
      },
      'system-ts': {
        title: 'System Tablespace (ibdata1) & Doublewrite Buffer',
        body: 'ibdata1 stores system metadata and the doublewrite buffer, which writes 16 KB pages safely before overwriting their destination in .ibd files to survive partial power-loss page tears.'
      }
    }
  },
  'lock-contention': {
    caption: 'InnoDB Row-Level Blocking vs Deadlock Cycle — click either scenario to inspect',
    defaultNode: 'blocking',
    viewBox: '0 0 760 280',
    svg: `
      <svg viewBox="0 0 760 280" class="diagram-svg" role="img" aria-label="Lock Wait vs Deadlock Scenario">
        <defs>
          <marker id="lock-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#a03530"/>
          </marker>
        </defs>
        <g class="diag-node" data-node="blocking" tabindex="0">
          <rect x="20" y="20" width="345" height="240" rx="4" class="diag-box-accent"/>
          <text x="192" y="48" class="diag-title-accent">Scenario 1: Linear Lock Wait</text>
          <rect x="45" y="72" width="125" height="52" rx="4" class="diag-box"/>
          <text x="107" y="95" class="diag-title">Session A</text>
          <text x="107" y="113" class="diag-sub">Holds X-Lock Row 1</text>
          <rect x="215" y="72" width="125" height="52" rx="4" class="diag-box"/>
          <text x="277" y="95" class="diag-title">Session B</text>
          <text x="277" y="113" class="diag-sub">Requests Row 1</text>
          <line x1="215" y1="98" x2="174" y2="98" stroke="#a03530" stroke-width="2" marker-end="url(#lock-arrow)"/>
          <text x="192" y="160" class="diag-sub">Session B pauses (LOCK WAIT)</text>
          <text x="192" y="182" class="diag-sub">until Session A runs COMMIT/ROLLBACK</text>
          <text x="192" y="204" class="diag-sub">or innodb_lock_wait_timeout (15s) expires.</text>
        </g>
        <g class="diag-node" data-node="deadlock" tabindex="0">
          <rect x="395" y="20" width="345" height="240" rx="4" class="diag-box"/>
          <text x="567" y="48" class="diag-title">Scenario 2: Circular Deadlock (1213)</text>
          <rect x="420" y="72" width="125" height="52" rx="4" class="diag-box"/>
          <text x="482" y="95" class="diag-title">Session A</text>
          <text x="482" y="113" class="diag-sub">Holds Row 1</text>
          <rect x="590" y="72" width="125" height="52" rx="4" class="diag-box"/>
          <text x="652" y="95" class="diag-title">Session B</text>
          <text x="652" y="113" class="diag-sub">Holds Row 2</text>
          <path d="M 545 86 L 590 86" stroke="#a03530" stroke-width="2" marker-end="url(#lock-arrow)"/>
          <path d="M 590 112 L 545 112" stroke="#a03530" stroke-width="2" marker-end="url(#lock-arrow)"/>
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
    viewBox: '0 0 760 330',
    svg: `
      <svg viewBox="0 0 760 330" class="diagram-svg" role="img" aria-label="SQL Logical Execution Order">
        <defs>
          <marker id="exec-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#8b4b32"/>
          </marker>
        </defs>
        <text x="190" y="24" class="diag-sub" font-weight="600">WRITTEN ORDER (Syntax)</text>
        <text x="530" y="24" class="diag-sub" font-weight="600">LOGICAL EXECUTION ORDER (Click a stage)</text>
        <rect x="45" y="42" width="290" height="260" rx="4" class="diag-box"/>
        <text x="190" y="74" class="diag-title">1. SELECT  [DISTINCT] columns</text>
        <text x="190" y="106" class="diag-title">2. FROM    tables + JOIN ... ON</text>
        <text x="190" y="138" class="diag-title">3. WHERE   row_condition</text>
        <text x="190" y="170" class="diag-title">4. GROUP BY grouping_cols</text>
        <text x="190" y="202" class="diag-title">5. HAVING  group_condition</text>
        <text x="190" y="234" class="diag-title">6. ORDER BY sort_cols</text>
        <text x="190" y="266" class="diag-title">7. LIMIT   row_count</text>
        <g class="diag-node" data-node="from" tabindex="0">
          <rect x="380" y="42" width="165" height="54" rx="4" class="diag-box"/>
          <text x="462" y="65" class="diag-title">1. FROM / JOIN</text>
          <text x="462" y="83" class="diag-sub">Combine &amp; match tables</text>
        </g>
        <g class="diag-node" data-node="where" tabindex="0">
          <rect x="565" y="42" width="165" height="54" rx="4" class="diag-box-accent"/>
          <text x="647" y="65" class="diag-title-accent">2. WHERE</text>
          <text x="647" y="83" class="diag-sub-accent">Filter individual rows</text>
        </g>
        <g class="diag-node" data-node="groupby" tabindex="0">
          <rect x="380" y="110" width="165" height="54" rx="4" class="diag-box"/>
          <text x="462" y="133" class="diag-title">3. GROUP BY</text>
          <text x="462" y="151" class="diag-sub">Form groups &amp; aggregates</text>
        </g>
        <g class="diag-node" data-node="having" tabindex="0">
          <rect x="565" y="110" width="165" height="54" rx="4" class="diag-box-accent"/>
          <text x="647" y="133" class="diag-title-accent">4. HAVING</text>
          <text x="647" y="151" class="diag-sub-accent">Filter whole groups</text>
        </g>
        <g class="diag-node" data-node="select" tabindex="0">
          <rect x="380" y="178" width="165" height="54" rx="4" class="diag-box"/>
          <text x="462" y="201" class="diag-title">5. SELECT + DISTINCT</text>
          <text x="462" y="219" class="diag-sub">Compute aliases &amp; deduplicate</text>
        </g>
        <g class="diag-node" data-node="orderby" tabindex="0">
          <rect x="565" y="178" width="165" height="54" rx="4" class="diag-box"/>
          <text x="647" y="201" class="diag-title">6. ORDER BY</text>
          <text x="647" y="219" class="diag-sub">Sort final result rows</text>
        </g>
        <g class="diag-node" data-node="limit" tabindex="0">
          <rect x="380" y="246" width="350" height="54" rx="4" class="diag-box"/>
          <text x="555" y="269" class="diag-title">7. LIMIT / OFFSET</text>
          <text x="555" y="287" class="diag-sub">Slice final sorted output rows</text>
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
    viewBox: '0 0 760 270',
    svg: `
      <svg viewBox="0 0 760 270" class="diagram-svg" role="img" aria-label="SQL Set Operations Comparison">
        <g class="diag-node" data-node="union" tabindex="0">
          <rect x="20" y="18" width="170" height="175" rx="4" class="diag-box"/>
          <circle cx="82" cy="82" r="28" fill="#8b4b32" fill-opacity="0.28" stroke="#8b4b32" stroke-width="2"/>
          <circle cx="128" cy="82" r="28" fill="#8b4b32" fill-opacity="0.28" stroke="#3f6048" stroke-width="2"/>
          <text x="105" y="142" class="diag-title">UNION</text>
          <text x="105" y="162" class="diag-sub">A ∪ B (Deduplicated)</text>
        </g>
        <g class="diag-node" data-node="union-all" tabindex="0">
          <rect x="205" y="18" width="170" height="175" rx="4" class="diag-box"/>
          <circle cx="267" cy="82" r="28" fill="#8b4b32" fill-opacity="0.22" stroke="#8b4b32" stroke-width="2"/>
          <circle cx="313" cy="82" r="28" fill="#3f6048" fill-opacity="0.22" stroke="#3f6048" stroke-width="2"/>
          <text x="290" y="142" class="diag-title">UNION ALL</text>
          <text x="290" y="162" class="diag-sub">A + B (Keeps duplicates)</text>
        </g>
        <g class="diag-node" data-node="intersect" tabindex="0">
          <rect x="390" y="18" width="170" height="175" rx="4" class="diag-box-accent"/>
          <circle cx="452" cy="82" r="28" fill="none" stroke="#8b4b32" stroke-width="2"/>
          <circle cx="498" cy="82" r="28" fill="none" stroke="#3f6048" stroke-width="2"/>
          <path d="M 475 61 A 28 28 0 0 1 475 103 A 28 28 0 0 1 475 61" fill="#8b4b32" fill-opacity="0.45"/>
          <text x="475" y="142" class="diag-title-accent">INTERSECT</text>
          <text x="475" y="162" class="diag-sub-accent">A ∩ B (Common rows)</text>
        </g>
        <g class="diag-node" data-node="except" tabindex="0">
          <rect x="575" y="18" width="165" height="175" rx="4" class="diag-box"/>
          <circle cx="635" cy="82" r="28" fill="#8b4b32" fill-opacity="0.32" stroke="#8b4b32" stroke-width="2"/>
          <circle cx="680" cy="82" r="28" fill="#faf8f3" stroke="#3f6048" stroke-width="2"/>
          <text x="657" y="142" class="diag-title">EXCEPT</text>
          <text x="657" y="162" class="diag-sub">A − B (In A, not B)</text>
        </g>
        <rect x="20" y="208" width="720" height="46" rx="4" class="diag-box"/>
        <text x="380" y="228" class="diag-title">Union-Compatibility Rules</text>
        <text x="380" y="244" class="diag-sub">1. Same number of SELECT columns   2. Compatible column types in order   3. Output column names come from first SELECT; ORDER BY goes at the very end</text>
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

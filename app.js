const seed = {
  students: [
    { id: 1, name: "Aman Verma", email: "aman@example.com", age: 25, course_id: 101 },
    { id: 2, name: "Riya Sharma", email: "riya@example.com", age: 19, course_id: 102 },
    { id: 3, name: "Kabir Singh", email: "kabir@example.com", age: 22, course_id: 101 },
    { id: 4, name: "Meera Nair", email: "meera@example.com", age: 20, course_id: 103 },
    { id: 5, name: "Zoya Khan", email: "zoya@example.com", age: 23, course_id: 102 }
  ],
  courses: [
    { id: 101, course_name: "Cybersecurity", duration_months: 6, instructor: "Dr. Kavya Rao" },
    { id: 102, course_name: "Database Security", duration_months: 4, instructor: "Prof. Arjun Mehta" },
    { id: 103, course_name: "Python for Security", duration_months: 3, instructor: "Neha Iyer" }
  ],
  enrollments: [
    { id: 1001, student_id: 1, course_id: 101, enrolled_on: "2026-07-01", status: "active" },
    { id: 1002, student_id: 1, course_id: 103, enrolled_on: "2026-07-02", status: "active" },
    { id: 1003, student_id: 2, course_id: 102, enrolled_on: "2026-07-03", status: "active" },
    { id: 1004, student_id: 3, course_id: 101, enrolled_on: "2026-07-04", status: "active" },
    { id: 1005, student_id: 5, course_id: 102, enrolled_on: "2026-07-05", status: "active" }
  ]
};

let db = structuredClone(seed);
let activeSection = 0;
let activeTable = "students";
let selectedCourse = 101;

const sections = ["overview", "tables", "queries", "relationships", "security"];
const sectionLabels = ["WHY A DBMS?", "TABLES & KEYS", "RUN SQL", "RELATIONSHIPS", "SECURITY TEASER"];
const nextLabels = ["Tables & keys", "Run SQL", "Relationships", "Security teaser", "Finish"];
const schema = {
  students: { primary: ["id"], foreign: ["course_id"] },
  courses: { primary: ["id"], foreign: [] },
  enrollments: { primary: ["id"], foreign: ["student_id", "course_id"] }
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderTable(target, rows, options = {}) {
  if (!rows.length) {
    target.innerHTML = '<div class="relation-empty">No rows returned.</div>';
    return;
  }
  const columns = options.columns || Object.keys(rows[0]);
  const tableName = options.tableName;
  const tableSchema = tableName ? schema[tableName] : { primary: [], foreign: [] };
  const head = columns.map((column) => {
    const primary = tableSchema.primary.includes(column);
    const foreign = tableSchema.foreign.includes(column);
    const badge = primary ? '<span class="column-badge pk">PK</span>' : foreign ? '<span class="column-badge fk">FK</span>' : "";
    return `<th>${escapeHtml(column)}${badge}</th>`;
  }).join("");
  const body = rows.map((row) => `<tr>${columns.map((column) => {
    const kind = tableSchema.primary.includes(column) ? "key-cell" : tableSchema.foreign.includes(column) ? "foreign-cell" : "";
    return `<td class="${kind}">${escapeHtml(row[column] ?? "NULL")}</td>`;
  }).join("")}</tr>`).join("");
  target.innerHTML = `<table class="data-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function showSection(index) {
  activeSection = Math.max(0, Math.min(sections.length - 1, index));
  $$(".panel").forEach((panel, i) => panel.classList.toggle("active", i === activeSection));
  $$(".nav-item").forEach((item, i) => item.classList.toggle("active", i === activeSection));
  $("#lessonProgress").style.width = `${(activeSection + 1) * 20}%`;
  $("#progressLabel").textContent = `Step ${activeSection + 1} of 5`;
  $("#stageLabel").textContent = `${String(activeSection + 1).padStart(2, "0")} / ${sectionLabels[activeSection]}`;
  $("#prevButton").disabled = activeSection === 0;
  $("#nextButton").textContent = activeSection === 4 ? "Back to start ↺" : `Next: ${nextLabels[activeSection]} →`;
}

function renderActiveTable() {
  $("#tableTitle").textContent = activeTable;
  $("#rowCount").textContent = `${db[activeTable].length} rows`;
  renderTable($("#tableMount"), db[activeTable], { tableName: activeTable });
}

function normalizeQuery(query) {
  return query.trim().replace(/;$/, "").replace(/\s+/g, " ");
}

function joinedStudents() {
  return db.students.map((student) => {
    const course = db.courses.find((item) => item.id === student.course_id);
    return { name: student.name, course_name: course?.course_name ?? "Unassigned" };
  });
}

function executeQuery(rawQuery) {
  const query = normalizeQuery(rawQuery);
  const lower = query.toLowerCase();
  if (!query) throw new Error("Type a SQL query first.");

  if (lower === "show databases") {
    return { rows: [{ Database: "college_demo" }, { Database: "information_schema" }, { Database: "mysql" }], explanation: "The server can manage several separate databases." };
  }
  if (lower === "show tables") {
    return { rows: Object.keys(db).map((name) => ({ Tables_in_college_demo: name })), explanation: "These are the tables inside college_demo." };
  }
  const describe = lower.match(/^(describe|desc)\s+(students|courses|enrollments)$/);
  if (describe) {
    const definitions = {
      students: [
        { Field: "id", Type: "int", Null: "NO", Key: "PRI" }, { Field: "name", Type: "varchar(100)", Null: "NO", Key: "" },
        { Field: "email", Type: "varchar(120)", Null: "NO", Key: "UNI" }, { Field: "age", Type: "int", Null: "YES", Key: "" },
        { Field: "course_id", Type: "int", Null: "YES", Key: "MUL" }
      ],
      courses: [
        { Field: "id", Type: "int", Null: "NO", Key: "PRI" }, { Field: "course_name", Type: "varchar(100)", Null: "NO", Key: "" },
        { Field: "duration_months", Type: "int", Null: "NO", Key: "" }, { Field: "instructor", Type: "varchar(100)", Null: "NO", Key: "" }
      ],
      enrollments: [
        { Field: "id", Type: "int", Null: "NO", Key: "PRI" }, { Field: "student_id", Type: "int", Null: "NO", Key: "MUL" },
        { Field: "course_id", Type: "int", Null: "NO", Key: "MUL" }, { Field: "enrolled_on", Type: "date", Null: "NO", Key: "" },
        { Field: "status", Type: "varchar(20)", Null: "NO", Key: "" }
      ]
    };
    return { rows: definitions[describe[2]], explanation: `The schema describes the shape and rules of ${describe[2]}.` };
  }

  if (/group by c\.course_name/i.test(query) && /count\(\*\)/i.test(query)) {
    const counts = db.courses.map((course) => ({
      course_name: course.course_name,
      students: db.students.filter((student) => student.course_id === course.id).length
    }));
    return { rows: counts, explanation: "JOIN connects the tables; GROUP BY creates one group per course; COUNT counts each group." };
  }
  if (/join\s+courses/i.test(query)) {
    return { rows: joinedStudents(), explanation: "The foreign key students.course_id matches the primary key courses.id." };
  }

  const select = query.match(/^select\s+(.+?)\s+from\s+(students|courses|enrollments)(?:\s+where\s+(.+))?$/i);
  if (select) {
    const [, columnText, tableName, whereText] = select;
    let rows = structuredClone(db[tableName.toLowerCase()]);
    if (whereText) {
      const condition = whereText.match(/(age|id|course_id|student_id)\s*(=|>|<|>=|<=)\s*(\d+)/i);
      if (!condition) throw new Error("This teaching console supports simple numeric WHERE conditions.");
      const [, field, operator, rawValue] = condition;
      const value = Number(rawValue);
      rows = rows.filter((row) => ({ "=": row[field] === value, ">": row[field] > value, "<": row[field] < value, ">=": row[field] >= value, "<=": row[field] <= value })[operator]);
    }
    const columns = columnText.trim() === "*" ? Object.keys(db[tableName.toLowerCase()][0]) : columnText.split(",").map((column) => column.trim().replace(/^\w+\./, ""));
    const projected = rows.map((row) => Object.fromEntries(columns.map((column) => [column, row[column]])));
    return { rows: projected, tableName: tableName.toLowerCase(), explanation: whereText ? `WHERE keeps only rows that match: ${whereText}.` : columnText.trim() === "*" ? `Every row and every column from the ${tableName} table.` : `Only the requested columns are returned: ${columns.join(", ")}.` };
  }

  const insert = query.match(/^insert\s+into\s+students\s*\(\s*name\s*,\s*email\s*,\s*age\s*,\s*course_id\s*\)\s*values\s*\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
  if (insert) {
    const [, name, email, age, courseId] = insert;
    if (db.students.some((student) => student.email === email)) throw new Error("Duplicate email: the UNIQUE rule protects this column.");
    if (!db.courses.some((course) => course.id === Number(courseId))) throw new Error("Foreign key error: that course_id does not exist.");
    const row = { id: Math.max(...db.students.map((student) => student.id)) + 1, name, email, age: Number(age), course_id: Number(courseId) };
    db.students.push(row);
    renderActiveTable();
    renderRelationships();
    return { rows: [row], tableName: "students", explanation: "1 row inserted. The DBMS generated the primary key and checked the constraints." };
  }

  throw new Error("Try SELECT, SHOW TABLES, DESCRIBE students, a preset JOIN, or the sample INSERT in the README.");
}

function runQuery() {
  const started = performance.now();
  try {
    const result = executeQuery($("#sqlEditor").value);
    renderTable($("#resultMount"), result.rows, { tableName: result.tableName });
    $("#resultTitle").textContent = "Result";
    $("#resultMeta").textContent = `${result.rows.length} row${result.rows.length === 1 ? "" : "s"} · ${Math.max(1, Math.round(performance.now() - started))}ms`;
    $("#queryExplanation").textContent = result.explanation;
  } catch (error) {
    $("#resultMount").innerHTML = `<div class="error-message">ERROR · ${escapeHtml(error.message)}</div>`;
    $("#resultTitle").textContent = "Query error";
    $("#resultMeta").textContent = "0 rows";
    $("#queryExplanation").textContent = "Errors are useful: read the message, inspect the schema, then try again.";
  }
}

function updateLineNumbers() {
  const lines = $("#sqlEditor").value.split("\n").length;
  $("#lineNumbers").textContent = Array.from({ length: lines }, (_, index) => index + 1).join("\n");
}

function renderRelationships(showAll = false) {
  $("#coursePicker").innerHTML = db.courses.map((course) => `<button class="course-option ${course.id === selectedCourse ? "active" : ""}" data-course="${course.id}" type="button"><span>${escapeHtml(course.course_name)}</span><code>ID ${course.id}</code></button>`).join("");
  const course = db.courses.find((item) => item.id === selectedCourse);
  const matching = db.students.filter((student) => student.course_id === selectedCourse).map((student) => ({ student_id: student.id, student_name: student.name, course_id: course.id, course_name: course.course_name }));
  if (showAll) renderTable($("#relationResult"), joinedStudents());
  else renderTable($("#relationResult"), matching);
  $$(".course-option").forEach((button) => button.addEventListener("click", () => {
    selectedCourse = Number(button.dataset.course);
    renderRelationships(false);
  }));
}

function togglePresentation() {
  document.body.classList.toggle("presenting");
  $("#presentButton").textContent = document.body.classList.contains("presenting") ? "Exit presentation" : "Present";
  if (document.body.classList.contains("presenting") && document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
}

function resetData() {
  db = structuredClone(seed);
  activeTable = "students";
  selectedCourse = 101;
  $$(".table-tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.table === "students"));
  renderActiveTable();
  renderRelationships();
  $("#sqlEditor").value = "SELECT * FROM students;";
  updateLineNumbers();
  runQuery();
}

$$('.nav-item').forEach((item, index) => item.addEventListener('click', () => showSection(index)));
$("#prevButton").addEventListener("click", () => showSection(activeSection - 1));
$("#nextButton").addEventListener("click", () => showSection(activeSection === 4 ? 0 : activeSection + 1));
$("#presentButton").addEventListener("click", togglePresentation);
$("#resetButton").addEventListener("click", resetData);
$("#runQuery").addEventListener("click", runQuery);
$("#showJoinButton").addEventListener("click", () => renderRelationships(true));
$("#sqlEditor").addEventListener("input", updateLineNumbers);
$("#sqlEditor").addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); runQuery(); }
});
$$('.table-tab').forEach((tab) => tab.addEventListener('click', () => {
  activeTable = tab.dataset.table;
  $$('.table-tab').forEach((item) => item.classList.toggle('active', item === tab));
  renderActiveTable();
}));
$$('.preset').forEach((preset) => preset.addEventListener('click', () => {
  $$('.preset').forEach((item) => item.classList.toggle('active', item === preset));
  $("#sqlEditor").value = preset.dataset.query;
  updateLineNumbers();
  runQuery();
}));
document.addEventListener("keydown", (event) => {
  if (["TEXTAREA", "INPUT"].includes(document.activeElement.tagName)) return;
  if (event.key === "ArrowRight") showSection(activeSection === 4 ? 0 : activeSection + 1);
  if (event.key === "ArrowLeft") showSection(activeSection - 1);
  if (event.key === "Escape" && document.body.classList.contains("presenting")) togglePresentation();
});
document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement && document.body.classList.contains("presenting")) {
    document.body.classList.remove("presenting");
    $("#presentButton").textContent = "Present";
  }
});

renderActiveTable();
renderRelationships();
runQuery();

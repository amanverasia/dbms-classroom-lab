'use strict';

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const esc = value =>
  String(value ?? 'NULL').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const sections = COURSE.sections;
const allSteps = sections.flatMap(section => section.steps.map(step => ({ section, step })));

const STORAGE_POS = 'dbms-classroom-position-v2';
const STORAGE_MODE = 'dbms-classroom-mode-v1';
const STORAGE_PROGRESS = 'dbms-classroom-progress-v1';
const STORAGE_CLIENT_ID = 'dbms-classroom-client-id-v1';
const STORAGE_HISTORY = 'dbms-classroom-query-history-v1';
const STORAGE_DRAFT_PREFIX = 'dbms-classroom-draft:';
const STORAGE_THEME = 'dbms-classroom-theme-v1';
const STORAGE_SIDEBAR = 'dbms-classroom-sidebar-v1';

const params = new URLSearchParams(location.search);
const isSpeakerPopup = params.get('presenter') === '1';

let position = 0;
let renderVersion = 0;
let resetTarget = null;
let toastTimer = null;
let healthTimer = null;
let monitorPollTimer = null;
let mode = loadMode();
let theme = loadTheme();
let progress = loadProgress();
let channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('dbms-classroom-sync') : null;

function loadTheme() {
  try {
    return localStorage.getItem(STORAGE_THEME) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function applyTheme(nextTheme) {
  theme = nextTheme === 'dark' ? 'dark' : 'light';
  document.body.classList.toggle('theme-dark', theme === 'dark');
  const btn = $('#themeButton');
  if (btn) btn.textContent = theme === 'dark' ? 'Paper' : 'Dark';
  try {
    localStorage.setItem(STORAGE_THEME, theme);
  } catch {}
  channel?.postMessage({ type: 'theme', theme });
}

function applySidebarState(collapsed) {
  document.body.classList.toggle('sidebar-collapsed', collapsed);
  try {
    localStorage.setItem(STORAGE_SIDEBAR, collapsed ? '1' : '0');
  } catch {}
}

function getClientId() {
  try {
    let id = localStorage.getItem(STORAGE_CLIENT_ID);
    if (!id) {
      id = 'lab-' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(STORAGE_CLIENT_ID, id);
    }
    return id;
  } catch {
    return 'default';
  }
}

function loadMode() {
  try {
    return localStorage.getItem(STORAGE_MODE) === 'student' ? 'student' : 'instructor';
  } catch {
    return 'instructor';
  }
}

function saveMode(nextMode) {
  mode = nextMode;
  try {
    localStorage.setItem(STORAGE_MODE, mode);
  } catch {}
  document.body.classList.toggle('student-mode', mode === 'student');
  $('#modeInstructor')?.classList.toggle('active', mode === 'instructor');
  $('#modeStudent')?.classList.toggle('active', mode === 'student');
  if (mode === 'student' && document.body.classList.contains('presenting')) {
    presentation(false);
  }
  updateProgressSummary();
  go(position, false);
}

function loadProgress() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_PROGRESS) || '{}');
    return { passed: new Set(Array.isArray(raw.passed) ? raw.passed : []) };
  } catch {
    return { passed: new Set() };
  }
}

function markStepDone(sectionId, stepId) {
  const key = `${sectionId}/${stepId}`;
  if (!progress.passed.has(key)) {
    progress.passed.add(key);
    try {
      localStorage.setItem(STORAGE_PROGRESS, JSON.stringify({ passed: [...progress.passed] }));
    } catch {}
    updateProgressSummary();
    renderNav(allSteps[position].section, allSteps[position].step);
  }
}

function updateProgressSummary() {
  const el = $('#studentProgressLine');
  if (!el) return;
  const totalCheckpoints = allSteps.filter(i => i.step.type === 'quiz' || i.step.check).length;
  if (mode === 'student' || progress.passed.size > 0) {
    el.hidden = false;
    el.textContent = `Checkpoints completed: ${progress.passed.size} / ${totalCheckpoints}`;
  } else {
    el.hidden = true;
  }
}

function notify(message) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 4200);
}

function pathOf(item) {
  return `${item.section.id}/${item.step.id}`;
}

function locate(path) {
  const clean = String(path || '').replace(/^#/, '');
  return allSteps.findIndex(item => pathOf(item) === clean);
}

function readPosition() {
  if (location.hash && locate(location.hash) >= 0) return locate(location.hash);
  try {
    const saved = locate(localStorage.getItem(STORAGE_POS) || '');
    if (saved >= 0) return saved;
  } catch {}
  return 0;
}

async function api(endpoint, body, timeoutMs = 20000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`/api/${endpoint}`, {
      method: body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });
    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error('The classroom service is unavailable. Start the Docker lab and try again.');
    }
    if (!response.ok) {
      const err = new Error(result.error || 'Request failed.');
      err.code = result.code;
      throw err;
    }
    markHealthOnline();
    return result;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('The request timed out. Check the Docker lab or unlock any waiting session.');
    }
    if (error instanceof TypeError) {
      throw new Error('Could not reach the classroom service. Check Docker and retry.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function markHealthOnline(versionText) {
  const h = $('#health');
  if (!h) return;
  h.textContent = '● MariaDB connected';
  h.className = 'connection ready';
  if (versionText) h.title = `MariaDB ${versionText}`;
}

let unit2ReadyPromise = null;
function prepareUnit2() {
  if (!unit2ReadyPromise) {
    unit2ReadyPromise = api('prepare-unit2', { database: 'sql_lab' }).catch(err => {
      unit2ReadyPromise = null;
      throw err;
    });
  }
  return unit2ReadyPromise;
}

async function query(sql, database = 'college_demo', extra = {}) {
  if (database === 'sql_lab' && (!extra.persona || extra.persona === 'console')) {
    await prepareUnit2();
  }
  saveHistory(sql);
  return api('query', { sql, database, ...extra });
}

function saveHistory(sql) {
  const trimmed = String(sql || '').trim();
  if (!trimmed || trimmed.length > 500) return;
  try {
    const hist = JSON.parse(sessionStorage.getItem(STORAGE_HISTORY) || '[]');
    const next = [trimmed, ...hist.filter(q => q !== trimmed)].slice(0, 15);
    sessionStorage.setItem(STORAGE_HISTORY, JSON.stringify(next));
  } catch {}
}

function getHistory() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_HISTORY) || '[]');
  } catch {
    return [];
  }
}

function currentUnit() {
  return COURSE.units.find(unit => unit.id === allSteps[position].section.unit);
}

function currentDatabase() {
  const unitId = currentUnit().id;
  if (unitId === 'u2') return 'sql_lab';
  if (unitId === 'u3') return 'security_lab';
  if (unitId === 'u4') return 'perf_lab';
  return 'college_demo';
}

async function health() {
  try {
    const result = await api('health', null, 6000);
    markHealthOnline(result.version);
    const adminerLink = $('#adminerLink');
    if (adminerLink && result.adminerPort) {
      adminerLink.href = `${location.protocol}//${location.hostname}:${result.adminerPort}`;
    }
    if (result.dbPort) {
      if ($('#dbeaverPort')) $('#dbeaverPort').textContent = String(result.dbPort);
      if ($('#copyDbPort')) $('#copyDbPort').dataset.copy = String(result.dbPort);
    }
    if (healthTimer) {
      clearInterval(healthTimer);
      healthTimer = null;
    }
  } catch {
    const h = $('#health');
    if (h) {
      h.textContent = '○ MariaDB unavailable';
      h.className = 'connection offline';
    }
    if (!healthTimer) {
      healthTimer = setInterval(health, 12000);
    }
  }
}

function tableHTML(columns, rows, options = {}) {
  return `<div class="table-scroll"><table class="data-table"><thead><tr>${columns
    .map((c, i) => `<th>${options.interactive ? `<button class="column-focus" data-col="${i}" title="Highlight ${esc(c)}">${esc(c)}</button>` : esc(c)}</th>`)
    .join('')}</tr></thead><tbody>${rows
    .map(
      (row, i) =>
        `<tr${options.interactive ? ` tabindex="0" data-row="${i}" aria-label="Highlight record ${i + 1}"` : ''}>${row
          .map((value, j) => `<td${options.interactive ? ` data-col="${j}"` : ''}>${value === null ? '<em class="null">NULL</em>' : esc(value)}</td>`)
          .join('')}</tr>`
    )
    .join('')}</tbody></table>${rows.length === 0 ? '<p class="empty">No rows returned. The result still has the columns shown above.</p>' : ''}</div>`;
}

function cardsHTML(cards) {
  return `<div class="cards">${cards.map(([title, text]) => `<div class="card"><h3>${esc(title)}</h3><p>${esc(text)}</p></div>`).join('')}</div>`;
}

function formatAnswerHTML(answer) {
  const text = String(answer || '');
  const looksSqlOrMultiline =
    text.includes('\n') ||
    /^(SELECT|CREATE|INSERT|UPDATE|DELETE|ALTER|SHOW|GRANT|REVOKE|DROP|TRUNCATE)\b/m.test(text);
  return looksSqlOrMultiline ? `<pre>${esc(text)}</pre>` : esc(text);
}

function renderNav(section, step) {
  const unit = COURSE.units.find(u => u.id === section.unit);
  const unitNumber = COURSE.units.indexOf(unit) + 1;
  const unitSections = sections.filter(s => s.unit === section.unit);
  const unitSteps = allSteps.filter(item => item.section.unit === section.unit);
  const unitPosition = unitSteps.findIndex(item => item.step === step);

  $('#currentUnitLabel').textContent = `Unit ${unitNumber} · ${unit.title}`;
  $('#unitSummary').textContent = `${unitSections.length} sections · ${unit.hours} teaching hours`;
  $('#sectionNav').setAttribute('aria-label', `Unit ${unitNumber} sections`);
  $('#sectionNav').innerHTML = unitSections
    .map(
      s =>
        `<button class="section-link ${s === section ? 'active' : ''}" data-section="${esc(s.id)}" ${
          s === section ? 'aria-current="step"' : ''
        } type="button"><span>${esc(s.number)}</span><strong>${esc(s.title)}</strong><small>${s.minutes} min</small></button>`
    )
    .join('');
  $$('.section-link').forEach(button => {
    button.onclick = () => go(allSteps.findIndex(item => item.section.id === button.dataset.section));
  });

  const localIndex = section.steps.indexOf(step);
  $('#sectionLabel').textContent = `Unit ${unitNumber} / ${section.number} ${section.title}`;
  $('#stepCount').textContent = `Step ${localIndex + 1} of ${section.steps.length} · ${section.minutes} min section`;
  $('#stepRail').innerHTML = section.steps
    .map((s, i) => {
      const done = progress.passed.has(`${section.id}/${s.id}`);
      return `<button class="step-dot ${i === localIndex ? 'active' : i < localIndex ? 'past' : ''} ${
        done ? 'done' : ''
      }" data-step="${esc(s.id)}" type="button" aria-label="Step ${i + 1}: ${esc(s.title)}" title="${esc(s.title)}" ${
        i === localIndex ? 'aria-current="step"' : ''
      }></button>`;
    })
    .join('');

  $$('.step-dot').forEach(b => {
    b.onclick = () =>
      go(allSteps.findIndex(item => item.section === section && item.step.id === b.dataset.step));
  });

  $('#unitProgress').style.width = `${((unitPosition + 1) / unitSteps.length) * 100}%`;
  $('#unitCount').textContent = `Unit ${unitNumber} · step ${unitPosition + 1} of ${unitSteps.length}`;
  $('#footerLabel').textContent = `${section.number} · ${section.title}`;
  $('#prevButton').disabled = position === 0;

  const next = allSteps[position + 1];
  $('#nextButton').textContent = !next
    ? 'Course complete ✓'
    : next.section.unit !== section.unit
    ? `Next: Unit ${unitNumber + 1} →`
    : next.section !== section
    ? `Next: ${next.section.title} →`
    : 'Next →';
  $('#nextButton').disabled = !next;
}

function broadcastSpeakerState() {
  if (!allSteps[position]) return;
  const { section, step } = allSteps[position];
  const unitNumber = COURSE.units.findIndex(u => u.id === section.unit) + 1;
  const payload = {
    type: 'sync',
    position,
    total: allSteps.length,
    unitLabel: `Unit ${unitNumber} · ${section.number} ${section.title}`,
    title: step.title,
    notes: step.notes,
    question: step.question,
    answer: step.answer
  };
  if (channel) channel.postMessage(payload);
  try {
    localStorage.setItem('dbms-classroom-speaker-snapshot', JSON.stringify(payload));
  } catch {}
}

function go(index, updateHash = true) {
  if (index < 0 || index >= allSteps.length) return;
  if (monitorPollTimer) {
    clearInterval(monitorPollTimer);
    monitorPollTimer = null;
  }
  position = index;
  const { section, step } = allSteps[position];
  const version = ++renderVersion;

  if (updateHash) history.replaceState(null, '', `#${pathOf(allSteps[position])}`);
  try {
    localStorage.setItem(STORAGE_POS, pathOf(allSteps[position]));
    $('#savedLabel').textContent = 'Your place is saved on this browser';
  } catch {
    $('#savedLabel').textContent = 'Use the page link to save your place';
  }
  document.title = `${section.number} ${section.title} · DBMS Classroom`;

  renderNav(section, step);
  $('#lesson').innerHTML = `<p class="eyebrow">${esc(section.objective)}</p><h1>${esc(step.title)}</h1><p class="lead">${esc(step.lead)}</p><div id="demo" class="demo"></div>`;

  const discussLabel = mode === 'student' ? 'Check your understanding' : 'Discuss';
  const revealLabel = mode === 'student' ? 'Show solution' : 'Reveal answer';
  $('#discussion').innerHTML = `<div class="discussion-top"><span class="eyebrow">${discussLabel}</span><button id="revealButton" type="button" aria-expanded="false" aria-controls="answer">${revealLabel}</button></div><p>${esc(step.question)}</p><div id="answer" class="answer" hidden>${formatAnswerHTML(step.answer)}</div>`;
  $('#revealButton').onclick = () => {
    const hidden = $('#answer').hidden;
    $('#answer').hidden = !hidden;
    $('#revealButton').textContent = hidden ? (mode === 'student' ? 'Hide solution' : 'Hide answer') : revealLabel;
    $('#revealButton').setAttribute('aria-expanded', String(hidden));
  };

  $('#notesTitle').textContent = step.title;
  $('#notesText').textContent = step.notes;
  if ($('#notesDialog').open) $('#notesDialog').close();
  $('#notesButton')?.setAttribute('aria-expanded', 'false');

  renderDemo(section, step, version);
  broadcastSpeakerState();
  $('#main').scrollTop = 0;
}

function renderDemo(section, step, version) {
  const mount = $('#demo');
  switch (step.type) {
    case 'cards':
      mount.innerHTML = cardsHTML(step.cards);
      break;
    case 'comparison':
      mount.innerHTML = `<div class="surface">${tableHTML(step.columns, step.rows)}</div>`;
      break;
    case 'timeline':
      mount.innerHTML = `<div class="timeline">${step.items
        .map(([title, text], i) => `<div class="timeline-item"><span>${i + 1}</span><div><h3>${esc(title)}</h3><p>${esc(text)}</p></div></div>`)
        .join('')}</div>`;
      break;
    case 'quiz':
      renderQuiz(mount, section, step);
      break;
    case 'copies':
      renderCopies(mount);
      break;
    case 'explorer':
      renderExplorer(mount, version);
      break;
    case 'integrity':
      renderIntegrity(mount);
      break;
    case 'relationship':
      renderRelationship(mount, step.mode, version);
      break;
    case 'schema-instance':
      renderSchemaInstance(mount);
      break;
    case 'layers':
      renderLayers(mount);
      break;
    case 'pipeline':
      renderPipeline(mount);
      break;
    case 'diagram':
      renderDiagram(mount, step.diagram);
      break;
    case 'query':
      renderQuery(mount, step, false, section);
      break;
    case 'challenge':
      renderChallenge(mount, section, step);
      break;
    case 'storage-lab':
      renderStorageLab(mount, version);
      break;
    case 'persona-lab':
      renderPersonaLab(mount);
      break;
    case 'sqli-lab':
      renderSqliLab(mount);
      break;
    case 'log-lab':
      renderLogLab(mount, step.defaultTab || 'slow', version);
      break;
    case 'monitor-lab':
      renderMonitorLab(mount, version);
      break;
    case 'dual-session':
      renderDualSessionLab(mount);
      break;
    case 'backup-lab':
      renderBackupLab(mount, version);
      break;
    default:
      mount.innerHTML = '<p class="note">Unsupported step type.</p>';
  }
}

function renderQuiz(mount, section, step) {
  const done = progress.passed.has(`${section.id}/${step.id}`);
  mount.innerHTML = `<div class="quiz" role="group" aria-label="Knowledge check">${step.options
    .map((option, i) => `<button class="quiz-option" data-option="${i}" type="button"><span>${String.fromCharCode(65 + i)}</span>${esc(option)}</button>`)
    .join('')}<p class="quiz-feedback" aria-live="polite">${done ? `Completed earlier: ${esc(step.feedback)}` : ''}</p></div>`;
  $$('.quiz-option', mount).forEach(button => {
    button.onclick = () => {
      const correct = Number(button.dataset.option) === step.correct;
      $$('.quiz-option', mount).forEach(b => b.classList.remove('correct', 'incorrect'));
      button.classList.add(correct ? 'correct' : 'incorrect');
      $('.quiz-feedback', mount).textContent = correct
        ? `Correct. ${step.feedback}`
        : 'Not quite. Think about what this option assumes, then try another.';
      if (correct) markStepDone(section.id, step.id);
    };
  });
}

function renderCopies(mount) {
  let changed = false;
  let shared = false;
  function draw() {
    mount.innerHTML = `<p class="demo-caption">Illustration · no database changes</p><div class="cards">${['Admissions', 'Accounts', 'Teaching office']
      .map(
        (name, i) =>
          `<div class="card ${changed && !shared && i === 0 ? 'warning' : ''}"><span class="eyebrow">${name}</span><h3>${
            changed && (shared || i === 0) ? 'Cyber Defence' : 'Cybersecurity'
          }</h3><p>${shared ? 'Reads shared courses.id = 101' : 'A separate copy of course 101'}</p></div>`
      )
      .join('')}</div><div class="demo-actions"><button id="changeCopy" type="button">${
      changed ? 'Restore original names' : 'Update admissions copy'
    }</button><button id="shareCopy" type="button">${shared ? 'Return to separate copies' : 'Use a shared course record'}</button></div><p class="status-line" aria-live="polite">${
      shared
        ? 'One course record supplies the name wherever its ID is referenced.'
        : changed
        ? 'The copies now disagree about course 101.'
        : 'The copies agree for now. Try updating just one.'
    }</p>`;
    $('#changeCopy').onclick = () => {
      changed = !changed;
      draw();
    };
    $('#shareCopy').onclick = () => {
      shared = !shared;
      draw();
    };
  }
  draw();
}

async function renderExplorer(mount, version) {
  mount.innerHTML =
    '<div class="demo-actions">' +
    ['students', 'courses', 'enrollments'].map(name => `<button data-table="${name}" type="button">${name}</button>`).join('') +
    '</div><div class="surface" id="explorerTable"></div><p class="status-line" id="explorerStatus" aria-live="polite"></p>';
  let request = 0;
  async function loadTable(name) {
    const mine = ++request;
    const target = $('#explorerTable', mount);
    target.innerHTML = '<p class="empty">Reading MariaDB…</p>';
    $$('[data-table]', mount).forEach(b => b.classList.toggle('selected', b.dataset.table === name));
    try {
      const result = await query(`SELECT * FROM ${name} ORDER BY id;`, 'college_demo');
      if (version !== renderVersion || request !== mine) return;
      target.innerHTML = tableHTML(result.columns, result.rows, { interactive: true });
      $('#explorerStatus').textContent = `${result.count} records · ${result.columns.length} attributes · click a heading or row to highlight it`;
      $$('.column-focus', target).forEach(b => {
        b.onclick = () => {
          const colIdx = Number(b.dataset.col);
          const colName = result.columns[colIdx];
          $$('td', target).forEach(cell => cell.classList.toggle('highlight', cell.dataset.col === b.dataset.col));
          $$('tr', target).forEach(row => row.classList.remove('highlight'));
          $('#explorerStatus').textContent = `Column / attribute: ${colName}${
            name === 'students' && colName === 'course_id' ? ' — primary course foreign key' : ''
          }`;
        };
      });
      $$('[data-row]', target).forEach(row => {
        const select = () => {
          $$('td', target).forEach(c => c.classList.remove('highlight'));
          $$('[data-row]', target).forEach(r => r.classList.toggle('highlight', r === row));
          const singular = name === 'students' ? 'student' : name === 'courses' ? 'course' : 'enrollment';
          $('#explorerStatus').textContent = `One ${singular} record · ID ${result.rows[Number(row.dataset.row)][0]}`;
        };
        row.onclick = select;
        row.onkeydown = e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            select();
          }
        };
      });
    } catch (error) {
      if (version === renderVersion && request === mine) target.innerHTML = `<p class="error empty">${esc(error.message)}</p>`;
    }
  }
  $$('[data-table]', mount).forEach(b => (b.onclick = () => loadTable(b.dataset.table)));
  loadTable('students');
}

function renderIntegrity(mount) {
  const candidates = [
    { label: 'Duplicate ID', row: [1, 'New learner', 101], ok: false, message: 'Rejected: primary key 1 already identifies an existing student.' },
    { label: 'Missing course', row: [6, 'New learner', 999], ok: false, message: 'Rejected: course 999 does not exist, so the foreign-key reference is invalid.' },
    { label: 'Valid candidate', row: [6, 'New learner', 101], ok: true, message: 'Accepted by these illustrated rules: unused student ID, existing course ID.' }
  ];
  mount.innerHTML = `<p class="demo-caption">Illustration · existing student IDs 1–5 · course IDs 101–103</p><div class="demo-actions">${candidates
    .map((c, i) => `<button data-candidate="${i}" type="button">${c.label}</button>`)
    .join('')}</div><div id="candidateView" class="surface"><p class="empty">Choose a candidate and predict the outcome.</p></div><p id="candidateResult" class="status-line" aria-live="polite"></p>`;
  $$('[data-candidate]', mount).forEach(b => {
    b.onclick = () => {
      const candidate = candidates[Number(b.dataset.candidate)];
      $('#candidateView').innerHTML = tableHTML(['id PRIMARY KEY', 'name', 'course_id FOREIGN KEY'], [candidate.row]);
      $('#candidateResult').textContent = candidate.message;
      $('#candidateResult').className = `status-line ${candidate.ok ? 'success' : 'error'}`;
    };
  });
}

async function renderRelationship(mount, modeName, version) {
  mount.innerHTML = '<p class="empty">Reading connected records from MariaDB…</p>';
  try {
    const [students, courses, enrollments] = await Promise.all(
      ['students', 'courses', 'enrollments'].map(t => query(`SELECT * FROM ${t} ORDER BY id;`, 'college_demo'))
    );
    if (version !== renderVersion) return;
    const asObjects = result => result.rows.map(row => Object.fromEntries(result.columns.map((c, i) => [c, row[i]])));
    const s = asObjects(students);
    const c = asObjects(courses);
    const e = asObjects(enrollments);
    const options = modeName === 'primary' ? c : s;
    mount.innerHTML = `<div class="relation-map"><div><strong>${modeName === 'primary' ? 'courses' : 'students'}</strong><code>id · PRIMARY KEY</code></div><span>1 → many</span><div><strong>${
      modeName === 'primary' ? 'students' : 'enrollments'
    }</strong><code>${modeName === 'primary' ? 'course_id · FOREIGN KEY' : 'student_id + course_id'}</code></div>${
      modeName !== 'primary' ? '<span>many → 1</span><div><strong>courses</strong><code>id · PRIMARY KEY</code></div>' : ''
    }</div><div class="demo-actions">${options
      .map(o => `<button data-choice="${o.id}" type="button">${esc(modeName === 'primary' ? o.course_name : o.name)} <small>#${o.id}</small></button>`)
      .join('')}</div><div id="relatedRows" class="surface"></div><p id="relationshipStatus" class="status-line" aria-live="polite"></p>`;

    function select(id) {
      $$('[data-choice]', mount).forEach(b => b.classList.toggle('selected', b.dataset.choice === String(id)));
      const rows =
        modeName === 'primary'
          ? s
              .filter(student => Number(student.course_id) === Number(id))
              .map(student => [student.id, student.name, student.course_id, c.find(course => Number(course.id) === Number(id))?.course_name])
          : e
              .filter(enrollment => Number(enrollment.student_id) === Number(id))
              .map(enrollment => [
                enrollment.id,
                enrollment.student_id,
                enrollment.course_id,
                c.find(course => Number(course.id) === Number(enrollment.course_id))?.course_name
              ]);
      $('#relatedRows').innerHTML = tableHTML(
        modeName === 'primary' ? ['student_id', 'name', 'primary_course_id', 'course_name'] : ['enrollment_id', 'student_id', 'course_id', 'course_name'],
        rows
      );
      $('#relationshipStatus').textContent = `${rows.length} matching ${modeName === 'primary' ? 'student' : 'enrollment'} records · ${
        modeName === 'primary'
          ? 'students.course_id denotes primary course'
          : 'enrollments record actual course participation separately from primary course'
      }`;
    }
    $$('[data-choice]', mount).forEach(b => (b.onclick = () => select(b.dataset.choice)));
    if (options.length) select(options[0].id);
  } catch (error) {
    if (version === renderVersion) mount.innerHTML = `<p class="error empty">${esc(error.message)}</p>`;
  }
}

function renderSchemaInstance(mount) {
  let extraRow = false;
  let extraColumn = false;
  function draw() {
    const columns = ['id', 'name', ...(extraColumn ? ['age'] : [])];
    const rows = [[1, 'Aman'], [2, 'Riya'], ...(extraRow ? [[3, 'Kabir']] : [])].map((row, i) =>
      extraColumn ? [...row, [25, 19, 22][i]] : row
    );
    mount.innerHTML = `<p class="demo-caption">Illustration · no database changes</p><div class="split"><div class="card"><p class="eyebrow">Schema</p><pre>id   INT PRIMARY KEY\nname VARCHAR(100)${
      extraColumn ? '\nage  INT' : ''
    }</pre><p>Definition: ${columns.length} attributes.</p></div><div class="surface"><div class="surface-label">Instance · ${rows.length} rows now</div>${tableHTML(
      columns,
      rows
    )}</div></div><div class="demo-actions"><button id="addRow" type="button">${
      extraRow ? 'Remove illustrative row' : 'Add illustrative row'
    }</button><button id="addColumn" type="button">${extraColumn ? 'Restore original schema' : 'Add an age column'}</button></div>`;
    $('#addRow').onclick = () => {
      extraRow = !extraRow;
      draw();
    };
    $('#addColumn').onclick = () => {
      extraColumn = !extraColumn;
      draw();
    };
  }
  draw();
}

function renderLayers(mount) {
  const layers = [
    ['External', 'What each user role sees', ['student_name', 'course'], [['Aman', 'Cybersecurity'], ['Riya', 'Database Security']], 'A teacher roster view exposes selected facts while hiding unrelated attributes.'],
    ['Conceptual', 'The global logical schema', ['Table', 'Key / relationship'], [['students', 'id; course_id -> courses'], ['courses', 'id'], ['enrollments', 'id; (student_id, course_id)']], 'Tables, attributes, domains, and constraints define the logical system.'],
    ['Internal', 'Physical storage structures', ['Structure', 'Purpose'], [['.ibd data pages', '16 KB B+Tree clustered index pages'], ['Secondary indexes', 'Fast access paths without changing SQL'], ['Redo / Undo / Buffer Pool', 'Durability, rollback, and RAM caching']], 'Storage details hidden beneath Conceptual–Internal mapping.']
  ];
  mount.innerHTML = `<div class="demo-actions">${layers
    .map(([name], i) => `<button data-layer="${i}" type="button">${i + 1}. ${name}</button>`)
    .join('')}</div><div id="layerView" class="surface"></div><p class="status-line" id="layerNote"></p>`;
  function select(i) {
    const layer = layers[i];
    $$('[data-layer]', mount).forEach(b => b.classList.toggle('selected', Number(b.dataset.layer) === i));
    $('#layerView').innerHTML = `<div class="surface-label">${esc(layer[1])}</div>${tableHTML(layer[2], layer[3])}`;
    $('#layerNote').textContent = layer[4];
  }
  $$('[data-layer]', mount).forEach(b => (b.onclick = () => select(Number(b.dataset.layer))));
  select(0);
}

function renderPipeline(mount) {
  const stages = [
    ['Request', 'Client sends SQL over an authenticated connection.'],
    ['Parse & resolve', 'MariaDB parses syntax, resolves tables/columns in the Data Dictionary, and checks privileges.'],
    ['Plan (Optimizer)', 'Optimizer weighs statistics and indexes to choose the cheapest access plan.'],
    ['Execute', 'Storage Manager retrieves pages via Buffer Pool / Disk, applying locks and filters.'],
    ['Return', 'Result rows travel back to the client and render as a table.']
  ];
  let stage = 0;
  function draw() {
    mount.innerHTML = `<pre class="query-banner">SELECT name FROM students WHERE id = 1;</pre><div class="pipeline">${stages
      .map(([name], i) => `<button data-stage="${i}" class="${i === stage ? 'selected' : ''}" type="button"><span>${i + 1}</span>${name}</button>`)
      .join('')}</div><div class="card pipeline-detail"><h3>${stages[stage][0]}</h3><p>${stages[stage][1]}</p><button id="advancePipeline" type="button">${
      stage === stages.length - 1 ? 'Trace again ↺' : 'Follow query →'
    }</button></div>`;
    $$('[data-stage]', mount).forEach(b => {
      b.onclick = () => {
        stage = Number(b.dataset.stage);
        draw();
      };
    });
    $('#advancePipeline').onclick = () => {
      stage = (stage + 1) % stages.length;
      draw();
    };
  }
  draw();
}

function renderDiagram(mount, diagramId) {
  const spec = window.CLASSROOM_DIAGRAMS?.[diagramId];
  if (!spec) {
    mount.innerHTML = '<p class="error">Diagram definition missing.</p>';
    return;
  }
  mount.innerHTML = `<p class="demo-caption">${esc(spec.caption)}</p><div class="diagram-wrap">${spec.svg}<div class="diagram-info"><h3 id="diagTitle"></h3><p id="diagBody"></p></div></div>`;
  function selectNode(nodeKey) {
    const info = spec.nodes[nodeKey];
    if (!info) return;
    $$('.diag-node', mount).forEach(n => n.classList.toggle('active', n.dataset.node === nodeKey));
    $('#diagTitle', mount).textContent = info.title;
    $('#diagBody', mount).textContent = info.body;
  }
  $$('.diag-node', mount).forEach(n => {
    n.onclick = () => selectNode(n.dataset.node);
    n.onkeydown = e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectNode(n.dataset.node);
      }
    };
  });
  selectNode(spec.defaultNode);
}

function requestReset(kind, status, resultMount, onDone) {
  const choices = {
    practice: {
      endpoint: 'reset-practice',
      database: 'classroom_practice',
      title: 'Reset lab_students?',
      button: 'Reset lab_students',
      description: 'Removes only classroom_practice.lab_students and its rows so CREATE TABLE starts clean.'
    },
    edit: {
      endpoint: 'reset-edit-copy',
      database: 'sql_lab',
      title: 'Restore student_edits copy?',
      button: 'Restore edit copy',
      description: 'Replaces only sql_lab.student_edits with a fresh copy of sql_lab.students.'
    },
    unit2: {
      endpoint: 'reset-unit2',
      database: 'sql_lab',
      title: 'Reset Unit 2 data?',
      button: 'Reset Unit 2 data',
      description: 'Restores Unit 2 students, courses, enrollments, payments, and student_edits; drops lesson views and course_notes.'
    },
    unit3: {
      endpoint: 'reset-unit3',
      database: 'security_lab',
      title: 'Reset Unit 3 security lab?',
      button: 'Reset Unit 3',
      description: 'Restores security_lab tables, removes demo accounts/roles (intern, analyst_u3, ed_user, locked_user, role_reader), and uninstalls simple_password_check.'
    },
    'unit4-perf': {
      endpoint: 'reset-unit4-perf',
      database: 'perf_lab',
      title: 'Reset perf_lab secondary indexes?',
      button: 'Reset perf_lab indexes',
      description: 'Drops custom secondary indexes on perf_lab.activity_events while preserving all 25,000 rows so EXPLAIN starts from a full scan.'
    },
    unit4: {
      endpoint: 'reset-unit4',
      database: 'perf_lab',
      title: 'Reset Unit 4 operations labs?',
      button: 'Reset Unit 4',
      description: 'Resets perf_lab, ops_lab.accounts, backup_lab.fee_ledger, closes lock sessions, and restores default logging switches.'
    }
  };
  resetTarget = { ...choices[kind], status, resultMount, onDone };
  $('#resetTitle').textContent = resetTarget.title;
  $('#resetDescription').textContent = resetTarget.description;
  $('#confirmReset').textContent = resetTarget.button;
  $('#resetDialog').showModal();
}

async function renderSchemaDrawer(drawerEl, database) {
  drawerEl.innerHTML = '<h4>Schema Reference</h4><p class="note">Loading tables…</p>';
  try {
    const data = await api(`schema?database=${encodeURIComponent(database)}`);
    if (!data.objects.length) {
      drawerEl.innerHTML = `<h4>${esc(database)}</h4><p class="note">No tables or views yet.</p>`;
      return;
    }
    drawerEl.innerHTML = `<h4>${esc(database)} · ${data.objects.length} object(s)</h4>${data.objects
      .map(
        obj =>
          `<div class="schema-table"><strong>${esc(obj.name)} <span class="badge">${obj.type === 'VIEW' ? 'VIEW' : `${obj.rows} rows`}</span></strong><small>${obj.columns
            .map(c => `${c.name} (${c.type}${c.key ? ' ' + c.key : ''}${c.nullable ? '' : ' NOT NULL'})`)
            .join('<br>')}</small></div>`
      )
      .join('')}`;
  } catch (err) {
    drawerEl.innerHTML = `<h4>Schema Reference</h4><p class="error">${esc(err.message)}</p>`;
  }
}

function renderQuery(mount, config, workspace = false, section = null) {
  const unitId = section?.unit || currentUnit()?.id || 'u1';
  const defaultDb = config.database || currentDatabase();
  const presets = config.presets || [];
  const persona = config.persona || (unitId === 'u3' || unitId === 'u4' ? 'dba_lab' : 'console');
  const persistent = Boolean(config.persistent);
  const showSchemaDefault = workspace;

  const consoleDbs = [
    ['college_demo', 'college_demo · Unit 1 read-only'],
    ['classroom_practice', 'classroom_practice · Unit 1 RW'],
    ['sql_lab', 'sql_lab · Unit 2 RW']
  ];
  const adminDbs = [
    ...consoleDbs,
    ['security_lab', 'security_lab · Unit 3'],
    ['perf_lab', 'perf_lab · Unit 4 (25k rows)'],
    ['ops_lab', 'ops_lab · Unit 4 locks'],
    ['backup_lab', 'backup_lab · Unit 4 backups'],
    ['information_schema', 'information_schema · Data Dictionary'],
    ['performance_schema', 'performance_schema · Telemetry'],
    ['mysql', 'mysql · Accounts & Grants']
  ];
  const dbOptions = persona === 'console' ? consoleDbs : adminDbs;

  const draftKey = workspace ? `${STORAGE_DRAFT_PREFIX}${defaultDb}` : null;
  let initialSql = config.sql || (defaultDb === 'classroom_practice' ? 'SHOW TABLES;' : 'SELECT * FROM students ORDER BY id;');
  if (draftKey) {
    try {
      const saved = sessionStorage.getItem(draftKey);
      if (saved) initialSql = saved;
    } catch {}
  }

  const prepareEndpoint = config.prepare
    ? config.prepare
    : config.setup
    ? 'prepare-practice'
    : null;

  mount.innerHTML = `<div class="workspace-layout ${showSchemaDefault ? 'with-schema' : ''}">
    <div class="query-shell">
      <div class="query-toolbar">
        <label>Database
          <select class="database-select" aria-label="Query database">
            ${dbOptions.map(([id, title]) => `<option value="${id}" ${id === defaultDb ? 'selected' : ''}>${title}</option>`).join('')}
          </select>
        </label>
        <div class="query-meta">
          ${config.tlsToggle ? `<label><input type="checkbox" class="tls-toggle" ${config.useTls ? 'checked' : ''}> Use TLS / SSL</label>` : ''}
          <span class="persona-pill">${persistent ? `Persistent session (${esc(config.sessionSlot || 'unit3')})` : 'MariaDB'} · ${esc(persona)}</span>
          ${workspace ? '<select class="history-select" aria-label="Recent query history"><option value="">Recent queries…</option></select>' : ''}
          <button type="button" class="toggle-schema">${showSchemaDefault ? 'Hide schema' : 'Schema reference'}</button>
        </div>
      </div>
      ${presets.length ? `<div class="query-presets">${presets.map(([title], i) => `<button data-preset="${i}" type="button">${esc(title)}</button>`).join('')}</div>` : ''}
      <div class="query-split">
        <div class="query-editor-pane">
          <textarea class="sql-editor" aria-label="SQL query" spellcheck="false">${esc(initialSql)}</textarea>
          <div class="query-actions">
            <span class="note">One statement · ⌘/Ctrl + Enter</span>
            <div>
              ${prepareEndpoint ? '<button class="prepare-query" type="button">Prepare example</button>' : ''}
              ${config.inspectSql ? '<button class="inspect-query" type="button">Inspect result</button>' : ''}
              ${persistent ? '<button class="reset-session" type="button">Reset session</button>' : ''}
              <button class="reset-practice" type="button">Reset lab_students</button>
              <button class="reset-edit" type="button">Restore edit copy</button>
              <button class="reset-unit2" type="button">Reset Unit 2 data</button>
              <button class="reset-unit3" type="button">Reset Unit 3</button>
              <button class="reset-unit4-perf" type="button">Reset perf_lab indexes</button>
              <button class="reset-unit4" type="button">Reset Unit 4</button>
              <button class="run-query primary" type="button">Run query</button>
            </div>
          </div>
        </div>
        <div class="query-output-pane">
          <div class="query-status" role="status">Ready to run${config.expected ? ' · predict the outcome first' : ''}</div>
          <div class="query-result"></div>
        </div>
      </div>
    </div>
    <aside class="schema-drawer" ${showSchemaDefault ? '' : 'hidden'}></aside>
  </div>
  ${
    config.expected
      ? `<details class="expected"><summary>${mode === 'student' ? 'Expected output' : 'Expected outcome · teacher reference'}</summary><p>${esc(config.expected)}</p></details>`
      : ''
  }`;

  const layout = $('.workspace-layout', mount);
  const editor = $('.sql-editor', mount);
  const select = $('.database-select', mount);
  const status = $('.query-status', mount);
  const resultMount = $('.query-result', mount);
  const schemaDrawer = $('.schema-drawer', mount);
  const toggleSchemaBtn = $('.toggle-schema', mount);
  const tlsToggle = $('.tls-toggle', mount);
  const historySelect = $('.history-select', mount);
  const personaPill = $('.persona-pill', mount);

  let busy = false;
  function setBusy(value) {
    busy = value;
    $$('button', mount).forEach(b => (b.disabled = value));
    select.disabled = value;
    editor.readOnly = value;
  }

  function updateResetButtons() {
    const db = select.value;
    $('.reset-practice', mount).hidden = !(db === 'classroom_practice' && (workspace || config.resetKind === 'practice'));
    $('.reset-edit', mount).hidden = !(db === 'sql_lab' && (workspace || config.editCopy));
    $('.reset-unit2', mount).hidden = !(db === 'sql_lab' && (workspace || unitId === 'u2'));
    $('.reset-unit3', mount).hidden = !(workspace ? db === 'security_lab' : config.resetKind === 'unit3');
    $('.reset-unit4-perf', mount).hidden = !(config.resetKind === 'unit4-perf');
    $('.reset-unit4', mount).hidden = !(workspace && ['perf_lab', 'ops_lab', 'backup_lab'].includes(db));
  }

  function populateHistory() {
    if (!historySelect) return;
    const hist = getHistory();
    historySelect.innerHTML =
      '<option value="">Recent queries…</option>' +
      hist.map((q, idx) => `<option value="${idx}">${esc(q.replace(/\s+/g, ' ').slice(0, 52))}</option>`).join('');
  }

  if (workspace) populateHistory();
  updateResetButtons();
  if (showSchemaDefault) renderSchemaDrawer(schemaDrawer, select.value);

  toggleSchemaBtn.onclick = () => {
    const opening = schemaDrawer.hidden;
    schemaDrawer.hidden = !opening;
    layout.classList.toggle('with-schema', opening);
    toggleSchemaBtn.textContent = opening ? 'Hide schema' : 'Schema reference';
    if (opening) renderSchemaDrawer(schemaDrawer, select.value);
  };

  if (historySelect) {
    historySelect.onchange = () => {
      const idx = historySelect.value;
      if (idx === '') return;
      const hist = getHistory();
      if (hist[Number(idx)]) {
        editor.value = hist[Number(idx)];
        saveDraft();
      }
      historySelect.value = '';
    };
  }

  function saveDraft() {
    if (!workspace) return;
    try {
      sessionStorage.setItem(`${STORAGE_DRAFT_PREFIX}${select.value}`, editor.value);
    } catch {}
  }
  editor.addEventListener('input', saveDraft);

  select.onchange = () => {
    updateResetButtons();
    if (workspace) {
      try {
        const saved = sessionStorage.getItem(`${STORAGE_DRAFT_PREFIX}${select.value}`);
        if (saved) editor.value = saved;
      } catch {}
    }
    if (!schemaDrawer.hidden) renderSchemaDrawer(schemaDrawer, select.value);
    status.textContent = `Database ${select.value} selected · ready to run`;
    resultMount.innerHTML = '';
  };

  async function run(sql = editor.value, inspect = false) {
    if (busy) return;
    const selectedDb = select.value;
    setBusy(true);
    status.textContent = 'Running in MariaDB…';
    resultMount.innerHTML = '';
    try {
      const useTls = tlsToggle ? tlsToggle.checked : false;
      let result;
      if (persistent) {
        result = await api('session/query', {
          clientId: getClientId(),
          slot: config.sessionSlot || 'unit3',
          sql,
          database: selectedDb,
          persona,
          useTls
        });
        saveHistory(sql);
        personaPill.textContent = `Session #${result.connectionId} · DB: ${result.database || 'none'} · ${result.persona}`;
      } else {
        result = await query(sql, selectedDb, {
          persona,
          useTls,
          includeSslCipher: Boolean(config.tlsToggle)
        });
      }
      if (workspace) populateHistory();
      resultMount.innerHTML = result.columns.length
        ? tableHTML(result.columns, result.rows)
        : `<p class="success result-message">${esc(result.message)} ${result.affected} row(s) affected.</p>`;
      const tlsNote = result.sslCipher ? ` · TLS: ${result.sslCipher}` : '';
      status.textContent = `${inspect ? 'Inspection · ' : ''}${result.database || selectedDb} · ${
        result.columns.length ? `${result.count} row(s) returned` : `${result.affected} row(s) affected`
      } · ${result.ms} ms${result.truncated ? ' · first 200 shown' : ''}${tlsNote}`;
      if (!schemaDrawer.hidden && /^\s*(CREATE|ALTER|DROP|TRUNCATE)/i.test(sql)) {
        renderSchemaDrawer(schemaDrawer, result.database || selectedDb);
      }
      return result;
    } catch (error) {
      status.textContent = `MariaDB rejected statement${error.code ? ` (Error ${error.code})` : ''}`;
      resultMount.innerHTML = `<p class="error result-message">${esc(error.message)}</p>`;
      return null;
    } finally {
      setBusy(false);
    }
  }

  $('.run-query', mount).onclick = () => run();
  if ($('.inspect-query', mount)) $('.inspect-query', mount).onclick = () => run(config.inspectSql, true);
  editor.onkeydown = e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      run();
    }
  };
  $$('[data-preset]', mount).forEach(b => {
    b.onclick = () => {
      editor.value = presets[Number(b.dataset.preset)][1];
      saveDraft();
      status.textContent = 'Example loaded · predict outcome, then Run';
      resultMount.innerHTML = '';
    };
  });

  if ($('.prepare-query', mount)) {
    $('.prepare-query', mount).onclick = async () => {
      if (busy) return;
      setBusy(true);
      try {
        const res = await api(prepareEndpoint, {
          database: select.value,
          seed: Boolean(config.seedPractice)
        });
        status.textContent = res.message || 'Example prepared.';
        resultMount.innerHTML = '';
        if (!schemaDrawer.hidden) renderSchemaDrawer(schemaDrawer, select.value);
      } catch (err) {
        resultMount.innerHTML = `<p class="error result-message">${esc(err.message)}</p>`;
      } finally {
        setBusy(false);
      }
    };
  }

  if ($('.reset-session', mount)) {
    $('.reset-session', mount).onclick = async () => {
      if (busy) return;
      setBusy(true);
      try {
        await api('session/reset', { clientId: getClientId(), slot: config.sessionSlot || 'unit3' });
        personaPill.textContent = `Persistent session (${config.sessionSlot || 'unit3'}) · ${persona}`;
        status.textContent = 'Persistent session connection reset cleanly.';
        resultMount.innerHTML = '';
      } catch (err) {
        status.textContent = err.message;
      } finally {
        setBusy(false);
      }
    };
  }

  $('.reset-practice', mount).onclick = () => requestReset('practice', status, resultMount);
  $('.reset-edit', mount).onclick = () => requestReset('edit', status, resultMount);
  $('.reset-unit2', mount).onclick = () => requestReset('unit2', status, resultMount);
  $('.reset-unit3', mount).onclick = () => requestReset('unit3', status, resultMount);
  $('.reset-unit4-perf', mount).onclick = () => requestReset('unit4-perf', status, resultMount);
  $('.reset-unit4', mount).onclick = () => requestReset('unit4', status, resultMount);

  return { getSql: () => editor.value, getDb: () => select.value, showCheckResult: () => {} };
}

function renderChallenge(mount, section, step) {
  const hints = step.hints || [];
  const done = progress.passed.has(`${section.id}/${step.id}`);
  mount.innerHTML = `<div class="challenge-box">
    <div class="challenge-header">
      <div>
        <h3>${mode === 'student' ? 'Hands-on practice' : 'Pause for student work'}</h3>
        <span class="note">Database: <code>${esc(step.database || 'classroom_practice')}</code></span>
      </div>
      <div>
        ${done ? '<span class="badge ok">✓ Verified</span>' : '<span class="badge">Practice exercise</span>'}
      </div>
    </div>
    <div id="challengeQueryMount"></div>
    <div class="hints-bar">
      ${step.check ? '<button id="checkAnswerBtn" class="primary" type="button">Check my answer</button>' : ''}
      ${hints.map((_, idx) => `<button class="hint-btn" data-hint="${idx}" type="button">Show hint ${idx + 1}</button>`).join('')}
    </div>
    <div id="hintMount"></div>
    <div id="checkBanner"></div>
  </div>`;

  const starterSql =
    step.check?.kind === 'table-check'
      ? `-- Step 1: CREATE TABLE ${step.check.table} (...);\n-- Step 2: INSERT INTO ${step.check.table} (...) VALUES (...);\n-- Run one statement at a time, then click Check my answer.`
      : '-- Write your SQL query here, run it to preview, then click Check my answer.';

  renderQuery($('#challengeQueryMount', mount), {
    database: step.database || 'classroom_practice',
    persona: step.persona,
    sql: starterSql
  }, false, section);

  const editor = $('.sql-editor', mount);
  const dbSelect = $('.database-select', mount);

  $$('.hint-btn', mount).forEach(btn => {
    btn.onclick = () => {
      const idx = Number(btn.dataset.hint);
      $('#hintMount', mount).innerHTML = `<div class="hint-card"><strong>Hint ${idx + 1}:</strong> ${esc(hints[idx])}</div>`;
    };
  });

  if (step.check && $('#checkAnswerBtn', mount)) {
    $('#checkAnswerBtn', mount).onclick = async () => {
      const btn = $('#checkAnswerBtn', mount);
      btn.disabled = true;
      btn.textContent = 'Checking…';
      try {
        const res = await api('check-answer', {
          sql: editor.value,
          database: dbSelect.value,
          checkSpec: step.check
        });
        $('#checkBanner', mount).innerHTML = `<div class="check-banner ${res.passed ? 'pass' : 'fail'}">${esc(res.message)}</div>`;
        if (res.passed) {
          markStepDone(section.id, step.id);
          const badge = $('.badge', mount);
          if (badge) {
            badge.className = 'badge ok';
            badge.textContent = '✓ Verified';
          }
        }
      } catch (err) {
        $('#checkBanner', mount).innerHTML = `<div class="check-banner fail">${esc(err.message)}</div>`;
      } finally {
        btn.disabled = false;
        btn.textContent = 'Check my answer';
      }
    };
  }
}

async function renderStorageLab(mount, version) {
  mount.innerHTML = `<div class="lab-panel"><div class="demo-actions"><button id="refreshStorage" class="primary" type="button">Refresh storage inspection</button></div><div id="storageOut"><p class="empty">Reading /var/lib/mysql and INFORMATION_SCHEMA…</p></div></div>`;
  async function load() {
    const out = $('#storageOut', mount);
    try {
      const data = await api('admin/storage');
      if (version !== renderVersion) return;
      const fmtBytes = b => (b >= 1048576 ? `${(b / 1048576).toFixed(2)} MB` : `${(b / 1024).toFixed(1)} KB`);
      out.innerHTML = `
        <div class="kpi-grid">
          <div class="kpi-card"><small>Page Size</small><strong>${esc(data.variables.innodb_page_size || '16384')} B</strong></div>
          <div class="kpi-card"><small>File-Per-Table</small><strong>${esc(data.variables.innodb_file_per_table || 'ON')}</strong></div>
          <div class="kpi-card"><small>Buffer Pool Size</small><strong>${fmtBytes(Number(data.variables.innodb_buffer_pool_size || 0))}</strong></div>
        </div>
        <h3>Root InnoDB / Log Files in /var/lib/mysql</h3>
        <div class="surface">${tableHTML(['File', 'Size'], data.rootFiles.map(f => [f.name, fmtBytes(f.sizeBytes)]))}</div>
        <h3 style="margin-top:16px">Per-Database .ibd Table Files</h3>
        <div class="surface">${tableHTML(
          ['Schema', 'File', 'Disk Size'],
          data.schemaFiles.flatMap(s => s.files.slice(0, 6).map(f => [s.schema, f.name, fmtBytes(f.sizeBytes)]))
        )}</div>`;
    } catch (err) {
      if (version === renderVersion) out.innerHTML = `<p class="error">${esc(err.message)}</p>`;
    }
  }
  $('#refreshStorage', mount).onclick = load;
  load();
}

function renderPersonaLab(mount) {
  const presets = [
    ['SELECT students (college_demo)', 'SELECT id, name, email FROM students ORDER BY id;', 'college_demo'],
    ['INSERT student (college_demo)', "INSERT INTO students (name, email, age) VALUES ('Test', 't@example.com', 20);", 'college_demo'],
    ['DELETE student (college_demo)', 'DELETE FROM students WHERE id = 1;', 'college_demo'],
    ['DROP TABLE (security_lab)', 'DROP TABLE course_records;', 'security_lab'],
    ['Read portal_users (security_lab)', 'SELECT id, username, role_name FROM portal_users ORDER BY id;', 'security_lab'],
    ['Read mysql.user (System)', 'SELECT User, Host, plugin FROM mysql.user ORDER BY User;', 'mysql'],
    ['SHOW GRANTS', 'SHOW GRANTS;', 'college_demo']
  ];
  mount.innerHTML = `<div class="lab-panel">
    <div class="form-row">
      <div class="field">
        <label for="personaSelect">Database Identity (Persona)</label>
        <select id="personaSelect">
          <option value="reporting">reporting (SELECT only on college_demo, sql_lab, security_lab)</option>
          <option value="web_app">web_app (SELECT, INSERT, UPDATE on college_demo, security_lab)</option>
          <option value="console">classroom_console (Units 1-2 console identity)</option>
          <option value="dba_lab">dba_lab (Full administrative lab identity)</option>
          <option value="custom">Custom user created in Unit 3…</option>
        </select>
      </div>
      <div class="field">
        <label for="personaDb">Target Database</label>
        <select id="personaDb">
          <option value="college_demo">college_demo</option>
          <option value="security_lab">security_lab</option>
          <option value="sql_lab">sql_lab</option>
          <option value="mysql">mysql</option>
        </select>
      </div>
    </div>
    <div id="customAuthRow" class="form-row" hidden>
      <div class="field"><label for="customUser">Username</label><input id="customUser" value="analyst_u3"></div>
      <div class="field"><label for="customPass">Password</label><input id="customPass" type="password" value="Analyst#2026"></div>
    </div>
    <div class="demo-actions">${presets.map(([label], i) => `<button data-p="${i}" type="button">${esc(label)}</button>`).join('')}</div>
    <textarea id="personaSql" class="sql-editor" spellcheck="false">SELECT id, name, email FROM students ORDER BY id;</textarea>
    <div class="demo-actions">
      <button id="runPersonaBtn" class="primary" type="button">Execute as selected persona</button>
      <button id="resetUnit3Persona" type="button">Reset Unit 3</button>
    </div>
    <div id="personaStatus" class="status-line">Choose a persona and query to test MariaDB privilege enforcement.</div>
    <div id="personaOut" class="query-result"></div>
  </div>`;

  const pSel = $('#personaSelect', mount);
  const dbSel = $('#personaDb', mount);
  const sqlBox = $('#personaSql', mount);
  const customRow = $('#customAuthRow', mount);
  pSel.onchange = () => {
    customRow.hidden = pSel.value !== 'custom';
  };
  $$('[data-p]', mount).forEach(b => {
    b.onclick = () => {
      const [, q, db] = presets[Number(b.dataset.p)];
      sqlBox.value = q;
      dbSel.value = db;
    };
  });
  $('#resetUnit3Persona', mount).onclick = () => requestReset('unit3', $('#personaStatus', mount), $('#personaOut', mount));
  $('#runPersonaBtn', mount).onclick = async () => {
    const out = $('#personaOut', mount);
    const st = $('#personaStatus', mount);
    st.textContent = 'Running in MariaDB…';
    out.innerHTML = '';
    try {
      const res = await api('query', {
        sql: sqlBox.value,
        database: dbSel.value,
        persona: pSel.value,
        customAuth: pSel.value === 'custom' ? { username: $('#customUser', mount).value, password: $('#customPass', mount).value } : null
      });
      st.textContent = `Allowed as ${res.persona} in ${res.database} (${res.ms} ms)`;
      out.innerHTML = res.columns.length ? tableHTML(res.columns, res.rows) : `<p class="success result-message">${esc(res.message)}</p>`;
    } catch (err) {
      st.textContent = `Denied / Failed${err.code ? ` (Error ${err.code})` : ''}`;
      out.innerHTML = `<p class="error result-message">${esc(err.message)}</p>`;
    }
  };
}

function renderSqliLab(mount) {
  mount.innerHTML = `<div class="lab-panel">
    <div class="demo-actions">
      <button data-sqli="normal" type="button">1. Normal login (aman / aman@2026)</button>
      <button data-sqli="or" type="button">2. Auth bypass (' OR '1'='1)</button>
      <button data-sqli="comment" type="button">3. Comment hijack (admin_portal' -- )</button>
    </div>
    <div class="form-row">
      <div class="field"><label for="sqliUser">Username input</label><input id="sqliUser" value="aman"></div>
      <div class="field"><label for="sqliPass">Password input</label><input id="sqliPass" value="aman@2026"></div>
      <button id="runSqliBtn" class="primary" type="button">Test both queries live</button>
    </div>
    <div id="sqliOut"></div>
  </div>`;

  const uIn = $('#sqliUser', mount);
  const pIn = $('#sqliPass', mount);
  $$('[data-sqli]', mount).forEach(b => {
    b.onclick = () => {
      const k = b.dataset.sqli;
      if (k === 'normal') {
        uIn.value = 'aman';
        pIn.value = 'aman@2026';
      } else if (k === 'or') {
        uIn.value = "' OR '1'='1";
        pIn.value = "' OR '1'='1";
      } else {
        uIn.value = "admin_portal' -- ";
        pIn.value = 'wrongpass';
      }
      run();
    };
  });

  async function run() {
    const out = $('#sqliOut', mount);
    out.innerHTML = '<p class="note">Executing both patterns against security_lab.portal_users…</p>';
    try {
      const res = await api('admin/sqli-demo', { username: uIn.value, password: pIn.value });
      out.innerHTML = `<div class="lab-grid-2">
        <div class="surface" style="padding:14px">
          <p class="eyebrow"><span class="badge err">VULNERABLE</span> String Concatenation</p>
          <pre class="code-block">${esc(res.vulnerable.sql)}</pre>
          <div style="margin-top:10px">${
            res.vulnerable.error
              ? `<p class="error">${esc(res.vulnerable.error)}</p>`
              : tableHTML(res.vulnerable.columns, res.vulnerable.rows)
          }</div>
        </div>
        <div class="surface" style="padding:14px">
          <p class="eyebrow"><span class="badge ok">SAFE</span> Parameterized Query (?)</p>
          <pre class="code-block">${esc(res.safe.sql)}\nParams: ${esc(JSON.stringify(res.safe.params))}</pre>
          <div style="margin-top:10px">${
            res.safe.error ? `<p class="error">${esc(res.safe.error)}</p>` : tableHTML(res.safe.columns, res.safe.rows)
          }</div>
        </div>
      </div>`;
    } catch (err) {
      out.innerHTML = `<p class="error">${esc(err.message)}</p>`;
    }
  }
  $('#runSqliBtn', mount).onclick = run;
  run();
}

function renderLogLab(mount, defaultTab, version) {
  let activeTab = defaultTab || 'slow';
  mount.innerHTML = `<div class="lab-panel">
    <div id="logControls" class="demo-actions"></div>
    <div class="demo-actions">
      ${[
        ['error', 'Error Log'],
        ['slow', 'Slow Query Log'],
        ['general', 'General Query Log'],
        ['audit', 'Audit Log (server_audit)'],
        ['binlog', 'Binary Log']
      ]
        .map(([id, label]) => `<button class="log-tab ${id === activeTab ? 'selected' : ''}" data-log="${id}" type="button">${label}</button>`)
        .join('')}
      <button id="refreshLogBtn" type="button">↻ Refresh tail</button>
    </div>
    <p id="logMeta" class="status-line"></p>
    <div id="logCmdStrip" class="cmd-strip" hidden></div>
    <pre id="logOutput" class="log-viewer">Loading log…</pre>
  </div>`;

  async function refresh(lastCmd = null) {
    try {
      const data = await api(`admin/logs?type=${encodeURIComponent(activeTab)}&lines=55`);
      if (version !== renderVersion) return;
      if (lastCmd) {
        $('#logCmdStrip', mount).hidden = false;
        $('#logCmdStrip', mount).textContent = `Executed SQL: ${lastCmd}`;
      }
      const cfg = data.config || {};
      const genOn = cfg.general_log === 'ON';
      const slowOn = cfg.slow_query_log === 'ON';
      const audOn = cfg.server_audit_logging === 'ON';
      $('#logControls', mount).innerHTML = `
        <button id="togGen" class="${genOn ? 'selected' : ''}" type="button">general_log: ${genOn ? 'ON' : 'OFF'}</button>
        <button id="togSlow" class="${slowOn ? 'selected' : ''}" type="button">slow_query_log: ${slowOn ? 'ON' : 'OFF'} (&gt;${esc(cfg.long_query_time)}s)</button>
        <button id="togAudit" class="${audOn ? 'selected' : ''}" type="button">server_audit_logging: ${audOn ? 'ON' : 'OFF'}</button>
        <button id="trigSlow" type="button">Trigger 0.7s slow query</button>
      `;
      $('#togGen', mount).onclick = async () => {
        try {
          const r = await api('admin/logs/toggle', { target: 'general', enabled: !genOn });
          notify(r.executedSql);
          refresh(r.executedSql);
        } catch (err) {
          notify(err.message);
        }
      };
      $('#togSlow', mount).onclick = async () => {
        try {
          const r = await api('admin/logs/toggle', { target: 'slow', enabled: !slowOn, value: 0.5 });
          notify(r.executedSql);
          refresh(r.executedSql);
        } catch (err) {
          notify(err.message);
        }
      };
      $('#togAudit', mount).onclick = async () => {
        try {
          const r = await api('admin/logs/toggle', { target: 'audit', enabled: !audOn, value: ['CONNECT', 'QUERY', 'TABLE'] });
          notify(r.executedSql);
          refresh(r.executedSql);
        } catch (err) {
          notify(err.message);
        }
      };
      $('#trigSlow', mount).onclick = async () => {
        $('#trigSlow', mount).disabled = true;
        try {
          const r = await api('admin/logs/toggle', { target: 'trigger-slow', value: 0.7 });
          activeTab = 'slow';
          $$('.log-tab', mount).forEach(b => b.classList.toggle('selected', b.dataset.log === 'slow'));
          refresh(r.executedSql);
        } catch (err) {
          notify(err.message);
        } finally {
          $('#trigSlow', mount).disabled = false;
        }
      };

      $('#logMeta', mount).textContent =
        activeTab === 'binlog'
          ? `Binary logs (${(data.binlogs || []).map(b => `${b.name}: ${b.sizeBytes} B`).join(', ')})`
          : `File: ${data.file || activeTab} · Audit events: ${cfg.server_audit_events || 'n/a'}`;
      $('#logOutput', mount).textContent = data.content || '(Empty)';
      const viewer = $('#logOutput', mount);
      viewer.scrollTop = viewer.scrollHeight;
    } catch (err) {
      if (version === renderVersion) $('#logOutput', mount).textContent = err.message;
    }
  }

  $$('.log-tab', mount).forEach(b => {
    b.onclick = () => {
      activeTab = b.dataset.log;
      $$('.log-tab', mount).forEach(x => x.classList.toggle('selected', x === b));
      refresh();
    };
  });
  $('#refreshLogBtn', mount).onclick = refresh;
  refresh();
}

function renderMonitorLab(mount, version) {
  let autoRefresh = false;
  mount.innerHTML = `<div class="lab-panel">
    <div class="demo-actions">
      <button id="refreshMetricsBtn" class="primary" type="button">↻ Refresh metrics</button>
      <button id="togglePollBtn" type="button">Auto-refresh (2s): OFF</button>
    </div>
    <div id="metricsOut"><p class="empty">Reading SHOW GLOBAL STATUS &amp; PERFORMANCE_SCHEMA…</p></div>
  </div>`;

  async function load() {
    try {
      const m = await api('admin/metrics');
      if (version !== renderVersion) return;
      const st = m.status || {};
      $('#metricsOut', mount).innerHTML = `
        <div class="kpi-grid">
          <div class="kpi-card"><small>Threads Connected / Running</small><strong>${st.Threads_connected ?? 0} / ${st.Threads_running ?? 0}</strong></div>
          <div class="kpi-card"><small>InnoDB Buffer Pool Hit %</small><strong>${m.bufferHitPct}%</strong></div>
          <div class="kpi-card"><small>Questions / Slow Queries</small><strong>${st.Questions ?? 0} / ${st.Slow_queries ?? 0}</strong></div>
          <div class="kpi-card"><small>Row Lock Waits / Deadlocks</small><strong>${st.Innodb_row_lock_waits ?? 0} / ${st.Innodb_deadlocks ?? 0}</strong></div>
          <div class="kpi-card"><small>SELECT / Write Coms</small><strong>${st.Com_select ?? 0} / ${(st.Com_insert || 0) + (st.Com_update || 0) + (st.Com_delete || 0)}</strong></div>
          <div class="kpi-card"><small>Uptime</small><strong>${st.Uptime ?? 0} s</strong></div>
        </div>
        <h3>Active Processlist (${m.processlist.length})</h3>
        <div class="surface">${tableHTML(
          ['Id', 'User', 'DB', 'Cmd', 'Time(s)', 'State', 'SQL'],
          m.processlist.map(p => [p.id, p.user, p.db, p.command, p.time, p.state, p.info])
        )}</div>
        <h3 style="margin-top:16px">Active InnoDB Transactions (${m.transactions.length})</h3>
        <div class="surface">${tableHTML(
          ['Trx ID', 'State', 'Thread', 'Rows Locked', 'Query'],
          m.transactions.map(t => [t.trx_id, t.trx_state, t.trx_mysql_thread_id, t.trx_rows_locked, t.trx_query])
        )}</div>
        <h3 style="margin-top:16px">Top Statement Digests (Performance Schema)</h3>
        <div class="surface">${tableHTML(
          ['Schema', 'Calls', 'Avg ms', 'Rows Scanned', 'Normalized Query'],
          m.digests.map(d => [d.SCHEMA_NAME, d.calls, d.avg_ms, d.rows_examined, d.digest])
        )}</div>
      `;
    } catch (err) {
      if (version === renderVersion) $('#metricsOut', mount).innerHTML = `<p class="error">${esc(err.message)}</p>`;
    }
  }

  $('#refreshMetricsBtn', mount).onclick = load;
  $('#togglePollBtn', mount).onclick = () => {
    autoRefresh = !autoRefresh;
    $('#togglePollBtn', mount).textContent = `Auto-refresh (2s): ${autoRefresh ? 'ON' : 'OFF'}`;
    $('#togglePollBtn', mount).classList.toggle('selected', autoRefresh);
    if (monitorPollTimer) {
      clearInterval(monitorPollTimer);
      monitorPollTimer = null;
    }
    if (autoRefresh) {
      monitorPollTimer = setInterval(load, 2000);
    }
  };
  load();
}

function renderDualSessionLab(mount) {
  const clientId = getClientId();
  mount.innerHTML = `<div class="lab-panel">
    <div class="demo-actions">
      <button id="presetLockA1" type="button">Lock Wait 1: A locks Row 1</button>
      <button id="presetLockB1" type="button">Lock Wait 2: B updates Row 1 (blocks!)</button>
      <button id="presetCommitA" type="button">Lock Wait 3: A COMMIT (unblocks B)</button>
      <button id="inspectLocksBtn" class="primary" type="button">Inspect INNODB_TRX &amp; INNODB_LOCKS</button>
      <button id="innodbStatusBtn" type="button">SHOW ENGINE INNODB STATUS</button>
      <button id="resetLocksBtn" class="danger" type="button">Reset Locks Lab</button>
    </div>
    <div class="demo-actions">
      <small class="note">Deadlock sequence:</small>
      <button id="dlStep1" type="button">A: lock Row 1</button>
      <button id="dlStep2" type="button">B: lock Row 2</button>
      <button id="dlStep3" type="button">A: request Row 2 (waits)</button>
      <button id="dlStep4" type="button">B: request Row 1 (Error 1213!)</button>
    </div>
    <div class="lab-grid-2">
      <div class="session-box">
        <div class="session-head"><strong>Session A (ops_lab)</strong><span id="badgeA" class="badge">Not connected</span></div>
        <textarea id="sqlA" class="sql-editor" spellcheck="false">START TRANSACTION; UPDATE accounts SET budget = budget - 5000 WHERE id = 1;</textarea>
        <div class="demo-actions">
          <button id="runA" class="primary" type="button">Run in Session A</button>
          <button data-q="A" data-sql="COMMIT;" type="button">COMMIT A</button>
          <button data-q="A" data-sql="ROLLBACK;" type="button">ROLLBACK A</button>
        </div>
        <div id="statusA" class="status-line">Ready</div>
        <div id="outA" class="query-result"></div>
      </div>
      <div class="session-box">
        <div class="session-head"><strong>Session B (ops_lab)</strong><span id="badgeB" class="badge">Not connected</span></div>
        <textarea id="sqlB" class="sql-editor" spellcheck="false">UPDATE accounts SET budget = budget - 1000 WHERE id = 1;</textarea>
        <div class="demo-actions">
          <button id="runB" class="primary" type="button">Run in Session B</button>
          <button data-q="B" data-sql="COMMIT;" type="button">COMMIT B</button>
          <button data-q="B" data-sql="ROLLBACK;" type="button">ROLLBACK B</button>
        </div>
        <div id="statusB" class="status-line">Ready</div>
        <div id="outB" class="query-result"></div>
      </div>
    </div>
    <div id="lockInspectOut" style="margin-top:16px"></div>
  </div>`;

  async function execSlot(slot, sqlOverride) {
    const sqlBox = $(`#sql${slot}`, mount);
    const badge = $(`#badge${slot}`, mount);
    const st = $(`#status${slot}`, mount);
    const out = $(`#out${slot}`, mount);
    const sql = sqlOverride || sqlBox.value;
    if (sqlOverride) sqlBox.value = sqlOverride;

    badge.className = 'badge warn';
    badge.textContent = 'Running / Waiting…';
    st.textContent = `Executing in Session ${slot}…`;
    out.innerHTML = '';

    // Allow running sequential semicolon-separated starter macros cleanly by splitting statements
    const parts = sql
      .split(';')
      .map(s => s.trim())
      .filter(Boolean);
    try {
      let lastRes = null;
      for (const stmt of parts) {
        lastRes = await api(
          'session/query',
          { clientId, slot, sql: stmt + ';', database: 'ops_lab', persona: 'dba_lab' },
          30000
        );
      }
      badge.className = 'badge ok';
      badge.textContent = `Conn #${lastRes.connectionId}`;
      st.textContent = `Done (${lastRes.ms} ms) · ${lastRes.columns.length ? `${lastRes.count} rows` : `${lastRes.affected} affected`}`;
      out.innerHTML = lastRes.columns.length ? tableHTML(lastRes.columns, lastRes.rows) : `<p class="success result-message">${esc(lastRes.message)}</p>`;
    } catch (err) {
      badge.className = 'badge err';
      badge.textContent = err.code ? `Error ${err.code}` : 'Error';
      st.textContent = `Error${err.code ? ` (${err.code})` : ''}`;
      out.innerHTML = `<p class="error result-message">${esc(err.message)}</p>`;
    }
  }

  $('#runA', mount).onclick = () => execSlot('A');
  $('#runB', mount).onclick = () => execSlot('B');
  $$('[data-q]', mount).forEach(b => (b.onclick = () => execSlot(b.dataset.q, b.dataset.sql)));

  $('#presetLockA1', mount).onclick = () => execSlot('A', 'START TRANSACTION; UPDATE accounts SET budget = budget - 5000 WHERE id = 1;');
  $('#presetLockB1', mount).onclick = () => execSlot('B', 'UPDATE accounts SET budget = budget - 1000 WHERE id = 1;');
  $('#presetCommitA', mount).onclick = () => execSlot('A', 'COMMIT;');

  $('#dlStep1', mount).onclick = () => execSlot('A', 'START TRANSACTION; UPDATE accounts SET budget = budget - 100 WHERE id = 1;');
  $('#dlStep2', mount).onclick = () => execSlot('B', 'START TRANSACTION; UPDATE accounts SET budget = budget - 100 WHERE id = 2;');
  $('#dlStep3', mount).onclick = () => execSlot('A', 'UPDATE accounts SET budget = budget + 100 WHERE id = 2;');
  $('#dlStep4', mount).onclick = () => execSlot('B', 'UPDATE accounts SET budget = budget + 100 WHERE id = 1;');

  $('#inspectLocksBtn', mount).onclick = async () => {
    const target = $('#lockInspectOut', mount);
    target.innerHTML = '<p class="note">Inspecting INNODB_TRX &amp; INNODB_LOCKS…</p>';
    try {
      const m = await api('admin/metrics');
      target.innerHTML = `
        <h3>Active Transactions (INNODB_TRX)</h3>
        <div class="surface">${tableHTML(
          ['Trx ID', 'State', 'Thread', 'Rows Locked', 'Query'],
          m.transactions.map(t => [t.trx_id, t.trx_state, t.trx_mysql_thread_id, t.trx_rows_locked, t.trx_query])
        )}</div>
        <h3 style="margin-top:12px">Row / Table Locks (information_schema.INNODB_LOCKS)</h3>
        <div class="surface">${tableHTML(
          ['Thread', 'Table', 'Index', 'Type', 'Mode', 'Status', 'Row Key'],
          m.dataLocks.map(l => [l.thread_id, l.lock_table, l.lock_index, l.lock_type, l.lock_mode, l.lock_status, l.lock_data])
        )}</div>`;
    } catch (err) {
      target.innerHTML = `<p class="error">${esc(err.message)}</p>`;
    }
  };

  $('#innodbStatusBtn', mount).onclick = async () => {
    const target = $('#lockInspectOut', mount);
    try {
      const res = await query('SHOW ENGINE INNODB STATUS;', 'ops_lab', { persona: 'dba_lab' });
      const raw = res.rows?.[0]?.[2] || '';
      target.innerHTML = `<h3>SHOW ENGINE INNODB STATUS (LATEST DETECTED DEADLOCK &amp; TRANSACTIONS)</h3><pre class="log-viewer">${esc(raw)}</pre>`;
    } catch (err) {
      target.innerHTML = `<p class="error">${esc(err.message)}</p>`;
    }
  };

  $('#resetLocksBtn', mount).onclick = async () => {
    const res = await api('reset-unit4-locks', { clientId });
    $('#badgeA', mount).className = 'badge';
    $('#badgeA', mount).textContent = 'Reset';
    $('#badgeB', mount).className = 'badge';
    $('#badgeB', mount).textContent = 'Reset';
    $('#statusA', mount).textContent = 'Ready';
    $('#statusB', mount).textContent = 'Ready';
    $('#outA', mount).innerHTML = '';
    $('#outB', mount).innerHTML = '';
    $('#lockInspectOut', mount).innerHTML = `<p class="success">${esc(res.message)}</p>`;
  };
}

function renderBackupLab(mount, version) {
  mount.innerHTML = `<div class="lab-panel">
    <div class="demo-actions">
      <button id="bkFull" class="primary" type="button">1. Take Full Backup (mariadb-dump)</button>
      <button id="bkSchema" type="button">Schema-Only (--no-data)</button>
      <button id="bkData" type="button">Data-Only (--no-create-info)</button>
      <button id="bkCorrupt" class="danger" type="button">2. Simulate Disaster (DROP fee_ledger)</button>
      <button id="bkBinlog" type="button">4. Inspect Binary Log (mariadb-binlog)</button>
      <button id="bkReset" type="button">Reset Backup Lab</button>
    </div>
    <div id="bkCmdStrip" class="cmd-strip" hidden></div>
    <div id="bkState"></div>
    <pre id="bkPreview" class="log-viewer" hidden></pre>
  </div>`;

  async function refresh(previewText = null, cmdText = null) {
    try {
      const st = await api('admin/backup/status');
      if (version !== renderVersion) return;
      if (cmdText) {
        $('#bkCmdStrip', mount).hidden = false;
        $('#bkCmdStrip', mount).textContent = `Command: ${cmdText}`;
      }
      $('#bkState', mount).innerHTML = `
        <p class="status-line">
          Database <code>backup_lab.fee_ledger</code>:
          <span class="badge ${st.tableExists ? 'ok' : 'err'}">${st.tableExists ? `PRESENT (${st.rowCount} rows)` : 'MISSING / DROPPED!'}</span>
        </p>
        <div class="lab-grid-2" style="margin-top:12px">
          <div class="surface">
            <div class="surface-label">Live fee_ledger rows</div>
            ${st.tableExists ? tableHTML(st.columns, st.rows) : '<p class="error empty">Table fee_ledger was dropped! Restore a backup below.</p>'}
          </div>
          <div class="surface">
            <div class="surface-label">Saved .sql Backups (${st.backups.length})</div>
            ${
              st.backups.length
                ? `<div style="padding:12px">${st.backups
                    .map(
                      b =>
                        `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--line)"><span><code style="font-size:12px">${esc(
                          b.name
                        )}</code> <small class="note">(${b.sizeBytes} B)</small></span><button class="restore-btn primary" data-file="${esc(
                          b.name
                        )}" type="button">3. Restore</button></div>`
                    )
                    .join('')}</div>`
                : '<p class="empty">No backup files yet. Click "Take Full Backup" above.</p>'
            }
          </div>
        </div>`;

      $$('.restore-btn', mount).forEach(btn => {
        btn.onclick = async () => {
          try {
            const r = await api('admin/backup', { action: 'restore', filename: btn.dataset.file });
            notify(r.message);
            refresh(null, r.command);
          } catch (err) {
            notify(err.message);
          }
        };
      });

      if (previewText) {
        $('#bkPreview', mount).hidden = false;
        $('#bkPreview', mount).textContent = previewText;
      }
    } catch (err) {
      if (version === renderVersion) $('#bkState', mount).innerHTML = `<p class="error">${esc(err.message)}</p>`;
    }
  }

  $('#bkFull', mount).onclick = async () => {
    try {
      const r = await api('admin/backup', { action: 'dump' });
      notify(r.message);
      refresh(`$ ${r.command}\n\n${r.preview}`, r.command);
    } catch (err) {
      notify(err.message);
    }
  };
  $('#bkSchema', mount).onclick = async () => {
    try {
      const r = await api('admin/backup', { action: 'dump-schema' });
      notify(r.message);
      refresh(`$ ${r.command}\n\n${r.preview}`, r.command);
    } catch (err) {
      notify(err.message);
    }
  };
  $('#bkData', mount).onclick = async () => {
    try {
      const r = await api('admin/backup', { action: 'dump-data' });
      notify(r.message);
      refresh(`$ ${r.command}\n\n${r.preview}`, r.command);
    } catch (err) {
      notify(err.message);
    }
  };
  $('#bkCorrupt', mount).onclick = async () => {
    try {
      const r = await api('admin/backup', { action: 'corrupt' });
      notify(r.message);
      refresh(null, r.command);
    } catch (err) {
      notify(err.message);
    }
  };
  $('#bkBinlog', mount).onclick = async () => {
    try {
      const r = await api('admin/logs?type=binlog&lines=50');
      refresh(`# Active Binary Logs\n${r.content}`, 'mariadb-binlog --base64-output=DECODE-ROWS -v /var/log/mysql/mariadb-bin.*');
    } catch (err) {
      notify(err.message);
    }
  };
  $('#bkReset', mount).onclick = async () => {
    try {
      const r = await api('admin/backup', { action: 'reset' });
      notify(r.message);
      $('#bkPreview', mount).hidden = true;
      $('#bkCmdStrip', mount).hidden = true;
      refresh();
    } catch (err) {
      notify(err.message);
    }
  };
  refresh();
}

function openWorkspace(database = currentDatabase()) {
  const unitId = currentUnit()?.id || 'u1';
  const persona = unitId === 'u3' || unitId === 'u4' ? 'dba_lab' : 'console';
  renderQuery(
    $('#workspaceMount'),
    {
      database,
      persona,
      sql: database === 'classroom_practice' ? 'SHOW TABLES;' : 'SELECT * FROM students ORDER BY id;'
    },
    true,
    allSteps[position]?.section
  );
  $('#workspaceDialog').showModal();
}

function presentation(value = !document.body.classList.contains('presenting')) {
  document.body.classList.toggle('presenting', value);
  $('#exitPresent').hidden = !value;
  $('#presentButton').textContent = value ? 'Exit presentation' : 'Present';
  if (value && document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch(() => {});
  }
  if (!value && document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
}

function initSpeakerPopup() {
  document.body.className = `speaker-window${theme === 'dark' ? ' theme-dark' : ''}`;
  document.title = 'Speaker Notes · DBMS Classroom';
  function renderSnapshot(snap) {
    if (!snap) {
      document.body.innerHTML = '<h2>Waiting for main classroom console…</h2><p class="note">Keep this window open on your laptop screen while presenting.</p>';
      return;
    }
    document.body.innerHTML = `
      <div class="dialog-heading">
        <div>
          <p class="eyebrow">Private Speaker View · ${esc(snap.unitLabel)} · Step ${snap.position + 1}/${snap.total}</p>
          <h1>${esc(snap.title)}</h1>
        </div>
        <div class="footer-nav">
          <button id="spkPrev" type="button" ${snap.position <= 0 ? 'disabled' : ''}>← Prev</button>
          <button id="spkNext" class="primary" type="button" ${snap.position >= snap.total - 1 ? 'disabled' : ''}>Next →</button>
        </div>
      </div>
      <div class="speaker-card">
        <p class="eyebrow">Teacher Notes (off-projector)</p>
        <div class="speaker-notes-box">${esc(snap.notes)}</div>
        <p class="eyebrow">Class Discussion Prompt</p>
        <p>${esc(snap.question)}</p>
        <p class="eyebrow" style="margin-top:16px">Model Answer</p>
        <div class="answer">${formatAnswerHTML(snap.answer)}</div>
      </div>`;
    $('#spkPrev').onclick = () => channel?.postMessage({ type: 'nav', delta: -1 });
    $('#spkNext').onclick = () => channel?.postMessage({ type: 'nav', delta: 1 });
  }

  try {
    const initial = JSON.parse(localStorage.getItem('dbms-classroom-speaker-snapshot') || 'null');
    renderSnapshot(initial);
  } catch {
    renderSnapshot(null);
  }

  if (channel) {
    channel.onmessage = e => {
      if (e.data?.type === 'sync') renderSnapshot(e.data);
      if (e.data?.type === 'theme') document.body.classList.toggle('theme-dark', e.data.theme === 'dark');
    };
  }
  window.addEventListener('storage', e => {
    if (e.key === 'dbms-classroom-speaker-snapshot' && e.newValue) {
      try {
        renderSnapshot(JSON.parse(e.newValue));
      } catch {}
    }
    if (e.key === STORAGE_THEME) {
      document.body.classList.toggle('theme-dark', e.newValue === 'dark');
    }
  });
}

const CHEAT_SHEETS = {
  u1: `<h3>Unit 1 · Introductory Concepts of DBMS</h3>
    <div class="surface">${tableHTML(['Topic', 'Key Takeaway'], [
      ['Three-Schema Architecture', 'External (User Views) ↔ Conceptual (Global Logical Schema) ↔ Internal (Physical Storage)'],
      ['Mappings & Independence', 'External–Conceptual Mapping enables Logical Independence; Conceptual–Internal Mapping enables Physical Independence'],
      ['DBMS Architecture', 'Query Processor (DDL Interpreter, DML Compiler, Evaluation Engine) + Storage Manager (Auth/Integrity, Tx, File, Buffer)'],
      ['User Categories', 'Naive (Forms), Application Programmers (Drivers), Sophisticated (Ad-hoc SQL), Specialized (Domain tools), DBA'],
      ['Integrity & Keys', 'Entity (PK unique & NOT NULL), Referential (FK matches parent or NULL), Domain (Types + CHECK)']
    ])}</div>`,
  u2: `<h3>Unit 2 · SQL Concepts Quick Reference</h3>
    <div class="surface">${tableHTML(['Concept', 'Syntax / Execution Rule'], [
      ['Execution Order', 'FROM / JOIN (+ ON) → WHERE → GROUP BY → HAVING → SELECT / DISTINCT → ORDER BY → LIMIT'],
      ['DDL / DML / DCL / TCL', 'DDL: CREATE/ALTER/DROP/TRUNCATE (auto-commit) | DML: INSERT/UPDATE/DELETE/SELECT | DCL: GRANT/REVOKE | TCL: COMMIT/ROLLBACK'],
      ['5 Constraints', 'PRIMARY KEY, FOREIGN KEY (ON DELETE/UPDATE), UNIQUE, NOT NULL, CHECK (expr)'],
      ['Joins & Set Ops', 'INNER, LEFT, RIGHT, FULL OUTER (LEFT UNION RIGHT), CROSS, SELF | UNION, UNION ALL, INTERSECT, EXCEPT'],
      ['Views & Types', 'Simple (single table, updatable) vs Complex (JOIN/GROUP BY, read-only); WITH CHECK OPTION rejects out-of-filter writes (1369)'],
      ['Built-in Functions', 'Numeric: ABS, ROUND, TRUNCATE, CEIL, FLOOR, MOD, SQRT | String: UPPER, LOWER, CHAR_LENGTH, CONCAT, SUBSTRING, TRIM | Date: DATEDIFF, DATE_ADD, DATE_FORMAT']
    ])}</div>`,
  u3: `<h3>Unit 3 · MariaDB Concepts, Security &amp; Auth</h3>
    <div class="surface">${tableHTML(['Topic', 'Key Commands & Concepts'], [
      ['CRUD & Connections', 'CREATE/DROP DATABASE, USE db, SHOW TABLES | USER() vs CURRENT_USER(), bind-address, TCP vs Unix socket'],
      ['InnoDB Storage & Logs', 'innodb_file_per_table=ON (*.ibd 16KB B+Tree pages), ibdata1 + Doublewrite, Redo Log (crash recovery), Undo Log (ROLLBACK/MVCC)'],
      ['Buffers & Data Dictionary', 'innodb_buffer_pool_size, innodb_log_buffer_size, table_open_cache | INFORMATION_SCHEMA, mysql.user/global_priv, PERFORMANCE_SCHEMA'],
      ['Users, Roles & Plugins', "CREATE ROLE r; GRANT ... TO r; SET DEFAULT ROLE r FOR u | Auth plugins: ed25519, mysql_native_password, unix_socket, pam, parsec"],
      ['SQLi, TLS & Passwords', 'Prepared statements (?) block SQLi | REQUIRE SSL + ca.pem | INSTALL SONAME simple_password_check; ACCOUNT LOCK; PASSWORD EXPIRE']
    ])}</div>`,
  u4: `<h3>Unit 4 · Monitoring &amp; Maintenance of MariaDB</h3>
    <div class="surface">${tableHTML(['Topic', 'Key Commands & Concepts'], [
      ['5 Log Files', 'error.log (crashes/startup), slow.log (long_query_time), general.log (debug all), mariadb-bin.* (PITR/replication), audit.log (server_audit)'],
      ['Monitoring & Tuning', 'SHOW FULL PROCESSLIST; KILL [QUERY] id; SHOW GLOBAL STATUS; EXPLAIN (ALL full scan vs ref index) | Capacity: DATA_LENGTH + INDEX_LENGTH + DATA_FREE'],
      ['Locks & Deadlocks', 'INNODB_TRX (LOCK WAIT), INNODB_LOCKS (GRANTED/WAITING), SHOW ENGINE INNODB STATUS; Error 1213 = Deadlock cycle victim rolled back'],
      ['Backup Types & Tools', 'Logical (mariadb-dump --single-transaction) vs Physical (mariadb-backup) | Full / Incremental / Differential | Hot vs Cold | PITR = Full + mariadb-binlog']
    ])}</div>`
};

function openSearchModal() {
  const dlg = $('#searchDialog');
  const input = $('#searchInput');
  const results = $('#searchResults');
  function renderList(term) {
    const q = term.trim().toLowerCase();
    const matches = allSteps
      .map((item, idx) => ({ ...item, idx }))
      .filter(({ section, step }) => {
        if (!q) return true;
        const hay = [
          section.number,
          section.title,
          step.title,
          step.lead,
          step.question,
          step.sql || '',
          ...(step.presets || []).flat()
        ]
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 24);

    if (!matches.length) {
      results.innerHTML = '<p class="empty">No matching lesson steps found.</p>';
      return;
    }
    results.innerHTML = matches
      .map(({ section, step, idx }) => {
        const uNum = COURSE.units.findIndex(u => u.id === section.unit) + 1;
        return `<button class="search-item" data-jump="${idx}" type="button"><strong>Unit ${uNum} · ${esc(section.number)} ${esc(
          step.title
        )}</strong><small>${esc(section.title)} · ${esc(step.type)}</small></button>`;
      })
      .join('');
    $$('.search-item', results).forEach(btn => {
      btn.onclick = () => {
        dlg.close();
        go(Number(btn.dataset.jump));
      };
    });
  }
  input.oninput = () => renderList(input.value);
  input.onkeydown = e => {
    if (e.key === 'Enter') {
      const first = $('.search-item', results);
      if (first) {
        e.preventDefault();
        first.click();
      }
    }
  };
  renderList(input.value);
  dlg.showModal();
  input.focus();
}

function openCheatSheetModal(unitId) {
  const dlg = $('#cheatsheetDialog');
  const body = $('#cheatsheetBody');
  function selectTab(id) {
    $$('[data-cheat]', dlg).forEach(b => b.classList.toggle('selected', b.dataset.cheat === id));
    body.innerHTML = CHEAT_SHEETS[id] || CHEAT_SHEETS.u2;
  }
  $$('[data-cheat]', dlg).forEach(b => (b.onclick = () => selectTab(b.dataset.cheat)));
  selectTab(unitId || currentUnit()?.id || 'u2');
  dlg.showModal();
}

if (isSpeakerPopup) {
  initSpeakerPopup();
} else {
  applyTheme(theme);
  try {
    if (localStorage.getItem(STORAGE_SIDEBAR) === '1') applySidebarState(true);
  } catch {}

  document.body.classList.toggle('student-mode', mode === 'student');
  $('#modeInstructor').classList.toggle('active', mode === 'instructor');
  $('#modeStudent').classList.toggle('active', mode === 'student');
  $('#modeInstructor').onclick = () => saveMode('instructor');
  $('#modeStudent').onclick = () => saveMode('student');

  $('#sidebarToggle').onclick = () => applySidebarState(!document.body.classList.contains('sidebar-collapsed'));
  $('#themeButton').onclick = () => applyTheme(theme === 'dark' ? 'light' : 'dark');
  $('#searchButton').onclick = openSearchModal;
  $('#cheatsheetButton').onclick = () => openCheatSheetModal(currentUnit()?.id);
  $('#dbeaverButton').onclick = () => $('#dbeaverDialog').showModal();

  $$('.copy-btn').forEach(btn => {
    btn.onclick = async () => {
      const text = btn.dataset.copy || '';
      try {
        await navigator.clipboard.writeText(text);
        notify(`Copied "${text}"`);
      } catch {
        notify(`Value: ${text}`);
      }
    };
  });

  $('#courseButton').onclick = () => $('#courseDialog').showModal();
  $('#unitList').innerHTML = COURSE.units
    .map(
      (unit, i) =>
        `<button class="unit-card" data-unit="${unit.id}" type="button"><span class="unit-number">0${i + 1}</span><span><strong>${esc(
          unit.title
        )}</strong><small>${unit.hours} teaching hours · ${sections.filter(s => s.unit === unit.id).length} sections available</small></span><span>Open →</span></button>`
    )
    .join('');
  $$('[data-unit]').forEach(b => {
    b.onclick = () => {
      $('#courseDialog').close();
      go(allSteps.findIndex(item => item.section.unit === b.dataset.unit));
    };
  });

  $('#workspaceButton').onclick = () => openWorkspace();
  $('#presentButton').onclick = () => presentation();
  $('#exitPresent').onclick = () => presentation(false);
  $('#notesButton').onclick = () => {
    $('#notesDialog').showModal();
    $('#notesButton').setAttribute('aria-expanded', 'true');
  };
  $('#popoutNotesButton').onclick = () => {
    broadcastSpeakerState();
    window.open(`${location.pathname}?presenter=1`, 'dbms-speaker-notes', 'width=620,height=720');
    $('#notesDialog').close();
  };
  $('#notesDialog').addEventListener('close', () => $('#notesButton').setAttribute('aria-expanded', 'false'));
  $$('[data-close]').forEach(b => (b.onclick = () => document.getElementById(b.dataset.close).close()));
  $('#prevButton').onclick = () => go(position - 1);
  $('#nextButton').onclick = () => go(position + 1);

  $('#confirmReset').onclick = async () => {
    if (!resetTarget) return;
    $('#confirmReset').disabled = true;
    try {
      const result = await api(resetTarget.endpoint, {
        database: resetTarget.database,
        clientId: getClientId()
      });
      if (resetTarget.status) resetTarget.status.textContent = result.message;
      if (resetTarget.resultMount) resetTarget.resultMount.innerHTML = '';
      if (resetTarget.database === 'sql_lab' && resetTarget.endpoint === 'reset-unit2') {
        unit2ReadyPromise = null;
      }
      if (resetTarget.onDone) resetTarget.onDone(result);
      $('#resetDialog').close();
      notify(result.message);
    } catch (error) {
      notify(error.message);
    } finally {
      $('#confirmReset').disabled = false;
    }
  };

  if (channel) {
    channel.onmessage = e => {
      if (e.data?.type === 'nav') {
        go(position + Number(e.data.delta || 0));
      }
    };
  }

  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openSearchModal();
      return;
    }
    if (
      $$('dialog[open]').length ||
      e.ctrlKey ||
      e.metaKey ||
      e.altKey ||
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)
    ) {
      return;
    }
    if (e.key === '/') {
      e.preventDefault();
      openSearchModal();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(position + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(position - 1);
    } else if (e.key === 'Escape') {
      presentation(false);
    }
  });

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
      document.body.classList.remove('presenting');
      $('#exitPresent').hidden = true;
      $('#presentButton').textContent = 'Present';
    }
  });

  window.addEventListener('hashchange', () => {
    const index = locate(location.hash);
    if (index >= 0) go(index, false);
  });

  const adminerInit = $('#adminerLink');
  if (adminerInit) {
    adminerInit.href = `${location.protocol}//${location.hostname}:8081`;
  }

  updateProgressSummary();
  go(readPosition());
  health();
}

'use strict';
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const esc = value => String(value ?? 'NULL').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sections = COURSE.sections;
const allSteps = sections.flatMap(section => section.steps.map(step => ({section, step})));
const storageKey = 'dbms-classroom-position-v2';
let position = 0, renderVersion = 0, resetTarget = null, toastTimer;
const practiceDefinition = 'CREATE TABLE IF NOT EXISTS lab_students (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(100) NOT NULL, email VARCHAR(120) NOT NULL UNIQUE, age INT CHECK (age >= 16))';

function notify(message) {
  $('#toast').textContent = message; $('#toast').hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 4200);
}
function pathOf(item) { return `${item.section.id}/${item.step.id}`; }
function locate(path) { return allSteps.findIndex(item => pathOf(item) === path.replace(/^#/, '')); }
function readPosition() {
  if (location.hash && locate(location.hash) >= 0) return locate(location.hash);
  try { const saved = locate(localStorage.getItem(storageKey) || ''); if (saved >= 0) return saved; } catch (_) {}
  return 0;
}
async function api(path, body) {
  const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`/api/${path}`, {method: body ? 'POST' : 'GET', headers: body ? {'Content-Type':'application/json'} : {}, body: body ? JSON.stringify(body) : undefined, signal: controller.signal});
    let result;
    try { result = await response.json(); } catch (_) { throw new Error('The classroom service is unavailable. Start the Docker lab and try again.'); }
    if (!response.ok) throw new Error(result.error || 'Request failed.');
    return result;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('The request timed out. Check the Docker lab and retry.');
    if (error instanceof TypeError) throw new Error('Could not reach the classroom service. Check Docker and retry.');
    throw error;
  } finally { clearTimeout(timeout); }
}
function query(sql, database = 'college_demo') { return api('query', {sql, database}); }
async function health() {
  try { const result = await api('health'); $('#health').textContent = '● MariaDB connected'; $('#health').className = 'connection ready'; $('#health').title = result.version; }
  catch (_) { $('#health').textContent = '○ MariaDB unavailable'; $('#health').className = 'connection offline'; }
}
function tableHTML(columns, rows, options = {}) {
  return `<div class="table-scroll"><table class="data-table"><thead><tr>${columns.map((c,i) => `<th>${options.interactive ? `<button class="column-focus" data-col="${i}" title="Highlight ${esc(c)}">${esc(c)}</button>` : esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map((row,i) => `<tr${options.interactive ? ` tabindex="0" data-row="${i}" aria-label="Highlight record ${i+1}"` : ''}>${row.map((value,j) => `<td${options.interactive ? ` data-col="${j}"` : ''}>${value === null ? '<em class="null">NULL</em>' : esc(value)}</td>`).join('')}</tr>`).join('')}</tbody></table>${rows.length === 0 ? '<p class="empty">No rows returned. The result still has the columns shown above.</p>' : ''}</div>`;
}
function cardsHTML(cards) { return `<div class="cards">${cards.map(([title,text],i) => `<div class="card"><span class="card-number">0${i+1}</span><h3>${esc(title)}</h3><p>${esc(text)}</p></div>`).join('')}</div>`; }
function renderNav(section, step) {
  $('#sectionNav').innerHTML = sections.map(s => `<button class="section-link ${s === section ? 'active' : ''}" data-section="${s.id}" ${s === section ? 'aria-current="step"' : ''}><span>${s.number}</span><strong>${esc(s.title)}</strong><small>${s.minutes} min</small></button>`).join('');
  $$('.section-link').forEach(button => button.onclick = () => go(allSteps.findIndex(item => item.section.id === button.dataset.section)));
  const localIndex = section.steps.indexOf(step);
  $('#sectionLabel').textContent = `UNIT 1 / ${section.number} ${section.title}`;
  $('#stepCount').textContent = `Step ${localIndex+1} of ${section.steps.length} · ${section.minutes} min section`;
  $('#stepRail').innerHTML = section.steps.map((s,i) => `<button class="step-dot ${i === localIndex ? 'active' : ''} ${i < localIndex ? 'past' : ''}" data-step="${s.id}" aria-label="Step ${i+1}: ${esc(s.title)}" title="${esc(s.title)}" ${i === localIndex ? 'aria-current="step"' : ''}></button>`).join('');
  $$('.step-dot').forEach(b => b.onclick = () => go(allSteps.findIndex(item => item.step.id === b.dataset.step)));
  $('#unitProgress').style.width = `${(position+1)/allSteps.length*100}%`;
  $('#unitCount').textContent = `Teaching step ${position+1} of ${allSteps.length}`;
  $('#footerLabel').textContent = `${section.number} · ${section.title}`;
  $('#prevButton').disabled = position === 0;
  const next = allSteps[position+1];
  $('#nextButton').textContent = !next ? 'Unit 1 complete ✓' : next.section !== section ? `Next: ${next.section.title} →` : 'Next →';
  $('#nextButton').disabled = !next;
}
function go(index, updateHash = true) {
  if (index < 0 || index >= allSteps.length) return;
  position = index;
  const {section, step} = allSteps[position], version = ++renderVersion;
  if (updateHash) history.replaceState(null, '', `#${pathOf(allSteps[position])}`);
  try { localStorage.setItem(storageKey, pathOf(allSteps[position])); $('#savedLabel').textContent = 'Your place is saved on this browser'; } catch (_) { $('#savedLabel').textContent = 'Use the page link to save your place'; }
  document.title = `${section.number} ${section.title} · DBMS Classroom`;
  renderNav(section, step);
  $('#lesson').innerHTML = `<p class="eyebrow mint">${esc(section.objective)}</p><h1>${esc(step.title)}</h1><p class="lead">${esc(step.lead)}</p><div id="demo" class="demo"></div>`;
  $('#discussion').innerHTML = `<div class="discussion-top"><span class="eyebrow">ASK THE ROOM</span><button id="revealButton" aria-expanded="false" aria-controls="answer">Reveal answer</button></div><p>${esc(step.question)}</p><div id="answer" class="answer" hidden>${step.type === 'challenge' && step.answer.includes('CREATE TABLE') ? `<pre>${esc(step.answer)}</pre>` : esc(step.answer)}</div>`;
  $('#revealButton').onclick = () => {const hidden = $('#answer').hidden;$('#answer').hidden = !hidden;$('#revealButton').textContent = hidden ? 'Hide answer' : 'Reveal answer';$('#revealButton').setAttribute('aria-expanded', String(hidden));};
  $('#notesTitle').textContent = step.title; $('#notesText').textContent = step.notes;
  if ($('#notesDialog').open) $('#notesDialog').close();
  $('#notesButton').setAttribute('aria-expanded','false');
  renderDemo(step, version); $('#main').scrollTop = 0;
}
function renderDemo(step, version) {
  const mount = $('#demo');
  switch (step.type) {
    case 'cards': mount.innerHTML = cardsHTML(step.cards); break;
    case 'comparison': mount.innerHTML = `<div class="surface">${tableHTML(step.columns, step.rows)}</div>`; break;
    case 'timeline': mount.innerHTML = `<div class="timeline">${step.items.map(([title,text],i) => `<div class="timeline-item"><span>${i+1}</span><div><h3>${esc(title)}</h3><p>${esc(text)}</p></div></div>`).join('')}</div>`; break;
    case 'quiz': renderQuiz(mount, step); break;
    case 'copies': renderCopies(mount); break;
    case 'explorer': renderExplorer(mount, version); break;
    case 'integrity': renderIntegrity(mount); break;
    case 'relationship': renderRelationship(mount, step.mode, version); break;
    case 'schema-instance': renderSchemaInstance(mount); break;
    case 'layers': renderLayers(mount); break;
    case 'pipeline': renderPipeline(mount); break;
    case 'query': renderQuery(mount, step); break;
    case 'challenge': mount.innerHTML = `<div class="challenge"><span class="challenge-icon">✎</span><div><h3>Pause for student work</h3><p>Discuss the assumptions. Sketch the design. Explain why it works.</p><button id="challengeWorkspace">Open SQL workspace</button></div></div>`; $('#challengeWorkspace').onclick = () => openWorkspace('classroom_practice'); break;
  }
}
function renderQuiz(mount, step) {
  mount.innerHTML = `<div class="quiz" role="group" aria-label="Knowledge check">${step.options.map((option,i) => `<button class="quiz-option" data-option="${i}"><span>${String.fromCharCode(65+i)}</span>${esc(option)}</button>`).join('')}<p class="quiz-feedback" aria-live="polite"></p></div>`;
  $$('.quiz-option',mount).forEach(button => button.onclick = () => {const correct = Number(button.dataset.option) === step.correct;$$('.quiz-option', mount).forEach(b => b.classList.remove('correct','incorrect'));button.classList.add(correct ? 'correct' : 'incorrect');$('.quiz-feedback', mount).textContent = correct ? `Correct. ${step.feedback}` : 'Try again. Explain what this answer assumes before choosing another.';});
}
function renderCopies(mount) {
  let changed = false, shared = false;
  function draw() {
    mount.innerHTML = `<p class="demo-caption">ILLUSTRATIVE RECORDS · NO DATABASE CHANGES</p><div class="cards">${['Admissions','Accounts','Teaching office'].map((name,i) => `<div class="card ${changed && !shared && i === 0 ? 'warning' : ''}"><span class="eyebrow">${name}</span><h3>${changed && (shared || i === 0) ? 'Cyber Defence' : 'Cybersecurity'}</h3><p>${shared ? 'Reads shared courses.id = 101' : 'A separate copy of course 101'}</p></div>`).join('')}</div><div class="demo-actions"><button id="changeCopy">${changed ? 'Restore original names' : 'Update admissions copy'}</button><button id="shareCopy">${shared ? 'Return to separate copies' : 'Use a shared course record'}</button></div><p class="status-line" aria-live="polite">${shared ? 'One course record supplies the name wherever its ID is referenced.' : changed ? 'The copies now disagree about course 101.' : 'The copies agree for now. Try updating just one.'}</p>`;
    $('#changeCopy').onclick = () => { changed = !changed; draw(); }; $('#shareCopy').onclick = () => { shared = !shared; draw(); };
  }
  draw();
}
async function renderExplorer(mount, version) {
  mount.innerHTML = '<div class="demo-actions">'+['students','courses','enrollments'].map(name => `<button data-table="${name}">${name}</button>`).join('')+'</div><div class="surface" id="explorerTable"></div><p class="status-line" id="explorerStatus" aria-live="polite"></p>';
  let request = 0;
  async function loadTable(name) {
    const mine = ++request, target = $('#explorerTable', mount); target.innerHTML = '<p class="empty">Reading MariaDB…</p>';
    $$('[data-table]',mount).forEach(b => b.classList.toggle('selected',b.dataset.table === name));
    try {
      const result = await query(`SELECT * FROM ${name} ORDER BY id;`);
      if (version !== renderVersion || request !== mine) return;
      target.innerHTML = tableHTML(result.columns, result.rows, {interactive:true});
      $('#explorerStatus').textContent = `${result.count} records · ${result.columns.length} attributes · click a heading or record to highlight it`;
      $$('.column-focus', target).forEach(b => b.onclick = () => {$$('td',target).forEach(cell => cell.classList.toggle('highlight',cell.dataset.col === b.dataset.col));$$('tr',target).forEach(row => row.classList.remove('highlight'));$('#explorerStatus').textContent = `Column / attribute: ${result.columns[Number(b.dataset.col)]}${name === 'students' && b.dataset.col === '4' ? ' — primary course reference' : ''}`;});
      $$('[data-row]',target).forEach(row => {const select = () => {$$('td',target).forEach(c => c.classList.remove('highlight'));$$('[data-row]',target).forEach(r => r.classList.toggle('highlight',r===row));$('#explorerStatus').textContent = `One ${name === 'students' ? 'student' : name === 'courses' ? 'course' : 'enrollment'} record · ID ${result.rows[Number(row.dataset.row)][0]}`;};row.onclick = select;row.onkeydown = e => {if(e.key==='Enter'||e.key===' '){e.preventDefault();select();}};});
    } catch (error) { if (version === renderVersion && request === mine) target.innerHTML = `<p class="error">${esc(error.message)}</p>`; }
  }
  $$('[data-table]',mount).forEach(b => b.onclick = () => loadTable(b.dataset.table)); loadTable('students');
}
function renderIntegrity(mount) {
  const candidates = [
    {label:'Duplicate ID', row:[1,'New learner',101], ok:false, message:'Rejected: primary key 1 already identifies an existing student.'},
    {label:'Missing course', row:[6,'New learner',999], ok:false, message:'Rejected: course 999 does not exist, so the foreign-key reference is invalid.'},
    {label:'Valid candidate', row:[6,'New learner',101], ok:true, message:'Accepted by these illustrated rules: unused student ID, existing course ID.'}
  ];
  mount.innerHTML = `<p class="demo-caption">RULE ILLUSTRATION · EXISTING STUDENT IDS 1–5 · COURSE IDS 101–103</p><div class="demo-actions">${candidates.map((c,i) => `<button data-candidate="${i}">${c.label}</button>`).join('')}</div><div id="candidateView" class="surface"><p class="empty">Choose a candidate and predict the outcome.</p></div><p id="candidateResult" class="status-line" aria-live="polite"></p>`;
  $$('[data-candidate]',mount).forEach(b => b.onclick = () => {const candidate = candidates[Number(b.dataset.candidate)];$('#candidateView').innerHTML = tableHTML(['id PRIMARY KEY','name','course_id FOREIGN KEY'], [candidate.row]);$('#candidateResult').textContent = candidate.message;$('#candidateResult').className = `status-line ${candidate.ok ? 'success' : 'error'}`;});
}
async function renderRelationship(mount, mode, version) {
  mount.innerHTML = '<p class="empty">Reading connected records from MariaDB…</p>';
  try {
    const [students,courses,enrollments] = await Promise.all(['students','courses','enrollments'].map(t => query(`SELECT * FROM ${t} ORDER BY id;`)));
    if (version !== renderVersion) return;
    const asObjects = result => result.rows.map(row => Object.fromEntries(result.columns.map((c,i) => [c,row[i]])));
    const s = asObjects(students), c = asObjects(courses), e = asObjects(enrollments), options = mode === 'primary' ? c : s;
    mount.innerHTML = `<div class="relation-map"><div><strong>${mode === 'primary' ? 'courses' : 'students'}</strong><code>id · PRIMARY KEY</code></div><span>1 → many</span><div><strong>${mode === 'primary' ? 'students' : 'enrollments'}</strong><code>${mode === 'primary' ? 'course_id · FOREIGN KEY' : 'student_id + course_id'}</code></div>${mode !== 'primary' ? '<span>many → 1</span><div><strong>courses</strong><code>id · PRIMARY KEY</code></div>' : ''}</div><div class="demo-actions">${options.map(o => `<button data-choice="${o.id}">${esc(mode === 'primary' ? o.course_name : o.name)} <small>#${o.id}</small></button>`).join('')}</div><div id="relatedRows" class="surface"></div><p id="relationshipStatus" class="status-line" aria-live="polite"></p>`;
    function select(id) {
      $$('[data-choice]',mount).forEach(b => b.classList.toggle('selected', b.dataset.choice === String(id)));
      const rows = mode === 'primary' ? s.filter(student => Number(student.course_id) === Number(id)).map(student => [student.id,student.name,student.course_id,c.find(course => Number(course.id) === Number(id))?.course_name]) : e.filter(enrollment => Number(enrollment.student_id) === Number(id)).map(enrollment => [enrollment.id,enrollment.student_id,enrollment.course_id,c.find(course => Number(course.id) === Number(enrollment.course_id))?.course_name]);
      $('#relatedRows').innerHTML = tableHTML(mode === 'primary' ? ['student_id','name','primary_course_id','course_name'] : ['enrollment_id','student_id','course_id','course_name'], rows);
      $('#relationshipStatus').textContent = `${rows.length} matching ${mode === 'primary' ? 'student' : 'enrollment'} records · ${mode === 'primary' ? 'students.course_id denotes primary course in this lab' : 'Enrollments record course participation, separately from primary-course assignment'}`;
    }
    $$('[data-choice]',mount).forEach(b => b.onclick = () => select(b.dataset.choice)); if(options.length) select(options[0].id);
  } catch (error) { if (version === renderVersion) mount.innerHTML = `<p class="error">${esc(error.message)}</p>`; }
}
function renderSchemaInstance(mount) {
  let extraRow = false, extraColumn = false;
  function draw() {
    const columns = ['id','name',...(extraColumn ? ['age'] : [])], rows = [[1,'Aman'],[2,'Riya'],...(extraRow ? [[3,'Kabir']] : [])].map((row,i) => extraColumn ? [...row,[25,19,22][i]] : row);
    mount.innerHTML = `<p class="demo-caption">ILLUSTRATION · NO DATABASE CHANGES</p><div class="split"><div class="card"><p class="eyebrow">SCHEMA</p><pre>id   INT PRIMARY KEY\nname VARCHAR(100)${extraColumn ? '\nage  INT' : ''}</pre><p>The definition: ${columns.length} attributes.</p></div><div class="surface"><div class="surface-label">INSTANCE · ${rows.length} ROWS NOW</div>${tableHTML(columns,rows)}</div></div><div class="demo-actions"><button id="addRow">${extraRow ? 'Remove illustrative row' : 'Add illustrative row'}</button><button id="addColumn">${extraColumn ? 'Restore original schema' : 'Add an age column'}</button></div>`;
    $('#addRow').onclick = () => {extraRow=!extraRow;draw();};$('#addColumn').onclick = () => {extraColumn=!extraColumn;draw();};
  }
  draw();
}
function renderLayers(mount) {
  const layers = [
    ['External','What this audience sees',['student_name','course'],[['Aman','Cybersecurity'],['Riya','Database Security']],'A teacher-facing roster exposes selected facts. Other users may have different views.'],
    ['Conceptual','The overall logical model',['Table','Key / relationship'],[['students','id; course_id references courses'],['courses','id'],['enrollments','id; student_id + course_id']],'Tables, attributes, constraints and relationships describe the logical system.'],
    ['Internal','How it is represented in storage',['Structure','Purpose'],[['Data pages','Store records in the storage engine'],['Indexes','Provide access paths'],['Files and cached pages','Persist data and support efficient access']],'A simplified storage view. Applications do not need the page layout to request student names.']
  ];
  mount.innerHTML = `<div class="demo-actions">${layers.map(([name],i) => `<button data-layer="${i}">${i+1}. ${name}</button>`).join('')}</div><div id="layerView" class="surface"></div><p class="status-line" id="layerNote"></p>`;
  function select(i) {const layer=layers[i];$$('[data-layer]',mount).forEach(b=>b.classList.toggle('selected',Number(b.dataset.layer)===i));$('#layerView').innerHTML=`<div class="surface-label">${esc(layer[1])}</div>${tableHTML(layer[2],layer[3])}`;$('#layerNote').textContent=layer[4];}
  $$('[data-layer]',mount).forEach(b=>b.onclick=()=>select(Number(b.dataset.layer)));select(0);
}
function renderPipeline(mount) {
  const stages = [['Request','The client sends SQL using an authenticated database connection.'],['Parse & resolve','MariaDB checks syntax, resolves table and column references, and performs required access checks.'],['Plan','The optimizer chooses an execution strategy and available access paths.'],['Execute','The server and storage engine retrieve matching records, using memory and storage as needed.'],['Return','The result travels back to the client and is rendered as a table.']];
  let stage=0;
  function draw() {
    mount.innerHTML=`<pre class="query-banner">SELECT name FROM students WHERE id = 1;</pre><div class="pipeline">${stages.map(([name],i)=>`<button data-stage="${i}" class="${i===stage?'selected':''}"><span>${i+1}</span>${name}</button>`).join('')}</div><div class="card pipeline-detail"><h3>${stages[stage][0]}</h3><p>${stages[stage][1]}</p><button id="advancePipeline">${stage===stages.length-1?'Trace again ↺':'Follow query →'}</button></div>`;
    $$('[data-stage]',mount).forEach(b=>b.onclick=()=>{stage=Number(b.dataset.stage);draw();});$('#advancePipeline').onclick=()=>{stage=(stage+1)%stages.length;draw();};
  }
  draw();
}
function renderQuery(mount, config, workspace=false) {
  const isPractice=config.database==='classroom_practice', presets=config.presets||[];
  mount.innerHTML=`<div class="query-shell"><div class="query-toolbar"><label>Database <select class="database-select" aria-label="Query database"><option value="college_demo" ${!isPractice?'selected':''}>college_demo · read only</option><option value="classroom_practice" ${isPractice?'selected':''}>classroom_practice · editable</option></select></label><span>REAL MARIADB</span></div>${presets.length?`<div class="query-presets">${presets.map(([title],i)=>`<button data-preset="${i}">${esc(title)}</button>`).join('')}</div>`:''}<textarea class="sql-editor" aria-label="SQL query" spellcheck="false">${esc(config.sql||'SHOW TABLES;')}</textarea><div class="query-actions"><span class="note">One statement per run · ⌘ / Ctrl + Enter</span><div>${config.setup?'<button class="prepare-query">Prepare example</button>':''}${isPractice||workspace?'<button class="reset-practice">Reset lab_students</button>':''}<button class="run-query primary">▶ Run query</button></div></div><div class="query-status" role="status">Ready to run${config.expected?' · predict the result first':''}</div><div class="query-result"></div></div>${config.expected?`<details class="expected"><summary>Expected outcome · teacher reference</summary><p>${esc(config.expected)}</p></details>`:''}${config.setup?`<p class="note">Prepare example creates lab_students if missing${config.seedPractice?' and adds missing sample emails':''}. It preserves existing practice records.</p>`:''}`;
  const editor=$('.sql-editor',mount), select=$('.database-select',mount), status=$('.query-status',mount), resultMount=$('.query-result',mount), runButton=$('.run-query',mount);
  let busy=false;
  async function run() {
    if(busy)return;
    busy=true;runButton.disabled=true;status.textContent='Running in MariaDB…';resultMount.innerHTML='';
    try {
      const result=await query(editor.value,select.value);
      resultMount.innerHTML=result.columns.length?tableHTML(result.columns,result.rows):`<p class="success result-message">${esc(result.message)} ${result.affected} row(s) affected.</p>`;
      status.textContent=`${select.value} · ${result.columns.length?`${result.count} row(s) returned`:`${result.affected} row(s) affected`} · ${result.ms} ms${result.truncated?' · showing first 200 rows':''}`;health();
    }catch(error){status.textContent='MariaDB request failed';resultMount.innerHTML=`<p class="error result-message">${esc(error.message)}</p>`;}
    finally{busy=false;runButton.disabled=false;}
  }
  runButton.onclick=run;
  editor.onkeydown=e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();run();}};
  $$('[data-preset]',mount).forEach(b=>b.onclick=()=>{editor.value=presets[Number(b.dataset.preset)][1];status.textContent='Example loaded · predict, then run';resultMount.innerHTML='';});
  if($('.prepare-query',mount))$('.prepare-query',mount).onclick=async event=>{
    if(busy)return;
    busy=true;event.target.disabled=true;runButton.disabled=true;
    try {
      await query(practiceDefinition,'classroom_practice');
      if(config.seedPractice)for(const[name,email,age]of[['Aman','aman.lab@example.com',25],['Riya','riya.lab@example.com',19],['Kabir','kabir.lab@example.com',22]])await query(`INSERT INTO lab_students (name,email,age) SELECT '${name}','${email}',${age} WHERE NOT EXISTS (SELECT 1 FROM lab_students WHERE email='${email}');`,'classroom_practice');
      select.value='classroom_practice';status.textContent='Example prepared · run the loaded statement';resultMount.innerHTML='';
    }catch(error){resultMount.innerHTML=`<p class="error result-message">${esc(error.message)}</p>`;}
    finally{busy=false;event.target.disabled=false;runButton.disabled=false;}
  };
  if($('.reset-practice',mount))$('.reset-practice',mount).onclick=()=>{resetTarget={status,resultMount};$('#resetDialog').showModal();};
}
function openWorkspace(database='college_demo') {renderQuery($('#workspaceMount'),{database,sql:database==='college_demo'?'SELECT * FROM students ORDER BY id;':'SHOW TABLES;'},true);$('#workspaceDialog').showModal();}
function presentation(value=!document.body.classList.contains('presenting')) {
  document.body.classList.toggle('presenting',value);$('#exitPresent').hidden=!value;$('#presentButton').textContent=value?'Exit presentation':'Present';
  if(value&&document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().catch(()=>{});
  if(!value&&document.fullscreenElement)document.exitFullscreen().catch(()=>{});
}
$('#courseButton').onclick=()=>$('#courseDialog').showModal();
$('#unitList').innerHTML=COURSE.units.map((unit,i)=>`<button class="unit-card" data-unit="${i}" ${unit.status!=='ready'?'disabled':''}><span class="unit-number">0${i+1}</span><span><strong>${esc(unit.title)}</strong><small>${unit.hours} teaching hours · ${unit.status==='ready'?'9 sections available':'Planned'}</small></span><span>${unit.status==='ready'?'Open →':'Coming later'}</span></button>`).join('');
$$('[data-unit]').forEach(b=>b.onclick=()=>{$('#courseDialog').close();go(0);});
$('#workspaceButton').onclick=()=>openWorkspace();$('#presentButton').onclick=()=>presentation();$('#exitPresent').onclick=()=>presentation(false);
$('#notesButton').onclick=()=>{$('#notesDialog').showModal();$('#notesButton').setAttribute('aria-expanded','true');};
$('#notesDialog').addEventListener('close',()=>$('#notesButton').setAttribute('aria-expanded','false'));
$$('[data-close]').forEach(b=>b.onclick=()=>document.getElementById(b.dataset.close).close());
$('#prevButton').onclick=()=>go(position-1);$('#nextButton').onclick=()=>go(position+1);
$('#confirmReset').onclick=async()=>{
  $('#confirmReset').disabled=true;
  try{const result=await api('reset-practice',{database:'classroom_practice'});if(resetTarget){resetTarget.status.textContent=result.message;resetTarget.resultMount.innerHTML='';}$('#resetDialog').close();notify(result.message);}catch(error){notify(error.message);}finally{$('#confirmReset').disabled=false;}
};
document.addEventListener('keydown',e=>{
  if($$('dialog[open]').length||e.ctrlKey||e.metaKey||e.altKey||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;
  if(e.key==='ArrowRight'){e.preventDefault();go(position+1);}if(e.key==='ArrowLeft'){e.preventDefault();go(position-1);}if(e.key==='Escape')presentation(false);
});
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement){document.body.classList.remove('presenting');$('#exitPresent').hidden=true;$('#presentButton').textContent='Present';}});
window.addEventListener('hashchange',()=>{const index=locate(location.hash);if(index>=0)go(index,false);});
go(readPosition());health();

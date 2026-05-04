/* ============================================================
   app.js
   Main controller.

   EXAM DATA SHAPE (updated):
     exams - [{ id, subjectId, date, paper }]
     - id    : unique per exam entry (used to key sessions)
     - paper : optional label e.g. "Paper 1", "Paper 2"
             : auto-assigned if subject already has an exam

   Each exam entry independently generates its own 5 sessions,
   so Maths Paper 1 and Maths Paper 2 each get a full schedule.
   ============================================================ */

/* ── STATE ──────────────────────────────────────────────────── */
let subjects  = [];
let exams     = [];
let sessions  = [];
let completed = new Set();

/* ── BOOT ───────────────────────────────────────────────────── */

function init() {
  subjects  = loadSubjects();
  exams     = loadExams();
  sessions  = loadSessions();
  completed = loadCompleted();

  // Migrate old exam entries that have no id
  exams = exams.map(e => e.id ? e : { ...e, id: `exam_${Date.now()}_${Math.random()}`, paper: '' });

  renderSubjectList(subjects, removeSubject);
  renderExamSubjectSelect(subjects);
  renderExamList(exams, subjects, removeExam);
  renderTimetableIfReady();
  renderTracker(subjects, sessions, completed, toggleSession);
  refreshCountdowns();

  startCountdownAutoRefresh(refreshCountdowns);
  setupTabs();
  setupButtons();
}

/* ── TAB NAVIGATION ─────────────────────────────────────────── */

function setupTabs() {
  const buttons = document.querySelectorAll('.tab-btn');
  const panels  = document.querySelectorAll('.tab-panel');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      buttons.forEach(b => b.classList.toggle('active', b === btn));
      panels.forEach(p => p.classList.toggle('active', p.id === `tab-${target}`));
    });
  });
}

/* ── BUTTON WIRING ──────────────────────────────────────────── */

function setupButtons() {
  document.getElementById('add-subject-btn').addEventListener('click', handleAddSubject);
  document.getElementById('subject-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleAddSubject();
  });
  document.getElementById('add-exam-btn').addEventListener('click', handleAddExam);
  document.getElementById('generate-btn').addEventListener('click', handleGenerate);
  document.getElementById('export-btn').addEventListener('click', handleExport);
  document.getElementById('print-btn').addEventListener('click', handlePrint);
}

/* ── SUBJECT MANAGEMENT ─────────────────────────────────────── */

function handleAddSubject() {
  const input      = document.getElementById('subject-input');
  const colorInput = document.getElementById('subject-color');
  const name       = input.value.trim();

  if (!name) { showToast('Please enter a subject name.'); input.focus(); return; }
  if (subjects.some(s => s.name.toLowerCase() === name.toLowerCase())) {
    showToast('That subject is already in your list.'); return;
  }

  subjects.push({ id: `subj_${Date.now()}`, name, color: colorInput.value });
  saveSubjects(subjects);
  input.value = '';
  renderSubjectList(subjects, removeSubject);
  renderExamSubjectSelect(subjects);
  updateSubjectCount();
  showToast(`"${name}" added.`);
}

function removeSubject(subjectId) {
  subjects  = subjects.filter(s => s.id !== subjectId);
  exams     = exams.filter(e => e.subjectId !== subjectId);
  sessions  = sessions.filter(s => s.subjectId !== subjectId);
  [...completed].forEach(id => { if (id.startsWith(subjectId)) completed.delete(id); });

  saveAll();
  renderSubjectList(subjects, removeSubject);
  renderExamSubjectSelect(subjects);
  renderExamList(exams, subjects, removeExam);
  renderTimetableIfReady();
  renderTracker(subjects, sessions, completed, toggleSession);
  refreshCountdowns();
  updateSubjectCount();
  showToast('Subject removed.');
}

function updateSubjectCount() {
  const el = document.getElementById('subject-count');
  if (el) el.textContent = `${subjects.length} added`;
}

/* ── EXAM MANAGEMENT ─────────────────────────────────────────── */

function handleAddExam() {
  const subjectId = document.getElementById('exam-subject-select').value;
  const date      = document.getElementById('exam-date-input').value;

  if (!subjectId) { showToast('Add a subject first.'); return; }
  if (!date)      { showToast('Please pick an exam date.'); return; }

  // Prevent exact duplicate (same subject + same date)
  if (exams.some(e => e.subjectId === subjectId && e.date === date)) {
    showToast('That exam date already exists for this subject.'); return;
  }

  // Auto-label papers if this subject already has exam entries
  const existing = exams.filter(e => e.subjectId === subjectId);
  let paper = '';
  if (existing.length === 1 && !existing[0].paper) {
    // Retroactively label the first one
    existing[0].paper = 'Paper 1';
    paper = 'Paper 2';
  } else if (existing.length >= 1) {
    paper = `Paper ${existing.length + 1}`;
  }

  exams.push({ id: `exam_${Date.now()}`, subjectId, date, paper });
  saveExams(exams);

  document.getElementById('exam-date-input').value = '';
  renderExamList(exams, subjects, removeExam);
  refreshCountdowns();
  showToast(paper ? `Exam date added (${paper}).` : 'Exam date added.');
}

function removeExam(examId) {
  // Remove by id, not index
  const subject = subjects.find(s => s.id === (exams.find(e => e.id === examId) || {}).subjectId);
  exams = exams.filter(e => e.id !== examId);

  // If only one exam left for this subject, clear its paper label
  if (subject) {
    const remaining = exams.filter(e => e.subjectId === subject.id);
    if (remaining.length === 1) remaining[0].paper = '';
  }

  saveExams(exams);
  renderExamList(exams, subjects, removeExam);
  refreshCountdowns();
  showToast('Exam date removed.');
}

/* ── GENERATE ────────────────────────────────────────────────── */

function handleGenerate() {
  if (subjects.length === 0) { showToast('Add at least one subject first.'); return; }

  const missing = subjects.filter(s => !exams.find(e => e.subjectId === s.id));
  if (missing.length > 0) {
    showToast(`Add an exam date for: ${missing.map(s => s.name).join(', ')}`); return;
  }

  sessions = generateAllSessions(subjects, exams);
  saveSessions(sessions);

  renderTimetableIfReady();
  renderTracker(subjects, sessions, completed, toggleSession);
  refreshCountdowns();

  document.querySelector('[data-tab="timetable"]').click();
  showToast('Timetable generated!');
}

/* ── TIMETABLE ───────────────────────────────────────────────── */

function renderTimetableIfReady() {
  const weekGroups = groupSessionsByWeek(sessions, exams, subjects);
  renderTimetable(weekGroups, completed);
  attachPomodoroButtons();
}

function attachPomodoroButtons() {
  document.querySelectorAll('.session-chip').forEach(chip => {
    if (chip.querySelector('.pom-start-btn')) return;
    const subjectName = chip.dataset.subject || '';
    const btn = document.createElement('button');
    btn.className   = 'pom-start-btn';
    btn.title       = 'Start Pomodoro timer';
    btn.textContent = '▶';
    btn.addEventListener('click', e => {
      e.stopPropagation();
      openPomodoro(subjectName);
    });
    chip.appendChild(btn);
  });
}

/* ── TRACKER ─────────────────────────────────────────────────── */

function toggleSession(sessionId, isChecked) {
  if (isChecked) completed.add(sessionId);
  else           completed.delete(sessionId);
  saveCompleted(completed);
  renderTracker(subjects, sessions, completed, toggleSession);
  renderTimetableIfReady();
}

/* ── COUNTDOWN ───────────────────────────────────────────────── */

function refreshCountdowns() {
  renderCountdowns(exams, subjects, 'countdown-timetable');
  renderCountdowns(exams, subjects, 'countdown-tracker');
}

/* ── PRINT ───────────────────────────────────────────────────── */

function handlePrint() {
  if (sessions.length === 0) { showToast('Generate your timetable first.'); return; }
  openPrintCalendar(sessions, exams, subjects);
}

/* ── EXPORT ──────────────────────────────────────────────────── */

function handleExport() {
  if (sessions.length === 0) { showToast('Generate your timetable first.'); return; }
  const csv  = buildCSV(sessions, completed);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'study2357_timetable.csv'; a.click();
  URL.revokeObjectURL(url);
  showToast('CSV downloaded!');
}

/* ── SAVE ALL ────────────────────────────────────────────────── */

function saveAll() {
  saveSubjects(subjects);
  saveSessions(sessions);
  saveExams(exams);
  saveCompleted(completed);
}

/* ── START ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', init);
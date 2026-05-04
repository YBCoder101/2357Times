/* ============================================================
   scheduler.js

   THE 2-3-5-7 METHOD (counting backwards from exam):

   Exam - 1  day  = 4th revision
   Exam - 3  days = 3rd revision  (2 days before 4th)
   Exam - 6  days = 2nd revision  (3 days before 3rd)
   Exam - 11 days = 1st revision  (5 days before 2nd)
   Exam - 18 days = Initial study (7 days before 1st)

   Each EXAM ENTRY generates its own independent set of 5 sessions.
   A subject with 2 exams (e.g. Maths Paper 1 + Paper 2) gets 10
   sessions total — 5 per paper.

   Session IDs are keyed on exam.id (not just subjectId) so
   multiple papers never clash.
   ============================================================ */

const SESSION_PLAN = [
  { offsetFromExam: 19, label: 'Initial study', round: 0 },
  { offsetFromExam: 17, label: '1st revision',  round: 1 },
  { offsetFromExam: 10,  label: '2nd revision',  round: 2 },
  { offsetFromExam: 5,  label: '3rd revision',  round: 3 },
  { offsetFromExam: 2,  label: '4th revision',  round: 4 },
  { offsetFromExam: 0,  label: '5th revision',  round: 5 },
];

/* ── DATE HELPERS ───────────────────────────────────────────── */

function subtractDays(date, days) {
  const r = new Date(date); r.setDate(r.getDate() - days); return r;
}

function addDays(date, days) {
  const r = new Date(date); r.setDate(r.getDate() + days); return r;
}

function formatDate(date) {
  return date.toLocaleDateString('en-ZA', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

function toISODate(date) {
  return date.toISOString().split('T')[0];
}

function getDayName(date) {
  return date.toLocaleDateString('en-ZA', { weekday: 'long' });
}

/* ── CORE SCHEDULER ─────────────────────────────────────────── */

/**
 * Generate 5 sessions for one exam entry.
 *
 * @param {Object} subject  - { id, name, color }
 * @param {Object} exam     - { id, subjectId, date, paper }
 * @returns {Array}
 */
function generateSessionsForExam(subject, exam) {
  const examDate   = new Date(exam.date + 'T00:00:00');
  // If the subject has a paper label, include it in the display name
  const displayName = exam.paper
    ? `${subject.name} (${exam.paper})`
    : subject.name;

  return SESSION_PLAN.map(plan => {
    const sessionDate = subtractDays(examDate, plan.offsetFromExam);
    return {
      // Key on exam.id so Paper 1 and Paper 2 sessions never collide
      id:           `${exam.id}_round${plan.round}`,
      subjectId:    subject.id,
      examId:       exam.id,
      subjectName:  displayName,
      subjectColor: subject.color,
      round:        plan.round,
      roundLabel:   plan.label,
      dateISO:      toISODate(sessionDate),
      dateDisplay:  formatDate(sessionDate),
      dayName:      getDayName(sessionDate),
    };
  });
}

/**
 * Generate all sessions for all subjects from all their exam dates.
 * Each exam entry independently produces 5 sessions.
 *
 * @param {Array} subjects
 * @param {Array} exams    - [{ id, subjectId, date, paper }]
 * @returns {Array}        - all sessions sorted chronologically
 */
function generateAllSessions(subjects, exams) {
  const allSessions = [];

  exams.forEach(exam => {
    const subject = subjects.find(s => s.id === exam.subjectId);
    if (!subject) return;
    allSessions.push(...generateSessionsForExam(subject, exam));
  });

  allSessions.sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  return allSessions;
}

/* ── GROUPING HELPERS ───────────────────────────────────────── */

function groupSessionsByDate(sessions) {
  const grouped = {};
  sessions.forEach(s => {
    if (!grouped[s.dateISO]) grouped[s.dateISO] = [];
    grouped[s.dateISO].push(s);
  });
  return grouped;
}

function groupSessionsByWeek(sessions, exams = [], subjects = []) {
  // Build exam chip data keyed by date
  const examsByDate = {};
  exams.forEach(exam => {
    if (!examsByDate[exam.date]) examsByDate[exam.date] = [];
    const sub = subjects.find(s => s.id === exam.subjectId);
    const label = exam.paper
      ? `${sub ? sub.name : '?'} (${exam.paper})`
      : (sub ? sub.name : '?');
    examsByDate[exam.date].push({
      subjectName:  label,
      subjectColor: sub ? sub.color : '#888',
    });
  });

  const allDates = new Set([
    ...sessions.map(s => s.dateISO),
    ...exams.map(e => e.date),
  ]);

  if (allDates.size === 0) return [];

  const sortedDates    = [...allDates].sort();
  const sessionsByDate = groupSessionsByDate(sessions);

  function getMondayISO(isoDate) {
    const d = new Date(isoDate + 'T00:00:00');
    const day = d.getDay();
    d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
    return toISODate(d);
  }

  const weeks = {};
  sortedDates.forEach(dateISO => {
    const monday = getMondayISO(dateISO);
    if (!weeks[monday]) weeks[monday] = [];
    weeks[monday].push(dateISO);
  });

  return Object.entries(weeks)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monday, dates]) => {
      const mondayDate = new Date(monday + 'T00:00:00');
      const sundayDate = addDays(mondayDate, 6);
      return {
        weekLabel: `Week of ${formatDate(mondayDate)}`,
        weekRange: `${mondayDate.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })} – ${sundayDate.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}`,
        days: dates.map(dateISO => ({
          dateISO,
          dateDisplay: formatDate(new Date(dateISO + 'T00:00:00')),
          dayName:     getDayName(new Date(dateISO + 'T00:00:00')),
          sessions:    sessionsByDate[dateISO] || [],
          exams:       examsByDate[dateISO]    || [],
        })),
      };
    });
}

/* ── UTILITY ────────────────────────────────────────────────── */

function isToday(isoDate) { return isoDate === toISODate(new Date()); }
function isPast(isoDate)  { return isoDate < toISODate(new Date()); }

function buildCSV(sessions, completed) {
  const header = 'Subject,Session,Date,Status\n';
  const rows = sessions.map(s => {
    const status = completed.has(s.id) ? 'Done' : (isPast(s.dateISO) ? 'Missed' : 'Upcoming');
    return `"${s.subjectName}","${s.roundLabel}","${s.dateDisplay}","${status}"`;
  });
  return header + rows.join('\n');
}
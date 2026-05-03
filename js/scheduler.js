/* ============================================================
   scheduler.js
   Pure functions that calculate revision session dates.

   THE 2-3-5-7 METHOD (counting backwards from exam):

   Exam day  = Day 0
   4th revision  = 1 day before exam      (Exam - 1)
   3rd revision  = 2 days before that     (Exam - 3)
   2nd revision  = 3 days before that     (Exam - 6)
   1st revision  = 5 days before that     (Exam - 11)
   Initial study = 7 days before that     (Exam - 18)

   So the schedule is:
     Exam - 18 = Initial study
     Exam - 11 = 1st revision  (+7 days from initial)
     Exam - 6  = 2nd revision  (+5 days from 1st)
     Exam - 3  = 3rd revision  (+3 days from 2nd)
     Exam - 1  = 4th revision  (+2 days from 3rd)
     Exam - 0  = Exam
   ============================================================ */

const SESSION_PLAN = [
  { offsetFromExam: 18, label: 'Initial study', round: 0 },
  { offsetFromExam: 11, label: '1st revision',  round: 1 },
  { offsetFromExam: 6,  label: '2nd revision',  round: 2 },
  { offsetFromExam: 3,  label: '3rd revision',  round: 3 },
  { offsetFromExam: 1,  label: '4th revision',  round: 4 },
];

/* ── DATE HELPERS ───────────────────────────────────────────── */

function subtractDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
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
 * Generate the 5 study sessions for one subject, working
 * backwards from its exam date.
 *
 * @param {Object} subject  - { id, name, color }
 * @param {string} examISO  - ISO date string of the exam
 * @returns {Array}         - session objects in chronological order
 */
function generateSessionsForSubject(subject, examISO) {
  const examDate = new Date(examISO + 'T00:00:00');

  return SESSION_PLAN.map(plan => {
    const sessionDate = subtractDays(examDate, plan.offsetFromExam);
    return {
      id:           `${subject.id}_round${plan.round}`,
      subjectId:    subject.id,
      subjectName:  subject.name,
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
 * Generate all sessions for all subjects from their exam dates.
 * @param {Array} subjects
 * @param {Array} exams    - [{ subjectId, date }]
 * @returns {Array}        - all sessions sorted chronologically
 */
function generateAllSessions(subjects, exams) {
  const allSessions = [];

  subjects.forEach(subject => {
    const exam = exams.find(e => e.subjectId === subject.id);
    if (!exam) return;
    allSessions.push(...generateSessionsForSubject(subject, exam.date));
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
  const examsByDate = {};
  exams.forEach(exam => {
    if (!examsByDate[exam.date]) examsByDate[exam.date] = [];
    const sub = subjects.find(s => s.id === exam.subjectId);
    examsByDate[exam.date].push({
      subjectName:  sub ? sub.name  : '?',
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
    const d   = new Date(isoDate + 'T00:00:00');
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

function isToday(isoDate) {
  return isoDate === toISODate(new Date());
}

function isPast(isoDate) {
  return isoDate < toISODate(new Date());
}

function buildCSV(sessions, completed) {
  const header = 'Subject,Session,Date,Status\n';
  const rows = sessions.map(s => {
    const status = completed.has(s.id) ? 'Done' : (isPast(s.dateISO) ? 'Missed' : 'Upcoming');
    return `"${s.subjectName}","${s.roundLabel}","${s.dateDisplay}","${status}"`;
  });
  return header + rows.join('\n');
}
/* ============================================================
   scheduler.js
   Pure functions that calculate revision session dates.

   THE 2-3-5-7 METHOD (backwards from exam date):
   Given an exam on Day 0, work backwards to find study sessions:
     - Exam date - 2  days = 4th revision  (Day 0 - 2)
     - Exam date - 9  days = 3rd revision  (Day 0 - 2 - 7)
     - Exam date - 14 days = 2nd revision  (Day 0 - 2 - 7 - 5)
     - Exam date - 17 days = 1st revision  (Day 0 - 2 - 7 - 5 - 3)
     - Exam date - 19 days = Initial study (Day 0 - 2 - 7 - 5 - 3 - 2)

   So counting FORWARD from initial study:
     Day 0  = Initial learning
     Day 2  = 1st review  (+2)
     Day 5  = 2nd review  (+3)
     Day 10 = 3rd review  (+5)
     Day 17 = 4th review  (+7)
     Day 19 = Exam

   We schedule all 5 dates (including Day 0) working backwards
   from the exam date the learner provides.
   ============================================================ */

/**
 * Offsets in days BEFORE the exam for each event, in chronological order.
 * Index 0 = initial study (furthest from exam)
 * Index 4 = exam day itself (offset 0)
 */
const SCHEDULE_OFFSETS = [19, 17, 12, 7, 2, 0];
// Day 0 = initial study    (exam - 19)
// Day 2 = 1st review       (exam - 17)
// Day 5 = 2nd review       (exam - 12)  [19-12 = 7? No — let's be precise below]

/**
 * The five scheduled events working backwards from exam:
 *   exam - 19 = Day 0  initial study
 *   exam - 17 = Day 2  1st revision  (+2 from Day 0)
 *   exam - 14 = Day 5  2nd revision  (+3 from Day 2)
 *   exam - 9  = Day 10 3rd revision  (+5 from Day 5)
 *   exam - 2  = Day 17 4th revision  (+7 from Day 10)
 *   exam - 0  = Exam
 */
const SESSION_PLAN = [
  { offsetFromExam: 19, label: 'Initial study',  round: 0 },
  { offsetFromExam: 17, label: '1st revision',   round: 1 },
  { offsetFromExam: 14, label: '2nd revision',   round: 2 },
  { offsetFromExam: 9,  label: '3rd revision',   round: 3 },
  { offsetFromExam: 2,  label: '4th revision',   round: 4 },
];

/* ── DATE HELPERS ───────────────────────────────────────────── */

/**
 * Subtract a number of days from a Date. Returns a NEW Date.
 * @param {Date}   date
 * @param {number} days
 * @returns {Date}
 */
function subtractDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

/**
 * Add days to a Date. Returns a NEW Date.
 * @param {Date}   date
 * @param {number} days
 * @returns {Date}
 */
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Format a Date as a readable string: "Mon, 12 Aug 2025"
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  return date.toLocaleDateString('en-ZA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a Date as an ISO date string: "2025-08-12"
 * @param {Date} date
 * @returns {string}
 */
function toISODate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Get the full day name: "Monday", "Tuesday", etc.
 * @param {Date} date
 * @returns {string}
 */
function getDayName(date) {
  return date.toLocaleDateString('en-ZA', { weekday: 'long' });
}

/* ── CORE SCHEDULER ─────────────────────────────────────────── */

/**
 * Generate the 5 study sessions for one subject, working backwards
 * from its exam date.
 *
 * @param {Object} subject  - { id, name, color }
 * @param {string} examISO  - ISO date string of the exam (e.g. "2025-11-03")
 * @returns {Array}         - array of session objects, chronological
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
 * Generate all sessions for all subjects, using their exam dates.
 *
 * @param {Array} subjects  - [{ id, name, color }, ...]
 * @param {Array} exams     - [{ subjectId, date }, ...]
 * @returns {Array}         - flat array of all sessions, sorted by date
 */
function generateAllSessions(subjects, exams) {
  const allSessions = [];

  subjects.forEach(subject => {
    // Find this subject's exam date
    const exam = exams.find(e => e.subjectId === subject.id);
    if (!exam) return; // skip subjects with no exam date set

    const sessions = generateSessionsForSubject(subject, exam.date);
    allSessions.push(...sessions);
  });

  // Sort chronologically
  allSessions.sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  return allSessions;
}

/* ── GROUPING HELPERS ───────────────────────────────────────── */

/**
 * Group a flat sessions array into a map keyed by ISO date.
 * @param {Array} sessions
 * @returns {Object} { "2025-08-12": [session, ...], ... }
 */
function groupSessionsByDate(sessions) {
  const grouped = {};
  sessions.forEach(session => {
    if (!grouped[session.dateISO]) grouped[session.dateISO] = [];
    grouped[session.dateISO].push(session);
  });
  return grouped;
}

/**
 * Group sessions (and exams) by ISO week (Monday-based).
 * Returns an array of week objects for rendering the timetable.
 *
 * @param {Array} sessions
 * @param {Array} exams     - [{ subjectId, date }]
 * @param {Array} subjects
 * @returns {Array}
 */
function groupSessionsByWeek(sessions, exams = [], subjects = []) {
  // Build exam lookup by date
  const examsByDate = {};
  exams.forEach(exam => {
    if (!examsByDate[exam.date]) examsByDate[exam.date] = [];
    const sub = subjects.find(s => s.id === exam.subjectId);
    examsByDate[exam.date].push({
      subjectName:  sub ? sub.name  : '?',
      subjectColor: sub ? sub.color : '#888',
    });
  });

  // Collect all unique dates
  const allDates = new Set([
    ...sessions.map(s => s.dateISO),
    ...exams.map(e => e.date),
  ]);

  if (allDates.size === 0) return [];

  const sortedDates   = [...allDates].sort();
  const sessionsByDate = groupSessionsByDate(sessions);

  // Get the Monday of any given date's week
  function getMondayISO(isoDate) {
    const d   = new Date(isoDate + 'T00:00:00');
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1 - day);
    d.setDate(d.getDate() + diff);
    return toISODate(d);
  }

  // Bucket dates into weeks
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

/** @returns {boolean} true if isoDate is today */
function isToday(isoDate) {
  return isoDate === toISODate(new Date());
}

/** @returns {boolean} true if isoDate is before today */
function isPast(isoDate) {
  return isoDate < toISODate(new Date());
}

/**
 * Build a CSV export string.
 * @param {Array} sessions
 * @param {Set}   completed
 * @returns {string}
 */
function buildCSV(sessions, completed) {
  const header = 'Subject,Session,Date,Status\n';
  const rows = sessions.map(s => {
    const status = completed.has(s.id) ? 'Done' : (isPast(s.dateISO) ? 'Missed' : 'Upcoming');
    return `"${s.subjectName}","${s.roundLabel}","${s.dateDisplay}","${status}"`;
  });
  return header + rows.join('\n');
}
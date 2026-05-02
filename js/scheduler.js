/* ============================================================
   scheduler.js
   Pure functions that calculate revision session dates.

   THE 2-3-5-7 METHOD:
   If you first study something on Day 0, you revise it on:
     - Day 0 + 2  = first revision
     - Day 0 + 5  = second revision  (2+3)
     - Day 0 + 10 = third revision   (2+3+5)
     - Day 0 + 17 = fourth revision  (2+3+5+7)

   No network calls. No side effects. Just math on dates.
   ============================================================ */

/** Interval offsets in days for each revision round */
const REVISION_OFFSETS = [2, 5, 10, 17];

/** Human-readable labels for each round */
const ROUND_LABELS = ['1st revision', '2nd revision', '3rd revision', '4th revision'];

/**
 * Add a number of days to a Date object.
 * Returns a NEW Date — does not mutate the original.
 *
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
 *
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
 * Used for grouping sessions by day.
 *
 * @param {Date} date
 * @returns {string}
 */
function toISODate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Get the name of the day: "Monday", "Tuesday", etc.
 *
 * @param {Date} date
 * @returns {string}
 */
function getDayName(date) {
  return date.toLocaleDateString('en-ZA', { weekday: 'long' });
}

/**
 * Generate all 4 revision sessions for a single subject.
 *
 * @param {Object} subject   - { id, name, color }
 * @param {string} startISO  - ISO date string of the first-study date (e.g. "2025-08-01")
 * @returns {Array}          - array of session objects
 */
function generateSessionsForSubject(subject, startISO) {
  const startDate = new Date(startISO + 'T00:00:00'); // midnight local time

  return REVISION_OFFSETS.map((offset, index) => {
    const sessionDate = addDays(startDate, offset);
    return {
      // Unique ID for this session
      id: `${subject.id}_round${index + 1}`,

      subjectId:   subject.id,
      subjectName: subject.name,
      subjectColor: subject.color,

      round:       index + 1,
      roundLabel:  ROUND_LABELS[index],

      // Store as ISO string for easy comparison / storage
      dateISO:     toISODate(sessionDate),
      dateDisplay: formatDate(sessionDate),
      dayName:     getDayName(sessionDate),
    };
  });
}

/**
 * Generate all sessions for all subjects.
 * subjects and startDates are parallel arrays indexed by subject id.
 *
 * @param {Array}  subjects   - [{ id, name, color }, ...]
 * @param {Object} startDates - { [subjectId]: isoDateString }
 * @returns {Array}           - flat array of all session objects, sorted by date
 */
function generateAllSessions(subjects, startDates) {
  const allSessions = [];

  subjects.forEach(subject => {
    const startISO = startDates[subject.id];
    if (!startISO) return; // skip if no date set for this subject

    const sessions = generateSessionsForSubject(subject, startISO);
    allSessions.push(...sessions);
  });

  // Sort by date ascending
  allSessions.sort((a, b) => a.dateISO.localeCompare(b.dateISO));

  return allSessions;
}

/**
 * Group a flat sessions array into a map keyed by ISO date.
 * Makes it easy to render a day-by-day timetable.
 *
 * @param {Array} sessions
 * @returns {Object} { "2025-08-12": [session, ...], ... }
 */
function groupSessionsByDate(sessions) {
  const grouped = {};
  sessions.forEach(session => {
    if (!grouped[session.dateISO]) {
      grouped[session.dateISO] = [];
    }
    grouped[session.dateISO].push(session);
  });
  return grouped;
}

/**
 * Group sessions by ISO week (Monday-based).
 * Returns an array of { weekLabel, weekRange, days: [{dateISO, sessions}] }
 *
 * @param {Array}  sessions
 * @param {Array}  exams     - [{ subjectId, date }] optional
 * @param {Array}  subjects  - needed to look up subject name for exams
 * @returns {Array}
 */
function groupSessionsByWeek(sessions, exams = [], subjects = []) {
  // Build a lookup for exam dates
  const examsByDate = {};
  exams.forEach(exam => {
    const iso = exam.date;
    if (!examsByDate[iso]) examsByDate[iso] = [];
    const sub = subjects.find(s => s.id === exam.subjectId);
    examsByDate[iso].push({ subjectName: sub ? sub.name : '?', subjectColor: sub ? sub.color : '#888' });
  });

  // Collect all unique dates (sessions + exam dates)
  const allDates = new Set([
    ...sessions.map(s => s.dateISO),
    ...exams.map(e => e.date),
  ]);

  if (allDates.size === 0) return [];

  const sortedDates = [...allDates].sort();
  const sessionsByDate = groupSessionsByDate(sessions);

  // Get Monday of the week for a given date
  function getMondayISO(isoDate) {
    const d = new Date(isoDate + 'T00:00:00');
    const day = d.getDay(); // 0=Sun, 1=Mon ...
    const diff = (day === 0 ? -6 : 1 - day);
    d.setDate(d.getDate() + diff);
    return toISODate(d);
  }

  // Group dates into weeks
  const weeks = {};
  sortedDates.forEach(dateISO => {
    const monday = getMondayISO(dateISO);
    if (!weeks[monday]) weeks[monday] = [];
    weeks[monday].push(dateISO);
  });

  // Build the output structure
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
          dayName: getDayName(new Date(dateISO + 'T00:00:00')),
          sessions: sessionsByDate[dateISO] || [],
          exams: examsByDate[dateISO] || [],
        })),
      };
    });
}

/**
 * Check if a given ISO date is today.
 * @param {string} isoDate
 * @returns {boolean}
 */
function isToday(isoDate) {
  return isoDate === toISODate(new Date());
}

/**
 * Check if a session date is in the past.
 * @param {string} isoDate
 * @returns {boolean}
 */
function isPast(isoDate) {
  return isoDate < toISODate(new Date());
}

/**
 * Build a CSV string from sessions for export.
 * @param {Array} sessions
 * @param {Set}   completed
 * @returns {string}
 */
function buildCSV(sessions, completed) {
  const header = 'Subject,Round,Date,Status\n';
  const rows = sessions.map(s => {
    const status = completed.has(s.id) ? 'Done' : (isPast(s.dateISO) ? 'Missed' : 'Upcoming');
    return `"${s.subjectName}","${s.roundLabel}","${s.dateDisplay}","${status}"`;
  });
  return header + rows.join('\n');
}
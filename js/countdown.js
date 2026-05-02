/* ============================================================
   countdown.js
   Exam countdown banner module.

   HOW IT WORKS:
   - Reads the exams array and subjects array from shared state
   - Renders a horizontal scrollable row of countdown cards
     at the top of the Timetable and Progress tabs
   - Updates every minute automatically
   - Cards turn amber when < 14 days away, red when < 3 days
   ============================================================ */

/* ── CONSTANTS ──────────────────────────────────────────────── */
const COUNTDOWN_UPDATE_INTERVAL = 60 * 1000; // 1 minute in ms

/* ── PUBLIC API ─────────────────────────────────────────────── */

/**
 * Render exam countdown cards into a container element.
 * Call this whenever exams or subjects change.
 *
 * @param {Array}  exams     - [{ subjectId, date }]
 * @param {Array}  subjects  - [{ id, name, color }]
 * @param {string} containerId - id of the DOM container to render into
 */
function renderCountdowns(exams, subjects, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';

  if (exams.length === 0) {
    container.style.display = 'none';
    return;
  }

  // Only show exams that haven't passed yet
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = exams
    .map(exam => {
      const subject   = subjects.find(s => s.id === exam.subjectId);
      const examDate  = new Date(exam.date + 'T00:00:00');
      const daysLeft  = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
      return { exam, subject, examDate, daysLeft };
    })
    .filter(e => e.daysLeft >= 0)          // exclude past exams
    .sort((a, b) => a.daysLeft - b.daysLeft); // soonest first

  if (upcoming.length === 0) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'flex';

  upcoming.forEach(({ subject, examDate, daysLeft }) => {
    const card = document.createElement('div');
    card.className = `countdown-card ${getUrgencyClass(daysLeft)}`;

    const color  = subject ? subject.color : '#888';
    const name   = subject ? subject.name  : 'Exam';
    const label  = daysLeft === 0 ? 'Today!' : daysLeft === 1 ? '1 day' : `${daysLeft} days`;
    const dateStr = examDate.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });

    card.innerHTML = `
      <span class="cd-dot" style="background:${color}"></span>
      <div class="cd-info">
        <span class="cd-subject">${escapeHTML(name)}</span>
        <span class="cd-date">${dateStr}</span>
      </div>
      <div class="cd-days">
        <span class="cd-number">${label}</span>
        <span class="cd-to-go">${daysLeft === 0 ? '' : 'to go'}</span>
      </div>
    `;

    container.appendChild(card);
  });
}

/* ── HELPERS ─────────────────────────────────────────────────── */

/**
 * Return a CSS class based on how many days remain.
 * @param {number} daysLeft
 * @returns {string}
 */
function getUrgencyClass(daysLeft) {
  if (daysLeft === 0) return 'cd-urgent';
  if (daysLeft <= 3)  return 'cd-urgent';
  if (daysLeft <= 14) return 'cd-warn';
  return 'cd-normal';
}

/**
 * Start an auto-refresh timer so countdowns tick over at midnight.
 * @param {Function} refreshFn - function to call each interval
 */
function startCountdownAutoRefresh(refreshFn) {
  setInterval(refreshFn, COUNTDOWN_UPDATE_INTERVAL);
}

// escapeHTML is defined in ui.js and available globally
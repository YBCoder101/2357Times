/* ============================================================
   print.js
   Generates a print-friendly monthly calendar view.

   HOW IT WORKS:
   - Opens a new browser window with a standalone HTML page
   - Builds a full calendar grid (Mon–Sun) for each month
     that contains at least one session or exam
   - Uses window.print() to trigger the browser print dialog
   - The printed page has no navigation, no buttons, just the
     calendar — clean enough to stick on a wall
   ============================================================ */

/**
 * Generate and open the print calendar.
 *
 * @param {Array} sessions  - all session objects
 * @param {Array} exams     - all exam objects
 * @param {Array} subjects  - subject objects (for name/color lookup)
 */
function openPrintCalendar(sessions, exams, subjects) {
  if (sessions.length === 0 && exams.length === 0) return;

  const html = buildCalendarHTML(sessions, exams, subjects);

  const win = window.open('', '_blank');
  if (!win) {
    alert('Please allow pop-ups for this page to print the calendar.');
    return;
  }

  win.document.write(html);
  win.document.close();

  // Give fonts a moment to load before triggering print
  win.onload = () => setTimeout(() => win.print(), 400);
}

/* ── CALENDAR BUILDER ───────────────────────────────────────── */

/**
 * Build the complete HTML string for the print window.
 */
function buildCalendarHTML(sessions, exams, subjects) {
  const months = getMonthsToRender(sessions, exams);
  const monthGrids = months.map(({ year, month }) =>
    buildMonthGrid(year, month, sessions, exams, subjects)
  ).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Study2357 — Revision Calendar</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>
  <style>
    /* ── Reset ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'DM Sans', sans-serif;
      font-size: 11px;
      color: #1a1a2e;
      background: #fff;
      padding: 24px;
    }

    /* ── Print header ── */
    .print-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 28px;
      padding-bottom: 12px;
      border-bottom: 2px solid #1a1a2e;
    }

    .print-logo {
      font-family: 'DM Serif Display', serif;
      font-size: 28px;
      color: #e8673a;
    }

    .print-subtitle {
      font-size: 11px;
      color: #8888aa;
      text-align: right;
    }

    /* ── Legend ── */
    .print-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 24px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
    }

    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .legend-exam-dot {
      background: #c07a12;
    }

    /* ── Month block ── */
    .month-block {
      margin-bottom: 32px;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .month-title {
      font-family: 'DM Serif Display', serif;
      font-size: 20px;
      margin-bottom: 10px;
      color: #1a1a2e;
    }

    /* ── Calendar grid ── */
    .cal-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      border-top: 1px solid #e2e0da;
      border-left: 1px solid #e2e0da;
    }

    .cal-day-header {
      background: #1a1a2e;
      color: #faf9f6;
      text-align: center;
      padding: 6px 4px;
      font-size: 9px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-right: 1px solid #e2e0da;
      border-bottom: 1px solid #e2e0da;
    }

    .cal-cell {
      min-height: 72px;
      padding: 5px 6px;
      border-right: 1px solid #e2e0da;
      border-bottom: 1px solid #e2e0da;
      vertical-align: top;
    }

    .cal-cell.empty {
      background: #f8f8f6;
    }

    .cal-cell.today {
      background: #fffbf7;
    }

    .cal-date-num {
      font-size: 10px;
      font-weight: 500;
      color: #4a4a6a;
      margin-bottom: 4px;
      display: block;
    }

    .cal-date-num.today-num {
      background: #e8673a;
      color: #fff;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
    }

    /* ── Session pill ── */
    .cal-pill {
      display: block;
      border-radius: 3px;
      padding: 1px 5px;
      margin-bottom: 2px;
      font-size: 8.5px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }

    /* ── Exam marker ── */
    .cal-exam {
      display: block;
      border-radius: 3px;
      padding: 1px 5px;
      margin-bottom: 2px;
      font-size: 8.5px;
      font-weight: 500;
      background: #fef6e4;
      color: #c07a12;
      border: 1px solid #f0d9a8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ── Print rules ── */
    @media print {
      body { padding: 12px; }
      .month-block { page-break-inside: avoid; }
      .no-print { display: none !important; }
    }

    @page {
      margin: 1.5cm;
      size: A4 landscape;
    }
  </style>
</head>
<body>
  <div class="print-header">
    <div>
      <div class="print-logo">2357 StudyPlanner</div>
      <div style="font-size:11px; color:#8888aa; margin-top:2px;">Revision calendar — printed ${new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
    </div>
    <div class="print-subtitle">
      Spaced repetition: revise on day +2, +5, +10, +17
    </div>
  </div>

  <div class="print-legend">
    ${buildLegendHTML(subjects)}
    <div class="legend-item">
      <span class="legend-dot legend-exam-dot"></span>
      <span>Exam date</span>
    </div>
  </div>

  ${monthGrids}

  <script>
    // Auto-print when opened
    window.addEventListener('load', () => setTimeout(() => window.print(), 500));
  <\/script>
</body>
</html>`;
}

/**
 * Build the legend HTML showing each subject's colour.
 */
function buildLegendHTML(subjects) {
  return subjects.map(s => `
    <div class="legend-item">
      <span class="legend-dot" style="background:${s.color}"></span>
      <span>${escapeHTML(s.name)}</span>
    </div>
  `).join('');
}

/* ── MONTH GRID ─────────────────────────────────────────────── */

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Build the HTML for a single month's calendar grid.
 */
function buildMonthGrid(year, month, sessions, exams, subjects) {
  const monthName = new Date(year, month, 1).toLocaleDateString('en-ZA', {
    month: 'long', year: 'numeric'
  });

  // Index sessions and exams by ISO date
  const sessionsByDate = {};
  sessions.forEach(s => {
    if (!sessionsByDate[s.dateISO]) sessionsByDate[s.dateISO] = [];
    sessionsByDate[s.dateISO].push(s);
  });

  const examsByDate = {};
  exams.forEach(e => {
    if (!examsByDate[e.date]) examsByDate[e.date] = [];
    const sub = subjects.find(s => s.id === e.subjectId);
    examsByDate[e.date].push(sub ? sub.name : 'Exam');
  });

  // Get first day of month (0=Sun … 6=Sat), convert to Mon-based (0=Mon)
  const firstDay = new Date(year, month, 1);
  let startOffset = firstDay.getDay(); // 0=Sun
  startOffset = startOffset === 0 ? 6 : startOffset - 1; // Mon-based

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayISO    = new Date().toISOString().split('T')[0];

  // Build cells
  const headerCells = DAY_NAMES.map(d =>
    `<div class="cal-day-header">${d}</div>`
  ).join('');

  let cells = '';

  // Empty cells before the 1st
  for (let i = 0; i < startOffset; i++) {
    cells += '<div class="cal-cell empty"></div>';
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = iso === todayISO;

    const dateNumEl = isToday
      ? `<span class="cal-date-num today-num">${day}</span>`
      : `<span class="cal-date-num">${day}</span>`;

    const pills = (sessionsByDate[iso] || []).map(s => {
      const color     = s.subjectColor;
      const textColor = darkenHex(color);
      const bgColor   = hexToRgba(color, 0.15);
      return `<span class="cal-pill" style="background:${bgColor}; color:${textColor}; border:1px solid ${hexToRgba(color, 0.4)}">
        ${escapeHTML(s.subjectName.length > 10 ? s.subjectName.slice(0, 9) + '…' : s.subjectName)} · ${s.roundLabel.replace(' revision', '')}
      </span>`;
    }).join('');

    const examPills = (examsByDate[iso] || []).map(name =>
      `<span class="cal-exam">📋 ${escapeHTML(name.length > 10 ? name.slice(0, 9) + '…' : name)}</span>`
    ).join('');

    cells += `
      <div class="cal-cell ${isToday ? 'today' : ''}">
        ${dateNumEl}
        ${pills}${examPills}
      </div>`;
  }

  // Fill remaining cells to complete the last row
  const totalCells = startOffset + daysInMonth;
  const remainder  = totalCells % 7;
  if (remainder !== 0) {
    for (let i = 0; i < 7 - remainder; i++) {
      cells += '<div class="cal-cell empty"></div>';
    }
  }

  return `
    <div class="month-block">
      <h2 class="month-title">${monthName}</h2>
      <div class="cal-grid">
        ${headerCells}
        ${cells}
      </div>
    </div>`;
}

/* ── MONTH RANGE HELPERS ────────────────────────────────────── */

/**
 * Get the unique set of year-month combos that need a calendar page.
 * @returns {Array} [{ year, month }, ...]  month is 0-indexed
 */
function getMonthsToRender(sessions, exams) {
  const allDates = [
    ...sessions.map(s => s.dateISO),
    ...exams.map(e => e.date),
  ];

  const monthSet = new Set(allDates.map(d => d.slice(0, 7))); // "2025-08"

  return [...monthSet]
    .sort()
    .map(ym => {
      const [y, m] = ym.split('-').map(Number);
      return { year: y, month: m - 1 }; // month is 0-indexed for Date()
    });
}

/* ── COLOR HELPERS ──────────────────────────────────────────── */

/**
 * Convert hex to rgba string — same as ui.js but duplicated here
 * because print.js runs in a separate window context.
 */
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Return a darkened version of a hex colour for readable text.
 * Multiplies each channel by 0.55.
 */
function darkenHex(hex) {
  const r = Math.round(parseInt(hex.slice(1, 3), 16) * 0.55);
  const g = Math.round(parseInt(hex.slice(3, 5), 16) * 0.55);
  const b = Math.round(parseInt(hex.slice(5, 7), 16) * 0.55);
  return `rgb(${r},${g},${b})`;
}

/**
 * escapeHTML — duplicated here because print.js runs in a new window.
 */
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
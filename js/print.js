/* ============================================================
   print.js
   Generates a print-friendly monthly calendar matching the
   Outlook/Google Calendar style: full-width grid, Mon–Sun,
   day number top-left of each cell, event chips with a left
   colour border, one month per page.
   ============================================================ */

/**
 * Open the print calendar window.
 * @param {Array} sessions
 * @param {Array} exams
 * @param {Array} subjects
 */
function openPrintCalendar(sessions, exams, subjects) {
  if (sessions.length === 0 && exams.length === 0) return;

  const html = buildCalendarHTML(sessions, exams, subjects);
  const win  = window.open('', '_blank');
  if (!win) { alert('Please allow pop-ups to print the calendar.'); return; }

  win.document.write(html);
  win.document.close();
  win.onload = () => setTimeout(() => win.print(), 500);
}

/* ── FULL HTML PAGE ─────────────────────────────────────────── */

function buildCalendarHTML(sessions, exams, subjects) {
  const months     = getMonthsToRender(sessions, exams);
  const monthGrids = months.map(({ year, month }) =>
    buildMonthGrid(year, month, sessions, exams, subjects)
  ).join('');

  const printedOn = new Date().toLocaleDateString('en-ZA', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Study2357 — Revision Calendar</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'DM Sans', sans-serif;
      background: #fff;
      color: #1f1f2e;
      font-size: 12px;
    }

    /* ── One month = one printed page ── */
    .month-page {
      width: 100%;
      padding: 28px 32px 20px;
      page-break-after: always;
      break-after: page;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .month-page:last-child {
      page-break-after: avoid;
      break-after: avoid;
    }

    /* ── Page header ── */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 20px;
    }

    .month-title {
      font-family: 'DM Serif Display', serif;
      font-size: 32px;
      font-weight: 400;
      color: #1f1f2e;
      letter-spacing: -0.5px;
    }

    .page-meta {
      text-align: right;
      font-size: 10px;
      color: #9999bb;
      line-height: 1.6;
    }

    .brand {
      font-family: 'DM Serif Display', serif;
      color: #e8673a;
      font-size: 13px;
    }

    /* ── Legend ── */
    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e5e5e5;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
      color: #555;
    }

    .legend-swatch {
      width: 24px;
      height: 10px;
      border-radius: 2px;
      flex-shrink: 0;
    }

    /* ── Calendar grid ── */
    .cal-grid {
      flex: 1;
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      border-left: 1px solid #d0d0d8;
      border-top: 1px solid #d0d0d8;
    }

    /* Day-of-week header row */
    .cal-dow {
      background: #fff;
      border-right: 1px solid #d0d0d8;
      border-bottom: 1px solid #d0d0d8;
      padding: 8px 10px 6px;
      font-size: 11px;
      font-weight: 500;
      color: #6666aa;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Individual day cell */
    .cal-cell {
      border-right: 1px solid #d0d0d8;
      border-bottom: 1px solid #d0d0d8;
      padding: 6px 8px 8px;
      min-height: 100px;
      vertical-align: top;
      background: #fff;
    }

    .cal-cell.other-month {
      background: #f9f9fb;
    }

    .cal-cell.is-today {
      background: #fffaf7;
    }

    /* Day number */
    .day-num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      font-size: 12px;
      font-weight: 400;
      color: #333;
      border-radius: 50%;
      margin-bottom: 4px;
    }

    .day-num.today-circle {
      background: #1f1f2e;
      color: #fff;
      font-weight: 500;
    }

    /* Event chips — match Outlook style */
    .cal-event {
      display: flex;
      align-items: center;
      gap: 0;
      margin-bottom: 2px;
      border-radius: 3px;
      overflow: hidden;
      font-size: 10px;
      font-weight: 400;
      line-height: 1.3;
    }

    /* Left colour bar */
    .cal-event-bar {
      width: 3px;
      align-self: stretch;
      flex-shrink: 0;
      border-radius: 3px 0 0 3px;
    }

    /* Event label area */
    .cal-event-label {
      flex: 1;
      padding: 2px 6px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      border-radius: 0 3px 3px 0;
    }

    /* Exam chip — distinct amber style */
    .cal-event.exam-event .cal-event-bar {
      background: #b45309;
    }

    .cal-event.exam-event .cal-event-label {
      background: #fef3c7;
      color: #92400e;
      font-weight: 500;
    }

    /* ── Print rules ── */
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .month-page { padding: 16px 20px 12px; }
    }

    @page {
      size: A4 landscape;
      margin: 1cm;
    }
  </style>
</head>
<body>
  ${monthGrids}
</body>
</html>`;
}

/* ── MONTH GRID ─────────────────────────────────────────────── */

const CAL_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

function buildMonthGrid(year, month, sessions, exams, subjects) {
  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-ZA', {
    month: 'long', year: 'numeric'
  });
  const printedOn = new Date().toLocaleDateString('en-ZA', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  // Index sessions by ISO date
  const sessionsByDate = {};
  sessions.forEach(s => {
    if (!sessionsByDate[s.dateISO]) sessionsByDate[s.dateISO] = [];
    sessionsByDate[s.dateISO].push(s);
  });

  // Index exams by ISO date
  const examsByDate = {};
  exams.forEach(e => {
    if (!examsByDate[e.date]) examsByDate[e.date] = [];
    const sub = subjects.find(s => s.id === e.subjectId);
    examsByDate[e.date].push({ name: sub ? sub.name : 'Exam', color: sub ? sub.color : '#b45309' });
  });

  const todayISO    = new Date().toISOString().split('T')[0];
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Monday-based offset for first day of month
  let startOffset = new Date(year, month, 1).getDay(); // 0=Sun
  startOffset = startOffset === 0 ? 6 : startOffset - 1;

  // Header row
  const dowHeaders = CAL_DAYS.map(d =>
    `<div class="cal-dow">${d}</div>`
  ).join('');

  let cells = '';

  // Leading empty cells (previous month, greyed)
  for (let i = 0; i < startOffset; i++) {
    // Calculate what date this would be in the prev month
    const prevDate = new Date(year, month, 1 - (startOffset - i));
    cells += `<div class="cal-cell other-month"><span class="day-num" style="color:#bbb">${prevDate.getDate()}</span></div>`;
  }

  // Actual days
  for (let day = 1; day <= daysInMonth; day++) {
    const iso     = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const isToday = iso === todayISO;

    const dayNumEl = `<span class="day-num ${isToday ? 'today-circle' : ''}">${day}</span>`;

    // Session chips
    const sessionChips = (sessionsByDate[iso] || []).map(s => {
      const bg  = hexToRgba(s.subjectColor, 0.15);
      const bar = s.subjectColor;
      const txt = darkenHex(s.subjectColor);
      const label = truncate(s.subjectName, 14) + ' · ' + s.roundLabel;
      return `<div class="cal-event">
        <div class="cal-event-bar" style="background:${bar}"></div>
        <div class="cal-event-label" style="background:${bg}; color:${txt}">${escapeHTML(label)}</div>
      </div>`;
    }).join('');

    // Exam chips
    const examChips = (examsByDate[iso] || []).map(e =>
      `<div class="cal-event exam-event">
        <div class="cal-event-bar"></div>
        <div class="cal-event-label">📋 ${escapeHTML(truncate(e.name, 14))} Exam</div>
      </div>`
    ).join('');

    cells += `
      <div class="cal-cell ${isToday ? 'is-today' : ''}">
        ${dayNumEl}
        ${sessionChips}${examChips}
      </div>`;
  }

  // Trailing empty cells
  const totalCells = startOffset + daysInMonth;
  const remainder  = totalCells % 7;
  if (remainder !== 0) {
    for (let i = 1; i <= 7 - remainder; i++) {
      cells += `<div class="cal-cell other-month"><span class="day-num" style="color:#bbb">${i}</span></div>`;
    }
  }

  // Legend for this page
  const legend = buildLegendHTML(subjects);

  return `
  <div class="month-page">
    <div class="page-header">
      <div class="month-title">${monthLabel}</div>
      <div class="page-meta">
        <div class="brand">2357 StudyPlanner</div>
        <div>Printed ${printedOn}</div>
        <div>Revision: Day +2 · +5 · +10 · +17 before exam</div>
      </div>
    </div>
    <div class="legend">${legend}
      <div class="legend-item">
        <div class="legend-swatch" style="background:#fef3c7; border-left: 3px solid #b45309;"></div>
        <span>Exam</span>
      </div>
    </div>
    <div class="cal-grid">
      ${dowHeaders}
      ${cells}
    </div>
  </div>`;
}

/* ── LEGEND ─────────────────────────────────────────────────── */

function buildLegendHTML(subjects) {
  return subjects.map(s => `
    <div class="legend-item">
      <div class="legend-swatch" style="background:${hexToRgba(s.color, 0.18)}; border-left: 3px solid ${s.color};"></div>
      <span>${escapeHTML(s.name)}</span>
    </div>
  `).join('');
}

/* ── HELPERS ─────────────────────────────────────────────────── */

function getMonthsToRender(sessions, exams) {
  const allDates = [
    ...sessions.map(s => s.dateISO),
    ...exams.map(e => e.date),
  ];
  const monthSet = new Set(allDates.map(d => d.slice(0, 7)));
  return [...monthSet].sort().map(ym => {
    const [y, m] = ym.split('-').map(Number);
    return { year: y, month: m - 1 };
  });
}

function truncate(str, len) {
  return str.length > len ? str.slice(0, len - 1) + '…' : str;
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function darkenHex(hex) {
  const r = Math.round(parseInt(hex.slice(1,3), 16) * 0.5);
  const g = Math.round(parseInt(hex.slice(3,5), 16) * 0.5);
  const b = Math.round(parseInt(hex.slice(5,7), 16) * 0.5);
  return `rgb(${r},${g},${b})`;
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}
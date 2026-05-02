/* ============================================================
   ui.js
   Pure rendering functions. Each function takes data and
   writes to the DOM. No business logic lives here.
   ============================================================ */

/* ── TOAST ─────────────────────────────────────────────────── */

let toastTimeout = null;

/**
 * Show a temporary toast notification.
 * @param {string} message
 * @param {number} duration  ms (default 2800)
 */
function showToast(message, duration = 2800) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), duration);
}

/* ── SETUP TAB: SUBJECT LIST ────────────────────────────────── */

/**
 * Render the list of subjects in the Setup tab.
 * @param {Array}    subjects  - [{ id, name, color }]
 * @param {Function} onRemove  - callback(subjectId)
 */
function renderSubjectList(subjects, onRemove) {
  const container = document.getElementById('subject-list');
  container.innerHTML = '';

  if (subjects.length === 0) {
    container.innerHTML = '<p class="empty-hint">No subjects added yet.</p>';
    return;
  }

  subjects.forEach(subject => {
    const item = document.createElement('div');
    item.className = 'subject-item';
    item.innerHTML = `
      <span class="subject-dot" style="background:${subject.color}"></span>
      <span class="subject-name">${escapeHTML(subject.name)}</span>
      <button class="btn-icon" title="Remove subject" data-id="${subject.id}">✕</button>
    `;
    item.querySelector('.btn-icon').addEventListener('click', () => onRemove(subject.id));
    container.appendChild(item);
  });
}

/* ── SETUP TAB: DATE LIST ───────────────────────────────────── */

/**
 * Render one date-picker row per subject.
 * @param {Array}    subjects    - [{ id, name, color }]
 * @param {Object}   startDates  - { [subjectId]: isoDate }
 * @param {Function} onChange    - callback(subjectId, isoDate)
 */
function renderDateList(subjects, startDates, onChange) {
  const container = document.getElementById('date-list');
  container.innerHTML = '';

  if (subjects.length === 0) {
    container.innerHTML = '<p class="empty-hint">Add subjects above first.</p>';
    return;
  }

  subjects.forEach(subject => {
    const item = document.createElement('div');
    item.className = 'date-item';
    item.innerHTML = `
      <span class="subject-dot" style="background:${subject.color}"></span>
      <span class="subject-name">${escapeHTML(subject.name)}</span>
      <label for="date-${subject.id}">First studied on</label>
      <input
        type="date"
        id="date-${subject.id}"
        class="text-input date-input"
        value="${startDates[subject.id] || ''}"
      />
    `;
    item.querySelector('input').addEventListener('change', e => {
      onChange(subject.id, e.target.value);
    });
    container.appendChild(item);
  });
}

/* ── SETUP TAB: EXAM LIST ───────────────────────────────────── */

/**
 * Render the exam date select dropdown options.
 * @param {Array} subjects
 */
function renderExamSubjectSelect(subjects) {
  const select = document.getElementById('exam-subject-select');
  select.innerHTML = '';
  if (subjects.length === 0) {
    select.innerHTML = '<option value="">— add subjects first —</option>';
    return;
  }
  subjects.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.name;
    select.appendChild(opt);
  });
}

/**
 * Render the list of saved exam dates.
 * @param {Array}    exams     - [{ subjectId, date }]
 * @param {Array}    subjects
 * @param {Function} onRemove  - callback(index)
 */
function renderExamList(exams, subjects, onRemove) {
  const container = document.getElementById('exam-list');
  container.innerHTML = '';

  if (exams.length === 0) {
    container.innerHTML = '<p class="empty-hint">No exam dates added.</p>';
    return;
  }

  exams.forEach((exam, index) => {
    const sub = subjects.find(s => s.id === exam.subjectId);
    const name = sub ? sub.name : '?';
    const item = document.createElement('div');
    item.className = 'exam-item';
    item.innerHTML = `
      <span class="subject-dot" style="background:${sub ? sub.color : '#888'}"></span>
      <span class="subject-name">${escapeHTML(name)}</span>
      <span class="exam-badge">Exam</span>
      <span style="flex:1; font-size:13px; color:var(--ink-soft);">${formatDate(new Date(exam.date + 'T00:00:00'))}</span>
      <button class="btn-icon" title="Remove" data-index="${index}">✕</button>
    `;
    item.querySelector('.btn-icon').addEventListener('click', () => onRemove(index));
    container.appendChild(item);
  });
}

/* ── TIMETABLE TAB ──────────────────────────────────────────── */

/**
 * Render the full timetable grouped by week.
 * @param {Array} weekGroups  - output of groupSessionsByWeek()
 * @param {Set}   completed   - Set of completed session ids
 */
function renderTimetable(weekGroups, completed) {
  const container = document.getElementById('timetable-output');
  container.innerHTML = '';

  if (weekGroups.length === 0) {
    container.innerHTML = `
      <div class="empty-timetable">
        <span class="big-num">2357</span>
        <p>Generate your timetable in the Setup tab first.</p>
      </div>`;
    return;
  }

  weekGroups.forEach(week => {
    const block = document.createElement('div');
    block.className = 'week-block';

    block.innerHTML = `
      <div class="week-header">
        ${escapeHTML(week.weekLabel)}
        <span class="week-range">${escapeHTML(week.weekRange)}</span>
      </div>
    `;

    week.days.forEach(day => {
      const todayClass = isToday(day.dateISO) ? 'today-row' : '';
      const todayBadge = isToday(day.dateISO) ? '<span class="today-marker">Today</span>' : '';

      const row = document.createElement('div');
      row.className = `day-row ${todayClass}`;

      // Build session chips
      const chips = day.sessions.map(s => {
        const isDone = completed.has(s.id);
        const bg = isDone
          ? 'var(--success-bg)'
          : hexToRgba(s.subjectColor, 0.12);
        const border = isDone
          ? 'var(--success)'
          : s.subjectColor;
        const textColor = isDone ? 'var(--success)' : s.subjectColor;

        return `<span class="session-chip"
          data-subject="${escapeHTML(s.subjectName)}"
          style="background:${bg}; border-color:${border}; color:${textColor};">
          ${escapeHTML(s.subjectName)}
          <span class="session-round">${s.roundLabel}</span>
          ${isDone ? '✓' : ''}
        </span>`;
      }).join('');

      // Exam chips
      const examChips = day.exams.map(e =>
        `<span class="exam-chip">📋 ${escapeHTML(e.subjectName)} exam</span>`
      ).join('');

      row.innerHTML = `
        <div class="day-label">
          <span>${escapeHTML(day.dayName.slice(0, 3))}</span>
          <span class="day-date">${escapeHTML(day.dateDisplay.split(' ').slice(1).join(' '))}</span>
          ${todayBadge}
        </div>
        <div class="day-sessions">
          ${chips}${examChips}
          ${chips === '' && examChips === '' ? '<span style="font-size:12px;color:var(--ink-muted);">—</span>' : ''}
        </div>
      `;
      block.appendChild(row);
    });

    container.appendChild(block);
  });
}

/* ── TRACKER TAB ────────────────────────────────────────────── */

/**
 * Render the progress tracker grouped by subject.
 * @param {Array}    subjects
 * @param {Array}    sessions
 * @param {Set}      completed
 * @param {Function} onToggle  - callback(sessionId, isChecked)
 */
function renderTracker(subjects, sessions, completed, onToggle) {
  updateProgressStats(sessions, completed);

  const container = document.getElementById('tracker-output');
  container.innerHTML = '';

  if (sessions.length === 0) {
    container.innerHTML = '<p class="empty-hint">Generate a timetable first.</p>';
    return;
  }

  subjects.forEach(subject => {
    const subjectSessions = sessions.filter(s => s.subjectId === subject.id);
    if (subjectSessions.length === 0) return;

    const doneCount = subjectSessions.filter(s => completed.has(s.id)).length;

    const block = document.createElement('div');
    block.className = 'tracker-subject-block';

    block.innerHTML = `
      <div class="tracker-subject-header">
        <span class="subject-dot" style="background:${subject.color}; width:14px; height:14px;"></span>
        <span class="tracker-subject-name">${escapeHTML(subject.name)}</span>
        <span class="tracker-progress-text">${doneCount} / ${subjectSessions.length} done</span>
      </div>
    `;

    subjectSessions.forEach(session => {
      const isDone = completed.has(session.id);
      const isOverdue = !isDone && isPast(session.dateISO);

      let badgeClass = 'badge-upcoming';
      let badgeText  = 'Upcoming';
      if (isDone)      { badgeClass = 'badge-done';    badgeText = 'Done'; }
      else if (isOverdue) { badgeClass = 'badge-overdue'; badgeText = 'Overdue'; }

      const row = document.createElement('div');
      row.className = `tracker-session-row ${isDone ? 'done' : ''}`;
      row.innerHTML = `
        <input
          type="checkbox"
          class="session-checkbox"
          data-id="${session.id}"
          ${isDone ? 'checked' : ''}
        />
        <div class="session-info">
          <div class="session-subject">${escapeHTML(session.roundLabel)}</div>
          <div class="session-date-info">${escapeHTML(session.dateDisplay)}</div>
        </div>
        <span class="session-status-badge ${badgeClass}">${badgeText}</span>
      `;

      row.querySelector('input').addEventListener('change', e => {
        onToggle(session.id, e.target.checked);
      });

      block.appendChild(row);
    });

    container.appendChild(block);
  });
}

/**
 * Update the stat cards and progress bar at the top of the tracker.
 * @param {Array} sessions
 * @param {Set}   completed
 */
function updateProgressStats(sessions, completed) {
  const total     = sessions.length;
  const done      = sessions.filter(s => completed.has(s.id)).length;
  const remaining = total - done;
  const pct       = total > 0 ? Math.round((done / total) * 100) : 0;

  document.getElementById('stat-total').textContent     = total;
  document.getElementById('stat-done').textContent      = done;
  document.getElementById('stat-remaining').textContent = remaining;
  document.getElementById('stat-percent').textContent   = `${pct}%`;
  document.getElementById('progress-bar').style.width   = `${pct}%`;
}

/* ── HELPERS ─────────────────────────────────────────────────── */

/**
 * Escape user-supplied strings before injecting into innerHTML.
 * Prevents XSS from subject names, etc.
 * @param {string} str
 * @returns {string}
 */
function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

/**
 * Convert a hex color to rgba with a given alpha.
 * Used to create soft background tints for session chips.
 * @param {string} hex   - e.g. "#5a67d8"
 * @param {number} alpha - 0 to 1
 * @returns {string}     - e.g. "rgba(90,103,216,0.12)"
 */
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// formatDate and isPast/isToday are defined in scheduler.js and available globally
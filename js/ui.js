/* ============================================================
   ui.js — soft pastel rendering (journal edition)
   No emojis, no aggressive icons, only calm text and subtle shapes
   ============================================================ */

let toastTimeout = null;
function showToast(message, duration = 2800) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), duration);
}

function renderSubjectList(subjects, onRemove) {
  const container = document.getElementById('subject-list');
  container.innerHTML = '';
  if (subjects.length === 0) {
    container.innerHTML = '<p class="empty-hint">add a subject to begin</p>';
    return;
  }
  subjects.forEach(subject => {
    const item = document.createElement('div');
    item.className = 'subject-item';
    item.innerHTML = `
      <span class="subject-dot" style="background:${subject.color}"></span>
      <span class="subject-name">${escapeHTML(subject.name)}</span>
      <button class="btn-icon" data-id="${subject.id}" title="remove">–</button>
    `;
    item.querySelector('.btn-icon').addEventListener('click', () => onRemove(subject.id));
    container.appendChild(item);
  });
}

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

function renderExamList(exams, subjects, onRemove) {
  const container = document.getElementById('exam-list');
  container.innerHTML = '';
  if (exams.length === 0) {
    container.innerHTML = '<p class="empty-hint">no exam dates yet</p>';
    return;
  }
  exams.forEach(exam => {
    const sub = subjects.find(s => s.id === exam.subjectId);
    const name = sub ? sub.name : '?';
    const color = sub ? sub.color : '#f7c59f';
    const label = exam.paper ? `${name} — ${exam.paper}` : name;
    const item = document.createElement('div');
    item.className = 'exam-item';
    item.innerHTML = `
      <span class="subject-dot" style="background:${color}"></span>
      <span class="subject-name">${escapeHTML(label)}</span>
      <span class="exam-badge">exam</span>
      <span class="exam-date-text">${formatDate(new Date(exam.date + 'T00:00:00'))}</span>
      <button class="btn-icon" title="remove">–</button>
    `;
    item.querySelector('.btn-icon').addEventListener('click', () => onRemove(exam.id));
    container.appendChild(item);
  });
}

function renderTimetable(weekGroups, completed) {
  const container = document.getElementById('timetable-output');
  container.innerHTML = '';
  if (weekGroups.length === 0) {
    container.innerHTML = `<div class="empty-timetable"><span class="big-num">2357</span><p>generate timetable in setup</p></div>`;
    return;
  }
  weekGroups.forEach(week => {
    const block = document.createElement('div');
    block.className = 'week-block';
    block.innerHTML = `<div class="week-header"><span class="week-header-label">${escapeHTML(week.weekLabel)}</span><span class="week-range">${escapeHTML(week.weekRange)}</span></div>`;
    week.days.forEach(day => {
      const todayClass = isToday(day.dateISO) ? 'today-row' : '';
      const todayBadge = isToday(day.dateISO) ? '<span class="today-badge">today</span>' : '';
      const chips = day.sessions.map(s => {
        const isDone = completed.has(s.id);
        const bg = isDone ? '#eaf5ef' : '#fef6ed';
        const textColor = isDone ? '#678f79' : s.subjectColor;
        return `<span class="session-chip" style="background:${bg}; color:${textColor};">${escapeHTML(s.subjectName)} <span class="session-round">${s.roundLabel}</span></span>`;
      }).join('');
      const examChips = day.exams.map(e => `<span class="exam-chip">${escapeHTML(e.subjectName)} exam</span>`).join('');
      const row = document.createElement('div');
      row.className = `day-row ${todayClass}`;
      row.innerHTML = `<div class="day-label"><span>${escapeHTML(day.dayName.slice(0,3))}</span><span class="day-date">${escapeHTML(day.dateDisplay.split(' ').slice(1).join(' '))}</span>${todayBadge}</div><div class="day-sessions">${chips}${examChips}${chips === '' && examChips === '' ? '<span class="empty-day">—</span>' : ''}</div>`;
      block.appendChild(row);
    });
    container.appendChild(block);
  });
}

function renderTracker(subjects, sessions, completed, onToggle) {
  updateProgressStats(sessions, completed);
  const container = document.getElementById('tracker-output');
  container.innerHTML = '';
  if (sessions.length === 0) {
    container.innerHTML = '<p class="empty-hint">generate a timetable first</p>';
    return;
  }
  const examGroups = {};
  sessions.forEach(s => { const key = s.examId || s.subjectId; if (!examGroups[key]) examGroups[key] = []; examGroups[key].push(s); });
  Object.values(examGroups).forEach(groupSessions => {
    const first = groupSessions[0];
    const subject = subjects.find(s => s.id === first.subjectId);
    if (!subject) return;
    const doneCount = groupSessions.filter(s => completed.has(s.id)).length;
    const block = document.createElement('div');
    block.className = 'tracker-subject-block';
    block.innerHTML = `<div class="tracker-subject-header"><span class="subject-dot" style="background:${subject.color}; width:12px; height:12px;"></span><span class="tracker-subject-name">${escapeHTML(first.subjectName)}</span><span class="tracker-progress-text">${doneCount}/${groupSessions.length}</span></div>`;
    groupSessions.forEach(session => {
      const isDone = completed.has(session.id);
      const isOverdue = !isDone && isPast(session.dateISO);
      let badgeClass = 'badge-upcoming', badgeText = 'upcoming';
      if (isDone) { badgeClass = 'badge-done'; badgeText = 'done'; }
      else if (isOverdue) { badgeClass = 'badge-overdue'; badgeText = 'overdue'; }
      const row = document.createElement('div');
      row.className = `tracker-session-row ${isDone ? 'done' : ''}`;
      row.innerHTML = `<input type="checkbox" class="session-checkbox" data-id="${session.id}" ${isDone ? 'checked' : ''}/><div class="session-info"><div class="session-subject">${escapeHTML(session.roundLabel)}</div><div class="session-date-info">${escapeHTML(session.dateDisplay)}</div></div><span class="session-status-badge ${badgeClass}">${badgeText}</span>`;
      row.querySelector('input').addEventListener('change', e => onToggle(session.id, e.target.checked));
      block.appendChild(row);
    });
    container.appendChild(block);
  });
}

function updateProgressStats(sessions, completed) {
  const total = sessions.length, done = sessions.filter(s => completed.has(s.id)).length, remaining = total - done, pct = total > 0 ? Math.round((done/total)*100) : 0;
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-done').textContent = done;
  document.getElementById('stat-remaining').textContent = remaining;
  document.getElementById('stat-percent').textContent = `${pct}%`;
  document.getElementById('progress-bar').style.width = `${pct}%`;
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function hexToRgba(hex, alpha) { /* kept for compatibility */ const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16); return `rgba(${r},${g},${b},${alpha})`; }
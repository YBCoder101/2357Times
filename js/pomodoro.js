/* ============================================================
   pomodoro.js
   Self-contained Pomodoro timer module.

   HOW IT WORKS:
   - Work session: 25 minutes
   - Short break:   5 minutes
   - Long break:   15 minutes (every 4th round)
   - Shows a modal overlay with a circular SVG countdown ring
   - Uses the Web Notifications API if the user grants permission
   - No external dependencies
   ============================================================ */

/* ── CONSTANTS ──────────────────────────────────────────────── */
const POMODORO = {
  WORK:        25 * 60,   // seconds
  SHORT_BREAK:  5 * 60,
  LONG_BREAK:  15 * 60,
  ROUNDS_BEFORE_LONG: 4,
};

/* ── STATE ──────────────────────────────────────────────────── */
let pomState = {
  running:       false,
  mode:          'work',      // 'work' | 'short_break' | 'long_break'
  secondsLeft:   POMODORO.WORK,
  roundsComplete: 0,
  subjectName:   '',
  intervalId:    null,
};

/* ── MODAL INJECTION ────────────────────────────────────────── */

/**
 * Inject the Pomodoro modal HTML into the document body.
 * Called once on init — the modal is hidden until openPomodoro().
 */
function injectPomodoroModal() {
  if (document.getElementById('pomodoro-modal')) return; // already injected

  const modal = document.createElement('div');
  modal.id = 'pomodoro-modal';
  modal.className = 'pom-overlay';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Pomodoro timer');
  modal.innerHTML = `
    <div class="pom-box">
      <button class="pom-close" id="pom-close" title="Close timer">✕</button>

      <p class="pom-subject" id="pom-subject">Studying</p>
      <p class="pom-mode-label" id="pom-mode-label">Focus session</p>

      <!-- SVG countdown ring -->
      <div class="pom-ring-wrap">
        <svg class="pom-ring" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <circle class="pom-ring-bg" cx="100" cy="100" r="88"/>
          <circle class="pom-ring-fill" id="pom-ring-fill" cx="100" cy="100" r="88"
            stroke-dasharray="553" stroke-dashoffset="0"/>
        </svg>
        <div class="pom-time-display" id="pom-time-display">25:00</div>
      </div>

      <p class="pom-rounds" id="pom-rounds">Round 1 of 4</p>

      <div class="pom-controls">
        <button class="btn btn-secondary pom-btn" id="pom-reset">↺ Reset</button>
        <button class="btn btn-primary pom-btn" id="pom-toggle">▶ Start</button>
        <button class="btn btn-secondary pom-btn" id="pom-skip">Skip →</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Wire up buttons
  document.getElementById('pom-close').addEventListener('click', closePomodoro);
  document.getElementById('pom-toggle').addEventListener('click', togglePomodoro);
  document.getElementById('pom-reset').addEventListener('click', resetPomodoro);
  document.getElementById('pom-skip').addEventListener('click', skipPhase);

  // Close on backdrop click
  modal.addEventListener('click', e => {
    if (e.target === modal) closePomodoro();
  });
}

/* ── PUBLIC API ─────────────────────────────────────────────── */

/**
 * Open the Pomodoro timer for a specific subject session.
 * Called from a "Start timer" button on a session chip.
 *
 * @param {string} subjectName  - displayed in the modal header
 */
function openPomodoro(subjectName = '') {
  requestNotificationPermission();

  pomState.subjectName = subjectName;

  // Only reset to work mode if not already running
  if (!pomState.running) {
    pomState.mode        = 'work';
    pomState.secondsLeft = POMODORO.WORK;
  }

  updatePomUI();
  document.getElementById('pomodoro-modal').classList.add('visible');
}

/**
 * Close the modal. Timer keeps running in the background.
 */
function closePomodoro() {
  document.getElementById('pomodoro-modal').classList.remove('visible');
}

/* ── TIMER LOGIC ────────────────────────────────────────────── */

function togglePomodoro() {
  if (pomState.running) {
    pausePomodoro();
  } else {
    startPomodoro();
  }
}

function startPomodoro() {
  pomState.running = true;
  updatePomUI();

  pomState.intervalId = setInterval(() => {
    pomState.secondsLeft--;
    updatePomRing();
    updatePomTimeDisplay();

    if (pomState.secondsLeft <= 0) {
      phaseComplete();
    }
  }, 1000);
}

function pausePomodoro() {
  pomState.running = false;
  clearInterval(pomState.intervalId);
  updatePomUI();
}

function resetPomodoro() {
  pausePomodoro();
  pomState.mode          = 'work';
  pomState.secondsLeft   = POMODORO.WORK;
  pomState.roundsComplete = 0;
  updatePomUI();
}

/**
 * Skip to the next phase (work → break → work …).
 */
function skipPhase() {
  pausePomodoro();
  advancePhase();
  updatePomUI();
}

/**
 * Called when the timer reaches zero.
 */
function phaseComplete() {
  pausePomodoro();
  sendPomNotification();

  if (pomState.mode === 'work') {
    pomState.roundsComplete++;
    pomState.mode = (pomState.roundsComplete % POMODORO.ROUNDS_BEFORE_LONG === 0)
      ? 'long_break'
      : 'short_break';
  } else {
    pomState.mode = 'work';
  }

  pomState.secondsLeft = getDuration(pomState.mode);
  updatePomUI();
}

/**
 * Advance phase without incrementing round counter (for skip).
 */
function advancePhase() {
  if (pomState.mode === 'work') {
    pomState.mode = 'short_break';
  } else {
    pomState.mode = 'work';
  }
  pomState.secondsLeft = getDuration(pomState.mode);
}

function getDuration(mode) {
  if (mode === 'work')        return POMODORO.WORK;
  if (mode === 'short_break') return POMODORO.SHORT_BREAK;
  return POMODORO.LONG_BREAK;
}

/* ── UI UPDATE ──────────────────────────────────────────────── */

function updatePomUI() {
  updatePomTimeDisplay();
  updatePomRing();

  const modeLabels = {
    work:        'Focus session',
    short_break: 'Short break',
    long_break:  'Long break',
  };

  document.getElementById('pom-subject').textContent     = pomState.subjectName || 'Study session';
  document.getElementById('pom-mode-label').textContent  = modeLabels[pomState.mode];
  document.getElementById('pom-toggle').textContent      = pomState.running ? '⏸ Pause' : '▶ Start';
  document.getElementById('pom-rounds').textContent =
    `Round ${pomState.roundsComplete + 1} · ${pomState.mode === 'work' ? 'Focus' : 'Break'}`;

  // Colour the ring by mode
  const fill = document.getElementById('pom-ring-fill');
  if (pomState.mode === 'work') {
    fill.style.stroke = 'var(--accent)';
  } else if (pomState.mode === 'short_break') {
    fill.style.stroke = 'var(--success)';
  } else {
    fill.style.stroke = '#5b8dee';
  }
}

function updatePomTimeDisplay() {
  const mins = Math.floor(pomState.secondsLeft / 60).toString().padStart(2, '0');
  const secs = (pomState.secondsLeft % 60).toString().padStart(2, '0');
  document.getElementById('pom-time-display').textContent = `${mins}:${secs}`;
}

/**
 * Update the SVG ring stroke-dashoffset to show remaining time.
 * Full circle circumference = 2π × 88 ≈ 553px.
 */
function updatePomRing() {
  const total  = getDuration(pomState.mode);
  const ratio  = pomState.secondsLeft / total;
  const CIRCUM = 553;
  const offset = CIRCUM * (1 - ratio);
  document.getElementById('pom-ring-fill').style.strokeDashoffset = offset;
}

/* ── NOTIFICATIONS ──────────────────────────────────────────── */

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function sendPomNotification() {
  if ('Notification' in window && Notification.permission === 'granted') {
    const title = pomState.mode === 'work' ? '⏱ Time for a break!' : '📚 Back to studying!';
    const body  = pomState.subjectName
      ? `${pomState.subjectName} — ${pomState.mode === 'work' ? 'break time' : 'focus time'}`
      : 'Next phase starting.';
    new Notification(title, { body, icon: '' });
  }
}

/* ── INIT ────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', injectPomodoroModal);
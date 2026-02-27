/* ══════════════════════════════════════════════════════════════════
   LIU Smart Campus Kiosk — app.js
   Wired to Flask backend at /api/*
   ══════════════════════════════════════════════════════════════════ */

/* ── Session state ────────────────────────────────────────────── */
let loggedInStudent = null;   // { id, name, major, year, email } or null

/* ══════════════════════════════════════════════════════════════════
   PAGE NAVIGATION
   ══════════════════════════════════════════════════════════════════ */
function navigateTo(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.add('active');

  if (pageId === 'dashboard') {
    document.querySelectorAll('.nav-card').forEach(card => {
      card.style.animation = 'none';
      void card.offsetWidth;
      card.style.animation = '';
    });
    refreshDashboardSession();
  }

  if (pageId === 'login') {
    resetLoginForm();
    if (loggedInStudent) showLoginSuccess(loggedInStudent.id, loggedInStudent.name);
  }

  if (pageId === 'schedule') {
    loadSchedule();
  }

  if (pageId === 'news') {
    loadNews();
  }
}

/* ══════════════════════════════════════════════════════════════════
   CLOCK
   ══════════════════════════════════════════════════════════════════ */
function updateClocks() {
  const now  = new Date();
  const hh   = String(now.getHours()).padStart(2, '0');
  const mm   = String(now.getMinutes()).padStart(2, '0');
  const timeStr = `${hh}:${mm}`;
  const days    = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months  = ['January','February','March','April','May','June',
                   'July','August','September','October','November','December'];
  const dateStr = `${days[now.getDay()]}, ${String(now.getDate()).padStart(2,'0')} ${months[now.getMonth()]} ${now.getFullYear()}`;

  const el = id => document.getElementById(id);
  ['welcome-time','dash-status-time','login-status-time','sched-status-time','news-status-time']
    .forEach(id => { if (el(id)) el(id).textContent = timeStr; });
  ['dash-time-big','login-time-big','sched-time-big','news-time-big']
    .forEach(id => { if (el(id)) el(id).textContent = timeStr; });
  ['dash-date','login-date','sched-date','news-date']
    .forEach(id => { if (el(id)) el(id).textContent = dateStr; });
}
updateClocks();
setInterval(updateClocks, 1000);

/* ══════════════════════════════════════════════════════════════════
   SESSION CHECK ON PAGE LOAD
   Ask the Flask server if there's already an active session
   (handles browser refresh on a kiosk that was already logged in)
   ══════════════════════════════════════════════════════════════════ */
async function checkServerSession() {
  try {
    const res  = await fetch('/api/session');
    const data = await res.json();
    if (data.logged_in) {
      loggedInStudent = data.student;
    }
  } catch (e) {
    console.warn('Could not reach backend:', e);
  }
  refreshDashboardSession();
}
checkServerSession();

/* ══════════════════════════════════════════════════════════════════
   DASHBOARD SESSION UI
   ══════════════════════════════════════════════════════════════════ */
function refreshDashboardSession() {
  const el          = id => document.getElementById(id);
  const pill        = el('dash-session-pill');
  const avatar      = el('dash-session-avatar');
  const nameEl      = el('dash-session-name');
  const welcomeText = el('dash-welcome-text');
  const schedCard   = el('card-schedule');
  const lockBadge   = el('card-lock-badge');
  const schedDesc   = el('sched-desc');
  const schedArrow  = el('sched-arrow');
  const loginIcon   = el('login-card-icon');
  const loginTitle  = el('login-card-title');
  const loginDesc   = el('login-card-desc');
  const loginArrow  = el('login-card-arrow');
  const statusMid   = el('dash-status-mid');

  if (loggedInStudent) {
    const first    = loggedInStudent.name.split(' ')[0];
    const initials = loggedInStudent.name.split(' ').map(n => n[0]).join('').toUpperCase();

    pill.style.display = 'flex';
    avatar.textContent = initials;
    nameEl.textContent = first;

    welcomeText.innerHTML = `Hello, <span>${first}!</span> Choose a service`;

    schedCard.classList.remove('locked');
    schedCard.classList.add('unlocked');
    lockBadge.style.display = 'none';
    schedDesc.textContent   = 'View your classes, upcoming exams, office hours, and academic deadlines.';
    schedArrow.textContent  = 'VIEW SCHEDULE →';

    loginIcon.textContent  = '👤';
    loginTitle.textContent = `${first}'s Account`;
    loginDesc.textContent  = `Signed in as ${loggedInStudent.name} · ${loggedInStudent.major || ''}`;
    loginArrow.textContent = 'MANAGE →';

    statusMid.textContent = `✔ SIGNED IN AS ${loggedInStudent.name.toUpperCase()}`;
  } else {
    pill.style.display = 'none';
    welcomeText.innerHTML = 'Welcome to <span>Campus Services</span>';

    schedCard.classList.remove('unlocked');
    schedCard.classList.add('locked');
    lockBadge.style.display = 'flex';
    schedDesc.textContent   = 'Sign in with your Student ID to view your classes, exams, and deadlines.';
    schedArrow.textContent  = 'LOGIN TO ACCESS →';

    loginIcon.textContent  = '🔐';
    loginTitle.textContent = 'Student Login';
    loginDesc.textContent  = 'Authenticate with your LIU Student ID to unlock personalised campus services.';
    loginArrow.textContent = 'LOGIN →';

    statusMid.textContent = 'HAND GESTURE RECOGNITION · ACTIVE';
  }
}

function handleScheduleClick() {
  if (!loggedInStudent) {
    const badge = document.getElementById('card-lock-badge');
    badge.style.animation = 'none';
    void badge.offsetWidth;
    badge.style.animation = 'unlock-pop 0.45s ease';
    setTimeout(() => navigateTo('login'), 350);
  } else {
    navigateTo('schedule');
  }
}

function handleLoginCardClick() { navigateTo('login'); }

/* ══════════════════════════════════════════════════════════════════
   LOGIN — calls /api/login
   ══════════════════════════════════════════════════════════════════ */
const ID_LENGTH = 8;
let currentId   = '';

function renderDisplay() {
  for (let i = 0; i < ID_LENGTH; i++) {
    const seg = document.getElementById('seg' + i);
    const dot = document.getElementById('pd'  + i);
    if (!seg || !dot) continue;
    if (i < currentId.length) {
      seg.textContent = currentId[i];
      seg.classList.add('filled');
      dot.classList.add('filled');
    } else {
      seg.textContent = '_';
      seg.classList.remove('filled');
      dot.classList.remove('filled');
    }
  }
}

function clearError() {
  const el = document.getElementById('login-error');
  if (el) el.textContent = '';
}

function idPress(digit) {
  if (currentId.length >= ID_LENGTH) return;
  clearError();
  currentId += digit;
  renderDisplay();
  if (currentId.length === ID_LENGTH) setTimeout(attemptLogin, 250);
}
function idBackspace() { currentId = currentId.slice(0, -1); clearError(); renderDisplay(); }
function idClear()     { currentId = ''; clearError(); renderDisplay(); }

async function attemptLogin() {
  // Disable keypad while request is in flight
  document.querySelectorAll('.pin-btn').forEach(b => b.disabled = true);

  try {
    const res  = await fetch('/api/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ student_id: currentId }),
    });
    const data = await res.json();

    if (!data.success) {
      document.getElementById('login-error').textContent = '❌ ' + data.error;
      shakeLoginCard();
      currentId = '';
      renderDisplay();
    } else {
      loggedInStudent = data.student;
      showLoginSuccess(data.student.id, data.student.name);
    }
  } catch (err) {
    document.getElementById('login-error').textContent = '⚠️ Server unreachable. Check backend.';
    shakeLoginCard();
    currentId = '';
    renderDisplay();
  } finally {
    document.querySelectorAll('.pin-btn').forEach(b => b.disabled = false);
  }
}

function shakeLoginCard() {
  const card = document.getElementById('login-card-main');
  card.style.animation = 'none';
  void card.offsetWidth;
  card.style.animation = 'shake 0.4s ease';
  setTimeout(() => card.style.animation = '', 400);
}

function showLoginSuccess(id, name) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  document.getElementById('login-avatar').textContent       = initials;
  document.getElementById('login-profile-name').textContent = name;
  document.getElementById('login-profile-id').textContent   = id;
  document.getElementById('login-success-msg').textContent  =
    `Welcome back, ${name.split(' ')[0]}! You're now signed in.`;
  document.getElementById('login-card-main').style.display    = 'none';
  document.getElementById('login-success-card').style.display = 'flex';
}

async function logOut() {
  try { await fetch('/api/logout', { method: 'POST' }); } catch (_) {}
  loggedInStudent = null;
  resetLoginForm();
  navigateTo('dashboard');
}

function resetLoginForm() {
  currentId = '';
  renderDisplay();
  clearError();
  document.getElementById('login-card-main').style.display    = 'flex';
  document.getElementById('login-success-card').style.display = 'none';
}

/* ══════════════════════════════════════════════════════════════════
   SCHEDULE PAGE — calls /api/schedule
   ══════════════════════════════════════════════════════════════════ */
async function loadSchedule() {
  const container = document.getElementById('schedule-content');
  if (!container) return;

  container.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
      <div class="loading-text">Loading your schedule…</div>
    </div>`;

  try {
    const res  = await fetch('/api/schedule');
    const data = await res.json();

    if (!data.success) {
      container.innerHTML = `<div class="api-error">❌ ${data.error}</div>`;
      return;
    }

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const days  = Object.keys(data.schedule);

    if (days.length === 0) {
      container.innerHTML = `<div class="no-classes">📭 No classes scheduled this week.</div>`;
      return;
    }

    container.innerHTML = days.map(day => {
      const isToday = day === today;
      const classes = data.schedule[day];
      return `
        <div class="sched-day-block ${isToday ? 'sched-today' : ''}">
          <div class="sched-day-header">
            <span class="sched-day-name">${day}</span>
            ${isToday ? '<span class="sched-today-badge">TODAY</span>' : ''}
          </div>
          <div class="sched-classes">
            ${classes.map(c => `
              <div class="sched-class-card">
                <div class="sched-time-col">
                  <div class="sched-time-start">${formatTime(c.start_time)}</div>
                  <div class="sched-time-bar"></div>
                  <div class="sched-time-end">${formatTime(c.end_time)}</div>
                </div>
                <div class="sched-info-col">
                  <div class="sched-course-code">${c.code}</div>
                  <div class="sched-course-name">${c.course_name}</div>
                  <div class="sched-course-meta">
                    <span>👨‍🏫 ${c.instructor}</span>
                    <span>📍 ${c.room} · ${c.building}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>`;
    }).join('');

  } catch (err) {
    container.innerHTML = `<div class="api-error">⚠️ Could not load schedule. Is the server running?</div>`;
  }
}

function formatTime(t) {
  const [h, m] = t.split(':').map(Number);
  const ampm   = h >= 12 ? 'PM' : 'AM';
  const h12    = h % 12 || 12;
  return `${h12}:${String(m).padStart(2,'0')} ${ampm}`;
}

/* ══════════════════════════════════════════════════════════════════
   NEWS PAGE — calls /api/news
   ══════════════════════════════════════════════════════════════════ */
async function loadNews() {
  const container = document.getElementById('news-content');
  if (!container) return;

  container.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
      <div class="loading-text">Loading announcements…</div>
    </div>`;

  try {
    const res  = await fetch('/api/news');
    const data = await res.json();

    if (!data.success || data.announcements.length === 0) {
      container.innerHTML = `<div class="no-classes">📭 No announcements right now.</div>`;
      return;
    }

    const categoryColors = {
      Academic:  { bg: 'rgba(8,145,178,0.15)',  border: 'rgba(8,145,178,0.4)',  text: '#38bdf8' },
      Event:     { bg: 'rgba(217,119,6,0.15)',  border: 'rgba(217,119,6,0.4)',  text: '#fbbf24' },
      Emergency: { bg: 'rgba(225,29,72,0.15)',  border: 'rgba(225,29,72,0.4)',  text: '#f87171' },
      General:   { bg: 'rgba(0,120,212,0.15)',  border: 'rgba(0,120,212,0.4)',  text: '#60a5fa' },
    };

    container.innerHTML = data.announcements.map(a => {
      const c   = categoryColors[a.category] || categoryColors.General;
      const ago = timeAgo(a.posted_at);
      return `
        <div class="news-card ${a.is_pinned ? 'news-pinned' : ''}">
          ${a.is_pinned ? '<div class="news-pin-badge">📌 PINNED</div>' : ''}
          <div class="news-category-badge" style="background:${c.bg};border-color:${c.border};color:${c.text};">
            ${a.category}
          </div>
          <div class="news-title">${a.title}</div>
          <div class="news-body">${a.body}</div>
          <div class="news-meta">${ago}</div>
        </div>`;
    }).join('');

  } catch (err) {
    container.innerHTML = `<div class="api-error">⚠️ Could not load news. Is the server running?</div>`;
  }
}

function timeAgo(isoString) {
  const posted = new Date(isoString.replace(' ', 'T'));
  const diff   = Math.floor((Date.now() - posted) / 1000);
  if (diff < 60)         return 'Just now';
  if (diff < 3600)       return `${Math.floor(diff/60)} minutes ago`;
  if (diff < 86400)      return `${Math.floor(diff/3600)} hours ago`;
  return `${Math.floor(diff/86400)} days ago`;
}

/* ══════════════════════════════════════════════════════════════════
   CARD TAP PULSE
   ══════════════════════════════════════════════════════════════════ */
document.querySelectorAll('.nav-card').forEach(card => {
  card.addEventListener('click', function () {
    if (this.id === 'card-schedule' && !loggedInStudent) return;
    this.style.transition  = 'transform 0.1s ease, border-color 0.1s ease';
    this.style.transform   = 'translateY(-4px) scale(0.97)';
    this.style.borderColor = 'rgba(0,150,255,0.8)';
    setTimeout(() => {
      this.style.transform   = '';
      this.style.borderColor = '';
      this.style.transition  = '';
    }, 180);
  });
});

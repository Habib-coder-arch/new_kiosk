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
  // Clear gesture card focus whenever we leave the dashboard
  clearGestureCardFocus();

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

  if (pageId === 'map') {
    // Lazy-load the iframe on first visit — avoids loading the map on startup
    const frame = document.getElementById('campus-map-frame');
    if (frame && !frame.dataset.loaded) {
      frame.dataset.loaded = 'true';
      // src is already set in HTML; this just forces a fresh load if needed
      if (!frame.src || frame.src === 'about:blank') {
        frame.src = 'campus-map.html';
      }
    }
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
  ['welcome-time','dash-status-time','login-status-time','sched-status-time','news-status-time','map-status-time']
    .forEach(id => { if (el(id)) el(id).textContent = timeStr; });
  ['dash-time-big','login-time-big','sched-time-big','news-time-big','map-time-big']
    .forEach(id => { if (el(id)) el(id).textContent = timeStr; });
  ['dash-date','login-date','sched-date','news-date','map-date']
    .forEach(id => { if (el(id)) el(id).textContent = dateStr; });
}
updateClocks();
setInterval(updateClocks, 1000);

/* ══════════════════════════════════════════════════════════════════
   SESSION CHECK ON PAGE LOAD
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


/* ══════════════════════════════════════════════════════════════════
   ▌  HAND GESTURE SYSTEM  v4
   ▌
   ▌  ☝️  POINT  (index only)
   ▌      → Virtual cursor tracks your fingertip.
   ▌      → Stay still over a target for 1.5 s → auto-click.
   ▌        Dwell ring fills visually. Cursor must be stable
   ▌        (< 18 px/frame) before the timer even starts.
   ▌        No dwell fires for 2 s after any navigation.
   ▌
   ▌  ✌️  PEACE  (index + middle, others curled)
   ▌      → Scroll mode. Hand in upper half of frame → scroll UP.
   ▌        Hand in lower half → scroll DOWN. Speed scales with
   ▌        distance from centre. Just hold and move hand up/down.
   ▌
   ▌  👋  OPEN HAND  (all 4 fingers up)
   ▌      → Hold for 0.9 s → go back one level.
   ══════════════════════════════════════════════════════════════════ */

const GP = {
  /* ── tuning ────────────────────────────────────────────────── */
  DWELL_MS:        1500,  // ms of stillness before dwell fires
  DWELL_COOL_MS:   1200,  // lockout after a dwell click
  NAV_COOL_MS:     2000,  // dwell blocked for this long after navigation
  STILL_THRESH:      18,  // max cursor px/frame to count as "still"
  STILL_CONFIRM_MS: 300,  // ms of stillness required before dwell starts
  HOLD_MS:          900,  // ms to hold open_hand before going back
  SCROLL_DEAD:      0.15, // ±dead-zone around centre (normalised, 0-0.5)
  SCROLL_MAX_SPD:    22,  // px scrolled per frame at full deflection
  SMOOTH:           0.15, // EMA smoothing (lower = smoother, more lag)
  /* ── runtime ───────────────────────────────────────────────── */
  enabled:       false,
  streaming:     false,
  gesture:       'none',
  holdStart:     0,
  /* cursor */
  curX:         -400, curY: -400,
  prevX:        -400, prevY: -400,
  dwellEl:       null,
  dwellStart:    0,
  dwellCooldown: 0,
  navCooldown:   0,   // set by clearGestureCardFocus() on every navigate
  stillSince:    0,   // timestamp when cursor became stable
  /* MediaPipe */
  camera: null,
  hands:  null,
};

/* ══════════════════════════════════════════════════════════════════
   GESTURE CLASSIFIER
   lm = 21 MediaPipe landmarks { x, y, z }   (y increases downward)
   A finger is "up" only when its tip is clearly above its PIP joint.
   ══════════════════════════════════════════════════════════════════ */
function gpClassify(lm) {
  const M   = 0.035; // extension margin — prevents half-curled misfire
  const iUp = lm[8].y  < lm[6].y  - M;
  const mUp = lm[12].y < lm[10].y - M;
  const rUp = lm[16].y < lm[14].y - M;
  const pUp = lm[20].y < lm[18].y - M;

  if (iUp &&  mUp &&  rUp &&  pUp) return 'open_hand'; // 👋 all four up
  if (iUp &&  mUp && !rUp && !pUp) return 'peace';     // ✌️ index + middle
  if (iUp && !mUp && !rUp && !pUp) return 'pointing';  // ☝️ index only
  return 'none';
}

/* ══════════════════════════════════════════════════════════════════
   VIRTUAL CURSOR  —  EMA-smoothed, mirrored
   Raw MediaPipe x: 0 = camera-left = screen-right (after mirror flip).
   We flip x so cursor matches what the user sees.
   ══════════════════════════════════════════════════════════════════ */
function gpMoveCursor(rawX, rawY) {
  const tx  = (1 - rawX) * window.innerWidth;
  const ty  = rawY       * window.innerHeight;
  const a   = GP.SMOOTH;

  // On first valid frame, snap to position (avoids initial fly-in)
  GP.prevX  = GP.curX;
  GP.prevY  = GP.curY;
  GP.curX   = (GP.curX < -200) ? tx : GP.curX + a * (tx - GP.curX);
  GP.curY   = (GP.curY < -200) ? ty : GP.curY + a * (ty - GP.curY);

  const el = document.getElementById('gp-cursor');
  if (el) { el.style.left = GP.curX + 'px'; el.style.top = GP.curY + 'px'; }
}

function gpShowCursor(on) {
  const el = document.getElementById('gp-cursor');
  if (el) el.style.display = on ? 'block' : 'none';
  if (!on) gpClearHover();
}

function gpClearHover() {
  if (GP.dwellEl) { GP.dwellEl.classList.remove('gp-hover'); GP.dwellEl = null; }
  GP.dwellStart = 0;
  gpSetDwellPct(0);
}

/* Dwell ring fill — pct 0..1 via conic-gradient */
function gpSetDwellPct(pct) {
  const ring = document.getElementById('gp-cursor-ring');
  if (!ring) return;
  if (pct <= 0) {
    ring.style.background = 'transparent';
    ring.style.boxShadow  = 'none';
  } else {
    ring.style.background =
      `conic-gradient(rgba(0,212,255,0.92) ${pct*360}deg, rgba(0,212,255,0.12) 0deg)`;
    ring.style.boxShadow = pct > 0.4 ? '0 0 16px rgba(0,212,255,0.55)' : 'none';
  }
}

/* ── Hit-test: nearest clickable ancestor ─────────────────────── */
function gpHitTest(x, y) {
  const cur = document.getElementById('gp-cursor');
  if (cur) cur.style.display = 'none';
  const el = document.elementFromPoint(x, y);
  if (cur) cur.style.display = 'block';
  if (!el) return null;
  return el.closest(
    '.nav-card, .pin-btn, .cta-btn, .back-btn, .login-btn, ' +
    '.session-logout-btn, .gp-toggle-btn, .gp-min-btn'
  );
}

/* ── Best scrollable container on the active page ────────────── */
function gpScrollTarget() {
  return (
    document.querySelector('.page.active .inner-page-content') ||
    document.querySelector('.page.active')
  );
}

/* ══════════════════════════════════════════════════════════════════
   DWELL TICK  —  called every frame while pointing
   Guards:
     1. navCooldown  — blocked right after navigation
     2. stillSince   — cursor must be stable before timer starts
     3. target change — resets timer
   ══════════════════════════════════════════════════════════════════ */
function gpDwellTick(target, now) {

  /* ── Guard 1: post-navigation freeze ──────────────────────── */
  if (now < GP.navCooldown) {
    gpClearHover();
    const remaining = ((GP.navCooldown - now) / 1000).toFixed(1);
    return `☝️  Ready in ${remaining}s…`;
  }

  /* ── Guard 2: cursor must be stable first ─────────────────── */
  const dx   = GP.curX - GP.prevX;
  const dy   = GP.curY - GP.prevY;
  const spd  = Math.sqrt(dx*dx + dy*dy);
  const moving = spd > GP.STILL_THRESH;

  if (moving) {
    GP.stillSince = 0;    // reset stability clock whenever cursor moves
    // If we were dwelling on something, cancel it
    if (GP.dwellEl) gpClearHover();
    return target
      ? `☝️  Hold still over: ${gpTargetLabel(target)}`
      : '☝️  Point at a button';
  }

  // Cursor is stable — start stability timer if not already running
  if (!GP.stillSince) GP.stillSince = now;
  const stableMs = now - GP.stillSince;

  if (stableMs < GP.STILL_CONFIRM_MS) {
    // Still stabilising — don't start dwell yet
    return target ? `☝️  Aim: ${gpTargetLabel(target)}` : '☝️  Point at a button';
  }

  /* ── Guard 3: target switch resets dwell ──────────────────── */
  if (target !== GP.dwellEl) {
    if (GP.dwellEl) GP.dwellEl.classList.remove('gp-hover');
    GP.dwellEl    = target;
    GP.dwellStart = target ? now : 0;
    if (target) target.classList.add('gp-hover');
    gpSetDwellPct(0);
    return target ? `☝️  Aim: ${gpTargetLabel(target)}` : '☝️  Point at a button';
  }

  if (!target) { gpSetDwellPct(0); return '☝️  Point at a button'; }

  /* ── Dwell timer running ───────────────────────────────────── */
  const pct = Math.min(1, (now - GP.dwellStart) / GP.DWELL_MS);
  gpSetDwellPct(pct);

  if (pct >= 1) {
    // FIRE
    target.classList.remove('gp-hover');
    target.click();
    GP.dwellEl       = null;
    GP.dwellStart    = 0;
    GP.stillSince    = 0;
    GP.dwellCooldown = now + GP.DWELL_COOL_MS;
    gpSetDwellPct(0);
    return `✅  Clicked: ${gpTargetLabel(target)}`;
  }

  const secs = ((GP.DWELL_MS - (now - GP.dwellStart)) / 1000).toFixed(1);
  return `☝️  ${gpTargetLabel(target)} — ${secs}s`;
}

function gpTargetLabel(el) {
  return (
    el.querySelector('.card-title')?.textContent?.trim() ||
    el.textContent?.trim().replace(/\s+/g, ' ').slice(0, 22) ||
    '…'
  );
}

/* ══════════════════════════════════════════════════════════════════
   PEACE SCROLL  —  zone-based, runs every frame
   The wrist midpoint Y (average of lm[0] and lm[9]) defines zone:
     Upper half  (< 0.5 - DEAD) → scroll UP
     Centre band               → no scroll
     Lower half  (> 0.5 + DEAD) → scroll DOWN
   Speed scales linearly with distance from the dead zone edge.
   This means the user just raises or lowers their hand to scroll —
   no delta tracking, no drift, completely reliable.
   ══════════════════════════════════════════════════════════════════ */
function gpPeaceScroll(lm) {
  // Use mid-palm Y (average wrist + index knuckle) — stable reference
  const palmY = (lm[0].y + lm[9].y) / 2;
  const centre = 0.5;
  const dead   = GP.SCROLL_DEAD;
  let   speed  = 0;

  if (palmY < centre - dead) {
    // Hand is high → scroll UP (negative scrollTop direction)
    const deflect = (centre - dead) - palmY;            // 0..0.35
    const norm    = Math.min(1, deflect / (centre - dead)); // 0..1
    speed = -Math.round(norm * GP.SCROLL_MAX_SPD);
  } else if (palmY > centre + dead) {
    // Hand is low → scroll DOWN
    const deflect = palmY - (centre + dead);
    const norm    = Math.min(1, deflect / (centre - dead));
    speed = Math.round(norm * GP.SCROLL_MAX_SPD);
  }

  if (speed !== 0) {
    const sc = gpScrollTarget();
    if (sc) sc.scrollTop += speed;
  }

  // Descriptive label for the panel
  if (speed < 0)  return `✌️  Scrolling UP  ▲  (${Math.abs(speed)} px/fr)`;
  if (speed > 0)  return `✌️  Scrolling DOWN ▼  (${speed} px/fr)`;
  return '✌️  Peace — move hand up/down to scroll';
}

/* ══════════════════════════════════════════════════════════════════
   SKELETON  —  drawn on the mini-preview canvas, mirrored
   ══════════════════════════════════════════════════════════════════ */
const GP_BONES = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],
  [5,9],[9,13],[13,17],
];

function gpDrawSkeleton(ctx, lm, W, H) {
  const px = p => [(1 - p.x) * W, p.y * H];
  ctx.strokeStyle = 'rgba(0,220,255,0.78)';
  ctx.lineWidth   = 1.8;
  GP_BONES.forEach(([a, b]) => {
    const [ax,ay] = px(lm[a]), [bx,by] = px(lm[b]);
    ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(bx,by); ctx.stroke();
  });
  lm.forEach(p => {
    const [x,y] = px(p);
    ctx.beginPath(); ctx.arc(x, y, 2.8, 0, Math.PI*2);
    ctx.fillStyle = '#00dcff'; ctx.fill();
  });
}

/* ══════════════════════════════════════════════════════════════════
   MediaPipe INITIALISATION
   ══════════════════════════════════════════════════════════════════ */
function gpInit() {
  const video    = document.getElementById('gp-video');
  const canvas   = document.getElementById('gp-canvas');
  const overlay  = document.getElementById('gp-cam-overlay');
  const detected = document.getElementById('gp-detected');
  const progress = document.getElementById('gp-progress-fill');
  const dot      = document.getElementById('gp-status-dot');
  const ctx      = canvas.getContext('2d');
  const W        = canvas.width, H = canvas.height;

  const hands = new Hands({
    locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
  });
  GP.hands = hands;
  hands.setOptions({
    maxNumHands:            1,
    modelComplexity:        1,
    minDetectionConfidence: 0.78,
    minTrackingConfidence:  0.78,
  });

  /* ── Per-frame callback ──────────────────────────────────────── */
  hands.onResults(({ image, multiHandLandmarks }) => {

    /* Always draw the mirrored camera frame */
    ctx.save();
    ctx.translate(W, 0); ctx.scale(-1, 1);
    ctx.drawImage(image, 0, 0, W, H);
    ctx.restore();

    if (!GP.enabled) return;

    /* No hand in frame */
    if (!multiHandLandmarks?.length) {
      if (GP.gesture !== 'none') {
        GP.gesture   = 'none';
        GP.holdStart = 0;
      }
      gpShowCursor(false);
      gpSetDwellPct(0);
      progress.style.width = '0%';
      detected.textContent = 'No hand detected';
      return;
    }

    const lm      = multiHandLandmarks[0];
    const gesture = gpClassify(lm);
    gpDrawSkeleton(ctx, lm, W, H);
    const now = Date.now();

    /* ── Gesture changed: reset hold timer ───────────────────── */
    if (gesture !== GP.gesture) {
      GP.gesture   = gesture;
      GP.holdStart = now;
      if (gesture !== 'pointing') gpShowCursor(false);
      if (gesture !== 'peace')    { /* nothing extra */ }
    }

    /* ════════════════════════════════════════════════════════════
       ☝️  POINTING  —  cursor + dwell
    ════════════════════════════════════════════════════════════ */
    if (gesture === 'pointing') {
      gpShowCursor(true);
      gpMoveCursor(lm[8].x, lm[8].y);

      const target = gpHitTest(GP.curX, GP.curY);
      const label  = gpDwellTick(target, now);
      detected.textContent = label;
      progress.style.width = '0%';
      return;
    }

    /* Leaving pointing: clear hover state */
    gpShowCursor(false);
    gpClearHover();

    /* ════════════════════════════════════════════════════════════
       ✌️  PEACE  —  zone-based scroll (no delta drift)
    ════════════════════════════════════════════════════════════ */
    if (gesture === 'peace') {
      progress.style.width = '0%';
      detected.textContent = gpPeaceScroll(lm);
      return;
    }

    /* ════════════════════════════════════════════════════════════
       👋  OPEN HAND  —  hold to go back
    ════════════════════════════════════════════════════════════ */
    if (gesture === 'open_hand') {
      const elapsed = now - GP.holdStart;
      const pct     = Math.min(100, (elapsed / GP.HOLD_MS) * 100);
      progress.style.width = pct + '%';
      detected.textContent = `👋  Hold to go back… (${((GP.HOLD_MS-elapsed)/1000).toFixed(1)}s)`;

      if (elapsed >= GP.HOLD_MS) {
        progress.style.width = '0%';
        GP.holdStart = now; // prevent re-fire while hand stays open
        const page = document.querySelector('.page.active')?.id;
        if      (page === 'page-welcome')   { /* already home */ }
        else if (page === 'page-dashboard') navigateTo('welcome');
        else                                navigateTo('dashboard');
      }
      return;
    }

    /* ════════════════════════════════════════════════════════════
       NONE / transitional
    ════════════════════════════════════════════════════════════ */
    progress.style.width = '0%';
    detected.textContent = 'Hand detected…';
  });

  /* Start camera */
  const camera = new Camera(video, {
    onFrame: async () => { await hands.send({ image: video }); },
    width: 320, height: 240,
  });
  GP.camera = camera;

  camera.start()
    .then(() => {
      GP.streaming = true;
      overlay.style.opacity       = '0';
      overlay.style.pointerEvents = 'none';
      setTimeout(() => { overlay.style.display = 'none'; }, 400);
      dot.className = 'gp-status-dot gp-dot-on';
      console.log('[Gesture] Camera started ✓');
    })
    .catch(err => {
      console.error('[Gesture] Camera error:', err);
      dot.className = 'gp-status-dot gp-dot-err';
      overlay.querySelector('.gp-cam-msg').innerHTML = '⚠️ Camera<br>permission denied';
    });
}

/* ══════════════════════════════════════════════════════════════════
   STOP CAMERA  —  fully releases the hardware stream
   ══════════════════════════════════════════════════════════════════ */
function gpStopCamera() {
  if (GP.camera) { try { GP.camera.stop(); } catch (_) {} GP.camera = null; }
  const video = document.getElementById('gp-video');
  if (video?.srcObject) {
    video.srcObject.getTracks().forEach(t => t.stop());
    video.srcObject = null;
  }
  const canvas = document.getElementById('gp-canvas');
  if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  const overlay = document.getElementById('gp-cam-overlay');
  if (overlay) {
    overlay.style.display       = 'flex';
    overlay.style.opacity       = '1';
    overlay.style.pointerEvents = 'auto';
    overlay.querySelector('.gp-cam-msg').innerHTML =
      '📷<br>Click <strong>Enable</strong><br>to start camera';
  }
  gpShowCursor(false);
  GP.streaming = false;
  GP.hands     = null;
}

/* ══════════════════════════════════════════════════════════════════
   TOGGLE  ON / OFF
   ══════════════════════════════════════════════════════════════════ */
function toggleGesture() {
  GP.enabled = !GP.enabled;
  const btn   = document.getElementById('gp-toggle-btn');
  const dot   = document.getElementById('gp-status-dot');
  const panel = document.getElementById('gesture-panel');

  if (GP.enabled) {
    btn.textContent = 'ON';
    btn.classList.add('gp-on');
    panel.classList.remove('gp-minimised');
    // Give a 2-second grace period before any dwell can fire
    GP.navCooldown = Date.now() + GP.NAV_COOL_MS;
    if (!GP.streaming) gpInit();
    else dot.className = 'gp-status-dot gp-dot-on';
  } else {
    btn.textContent = 'OFF';
    btn.classList.remove('gp-on');
    dot.className = 'gp-status-dot';
    gpStopCamera();
    const det = document.getElementById('gp-detected');
    const prg = document.getElementById('gp-progress-fill');
    if (det) det.textContent = '—';
    if (prg) prg.style.width = '0%';
  }
}

/* ── Minimise / expand panel ─────────────────────────────────── */
function minimiseGesturePanel() {
  document.getElementById('gesture-panel').classList.toggle('gp-minimised');
}

/* ── Called by navigateTo() on every page change ────────────── */
function clearGestureCardFocus() {
  gpShowCursor(false);
  gpClearHover();
  GP.gesture    = 'none';
  GP.holdStart  = 0;
  GP.stillSince = 0;
  GP.curX = GP.prevX = -400;
  GP.curY = GP.prevY = -400;
  // Block dwell for NAV_COOL_MS after every navigation
  GP.navCooldown = Date.now() + GP.NAV_COOL_MS;
}

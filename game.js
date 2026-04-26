/* ==============================================
   Tab Hoarder — game.js
   ============================================== */

/* ── constants ── */
const MAX_HEALTH = 5;
const LS_KEY     = 'tabHoarder_best';
const DAILY_KEY  = 'tabHoarder_daily';

const TITLES = [
  'URGENT!!!', 'You forgot this', "Don't ignore me",
  'Read me NOW', '⚠️ Action required',
  'Are you still there?', 'Final notice',
];

const SYMBOLS = ['★', '●', '▲', '■', '♦'];

const POWERUP = {
  RAM:        'ram',
  FREEZE:     'freeze',
  NUKE:       'nuke',
  DOUBLE:     'double',
  TIME_WARP:  'timeWarp',
  SHIELD:     'shield',
  AUTO_CLOSE: 'autoClose',
  SCRAMBLE:   'scramble',
};

const POWERUP_CONFIG = {
  [POWERUP.RAM]:        { label: '💉 RAM Restore',    desc: 'Recover 1 RAM bar',             color: '#4caf50' },
  [POWERUP.FREEZE]:     { label: '❄️ Time Freeze',    desc: 'Slow spawns for 8s',             color: '#29b6f6' },
  [POWERUP.NUKE]:       { label: '💣 Tab Nuke',       desc: 'Clear all open tabs',            color: '#ff7043' },
  [POWERUP.DOUBLE]:     { label: '⚡ Double Score',   desc: '2× points for 15s',              color: '#ffd740' },
  [POWERUP.TIME_WARP]:  { label: '⏱ Time Warp',      desc: 'Tab timers slow to 50% for 8s',  color: '#7c4dff' },
  [POWERUP.SHIELD]:     { label: '🛡 Shield',          desc: 'Next expiry deals no damage',    color: '#42a5f5' },
  [POWERUP.AUTO_CLOSE]: { label: '✨ Auto-Close',     desc: 'Instantly closes one random tab', color: '#ff7043' },
  [POWERUP.SCRAMBLE]:   { label: '🌀 Scramble',       desc: 'Shuffles all tab positions',     color: '#ec407a' },
};

const T = {
  CLICK_SPAM: 'clickSpam',
  TIMER_HOLD: 'timerHold',
  MEMORY:     'memory',
  PRECISION:  'precision',
  PANIC:      'panic',
  FAKE:       'fake',
  TYPE_IT:    'typeIt',
  MATH:       'math',
  STROOP:     'stroop',
  SEQUENCE:   'sequence',
  REACTION:   'reaction',
  SLIDER:     'slider',
  CAPTCHA:    'captcha',
  DRAGDROP:   'dragDrop',
  PASSWORD:   'password',
  POWERUP:    'powerup',
  BOSS:       'boss',
  ODD_ONE:    'oddOne',
  KNOB:       'knob',
};

const TIME_LIMIT = {
  [T.CLICK_SPAM]: 7,
  [T.TIMER_HOLD]: 8,
  [T.MEMORY]:     10,
  [T.PRECISION]:  6,
  [T.FAKE]:       8,
  [T.TYPE_IT]:    9,
  [T.MATH]:       6,
  [T.STROOP]:     7,
  [T.SEQUENCE]:   8,
  [T.REACTION]:   7,
  [T.SLIDER]:     7,
  [T.CAPTCHA]:    10,
  [T.DRAGDROP]:   8,
  [T.PASSWORD]:   10,
  [T.POWERUP]:    12,
  [T.ODD_ONE]:    7,
  [T.KNOB]:       8,
};

// Per-type panic overrides (defaults to PANIC_TIME if not listed)
const PANIC_TIME = 5;
const PANIC_TIME_OVERRIDE = {
  [T.TYPE_IT]:  6,
  [T.MATH]:     6,
  [T.SEQUENCE]: 6,
  [T.CAPTCHA]:  7,
  [T.PASSWORD]: 7,
};

function getPanicTime(type) {
  return PANIC_TIME_OVERRIDE[type] ?? PANIC_TIME;
}

const FAVICON_COLOR = {
  [T.CLICK_SPAM]: '#4285f4',
  [T.TIMER_HOLD]: '#f4a430',
  [T.MEMORY]:     '#9c27b0',
  [T.PRECISION]:  '#4caf50',
  [T.FAKE]:       '#4285f4', // disguised as click spam
  [T.TYPE_IT]:    '#00bcd4',
  [T.MATH]:       '#ff5722',
  [T.STROOP]:     '#e91e63',
  [T.SEQUENCE]:   '#795548',
  [T.REACTION]:   '#009688',
  [T.SLIDER]:     '#607d8b',
  [T.CAPTCHA]:    '#5c6bc0',
  [T.DRAGDROP]:   '#8d6e63',
  [T.PASSWORD]:   '#26a69a',
  [T.POWERUP]:    '#4caf50',
  [T.ODD_ONE]:    '#ff6f00',
  [T.KNOB]:       '#5e35b1',
};

const STROOP_COLORS = [
  { name: 'Red',    hex: '#e53935' },
  { name: 'Blue',   hex: '#1e88e5' },
  { name: 'Green',  hex: '#43a047' },
  { name: 'Yellow', hex: '#e0b800' },
  { name: 'Purple', hex: '#8e24aa' },
  { name: 'Orange', hex: '#f4511e' },
];

const WORDS_NORMAL = ['CLOSE', 'CLEAR', 'VIRUS', 'CRASH', 'ERROR', 'PIXEL', 'CLICK', 'BYTES', 'QUERY', 'CACHE', 'LOGIN', 'BLOCK'];
const WORDS_PANIC  = ['TIMEOUT', 'NETWORK', 'PROCESS', 'PROGRAM', 'BROWSER', 'DIGITAL'];

const ODD_CATEGORIES = [
  ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🍒', '🍌'],
  ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'],
  ['🚗', '🚕', '🚌', '🏎', '🚓', '🚑', '🚒', '🚐'],
  ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🥏'],
  ['🌲', '🌳', '🌴', '🌵', '🌾', '🍀', '🌿', '🎄'],
  ['✏️', '📏', '📐', '📎', '🔑', '✂️', '🔧', '🔨'],
];

/* ── difficulty ── */
const DIFF = {
  chill:  { spawnMs: 6000, minSpawnMs: 1200, scaleInterval: 45, fakeAt: 90,  panicAt: 180, doubleAt: 270, linkedAt: 60,  bounceAt: 150, chaosPlusAt: 360 },
  normal: { spawnMs: 4000, minSpawnMs: 800,  scaleInterval: 30, fakeAt: 60,  panicAt: 120, doubleAt: 180, linkedAt: 40,  bounceAt: 90,  chaosPlusAt: 240 },
  chaos:  { spawnMs: 2500, minSpawnMs: 600,  scaleInterval: 20, fakeAt: 30,  panicAt: 60,  doubleAt: 120, linkedAt: 20,  bounceAt: 50,  chaosPlusAt: 150 },
};
const DIFF_DESC = {
  chill:  'Slower spawns, longer ramp-up. Good for learning.',
  normal: 'Moderate speed, all mechanics unlock over time.',
  chaos:  'Fast from the start. Panic mode hits early. Good luck.',
};

let chosenDiff    = 'normal';
let chosenMode    = 'endless'; // 'endless' | 'waves' | 'daily' | 'sprint'
let noPowerups    = false;
let hardMode      = false;
let rng           = () => Math.random();
let devInvincible = false;

/* ── score roll-up animation ── */
let displayedScore = 0;
let scoreRafId     = null;

/* ── settings ── */
const SETTINGS_KEY = 'tabHoarder_settings';
let settings = { colorblind: 'normal', reducedMotion: false };
let settingsPausedGame = false;

function loadSettings() {
  try { settings = { ...settings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)) }; }
  catch { /* keep defaults */ }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function applySettings() {
  document.body.classList.remove('cb-colorblind', 'cb-high-contrast', 'reduced-motion');
  if (settings.colorblind === 'colorblind')   document.body.classList.add('cb-colorblind');
  if (settings.colorblind === 'highcontrast') document.body.classList.add('cb-high-contrast');
  if (settings.reducedMotion)                 document.body.classList.add('reduced-motion');
}

/* ── seeded RNG (mulberry32) for Daily Challenge ── */
function makeMulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function getDailySeed() {
  const d = new Date();
  return parseInt(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`);
}

function loadDailyBest() {
  try { return JSON.parse(localStorage.getItem(DAILY_KEY)) || {}; }
  catch { return {}; }
}

function saveDailyBest(score, time) {
  const rec = loadDailyBest();
  const key = String(getDailySeed());
  if (!rec[key] || score > rec[key].score) {
    rec[key] = { score, time };
    localStorage.setItem(DAILY_KEY, JSON.stringify(rec));
    return true;
  }
  return false;
}

function getDailyBestToday() {
  const rec = loadDailyBest();
  return rec[String(getDailySeed())] || null;
}

/* ── leaderboard (per-difficulty, top 5; sprint uses separate keys) ── */
const BOARD_INIT = { chill: [], normal: [], chaos: [],
                     chill_sprint: [], normal_sprint: [], chaos_sprint: [] };

function loadLeaderboard() {
  try { return { ...BOARD_INIT, ...JSON.parse(localStorage.getItem(LS_KEY)) }; }
  catch { return { ...BOARD_INIT }; }
}

function lbKey() {
  return chosenMode === 'sprint' ? chosenDiff + '_sprint' : chosenDiff;
}

function addToLeaderboard(score, time) {
  const board  = loadLeaderboard();
  const key    = lbKey();
  if (!board[key]) board[key] = [];
  const oldTop = board[key][0]?.score || 0;
  board[key].push({ score, time, date: Date.now() });
  board[key].sort((a, b) => b.score - a.score);
  board[key] = board[key].slice(0, 5);
  localStorage.setItem(LS_KEY, JSON.stringify(board));
  return score > oldTop;
}

function updateStartBest() {
  if (chosenMode === 'daily')  { updateStartDailyBest(); return; }
  const board   = loadLeaderboard();
  const entries = board[lbKey()] || [];
  if (entries.length > 0) {
    const top    = entries[0];
    const prefix = chosenMode === 'sprint' ? `Sprint best (${chosenDiff})` : `Best (${chosenDiff})`;
    dom.startBestEl.textContent = `${prefix}: ${top.score.toLocaleString()} — ${fmt(top.time)}`;
    dom.startBestEl.classList.remove('hidden');
  } else {
    dom.startBestEl.classList.add('hidden');
  }
}

function updateStartDailyBest() {
  const best = getDailyBestToday();
  if (best) {
    dom.startBestEl.textContent = `Today's best: ${best.score.toLocaleString()} — ${fmt(best.time)}`;
    dom.startBestEl.classList.remove('hidden');
  } else {
    dom.startBestEl.textContent = "No score today yet — play now!";
    dom.startBestEl.classList.remove('hidden');
  }
}

function renderLeaderboard() {
  const board   = loadLeaderboard();
  const key     = lbKey();
  const entries = board[key] ?? [];
  const diffCap = chosenDiff.charAt(0).toUpperCase() + chosenDiff.slice(1);
  const label   = chosenMode === 'sprint' ? `Sprint (${diffCap})` : diffCap;
  if (entries.length === 0) {
    dom.leaderboardEl.innerHTML = `<div class="lb-title">${label} — No runs yet</div>`;
    return;
  }
  dom.leaderboardEl.innerHTML = `
    <div class="lb-title">${label} Leaderboard</div>
    ${entries.map((e, i) => `
      <div class="lb-row${e.score === S.score && e.time === S.elapsed ? ' lb-current' : ''}">
        <span class="lb-rank">#${i + 1}</span>
        <span class="lb-score">${e.score.toLocaleString()}</span>
        <span class="lb-time">${fmt(e.time)}</span>
      </div>`).join('')}`;
}


/* ── state ── */
let S = {};

function newState() {
  return {
    running:    false,
    health:     MAX_HEALTH,
    score:      0,
    streak:     0,
    mult:       1,
    startTime:  0,
    elapsed:    0,
    tabs:       new Map(),
    nextId:     0,
    spawnMs:    DIFF[chosenDiff].spawnMs,
    diffCfg:    DIFF[chosenDiff],
    spawnTid:   null,
    tickTid:    null,
    clockTid:   null,
    fakeOn:     false,
    panicOn:    false,
    doubleOn:   false,
    bonusOn:    false,
    criticalOn: false,
    scaleLevel: 0,
    zTop:       100,
    shareMsg:   '',
    tabsDone:   0,
    tabsMissed: 0,
    bestStreak: 0,
    typeCounts: {},
    powerupOn:  false,
    freezeActive: false,
    doubleScoreActive: false,
    doubleScoreTid: null,
    freezeTid: null,
    bossAlive: false,
    linkedOn:      false,
    bounceOn:      false,
    linkGroups:    new Map(),
    nextLinkGroup: 0,
    timeWarpActive: false,
    timeWarpTid:    null,
    shieldActive:   false,
    linkCombos:     0,
    m60: false, m120: false, m180: false, m240: false, m300: false,
    chaosPlus:      false,
    waveNum:        1,
    waveBreather:   false,
    paused:         false,
    pauseStartTime: 0,
  };
}

/* ── DOM refs ── */
const $  = id => document.getElementById(id);
let dom  = {};

/* ── utilities ── */
function mk(tag, cls) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  return el;
}

const rand = (a, b) => Math.floor(rng() * (b - a + 1)) + a;
const pick = arr => arr[Math.floor(rng() * arr.length)];
const fmt  = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeChoices(answer) {
  const pool = [];
  for (let d = 1; d <= 20; d++) {
    if (answer + d > 0) pool.push(answer + d);
    if (answer - d > 0) pool.push(answer - d);
  }
  shuffle(pool);
  return shuffle([answer, pool[0], pool[1], pool[2]]);
}

function getMult(streak) {
  if (streak >= 12) return 3;
  if (streak >= 9)  return 2.5;
  if (streak >= 6)  return 2;
  if (streak >= 3)  return 1.5;
  return 1;
}

/* ── URL bar ── */
let urlToastTid = null;

function getBaseUrl() {
  if (!S.running) return 'tab-hoarder://survive';
  if (S.health <= 1) return 'tab-hoarder://this-is-fine';
  if (S.health <= 2) return 'tab-hoarder://please-help';
  if (S.doubleOn) return 'tab-hoarder://system-overload';
  if (S.panicOn)  return 'tab-hoarder://send-help';
  if (S.fakeOn)   return 'tab-hoarder://trust-no-one';
  return 'tab-hoarder://survive';
}

function setUrl(text, toastMs = 0) {
  if (toastMs > 0) {
    clearTimeout(urlToastTid);
    dom.urlBar.textContent = text;
    dom.urlBar.classList.add('url-toast');
    urlToastTid = setTimeout(() => {
      urlToastTid = null;
      dom.urlBar.classList.remove('url-toast');
      dom.urlBar.textContent = getBaseUrl();
    }, toastMs);
  } else if (!urlToastTid) {
    dom.urlBar.textContent = text;
  }
}

function updateUrl() {
  setUrl(getBaseUrl());
}

/* ── completion burst ── */
function spawnCompletionBurst(el) {
  const rect = el.getBoundingClientRect();
  const burst = mk('div', 'completion-burst');
  burst.style.left = (rect.left + rect.width  / 2) + 'px';
  burst.style.top  = (rect.top  + rect.height / 2) + 'px';
  document.body.appendChild(burst);
  setTimeout(() => burst.remove(), 500);
}

/* ── score popup ── */
function spawnScorePopup(el, points, isBig) {
  const rect = el.getBoundingClientRect();
  const popup = mk('div', 'score-popup' + (isBig ? ' score-popup-big' : ''));
  popup.textContent = '+' + points.toLocaleString();
  popup.style.left = (rect.left + rect.width / 2) + 'px';
  popup.style.top  = (rect.top + 24) + 'px';
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 850);
}

/* ── tab count ── */
function refreshTabCount() {
  let active = 0;
  S.tabs.forEach(t => { if (!t.done && !t.gone) active++; });
  dom.tabCountEl.textContent = S.running && active > 0 ? active + ' open' : '';
}

/* ══════════════════════════════════════════════
   DRAG
   ══════════════════════════════════════════════ */

let drag = null;
let activeTypeId = null; // which type-it tab currently receives keyboard input
let faviconCanvas = null;
let faviconLink   = null;

function setTypeFocus(id) {
  // un-focus previous
  if (activeTypeId !== null && activeTypeId !== id) {
    const prev = S.tabs.get(activeTypeId);
    if (prev) {
      prev.element?.classList.remove('keyboard-focused');
      prev.element?.querySelector('.tab-content')?.classList.remove('type-focused');
      const h = prev.element?.querySelector('.type-hint');
      if (h) h.textContent = 'click to focus';
    }
  }
  activeTypeId = id;
  if (id !== null) {
    const tab = S.tabs.get(id);
    if (tab) {
      tab.element?.classList.add('keyboard-focused');
      tab.element?.querySelector('.tab-content')?.classList.add('type-focused');
      const h = tab.element?.querySelector('.type-hint');
      if (h) h.textContent = '▸ typing…';
    }
  }
}

function initDrag() {
  document.addEventListener('mousemove', e => {
    if (!drag) return;
    const { el, ox, oy, oleft, otop } = drag;
    const area = dom.area;
    let l = oleft + e.clientX - ox;
    let t = otop  + e.clientY - oy;
    l = Math.max(0, Math.min(l, area.offsetWidth  - el.offsetWidth));
    t = Math.max(0, Math.min(t, area.offsetHeight - el.offsetHeight));
    el.style.left = l + 'px';
    el.style.top  = t + 'px';
  });

  document.addEventListener('mouseup', () => { drag = null; });
}

function makeDraggable(el, handle) {
  handle.addEventListener('mousedown', e => {
    drag = {
      el,
      ox:    e.clientX,
      oy:    e.clientY,
      oleft: el.offsetLeft,
      otop:  el.offsetTop,
    };
    el.style.zIndex = ++S.zTop;
    e.preventDefault();
  });
}

/* ══════════════════════════════════════════════
   MINI-GAMES
   ══════════════════════════════════════════════ */

/* ── Click Spam ── */
function mkClickSpam(tab) {
  const goal = 15;
  let n = 0;

  const el = mk('div', 'tab-content');
  el.innerHTML = `
    <p class="mg-instruction">Click the button <strong>${goal} times!</strong></p>
    <div class="mg-click-count">0/${goal}</div>
    <div class="mg-click-bar"><div class="mg-click-bar-fill" style="width:0%"></div></div>
    <button class="mg-btn">CLICK!</button>`;

  const countEl = el.querySelector('.mg-click-count');
  const fillEl  = el.querySelector('.mg-click-bar-fill');

  el.querySelector('.mg-btn').addEventListener('click', () => {
    n++;
    countEl.textContent = `${n}/${goal}`;
    fillEl.style.width  = `${(n / goal) * 100}%`;
    if (n >= goal) completeTab(tab.id);
  });

  return { el, cleanup: () => {} };
}

/* ── Timer Hold ── */
function mkTimerHold(tab) {
  const target = 3.0;
  const tol    = tab.isPanic ? 0.22 : 0.35;
  const maxBar = 5.0;

  const targetPct = (target / maxBar) * 100;
  const tolPct    = (tol    / maxBar) * 100;

  let holdT = null, ivl = null;

  const el = mk('div', 'tab-content');
  el.innerHTML = `
    <p class="mg-instruction">Hold for exactly <strong>3 seconds</strong></p>
    <button class="hold-btn">HOLD</button>
    <div class="hold-progress-track">
      <div class="hold-progress-fill"></div>
      <div class="hold-tolerance-zone" style="left:${targetPct - tolPct}%;width:${tolPct * 2}%"></div>
      <div class="hold-target-marker" style="left:${targetPct}%"></div>
    </div>
    <div class="hold-feedback"></div>`;

  const btn  = el.querySelector('.hold-btn');
  const fill = el.querySelector('.hold-progress-fill');
  const fb   = el.querySelector('.hold-feedback');

  function startHold(e) {
    e.preventDefault();
    if (holdT !== null) return;
    holdT = Date.now();
    btn.classList.add('holding');
    btn.textContent = '…';
    fill.style.background = '#4285f4';

    ivl = setInterval(() => {
      const elapsed = (Date.now() - holdT) / 1000;
      fill.style.width = Math.min((elapsed / maxBar) * 100, 100) + '%';
      fill.style.background =
        elapsed >= target + tol ? '#f44336' :
        elapsed >= target - tol ? '#4caf50' : '#4285f4';
    }, 40);
  }

  function endHold() {
    if (holdT === null) return;
    const dur = (Date.now() - holdT) / 1000;
    holdT = null;
    clearInterval(ivl); ivl = null;
    btn.classList.remove('holding');
    btn.textContent = 'HOLD';

    if (Math.abs(dur - target) <= tol) {
      completeTab(tab.id);
    } else {
      fb.textContent = dur < target ? 'Too short!' : 'Too long!';
      fill.style.background = '#f44336';
      setTimeout(() => {
        fill.style.width = '0%';
        fill.style.background = '#4285f4';
        fb.textContent = '';
      }, 650);
    }
  }

  btn.addEventListener('mousedown', startHold);
  btn.addEventListener('mouseup',   endHold);
  btn.addEventListener('mouseleave', endHold);

  return { el, cleanup: () => clearInterval(ivl) };
}

/* ── Memory ── */
function mkMemory(tab) {
  const displayMs = tab.isPanic ? 1400 : 2500;
  const seq = [pick(SYMBOLS), pick(SYMBOLS), pick(SYMBOLS)];
  let prog = 0, inputPhase = false;

  const el = mk('div', 'tab-content');
  el.innerHTML = `
    <p class="mg-instruction">Watch the sequence…</p>
    <div class="memory-sequence">
      ${seq.map(s => `<div class="memory-symbol">${s}</div>`).join('')}
    </div>
    <div class="memory-buttons" style="opacity:0;pointer-events:none">
      ${SYMBOLS.map(s => `<button class="memory-symbol-btn" data-s="${s}">${s}</button>`).join('')}
    </div>
    <div class="memory-progress" style="opacity:0">0/3</div>`;

  const instEl = el.querySelector('.mg-instruction');
  const seqEl  = el.querySelector('.memory-sequence');
  const btnsEl = el.querySelector('.memory-buttons');
  const progEl = el.querySelector('.memory-progress');

  const tid = setTimeout(() => {
    instEl.textContent = 'Repeat the sequence!';
    seqEl.innerHTML    = '<div class="memory-symbol hidden-sym">?</div>'.repeat(3);
    btnsEl.style.cssText = 'opacity:1;pointer-events:auto;transition:opacity 0.25s';
    progEl.style.cssText  = 'opacity:1;transition:opacity 0.25s';
    inputPhase = true;
  }, displayMs);

  btnsEl.addEventListener('click', e => {
    if (!inputPhase) return;
    const btn = e.target.closest('.memory-symbol-btn');
    if (!btn) return;

    if (btn.dataset.s === seq[prog]) {
      btn.classList.add('correct');
      setTimeout(() => btn.classList.remove('correct'), 300);
      prog++;
      progEl.textContent = `${prog}/3`;
      if (prog >= 3) completeTab(tab.id);
    } else {
      btn.classList.add('wrong');
      setTimeout(() => btn.classList.remove('wrong'), 300);
      prog = 0;
      progEl.textContent = '0/3';
    }
  });

  return { el, cleanup: () => clearTimeout(tid) };
}

/* ── Precision ── */
function mkPrecision(tab) {
  const speed = tab.isPanic ? 170 : 85;
  const TSZ   = 40;

  const el = mk('div', 'tab-content');
  el.style.padding = '10px 10px 8px';
  el.innerHTML = `
    <p class="mg-instruction" style="margin-bottom:2px">Click the moving target!</p>
    <div class="precision-area">
      <div class="precision-target"></div>
    </div>`;

  const area   = el.querySelector('.precision-area');
  const target = el.querySelector('.precision-target');

  let x = rand(10, 180), y = rand(10, 50);
  const angle = Math.random() * Math.PI * 2;
  let vx = Math.cos(angle) * speed;
  let vy = Math.sin(angle) * speed;
  let lastTs = null, rafId = null;

  function frame(ts) {
    if (lastTs === null) lastTs = ts;
    const dt = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;

    const aW = area.offsetWidth  || 256;
    const aH = area.offsetHeight || 108;
    const mx = aW - TSZ, my = aH - TSZ;

    x += vx * dt; y += vy * dt;
    if (x <= 0)  { x = 0;  vx =  Math.abs(vx); }
    if (x >= mx) { x = mx; vx = -Math.abs(vx); }
    if (y <= 0)  { y = 0;  vy =  Math.abs(vy); }
    if (y >= my) { y = my; vy = -Math.abs(vy); }

    target.style.left = x + 'px';
    target.style.top  = y + 'px';
    rafId = requestAnimationFrame(frame);
  }

  rafId = requestAnimationFrame(frame);
  target.addEventListener('click', () => completeTab(tab.id));

  return { el, cleanup: () => cancelAnimationFrame(rafId) };
}

/* ── Type It ── */
function mkTypeIt(tab) {
  const word = pick(tab.isPanic ? WORDS_PANIC : WORDS_NORMAL);
  let pos = 0;
  let autoTid = null;

  const el = mk('div', 'tab-content');
  el.innerHTML = `
    <p class="mg-instruction">Type the word!</p>
    <div class="type-word">${word.split('').map(l => `<span class="type-letter">${l}</span>`).join('')}</div>
    <div class="type-hint">click to focus</div>`;

  const letters = el.querySelectorAll('.type-letter');

  function focus() { setTypeFocus(tab.id); }

  el.addEventListener('click', focus);

  // auto-focus if nothing else is focused yet
  autoTid = setTimeout(() => {
    if (activeTypeId === null && !tab.done && !tab.gone) focus();
  }, 40);

  tab.keyHandler = key => {
    if (tab.done || tab.gone) return;
    if (key === 'Backspace') {
      if (pos > 0) { pos--; letters[pos].classList.remove('typed'); }
      return;
    }
    if (key.length !== 1 || !/[A-Za-z]/.test(key)) return;
    if (key.toUpperCase() === word[pos]) {
      letters[pos].classList.add('typed');
      pos++;
      if (pos >= word.length) completeTab(tab.id);
    } else {
      el.classList.add('type-shake');
      setTimeout(() => el.classList.remove('type-shake'), 300);
      letters.forEach(l => l.classList.remove('typed'));
      pos = 0;
    }
  };

  return {
    el,
    cleanup: () => {
      clearTimeout(autoTid);
      tab.element?.classList.remove('keyboard-focused');
      if (activeTypeId === tab.id) {
        activeTypeId = null;
        // pass focus to the next type-it tab if any
        S.tabs.forEach((t, tid) => {
          if (tid !== tab.id && t.hasKeyboard && !t.done && !t.gone && activeTypeId === null) {
            setTypeFocus(tid);
          }
        });
      }
    },
  };
}

/* ── Math ── */
function mkMath(tab) {
  const max = tab.isPanic ? 15 : 9;
  let a = rand(1, max), b = rand(1, max);
  const op = pick(['+', '−', '×']);
  let answer;

  if (op === '+') {
    answer = a + b;
  } else if (op === '−') {
    if (a < b) [a, b] = [b, a];
    answer = a - b;
  } else {
    a = rand(2, tab.isPanic ? 12 : 9);
    b = rand(2, tab.isPanic ? 12 : 9);
    answer = a * b;
  }

  const choices = makeChoices(answer);

  const el = mk('div', 'tab-content');
  el.innerHTML = `
    <p class="mg-instruction">Solve it!</p>
    <div class="math-question">${a} ${op} ${b} = ?</div>
    <div class="math-choices">
      ${choices.map(c => `<button class="math-btn" data-val="${c}">${c}</button>`).join('')}
    </div>`;

  const questionEl = el.querySelector('.math-question');

  el.querySelector('.math-choices').addEventListener('click', e => {
    const btn = e.target.closest('.math-btn');
    if (!btn) return;
    if (parseInt(btn.dataset.val) === answer) {
      completeTab(tab.id);
    } else {
      btn.classList.add('math-wrong');
      questionEl.classList.add('math-shake');
      setTimeout(() => {
        btn.classList.remove('math-wrong');
        questionEl.classList.remove('math-shake');
      }, 400);
    }
  });

  return { el, cleanup: () => {} };
}

/* ── Stroop ── */
function mkStroop(tab) {
  const numBtns = tab.isPanic ? 6 : 4;
  const pool = shuffle([...STROOP_COLORS]);
  const wordColor    = pool[0]; // what the text SAYS
  const displayColor = pool[1]; // what COLOR the text actually IS (correct answer)
  const extras       = pool.slice(2, numBtns);
  const btnColors    = shuffle([displayColor, ...extras]);

  const el = mk('div', 'tab-content');
  el.innerHTML = `
    <p class="mg-instruction">What <strong>color</strong> is the text?</p>
    <div class="stroop-word" style="color:${displayColor.hex}">${wordColor.name.toUpperCase()}</div>
    <div class="stroop-grid${numBtns >= 5 ? ' cols-3' : ''}">
      ${btnColors.map(c => `
        <button class="stroop-btn" data-name="${c.name}"
          style="background:${c.hex};color:${c.name === 'Yellow' ? '#333' : '#fff'}">${c.name}</button>
      `).join('')}
    </div>`;

  el.querySelector('.stroop-grid').addEventListener('click', e => {
    const btn = e.target.closest('.stroop-btn');
    if (!btn) return;
    if (btn.dataset.name === displayColor.name) {
      completeTab(tab.id);
    } else {
      btn.classList.add('stroop-wrong');
      setTimeout(() => btn.classList.remove('stroop-wrong'), 350);
    }
  });

  return { el, cleanup: () => {} };
}

/* ── Sequence ── */
function mkSequence(tab) {
  const count = tab.isPanic ? 7 : 5;

  const GRID = {
    5: [{x:14,y:10},{x:90,y:10},{x:166,y:10},{x:52,y:62},{x:128,y:62}],
    7: [{x:6,y:8},{x:68,y:8},{x:130,y:8},{x:192,y:8},{x:37,y:62},{x:99,y:62},{x:161,y:62}],
  };

  const positions = GRID[count];
  const nums      = shuffle([...Array(count)].map((_, i) => i + 1));
  const items     = positions.map((pos, i) => ({ ...pos, num: nums[i] }));
  let nextToClick = 1;

  const el = mk('div', 'tab-content');
  el.style.padding = '10px 10px 8px';
  el.innerHTML = `
    <p class="mg-instruction">Click in order: <strong>1 → ${count}</strong></p>
    <div class="sequence-area">
      ${items.map(item => `
        <button class="seq-btn" data-num="${item.num}" style="left:${item.x}px;top:${item.y}px">${item.num}</button>
      `).join('')}
    </div>`;

  el.querySelector('.sequence-area').addEventListener('click', e => {
    const btn = e.target.closest('.seq-btn');
    if (!btn || btn.disabled) return;
    const num = parseInt(btn.dataset.num);

    if (num === nextToClick) {
      btn.classList.add('seq-done');
      btn.disabled = true;
      nextToClick++;
      if (nextToClick > count) completeTab(tab.id);
    } else {
      btn.classList.add('seq-wrong');
      setTimeout(() => {
        el.querySelectorAll('.seq-btn').forEach(b => {
          b.classList.remove('seq-done', 'seq-wrong');
          b.disabled = false;
        });
        nextToClick = 1;
      }, 400);
    }
  });

  return { el, cleanup: () => {} };
}

/* ── Reaction ── */
function mkReaction(tab) {
  const minWait = tab.isPanic ? 700  : 1400;
  const maxWait = tab.isPanic ? 2200 : 3400;
  let phase = 'wait', waitTid = null;

  const el = mk('div', 'tab-content');
  el.innerHTML = `
    <p class="mg-instruction">Wait for the signal…</p>
    <div class="reaction-zone waiting">
      <div class="reaction-text">WAIT</div>
    </div>`;

  const zone = el.querySelector('.reaction-zone');
  const text = el.querySelector('.reaction-text');

  function schedule() {
    waitTid = setTimeout(() => {
      phase = 'ready';
      zone.className = 'reaction-zone ready';
      text.textContent = 'CLICK!';
    }, rand(minWait, maxWait));
  }

  schedule();

  zone.addEventListener('click', () => {
    if (phase === 'ready') {
      completeTab(tab.id);
    } else {
      clearTimeout(waitTid);
      zone.className = 'reaction-zone early';
      text.textContent = 'TOO EARLY!';
      setTimeout(() => {
        zone.className = 'reaction-zone waiting';
        text.textContent = 'WAIT';
        phase = 'wait';
        schedule();
      }, 750);
    }
  });

  return { el, cleanup: () => clearTimeout(waitTid) };
}

/* ── Slider ── */
function mkSlider(tab) {
  const zoneW  = tab.isPanic ? 12 : 20; // target zone width as % of track
  const speed  = tab.isPanic ? 55 : 35; // % per second
  const zoneL  = rand(10, 90 - zoneW);  // zone left edge %

  const el = mk('div', 'tab-content');
  el.innerHTML = `
    <p class="mg-instruction">Stop the slider in the <strong>green zone!</strong></p>
    <div class="slider-track">
      <div class="slider-zone" style="left:${zoneL}%;width:${zoneW}%"></div>
      <div class="slider-handle"></div>
    </div>
    <button class="mg-btn slider-stop-btn">STOP!</button>
    <div class="slider-feedback"></div>`;

  const handle  = el.querySelector('.slider-handle');
  const feedEl  = el.querySelector('.slider-feedback');

  let pos = 0, dir = 1, rafId = null, lastTs = null, stopped = false;

  function frame(ts) {
    if (lastTs === null) lastTs = ts;
    const dt = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;
    pos += dir * speed * dt;
    if (pos >= 100) { pos = 100; dir = -1; }
    if (pos <= 0)   { pos = 0;   dir =  1; }
    handle.style.left = pos + '%';
    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);

  el.querySelector('.slider-stop-btn').addEventListener('click', () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(rafId);
    rafId = null;

    if (pos >= zoneL && pos <= zoneL + zoneW) {
      handle.style.background = '#4caf50';
      completeTab(tab.id);
    } else {
      handle.style.background = '#f44336';
      feedEl.textContent = 'Missed! Watch the zone.';
      feedEl.style.color = '#f44336';
      setTimeout(() => {
        stopped = false;
        pos = 0; dir = 1; lastTs = null;
        handle.style.background = '';
        feedEl.textContent = '';
        rafId = requestAnimationFrame(frame);
      }, 800);
    }
  });

  return { el, cleanup: () => { if (rafId) cancelAnimationFrame(rafId); } };
}

/* ── Captcha ── */
function mkCaptcha(tab) {
  const ICONS = [
    { icon: '🚗', label: 'cars' },
    { icon: '🌳', label: 'trees' },
    { icon: '🏠', label: 'houses' },
    { icon: '⛵', label: 'boats' },
    { icon: '✈️', label: 'planes' },
    { icon: '🚲', label: 'bikes' },
    { icon: '🐱', label: 'cats' },
    { icon: '🍎', label: 'apples' },
  ];
  const cols = tab.isPanic ? 4 : 3;
  const total = cols * cols;
  const target = pick(ICONS);
  const others = ICONS.filter(i => i.label !== target.label);

  // Pick how many correct (2-4)
  const correctCount = rand(2, Math.min(4, total - 2));
  const cells = [];
  for (let i = 0; i < correctCount; i++) cells.push({ ...target, correct: true });
  while (cells.length < total) cells.push({ ...pick(others), correct: false });
  shuffle(cells);

  let selected = new Set();
  const correctIds = new Set(cells.map((c, i) => c.correct ? i : -1).filter(i => i >= 0));

  const el = mk('div', 'tab-content');
  el.style.padding = '10px 10px 8px';
  el.innerHTML = `
    <p class="mg-instruction">Select all <strong>${target.label}</strong></p>
    <div class="captcha-grid" style="grid-template-columns:repeat(${cols},1fr)">
      ${cells.map((c, i) => `<button class="captcha-cell" data-i="${i}">${c.icon}</button>`).join('')}
    </div>
    <button class="mg-btn captcha-verify-btn">Verify</button>`;

  const grid = el.querySelector('.captcha-grid');
  const verifyBtn = el.querySelector('.captcha-verify-btn');

  grid.addEventListener('click', e => {
    const cell = e.target.closest('.captcha-cell');
    if (!cell) return;
    const i = parseInt(cell.dataset.i);
    if (selected.has(i)) { selected.delete(i); cell.classList.remove('captcha-sel'); }
    else                 { selected.add(i);    cell.classList.add('captcha-sel'); }
  });

  verifyBtn.addEventListener('click', () => {
    const isCorrect =
      selected.size === correctIds.size &&
      [...selected].every(i => correctIds.has(i));

    if (isCorrect) {
      completeTab(tab.id);
    } else {
      // flash wrong selections
      el.querySelectorAll('.captcha-cell').forEach((cell, i) => {
        if (selected.has(i) && !correctIds.has(i)) cell.classList.add('captcha-wrong');
        if (!selected.has(i) && correctIds.has(i)) cell.classList.add('captcha-missed');
      });
      selected.clear();
      setTimeout(() => {
        el.querySelectorAll('.captcha-cell').forEach(c => {
          c.classList.remove('captcha-sel', 'captcha-wrong', 'captcha-missed');
        });
      }, 600);
    }
  });

  return { el, cleanup: () => {} };
}

/* ── Drag & Drop ── */
function mkDragDrop(tab) {
  const FILES = [
    { icon: '📄', label: 'report.txt' },
    { icon: '🖼️', label: 'photo.png' },
    { icon: '🎵', label: 'music.mp3' },
    { icon: '📊', label: 'data.csv' },
    { icon: '📦', label: 'archive.zip' },
  ];
  const FOLDERS = [
    { icon: '📁', label: 'Documents' },
    { icon: '🗂️', label: 'Work' },
    { icon: '💾', label: 'Backup' },
    { icon: '🗃️', label: 'Archives' },
  ];

  const correctFile   = pick(FILES);
  const correctFolder = pick(FOLDERS);
  const decoyFiles    = shuffle(FILES.filter(f => f !== correctFile)).slice(0, tab.isPanic ? 2 : 1);
  const decoyFolders  = shuffle(FOLDERS.filter(f => f !== correctFolder)).slice(0, tab.isPanic ? 1 : 0);

  const allFiles   = shuffle([correctFile, ...decoyFiles]);
  const allFolders = shuffle([correctFolder, ...decoyFolders]);

  const el = mk('div', 'tab-content');
  el.style.padding = '10px 10px 8px';
  el.innerHTML = `
    <p class="mg-instruction">Drop <strong>${correctFile.icon} ${correctFile.label}</strong> into <strong>${correctFolder.icon} ${correctFolder.label}</strong></p>
    <div class="dd-area">
      <div class="dd-files">
        ${allFiles.map(f => `<div class="dd-file" draggable="true" data-label="${f.label}">${f.icon}<span>${f.label}</span></div>`).join('')}
      </div>
      <div class="dd-folders">
        ${allFolders.map(f => `<div class="dd-folder" data-label="${f.label}">${f.icon}<span>${f.label}</span></div>`).join('')}
      </div>
    </div>`;

  let draggedLabel = null;

  el.querySelectorAll('.dd-file').forEach(file => {
    file.addEventListener('dragstart', e => {
      draggedLabel = file.dataset.label;
      file.classList.add('dd-dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    file.addEventListener('dragend', () => {
      draggedLabel = null;
      file.classList.remove('dd-dragging');
    });
  });

  el.querySelectorAll('.dd-folder').forEach(folder => {
    folder.addEventListener('dragover', e => { e.preventDefault(); folder.classList.add('dd-over'); });
    folder.addEventListener('dragleave', () => folder.classList.remove('dd-over'));
    folder.addEventListener('drop', e => {
      e.preventDefault();
      folder.classList.remove('dd-over');
      if (draggedLabel === correctFile.label && folder.dataset.label === correctFolder.label) {
        completeTab(tab.id);
      } else {
        folder.classList.add('dd-wrong');
        setTimeout(() => folder.classList.remove('dd-wrong'), 500);
      }
    });
  });

  return { el, cleanup: () => {} };
}

/* ── Password Builder ── */
function mkPassword(tab) {
  const ALL_RULES = [
    { id: 'num',   label: 'contains a number',      test: s => /\d/.test(s) },
    { id: 'upper', label: 'has an uppercase letter', test: s => /[A-Z]/.test(s) },
    { id: 'lower', label: 'has a lowercase letter',  test: s => /[a-z]/.test(s) },
    { id: 'len4',  label: 'is 4+ characters',        test: s => s.length >= 4 },
    { id: 'len6',  label: 'is 6+ characters',        test: s => s.length >= 6 },
    { id: 'sym',   label: 'contains ! or ?',         test: s => /[!?]/.test(s) },
  ];

  const ruleCount = tab.isPanic ? 3 : 2;
  const rules = shuffle([...ALL_RULES]).slice(0, ruleCount);
  let pwd = '';
  let autoTid = null;

  const el = mk('div', 'tab-content');
  el.style.padding = '10px 10px 8px';
  el.innerHTML = `
    <p class="mg-instruction">Type a valid password:</p>
    <ul class="pwd-rules">
      ${rules.map(r => `<li class="pwd-rule" data-id="${r.id}">${r.label}</li>`).join('')}
    </ul>
    <div class="pwd-display"></div>
    <div class="type-hint">click to focus</div>`;

  const displayEl = el.querySelector('.pwd-display');
  const ruleEls   = el.querySelectorAll('.pwd-rule');

  function render() {
    displayEl.textContent = pwd || '…';
    ruleEls.forEach(li => {
      const rule = rules.find(r => r.id === li.dataset.id);
      li.classList.toggle('pwd-rule-ok', rule && rule.test(pwd));
    });
  }
  render();

  function focus() { setTypeFocus(tab.id); }
  el.addEventListener('click', focus);

  autoTid = setTimeout(() => {
    if (activeTypeId === null && !tab.done && !tab.gone) focus();
  }, 40);

  tab.keyHandler = key => {
    if (tab.done || tab.gone) return;
    if (key === 'Backspace') {
      pwd = pwd.slice(0, -1);
      render();
      return;
    }
    if (key === 'Enter') {
      if (rules.every(r => r.test(pwd))) {
        completeTab(tab.id);
      } else {
        displayEl.classList.add('pwd-shake');
        setTimeout(() => displayEl.classList.remove('pwd-shake'), 350);
      }
      return;
    }
    if (key.length !== 1 || pwd.length >= 16) return;
    pwd += key;
    render();
    // auto-complete if all rules pass
    if (rules.every(r => r.test(pwd))) completeTab(tab.id);
  };

  return {
    el,
    cleanup: () => {
      clearTimeout(autoTid);
      tab.element?.classList.remove('keyboard-focused');
      if (activeTypeId === tab.id) {
        activeTypeId = null;
        S.tabs.forEach((t, tid) => {
          if (tid !== tab.id && t.hasKeyboard && !t.done && !t.gone && activeTypeId === null) {
            setTypeFocus(tid);
          }
        });
      }
    },
  };
}

/* ── Boss Tab ── */
function mkBoss(tab) {
  const goal   = 30;
  const rageAt = 15;
  let n        = 0;
  let enraged  = false;

  const el = mk('div', 'tab-content');
  el.innerHTML = `
    <p class="mg-instruction">⚠️ <strong>BOSS TAB</strong> — Click <strong>${goal} times!</strong></p>
    <div class="mg-click-count boss-count">0/${goal}</div>
    <div class="mg-click-bar"><div class="mg-click-bar-fill" style="width:0%"></div></div>
    <button class="mg-btn boss-btn">DESTROY!</button>`;

  const countEl = el.querySelector('.boss-count');
  const fillEl  = el.querySelector('.mg-click-bar-fill');
  const instEl  = el.querySelector('.mg-instruction');
  const btn     = el.querySelector('.boss-btn');

  btn.addEventListener('click', () => {
    n++;
    countEl.textContent = `${n}/${goal}`;
    fillEl.style.width  = `${(n / goal) * 100}%`;

    if (!enraged && n >= rageAt) {
      enraged = true;
      instEl.innerHTML = '😡 <strong>ENRAGED!</strong> Keep going!';
      btn.classList.add('boss-btn-enraged');
      tab.element?.classList.add('boss-enraged');
      fillEl.style.background = '#b71c1c';
    }

    if (n >= goal) completeTab(tab.id);
  });

  return { el, cleanup: () => {} };
}

function spawnBossTab() {
  if (!S.running || S.bossAlive) return;
  S.bossAlive = true;

  const id = S.nextId++;
  const tab = {
    id,
    type:     T.BOSS,
    inner:    T.BOSS,
    isPanic:  false,
    title:    '⚠️ BOSS TAB — Defeat me!',
    tLimit:   18,
    deadline: Date.now() + 18000,
    element:  null,
    done:     false,
    gone:     false,
    cleanup:  null,
    keyHandler: null,
    hasKeyboard: false,
    isBonus:    false,
    isCritical: false,
  };

  const card = mk('div', 'tab-card boss-tab');
  card.id = `tab-${id}`;

  const cW = 340, cH = 260;
  const pos = findSpawnPosition(cW, cH);
  card.style.left  = pos.x + 'px';
  card.style.top   = pos.y + 'px';
  card.style.width = cW + 'px';

  const header = mk('div', 'tab-header boss-header');
  header.innerHTML = `
    <div class="tab-title-row">
      <div class="tab-favicon" style="background:#c62828"></div>
      <span class="tab-title" style="color:#c62828;font-weight:800">${tab.title}</span>
      <div class="tab-close-x">✕</div>
    </div>
    <div class="tab-timer-track"><div class="tab-timer-fill"></div></div>`;
  card.appendChild(header);

  tab.element = card;
  S.tabs.set(id, tab);

  const game = mkBoss(tab);
  card.appendChild(game.el);
  tab.cleanup = game.cleanup;

  makeDraggable(card, header);

  // Pulse the whole game area red
  dom.area.classList.add('boss-active');

  Object.assign(card.style, {
    opacity:    '0',
    transform:  'scale(0.7) translateY(-20px)',
    transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
  });
  dom.area.appendChild(card);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    card.style.opacity   = '1';
    card.style.transform = 'scale(1) translateY(0)';
  }));

  setUrl('tab-hoarder://BOSS-TAB-DETECTED', 4000);
  refreshTabCount();
}

/* ── Power-up ── */
function applyPowerup(kind) {
  const cfg = POWERUP_CONFIG[kind];
  setUrl(`tab-hoarder://${cfg.label.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`, 3000);

  if (kind === POWERUP.RAM) {
    S.health = Math.min(MAX_HEALTH, S.health + 1);
    renderHealth();
  } else if (kind === POWERUP.FREEZE) {
    clearTimeout(S.freezeTid);
    S.spawnMs = Math.min(S.spawnMs * 2, 8000);
    restartSpawn();
    S.freezeActive = true;
    S.freezeTid = setTimeout(() => {
      S.freezeActive = false;
      S.spawnMs = Math.max(S.diffCfg.minSpawnMs, S.diffCfg.spawnMs * Math.pow(0.9, S.scaleLevel));
      restartSpawn();
    }, 8000);
  } else if (kind === POWERUP.NUKE) {
    const toNuke = [];
    S.tabs.forEach((t, id) => { if (!t.done && !t.gone && t.type !== T.POWERUP) toNuke.push(id); });
    toNuke.forEach(id => dismissTab(id));
  } else if (kind === POWERUP.DOUBLE) {
    clearTimeout(S.doubleScoreTid);
    S.doubleScoreActive = true;
    dom.multEl.classList.add('double-score-active');
    S.doubleScoreTid = setTimeout(() => {
      S.doubleScoreActive = false;
      dom.multEl.classList.remove('double-score-active');
    }, 15000);
  } else if (kind === POWERUP.TIME_WARP) {
    clearTimeout(S.timeWarpTid);
    S.timeWarpActive = true;
    dom.area.classList.add('time-warp-active');
    S.timeWarpTid = setTimeout(() => {
      S.timeWarpActive = false;
      dom.area.classList.remove('time-warp-active');
    }, 8000);
  } else if (kind === POWERUP.SHIELD) {
    S.shieldActive = true;
    dom.segs.forEach(s => s.classList.add('shielded'));
  } else if (kind === POWERUP.AUTO_CLOSE) {
    const candidates = [];
    S.tabs.forEach((t, id) => {
      if (!t.done && !t.gone && t.type !== T.POWERUP && t.type !== T.BOSS && t.type !== T.FAKE) {
        candidates.push(id);
      }
    });
    if (candidates.length > 0) completeTab(pick(candidates));
  } else if (kind === POWERUP.SCRAMBLE) {
    const positions = [];
    S.tabs.forEach(t => {
      if (!t.done && !t.gone && t.element) {
        positions.push({
          x: parseFloat(t.element.style.left) || 0,
          y: parseFloat(t.element.style.top)  || 0,
        });
      }
    });
    shuffle(positions);
    let i = 0;
    S.tabs.forEach(t => {
      if (!t.done && !t.gone && t.element) {
        const pos = positions[i++];
        if (!t.isBouncing) {
          t.element.style.transition = 'left 0.35s ease-out, top 0.35s ease-out';
          setTimeout(() => { if (t.element) t.element.style.transition = ''; }, 380);
        }
        t.element.style.left = pos.x + 'px';
        t.element.style.top  = pos.y + 'px';
      }
    });
  }
}

function mkPowerup(tab) {
  const kind = pick(Object.values(POWERUP));
  const cfg  = POWERUP_CONFIG[kind];

  const el = mk('div', 'tab-content');
  el.innerHTML = `
    <p class="mg-instruction powerup-label" style="color:${cfg.color}">${cfg.label}</p>
    <p class="powerup-desc">${cfg.desc}</p>
    <button class="mg-btn powerup-claim-btn" style="background:${cfg.color}">Claim!</button>`;

  el.querySelector('.powerup-claim-btn').addEventListener('click', () => {
    applyPowerup(kind);
    completeTab(tab.id);
  });

  return { el, cleanup: () => {} };
}

/* ── Find the Odd One ── */
function mkOddOne(tab) {
  const cols  = tab.isPanic ? 4 : 3;
  const total = cols * 2; // 6 or 8 cells

  const catPool  = shuffle([...ODD_CATEGORIES]);
  const mainCat  = catPool[0];
  const oddCat   = catPool[1];
  const mainIcons = shuffle([...mainCat]).slice(0, total - 1);
  const oddIcon   = pick(oddCat);

  const cells = shuffle([
    ...mainIcons.map(icon => ({ icon, isOdd: false })),
    { icon: oddIcon, isOdd: true },
  ]);

  const el = mk('div', 'tab-content');
  el.style.padding = '10px 10px 8px';
  el.innerHTML = `
    <p class="mg-instruction">Find the <strong>odd one out!</strong></p>
    <div class="oddone-grid" style="grid-template-columns:repeat(${cols},1fr)">
      ${cells.map(c => `<button class="oddone-cell" data-odd="${c.isOdd}">${c.icon}</button>`).join('')}
    </div>`;

  el.querySelector('.oddone-grid').addEventListener('click', e => {
    const btn = e.target.closest('.oddone-cell');
    if (!btn) return;
    if (btn.dataset.odd === 'true') {
      btn.classList.add('oddone-correct');
      completeTab(tab.id);
    } else {
      btn.classList.add('oddone-wrong');
      setTimeout(() => btn.classList.remove('oddone-wrong'), 400);
    }
  });

  return { el, cleanup: () => {} };
}

/* ── Volume Knob ── */
function mkKnob(tab) {
  const RANGE_MIN = -135, RANGE_MAX = 135;
  const tol         = tab.isPanic ? 12 : 20;
  const targetAngle = rand(RANGE_MIN + 50, RANGE_MAX - 50);
  const tA1 = targetAngle - tol;
  const tA2 = targetAngle + tol;
  const R = 50, CX = 60, CY = 60;

  let currentAngle    = 0;
  let dragging        = false;
  let prevMouseAngle  = null;

  function toRad(d) { return d * Math.PI / 180; }

  function ptOnArc(a) {
    return {
      x: +(CX + R * Math.sin(toRad(a))).toFixed(2),
      y: +(CY - R * Math.cos(toRad(a))).toFixed(2),
    };
  }

  function arcPath(a1, a2) {
    const p1    = ptOnArc(a1), p2 = ptOnArc(a2);
    const large = ((a2 - a1) % 360 + 360) % 360 > 180 ? 1 : 0;
    return `M ${p1.x} ${p1.y} A ${R} ${R} 0 ${large} 1 ${p2.x} ${p2.y}`;
  }

  function dotPos(a) {
    return {
      x: +(CX + 18 * Math.sin(toRad(a))).toFixed(2),
      y: +(CY - 18 * Math.cos(toRad(a))).toFixed(2),
    };
  }

  const bgPath   = arcPath(RANGE_MIN, RANGE_MAX);
  const tgtPath  = arcPath(tA1, tA2);
  const initDot  = dotPos(currentAngle);
  const initFill = arcPath(RANGE_MIN, currentAngle);

  const el = mk('div', 'tab-content');
  el.innerHTML = `
    <p class="mg-instruction">Turn the knob to the <strong>green zone!</strong></p>
    <div class="knob-container">
      <svg class="knob-svg" viewBox="0 0 120 120" width="120" height="120">
        <path fill="none" stroke="#e0e0e0" stroke-width="8" stroke-linecap="round" d="${bgPath}"/>
        <path class="knob-arc-target" fill="none" stroke="#4caf50" stroke-width="8" stroke-linecap="round" opacity="0.55" d="${tgtPath}"/>
        <path class="knob-arc-fill" fill="none" stroke="#4285f4" stroke-width="5" stroke-linecap="round" d="${initFill}"/>
        <circle class="knob-body" cx="60" cy="60" r="26" fill="#f0f0f0" stroke="#bbb" stroke-width="2" style="cursor:grab"/>
        <circle class="knob-dot" cx="${initDot.x}" cy="${initDot.y}" r="4" fill="#333" pointer-events="none"/>
      </svg>
    </div>
    <div class="knob-feedback"></div>`;

  const fillPathEl = el.querySelector('.knob-arc-fill');
  const dotEl      = el.querySelector('.knob-dot');
  const bodyEl     = el.querySelector('.knob-body');
  const feedEl     = el.querySelector('.knob-feedback');
  const svgEl      = el.querySelector('.knob-svg');

  function updateVisual() {
    const fill = Math.abs(currentAngle - RANGE_MIN) > 0.5
      ? arcPath(RANGE_MIN, currentAngle) : '';
    fillPathEl.setAttribute('d', fill);
    const dp = dotPos(currentAngle);
    dotEl.setAttribute('cx', dp.x);
    dotEl.setAttribute('cy', dp.y);
    const inZone = currentAngle >= tA1 && currentAngle <= tA2;
    bodyEl.setAttribute('fill', inZone ? '#e8f5e9' : '#f0f0f0');
    fillPathEl.setAttribute('stroke', inZone ? '#4caf50' : '#4285f4');
  }

  function getMouseAngle(e) {
    const rect = svgEl.getBoundingClientRect();
    const cx   = rect.left + rect.width / 2;
    const cy   = rect.top  + rect.height / 2;
    return Math.atan2(e.clientX - cx, -(e.clientY - cy)) * 180 / Math.PI;
  }

  function onMouseMove(e) {
    if (!dragging) return;
    const mAngle = getMouseAngle(e);
    let delta = mAngle - prevMouseAngle;
    if (delta >  180) delta -= 360;
    if (delta < -180) delta += 360;
    prevMouseAngle = mAngle;
    currentAngle   = Math.max(RANGE_MIN, Math.min(RANGE_MAX, currentAngle + delta));
    updateVisual();
  }

  function onMouseUp() {
    if (!dragging) return;
    dragging = false;
    const inZone = currentAngle >= tA1 && currentAngle <= tA2;
    if (inZone) {
      completeTab(tab.id);
    } else {
      feedEl.textContent = currentAngle < tA1 ? 'Too low!' : 'Too high!';
      feedEl.style.color = '#f44336';
      setTimeout(() => { feedEl.textContent = ''; }, 700);
    }
  }

  bodyEl.addEventListener('mousedown', e => {
    dragging       = true;
    prevMouseAngle = getMouseAngle(e);
    e.preventDefault();
  });
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup',   onMouseUp);

  return {
    el,
    cleanup: () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup',   onMouseUp);
    },
  };
}

/* ── dispatcher ── */
function buildGame(type, tab) {
  switch (type) {
    case T.CLICK_SPAM: return mkClickSpam(tab);
    case T.TIMER_HOLD: return mkTimerHold(tab);
    case T.MEMORY:     return mkMemory(tab);
    case T.PRECISION:  return mkPrecision(tab);
    case T.TYPE_IT:    return mkTypeIt(tab);
    case T.MATH:       return mkMath(tab);
    case T.STROOP:     return mkStroop(tab);
    case T.SEQUENCE:   return mkSequence(tab);
    case T.REACTION:   return mkReaction(tab);
    case T.SLIDER:     return mkSlider(tab);
    case T.CAPTCHA:    return mkCaptcha(tab);
    case T.DRAGDROP:   return mkDragDrop(tab);
    case T.PASSWORD:   return mkPassword(tab);
    case T.POWERUP:    return mkPowerup(tab);
    case T.ODD_ONE:    return mkOddOne(tab);
    case T.KNOB:       return mkKnob(tab);
    default:           return mkClickSpam(tab);
  }
}

/* ══════════════════════════════════════════════
   TAB SPAWNING & MANAGEMENT
   ══════════════════════════════════════════════ */

/* ── Bounce physics ── */
function startBounce(card) {
  const area  = dom.area;
  const speed = S.panicOn ? 80 : 50;
  const angle = Math.random() * Math.PI * 2;
  let vx = Math.cos(angle) * speed;
  let vy = Math.sin(angle) * speed;
  let lastTs = null;
  let rafId  = null;

  function frame(ts) {
    // Idle while the card is being dragged
    if (drag?.el === card) { lastTs = null; rafId = requestAnimationFrame(frame); return; }

    if (lastTs === null) lastTs = ts;
    const dt = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;

    const aW = area.offsetWidth  || window.innerWidth;
    const aH = area.offsetHeight || (window.innerHeight - 52);
    const cW = card.offsetWidth  || 280;
    const cH = card.offsetHeight || 235;

    let x = parseFloat(card.style.left) || 0;
    let y = parseFloat(card.style.top)  || 0;

    x += vx * dt;
    y += vy * dt;

    if (x <= 0)       { x = 0;       vx =  Math.abs(vx); }
    if (x >= aW - cW) { x = aW - cW; vx = -Math.abs(vx); }
    if (y <= 0)       { y = 0;       vy =  Math.abs(vy); }
    if (y >= aH - cH) { y = aH - cH; vy = -Math.abs(vy); }

    card.style.left = x + 'px';
    card.style.top  = y + 'px';
    rafId = requestAnimationFrame(frame);
  }

  rafId = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(rafId);
}

/* ── Linked pair spawner ── */
function spawnLinkedPair() {
  if (!S.running) return;
  const groupId = S.nextLinkGroup++;
  S.linkGroups.set(groupId, { ids: [], doneTimes: [] });
  spawnTab({ linkGroup: groupId });
  setTimeout(() => { if (S.running) spawnTab({ linkGroup: groupId }); }, rand(300, 700));
}

/* ── Confetti burst (new high score) ── */
function spawnConfetti() {
  const colors = ['#f4c430', '#4285f4', '#4caf50', '#f44336', '#ab47bc', '#00bcd4', '#ff7043'];
  for (let i = 0; i < 55; i++) {
    const el = mk('div', 'confetti-particle');
    const isRect = Math.random() > 0.5;
    el.style.cssText = [
      `left:${rand(15, 85)}vw`,
      `top:${rand(5, 40)}vh`,
      `background:${pick(colors)}`,
      `width:${rand(5, 12)}px`,
      `height:${rand(5, 12)}px`,
      `border-radius:${isRect ? '2px' : '50%'}`,
      `--tx:${rand(-160, 160)}px`,
      `--ty:${rand(-220, 60)}px`,
      `--rot:${rand(-400, 400)}deg`,
      `animation-delay:${rand(0, 500)}ms`,
    ].join(';');
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1900);
  }
}

/* ── Link bonus popup ── */
function spawnLinkBonusPopup(bonus) {
  const popup = mk('div', 'score-popup score-popup-big link-bonus-popup');
  popup.textContent = '🔗 LINK +' + bonus.toLocaleString();
  popup.style.left = '50%';
  popup.style.top  = '80px';
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 1100);
}

const DIFF_TYPES = {
  chill:  [T.CLICK_SPAM, T.SEQUENCE, T.REACTION, T.SLIDER, T.ODD_ONE, T.MATH, T.CAPTCHA, T.DRAGDROP],
  normal: [T.CLICK_SPAM, T.SEQUENCE, T.REACTION, T.SLIDER, T.ODD_ONE, T.MATH, T.CAPTCHA, T.DRAGDROP,
           T.TIMER_HOLD, T.MEMORY, T.PRECISION, T.TYPE_IT],
  chaos:  [T.CLICK_SPAM, T.SEQUENCE, T.REACTION, T.SLIDER, T.ODD_ONE, T.MATH, T.CAPTCHA, T.DRAGDROP,
           T.TIMER_HOLD, T.MEMORY, T.PRECISION, T.TYPE_IT,
           T.STROOP, T.KNOB, T.PASSWORD],
};

function pickType() {
  if (S.panicOn  && rng() < 0.18) return T.PANIC;
  if (S.fakeOn   && rng() < 0.15) return T.FAKE;
  if (!noPowerups && S.powerupOn && rng() < 0.08) return T.POWERUP;
  return pick(DIFF_TYPES[chosenDiff]);
}

/* ── Non-overlapping spawn position (chill + normal only) ── */
function findSpawnPosition(cW, cH) {
  const area = dom.area;
  const aW   = area.offsetWidth  || window.innerWidth;
  const aH   = area.offsetHeight || (window.innerHeight - 52);
  const maxX = Math.max(10, aW - cW - 10);
  const maxY = Math.max(10, aH - cH - 10);

  if (chosenDiff === 'chaos') {
    return { x: rand(10, maxX), y: rand(10, maxY) };
  }

  // Gather rects of all live tabs
  const rects = [];
  S.tabs.forEach(t => {
    if (!t.element || t.done || t.gone) return;
    rects.push({
      x: parseFloat(t.element.style.left) || 0,
      y: parseFloat(t.element.style.top)  || 0,
      w: t.element.offsetWidth  || cW,
      h: t.element.offsetHeight || cH,
    });
  });

  const pad = 18; // breathing room between cards
  for (let i = 0; i < 25; i++) {
    const x = rand(10, maxX);
    const y = rand(10, maxY);
    const clear = rects.every(r =>
      x > r.x + r.w + pad || x + cW + pad < r.x ||
      y > r.y + r.h + pad || y + cH + pad < r.y
    );
    if (clear) return { x, y };
  }
  // Fallback: screen is too crowded, place randomly
  return { x: rand(10, maxX), y: rand(10, maxY) };
}

function spawnTab(opts = {}) {
  if (!S.running) return;
  const { linkGroup = null, forceType = null } = opts;

  // Linked tabs always use a plain base type (no panic/fake/powerup wrapping)
  const type    = linkGroup !== null ? pick(DIFF_TYPES[chosenDiff])
                : forceType !== null ? forceType
                : pickType();
  const isPanic = type === T.PANIC;
  const isFake  = type === T.FAKE;
  const inner   = isPanic ? pick(DIFF_TYPES[chosenDiff])
                : isFake  ? pick(DIFF_TYPES[chosenDiff])
                : type;
  const gameT   = (isPanic || isFake) ? inner : type;
  const tBase   = isPanic ? getPanicTime(inner)
                : isFake  ? TIME_LIMIT[inner]
                : TIME_LIMIT[type];
  const tLimit  = S.chaosPlus ? Math.max(3, Math.round(tBase * 0.75)) : tBase;
  const id      = S.nextId++;

  // Bouncing: only on base tabs (not linked, panic, fake, powerup)
  const isBouncing = S.bounceOn && linkGroup === null &&
                     !isPanic && type !== T.FAKE && type !== T.POWERUP &&
                     rng() < 0.2;

  const tab = {
    id, type, inner, isPanic,
    title:       pick(TITLES),
    tLimit,
    deadline:    Date.now() + tLimit * 1000,
    element:     null,
    done:        false,
    gone:        false,
    cleanup:     null,
    keyHandler:  null,
    hasKeyboard: gameT === T.TYPE_IT || gameT === T.PASSWORD,
    isBonus:     false,
    isCritical:  false,
    revealed:    false,
    linkGroup,
    isBouncing,
  };

  // Roll bonus / critical (mutually exclusive, not on panic/fake/powerup/linked)
  if (!isPanic && type !== T.FAKE && type !== T.POWERUP && linkGroup === null) {
    if (S.bonusOn && rng() < 0.12) {
      tab.isBonus = true;
    } else if (S.criticalOn && rng() < 0.15) {
      tab.isCritical = true;
    }
  }

  /* build card */
  let cardClass = 'tab-card';
  if (isPanic)            cardClass += ' panic';
  if (tab.isBonus)        cardClass += ' bonus-tab';
  if (tab.isCritical)     cardClass += ' critical-tab';
  if (type === T.POWERUP) cardClass += ' powerup-tab';
  if (linkGroup !== null) cardClass += ' linked-tab';
  if (isBouncing)         cardClass += ' bouncing-tab';
  const card = mk('div', cardClass);
  card.id = `tab-${id}`;

  const cW = 280, cH = 235;
  const pos = findSpawnPosition(cW, cH);
  card.style.left = pos.x + 'px';
  card.style.top  = pos.y + 'px';

  /* banners (link > bonus/critical) */
  if (linkGroup !== null) {
    const banner = mk('div', 'tab-type-banner link-banner');
    banner.textContent = '🔗  LINKED PAIR';
    card.appendChild(banner);
  } else if (tab.isBonus) {
    const banner = mk('div', 'tab-type-banner bonus-banner');
    banner.textContent = '★  BONUS  ·  +2× SCORE';
    card.appendChild(banner);
  } else if (tab.isCritical) {
    const banner = mk('div', 'tab-type-banner critical-banner');
    banner.textContent = '⚠  CRITICAL  ·  −2 RAM';
    card.appendChild(banner);
  }

  /* header */
  const header = mk('div', 'tab-header');
  header.innerHTML = `
    <div class="tab-title-row">
      <div class="tab-favicon" style="background:${FAVICON_COLOR[gameT] || '#4285f4'}"></div>
      <span class="tab-title">${tab.title}</span>
      <div class="tab-minimize-btn" title="Minimize">−</div>
      <div class="tab-close-x">✕</div>
    </div>
    <div class="tab-timer-track"><div class="tab-timer-fill"></div></div>`;
  card.appendChild(header);

  /* minimize button */
  const minBtn = header.querySelector('.tab-minimize-btn');
  minBtn.addEventListener('mousedown', e => e.stopPropagation());
  minBtn.addEventListener('click', e => {
    e.stopPropagation();
    const isMin = card.classList.toggle('minimized');
    minBtn.textContent = isMin ? '+' : '−';
    minBtn.title = isMin ? 'Restore' : 'Minimize';
  });

  /* mini-game content */
  tab.element = card;
  S.tabs.set(id, tab);

  // Register with link group
  if (linkGroup !== null) {
    const grp = S.linkGroups.get(linkGroup);
    if (grp) grp.ids.push(id);
  }

  const game = buildGame(gameT, tab);
  card.appendChild(game.el);
  tab.cleanup = game.cleanup;

  // Wrap cleanup with bounce cancel if bouncing
  if (isBouncing) {
    const stopBounce  = startBounce(card);
    const prevCleanup = tab.cleanup;
    tab.cleanup = () => { prevCleanup?.(); stopBounce(); };
  }

  makeDraggable(card, header);

  /* spawn animation — spring pop */
  Object.assign(card.style, {
    opacity:    '0',
    transform:  'scale(0.7) translateY(-18px)',
    transition: 'opacity 0.2s ease-out, transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1)',
  });
  dom.area.appendChild(card);

  requestAnimationFrame(() => requestAnimationFrame(() => {
    card.style.opacity   = '1';
    card.style.transform = 'scale(1) translateY(0)';
  }));

  refreshTabCount();
}

function revealFake(tab) {
  if (tab.revealed) return;
  tab.revealed = true;

  const card = tab.element;
  if (!card) return;

  card.classList.add('fake-penalty');
  const warn = mk('div', 'fake-warning');
  warn.textContent = 'FAKE TAB! 🙈';
  card.appendChild(warn);

  setTimeout(() => {
    warn.remove();
    card.classList.remove('fake-penalty');

    // Enable the close button
    const closeBtn = card.querySelector('.tab-close-x');
    if (closeBtn) {
      closeBtn.style.cssText = 'cursor:pointer;background:#e57373;color:#fff;width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;flex-shrink:0';
      closeBtn.addEventListener('click', e => {
        e.stopPropagation();
        dismissTab(tab.id);
      });
    }
  }, 900);
}

function completeTab(id) {
  const tab = S.tabs.get(id);
  if (!tab || tab.done || tab.gone) return;

  // Intercept fake tabs — reveal instead of completing
  if (tab.type === T.FAKE) {
    revealFake(tab);
    return;
  }
  tab.done = true;
  tab.cleanup?.();

  /* scoring */
  const prevMult  = S.mult;
  const bonusMult       = tab.isBonus ? 2 : 1;
  const doubleScoreMult = S.doubleScoreActive ? 2 : 1;
  const isBoss          = tab.type === T.BOSS;

  if (isBoss) {
    S.bossAlive = false;
    dom.area.classList.remove('boss-active');
  }

  S.streak++;
  if (S.streak > S.bestStreak) S.bestStreak = S.streak;
  S.mult  = getMult(S.streak);
  if (tab.type !== T.POWERUP && tab.type !== T.BOSS) {
    S.tabsDone++;
    const trackType = tab.inner ?? tab.type;
    S.typeCounts[trackType] = (S.typeCounts[trackType] || 0) + 1;
  }
  const points = tab.type === T.POWERUP ? 0
               : isBoss                 ? Math.round(500 * doubleScoreMult)
               : Math.round(100 * S.mult * bonusMult * doubleScoreMult);
  S.score += points;
  refreshHUD(S.mult > prevMult);

  /* link group check */
  if (tab.linkGroup !== null) {
    const grp = S.linkGroups.get(tab.linkGroup);
    if (grp) {
      grp.doneTimes.push(Date.now());
      if (grp.doneTimes.length === 2) {
        const diff = Math.abs(grp.doneTimes[1] - grp.doneTimes[0]);
        if (diff <= 3000) {
          const linkBonus = Math.round(150 * S.mult);
          S.score += linkBonus;
          S.linkCombos++;
          refreshHUD(false);
          spawnLinkBonusPopup(linkBonus);
          setUrl('tab-hoarder://link-combo!', 2500);
        }
        S.linkGroups.delete(tab.linkGroup);
      }
    }
  }

  /* score popup */
  spawnScorePopup(tab.element, points, tab.isBonus || S.mult > 1);

  /* flash + scale-up burst, then fly out */
  const c  = tab.element;
  const fg = completeFxColor();
  spawnCompletionBurst(c);
  c.style.pointerEvents = 'none';
  c.style.transition = 'transform 0.1s ease-out, box-shadow 0.06s, background 0.06s';
  c.style.transform  = 'scale(1.07)';
  c.style.boxShadow  = `0 0 0 3px ${fg}, 0 8px 32px ${fg}bf`;
  c.style.background = `${fg}14`;

  setTimeout(() => {
    c.style.transition = 'opacity .3s ease-in, transform .3s cubic-bezier(0.4,0,1,1)';
    c.style.opacity    = '0';
    c.style.transform  = 'scale(0.8) translateY(-24px)';
    setTimeout(() => dropTab(id), 300);
  }, 120);
}

function expireTab(id) {
  const tab = S.tabs.get(id);
  if (!tab || tab.done || tab.gone) return;
  tab.gone = true;
  tab.cleanup?.();

  S.streak = 0;
  S.mult   = 1;
  // Break any pending link group — cascade expire the sibling
  if (tab.linkGroup !== null) {
    const grp = S.linkGroups.get(tab.linkGroup);
    if (grp) {
      grp.ids.forEach(sibId => {
        if (sibId !== id) {
          const sib = S.tabs.get(sibId);
          if (sib && !sib.done && !sib.gone) {
            setUrl('tab-hoarder://LINK-BROKEN!', 2200);
            setTimeout(() => {
              const s2 = S.tabs.get(sibId);
              if (s2 && !s2.done && !s2.gone) expireTab(sibId);
            }, 300);
          }
        }
      });
      S.linkGroups.delete(tab.linkGroup);
    }
  }
  if (tab.type !== T.POWERUP && tab.type !== T.BOSS) S.tabsMissed++;
  if (tab.type === T.BOSS) {
    S.bossAlive = false;
    dom.area.classList.remove('boss-active');
  }
  refreshHUD(false);

  // Bonus, powerup, and boss tabs don't cost health when missed
  if (!tab.isBonus && tab.type !== T.POWERUP && tab.type !== T.BOSS) {
    if (S.shieldActive) {
      S.shieldActive = false;
      dom.segs.forEach(s => s.classList.remove('shielded'));
      setUrl('tab-hoarder://SHIELD-BLOCKED!', 2000);
    } else {
      loseHealth();
      // Critical tabs deal double damage
      if (tab.isCritical) loseHealth();
    }
  }

  /* flash, then crumple out */
  const c  = tab.element;
  const fg = expireFxColor();
  c.style.pointerEvents = 'none';
  c.style.transition = 'transform 0.07s ease-out, box-shadow 0.06s, background 0.06s';
  c.style.transform  = 'scale(1.02) rotate(-1deg)';
  c.style.boxShadow  = `0 0 0 3px ${fg}, 0 8px 32px ${fg}bf`;
  c.style.background = `${fg}14`;

  setTimeout(() => {
    c.style.transition = 'opacity .36s ease-in, transform .36s ease-in';
    c.style.opacity    = '0';
    c.style.transform  = 'scale(0.78) rotate(-4deg) translateY(10px)';
    setTimeout(() => dropTab(id), 360);
  }, 90);
}

function dismissTab(id) {
  const tab = S.tabs.get(id);
  if (!tab || tab.done || tab.gone) return;
  tab.done = true;
  tab.cleanup?.();

  // Reward for correctly closing a revealed fake tab
  if (tab.type === T.FAKE && tab.revealed) {
    const points = Math.round(50 * S.mult);
    S.score += points;
    refreshHUD(false);
    spawnScorePopup(tab.element, points, false);
  }

  const c = tab.element;
  c.style.pointerEvents = 'none';
  c.style.transition = 'opacity .22s ease-out, transform .22s ease-out';
  c.style.opacity   = '0';
  c.style.transform = 'scale(0.88)';
  setTimeout(() => dropTab(id), 220);
}

function dropTab(id) {
  S.tabs.get(id)?.element?.remove();
  S.tabs.delete(id);
  // if the dropped tab was the keyboard focus, clear it
  if (activeTypeId === id) activeTypeId = null;
  refreshTabCount();
}

/* ══════════════════════════════════════════════
   HEALTH
   ══════════════════════════════════════════════ */

function loseHealth() {
  if (!S.running) return;
  if (devInvincible) return;
  const lostIdx = S.health - 1;
  S.health = Math.max(0, S.health - 1);
  renderHealth();
  updateUrl();

  // Drain animation on the segment just lost
  const seg = dom.segs[lostIdx];
  if (seg) {
    seg.classList.add('draining');
    setTimeout(() => seg.classList.remove('draining'), 480);
  }

  // Shake intensity scales with remaining health
  const shakeClass = S.health <= 1 ? 'shaking-extreme' : S.health <= 2 ? 'shaking-hard' : 'shaking';
  dom.area.classList.remove('shaking', 'shaking-hard', 'shaking-extreme');
  void dom.area.offsetWidth; // restart animation
  dom.area.classList.add(shakeClass);
  setTimeout(() => dom.area.classList.remove(shakeClass), 520);

  if (S.health <= 0) endGame();
}

function renderHealth() {
  dom.segs.forEach((seg, i) => {
    seg.classList.toggle('lost',     i >= S.health);
    seg.classList.toggle('critical', i < S.health && S.health <= 2);
  });
  if (dom.vignetteEl) {
    dom.vignetteEl.classList.toggle('vignette-1', S.running && S.health <= 1);
    dom.vignetteEl.classList.toggle('vignette-2', S.running && S.health === 2);
  }
  updateFavicon();
}

/* ── Favicon (updates to reflect health) ── */
function updateFavicon() {
  if (!faviconCanvas) {
    faviconCanvas = document.createElement('canvas');
    faviconCanvas.width = faviconCanvas.height = 32;
  }
  if (!faviconLink) {
    faviconLink = document.querySelector("link[rel~='icon']");
    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      document.head.appendChild(faviconLink);
    }
  }
  const ctx = faviconCanvas.getContext('2d');
  ctx.clearRect(0, 0, 32, 32);

  ctx.fillStyle = '#1e1e3a';
  ctx.fillRect(0, 0, 32, 32);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('T', 16, 12);

  const health  = S.running ? S.health : MAX_HEALTH;
  const barColor = health <= 1 ? '#f44336' : health <= 2 ? '#f4c430' : '#4caf50';
  const segW = 4, gap = 2;
  const totalW = MAX_HEALTH * segW + (MAX_HEALTH - 1) * gap;
  const startX = (32 - totalW) / 2;
  for (let i = 0; i < MAX_HEALTH; i++) {
    ctx.fillStyle = i < health ? barColor : '#333';
    ctx.fillRect(startX + i * (segW + gap), 24, segW, 5);
  }

  faviconLink.href = faviconCanvas.toDataURL('image/png');
}

/* ══════════════════════════════════════════════
   HUD
   ══════════════════════════════════════════════ */

function animateScore(target) {
  if (scoreRafId !== null) {
    cancelAnimationFrame(scoreRafId);
    scoreRafId = null;
  }
  const start = displayedScore;
  const diff  = target - start;
  if (diff <= 0) {
    displayedScore = target;
    dom.scoreEl.textContent = target.toLocaleString();
    return;
  }
  const dur   = 260;
  const begin = performance.now();
  function step(now) {
    const t    = Math.min((now - begin) / dur, 1);
    const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic
    const cur  = Math.round(start + diff * ease);
    dom.scoreEl.textContent = cur.toLocaleString();
    if (t < 1) {
      scoreRafId = requestAnimationFrame(step);
    } else {
      displayedScore = target;
      scoreRafId     = null;
    }
  }
  scoreRafId = requestAnimationFrame(step);
}

function refreshHUD(bump = false) {
  animateScore(S.score);
  dom.multEl.textContent  = S.mult > 1 ? `${S.mult}×` : '';

  // Streak fire indicator
  if (S.streak >= 3) {
    const fires = S.streak >= 12 ? '🔥🔥🔥' : S.streak >= 6 ? '🔥🔥' : '🔥';
    dom.streakEl.textContent = `${fires} ${S.streak}`;
  } else {
    dom.streakEl.textContent = '';
  }

  if (bump) {
    dom.multEl.classList.remove('bump');
    requestAnimationFrame(() => dom.multEl.classList.add('bump'));
    setTimeout(() => dom.multEl.classList.remove('bump'), 380);
  }
}

/* ── settings-aware color helpers ── */
function timerFillColor(pct) {
  if (S.timeWarpActive) return '#7c4dff';
  if (settings.colorblind === 'colorblind') {
    return pct > 0.5 ? '#0288d1' : pct > 0.25 ? '#ff9800' : '#7b1fa2';
  }
  if (settings.colorblind === 'highcontrast') {
    return pct > 0.5 ? '#1b5e20' : pct > 0.25 ? '#e65100' : '#b71c1c';
  }
  return pct > 0.5 ? '#4caf50' : pct > 0.25 ? '#f4c430' : '#f44336';
}

function completeFxColor() {
  if (settings.colorblind === 'colorblind')   return '#0288d1';
  if (settings.colorblind === 'highcontrast') return '#1b5e20';
  return '#4caf50';
}

function expireFxColor() {
  if (settings.colorblind === 'colorblind')   return '#e65100';
  if (settings.colorblind === 'highcontrast') return '#b71c1c';
  return '#f44336';
}

/* ══════════════════════════════════════════════
   TICK — timer bars + expiry check (every 100ms)
   ══════════════════════════════════════════════ */

function tick() {
  if (!S.running) return;
  const now     = Date.now();
  const expired = [];

  S.tabs.forEach((tab, id) => {
    if (tab.done || tab.gone) return;

    // Time Warp: extend deadlines by half the tick interval (net 50% slow)
    if (S.timeWarpActive) tab.deadline += 50;
    // Freeze: extend deadlines by full tick interval (net frozen)
    if (S.freezeActive) tab.deadline += 100;

    const rem = tab.deadline - now;
    const pct = Math.max(0, rem / (tab.tLimit * 1000));

    const fill = tab.element?.querySelector('.tab-timer-fill');
    if (fill) {
      fill.style.width      = (pct * 100) + '%';
      fill.style.background = timerFillColor(pct);
    }

    // Urgency pulse: red throb when < 2s left
    tab.element?.classList.toggle('tab-urgent', rem > 0 && rem <= 2000);

    // Tab aging: desaturate content as time drains
    const contentEl = tab.element?.querySelector('.tab-content');
    if (contentEl) {
      if (pct < 0.5) {
        const sat = Math.max(25, pct * 200);
        contentEl.style.filter = `saturate(${sat.toFixed(0)}%)`;
      } else {
        contentEl.style.filter = '';
      }
    }

    if (rem <= 0) expired.push(id);
  });

  expired.forEach(id => expireTab(id));
}

/* ══════════════════════════════════════════════
   CLOCK + DIFFICULTY SCALING (every 1s)
   ══════════════════════════════════════════════ */

function clockTick() {
  if (!S.running) return;
  S.elapsed = Math.floor((Date.now() - S.startTime) / 1000);
  if (chosenMode === 'sprint') {
    const remaining = Math.max(0, 90 - S.elapsed);
    dom.timerEl.textContent = fmt(remaining);
    if (S.elapsed >= 90) { endGame(); return; }
    if (remaining <= 10) dom.timerEl.style.color = '#f44336';
    else if (remaining <= 20) dom.timerEl.style.color = '#f4c430';
    else dom.timerEl.style.color = '';
  } else {
    dom.timerEl.textContent = fmt(S.elapsed);
    dom.timerEl.style.color = '';
  }

  const t = S.elapsed;

  const cfg = S.diffCfg;

  /* spawn rate +10% every scaleInterval seconds */
  const lvl = Math.floor(t / cfg.scaleInterval);
  if (lvl > S.scaleLevel) {
    S.scaleLevel = lvl;
    S.spawnMs    = Math.max(cfg.minSpawnMs, S.spawnMs * 0.9);
    restartSpawn();
    if (lvl === 1) setUrl('tab-hoarder://speed-increasing', 3500);
  }

  if (t >= 30 && !S.powerupOn) {
    S.powerupOn = true;
  }

  // Boss tab every 60s starting at 60s
  if (t >= 60 && t % 60 === 0 && S.running) {
    spawnBossTab();
  }

  // Milestone banners
  if (t >= 60  && !S.m60)  { S.m60  = true; showMilestoneBanner(MILESTONE_MSGS[60]);  }
  if (t >= 120 && !S.m120) { S.m120 = true; showMilestoneBanner(MILESTONE_MSGS[120]); }
  if (t >= 180 && !S.m180) { S.m180 = true; showMilestoneBanner(MILESTONE_MSGS[180]); }
  if (t >= 240 && !S.m240) { S.m240 = true; showMilestoneBanner(MILESTONE_MSGS[240]); }
  if (t >= 300 && !S.m300) { S.m300 = true; showMilestoneBanner(MILESTONE_MSGS[300]); }

  // Adaptive difficulty check every 15s
  if (t % 15 === 0) adaptDifficulty();

  if (t >= cfg.linkedAt && !S.linkedOn) {
    S.linkedOn = true;
    setUrl('tab-hoarder://linked-tabs-incoming', 3500);
  }
  if (t >= cfg.bounceAt && !S.bounceOn) {
    S.bounceOn = true;
    setUrl('tab-hoarder://tabs-are-escaping', 3500);
  }
  if (t >= cfg.fakeAt  && !S.fakeOn)   {
    S.fakeOn  = true;
    S.bonusOn = true;
    setUrl('tab-hoarder://fake-tabs-incoming', 3500);
  }
  if (t >= cfg.panicAt && !S.panicOn)  {
    S.panicOn     = true;
    S.criticalOn  = true;
    setUrl('tab-hoarder://PANIC', 3500);
  }
  if (t >= cfg.doubleAt && !S.doubleOn) {
    S.doubleOn = true;
    restartSpawn();
    setUrl('tab-hoarder://system-overload', 3500);
  }
  if (t >= cfg.chaosPlusAt && !S.chaosPlus) {
    S.chaosPlus = true;
    S.spawnMs   = Math.max(cfg.minSpawnMs, Math.round(S.spawnMs * 0.85));
    restartSpawn();
    setUrl('tab-hoarder://chaos-plus', 3500);
    showMilestoneBanner('CHAOS+ ENGAGED ☠️');
  }

  // Waves mode: 3-minute round → 10s breather → next wave
  if (chosenMode === 'waves' && t > 0 && t % 180 === 0 && !S.waveBreather) {
    S.waveNum++;
    if (S.health < MAX_HEALTH) {
      S.health = Math.min(MAX_HEALTH, S.health + 1);
      renderHealth();
    } else {
      // already full — bonus points
      S.score += 500;
      refreshHUD(false);
    }
    showWaveBreather(S.waveNum, () => {
      restartSpawn();
      setTimeout(spawnTab, 400);
    });
  }
}

/* ── Adaptive difficulty ── */
function adaptDifficulty() {
  if (!S.running || S.freezeActive || S.elapsed < 30) return;
  const cfg        = S.diffCfg;
  const baseScaled = Math.max(cfg.minSpawnMs, cfg.spawnMs * Math.pow(0.9, S.scaleLevel));
  let changed      = false;

  if (S.health <= 1 && S.streak < 3) {
    // Struggling: ease up (up to +25% above current scaled rate)
    const ceiling = baseScaled * 1.25;
    if (S.spawnMs < ceiling - 10) { S.spawnMs = Math.min(S.spawnMs * 1.08, ceiling); changed = true; }
  } else if (S.health >= MAX_HEALTH && S.streak >= 9) {
    // Thriving: push harder (down to -15% below current scaled rate)
    const floor = Math.max(baseScaled * 0.85, cfg.minSpawnMs);
    if (S.spawnMs > floor + 10) { S.spawnMs = Math.max(S.spawnMs * 0.95, floor); changed = true; }
  }
  if (changed) restartSpawn();
}

/* ── Milestone banner ── */
const MILESTONE_MSGS = {
  60:  "You're still alive?!",
  120: "Most browsers don't last this long.",
  180: "You've become one with the tabs.",
  240: "Tab Hoarder Supreme. 👑",
  300: "Seriously, just close some tabs.",
};

function showMilestoneBanner(msg) {
  const el = mk('div', 'milestone-banner');
  el.textContent = msg;
  dom.area.appendChild(el);
  setTimeout(() => el.remove(), 3800);
}

/* ── Wave breather overlay ── */
function showWaveBreather(waveNum, onDone) {
  S.waveBreather = true;
  clearInterval(S.spawnTid);

  const overlay  = mk('div', 'wave-breather-overlay');
  overlay.id = 'wave-breather-overlay';
  const card = mk('div', 'wave-breather-card');

  const waveLabel = mk('div', 'wb-wave-label');
  waveLabel.textContent = `Wave ${waveNum - 1} Complete!`;

  const healMsg = mk('div', 'wb-heal-msg');
  healMsg.textContent = S.health < MAX_HEALTH ? '+1 RAM restored' : 'RAM full — bonus 500 pts!';

  const nextLabel = mk('div', 'wb-next-label');
  nextLabel.textContent = `Wave ${waveNum} starting in`;

  const countdown = mk('div', 'wb-countdown');
  countdown.textContent = '10';

  card.append(waveLabel, healMsg, nextLabel, countdown);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  let secs = 10;
  const tid = setInterval(() => {
    secs--;
    countdown.textContent = secs;
    if (secs <= 0) {
      clearInterval(tid);
      overlay.remove();
      S.waveBreather = false;
      onDone();
    }
  }, 1000);
}

function restartSpawn() {
  clearInterval(S.spawnTid);
  S.spawnTid = setInterval(() => {
    if (S.linkedOn && rng() < 0.12) spawnLinkedPair();
    else spawnTab();
    if (S.doubleOn) setTimeout(spawnTab, Math.round(S.spawnMs / 2));
  }, S.spawnMs);
}

/* ══════════════════════════════════════════════
   GAME LIFECYCLE
   ══════════════════════════════════════════════ */

function startGame() {
  clearInterval(S.spawnTid);
  clearInterval(S.tickTid);
  clearInterval(S.clockTid);
  clearTimeout(S.doubleScoreTid);
  clearTimeout(S.freezeTid);
  clearTimeout(S.timeWarpTid);
  clearTimeout(urlToastTid);
  urlToastTid = null;
  if (scoreRafId !== null) { cancelAnimationFrame(scoreRafId); scoreRafId = null; }
  S.tabs.forEach(t => t.cleanup?.());

  // Remove any lingering overlays
  document.getElementById('wave-breather-overlay')?.remove();
  $('pause-overlay')?.classList.add('hidden');

  // Set mode globals before newState() reads them
  noPowerups = dom.noPowerupsEl?.checked || false;
  hardMode   = dom.hardModeEl?.checked   || false;
  rng = chosenMode === 'daily' ? makeMulberry32(getDailySeed()) : () => Math.random();

  activeTypeId   = null;
  displayedScore = 0;
  S = newState();
  S.running   = true;
  S.startTime = Date.now();

  dom.area.innerHTML = '';
  dom.area.classList.remove('boss-active', 'time-warp-active');
  if (hardMode) dom.area.classList.add('hard-mode');
  else          dom.area.classList.remove('hard-mode');
  dom.segs.forEach(s => s.classList.remove('shielded'));
  dom.startScreen.classList.add('hidden');
  dom.crashScreen.classList.add('hidden');
  document.getElementById('crash-content')?.classList.remove('crash-anim');
  dom.newRecordEl.textContent = 'NEW RECORD!';
  dom.urlBar.classList.remove('url-toast');
  dom.urlBar.textContent = 'tab-hoarder://survive';

  renderHealth(); // also clears vignette via S.running check
  refreshHUD();
  refreshTabCount();
  dom.timerEl.textContent = chosenMode === 'sprint' ? fmt(90) : '00:00';

  S.tickTid  = setInterval(tick,      100);
  S.clockTid = setInterval(clockTick, 1000);
  restartSpawn();
  setTimeout(spawnTab, 500);
}

function endGame() {
  S.running = false;
  clearInterval(S.spawnTid);
  clearInterval(S.tickTid);
  clearInterval(S.clockTid);
  if (scoreRafId !== null) { cancelAnimationFrame(scoreRafId); scoreRafId = null; }
  S.tabs.forEach(t => t.cleanup?.());
  document.getElementById('wave-breather-overlay')?.remove();
  $('pause-overlay')?.classList.add('hidden');
  dom.area.classList.remove('boss-active', 'time-warp-active', 'hard-mode');
  dom.segs.forEach(s => s.classList.remove('shielded'));
  // Clear vignette
  if (dom.vignetteEl) dom.vignetteEl.classList.remove('vignette-1', 'vignette-2');
  dom.timerEl.style.color = '';

  const timeStr  = fmt(S.elapsed);
  let isRecord;
  if (chosenMode === 'daily') {
    isRecord = saveDailyBest(S.score, S.elapsed);
    updateStartDailyBest();
  } else {
    isRecord = addToLeaderboard(S.score, S.elapsed);
  }
  if (isRecord) setTimeout(spawnConfetti, 350);

  dom.finalTimeEl.textContent  = timeStr;
  dom.finalScoreEl.textContent = S.score.toLocaleString();
  dom.newRecordEl.classList.toggle('hidden', !isRecord);
  if (chosenMode === 'waves') {
    dom.newRecordEl.classList.remove('hidden');
    dom.newRecordEl.textContent = `Wave ${S.waveNum} reached!`;
  } else if (chosenMode === 'sprint') {
    dom.newRecordEl.textContent = isRecord ? '🏆 NEW SPRINT RECORD!' : 'NEW RECORD!';
  }

  renderLeaderboard();

  // run stats
  dom.statDoneEl.textContent   = S.tabsDone;
  dom.statMissedEl.textContent = S.tabsMissed;
  dom.statStreakEl.textContent  = S.bestStreak;

  const TYPE_LABELS = {
    [T.CLICK_SPAM]: 'Click Spam', [T.TIMER_HOLD]: 'Timer Hold',
    [T.MEMORY]:     'Memory',     [T.PRECISION]:  'Precision',
    [T.TYPE_IT]:    'Type It',    [T.MATH]:       'Math',
    [T.STROOP]:     'Stroop',     [T.SEQUENCE]:   'Sequence',
    [T.REACTION]:   'Reaction',   [T.ODD_ONE]:    'Odd One Out',
    [T.KNOB]:       'Volume Knob',[T.SLIDER]:     'Slider',
    [T.CAPTCHA]:    'Captcha',    [T.DRAGDROP]:   'Drag & Drop',
    [T.PASSWORD]:   'Password',
  };
  const tcEntries = Object.entries(S.typeCounts);
  if (tcEntries.length > 0) {
    const fav = tcEntries.reduce((a, b) => b[1] > a[1] ? b : a);
    dom.statFavEl.textContent = TYPE_LABELS[fav[0]] || fav[0];
    dom.statFavRowEl.classList.remove('hidden');

    // Per-type breakdown: top 5 by count
    if (dom.typeBreakdownEl) {
      const sorted = [...tcEntries].sort((a, b) => b[1] - a[1]).slice(0, 5);
      dom.typeBreakdownEl.innerHTML = sorted.map(([type, count]) =>
        `<div class="stat-type-row">
          <span class="stat-type-name">${TYPE_LABELS[type] || type}</span>
          <span class="stat-type-count">${count}</span>
        </div>`
      ).join('');
      dom.typeBreakdownEl.classList.remove('hidden');
    }
  } else {
    dom.statFavRowEl.classList.add('hidden');
    dom.typeBreakdownEl?.classList.add('hidden');
  }

  S.shareMsg = chosenMode === 'sprint'
    ? `I scored ${S.score.toLocaleString()} in a 90s Tab Hoarder sprint 🖥️💀 (${S.tabsDone} tabs) — beat that: [url]`
    : `I survived ${timeStr} in Tab Hoarder 🖥️💀 (${S.tabsDone} tabs done) — beat that: [url]`;
  dom.sharePreviewEl.textContent = S.shareMsg;

  // Trigger staggered crash-screen entrance animation
  const crashContent = document.getElementById('crash-content');
  if (crashContent) {
    crashContent.classList.remove('crash-anim');
    void crashContent.offsetWidth; // force reflow to restart animation
    crashContent.classList.add('crash-anim');
  }
  dom.crashScreen.classList.remove('hidden');
}

/* ══════════════════════════════════════════════
   SETTINGS OPEN / CLOSE
   ══════════════════════════════════════════════ */

function openSettings() {
  settingsPausedGame = false;
  if (S.running && !S.paused) {
    pauseGame();
    settingsPausedGame = true;
    $('pause-overlay').classList.add('hidden'); // settings panel replaces the pause UI
  }
  $('settings-overlay').classList.remove('hidden');
}

function closeSettings() {
  $('settings-overlay').classList.add('hidden');
  if (settingsPausedGame && S.paused) {
    resumeGame();
    settingsPausedGame = false;
  }
}

/* ══════════════════════════════════════════════
   PAUSE
   ══════════════════════════════════════════════ */

function pauseGame() {
  if (!S.running || S.paused || S.waveBreather) return;
  S.paused         = true;
  S.pauseStartTime = Date.now();
  clearInterval(S.spawnTid);
  clearInterval(S.tickTid);
  clearInterval(S.clockTid);
  $('pause-overlay').classList.remove('hidden');
}

function abandonGame() {
  // Stop game without saving to leaderboard or triggering crash screen
  S.running = false;
  S.paused  = false;
  clearInterval(S.spawnTid);
  clearInterval(S.tickTid);
  clearInterval(S.clockTid);
  clearTimeout(S.doubleScoreTid);
  clearTimeout(S.freezeTid);
  clearTimeout(S.timeWarpTid);
  if (scoreRafId !== null) { cancelAnimationFrame(scoreRafId); scoreRafId = null; }
  S.tabs.forEach(t => t.cleanup?.());
  document.getElementById('wave-breather-overlay')?.remove();
  dom.area.innerHTML = '';
  dom.area.classList.remove('boss-active', 'time-warp-active', 'hard-mode');
  dom.segs.forEach(s => s.classList.remove('shielded'));
  if (dom.vignetteEl) dom.vignetteEl.classList.remove('vignette-1', 'vignette-2');
  dom.timerEl.style.color = '';
  $('pause-overlay').classList.add('hidden');
  dom.startScreen.classList.remove('hidden');
  updateStartBest();
}

function resumeGame() {
  if (!S.running || !S.paused) return;
  const pausedMs = Date.now() - S.pauseStartTime;
  // Shift all active tab deadlines forward so they don't expire during pause
  S.tabs.forEach(tab => {
    if (!tab.done && !tab.gone) tab.deadline += pausedMs;
  });
  S.startTime += pausedMs; // keep elapsed accurate
  S.paused = false;
  $('pause-overlay').classList.add('hidden');
  S.tickTid  = setInterval(tick,      100);
  S.clockTid = setInterval(clockTick, 1000);
  if (!S.waveBreather) restartSpawn();
}

/* ══════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  dom = {
    area:            $('tab-area'),
    segs:            [...document.querySelectorAll('.health-segment')],
    scoreEl:         $('score-display'),
    multEl:          $('multiplier-display'),
    timerEl:         $('game-timer'),
    tabCountEl:      $('tab-count'),
    urlBar:          $('url-bar'),
    startScreen:     $('start-screen'),
    crashScreen:     $('crash-screen'),
    finalTimeEl:     $('final-time'),
    finalScoreEl:    $('final-score'),
    newRecordEl:     $('new-record'),
    leaderboardEl:   $('leaderboard'),
    sharePreviewEl:  $('share-preview'),
    copyBtn:         $('copy-btn'),
    startBtn:        $('start-btn'),
    restartBtn:      $('restart-btn'),
    titleBtn:        $('title-btn'),
    startBestEl:     $('start-best-score'),
    statDoneEl:      $('stat-done'),
    statMissedEl:    $('stat-missed'),
    statStreakEl:    $('stat-streak'),
    statFavEl:       $('stat-fav'),
    statFavRowEl:    $('stat-fav-row'),
    streakEl:        $('streak-display'),
    noPowerupsEl:    $('no-powerups-toggle'),
    hardModeEl:      $('hard-mode-toggle'),
    modeDiffRow:     $('mode-diff-row'),
    vignetteEl:      $('health-vignette'),
    typeBreakdownEl: $('stat-type-breakdown'),
  };

  S = newState();
  initDrag();
  updateFavicon();
  loadSettings();
  applySettings();
  updateStartBest();

  // Global keyboard handler
  document.addEventListener('keydown', e => {
    // ESC = close settings if open, otherwise pause/resume
    if (e.key === 'Escape') {
      if (!$('settings-overlay').classList.contains('hidden')) {
        closeSettings();
        return;
      }
      if (!S.running) return;
      S.paused ? resumeGame() : pauseGame();
      return;
    }
    // Type It / Password tab input
    if (S.paused || activeTypeId === null) return;
    const tab = S.tabs.get(activeTypeId);
    if (!tab || !tab.keyHandler || tab.done || tab.gone) { activeTypeId = null; return; }
    if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
      e.preventDefault();
      tab.keyHandler(e.key);
    }
  });

  // mode picker
  const MODE_DESC = {
    endless: 'Survive as long as possible. No respite.',
    waves:   '3-minute rounds. +1 RAM between waves.',
    daily:   'Same seed for everyone today. One shot.',
    sprint:  '90-second timer. Chase the highest score.',
  };
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      chosenMode = btn.dataset.mode;
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b === btn));
      $('mode-desc').textContent = MODE_DESC[chosenMode];
      // Daily mode: hide difficulty picker (fixed to normal)
      const isDaily = chosenMode === 'daily';
      if (dom.modeDiffRow) dom.modeDiffRow.style.display = isDaily ? 'none' : '';
      updateStartBest();
    });
  });

  // difficulty picker
  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      chosenDiff = btn.dataset.diff;
      document.querySelectorAll('.diff-btn').forEach(b => b.classList.toggle('active', b === btn));
      $('diff-desc').textContent = DIFF_DESC[chosenDiff];
      updateTypeHints();
      updateStartBest();
    });
  });

  // Type-hints collapsible toggle
  const hintsToggle = $('type-hints-toggle');
  const hintsGrid   = $('type-hints');
  hintsToggle.addEventListener('click', () => {
    const isOpen = hintsGrid.classList.toggle('open');
    hintsToggle.classList.toggle('open', isOpen);
  });

  function updateTypeHints() {
    const pool = DIFF_TYPES[chosenDiff];
    hintsGrid.querySelectorAll('.game-card').forEach(card => {
      const inPool = pool.includes(card.dataset.type);
      card.classList.toggle('diff-hidden', !inPool);
    });
    const count = pool.length;
    hintsToggle.querySelector('span:first-child').textContent =
      `${count} mini-game${count === 1 ? '' : 's'} — what to expect`;
  }
  updateTypeHints();

  dom.startBtn.addEventListener('click',   startGame);
  dom.restartBtn.addEventListener('click', startGame);
  dom.titleBtn.addEventListener('click', () => {
    document.getElementById('crash-content')?.classList.remove('crash-anim');
    dom.crashScreen.classList.add('hidden');
    dom.startScreen.classList.remove('hidden');
    updateStartBest();
  });

  /* ── Settings panel ── */
  const CB_DESC = {
    normal:      'Uses default green / yellow / red palette.',
    colorblind:  'Replaces red / green with blue / orange / purple — safe for red-green colorblindness.',
    highcontrast:'Deeper, higher-contrast colors and adds text labels to Panic tabs.',
  };

  function syncSettingsUI() {
    document.querySelectorAll('.settings-color-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.cb === settings.colorblind);
    });
    const cbInput = $('settings-reduced-motion');
    if (cbInput) cbInput.checked = settings.reducedMotion;
    const desc = $('colorblind-desc');
    if (desc) desc.textContent = CB_DESC[settings.colorblind];
  }

  $('settings-toggle').addEventListener('click', () => {
    syncSettingsUI();
    openSettings();
  });
  $('start-settings-btn').addEventListener('click', () => {
    syncSettingsUI();
    openSettings();
  });
  $('settings-close').addEventListener('click', closeSettings);
  $('pause-quit-btn').addEventListener('click', abandonGame);
  $('settings-overlay').addEventListener('click', e => {
    if (e.target === $('settings-overlay')) closeSettings();
  });

  document.querySelectorAll('.settings-color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      settings.colorblind = btn.dataset.cb;
      saveSettings();
      applySettings();
      syncSettingsUI();
    });
  });

  $('settings-reduced-motion').addEventListener('change', e => {
    settings.reducedMotion = e.target.checked;
    saveSettings();
    applySettings();
  });

  /* ── Dev Tools ── */
  function updateDevPhases() {
    document.querySelectorAll('.dev-phase').forEach(btn => {
      const f = btn.dataset.flag;
      btn.classList.toggle('dev-phase-on', !!S[f]);
    });
  }

  $('dev-toggle').addEventListener('click', () => {
    $('dev-panel').classList.toggle('hidden');
    updateDevPhases();
  });
  $('dev-close').addEventListener('click', () => $('dev-panel').classList.add('hidden'));

  // Health buttons
  document.querySelectorAll('.dev-h-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!S.running) return;
      S.health = parseInt(btn.dataset.h);
      renderHealth();
      updateUrl();
    });
  });

  $('dev-invincible').addEventListener('change', e => { devInvincible = e.target.checked; });

  // Spawn specific type
  $('dev-spawn-btn').addEventListener('click', () => {
    if (!S.running) return;
    spawnTab({ forceType: $('dev-type-select').value });
  });

  // Phase toggles
  document.querySelectorAll('.dev-phase').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!S.running) return;
      const f = btn.dataset.flag;
      S[f] = !S[f];
      if (f === 'fakeOn'  && S.fakeOn)  { S.bonusOn = true; }
      if (f === 'panicOn' && S.panicOn) { S.criticalOn = true; }
      if (f === 'doubleOn' || f === 'chaosPlus') restartSpawn();
      updateDevPhases();
    });
  });

  // Actions
  $('dev-expire-all').addEventListener('click', () => {
    if (!S.running) return;
    [...S.tabs.keys()].forEach(id => expireTab(id));
  });
  $('dev-complete-all').addEventListener('click', () => {
    if (!S.running) return;
    [...S.tabs.keys()].forEach(id => completeTab(id));
  });
  $('dev-spawn-boss').addEventListener('click', () => {
    if (!S.running) return;
    spawnBossTab();
  });
  $('dev-end-game').addEventListener('click', () => {
    if (!S.running) return;
    endGame();
  });

  // Data
  $('dev-clear-lb').addEventListener('click', () => {
    if (!confirm('Clear leaderboard?')) return;
    localStorage.removeItem(LS_KEY);
    updateStartBest();
  });
  dom.copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(S.shareMsg).then(() => {
      dom.copyBtn.textContent = '✓ Copied!';
      setTimeout(() => { dom.copyBtn.textContent = '📋 Copy & Share'; }, 2200);
    }).catch(() => {
      prompt('Copy this:', S.shareMsg);
    });
  });
});

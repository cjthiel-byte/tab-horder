/* ==============================================
   Tab Hoarder — game.js
   ============================================== */

/* ── constants ── */
const MAX_HEALTH = 5;
const LS_KEY     = 'tabHoarder_best';

const TITLES = [
  'URGENT!!!', 'You forgot this', "Don't ignore me",
  'Read me NOW', '⚠️ Action required',
  'Are you still there?', 'Final notice',
];

const SYMBOLS = ['★', '●', '▲', '■', '♦'];

const POWERUP = {
  RAM:    'ram',
  FREEZE: 'freeze',
  NUKE:   'nuke',
  DOUBLE: 'double',
};

const POWERUP_CONFIG = {
  [POWERUP.RAM]:    { label: '💉 RAM Restore',    desc: 'Recover 1 RAM bar',         color: '#4caf50' },
  [POWERUP.FREEZE]: { label: '❄️ Time Freeze',    desc: 'Slow spawns for 8s',         color: '#29b6f6' },
  [POWERUP.NUKE]:   { label: '💣 Tab Nuke',       desc: 'Clear all open tabs',        color: '#ff7043' },
  [POWERUP.DOUBLE]: { label: '⚡ Double Score',   desc: '2× points for 15s',          color: '#ffd740' },
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

/* ── difficulty ── */
const DIFF = {
  chill:  { spawnMs: 6000, minSpawnMs: 1200, scaleInterval: 45, fakeAt: 90,  panicAt: 180, doubleAt: 270 },
  normal: { spawnMs: 4000, minSpawnMs: 800,  scaleInterval: 30, fakeAt: 60,  panicAt: 120, doubleAt: 180 },
  chaos:  { spawnMs: 2500, minSpawnMs: 600,  scaleInterval: 20, fakeAt: 30,  panicAt: 60,  doubleAt: 120 },
};
const DIFF_DESC = {
  chill:  'Slower spawns, longer ramp-up. Good for learning.',
  normal: 'Moderate speed, all mechanics unlock over time.',
  chaos:  'Fast from the start. Panic mode hits early. Good luck.',
};

let chosenDiff = 'normal';

/* ── high score ── */
function loadBest() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || { score: 0, time: 0 }; }
  catch { return { score: 0, time: 0 }; }
}
function saveBest(score, time) {
  const prev = loadBest();
  if (score > prev.score) {
    localStorage.setItem(LS_KEY, JSON.stringify({ score, time }));
    return true;
  }
  return false;
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

const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
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
  // Boss = click spam 30 times, wide card
  const goal = 30;
  let n = 0;

  const el = mk('div', 'tab-content');
  el.innerHTML = `
    <p class="mg-instruction">⚠️ <strong>BOSS TAB</strong> — Click <strong>${goal} times!</strong></p>
    <div class="mg-click-count boss-count">0/${goal}</div>
    <div class="mg-click-bar"><div class="mg-click-bar-fill" style="width:0%"></div></div>
    <button class="mg-btn boss-btn">DESTROY!</button>`;

  const countEl = el.querySelector('.boss-count');
  const fillEl  = el.querySelector('.mg-click-bar-fill');

  el.querySelector('.boss-btn').addEventListener('click', () => {
    n++;
    countEl.textContent = `${n}/${goal}`;
    fillEl.style.width  = `${(n / goal) * 100}%`;
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

  const area = dom.area;
  const cW = 340, cH = 260;
  const mx = Math.max(10, (area.offsetWidth  || window.innerWidth)  - cW - 10);
  const my = Math.max(10, (area.offsetHeight || window.innerHeight - 52) - cH - 10);
  card.style.left  = rand(10, mx) + 'px';
  card.style.top   = rand(10, my) + 'px';
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
  area.appendChild(card);
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
    default:           return mkClickSpam(tab);
  }
}

/* ══════════════════════════════════════════════
   TAB SPAWNING & MANAGEMENT
   ══════════════════════════════════════════════ */

const BASE_TYPES    = [T.CLICK_SPAM, T.TIMER_HOLD, T.MEMORY, T.PRECISION, T.TYPE_IT, T.MATH, T.STROOP, T.SEQUENCE, T.REACTION, T.SLIDER, T.CAPTCHA, T.DRAGDROP, T.PASSWORD];
const FAKEABLE_TYPES = BASE_TYPES; // any real tab type can be disguised as a fake

function pickType() {
  if (S.panicOn  && Math.random() < 0.18) return T.PANIC;
  if (S.fakeOn   && Math.random() < 0.15) return T.FAKE;
  if (S.powerupOn && Math.random() < 0.08) return T.POWERUP;
  return pick(BASE_TYPES);
}

function spawnTab() {
  if (!S.running) return;

  const type    = pickType();
  const isPanic = type === T.PANIC;
  const isFake  = type === T.FAKE;
  const inner   = isPanic ? pick(BASE_TYPES)
                : isFake  ? pick(FAKEABLE_TYPES)
                : type;
  const gameT   = (isPanic || isFake) ? inner : type;
  const tLimit  = isPanic ? getPanicTime(inner)
                : isFake  ? TIME_LIMIT[inner]
                : TIME_LIMIT[type];
  const id      = S.nextId++;

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
  };

  // Roll bonus / critical (mutually exclusive, not on panic/fake/powerup)
  if (!isPanic && type !== T.FAKE && type !== T.POWERUP) {
    if (S.bonusOn && Math.random() < 0.12) {
      tab.isBonus = true;
    } else if (S.criticalOn && Math.random() < 0.15) {
      tab.isCritical = true;
    }
  }

  /* build card */
  let cardClass = 'tab-card';
  if (isPanic)           cardClass += ' panic';
  if (tab.isBonus)       cardClass += ' bonus-tab';
  if (tab.isCritical)    cardClass += ' critical-tab';
  if (type === T.POWERUP) cardClass += ' powerup-tab';
  const card = mk('div', cardClass);
  card.id = `tab-${id}`;

  const area = dom.area;
  const cW = 280, cH = 235;
  const mx = Math.max(10, (area.offsetWidth  || window.innerWidth)  - cW - 10);
  const my = Math.max(10, (area.offsetHeight || window.innerHeight - 52) - cH - 10);
  card.style.left = rand(10, mx) + 'px';
  card.style.top  = rand(10, my) + 'px';

  /* bonus / critical banner */
  if (tab.isBonus) {
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

  const game = buildGame(gameT, tab);
  card.appendChild(game.el);
  tab.cleanup = game.cleanup;

  makeDraggable(card, header);

  /* spawn animation */
  Object.assign(card.style, {
    opacity:    '0',
    transform:  'scale(0.82) translateY(-12px)',
    transition: 'opacity 0.22s ease-out, transform 0.22s ease-out',
  });
  area.appendChild(card);

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

  /* score popup */
  spawnScorePopup(tab.element, points, tab.isBonus || S.mult > 1);

  /* green flash + burst, then fly out */
  const c = tab.element;
  spawnCompletionBurst(c);
  c.style.pointerEvents = 'none';
  c.style.transition = 'none';
  c.style.boxShadow  = '0 0 0 3px #4caf50, 0 8px 28px rgba(76,175,80,.6)';
  c.style.background = 'rgba(76,175,80,.06)';

  setTimeout(() => {
    c.style.transition = 'opacity .28s ease-out, transform .28s ease-out';
    c.style.opacity    = '0';
    c.style.transform  = 'scale(0.85) translateY(-10px)';
    setTimeout(() => dropTab(id), 280);
  }, 140);
}

function expireTab(id) {
  const tab = S.tabs.get(id);
  if (!tab || tab.done || tab.gone) return;
  tab.gone = true;
  tab.cleanup?.();

  S.streak = 0;
  S.mult   = 1;
  if (tab.type !== T.POWERUP && tab.type !== T.BOSS) S.tabsMissed++;
  if (tab.type === T.BOSS) {
    S.bossAlive = false;
    dom.area.classList.remove('boss-active');
  }
  refreshHUD(false);

  // Bonus, powerup, and boss tabs don't cost health when missed
  if (!tab.isBonus && tab.type !== T.POWERUP && tab.type !== T.BOSS) {
    loseHealth();
    // Critical tabs deal double damage
    if (tab.isCritical) loseHealth();
  }

  /* red flash, then shrink out */
  const c = tab.element;
  c.style.pointerEvents = 'none';
  c.style.transition = 'none';
  c.style.boxShadow  = '0 0 0 3px #f44336, 0 8px 28px rgba(244,67,54,.6)';
  c.style.background = 'rgba(244,67,54,.06)';

  setTimeout(() => {
    c.style.transition = 'opacity .32s ease-out, transform .32s ease-out';
    c.style.opacity    = '0';
    c.style.transform  = 'scale(0.9)';
    setTimeout(() => dropTab(id), 320);
  }, 80);
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
  S.health = Math.max(0, S.health - 1);
  renderHealth();
  updateUrl();
  dom.area.classList.add('shaking');
  setTimeout(() => dom.area.classList.remove('shaking'), 500);
  if (S.health <= 0) endGame();
}

function renderHealth() {
  dom.segs.forEach((seg, i) => {
    seg.classList.toggle('lost',     i >= S.health);
    seg.classList.toggle('critical', i < S.health && S.health <= 2);
  });
}

/* ══════════════════════════════════════════════
   HUD
   ══════════════════════════════════════════════ */

function refreshHUD(bump = false) {
  dom.scoreEl.textContent = S.score.toLocaleString();
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

/* ══════════════════════════════════════════════
   TICK — timer bars + expiry check (every 100ms)
   ══════════════════════════════════════════════ */

function tick() {
  if (!S.running) return;
  const now     = Date.now();
  const expired = [];

  S.tabs.forEach((tab, id) => {
    if (tab.done || tab.gone) return;

    const rem = tab.deadline - now;
    const pct = Math.max(0, rem / (tab.tLimit * 1000));

    const fill = tab.element?.querySelector('.tab-timer-fill');
    if (fill) {
      fill.style.width = (pct * 100) + '%';
      fill.style.background = pct > 0.5 ? '#4caf50' : pct > 0.25 ? '#f4c430' : '#f44336';
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
  dom.timerEl.textContent = fmt(S.elapsed);

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
}

function restartSpawn() {
  clearInterval(S.spawnTid);
  S.spawnTid = setInterval(() => {
    spawnTab();
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
  clearTimeout(urlToastTid);
  urlToastTid = null;
  S.tabs.forEach(t => t.cleanup?.());

  activeTypeId = null;
  S = newState();
  S.running   = true;
  S.startTime = Date.now();

  dom.area.innerHTML = '';
  dom.area.classList.remove('boss-active');
  dom.startScreen.classList.add('hidden');
  dom.crashScreen.classList.add('hidden');
  dom.urlBar.classList.remove('url-toast');
  dom.urlBar.textContent = 'tab-hoarder://survive';

  renderHealth();
  refreshHUD();
  refreshTabCount();
  dom.timerEl.textContent = '00:00';

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
  S.tabs.forEach(t => t.cleanup?.());
  dom.area.classList.remove('boss-active');

  const timeStr  = fmt(S.elapsed);
  const isRecord = saveBest(S.score, S.elapsed);

  dom.finalTimeEl.textContent  = timeStr;
  dom.finalScoreEl.textContent = S.score.toLocaleString();

  // high score on crash screen
  const best = loadBest();
  dom.bestCrashEl.textContent = best.score.toLocaleString();
  dom.newRecordEl.classList.toggle('hidden', !isRecord);

  // run stats
  dom.statDoneEl.textContent   = S.tabsDone;
  dom.statMissedEl.textContent = S.tabsMissed;
  dom.statStreakEl.textContent  = S.bestStreak;

  const TYPE_LABELS = {
    [T.CLICK_SPAM]: 'Click Spam', [T.TIMER_HOLD]: 'Timer Hold',
    [T.MEMORY]: 'Memory',         [T.PRECISION]:  'Precision',
    [T.TYPE_IT]: 'Type It',       [T.MATH]:       'Math',
    [T.STROOP]: 'Stroop',         [T.SEQUENCE]:   'Sequence',
    [T.REACTION]: 'Reaction',
  };
  const entries = Object.entries(S.typeCounts);
  if (entries.length > 0) {
    const fav = entries.reduce((a, b) => b[1] > a[1] ? b : a);
    dom.statFavEl.textContent = TYPE_LABELS[fav[0]] || fav[0];
    dom.statFavRowEl.classList.remove('hidden');
  } else {
    dom.statFavRowEl.classList.add('hidden');
  }

  S.shareMsg = `I survived ${timeStr} in Tab Hoarder 🖥️💀 (${S.tabsDone} tabs done) — beat that: [url]`;
  dom.sharePreviewEl.textContent = S.shareMsg;

  dom.crashScreen.classList.remove('hidden');
}

/* ══════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  dom = {
    area:           $('tab-area'),
    segs:           [...document.querySelectorAll('.health-segment')],
    scoreEl:        $('score-display'),
    multEl:         $('multiplier-display'),
    timerEl:        $('game-timer'),
    tabCountEl:     $('tab-count'),
    urlBar:         $('url-bar'),
    startScreen:    $('start-screen'),
    crashScreen:    $('crash-screen'),
    finalTimeEl:    $('final-time'),
    finalScoreEl:   $('final-score'),
    bestCrashEl:    $('best-crash-score'),
    newRecordEl:    $('new-record'),
    sharePreviewEl: $('share-preview'),
    copyBtn:        $('copy-btn'),
    startBtn:       $('start-btn'),
    restartBtn:     $('restart-btn'),
    startBestEl:    $('start-best-score'),
    statDoneEl:     $('stat-done'),
    statMissedEl:   $('stat-missed'),
    statStreakEl:   $('stat-streak'),
    statFavEl:      $('stat-fav'),
    statFavRowEl:   $('stat-fav-row'),
    streakEl:       $('streak-display'),
  };

  S = newState();
  initDrag();

  // Show high score on start screen
  const best = loadBest();
  if (best.score > 0) {
    dom.startBestEl.textContent = `Best: ${best.score.toLocaleString()} (${fmt(best.time)})`;
    dom.startBestEl.classList.remove('hidden');
  }

  // Global keyboard handler for Type It / Password tabs
  document.addEventListener('keydown', e => {
    if (activeTypeId === null) return;
    const tab = S.tabs.get(activeTypeId);
    if (!tab || !tab.keyHandler || tab.done || tab.gone) { activeTypeId = null; return; }
    if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
      e.preventDefault();
      tab.keyHandler(e.key);
    }
  });

  // difficulty picker
  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      chosenDiff = btn.dataset.diff;
      document.querySelectorAll('.diff-btn').forEach(b => b.classList.toggle('active', b === btn));
      $('diff-desc').textContent = DIFF_DESC[chosenDiff];
    });
  });

  dom.startBtn.addEventListener('click',   startGame);
  dom.restartBtn.addEventListener('click', startGame);

  dom.copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(S.shareMsg).then(() => {
      dom.copyBtn.textContent = '✓ Copied!';
      setTimeout(() => { dom.copyBtn.textContent = '📋 Copy & Share'; }, 2200);
    }).catch(() => {
      prompt('Copy this:', S.shareMsg);
    });
  });
});

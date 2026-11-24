/* TypeX app shell, screens and progress. Developed by Datix AI. */
(function () {
  const { TRACKS, buildLesson, testText } = window.XTData;
  const { Keyboard, LAYOUTS, handsSVG } = window.XTKeyboard;
  const Sound = window.XTSound;
  const app = document.getElementById('app');
  const DATIX = 'https://datixai.com';

  // ---------- helpers ----------
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const fmtTime = (s) => { s = Math.round(s); const m = Math.floor(s / 60); return m ? `${m}m ${s % 60}s` : `${s}s`; };
  const fmtMin = (s) => { const m = Math.round(s / 60); return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`; };
  const initials = (n) => n.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');

  const I = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    book: '<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-5a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h5z"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>',
    game: '<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 10v5M4.5 12.5h5M15.5 11.5h.01M18 13.5h.01"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    award: '<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 8 5-3 5 3-1.5-8"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
    play: '<path d="M7 4v16l13-8z"/>',
    back: '<path d="M15 18l-6-6 6-6"/>',
    redo: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5"/>',
    flame: '<path d="M12 22c4 0 7-3 7-7 0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-3 3-5 5-5 8 0 4 3 7 7 7z"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    kb: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>',
    vol: '<path d="M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    meteor: '<circle cx="15" cy="15" r="5"/><path d="M3 3l8 8M7 3l6 6M3 7l6 6"/>',
    balloon: '<path d="M12 16c3.5 0 6-3 6-7a6 6 0 0 0-12 0c0 4 2.5 7 6 7zM12 16l-1 2h2zM12 18c0 2-2 2-2 4"/>',
    car: '<path d="M3 15v-3l2-5h14l2 5v3zM3 15h18v3H3z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>',
  };
  const icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${I[n] || ''}</svg>`;
  const starRow = (n, size = '') => `<span class="stars ${size}">${[1, 2, 3].map((i) => `<svg viewBox="0 0 24 24" class="${i <= n ? 'on' : ''}"><path d="${I.star.match(/d="([^"]+)"/)[1]}"/></svg>`).join('')}</span>`;

  function toast(msg, kind = '') {
    const t = document.createElement('div');
    t.className = 'toast ' + kind; t.textContent = msg;
    $('#toast-root').appendChild(t);
    setTimeout(() => t.classList.add('out'), 2600);
    setTimeout(() => t.remove(), 3000);
  }

  // onX: when given, the popup gets a close (X) and a minimise button; X and Esc call onX.
  function modal(html, { onMount, dismiss = true, wide = false, onX = null } = {}) {
    const root = $('#modal-root');
    const tools = onX ? `<div class="m-tools"><button class="icon-btn" data-min title="Minimise (see the text behind)"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 12h12"/></svg></button><button class="icon-btn" data-x title="Close (Esc)"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>` : '';
    root.innerHTML = `<div class="overlay"><div class="modal ${wide ? 'wide' : ''}">${tools}${html}</div></div>${onX ? '<button class="m-restore hide" data-restore>Show results</button>' : ''}`;
    const close = () => { root.innerHTML = ''; window.removeEventListener('keydown', escH, true); };
    const xClose = () => { close(); onX(); };
    const escH = (e) => {
      if (e.key !== 'Escape') return;
      if (onX) { e.preventDefault(); e.stopPropagation(); xClose(); } else if (dismiss) { e.stopPropagation(); close(); }
    };
    window.addEventListener('keydown', escH, true);
    if (dismiss) $('.overlay', root).addEventListener('mousedown', (e) => { if (e.target.classList.contains('overlay')) close(); });
    if (onX) {
      const ov = $('.overlay', root); const rs = $('[data-restore]', root);
      $('[data-x]', root).addEventListener('click', xClose);
      $('[data-min]', root).addEventListener('click', () => { ov.classList.add('hide'); rs.classList.remove('hide'); });
      rs.addEventListener('click', () => { ov.classList.remove('hide'); rs.classList.add('hide'); });
    }
    onMount && onMount($('.modal', root), close);
    return close;
  }

  // ---------- state ----------
  let user = null;
  let D = null; // current user's data
  let cleanup = null; // active view teardown
  let saveTimer = 0;

  const DEFAULT_SETTINGS = { layout: 'full', sound: 'mechanical', volume: 0.6, errorSound: true, theme: 'dark', showKeyboard: true, showHands: true, stopOnError: true, targetWpm: 25, dailyGoal: 15 };

  function ensure(data) {
    const d = data && typeof data === 'object' ? data : {};
    d.settings = { ...DEFAULT_SETTINGS, ...(d.settings || {}) };
    const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
    const arr = (x) => (Array.isArray(x) ? x.filter((i) => i && typeof i === 'object') : []);
    d.lessons = obj(d.lessons); d.keyStats = obj(d.keyStats); d.games = obj(d.games); d.daily = obj(d.daily); d.badges = obj(d.badges);
    d.history = arr(d.history); d.tests = arr(d.tests);
    d.xp = Number.isFinite(d.xp) && d.xp > 0 ? d.xp : 0;
    if (!['beginner', 'pro'].includes(d.settings.mode)) d.settings.mode = 'beginner';
    return d;
  }

  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      window.xt.save(D).then((ok) => {
        if (ok) { saveWarned = false; return; }
        if (!saveWarned && D) { saveWarned = true; toast('Progress could not be saved. Check that the disk is not full.', 'bad'); }
      }).catch(() => {});
    }, 250);
  }
  let saveWarned = false;

  // Last line of defence: never leave the user stuck on an error.
  let lastErr = 0;
  function onAppError(err) {
    console.error(err);
    if (Date.now() - lastErr < 4000) return;
    lastErr = Date.now();
    try { toast('Something went wrong, but your progress is safe. Please try again.', 'bad'); } catch { /* ignore */ }
  }
  window.addEventListener('error', (e) => onAppError(e.error || e.message));
  window.addEventListener('unhandledrejection', (e) => onAppError(e.reason));

  function applySettings() {
    const s = D ? D.settings : DEFAULT_SETTINGS;
    document.body.classList.toggle('dark', s.theme !== 'light');
    document.body.classList.toggle('light', s.theme === 'light');
    Sound.settings.theme = s.sound; Sound.settings.volume = s.volume; Sound.settings.errors = s.errorSound;
  }

  const level = (xp) => Math.floor(Math.sqrt(xp / 40)) + 1;
  const levelXp = (lv) => (lv - 1) * (lv - 1) * 40;

  function streak() {
    let n = 0; const d = new Date();
    if (!D.daily[dayKey(d)]) d.setDate(d.getDate() - 1);
    while (D.daily[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  function addPractice(sec) { const k = dayKey(); D.daily[k] = (D.daily[k] || 0) + sec; }

  function mergeKeys(ks) {
    for (const [c, s] of Object.entries(ks || {})) {
      const t = D.keyStats[c] || (D.keyStats[c] = { h: 0, m: 0 });
      t.h += s.h; t.m += s.m;
    }
  }

  function record(entry) {
    D.history.push({ t: Date.now(), ...entry });
    if (D.history.length > 1000) D.history.splice(0, D.history.length - 1000);
  }

  function avgWpm(n = 10) {
    const h = D.history.filter((x) => x.type !== 'game' && x.wpm > 0).slice(-n);
    return h.length ? Math.round(h.reduce((a, b) => a + b.wpm, 0) / h.length) : 0;
  }
  function avgAcc(n = 10) {
    const h = D.history.filter((x) => x.type !== 'game').slice(-n);
    return h.length ? Math.round(h.reduce((a, b) => a + b.acc, 0) / h.length) : 0;
  }
  const bestWpm = () => D.history.filter((x) => x.type === 'test').reduce((m, x) => Math.max(m, x.wpm), 0);
  const lessonsDone = () => Object.entries(D.lessons).filter(([k, l]) => !k.endsWith('@pro') && l.stars > 0).length;
  const isPro = () => D.settings.mode === 'pro';
  const lkey = (t, i, pro = isPro()) => `${t}-${i}${pro ? '@pro' : ''}`;
  const totalLessons = TRACKS.reduce((a, t) => a + t.lessons.length, 0);
  const totalStars = () => Object.values(D.lessons).reduce((a, l) => a + (l.stars || 0), 0);
  const practiceSec = () => Object.values(D.daily).reduce((a, b) => a + b, 0);

  // ---------- achievements ----------
  const BADGES = [
    { id: 'first', name: 'First Steps', desc: 'Finish your first lesson.', test: () => lessonsDone() >= 1, icon: 'check' },
    { id: 'home', name: 'Home Row Hero', desc: 'Finish the home row review.', test: () => (D.lessons['beginner-4'] || {}).stars > 0, icon: 'kb' },
    { id: 'l10', name: 'Getting Serious', desc: 'Finish 10 lessons.', test: () => lessonsDone() >= 10, icon: 'book' },
    { id: 'alpha', name: 'Alphabet Master', desc: 'Finish the whole Beginner track.', test: () => TRACKS[0].lessons.every((_, i) => (D.lessons['beginner-' + i] || {}).stars > 0), icon: 'award' },
    { id: 'stars30', name: 'Star Collector', desc: 'Earn 30 stars.', test: () => totalStars() >= 30, icon: 'star' },
    { id: 'perfect', name: 'Perfectionist', desc: 'Finish a lesson with 100% accuracy.', test: () => D.history.some((h) => h.type === 'lesson' && h.acc === 100), icon: 'target' },
    { id: 'w20', name: 'Off the Ground', desc: 'Reach 20 WPM in a typing test.', test: () => bestWpm() >= 20, icon: 'bolt' },
    { id: 'w35', name: 'Cruising', desc: 'Reach 35 WPM in a typing test.', test: () => bestWpm() >= 35, icon: 'bolt' },
    { id: 'w50', name: 'Fast Fingers', desc: 'Reach 50 WPM in a typing test.', test: () => bestWpm() >= 50, icon: 'bolt' },
    { id: 'w70', name: 'Speed Demon', desc: 'Reach 70 WPM in a typing test.', test: () => bestWpm() >= 70, icon: 'bolt' },
    { id: 'w90', name: 'Lightning', desc: 'Reach 90 WPM in a typing test.', test: () => bestWpm() >= 90, icon: 'bolt' },
    { id: 's3', name: 'On a Roll', desc: 'Practice 3 days in a row.', test: () => streak() >= 3, icon: 'flame' },
    { id: 's7', name: 'Week Warrior', desc: 'Practice 7 days in a row.', test: () => streak() >= 7, icon: 'flame' },
    { id: 's30', name: 'Unstoppable', desc: 'Practice 30 days in a row.', test: () => streak() >= 30, icon: 'flame' },
    { id: 'hour', name: 'Dedicated', desc: 'Practice for 1 hour in total.', test: () => practiceSec() >= 3600, icon: 'timer' },
    { id: 'gamer', name: 'Player One', desc: 'Play every game once.', test: () => ['meteor', 'balloon', 'sprint'].every((g) => (D.games[g] || {}).plays), icon: 'game' },
    { id: 'winner', name: 'Pole Position', desc: 'Win a Speed Sprint race.', test: () => (D.games.sprint || {}).wins > 0, icon: 'car' },
    { id: 'numpad', name: 'Data Pro', desc: 'Finish the Number Pad track.', test: () => TRACKS[3].lessons.every((_, i) => (D.lessons['numpad-' + i] || {}).stars > 0), icon: 'kb' },
    { id: 'lv10', name: 'Level 10', desc: 'Reach level 10.', test: () => level(D.xp) >= 10, icon: 'award' },
  ];

  function checkBadges() {
    const fresh = [];
    for (const b of BADGES) if (!D.badges[b.id] && b.test()) { D.badges[b.id] = Date.now(); fresh.push(b); }
    fresh.forEach((b, i) => setTimeout(() => toast(`Achievement unlocked: ${b.name}`, 'gold'), 400 + i * 700));
    return fresh;
  }

  function gainXp(n) {
    const before = level(D.xp);
    D.xp += Math.max(0, Math.round(n));
    if (level(D.xp) > before) setTimeout(() => toast(`Level up! You are now level ${level(D.xp)}`, 'gold'), 200);
  }

  // ---------- auth ----------
  async function showLogin(prefill) {
    teardown();
    user = null; D = null; applySettings();
    const users = await window.xt.listUsers();
    const info = await window.xt.info();
    app.innerHTML = `
    <div class="auth">
      <section class="auth-hero">
        <div class="brand big"><img src="assets/icon.png" alt=""><span>Type<b>X</b></span></div>
        <h1>Type faster.<br><em>Learn it for free.</em></h1>
        <p>Step by step lessons, timed tests and fun games that turn slow hunting and pecking into confident touch typing. Works fully offline on this PC.</p>
        <div class="hero-keys" aria-hidden="true">${'ASDFJKL;'.split('').map((c, i) => `<span style="animation-delay:${i * 0.12}s">${c}</span>`).join('')}</div>
        <ul class="hero-points">
          <li>${icon('book')} 49 guided lessons from home row to code</li>
          <li>${icon('kb')} Desktop, laptop and number pad keyboard layouts</li>
          <li>${icon('lock')} Private profiles, progress never leaves this PC</li>
        </ul>
        <button class="credit" data-datix>Developed by <b>Datix AI</b></button>
      </section>
      <section class="auth-panel">
        <div class="auth-card" id="auth-card"></div>
        <div class="auth-foot">TypeX v${esc(info.version)} . Free for everyone</div>
      </section>
    </div>`;
    wireDatix();
    const card = $('#auth-card');

    function profiles() {
      card.innerHTML = `
        <h2>Who is typing?</h2>
        <p class="muted">Choose your profile or create a new one.</p>
        <div class="profiles">
          ${users.map((u) => `<button class="profile" data-u="${esc(u.username)}"><span class="avatar" style="--av:${esc(u.color)}">${esc(initials(u.fullName))}</span><span><b>${esc(u.fullName)}</b><small>@${esc(u.username)}</small></span></button>`).join('')}
          <button class="profile add" data-new>${icon('plus')}<span><b>New profile</b><small>Takes 20 seconds</small></span></button>
        </div>`;
      $$('.profile[data-u]', card).forEach((b) => b.addEventListener('click', () => signIn(b.dataset.u)));
      $('[data-new]', card).addEventListener('click', register);
    }

    function signIn(username) {
      const u = users.find((x) => x.username === username);
      card.innerHTML = `
        <button class="link back" data-back>${icon('back')} All profiles</button>
        <div class="who"><span class="avatar xl" style="--av:${esc(u ? u.color : '#818cf8')}">${esc(u ? initials(u.fullName) : '?')}</span><h2>${esc(u ? u.fullName : 'Sign in')}</h2><small class="muted">@${esc(username)}</small></div>
        <form id="f">
          <label>Password<input type="password" name="p" autocomplete="current-password" autofocus required></label>
          <div class="err" id="err"></div>
          <button class="btn primary block" type="submit">Sign in</button>
          <button class="link" type="button" data-forgot>Forgot password?</button>
        </form>`;
      $('[data-back]', card).addEventListener('click', profiles);
      $('[data-forgot]', card).addEventListener('click', () => recover(username));
      $('#f', card).addEventListener('submit', async (e) => {
        e.preventDefault();
        const r = await window.xt.login({ username, password: e.target.p.value });
        if (!r.ok) { $('#err', card).textContent = r.error; return; }
        enter(r.user);
      });
      $('input', card).focus();
    }

    function register() {
      card.innerHTML = `
        ${users.length ? `<button class="link back" data-back>${icon('back')} All profiles</button>` : ''}
        <h2>Create your profile</h2>
        <p class="muted">Your profile and progress are saved only on this computer.</p>
        <form id="f">
          <label>Full name<input name="n" maxlength="60" placeholder="e.g. Sara Khan" required autofocus></label>
          <label>Username <small class="muted">(small letters, numbers, . or _)</small><input name="u" maxlength="24" placeholder="e.g. sara.k" required autocomplete="off" spellcheck="false"></label>
          <div class="row2">
            <label>Password<input type="password" name="p" required autocomplete="new-password"></label>
            <label>Confirm<input type="password" name="c" required autocomplete="new-password"></label>
          </div>
          <div class="err" id="err"></div>
          <button class="btn primary block" type="submit">Create profile and start</button>
        </form>`;
      const back = $('[data-back]', card); if (back) back.addEventListener('click', profiles);
      const uIn = $('[name=u]', card);
      uIn.addEventListener('input', () => { const p = uIn.selectionStart; uIn.value = uIn.value.toLowerCase().replace(/[^a-z0-9._]/g, ''); uIn.setSelectionRange(p, p); });
      $('[name=n]', card).addEventListener('blur', (e) => {
        if (!uIn.value) uIn.value = e.target.value.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim().split(/\s+/).join('.').slice(0, 24);
      });
      $('#f', card).addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        if (f.p.value !== f.c.value) { $('#err', card).textContent = 'Passwords do not match.'; return; }
        const r = await window.xt.register({ username: f.u.value, fullName: f.n.value, password: f.p.value });
        if (!r.ok) { $('#err', card).textContent = r.error; return; }
        showRecovery(r.recoveryCode, () => enter(r.user, true));
      });
      $('[name=n]', card).focus();
    }

    function recover(username) {
      card.innerHTML = `
        <button class="link back" data-back>${icon('back')} Back</button>
        <h2>Reset password</h2>
        <p class="muted">Enter the recovery code you saved when the profile was created.</p>
        <form id="f">
          <label>Username<input name="u" value="${esc(username || '')}" required></label>
          <label>Recovery code<input name="r" placeholder="XXXX-XXXX-XXXX" required spellcheck="false"></label>
          <label>New password<input type="password" name="p" required></label>
          <div class="err" id="err"></div>
          <button class="btn primary block" type="submit">Reset password</button>
        </form>`;
      $('[data-back]', card).addEventListener('click', () => (username ? signIn(username) : profiles()));
      $('#f', card).addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        const r = await window.xt.recover({ username: f.u.value, code: f.r.value, newPassword: f.p.value });
        if (!r.ok) { $('#err', card).textContent = r.error; return; }
        showRecovery(r.recoveryCode, () => { toast('Password changed. Please sign in.', 'ok'); signIn(f.u.value.toLowerCase()); }, true);
      });
    }

    if (prefill === 'new' || !users.length) register(); else profiles();
  }

  function showRecovery(code, then, again) {
    modal(`
      <div class="center">
        <div class="badge-ic big">${icon('lock')}</div>
        <h2>${again ? 'Your new recovery code' : 'Save your recovery code'}</h2>
        <p class="muted">There is no online account, so this code is the only way to reset your password if you forget it. Write it down and keep it safe.</p>
        <div class="code">${esc(code)}</div>
        <button class="btn primary block" data-ok>I have saved it</button>
      </div>`, { dismiss: false, onMount: (m, close) => $('[data-ok]', m).addEventListener('click', () => { close(); then(); }) });
  }

  function enter(u, isNew) {
    user = u; D = ensure(u.data); applySettings();
    D.settings.layout = LAYOUTS[D.settings.layout] ? D.settings.layout : 'full';
    save();
    shell();
    go(isNew ? 'welcome' : 'dashboard');
  }

  function wireDatix(root = document) {
    $$('[data-datix]', root).forEach((b) => b.addEventListener('click', () => window.xt.open(DATIX)));
  }

  // ---------- shell ----------
  const NAV = [['dashboard', 'Dashboard', 'home'], ['lessons', 'Lessons', 'book'], ['test', 'Typing Test', 'timer'], ['games', 'Games', 'game'], ['progress', 'Progress', 'chart'], ['achievements', 'Achievements', 'award'], ['settings', 'Settings', 'gear']];

  function shell() {
    app.innerHTML = `
    <div class="shell">
      <aside class="side">
        <div class="brand"><img src="assets/icon.png" alt=""><span>Type<b>X</b></span></div>
        <nav>${NAV.map(([id, name, ic]) => `<button data-nav="${id}">${icon(ic)}<span>${name}</span></button>`).join('')}</nav>
        <div class="side-foot">
          <div class="me"><span class="avatar" style="--av:${esc(user.color)}">${esc(initials(user.fullName))}</span><div><b class="me-name">${esc(user.fullName)}</b><small>@${esc(user.username)} . <span class="me-lv">Lv ${level(D.xp)}</span></small></div>
          <button class="icon-btn" title="Sign out" data-out>${icon('out')}</button></div>
          <button class="credit small" data-datix>Developed by <b>Datix AI</b></button>
        </div>
      </aside>
      <main class="main" id="view"></main>
    </div>`;
    $$('[data-nav]').forEach((b) => b.addEventListener('click', () => go(b.dataset.nav)));
    $('[data-out]').addEventListener('click', async () => { teardown(); await window.xt.save(D); await window.xt.logout(); showLogin(); });
    wireDatix();
  }

  function refreshMe() {
    const n = $('.me-name'); if (n) n.textContent = user.fullName;
    const l = $('.me-lv'); if (l) l.textContent = 'Lv ' + level(D.xp);
  }

  function teardown() { if (cleanup) { try { cleanup(); } catch { /* ignore */ } cleanup = null; } $('#modal-root').innerHTML = ''; }

  function go(view, arg) {
    teardown();
    if (!VIEWS[view]) view = 'dashboard';
    $$('[data-nav]').forEach((b) => b.classList.toggle('on', b.dataset.nav === view || (view === 'lesson' && b.dataset.nav === 'lessons') || (view === 'play' && b.dataset.nav === 'games')));
    const v = $('#view');
    v.scrollTop = 0;
    v.className = 'main view-' + view;
    try {
      const r = VIEWS[view](v, arg);
      if (r && r.catch) r.catch(onAppError);
    } catch (err) {
      onAppError(err);
      if (view !== 'dashboard') { go('dashboard'); return; }
    }
    refreshMe();
  }

  function nextLesson() {
    for (const t of TRACKS) for (let i = 0; i < t.lessons.length; i++) if (!(D.lessons[`${t.id}-${i}`] || {}).stars) return { t, i };
    return { t: TRACKS[0], i: 0 };
  }

  // ---------- views ----------
  const VIEWS = {};

  VIEWS.welcome = (v) => {
    v.innerHTML = `
      <div class="welcome">
        <div class="badge-ic big">${icon('kb')}</div>
        <h1>Welcome, ${esc(user.fullName.split(' ')[0])}!</h1>
        <p class="muted">First, pick the keyboard that looks most like yours. You can change it any time in Settings.</p>
        <div class="layout-pick" id="lp"></div>
        <button class="btn primary lg" data-go>Start my first lesson ${icon('play')}</button>
      </div>`;
    layoutPicker($('#lp', v), () => {});
    $('[data-go]', v).addEventListener('click', () => go('lesson', { track: 'beginner', index: 0 }));
  };

  VIEWS.dashboard = (v) => {
    const nx = nextLesson();
    const today = D.daily[dayKey()] || 0;
    const goal = D.settings.dailyGoal * 60;
    const pct = Math.min(1, today / goal);
    const lv = level(D.xp);
    const lvPct = (D.xp - levelXp(lv)) / (levelXp(lv + 1) - levelXp(lv));
    const hour = new Date().getHours();
    const hello = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const recent = D.history.slice(-6).reverse();
    v.innerHTML = `
      <header class="page-head"><div><h1>${hello}, ${esc(user.fullName.split(' ')[0])}</h1><p class="muted">${streak() ? `You are on a ${streak()} day streak. Keep it going!` : 'Practice a few minutes today to start a streak.'}</p></div></header>
      <div class="grid stats4">
        ${statCard('bolt', avgWpm() || '-', 'Average WPM', 'last 10 sessions')}
        ${statCard('target', avgAcc() ? avgAcc() + '%' : '-', 'Accuracy', 'last 10 sessions')}
        ${statCard('book', `${lessonsDone()}<small>/${totalLessons}</small>`, 'Lessons done', `${totalStars()} stars earned`)}
        ${statCard('flame', streak(), 'Day streak', `best typing test ${bestWpm() || 0} WPM`)}
      </div>
      <div class="grid dash">
        <section class="card next-card" style="--tc:${nx.t.color}">
          <div class="tag" style="--tc:${nx.t.color}">${esc(nx.t.name)} . Lesson ${nx.i + 1}</div>
          <h2>${esc(nx.t.lessons[nx.i][0])}</h2>
          <p class="muted">${lessonsDone() ? 'Pick up right where you left off.' : 'Start with the home row, where your fingers rest.'}</p>
          <div class="mini-kb"><div id="mk"></div></div>
          <div class="row"><button class="btn primary lg" data-next>${icon('play')} ${lessonsDone() ? 'Continue' : 'Start learning'}</button><button class="btn ghost" data-test>${icon('timer')} Quick 1 minute test</button></div>
        </section>
        <section class="card goal-card">
          <h3>Today's goal</h3>
          <div class="ring" style="--p:${pct}"><div><b>${Math.floor(today / 60)}</b><small>of ${D.settings.dailyGoal} min</small></div></div>
          <p class="muted center">${pct >= 1 ? 'Goal reached. Great work!' : `${Math.max(1, Math.ceil((goal - today) / 60))} minutes to go`}</p>
          <div class="lv"><div class="lv-top"><b>Level ${lv}</b><small>${D.xp} XP</small></div><div class="bar"><i style="width:${lvPct * 100}%"></i></div></div>
        </section>
      </div>
      <div class="grid dash2">
        <section class="card"><h3>Speed trend</h3>${lineChart(D.history.filter((h) => h.type !== 'game').slice(-20).map((h) => h.wpm), 'WPM')}</section>
        <section class="card"><h3>Recent activity</h3>${recent.length ? `<ul class="act">${recent.map(actRow).join('')}</ul>` : '<p class="muted">Nothing yet. Your lessons, tests and games will show here.</p>'}</section>
      </div>`;
    const kb = new Keyboard($('#mk', v), nx.t.numpad ? 'laptopnum' : 'laptop');
    const k0 = nx.t.lessons[nx.i][1] || 'asdfjkl;';
    kb.keys.forEach((k) => { if ([...k0].some((c) => c === k.label || c === k.shift)) k.node.classList.add('next'); });
    $('[data-next]', v).addEventListener('click', () => go('lesson', { track: nx.t.id, index: nx.i }));
    $('[data-test]', v).addEventListener('click', () => go('test', { duration: 60, autostart: true }));
  };

  const statCard = (ic, val, label, sub) => `<div class="card stat">${icon(ic)}<div><b>${val}</b><span>${label}</span><small>${sub}</small></div></div>`;
  const actRow = (h) => {
    const ic = h.type === 'lesson' ? 'book' : h.type === 'test' ? 'timer' : 'game';
    const when = new Date(h.t);
    return `<li>${icon(ic)}<div><b>${esc(h.title)}</b><small>${when.toLocaleDateString()} ${when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small></div><span>${h.type === 'game' ? `${h.score} pts` : `${h.wpm} WPM . ${h.acc}%`}</span></li>`;
  };

  function lineChart(vals, unit) {
    if (vals.length < 2) return '<div class="chart-empty muted">Complete a few lessons or tests to see your trend.</div>';
    const W = 560; const H = 170; const P = 28;
    const max = Math.max(10, ...vals) * 1.15;
    const x = (i) => P + (i * (W - P * 2)) / (vals.length - 1);
    const y = (val) => H - P - (val / max) * (H - P * 2);
    const pts = vals.map((val, i) => `${x(i)},${y(val)}`).join(' ');
    const grid = [0, 0.5, 1].map((f) => { const val = Math.round(max * f); return `<line x1="${P}" x2="${W - P}" y1="${y(val)}" y2="${y(val)}"/><text x="4" y="${y(val) + 4}">${val}</text>`; }).join('');
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><g class="grid">${grid}</g>
      <polygon class="area" points="${x(0)},${H - P} ${pts} ${x(vals.length - 1)},${H - P}"/><polyline class="line" points="${pts}"/>
      ${vals.map((val, i) => `<circle cx="${x(i)}" cy="${y(val)}" r="3.5"><title>${val} ${unit}</title></circle>`).join('')}</svg>`;
  }

  // ----- lessons list -----
  VIEWS.lessons = (v, arg) => {
    const tab = (arg && arg.track) || D.lastTrack || 'beginner';
    v.innerHTML = `
      <header class="page-head"><div><h1>Lessons</h1><p class="muted">Follow the path in order, or jump to any lesson. Aim for 3 stars.</p></div>
        <div class="mode-pick"><div class="seg" id="mode"><button data-m="beginner" class="${isPro() ? '' : 'on'}">${icon('book')} Beginner</button><button data-m="pro" class="${isPro() ? 'on' : ''}">${icon('bolt')} Pro</button></div><small class="muted" id="mode-note"></small></div></header>
      <div class="tabs">${TRACKS.map((t) => {
        const done = t.lessons.filter((_, i) => (D.lessons[lkey(t.id, i)] || {}).stars).length;
        return `<button data-tab="${t.id}" class="${t.id === tab ? 'on' : ''}" style="--tc:${t.color}"><b>${t.name}</b><small>${done}/${t.lessons.length}</small></button>`;
      }).join('')}</div>
      <div id="tl"></div>`;
    const draw = (id) => {
      D.lastTrack = id;
      const t = TRACKS.find((x) => x.id === id);
      const done = t.lessons.filter((_, i) => (D.lessons[lkey(t.id, i)] || {}).stars).length;
      $('#mode-note', v).textContent = isPro() ? 'Pro: no key hints, mistakes stay, longer text, higher targets.' : 'Beginner: key hints and you fix mistakes as you go.';
      v.classList.toggle('pro-mode', isPro());
      $$('[data-tab] small', v).forEach((n, k) => { const tt = TRACKS[k]; n.textContent = `${tt.lessons.filter((_, i) => (D.lessons[lkey(tt.id, i)] || {}).stars).length}/${tt.lessons.length}`; });
      $('#tl', v).innerHTML = `
        <div class="track-head" style="--tc:${t.color}"><div><h2>${t.name}</h2><p class="muted">${t.desc}</p></div><div class="bar"><i style="width:${(done / t.lessons.length) * 100}%"></i></div></div>
        ${t.numpad && !LAYOUTS[D.settings.layout].numpad ? `<div class="note">${icon('kb')} Your keyboard layout is set without a number pad. These lessons still work with the number row, or switch layout in Settings.</div>` : ''}
        <div class="lesson-grid">${t.lessons.map((l, i) => {
          const r = D.lessons[lkey(t.id, i)] || {};
          const keys = l[1] ? [...l[1]].map((c) => `<kbd>${esc(c === ' ' ? 'space' : c.toUpperCase())}</kbd>`).join('') : `<span class="pill">${esc(l[2] === 'review' || l[2] === 'numreview' || l[2] === 'npreview' ? 'Review' : 'Practice')}</span>`;
          return `<button class="lesson ${r.stars ? 'done' : ''}" data-i="${i}" style="--tc:${t.color}"><span class="num">${i + 1}</span><div class="l-keys">${keys}</div><b>${esc(l[0])}</b>${isPro() ? '<span class="pro-tag">PRO</span>' : ''}<div class="l-foot">${starRow(r.stars || 0)}${r.wpm ? `<small>${r.wpm} WPM</small>` : ''}</div></button>`;
        }).join('')}</div>`;
      $$('.lesson', v).forEach((b) => b.addEventListener('click', () => go('lesson', { track: id, index: +b.dataset.i })));
      $$('[data-tab]', v).forEach((b) => b.classList.toggle('on', b.dataset.tab === id));
    };
    $$('[data-tab]', v).forEach((b) => b.addEventListener('click', () => draw(b.dataset.tab)));
    $$('#mode button', v).forEach((b) => b.addEventListener('click', () => {
      D.settings.mode = b.dataset.m; save();
      $$('#mode button', v).forEach((x) => x.classList.toggle('on', x === b));
      draw(D.lastTrack || tab);
    }));
    draw(tab);
  };

  // ----- typing area (shared by lesson and test) -----
  function typingArea(v, { title, sub, back }) {
    const s = D.settings;
    v.innerHTML = `
      <div class="play">
        <div class="play-top">
          <button class="btn ghost sm" data-back>${icon('back')} ${esc(back)}</button>
          <div class="play-title"><b>${esc(title)}</b><small>${esc(sub || '')}</small></div>
          <div class="live">
            <div><b id="lv-wpm">0</b><span>WPM</span></div>
            <div><b id="lv-acc">100%</b><span>Accuracy</span></div>
            <div><b id="lv-time">0s</b><span id="lv-tl">Time</span></div>
          </div>
        </div>
        <div class="steps" id="steps"></div>
        <div class="text-wrap"><div class="text" id="text"></div><div class="hint" id="hint">Start typing when you are ready. Press <kbd>Esc</kbd> to restart.</div></div>
        <div class="kb-zone ${s.showKeyboard ? '' : 'hide'}">
          <div class="kb-holder"><div id="kb"></div></div>
          <div class="hands-holder ${s.showHands ? '' : 'hide'}"><div id="hands">${handsSVG()}</div><div class="finger-tip" id="ftip"></div></div>
        </div>
      </div>`;
    const kb = new Keyboard($('#kb', v), s.layout, 58);
    return { kb, hands: $('#hands', v), text: $('#text', v) };
  }

  function updateLive(v, st, timeLimit) {
    $('#lv-wpm', v).textContent = st.wpm;
    $('#lv-acc', v).textContent = st.acc + '%';
    $('#lv-time', v).textContent = timeLimit ? fmtTime(st.left) : fmtTime(st.time);
  }

  function fingerTip(v, kb, ch, np) {
    const info = kb.highlight(ch, np);
    const tip = $('#ftip', v);
    if (tip) tip.innerHTML = info ? `Use your <b>${info.name}</b>${info.shiftFinger ? ` + <b>${info.shiftFinger === 'lp' ? 'left' : 'right'} shift</b>` : ''}` : '';
  }

  // ----- lesson player -----
  VIEWS.lesson = (v, { track, index, pro }) => {
    if (pro === undefined) pro = isPro();
    const L = buildLesson(track, index);
    if (pro) { const more = buildLesson(track, index).screens; L.screens.push(more[more.length - 1]); }
    const t = TRACKS.find((x) => x.id === track);
    const ui = typingArea(v, { title: `${index + 1}. ${L.title}`, sub: `${t.name} . ${pro ? 'Pro mode' : 'Beginner mode'}`, back: 'Lessons' });
    if (pro) { v.classList.add('pro-mode'); const hh = $('.hands-holder', v); if (hh) hh.classList.add('hide'); $('#hint', v).innerHTML = 'Pro mode: no key hints and no Backspace. Press <kbd>Esc</kbd> to restart.'; }
    $('[data-back]', v).addEventListener('click', () => go('lessons', { track }));
    let step = 0; let session = null; const results = [];
    const steps = $('#steps', v);
    const drawSteps = () => { steps.innerHTML = L.screens.map((_, i) => `<i class="${i < step ? 'done' : i === step ? 'cur' : ''}"></i>`).join(''); };

    function startStep() {
      drawSteps();
      if (session) session.destroy();
      $('#hint', v).classList.remove('gone');
      session = new window.XTEngine.Session({
        el: ui.text, text: L.screens[step], stopOnError: pro ? false : D.settings.stopOnError, noBackspace: pro, keyboard: pro ? null : ui.kb, hands: pro ? null : ui.hands, preferNumpad: L.numpad,
        onStart: () => $('#hint', v).classList.add('gone'),
        onUpdate: (st) => { updateLive(v, st); if (!pro) fingerTip(v, ui.kb, L.screens[step][session.pos], L.numpad); },
        onDone: (st) => { results.push(st); step++; if (step < L.screens.length) { Sound.success(1); setTimeout(startStep, 350); } else finish(); },
      });
      if (!pro) fingerTip(v, ui.kb, L.screens[step][0], L.numpad);
    }

    const escH = (e) => { if (e.key === 'Escape' && !$('#modal-root').innerHTML) { e.preventDefault(); results.length = 0; step = 0; startStep(); updateLive(v, { wpm: 0, acc: 100, time: 0 }); } };
    window.addEventListener('keydown', escH);

    function finish() {
      drawSteps();
      const time = results.reduce((a, r) => a + r.time, 0);
      const chars = results.reduce((a, r) => a + r.chars, 0);
      const typed = results.reduce((a, r) => a + r.typed, 0);
      const errors = results.reduce((a, r) => a + r.errors, 0);
      const wpm = Math.round((chars / 5) / (Math.max(time, 1) / 60));
      const acc = typed ? Math.round(((typed - errors) / typed) * 100) : 100;
      const target = D.settings.targetWpm;
      const stars = pro
        ? (acc >= 98 && wpm >= target * 1.25 ? 3 : acc >= 95 ? 2 : acc >= 90 ? 1 : 0)
        : (acc >= 96 && wpm >= target * 0.8 ? 3 : acc >= 90 ? 2 : acc >= 80 ? 1 : 0);
      const id = lkey(track, index, pro);
      const xp = Math.round((stars * 15 + wpm / 2 + 5) * (pro ? 1.5 : 1));
      const prev = D.lessons[id] || {};
      D.lessons[id] = { stars: Math.max(prev.stars || 0, stars), wpm: Math.max(prev.wpm || 0, wpm), acc: Math.max(prev.acc || 0, acc), plays: (prev.plays || 0) + 1 };
      results.forEach((r) => mergeKeys(r.keyStats));
      addPractice(time);
      record({ type: 'lesson', title: `${t.name}: ${L.title}${pro ? ' (Pro)' : ''}`, wpm, acc, dur: Math.round(time) });
      gainXp(xp);
      checkBadges();
      save();
      Sound.success(stars || 1);
      const hasNext = index + 1 < t.lessons.length;
      modal(`
        <div class="result center">
          ${pro ? '<div class="tag pro">Pro mode</div><br>' : ''}${starRow(stars, 'xl')}
          <h2>${stars === 3 ? 'Excellent!' : stars === 2 ? 'Great job!' : stars === 1 ? 'Good effort!' : 'Keep practising'}</h2>
          <p class="muted">${stars < 3 ? (acc < (pro ? 98 : 96) ? `Slow down a little and aim for ${pro ? 98 : 96}% accuracy to earn 3 stars.` : `Reach about ${Math.round(target * (pro ? 1.25 : 0.8))} WPM with high accuracy for 3 stars.`) : pro ? 'Pro level mastered. Outstanding!' : 'You mastered this lesson. Ready for Pro mode?'}</p>
          <div class="res-stats"><div><b>${wpm}</b><span>WPM</span></div><div><b>${acc}%</b><span>Accuracy</span></div><div><b>${fmtTime(time)}</b><span>Time</span></div><div><b>+${xp}</b><span>XP</span></div></div>
          <div class="row center">
            <button class="btn ghost" data-retry>${icon('redo')} Try again</button>
            ${!pro && stars === 3 ? `<button class="btn ghost" data-pro>${icon('bolt')} Try Pro</button>` : ''}
            ${hasNext ? `<button class="btn primary" data-next>Next lesson ${icon('play')}</button>` : `<button class="btn primary" data-list>Back to lessons</button>`}
          </div>
          <small class="muted">Press Enter for ${hasNext ? 'the next lesson' : 'lessons'}, Esc to close</small>
        </div>`, {
        dismiss: false,
        onX: () => go('lessons', { track }),
        onMount: (m, close) => {
          const next = () => { close(); go('lesson', { track, index: index + 1, pro }); };
          const retry = () => { close(); go('lesson', { track, index, pro }); };
          $('[data-retry]', m).addEventListener('click', retry);
          const tp = $('[data-pro]', m); if (tp) tp.addEventListener('click', () => { close(); go('lesson', { track, index, pro: true }); });
          if (hasNext) $('[data-next]', m).addEventListener('click', next); else $('[data-list]', m).addEventListener('click', () => { close(); go('lessons', { track }); });
          const kh = (e) => { if (!document.body.contains(m)) { window.removeEventListener('keydown', kh, true); return; } if (e.key === 'Enter') { e.preventDefault(); window.removeEventListener('keydown', kh, true); hasNext ? next() : (close(), go('lessons', { track })); } };
          setTimeout(() => window.addEventListener('keydown', kh, true), 400);
        },
      });
    }

    // Intro for lessons with new keys
    if (!pro && L.keys && !(D.lessons[`${track}-${index}`] || {}).stars) {
      const infos = [...L.keys].map((c) => ({ c, info: ui.kb.highlight(c, L.numpad) }));
      ui.kb.clear();
      modal(`
        <div class="center intro">
          <div class="tag">New keys</div>
          <div class="big-keys">${infos.map(({ c }) => `<kbd>${esc(c.toUpperCase())}</kbd>`).join('')}</div>
          <ul class="finger-list">${infos.map(({ c, info }) => `<li><kbd>${esc(c.toUpperCase())}</kbd> ${info ? `use your <b>${info.name}</b>${info.shiftFinger ? ' with Shift' : ''}` : ''}</li>`).join('')}</ul>
          <p class="muted">${L.numpad ? 'Rest your right hand on 4 5 6 (the 5 key has a bump).' : 'Keep your fingers on the home row: A S D F and J K L ;. Feel the bumps on F and J.'}</p>
          <button class="btn primary lg" data-go>Start lesson</button><br><small class="muted">or press Space</small>
        </div>`, {
        dismiss: false,
        onMount: (m, close) => {
          const begin = () => { window.removeEventListener('keydown', kh, true); close(); startStep(); };
          const kh = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); begin(); } };
          window.addEventListener('keydown', kh, true);
          $('[data-go]', m).addEventListener('click', begin);
        },
      });
    } else startStep();

    cleanup = () => { if (session) session.destroy(); window.removeEventListener('keydown', escH); };
  };

  // ----- typing test -----
  VIEWS.test = (v, arg = {}) => {
    const opt = { duration: arg.duration || D.lastTestDur || 60, source: arg.source || D.lastTestSrc || 'passages', custom: D.customText || '' };
    function setup() {
      v.innerHTML = `
        <header class="page-head"><div><h1>Typing Test</h1><p class="muted">Measure your real speed. The timer starts with your first key.</p></div></header>
        <div class="grid test-grid">
          <section class="card">
            <h3>Length</h3>
            <div class="seg" id="dur">${[[30, '30 sec'], [60, '1 min'], [120, '2 min'], [180, '3 min'], [300, '5 min']].map(([s, n]) => `<button data-d="${s}" class="${s === opt.duration ? 'on' : ''}">${n}</button>`).join('')}</div>
            <h3>Text</h3>
            <div class="seg" id="src">${[['passages', 'Stories'], ['words', 'Common words'], ['code', 'Code'], ['custom', 'My text']].map(([s, n]) => `<button data-s="${s}" class="${s === opt.source ? 'on' : ''}">${n}</button>`).join('')}</div>
            <textarea id="custom" class="${opt.source === 'custom' ? '' : 'hide'}" placeholder="Paste or write any text to practise with.">${esc(opt.custom)}</textarea>
            <button class="btn primary lg" data-start>${icon('play')} Start test</button>
          </section>
          <section class="card">
            <h3>Your tests</h3>
            ${D.tests.length ? `<div class="pb"><div><b>${bestWpm()}</b><span>Best WPM</span></div><div><b>${Math.round(D.tests.slice(-5).reduce((a, x) => a + x.wpm, 0) / Math.min(5, D.tests.length))}</b><span>Last 5 average</span></div><div><b>${D.tests.length}</b><span>Tests taken</span></div></div>
            ${lineChart(D.tests.slice(-15).map((x) => x.wpm), 'WPM')}` : '<p class="muted">No tests yet. Take your first one to set a baseline.</p>'}
            <div class="wpm-guide"><span><b>0-25</b> Beginner</span><span><b>25-40</b> Average</span><span><b>40-60</b> Fast</span><span><b>60+</b> Pro</span></div>
          </section>
        </div>`;
      $$('#dur button', v).forEach((b) => b.addEventListener('click', () => { opt.duration = +b.dataset.d; $$('#dur button', v).forEach((x) => x.classList.toggle('on', x === b)); }));
      $$('#src button', v).forEach((b) => b.addEventListener('click', () => { opt.source = b.dataset.s; $$('#src button', v).forEach((x) => x.classList.toggle('on', x === b)); $('#custom', v).classList.toggle('hide', opt.source !== 'custom'); }));
      $('[data-start]', v).addEventListener('click', run);
    }

    let session = null;
    function run() {
      if (opt.source === 'custom') { opt.custom = $('#custom', v).value; D.customText = opt.custom.slice(0, 5000); if (!opt.custom.trim()) { toast('Please add some text first.'); return; } }
      D.lastTestDur = opt.duration; D.lastTestSrc = opt.source;
      let text = testText(opt.source, opt.custom);
      while (text.length < opt.duration * 12) text += ' ' + testText(opt.source, opt.custom);
      const ui = typingArea(v, { title: `${fmtTime(opt.duration)} typing test`, sub: { passages: 'Stories', words: 'Common words', code: 'Code', custom: 'My text' }[opt.source], back: 'Test options' });
      $('#lv-tl', v).textContent = 'Left';
      $('#lv-time', v).textContent = fmtTime(opt.duration);
      $('#steps', v).remove();
      $('[data-back]', v).addEventListener('click', () => { if (session) session.destroy(); setup(); });
      v.querySelector('.text-wrap').classList.add('test-text');
      session = new window.XTEngine.Session({
        el: ui.text, text, stopOnError: false, timeLimit: opt.duration, keyboard: ui.kb, hands: ui.hands,
        onStart: () => $('#hint', v).classList.add('gone'),
        onUpdate: (st) => { updateLive(v, st, opt.duration); fingerTip(v, ui.kb, text[session.pos]); },
        onDone: (st) => result(st),
      });
      fingerTip(v, ui.kb, text[0]);
    }

    function result(st) {
      const prevBest = bestWpm();
      D.tests.push({ t: Date.now(), wpm: st.wpm, acc: st.acc, dur: opt.duration, raw: st.raw });
      if (D.tests.length > 500) D.tests.shift();
      mergeKeys(st.keyStats); addPractice(st.time);
      record({ type: 'test', title: `${fmtTime(opt.duration)} typing test`, wpm: st.wpm, acc: st.acc, dur: Math.round(st.time) });
      gainXp(st.wpm * (opt.duration / 60) + 5);
      checkBadges(); save();
      Sound.success(st.wpm > prevBest ? 3 : 2);
      const weak = Object.entries(st.keyStats).filter(([, s]) => s.m).sort((a, b) => b[1].m - a[1].m).slice(0, 5);
      modal(`
        <div class="result center">
          <div class="tag">${st.wpm > prevBest && prevBest ? 'New personal best!' : 'Test complete'}</div>
          <div class="big-wpm"><b>${st.wpm}</b><span>words per minute</span></div>
          <div class="res-stats"><div><b>${st.acc}%</b><span>Accuracy</span></div><div><b>${st.raw}</b><span>Raw WPM</span></div><div><b>${st.chars}</b><span>Correct chars</span></div><div><b>${st.errors}</b><span>Errors</span></div></div>
          ${weak.length ? `<p class="muted">Keys to practise: ${weak.map(([c]) => `<kbd>${esc(c === ' ' ? 'space' : c)}</kbd>`).join(' ')}</p>` : '<p class="muted">No mistakes. Brilliant!</p>'}
          <div class="row center"><button class="btn ghost" data-opts>Change options</button><button class="btn primary" data-again>${icon('redo')} Test again</button></div>
        </div>`, {
        dismiss: false,
        onX: () => setup(),
        onMount: (m, close) => {
          $('[data-again]', m).addEventListener('click', () => { close(); run(); });
          $('[data-opts]', m).addEventListener('click', () => { close(); setup(); });
        },
      });
    }

    setup();
    if (arg.autostart) run();
    cleanup = () => { if (session) session.destroy(); };
  };

  // ----- games -----
  VIEWS.games = (v) => {
    v.innerHTML = `
      <header class="page-head"><div><h1>Games</h1><p class="muted">Practise while you play. Every game helps a different skill.</p></div></header>
      <div class="game-grid">${window.XTGames.GAMES.map((g) => {
        const r = D.games[g.id] || {};
        return `<button class="card game g-${g.id}" data-g="${g.id}"><div class="game-art">${icon(g.icon)}</div><div class="game-info"><div class="tag">${esc(g.skill)}</div><h2>${esc(g.name)}</h2><p class="muted">${esc(g.desc)}</p><div class="row"><span class="pill">Best ${r.best || 0}</span><span class="pill">Played ${r.plays || 0}</span></div></div></button>`;
      }).join('')}</div>`;
    $$('[data-g]', v).forEach((b) => b.addEventListener('click', () => go('play', b.dataset.g)));
  };

  VIEWS.play = (v, id) => {
    const g = window.XTGames.GAMES.find((x) => x.id === id);
    v.innerHTML = `<div class="play"><div class="play-top"><button class="btn ghost sm" data-back>${icon('back')} Games</button><div class="play-title"><b>${esc(g.name)}</b><small>${esc(g.skill)}</small></div><div></div></div><div class="arena" id="arena"></div></div>`;
    $('[data-back]', v).addEventListener('click', () => go('games'));
    const arena = $('#arena', v);
    const letters = TRACKS[0].lessons.filter((_, i) => (D.lessons['beginner-' + i] || {}).stars).map((l) => l[1]).join('');
    const begin = () => {
      arena.className = 'arena';
      const t0 = performance.now();
      const stop = window.XTGames.start(id, arena, (r) => {
        const sec = (performance.now() - t0) / 1000;
        addPractice(sec);
        const rec = D.games[id] || (D.games[id] = { best: 0, plays: 0, wins: 0 });
        const best = r.score > rec.best;
        rec.plays++; rec.best = Math.max(rec.best, r.score); if (r.place === 1) rec.wins = (rec.wins || 0) + 1;
        record({ type: 'game', title: g.name, score: r.score, acc: r.acc, wpm: r.wpm || 0 });
        gainXp(r.score / 25 + 5); checkBadges(); save();
        Sound.success(best ? 3 : 1);
        modal(`
          <div class="result center">
            <div class="tag">${best ? 'New high score!' : 'Game over'}</div>
            ${id === 'sprint' ? `<div class="big-wpm"><b>${['', '1st', '2nd', '3rd', '4th'][r.place]}</b><span>place . ${r.wpm} WPM</span></div>` : `<div class="big-wpm"><b>${r.score}</b><span>points</span></div>`}
            <div class="res-stats"><div><b>${r.acc}%</b><span>Accuracy</span></div><div><b>${id === 'sprint' ? r.score : r.level}</b><span>${id === 'sprint' ? 'Points' : 'Level reached'}</span></div><div><b>${rec.best}</b><span>High score</span></div></div>
            <div class="row center"><button class="btn ghost" data-exit>All games</button><button class="btn primary" data-again>${icon('redo')} Play again</button></div>
          </div>`, { dismiss: false, onX: () => go('games'), onMount: (m, close) => { $('[data-again]', m).addEventListener('click', () => { close(); begin(); }); $('[data-exit]', m).addEventListener('click', () => { close(); go('games'); }); } });
      }, { letters, avgWpm: avgWpm() });
      cleanup = stop;
    };
    arena.innerHTML = `<div class="g-start"><div class="game-art">${icon(g.icon)}</div><h2>${esc(g.name)}</h2><p class="muted">${esc(g.desc)}</p><button class="btn primary lg" data-go>${icon('play')} Play</button></div>`;
    $('[data-go]', arena).addEventListener('click', begin);
  };

  // ----- progress -----
  VIEWS.progress = (v) => {
    const days = [];
    for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push({ d, s: D.daily[dayKey(d)] || 0 }); }
    const maxDay = Math.max(60, ...days.map((x) => x.s));
    const weak = Object.entries(D.keyStats).filter(([c, s]) => c !== ' ' && s.h + s.m >= 5).map(([c, s]) => [c, s.m / (s.h + s.m), s]).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const hist = D.history.slice(-40).reverse();
    v.innerHTML = `
      <header class="page-head"><div><h1>Progress</h1><p class="muted">Everything you have practised, saved on this PC.</p></div></header>
      <div class="grid stats4">
        ${statCard('bolt', bestWpm() || '-', 'Best test WPM', `average ${avgWpm(1000) || 0} WPM`)}
        ${statCard('target', avgAcc(1000) ? avgAcc(1000) + '%' : '-', 'Overall accuracy', `${D.history.length} sessions`)}
        ${statCard('timer', fmtMin(practiceSec()), 'Time practised', `${Object.keys(D.daily).length} active days`)}
        ${statCard('star', totalStars(), 'Stars', `level ${level(D.xp)} . ${D.xp} XP`)}
      </div>
      <div class="grid dash2">
        <section class="card"><h3>Speed (WPM)</h3>${lineChart(D.history.filter((h) => h.type !== 'game').slice(-30).map((h) => h.wpm), 'WPM')}</section>
        <section class="card"><h3>Accuracy (%)</h3>${lineChart(D.history.filter((h) => h.type !== 'game').slice(-30).map((h) => h.acc), '%')}</section>
      </div>
      <section class="card"><div class="row between"><h3>Key heatmap</h3><div class="legend"><i style="--c:hsl(140,80%,55%)"></i>accurate<i style="--c:hsl(60,80%,55%)"></i>some errors<i style="--c:hsl(0,80%,55%)"></i>needs practice</div></div><div class="heat-holder"><div id="hk"></div></div>
        ${weak.length ? `<p class="muted">Weakest keys: ${weak.map(([c, r]) => `<kbd>${esc(c)}</kbd> ${Math.round((1 - r) * 100)}%`).join('  ')}</p>` : '<p class="muted">Type more to see which keys need practice.</p>'}</section>
      <div class="grid dash2">
        <section class="card"><h3>Last 14 days</h3><div class="bars">${days.map((x) => `<div title="${fmtMin(x.s)}"><i style="height:${(x.s / maxDay) * 100}%"></i><small>${x.d.toLocaleDateString([], { weekday: 'narrow' })}</small></div>`).join('')}</div></section>
        <section class="card"><h3>History</h3>${hist.length ? `<ul class="act scroll">${hist.map(actRow).join('')}</ul>` : '<p class="muted">No sessions yet.</p>'}</section>
      </div>`;
    const kb = new Keyboard($('#hk', v), D.settings.layout, 46);
    kb.heat(D.keyStats);
  };

  VIEWS.achievements = (v) => {
    const got = BADGES.filter((b) => D.badges[b.id]).length;
    v.innerHTML = `
      <header class="page-head"><div><h1>Achievements</h1><p class="muted">${got} of ${BADGES.length} unlocked</p></div></header>
      <div class="bar wide"><i style="width:${(got / BADGES.length) * 100}%"></i></div>
      <div class="badge-grid">${BADGES.map((b) => `<div class="card badge ${D.badges[b.id] ? 'got' : ''}"><div class="badge-ic">${icon(D.badges[b.id] ? b.icon : 'lock')}</div><b>${esc(b.name)}</b><small class="muted">${esc(b.desc)}</small>${D.badges[b.id] ? `<small class="when">${new Date(D.badges[b.id]).toLocaleDateString()}</small>` : ''}</div>`).join('')}</div>`;
  };

  // ----- settings -----
  function layoutPicker(el, onChange) {
    el.innerHTML = Object.entries(LAYOUTS).map(([id, L]) => `<button class="lay ${D.settings.layout === id ? 'on' : ''}" data-l="${id}"><div class="lay-prev"><div class="kbp" id="kp-${id}"></div></div><b>${esc(L.name)}</b><small class="muted">${esc(L.desc)}</small></button>`).join('');
    Object.keys(LAYOUTS).forEach((id) => new Keyboard($('#kp-' + id, el), id));
    $$('[data-l]', el).forEach((b) => b.addEventListener('click', () => {
      D.settings.layout = b.dataset.l; save();
      $$('[data-l]', el).forEach((x) => x.classList.toggle('on', x === b));
      onChange(b.dataset.l);
    }));
  }

  VIEWS.settings = async (v) => {
    const s = D.settings;
    const info = await window.xt.info();
    v.innerHTML = `
      <header class="page-head"><div><h1>Settings</h1><p class="muted">Changes save automatically for your profile.</p></div></header>
      <section class="card"><h3>${icon('kb')} Keyboard layout</h3><p class="muted">Pick the keyboard that matches yours. Desktop keyboards often have a number pad on the right; many laptops do not.</p><div class="layout-pick" id="lp"></div></section>
      <div class="grid dash2">
        <section class="card"><h3>${icon('vol')} Sound</h3>
          <label>Key sound<select id="snd">${[['mechanical', 'Mechanical tick'], ['typewriter', 'Typewriter'], ['soft', 'Soft tap'], ['bubble', 'Bubble'], ['off', 'Off']].map(([k, n]) => `<option value="${k}" ${s.sound === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
          <label>Volume <input type="range" id="vol" min="0" max="1" step="0.05" value="${s.volume}"></label>
          ${toggle('errorSound', 'Play a sound on mistakes', s.errorSound)}
          <button class="btn ghost sm" id="try">Try it: type here</button>
        </section>
        <section class="card"><h3>${icon('target')} Practice</h3>
          ${toggle('stopOnError', 'Lessons: stop on mistakes until the right key is pressed', s.stopOnError)}
          ${toggle('showKeyboard', 'Show on-screen keyboard', s.showKeyboard)}
          ${toggle('showHands', 'Show hand and finger guide', s.showHands)}
          <label>Target speed for 3 stars <span class="muted" id="tw">${s.targetWpm} WPM</span><input type="range" id="target" min="10" max="80" step="5" value="${s.targetWpm}"></label>
          <label>Daily goal <span class="muted" id="dg">${s.dailyGoal} minutes</span><input type="range" id="goal" min="5" max="60" step="5" value="${s.dailyGoal}"></label>
          <label>Theme<div class="seg" id="theme"><button data-t="dark" class="${s.theme !== 'light' ? 'on' : ''}">Dark</button><button data-t="light" class="${s.theme === 'light' ? 'on' : ''}">Light</button></div></label>
        </section>
      </div>
      <div class="grid dash2">
        <section class="card"><h3>${icon('user')} Profile</h3>
          <form id="fn"><label>Full name<input name="n" value="${esc(user.fullName)}" maxlength="60"></label><label>Username<input value="${esc(user.username)}" disabled></label><button class="btn ghost sm">Save name</button></form>
          <form id="pw"><h4>Change password</h4><div class="row2"><label>Current<input type="password" name="o" required></label><label>New<input type="password" name="p" required></label></div><button class="btn ghost sm">Change password</button></form>
        </section>
        <section class="card"><h3>${icon('lock')} Data on this PC</h3>
          <p class="muted">TypeX has no cloud. Your progress stays on this computer until its data is erased. Save a backup file to move progress to another PC.</p>
          <div class="row"><button class="btn ghost sm" id="exp">Save backup file</button><button class="btn ghost sm" id="imp">Load backup file</button></div>
          <small class="muted path">Stored in: ${esc(info.dataDir)}</small>
          <hr><h4 class="danger-t">Delete profile</h4><p class="muted">Removes this profile and all its progress from this PC.</p><button class="btn danger sm" id="del">Delete my profile</button>
        </section>
      </div>
      <section class="card about"><img src="assets/icon.png" alt=""><div><b>TypeX ${esc(info.version)}</b><p class="muted">Free typing tutor for Windows. No ads, no accounts online, no tracking.</p></div><button class="credit" data-datix>Developed by <b>Datix AI</b> . datixai.com</button></section>`;
    wireDatix(v);
    layoutPicker($('#lp', v), () => toast('Keyboard layout updated', 'ok'));
    $('#snd', v).addEventListener('change', (e) => { s.sound = e.target.value; applySettings(); save(); Sound.key(false); });
    $('#vol', v).addEventListener('input', (e) => { s.volume = +e.target.value; applySettings(); save(); Sound.key(false); });
    $('#target', v).addEventListener('input', (e) => { s.targetWpm = +e.target.value; $('#tw', v).textContent = s.targetWpm + ' WPM'; save(); });
    $('#goal', v).addEventListener('input', (e) => { s.dailyGoal = +e.target.value; $('#dg', v).textContent = s.dailyGoal + ' minutes'; save(); });
    $$('[data-tog]', v).forEach((c) => c.addEventListener('change', () => { s[c.dataset.tog] = c.checked; applySettings(); save(); }));
    $$('#theme button', v).forEach((b) => b.addEventListener('click', () => { s.theme = b.dataset.t; $$('#theme button', v).forEach((x) => x.classList.toggle('on', x === b)); applySettings(); save(); }));
    const tryB = $('#try', v);
    const tryH = (e) => { if (document.activeElement === tryB && e.key.length === 1) { e.preventDefault(); Sound.key(e.key === ' '); } };
    window.addEventListener('keydown', tryH);
    cleanup = () => window.removeEventListener('keydown', tryH);
    tryB.addEventListener('click', () => Sound.key(false));
    $('#fn', v).addEventListener('submit', async (e) => { e.preventDefault(); const r = await window.xt.update({ fullName: e.target.n.value }); if (!r.ok) return toast(r.error, 'bad'); user.fullName = r.user.fullName; refreshMe(); toast('Name saved', 'ok'); });
    $('#pw', v).addEventListener('submit', async (e) => { e.preventDefault(); const r = await window.xt.update({ oldPassword: e.target.o.value, newPassword: e.target.p.value }); if (!r.ok) return toast(r.error, 'bad'); e.target.reset(); toast('Password changed', 'ok'); });
    $('#exp', v).addEventListener('click', async () => { await window.xt.save(D); const r = await window.xt.exportData(); if (r.ok) toast('Backup saved', 'ok'); });
    $('#imp', v).addEventListener('click', async () => { const r = await window.xt.importData(); if (r.ok) { D = ensure(r.data); applySettings(); toast('Progress loaded', 'ok'); go('settings'); } else if (r.error) toast(r.error, 'bad'); });
    $('#del', v).addEventListener('click', () => modal(`
      <h2>Delete profile?</h2><p class="muted">This removes <b>@${esc(user.username)}</b> and all progress from this PC. It cannot be undone.</p>
      <form id="dl"><label>Password<input type="password" name="p" required autofocus></label><div class="err" id="err"></div><div class="row"><button type="button" class="btn ghost" data-c>Cancel</button><button class="btn danger">Delete forever</button></div></form>`, {
      onMount: (m, close) => {
        $('[data-c]', m).addEventListener('click', close);
        $('#dl', m).addEventListener('submit', async (e) => { e.preventDefault(); const r = await window.xt.remove({ password: e.target.p.value }); if (!r.ok) { $('#err', m).textContent = r.error; return; } close(); toast('Profile deleted'); showLogin(); });
      },
    }));
  };

  const toggle = (k, label, on) => `<label class="tog"><input type="checkbox" data-tog="${k}" ${on ? 'checked' : ''}><span class="sw"></span><span>${label}</span></label>`;

  // Save before the window closes.
  window.addEventListener('beforeunload', () => { if (D) window.xt.save(D); });

  showLogin();
})();

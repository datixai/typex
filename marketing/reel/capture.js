// Builds the screen-capture steps for the TypeX reel (demo data only, separate data folder).
// Run:  set XT_USERDATA, XT_SHOT and XT_STEPS (see README in this folder) then `npx electron .`
const path = require('path');
const OUT = path.join(__dirname, 'work', 'cap');
const shot = (n) => path.join(OUT, n + '.png');
const steps = [];
const add = (js, name, wait) => steps.push({ js, shot: name ? shot(name) : null, wait });

const W = (ms) => `await new Promise(r => setTimeout(r, ${ms}));`;
const code = (ch) => (/[a-z]/i.test(ch) ? 'Key' + ch.toUpperCase() : ch === ' ' ? 'Space' : '');
const key = (ch) => `window.dispatchEvent(new KeyboardEvent('keydown', { key: ${JSON.stringify(ch)}, code: '${code(ch)}' }));`;
const run = (body) => `(async () => { ${body} })()`;
const textJs = `[...document.querySelectorAll('#text .c')].map(c => c.textContent === '\\u00a0' ? ' ' : c.textContent).join('')`;

// Demo data: a learner who started slow and is now improving.
const seed = `(() => {
  const now = Date.now(), day = 86400000, d = (n) => { const x = new Date(now - n * day); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
  const history = [], tests = [], daily = {};
  for (let i = 0; i < 26; i++) {
    const wpm = Math.round(14 + i * 1.5 + (i % 3) * 2), acc = Math.min(99, 86 + Math.round(i / 2.5));
    history.push({ t: now - (26 - i) * day / 2, type: i % 4 === 3 ? 'test' : 'lesson', title: i % 4 === 3 ? '1m typing test' : 'Beginner: practice', wpm, acc, dur: 90 });
    if (i % 4 === 3) tests.push({ t: now - (26 - i) * day / 2, wpm, acc, dur: 60, raw: wpm + 3 });
  }
  history.push({ t: now - 3600000, type: 'game', title: 'Meteor Words', score: 2480, acc: 94, wpm: 0 });
  [0,1,2,3,4,5,6,8,9,10,11,12,13].forEach((n, i) => { daily[d(n)] = 420 + (i * 97) % 700; });
  const lessons = {};
  for (let i = 0; i < 14; i++) lessons['beginner-' + i] = { stars: i % 5 === 4 ? 2 : 3, wpm: 18 + i * 2, acc: 95 + (i % 4), plays: 2 };
  lessons['beginner-0@pro'] = { stars: 3, wpm: 41, acc: 99, plays: 1 };
  lessons['beginner-1@pro'] = { stars: 2, wpm: 38, acc: 96, plays: 1 };
  const keyStats = {};
  'abcdefghijklmnopqrstuvwxyz;,./'.split('').forEach((c, i) => { const h = 120 + (i * 37) % 200; keyStats[c] = { h, m: Math.round(h * ((i * 13) % 17 === 0 ? 0.18 : ((i * 7) % 5) * 0.015)) }; });
  keyStats[' '] = { h: 900, m: 8 };
  const badges = {}; ['first', 'home', 'l10', 'stars30', 'perfect', 'w20', 'w35', 's3', 's7', 'hour', 'gamer'].forEach((b, i) => badges[b] = now - i * day);
  return { settings: { layout: 'full', sound: 'mechanical', volume: 0.6, errorSound: true, theme: 'dark', showKeyboard: true, showHands: true, stopOnError: true, targetWpm: 25, dailyGoal: 15, mode: 'beginner' },
    lessons, history, tests, keyStats, games: { meteor: { best: 2480, plays: 6 }, balloon: { best: 1320, plays: 4 }, sprint: { best: 640, plays: 3, wins: 1 } },
    daily, badges, xp: 2650, lastTrack: 'beginner' };
})()`;

// 1. profile picker (profiles are created first by seed run: node capture.js --seed > work/seed.js)
add('', 'login', 300);

// 2. sign in as the demo learner -> dashboard
add(run(`
  [...document.querySelectorAll('.profile[data-u]')].find(b => b.dataset.u === 'alex.demo').click(); ${W(150)}
  const f = document.querySelector('#f'); f.p.value = 'demo1234'; f.requestSubmit();`), null, 900);
add('', 'dashboard', 200);

// 3. lessons page
add(`document.querySelector('[data-nav=lessons]').click()`, 'lessons', 400);

// 4. typing flipbook in a beginner lesson (keyboard glow + hands)
add(`document.querySelector('.lesson[data-i="19"]').click()`, null, 500);
add(`window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))`, null, 400);
for (let i = 0; i < 26; i++) add(run(`const t = ${textJs}; const st = document.querySelectorAll('#text .c.ok,#text .c.fix').length; const ch = t[st]; ${''} window.dispatchEvent(new KeyboardEvent('keydown', { key: ch, code: /[a-z]/i.test(ch) ? 'Key' + ch.toUpperCase() : ch === ' ' ? 'Space' : '' }));`), `type_${String(i).padStart(2, '0')}`, 270);

// 5. finish the lesson quickly -> 3 star result popup
add(run(`for (let s = 0; s < 4; s++) { const t = ${textJs}; const st = document.querySelectorAll('#text .c.ok,#text .c.fix').length; for (const ch of t.slice(st)) { ${''} window.dispatchEvent(new KeyboardEvent('keydown', { key: ch })); ${W(230)} } ${W(500)} }`), null, 1600);
add('', 'result', 100);

// 6. Pro mode
add(`document.querySelector('[data-x]').click()`, null, 400);
add(`document.querySelector('[data-m=pro]').click()`, 'lessons_pro', 400);
add(run(`document.querySelector('.lesson[data-i="5"]').click(); ${W(400)} const t = ${textJs}; for (const ch of t.slice(0, 9)) { window.dispatchEvent(new KeyboardEvent('keydown', { key: ch })); ${W(250)} }`), 'pro_play', 300);

// 7. typing test flipbook
add(`document.querySelector('[data-nav=test]').click()`, 'test_setup', 400);
add(`document.querySelector('[data-start]').click()`, null, 400);
for (let i = 0; i < 14; i++) add(run(`const t = ${textJs}; const st = document.querySelectorAll('#text .c.ok,#text .c.bad').length; for (const ch of t.slice(st, st + 3)) { window.dispatchEvent(new KeyboardEvent('keydown', { key: ch, code: /[a-z]/i.test(ch) ? 'Key' + ch.toUpperCase() : '' })); ${W(240)} }`), `test_${String(i).padStart(2, '0')}`, 60);

// 8. games: Meteor Words and Balloon Pop
add(`document.querySelector('[data-nav=games]').click()`, 'games', 400);
add(run(`document.querySelector('[data-g=meteor]').click(); ${W(200)} document.querySelector('[data-go]').click();`), null, 3500);
for (let i = 0; i < 10; i++) add(run(`const m = [...document.querySelectorAll('.meteor:not(.boom)')].sort((a, b) => parseFloat(b.style.top) - parseFloat(a.style.top))[0]; if (m) { const w = m.innerText.trim(); for (const ch of w.slice(0, ${i % 2 ? 9 : 2})) { window.dispatchEvent(new KeyboardEvent('keydown', { key: ch })); ${W(40)} } }`), `meteor_${String(i).padStart(2, '0')}`, 380);
add(run(`document.querySelector('[data-back]').click(); ${W(200)} document.querySelector('[data-g=balloon]').click(); ${W(200)} document.querySelector('[data-go]').click();`), null, 3200);
for (let i = 0; i < 8; i++) add(run(`const b = [...document.querySelectorAll('.balloon:not(.pop)')].sort((a, b) => parseFloat(a.style.top) - parseFloat(b.style.top))[0]; if (b && ${i % 2}) window.dispatchEvent(new KeyboardEvent('keydown', { key: b.innerText.trim() }));`), `balloon_${String(i).padStart(2, '0')}`, 300);

// 9. progress, achievements, settings
add(run(`document.querySelector('[data-back]').click(); ${W(200)} document.querySelector('[data-nav=progress]').click();`), 'progress', 600);
add(`document.querySelector('#view').scrollTop = 420`, 'progress_heat', 400);
add(`document.querySelector('[data-nav=achievements]').click()`, 'achievements', 500);
add(`document.querySelector('[data-nav=settings]').click()`, 'settings', 700);

if (process.argv.includes('--seed')) {
  process.stdout.write(`(async () => {
  for (const [u, n] of [['sam.demo', 'Sam Demo'], ['riya.demo', 'Riya Demo'], ['alex.demo', 'Alex Demo']]) {
    await xt.register({ username: u, fullName: n, password: 'demo1234' });
    if (u === 'alex.demo') await xt.save(${seed});
    await xt.logout();
  }
  return 'seeded';
})()`);
}
module.exports = steps;

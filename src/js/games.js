/* XTyping games: Meteor Words, Balloon Pop, Speed Sprint. */
(function () {
  const { WORDS, PASSAGES, pick } = window.XTData;

  const GAMES = [
    { id: 'meteor', name: 'Meteor Words', desc: 'Words fall from space. Type each one before it hits the ground.', skill: 'Words and speed', icon: 'meteor' },
    { id: 'balloon', name: 'Balloon Pop', desc: 'Letters float up on balloons. Press the key to pop them. Great for beginners.', skill: 'Single keys', icon: 'balloon' },
    { id: 'sprint', name: 'Speed Sprint', desc: 'Race three robot cars to the finish line by typing a short passage.', skill: 'Real text', icon: 'car' },
  ];

  function el(tag, cls, html) { const d = document.createElement(tag); if (cls) d.className = cls; if (html != null) d.innerHTML = html; return d; }

  function hud(arena) {
    const h = el('div', 'g-hud', '<div><b class="g-score">0</b><span>score</span></div><div><b class="g-level">1</b><span>level</span></div><div class="g-lives"></div>');
    arena.appendChild(h);
    return {
      set(score, level, lives) {
        h.querySelector('.g-score').textContent = score;
        h.querySelector('.g-level').textContent = level;
        h.querySelector('.g-lives').innerHTML = lives == null ? '' : '<i class="heart"></i>'.repeat(Math.max(0, lives));
      },
    };
  }

  // ---------------- Meteor Words ----------------
  function meteor(arena, done) {
    arena.innerHTML = ''; arena.classList.add('g-space');
    const stars = el('div', 'g-stars'); arena.appendChild(stars);
    const ground = el('div', 'g-ground'); arena.appendChild(ground);
    const H = hud(arena);
    const typedBox = el('div', 'g-typed'); arena.appendChild(typedBox);
    let score = 0; let lives = 3; let level = 1; let items = []; let typed = ''; let target = null;
    let last = performance.now(); let spawnIn = 0; let alive = true; let hits = 0; let keys = 0; let miss = 0;
    const pool = WORDS.filter((w) => w.length >= 2 && w.length <= 8);

    function spawn() {
      const w = pick(pool.filter((x) => x.length <= 3 + level));
      const d = el('div', 'meteor', `<span class="m-done"></span><span class="m-left">${w}</span>`);
      const x = 6 + Math.random() * 78;
      d.style.left = x + '%';
      arena.appendChild(d);
      items.push({ w, d, y: -6, speed: 4 + level * 1.3 + Math.random() * 2 });
    }
    function setTarget(t) {
      if (target) target.d.classList.remove('target');
      target = t;
      if (t) t.d.classList.add('target');
    }
    function paint(t) {
      t.d.querySelector('.m-done').textContent = t === target ? typed : '';
      t.d.querySelector('.m-left').textContent = t === target ? t.w.slice(typed.length) : t.w;
    }
    function onKey(e) {
      if (!alive || e.key.length !== 1 || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      keys++;
      const k = e.key.toLowerCase();
      if (!target) {
        const t = items.filter((i) => i.w[0] === k).sort((a, b) => b.y - a.y)[0];
        if (!t) { miss++; window.XTSound.error(); return; }
        setTarget(t); typed = '';
      }
      if (target.w[typed.length] === k) {
        typed += k; window.XTSound.key(false); paint(target);
        if (typed === target.w) {
          hits++; score += target.w.length * 10 * level;
          target.d.classList.add('boom'); window.XTSound.pop();
          const d = target.d; setTimeout(() => d.remove(), 300);
          items = items.filter((i) => i !== target); setTarget(null); typed = '';
          level = 1 + Math.floor(hits / 8);
        }
      } else { miss++; window.XTSound.error(); }
      typedBox.textContent = typed;
      H.set(score, level, lives);
    }
    function frame(now) {
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      spawnIn -= dt;
      if (spawnIn <= 0) { spawn(); spawnIn = Math.max(0.9, 2.8 - level * 0.22); }
      for (const t of items.slice()) {
        t.y += t.speed * dt;
        t.d.style.top = t.y + '%';
        if (t.y > 86) {
          lives--; t.d.classList.add('crash'); const d = t.d; setTimeout(() => d.remove(), 400);
          items = items.filter((i) => i !== t);
          if (t === target) { setTarget(null); typed = ''; typedBox.textContent = ''; }
          window.XTSound.error(); H.set(score, level, lives);
          if (lives <= 0) return end();
        }
      }
      requestAnimationFrame(frame);
    }
    function end() {
      alive = false; window.removeEventListener('keydown', onKey, true);
      done({ score, level, acc: keys ? Math.round(((keys - miss) / keys) * 100) : 100, words: hits });
    }
    window.addEventListener('keydown', onKey, true);
    H.set(score, level, lives);
    requestAnimationFrame(frame);
    return () => { alive = false; window.removeEventListener('keydown', onKey, true); };
  }

  // ---------------- Balloon Pop ----------------
  function balloon(arena, done, opts) {
    arena.innerHTML = ''; arena.classList.add('g-sky');
    const H = hud(arena);
    const letters = (opts && opts.letters && opts.letters.length >= 4 ? opts.letters : 'asdfjkl;ghqwertyuiopzxcvbnm').replace(/[^a-z;,./]/g, '');
    const colors = ['#f472b6', '#818cf8', '#34d399', '#fbbf24', '#60a5fa', '#fb7185'];
    let items = []; let score = 0; let lives = 5; let level = 1; let popped = 0; let keys = 0; let miss = 0;
    let alive = true; let last = performance.now(); let spawnIn = 0;
    function spawn() {
      const ch = pick([...letters]);
      const d = el('div', 'balloon', `<span>${ch}</span>`);
      d.style.left = 5 + Math.random() * 85 + '%';
      d.style.setProperty('--b', pick(colors));
      arena.appendChild(d);
      items.push({ ch, d, y: 104, speed: 7 + level * 1.6 + Math.random() * 3, sway: Math.random() * 6 });
    }
    function onKey(e) {
      if (!alive || e.key.length !== 1 || e.ctrlKey || e.altKey) return;
      e.preventDefault(); keys++;
      const k = e.key.toLowerCase();
      const t = items.filter((i) => i.ch === k).sort((a, b) => a.y - b.y)[0];
      if (!t) { miss++; window.XTSound.error(); return; }
      popped++; score += 10 * level; window.XTSound.pop();
      t.d.classList.add('pop'); const d = t.d; setTimeout(() => d.remove(), 250);
      items = items.filter((i) => i !== t);
      level = 1 + Math.floor(popped / 12);
      H.set(score, level, lives);
    }
    function frame(now) {
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      spawnIn -= dt;
      if (spawnIn <= 0) { spawn(); spawnIn = Math.max(0.45, 1.5 - level * 0.12); }
      for (const t of items.slice()) {
        t.y -= t.speed * dt;
        t.d.style.top = t.y + '%';
        t.d.style.transform = `translateX(${Math.sin(now / 500 + t.sway) * 8}px)`;
        if (t.y < -14) {
          lives--; t.d.remove(); items = items.filter((i) => i !== t); H.set(score, level, lives);
          if (lives <= 0) return end();
        }
      }
      requestAnimationFrame(frame);
    }
    function end() {
      alive = false; window.removeEventListener('keydown', onKey, true);
      done({ score, level, acc: keys ? Math.round(((keys - miss) / keys) * 100) : 100, words: popped });
    }
    window.addEventListener('keydown', onKey, true);
    H.set(score, level, lives);
    requestAnimationFrame(frame);
    return () => { alive = false; window.removeEventListener('keydown', onKey, true); };
  }

  // ---------------- Speed Sprint ----------------
  function sprint(arena, done, opts) {
    arena.innerHTML = ''; arena.classList.add('g-track');
    const text = pick(PASSAGES).split(' ').slice(0, 34).join(' ');
    const base = Math.max(15, (opts && opts.avgWpm) || 25);
    const bots = [
      { name: 'Bolt', wpm: Math.round(base * 0.8), color: '#60a5fa' },
      { name: 'Volt', wpm: Math.round(base * 1.05), color: '#fbbf24' },
      { name: 'Turbo', wpm: Math.round(base * 1.3), color: '#f472b6' },
    ];
    const lanes = el('div', 'lanes');
    const lane = (name, color, you) => {
      const l = el('div', 'lane' + (you ? ' you' : ''), `<span class="lane-name">${name}</span><div class="road"><div class="car" style="--c:${color}"></div><div class="flag"></div></div>`);
      lanes.appendChild(l); return l.querySelector('.car');
    };
    const youCar = lane('You', '#34d399', true);
    bots.forEach((b) => { b.car = lane(`${b.name} <small>${b.wpm} wpm</small>`, b.color); });
    arena.appendChild(lanes);
    const box = el('div', 'sprint-text'); arena.appendChild(box);
    const count = el('div', 'countdown', '3'); arena.appendChild(count);
    let session = null; let raf = 0; let t0 = 0; let finished = false;
    const total = text.length;
    let n = 3;
    const cd = setInterval(() => {
      n--; count.textContent = n > 0 ? n : 'GO!'; window.XTSound.key(n <= 0);
      if (n < 0) { clearInterval(cd); count.remove(); go(); }
    }, 700);
    function go() {
      t0 = performance.now();
      session = new window.XTEngine.Session({
        el: box, text, stopOnError: true, scrollLine: 0,
        onUpdate: (s) => { youCar.style.left = `calc(${s.progress * 100}% - ${s.progress * 46}px)`; },
        onDone: (s) => finish(s),
      });
      session.start = t0;
      raf = requestAnimationFrame(move);
    }
    function move(now) {
      if (finished) return;
      const min = (now - t0) / 60000;
      bots.forEach((b) => {
        b.p = Math.min(1, (b.wpm * 5 * min) / total);
        b.car.style.left = `calc(${b.p * 100}% - ${b.p * 46}px)`;
        if (b.p >= 1 && !b.at) b.at = now;
      });
      raf = requestAnimationFrame(move);
    }
    function finish(s) {
      finished = true; cancelAnimationFrame(raf);
      youCar.style.left = 'calc(100% - 46px)';
      const yourTime = performance.now();
      const place = 1 + bots.filter((b) => b.at && b.at < yourTime).length;
      done({ score: Math.max(0, s.wpm * 10 + (4 - place) * 100), place, wpm: s.wpm, acc: s.acc, level: place });
    }
    return () => { finished = true; clearInterval(cd); cancelAnimationFrame(raf); if (session) session.destroy(); };
  }

  const RUN = { meteor, balloon, sprint };
  window.XTGames = { GAMES, start: (id, arena, done, opts) => RUN[id](arena, done, opts) };
})();

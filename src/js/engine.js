/* Typing engine: renders text, checks keys, tracks speed, accuracy and per-key stats. */
(function () {
  const IGNORE = new Set(['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Dead', 'Unidentified', 'NumLock', 'ContextMenu']);

  class Session {
    /**
     * opts: { el, text, stopOnError, timeLimit (s), keyboard, hands, preferNumpad, onUpdate, onDone }
     */
    constructor(opts) {
      this.o = opts;
      this.text = opts.text;
      this.pos = 0;
      this.state = new Array(this.text.length).fill(0); // 0 todo, 1 ok, 2 wrong, 3 corrected
      this.typed = 0; this.correct = 0; this.errors = 0;
      this.keyStats = {};
      this.start = 0; this.end = 0; this.done = false;
      this.wrongHere = false;
      this.render();
      this.handler = (e) => this.onKey(e);
      window.addEventListener('keydown', this.handler, true);
      this.timer = setInterval(() => this.tick(), 200);
      this.focusNext();
    }

    render() {
      const el = this.o.el;
      el.innerHTML = '';
      el.classList.add('tt');
      const inner = document.createElement('div'); inner.className = 'tt-inner';
      this.spans = [];
      let word = document.createElement('span'); word.className = 'w';
      for (let i = 0; i < this.text.length; i++) {
        const ch = this.text[i];
        const s = document.createElement('span');
        s.className = 'c' + (ch === ' ' ? ' sp' : '');
        s.textContent = ch === ' ' ? ' ' : ch;
        this.spans.push(s);
        word.appendChild(s);
        if (ch === ' ') { inner.appendChild(word); word = document.createElement('span'); word.className = 'w'; }
      }
      inner.appendChild(word);
      el.appendChild(inner);
      this.inner = inner;
      this.paint(0);
    }

    paint(i) {
      const s = this.spans[i];
      if (!s) return;
      s.classList.remove('cur', 'ok', 'bad', 'fix');
      const st = this.state[i];
      if (st === 1) s.classList.add('ok'); else if (st === 2) s.classList.add('bad'); else if (st === 3) s.classList.add('fix');
      if (i === this.pos && !this.done) s.classList.add('cur');
    }

    focusNext() {
      const ch = this.done ? null : this.text[this.pos];
      const info = this.o.keyboard ? this.o.keyboard.highlight(ch, this.o.preferNumpad) : null;
      if (this.o.hands) window.XTKeyboard.setHands(this.o.hands, info);
      // keep the current line in view (scroll by line)
      const s = this.spans[this.pos];
      if (s && this.o.el.clientHeight) {
        const lineH = s.offsetHeight || 40;
        const top = s.offsetTop;
        const shift = Math.max(0, top - lineH * (this.o.scrollLine ?? 1));
        this.inner.style.transform = `translateY(${-shift}px)`;
      }
    }

    stat(ch, ok) {
      const k = this.keyStats[ch] || (this.keyStats[ch] = { h: 0, m: 0 });
      if (ok) k.h++; else k.m++;
    }

    onKey(e) {
      if (this.done || this.paused) return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      const k = e.key;
      if (k === 'Backspace') {
        e.preventDefault();
        if (this.o.stopOnError || this.pos === 0) return;
        this.pos--; this.state[this.pos] = 0; this.paint(this.pos); this.paint(this.pos + 1);
        this.focusNext();
        return;
      }
      if (IGNORE.has(k) || k.length !== 1) return;
      e.preventDefault();
      if (!this.start) { this.start = performance.now(); this.o.onStart && this.o.onStart(); }
      const want = this.text[this.pos];
      const ok = k === want;
      this.typed++;
      const kb = this.o.keyboard;
      if (ok) {
        this.correct++;
        this.stat(want, !this.wrongHere);
        this.state[this.pos] = this.wrongHere ? 3 : 1;
        this.wrongHere = false;
        window.XTSound.key(want === ' ');
        if (kb) kb.flash(e.code, true);
        this.pos++;
        this.paint(this.pos - 1); this.paint(this.pos);
      } else {
        this.errors++;
        if (!this.wrongHere) this.stat(want, false);
        window.XTSound.error();
        if (kb) kb.flash(e.code, false);
        if (this.o.stopOnError) {
          this.wrongHere = true;
          this.state[this.pos] = 2; this.paint(this.pos);
          this.spans[this.pos].classList.add('cur');
          this.o.el.classList.remove('shake'); void this.o.el.offsetWidth; this.o.el.classList.add('shake');
        } else {
          this.state[this.pos] = 2;
          this.pos++;
          this.paint(this.pos - 1); this.paint(this.pos);
        }
      }
      if (this.pos >= this.text.length) { this.finish(); return; }
      this.focusNext();
      this.o.onUpdate && this.o.onUpdate(this.stats());
    }

    elapsed() {
      if (!this.start) return 0;
      return ((this.end || performance.now()) - this.start) / 1000;
    }

    stats() {
      const t = Math.max(this.elapsed(), 0.5);
      const goodChars = this.state.filter((s) => s === 1 || s === 3).length;
      const wpm = Math.round((goodChars / 5) / (t / 60));
      const raw = Math.round((this.typed / 5) / (t / 60));
      const acc = this.typed ? Math.max(0, Math.round(((this.typed - this.errors) / this.typed) * 100)) : 100;
      const left = this.o.timeLimit ? Math.max(0, this.o.timeLimit - this.elapsed()) : null;
      return { wpm: this.start ? wpm : 0, raw: this.start ? raw : 0, acc, time: this.elapsed(), left, errors: this.errors, typed: this.typed, chars: goodChars, progress: this.pos / this.text.length, keyStats: this.keyStats };
    }

    tick() {
      if (this.done || !this.start) return;
      if (this.o.timeLimit && this.elapsed() >= this.o.timeLimit) { this.finish(); return; }
      this.o.onUpdate && this.o.onUpdate(this.stats());
    }

    finish() {
      if (this.done) return;
      this.done = true;
      this.end = performance.now();
      this.destroy();
      this.paint(this.pos);
      if (this.o.keyboard) this.o.keyboard.clear();
      if (this.o.hands) window.XTKeyboard.setHands(this.o.hands, null);
      this.o.onDone && this.o.onDone(this.stats());
    }

    destroy() {
      clearInterval(this.timer);
      window.removeEventListener('keydown', this.handler, true);
    }
  }

  window.XTEngine = { Session };
})();

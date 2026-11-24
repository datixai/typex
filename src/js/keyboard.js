/* On-screen keyboard: physical layouts, finger map, highlights and hand guide. */
(function () {
  // [code, label, shiftLabel, width, finger]
  const R0 = [['Backquote', '`', '~', 1, 'lp'], ['Digit1', '1', '!', 1, 'lp'], ['Digit2', '2', '@', 1, 'lr'], ['Digit3', '3', '#', 1, 'lm'], ['Digit4', '4', '$', 1, 'li'], ['Digit5', '5', '%', 1, 'li'], ['Digit6', '6', '^', 1, 'ri'], ['Digit7', '7', '&', 1, 'ri'], ['Digit8', '8', '*', 1, 'rm'], ['Digit9', '9', '(', 1, 'rr'], ['Digit0', '0', ')', 1, 'rp'], ['Minus', '-', '_', 1, 'rp'], ['Equal', '=', '+', 1, 'rp'], ['Backspace', 'Backspace', '', 2, 'rp']];
  const R1 = [['Tab', 'Tab', '', 1.5, 'lp'], ['KeyQ', 'q', 'Q', 1, 'lp'], ['KeyW', 'w', 'W', 1, 'lr'], ['KeyE', 'e', 'E', 1, 'lm'], ['KeyR', 'r', 'R', 1, 'li'], ['KeyT', 't', 'T', 1, 'li'], ['KeyY', 'y', 'Y', 1, 'ri'], ['KeyU', 'u', 'U', 1, 'ri'], ['KeyI', 'i', 'I', 1, 'rm'], ['KeyO', 'o', 'O', 1, 'rr'], ['KeyP', 'p', 'P', 1, 'rp'], ['BracketLeft', '[', '{', 1, 'rp'], ['BracketRight', ']', '}', 1, 'rp'], ['Backslash', '\\', '|', 1.5, 'rp']];
  const R2 = [['CapsLock', 'Caps', '', 1.75, 'lp'], ['KeyA', 'a', 'A', 1, 'lp'], ['KeyS', 's', 'S', 1, 'lr'], ['KeyD', 'd', 'D', 1, 'lm'], ['KeyF', 'f', 'F', 1, 'li'], ['KeyG', 'g', 'G', 1, 'li'], ['KeyH', 'h', 'H', 1, 'ri'], ['KeyJ', 'j', 'J', 1, 'ri'], ['KeyK', 'k', 'K', 1, 'rm'], ['KeyL', 'l', 'L', 1, 'rr'], ['Semicolon', ';', ':', 1, 'rp'], ['Quote', "'", '"', 1, 'rp'], ['Enter', 'Enter', '', 2.25, 'rp']];
  const R3 = (rs) => [['ShiftLeft', 'Shift', '', 2.25, 'lp'], ['KeyZ', 'z', 'Z', 1, 'lp'], ['KeyX', 'x', 'X', 1, 'lr'], ['KeyC', 'c', 'C', 1, 'lm'], ['KeyV', 'v', 'V', 1, 'li'], ['KeyB', 'b', 'B', 1, 'li'], ['KeyN', 'n', 'N', 1, 'ri'], ['KeyM', 'm', 'M', 1, 'ri'], ['Comma', ',', '<', 1, 'rm'], ['Period', '.', '>', 1, 'rr'], ['Slash', '/', '?', 1, 'rp'], ['ShiftRight', 'Shift', '', rs, 'rp']];
  const R4 = [['ControlLeft', 'Ctrl', '', 1.25, 'lp'], ['MetaLeft', 'Win', '', 1.25, 'th'], ['AltLeft', 'Alt', '', 1.25, 'th'], ['Space', '', '', 6.25, 'th'], ['AltRight', 'Alt', '', 1.25, 'th'], ['MetaRight', 'Win', '', 1.25, 'th'], ['ContextMenu', 'Menu', '', 1.25, 'th'], ['ControlRight', 'Ctrl', '', 1.25, 'rp']];
  const R4L = [['ControlLeft', 'Ctrl', '', 1.25, 'lp'], ['Fn', 'Fn', '', 1, 'th'], ['MetaLeft', 'Win', '', 1, 'th'], ['AltLeft', 'Alt', '', 1.25, 'th'], ['Space', '', '', 5.5, 'th'], ['AltRight', 'Alt', '', 1, 'th'], ['ControlRight', 'Ctrl', '', 1, 'rp'], ['ArrowLeft', '←', '', 1, 'ri'], ['ArrowDown', '↓', '', 1, 'rm'], ['ArrowRight', '→', '', 1, 'rr']];

  function rowKeys(row, y, x0 = 0) {
    let x = x0;
    return row.map(([code, label, shift, w, finger]) => { const k = { code, label, shift, x, y, w, h: 1, finger }; x += w; return k; });
  }

  function nav(x0) {
    const k = (code, label, x, y, finger = 'ri') => ({ code, label, shift: '', x: x0 + x, y, w: 1, h: 1, finger });
    return [k('Insert', 'Ins', 0, 0), k('Home', 'Home', 1, 0), k('PageUp', 'PgUp', 2, 0), k('Delete', 'Del', 0, 1), k('End', 'End', 1, 1), k('PageDown', 'PgDn', 2, 1),
      k('ArrowUp', '↑', 1, 3, 'rm'), k('ArrowLeft', '←', 0, 4), k('ArrowDown', '↓', 1, 4, 'rm'), k('ArrowRight', '→', 2, 4, 'rr')];
  }

  function numpad(x0) {
    const k = (code, label, x, y, finger, w = 1, h = 1) => ({ code, label, shift: '', x: x0 + x, y, w, h, finger, np: true });
    return [k('NumLock', 'Num', 0, 0, 'ri'), k('NumpadDivide', '/', 1, 0, 'rm'), k('NumpadMultiply', '*', 2, 0, 'rr'), k('NumpadSubtract', '-', 3, 0, 'rp'),
      k('Numpad7', '7', 0, 1, 'ri'), k('Numpad8', '8', 1, 1, 'rm'), k('Numpad9', '9', 2, 1, 'rr'), k('NumpadAdd', '+', 3, 1, 'rp', 1, 2),
      k('Numpad4', '4', 0, 2, 'ri'), k('Numpad5', '5', 1, 2, 'rm'), k('Numpad6', '6', 2, 2, 'rr'),
      k('Numpad1', '1', 0, 3, 'ri'), k('Numpad2', '2', 1, 3, 'rm'), k('Numpad3', '3', 2, 3, 'rr'), k('NumpadEnter', 'Enter', 3, 3, 'rp', 1, 2),
      k('Numpad0', '0', 0, 4, 'ri', 2), k('NumpadDecimal', '.', 2, 4, 'rr')];
  }

  function mainBlock(laptop) {
    const keys = [...rowKeys(R0, 0), ...rowKeys(R1, 1), ...rowKeys(R2, 2)];
    if (laptop) {
      const r3 = R3(1).map((k) => k.slice()); r3[0][3] = 2;
      keys.push(...rowKeys(r3, 3), { code: 'ArrowUp', label: '↑', shift: '', x: 13, y: 3, w: 1, h: 1, finger: 'rm' }, { code: 'Delete', label: 'Del', shift: '', x: 14, y: 3, w: 1, h: 1, finger: 'rp' });
      keys.push(...rowKeys(R4L, 4));
    } else {
      keys.push(...rowKeys(R3(2.75), 3), ...rowKeys(R4, 4));
    }
    return keys;
  }

  const LAYOUTS = {
    full: { name: 'Full-size (with number pad)', desc: 'Desktop keyboard: main keys, arrows block and a number pad on the right.', build: () => [...mainBlock(false), ...nav(15.5), ...numpad(19)], width: 23, numpad: true },
    tkl: { name: 'Tenkeyless', desc: 'Desktop keyboard without the number pad.', build: () => [...mainBlock(false), ...nav(15.5)], width: 18.5, numpad: false },
    laptop: { name: 'Laptop (compact)', desc: 'Small laptop keyboard with arrow keys in the bottom row.', build: () => mainBlock(true), width: 15, numpad: false },
    laptopnum: { name: 'Laptop with number pad', desc: 'Large 15 to 17 inch laptops with a slim number pad.', build: () => [...mainBlock(true), ...numpad(15.3)], width: 19.3, numpad: true },
  };

  // Character -> { code, shift }
  const CHAR = {};
  [R0, R1, R2, R3(2.75)].forEach((row) => row.forEach(([code, label, shift]) => {
    if (label.length === 1) CHAR[label] = { code, shift: false };
    if (shift && shift.length === 1) CHAR[shift] = { code, shift: true };
  }));
  CHAR[' '] = { code: 'Space', shift: false };
  const NP = { '0': 'Numpad0', '1': 'Numpad1', '2': 'Numpad2', '3': 'Numpad3', '4': 'Numpad4', '5': 'Numpad5', '6': 'Numpad6', '7': 'Numpad7', '8': 'Numpad8', '9': 'Numpad9', '.': 'NumpadDecimal', '+': 'NumpadAdd', '-': 'NumpadSubtract', '*': 'NumpadMultiply', '/': 'NumpadDivide' };

  const FINGER_NAME = { lp: 'left pinky', lr: 'left ring', lm: 'left middle', li: 'left index', th: 'thumb', ri: 'right index', rm: 'right middle', rr: 'right ring', rp: 'right pinky' };

  class Keyboard {
    constructor(el, layout = 'full', fit = 0) {
      this.el = el;
      this.fitMax = fit;
      this.setLayout(layout);
      if (fit && window.ResizeObserver) {
        this.ro = new ResizeObserver(() => this.fit());
        this.ro.observe(el.parentElement);
      }
    }

    // Scale keys to the space available (fit = largest key size in px).
    fit() {
      const p = this.el.parentElement;
      if (!p || !p.clientWidth) return;
      const kw = LAYOUTS[this.layoutId].width;
      const byH = p.clientHeight > 60 ? (p.clientHeight - 8) / 5.15 : 999;
      const u = Math.max(18, Math.min(this.fitMax, (p.clientWidth - 8) / kw, byH));
      this.el.style.setProperty('--u', u.toFixed(1) + 'px');
      this.el.style.setProperty('--gap', Math.max(2, Math.round(u / 9)) + 'px');
    }

    setLayout(layout) {
      this.layoutId = LAYOUTS[layout] ? layout : 'full';
      const L = LAYOUTS[this.layoutId];
      this.keys = L.build();
      this.byCode = {};
      this.el.innerHTML = '';
      this.el.className = 'kb kb-' + this.layoutId;
      this.el.style.setProperty('--kw', L.width);
      for (const k of this.keys) {
        const d = document.createElement('div');
        d.className = 'key f-' + k.finger + (k.label.length > 1 ? ' key-wide' : '') + (k.code === 'KeyF' || k.code === 'KeyJ' || k.code === 'Numpad5' ? ' key-bump' : '');
        d.style.left = `calc(${k.x} * var(--u))`;
        d.style.top = `calc(${k.y} * var(--u))`;
        d.style.width = `calc(${k.w} * var(--u) - var(--gap))`;
        d.style.height = `calc(${k.h} * var(--u) - var(--gap))`;
        d.innerHTML = k.shift && k.shift.toLowerCase() !== k.label ? `<small>${esc(k.shift)}</small><span>${esc(k.label)}</span>` : `<span>${esc(k.label.length === 1 ? k.label.toUpperCase() : k.label)}</span>`;
        d.dataset.code = k.code;
        this.el.appendChild(d);
        if (!this.byCode[k.code]) this.byCode[k.code] = [];
        this.byCode[k.code].push(d);
        k.node = d;
      }
      if (this.fitMax) this.fit();
    }

    hasNumpad() { return LAYOUTS[this.layoutId].numpad; }

    clear() { this.el.querySelectorAll('.next,.next-shift').forEach((n) => n.classList.remove('next', 'next-shift')); }

    // Returns finger info for the hand guide.
    highlight(ch, preferNumpad) {
      this.clear();
      if (ch == null) return null;
      let code; let shift = false;
      if (preferNumpad && NP[ch] && this.hasNumpad()) code = NP[ch];
      else if (CHAR[ch]) ({ code, shift } = CHAR[ch]);
      if (!code) return null;
      const nodes = this.byCode[code] || [];
      const key = this.keys.find((k) => k.code === code);
      nodes.forEach((n) => n.classList.add('next'));
      let shiftFinger = null;
      if (shift && key) {
        const left = key.finger[0] === 'l';
        const sc = left ? 'ShiftRight' : 'ShiftLeft';
        (this.byCode[sc] || []).forEach((n) => n.classList.add('next-shift'));
        shiftFinger = left ? 'rp' : 'lp';
      }
      return key ? { finger: key.finger, shiftFinger, name: FINGER_NAME[key.finger] } : null;
    }

    flash(code, ok) {
      const nodes = this.byCode[code] || [];
      nodes.forEach((n) => { n.classList.remove('hit', 'miss'); void n.offsetWidth; n.classList.add(ok ? 'hit' : 'miss'); });
    }

    // Heatmap: stats = { char: {h, m} }
    heat(stats) {
      const per = {};
      for (const [ch, s] of Object.entries(stats || {})) {
        const m = CHAR[ch.toLowerCase()] || CHAR[ch];
        if (!m) continue;
        const p = per[m.code] || (per[m.code] = { h: 0, m: 0 });
        p.h += s.h || 0; p.m += s.m || 0;
      }
      for (const k of this.keys) {
        const p = per[k.code];
        k.node.classList.add('heat');
        if (!p || p.h + p.m === 0) { k.node.style.setProperty('--heat', 'transparent'); k.node.title = 'No data yet'; continue; }
        const rate = p.m / (p.h + p.m);
        const hue = Math.max(0, 140 - rate * 700);
        k.node.style.setProperty('--heat', `hsla(${hue}, 80%, 55%, 0.85)`);
        k.node.title = `${Math.round((1 - rate) * 100)}% accurate (${p.h + p.m} presses)`;
      }
    }
  }

  function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  // Simple two-hand guide; fingers light up.
  function handsSVG() {
    const f = (id, x, y, h, rot) => `<rect class="fg fg-${id}" x="${x}" y="${y}" width="22" height="${h}" rx="11" transform="rotate(${rot} ${x + 11} ${y + h})"/>`;
    const hand = (ox, mirror) => {
      const ids = mirror ? ['rp', 'rr', 'rm', 'ri'] : ['lp', 'lr', 'lm', 'li'];
      const xs = [0, 27, 54, 81];
      const hs = [46, 60, 68, 60];
      const ys = [34, 20, 12, 20];
      let s = `<g transform="translate(${ox},0)${mirror ? ' scale(-1,1) translate(-150,0)' : ''}">`;
      s += `<rect class="palm" x="2" y="70" width="104" height="70" rx="30"/>`;
      ids.forEach((id, i) => { s += f(mirror ? ids[i] : id, xs[i] + 4, ys[i] + 20, hs[i], 0); });
      s += `<rect class="fg fg-th" x="104" y="96" width="22" height="46" rx="11" transform="rotate(-50 115 140)"/>`;
      return s + '</g>';
    };
    return `<svg viewBox="0 0 330 160" class="hands">${hand(0, false)}${hand(180, true)}</svg>`;
  }

  function setHands(el, info) {
    if (!el) return;
    el.querySelectorAll('.fg').forEach((n) => n.classList.remove('on', 'on-shift'));
    if (!info) return;
    el.querySelectorAll('.fg-' + info.finger).forEach((n) => n.classList.add('on'));
    if (info.shiftFinger) el.querySelectorAll('.fg-' + info.shiftFinger).forEach((n) => n.classList.add('on-shift'));
  }

  window.XTKeyboard = { Keyboard, LAYOUTS, handsSVG, setHands, FINGER_NAME };
})();

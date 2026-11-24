/* Synthesised sounds (no audio files): key ticks, error tone, success chime. */
(function () {
  let ctx = null;
  let noise = null;
  const S = { theme: 'mechanical', volume: 0.6, errors: true };

  function ac() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      const len = ctx.sampleRate * 0.25;
      noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function burst({ freq = 3000, q = 1.2, dur = 0.03, gain = 0.5, type = 'bandpass', t0 = 0 }) {
    const c = ac();
    const t = c.currentTime + t0;
    const src = c.createBufferSource(); src.buffer = noise;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(gain * S.volume, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(c.destination);
    src.start(t, Math.random() * 0.1, dur + 0.02);
  }

  function tone({ freq = 440, dur = 0.08, gain = 0.2, type = 'sine', t0 = 0, slide = 0 }) {
    const c = ac();
    const t = c.currentTime + t0;
    const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain * S.volume, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }

  const vary = () => 0.9 + Math.random() * 0.2;

  function key(isSpace) {
    if (S.theme === 'off' || S.volume <= 0) return;
    try {
      switch (S.theme) {
        case 'soft':
          tone({ freq: (isSpace ? 420 : 720) * vary(), dur: 0.05, gain: 0.12, type: 'triangle' });
          break;
        case 'typewriter':
          burst({ freq: 2200 * vary(), q: 3, dur: 0.045, gain: 0.9 });
          burst({ freq: 180, q: 1, dur: 0.06, gain: 0.5, type: 'lowpass' });
          if (isSpace) tone({ freq: 140, dur: 0.07, gain: 0.25, type: 'square' });
          break;
        case 'bubble':
          tone({ freq: 500 * vary(), dur: 0.07, gain: 0.18, type: 'sine', slide: 1.8 });
          break;
        default: // mechanical tick tick
          burst({ freq: (isSpace ? 1600 : 3600) * vary(), q: 1.4, dur: isSpace ? 0.05 : 0.028, gain: 0.85 });
          burst({ freq: 300, q: 0.7, dur: 0.035, gain: 0.35, type: 'lowpass', t0: 0.004 });
      }
    } catch { /* audio not ready */ }
  }

  function error() {
    if (S.theme === 'off' || !S.errors || S.volume <= 0) return;
    try { tone({ freq: 170, dur: 0.11, gain: 0.16, type: 'square', slide: 0.7 }); } catch { /* ignore */ }
  }

  function success(level = 1) {
    if (S.theme === 'off' || S.volume <= 0) return;
    try {
      const notes = level >= 3 ? [523, 659, 784, 1047] : level === 2 ? [523, 659, 784] : [523, 659];
      notes.forEach((n, i) => tone({ freq: n, dur: 0.22, gain: 0.16, type: 'triangle', t0: i * 0.09 }));
    } catch { /* ignore */ }
  }

  function pop() {
    if (S.theme === 'off' || S.volume <= 0) return;
    try { tone({ freq: 880, dur: 0.09, gain: 0.2, type: 'sine', slide: 0.4 }); burst({ freq: 1500, dur: 0.04, gain: 0.4 }); } catch { /* ignore */ }
  }

  window.XTSound = { settings: S, key, error, success, pop };
})();

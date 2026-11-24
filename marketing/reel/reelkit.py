"""Shared helpers for the two train reels (easing, fonts, track + train drawing, synth sound, encoder).

The look of each reel lives in its own script (reel1_esp32.py, reel2_vision.py); this file only holds
the plumbing they share so the two videos stay consistent in quality while looking different.
"""
import functools
import math
import os
import subprocess
import sys
import wave

import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "assets")
FFMPEG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "bin", "ffmpeg.exe")

W, H, FPS = 1080, 1920, 30
TEXT = (236, 236, 232)
MUTED = (148, 160, 178)


@functools.lru_cache(maxsize=64)
def font(weight, size):
    name = {"regular": "400Regular", "medium": "500Medium", "semibold": "600SemiBold", "bold": "700Bold",
            "extrabold": "800ExtraBold"}[weight]
    return ImageFont.truetype(os.path.join(ASSETS, "fonts", f"Inter_{name}.ttf"), size)


# ---------------------------------------------------------------- easing
def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def ease(x):
    x = clamp(x)
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


def ease_out(x):
    x = clamp(x)
    return 1 - (1 - x) ** 3


def ramp(t, a, b):
    return clamp((t - a) / (b - a)) if b > a else float(t >= a)


def mix(c1, c2, p):
    return tuple(round(a + (b - a) * p) for a, b in zip(c1, c2))


def A(col, a):
    return tuple(col[:3]) + (round(255 * clamp(a)),)


def build_timeline(intro_end, scenes):
    tl, t = [], intro_end
    for key, d, h1, h2 in scenes:
        tl.append(dict(key=key, start=t, end=t + d, dur=d, h1=h1, h2=h2))
        t += d
    return tl, t


def scene_at(timeline, t):
    for i, s in enumerate(timeline):
        if s["start"] <= t < s["end"]:
            return i, s
    return None, None


# ---------------------------------------------------------------- text
def chip(d, xy, text, fnt, fg, bg, border=None, alpha=1.0, pad=(22, 12), anchor_center=False):
    tw = d.textlength(text, font=fnt)
    x, y = xy
    if anchor_center:
        x -= (tw + 2 * pad[0]) / 2
    h = fnt.size + 2 * pad[1]
    d.rounded_rectangle([x, y, x + tw + 2 * pad[0], y + h], h / 2, fill=A(bg, alpha),
                        outline=A(border, alpha) if border else None, width=2)
    d.text((x + pad[0], y + h / 2), text, font=fnt, fill=A(fg, alpha), anchor="lm")
    return x + tw + 2 * pad[0]


def rich_text(draw, xy_center, text, fnt, colors, base=TEXT, alpha=255):
    """Centered text; segments wrapped in *...* or ^...^ use colors['*'] / colors['^']."""
    parts, cur, mode = [], "", None
    for ch in text:
        if ch in "*^":
            if cur:
                parts.append((cur, mode))
            cur = ""
            mode = None if mode == ch else ch
        else:
            cur += ch
    if cur:
        parts.append((cur, mode))
    total = sum(draw.textlength(p, font=fnt) for p, _ in parts)
    x = xy_center[0] - total / 2
    for p, m in parts:
        col = colors.get(m, base) if m else base
        draw.text((x, xy_center[1]), p, font=fnt, fill=tuple(col[:3]) + (alpha,), anchor="ls")
        x += draw.textlength(p, font=fnt)


@functools.lru_cache(maxsize=1)
def datix_tile():
    dx = Image.open(os.path.join(ASSETS, "datix-logo.png")).convert("RGB").resize((120, 120), Image.LANCZOS)
    m = Image.new("L", (120, 120), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, 119, 119], 28, fill=255)
    tile = Image.new("RGBA", (120, 120), (0, 0, 0, 0))
    tile.paste(dx, (0, 0), m)
    return tile


def datix_credit(layer, d, y0, c, accent, line_col):
    """'Developed by Datix AI' block, alpha c, starting at y0."""
    if c <= 0:
        return
    d.line([(W / 2 - 200, y0), (W / 2 + 200, y0)], fill=A(line_col, c), width=2)
    d.text((W / 2, y0 + 62), "DEVELOPED BY", font=font("semibold", 26), fill=A(MUTED, c), anchor="ms")
    fb = font("extrabold", 64)
    tw = d.textlength("Datix AI", font=fb)
    gx = round(W / 2 - (120 + 28 + tw) / 2)
    tile = datix_tile().copy()
    tile.putalpha(tile.getchannel("A").point(lambda v_: round(v_ * c)))
    layer.alpha_composite(tile, (gx, round(y0 + 95)))
    d.text((gx + 148, y0 + 178), "Datix AI", font=fb, fill=A(TEXT, c), anchor="ls")
    d.text((W / 2, y0 + 270), "datixai.com", font=font("semibold", 32), fill=A(accent, c), anchor="ms")


@functools.lru_cache(maxsize=1)
def vignette():
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    v = ((xx - W / 2) / (W * 0.75)) ** 2 + ((yy - H / 2) / (H * 0.7)) ** 2
    return Image.fromarray(np.clip(v * 150, 0, 150).astype(np.uint8))


# ---------------------------------------------------------------- track geometry
def bezier(p0, p1, p2, p3, n=120):
    out = []
    for k in range(n):
        u = k / n
        a, b, c, e = (1 - u) ** 3, 3 * u * (1 - u) ** 2, 3 * u * u * (1 - u), u ** 3
        out.append((a * p0[0] + b * p1[0] + c * p2[0] + e * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + e * p3[1]))
    return out


def line_pts(p0, p1, step=6):
    n = max(2, int(math.hypot(p1[0] - p0[0], p1[1] - p0[1]) / step))
    return [(p0[0] + (p1[0] - p0[0]) * k / n, p0[1] + (p1[1] - p0[1]) * k / n) for k in range(n)]


def arc_pts(cx, cy, r, a0, a1, n=120):
    return [(cx + math.cos(a0 + (a1 - a0) * k / n) * r, cy + math.sin(a0 + (a1 - a0) * k / n) * r) for k in range(n)]


def stadium(cx, cy, half_straight, r):
    """Closed oval, travelling right->left along the bottom straight (counter-clockwise on screen)."""
    pts = line_pts((cx + half_straight, cy + r), (cx - half_straight, cy + r))
    pts += arc_pts(cx - half_straight, cy, r, math.pi / 2, 3 * math.pi / 2)
    pts += line_pts((cx - half_straight, cy - r), (cx + half_straight, cy - r))
    pts += arc_pts(cx + half_straight, cy, r, -math.pi / 2, math.pi / 2)
    return pts


class Path:
    def __init__(self, pts, closed=True):
        self.pts = np.array(pts, np.float64)
        self.closed = closed
        p = self.pts
        if closed:
            p = np.vstack([p, p[:1]])
        seg = np.hypot(np.diff(p[:, 0]), np.diff(p[:, 1]))
        self.cum = np.concatenate([[0], np.cumsum(seg)])
        self.length = float(self.cum[-1])
        self._p = p

    def pos(self, s):
        if self.closed:
            s = s % self.length
        else:
            s = clamp(s, 0, self.length)
        i = int(np.searchsorted(self.cum, s, side="right") - 1)
        i = min(max(i, 0), len(self._p) - 2)
        f = (s - self.cum[i]) / max(1e-9, self.cum[i + 1] - self.cum[i])
        a, b = self._p[i], self._p[i + 1]
        return (a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f)

    def angle(self, s, ds=4.0):
        x0, y0 = self.pos(s - ds)
        x1, y1 = self.pos(s + ds)
        return math.atan2(y1 - y0, x1 - x0)

    def nearest_s(self, x, y):
        d = (self._p[:, 0] - x) ** 2 + (self._p[:, 1] - y) ** 2
        return float(self.cum[int(np.argmin(d))])

    def polyline(self, s0, s1, step=6):
        n = max(2, int(abs(s1 - s0) / step))
        return [self.pos(s0 + (s1 - s0) * k / n) for k in range(n + 1)]


@functools.lru_cache(maxsize=16)
def _track_geom(path_id, gauge, tie_step):
    path = _PATHS[path_id]
    rails_l, rails_r, ties = [], [], []
    s = 0.0
    while s <= path.length - (0 if not path.closed else 1):
        x, y = path.pos(s)
        a = path.angle(s)
        nx, ny = -math.sin(a), math.cos(a)
        rails_l.append((x + nx * gauge, y + ny * gauge))
        rails_r.append((x - nx * gauge, y - ny * gauge))
        s += 4.0
    if path.closed:
        rails_l.append(rails_l[0])
        rails_r.append(rails_r[0])
    s = 0.0
    while s < path.length:
        x, y = path.pos(s)
        a = path.angle(s)
        nx, ny = -math.sin(a), math.cos(a)
        g = gauge * 1.75
        ties.append(((x + nx * g, y + ny * g), (x - nx * g, y - ny * g)))
        s += tie_step
    return rails_l, rails_r, ties


_PATHS = {}


def register(path):
    _PATHS[id(path)] = path
    return path


def draw_track(d, path, rail=(170, 176, 190), tie=(70, 60, 52), gauge=7, alpha=1.0, glow=None, bed=None):
    rl, rr, ties = _track_geom(id(path), gauge, 16)
    if bed:
        pl = [path.pos(s) for s in np.arange(0, path.length + 1, 6)]
        d.line(pl, fill=A(bed, alpha), width=int(gauge * 5.2), joint="curve")
    if glow:
        pl = [path.pos(s) for s in np.arange(0, path.length + 1, 6)]
        d.line(pl, fill=A(glow, 0.22 * alpha), width=int(gauge * 7), joint="curve")
    for a, b in ties:
        d.line([a, b], fill=A(tie, alpha), width=5)
    d.line(rl, fill=A(rail, alpha), width=3)
    d.line(rr, fill=A(rail, alpha), width=3)


def _rot_rect(cx, cy, L, Wd, ang):
    c, s = math.cos(ang), math.sin(ang)
    out = []
    for lx, ly in ((L / 2, Wd / 2), (L / 2, -Wd / 2), (-L / 2, -Wd / 2), (-L / 2, Wd / 2)):
        out.append((cx + lx * c - ly * s, cy + lx * s + ly * c))
    return out


def draw_train(d, path, s_head, body, n_cars=2, scale=1.0, alpha=1.0, dark=(26, 30, 40), lights=True):
    """Top-down locomotive + cars following the path. s_head = arc-length of the front of the loco."""
    loco_L, car_L, gap, wd = 74 * scale, 58 * scale, 7 * scale, 28 * scale
    s = s_head
    parts = [("loco", loco_L)] + [("car", car_L)] * n_cars
    for kind, L in parts:
        f = path.pos(s)
        r = path.pos(s - L)
        cx, cy = (f[0] + r[0]) / 2, (f[1] + r[1]) / 2
        ang = math.atan2(f[1] - r[1], f[0] - r[0])
        if kind == "loco":
            d.polygon(_rot_rect(cx, cy, L + 4, wd + 6, ang), fill=A((0, 0, 0), 0.35 * alpha))
            d.polygon(_rot_rect(cx, cy, L, wd, ang), fill=A(body, alpha), outline=A(mix(body, (255, 255, 255), 0.35), alpha))
            # cab at the rear third, boiler stripe, headlight
            c, s_ = math.cos(ang), math.sin(ang)
            kx, ky = cx - c * L * 0.28, cy - s_ * L * 0.28
            d.polygon(_rot_rect(kx, ky, L * 0.3, wd * 0.82, ang), fill=A(mix(body, dark, 0.55), alpha))
            d.line([(cx - c * L * 0.1, cy - s_ * L * 0.1), (cx + c * L * 0.42, cy + s_ * L * 0.42)],
                   fill=A(mix(body, (255, 255, 255), 0.5), alpha), width=max(2, int(3 * scale)))
            if lights:
                hx, hy = cx + c * L / 2, cy + s_ * L / 2
                for rr, aa in ((16 * scale, 0.16), (8 * scale, 0.35)):
                    d.ellipse([hx - rr, hy - rr, hx + rr, hy + rr], fill=A((255, 240, 190), aa * alpha))
                d.ellipse([hx - 4, hy - 4, hx + 4, hy + 4], fill=A((255, 248, 220), alpha))
        else:
            d.polygon(_rot_rect(cx, cy, L, wd * 0.92, ang), fill=A(mix(body, dark, 0.25), alpha),
                      outline=A(mix(body, (255, 255, 255), 0.25), alpha))
            c, s_ = math.cos(ang), math.sin(ang)
            d.line([(cx - c * L * 0.38, cy - s_ * L * 0.38), (cx + c * L * 0.38, cy + s_ * L * 0.38)],
                   fill=A(mix(body, dark, 0.55), alpha), width=max(2, int(4 * scale)))
        s -= L + gap
    return s_head - s  # total train length


def integrate(v_fn, u_end, dt=1 / 600):
    """Cumulative distance table for a speed profile v_fn(u) on [0, u_end]."""
    us = np.arange(0, u_end + dt, dt)
    vs = np.array([v_fn(u) for u in us])
    dist = np.concatenate([[0], np.cumsum((vs[1:] + vs[:-1]) / 2 * dt)])
    return us, dist


def lookup(us, dist, u):
    return float(np.interp(u, us, dist))


# ---------------------------------------------------------------- audio
SR = 48000


class Mixer:
    def __init__(self, dur, seed=7):
        self.dur = dur
        self.n = int(dur * SR)
        self.t = np.arange(self.n) / SR
        self.out = np.zeros((self.n, 2), np.float32)
        self.rng = np.random.default_rng(seed)

    def add(self, sig, start, gain=1.0, pan=0.0):
        i = int(start * SR)
        if i >= self.n or i < 0:
            return
        sig = np.asarray(sig, np.float32)[: self.n - i] * gain
        self.out[i:i + len(sig), 0] += sig * (1 - max(0, pan))
        self.out[i:i + len(sig), 1] += sig * (1 + min(0, pan))

    @staticmethod
    def smooth(x, k):
        return np.convolve(x, np.ones(k) / k, mode="same")

    @staticmethod
    def tone(f, d, decay=6):
        tt = np.arange(int(d * SR)) / SR
        return np.sin(2 * math.pi * f * tt) * np.exp(-tt * decay) + 0.3 * np.sin(2 * math.pi * 2 * f * tt) * np.exp(-tt * decay * 1.5)

    def noise(self, d):
        return self.rng.normal(0, 1, int(d * SR)).astype(np.float32)

    def clack(self, bright=1.0):
        """One wheel-on-rail-joint hit: short filtered noise + low knock."""
        tt = np.arange(int(0.09 * SR)) / SR
        nz = self.rng.normal(0, 1, len(tt))
        nz = nz - self.smooth(nz, 3 + int(6 / bright))
        knock = np.sin(2 * math.pi * 150 * tt) * np.exp(-tt * 55)
        return (nz * np.exp(-tt * 90) * 0.5 + knock * 0.8)

    def horn(self, d=1.4, base=1.0):
        """Two-note air horn chord built from band-limited saw waves."""
        tt = np.arange(int(d * SR)) / SR
        env = np.clip(tt / 0.08, 0, 1) * np.clip((d - tt) / 0.25, 0, 1)
        sig = np.zeros_like(tt)
        for f in (277.2 * base, 349.2 * base, 415.3 * base):
            vib = 1 + 0.004 * np.sin(2 * math.pi * 5.5 * tt)
            ph = 2 * math.pi * f * np.cumsum(vib) / SR
            sig += sum(np.sin(k * ph) / k for k in range(1, 9))
        return sig * env * 0.18

    def bell(self, f=1318.5):
        tt = np.arange(int(1.2 * SR)) / SR
        return (np.sin(2 * math.pi * f * tt) + 0.5 * np.sin(2 * math.pi * f * 2.76 * tt) + 0.25 * np.sin(2 * math.pi * f * 5.4 * tt)) * np.exp(-tt * 4)

    def click(self, f=1800):
        ct = np.arange(int(0.05 * SR)) / SR
        return np.sin(2 * math.pi * f * ct) * np.exp(-ct * 160)

    def relay(self):
        tt = np.arange(int(0.08 * SR)) / SR
        nz = self.rng.normal(0, 1, len(tt)) * np.exp(-tt * 200)
        thunk = np.sin(2 * math.pi * 90 * tt) * np.exp(-tt * 60)
        return nz * 0.6 + thunk * 0.7

    def riser(self, dd):
        rt = np.arange(int(dd * SR)) / SR
        x = self.rng.normal(0, 1, len(rt)) * (rt / dd) ** 2
        tn = np.sin(2 * math.pi * (180 + 820 * (rt / dd) ** 2) * rt) * (rt / dd) ** 3 * 0.4
        return (x * 0.25 + tn) * 0.5

    def boom(self):
        it = np.arange(int(1.6 * SR)) / SR
        return np.sin(2 * math.pi * (36 + 60 * np.exp(-it * 12)) * it) * np.exp(-it * 2.6) + self.rng.normal(0, 1, len(it)) * np.exp(-it * 18) * 0.3

    def pad(self, freqs, gain=0.10, wobble=9.0):
        t = self.t
        env = np.clip(t / 2.5, 0, 1) * (1 - np.clip((t - (self.dur - 2.5)) / 2.5, 0, 1))
        p = np.zeros(self.n, np.float32)
        for f, g in freqs:
            for det in (-0.5, 0.5):
                p += g * np.sin(2 * math.pi * (f + det) * t + self.rng.uniform(0, 6))
        p *= env * (0.75 + 0.25 * np.sin(2 * math.pi * t / wobble))
        self.out += p[:, None] * gain

    def write(self, path):
        out = self.out
        out *= 0.8 / max(1e-6, np.abs(out).max())
        out = np.tanh(out * 1.4) / np.tanh(1.4)
        fade = np.minimum(np.clip(self.t / 0.3, 0, 1), np.clip((self.dur - self.t) / 0.6, 0, 1))[:, None]
        out *= fade
        pcm = (out * 32767 * 0.9).astype(np.int16)
        with wave.open(path, "wb") as w:
            w.setnchannels(2)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes(pcm.tobytes())


# ---------------------------------------------------------------- encode / preview
def run(name, render, synth_audio, dur, default_preview):
    os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
    os.makedirs(os.path.join(HERE, "work"), exist_ok=True)
    if "--preview" in sys.argv:
        pdir = os.path.join(HERE, "work", "preview_" + name)
        os.makedirs(pdir, exist_ok=True)
        idx = sys.argv.index("--preview")
        ts = [float(x) for x in sys.argv[idx + 1:]] or default_preview
        for x in ts:
            render(x).save(os.path.join(pdir, f"t{x:05.1f}.jpg"), quality=88)
        print("preview frames ->", pdir)
        return
    wav = os.path.join(HERE, "work", name + ".wav")
    synth_audio(wav)
    mp4 = os.path.join(HERE, "out", name + ".mp4")
    cmd = [FFMPEG, "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
           "-i", wav, "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-profile:v", "high",
           "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", mp4]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
    total = int(dur * FPS)
    for i in range(total):
        proc.stdin.write(render(i / FPS).tobytes())
        if i % 90 == 0:
            print(f"frame {i}/{total}", flush=True)
    proc.stdin.close()
    proc.wait()
    print("wrote", mp4)

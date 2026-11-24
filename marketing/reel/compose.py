"""TypeX promo reel (1080x1920, 45 s). Theme: glowing keycaps, a laptop showing the real app,
tick-tick key sounds and a speed gauge. Screens come from capture.js (demo profiles only).

  python compose.py --preview 2 6 14 23 31 42     -> work/preview/*.jpg
  python compose.py                               -> typex-reel.mp4 (rendered once, straight to the final file)
"""
import glob
import math
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from reelkit import (A, H, MUTED, TEXT, W, FPS, Mixer, SR, build_timeline, clamp, datix_credit, ease, ease_out, font,
                     ramp, rich_text, scene_at, vignette, mix)

HERE = os.path.dirname(os.path.abspath(__file__))
FFMPEG = r"C:\Claud AI\reel-kit\bin\ffmpeg.exe"
CAP = os.path.join(HERE, "work", "cap")
OUT = os.path.join(HERE, "typex-reel.mp4")
DUR = 45.0

BG0, BG1 = (9, 12, 32), (20, 22, 64)
VIOLET, VIOLET2, MINT, GOLD, ROSE = (129, 140, 248), (99, 102, 241), (52, 211, 153), (251, 191, 36), (251, 113, 133)
CAPCOL = {"*": (165, 180, 252), "^": MINT}

INTRO = 3.5
SCENES = [
    ("peck", 4.0, "Still typing with *two fingers*?", "Slow typing costs you hours every week"),
    ("meet", 4.5, "Meet *TypeX*", "A free typing tutor for Windows 10 and 11"),
    ("lesson", 5.5, "Learn *every key*", "Glowing keys and a finger guide show the way"),
    ("pro", 4.0, "From Beginner to ^Pro^", "Pro mode: no hints, no Backspace, higher targets"),
    ("stars", 3.5, "Earn *3 stars*", "Speed, accuracy and XP after every lesson"),
    ("test", 4.5, "Test your ^speed^", "30 second to 5 minute typing tests"),
    ("games", 4.5, "Play to *practise*", "Meteor Words, Balloon Pop and Speed Sprint"),
    ("progress", 4.0, "Watch yourself ^improve^", "Charts, key heatmap, streaks, 19 achievements"),
    ("layouts", 3.5, "Fits *your keyboard*", "Desktop, laptop and number pad layouts"),
]
TL, OUTRO_START = build_timeline(INTRO, SCENES)


# ------------------------------------------------------------------ assets
def cap(name):
    return Image.open(os.path.join(CAP, name + ".png")).convert("RGB")


SHOTS = {n: cap(n) for n in ["login", "dashboard", "lessons_pro", "pro_play", "result", "progress", "progress_heat",
                             "achievements", "settings", "test_setup"]}
TYPE = [Image.open(p).convert("RGB") for p in sorted(glob.glob(os.path.join(CAP, "type_*.png")))]
TEST = [Image.open(p).convert("RGB") for p in sorted(glob.glob(os.path.join(CAP, "test_??.png")))]
ICON = Image.open(os.path.join(HERE, "..", "..", "src", "assets", "icon.png")).convert("RGBA")
SW, SH = 1304, 801  # capture size

# background: gradient + soft keycap outlines, taller than the frame so it can drift
BGH = H + 600
_bg = Image.new("RGB", (W, BGH))
_g = np.linspace(0, 1, BGH)[:, None]
_arr = (np.array(BG0)[None, None, :] * (1 - _g[..., None]) + np.array(BG1)[None, None, :] * _g[..., None])
_bg = Image.fromarray(np.repeat(_arr, W, axis=1).astype(np.uint8))
_d = ImageDraw.Draw(_bg)
rng = np.random.default_rng(3)
for _ in range(70):
    x, y, s = rng.uniform(-40, W), rng.uniform(0, BGH), rng.uniform(60, 130)
    _d.rounded_rectangle([x, y, x + s, y + s], s * 0.2, outline=(36, 42, 96), width=2)
_bg = _bg.filter(ImageFilter.GaussianBlur(1.2))
VIG = vignette()


def background(t, pulse=None):
    off = int((t * 14) % 600)
    img = _bg.crop((0, off, W, off + H)).copy()
    # soft glow behind the content
    glow = Image.new("RGB", (W, H), (0, 0, 0))
    gd = ImageDraw.Draw(glow)
    c = pulse or VIOLET2
    gd.ellipse([W / 2 - 520, 760 - 420, W / 2 + 520, 760 + 420], fill=tuple(int(v * 0.35) for v in c))
    glow = glow.filter(ImageFilter.GaussianBlur(160))
    img = Image.fromarray(np.clip(np.asarray(img, np.int16) + np.asarray(glow, np.int16), 0, 255).astype(np.uint8))
    dark = Image.new("RGB", (W, H), (0, 0, 0))
    return Image.composite(dark, img, VIG)


# ------------------------------------------------------------------ laptop mockup
LX, LY, LWID = 60, 720, 960
LHEI = round(LWID * SH / SW)


def view(img, focus, z):
    """Crop img around focus (cx, cy in 0..1) at zoom z (1 = whole screen)."""
    cw, ch = SW / z, SH / z
    cx, cy = focus[0] * SW, focus[1] * SH
    x0 = clamp(cx - cw / 2, 0, SW - cw)
    y0 = clamp(cy - ch / 2, 0, SH - ch)
    return img.crop((round(x0), round(y0), round(x0 + cw), round(y0 + ch))).resize((LWID, LHEI), Image.BILINEAR)


def laptop(frame, screen, alpha=1.0, dy=0):
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    y = LY + dy
    d.rounded_rectangle([LX - 26, y - 26, LX + LWID + 26, y + LHEI + 30], 34, fill=(24, 26, 44, 255), outline=(70, 76, 130, 255), width=3)
    d.ellipse([W / 2 - 5, y - 17, W / 2 + 5, y - 7], fill=(60, 64, 100, 255))
    base_y = y + LHEI + 30
    d.polygon([(LX - 70, base_y), (LX + LWID + 70, base_y), (LX + LWID + 110, base_y + 34), (LX - 110, base_y + 34)], fill=(46, 50, 84, 255))
    d.rounded_rectangle([W / 2 - 90, base_y, W / 2 + 90, base_y + 10], 5, fill=(30, 32, 56, 255))
    lay.paste(screen, (LX, y))
    if alpha < 1:
        lay.putalpha(lay.getchannel("A").point(lambda v: round(v * alpha)))
    frame.alpha_composite(lay)


# ------------------------------------------------------------------ captions
def caption(frame, s, t):
    p_in = ease_out(ramp(t, s["start"], s["start"] + 0.5))
    p_out = 1 - ramp(t, s["end"] - 0.3, s["end"])
    a = clamp(min(p_in, p_out))
    if a <= 0:
        return
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    y = 330 + (1 - p_in) * 40
    rich_text(d, (W / 2, y), s["h1"], font("extrabold", 74), CAPCOL, alpha=round(255 * a))
    d.text((W / 2, y + 70), s["h2"], font=font("medium", 36), fill=A(MUTED, a), anchor="ms")
    lw = 140 * ease_out(ramp(t, s["start"] + 0.2, s["start"] + 0.8))
    d.rounded_rectangle([W / 2 - lw, y + 108, W / 2 + lw, y + 114], 3, fill=A(VIOLET, a))
    frame.alpha_composite(lay)


def keystrip(frame, t, a):
    """Home row keycaps under the laptop; one key presses on every beat."""
    if a <= 0:
        return
    d = ImageDraw.Draw(frame)
    keys = "ASDFJKL;"
    k, gap = 100, 16
    x0 = W / 2 - (len(keys) * k + (len(keys) - 1) * gap) / 2 + k / 2
    beat = 60 / 104
    hit = int((t - INTRO) / (beat / 2)) % len(keys)
    ph = ((t - INTRO) % (beat / 2)) / (beat / 2)
    for i, ch in enumerate(keys):
        on = i == hit
        g = (1 - ph) if on else (0.35 if ch in "FJ" else 0.0)
        keycap(d, x0 + i * (k + gap), 1600 + (6 * (1 - ph) if on else 0), k, ch, glow=g, a=a, fnt=font("bold", 38))
    d.text((W / 2, 1735), "Rest your fingers on the home row", font=font("medium", 30), fill=A(MUTED, a * 0.8), anchor="ms")


def brand_corner(frame, a):
    if a <= 0:
        return
    ic = ICON.resize((64, 64), Image.LANCZOS)
    ic.putalpha(ic.getchannel("A").point(lambda v: round(v * a)))
    frame.alpha_composite(ic, (60, 90))
    d = ImageDraw.Draw(frame)
    d.text((140, 122), "Type", font=font("extrabold", 40), fill=A(TEXT, a), anchor="lm")
    d.text((140 + d.textlength("Type", font=font("extrabold", 40)), 122), "X", font=font("extrabold", 40), fill=A(VIOLET, a), anchor="lm")
    d.text((W - 60, 122), "FREE . OFFLINE", font=font("bold", 26), fill=A(MINT, a), anchor="rm")


# ------------------------------------------------------------------ keycaps
def keycap(d, cx, cy, s, label, glow=0.0, a=1.0, fill=(30, 36, 84), edge=(60, 68, 140), fnt=None):
    top = mix(fill, VIOLET2, glow)
    d.rounded_rectangle([cx - s / 2, cy - s / 2 + 8, cx + s / 2, cy + s / 2 + 8], s * 0.18, fill=A((14, 16, 40), a))
    d.rounded_rectangle([cx - s / 2, cy - s / 2, cx + s / 2, cy + s / 2], s * 0.18, fill=A(top, a), outline=A(mix(edge, VIOLET, glow), a), width=3)
    d.text((cx, cy), label, font=fnt or font("extrabold", int(s * 0.46)), fill=A(mix((205, 212, 255), (255, 255, 255), glow), a), anchor="mm")


def intro(frame, t):
    d = ImageDraw.Draw(frame)
    letters = "TYPEX"
    s = 170
    gap = 22
    x0 = W / 2 - (len(letters) * s + (len(letters) - 1) * gap) / 2 + s / 2
    for i, ch in enumerate(letters):
        t0 = 0.25 + i * 0.22
        p = ease_out(ramp(t, t0, t0 + 0.35))
        if p <= 0:
            continue
        y = 860 - (1 - p) * 500
        press = max(0.0, 1 - abs(t - (t0 + 0.35)) / 0.18) if t < t0 + 0.6 else 0.0
        glow = 1.0 if ch == "X" else 0.25 + 0.75 * press
        keycap(d, x0 + i * (s + gap), y + press * 10, s, ch, glow=glow, a=p)
    a2 = ease_out(ramp(t, 1.7, 2.3))
    if a2 > 0:
        rich_text(d, (W / 2, 1110), "Learn to type *fast*. For ^free^.", font("extrabold", 62), CAPCOL, alpha=round(255 * a2))
        d.text((W / 2, 1180), "The offline typing tutor for Windows", font=font("medium", 36), fill=A(MUTED, a2), anchor="ms")
    fade = 1 - ramp(t, INTRO - 0.35, INTRO)
    if fade < 1:
        frame.alpha_composite(Image.new("RGBA", (W, H), (9, 12, 32, round(255 * (1 - fade)))))


KB_ROWS = ["QWERTYUIOP", "ASDFGHJKL;", "ZXCVBNM,./"]


def peck(frame, t, s):
    lt = t - s["start"]
    d = ImageDraw.Draw(frame)
    k, gap = 78, 10
    seq = "HELLO"
    idx = int(lt / 0.75)
    target = seq[idx % len(seq)] if lt < 3.6 else None
    pos = {}
    for r, row in enumerate(KB_ROWS):
        x0 = W / 2 - (len(row) * (k + gap)) / 2 + k / 2 + r * 24
        for c, ch in enumerate(row):
            pos[ch] = (x0 + c * (k + gap), 800 + r * (k + gap))
    a = ease_out(ramp(lt, 0, 0.4))
    for ch, (x, y) in pos.items():
        hit = ch == target and (lt % 0.75) > 0.5
        keycap(d, x, y, k, ch, glow=0.9 if hit else 0.0, a=a, fnt=font("bold", 30))
    # one wandering "finger" that hunts for each key
    if target:
        tx, ty = pos[target]
        ph = (lt % 0.75) / 0.5
        wob = (1 - clamp(ph)) * 120
        fx = tx + math.sin(lt * 9) * wob
        fy = ty - 40 + math.cos(lt * 7) * wob * 0.6
        d.ellipse([fx - 34, fy - 34, fx + 34, fy + 34], fill=A((251, 113, 133), 0.45 * a), outline=A(ROSE, a), width=4)
    typed = seq[: min(len(seq), idx + (1 if (lt % 0.75) > 0.5 else 0))]
    d.text((W / 2, 1150), typed + ("_" if int(lt * 3) % 2 else " "), font=font("bold", 64), fill=A(TEXT, a), anchor="ms")
    gauge(frame, W / 2, 1450, 0.10 + 0.02 * math.sin(lt * 3), "12", "WPM", ROSE, a)


def gauge(frame, cx, cy, p, val, unit, col, a=1.0, r=170):
    d = ImageDraw.Draw(frame)
    d.arc([cx - r, cy - r, cx + r, cy + r], 150, 390, fill=A((40, 46, 100), a), width=26)
    d.arc([cx - r, cy - r, cx + r, cy + r], 150, 150 + 240 * clamp(p), fill=A(col, a), width=26)
    ang = math.radians(150 + 240 * clamp(p))
    d.line([(cx, cy), (cx + math.cos(ang) * (r - 40), cy + math.sin(ang) * (r - 40))], fill=A(TEXT, a), width=8)
    d.ellipse([cx - 16, cy - 16, cx + 16, cy + 16], fill=A(TEXT, a))
    d.text((cx, cy + 90), val, font=font("extrabold", 76), fill=A(col, a), anchor="ms")
    d.text((cx, cy + 130), unit, font=font("bold", 28), fill=A(MUTED, a), anchor="ms")


def games(frame, t, s):
    lt = t - s["start"]
    scr = Image.new("RGB", (LWID, LHEI))
    d = ImageDraw.Draw(scr)
    if lt < 2.4:  # Meteor Words
        g = np.linspace(0, 1, LHEI)[:, None]
        arr = np.array((5, 8, 22))[None, :] * (1 - g) + np.array((30, 27, 75))[None, :] * g
        scr = Image.fromarray(np.repeat(arr[:, None, :], LWID, axis=1).astype(np.uint8))
        d = ImageDraw.Draw(scr)
        r2 = np.random.default_rng(5)
        for _ in range(90):
            x, y = r2.uniform(0, LWID), r2.uniform(0, LHEI)
            d.point((x, y), fill=(220, 220, 255))
        d.rectangle([0, LHEI - 70, LWID, LHEI], fill=(15, 70, 60))
        d.line([(0, LHEI - 70), (LWID, LHEI - 70)], fill=MINT, width=4)
        words = [("speed", 140, 0.0), ("focus", 520, 0.5), ("keyboard", 330, 0.9), ("learn", 720, 1.3)]
        for w, x, t0 in words:
            y = 40 + (lt - t0 + 0.6) * 150
            if y < -20 or y > LHEI - 90:
                continue
            done = 0
            if w == "speed":
                done = int(clamp((lt - 0.6) / 0.9) * len(w))
            if w == "speed" and lt > 1.55:
                continue
            fnt = font("bold", 30)
            tw = d.textlength(w, font=fnt)
            d.rounded_rectangle([x - 8, y - 4, x + tw + 64, y + 46], 24, fill=(15, 23, 60), outline=MINT if done else (76, 81, 191), width=3)
            d.ellipse([x + 4, y + 8, x + 34, y + 38], fill=(249, 115, 22))
            d.text((x + 46, y + 21), w[:done], font=fnt, fill=MINT, anchor="lm")
            d.text((x + 46 + d.textlength(w[:done], font=fnt), y + 21), w[done:], font=fnt, fill=(255, 255, 255), anchor="lm")
        if 1.55 <= lt < 1.9:
            r = (lt - 1.55) * 400
            d.ellipse([160 - r, 280 - r, 160 + r, 280 + r], outline=GOLD, width=5)
        d.text((24, 22), "Meteor Words", font=font("bold", 26), fill=(255, 255, 255))
        d.text((LWID - 24, 22), f"score {120 if lt > 1.55 else 70}", font=font("bold", 26), fill=GOLD, anchor="ra")
    else:  # Balloon Pop
        lt2 = lt - 2.4
        g = np.linspace(0, 1, LHEI)[:, None]
        arr = np.array((125, 211, 252))[None, :] * (1 - g) + np.array((236, 254, 255))[None, :] * g
        scr = Image.fromarray(np.repeat(arr[:, None, :], LWID, axis=1).astype(np.uint8))
        d = ImageDraw.Draw(scr)
        cols = [(244, 114, 182), (129, 140, 248), (52, 211, 153), (251, 191, 36), (96, 165, 250)]
        for i, (ch, x) in enumerate(zip("fjdkslgh", [90, 210, 340, 470, 590, 700, 820, 400])):
            y = LHEI + 60 - (lt2 + i * 0.32) * 260
            if y < -100 or y > LHEI + 80:
                continue
            if ch in "fd" and lt2 > 0.9 + i * 0.1:
                continue
            c = cols[i % len(cols)]
            d.line([(x, y + 48), (x - 6, y + 110)], fill=(90, 90, 110), width=2)
            d.ellipse([x - 40, y - 50, x + 40, y + 50], fill=c)
            d.ellipse([x - 26, y - 36, x - 8, y - 16], fill=mix(c, (255, 255, 255), 0.6))
            d.text((x, y), ch, font=font("extrabold", 44), fill=(255, 255, 255), anchor="mm")
        d.text((24, 22), "Balloon Pop", font=font("bold", 26), fill=(30, 40, 80))
    laptop(frame, scr, alpha=ease_out(ramp(lt, 0, 0.35)))


# ------------------------------------------------------------------ scene renderer
def screen_scene(frame, s, t):
    lt = t - s["start"]
    k = s["key"]
    a = ease_out(ramp(lt, 0, 0.35))
    if k == "meet":
        img = SHOTS["login"] if lt < 2.2 else SHOTS["dashboard"]
        if 1.9 < lt < 2.5:
            p = ease(ramp(lt, 1.9, 2.5))
            img = Image.blend(SHOTS["login"], SHOTS["dashboard"], p)
        laptop(frame, view(img, (0.5, 0.5), 1.0 + 0.04 * lt / s["dur"]), a)
    elif k == "lesson":
        i = min(len(TYPE) - 1, int(lt / 0.2))
        z = 1.0 + 0.5 * ease(ramp(lt, 0.6, 2.2))
        laptop(frame, view(TYPE[i], (0.56, 0.36), z), a)
    elif k == "pro":
        img = SHOTS["lessons_pro"] if lt < 1.9 else SHOTS["pro_play"]
        focus = (0.62, 0.3) if lt < 1.9 else (0.5, 0.25)
        z = 1.25 + 0.15 * ramp(lt, 0, 4)
        laptop(frame, view(img, focus, z), a)
    elif k == "stars":
        z = 1.0 + 1.3 * ease(ramp(lt, 0.2, 1.4))
        laptop(frame, view(SHOTS["result"], (0.55, 0.4), z), a)
    elif k == "test":
        i = min(len(TEST) - 1, int(lt / 0.3))
        laptop(frame, view(TEST[i], (0.56, 0.3), 1.35), a)
        wpm = 12 + 36 * ease(ramp(lt, 0.3, 3.6))
        gauge(frame, W / 2, 1580, wpm / 80, str(round(wpm)), "WPM", MINT, a, r=130)
    elif k == "progress":
        img = SHOTS["progress"] if lt < 2.0 else SHOTS["progress_heat"]
        if 1.7 < lt < 2.3:
            img = Image.blend(SHOTS["progress"], SHOTS["progress_heat"], ease(ramp(lt, 1.7, 2.3)))
        laptop(frame, view(img, (0.58, 0.5), 1.2), a)
    elif k == "layouts":
        z = 1.15 + 0.35 * ease(ramp(lt, 0.3, 2.5))
        laptop(frame, view(SHOTS["settings"], (0.58, 0.42), z), a)


def outro(frame, t):
    lt = t - OUTRO_START
    d = ImageDraw.Draw(frame)
    a = ease_out(ramp(lt, 0, 0.5))
    ic = ICON.resize((220, 220), Image.LANCZOS)
    ic.putalpha(ic.getchannel("A").point(lambda v: round(v * a)))
    frame.alpha_composite(ic, (W // 2 - 110, round(330 + (1 - a) * 40)))
    fb = font("extrabold", 120)
    tw = d.textlength("TypeX", font=fb)
    d.text((W / 2 - tw / 2, 700), "Type", font=fb, fill=A(TEXT, a), anchor="ls")
    d.text((W / 2 - tw / 2 + d.textlength("Type", font=fb), 700), "X", font=fb, fill=A(VIOLET, a), anchor="ls")
    a2 = ease_out(ramp(lt, 0.4, 0.9))
    pills = ["100% free", "Works offline", "Windows 10 and 11"]
    fp = font("bold", 32)
    widths = [d.textlength(p, font=fp) + 56 for p in pills]
    x = W / 2 - (sum(widths) + 20 * (len(pills) - 1)) / 2
    for p, wd in zip(pills, widths):
        d.rounded_rectangle([x, 760, x + wd, 824], 32, fill=A((30, 36, 84), a2), outline=A(VIOLET, a2), width=2)
        d.text((x + wd / 2, 792), p, font=fp, fill=A(TEXT, a2), anchor="mm")
        x += wd + 20
    a3 = ease_out(ramp(lt, 0.8, 1.3))
    d.text((W / 2, 930), "Download free", font=font("semibold", 36), fill=A(MUTED, a3), anchor="ms")
    d.text((W / 2, 995), "github.com/datixai/typex", font=font("extrabold", 52), fill=A(MINT, a3), anchor="ms")
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    datix_credit(lay, ImageDraw.Draw(lay), 1180, ease_out(ramp(lt, 1.3, 1.9)), VIOLET, (60, 68, 140))
    frame.alpha_composite(lay)


def render(t):
    i, s = scene_at(TL, t)
    pulse = MINT if (s and s["key"] in ("stars", "test")) else (ROSE if (s and s["key"] == "peck") else None)
    frame = background(t, pulse).convert("RGBA")
    if t < INTRO:
        intro(frame, t)
    elif s:
        brand_corner(frame, ease_out(ramp(t, INTRO, INTRO + 0.5)))
        caption(frame, s, t)
        if s["key"] == "peck":
            peck(frame, t, s)
        elif s["key"] == "games":
            games(frame, t, s)
        else:
            screen_scene(frame, s, t)
        if s["key"] not in ("peck", "test"):
            keystrip(frame, t, ease_out(ramp(t, s["start"], s["start"] + 0.4)) * (1 - ramp(t, OUTRO_START - 0.3, OUTRO_START)))
        # quick fade between scenes
        edge = min(t - s["start"], s["end"] - t)
        if edge < 0.12:
            frame.alpha_composite(Image.new("RGBA", (W, H), (9, 12, 32, round(255 * (1 - edge / 0.12) * 0.7))))
    else:
        outro(frame, t)
    return frame.convert("RGB")


# ------------------------------------------------------------------ sound
def synth(path):
    m = Mixer(DUR, seed=11)
    m.pad([(110.0, 1.0), (164.8, 0.7), (220.0, 0.5), (329.6, 0.3)], gain=0.05)

    def tick(bright=1.0, space=False):
        n = int(0.045 * SR)
        tt = np.arange(n) / SR
        nz = m.rng.normal(0, 1, n)
        nz = nz - m.smooth(nz, 2 if bright > 0.8 else 4)
        body = np.sin(2 * math.pi * (240 if space else 380) * tt) * np.exp(-tt * 70)
        return nz * np.exp(-tt * 140) * 0.55 * bright + body * 0.35

    def kick():
        tt = np.arange(int(0.3 * SR)) / SR
        return np.sin(2 * math.pi * (50 + 90 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 9)

    def hat():
        n = int(0.05 * SR)
        nz = m.rng.normal(0, 1, n)
        return (nz - m.smooth(nz, 2)) * np.exp(-np.arange(n) / SR * 90) * 0.25

    bpm = 104
    beat = 60 / bpm
    b = INTRO
    while b < OUTRO_START + 2:
        m.add(kick(), b, 0.55)
        m.add(hat(), b + beat / 2, 0.5, pan=0.2)
        b += beat
    # intro keycaps
    for i in range(5):
        m.add(tick(1.2), 0.6 + i * 0.22, 0.9, pan=-0.4 + i * 0.2)
    m.add(m.boom(), 1.55, 0.35)
    m.add(m.riser(1.2), INTRO - 1.2, 0.6)
    starts = {s["key"]: s["start"] for s in TL}
    # hunting and pecking: slow, uneven taps
    for k in range(5):
        m.add(tick(0.8), starts["peck"] + k * 0.75 + 0.55, 0.8)
    # lesson flipbook: a tick per character
    for k in range(len(TYPE)):
        m.add(tick(1.0, k % 6 == 5), starts["lesson"] + k * 0.2, 0.7, pan=((k * 37) % 11 - 5) / 12)
    m.add(m.tone(1046.5, 0.6, 5), starts["pro"] + 0.05, 0.12)
    for k in range(10):
        m.add(tick(1.0), starts["pro"] + 2.0 + k * 0.17, 0.6)
    # stars: success arpeggio
    for k, f in enumerate([523.3, 659.3, 784.0, 1046.5]):
        m.add(m.tone(f, 0.5, 4), starts["stars"] + 0.5 + k * 0.12, 0.22)
    # test: faster ticks as the gauge climbs
    tt0 = starts["test"]
    x = 0.3
    while x < 4.2:
        m.add(tick(1.0), tt0 + x, 0.6, pan=math.sin(x * 5) * 0.4)
        x += 0.24 - 0.13 * clamp((x - 0.3) / 3.3)
    # games: typing, pop, balloon pops
    g0 = starts["games"]
    for k in range(5):
        m.add(tick(1.0), g0 + 0.6 + k * 0.19, 0.6)
    m.add(m.tone(880, 0.25, 12), g0 + 1.55, 0.25)
    for k in range(2):
        m.add(m.tone(700, 0.18, 18), g0 + 3.4 + k * 0.4, 0.25)
    m.add(m.bell(1318.5), starts["layouts"] + 0.4, 0.1)
    m.add(m.riser(1.4), OUTRO_START - 1.4, 0.5)
    m.add(m.boom(), OUTRO_START, 0.45)
    for k, f in enumerate([392.0, 523.3, 659.3, 784.0]):
        m.add(m.tone(f, 1.2, 2.5), OUTRO_START + 0.1 + k * 0.1, 0.12)
    m.write(path)


def main():
    if "--preview" in sys.argv:
        pdir = os.path.join(HERE, "work", "preview")
        os.makedirs(pdir, exist_ok=True)
        ts = [float(x) for x in sys.argv[sys.argv.index("--preview") + 1:]]
        thumbs = []
        for x in ts:
            im = render(x)
            im.save(os.path.join(pdir, f"t{x:05.1f}.jpg"), quality=85)
            thumbs.append(im.resize((270, 480)))
        sheet = Image.new("RGB", (270 * len(thumbs), 480))
        for i, th in enumerate(thumbs):
            sheet.paste(th, (i * 270, 0))
        sheet.save(os.path.join(pdir, "sheet.jpg"), quality=85)
        print("preview ->", pdir)
        return
    wav = os.path.join(HERE, "work", "typex.wav")
    synth(wav)
    cmd = [FFMPEG, "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-i", wav,
           "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-profile:v", "high",
           "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", OUT]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
    total = int(DUR * FPS)
    for i in range(total):
        proc.stdin.write(render(i / FPS).tobytes())
        if i % 150 == 0:
            print(f"frame {i}/{total}", flush=True)
    proc.stdin.close()
    proc.wait()
    print("wrote", OUT)


if __name__ == "__main__":
    main()

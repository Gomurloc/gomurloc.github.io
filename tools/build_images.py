"""Build site images from game art and brand files.

python tools/build_images.py [--only fsg|otr|brand|hero]

FeelSoGut! art is read (never written) from the local rhythm-prototype checkout.
Layer layouts below are copied from its Unity scenes (UI Image RectTransforms
inside a 1920x1080 SafeFrame, listed in sibling = draw order).
"""
import argparse
import base64
import io
import os
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "site" / "assets" / "img"
BRAND = ROOT / "brand" / "logo"
CACHE = ROOT / ".cache"
FSG = Path(os.environ.get("FSG_ROOT", "C:/Users/user/Documents/GitHub/rhythm-prototype/Assets"))
OTR_RAW = "https://raw.githubusercontent.com/Gomurloc/off-the-record/main/"
OTR_DIR = "이미지/웹/"
FRAME = (1920, 1080)

# (file, anchorMin, anchorMax, anchoredPosition, sizeDelta, pivot, scale, preserveAspect)
FULL = ((0, 0), (1, 1), (0, 0), (0, 0), (0.5, 0.5), (1, 1), False)
SCENES = {
    # Assets/Scenes/Stage1_5IntroScene.unity (TitleImage left out). The Clown's
    # authored x offset of 600 is its tween start; the art is drawn for offset 0.
    "1-5": [("1-5/리믹스1 배경.png", *FULL), ("1-5/리믹스1 광대.png", *FULL),
            ("1-5/리믹스1 바다.png", *FULL), ("1-5/리믹스1잭두.png", *FULL)],
    # Assets/Scenes/Stage1_2IntroScene.unity (TitleImage left out)
    "1-2": [("1-2/1-2배경.png", *FULL),
            ("1-2/1-2배경바닥.png", (0, 0), (1, 0), (0, 0), (0, 225), (0.5, 0), (1, 1), True),
            ("1-2/1-2 인트로광대.png", (0.5, 0.5), (0.5, 0.5), (34, -273), (1400, 781.4), (0.5, 0.5), (1.2955748, 1.2955748), True),
            ("1-2/1-2 인트로 말풍선1.png", *FULL),
            ("1-2/1-2 인트로 말풍선2.png", (0, 0), (1, 1), (-599, 252), (0, 0), (0.5, 0.5), (0.22218, 0.28605676), False)],
    # Assets/Scenes/Stage1_4IntroScene.unity (TitleImage left out)
    "1-4": [("1-4/1-4 배경.png", *FULL), ("1-4/1-4 바닥.png", *FULL), ("1-4/1-4 인트로 손.png", *FULL),
            ("1-4/1-4 인트로광대 (2).png", *FULL), ("1-4/1-4 인트로잭두 (1).png", *FULL),
            ("1-4/1-4 인트로빨간풍선 (1).png", (0.5, 0.5), (0.5, 0.5), (324.7, 937), (235.7714, 740.0164), (0.5, 0.5), (1, 1), True),
            ("1-4/1-4 인트로파란풍선 (1).png", (0.5, 0.5), (0.5, 0.5), (463.1, 929), (222.3895, 686.4901), (0.5, 0.5), (1, 1), True)],
    # Assets/Scenes/StartScene.unity (menu buttons left out)
    "start": [("1-2/1-2배경.png", *FULL),
              ("시작/시작_타이틀.png", (0, 0), (1, 1), (0, 0), (0, 0), (0.5, 0.5), (1, 1), True)],
}


def ui_rect(amin, amax, pos, size, pivot, scale, frame=FRAME):
    """Unity RectTransform -> (left, top, width, height) in top-left pixel space."""
    W, H = frame
    w = ((amax[0] - amin[0]) * W + size[0]) * scale[0]
    h = ((amax[1] - amin[1]) * H + size[1]) * scale[1]
    px = (amin[0] + (amax[0] - amin[0]) * pivot[0]) * W + pos[0]
    py = (amin[1] + (amax[1] - amin[1]) * pivot[1]) * H + pos[1]
    left, bottom = px - w * pivot[0], py - h * pivot[1]
    return left, H - (bottom + h), w, h


def compose(scene, k=2):
    W, H = FRAME[0] * k, FRAME[1] * k
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    for file, amin, amax, pos, size, pivot, scale, preserve in SCENES[scene]:
        layer = Image.open(FSG / file).convert("RGBA")
        left, top, w, h = (v * k for v in ui_rect(amin, amax, pos, size, pivot, scale))
        if preserve:
            ratio = layer.width / layer.height
            if w / h > ratio:
                nw = h * ratio
                left += (w - nw) * pivot[0]
                w = nw
            else:
                nh = w / ratio
                top += (h - nh) * (1 - pivot[1])
                h = nh
        layer = layer.resize((max(1, round(w)), max(1, round(h))), Image.LANCZOS)
        canvas.alpha_composite(layer, (round(left), round(top))) if left >= 0 and top >= 0 else _paste(canvas, layer, left, top)
    return canvas.convert("RGB")


def _paste(canvas, layer, left, top):
    tmp = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    tmp.paste(layer, (round(left), round(top)), layer)
    canvas.alpha_composite(tmp)


def cover(im, size):
    tw, th = size
    scale = max(tw / im.width, th / im.height)
    im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    left, top = (im.width - tw) // 2, (im.height - th) // 2
    return im.crop((left, top, left + tw, top + th))


def save_webp(im, name, cap=450_000, q=82):
    OUT.mkdir(parents=True, exist_ok=True)
    while True:
        buf = io.BytesIO()
        im.save(buf, "WEBP", quality=q, method=6)
        if buf.tell() <= cap or q <= 50:
            break
        q -= 5
    (OUT / name).write_bytes(buf.getvalue())
    print(f"{name}: {im.width}x{im.height} q{q} {buf.tell() // 1000}KB")


def widths(im, slug, ws, cap=450_000):
    for w in ws:
        if w > im.width:
            continue
        h = round(im.height * w / im.width)
        save_webp(im.resize((w, h), Image.LANCZOS) if w != im.width else im, f"{slug}-{w}.webp", cap)


def build_fsg():
    hero = compose("1-5")
    widths(hero, "fsg-hero", [1920, 1280, 960])
    widths(hero, "fsg-tile", [960, 640])
    for i, scene in enumerate(["1-2", "1-4", "start"], 1):
        widths(compose(scene), f"fsg-shot-{i}", [1920, 960])
    title = Image.open(FSG / "시작/시작_타이틀.png").convert("RGBA")
    logo = title.crop(title.getchannel("A").getbbox())
    pad = 8
    framed = Image.new("RGBA", (logo.width + 2 * pad, logo.height + 2 * pad), (0, 0, 0, 0))
    framed.paste(logo, (pad, pad))
    for w in (680, 340):
        save_webp(framed.resize((w, round(framed.height * w / framed.width)), Image.LANCZOS), f"fsg-logo-{w}.webp")


def otr(name):
    dst = CACHE / "otr" / name
    if not dst.exists():
        dst.parent.mkdir(parents=True, exist_ok=True)
        with urllib.request.urlopen(OTR_RAW + urllib.parse.quote(OTR_DIR + name), timeout=60) as res:
            dst.write_bytes(res.read())
    return Image.open(dst).convert("RGB")


def build_otr():
    widths(cover(otr("타이틀_글자없음.jpg"), (1920, 1080)), "otr-hero", [1920, 1280, 960])
    widths(otr("플레이_정거장.jpg"), "otr-shot-1", [800])
    widths(otr("플레이_오프닝.jpg"), "otr-shot-2", [800])
    widths(otr("인트로2.jpg"), "otr-shot-3", [1600, 960])
    widths(otr("인트로3.jpg"), "otr-shot-4", [1600, 960])
    widths(cover(otr("인트로4.jpg"), (1600, 900)), "otr-tile", [960, 640])


KO_MARK = """<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="382 155 176 70" role="img" aria-label="KO Studio">
<g fill="#ebe5d8">
<rect x="382" y="155" width="14" height="70"/>
<polygon points="396,182 396,198 444,171 444,155"/>
<polygon points="396,182 396,198 444,225 444,209"/>
<path fill-rule="evenodd" d="M558 190a35 35 0 1 1-70 0a35 35 0 1 1 70 0zM544 190a21 21 0 1 0-42 0a21 21 0 1 0 42 0z"/>
</g>
<image x="444" y="168" width="44" height="44" href="data:image/png;base64,{dot}"/>
</svg>
"""


def build_brand():
    dot = Image.open(BRAND / "KO-studio_dot_blood.png").convert("RGBA").resize((64, 64), Image.LANCZOS)
    OUT.mkdir(parents=True, exist_ok=True)
    dot.save(OUT / "ko-dot-64.png", optimize=True)
    buf = io.BytesIO()
    dot.save(buf, "PNG", optimize=True)
    (OUT / "ko-mark.svg").write_text(KO_MARK.replace("{dot}", base64.b64encode(buf.getvalue()).decode()), encoding="utf-8")
    icon = Image.open(BRAND / "KO-studio_icon_2048.png").convert("RGB")
    for size, name in [(32, "favicon-32.png"), (180, "apple-touch-icon.png"), (512, "icon-512.png")]:
        icon.resize((size, size), Image.LANCZOS).save(OUT / name, optimize=True)
    logo = Image.open(BRAND / "KO-studio_logo_3840x2160.png").convert("RGB")
    cover(logo, (1200, 630)).save(OUT / "og.jpg", quality=86, optimize=True)
    print("brand: ko-mark.svg, ko-dot-64.png, icons, og.jpg")


def build_hero():
    """Hero still. Uses .cache/render/hero-*.png from tools/render-hero.html when present."""
    render = CACHE / "render"
    for w, cap in ((1920, 250_000), (2880, 450_000)):
        src = render / f"hero-{w}.png"
        im = Image.open(src).convert("RGB") if src.exists() else \
            Image.open(BRAND / "KO-studio_logo_3840x2160.png").convert("RGB").resize((w, w * 9 // 16), Image.LANCZOS)
        save_webp(im, f"hero-{w}.webp", cap, q=94)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", choices=["fsg", "otr", "brand", "hero"])
    only = parser.parse_args().only
    for key, fn in [("fsg", build_fsg), ("otr", build_otr), ("brand", build_brand), ("hero", build_hero)]:
        if only in (None, key):
            fn()

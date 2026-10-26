"""Download self-hosted fonts and three.js r160 into site/assets.

Run again any time; files are overwritten with the same content.
"""
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "site" / "assets"
FONTS = ASSETS / "fonts"
LIB = ASSETS / "lib" / "three-r160"

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36")
FONT_CSS = ("https://fonts.googleapis.com/css2?family=Jost:wght@400;500"
            "&family=Noto+Serif+KR:wght@500&family=Big+Shoulders+Display:wght@900&display=swap")
OFL = [
    "https://raw.githubusercontent.com/google/fonts/main/ofl/jost/OFL.txt",
    "https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifkr/OFL.txt",
    "https://raw.githubusercontent.com/google/fonts/main/ofl/bigshouldersdisplay/OFL.txt",
]
THREE = "https://cdn.jsdelivr.net/npm/three@0.160.0/"


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as res:
        return res.read()


def slug(family):
    return family.lower().replace(" ", "-")


def fetch_fonts():
    FONTS.mkdir(parents=True, exist_ok=True)
    for old in FONTS.glob("*.woff2"):
        old.unlink()
    css = get(FONT_CSS).decode("utf-8")
    counters = {}
    out = []
    for block in re.findall(r"@font-face\s*{[^}]*}", css):
        family = re.search(r"font-family:\s*'([^']+)'", block).group(1)
        weight = re.search(r"font-weight:\s*(\d+)", block).group(1)
        url = re.search(r"url\((https://[^)]+\.woff2)\)", block).group(1)
        key = (family, weight)
        counters[key] = counters.get(key, 0) + 1
        name = f"{slug(family)}-{weight}-{counters[key]:02d}.woff2"
        (FONTS / name).write_bytes(get(url))
        out.append(block.replace(url, f"/assets/fonts/{name}"))
    (ASSETS / "css").mkdir(parents=True, exist_ok=True)
    (ASSETS / "css" / "fonts.css").write_text("\n".join(out) + "\n", encoding="utf-8")
    licenses = [get(u).decode("utf-8").strip() for u in OFL]
    (FONTS / "OFL.txt").write_text("\n\n----\n\n".join(licenses) + "\n", encoding="utf-8")
    print(f"fonts: {len(out)} faces")


def fetch_three():
    LIB.mkdir(parents=True, exist_ok=True)
    (LIB / "three.module.min.js").write_bytes(get(THREE + "build/three.module.min.js"))
    room = get(THREE + "examples/jsm/environments/RoomEnvironment.js").decode("utf-8")
    patched = room.replace("from 'three'", "from './three.module.min.js'")
    assert patched != room, "RoomEnvironment.js import line not found"
    (LIB / "RoomEnvironment.js").write_text(patched, encoding="utf-8")
    (LIB / "LICENSE").write_bytes(get(THREE + "LICENSE"))
    (LIB / "MODIFIED.md").write_text(
        "# Changes to three.js r160\n\n"
        "`RoomEnvironment.js`: `from 'three'` was changed to `from './three.module.min.js'` "
        "so the module loads without an import map. Nothing else was changed.\n",
        encoding="utf-8",
    )
    print("three: r160 vendored")


if __name__ == "__main__":
    fetch_fonts()
    fetch_three()

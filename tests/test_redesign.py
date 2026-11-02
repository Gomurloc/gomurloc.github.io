"""Checks for the blackout-theater redesign (spec 2026-10-28)."""
import re
import sys
import unittest

from PIL import Image

from support import ROOT, SITE, parse

sys.path.insert(0, str(ROOT / "tools"))
import build_images  # noqa: E402

IMG = SITE / "assets/img"
CSS = (SITE / "assets/css/site.css").read_text(encoding="utf-8")
BARE = re.sub(r"/\*.*?\*/", "", CSS, flags=re.S)
FLAT = " ".join(BARE.split())
PAGES = {"ko": SITE / "index.html", "en": SITE / "en/index.html"}
COPY = {
    "ko": {"loglines": ["신령님, 박자 한 번만 빌려주십시오.", "나가서 건지고, 돌아와서 판다"],
           "next": [("#game-otr", "다음 상영", "OFF THE RECORD"), ("#studio", "엔딩 크레딧", "KO Studio")],
           "award": ["2026 미래 게임잼", "최우수상"],
           "statement": "그렇게 예상을 한 번에 뒤집는 게임을 만듭니다.",
           "pun": "K·O가 됩니다."},
    "en": {"loglines": ["Spirit, lend me your beat.", "Salvage it out there. Sell it back home."],
           "next": [("#game-otr", "Up next", "OFF THE RECORD"), ("#studio", "End credits", "KO Studio")],
           "award": ["Top Excellence Award (최우수상),", "2026 Future Game Jam"],
           "statement": "That’s the kind of game KO Studio makes: one that flips your expectations in a single blow.",
           "pun": "becomes K·O."},
}


def rules():
    """(selector, [(property, value)]) for every style rule; comments and @media wrappers removed."""
    src = re.sub(r"@media[^{]+\{", "", BARE)
    for sel, body in re.findall(r"([^{}]+)\{([^{}]*)\}", src):
        yield " ".join(sel.split()), [tuple(x.strip() for x in d.split(":", 1)) for d in body.split(";") if ":" in d]


def text(el):
    return " ".join(el.text.split())


class Copy(unittest.TestCase):
    def test_loglines(self):
        for lang, path in PAGES.items():
            self.assertEqual([text(e) for e in parse(path).select("p", class_="logline")], COPY[lang]["loglines"], lang)

    def test_next_slates(self):
        for lang, path in PAGES.items():
            got = [(a.attrs["href"], text(a.select(class_="next-label")[0]), text(a.select(class_="next-title")[0]))
                   for a in parse(path).select("a", class_="next")]
            self.assertEqual(got, COPY[lang]["next"], lang)

    def test_award_two_lines(self):
        for lang, path in PAGES.items():
            award = parse(path).select("p", class_="award")[0]
            lines = [text(c) for c in award.select("span", class_="award-text")[0].children]
            self.assertEqual(lines, COPY[lang]["award"], lang)
            self.assertEqual([s.attrs.get("aria-hidden") for s in award.select("svg", class_="laurel")], ["true", "true"], lang)

    def test_studio_order(self):
        for lang, path in PAGES.items():
            kids = parse(path).by_id("studio").select("div", class_="wrap")[0].children
            self.assertEqual([k.attrs.get("class") for k in kids], ["section-head", "studio-text", "statement", "studio-text", "seal"], lang)
            self.assertTrue(text(kids[1]).endswith(COPY[lang]["pun"]), lang)
            self.assertEqual(text(kids[2]), COPY[lang]["statement"], lang)
            self.assertEqual(kids[4].attrs.get("aria-hidden"), "true", lang)

    def test_credit_line(self):
        for lang, path in PAGES.items():
            cards = parse(path).select("header", class_="title-card")
            self.assertEqual(len(cards), 2, lang)
            for card in cards:
                presents = card.children[0]
                self.assertIn("presents", presents.attrs.get("class", "").split(), lang)
                self.assertTrue(presents.select("span", aria_hidden="true"), lang)
                self.assertEqual([text(s) for s in presents.select("span", class_="visually-hidden")], ["KO Studio"], lang)

    def test_no_straight_quotes(self):
        for path in [*PAGES.values(), SITE / "404.html"]:
            self.assertNotRegex(parse(path).text, r"['\"]", path.name)


class Posters(unittest.TestCase):
    def test_poster_art(self):
        for lang, path in PAGES.items():
            arts = [t.select("img", class_="tile-art")[0] for t in parse(path).select("a", class_="tile")]
            self.assertEqual([a.attrs["src"] for a in arts], ["/assets/img/fsg-poster-600.webp", "/assets/img/otr-poster-600.webp"], lang)
            for a in arts:
                self.assertIn("-900.webp 900w", a.attrs["srcset"], lang)
                self.assertEqual(a.attrs["alt"], "", lang)


class PopOut(unittest.TestCase):
    def test_css_matches_pop_box(self):
        left, top, right, bottom = build_images.POP_BOX
        m = re.search(r"\.plate-pop img \{[^}]*left: ([\d.]+)%; top: ([\d.]+)%; width: ([\d.]+)%", CSS)
        self.assertIsNotNone(m, ".plate-pop img rule")
        for got, want in zip(map(float, m.groups()), (left / 19.2, top / 10.8, (right - left) / 19.2)):
            self.assertEqual(got, round(want, 4))

    def test_html_matches_image(self):
        left, top, right, bottom = build_images.POP_BOX
        with Image.open(IMG / "fsg-pop.webp") as im:
            self.assertEqual(im.size, (right - left, bottom - top))
            for lang, path in PAGES.items():
                img = parse(path).select("div", class_="plate-pop")[0].select("img")[0]
                self.assertEqual((int(img.attrs["width"]), int(img.attrs["height"])), im.size, lang)


class ImageAttrs(unittest.TestCase):
    def test_size_attrs_match_files(self):
        for path in [*PAGES.values(), SITE / "404.html"]:
            for img in parse(path).select("img"):
                src = img.attrs.get("src", "")
                if not src or src.endswith(".svg") or "width" not in img.attrs:
                    continue
                with Image.open(SITE / src.lstrip("/")) as im:
                    want = im.width / im.height
                    size = f"{im.width}x{im.height}"
                got = int(img.attrs["width"]) / int(img.attrs["height"])
                self.assertLessEqual(abs(got - want) / want, 0.01, f"{path.name} {src} {img.attrs['width']}x{img.attrs['height']} vs {size}")


class Tokens(unittest.TestCase):
    ALLOWED_FONT = {("html:lang(en) body", "font-size", "18px"), (".tile .stencil", "font-size", "14cqi"), ("button", "font", "inherit")}

    def test_font_sizes_use_tokens(self):
        for sel, decls in rules():
            for prop, val in decls:
                if prop in ("font", "font-size") and "var(--t-" not in val:
                    self.assertIn((sel, prop, val), self.ALLOWED_FONT)

    def test_durations_use_tokens(self):
        for sel, decls in rules():
            for prop, val in decls:
                if prop.startswith(("transition", "animation")):
                    for lit in re.findall(r"(?<![\w-])\d*\.?\d+m?s\b", val):
                        self.assertTrue(lit == ".01ms" or (sel == "#intro" and lit == ".35s"), f"{sel} {prop}: {lit}")

    def test_spacing_uses_ladder(self):
        for sel, decls in rules():
            for prop, val in decls:
                if re.fullmatch(r"(row-|column-)?gap|(margin|padding)(-[a-z]+)?", prop):
                    for n in re.findall(r"(?<![\w.])(\d*\.?\d+)px", val):
                        self.assertLessEqual(float(n), 5, f"{sel} {prop}: {val}")

    def test_tracking_only_caps(self):
        for sel, decls in rules():
            for prop, val in decls:
                if prop == "letter-spacing":
                    self.assertIn(val, ("var(--caps)", "0"), sel)

    def test_tokens_defined(self):
        for decl in ["--muted: #908d88", "--line: color-mix(in srgb, var(--text) 12%, transparent)", "--caps: .24em",
                     "--t-label: 12px", "--t-small: 14px", "--t-body: 17px", "--t-lead: clamp(20px, 2.2vw, 24px)",
                     "--t-title: clamp(30px, 4.2vw, 52px)", "--t-display: clamp(60px, 9vw, 136px)",
                     "--s1: 8px; --s2: 13px; --s3: 21px; --s4: 34px; --s5: 55px; --s6: 89px; --s7: 144px",
                     "--ease-out: cubic-bezier(.16, 1, .3, 1)", "--ease-io: cubic-bezier(.65, 0, .35, 1)",
                     "--d1: .18s; --d2: .4s; --d3: .8s; --d4: 2s", "--stagger: .12s",
                     '[data-game="feelsogut"] { --g-bg: #0D0E38; --g-room: #0D0E38; --g-accent: #FF0099; --g-accent-2: #21D3ED; }',
                     '[data-game="otr"] { --g-bg: #06070A; --g-room: #0b1019; --g-accent: #D9A521; --g-accent-2: #2E9C97; }']:
            self.assertIn(decl, FLAT)

    def test_reduced_motion(self):
        at = FLAT.index("@media (prefers-reduced-motion: reduce)")
        self.assertGreater(at, FLAT.index("scroll-behavior: smooth"))
        self.assertIn(":root { --d1: .01ms; --d2: .01ms; --d3: .01ms; --d4: .01ms; --stagger: 0s; } html { scroll-behavior: auto; }", FLAT[at:])

    def test_print_shows_everything(self):
        at = FLAT.index("@media print")
        for rule in [".js .game .title-card > * { opacity: 1; transform: none; }",
                     ".js .game:not(.is-lit) .stage-light { opacity: 1; }",
                     ".js .game:not(.is-lit) { background-color: var(--g-room); }",
                     ".js .plate .plate-img, .js .plate .plate-pop { transform: none; }"]:
            self.assertIn(rule, FLAT[at:])
        for base in [".js .game .title-card > * { opacity: 0;",  # same specificity: print must come later
                     ".js .game:not(.is-lit) .stage-light { opacity: 0; }",
                     ".js .game:not(.is-lit) { background-color: var(--bg); }",
                     ".js .plate .plate-img, .js .plate .plate-pop { transform: scale(1.045);"]:
            self.assertGreater(at, FLAT.rindex(base), base)

    def test_focus_ring_takes_the_room_colour(self):
        self.assertIn(".game :focus-visible { outline-color: var(--g-accent); }", FLAT)


if __name__ == "__main__":
    unittest.main()

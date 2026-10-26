import re
import unittest

from support import SITE, parse

KO = SITE / "index.html"


class PageKo(unittest.TestCase):
    def setUp(self):
        self.p = parse(KO)

    def test_sections_and_menu(self):
        for i in ["top", "games", "game-feelsogut", "game-otr", "studio", "contact", "lightbox", "intro"]:
            self.assertIsNotNone(self.p.by_id(i), i)
        self.assertEqual([a.attrs["href"] for a in self.p.select("a", **{"data-menu": ""})], ["#games", "#studio", "#contact"])
        self.assertEqual(len(self.p.select("a", class_="tile")), 2)

    def test_anchor_targets_exist(self):
        for a in self.p.select("a"):
            h = a.attrs.get("href", "")
            if h.startswith("#"):
                self.assertIsNotNone(self.p.by_id(h[1:]), h)

    def test_credits_exact(self):
        credits = [e.text.strip() for e in self.p.select("p", class_="credit")]
        self.assertEqual(credits, ["고유준 · 이유진 · 권유담", "고유준 기획·사운드 · 이유진 개발 · 권유담 아트"])

    def test_no_team_name(self):
        self.assertNotIn("삼유", self.p.raw)
        self.assertNotIn("3U", self.p.raw)

    def test_formal_tone(self):
        self.assertNotRegex(self.p.text, r"(어|아|해|에|이|예|와|봐)요[.!?\s]")

    def test_contact(self):
        a = self.p.by_id("contact").select("a", href="mailto:ko@kostudio.org")
        self.assertTrue(a)
        self.assertEqual(a[0].text.strip(), "ko@kostudio.org")
        self.assertIn("퍼블리싱, 협업, 채용·외주 제안 모두 메일로 받습니다.", self.p.text)

    def test_labels(self):
        for s in ["건너뛰기", "소리 켜기", "인트로 다시 보기", "SELECT A GAME", "GAMES", "STUDIO", "CONTACT"]:
            self.assertIn(s, self.p.text)
        self.assertIn("게임 제목과 이미지의 저작권은 각 게임 제작진에게 있습니다", self.p.text)

    def test_award_and_stages(self):
        self.assertIn("2026 미래 게임잼 최우수상", self.p.text)
        tiles = [t.text for t in self.p.select("a", class_="tile")]
        self.assertIn("알파", tiles[0])
        self.assertIn("개발 중", tiles[1])

    def test_images_have_alt_and_exist(self):
        for img in self.p.select("img"):
            self.assertIn("alt", img.attrs)
            if "src" not in img.attrs:  # the lightbox image is filled in by JS
                continue
            self.assertTrue((SITE / img.attrs["src"].lstrip("/")).is_file(), img.attrs["src"])
            for part in img.attrs.get("srcset", "").split(","):
                if part.strip():
                    self.assertTrue((SITE / part.split()[0].lstrip("/")).is_file(), part)

    def test_no_external_requests(self):
        for f in [KO, SITE / "assets/css/site.css"]:
            for u in re.findall(r"https?://[^\"')\s]+", f.read_text(encoding="utf-8")):
                self.assertTrue(u.startswith("https://kostudio.org"), u)

    def test_meta_and_lazy(self):
        self.assertEqual(self.p.select("meta", property="og:image")[0].attrs["content"], "https://kostudio.org/assets/img/og.jpg")
        self.assertTrue(self.p.select("meta", name="description"))
        for sec in ["game-feelsogut", "game-otr", "games"]:
            for img in self.p.by_id(sec).select("img"):
                self.assertEqual(img.attrs.get("loading"), "lazy", img.attrs["src"])

    def test_css_rules(self):
        css = (SITE / "assets/css/site.css").read_text(encoding="utf-8")
        for token in ["--bg: #0b0b0c", "--text: #e9e4da", "--red: #c41e2a", "--red-line: #8f1220"]:
            self.assertIn(token, css)
        self.assertIn("word-break: keep-all", css)
        self.assertIn("scroll-margin-top", css)
        self.assertIn("0.17 * max(100svh, 56.25vw)", css)


if __name__ == "__main__":
    unittest.main()

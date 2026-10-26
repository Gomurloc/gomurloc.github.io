import unittest

from support import SITE, parse


class PageEn(unittest.TestCase):
    def setUp(self):
        self.p = parse(SITE / "en/index.html")
        self.ko = parse(SITE / "index.html")

    def test_same_structure(self):
        def ids(pg):
            return [e.attrs["id"] for e in pg.select() if "id" in e.attrs]
        self.assertEqual(ids(self.p), ids(self.ko))

    def test_copy(self):
        for s in ["Skip", "Sound on", "Replay intro", "SELECT A GAME", "Game titles and art © their respective creators",
                  "For publishing, collaboration, or job and contract offers, email us.",
                  "Top Excellence Award (최우수상), 2026 Future Game Jam",
                  "Ko Yujun (design, sound) · 이유진 (development) · 권유담 (art)"]:
            self.assertIn(s, self.p.text)
        self.assertNotIn("Grand prize", self.p.text)
        self.assertNotIn("3U", self.p.raw)

    def test_lang_links(self):
        self.assertEqual({a.attrs["href"] for a in self.p.select("a", **{"data-lang": "ko"})}, {"/"})
        self.assertEqual({a.attrs["href"] for a in self.ko.select("a", **{"data-lang": "en"})}, {"/en/"})

    def test_404(self):
        p = parse(SITE / "404.html")
        for s in ["페이지를 찾을 수 없습니다", "Page not found", "홈으로 가기", "Back to home"]:
            self.assertIn(s, p.text)
        for e in p.select():
            for k in ("src", "href"):
                v = e.attrs.get(k, "")
                if v and not v.startswith(("#", "mailto:", "https://kostudio.org")):
                    self.assertTrue(v.startswith("/"), v)


if __name__ == "__main__":
    unittest.main()

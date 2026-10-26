import unittest

from support import ROOT, SITE, parse


class Scaffold(unittest.TestCase):
    def test_pages_exist(self):
        for p in ["index.html", "en/index.html", "404.html", "robots.txt"]:
            self.assertTrue((SITE / p).is_file(), p)

    def test_lang_and_hreflang(self):
        ko, en = parse(SITE / "index.html"), parse(SITE / "en/index.html")
        self.assertEqual(ko.select("html")[0].attrs["lang"], "ko")
        self.assertEqual(en.select("html")[0].attrs["lang"], "en")
        for page in (ko, en):
            alts = {l.attrs["hreflang"]: l.attrs["href"] for l in page.select("link", rel="alternate")}
            self.assertEqual(alts, {"ko": "https://kostudio.org/", "en": "https://kostudio.org/en/"})

    def test_workflow_deploys_site_only(self):
        wf = (ROOT / ".github/workflows/pages.yml").read_text(encoding="utf-8")
        self.assertIn("path: ./site", wf)
        self.assertRegex(wf, r"branches:\s*\[\s*main\s*\]")
        self.assertIn("actions/deploy-pages", wf)

    def test_no_card_or_phone_committed(self):
        self.assertFalse((ROOT / "brand/card").exists())
        skip = {".git", ".superpowers", ".cache", "lib", "fonts"}
        for f in ROOT.rglob("*"):
            if f.is_file() and f.suffix in {".html", ".js", ".css", ".md", ".py", ".txt"} and not skip & set(f.parts):
                self.assertNotRegex(f.read_text(encoding="utf-8", errors="ignore"), r"010[ -]?\d{4}[ -]?\d{4}", str(f))

    def test_no_html_comments_in_site(self):
        for f in SITE.rglob("*.html"):
            self.assertNotIn("<!--", f.read_text(encoding="utf-8"), str(f))

    def test_off_the_record_path_free(self):
        self.assertFalse((SITE / "off-the-record").exists())


if __name__ == "__main__":
    unittest.main()

import re
import unittest

from support import SITE


class Vendor(unittest.TestCase):
    def test_font_faces_are_local(self):
        css = (SITE / "assets/css/fonts.css").read_text(encoding="utf-8")
        for fam in ["Jost", "Noto Serif KR", "Big Shoulders Display"]:
            self.assertIn(f"font-family: '{fam}'", css)
        urls = re.findall(r"url\(([^)]+)\)", css)
        self.assertTrue(urls)
        for u in urls:
            self.assertTrue(u.startswith("/assets/fonts/"), u)
            self.assertTrue((SITE / u.lstrip("/")).is_file(), u)
        self.assertTrue((SITE / "assets/fonts/OFL.txt").is_file())

    def test_jost_is_small(self):
        total = sum(f.stat().st_size for f in (SITE / "assets/fonts").glob("jost-*.woff2"))
        self.assertLessEqual(total, 120_000)

    def test_three_patched_once(self):
        lib = SITE / "assets/lib/three-r160"
        room = (lib / "RoomEnvironment.js").read_text(encoding="utf-8")
        self.assertNotIn("from 'three'", room)
        self.assertIn("from './three.module.min.js'", room)
        three = (lib / "three.module.min.js").read_text(encoding="utf-8")
        self.assertIn('const t="160"', three[:200])
        self.assertIn("t as REVISION", three)
        self.assertTrue((lib / "LICENSE").is_file() and (lib / "MODIFIED.md").is_file())


if __name__ == "__main__":
    unittest.main()

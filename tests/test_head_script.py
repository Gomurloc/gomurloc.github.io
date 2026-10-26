import re
import unittest

from support import SITE


class HeadScript(unittest.TestCase):
    def test_identical_and_first(self):
        scripts = []
        for f in [SITE / "index.html", SITE / "en/index.html"]:
            raw = f.read_text(encoding="utf-8")
            head = raw.split("</head>")[0]
            m = re.search(r"<script>(.*?)</script>", head, re.S)
            self.assertTrue(m, f)
            self.assertLess(head.index("<script>"), head.index("stylesheet"), f)
            scripts.append(m.group(1))
        self.assertEqual(scripts[0], scripts[1])
        for s in ["ko:intro", "nointro", "nowebgl", "reducemotion", "location.hash", "4000"]:
            self.assertIn(s, scripts[0])


if __name__ == "__main__":
    unittest.main()

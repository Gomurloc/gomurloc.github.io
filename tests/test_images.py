import sys
import unittest

from PIL import Image

from support import ROOT, SITE

sys.path.insert(0, str(ROOT / "tools"))
import build_images  # noqa: E402

IMG = SITE / "assets/img"
EXPECTED = {  # name: (width, height or None to keep ratio)
    "fsg-hero-1920.webp": (1920, 1080), "otr-hero-1920.webp": (1920, 1080),
    "fsg-tile-640.webp": (640, 360), "otr-tile-640.webp": (640, 360),
    "otr-shot-1-800.webp": (800, None), "og.jpg": (1200, 630),
    "favicon-32.png": (32, 32), "apple-touch-icon.png": (180, 180), "icon-512.png": (512, 512),
    "hero-1920.webp": (1920, 1080),
    "fsg-poster-900.webp": (900, 1200), "fsg-poster-600.webp": (600, 800),
    "otr-poster-900.webp": (900, 1200), "otr-poster-600.webp": (600, 800),
    "fsg-pop.webp": (1371, 598), "hanji-grain.webp": (384, 384),
}


class Images(unittest.TestCase):
    def test_expected_sizes(self):
        for name, (w, h) in EXPECTED.items():
            with Image.open(IMG / name) as im:
                self.assertEqual(im.width, w, name)
                if h:
                    self.assertEqual(im.height, h, name)

    def test_size_caps(self):
        self.assertLessEqual((IMG / "hero-1920.webp").stat().st_size, 250_000)
        if (IMG / "hero-2880.webp").exists():
            self.assertLessEqual((IMG / "hero-2880.webp").stat().st_size, 450_000)
        for f in IMG.iterdir():
            self.assertLessEqual(f.stat().st_size, 450_000, f.name)

    def test_stage_caps(self):
        caps = {"fsg-poster-900.webp": 130_000, "fsg-poster-600.webp": 130_000,
                "otr-poster-900.webp": 130_000, "otr-poster-600.webp": 130_000,
                "fsg-pop.webp": 100_000, "hanji-grain.webp": 70_000}
        for name, cap in caps.items():
            self.assertLessEqual((IMG / name).stat().st_size, cap, name)

    def test_pop_box(self):
        self.assertEqual(build_images.POP_BOX, (291, 102, 1662, 700))
        left, top, right, bottom = build_images.POP_BOX
        for name in ["fsg-pop.webp", "hanji-grain.webp"]:
            with Image.open(IMG / name) as im:
                self.assertEqual(im.mode, "RGBA", name)
        with Image.open(IMG / "fsg-pop.webp") as im:
            self.assertEqual(im.size, (right - left, bottom - top))

    def test_logo_has_alpha(self):
        with Image.open(IMG / "fsg-logo-680.webp") as im:
            self.assertEqual(im.mode, "RGBA")
            self.assertEqual(im.getpixel((0, 0))[3], 0)

    def test_ko_mark_geometry(self):
        svg = (IMG / "ko-mark.svg").read_text(encoding="utf-8")
        self.assertIn('viewBox="382 155 176 70"', svg)
        self.assertIn("#ebe5d8", svg)


if __name__ == "__main__":
    unittest.main()

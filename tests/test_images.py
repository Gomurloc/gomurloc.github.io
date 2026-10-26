import unittest

from PIL import Image

from support import SITE

IMG = SITE / "assets/img"
EXPECTED = {  # name: (width, height or None to keep ratio)
    "fsg-hero-1920.webp": (1920, 1080), "otr-hero-1920.webp": (1920, 1080),
    "fsg-tile-640.webp": (640, 360), "otr-tile-640.webp": (640, 360),
    "otr-shot-1-800.webp": (800, None), "og.jpg": (1200, 630),
    "favicon-32.png": (32, 32), "apple-touch-icon.png": (180, 180), "icon-512.png": (512, 512),
    "hero-1920.webp": (1920, 1080),
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

"""Local dev server.

/              -> site/
/__tests__/    -> tests/browser/
/__tools__/    -> tools/
POST /__save__/<name>.png -> .cache/render/<name>.png
POST /__results__/<suite> -> .cache/results/<suite>.txt (browser test results)
"""
import argparse
import re
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
MOUNTS = [("/__tests__/", ROOT / "tests" / "browser"), ("/__tools__/", ROOT / "tools")]
SITE = ROOT / "site"
RENDER = ROOT / ".cache" / "render"
RESULTS = ROOT / ".cache" / "results"
SAVE_NAME = re.compile(r"^[a-z0-9-]+\.png$")


class Handler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".webp": "image/webp",
        ".woff2": "font/woff2",
        ".svg": "image/svg+xml",
    }

    def translate_path(self, path):
        path = unquote(urlsplit(path).path)
        base, rest = SITE, path
        for prefix, folder in MOUNTS:
            if path.startswith(prefix):
                base, rest = folder, path[len(prefix) - 1:]
                break
        target = (base / rest.lstrip("/")).resolve()
        if base.resolve() not in (target, *target.parents):
            return str(base / "__forbidden__")
        return str(target)

    def send_head(self):
        path = Path(self.translate_path(self.path))
        if path.is_dir() and (path / "index.html").is_file():
            if not self.path.split("?")[0].endswith("/"):
                return super().send_head()
            path = path / "index.html"
        if not path.exists():
            body = (SITE / "404.html").read_bytes()
            self.send_response(404)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return None
        return super().send_head()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def _bad_path(self):
        # Backslashes and drive colons would let Windows path joins escape the served folders (or reach UNC shares).
        path = unquote(urlsplit(self.path).path)
        if "\\" in path or ":" in path:
            self.send_error(400)
            return True
        return False

    def do_GET(self):
        if not self._bad_path():
            super().do_GET()

    def do_HEAD(self):
        if not self._bad_path():
            super().do_HEAD()

    def do_POST(self):
        # A custom header can't be sent cross-site without a CORS preflight, which this server never grants,
        # so other web pages open in the same browser can't write into .cache/.
        if self.headers.get("X-KO-Dev") != "1":
            self.send_error(403)
            return
        path = unquote(urlsplit(self.path).path)
        if path.startswith("/__results__/"):
            name = path[len("/__results__/"):]
            if not re.match(r"^[a-z0-9-]+$", name):
                self.send_error(400)
                return
            length = int(self.headers.get("Content-Length", "0"))
            RESULTS.mkdir(parents=True, exist_ok=True)
            (RESULTS / f"{name}.txt").write_bytes(self.rfile.read(length))
            self.send_response(204)
            self.end_headers()
            return
        if not path.startswith("/__save__/"):
            self.send_error(405)
            return
        name = path[len("/__save__/"):]
        if not SAVE_NAME.match(name):
            self.send_error(400)
            return
        length = int(self.headers.get("Content-Length", "0"))
        RENDER.mkdir(parents=True, exist_ok=True)
        (RENDER / name).write_bytes(self.rfile.read(length))
        self.send_response(204)
        self.end_headers()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8080)
    args = parser.parse_args()
    server = ThreadingHTTPServer(("127.0.0.1", args.port), partial(Handler, directory=str(SITE)))
    print(f"Serving http://127.0.0.1:{args.port}/", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()

import http.client
import sys
import threading
import unittest
from functools import partial
from http.server import ThreadingHTTPServer

from support import ROOT

sys.path.insert(0, str(ROOT / "tools"))
import serve  # noqa: E402


class Serve(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.srv = ThreadingHTTPServer(("127.0.0.1", 0), partial(serve.Handler, directory=str(serve.SITE)))
        cls.port = cls.srv.server_address[1]
        threading.Thread(target=cls.srv.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.srv.shutdown()

    def req(self, method, path, headers=None, body=b""):
        c = http.client.HTTPConnection("127.0.0.1", self.port, timeout=5)
        c.request(method, path, body=body, headers=headers or {})
        r = c.getresponse()
        r.read()
        c.close()
        return r.status

    def test_post_requires_dev_header(self):
        self.assertEqual(self.req("POST", "/__results__/serve-test", body=b"x"), 403)
        self.assertEqual(self.req("POST", "/__save__/serve-test.png", body=b"x"), 403)
        self.assertEqual(self.req("POST", "/__results__/serve-test", {"X-KO-Dev": "1"}, b"x"), 204)

    def test_backslash_and_drive_paths_rejected(self):
        self.assertEqual(self.req("GET", "/%5C%5Cexample.invalid%5Cshare"), 400)
        self.assertEqual(self.req("GET", "/C:/Windows/win.ini"), 400)

    def test_site_still_served(self):
        self.assertEqual(self.req("GET", "/"), 200)
        self.assertEqual(self.req("GET", "/__tests__/harness.js"), 200)


if __name__ == "__main__":
    unittest.main()

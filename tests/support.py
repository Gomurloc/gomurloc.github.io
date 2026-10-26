"""Small HTML parsing helpers for the static site tests (stdlib only)."""
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}
HIDDEN_TEXT = {"script", "style", "template"}


class El:
    def __init__(self, tag, attrs, parent):
        self.tag = tag
        self.attrs = {k: (v if v is not None else "") for k, v in attrs}
        self.parent = parent
        self.children = []
        self.parts = []

    @property
    def text(self):
        out = []
        for part in self.parts:
            if isinstance(part, El):
                if part.tag not in HIDDEN_TEXT:
                    out.append(part.text)
            else:
                out.append(part)
        return "".join(out)

    def iter(self):
        for child in self.children:
            yield child
            yield from child.iter()

    def select(self, tag=None, **attrs):
        return [e for e in self.iter() if _match(e, tag, attrs)]


def _match(el, tag, attrs):
    if tag and el.tag != tag:
        return False
    for key, want in attrs.items():
        if key == "class_":
            if want not in el.attrs.get("class", "").split():
                return False
            continue
        key = key.replace("_", "-") if key not in el.attrs else key
        if key not in el.attrs or (want != "" and el.attrs[key] != want):
            return False
    return True


class _Builder(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = El("#root", [], None)
        self.cur = self.root

    def handle_starttag(self, tag, attrs):
        el = El(tag, attrs, self.cur)
        self.cur.children.append(el)
        self.cur.parts.append(el)
        if tag not in VOID:
            self.cur = el

    def handle_startendtag(self, tag, attrs):
        el = El(tag, attrs, self.cur)
        self.cur.children.append(el)
        self.cur.parts.append(el)

    def handle_endtag(self, tag):
        node = self.cur
        while node is not self.root and node.tag != tag:
            node = node.parent
        if node is not self.root:
            self.cur = node.parent

    def handle_data(self, data):
        self.cur.parts.append(data)


class Page:
    def __init__(self, raw):
        self.raw = raw
        builder = _Builder()
        builder.feed(raw)
        builder.close()
        self.root = builder.root

    def select(self, tag=None, **attrs):
        return self.root.select(tag, **attrs)

    def by_id(self, ident):
        found = self.root.select(id=ident)
        return found[0] if found else None

    @property
    def text(self):
        return self.root.text


def parse(path):
    return Page(Path(path).read_text(encoding="utf-8"))

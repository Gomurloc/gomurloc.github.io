# KO Studio 웹사이트 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 설계 문서대로 kostudio.org 정적 사이트(한국어 `/`, 영어 `/en/`)를 만들고, GitHub Pages에 배포해 도메인을 연결한다.

**Architecture:** 빌드 도구 없이 손으로 쓴 HTML/CSS/ES 모듈을 `site/`에 두고 GitHub Actions로 그 폴더만 배포한다. 첫 방문 인트로는 스플래시 v9를 옮긴 `intro.js`(three.js r160 복사본)가 그리고, 끝 프레임과 같은 정지 이미지로 교차 페이드한다. 이미지·글꼴·라이브러리는 `tools/`의 Python 스크립트로 한 번 만들어 커밋한다.

**Tech Stack:** HTML, CSS, JavaScript ES 모듈, three.js r160, Python 3 + Pillow (도구·정적 테스트), 앱 안 브라우저 (동작 테스트)

**Spec:** `docs/superpowers/specs/2026-10-26-kostudio-site-design.md` — 각 작업의 "스펙 §"는 이 문서의 절이다. 문구·값은 스펙이 기준이다.

## Global Constraints

- 배포되는 파일은 손으로 쓴 HTML, CSS, 순수 JavaScript(ES 모듈)뿐이다. 빌드 도구, npm, 번들러를 쓰지 않는다.
- 실행 중 외부 서버에 요청하지 않는다. 글꼴과 three.js는 `site/assets/` 안에서 제공한다.
- three.js는 정확히 r160 (`three@0.160.0`). import map을 쓰지 않는다.
- 경로 이름은 영문 소문자와 하이픈만. `site/off-the-record/`는 절대 만들지 않는다.
- 한국어 문장은 합쇼체(`-습니다`). 한 줄 소개 같은 짧은 문구는 명사형·표어형.
- 사이트에 팀 이름 "삼유스튜디오"/"3U Studio"를 쓰지 않는다. 팀원 크레딧은 스펙 §4.6 그대로.
- 연락처는 `ko@kostudio.org` 하나. 전화번호, 개인 메일, 개인 SNS를 넣지 않는다.
- 저장소는 공개된다. 미공개 게임 이름, 팀원 내부 일정, 비공개 저장소 이름, 명함 생성기(`card/`, 전화번호 포함)를 커밋하지 않는다. 배포되는 HTML에는 주석(`<!--`)을 남기지 않는다.
- `C:/Users/user/Documents/GitHub/rhythm-prototype`는 읽기만 한다. fetch, pull, checkout, 파일 쓰기 금지.
- 공통 토큰(스펙 §3.1): `--bg #0b0b0c`, `--panel #141416`, `--line #2a292e`, `--text #e9e4da`, `--muted #8a857c`, `--red #c41e2a`, `--red-line #8f1220`, `--blood #7a0d18`, `--warm #1b1917`. `--red`는 글자색으로 쓰지 않는다.
- 게임 토큰(스펙 §3.2): FeelSoGut! 배경 `#0D0E38`, 강조 `#FF0099`, 보조 `#21D3ED`. OFF THE RECORD 배경 `#06070A`, 강조 `#D9A521`, 보조 `#2E9C97`.
- JavaScript가 꺼져도 모든 정보와 링크가 보인다.
- 예산(스펙 §6.5): 첫 화면 400KB 이하(인트로·글꼴 제외), 첫 화면 글꼴 300KB 이하, 인트로 추가분 약 190KB gzip, 히어로 1920 폭 250KB 이하, 2880 폭 450KB 이하(넘으면 2880을 뺀다), 저장소 200MB 이하.
- DNS와 GitHub Pages 설정 변경은 사용자가 직접 하거나 사용자가 화면을 보며 승인할 때만 한다. push도 사용자 확인 후에만 한다.

## Review Focus

1. **인트로 도중 휴대폰을 돌리거나 창 크기를 바꿈** → 캔버스 버퍼와 화각이 새 크기를 따라가고, 끝난 뒤 히어로와 어긋나지 않아야 한다. (Task 7 `resize mid-intro` 테스트)
2. **인트로 도중 다른 페이지로 갔다가 뒤로 가기(bfcache 복원)** → 검은 인트로 화면에 갇히지 않고 정지 히어로가 보여야 한다. (Task 8 `pageshow persisted` 테스트)
3. **메뉴·타일로 섹션 이동** → 섹션 제목이 고정 헤더 밑에 가려지지 않아야 한다. (Task 6 `scroll-margin` 테스트)
4. **한국어 페이지에서 인트로를 본 뒤 EN으로 전환** → 같은 세션에서 인트로가 다시 나오지 않아야 한다. (Task 8 `ko then en` 테스트)
5. **360px 화면의 한국어 문장** → 낱말 중간에서 줄이 바뀌지 않아야 한다(`word-break: keep-all`). (Task 4 `keep-all` 테스트)

---

## 파일 구조

| 경로 | 책임 |
|---|---|
| `site/index.html`, `site/en/index.html` | 한국어·영어 페이지. 같은 구조, 같은 머리 스크립트 |
| `site/404.html`, `site/robots.txt` | 없는 주소 안내, 크롤러 설정 |
| `site/assets/css/site.css` | 토큰, 레이아웃, 섹션, 인트로 레이어, 비네트 |
| `site/assets/css/fonts.css` | 직접 제공하는 `@font-face` (도구가 생성) |
| `site/assets/js/main.js` | 진입점: 아래 모듈들을 초기화만 한다 |
| `site/assets/js/menu.js` | 타이틀 메뉴 방향키 |
| `site/assets/js/header.js` | 고정 헤더 표시 |
| `site/assets/js/lightbox.js` | 스크린샷 확대 보기 |
| `site/assets/js/intro-run.js` | 인트로 실행·건너뛰기·소리·교차 페이드·대체 동작 |
| `site/assets/js/intro/intro.js` | 스플래시 v9 포팅 (장면, 시계, 소리) |
| `site/assets/lib/three-r160/` | three.js 복사본 + LICENSE + MODIFIED.md |
| `site/assets/fonts/` | woff2 조각 + OFL.txt |
| `site/assets/img/` | WebP, 파비콘, OG 이미지, K·O 마크 |
| `brand/` | 사용자 브랜드 원본 일부 (로고 PNG, 스플래시 HTML). 배포 안 됨 |
| `tools/serve.py` | 개발 서버: `site/`를 `/`로, `tests/browser/`를 `/__tests__/`로, 렌더 결과 저장용 POST |
| `tools/fetch_vendor.py` | 글꼴·three.js 내려받기와 패치 |
| `tools/build_images.py` | 게임·브랜드 이미지 합성·변환 |
| `tools/render-hero.html` | `intro.js`로 `T_LOGO` 프레임을 렌더해 서버에 저장 |
| `tests/support.py`, `tests/test_*.py` | 정적 테스트 (Python unittest) |
| `tests/browser/harness.js`, `tests/browser/*.html`, `*.test.js` | 동작 테스트 (브라우저에서 실행) |
| `.github/workflows/pages.yml` | `site/`만 Pages로 배포 |

**테스트 실행 방법 (모든 작업 공통).**
- 정적: `python -m unittest discover -s tests -p "test_*.py" -v` → 마지막 줄 `OK`.
- 동작: 개발 서버(`python tools/serve.py --port 8080`, `.claude/launch.json`의 `kostudio-dev`)를 띄우고 앱 안 브라우저로 `http://localhost:8080/__tests__/<suite>.html`을 연다. 문서 제목이 `PASS` 또는 `FAIL`이 될 때까지 기다린 뒤 `#results` 텍스트를 읽는다. 기대값: 제목 `PASS`, 마지막 줄 `RESULT: PASS n/n`.

---

### Task 1: 뼈대, 개발 서버, 테스트 도구, 배포 워크플로

**Files:**
- Create: `.gitignore`, `.claude/launch.json`, `tools/serve.py`, `tests/support.py`, `tests/test_scaffold.py`, `tests/browser/harness.js`, `tests/browser/smoke.html`, `tests/browser/smoke.test.js`, `.github/workflows/pages.yml`, `site/index.html`, `site/en/index.html`, `site/404.html`, `site/robots.txt`, `brand/` (아래 복사)

**Interfaces:**
- Produces:
  - `tools/serve.py --port N`: `127.0.0.1`에만 바인딩. `GET /…` → `site/…`, `GET /__tests__/…` → `tests/browser/…`, `GET /__tools__/…` → `tools/…`. `POST /__save__/<name>` → 본문을 `.cache/render/<name>`에 저장 (`name`은 `[a-z0-9-]+\.png`만 허용, 아니면 400). 그 밖의 POST는 405. 디렉터리 경로는 `index.html`, 없는 경로는 `site/404.html`을 404로.
  - `tests/support.py`: `SITE: Path`, `ROOT: Path`, `parse(path: Path) -> Page`. `Page.select(tag: str | None = None, **attrs) -> list[El]` (속성값 일치, `class_`는 클래스 포함 여부), `Page.by_id(id) -> El | None`, `Page.text: str` (script/style 제외 보이는 글자), `Page.raw: str`. `El.tag`, `El.attrs: dict`, `El.text: str`.
  - `tests/browser/harness.js` (ES 모듈): `test(name, fn, { timeout = 5000 } = {})`, `assert(cond, msg)`, `assertEq(actual, expected, msg)`, `assertClose(a, b, eps, msg)`, `openPage(url, { width = 1280, height = 800 } = {}) -> Promise<{ win, doc, frame, close() }>` (같은 출처 iframe, `load` 후 resolve), `openHtml(html, { width, height }) -> Promise<{ win, doc, frame, close() }>` (같은 것을 `srcdoc`으로. 상대·절대 경로는 테스트 페이지 기준으로 풀린다), `wait(ms)`, `waitFor(predicate, timeout) -> Promise`, `run()` (순서대로 실행, `#results`에 줄마다 `PASS name`/`FAIL name: message`, 마지막 줄 `RESULT: PASS n/n` 또는 `RESULT: FAIL k/n`, `document.title`을 `PASS`/`FAIL`로).

- [ ] **Step 1: 브랜드 원본을 `brand/`에 복사**

`C:/Users/user/Downloads/KO_Studio-20261026T053426Z-1-001.zip`에서 `logo/` 4개 파일과 `splash/KO-studio_splash.html`만 `brand/logo/`, `brand/splash/`로 꺼낸다. `card/`, `video/`, `splash/이전 버전/`은 꺼내지 않는다.
Run: `ls brand/logo brand/splash` → 파일 5개, `card` 없음.

- [ ] **Step 2: 실패하는 정적 테스트 작성** — `tests/test_scaffold.py`

```python
class Scaffold(unittest.TestCase):
    def test_pages_exist(self):
        for p in ["index.html", "en/index.html", "404.html", "robots.txt"]:
            self.assertTrue((SITE / p).is_file(), p)
    def test_lang_and_hreflang(self):
        ko, en = parse(SITE/"index.html"), parse(SITE/"en/index.html")
        self.assertEqual(ko.select("html")[0].attrs["lang"], "ko")
        self.assertEqual(en.select("html")[0].attrs["lang"], "en")
        for page in (ko, en):
            alts = {l.attrs["hreflang"]: l.attrs["href"] for l in page.select("link", rel="alternate")}
            self.assertEqual(alts, {"ko": "https://kostudio.org/", "en": "https://kostudio.org/en/"})
    def test_workflow_deploys_site_only(self):
        wf = (ROOT/".github/workflows/pages.yml").read_text(encoding="utf-8")
        self.assertIn("path: ./site", wf)
        self.assertRegex(wf, r"branches:\s*\[\s*main\s*\]")
        self.assertIn("actions/deploy-pages", wf)
    def test_no_card_or_phone_committed(self):
        self.assertFalse((ROOT/"brand/card").exists())
        for f in ROOT.rglob("*"):
            if f.is_file() and f.suffix in {".html", ".js", ".css", ".md", ".py", ".txt"} and ".git" not in f.parts:
                self.assertNotRegex(f.read_text(encoding="utf-8", errors="ignore"), r"010[ -]?\d{4}[ -]?\d{4}", str(f))
    def test_no_html_comments_in_site(self):
        for f in SITE.rglob("*.html"):
            self.assertNotIn("<!--", f.read_text(encoding="utf-8"), str(f))
    def test_off_the_record_path_free(self):
        self.assertFalse((SITE/"off-the-record").exists())
```

- [ ] **Step 3: 실행해서 실패 확인** — Run: 정적 테스트. Expected: `FAILED` (파일 없음).

- [ ] **Step 4: 구현**
  - `site/index.html`, `site/en/index.html`: `<!doctype html>`, `lang`, `<meta charset>`, viewport, `<title>KO Studio</title>`, canonical, 위 hreflang 두 줄, `<main>` 비어 있음. (내용은 Task 4·5)
  - `site/404.html`: 최소 골격 (내용은 Task 5). `site/robots.txt`: `User-agent: *` / `Allow: /`.
  - `.github/workflows/pages.yml`:

```yaml
name: Deploy site to Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: false
jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./site
      - id: deployment
        uses: actions/deploy-pages@v4
```
  - `tools/serve.py`, `tests/support.py`, `tests/browser/harness.js`: Interfaces 그대로. 서버는 `http.server.ThreadingHTTPServer` + `SimpleHTTPRequestHandler` 하위 클래스(`translate_path`로 접두어별 루트 선택). `.mjs`/`.js`는 `text/javascript`, `.webp`는 `image/webp`로 응답.
  - `.claude/launch.json`: 이름 `kostudio-dev`, `python tools/serve.py --port 8080`, port 8080.
  - `.gitignore`: `.cache/`, `__pycache__/`, `.claude/`.
  - `tests/browser/smoke.html` + `smoke.test.js`: `openPage('/')`로 열어 `doc.documentElement.lang === 'ko'`, `openPage('/en/')` → `'en'`, `fetch('/nope')` → `status === 404`.

- [ ] **Step 5: 테스트 통과 확인** — 정적 테스트 `OK`. 개발 서버를 띄우고 `/__tests__/smoke.html` → `RESULT: PASS 3/3`. `curl -s -o NUL -w "%{http_code}" -X POST http://127.0.0.1:8080/__save__/../x.png` → `400`.

- [ ] **Step 6: Commit** — `git add .gitignore tools tests .github site brand && git commit -m "chore: scaffold site, dev server, test harness, Pages workflow"`

---

### Task 2: 글꼴과 three.js 복사본

**Files:**
- Create: `tools/fetch_vendor.py`, `site/assets/css/fonts.css`, `site/assets/fonts/*.woff2`, `site/assets/fonts/OFL.txt`, `site/assets/lib/three-r160/{three.module.min.js,RoomEnvironment.js,LICENSE,MODIFIED.md}`, `tests/test_vendor.py`

**Interfaces:**
- Produces: `/assets/css/fonts.css` (가족 이름 `Jost` 400/500, `Noto Serif KR` 500, `Big Shoulders Display` 900, 모두 `font-display: swap`). `/assets/lib/three-r160/three.module.min.js`, `/assets/lib/three-r160/RoomEnvironment.js` (같은 폴더의 three를 import).

- [ ] **Step 1: 실패하는 테스트 작성** — `tests/test_vendor.py`

```python
class Vendor(unittest.TestCase):
    def test_font_faces_are_local(self):
        css = (SITE/"assets/css/fonts.css").read_text(encoding="utf-8")
        for fam in ["Jost", "Noto Serif KR", "Big Shoulders Display"]:
            self.assertIn(f"font-family: '{fam}'", css)
        urls = re.findall(r"url\(([^)]+)\)", css)
        self.assertTrue(urls)
        for u in urls:
            self.assertTrue(u.startswith("/assets/fonts/"), u)
            self.assertTrue((SITE / u.lstrip("/")).is_file(), u)
        self.assertTrue((SITE/"assets/fonts/OFL.txt").is_file())
    def test_jost_is_small(self):
        total = sum(f.stat().st_size for f in (SITE/"assets/fonts").glob("jost-*.woff2"))
        self.assertLessEqual(total, 120_000)
    def test_three_patched_once(self):
        lib = SITE/"assets/lib/three-r160"
        room = (lib/"RoomEnvironment.js").read_text(encoding="utf-8")
        self.assertNotIn("from 'three'", room)
        self.assertIn("from './three.module.min.js'", room)
        self.assertIn("REVISION = '160'", (lib/"three.module.min.js").read_text(encoding="utf-8"))
        self.assertTrue((lib/"LICENSE").is_file() and (lib/"MODIFIED.md").is_file())
```

- [ ] **Step 2: 실행해서 실패 확인** — Expected: `FAILED`.

- [ ] **Step 3: `tools/fetch_vendor.py` 구현**
  - 글꼴: `https://fonts.googleapis.com/css2?family=Jost:wght@400;500&family=Noto+Serif+KR:wght@500&family=Big+Shoulders+Display:wght@900&display=swap`를 최신 Chrome User-Agent로 요청해 woff2 `@font-face` 블록을 받는다. 블록마다 woff2를 `site/assets/fonts/<family-slug>-<weight>-<nn>.woff2`(예: `jost-400-03.woff2`, `noto-serif-kr-500-41.woff2`)로 저장하고 `url()`을 `/assets/fonts/...`로 바꿔 `fonts.css`를 쓴다. `unicode-range`는 그대로 둔다.
  - OFL: `https://raw.githubusercontent.com/google/fonts/main/ofl/{jost,notoserifkr,bigshouldersdisplay}/OFL.txt`를 이어 붙여 `OFL.txt`로.
  - three: `https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js`, `.../examples/jsm/environments/RoomEnvironment.js`, `.../LICENSE`를 받는다. `RoomEnvironment.js`의 `from 'three'`를 `from './three.module.min.js'`로 바꾼다. `MODIFIED.md`에 바꾼 한 줄과 이유(import map 없이 동작)를 적는다.
  - 다시 실행해도 같은 결과가 나오게(기존 파일 덮어쓰기).

- [ ] **Step 4: 실행 후 테스트 통과 확인** — `python tools/fetch_vendor.py` → 정적 테스트 `OK`.

- [ ] **Step 5: Commit** — `git commit -m "chore: self-host fonts and vendor three.js r160"`

---

### Task 3: 이미지 파이프라인

**Files:**
- Create: `tools/build_images.py`, `site/assets/img/*`, `tests/test_images.py`

**Interfaces:**
- Produces (모두 `/assets/img/`): 
  - `fsg-hero-{1920,1280,960}.webp`, `fsg-shot-{1,2,3}-{1920,960}.webp`, `fsg-tile-{960,640}.webp`, `fsg-logo-{680,340}.webp` (투명)
  - `otr-hero-{1920,1280,960}.webp`, `otr-shot-1-800.webp`, `otr-shot-2-800.webp`, `otr-shot-{3,4}-{1600,960}.webp`, `otr-tile-{960,640}.webp`
  - `hero-{1920,2880}.webp` (임시: `brand/logo/KO-studio_logo_3840x2160.png`에서. Task 9에서 실제 렌더로 교체)
  - `ko-mark.svg`, `ko-dot-64.png`, `favicon-32.png`, `apple-touch-icon.png` (180), `icon-512.png`, `og.jpg` (1200×630)
- `python tools/build_images.py [--only fsg|otr|brand|hero]`

- [ ] **Step 1: 실패하는 테스트 작성** — `tests/test_images.py`

```python
EXPECTED = {  # 이름: (폭, 높이 또는 None=비율 유지)
    "fsg-hero-1920.webp": (1920, 1080), "otr-hero-1920.webp": (1920, 1080),
    "fsg-tile-640.webp": (640, 360), "otr-tile-640.webp": (640, 360),
    "otr-shot-1-800.webp": (800, None), "og.jpg": (1200, 630),
    "favicon-32.png": (32, 32), "apple-touch-icon.png": (180, 180), "icon-512.png": (512, 512),
    "hero-1920.webp": (1920, 1080),
}
class Images(unittest.TestCase):
    def test_expected_sizes(self):
        for name, (w, h) in EXPECTED.items():
            with Image.open(SITE/"assets/img"/name) as im:
                self.assertEqual(im.width, w, name)
                if h: self.assertEqual(im.height, h, name)
    def test_size_caps(self):
        img = SITE/"assets/img"
        self.assertLessEqual((img/"hero-1920.webp").stat().st_size, 250_000)
        if (img/"hero-2880.webp").exists():
            self.assertLessEqual((img/"hero-2880.webp").stat().st_size, 450_000)
        for f in img.iterdir():
            self.assertLessEqual(f.stat().st_size, 450_000, f.name)
    def test_logo_has_alpha(self):
        with Image.open(SITE/"assets/img/fsg-logo-680.webp") as im:
            self.assertEqual(im.mode, "RGBA")
            self.assertEqual(im.getpixel((0, 0))[3], 0)
    def test_ko_mark_geometry(self):
        svg = (SITE/"assets/img/ko-mark.svg").read_text(encoding="utf-8")
        self.assertIn('viewBox="382 155 176 70"', svg)
        self.assertIn("#ebe5d8", svg)
```

- [ ] **Step 2: 실행해서 실패 확인** — Expected: `FAILED`.

- [ ] **Step 3: `tools/build_images.py` 구현**
  - **FeelSoGut!** 원본 루트 `FSG = C:/Users/user/Documents/GitHub/rhythm-prototype/Assets` (환경 변수 `FSG_ROOT`로 바꿀 수 있게). 읽기만 한다.
    - 레이어 순서와 위치는 각 씬 파일(`Assets/Scenes/Stage1_5IntroScene.unity`, `Stage1_2IntroScene.unity`, `Stage1_4IntroScene.unity`, `StartScene.unity`)에서 SpriteRenderer의 `m_SortingOrder`와 Transform 위치로 정한다. 같은 크기·같은 원점인 전체 화면 레이어면 sortingOrder 순으로 (0,0)에 겹친다. 제목 레이어(`*타이틀*`)는 뺀다.
    - `fsg-hero`: 1-5 (`리믹스1 배경`, `리믹스1 바다`, `리믹스1 광대`, `리믹스1잭두`). `fsg-tile`: 같은 그림 16:9.
    - `fsg-shot-1`: 1-2 인트로 (배경, 배경바닥, 인트로광대, 말풍선1·2). `fsg-shot-2`: 1-4 인트로 (배경, 바닥, 손, 광대, 잭두, 풍선 2개). `fsg-shot-3`: 시작 화면 (`Assets/1-2/1-2배경.png`를 1920×1080 cover로, 그 위에 `Assets/시작/시작_타이틀.png`).
    - `fsg-logo`: `Assets/시작/시작_타이틀.png`의 불투명 영역(약 x620–1299, y83–591)을 잘라 투명 WebP로.
    - 2752×1536 원본은 1920×1080으로 cover 리사이즈(가로 0.8% 잘림).
  - **OFF THE RECORD**: `https://raw.githubusercontent.com/Gomurloc/off-the-record/main/이미지/웹/<파일>`(경로는 URL 인코딩)을 `.cache/otr/`에 받는다. `otr-hero`←`타이틀_글자없음.jpg`, `otr-shot-1`←`플레이_정거장.jpg`, `otr-shot-2`←`플레이_오프닝.jpg`, `otr-shot-3`←`인트로2.jpg`, `otr-shot-4`←`인트로3.jpg`, `otr-tile`←`인트로4.jpg`. 원본보다 크게 늘리지 않는다.
  - **브랜드**: `ko-mark.svg`는 손으로 쓴 SVG를 그대로 복사한다 (`viewBox="382 155 176 70"`, 채움 `#ebe5d8`, `rect x=382 y=155 w=14 h=70`, 다각형 `396,182 396,198 444,171 444,155`와 `396,182 396,198 444,225 444,209`, 중심 (523,190) 반지름 35/21 고리를 `fill-rule="evenodd"` 경로로, 핏방울은 `<image href="/assets/img/ko-dot-64.png" x=444 y=168 width=44 height=44>`). `ko-dot-64.png`는 `brand/logo/KO-studio_dot_blood.png`를 64px로. 파비콘·아이콘은 `KO-studio_icon_2048.png`에서. `og.jpg`는 `KO-studio_logo_3840x2160.png` 가운데를 1200×630으로.
  - **임시 히어로**: `KO-studio_logo_3840x2160.png`를 1920·2880 폭 WebP로.
  - WebP 품질은 82에서 시작해 크기 상한을 넘으면 5씩 내린다(최저 50).

- [ ] **Step 4: 실행, 테스트, 눈으로 확인**
  - `python tools/build_images.py` → 정적 테스트 `OK`.
  - 이미지 보기로 `fsg-hero-960.webp`, `fsg-shot-1-960.webp`, `fsg-shot-2-960.webp`, `fsg-shot-3-960.webp`를 연다. 기대: 1-5는 바다 위 대야의 광대와 절벽 위 개미 잭두, 제목 글자 없음. 레이어가 어긋나거나 순서가 틀려 보이면 씬 파일 값으로 고친다.
  - `rhythm-prototype`에서 `git status --short`가 작업 전과 같다 (변경 6개 그대로).

- [ ] **Step 5: Commit** — `git add tools/build_images.py site/assets/img tests/test_images.py && git commit -m "feat: game and brand images"`

---

### Task 4: 공통 스타일과 한국어 페이지

**Files:**
- Create: `site/assets/css/site.css`, `tests/test_page_ko.py`
- Modify: `site/index.html`

**Interfaces:**
- Produces (Task 5·6·8이 쓰는 마크업 계약):
  - `<html lang="ko">`의 `<head>`: 맨 앞 `<meta charset>` 다음에 머리 스크립트 자리(Task 8에서 채움, 지금은 없음), `fonts.css` → `site.css`, `<script type="module" src="/assets/js/main.js">`(Task 6에서 생성).
  - `<header class="site-header" data-header>`: `.ko-mark` 링크(`href="#top"`, `<img src="/assets/img/ko-mark.svg" alt="KO Studio">`), `nav` 안 `GAMES·STUDIO·CONTACT` 링크, 언어 링크 `a[data-lang]`.
  - `<main>`: `section#top.title`(배경 `<img class="hero" src="/assets/img/hero-1920.webp" srcset="… 1920w, … 2880w" sizes="max(100vw, 177.78vh)" alt="">`, `.vignette`, 숨김 `<h1>KO Studio</h1>`, `nav.title-menu` 안 `a[data-menu]` 3개(`#games`, `#studio`, `#contact`), 언어 링크), `section#games` (`h2` "SELECT A GAME", `a.tile` 2개 → `#game-feelsogut`, `#game-otr`), `section.game#game-feelsogut[data-game="feelsogut"]`, `section.game#game-otr[data-game="otr"]`, `section#studio`, `section#contact`.
  - 게임 섹션 안: `.game-media` 대표 이미지, 제목(FeelSoGut!은 `fsg-logo` 이미지 `alt="FeelSoGut!"`, OTR은 `h3.otr-title` 텍스트), `p.credit`, `p.tagline`, `ul.tags`, `p.desc`, (OTR만) `p.award`, `ul.shots` 안 `button[data-lightbox][data-full][data-alt]` + 썸네일 `img`, (OTR만) `a.external` → `/off-the-record/`.
  - `<dialog id="lightbox">` (안에 `img`와 닫기 버튼 `[data-close]`).
  - `#intro` 레이어 (`<body>`의 첫 자식, 기본 숨김): `.intro-stage`(마운트), `.vignette`, `button[data-skip]` "건너뛰기", `button[data-sound][aria-pressed="false"]` "소리 켜기".
  - `<head>` 메타: `<meta name="description">`(한 줄 스튜디오 소개), `og:title`, `og:description`, `og:image` = `https://kostudio.org/assets/img/og.jpg`, `og:url`, `theme-color` `#0b0b0c`, 파비콘(`favicon-32.png`, `apple-touch-icon.png`).
  - 게임 섹션과 타일의 모든 `<img>`는 `loading="lazy"`. 타이틀의 `.hero`만 즉시 로드.
  - `<footer>`: `© 2026 KO Studio · 게임 제목과 이미지의 저작권은 각 게임 제작진에게 있습니다`, `a.replay-intro[href="?intro"]` "인트로 다시 보기", 언어 링크.
  - CSS 클래스 상태: `html.intro`, `html.intro-handoff`, `html.no-replay`, `.site-header.is-visible` (규칙은 아래 Step 3).

- [ ] **Step 1: 실패하는 테스트 작성** — `tests/test_page_ko.py`

```python
KO = SITE/"index.html"
class PageKo(unittest.TestCase):
    def setUp(self): self.p = parse(KO)
    def test_sections_and_menu(self):
        for i in ["top", "games", "game-feelsogut", "game-otr", "studio", "contact", "lightbox", "intro"]:
            self.assertIsNotNone(self.p.by_id(i), i)
        self.assertEqual([a.attrs["href"] for a in self.p.select("a", **{"data-menu": ""})], ["#games", "#studio", "#contact"])
        self.assertEqual(len(self.p.select("a", class_="tile")), 2)
    def test_anchor_targets_exist(self):
        for a in self.p.select("a"):
            h = a.attrs.get("href", "")
            if h.startswith("#"): self.assertIsNotNone(self.p.by_id(h[1:]), h)
    def test_credits_exact(self):
        credits = [e.text.strip() for e in self.p.select("p", class_="credit")]
        self.assertEqual(credits, ["고유준 · 이유진 · 권유담", "고유준 기획·사운드 · 이유진 개발 · 권유담 아트"])
    def test_no_team_name(self):
        self.assertNotIn("삼유", self.p.raw); self.assertNotIn("3U", self.p.raw)
    def test_formal_tone(self):
        self.assertNotRegex(self.p.text, r"(어|아|해|에|이|예|와|봐)요[.!?\s]")
    def test_contact(self):
        a = self.p.by_id("contact").select("a", href="mailto:ko@kostudio.org")
        self.assertTrue(a); self.assertEqual(a[0].text.strip(), "ko@kostudio.org")
        self.assertIn("퍼블리싱, 협업, 채용·외주 제안 모두 메일로 받습니다.", self.p.text)
    def test_labels(self):
        for s in ["건너뛰기", "소리 켜기", "인트로 다시 보기", "SELECT A GAME", "GAMES", "STUDIO", "CONTACT"]:
            self.assertIn(s, self.p.text)
        self.assertIn("게임 제목과 이미지의 저작권은 각 게임 제작진에게 있습니다", self.p.text)
    def test_award_and_stages(self):
        self.assertIn("2026 미래 게임잼 최우수상", self.p.text)
        tiles = [t.text for t in self.p.select("a", class_="tile")]
        self.assertIn("알파", tiles[0]); self.assertIn("개발 중", tiles[1])
    def test_images_have_alt_and_exist(self):
        for img in self.p.select("img"):
            self.assertIn("alt", img.attrs)
            self.assertTrue((SITE / img.attrs["src"].lstrip("/")).is_file(), img.attrs["src"])
            for part in img.attrs.get("srcset", "").split(","):
                if part.strip(): self.assertTrue((SITE / part.split()[0].lstrip("/")).is_file(), part)
    def test_no_external_requests(self):
        for f in [KO, SITE/"assets/css/site.css"]:
            for u in re.findall(r"https?://[^\"')\s]+", f.read_text(encoding="utf-8")):
                self.assertTrue(u.startswith("https://kostudio.org"), u)
    def test_meta_and_lazy(self):
        self.assertEqual(self.p.select("meta", property="og:image")[0].attrs["content"], "https://kostudio.org/assets/img/og.jpg")
        self.assertTrue(self.p.select("meta", name="description"))
        for sec in ["game-feelsogut", "game-otr", "games"]:
            for img in self.p.by_id(sec).select("img"):
                self.assertEqual(img.attrs.get("loading"), "lazy", img.attrs["src"])
    def test_css_rules(self):
        css = (SITE/"assets/css/site.css").read_text(encoding="utf-8")
        for token in ["--bg: #0b0b0c", "--text: #e9e4da", "--red: #c41e2a", "--red-line: #8f1220"]:
            self.assertIn(token, css)
        self.assertIn("word-break: keep-all", css)            # Review Focus 5
        self.assertIn("scroll-margin-top", css)               # Review Focus 3
        self.assertIn("0.17 * max(100svh, 56.25vw)", css)
```

- [ ] **Step 2: 실행해서 실패 확인** — Expected: `FAILED`.

- [ ] **Step 3: `site/index.html`과 `site.css` 구현**
  - 문구는 스펙 그대로: 한 줄 소개·설명·태그·개발 단계(§5.1, §5.2), 크레딧(§4.6), 스튜디오 소개 한국어 두 문단(§5.3), 연락(§4.8), 라벨(§4.9 표). FeelSoGut! 대표·스크린샷 `alt`는 "스테이지 1-5 인트로 장면"처럼 실제 장면을 적는다 (게임 플레이 화면이라고 쓰지 않는다).
  - 고정 규칙(CSS):
    - 토큰 9개를 `:root`에, 게임 토큰을 `[data-game="feelsogut"]`, `[data-game="otr"]`의 `--g-bg`, `--g-accent`, `--g-accent-2`로.
    - 본문: Noto Serif KR, 라벨·메뉴: Jost, `.otr-title`: Big Shoulders Display 900 + 팀 페이지와 같은 스텐실(`background: linear-gradient(var(--g-bg), var(--g-bg)) 0 55%/100% 3px no-repeat`를 글자 `span`마다).
    - `:lang(ko) p, :lang(ko) h2, :lang(ko) h3 { word-break: keep-all; }`
    - `section[id] { scroll-margin-top: calc(var(--header-h) + 16px); }`, `--header-h: 56px`.
    - `.title { position: relative; height: 100svh; overflow: hidden; }`, `.hero { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }`.
    - `.title-menu { position:absolute; left:50%; transform:translateX(-50%); top: calc(50% + 0.17 * max(100svh, 56.25vw)); }`, 가로 한 줄 유지(`white-space: nowrap`).
    - 비네트(인트로와 히어로 공통, 16:9 기준 좌표): `.vignette { position:absolute; inset:0; pointer-events:none; --u: max(100vw / 1920, 100svh / 1080); background: radial-gradient(circle at 50% 50%, transparent calc(378 * var(--u)), rgba(0,0,0,.75) calc(1190.4 * var(--u))); }`
    - 메뉴 커서(CSS만): `a[data-menu]::before`에 작은 핏방울(`ko-dot-64.png` 배경, 8px). 기본으로 첫 링크만 보임: `.title-menu:not(:focus-within) a[data-menu]:first-child::before { opacity:1 }`, `a[data-menu]:focus-visible::before { opacity:1 }`, `@media (hover:hover) { .title-menu:hover a[data-menu]::before { opacity:0 } .title-menu a[data-menu]:hover::before { opacity:1 } }`. 보이기는 `opacity`로만 (visibility·display 안 씀).
    - 연락 주소의 `@`: `<span class="at">@</span>`, 뒤에 `.at::after`로 핏방울 장식(`aria-hidden` 의미의 장식, 글자는 그대로).
    - 인트로 상태: `#intro { display:none; position:fixed; inset:0; z-index:100; background:#000; transition: opacity .35s; }`, `html.intro #intro { display:block; }`, `html.intro { overflow:hidden; }`, `html.intro :is(.site-header, main, footer) { visibility:hidden; }`, `html.intro.intro-handoff main { visibility:visible; }`, `html.intro-handoff #intro { opacity:0; }`, `.intro-stage { position:absolute; top:0; left:0; width:100%; height:100svh; }`, `html.intro .title-menu { opacity:0; }`, `.title-menu { transition: opacity .4s; }`, `[data-skip]`은 왼쪽 아래, `[data-sound]`는 오른쪽 아래.
    - `html.no-replay .replay-intro { display:none; }`
    - 헤더: 기본 숨김(`transform: translateY(-100%)`), `.site-header.is-visible`이면 보임. 휴대폰(≤600px)에서 GAMES·STUDIO·CONTACT 숨기고 KO/EN과 메일 아이콘만.
    - 포커스: `:focus-visible { outline: 2px solid var(--red); outline-offset: 3px; }`
    - `prefers-reduced-motion: reduce`이면 `scroll-behavior: auto`, 나머지는 `html { scroll-behavior: smooth; }`.

- [ ] **Step 4: 테스트 통과와 화면 확인** — 정적 테스트 `OK`. 개발 서버에서 `/?nointro`를 390×844, 1280×800으로 열어 스크린샷: 타이틀 → 게임 선택 → 게임 섹션 2개 → 스튜디오 → 연락이 차례로 보이고 글자가 겹치지 않는다.

- [ ] **Step 5: Commit** — `git commit -m "feat: Korean page and site styles"`

---

### Task 5: 영어 페이지와 404

**Files:**
- Modify: `site/en/index.html`, `site/404.html`
- Create: `tests/test_page_en.py`

**Interfaces:**
- Consumes: Task 4의 마크업 계약과 클래스 (구조를 그대로 복제, 문구만 영어).

- [ ] **Step 1: 실패하는 테스트 작성** — `tests/test_page_en.py`

```python
class PageEn(unittest.TestCase):
    def setUp(self): self.p = parse(SITE/"en/index.html"); self.ko = parse(SITE/"index.html")
    def test_same_structure(self):
        ids = lambda pg: [e.attrs["id"] for e in pg.select() if "id" in e.attrs]
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
        p = parse(SITE/"404.html")
        for s in ["페이지를 찾을 수 없습니다", "Page not found", "홈으로 가기", "Back to home"]:
            self.assertIn(s, p.text)
        for e in p.select():
            for k in ("src", "href"):
                v = e.attrs.get(k, "")
                if v and not v.startswith(("#", "mailto:", "https://kostudio.org")):
                    self.assertTrue(v.startswith("/"), v)
```

- [ ] **Step 2: 실행해서 실패 확인** — Expected: `FAILED`.

- [ ] **Step 3: 구현** — `site/en/index.html`: Task 4 마크업을 복제하고 문구를 스펙의 EN 문구로(§5.1–5.3, §4.8, §4.9). 자원 경로는 모두 `/assets/...` 절대 경로. `site/404.html`: 먹색 배경, `ko-mark.svg`, 두 언어 제목과 `/` 링크.

- [ ] **Step 4: 테스트 통과 확인** — 정적 테스트 `OK`. `/en/?nointro`와 `/없는주소` 스크린샷 확인.

- [ ] **Step 5: Commit** — `git commit -m "feat: English page and 404"`

---

### Task 6: 메뉴 방향키, 고정 헤더, 스크린샷 확대

**Files:**
- Create: `site/assets/js/main.js`, `site/assets/js/menu.js`, `site/assets/js/header.js`, `site/assets/js/lightbox.js`, `tests/browser/ui.html`, `tests/browser/ui.test.js`

**Interfaces:**
- Produces:
  - `menu.js`: `export function initMenu(nav: HTMLElement): void` — `nav` 안 `a[data-menu]`에 포커스가 있을 때만 ←/→로 이전/다음 링크에 `focus()` (양끝에서 순환). 다른 키는 건드리지 않는다.
  - `header.js`: `export function initStickyHeader(header: HTMLElement, title: HTMLElement): void` — `IntersectionObserver`로 `title`이 화면에 없으면 `header.classList.add('is-visible')`, 있으면 제거.
  - `lightbox.js`: `export function initLightbox(root: Document, dialog: HTMLDialogElement): void` — `[data-lightbox]` 클릭 → `img.src = data-full`, `img.alt = data-alt`, `showModal()`. 닫기: `[data-close]`, Esc(기본 동작), `dialog` 자체 클릭(바깥). 닫히면(`close` 이벤트) 연 버튼에 `focus()`.
  - `main.js`: `initMenu`, `initStickyHeader`, `initLightbox`를 부르고, 언어 링크(`a[data-lang]`)를 누르면 이동 직전에 현재 `location.hash`를 붙여 다른 언어 페이지의 같은 섹션으로 가게 한다 (스펙 §4.2). Task 8의 `runIntro(document)`도 여기서 부른다 (Task 8 전까지는 호출 없음).

- [ ] **Step 1: 실패하는 동작 테스트 작성** — `tests/browser/ui.test.js`

```js
test('menu arrows move focus and wrap', async () => {
  const { doc, close } = await openPage('/?nointro');
  const links = [...doc.querySelectorAll('a[data-menu]')];
  links[0].focus();
  links[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  assertEq(doc.activeElement, links[1]);
  links[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
  links[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
  assertEq(doc.activeElement, links[2]); close();
});
test('header appears after leaving title', async () => {
  const { win, doc, close } = await openPage('/?nointro', { height: 700 });
  assert(!doc.querySelector('[data-header]').classList.contains('is-visible'));
  win.scrollTo(0, win.innerHeight * 2);
  await waitFor(() => doc.querySelector('[data-header]').classList.contains('is-visible'), 2000); close();
});
test('scroll-margin keeps section titles below header', async () => {           // Review Focus 3
  const { win, doc, close } = await openPage('/?nointro#studio', { height: 700 });
  await wait(300);
  const h2 = doc.querySelector('#studio h2').getBoundingClientRect();
  const hdr = doc.querySelector('[data-header]').getBoundingClientRect();
  assert(h2.top >= hdr.bottom, `h2 ${h2.top} under header ${hdr.bottom}`); close();
});
test('lightbox opens, closes on backdrop, returns focus', async () => {
  const { doc, close } = await openPage('/?nointro');
  const btn = doc.querySelector('[data-lightbox]'); const dlg = doc.getElementById('lightbox');
  btn.focus(); btn.click();
  assert(dlg.open); assertEq(dlg.querySelector('img').getAttribute('src'), btn.dataset.full);
  dlg.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  assert(!dlg.open); assertEq(doc.activeElement, btn); close();
});
test('email copies as plain address', async () => {
  const { doc, close } = await openPage('/?nointro');
  assertEq(doc.querySelector('#contact a[href^="mailto:"]').textContent.trim(), 'ko@kostudio.org'); close();
});
test('language switch keeps section', async () => {
  const { win, doc, frame, close } = await openPage('/?nointro#studio');
  doc.querySelector('.title-menu a[data-lang="en"], header a[data-lang="en"]').click();
  await waitFor(() => frame.contentWindow.location.pathname === '/en/', 3000);
  assertEq(frame.contentWindow.location.hash, '#studio'); close();
});
```

- [ ] **Step 2: 실행해서 실패 확인** — `/__tests__/ui.html` → `FAIL`.

- [ ] **Step 3: 모듈 구현** — Interfaces 그대로. `lightbox.js`의 바깥 클릭 판정은 `e.target === dialog`.

- [ ] **Step 4: 테스트 통과 확인** — `/__tests__/ui.html` → `RESULT: PASS 6/6`. 콘솔 오류 0.

- [ ] **Step 5: Commit** — `git commit -m "feat: menu keys, sticky header, lightbox"`

---

### Task 7: 인트로 모듈 (스플래시 v9 포팅)

**Files:**
- Create: `site/assets/js/intro/intro.js`, `tests/browser/intro.html`, `tests/browser/intro.test.js`

**Interfaces:**
- Consumes: `/assets/lib/three-r160/three.module.min.js`, `/assets/lib/three-r160/RoomEnvironment.js` (Task 2), `fonts.css`의 `Jost` (Task 2).
- Produces:
  - `export const T_LOGO: number` — `unwarp(A.studio) + 1.2` (기본 타이밍에서 약 10.27).
  - `export function playIntro({ mount: HTMLElement, signal?: AbortSignal }): IntroController`
  - `IntroController = { ready: Promise<void>, done: Promise<{ skipped: boolean }>, skip(): void, setSound(on: boolean): Promise<void>, destroy(): void, getTime(): number }`
    - `ready`: 글꼴 대기(Jost, 최대 1.5초), 장면 생성, 셰이더 예열이 끝나 재생이 시작될 때 resolve. `signal`이 abort되면 `AbortError`로 reject하고 만든 것을 모두 해제(마운트에 캔버스가 남지 않음).
    - `done`: `T_LOGO` 프레임을 그린 채 resolve. 캔버스는 남긴다.
    - `skip()`: 즉시 `T_LOGO` 프레임을 그리고 `done`을 `{ skipped: true }`로 resolve. `ready` 전이면 아무것도 안 한다 (준비 전 건너뛰기는 Task 8이 abort로 처리).
    - `setSound(on)`: 사용자 제스처 안에서 호출. `true`면 `AudioContext`를 만들고 `resume()` 후 현재 시각부터 효과음 재생. `false`면 소리를 멈춘다. 영상 시각은 끊기지 않는다.
    - `destroy()`: 지오메트리·재질·텍스처, PMREM, 렌더러(`dispose`, `forceContextLoss`)를 해제하고 캔버스를 지운다. 여러 번 불러도 안전.
    - `getTime()`: 현재 재생 시각(초).
  - `export async function renderFrame({ width: number, height: number, t?: number }): Promise<HTMLCanvasElement>` — `preserveDrawingBuffer: true`, 화소 상한 없음, 비네트·그레인 없이 `t`(기본 `T_LOGO`) 한 프레임을 그린 캔버스를 돌려준다. 렌더러는 해제하고 캔버스만 남긴다.

- [ ] **Step 1: 실패하는 동작 테스트 작성** — `tests/browser/intro.test.js` (`intro.html`이 `/assets/css/fonts.css`를 불러오고 `#mount`(1280×720) 하나를 둔다)

```js
import { T_LOGO, playIntro, renderFrame } from '/assets/js/intro/intro.js';
test('T_LOGO matches splash poster frame', () => assertClose(T_LOGO, 10.27, 0.01));
test('abort before ready leaves nothing', async () => {
  const ac = new AbortController(); const c = playIntro({ mount, signal: ac.signal }); ac.abort();
  let err; try { await c.ready; } catch (e) { err = e; }
  assertEq(err?.name, 'AbortError'); assertEq(mount.querySelector('canvas'), null);
});
test('clock runs without audio', async () => {
  const c = playIntro({ mount }); await c.ready; await wait(1000);
  assert(c.getTime() > 0.8, `t=${c.getTime()}`); c.destroy();
});
test('skip resolves done and keeps last frame', async () => {
  const c = playIntro({ mount }); await c.ready; c.skip();
  assertEq((await c.done).skipped, true); assert(mount.querySelector('canvas'));
  c.destroy(); assertEq(mount.querySelector('canvas'), null);
});
test('plays through to T_LOGO', async () => {
  const c = playIntro({ mount }); await c.ready;
  assertEq((await c.done).skipped, false); assertClose(c.getTime(), T_LOGO, 0.05); c.destroy();
}, { timeout: 15000 });
test('resize mid-intro updates buffer', async () => {                          // Review Focus 1
  const c = playIntro({ mount }); await c.ready;
  mount.style.width = '390px'; mount.style.height = '844px'; await wait(300);
  const cv = mount.querySelector('canvas'); assert(cv.height > cv.width, `${cv.width}x${cv.height}`);
  mount.style.width = '1280px'; mount.style.height = '720px'; c.destroy();
});
test('renderFrame draws the logo', async () => {
  const cv = await renderFrame({ width: 640, height: 360 });
  const c2 = Object.assign(document.createElement('canvas'), { width: 640, height: 360 });
  const g = c2.getContext('2d'); g.drawImage(cv, 0, 0);
  const [r] = g.getImageData(362, 172, 1, 1).data;              // O 고리 위 한 점 (중심 (362,172), 반지름 약 14–23px)
  assert(r > 150, `O ring pixel r=${r}`);
});
```

(픽셀 좌표는 1920×1080 기준 O 중심 (1087, 516), 고리 반지름 약 50–84px를 640×360으로 줄인 값이다. 고리 위의 점이 아니면 같은 비율로 맞춘다.)

- [ ] **Step 2: 실행해서 실패 확인** — `/__tests__/intro.html` → `FAIL` (모듈 없음).

- [ ] **Step 3: 포팅** — 원본 `brand/splash/KO-studio_splash.html` 121~1018행 스크립트를 `intro.js`로 옮기고 아래만 바꾼다. 나머지(타임라인 `build()`, 리그, 시뮬레이션, 한지 텍스처, 핏방울 셰이더, 소리 합성)는 그대로 둔다.
  1. import 두 줄을 `../../lib/three-r160/three.module.min.js`, `../../lib/three-r160/RoomEnvironment.js`로.
  2. 125행 고정값 `W = 1920, H = 1080`을 내부 팩토리 `createScene({ canvas, width, height, pixelCap, preserveDrawingBuffer })`의 변수로. `playIntro`와 `renderFrame`이 이 팩토리를 같이 쓴다.
  3. 렌더러(366–368행): `preserveDrawingBuffer` 인자, `setPixelRatio(1)`, 버퍼 = CSS 크기 × `min(devicePixelRatio, 2, sqrt(pixelCap / (cssW*cssH)))`, `pixelCap`은 `matchMedia('(pointer: coarse)').matches ? 1.3e6 : 2.1e6` (`renderFrame`은 `Infinity`). 캔버스 CSS는 100%×100%.
  4. 카메라 화각: `aspect >= 16/9 ? 2*atan(tan(7°)*(16/9)/aspect)` (도 단위) `: 14`. 카메라 위치는 바꾸지 않는다. 먼지 셰이더 `uFocal = bufH / (2*tan(fov/2))`.
  5. 오버레이(786–835행): 비네트와 그레인을 지운다. 컷 장면의 흰 선·섬광과 검은 페이드만 남기고 버퍼 크기를 따른다.
  6. 재생(986–1018행)을 새로 쓴다: `performance.now()` 기준 시계. `setSound(true)` 후 `AudioContext.state === 'running'`이 되면 그 순간 시각이 이어지도록 오프셋을 맞춰 오디오 시계로 바꾼다. `play(from)`의 효과음 예약은 그대로 쓴다. `t >= T_LOGO`이면 `T_LOGO`를 그리고 루프를 멈춘 뒤 `done` resolve. 소리는 `setTargetAtTime(0, now, 0.3)`으로 줄이고 1.2초 뒤 멈춘다.
  7. 지운다: 1020행 이후 전체(UI, 노브, 단축키, `exportStill`, `exportVideo`, mp4-muxer, `window.KO`), `applyGround`/`applyDot`의 DOM 쓰기(691, 695행), `play()`의 `big.hidden`(990행).
  8. 옵션 고정: `ground='dark'`, `dotStyle='blood'`, `sweepDir='ne'`, `beat 0.8`, `huh 1.0`.
  9. 글꼴: 라벨 텍스처를 만들기 전에 `document.fonts.load('400 61px Jost')`를 최대 1.5초 기다린다.
  10. 셰이더 예열: `ready` 직전에 핏방울·라벨 메시를 잠깐 보이게 하고 `renderer.compile(scene, camera)` 후 다시 숨긴다.
  11. `visibilitychange`: 숨겨지면 시각을 기록하고 소리를 멈춘 채 루프 정지, 보이면 그 시각부터 이어 재생.
  12. `ResizeObserver(mount)`: 크기가 바뀌면 다음 `requestAnimationFrame`에서 버퍼·화각·`uFocal` 재계산 (멈춘 상태면 현재 프레임 다시 그림).
  13. `webglcontextlost`: `done`을 `{ skipped: true }`로 resolve하고 `destroy()`.

- [ ] **Step 4: 테스트 통과 확인** — `/__tests__/intro.html` → `RESULT: PASS 7/7`. 콘솔 오류 0. 1280×720에서 `playIntro`를 끝까지 보며 스크린샷 3장(도망 1.0s, 서걱 직후 4.6s, 끝 프레임): 원본 스플래시와 같은 장면이다.

- [ ] **Step 5: Commit** — `git commit -m "feat: port splash v9 to intro module"`

---

### Task 8: 인트로 실행 (재생 판단, 건너뛰기, 소리, 교차 페이드, 대체 동작)

**Files:**
- Create: `site/assets/js/intro-run.js`, `tests/test_head_script.py`, `tests/browser/run.html`, `tests/browser/run.test.js`
- Modify: `site/index.html`, `site/en/index.html` (머리 스크립트), `site/assets/js/main.js` (`runIntro` 호출)

**Interfaces:**
- Consumes: `playIntro`, `IntroController` (Task 7). 마크업 계약 `#intro`, `.intro-stage`, `[data-skip]`, `[data-sound]`, `a[data-menu]` (Task 4).
- Produces:
  - 머리 스크립트가 남기는 것: `html.intro`, `html.no-replay`, `window.__koIntro = { play, rm, gl }`, `window.__koIntroFailsafe` (타이머 id), `sessionStorage['ko:intro'] = '1'`.
  - `intro-run.js`: `export async function runIntro(doc: Document): Promise<'played' | 'skipped' | 'fallback' | 'none'>`

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/test_head_script.py`:
```python
class HeadScript(unittest.TestCase):
    def test_identical_and_first(self):
        scripts = []
        for f in [SITE/"index.html", SITE/"en/index.html"]:
            raw = f.read_text(encoding="utf-8")
            head = raw.split("</head>")[0]
            m = re.search(r"<script>(.*?)</script>", head, re.S); self.assertTrue(m, f)
            self.assertLess(head.index("<script>"), head.index("stylesheet"), f)
            scripts.append(m.group(1))
        self.assertEqual(scripts[0], scripts[1])
        for s in ["ko:intro", "nointro", "nowebgl", "reducemotion", "location.hash", "4000"]:
            self.assertIn(s, scripts[0])
```

`tests/browser/run.test.js` (모두 `sessionStorage.clear()` 후 시작):
```js
test('first visit plays, menu focused after skip', async () => {
  const { win, doc, close } = await openPage('/', { width: 1280, height: 720 });
  assert(doc.documentElement.classList.contains('intro'));
  assertEq(win.getComputedStyle(doc.querySelector('main')).visibility, 'hidden');   // 인트로 중 뒤쪽 페이지는 Tab·스크린 리더에서 빠짐
  await waitFor(() => doc.activeElement?.matches('[data-skip]'), 4000);              // ready 후 건너뛰기 버튼에 포커스
  doc.querySelector('[data-skip]').click();
  await waitFor(() => !doc.documentElement.classList.contains('intro'), 2000);
  assertEq(doc.activeElement, doc.querySelector('a[data-menu]')); close();
});
test('reload does not replay; ?intro does', async () => {
  let p = await openPage('/'); p.close();
  p = await openPage('/'); assert(!p.doc.documentElement.classList.contains('intro')); p.close();
  p = await openPage('/?intro'); assert(p.doc.documentElement.classList.contains('intro')); p.close();
});
test('ko then en in same session does not replay', async () => {          // Review Focus 4
  let p = await openPage('/'); p.close();
  p = await openPage('/en/'); assert(!p.doc.documentElement.classList.contains('intro')); p.close();
});
test('hash, nowebgl, reducemotion skip intro', async () => {
  for (const u of ['/#contact', '/?nowebgl', '/?reducemotion']) {
    sessionStorage.clear(); const p = await openPage(u);
    assert(!p.doc.documentElement.classList.contains('intro'), u); p.close();
  }
  sessionStorage.clear(); const p = await openPage('/?reducemotion&intro');
  assert(!p.doc.documentElement.classList.contains('intro'));
  assertEq(p.win.getComputedStyle(p.doc.querySelector('.replay-intro')).display, 'none'); p.close();
});
test('sound button by keyboard does not skip', async () => {
  const { doc, close } = await openPage('/');
  await waitFor(() => doc.activeElement?.matches('[data-skip]'), 4000);
  const b = doc.querySelector('[data-sound]'); b.focus();
  b.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); b.click();
  await wait(300);
  assert(doc.documentElement.classList.contains('intro')); assertEq(b.getAttribute('aria-pressed'), 'true'); close();
});
test('wheel and any key skip', async () => {
  for (const ev of [new WheelEvent('wheel', { bubbles: true }), new KeyboardEvent('keydown', { key: 'a', bubbles: true })]) {
    sessionStorage.clear(); const { doc, close } = await openPage('/');
    await waitFor(() => doc.querySelector('.intro-stage canvas'), 4000);
    doc.dispatchEvent(ev);
    await waitFor(() => !doc.documentElement.classList.contains('intro'), 2000); close();
  }
});
test('failsafe frees page when main.js never runs', async () => {
  const html = (await (await fetch('/')).text()).replace(/<script type="module"[^>]*><\/script>/, '');
  const { doc, close } = await openHtml(html);
  assert(doc.documentElement.classList.contains('intro'));
  await waitFor(() => !doc.documentElement.classList.contains('intro'), 5000); close();
}, { timeout: 7000 });
test('bfcache restore mid-intro shows hero', async () => {                 // Review Focus 2
  const { doc, win, close } = await openPage('/');
  await waitFor(() => doc.querySelector('.intro-stage canvas'), 4000);
  win.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
  await waitFor(() => !doc.documentElement.classList.contains('intro'), 1000); close();
});
test('plays to the end and hands off', async () => {
  const { doc, close } = await openPage('/', { width: 390, height: 844 });
  await waitFor(() => !doc.documentElement.classList.contains('intro'), 15000);
  assertEq(doc.querySelector('.intro-stage canvas'), null); close();
}, { timeout: 16000 });
```

- [ ] **Step 2: 실행해서 실패 확인** — 정적 `FAILED`, `/__tests__/run.html` → `FAIL`.

- [ ] **Step 3: 머리 스크립트** — 두 페이지의 `<meta charset>` 바로 다음, 스타일시트보다 앞에 똑같이 넣는다:

```html
<script>
(function(){var d=document.documentElement,q=location.search,ss=null,seen=false,gl=false;
try{ss=window.sessionStorage;seen=!!ss.getItem('ko:intro')}catch(e){}
var rm=/[?&]reducemotion\b/.test(q)||matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!/[?&]nowebgl\b/.test(q)){try{var c=document.createElement('canvas');gl=!!(c.getContext('webgl2')||c.getContext('webgl'))}catch(e){}}
if(rm||!gl)d.classList.add('no-replay');
var play=!/[?&]nointro\b/.test(q)&&!rm&&gl&&!location.hash&&(/[?&]intro\b/.test(q)||!seen);
window.__koIntro={play:play,rm:rm,gl:gl};
if(play){d.classList.add('intro');try{ss.setItem('ko:intro','1')}catch(e){}
window.__koIntroFailsafe=setTimeout(function(){d.classList.remove('intro')},4000)}})();
</script>
```
(`?reducemotion`은 테스트 전용 스위치로, `?nointro`·`?nowebgl`과 같은 취급이다.)

- [ ] **Step 4: `runIntro(doc)` 구현** — 순서:
  1. `html.intro`가 없으면 `'none'`.
  2. `AbortController` 생성. 건너뛰기 리스너를 바로 붙인다: `pointerdown`, `wheel`, `touchmove` (`passive: true`), `keydown`(Tab·Shift·Control·Alt·Meta 제외). 대상이 `[data-sound]` 안이면 무시. `[data-skip]` 클릭도 건너뛰기. 준비 전에 오면 `abort()` → 대체 동작.
  3. 예산 타이머: `setTimeout(abort, Math.max(0, 3000 - performance.now()))`.
  4. `const { playIntro } = await import('./intro/intro.js')` → `playIntro({ mount: .intro-stage, signal })`. import나 `ready`가 실패하면 대체 동작.
  5. `ready` 후: `clearTimeout(window.__koIntroFailsafe)`, 예산 타이머 해제, `[data-skip]`에 `focus()`. 이후 건너뛰기 입력은 `controller.skip()`.
  6. `[data-sound]` 클릭: `aria-pressed` 토글, 글자 "소리 켜기"↔"소리 끄기"(영어 "Sound on"↔"Sound off"; `doc.documentElement.lang`으로 고름), `controller.setSound(on)`. `ready` 전에 누르면 상태만 기억했다가 `ready` 직후 적용한다.
  7. `done` 후 넘어가기: 포커스가 `#intro` 안에 있었는지 기억 → `html.intro-handoff` 추가 → 400ms 뒤 `intro`, `intro-handoff` 제거, `scrollTo(0, 0)`, 기억했으면 첫 `a[data-menu]`에 `focus()`, 리스너 제거, `controller.destroy()`. 반환 `'played'` 또는 `'skipped'`.
  8. 대체 동작: abort, `intro` 제거, 리스너 제거, `controller?.destroy()`, 반환 `'fallback'`.
  9. `pageshow`에서 `event.persisted`이고 `html.intro`가 남아 있으면 대체 동작.
  10. `main.js`에서 `runIntro(document)`를 부른다.

- [ ] **Step 5: 테스트 통과 확인** — 정적 `OK`, `/__tests__/run.html` → `RESULT: PASS 9/9`, `/__tests__/ui.html` 여전히 PASS.

- [ ] **Step 6: Commit** — `git commit -m "feat: intro gating, skip, sound, handoff, fallbacks"`

---

### Task 9: 히어로 정지 이미지 렌더와 정렬 확인

**Files:**
- Create: `tools/render-hero.html`, `tests/browser/layout.html`, `tests/browser/layout.test.js`
- Modify: `tools/build_images.py` (`--only hero`가 `.cache/render/hero-*.png`를 쓰게), `site/assets/img/hero-{1920,2880}.webp`, (2880이 상한을 넘으면) 두 페이지의 `srcset`

**Interfaces:**
- Consumes: `renderFrame` (Task 7), `POST /__save__/<name>` (Task 1).

- [ ] **Step 1: 실패하는 동작 테스트 작성** — `tests/browser/layout.test.js`

```js
const SIZES = [[360,780],[390,844],[844,390],[1280,800],[1366,657],[1536,730],[1920,969],[1920,1080],[2560,1080]];
test('menu sits below studio label at every size', async () => {
  for (const [w, h] of SIZES) {
    const { doc, close } = await openPage('/?nointro', { width: w, height: h });
    const frameH = Math.max(h, w * 9 / 16), labelBottom = h / 2 + 0.1356 * frameH;
    const m = doc.querySelector('.title-menu').getBoundingClientRect();
    assert(m.top >= labelBottom + 8, `${w}x${h}: menu ${m.top} label ${labelBottom}`);
    assert(m.bottom <= h - 8, `${w}x${h}: menu off screen`);
    assert(m.right <= w && m.left >= 0, `${w}x${h}: menu wraps out`); close();
  }
});
test('live frame matches hero still (landscape and portrait)', async () => {
  const { renderFrame } = await import('/assets/js/intro/intro.js');
  for (const [w, h] of [[640, 360], [390, 844]]) {
    const live = await renderFrame({ width: w, height: h });
    const img = new Image(); img.src = '/assets/img/hero-1920.webp'; await img.decode();
    const a = toPixels(live, w, h), b = coverPixels(img, w, h);   // 2D 캔버스로 옮김, b는 object-fit: cover 계산
    assert(meanAbsDiff(a, b) < 6, `${w}x${h} diff ${meanAbsDiff(a, b)}`);
  }
});
```
(`toPixels`, `coverPixels`, `meanAbsDiff`는 같은 파일의 작은 도우미 함수다. 휘도 0–255 평균 절대차.)

- [ ] **Step 2: 실행해서 실패 확인** — 임시 히어로(로고 PNG)는 비네트가 구워져 있어 두 번째 테스트가 `FAIL`이다.

- [ ] **Step 3: `tools/render-hero.html` 구현과 렌더** — `/__tools__/render-hero.html`이 `fonts.css`를 불러오고 `renderFrame({1920,1080})`, `renderFrame({2880,1620})`을 PNG로 `POST /__save__/hero-1920.png`, `hero-2880.png`. 끝나면 `document.title = 'SAVED'`. 그다음 `python tools/build_images.py --only hero` (1920 ≤ 250KB, 2880 > 450KB면 2880 파일을 지우고 두 페이지 `srcset`에서 뺀다).

- [ ] **Step 4: 테스트 통과 확인** — `/__tests__/layout.html` → `RESULT: PASS 2/2`, 정적 테스트 `OK`. `/?intro`를 1280×720, 390×844로 끝까지 보며 넘어가는 순간을 스크린샷: 로고가 튀지 않는다.

- [ ] **Step 5: Commit** — `git commit -m "feat: hero still rendered from intro, layout checks"`

---

### Task 10: 전체 점검

**Files:** 없음 (문제가 나오면 해당 작업 파일을 고치고 그 작업의 테스트를 다시 돌린다)

- [ ] **Step 1: 모든 테스트** — 정적 `OK`, `/__tests__/{smoke,ui,intro,run,layout}.html` 모두 `PASS`.
- [ ] **Step 2: 화면 크기별 스크린샷** — 스펙 §10의 10개 크기에서 `/?nointro`, `/en/?nointro`를 위에서 아래까지. 기대: 겹침·가로 스크롤 없음, 한국어가 낱말 중간에서 안 끊김.
- [ ] **Step 3: 네트워크** — `/?intro`를 새 세션으로 열고 네트워크 요청 목록을 읽는다. 기대: 외부 도메인 0개, 첫 화면(인트로·글꼴 제외) 400KB 이하, 첫 화면 글꼴 300KB 이하, 인트로 JS 약 190KB(gzip 전송 기준, 개발 서버는 압축하지 않으므로 원본 크기 약 725KB면 통과).
- [ ] **Step 4: 콘솔** — 위 과정 전체에서 오류 0.
- [ ] **Step 5: JavaScript 꺼짐 확인** — 하네스의 `openHtml`로 `/`와 `/en/`의 모든 `<script>`를 지운 사본을 연다. 모든 섹션 글자와 링크가 보이고, 인트로 레이어는 보이지 않는다.
- [ ] **Step 6: Commit** (고친 것이 있을 때만) — `git commit -m "fix: issues from full verification"`

---

### Task 11: 배포와 도메인 전환 (사용자와 함께)

**Files:** 없음 (GitHub·Squarespace 설정). 각 단계는 사용자 확인 후 진행한다.

- [ ] **Step 1: 저장소 만들기** — 사용자가 GitHub에서 공개 저장소 `gomurloc.github.io`(소문자)를 빈 상태로 만든다 (README 없이). Settings → Pages → Source를 "GitHub Actions"로.
- [ ] **Step 2: push** — 사용자 확인 후 `git remote add origin https://github.com/Gomurloc/gomurloc.github.io.git && git push -u origin main`. Actions의 배포가 성공하는지 본다.
- [ ] **Step 3: 배포 확인** — `https://gomurloc.github.io/` 200, `https://gomurloc.github.io/off-the-record/` 200, `https://gomurloc.github.io/docs/` 404, 외부 요청 0.
- [ ] **Step 4: 도메인 검증·DNS·사용자 지정 도메인·HTTPS** — 스펙 §9의 1~8번을 순서대로. 특히 4번 전파 대기(최소 4시간)를 지킨 뒤에 5번. 각 단계 결과를 `nslookup`/`Resolve-DnsName`으로 확인하고, MX·SPF·DKIM이 처음 기록과 같은지 매번 비교한다.
- [ ] **Step 5: 최종 확인** — `https://kostudio.org/`, `https://www.kostudio.org/` → apex, `http://` → `https://`, `https://gomurloc.github.io/off-the-record/` → `https://kostudio.org/off-the-record/`, 테스트 메일 송수신. 휴대폰 실기기로 첫 방문 인트로.

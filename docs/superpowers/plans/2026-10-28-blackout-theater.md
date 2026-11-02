# 암전 극장 리디자인 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사용자가 확정한 "암전 극장" 시안을 테스트로 지키는 커밋들로 옮긴다. 설계 문서의 수정 사항도 함께 반영한다.

**Architecture:**
- 시안 코드는 브랜치 `redesign/blackout-theater`에 커밋되지 않은 채로 있다. 사용자는 설명이 아니라 이 코드를 보고 확정했다. 그래서 각 작업은 시안을 다시 짜지 않고 옮겨 온 뒤, 설계 문서대로 고친다.
- 먼저 시안을 `.cache/redesign/prototype/`에 보관하고 `site/`, `tools/`를 마지막 커밋 상태로 되돌린다 (Task 1).
- 그다음 작업마다 다음 순서로 진행한다.
  1. 테스트를 먼저 쓴다.
  2. 테스트가 실패하는 것을 본다 (RED).
  3. 시안의 해당 부분을 옮기고 고친다.
  4. 테스트가 통과하는 것을 본다 (GREEN).
  5. 커밋한다.
- 이 계획의 최종 상태는 계획을 쓰면서 저장소 밖 임시 복사본에서 미리 끝까지 돌려 봤다. 결과는 단위 테스트 60개, 브라우저 테스트 49개 모두 통과였다.
- 그때의 최종 파일 12개를 `.cache/redesign/verified/`에 남겨 두었다. 이 계획의 코드 블록은 그 파일들에서 옮겨 적은 것이다. Task 5에서 이 파일들과 비교한다.

**Tech Stack:**
- 사이트: 손으로 쓴 HTML, CSS, ES 모듈
- 도구와 단위 테스트: Python 3 + Pillow, `unittest`
- 브라우저 테스트: 저장소의 작은 테스트 도구 (`tests/browser/harness.js`, `tools/browser_test.py`)

**Spec:** `docs/superpowers/specs/2026-10-28-blackout-theater-design.md` (이하 "스펙 §"). 이 문서가 고치지 않은 부분은 `docs/superpowers/specs/2026-10-26-kostudio-site-design.md`를 따른다.

## Global Constraints

**사이트와 저장소.**
- 배포되는 파일은 손으로 쓴 HTML, CSS, 순수 JavaScript(ES 모듈)뿐이다. 새 의존성을 넣지 않는다.
- 실행 중에 외부 서버로 요청하지 않는다.
- 저장소는 공개된다. 다음은 커밋하지 않는다.
  - 전화번호, 개인 메일
  - 미공개 게임 이름, 팀원 내부 일정, 비공개 저장소 이름
  - 명함 생성기 `card/`
- 배포되는 HTML에 주석(`<!--`)을 남기지 않는다.
- `C:/Users/user/Documents/GitHub/rhythm-prototype`는 읽기만 한다. fetch, pull, checkout, 파일 쓰기를 하지 않는다.
- 인트로, 타이틀 화면의 배경과 메뉴 위치, 고정 헤더, 확대 보기, 배포 설정은 바꾸지 않는다 (스펙 §2).

**문구.**
- 한국어 페이지 문장은 합쇼체다. 로그라인 같은 짧은 문구는 표어형도 된다.
- 둥근 따옴표(‘ ’)와 아포스트로피(’)만 쓴다.
- 팀 이름("삼유", "3U")을 쓰지 않는다. 크레딧은 기존 설계 §4.6 그대로다.

**토큰 (스펙 §4, 값은 그대로 쓴다).**
- 색: `--bg #0b0b0c`, `--panel #141416`, `--text #e9e4da`, `--muted #908d88`, `--line color-mix(in srgb, var(--text) 12%, transparent)`, `--red #c41e2a`, `--red-line #8f1220`, `--blood #7a0d18`
- FeelSoGut! 게임 토큰: `--g-bg #0D0E38`, `--g-room #0D0E38`, `--g-accent #FF0099`, `--g-accent-2 #21D3ED`
- OFF THE RECORD 게임 토큰: `--g-bg #06070A`, `--g-room #0b1019`, `--g-accent #D9A521`, `--g-accent-2 #2E9C97`
- 글자: `--t-label 12px`, `--t-small 14px`, `--t-body 17px`, `--t-lead clamp(20px, 2.2vw, 24px)`, `--t-title clamp(30px, 4.2vw, 52px)`, `--t-display clamp(60px, 9vw, 136px)`
- 자간: `--caps .24em` 하나뿐이고 영문 대문자에만 쓴다. 한글은 0이다. 가운데 정렬한 영문 라벨은 `margin-right: calc(-1 * var(--caps))`로 되돌린다.
- 간격: `--s1`~`--s7` = 8, 13, 21, 34, 55, 89, 144px
- 움직임: `--ease-out cubic-bezier(.16, 1, .3, 1)`, `--ease-io cubic-bezier(.65, 0, .35, 1)`, `--d1 .18s`, `--d2 .4s`, `--d3 .8s`, `--d4 2s`, `--stagger .12s`
- 방의 전환은 켜진 상태(`.is-lit`) 규칙에만 둔다 (스펙 §4.4).
- 토큰 밖에서 직접 쓰는 값은 스펙 §4.6의 목록뿐이다.
- `--red`는 작은 글자에 쓰지 않는다.

**예산과 지원 범위.**
- 첫 화면 400KB 이하 (기존 `verify` 테스트가 잰다).
- 이미지 용량 상한 (스펙 §9.2): 포스터 130KB, `fsg-pop.webp` 100KB, `hanji-grain.webp` 70KB.
- 지원 브라우저: 2023년 이후의 Chrome, Edge, Safari, Firefox.

**한 곳에서 관리하는 값.** 튀어나오는 인물의 영역은 `tools/build_images.py`의 `POP_BOX = (291, 102, 1662, 700)` 한 곳에만 둔다.

**커밋.**
- 계획의 커밋 단계에서만 커밋한다. 커밋 메시지 끝에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`를 붙인다.
- push와 `main` 합치기(= 배포)는 사용자가 직접 요청할 때만 한다.

**명령.** 모든 명령은 저장소 루트(`C:/Users/user/Documents/GitHub/kostudio.org`)에서 Git Bash로 실행한다.
- 단위 테스트: `python -m unittest discover -s tests -p "test_*.py"`
- 브라우저 테스트: `python tools/browser_test.py <묶음…> --timeout=200`
  - 개발 서버가 :8080에서 돌고 있어야 한다: `python tools/serve.py --port 8080` (백그라운드로 실행)
  - 서버는 요청마다 디스크의 파일을 읽으므로, 파일을 고친 뒤 다시 띄울 필요가 없다.

## Review Focus

다음은 실제 방문자가 겪기 쉬운 다섯 가지다. 각각을 맡은 작업에 테스트를 넣었다.

1. **페이지를 열 때마다 방이 꺼지는 애니메이션.** 시안에서 실제로 일어났다. 페이지가 `js` 없이(켜진 모습으로) 먼저 그려진 뒤 `js`가 붙으면, 꺼진 상태 쪽에 걸린 전환이 2초 동안 돈다. 열 때는 방이 바로 어두워야 한다. → Task 4 `loading the page starts no lighting transitions`
2. **방 중간에서 새로고침하거나 뒤로 가기.** 스크롤 위치가 타이틀 카드 아래로 복원된다. 그래도 읽고 있는 방이 켜져야 한다. → Task 4 `landing inside a room below its title card lights it`
3. **게임 섹션 주소로 바로 들어옴** (`/#game-otr`, 또는 언어 전환이 해시를 넘겨줄 때). 그 방이 켜져야 한다. → Task 4 `a deep link lights the room it lands in`
4. **웹 글꼴이 선택 띠를 놓은 뒤에 도착함.** 띠가 바뀐 링크 폭을 따라가야 한다. 글꼴 시간에 기대지 않고, 자간을 바꿔 폭 변화를 일부러 만든다. → Task 4 `selection band …`
5. **좁은 휴대폰과 가로로 든 휴대폰** (360×780, 844×390). 인물이 판과 1px 안에서 맞물리고, 로그라인과 21px 이상 떨어져야 한다. → Task 3 `figures step out of the plate in register, clear of the logline`

`IntersectionObserver`가 없는 브라우저와 인쇄도 테스트가 있다. 다만 지원 범위와 쓰임새를 보면 위 다섯 가지보다 덜 일어난다.

---

## 파일 구조

| 경로 | 책임 | 작업 |
|---|---|---|
| `tools/build_images.py` | `stage` 단계 (포스터, 튀어나오는 인물, 한지 결), `POP_BOX`, 타일 출력 제거 | 2, 3 |
| `site/assets/img/*.webp` | 포스터 4장, `fsg-pop.webp`, `hanji-grain.webp` 추가. 타일 4장 삭제 | 2, 3 |
| `site/index.html`, `site/en/index.html` | 포스터, 게임 방, 타이틀 카드, 판, 다음 상영, 스튜디오 마크업 | 3 |
| `site/assets/css/site.css` | 토큰과 모든 구성 요소의 모양 | 3, 4 |
| `site/assets/js/stage.js` | 새 파일: 방 조명과 판 밀어 넣기 (`initStage`) | 4 |
| `site/assets/js/main.js` | `js` 클래스, `initStage`를 가장 먼저 호출 | 4 |
| `site/assets/js/menu.js` | 선택 띠 위치 (`--band-x`, `--band-w`, `has-band`) | 4 |
| `tests/test_images.py` | 새 이미지 크기·용량, `POP_BOX`, 타일 없음 | 2, 3 |
| `tests/test_redesign.py` | 새 파일: 문구, 포스터, 인물 값 동기화, 이미지 크기 속성, 토큰, 움직임 줄이기, 인쇄, 포커스 색 | 3 |
| `tests/browser/stage.html`, `stage.test.js` | 새 묶음 `stage`: 테스트 3개(Task 3) + 8개(Task 4) | 3, 4 |
| `tests/browser/verify.test.js` | "JavaScript 꺼짐" 테스트 보강 | 3 |

보관 폴더 `.cache/redesign/prototype/`(시안)와 `.cache/redesign/verified/`(미리 돌려 본 최종 파일)는 저장소가 무시하는 `.cache/` 안에 있다.

---

### Task 1: 시안 보관과 출발점 정리

**Files:**
- Create: `.cache/redesign/prototype/` (보관용, 커밋 안 됨)
- Restore: `site/`, `tools/` (마지막 커밋 상태로)
- Commit: `docs/superpowers/specs/2026-10-28-blackout-theater-design.md`, `docs/superpowers/plans/2026-10-28-blackout-theater.md`

**Interfaces:**
- Produces: `.cache/redesign/prototype/<저장소 경로>`. 시안에서 바뀌거나 새로 생긴 파일 13개가 원래 경로 그대로 들어 있다. 이후 작업은 여기서 옮겨 온다.

- [ ] **Step 1: 지금 상태 확인**

Run: `git branch --show-current && git status --short`
Expected:
- 브랜치는 `redesign/blackout-theater`다.
- 수정된 파일 6개가 있다: `site.css`, `main.js`, `menu.js`, 두 `index.html`, `build_images.py`.
- 새 파일 7개가 있다: 이미지 6개와 `stage.js`.
- 새 문서 2개가 있다: 설계, 계획.

- [ ] **Step 2: 시안 보관**

```bash
mkdir -p .cache/redesign/prototype
[ -e .cache/redesign/prototype/changes.patch ] || git diff --binary > .cache/redesign/prototype/changes.patch
for f in $(git diff --name-only) $(git ls-files --others --exclude-standard site tools); do
  mkdir -p ".cache/redesign/prototype/$(dirname "$f")" && cp "$f" ".cache/redesign/prototype/$f"
done
find .cache/redesign/prototype -type f ! -name changes.patch | wc -l
```
Expected: `13`

- [ ] **Step 3: 작업 트리를 마지막 커밋 상태로 되돌리기**

```bash
git ls-files --others --exclude-standard site tools > .cache/redesign/prototype/untracked.txt
git checkout -- site tools
xargs rm -- < .cache/redesign/prototype/untracked.txt
git status --short
```
Expected: 아래 두 줄만 남는다.
```
?? docs/superpowers/plans/2026-10-28-blackout-theater.md
?? docs/superpowers/specs/2026-10-28-blackout-theater-design.md
```
`git clean`은 쓰지 않는다. `-x`를 붙이면 `.cache/`의 보관본까지 지운다.

- [ ] **Step 4: 출발점에서 기존 테스트가 모두 통과하는지 확인**

Run:
- `python -m unittest discover -s tests -p "test_*.py"`
- `python tools/browser_test.py smoke ui intro run layout verify --timeout=200`

Expected:
- 단위 테스트: `Ran 39 tests … OK`
- 브라우저 테스트: 6개 묶음 모두 `RESULT: PASS` (3, 8, 8, 12, 2, 5)

- [ ] **Step 5: 문서 커밋**

```bash
git add docs/superpowers/specs/2026-10-28-blackout-theater-design.md docs/superpowers/plans/2026-10-28-blackout-theater.md
git commit -m "docs: blackout-theater redesign spec and plan" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: 무대 이미지 (`build_images.py --only stage`)

**Files:**
- Modify: `tools/build_images.py`
- Create: `site/assets/img/fsg-poster-900.webp`, `fsg-poster-600.webp`, `otr-poster-900.webp`, `otr-poster-600.webp`, `fsg-pop.webp`, `hanji-grain.webp`
- Test: `tests/test_images.py`

**Interfaces:**
- Consumes: `.cache/redesign/prototype/tools/build_images.py`, `.cache/redesign/prototype/site/assets/img/*.webp` (비교용)
- Produces:
  - `build_images.POP_BOX: tuple[int, int, int, int] = (291, 102, 1662, 700)`. 1920×1080 장면 좌표의 (왼쪽, 위, 오른쪽, 아래)다.
  - `build_images.build_stage() -> None`. 위 이미지 6개를 쓴다.
  - `--only stage` 선택지.

- [ ] **Step 1: 실패하는 테스트 쓰기 (`tests/test_images.py`)**

1. **import 바꾸기.** 파일 머리를 아래처럼 만든다. `import sys`를 맨 위에 더하고, `from support import SITE`를 `from support import ROOT, SITE`로 바꾼 뒤, 그 아래에 두 줄을 더한다.

```python
import sys
import unittest

from PIL import Image

from support import ROOT, SITE

sys.path.insert(0, str(ROOT / "tools"))
import build_images  # noqa: E402
```

2. **`EXPECTED`에 추가.** `"hero-1920.webp": (1920, 1080),` 다음 줄에 아래를 더한다. 타일 항목은 Task 3에서 뺀다.

```python
    "fsg-poster-900.webp": (900, 1200), "fsg-poster-600.webp": (600, 800),
    "otr-poster-900.webp": (900, 1200), "otr-poster-600.webp": (600, 800),
    "fsg-pop.webp": (1371, 598), "hanji-grain.webp": (384, 384),
```

3. **테스트 추가.** `test_logo_has_alpha` 앞에 아래 두 테스트를 더한다.

```python
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
```

- [ ] **Step 2: 실패 확인**

Run: `python -m unittest discover -s tests -p "test_images.py"`
Expected: 실패 3개.
- `test_expected_sizes`: `FileNotFoundError … fsg-poster-900.webp`
- `test_stage_caps`: `FileNotFoundError`
- `test_pop_box`: `AttributeError: module 'build_images' has no attribute 'POP_BOX'`

- [ ] **Step 3: 시안의 이미지 도구를 옮기고 `POP_BOX`를 더하기**

`cp .cache/redesign/prototype/tools/build_images.py tools/build_images.py`로 옮긴다. 시안 판은 `main` 판에 `sprite`, `fsg_poster`, `fsg_pop`, `hanji_grain`, `build_stage`와 `--only stage`를 더한 것이다. 그다음 두 군데를 고친다.

1. **상수 추가.** `FRAME = (1920, 1080)` 바로 다음 줄에 둔다.

```python
# The pop-out sprite's box in the 1920x1080 1-5 scene (left, top, right, bottom). site.css
# (.plate-pop img) and the img width/height in both pages derive from it; tests check both.
POP_BOX = (291, 102, 1662, 700)
```

2. **`fsg_pop()` 수정.**
   - docstring의 둘째·셋째 줄을 바꾼다: `rises above the plate's top edge steps out of the frame. Cropped to POP_BOX; stops if the` / `art's own box has moved, since site.css and the pages place the sprite by that box."""`
   - `print(f"fsg-pop box in scene: …")`와 `pop = scene.crop(box)` 두 줄을 아래로 바꾼다.

```python
    if box != POP_BOX:
        raise SystemExit(f"fsg-pop box is now {box}; update POP_BOX, .plate-pop img in site.css and the img width/height")
    pop = scene.crop(POP_BOX)
```

- [ ] **Step 4: 이미지 만들기**

Run: `python tools/build_images.py --only stage`
Expected:
- 오류 없이 끝나고 `SystemExit`이 나지 않는다.
- `site/assets/img/`에 파일 6개가 생긴다.

FeelSoGut! 레이어는 로컬 `rhythm-prototype`에서 읽기만 한다. OFF THE RECORD 원본은 `.cache/otr/`에 이미 받아 둔 것을 쓴다.

- [ ] **Step 5: 시안 이미지와 비교**

```bash
for f in fsg-poster-900 fsg-poster-600 otr-poster-900 otr-poster-600 fsg-pop hanji-grain; do
  cmp -s "site/assets/img/$f.webp" ".cache/redesign/prototype/site/assets/img/$f.webp" && echo "same $f" || echo "DIFF $f"
done
```
Expected: 여섯 줄 모두 `same`.

`DIFF`가 나오면 Pillow 버전 차이일 수 있다. 두 그림을 눈으로 비교하고, 크기와 용량이 2% 안이면 받아들인다. 그 판단을 ledger에 Ruling으로 남긴다.

- [ ] **Step 6: 통과 확인**

Run: `python -m unittest discover -s tests -p "test_*.py"`
Expected: `Ran 41 tests … OK`

- [ ] **Step 7: 커밋**

```bash
git add tools/build_images.py tests/test_images.py site/assets/img/fsg-poster-900.webp site/assets/img/fsg-poster-600.webp site/assets/img/otr-poster-900.webp site/assets/img/otr-poster-600.webp site/assets/img/fsg-pop.webp site/assets/img/hanji-grain.webp
git commit -m "feat: stage images (posters, plate pop-out, hanji grain)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: 정적 페이지 (포스터, 게임 방, 스튜디오. JavaScript 없이 완성된 상태)

이 작업이 끝나면 페이지는 JavaScript가 꺼졌을 때와 같은 모습이다. `main.js`가 아직 `js` 클래스를 붙이지 않기 때문이다.
- 모든 방이 켜져 있다.
- 카드가 보인다.
- 판은 원래 크기다.
- 선택 띠는 숨어 있다.

**Files:**
- Modify: `site/index.html`, `site/en/index.html`, `site/assets/css/site.css`
- Modify: `tools/build_images.py` (타일 두 줄 삭제)
- Delete: `site/assets/img/fsg-tile-640.webp`, `fsg-tile-960.webp`, `otr-tile-640.webp`, `otr-tile-960.webp`
- Create: `tests/test_redesign.py`, `tests/browser/stage.html`, `tests/browser/stage.test.js`
- Modify: `tests/test_images.py`, `tests/browser/verify.test.js`

**Interfaces:**
- Consumes: `build_images.POP_BOX`, Task 2의 이미지 6개
- Produces (Task 4가 기대는 마크업과 CSS 계약):
  - `section.game[data-game="feelsogut"|"otr"]` 두 개 (`id`는 `game-feelsogut`, `game-otr`). 안에 다음이 있다.
    - `.stage-light`
    - `header.title-card`
    - `figure.plate[data-drift]` > `.plate-frame` > `img.plate-img`
    - FeelSoGut!에만 `.plate-pop` > `img`가 더 있다.
    - 끝에 `a.next`가 있다.
  - CSS가 반응하는 상태:
    - `html.js`
    - `.game.is-lit`, `.plate.is-lit`
    - `.title-menu.has-band`
    - `.title-menu`의 인라인 사용자 속성 `--band-x`, `--band-w` (px)
  - 브라우저 테스트 묶음 `stage`와 그 안의 `ROOM`, `rgb()`, `contrast()`

- [ ] **Step 1: 실패하는 단위 테스트 쓰기**

**`tests/test_redesign.py` (새 파일).**

```python
"""Checks for the blackout-theater redesign (spec 2026-10-28)."""
import re
import sys
import unittest

from PIL import Image

from support import ROOT, SITE, parse

sys.path.insert(0, str(ROOT / "tools"))
import build_images  # noqa: E402

IMG = SITE / "assets/img"
CSS = (SITE / "assets/css/site.css").read_text(encoding="utf-8")
BARE = re.sub(r"/\*.*?\*/", "", CSS, flags=re.S)
FLAT = " ".join(BARE.split())
PAGES = {"ko": SITE / "index.html", "en": SITE / "en/index.html"}
COPY = {
    "ko": {"loglines": ["신령님, 박자 한 번만 빌려주십시오.", "나가서 건지고, 돌아와서 판다"],
           "next": [("#game-otr", "다음 상영", "OFF THE RECORD"), ("#studio", "엔딩 크레딧", "KO Studio")],
           "award": ["2026 미래 게임잼", "최우수상"],
           "statement": "그렇게 예상을 한 번에 뒤집는 게임을 만듭니다.",
           "pun": "K·O가 됩니다."},
    "en": {"loglines": ["Spirit, lend me your beat.", "Salvage it out there. Sell it back home."],
           "next": [("#game-otr", "Up next", "OFF THE RECORD"), ("#studio", "End credits", "KO Studio")],
           "award": ["Top Excellence Award (최우수상),", "2026 Future Game Jam"],
           "statement": "That’s the kind of game KO Studio makes: one that flips your expectations in a single blow.",
           "pun": "becomes K·O."},
}


def rules():
    """(selector, [(property, value)]) for every style rule; comments and @media wrappers removed."""
    src = re.sub(r"@media[^{]+\{", "", BARE)
    for sel, body in re.findall(r"([^{}]+)\{([^{}]*)\}", src):
        yield " ".join(sel.split()), [tuple(x.strip() for x in d.split(":", 1)) for d in body.split(";") if ":" in d]


def text(el):
    return " ".join(el.text.split())


class Copy(unittest.TestCase):
    def test_loglines(self):
        for lang, path in PAGES.items():
            self.assertEqual([text(e) for e in parse(path).select("p", class_="logline")], COPY[lang]["loglines"], lang)

    def test_next_slates(self):
        for lang, path in PAGES.items():
            got = [(a.attrs["href"], text(a.select(class_="next-label")[0]), text(a.select(class_="next-title")[0]))
                   for a in parse(path).select("a", class_="next")]
            self.assertEqual(got, COPY[lang]["next"], lang)

    def test_award_two_lines(self):
        for lang, path in PAGES.items():
            award = parse(path).select("p", class_="award")[0]
            lines = [text(c) for c in award.select("span", class_="award-text")[0].children]
            self.assertEqual(lines, COPY[lang]["award"], lang)
            self.assertEqual([s.attrs.get("aria-hidden") for s in award.select("svg", class_="laurel")], ["true", "true"], lang)

    def test_studio_order(self):
        for lang, path in PAGES.items():
            kids = parse(path).by_id("studio").select("div", class_="wrap")[0].children
            self.assertEqual([k.attrs.get("class") for k in kids], ["section-head", "studio-text", "statement", "studio-text", "seal"], lang)
            self.assertTrue(text(kids[1]).endswith(COPY[lang]["pun"]), lang)
            self.assertEqual(text(kids[2]), COPY[lang]["statement"], lang)
            self.assertEqual(kids[4].attrs.get("aria-hidden"), "true", lang)

    def test_credit_line(self):
        for lang, path in PAGES.items():
            cards = parse(path).select("header", class_="title-card")
            self.assertEqual(len(cards), 2, lang)
            for card in cards:
                presents = card.children[0]
                self.assertIn("presents", presents.attrs.get("class", "").split(), lang)
                self.assertTrue(presents.select("span", aria_hidden="true"), lang)
                self.assertEqual([text(s) for s in presents.select("span", class_="visually-hidden")], ["KO Studio"], lang)

    def test_no_straight_quotes(self):
        for path in [*PAGES.values(), SITE / "404.html"]:
            self.assertNotRegex(parse(path).text, r"['\"]", path.name)


class Posters(unittest.TestCase):
    def test_poster_art(self):
        for lang, path in PAGES.items():
            arts = [t.select("img", class_="tile-art")[0] for t in parse(path).select("a", class_="tile")]
            self.assertEqual([a.attrs["src"] for a in arts], ["/assets/img/fsg-poster-600.webp", "/assets/img/otr-poster-600.webp"], lang)
            for a in arts:
                self.assertIn("-900.webp 900w", a.attrs["srcset"], lang)
                self.assertEqual(a.attrs["alt"], "", lang)


class PopOut(unittest.TestCase):
    def test_css_matches_pop_box(self):
        left, top, right, bottom = build_images.POP_BOX
        m = re.search(r"\.plate-pop img \{[^}]*left: ([\d.]+)%; top: ([\d.]+)%; width: ([\d.]+)%", CSS)
        self.assertIsNotNone(m, ".plate-pop img rule")
        for got, want in zip(map(float, m.groups()), (left / 19.2, top / 10.8, (right - left) / 19.2)):
            self.assertEqual(got, round(want, 4))

    def test_html_matches_image(self):
        left, top, right, bottom = build_images.POP_BOX
        with Image.open(IMG / "fsg-pop.webp") as im:
            self.assertEqual(im.size, (right - left, bottom - top))
            for lang, path in PAGES.items():
                img = parse(path).select("div", class_="plate-pop")[0].select("img")[0]
                self.assertEqual((int(img.attrs["width"]), int(img.attrs["height"])), im.size, lang)


class ImageAttrs(unittest.TestCase):
    def test_size_attrs_match_files(self):
        for path in [*PAGES.values(), SITE / "404.html"]:
            for img in parse(path).select("img"):
                src = img.attrs.get("src", "")
                if not src or src.endswith(".svg") or "width" not in img.attrs:
                    continue
                with Image.open(SITE / src.lstrip("/")) as im:
                    want = im.width / im.height
                    size = f"{im.width}x{im.height}"
                got = int(img.attrs["width"]) / int(img.attrs["height"])
                self.assertLessEqual(abs(got - want) / want, 0.01, f"{path.name} {src} {img.attrs['width']}x{img.attrs['height']} vs {size}")


class Tokens(unittest.TestCase):
    ALLOWED_FONT = {("html:lang(en) body", "font-size", "18px"), (".tile .stencil", "font-size", "14cqi"), ("button", "font", "inherit")}

    def test_font_sizes_use_tokens(self):
        for sel, decls in rules():
            for prop, val in decls:
                if prop in ("font", "font-size") and "var(--t-" not in val:
                    self.assertIn((sel, prop, val), self.ALLOWED_FONT)

    def test_durations_use_tokens(self):
        for sel, decls in rules():
            for prop, val in decls:
                if prop.startswith(("transition", "animation")):
                    for lit in re.findall(r"(?<![\w-])\d*\.?\d+m?s\b", val):
                        self.assertTrue(lit == ".01ms" or (sel == "#intro" and lit == ".35s"), f"{sel} {prop}: {lit}")

    def test_spacing_uses_ladder(self):
        for sel, decls in rules():
            for prop, val in decls:
                if re.fullmatch(r"(row-|column-)?gap|(margin|padding)(-[a-z]+)?", prop):
                    for n in re.findall(r"(?<![\w.])(\d*\.?\d+)px", val):
                        self.assertLessEqual(float(n), 5, f"{sel} {prop}: {val}")

    def test_tracking_only_caps(self):
        for sel, decls in rules():
            for prop, val in decls:
                if prop == "letter-spacing":
                    self.assertIn(val, ("var(--caps)", "0"), sel)

    def test_tokens_defined(self):
        for decl in ["--muted: #908d88", "--line: color-mix(in srgb, var(--text) 12%, transparent)", "--caps: .24em",
                     "--t-label: 12px", "--t-small: 14px", "--t-body: 17px", "--t-lead: clamp(20px, 2.2vw, 24px)",
                     "--t-title: clamp(30px, 4.2vw, 52px)", "--t-display: clamp(60px, 9vw, 136px)",
                     "--s1: 8px; --s2: 13px; --s3: 21px; --s4: 34px; --s5: 55px; --s6: 89px; --s7: 144px",
                     "--ease-out: cubic-bezier(.16, 1, .3, 1)", "--ease-io: cubic-bezier(.65, 0, .35, 1)",
                     "--d1: .18s; --d2: .4s; --d3: .8s; --d4: 2s", "--stagger: .12s",
                     '[data-game="feelsogut"] { --g-bg: #0D0E38; --g-room: #0D0E38; --g-accent: #FF0099; --g-accent-2: #21D3ED; }',
                     '[data-game="otr"] { --g-bg: #06070A; --g-room: #0b1019; --g-accent: #D9A521; --g-accent-2: #2E9C97; }']:
            self.assertIn(decl, FLAT)

    def test_reduced_motion(self):
        at = FLAT.index("@media (prefers-reduced-motion: reduce)")
        self.assertGreater(at, FLAT.index("scroll-behavior: smooth"))
        self.assertIn(":root { --d1: .01ms; --d2: .01ms; --d3: .01ms; --d4: .01ms; --stagger: 0s; } html { scroll-behavior: auto; }", FLAT[at:])

    def test_print_shows_everything(self):
        at = FLAT.index("@media print")
        for rule in [".js .game .title-card > * { opacity: 1; transform: none; }",
                     ".js .game:not(.is-lit) .stage-light { opacity: 1; }",
                     ".js .game:not(.is-lit) { background-color: var(--g-room); }",
                     ".js .plate .plate-img, .js .plate .plate-pop { transform: none; }"]:
            self.assertIn(rule, FLAT[at:])
        for base in [".js .game .title-card > * { opacity: 0;",  # same specificity: print must come later
                     ".js .game:not(.is-lit) .stage-light { opacity: 0; }",
                     ".js .game:not(.is-lit) { background-color: var(--bg); }",
                     ".js .plate .plate-img, .js .plate .plate-pop { transform: scale(1.045);"]:
            self.assertGreater(at, FLAT.rindex(base), base)

    def test_focus_ring_takes_the_room_colour(self):
        self.assertIn(".game :focus-visible { outline-color: var(--g-accent); }", FLAT)


if __name__ == "__main__":
    unittest.main()
```

**`tests/test_images.py` 수정.**
- `EXPECTED`에서 `"fsg-tile-640.webp": (640, 360), "otr-tile-640.webp": (640, 360),` 줄을 지운다.
- `test_pop_box` 다음에 아래 테스트를 더한다.

```python
    def test_tiles_removed(self):
        for name in ["fsg-tile-640.webp", "fsg-tile-960.webp", "otr-tile-640.webp", "otr-tile-960.webp"]:
            self.assertFalse((IMG / name).exists(), name)
```

- [ ] **Step 2: 실패하는 브라우저 테스트 쓰기**

**`tests/browser/stage.html`.** `verify.html`을 복사하고 `./verify.test.js`를 `./stage.test.js`로 바꾼다.

**`tests/browser/stage.test.js` (새 파일, Task 3 부분).** `openHtml`과 `wait`는 Task 4의 테스트가 쓰므로 지금 같이 불러 둔다.

```js
import { test, assert, assertEq, assertClose, openPage, openHtml, wait, waitFor } from './harness.js';

const SIZES = [[360, 780], [390, 844], [768, 1024], [844, 390], [1280, 800], [1920, 1080], [2560, 1080]];
const ROOM = { feelsogut: 'rgb(13, 14, 56)', otr: 'rgb(11, 16, 25)' };

// Computed colours come back as rgb(), or as color(srgb r g b) for color-mix().
function rgb(str) {
  const m = str.match(/^rgba?\(([^)]+)\)/);
  if (m) return m[1].split(/[ ,]+/).slice(0, 3).map(Number);
  const c = str.match(/^color\(srgb ([^)]+)\)/);
  if (c) return c[1].split(' ').slice(0, 3).map((v) => Number(v) * 255);
  throw new Error(`unparsed colour ${str}`);
}

function contrast(a, b) {
  const lum = (c) => {
    const [r, g, bl] = c.map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test('figures step out of the plate in register, clear of the logline', async () => {
  for (const page of ['/?nointro&reducemotion', '/en/?nointro&reducemotion']) {
    for (const [w, h] of SIZES) {
      const { win, doc, close } = await openPage(page, { width: w, height: h });
      await doc.fonts.ready;
      const room = doc.getElementById('game-feelsogut');
      const popEl = room.querySelector('.plate-pop');
      await waitFor(() => win.getComputedStyle(popEl).transform === 'none', 3000);
      const frame = room.querySelector('.plate-frame').getBoundingClientRect();
      const pop = popEl.getBoundingClientRect();
      const fig = popEl.querySelector('img').getBoundingClientRect();
      const logline = room.querySelector('.logline').getBoundingClientRect();
      const at = `${page} ${w}x${h}`;
      assertClose(pop.left, frame.left, 1, `${at} left`);
      assertClose(pop.right, frame.right, 1, `${at} right`);
      assertClose(pop.bottom, frame.bottom, 1, `${at} bottom`);
      assertClose(pop.height, pop.width * 9 / 16, 1, `${at} 16:9`);
      assert(fig.top < frame.top, `${at}: the figures stay inside the frame`);
      assert(fig.top - logline.bottom >= 21, `${at}: figures ${Math.round(fig.top - logline.bottom)}px from the logline`);
      close();
    }
  }
}, { timeout: 90000 });

test('Hangul labels carry no tracking; tracked Latin labels stay centred', async () => {
  const ko = await openPage('/?nointro', { width: 1280, height: 800 });
  for (const el of ko.doc.querySelectorAll('.tile-stage, .next-label')) {
    const cs = ko.win.getComputedStyle(el);
    assert(['normal', '0px'].includes(cs.letterSpacing), `ko .${el.className} tracking ${cs.letterSpacing}`);
    assertEq(cs.marginRight, '0px', `ko .${el.className} margin-right`);
  }
  ko.close();
  const en = await openPage('/en/?nointro', { width: 1280, height: 800 });
  for (const el of en.doc.querySelectorAll('.tile-stage, .next-label')) {
    const cs = en.win.getComputedStyle(el);
    assertEq(cs.letterSpacing, '2.88px', `en .${el.className} tracking`);
    assertEq(cs.marginRight, '-2.88px', `en .${el.className} margin-right`);
  }
  en.close();
});

test('status tags read at 4.5:1 or better in the lit rooms', async () => {
  const { win, doc, close } = await openPage('/?nointro&reducemotion', { width: 1280, height: 800 });
  for (const [game, bg] of Object.entries(ROOM)) {
    const room = doc.querySelector(`.game[data-game="${game}"]`);
    await waitFor(() => win.getComputedStyle(room).backgroundColor === bg, 3000);
    const ratio = contrast(rgb(win.getComputedStyle(room.querySelector('.tags .stage')).color), rgb(bg));
    assert(ratio >= 4.5, `${game} stage tag ${ratio.toFixed(2)}:1`);
  }
  close();
}, { timeout: 8000 });
```

**`tests/browser/verify.test.js` 수정.**
- `const kb = …` 다음 줄에 `const ROOM = { feelsogut: 'rgb(13, 14, 56)', otr: 'rgb(11, 16, 25)' };`를 둔다.
- `JavaScript off` 테스트의 반복문 안, 메일 링크 단언 바로 앞에 아래를 넣는다.

```js
    const rooms = doc.querySelectorAll('.game');
    assertEq(rooms.length, 2, `${page}: rooms`);
    for (const room of rooms) assertEq(win.getComputedStyle(room).backgroundColor, ROOM[room.dataset.game], `${page}: #${room.id} lit without JS`);
    const lines = doc.querySelectorAll('.title-card > *');
    assertEq(lines.length, 9, `${page}: title card lines`);
    for (const el of lines) assertEq(win.getComputedStyle(el).opacity, '1', `${page}: title card line hidden`);
    assertEq(win.getComputedStyle(doc.querySelector('.title-menu'), '::after').opacity, '0', `${page}: band shown without JS`);
```

- [ ] **Step 3: 실패 확인**

Run:
- `python -m unittest discover -s tests -p "test_*.py"`
- `python tools/browser_test.py stage verify --timeout=200`

Expected:
- **단위 테스트.** `Ran 60 tests`, `FAILED`.
  - 실패: `test_redesign`의 대부분, 그리고 `test_tiles_removed`.
  - 통과: 기존 41개, `test_size_attrs_match_files` (지금 페이지에는 `fsg-pop`이 없다), 그리고 지금 CSS에서도 성립하는 토큰 테스트 일부.
- **`stage`: `RESULT: FAIL 3/3`.**
  - 인물: `waitFor timed out after 3000ms` (`.plate-pop` 없음)
  - 라벨: 자간 또는 `margin-right`
  - 태그: 방 색 시간 초과
- **`verify`: `RESULT: FAIL 1/5`.** 메시지는 `JavaScript off …: /: #game-otr lit without JS expected "rgb(11, 16, 25)", got "rgb(6, 7, 10)"`.

- [ ] **Step 4: 시안의 페이지와 스타일 옮기기, 그리고 걸리는 것 확인**

```bash
cp .cache/redesign/prototype/site/index.html site/index.html
cp .cache/redesign/prototype/site/en/index.html site/en/index.html
cp .cache/redesign/prototype/site/assets/css/site.css site/assets/css/site.css
python -m unittest discover -s tests -p "test_*.py"
```
Expected: `Ran 60 tests`, 정확히 4개가 실패한다. 각각 Step 5에서 고친다.
- `test_tiles_removed`
- `test_size_attrs_match_files`: `fsg-pop.webp 641x598 vs 1371x598`. 시안의 크기 표기 실수를 이 테스트가 잡는다.
- `test_html_matches_image`
- `test_focus_ring_takes_the_room_colour`

- [ ] **Step 5: 스펙대로 고치기**

1. **인물 이미지 크기 표기 (스펙 §5.5).** 두 페이지에서 `fsg-pop.webp" alt="" loading="lazy" width="641" height="598"`의 `641`을 `1371`로 고친다.
2. **타일 정리 (스펙 §9.2).**
   - `tools/build_images.py`에서 `widths(hero, "fsg-tile", [960, 640])`와 `widths(cover(otr("인트로4.jpg"), (1600, 900)), "otr-tile", [960, 640])` 두 줄을 지운다. `cover()`는 다른 곳에서도 쓰므로 남긴다.
   - `git rm site/assets/img/fsg-tile-640.webp site/assets/img/fsg-tile-960.webp site/assets/img/otr-tile-640.webp site/assets/img/otr-tile-960.webp`
3. **영어 가운데 라벨의 자간 되돌리기 (스펙 §4.2).** `site.css`에서 `:lang(ko) :is(.tile-stage, …) { letter-spacing: 0; }` 줄을 아래 두 줄로 바꾼다.

```css
.tile-stage, .next-label { margin-right: calc(-1 * var(--caps)); }  /* centred: give back the tracking after the last letter */
:lang(ko) :is(.tile-stage, .intro-btn, #lightbox [data-close], .next-label) { letter-spacing: 0; margin-right: 0; }
```

4. **방 안의 포커스 색 (스펙 §5.6).**
   - `.game .wrap { position: relative; }` 다음 줄에 `.game :focus-visible { outline-color: var(--g-accent); }`를 넣는다.
   - 이 규칙이 대신하는 `.shots button:focus-visible { outline-color: var(--g-accent); }`와 `.next:focus-visible { outline-color: var(--g-accent); }` 두 줄은 지운다.
5. **인물 위치 주석 (스펙 §5.5).** `.plate-pop` 위 주석의 마지막 줄 `The percentages are the sprite's box in the 1920x1080 scene (printed by build_images.py). */`를 아래 두 줄로 바꾼다.

```css
   The percentages are POP_BOX in tools/build_images.py as shares of the 1920x1080 scene;
   tests/test_redesign.py keeps them in sync. */
```

- [ ] **Step 6: 통과 확인**

Run:
- `python -m unittest discover -s tests -p "test_*.py"`
- `python tools/browser_test.py smoke ui intro run layout verify stage --timeout=200`

Expected:
- 단위 테스트: `Ran 60 tests … OK`
- 브라우저 테스트: 7개 묶음 모두 `RESULT: PASS` (3, 8, 8, 12, 2, 5, 3 = 41)

- [ ] **Step 7: 커밋**

```bash
git add site/index.html site/en/index.html site/assets/css/site.css tools/build_images.py tests/test_redesign.py tests/test_images.py tests/browser/stage.html tests/browser/stage.test.js tests/browser/verify.test.js
git commit -m "feat: blackout-theater pages (posters, game rooms, plates, studio)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

`git rm`으로 지운 타일 4개는 이미 스테이징돼 있어 함께 커밋된다.

---

### Task 4: 조명과 선택 띠 (JavaScript)

**Files:**
- Create: `site/assets/js/stage.js`
- Modify: `site/assets/js/main.js`, `site/assets/js/menu.js`, `site/assets/css/site.css`
- Test: `tests/browser/stage.test.js`

**Interfaces:**
- Consumes: Task 3의 마크업과 CSS 계약, `stage.test.js`의 `ROOM`
- Produces:
  - **`export function initStage(root: Document | Element): void`** (`site/assets/js/stage.js`, 아래 Step 3에 전문).
  - **`main.js`.** import 뒤에서 `doc.documentElement.classList.add('js')`를 부르고, 곧바로 `initStage(doc)`를 부른다. 둘 다 `runIntro(doc)`와 다른 모든 `init…`보다 앞이다.
  - **`initMenu(nav)`** (`menu.js`, 시안 그대로). 기존 방향키 동작에 다음을 더한다.
    - 링크를 가리키는 위치와 폭을 `nav.style`의 `--band-x`, `--band-w`에 `${offsetLeft}px`, `${offsetWidth}px`로 넣는다.
    - 이벤트별 동작:
      - `pointerover`, `focusin`: 그 링크로 옮긴다.
      - `pointerleave`: 쉬는 자리로 돌아간다.
      - `focusout`: `requestAnimationFrame` 뒤에 쉬는 자리로 돌아간다.
      - nav의 `ResizeObserver`: 쉬는 자리를 다시 잰다.
    - 쉬는 자리는 포커스가 있는 메뉴 링크다. 메뉴 밖에 포커스가 있으면 첫 링크다.
    - 마지막에 `nav.classList.add('has-band')`를 부른다.

**Rulings (계획 검토에서 나온 것. 스펙 §4.4, §5.3, §6, §11에 반영됨).**
- **호출 순서.**
  - `header.js`는 `IntersectionObserver`를 확인 없이 쓴다. 그래서 IO가 없으면 예외가 나고, 모듈의 나머지가 실행되지 않는다.
  - 시안처럼 `initStage`가 그 뒤에 있으면, `js`만 붙은 채 방이 영원히 어둡게 남는다.
  - 그래서 `initStage`를 가장 먼저 부른다.
- **방 자체도 지켜본다.**
  - 시안은 타이틀 카드만 지켜봤다. 그래서 카드보다 아래로 들어오면(새로고침 후 스크롤 복원, 아래 방에서 올라옴) 방이 어둡게 남았다.
  - 이제 방의 가장자리가 들어올 때도 확인한다. 카드가 이미 화면 안이나 위에 있으면 바로 켠다. 카드가 아직 아래에 있으면 카드를 기다린다 (카드 등장이 화면 밖에서 지나가지 않게).
- **전환은 켜진 상태에만 둔다.**
  - 시안은 전환을 꺼진 상태(기본) 규칙에 걸었다.
  - 그래서 페이지가 `js` 없이(켜진 모습으로) 먼저 그려진 뒤 `js`가 붙으면, 방이 꺼지는 2초짜리 전환이 돌았다 (검토에서 측정: 방 안에서 전환 25개).
  - 꺼진 상태로는 바로 바뀌고, 켜질 때만 움직이게 한다.

- [ ] **Step 1: 실패하는 브라우저 테스트 쓰기 (`tests/browser/stage.test.js` 끝에 이어서)**

```js
test('loading the page starts no lighting transitions', async () => {
  const { doc, close } = await openPage('/?nointro', { width: 1280, height: 800 });
  const running = doc.getAnimations().filter((a) => a.effect?.target?.closest?.('.game'));
  assertEq(running.length, 0, 'room transitions running at load');
  close();
});

test('a room lights when its title card arrives, only that room, and stays lit', async () => {
  const { win, doc, close } = await openPage('/?nointro', { width: 1280, height: 800 });
  const fsg = doc.getElementById('game-feelsogut');
  const otr = doc.getElementById('game-otr');
  for (const room of [fsg, otr]) {
    assert(!room.classList.contains('is-lit'), `#${room.id} lit before arriving`);
    assertEq(win.getComputedStyle(room).backgroundColor, 'rgb(11, 11, 12)', `#${room.id} starts dark`);
  }
  // The room's top edge is in view but its card is still below the fold: not yet.
  win.scrollTo({ top: fsg.offsetTop - win.innerHeight * 0.88 + 60, behavior: 'instant' });
  await wait(300);
  assert(!fsg.classList.contains('is-lit'), 'lit before the card arrived');
  fsg.querySelector('.title-card').scrollIntoView({ block: 'center', behavior: 'instant' });
  await waitFor(() => fsg.classList.contains('is-lit'), 2000);
  assert(!otr.classList.contains('is-lit'), 'the next room lit early');
  await waitFor(() => win.getComputedStyle(fsg).backgroundColor === ROOM.feelsogut, 3500);
  win.scrollTo({ top: 0, behavior: 'instant' });
  await wait(300);
  assert(fsg.classList.contains('is-lit'), 'the room went dark again');
  close();
}, { timeout: 10000 });

test('landing inside a room below its title card lights it', async () => {
  const { doc, close } = await openPage('/?nointro', { width: 1280, height: 800 });
  doc.querySelector('#game-otr .next').scrollIntoView({ block: 'center', behavior: 'instant' });
  await waitFor(() => doc.getElementById('game-otr').classList.contains('is-lit'), 2000);
  close();
}, { timeout: 6000 });

test('reduced motion, or no IntersectionObserver: every room and plate lit at load', async () => {
  const a = await openPage('/?nointro&reducemotion', { width: 1280, height: 800 });
  for (const el of a.doc.querySelectorAll('.game, [data-drift]')) assert(el.classList.contains('is-lit'), `reducemotion: ${el.id || el.className}`);
  a.close();
  // header.js throws without IntersectionObserver, so main.js stops there; the rooms must be lit anyway.
  const html = (await (await fetch('/')).text())
    .replace('<head>', "<head><script>sessionStorage.setItem('ko:intro','1');delete window.IntersectionObserver;</script>");
  const b = await openHtml(html, { width: 1280, height: 800 });
  assert(b.doc.documentElement.classList.contains('js'), 'main.js did not run');
  for (const el of b.doc.querySelectorAll('.game, [data-drift]')) assert(el.classList.contains('is-lit'), `no IO: ${el.id || el.className}`);
  b.close();
}, { timeout: 8000 });

test('title card lines arrive one after another', async () => {
  const { win, doc, close } = await openPage('/?nointro&reducemotion', { width: 1280, height: 800 });
  const delays = (id) => JSON.stringify([...doc.querySelectorAll(`#${id} .title-card > *`)].map((el) => parseFloat(win.getComputedStyle(el).transitionDelay)));
  assertEq(delays('game-feelsogut'), '[0,0.12,0.24,0.36]');
  assertEq(delays('game-otr'), '[0,0.12,0.24,0.36,0.48]');
  close();
});

test('a deep link lights the room it lands in', async () => {
  const { doc, close } = await openPage('/#game-otr', { width: 1280, height: 800 });
  await waitFor(() => doc.getElementById('game-otr').classList.contains('is-lit'), 3000);
  close();
}, { timeout: 6000 });

test('plates sit pushed in until they arrive', async () => {
  const { win, doc, close } = await openPage('/?nointro', { width: 1280, height: 800 });
  const plate = doc.querySelector('#game-otr .plate');
  assert(!plate.classList.contains('is-lit'), 'plate lit early');
  assertEq(win.getComputedStyle(plate.querySelector('.plate-img')).transform, 'matrix(1.045, 0, 0, 1.045, 0, 0)', 'plate not pushed in');
  plate.scrollIntoView({ block: 'center', behavior: 'instant' });
  await waitFor(() => plate.classList.contains('is-lit'), 2000);
  close();
}, { timeout: 6000 });

test('selection band rests on GAMES, follows focus, pointer and width changes, and comes back', async () => {
  const { win, doc, close } = await openPage('/?nointro', { width: 1280, height: 800 });
  await doc.fonts.ready;
  win.focus();
  const nav = doc.querySelector('.title-menu');
  const [games, studio, contact] = nav.querySelectorAll('a[data-menu]');
  const band = () => `${nav.style.getPropertyValue('--band-x')} ${nav.style.getPropertyValue('--band-w')}`;
  const on = (a) => `${a.offsetLeft}px ${a.offsetWidth}px`;
  assert(nav.classList.contains('has-band'), 'band not switched on');
  await waitFor(() => win.getComputedStyle(nav, '::after').opacity === '1', 1000);
  await waitFor(() => band() === on(games), 500);
  const before = on(games);
  games.style.letterSpacing = '.5em';  // stands in for a web font arriving late
  assert(on(games) !== before, 'link width did not change');
  await waitFor(() => band() === on(games), 500);
  games.style.letterSpacing = '';
  await waitFor(() => band() === on(games), 500);
  studio.focus();
  assertEq(band(), on(studio), 'focus');
  studio.blur();
  await waitFor(() => band() === on(games), 500);
  contact.dispatchEvent(new win.PointerEvent('pointerover', { bubbles: true }));
  assertEq(band(), on(contact), 'pointer');
  nav.dispatchEvent(new win.PointerEvent('pointerleave'));
  assertEq(band(), on(games), 'pointer left');
  close();
});
```

- [ ] **Step 2: 실패 확인**

Run: `python tools/browser_test.py stage --timeout=200`
Expected: `RESULT: FAIL 7/11`.
- 통과 4개: Task 3의 셋, 그리고 `loading the page starts no lighting transitions`. 아직 `js`가 붙지 않으니 전환도 없다. 이 테스트의 RED는 Step 4에서 본다.
- 실패 7개:
  - `#game-feelsogut starts dark expected "rgb(11, 11, 12)", got "rgb(13, 14, 56)"`
  - 카드 아래로 들어옴: `waitFor timed out after 2000ms`
  - `reducemotion: game-feelsogut`
  - 시차: `got "[0,0,0,0]"`
  - 딥 링크: `waitFor timed out after 3000ms`
  - `plate not pushed in … got "none"`
  - `band not switched on`

- [ ] **Step 3: 스크립트 옮기기와 고치기**

```bash
cp .cache/redesign/prototype/site/assets/js/main.js site/assets/js/main.js
cp .cache/redesign/prototype/site/assets/js/menu.js site/assets/js/menu.js
```

**`main.js`.** `js` 클래스를 붙이는 부분과 초기화 순서를 아래처럼 바꾼다. 시안은 `initStage(doc);`를 `initLightbox(…)` 뒤에 두었다.

```js
// Styles that hide things until a script reveals them key off .js, so they only apply
// once this module (the thing that reveals them) is actually running. The stage starts
// right after, before anything that could throw (header.js needs IntersectionObserver),
// so a failing module can never leave a room dark.
doc.documentElement.classList.add('js');
initStage(doc);

runIntro(doc);

initMenu(doc.querySelector('.title-menu'));
initStickyHeader(doc.querySelector('[data-header]'), doc.getElementById('top'));
initLightbox(doc, doc.getElementById('lightbox'));
```

**`site/assets/js/stage.js` (새 파일).** 시안의 `stage.js`에 방 자체를 지켜보는 부분을 더한 것이다.

```js
// Lights up each game's room when its title card comes into view (so the card's line-by-line
// entrance plays where it can be seen), and pushes each key-art plate in when it arrives.
// Arriving inside a room below its card (a restored scroll position, scrolling back up from
// the next room) lights it at once. Without IntersectionObserver, or with reduced motion,
// everything starts lit.
export function initStage(root) {
  const rooms = [...root.querySelectorAll('.game')];
  const plates = [...root.querySelectorAll('[data-drift]')];
  const reduce = window.__koIntro?.rm || matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    [...rooms, ...plates].forEach((el) => el.classList.add('is-lit'));
    return;
  }
  const light = (room) => {
    room.classList.add('is-lit');
    io.unobserve(room);
    io.unobserve(room.querySelector('.title-card'));
  };
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target;
      if (el.matches('.title-card')) light(el.closest('.game'));
      else if (el.matches('.game')) {
        // The room's edge is in view: light it only if its card is already in view or above it.
        const bottom = e.rootBounds ? e.rootBounds.bottom : innerHeight;
        if (el.querySelector('.title-card').getBoundingClientRect().top < bottom) light(el);
      } else {
        el.classList.add('is-lit');
        io.unobserve(el);
      }
    }
  }, { rootMargin: '0px 0px -12% 0px' });
  for (const room of rooms) {
    io.observe(room.querySelector('.title-card'));
    io.observe(room);
  }
  plates.forEach((el) => io.observe(el));
}
```

- [ ] **Step 4: 남은 실패가 "열 때 꺼지는 전환"인지 확인 (CSS 수정의 RED)**

Run: `python tools/browser_test.py stage --timeout=200`
Expected: `RESULT: FAIL 3/11`. 셋 모두 `js`가 붙을 때 꺼지는 쪽으로 도는 전환 때문이다.
- `room transitions running at load expected 0, got 25` (개수는 조금 다를 수 있다)
- `#game-feelsogut starts dark expected "rgb(11, 11, 12)", got "rgb(…)"` (켜진 색에서 꺼지는 중)
- `plate not pushed in … got "matrix(1, …)"` (밀어 넣기 쪽으로 가는 중)

나머지 8개는 통과한다: 카드 아래로 들어옴, IO 없음, 시차, 딥 링크, 선택 띠, Task 3의 셋.

- [ ] **Step 5: 전환을 켜진 상태로 옮기기 (`site/assets/css/site.css`, 스펙 §4.4)**

1. **설명 주석.** `/* Each room starts as dark as the stage …` 주석 끝에 두 줄을 더한다.

```css
   Transitions sit on the lit state only: the page is first styled without .js (lit), and
   main.js adding .js must switch it to dark at once, not fade the lights out. */
```

2. **방 바탕색.**
   - `.game { … }`에서 `transition: background-color var(--d4) var(--ease-out);` 줄을 지운다.
   - `.js .game:not(.is-lit) { background-color: var(--bg); }` 다음 줄에 `.js .game.is-lit { transition: background-color var(--d4) var(--ease-out); }`를 넣는다.
3. **조명 레이어.**
   - `.stage-light { … }` 규칙을 `.stage-light { position: absolute; inset: 0; pointer-events: none; }` 한 줄로 바꾼다 (전환 삭제).
   - `.js .game:not(.is-lit) .stage-light { opacity: 0; }` 다음 줄에 `.js .game.is-lit .stage-light { transition: opacity var(--d4) var(--ease-out); }`를 넣는다.
4. **타이틀 카드 줄.** 두 줄을 아래로 바꾼다. 줄별 지연(`:nth-child`) 규칙은 그대로 둔다. 선택자가 더 구체적이라 계속 이긴다.

```css
.js .game .title-card > * { opacity: 0; transform: translateY(13px); }
.js .game.is-lit .title-card > * { opacity: 1; transform: none; transition: opacity var(--d3) var(--ease-out), transform var(--d3) var(--ease-out); }
```

5. **판.** 두 줄을 아래로 바꾼다.

```css
.js .plate .plate-img, .js .plate .plate-pop { transform: scale(1.045); }
.js .plate.is-lit .plate-img, .js .plate.is-lit .plate-pop { transform: none; transition: transform var(--d4) var(--ease-out); }
```

- [ ] **Step 6: 통과 확인**

Run:
- `python tools/browser_test.py smoke ui intro run layout verify stage --timeout=200`
- `python -m unittest discover -s tests -p "test_*.py"`

Expected:
- 브라우저 테스트: 7개 묶음 모두 `RESULT: PASS` (3, 8, 8, 12, 2, 5, 11 = 49)
- 단위 테스트: `Ran 60 tests … OK`. 인쇄 테스트가 확인하는 기본 규칙의 앞부분은 이 수정 뒤에도 그대로다.

`verify`의 "JavaScript off" 테스트는 스크립트를 지운 HTML을 쓰므로 그대로 통과해야 한다.

- [ ] **Step 7: 커밋**

```bash
git add site/assets/js/stage.js site/assets/js/main.js site/assets/js/menu.js site/assets/css/site.css tests/browser/stage.test.js
git commit -m "feat: rooms light up as you arrive; title-menu selection band" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: 마무리 점검

**Files:**
- 바꾸는 파일 없음. 점검에서 고칠 것이 나오면 그 파일을 고치고, 고치는 테스트를 먼저 쓴다.

**Interfaces:**
- Consumes: Task 1~4의 결과 전부, `.cache/redesign/verified/`
- Produces: 점검 기록 (ledger), 스크린숏 (`.cache/redesign/final/`, 커밋 안 됨)

- [ ] **Step 1: 미리 돌려 본 최종 파일과 비교**

```bash
for f in $(cd .cache/redesign/verified && find . -type f | sed 's|^\./||'); do cmp -s "$f" ".cache/redesign/verified/$f" && echo "same $f" || echo "DIFF $f"; done
```
Expected: 12줄 모두 `same`.

`DIFF`가 있으면 `diff -u .cache/redesign/verified/<경로> <경로>`로 본다.
- 주석 문구나 테스트 서식만 다르면 받아들이고 Ruling으로 남긴다.
- 코드가 다르면 계획과 대조해 고친다.

- [ ] **Step 2: 시안과 달라진 곳 확인**

```bash
for f in $(cd .cache/redesign/prototype && find site tools -type f); do cmp -s "$f" ".cache/redesign/prototype/$f" || echo "differs: $f"; done
git diff main --stat
```

Expected: `differs:`는 아래 여섯 파일뿐이다.
- `site/index.html`, `site/en/index.html`: `fsg-pop` 크기 표기
- `site/assets/css/site.css`: 라벨 되돌리기, 포커스 색, 주석, 켜진 상태 전환
- `site/assets/js/main.js`: 호출 순서와 주석
- `site/assets/js/stage.js`: 방 자체 지켜보기
- `tools/build_images.py`: `POP_BOX`, 타일 두 줄 삭제

`git diff main --stat`에는 아래만 나온다.
- 이 계획에서 만들거나 고친 파일
- 타일 4개 삭제
- 문서 2개

`card/`와 개인 정보는 없어야 한다.

- [ ] **Step 3: 전체 테스트**

Run:
- `python -m unittest discover -s tests -p "test_*.py"`
- `python tools/browser_test.py smoke ui intro run layout verify stage --timeout=200`

Expected:
- 단위 테스트: `Ran 60 tests … OK`
- 브라우저 테스트: 7개 묶음 모두 `RESULT: PASS` (49)

- [ ] **Step 4: 스크린숏으로 눈 확인 (스펙 §10)**

```bash
mkdir -p .cache/redesign/final
for page in "/" "/en/"; do
  tag=$([ "$page" = "/" ] && echo ko || echo en)
  for size in "360 780 mobile" "390 844 mobile" "768 1024" "1280 800" "1440 900" "1920 1080" "2560 1080"; do
    set -- $size
    python .cache/redesign/shot.py "http://127.0.0.1:8080${page}?nointro&reducemotion" ".cache/redesign/final/$tag-$1x$2" $size -- \
      "document.getElementById('games').scrollIntoView({behavior:'instant'})" \
      "document.querySelector('#game-feelsogut .title-card').scrollIntoView({behavior:'instant'})" \
      "document.querySelector('#game-otr .title-card').scrollIntoView({behavior:'instant'})" \
      "document.querySelector('#game-feelsogut .next').scrollIntoView({behavior:'instant', block:'center'})" \
      "document.getElementById('studio').scrollIntoView({behavior:'instant'})"
  done
done
```

Expected: 70장이 생긴다 (두 언어 × 7크기 × 5장면). 각 장에서 다음을 본다.
- 인물이 로그라인을 가리지 않는다.
- 포스터 제목이 넘치지 않는다.
- 수상 표기가 두 줄로 월계수 사이에 들어간다.
- 한글 라벨에 자간이 없고, 영어 라벨은 가운데에 있다.

문제가 보이면 고치는 테스트를 먼저 쓰고 고친다.

- [ ] **Step 5: 사용자가 실제 움직임 확인 (스펙 §10)**

조명이 켜지는 속도와 판이 밀려 들어오는 느낌은 스크린숏으로 판단할 수 없다. 사용자에게 아래 주소를 주고, 두 방을 스크롤로 지나가 보게 한다.
- http://127.0.0.1:8080/?nointro
- http://127.0.0.1:8080/en/?nointro

개발 서버(`python tools/serve.py --port 8080`)가 돌고 있어야 한다. 사용자의 의견을 ledger에 남긴다. 배포 뒤에는 휴대폰 실기기에서도 확인해야 한다는 점을 함께 알린다.

- [ ] **Step 6: 정리와 합치기 결정**

- `.cache/redesign/prototype/`와 `.cache/redesign/verified/`는 최종 검토가 끝날 때까지 남겨 둔다. 저장소에는 들어가지 않는다.
- 작업 트리가 깨끗한지 확인한다: `git status --short`의 출력이 비어 있어야 한다.
- 합치기와 배포는 사용자에게 묻는다 (superpowers:finishing-a-development-branch). `main`에 합치는 것이 곧 배포다.

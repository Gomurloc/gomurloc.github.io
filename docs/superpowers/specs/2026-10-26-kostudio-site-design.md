# KO Studio 웹사이트 설계 (kostudio.org)

- 작성일: 2026-10-26
- 상태: 사용자 검토 대기
- 대상 주소: https://kostudio.org (영어판 https://kostudio.org/en/)
- 저장소: `Gomurloc/gomurloc.github.io` (이 폴더)

> 이 저장소는 GitHub Pages 무료 사용을 위해 **공개**된다. 이 문서도 누구나 볼 수 있으므로 전화번호, 개인 메일, 미공개 작품 이름, 팀원의 내부 일정, 비공개 저장소 이름은 적지 않는다. 그런 내용은 저장소 밖의 개인 메모에 둔다.

---

## 1. 목적과 성공 기준

**목적.** KO Studio의 공식 홈을 만든다. 퍼블리셔·파트너, 플레이어, 채용·외주 담당자가 모두 보는 곳이다. 지금 참여하고 있는 게임을 소개하고, 메일로 연락받는 것이 핵심이다.

**성공 기준.**
1. 처음 온 사람이 첫 화면에서 30초 안에 "어떤 스튜디오가, 무슨 게임을 만드는지" 알 수 있다.
2. 어느 화면에서든 두 번 이내의 동작으로 `ko@kostudio.org` 메일 쓰기 창을 열 수 있다.
3. 게임을 추가하거나 개발 단계를 바꿀 때 두 파일(`/`, `/en/`)에서 그 게임의 타일과 섹션만 고치면 된다.
4. 휴대폰(가로 360px)부터 데스크톱(1920px), 가로로 긴 창(21:9)까지 레이아웃이 깨지지 않는다.
5. kostudio.org를 GitHub Pages로 옮기는 동안과 그 뒤에도 Google Workspace 메일이 끊기지 않는다.

## 2. 범위

**포함.**
- 한 페이지 구성의 한국어 사이트(`/`)와 영어 사이트(`/en/`)
- 스플래시 모션(v9 "한지 종이 인형")을 옮긴 첫 방문 인트로
- 타이틀 메뉴, 게임 선택, 게임 섹션 2개(FeelSoGut!, OFF THE RECORD), 스튜디오 소개, 연락처
- 미공개 게임의 잠긴 타일 1개 (11장 5번에서 사용자가 넣기로 할 때만)
- 파비콘, 링크 미리보기(Open Graph) 이미지, 404 페이지
- GitHub Pages 배포와 Squarespace DNS 전환

**제외 (YAGNI).**
- 플레이 영상. 지금 파일이 없으므로 이미지로만 만든다. 영상이 생기면 13장의 후속 작업으로 넣는다.
- 블로그·개발일지, 로그인, 결제·스토어, 뉴스레터, 문의 폼, 방문자 분석 도구
- 게임별 상세 페이지 (출시가 가까워지면 별도 작업)
- 게임 빌드 파일 호스팅 (FeelSoGut! 빌드는 1GB가 넘어 Pages에 올릴 수 없다)

## 3. 브랜드와 디자인 원칙

**콘셉트: "사이트는 어두운 극장, 게임마다 자기 조명."** 스튜디오 공통 요소는 KO Studio 브랜드로 묶고, 게임 섹션 안에서만 그 게임의 색과 글꼴을 쓴다.

### 3.1 스튜디오 공통 토큰

출처: 사용자가 준 브랜드 자료 (스플래시 `KO-studio_splash.html`, 명함 생성기 `card/index.html`).

| 토큰 | 값 | 쓰임 |
|---|---|---|
| `--bg` | `#0b0b0c` | 페이지 배경 (먹색) |
| `--panel` | `#141416` | 타일, 카드 바탕 |
| `--line` | `#2a292e` | 구분선, 테두리 |
| `--text` | `#e9e4da` | 본문 글자 (한지색) |
| `--muted` | `#8a857c` | 보조 글자, 라벨 |
| `--red` | `#c41e2a` | 포인트 (메뉴 커서, 포커스 테두리, 링크 밑줄) |
| `--red-line` | `#8f1220` | 섹션 구분선 (명함 B안 앞면에서 인형의 목을 가로지르는 가는 선) |
| `--blood` | `#7a0d18` | 핏방울 깊은 색 (장식에만) |
| `--warm` | `#1b1917` | 스포트라이트 주변의 따뜻한 검정 |

- **글꼴.** 모두 저장소에 넣어 직접 제공한다(6.1). 라이선스는 모두 OFL이다.
  - Jost 400/500: 라틴 문자, UI 라벨
  - Noto Serif KR 500: 한글
  - Big Shoulders Display 900: OFF THE RECORD 제목에만
- **모티프.**
  - 로고의 핏방울: 메뉴 커서(▶ 대신)와 메일 주소의 `@` 뒤 장식.
  - 스포트라이트: 섹션 배경에 위에서 떨어지는 은은한 방사형 빛.
  - 가는 핏빛 가로선(`--red-line`): 섹션 구분선.
- **대비.** `--text` on `--bg`는 약 15:1, `--muted`는 약 5.3:1이다. `--red`는 먹색 위에서 약 3.4:1이라 글자색으로 쓰지 않고 선·점·밑줄에만 쓴다.

### 3.2 게임별 토큰 (게임 섹션 안에서만)

| 게임 | 배경 | 주 강조 | 보조 강조 | 제목 처리 |
|---|---|---|---|---|
| FeelSoGut! | `#0D0E38` (밤 남색) | `#FF0099` (마젠타) | `#21D3ED` (시안) | 게임 로고 이미지 |
| OFF THE RECORD | `#06070A` | `#D9A521` (선체 노랑) | `#2E9C97` (청록) | Big Shoulders Display 900, 팀 페이지와 같은 스텐실 처리 |

색 출처는 FeelSoGut! 게임 아트와 발표 자료, OFF THE RECORD 팀 페이지의 CSS다.

## 4. 페이지 구조

한국어와 영어 페이지는 같은 구조다.

```
[인트로]  첫 방문에만, 건너뛰기 가능
[1. 타이틀]  K·O 로고 + 메뉴(GAMES / STUDIO / CONTACT) + KO/EN
[2. 게임 선택]  SELECT A GAME — 타일 2개 (미공개 게임을 넣기로 하면 3개)
[3. 게임 섹션]  FeelSoGut! → OFF THE RECORD
[4. 스튜디오]
[5. 연락]
[푸터]
```

### 4.1 인트로 (스플래시 포팅)

스플래시 v9의 three.js 장면을 사이트용 모듈로 옮긴다. 장면 전체가 시간의 순수 함수(`render(t)`)라서, 건너뛰기와 로고에서 멈추기는 "어느 시각을 그릴지"만 정하면 된다.

**재생 판단 (`<head>`의 인라인 스크립트, 첫 페인트 전).**
- 아래를 모두 만족하면 `<html>`에 `intro` 클래스를 붙이고, 그 즉시 `sessionStorage`에 `ko:intro`를 기록한다 (그래서 느린 기기에서 대체 동작으로 넘어가도 다음 페이지에서 다시 기다리지 않는다).
  - 이번 세션에서 아직 안 봤다 (`ko:intro` 없음. 읽기가 실패하면 "안 봤다"로 본다).
  - `prefers-reduced-motion: reduce`가 아니다.
  - WebGL 컨텍스트를 만들 수 있다.
  - 주소에 해시(`#contact` 등)가 없다. 특정 섹션으로 바로 들어온 사람은 기다리게 하지 않는다.
- `?intro`는 "이미 봤다" 조건만 무시한다. 움직임 줄이기와 WebGL 조건은 그대로 적용한다.
- 테스트용: `?nointro`는 인트로를 끄고, `?nowebgl`은 WebGL이 없는 것처럼 판단한다.
- **안전장치.** 같은 인라인 스크립트가 4초 타이머를 건다. 타이머가 끝날 때까지 인트로가 실제로 그려지기 시작하지 않으면 `intro` 클래스를 지운다. `main.js`가 불러와지지 않거나 오류로 멈춰도 사이트가 검은 화면에 갇히지 않게 하기 위해서다.

**인트로 중 페이지 상태.**
- 인트로 레이어는 `position: fixed; inset: 0`으로 모든 것 위에 있다.
- `html.intro`일 때 페이지 스크롤을 막고(`overflow: hidden`), `header`, `main`, `footer`에 `inert`를 걸어 Tab 키가 뒤로 들어가지 않게 한다. 고정 헤더도 숨긴다.
- 페이지 내용은 `display: none`으로 지우지 않는다. 인트로 레이어가 덮을 뿐이다.

**끝나는 지점과 넘어가기.**
- 스플래시의 암전(11.17s~)까지 가지 않고, K·O 로고와 "studio"가 완성된 `T_LOGO = 10.27s` 프레임에서 멈춘다.
- 그 프레임과 같은 그림인 정지 이미지(`hero-final.webp`, 타이틀 배경)로 300~400ms 교차 페이드한다. 둘이 똑같이 보이도록 다음을 지킨다.
  - 캔버스와 히어로 이미지는 같은 요소(타이틀 섹션, 높이 `100svh`)의 크기를 기준으로 한다. 캔버스 크기는 `window`가 아니라 `ResizeObserver`로 그 요소에서 읽는다.
  - 캔버스와 정지 이미지 모두 비네트와 그레인 없이 그린다. 비네트는 둘 위에 공통 CSS 레이어 하나로 얹는다. 그레인은 쓰지 않는다.
- 페이드가 끝나면 메뉴가 나타나고, `inert`와 스크롤 막기를 풀고, 맨 위로 스크롤한다. 건너뛰기나 소리 버튼에 포커스가 있었다면 포커스를 첫 메뉴 링크(GAMES)로 옮긴다. 그다음 WebGL 자원을 해제한다.

**건너뛰기.**
- 아래 입력은 즉시 `T_LOGO` 프레임으로 넘어가 위의 넘어가기를 한다.
  - 인트로 화면 클릭·터치(`pointerdown`), 휠(`wheel`), 터치 스크롤(`touchmove`)
  - Tab과 보조키를 뺀 아무 키
  - 왼쪽 아래의 건너뛰기 버튼 (4.9의 문구, 키보드 포커스 가능, 인트로가 시작되면 첫 포커스 대상)
- 위 전역 리스너는 이벤트 대상이 소리 버튼 안이면(`e.target.closest('[data-sound]')`) 무시한다. 키보드로 소리 버튼을 눌러도 인트로가 건너뛰어지지 않게 하기 위해서다.
- 모듈이 아직 준비되기 전에 건너뛰기 입력이 오면, 불러오기를 중단하고 바로 정지 히어로로 간다.
- 인트로가 끝나면 이 리스너들을 모두 제거한다.

**소리.**
- 브라우저 자동 재생 정책 때문에 소리 없이 시작한다.
- 오른쪽 아래에 소리 버튼을 둔다(`aria-pressed`로 켜짐/꺼짐 표시). 누르면 그 시점부터 효과음이 이어서 재생된다. 스플래시의 `play(from)`가 중간 재시작을 지원한다.
- 효과음은 원본처럼 코드로 합성한다(음원 파일 없음).

**화면 비율.** 카메라 위치는 그대로 두고 화각(FOV)만 바꿔 `object-fit: cover`처럼 잘라 보여준다. 세로 화면에서는 좌우가, 16:9보다 넓은 화면에서는 위아래가 잘린다. 세로 휴대폰에서 로고는 화면 폭의 약 85%가 된다.

**로딩.** three.js r160은 인트로를 재생할 때만 동적 `import()`로 불러온다. 재방문자는 받지 않는다. 6.3의 준비 시간 예산(3초)을 넘기면 인트로를 포기하고 정지 히어로로 시작한다.

### 4.2 타이틀 (첫 화면)

- **배경.** `hero-final.webp` (인트로 마지막 프레임과 같은 그림) + 공통 비네트 레이어. 인트로를 보지 않는 경우에도 같은 화면으로 시작한다.
- **제목.** 화면의 로고 그림과 별개로 `<h1>`에 "KO Studio"를 넣는다 (시각적으로 숨김, 스크린 리더와 검색용).
- **메뉴.**
  - 항목: `GAMES`, `STUDIO`, `CONTACT`. 각각 해당 섹션으로 스크롤하는 진짜 `<a>` 링크다. 라벨은 두 언어 모두 브랜드 표기대로 영문 대문자다.
  - 항상 가로 한 줄이다 (360px에서도 들어간다).
  - 위치는 화면이 아니라 cover로 잘린 16:9 그림을 기준으로 정한다. "studio" 라벨 아래에 놓이도록 `top: calc(50% + 0.17 * max(100svh, 56.25vw))`를 쓴다. 16:9보다 넓은 창에서도 라벨과 겹치지 않는다.
  - 핏방울 커서는 처음에 GAMES 앞에 있고, `:focus-visible`과 `:hover`를 따라간다. 터치 기기(`hover: none`)에서는 포커스나 탭에만 따라간다. 마우스 올림으로 요소를 보이거나 숨기지 않는다 (iOS에서 두 번 탭해야 하는 문제를 피하기 위해).
  - ←/→ 키는 메뉴 링크에 포커스가 있을 때만 처리하고, 링크 사이로 실제 포커스를 옮긴다. Enter는 링크 기본 동작이다. 페이지 스크롤 키는 가로채지 않는다.
- **언어.** 오른쪽 위에 `KO / EN`. 현재 언어는 한지색, 다른 언어는 회색. 다른 언어 페이지의 같은 위치로 간다.
- 게임 타이틀 화면 같은 "PRESS ANY KEY" 문구는 넣지 않는다. 인트로가 이미 그 역할을 하고, 정보를 찾는 사람을 늦추지 않기 위해서다.

### 4.3 고정 헤더

타이틀 화면이 화면 밖으로 나가면 위쪽에 얇은 헤더가 나타난다. 인트로 중에는 숨긴다.

- 왼쪽: K·O 마크 (명함 생성기와 같은 좌표로 만든 SVG, 핏방울만 작은 PNG). 누르면 맨 위로 간다.
- 오른쪽: `GAMES · STUDIO · CONTACT · KO/EN`. 휴대폰에서는 `KO/EN`과 메일 아이콘만 남긴다.

### 4.4 게임 선택 (SELECT A GAME)

- 게임 수만큼 가로 타일을 놓는다. 각 타일 구성:
  - 대표 이미지
  - 게임 이름
  - 개발 단계 한 단어 (5장의 "타일 단계")
- 누르면 해당 게임 섹션으로 스크롤한다.
- 미공개 게임 타일(11장 5번에서 넣기로 할 때만): 이미지와 이름 없이 자물쇠 아이콘과 4.9의 "곧 공개" 문구만 보여주고, 누를 수 없다. 넣지 않기로 하면 배포되는 HTML에 주석으로도 흔적을 남기지 않는다.

### 4.5 게임 섹션

각 게임 섹션은 같은 틀을 쓰고, 색과 제목 처리만 3.2의 게임별 토큰을 따른다.

```
[대표 이미지 (16:9)]           [제목 (게임 로고 또는 게임 글꼴)]
                              [크레딧 한 줄 (4.6)]
                              [한 줄 소개]
                              [태그: 장르 · 플랫폼 · 개발 단계]
                              [설명 2~3문장]
                              [수상 표시 (있을 때)]
[스크린샷 3~4장, 가로 줄]
                              [바깥 링크 (있을 때)]
```

- **대표 이미지.** 16:9 이미지 한 장. 화면에 들어올 때 불러온다(`loading="lazy"`).
- **스크린샷.** 누르면 같은 페이지 안에서 크게 본다(`<dialog>`, Esc와 바깥 클릭으로 닫힘, 닫히면 누른 썸네일로 포커스 복귀). 새 창을 띄우지 않는다.
- **크레딧.** 4.6을 따른다. 역할은 게임마다 따로 적고, 확인되지 않은 역할은 적지 않는다.

### 4.6 제작 표기

두 게임 모두 고유준, 이유진, 권유담 세 사람이 함께 만들고 있다. 사이트에는 팀 이름을 쓰지 않고(사용자 결정, 2026-10-27), 대신 팀원 크레딧을 보이게 두어 게임이 한 사람의 작품처럼 보이지 않게 한다.

- 각 게임 제목 아래에 크레딧 한 줄을 둔다. 타일에는 넣지 않는다.
  - OFF THE RECORD: "고유준 기획·사운드 · 이유진 개발 · 권유담 아트" / "Ko Yujun (design, sound) · 이유진 (development) · 권유담 (art)"
  - FeelSoGut!: "고유준 · 이유진 · 권유담" (역할은 11장 3번 답이 오면 추가)
- 영어 페이지의 팀원 이름은 영문 표기를 받을 때까지 한글로 둔다 (11장 4번).

### 4.7 스튜디오

- 두 문단의 소개 글(초안은 5.3). 사용자가 최종 문구를 정한다.

### 4.8 연락 (CONTACT)

- 큰 글씨로 `ko@kostudio.org` (`mailto:` 링크).
  - 주소는 DOM에 진짜 텍스트로 둔다(`@` 포함). 핏방울은 `@` 뒤에 깔리는 장식(가상 요소, `aria-hidden`)이다. 복사·붙여넣기와 스크린 리더가 정확한 주소를 얻어야 하기 때문이다.
- 그 아래 한 줄: "퍼블리싱, 협업, 채용·외주 제안 모두 메일로 받습니다." / "For publishing, collaboration, or job and contract offers, email us."
- 전화번호와 개인 SNS는 넣지 않는다.

### 4.9 푸터와 문구 표

푸터: `© 2026 KO Studio · 게임 제목과 이미지의 저작권은 각 게임 제작진에게 있습니다` (영어: `Game titles and art © their respective creators`) · 인트로 다시 보기 · `KO/EN`.

**문체.** 한국어 문장은 모두 합쇼체(`-습니다`)로 쓴다 (사용자 결정, 2026-10-27). 한 줄 소개 같은 짧은 문구는 명사형이나 표어 형태로 둔다. "인트로 다시 보기"는 인트로가 재생될 수 없는 환경(움직임 줄이기, WebGL 없음)에서는 숨긴다.

| 위치 | 한국어 페이지 | 영어 페이지 |
|---|---|---|
| 건너뛰기 버튼 (왼쪽 아래) | 건너뛰기 | Skip |
| 소리 버튼 (오른쪽 아래) | 소리 켜기 / 소리 끄기 | Sound on / Sound off |
| 푸터 다시 보기 링크 | 인트로 다시 보기 | Replay intro |
| 잠긴 타일 | 곧 공개 | Coming soon |
| 404 제목 | 페이지를 찾을 수 없습니다 | Page not found |
| 404 링크 | 홈으로 가기 | Back to home |

- `404.html`은 한 파일에 두 언어를 함께 적는다. 어느 경로에서든 열리므로 자원 경로는 모두 `/assets/...` 절대 경로로 쓴다.

## 5. 콘텐츠 (초안)

문구는 모두 초안이다. 사용자가 고치면 그것을 따른다.

### 5.1 FeelSoGut! (필소굿)

- **제목 표기.** 화면에는 게임 로고 이미지. 텍스트는 `FeelSoGut!` / 한글 `필소굿`.
- **한 줄 소개.**
  - KO: 박자로 귀신을 달래 보내는 사이버 무속 리듬 게임
  - EN: A one-button cyber-shaman rhythm game.
- **설명.**
  - KO: 할부를 못 내 고철로 압류될 처지의 기계 무당 잭두가, 화면 밖 '신령님'인 당신의 박자를 빌려 주식에 물려 죽은 광대 물귀신을 굿판으로 신나게 놀아 드리고 떠나보냅니다. 캐릭터가 먼저 리듬을 보여주면 버튼 하나로 똑같이 따라 치는 미니게임들이 이어집니다. 네온 사이버 도시와 한국 무속, 주식 은어가 뒤섞인 블랙코미디입니다.
  - EN: Jackdoo, a cyborg shaman about to be repossessed for a missed installment, borrows your beat — you're the offscreen spirit — to throw a ritual party for a clown-faced water ghost who drowned holding a crashed stock, and send him on his way. Characters play a rhythm; you answer with a single button across a run of minigames. Neon cyber-city meets Korean shamanism and stock-forum slang in a black comedy.
- **태그.** 리듬 · 원버튼 · 스토리 · PC / Rhythm · One-button · Narrative · PC
- **개발 단계.** 섹션: "알파 · 개발 중" / "Alpha · In development". 타일 단계: "알파" / "Alpha".
- **크레딧.** 4.6.
- **미디어.** 원본은 팀의 공개 저장소(`rhythm-prototype`)의 `Assets/`.
  - 대표 이미지: 스테이지 1-5 인트로 장면. `Assets/1-5/`의 배경·바다·광대·잭두 레이어를 합성한다 (제목 레이어 제외).
  - 스크린샷: 1-1 파도타기, 1-2 넘기기, 1-4 물타기 인트로 장면 (각각 레이어 합성).
  - 이 컴퓨터의 로컬 사본은 원격보다 뒤처져 있고 작업 중인 변경이 있다. **로컬 사본은 읽기만 하고 fetch, pull, checkout도 하지 않는다.** 최신 그림이 필요하면 공개 원격 저장소에서 `raw.githubusercontent.com`으로 받는다.

### 5.2 OFF THE RECORD (오프 더 레코드)

- **제목 표기.** `OFF THE RECORD` (대문자, Big Shoulders Display 스텐실) / 한글 `오프 더 레코드`. 게임잼 시절의 다른 제목은 쓰지 않는다.
- **한 줄 소개.**
  - KO: 나가서 건지고, 돌아와서 판다
  - EN: Salvage it out there. Sell it back home.
- **설명.**
  - KO: 하늘이 죽고 백 년, 사람은 궤도 정거장에 살고 궤도를 도는 위성·로켓 잔해가 곧 돈입니다. 회사에 빚진 회수원이 되어 잔해에 붙어 화물칸을 열고 화물을 건진 뒤, 정거장에 돌아와 팔아 배를 키워 더 먼 궤도로 나갑니다. 다만 칸을 열수록 시끄러워지고, 소음을 쫓는 스위퍼가 찾아옵니다.
  - EN: A century after the sky died, people live on orbital stations, and the wrecks circling Earth are currency. As an indebted salvager, latch onto wrecks, crack open cargo bays, then fly home to sell your haul and upgrade your ship for higher orbits. But every bay you open makes noise — and the Sweepers hunt noise.
- **태그.** 익스트랙션 어드벤처 · 탑뷰 · 싱글 플레이 · PC / Extraction adventure · Top-down · Single-player · PC
- **개발 단계.** 섹션: "개발 중 · 15분 데모 제작 중" / "In development · 15-minute demo in progress". 타일 단계: "개발 중" / "In development".
- **수상.** "2026 미래 게임잼 최우수상" / "Top Excellence Award (최우수상), 2026 Future Game Jam". 이 행사에서 최우수상은 대상 아래 등급이므로 영어로 "Grand prize"라고 쓰지 않는다. 영문 공식 명칭은 확인 전이다 (11장 7번).
- **크레딧.** 4.6 (역할은 팀 페이지 표기 그대로).
- **바깥 링크.** 팀 소개 페이지 `/off-the-record/` (도메인 연결 후 같은 사이트의 주소가 된다).
- **미디어.** 원본은 팀 페이지 저장소 `Gomurloc/off-the-record`의 `이미지/웹/`.
  - 대표 이미지: `타이틀_글자없음.jpg` (1920×1080, 글자 없는 타이틀 아트)
  - 스크린샷: `플레이_정거장.jpg`, `플레이_오프닝.jpg` (실제 게임 화면, 폭 800px), `인트로2.jpg`, `인트로3.jpg`
  - 게임 선택 타일: `인트로4.jpg`
  - 더 큰 원본이 필요하면 팀의 비공개 게임 저장소에 있다. 그걸 쓰려면 저장소 주인의 허락이 필요하다 (11장 2번).

### 5.3 스튜디오 소개 (초안)

- KO:
  > KO Studio는 게임 기획자이자 사운드 디자이너 고유준의 스튜디오입니다. 이름도 고유준에서 왔습니다. 성 '고(Ko)', 그리고 인트로의 종이 인형은 '유준'의 초성 ㅇ·ㅈ입니다. 이 인형이 한 방에 쓰러지면 K·O가 됩니다. 그렇게 예상을 한 번에 뒤집는 게임을 만듭니다.
  > 지금은 동료 개발자, 아티스트와 함께 두 게임을 만들고 있습니다.
- EN:
  > KO Studio is the game studio of designer and sound designer Ko Yujun, and the name is Ko Yujun's own. Ko is the family name, and the paper figure in the intro is ㅇ and ㅈ, the Korean initials of Yujun. Knock it down and it becomes K·O. That's the kind of game KO Studio makes: one that flips your expectations in a single blow.
  > Right now, Ko Yujun is building two games together with a fellow developer and an artist.
- 팀 이름(삼유스튜디오)은 사이트에 쓰지 않는다 (사용자 결정, 2026-10-27). 팀원은 게임별 크레딧(4.6)으로 밝힌다.
- 이름 풀이(성 Ko + 초성 ㅇ·ㅈ + K.O.)는 사용자가 확인한 내용이다 (2026-10-27). 스플래시 코드 주석에도 인형을 "훈민정음 해례본풍 ㅇ·ㅈ"로 만들었다고 적혀 있다.

## 6. 기술 구조

### 6.1 원칙

- 빌드 도구 없음. 배포되는 파일은 사람이 직접 쓴 HTML, CSS, 순수 JavaScript(ES 모듈)뿐이다.
- **실행 중 외부 서버에 요청하지 않는다.** three.js와 글꼴을 모두 저장소에 넣어 직접 제공한다. CDN 장애와 버전 변경에 영향받지 않고, 방문자 IP가 제3자(Google Fonts 등)에게 가지 않는다.
- three.js r160 복사본은 import map 없이 동작하게 두 군데만 고친다.
  - `intro.js`의 import를 상대 경로로: `import * as THREE from '../../lib/three-r160/three.module.min.js'`, `RoomEnvironment`도 같은 폴더에서.
  - `RoomEnvironment.js` 한 줄: `from 'three'` → `from './three.module.min.js'`. 같은 URL을 써야 three.js가 한 번만 실행된다. 고친 사실을 `LICENSE` 옆 `MODIFIED.md`에 적는다.
- 글꼴은 Google Fonts가 제공하는 woff2 유니코드 범위 조각을 한 번 내려받아 `@font-face`로 직접 제공한다. 그래서 한글도 쓰인 글자 범위의 조각만 불러온다. OFL 라이선스 문서를 같이 둔다.
- JavaScript가 꺼져 있어도 모든 정보와 링크가 보인다. JavaScript는 인트로, 메뉴 커서와 방향키, 고정 헤더, 스크린샷 확대만 맡는다.

### 6.2 저장소 구조

```
gomurloc.github.io/            ← 이 폴더 (kostudio.org)
├─ site/                       ← 배포되는 것만
│  ├─ index.html               ← 한국어
│  ├─ en/index.html            ← 영어
│  ├─ 404.html
│  ├─ robots.txt
│  └─ assets/
│     ├─ css/site.css, css/fonts.css
│     ├─ js/main.js            ← 인트로 실행·대체, 메뉴, 헤더, 확대 보기
│     ├─ js/intro/intro.js     ← 스플래시 v9 포팅
│     ├─ lib/three-r160/       ← three.module.min.js, RoomEnvironment.js, LICENSE, MODIFIED.md
│     ├─ fonts/                ← woff2 조각, OFL.txt
│     └─ img/                  ← WebP, 파비콘, OG 이미지, K·O 마크
├─ tools/                      ← 배포 안 됨
│  ├─ render-hero.html         ← intro.js로 T_LOGO 프레임을 내보내는 페이지
│  └─ *.py                     ← 이미지 합성·변환 스크립트
├─ docs/superpowers/           ← 설계·계획 문서 (배포 안 됨)
└─ .github/workflows/pages.yml ← site/ 폴더만 Pages로 배포
```

- **배포 방식.** GitHub Actions로 `site/` 폴더만 Pages에 올린다. GitHub의 "Static HTML" 예제 워크플로는 저장소 전체를 올리므로 그대로 쓰지 않고, `actions/upload-pages-artifact`의 `path`를 `./site`로, 트리거를 `main` 브랜치 push로 고친다. 배포 후 `/docs/`가 404인지 확인한다.
- Actions로 배포하면 `CNAME` 파일이 필요 없고, 사용자 지정 도메인은 저장소 설정에서 정한다.
- 경로 이름은 영문 소문자와 하이픈만 쓴다.
- `site/off-the-record/` 경로는 만들지 않는다. 그 주소는 기존 `Gomurloc/off-the-record` 프로젝트 사이트가 쓴다.

### 6.3 인트로 모듈 (`intro.js`)

- **원본.** 스플래시 HTML의 핵심 코드(121~1018행: 장면, 타임라인, 절차적 한지 텍스처, 소리 합성)를 거의 그대로 옮긴다. 편집기 UI, 타이밍 패널, MP4 내보내기(mp4-muxer)는 뺀다.
- **고쳐 쓰는 부분.**
  - import 경로 (6.1).
  - 렌더러: `preserveDrawingBuffer: false`. 크기는 마운트 요소의 크기 × `min(dpr, 2)`이되 버퍼가 약 210만 화소(휴대폰은 130만)를 넘지 않게 한다.
  - 카메라: 4.1의 cover 방식 화각. 먼지 셰이더의 초점값(`uFocal`)도 버퍼 높이와 화각으로 다시 계산한다.
  - 오버레이: 비네트와 그레인은 그리지 않는다 (4.1). 컷 장면의 흰 선과 섬광, 페이드 인의 검은 막만 남긴다.
  - 시계: 원본은 소리가 켜지면 오디오 시계를 따르는데, 사이트에서는 오디오가 멈춘 채 시작해 그대로 두면 첫 프레임에서 멈춘다. **`AudioContext`가 `running`일 때만 오디오 시계를 쓰고, 아니면 `performance.now()`를 쓴다.**
  - 탭이 숨겨지면 멈추고, 돌아오면 그 시점부터 이어 재생한다.
  - 마운트 요소 크기가 바뀌면 버퍼, 화각, `uFocal`을 다시 계산한다 (`requestAnimationFrame`으로 묶어서).
  - 핏방울(6.58s 첫 등장)과 "studio" 라벨(9.07s)이 처음 그려질 때 끊기지 않도록, 화면이 검은 0~0.45s 동안 미리 한 번 컴파일한다.
- **공개 API.**
  ```js
  playIntro({ mount, signal })
  // → { ready: Promise, skip(), setSound(on), done: Promise<{ skipped }>, destroy() }
  ```
  - `ready`: 모듈 import, 글꼴 대기(Jost, 최대 1.5초), 장면 생성이 끝나 첫 프레임을 그릴 수 있을 때. **3초 예산은 페이지 이동 시작부터 `ready`까지다.** 넘기면 `main.js`가 `signal`을 abort하고, `playIntro`는 reject하며 만든 것을 모두 해제한다.
  - `done`: `T_LOGO` 프레임을 그린 채로 resolve된다. 캔버스는 지우지 않는다. `main.js`가 교차 페이드한 뒤 `destroy()`를 부른다.
  - `destroy()`: 지오메트리·재질·텍스처, PMREM, 렌더러를 해제하고 캔버스를 지운다.
  - 옵션은 원본 기본값으로 고정한다: 핏방울 `blood`, 방향 `ne`, 검은 한지 바닥, 타이밍 `beat 0.8 / huh 1.0`.
- **내보내기 경로 (배포 안 됨).** `tools/render-hero.html`이 같은 `intro.js`를 내보내기 옵션(`{ width, height, pixelCap: Infinity, preserveDrawingBuffer: true }`)으로 불러 `T_LOGO` 프레임을 `canvas.toBlob`으로 저장한다. 사이트용 모듈과 같은 코드라 정지 이미지와 실제 인트로가 어긋나지 않는다.

### 6.4 이미지 파이프라인 (`tools/`)

- 도구: Python + Pillow, ffmpeg (이 컴퓨터에 설치돼 있음).
- **게임 이미지.**
  - 레이어로 나뉜 장면은 씬 파일의 레이어 순서대로 합성한다.
  - WebP로 1920/1280/960 폭을 만들고 `<img srcset sizes>`로 고르게 한다.
  - 원본 PNG는 저장소에 넣지 않는다.
- **히어로 정지 이미지.** `render-hero.html`로 1920×1080과 2880×1620을 만든다. 비네트·그레인이 없어 잘 압축된다. `sizes="max(100vw, 177.78vh)"`. 1920 폭 파일은 250KB 이하로 맞추고, 2880 폭이 450KB를 넘으면 2880을 뺀다.
- **브랜드 자산.**
  - K·O 마크: 명함 생성기와 같은 좌표의 SVG + 작게 줄인 핏방울 PNG(`KO-studio_dot_blood.png`에서).
  - 파비콘: `KO-studio_icon_2048.png`에서 32/180/512px.
  - OG 이미지: 로고로 1200×630.

### 6.5 성능 예산

| 항목 | 예산 |
|---|---|
| 첫 화면 (HTML+CSS+main.js+히어로 1920 폭, 인트로·글꼴 제외) | 400KB 이하 |
| 첫 화면 글꼴 (첫 화면에 쓰인 조각만) | 300KB 이하 |
| 인트로 추가분 (three.js+intro.js, 첫 방문만) | 약 190KB (gzip) |
| 게임 섹션 이미지 | 화면에 들어올 때 로딩 |
| 저장소 전체 | 200MB 이하 (Pages 한도 1GB) |

## 7. 접근성

- 의미 있는 HTML: `<header>`, `<main>`, 섹션마다 `<section>`과 제목. 영어 페이지는 `lang="en"`이고, 두 페이지를 `hreflang`으로 서로 연결한다.
- 인트로 캔버스는 `aria-hidden="true"`. 건너뛰기 버튼이 첫 포커스 대상이다.
- 모든 이미지에 대체 텍스트. 장식 이미지는 `alt=""`.
- 키보드만으로 모든 메뉴, 타일, 스크린샷 확대 보기, 언어 전환, 인트로의 건너뛰기와 소리를 쓸 수 있다. 포커스 테두리는 숨기지 않는다 (`--red` 2px).
- `prefers-reduced-motion`: 인트로를 재생하지 않고("인트로 다시 보기"도 숨김), 부드러운 스크롤을 끈다.

## 8. 오류와 대체 동작

| 상황 | 동작 |
|---|---|
| WebGL 없음, 컨텍스트 생성 실패, 컨텍스트 손실 | 인트로 없이 정지 히어로로 시작 (재생 중이면 즉시 넘어가기) |
| 페이지 이동 시작부터 3초 안에 `ready`가 안 됨 | `signal` abort, 정지 히어로 |
| `main.js` 로드·실행 실패 | 인라인 스크립트의 4초 안전장치가 `intro` 클래스를 지워 정지 히어로 |
| 준비 전에 건너뛰기 입력 | 불러오기 중단, 정지 히어로 |
| Jost 글꼴이 늦게 옴 | 최대 1.5초 기다림 (3초 예산 안에서) |
| `sessionStorage` 사용 불가 (시크릿 모드 등) | 오류 없이 동작, 매번 인트로 재생 |
| 해시가 있는 주소로 첫 방문 | 인트로 없이 해당 섹션으로 |
| JavaScript 꺼짐 | 인트로·커서·확대 보기 없이 정지 히어로와 모든 정보·링크 |
| 없는 주소 | `404.html` (먹색 배경, K·O 마크, 4.9의 문구) |

## 9. 배포와 도메인 전환

DNS 값과 화면 단계는 공식 문서(docs.github.com, support.squarespace.com)에서 확인한 것이다. 다만 4번(DNS)을 5번(사용자 지정 도메인)보다 먼저 하는 순서는 GitHub 문서의 권장 순서(도메인 추가 → DNS)와 일부러 다르다. 이유는 5번에 적었다. `gomurloc.github.io/...`가 `kostudio.org/...`로 301 리디렉트되는 동작은 문서에 적혀 있지 않고 다른 사이트들에서 관찰된 것이며, 8번에서 확인한다.

**메일 레코드(MX, SPF, DKIM)는 처음부터 끝까지 건드리지 않는다.** 3번에서 처음 배포하는 순간 사이트가 `gomurloc.github.io`로 공개된다. 팀원 동의(11장 2번)는 해결됐다. DNS와 Pages 설정은 사용자가 직접 하거나, 사용자가 화면을 보며 승인할 때만 한다.

1. **준비.** 지금 DNS 상태를 기록한다 (A, AAAA, HTTPS, www, MX, TXT, DKIM). 네임서버, DNSSEC, Google Workspace 프리셋은 건드리지 않는다.
2. **도메인 검증 (GitHub 계정 단위).**
   - GitHub 프로필 설정 → Pages → Add a domain → `kostudio.org`.
   - Squarespace Custom Records에 TXT 추가: 이름 `_github-pages-challenge-gomurloc`, 값은 GitHub가 보여주는 값.
   - 반영되면 Verify. 이 TXT는 계속 남겨 둔다 (도메인 탈취 방지).
3. **저장소 만들기.** 공개 저장소 `gomurloc.github.io` (소문자 필수). Settings → Pages → Source를 GitHub Actions로 정하고 처음 배포한다. 아래를 확인한다.
   - `https://gomurloc.github.io/`가 열린다.
   - `https://gomurloc.github.io/off-the-record/`가 여전히 열린다.
   - `https://gomurloc.github.io/docs/`는 404다.
4. **DNS 바꾸기 (Squarespace).**
   - 지우기 전에 Squarespace Defaults 프리셋을 펼쳐 내용을 캡처한다. A 4개, www CNAME, HTTPS 레코드 말고 TXT·MX·`_domainkey`가 들어 있으면 값을 적어 두고, 삭제 직후 Custom Records에 그대로 다시 만든다 (미리 만들면 SPF가 두 개가 되어 오류가 난다).
   - **Squarespace Defaults 프리셋만** 삭제한다.
   - Custom Records에 추가:
     - A `@` ×4: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
     - AAAA `@` ×4 (Squarespace는 축약 표기를 받지 않으므로 풀어서): `2606:50c0:8000:0:0:0:0:153`, `2606:50c0:8001:0:0:0:0:153`, `2606:50c0:8002:0:0:0:0:153`, `2606:50c0:8003:0:0:0:0:153`
     - CNAME `www` → `gomurloc.github.io` (끝에 점 없이)
   - 와일드카드, ALIAS, CAA 레코드는 추가하지 않는다.
   - MX, TXT `@`, `google._domainkey`를 조회해 1번 기록과 같은지 확인한다.
   - **전파 대기.** 기존 레코드 TTL이 4시간이라 최소 4시간(안전하게 24시간) 기다린다. 여러 공개 DNS(`8.8.8.8`, `1.1.1.1`, `9.9.9.9`)에서 A/AAAA가 GitHub 주소만, www가 `gomurloc.github.io`만 돌려주고 Squarespace HTTPS 레코드가 사라진 것을 확인한 뒤에 5번으로 간다. 기다리는 동안 QR은 계속 github.io에서 열린다.
5. **사용자 지정 도메인 설정.** 저장소 Settings → Pages → Custom domain `kostudio.org` → Save.
   - 4번을 먼저 하는 이유: 2번 검증으로 다른 계정은 이미 이 도메인을 쓸 수 없다. 그리고 5번을 하는 순간 기존 QR 주소(`gomurloc.github.io/off-the-record/`)가 kostudio.org로 리디렉트되므로, 그때 kostudio.org가 이미 GitHub을 가리키고 있어야 QR이 끊기지 않는다.
6. **메일 확인.** 테스트 메일을 주고받는다.
7. **HTTPS.** 인증서가 발급되면(최대 1시간, 옵션 활성화는 최대 24시간) Enforce HTTPS를 켠다. 멈춰 있으면 사용자 지정 도메인을 지웠다가 다시 저장한다.
8. **최종 확인.**
   - `https://www.kostudio.org/` → `https://kostudio.org/`
   - `http://` → `https://`
   - `https://gomurloc.github.io/off-the-record/` → `https://kostudio.org/off-the-record/` (기존 QR)

**참고 (선택).** 지금 `_dmarc` 레코드가 없다. 나중에 TXT `_dmarc` → `v=DMARC1; p=none; rua=mailto:ko@kostudio.org`를 추가하면 메일 신뢰도가 좋아진다. 이 작업 범위는 아니다.

## 10. 테스트와 검증

배포 전, 로컬 서버(`python -m http.server`, `site/` 기준)를 띄워 앱 안 브라우저로 확인한다.

- **화면 크기:** 360×780, 390×844, 768×1024, 844×390(가로 휴대폰), 1280×800, 1366×657, 1536×730, 1920×969, 1920×1080, 2560×1080. 각 크기에서 메뉴가 "studio" 라벨과 겹치지 않는지 본다.
- **인트로:**
  - 첫 방문 재생 → `T_LOGO`에서 멈춤 → 히어로로 교차 페이드(가로·세로 화면 모두 튀지 않음) → 메뉴 등장, 포커스가 GAMES로
  - 새로고침하면 재생 안 함. `?intro`로 다시 재생. 해시가 있는 주소로는 재생 안 함
  - 클릭, 휠, 아무 키, 건너뛰기 버튼으로 각각 건너뛰기
  - Tab으로 소리 버튼에 가서 Enter/Space: 소리가 켜지고 인트로는 계속됨
  - 인트로 중 Tab이 뒤쪽 페이지로 들어가지 않음
  - 움직임 줄이기 모드: 재생 안 됨, "인트로 다시 보기" 숨김
  - `?nowebgl`: 정지 히어로로 시작
  - `main.js` 요청을 막은 상태: 4초 뒤 정지 히어로
- **메뉴와 접근성:** 키보드만으로 전체 이용, 포커스 순서, ←/→ 메뉴 이동, 스크린샷 확대 열기·닫기(Esc, 포커스 복귀).
- **메일 주소:** 연락 섹션의 주소를 드래그로 선택해 복사·붙여넣기 → `ko@kostudio.org`와 같음.
- **콘솔:** 오류 0개.
- **네트워크:** 6.5 예산 안. 외부 도메인 요청 0개.
- **링크:** 모든 내부 앵커, `mailto:`, `/off-the-record/`, KO/EN 전환, 404.
- **배포 후:** 9장 3번·8번 항목과 휴대폰 실기기 확인.

## 11. 열린 질문 (사용자 확인 필요)

만들기 전에 정하지 않아도 된다. 아래 기본값으로 만들고, 답이 오면 바꾼다.

| # | 질문 | 기본값 |
|---|---|---|
| 1 | 두 게임의 플레이 영상 | 없이 진행 (사용자 결정). 생기면 13장 |
| 2 | 이유진 님, 권유담 님의 게재 동의 | **해결됨 (2026-10-27).** 사용자가 동의를 확인함. 영문 이름 표기는 4번에 남음 |
| 3 | FeelSoGut!의 팀원별 역할 표기 | 역할 없이 세 사람 이름만 표기 |
| 4 | 이름 영문 표기 | 사용자는 명함 표기 Ko Yujun. 팀원은 답이 올 때까지 영어 페이지에도 한글 이름(예: "이유진 (development)") |
| 5 | 미공개 게임 타일을 넣을지 | 넣지 않는다. 배포되는 HTML에 주석도 남기지 않는다 |
| 6 | FeelSoGut! 출시 일정을 표기할지 | 표기하지 않는다 |
| 7 | 미래 게임잼 최우수상의 영문 공식 명칭 | "Top Excellence Award (최우수상), 2026 Future Game Jam" |
| 8 | 팀 이름 표기 | **해결됨 (2026-10-27).** 사이트에 팀 이름을 쓰지 않는다 |
| 9 | "KO"라는 이름의 뜻을 소개에 넣을지 | **해결됨 (2026-10-27).** 넣는다 (5.3) |

## 12. 결정 기록

| 결정 | 이유 |
|---|---|
| 직접 디자인한 정적 사이트, Squarespace 웹사이트 미사용 | 템플릿 제약 없이 디자인하고, 비용 없이 운영 |
| GitHub Pages (Netlify 대신) | 사용자가 GitHub에 익숙하고, 문의는 메일 링크로 충분 |
| 사용자 사이트 저장소 `gomurloc.github.io` | kostudio.org를 연결하면 기존 `/off-the-record/` 팀 페이지와 인쇄된 QR이 같은 도메인 아래로 이어짐 |
| Actions로 `site/`만 배포 | 공개 저장소지만 문서·도구는 사이트 주소로 노출하지 않음 |
| 시네마틱 다크 + 타이틀 화면 연출 혼합 | 사용자가 영화 같은 느낌을 원하고, 게임 회사로 보이는 신호도 필요 |
| 스플래시를 three.js로 포팅 (영상 대신) | 선명하고 가볍고, 마지막 로고가 타이틀 화면으로 그대로 이어짐 |
| 한국어 기본 + 영어 별도 페이지 | 국내외 방문자 모두, 검색·링크 미리보기에 유리 |
| 팀 이름은 빼고 게임별 팀원 크레딧은 보이게 둠 | 사용자가 팀 이름은 넣지 않기로 함. 두 게임은 세 사람이 함께 만들고 있으므로 크레딧과 저작권 표기로 공정하게 밝힘 |
| 한국어 문구는 합쇼체 | 사용자 결정 |
| 외부 IP 관련 작업 제외 | 공개 범위 확인 전에는 올리지 않음 |
| 영상 없이 이미지로만 | 영상 파일이 없고, 사용자가 영상 없이 진행하기로 함 |
| 글꼴·라이브러리 직접 제공 | 외부 서버 장애에 영향받지 않고, 방문자 정보가 제3자에게 가지 않음 |
| 문의 폼·분석 도구 없음 | 필요 없는 기능은 만들지 않음 (YAGNI). 남는 기록은 GitHub Pages의 접속 기록뿐 |

## 13. 후속 작업 (지금 만들지 않음)

- **플레이 영상.** 파일이 생기면: 8~15초 루프, H.264 MP4 1280×720, 소리 없음, 4MB 이하, 포스터 이미지 포함. 게임 섹션의 대표 이미지 자리에 `muted autoplay loop playsinline`으로 넣고, 화면에 들어올 때 불러오고 벗어나면 멈춘다. 움직임 줄이기 설정이면 자동 재생하지 않는다.
- **DMARC 레코드** (9장 참고).
- **게임별 상세 페이지** (출시가 가까워지면).

## 부록: 출처

- 브랜드: 사용자가 준 KO Studio 브랜드 자료 (로고, 명함 생성기, 스플래시 v9와 이전 버전)
- FeelSoGut!: 팀의 공개 저장소 `rhythm-prototype`, 팀 발표 자료
- OFF THE RECORD: 팀 페이지 저장소 `Gomurloc/off-the-record`
- GitHub Pages: docs.github.com의 custom domain, verifying, HTTPS, publishing source, limits 문서
- Squarespace: support.squarespace.com의 DNS records for web hosting, Pointing a Squarespace domain, Google Workspace MX records 문서

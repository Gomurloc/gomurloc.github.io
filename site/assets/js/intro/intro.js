// KO Studio intro: port of the splash v9 "한지 종이 인형" (brand/splash/KO-studio_splash.html).
// Timeline, rig, textures, ink shader and sound are the splash's own code; only sizing,
// playback and teardown were rewritten for the site. Fixed options: blood dot, ne sweep, dark hanji.
import * as THREE from '../../lib/three-r160/three.module.min.js';
import { RoomEnvironment } from '../../lib/three-r160/RoomEnvironment.js';

// ───────── 고정값 ─────────
const FPS = 60, SIM = 240;
const P = { beat: 0.8, huh: 1.0, hold: 1.5 };

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, u) => a + (b - a) * u;
const prog = (t, a, b) => b <= a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a));
const rad = d => d * Math.PI / 180;
const E = {
  lin: u => u,
  in: u => u * u,
  out: u => 1 - (1 - u) * (1 - u),
  out3: u => 1 - Math.pow(1 - u, 3),
  io: u => u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2,
  io3: u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2,
  back: u => 1 + 2.70158 * Math.pow(u - 1, 3) + 1.70158 * Math.pow(u - 1, 2),
  grav: u => Math.pow(u, 2.4),
};
function ev(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (t < k[0]) {
      const p = keys[i - 1], u = (t - p[0]) / (k[0] - p[0]);
      return p[1] + (k[1] - p[1]) * E[k[2] || 'io'](u);
    }
  }
  return keys[keys.length - 1][1];
}
let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

const DEPTH = 3, BEV_T = 0.35, BEV_S = 0.35, ROUND = 0.6, HT = DEPTH / 2;

// ───────── 시간표 + 몸 포즈 키 ─────────
// A의 시간은 '애니메이션 시간'. 머리가 바닥에 닿는 순간 0.07초 히트스톱이 끼어서 실제 재생 시간과 그만큼 어긋남
let A = {}, TR = {}, LAG = null, EUL = null, RATTLE = [];
const HS = { at: 0, d: 0.07 };
const warp = tr => tr < HS.at ? tr : tr < HS.at + HS.d ? HS.at : tr - HS.d;   // 실제 → 애니메이션
const unwarp = ta => ta < HS.at ? ta : ta + HS.d;                              // 애니메이션 → 실제
let END = 0;
function build() {
  const a = {};
  a.okPose = 3.95;
  a.slash = 4.41;
  a.flicker = a.slash - 0.16;
  const b = a.bt = a.slash + P.beat;        // 한 박자 끝 → 어라라?
  const h = P.huh;
  a.drop = b + h;                           // 뎅강
  a.slipEnd = a.drop + 0.12;
  a.headImpact = a.drop + 0.37;             // 머리 착지 → 히트스톱 → 먹 번짐
  a.headLand2 = a.headImpact + 0.27;
  a.eulerEnd = a.headLand2 + 0.9;
  a.topple = a.headImpact + 0.45;           // 머리 없는 몸이 머리 쪽을 내려다보다가
  a.thud = a.topple + 0.55;                 // 털-썩
  a.camStart = a.headImpact + 0.05;         // 감정 구간이 끝나야 카메라가 돎
  a.camEnd = a.camStart + 1.5;
  a.settled = Math.max(a.eulerEnd, a.thud + 0.35, a.camEnd) + 0.1;
  a.paint = a.settled + 0.2;               // 보이지 않는 손이 핏방울을 붓으로 찍어 점을 그음
  a.paintEnd = a.paint + 0.22;             // 바람처럼 한 번에
  a.studio = a.paintEnd + 0.35;
  a.fadeOut = a.studio + 0.6 + P.hold;
  a.end = a.fadeOut + 0.6;
  A = a;
  HS.at = a.headImpact; END = unwarp(a.end);
  const im = a.headImpact, th = a.thud;
  const q = u => b + h * u; // 어라라? 구간 안의 상대 시간
  TR = {
    x: [[0, -600], [1.2, -60, 'lin'], [1.55, 0, 'out3'], [1.95, 0], [2.2, -3], [2.45, -3], [2.62, 2], [2.75, 2], [2.9, 0]],
    runAmt: [[0, 1], [1.12, 1], [1.28, 0, 'out']],
    lean: [[0, 14], [0.62, 14], [0.72, 1], [0.88, 14], [0.97, 14], [1.02, 26, 'out'], [1.14, 14], [1.2, 14],
           [1.32, -14, 'out'], [1.55, -6], [1.68, 9], [1.85, 0], [1.95, 0], [2.2, -11], [2.45, -11], [2.62, 9], [2.75, 9], [2.9, 0],
           [3.1, -3], [3.35, -2], [3.48, 0],                                      // 휴— 뒤로 살짝 기댐
           [b, 0], [q(0.2), -2], [q(0.6), 2], [q(1), 0]],                         // 어? 어라?
    y: [[0, 0], [0.97, 0], [1.02, 7, 'out'], [1.12, 0], [2.95, 0], [3.3, 1], [3.35, 1], [3.48, 2], [3.6, -20, 'out'], [3.72, 0, 'in']],
    sq: [[0, 1], [2.95, 1], [3.3, 0.95], [3.35, 0.95], [3.48, 0.9], [3.56, 1.06, 'out'], [3.68, 1], [3.75, 0.92, 'out'], [3.95, 1, 'back']],
    legL: [[0, 0], [1.2, 0], [1.3, 12, 'out'], [1.55, 12], [1.7, 0], [3.48, 0], [3.56, 6, 'out'], [3.72, 0, 'in']],
    legR: [[0, 0], [1.2, 0], [1.3, -28, 'out'], [1.55, -28], [1.7, 0], [3.48, 0], [3.56, -6, 'out'], [3.72, 0, 'in']],
    armT: [[0, 0], [1.55, 0], [1.68, 8, 'out'], [1.85, 0], [b, 0], [q(0.2), -2.5], [q(0.6), 2.5], [q(1), 0]],
    // 팔은 만세(위로)만 꺾음. 아래로 꺾으면 가운데가 목처럼 솟아서 뺌
    armB: [[0, 0], [0.97, 0], [1.02, 20, 'out'], [1.15, 0], [3.48, 0], [3.58, 22, 'out'], [3.75, 22], [3.95, 0],
           [im, 0], [im + 0.14, 10, 'out'], [a.topple + 0.1, 10], [th - 0.12, 0]],     // 머리 없는 몸: 어…? 하고 팔을 살짝 듦
    headX: [[0, 0], [0.62, 0], [0.72, -7], [0.88, 0], [1.95, 0], [2.2, -8], [2.45, -8], [2.62, 7], [2.75, 7], [2.9, 0],
            [b, 0], [q(0.2), 4, 'out'], [q(0.4), 4], [q(0.6), -4], [q(0.84), -4], [q(1), 0]], // 잘린 면 위에서 미끄덩
    headY: [[0, 0], [2.95, 0], [3.3, 2], [3.48, 3], [3.6, -2, 'out'], [3.75, 0]],
    plant: [[0, 1], [a.topple, 1], [a.topple + 0.05, 0, 'lin']],
    // 앞(머리 쪽)으로 살짝 숙였다가 그 반동으로 뒤로 털썩 (- = 앞)
    fallB: [[0, 0], [im, 0], [im + 0.16, -5, 'out'], [a.topple, -4], [th, 90, 'grav'], [th + 0.07, 87.5, 'out'], [th + 0.13, 90, 'in'], [th + 0.19, 89, 'out'], [th + 0.24, 90, 'in']],
    // 얇은 종이라 떨어지는 동안 윗부분이 공기에 밀려 휘었다가, 닿은 뒤 한 번 더 착 붙음 (+ = 바닥에서 들림)
    flex: [[0, 0], [a.topple + 0.15, 0], [th - 0.06, 7], [th + 0.04, 5], [th + 0.12, 0, 'in'], [th + 0.18, 1.5, 'out'], [th + 0.25, 0, 'in']],
  };
  simLag();
  simEuler();
}

// ───────── 2D 리그 (서걱 전 연기, y 아래가 +) ─────────
const LEG_L = [[-5.75, -52], [10.25, -52], [-19, 0], [-35, 0]];
const LEG_R = [[-10.25, -52], [5.75, -52], [35, 0], [19, 0]];
const HIP = [0, -48];
function rot(p, c, a) {
  const cs = Math.cos(a), sn = Math.sin(a), dx = p[0] - c[0], dy = p[1] - c[1];
  return [c[0] + dx * cs - dy * sn, c[1] + dx * sn + dy * cs];
}
const legsFor = (l, r) => [LEG_L.map(p => rot(p, HIP, rad(l))), LEG_R.map(p => rot(p, HIP, rad(r)))];
function rig(t) {
  const r = {};
  for (const k in TR) r[k] = ev(TR[k], t);
  const ra = r.runAmt, ph = 2 * Math.PI * 3.5 * t;
  if (ra > 0) {
    const sw = Math.sin(ph), leg = 28 * ra * (sw > 0 ? sw : 0.45 * sw);
    r.legL += leg; r.legR -= leg;
    r.y += -5 * ra * Math.max(0, -sw);
    r.armT += 14 * ra * Math.sin(ph + 0.6); r.armB += 10 * ra * Math.sin(2 * ph);
    r.lean += 3 * ra * Math.sin(2 * ph);
  }
  let m = -Infinity;
  for (const L of legsFor(r.legL, r.legR)) for (const p of L) m = Math.max(m, p[1]);
  r.Y = r.y - m * r.plant;
  r.sx = 1 + (1 - r.sq) * 0.7;
  return r;
}
function neckPt(r) {
  const p = new DOMMatrix().translate(r.x, 0).rotate(r.lean).scale(r.sx, r.sq).translate(0, r.Y)
    .transformPoint(new DOMPoint(r.headX, -106 + r.headY));
  return [p.x, p.y];
}
function simLag() {
  const n = Math.ceil(A.drop * SIM) + 2, dt = 1 / SIM, k = 800, c = 18;
  LAG = new Float32Array(n * 2);
  let q = neckPt(rig(0)), px = q[0], py = q[1], vx = 0, vy = 0, qx = q[0], qy = q[1];
  for (let i = 0; i < n; i++) {
    const nq = neckPt(rig(i * dt));
    const vqx = i ? (nq[0] - qx) / dt : 0, vqy = i ? (nq[1] - qy) / dt : 0;
    if (i === 1) { vx = vqx; vy = vqy; }
    qx = nq[0]; qy = nq[1];
    for (let s = 0; s < 2; s++) {
      const h = dt / 2;
      vx += (k * (qx - px) + c * (vqx - vx)) * h; vy += (k * (qy - py) + c * (vqy - vy)) * h;
      px += vx * h; py += vy * h;
    }
    let lx = px - qx, ly = py - qy;
    const len = Math.hypot(lx, ly);
    if (len > 9) { lx *= 9 / len; ly *= 9 / len; }
    LAG[i * 2] = lx; LAG[i * 2 + 1] = ly;
  }
}
function lagAt(t) {
  const i = clamp(Math.round(t * SIM), 0, LAG.length / 2 - 1);
  return [LAG[i * 2], LAG[i * 2 + 1]];
}
const ER = 480;
function simEuler() {
  const dur = A.eulerEnd - A.headLand2, n = Math.ceil(dur * ER) + 1, b0 = rad(70);
  EUL = { beta: new Float32Array(n), psi: new Float32Array(n), n };
  RATTLE = [];
  let psi = rad(90), half = Math.floor(psi / Math.PI);
  for (let i = 0; i < n; i++) {
    const tau = i / ER, beta = b0 * Math.pow(1 - clamp(tau / dur), 0.55);
    EUL.beta[i] = beta; EUL.psi[i] = psi;
    psi += 2 * Math.PI * 2.2 / Math.sqrt(Math.max(beta / b0, 0.02)) / ER;
    const hh = Math.floor(psi / Math.PI);
    if (hh !== half) { half = hh; RATTLE.push([A.headLand2 + tau, 1 - beta / b0]); }
  }
}

build();

/** Real playback time of the frame where the K·O logo and "studio" are complete (before the splash's blackout). */
export const T_LOGO = unwarp(A.studio) + 1.2;

// ───────── 종이 질감 (코드로 생성) ─────────
function paperCanvas(w, h, base, light, dark, fibers, mottle, mottleAlpha = 1) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  const wrap = (x, y, r, fn) => {
    for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) {
      if (x + ox + r < 0 || x + ox - r > w || y + oy + r < 0 || y + oy - r > h) continue;
      fn(x + ox, y + oy);
    }
  };
  for (let i = 0; i < mottle; i++) {
    const x = rnd() * w, y = rnd() * h, r = w * (0.03 + rnd() * 0.12), col = rnd() < 0.5 ? light : dark, al = (0.05 + rnd() * 0.07) * mottleAlpha;
    wrap(x, y, r, (X, Y) => {
      const rg = g.createRadialGradient(X, Y, 0, X, Y, r);
      rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalAlpha = al; g.fillStyle = rg; g.fillRect(X - r, Y - r, r * 2, r * 2);
    });
  }
  g.lineCap = 'round';
  for (let i = 0; i < fibers; i++) {
    const x = rnd() * w, y = rnd() * h, len = w * (0.008 + rnd() * 0.04), a = rnd() * Math.PI * 2, bend = (rnd() - 0.5) * len;
    const col = rnd() < 0.55 ? light : dark, al = 0.06 + rnd() * 0.16, lw = 0.4 + rnd() * 1.1;
    wrap(x, y, len, (X, Y) => {
      g.globalAlpha = al; g.strokeStyle = col; g.lineWidth = lw;
      g.beginPath(); g.moveTo(X, Y);
      g.quadraticCurveTo(X + Math.cos(a) * len / 2 - Math.sin(a) * bend, Y + Math.sin(a) * len / 2 + Math.cos(a) * bend, X + Math.cos(a) * len, Y + Math.sin(a) * len);
      g.stroke();
    });
  }
  g.globalAlpha = 1;
  return c;
}
function texFrom(canvas, rx, ry = rx, srgb = true) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// Random-driven assets are made once, in the splash's exact RNG order, and shared by every scene.
const DUST_N = 240, FIB_N = 64, FIB_G = 150; // 가벼운 종이라 공기 저항이 커서 천천히 떨어짐
const fibY = (f, tau) => f.y0 + (f.vy + FIB_G / f.k) * (1 - Math.exp(-f.k * tau)) / f.k - FIB_G / f.k * tau;
let ASSETS = null;
function assets() {
  if (ASSETS) return ASSETS;
  seed = 7;
  const PAPER_W = paperCanvas(512, 512, '#f3efe6', '#ffffff', '#d2c8b4', 2600, 60);          // 흰 한지 (졸라맨)
  const PAPER_K = paperCanvas(1024, 1024, '#1d1b1a', '#3b3734', '#0f0e0d', 5200, 90);        // 검은 한지 / 책상
  // The splash makes the light-floor sheet and its torn edge here. The site only uses the dark
  // floor, so skip drawing them but advance the RNG by the same 56,404 draws (140×5 + 6400×8 + 4 + 900×5)
  // so the dust and fibres land exactly where the splash puts them.
  for (let i = 0; i < 56404; i++) rnd();
  const dustP = new Float32Array(DUST_N * 3), dustQ = new Float32Array(DUST_N * 4);
  for (let i = 0; i < DUST_N; i++) {
    dustP.set([(rnd() - 0.5) * 760, rnd() * 520, (rnd() - 0.5) * 520 + 20], i * 3);
    dustQ.set([rnd(), 0.4 + rnd() * 0.8, 0.7 + rnd() * 1.3, 0.35 + rnd() * 0.65], i * 4);
  }
  const FIB = Array.from({ length: FIB_N }, () => ({
    x0: (rnd() - 0.5) * 56, y0: 66.5 + (rnd() - 0.5) * 3, z0: (rnd() - 0.5) * 2,
    vx: 20 + rnd() * 95, vy: 5 + rnd() * 45, vz: (rnd() - 0.5) * 80, k: 3 + rnd() * 3.5,
    len: 1.6 + rnd() * 4.2, wid: 0.4 + rnd() * 0.6, w: [rnd() * 10 - 5, rnd() * 10 - 5, rnd() * 10 - 5],
    yaw: rnd() * 6.28, fl: 1.5 + rnd() * 2.5, fa: 1 + rnd() * 3, tl: 0,
  }));
  for (const f of FIB) { // 바닥에 닿는 시각을 미리 찾아둠
    let lo = 0, hi = 8;
    for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (fibY(f, mid) > 0.6) lo = mid; else hi = mid; }
    f.tl = hi;
  }
  ASSETS = { PAPER_W, PAPER_K, dustP, dustQ, FIB };
  return ASSETS;
}

// ───────── 가운데 점: 붓으로 찍은 점(측점) ─────────
// 머리가 떨어질 때 작은 핏방울이 남고, 탑뷰에서 보이지 않는 손이 그 피를 붓으로 찍어 "스윽—꾹" 점 하나를 그음
const DOT = { core: '#7a0d18', halo: '#3a080d', haloA: 0.5, rough: 0.62, metal: 0, bump: 0.8, spark: 0, env: 0.05 }; // blood
const SWEEP = [[-8.5, -7.8], [11.5, 11.6]];   // ↗ 왼쪽 아래에서 위로 올라가며 쓸림
const INK_HEAD = `
  uniform float uDropR, uDraw, uSeed, uHaloA, uRoughCore, uRoughHalo, uMetal, uBump, uSpark;
  uniform vec2 uS0, uS1, uDropC;
  uniform vec3 uCore, uHalo; varying vec2 vInk;
  float gCore = 0.0, gHgt = 0.0;
  vec3 inkPerturb(vec3 pos, vec3 n, vec2 dH, float fd){
    vec3 sx = dFdx(pos), sy = dFdy(pos), r1 = cross(sy, n), r2 = cross(n, sx);
    float det = dot(sx, r1) * fd;
    return normalize(abs(det) * n - sign(det) * (dH.x * r1 + dH.y * r2));
  }
  float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float vn(vec2 p){ vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
    return mix(mix(h21(i), h21(i + vec2(1, 0)), u.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), u.x), u.y); }
  float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ s += a * vn(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return s; }
  vec4 inkAt(vec2 p){
    vec2 w = vec2(fbm(p * 0.2 + uSeed), fbm(p * 0.2 + uSeed + 7.0)) - 0.5;
    float rd = length(p - uDropC + w * 2.2);
    float drop = (1.0 - smoothstep(uDropR - 0.45, uDropR + 0.45, rd)) * step(0.01, uDropR);
    float dropH = drop * clamp(1.0 - pow(rd / max(uDropR, 0.1), 2.0), 0.0, 1.0);
    vec2 s0 = uS0, s1 = uS1;
    vec2 ax = normalize(s1 - s0), nx = vec2(-ax.y, ax.x);
    float L = length(s1 - s0);
    vec2 d = p - s0;
    float u = dot(d, ax) / L, t = dot(d, nx) + 2.2 * u * u;
    float wMax = 7.5, hu = 0.28;
    float hw = u < hu ? wMax * sqrt(max(0.0, 1.0 - pow((hu - u) / hu, 2.0)))
                      : wMax * pow(1.0 - smoothstep(hu, 1.0, u), 0.75);
    hw *= 1.0 + 0.1 * sin(u * 9.0 + uSeed);
    float en = (fbm(p * 0.8 + 3.0) - 0.5) * 1.4 + (fbm(p * 3.1 + 1.0) - 0.5) * 1.0
             + (vn(vec2(dot(p, ax) * 0.35, dot(p, nx) * 6.5)) - 0.5) * (0.6 + 1.6 * u);
    float dist = abs(t) - hw - en;
    float rev = 1.0 - smoothstep(uDraw * 1.15 - 0.15, uDraw * 1.15, u);
    float body = (1.0 - smoothstep(-0.4, 0.6, dist)) * smoothstep(-0.03, 0.02, u + 0.04) * rev;
    float br = vn(vec2(t * 2.6 + 10.0, u * 1.2)) * 0.55 + vn(vec2(t * 5.5 + 4.0, u * 2.4)) * 0.45;
    float dry = clamp(smoothstep(0.3, 0.95, u) + smoothstep(0.5, 1.0, abs(t) / max(hw, 0.5)) * 0.6, 0.0, 1.0);
    float streak = mix(1.0, smoothstep(0.4, 0.6, br), dry);
    float rimB = smoothstep(-2.0, -0.3, dist) * 0.12 * (1.0 - smoothstep(0.2, 0.45, u));
    float dens = (0.95 - 0.25 * smoothstep(0.25, 1.0, u) + rimB) * streak;
    float aB = clamp(body * dens, 0.0, 1.0);
    float halo = (1.0 - smoothstep(-0.5, 2.6, dist)) * smoothstep(-0.06, 0.05, u) * rev * (0.6 + 0.4 * fbm(p * 0.5));
    float aD = drop * 0.95 * (1.0 - body);
    float aC = max(aB, aD);
    float aH = halo * uHaloA * (1.0 - aC);
    float a = aC + aH;
    gCore = max(body * streak, drop);
    gHgt = uBump * (aB * 0.35 * (1.0 - 0.6 * u) + dropH * (1.0 - body));
    float spk = uSpark * smoothstep(0.62, 0.95, h21(floor(p * 3.2) + floor(uSeed)));
    vec3 cc = uCore * (1.0 + uSpark * 0.35 * (fbm(p * 2.2 + 9.0) - 0.5) * 2.0 + spk * 0.6);
    return vec4((cc * aC + uHalo * aH) / max(a, 1e-4), a);
  }`;

// ───────── 3D 장면 ─────────
// Builds one scene drawing into its own canvas at a buffer of `width`×`height`. The camera keeps the
// splash's position and only narrows its field of view on wide screens, so any aspect is a "cover" crop
// of the 16:9 master frame.
function createScene({ width, height, preserveDrawingBuffer = false, overlay = true, shadowSize = 2048 }) {
  const { PAPER_W, PAPER_K, dustP, dustQ, FIB } = assets();
  let W = width, H = height;
  const glc = document.createElement('canvas');
  const ovc = overlay ? document.createElement('canvas') : null;
  for (const c of [glc, ovc]) if (c) c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';

  const renderer = new THREE.WebGLRenderer({ canvas: glc, antialias: true, preserveDrawingBuffer });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c0b0b);
  scene.fog = new THREE.Fog(0x0c0b0b, 2100, 3200);
  const camera = new THREE.PerspectiveCamera(14, W / H, 10, 9000);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const LIGHT = { spot: 3.4, hemi: 0.22, fill: 0.4 };
  const hemi = new THREE.HemisphereLight(0xb8b2aa, 0x0b0b0c, 0.22);
  const fill = new THREE.DirectionalLight(0xfff6ea, 0.4); fill.position.set(0, 180, 1000);
  const spot = new THREE.SpotLight(0xffdcb0, 3.4, 0, 0.42, 0.85, 0);
  spot.position.set(0, 650, 200); spot.target.position.set(0, 0, 20);
  spot.castShadow = true; spot.shadow.mapSize.set(shadowSize, shadowSize);
  spot.shadow.camera.near = 200; spot.shadow.camera.far = 1300;
  spot.shadow.bias = -0.0002; spot.shadow.normalBias = 0.3; spot.shadow.radius = 5;
  scene.add(hemi, fill, spot, spot.target);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(8000, 8000),
    new THREE.MeshStandardMaterial({ map: texFrom(PAPER_K, 8000 / 380), bumpMap: texFrom(PAPER_K, 8000 / 380, 8000 / 380, false), bumpScale: 1.5, roughness: 0.96 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  // 글자 (해례본 ㅇ·ㅈ을 두께 3짜리 흰 한지로)
  const letterMat = new THREE.MeshStandardMaterial({ map: texFrom(PAPER_W, 1 / 110), bumpMap: texFrom(PAPER_W, 1 / 110, 1 / 110, false),
    bumpScale: 1.2, roughness: 0.92, envMap: envTex, envMapIntensity: 0.25 });
  function insetPoly(pts, d) {
    let area = 0;
    for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; area += x1 * y2 - x2 * y1; }
    const sg = area > 0 ? 1 : -1;
    const lines = pts.map((p, i) => {
      const q = pts[(i + 1) % pts.length]; let dx = q[0] - p[0], dy = q[1] - p[1];
      const L = Math.hypot(dx, dy); dx /= L; dy /= L;
      return [p[0] - dy * sg * d, p[1] + dx * sg * d, dx, dy];
    });
    return lines.map((l, i) => {
      const m = lines[(i - 1 + lines.length) % lines.length];
      const s = ((l[0] - m[0]) * l[3] - (l[1] - m[1]) * l[2]) / (m[2] * l[3] - m[3] * l[2]);
      return [m[0] + m[2] * s, m[1] + m[3] * s];
    });
  }
  function shapeFrom(pts, r) {
    const s = new THREE.Shape(), n = pts.length;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n];
      const l1 = Math.hypot(p0[0] - p1[0], p0[1] - p1[1]), l2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      const k1 = Math.min(r, l1 / 2) / l1, k2 = Math.min(r, l2 / 2) / l2;
      const ax = p1[0] + (p0[0] - p1[0]) * k1, ay = p1[1] + (p0[1] - p1[1]) * k1;
      const bx = p1[0] + (p2[0] - p1[0]) * k2, by = p1[1] + (p2[1] - p1[1]) * k2;
      i ? s.lineTo(ax, ay) : s.moveTo(ax, ay);
      s.quadraticCurveTo(p1[0], p1[1], bx, by);
    }
    s.closePath(); return s;
  }
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  function ex(shape) {
    const d = DEPTH - 2 * BEV_T;
    const g = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: true, bevelThickness: BEV_T, bevelSize: BEV_S, bevelSegments: 2, curveSegments: 64 });
    g.translate(0, 0, -d / 2);
    const m = new THREE.Mesh(g, letterMat); m.castShadow = m.receiveShadow = true;
    return m;
  }
  const root = new THREE.Group(), fallG = new THREE.Group(), fallIn = new THREE.Group();
  const leanG = new THREE.Group(), sqG = new THREE.Group(), offG = new THREE.Group(), barG = new THREE.Group(), chestG = new THREE.Group();
  scene.add(root); root.add(fallG); fallG.add(fallIn); fallIn.add(leanG); leanG.add(sqG); sqG.add(offG);
  fallG.position.z = -HT; fallIn.position.z = HT; root.position.z = -7 + HT;
  chestG.position.y = 48; offG.add(chestG);          // 골반을 축으로 윗부분(팔 막대)이 종이처럼 휨
  barG.position.y = 7; chestG.add(barG);
  const legLm = ex(shapeFrom(insetPoly([[-5.75, 4], [10.25, 4], [-19, -48], [-35, -48]], BEV_S), ROUND));
  const legRm = ex(shapeFrom(insetPoly([[-10.25, 4], [5.75, 4], [35, -48], [19, -48]], BEV_S), ROUND));
  legLm.position.y = legRm.position.y = 48;
  const halfL = ex(shapeFrom(rect(-35 + BEV_S, -7 + BEV_S, 0, 7 - BEV_S), ROUND));
  const halfR = ex(shapeFrom(rect(0, -7 + BEV_S, 35 - BEV_S, 7 - BEV_S), ROUND));
  const joint = ex(shapeFrom(rect(-7 + BEV_S, -7 + BEV_S, 7 - BEV_S, 7 - BEV_S), ROUND));
  barG.add(halfL, halfR, joint);
  offG.add(legLm, legRm);
  // absarc는 시작점과 끝점이 겹쳐 O 안쪽에 이음매 흠집이 생겨서, 겹치지 않는 점들로 원을 만듦
  const circlePts = (r, n, cw) => Array.from({ length: n }, (_, i) => {
    const a = (cw ? -1 : 1) * i / n * Math.PI * 2; return new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r);
  });
  const ringShape = new THREE.Shape(circlePts(35 - BEV_S, 192, false));
  ringShape.holes.push(new THREE.Path(circlePts(21 + BEV_S, 160, true)));
  const head = ex(ringShape); head.matrixAutoUpdate = false; scene.add(head);

  // ───────── 스탠드 빛줄기 + 떠다니는 먼지 ─────────
  const LAMP_AXIS = new THREE.Vector3().subVectors(spot.target.position, spot.position);
  const LAMP_LEN = LAMP_AXIS.length(); LAMP_AXIS.normalize();
  const coneMat = new THREE.ShaderMaterial({
    uniforms: { uAlpha: { value: 0 }, uLen: { value: LAMP_LEN } },
    vertexShader: `uniform float uLen; varying vec3 vN, vV; varying float vH;
      void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vN = normalize(mat3(modelMatrix) * normal);
        vV = normalize(cameraPosition - wp.xyz); vH = -position.y / uLen; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: `uniform float uAlpha; varying vec3 vN, vV; varying float vH;
      void main(){ float f = pow(abs(dot(normalize(vN), normalize(vV))), 2.0);
        float h = smoothstep(0.0, 0.3, vH) * (1.0 - smoothstep(0.5, 0.97, vH));
        gl_FragColor = vec4(vec3(1.0, 0.86, 0.66), f * h * uAlpha); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const coneGeo = new THREE.ConeGeometry(LAMP_LEN * Math.tan(spot.angle) * 0.95, LAMP_LEN, 64, 1, true); coneGeo.translate(0, -LAMP_LEN / 2, 0);
  const cone = new THREE.Mesh(coneGeo, coneMat);
  cone.position.copy(spot.position); cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), LAMP_AXIS);
  cone.renderOrder = 5; scene.add(cone);
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustP.slice(), 3));
  dustGeo.setAttribute('aRnd', new THREE.BufferAttribute(dustQ.slice(), 4));
  const dustMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uAlpha: { value: 0 }, uFocal: { value: 1 },
                uApex: { value: spot.position.clone() }, uAxis: { value: LAMP_AXIS.clone() }, uTan: { value: Math.tan(spot.angle) } },
    vertexShader: `attribute vec4 aRnd; uniform float uTime, uFocal, uTan; uniform vec3 uApex, uAxis; varying float vA;
      void main(){
        vec3 p = position; float s = uTime * aRnd.y;
        p.x += sin(s * 0.7 + aRnd.x * 6.28) * 14.0; p.z += cos(s * 0.5 + aRnd.x * 4.0) * 10.0;
        p.y = mod(p.y - uTime * (3.0 + 5.0 * aRnd.y), 520.0);
        vec3 d = p - uApex; float h = dot(d, uAxis); float rr = length(d - uAxis * h), R = h * uTan;
        vA = aRnd.w * (1.0 - smoothstep(R * 0.55, R, rr)) * smoothstep(0.0, 50.0, p.y) * step(0.0, h);
        vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;
        gl_PointSize = aRnd.z * uFocal / -mv.z; }`,
    fragmentShader: `uniform float uAlpha; varying float vA;
      void main(){ float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)); gl_FragColor = vec4(vec3(1.0, 0.9, 0.75), a * vA * uAlpha); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const dust = new THREE.Points(dustGeo, dustMat); dust.frustumCulled = false; dust.renderOrder = 6; scene.add(dust);

  // ───────── 서걱 순간 잘린 목에서 흩날리는 종이 섬유 ─────────
  const fibMat = new THREE.MeshStandardMaterial({ map: texFrom(PAPER_W, 1), color: 0xf4f0e8, roughness: 0.9, side: THREE.DoubleSide });
  const fibMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), fibMat, FIB_N);
  fibMesh.castShadow = true; fibMesh.frustumCulled = false; scene.add(fibMesh);
  const _fm = new THREE.Matrix4(), _fq = new THREE.Quaternion(), _fe = new THREE.Euler(), _fp = new THREE.Vector3(), _fs = new THREE.Vector3();
  function updateFibers(t) {
    const tau0 = t - A.slash;
    FIB.forEach((f, i) => {
      const tau = tau0;
      if (tau <= 0) { _fm.makeScale(0, 0, 0); fibMesh.setMatrixAt(i, _fm); return; }
      const landed = tau >= f.tl, tt = Math.min(tau, f.tl), dr = (1 - Math.exp(-f.k * tt)) / f.k;
      const fl = f.fa * Math.sin(f.fl * 6.283 * tt) * (1 - Math.exp(-2 * tt));
      _fp.set(f.x0 + f.vx * dr + fl, landed ? 0.6 : fibY(f, tt), f.z0 + f.vz * dr);
      if (landed) _fe.set(-Math.PI / 2, 0, f.yaw); else _fe.set(f.w[0] * tt, f.w[1] * tt, f.w[2] * tt);
      _fq.setFromEuler(_fe);
      const fade = 1 - clamp((tau - f.tl - 0.2) / 0.9); // 내려앉고 나면 사라져서 마지막 로고를 깨끗하게
      _fs.set(f.len * fade, f.wid * fade, 1);
      _fm.compose(_fp, _fq, _fs); fibMesh.setMatrixAt(i, _fm);
    });
    fibMesh.instanceMatrix.needsUpdate = true;
  }

  // 바닥에 눕는 평면 (탑뷰에서 화면 오른쪽 = +Z, 위 = +X)
  const FLOOR_BASIS = new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0));
  function decal(wu, hu, cw, ch, x, z, mat) {
    const c = document.createElement('canvas'); c.width = cw; c.height = ch;
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    mat.map = tex;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(wu, hu), mat);
    m.matrixAutoUpdate = false; m.matrix.copy(FLOOR_BASIS).setPosition(x, 0.6, z); m.matrixWorldNeedsUpdate = true;
    m.receiveShadow = true; m.visible = false; m.renderOrder = 2; scene.add(m);
    return { c, g: c.getContext('2d'), tex, m, k: cw / wu };
  }
  const label = decal(200, 31.25, 1024, 160, -65, 19, new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false }));

  const DU = {
    uDropR: { value: 0 }, uDraw: { value: 0 }, uSeed: { value: 3.7 }, uHaloA: { value: 0.4 },
    uS0: { value: new THREE.Vector2() }, uS1: { value: new THREE.Vector2() }, uDropC: { value: new THREE.Vector2() },
    uCore: { value: new THREE.Color() }, uHalo: { value: new THREE.Color() },
    uRoughCore: { value: 0.3 }, uRoughHalo: { value: 0.9 }, uMetal: { value: 0 }, uBump: { value: 1 }, uSpark: { value: 0 },
  };
  const dotMat = new THREE.MeshStandardMaterial({ transparent: true, depthWrite: false, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -2,
    envMap: envTex, envMapIntensity: DOT.env });
  dotMat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, DU);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vInk;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvInk = position.xy;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + INK_HEAD)
      .replace('#include <map_fragment>', 'vec4 inkC = inkAt(vInk); diffuseColor.rgb = inkC.rgb; diffuseColor.a *= inkC.a;')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(uRoughHalo, uRoughCore, gCore);')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor = uMetal * gCore;')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = inkPerturb(-vViewPosition, normal, vec2(dFdx(gHgt), dFdy(gHgt)), faceDirection);');
  };
  const dotMesh = new THREE.Mesh(new THREE.PlaneGeometry(72, 72), dotMat);
  dotMesh.matrixAutoUpdate = false; dotMesh.matrix.copy(FLOOR_BASIS).setPosition(0, 0.6, 15); dotMesh.matrixWorldNeedsUpdate = true;
  dotMesh.receiveShadow = true; dotMesh.visible = false; dotMesh.renderOrder = 2; scene.add(dotMesh);
  function drawDot(t) {
    const a = t - A.headImpact;
    dotMesh.visible = a >= 0; if (a < 0) return;
    DU.uCore.value.set(DOT.core); DU.uHalo.value.set(DOT.halo); DU.uHaloA.value = DOT.haloA;
    // 쓸리는 방향 (시작 = 진한 머리 = 핏방울 자리, 끝 = 갈라지는 꼬리)
    const [s0, s1] = SWEEP;
    const hk = 0.28; // 셰이더의 머리 위치(hu)와 같음
    DU.uS0.value.set(s0[0], s0[1]); DU.uS1.value.set(s1[0], s1[1]);
    DU.uDropC.value.set(lerp(s0[0], s1[0], hk), lerp(s0[1], s1[1], hk));
    DU.uDropR.value = lerp(1.4, 6.4, E.out3(clamp(a / 0.6)));               // 떨어진 핏방울 (탑뷰에서 확실히 보이게)
    DU.uDraw.value = E.out(prog(t, A.paint, A.paintEnd));                     // 바람처럼 한 번에 사악
    // 핏방울은 젖어 반짝이다가, 붓으로 그은 뒤엔 종이에 스미며 마름
    DU.uRoughCore.value = t < A.paint ? 0.1 : lerp(0.22, DOT.rough, prog(t, A.paintEnd, A.paintEnd + 1.5));
    DU.uRoughHalo.value = 0.92; DU.uMetal.value = DOT.metal; DU.uSpark.value = DOT.spark;
    DU.uBump.value = DOT.bump;
  }
  function drawLabel(t) {
    const u = prog(t, A.studio, A.studio + 0.8);
    label.m.visible = u > 0; if (u <= 0) return;
    const e = E.out3(u), k = label.k, g = label.g;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 1024, 160);
    const sp = lerp(16, 9.5, e) * k;
    g.font = `400 ${12 * k}px Jost, "Segoe UI", sans-serif`; g.textBaseline = 'middle';
    g.fillStyle = '#a8a196';
    const chars = [...'studio'], ws = chars.map(c => g.measureText(c).width);
    let x = 512 - (ws.reduce((s, w) => s + w, 0) + sp * (chars.length - 1)) / 2;
    chars.forEach((c, i) => { g.fillText(c, x, 80); x += ws[i] + sp; });
    label.m.material.opacity = e;
    label.tex.needsUpdate = true;
  }

  // 잘린 뒤 머리: 잘린 면을 타고 오른쪽 앞으로 미끄러지며 카메라 쪽으로 고개를 떨굼(뎅강)
  const XA = new THREE.Vector3(1, 0, 0), ZA = new THREE.Vector3(0, 0, 1);
  const hTum = al => 35 * Math.abs(Math.cos(rad(al))) + HT * Math.abs(Math.sin(rad(al)));
  const _hp = new THREE.Vector3(), _hq = new THREE.Quaternion(), _n = new THREE.Vector3(), ONE = new THREE.Vector3(1, 1, 1);
  const TUMBLE = 50; // 떨어지면서 앞으로 기우는 각도
  function headState(t) {
    let x, y, z, al = 0;
    if (t < A.slipEnd) { const u = E.in(prog(t, A.drop, A.slipEnd)); x = 6 * u; z = 10 * u; y = 106; al = 6 * u; }
    else if (t < A.headImpact) {
      const u = prog(t, A.slipEnd, A.headImpact);
      x = lerp(6, 8, u); z = lerp(10, 28, u); al = lerp(6, TUMBLE, E.in(u)); y = lerp(106, hTum(TUMBLE), E.in(u));
    }
    else if (t < A.headLand2) {
      const u = prog(t, A.headImpact, A.headLand2);
      x = lerp(8, 2, u); z = lerp(28, 56, u); al = lerp(TUMBLE, 160, u);
      y = Math.max(hTum(TUMBLE) + 26 * Math.sin(Math.PI * u), hTum(al) + 0.5);
    }
    else {
      const tau = t - A.headLand2, i = clamp(Math.round(tau * ER), 0, EUL.n - 1);
      const be = EUL.beta[i], ps = EUL.psi[i], u = E.out3(clamp(tau / 0.35));
      x = lerp(2, 0, u); z = lerp(56, 72, u);
      y = 35 * Math.sin(be) + HT * Math.cos(be);
      _n.set(Math.sin(be) * Math.cos(ps), Math.cos(be), Math.sin(be) * Math.sin(ps));
      _hq.setFromUnitVectors(ZA, _n);
      return { pos: _hp.set(x, y, z), quat: _hq };
    }
    _hq.setFromAxisAngle(XA, rad(al));
    return { pos: _hp.set(x, y, z), quat: _hq };
  }

  // 카메라: OK 포즈부터 뎅강까지 회전 없이 아주 천천히 다가감 → 머리가 떨어진 뒤 왼쪽으로 돌며 올라가 탑뷰
  const TG0 = new THREE.Vector3(0, 60, 0), TG1 = new THREE.Vector3(-10, 0, 19), DIST = 1832, DIST_IN = 1640;
  const _tg = new THREE.Vector3(), _dir = new THREE.Vector3();
  let camEl = 3;
  function placeCamera(t, sx = 0, sy = 0) {
    const u = E.io3(prog(t, A.camStart, A.camEnd));
    const az = rad(lerp(0, -90, u)), el = rad(lerp(3, 90, u));
    const dist = lerp(lerp(DIST, DIST_IN, E.io(prog(t, A.okPose, A.camStart))), DIST, u);
    camEl = lerp(3, 90, u);
    _tg.copy(TG0).lerp(TG1, u);
    _dir.set(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az));
    camera.up.set(-Math.sin(el) * Math.sin(az), Math.cos(el), -Math.sin(el) * Math.cos(az));
    camera.position.copy(_tg).addScaledVector(_dir, dist);
    camera.lookAt(_tg);
    if (sx || sy) { camera.translateX(sx); camera.translateY(sy); }
  }
  function flickerOff(t) {
    const f = A.flicker;
    return (t >= f && t < f + 0.07) || (t >= f + 0.11 && t < f + 0.14);
  }

  const _m = new THREE.Matrix4();
  function updateScene(t, tr) { // t = 애니메이션 시간, tr = 실제 시간 (히트스톱 중 흔들림·먼지는 계속 움직임)
    const r = rig(t);
    root.position.x = r.x;
    fallG.rotation.x = -rad(r.fallB);
    leanG.rotation.z = -rad(r.lean);
    sqG.scale.set(r.sx, r.sq, 1);
    offG.position.y = -r.Y;
    legLm.rotation.z = -rad(r.legL); legRm.rotation.z = -rad(r.legR);
    chestG.rotation.x = rad(r.flex);
    barG.rotation.z = -rad(r.armT); halfL.rotation.z = -rad(r.armB); halfR.rotation.z = rad(r.armB);
    root.updateMatrixWorld(true);
    if (t < A.drop) {
      const [lx, ly] = lagAt(t);
      head.matrix.makeTranslation(lx, -ly, 0).multiply(offG.matrixWorld).multiply(_m.makeTranslation(r.headX, 106 - r.headY, 0));
    } else {
      const hs = headState(t); head.matrix.compose(hs.pos, hs.quat, ONE);
    }
    head.matrixWorldNeedsUpdate = true;

    const L = flickerOff(t) ? 0 : 1;
    spot.intensity = LIGHT.spot * L; hemi.intensity = LIGHT.hemi * L; fill.intensity = LIGHT.fill * L;

    let sx = 0, sy = 0;
    const shake = (t0, amp, dur) => {
      const a = tr - t0;
      if (a >= 0 && a < dur) { const k = amp * Math.exp(-a / (dur * 0.3)); sx += k * Math.sin(a * 97 + 1.7); sy += k * Math.cos(a * 83 + 0.3); }
    };
    shake(unwarp(A.thud), 1.6, 0.3); shake(unwarp(A.thud + 0.12), 0.8, 0.15); shake(HS.at, 2.2, 0.2);
    placeCamera(t, sx, sy);
    drawDot(t); drawLabel(t); updateFibers(t);
    const vis = L * (1 - clamp((camEl - 25) / 40)); // 빛줄기·먼지는 위에서 내려다볼 땐 사라짐
    coneMat.uniforms.uAlpha.value = 0.16 * vis;
    dustMat.uniforms.uAlpha.value = 0.45 * vis; dustMat.uniforms.uTime.value = tr;
  }

  // ───────── 화면 위 효과 ─────────
  // Vignette and grain moved to a CSS layer shared with the hero still; the cut line, flash and black fades stay here.
  const ov = ovc && ovc.getContext('2d');
  let slashY = null;
  function neckScreenY() {
    if (slashY === null) {
      placeCamera(A.slash - 0.001); camera.updateMatrixWorld();
      const v = new THREE.Vector3(0, 66.5, 0).project(camera);
      slashY = (1 - (v.y + 1) / 2) * H;
    }
    return slashY;
  }
  function drawOverlay(t) {
    if (!ov) return;
    const k = Math.max(H, W * 9 / 16) / 1080; // the splash drew its lines for a 1080p frame
    ov.setTransform(1, 0, 0, 1, 0, 0); ov.globalAlpha = 1; ov.clearRect(0, 0, W, H);
    const a = t - A.slash;
    if (a >= 0) {
      const y = neckScreenY(), sweep = clamp(a / 0.05);
      const bright = a < 0.05 ? 1 : Math.exp(-(a - 0.05) / 0.09), faint = 0.22 * Math.exp(-a / 0.35);
      const alpha = Math.max(bright, faint);
      if (alpha > 0.005) {
        ov.save(); ov.globalAlpha = alpha; ov.strokeStyle = '#fff'; ov.lineWidth = (bright > faint ? 3 : 1.5) * k;
        ov.shadowColor = 'rgba(255,255,255,0.9)'; ov.shadowBlur = 24 * bright * k;
        ov.beginPath(); ov.moveTo(-40 * k, y); ov.lineTo(-40 * k + (W + 80 * k) * sweep, y); ov.stroke(); ov.restore();
      }
      const fl = 0.16 * Math.exp(-a / 0.05);
      if (fl > 0.004) { ov.fillStyle = `rgba(255,255,255,${fl})`; ov.fillRect(0, 0, W, H); }
    }
    const black = Math.max(1 - E.io(prog(t, 0, 0.45)), flickerOff(t) ? 1 : 0, E.io(prog(t, A.fadeOut, A.end)));
    if (black > 0) { ov.globalAlpha = black; ov.fillStyle = '#000'; ov.fillRect(0, 0, W, H); ov.globalAlpha = 1; }
  }

  function resize(w, h) {
    W = w; H = h;
    renderer.setSize(W, H, false);
    if (ovc) { ovc.width = W; ovc.height = H; }
    const aspect = W / H;
    camera.aspect = aspect;
    camera.fov = aspect >= 16 / 9 ? 2 * Math.atan(Math.tan(rad(7)) * (16 / 9) / aspect) * 180 / Math.PI : 14;
    camera.updateProjectionMatrix();
    dustMat.uniforms.uFocal.value = H / (2 * Math.tan(rad(camera.fov / 2)));
    slashY = null;
  }
  resize(W, H);

  return {
    canvases: ovc ? [glc, ovc] : [glc],
    render(tr) { // tr = 실제 재생 시간
      const ta = warp(tr);
      updateScene(ta, tr);
      renderer.render(scene, camera);
      drawOverlay(ta);
    },
    resize,
    // Compile the shaders that first appear mid-intro (blood dot, "studio" label) while the screen is still black.
    warm() {
      dotMesh.visible = true; label.m.visible = true;
      renderer.compile(scene, camera);
      dotMesh.visible = false; label.m.visible = false;
    },
    dispose() {
      scene.traverse(o => {
        o.geometry?.dispose();
        const mats = o.material ? [].concat(o.material) : [];
        for (const m of mats) {
          for (const key of ['map', 'bumpMap', 'alphaMap']) m[key]?.dispose();
          m.dispose();
        }
      });
      envTex.dispose(); pmrem.dispose();
      renderer.dispose(); renderer.forceContextLoss();
      for (const c of [glc, ovc]) c?.remove();
    },
  };
}

// ───────── 소리 (코드로 합성한 임시 효과음) ─────────
let actx = null, bus = null, loops = [], NB = null, BB = null;
function ensureAudio() {
  if (!actx) {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    const comp = actx.createDynamicsCompressor();
    comp.threshold.value = -10; comp.ratio.value = 4; comp.connect(actx.destination);
    actx._out = comp;
  }
  return actx;
}
function noiseBuf() {
  if (NB) return NB;
  const n = actx.sampleRate * 2; NB = actx.createBuffer(1, n, actx.sampleRate);
  const d = NB.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return NB;
}
function brownBuf() {
  if (BB) return BB;
  const n = actx.sampleRate * 4; BB = actx.createBuffer(1, n, actx.sampleRate);
  const d = BB.getChannelData(0); let last = 0;
  for (let i = 0; i < n; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
  return BB;
}
function envGain(at, peak, a, d) {
  const g = actx.createGain();
  g.gain.setValueAtTime(0.0001, at); g.gain.linearRampToValueAtTime(peak, at + a);
  g.gain.exponentialRampToValueAtTime(0.0001, at + a + d);
  return g;
}
function N(at, { dur = 0, type = 'bandpass', f = 1000, f2 = 0, q = 1, peak = 0.3, a = 0.003, d = 0.08 }) {
  at = Math.max(at, actx.currentTime);
  const s = actx.createBufferSource(); s.buffer = noiseBuf();
  const fl = actx.createBiquadFilter(); fl.type = type; fl.Q.value = q;
  fl.frequency.setValueAtTime(f, at); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, at + (dur || a + d));
  const g = envGain(at, peak, a, d);
  s.connect(fl); fl.connect(g); g.connect(bus);
  s.start(at, Math.random() * 1.5); s.stop(at + a + d + 0.05);
}
function O(at, { type = 'sine', f = 200, f2 = 0, glide = 0.1, peak = 0.3, a = 0.003, d = 0.15 }) {
  at = Math.max(at, actx.currentTime);
  const o = actx.createOscillator(); o.type = type;
  o.frequency.setValueAtTime(f, at); if (f2) o.frequency.exponentialRampToValueAtTime(f2, at + glide);
  const g = envGain(at, peak, a, d);
  o.connect(g); g.connect(bus); o.start(at); o.stop(at + a + d + 0.05);
}
const SFX = {
  // 음정 있는 '통·뾱·삐' 소리는 빼고, 종이가 닿고 스치는 소리 위주로 (전부 노이즈 기반, 낮은 볼륨)
  step: (at, s = 1, k = 0) => { N(at, { f: 1500 + (k % 2) * 300, q: 0.9, peak: 0.03 + 0.06 * s, a: 0.002, d: 0.035 }); N(at, { type: 'lowpass', f: 420, q: 0.7, peak: 0.035 * s, a: 0.002, d: 0.04 }); },
  trip: at => { N(at, { f: 1100, q: 0.8, peak: 0.1, d: 0.06 }); N(at, { type: 'lowpass', f: 380, q: 0.7, peak: 0.07, d: 0.06 }); },
  skid: at => N(at, { f: 1700, f2: 800, dur: 0.32, q: 0.6, peak: 0.07, a: 0.01, d: 0.28 }),
  stop: at => { N(at, { f: 900, f2: 420, dur: 0.12, q: 0.8, peak: 0.09, a: 0.004, d: 0.09 }); N(at, { type: 'lowpass', f: 320, q: 0.7, peak: 0.07, d: 0.08 }); },
  shuffle: at => N(at, { f: 1100, q: 1, peak: 0.035, a: 0.005, d: 0.045 }),
  sigh: at => {
    N(at, { f: 1300, f2: 520, dur: 0.5, q: 0.9, peak: 0.05, a: 0.09, d: 0.42 });
    N(at, { type: 'lowpass', f: 700, q: 0.7, peak: 0.028, a: 0.1, d: 0.38 });
  },
  hop: at => N(at, { type: 'highpass', f: 1800, f2: 3400, dur: 0.15, q: 0.6, peak: 0.03, a: 0.03, d: 0.12 }),        // 종이가 휙
  zap: at => { O(at, { type: 'sawtooth', f: 118, peak: 0.03, a: 0.002, d: 0.05 }); N(at, { type: 'highpass', f: 2600, q: 0.7, peak: 0.06, a: 0.001, d: 0.035 }); },
  slash: at => { N(at - 0.008, { type: 'highpass', f: 2500, f2: 7500, dur: 0.08, q: 0.7, peak: 0.42, a: 0.003, d: 0.1 }); N(at + 0.03, { f: 5200, q: 3, peak: 0.05, d: 0.07 }); },
  rub: at => N(at, { f: 2400, q: 2, peak: 0.028, a: 0.04, d: 0.12 }),                                              // 잘린 면이 사각
  slide: at => N(at, { f: 3000, f2: 2000, dur: 0.14, q: 1.6, peak: 0.04, a: 0.02, d: 0.12 }),
  knock: (at, s) => { N(at, { f: 1800, q: 1, peak: 0.09 * s, a: 0.001, d: 0.045 }); N(at, { type: 'lowpass', f: 300, q: 0.7, peak: 0.1 * s, a: 0.002, d: 0.08 }); },
  splat: at => { N(at, { type: 'lowpass', f: 900, q: 0.7, peak: 0.08, a: 0.002, d: 0.07 }); N(at + 0.01, { f: 2500, q: 1, peak: 0.025, d: 0.04 }); },
  thud: at => { N(at, { type: 'lowpass', f: 1400, f2: 420, dur: 0.12, q: 0.7, peak: 0.4, a: 0.002, d: 0.12 }); N(at, { type: 'lowpass', f: 160, q: 0.7, peak: 0.12, a: 0.003, d: 0.12 }); N(at + 0.03, { type: 'highpass', f: 3000, q: 0.7, peak: 0.035, d: 0.09 }); },
  slap: at => { N(at, { type: 'lowpass', f: 2200, f2: 700, dur: 0.06, q: 0.7, peak: 0.22, a: 0.001, d: 0.07 }); N(at, { type: 'highpass', f: 3500, q: 0.7, peak: 0.04, d: 0.05 }); }, // 털-'썩'
  flutter: at => N(at, { type: 'highpass', f: 4200, f2: 6000, dur: 0.5, q: 0.7, peak: 0.014, a: 0.15, d: 0.5 }),               // 섬유 흩날림
  tick: (at, s = 1) => N(at, { f: 2600 + 900 * s, q: 1.4, peak: 0.012 + 0.018 * s, d: 0.014 }),
  clack: at => N(at, { f: 2000, q: 1, peak: 0.06, a: 0.001, d: 0.04 }),
  brush: at => { // 바람처럼 사악 — 젖은 피가 종이에 쓸리는 소리
    N(at, { f: 5200, f2: 1600, dur: 0.22, q: 0.7, peak: 0.07, a: 0.02, d: 0.22 });
    N(at + 0.02, { type: 'lowpass', f: 900, q: 0.7, peak: 0.03, a: 0.01, d: 0.16 });
  },
};
function events() {
  const ev = [];
  for (let k = 0; ; k++) {
    const tk = (0.25 + 0.5 * k) / 3.5;
    if (tk > 1.15) break;
    if (tk < 0.33 || Math.abs(tk - 1.0) < 0.06) continue;
    ev.push([tk, at => SFX.step(at, 1, k)]);
  }
  ev.push([1.0, SFX.trip], [1.2, SFX.skid], [1.52, SFX.stop], [1.68, at => SFX.step(at, 0.4)]);
  ev.push([1.97, SFX.shuffle], [2.47, SFX.shuffle], [2.77, SFX.shuffle]);
  ev.push([2.95, SFX.sigh], [3.48, SFX.hop], [3.72, at => SFX.step(at, 0.6)]);
  ev.push([A.flicker, SFX.zap], [A.flicker + 0.11, SFX.zap], [A.slash, SFX.slash], [A.slash + 0.08, SFX.flutter]);
  const b = A.bt, h = P.huh;
  ev.push([b + h * 0.06, SFX.rub], [b + h * 0.46, SFX.rub]);   // 어? 어라? 는 소리 없이 미끄덩하는 사각 소리만
  ev.push([A.drop, SFX.slide]);
  ev.push([A.headImpact, at => SFX.knock(at, 1.2)], [A.headImpact + 0.005, SFX.splat]);
  ev.push([A.headLand2, at => SFX.knock(at, 0.5)]);
  ev.push([A.thud, SFX.thud], [A.thud + 0.12, SFX.slap]);
  RATTLE.forEach(([tt, s]) => ev.push([tt, at => SFX.tick(at, s)]));
  ev.push([A.eulerEnd, SFX.clack], [A.paint, SFX.brush]);
  return ev.map(([te, fn]) => [unwarp(te), fn]); // 히트스톱만큼 뒤로 밀린 실제 시간
}
function scheduleLevel(param, from, map, points) {
  let cur = points[0][1];
  for (let i = 0; i < points.length - 1; i++) {
    const [ta, va] = points[i], [tb, vb] = points[i + 1];
    if (from >= ta && from < tb) cur = lerp(va, vb, prog(from, ta, tb));
    else if (from >= tb) cur = vb;
  }
  param.setValueAtTime(Math.max(cur, 0.0001), map(from));
  for (const [tp, v] of points) if (tp > from) param.linearRampToValueAtTime(Math.max(v, 0.0001), map(tp));
}
function startBeds(from, map) {
  if (from < A.slash) {
    const s = actx.createBufferSource(); s.buffer = brownBuf(); s.loop = true;
    const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 280;
    const hum = actx.createOscillator(); hum.frequency.value = 50;
    const hg = actx.createGain(); hg.gain.value = 0.18;
    const g = actx.createGain();
    scheduleLevel(g.gain, from, map, [[0, 0], [0.5, 0.07], [A.slash - 0.002, 0.07], [A.slash + 0.01, 0]]);
    s.connect(lp); lp.connect(g); hum.connect(hg); hg.connect(g); g.connect(bus);
    const a = map(from), b = map(A.slash) + 0.05;
    s.start(a); hum.start(a); s.stop(b); hum.stop(b);
    loops.push(s, hum);
  }
  if (from < END) {
    const st = unwarp(A.studio), fo = unwarp(A.fadeOut);
    const g = actx.createGain();
    scheduleLevel(g.gain, from, map, [[st, 0], [Math.min(st + 0.9, fo), 0.1], [fo, 0.1], [END, 0]]);
    g.connect(bus);
    const a = map(Math.max(from, st)), b = map(END) + 0.05;
    [[55, 1], [82.4, 0.5], [110, 0.25]].forEach(([f, v]) => {
      const o = actx.createOscillator(); o.frequency.value = f;
      const og = actx.createGain(); og.gain.value = v;
      o.connect(og); og.connect(g); o.start(a); o.stop(b); loops.push(o);
    });
  }
}
function stopAudio() {
  if (bus) {
    const b = bus;
    try { b.gain.cancelScheduledValues(actx.currentTime); b.gain.setTargetAtTime(0, actx.currentTime, 0.01); } catch (e) {}
    setTimeout(() => b.disconnect(), 150);
    bus = null;
  }
  loops.forEach(n => { try { n.stop(); } catch (e) {} });
  loops = [];
}
// Schedules every effect from real time `from` on and returns the audio-clock time that maps to `from`.
function startAudio(from) {
  stopAudio();
  bus = actx.createGain(); bus.connect(actx._out);
  const c0 = actx.currentTime + 0.05;
  const map = te => c0 + (te - from);
  for (const [te, fn] of events()) if (te >= from - 0.001) fn(map(te));
  startBeds(from, map);
  return c0;
}

// ───────── 재생 ─────────
const coarse = () => matchMedia('(pointer: coarse)').matches;
function bufferSize(cssW, cssH, cap) {
  const ratio = Math.min(devicePixelRatio || 1, 2, Math.sqrt(cap / Math.max(1, cssW * cssH)));
  return [Math.max(1, Math.round(cssW * ratio)), Math.max(1, Math.round(cssH * ratio))];
}
function fontsReady(limitMs = 1500) {
  if (!document.fonts?.load) return Promise.resolve();
  return Promise.race([document.fonts.load('400 61px Jost').catch(() => {}), new Promise(r => setTimeout(r, limitMs))]);
}
const abortError = () => new DOMException('Intro aborted', 'AbortError');

/**
 * Plays the intro into `mount` (sized by CSS). Returns a controller:
 * ready — scene built and playing; rejects with AbortError if `signal` aborts first (nothing is left in `mount`).
 * done — resolves with { skipped } once the T_LOGO frame is drawn; the canvas stays until destroy().
 */
export function playIntro({ mount, signal } = {}) {
  let scene = null, raf = 0, ro = null, isReady = false, finished = false, destroyed = false;
  let clock = { audio: false, t0: 0, c0: performance.now() / 1000 }, soundOn = false, pausedAt = null, current = 0;
  let resolveReady, rejectReady, resolveDone;
  const ready = new Promise((res, rej) => { resolveReady = res; rejectReady = rej; });
  const done = new Promise((res) => { resolveDone = res; });
  const cap = coarse() ? 1.3e6 : 2.1e6;

  const clockNow = () => (clock.audio ? actx.currentTime : performance.now() / 1000);
  const clockT = () => clock.t0 + Math.max(0, clockNow() - clock.c0);
  const setClock = (from) => {
    if (soundOn && actx && actx.state === 'running') clock = { audio: true, t0: from, c0: startAudio(from) };
    else { stopAudio(); clock = { audio: false, t0: from, c0: performance.now() / 1000 }; }
  };

  function frame() {
    raf = 0;
    if (finished || destroyed) return;
    if (clock.audio && actx.state !== 'running') {
      // Audio was interrupted (e.g. a call on iOS) and its clock stopped: carry on silently on the wall clock.
      const t0 = clockT();
      stopAudio();
      clock = { audio: false, t0, c0: performance.now() / 1000 };
    }
    let t = clockT();
    if (t >= T_LOGO) t = T_LOGO;
    current = t;
    scene.render(t);
    if (t >= T_LOGO) return finish(false);
    raf = requestAnimationFrame(frame);
  }
  function finish(skipped) {
    if (finished) return;
    finished = true;
    if (raf) cancelAnimationFrame(raf), raf = 0;
    if (bus) {
      const b = bus;
      b.gain.setTargetAtTime(0, actx.currentTime, 0.3);
      setTimeout(() => { if (bus === b) stopAudio(); }, 1200);
    }
    resolveDone({ skipped });
  }
  function onVisibility() {
    if (!isReady || finished) return;
    if (document.hidden) {
      pausedAt = clockT();
      if (raf) cancelAnimationFrame(raf), raf = 0;
      stopAudio();
    } else if (pausedAt !== null) {
      setClock(pausedAt);
      pausedAt = null;
      raf = requestAnimationFrame(frame);
    }
  }
  function onContextLost(e) {
    e.preventDefault();
    if (!finished) finish(true);
    destroy();
  }
  function resizeToMount() {
    const r = mount.getBoundingClientRect();
    const [w, h] = bufferSize(r.width, r.height, cap);
    scene.resize(w, h);
    if (finished || !raf) scene.render(current);
  }
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    if (raf) cancelAnimationFrame(raf), raf = 0;
    ro?.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    if (!finished) stopAudio();
    if (scene) {
      scene.canvases[0].removeEventListener('webglcontextlost', onContextLost);
      scene.dispose();
      scene = null;
    }
  }

  (async () => {
    const check = () => { if (signal?.aborted || destroyed) throw abortError(); };
    try {
      check();
      await fontsReady();
      check();
      const r = mount.getBoundingClientRect();
      const [w, h] = bufferSize(r.width, r.height, cap);
      scene = createScene({ width: w, height: h, shadowSize: coarse() ? 1024 : 2048 });
      mount.append(...scene.canvases);
      scene.canvases[0].addEventListener('webglcontextlost', onContextLost);
      scene.warm();
      scene.render(0);
      check();
      ro = new ResizeObserver(() => requestAnimationFrame(() => scene && resizeToMount()));
      ro.observe(mount);
      document.addEventListener('visibilitychange', onVisibility);
      isReady = true;
      if (document.hidden) {
        pausedAt = 0; // opened in a background tab: start from the top once the tab is shown
      } else {
        clock = { audio: false, t0: 0, c0: performance.now() / 1000 };
        if (soundOn) setClock(0);
        raf = requestAnimationFrame(frame);
      }
      resolveReady();
    } catch (err) {
      destroy();
      rejectReady(err);
    }
  })();
  signal?.addEventListener('abort', () => { if (!isReady) destroy(); }, { once: true });

  return {
    ready,
    done,
    skip() {
      if (!isReady || finished) return;
      current = T_LOGO;
      scene.render(T_LOGO);
      finish(true);
    },
    async setSound(on) {
      soundOn = on;
      if (!on) {
        if (isReady && !finished) setClock(clockT());
        else stopAudio();
        return;
      }
      ensureAudio();
      if (actx.state !== 'running') await Promise.race([actx.resume(), new Promise(r => setTimeout(r, 300))]);
      if (isReady && !finished && pausedAt === null) setClock(clockT());
    },
    destroy,
    getTime: () => (finished ? current : !isReady ? 0 : pausedAt ?? clockT()),
  };
}

/** Renders one frame (default T_LOGO) without overlay effects and returns it as a 2D canvas. */
export async function renderFrame({ width, height, t = T_LOGO }) {
  await fontsReady();
  const scene = createScene({ width, height, preserveDrawingBuffer: true, overlay: false });
  scene.render(t);
  const out = Object.assign(document.createElement('canvas'), { width, height });
  out.getContext('2d').drawImage(scene.canvases[0], 0, 0);
  scene.dispose();
  return out;
}

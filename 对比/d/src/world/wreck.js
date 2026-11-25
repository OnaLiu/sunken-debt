import * as THREE from 'three';
import { GeoBuilder } from '../util/builder.js';
import { mulberry32, smoothstep, clamp, vnoise } from '../util/math.js';
import { toon } from '../render/materials.js';
import { WRECK } from './layout.js';
import { seabedY } from './terrain.js';
import { TopZ, TAG } from './collide.js';

// 一条宽腹中世纪木帆商船（柯克船式样）：搭接船壳、龙骨、肋骨、首楼、有顶的尾楼、两道舱口、断桅。
// 局部坐标：x 朝船头，y 朝上，z 朝右舷。原点在船中龙骨底。

const XS = -10.4; // 尾柱顶
const XB = 11.4; // 首柱顶
const XM = 0.6;

export function keelY(x) {
  if (x > 7.2) return 5.0 * Math.pow((x - 7.2) / (XB - 7.2), 1.7);
  if (x < -7.6) return 5.6 * Math.pow((-7.6 - x) / (-7.6 - XS), 1.25);
  return 0;
}
export function sheerY(x) {
  return x >= 0 ? 4.0 + 1.35 * Math.pow(x / XB, 2.2) : 4.0 + 1.7 * Math.pow(x / XS, 2.0);
}
function halfB(x) {
  const u = x >= XM ? (x - XM) / (XB - XM) : (XM - x) / (XM - XS);
  return 3.6 * Math.pow(Math.max(0, 1 - Math.pow(clamp(u, 0, 1), 2.3)), 0.6);
}
function secN(x) {
  const u = Math.abs(x - XM) / 10.8;
  return 2.9 - 1.3 * u * u;
}
export function hullPt(x, v, side, out = new THREE.Vector3()) {
  const k = keelY(x), top = sheerY(x), B = halfB(x), n = secN(x);
  const th = clamp(v, 0, 1) * Math.PI / 2;
  const c = Math.cos(th), s = Math.sin(th);
  const z = B * Math.pow(s, 2 / n) * (1 - 0.06 * smoothstep(0.82, 1, v));
  const y = k + (top - k) * (1 - Math.pow(c, 2 / n));
  return out.set(x, y, side * z);
}
function hullNormal(x, v, side) {
  const e = 0.01;
  const p = hullPt(x, v, side);
  const px = hullPt(x + e, v, side).sub(p);
  const pv = hullPt(x, Math.min(1, v + e), side).sub(p);
  const n = side > 0 ? px.cross(pv) : pv.cross(px);
  // 朝外：z 分量与 side 同号，或朝下
  n.normalize();
  if (n.z * side < 0 && Math.abs(n.z) > 0.2) n.negate();
  return n;
}
export function deckY(x) {
  return sheerY(x) - 0.85;
}
// 某一高度上船壳内侧的半宽
function halfWidthAt(x, y) {
  let lo = 0, hi = 1;
  for (let i = 0; i < 22; i++) {
    const m = (lo + hi) / 2;
    if (hullPt(x, m, 1).y < y) lo = m; else hi = m;
  }
  return hullPt(x, lo, 1).z;
}

// 船腹破口：左舷（朝上的一面）一个不规则的大洞
const BREACH = { x: 2.6, v: 0.86, rx: 2.7, rv: 0.36 };
function inBreach(x, v, side, rnd = 0) {
  if (side > 0) return false;
  const dx = (x - BREACH.x) / BREACH.rx, dv = (v - BREACH.v) / BREACH.rv;
  const n = vnoise(x * 1.7, v * 9, 3) * 0.55 + rnd;
  return dx * dx + dv * dv < 0.78 + n * 0.5;
}
// 尾部一条缺板（露出肋骨）
function missingStrake(x, k, side) {
  return side < 0 && k === 7 && x > -6.5 && x < -4.7;
}

const HATCHES = [
  { x: -3.0, hx: 0.95, hz: 0.95 },
  { x: 5.55, hx: 0.7, hz: 0.85 },
];
// 中段甲板整片塌进舱里（断舱）：从正上方能直着下网到舱底的淤泥
const GAP = { x0: 0.95, x1: 4.4 };

const COL = {
  plank: new THREE.Color(0.5, 0.38, 0.27),
  plankDark: new THREE.Color(0.3, 0.23, 0.17),
  inner: new THREE.Color(0.3, 0.23, 0.17),
  rib: new THREE.Color(0.42, 0.32, 0.23),
  deck: new THREE.Color(0.58, 0.48, 0.36),
  keel: new THREE.Color(0.27, 0.21, 0.16),
  wale: new THREE.Color(0.25, 0.19, 0.14),
  algae: new THREE.Color(0.4, 0.46, 0.28),
  paintRed: new THREE.Color(0.62, 0.3, 0.24),
  paintOchre: new THREE.Color(0.72, 0.58, 0.3),
  mud: new THREE.Color(0.36, 0.33, 0.27),
  holdMud: new THREE.Color(0.2, 0.18, 0.15),
  stone: new THREE.Color(0.66, 0.64, 0.58),
  cask: new THREE.Color(0.56, 0.44, 0.3),
  clay: new THREE.Color(0.72, 0.46, 0.32),
  iron: new THREE.Color(0.3, 0.24, 0.2),
  sail: new THREE.Color(0.78, 0.72, 0.6),
  rope: new THREE.Color(0.55, 0.48, 0.36),
};

export function buildWreck() {
  const rnd = mulberry32(4242);
  const group = new THREE.Group();
  group.name = 'wreck';
  const ship = new THREE.Group();
  ship.rotation.set(WRECK.heel, WRECK.yaw, WRECK.pitch, 'YXZ');
  group.add(ship);

  const rotOnly = new THREE.Matrix4().makeRotationFromEuler(ship.rotation);
  const worldUp = (n) => n.clone().applyMatrix4(rotOnly).y;

  const B = {
    hull: new GeoBuilder(),
    rib: new GeoBuilder(),
    deck: new GeoBuilder(),
    coaming: new GeoBuilder(),
    castle: new GeoBuilder(),
    mast: new GeoBuilder(),
    floor: new GeoBuilder(),
    cargo: new GeoBuilder(),
  };

  // 颜色：朝上的面长了藻，局部发暗
  const plankColor = (seedA, n, base = COL.plank) => {
    const c = base.clone().multiplyScalar(0.86 + seedA * 0.22);
    const up = worldUp(n);
    if (up > 0.35) c.lerp(COL.algae, clamp((up - 0.35) * 0.6, 0, 0.3));
    return c;
  };

  // ——— 船壳：12 条搭接板，每条有厚度 ———
  const NST = 70;
  const stations = [];
  for (let i = 0; i <= NST; i++) stations.push(XS + 0.08 + (XB - XS - 0.16) * (i / NST));
  const NSTRAKE = 12;
  const vEdge = [];
  for (let k = 0; k <= NSTRAKE; k++) vEdge.push(0.035 + (1 - 0.035) * (k / NSTRAKE));
  const LAP = 0.05, THICK = 0.085;
  const tmp = new THREE.Vector3();

  for (const side of [-1, 1]) {
    for (let k = 0; k < NSTRAKE; k++) {
      const v0 = vEdge[k], v1 = vEdge[k + 1];
      const shade = rnd();
      const breakJit = (rnd() - 0.5) * 0.4;
      let run = [];
      const flush = () => {
        if (run.length >= 2) emitStrake(run, v0, v1, side, shade);
        run = [];
      };
      for (let i = 0; i < stations.length; i++) {
        const x = stations[i];
        const vm = (v0 + v1) / 2;
        const gone = inBreach(x, vm, side, breakJit) || missingStrake(x, k, side);
        if (gone) flush(); else run.push(x);
      }
      flush();
    }
  }

  function emitStrake(xs, v0, v1, side, shade) {
    const outer0 = [], outer1 = [], inner0 = [], inner1 = [];
    for (const x of xs) {
      const n0 = hullNormal(x, v0, side), n1 = hullNormal(x, v1, side);
      const p0 = hullPt(x, v0, side).addScaledVector(n0, LAP);
      const p1 = hullPt(x, v1, side);
      outer0.push(p0); outer1.push(p1);
      inner0.push(p0.clone().addScaledVector(n0, -THICK - LAP * 0.6));
      inner1.push(p1.clone().addScaledVector(n1, -THICK));
    }
    for (let i = 0; i < xs.length - 1; i++) {
      const a = outer0[i], b = outer0[i + 1], c = outer1[i + 1], d = outer1[i];
      const nrm = hullNormal((xs[i] + xs[i + 1]) / 2, (v0 + v1) / 2, side);
      const plankSeam = Math.floor((xs[i] + 30 + shade * 7) / 4.2) % 2 === 0 ? 1 : 0.93;
      const col = plankColor(shade, nrm).multiplyScalar(plankSeam);
      if (side > 0) B.hull.quad(a, b, c, d, col); else B.hull.quad(d, c, b, a, col);
      // 内面
      const ci = COL.inner.clone().multiplyScalar(0.85 + shade * 0.25);
      const ai = inner0[i], bi = inner0[i + 1], cI = inner1[i + 1], di = inner1[i];
      if (side > 0) B.hull.quad(di, cI, bi, ai, ci); else B.hull.quad(ai, bi, cI, di, ci);
      // 下沿（搭接的台阶）
      if (side > 0) B.hull.quad(ai, bi, b, a, col.clone().multiplyScalar(0.7)); else B.hull.quad(a, b, bi, ai, col.clone().multiplyScalar(0.7));
    }
    // 断头（端面）
    const capCol = new THREE.Color(0.7, 0.6, 0.46);
    for (const i of [0, xs.length - 1]) {
      const a = outer0[i], b = outer1[i], c = inner1[i], d = inner0[i];
      const j = i === 0 ? 1 : -1;
      // 断口参差：外角往外挪一点
      if (i === 0) B.hull.quad(a, b, c, d, capCol); else B.hull.quad(d, c, b, a, capCol);
      void j;
    }
  }

  // ——— 龙骨、首柱、尾柱 ———
  {
    const kb = B.hull;
    kb.box(new THREE.Vector3(-0.2, -0.12, 0), new THREE.Vector3(7.7, 0, 0), new THREE.Vector3(0, 0.24, 0), new THREE.Vector3(0, 0, 0.17), COL.keel);
    const stemPts = [];
    for (let i = 0; i <= 10; i++) {
      const x = 7.2 + (XB + 0.15 - 7.2) * (i / 10);
      stemPts.push(new THREE.Vector3(x, keelY(Math.min(x, XB)) - 0.12, 0));
    }
    for (let i = 0; i < stemPts.length - 1; i++) kb.beam(stemPts[i], stemPts[i + 1], new THREE.Vector3(0, 0, 1), 0.34, 0.36, COL.keel);
    const sternPts = [];
    for (let i = 0; i <= 8; i++) {
      const x = -7.6 + (XS - 0.1 + 7.6) * (i / 8);
      sternPts.push(new THREE.Vector3(x, keelY(Math.max(x, XS)) - 0.12, 0));
    }
    for (let i = 0; i < sternPts.length - 1; i++) kb.beam(sternPts[i], sternPts[i + 1], new THREE.Vector3(0, 0, 1), 0.34, 0.4, COL.keel);
    // 尾柱顶伸出
    kb.beam(new THREE.Vector3(XS - 0.05, 5.4, 0), new THREE.Vector3(XS - 0.25, 7.0, 0), new THREE.Vector3(0, 0, 1), 0.3, 0.3, COL.keel);
    // 船舵：铰链松了一半，斜挂着
    const rudder = new THREE.Group();
    void rudder;
    const rc = new THREE.Vector3(XS - 0.55, 2.6, 0.25);
    const ax = new THREE.Vector3(-0.55, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.5);
    const ay = new THREE.Vector3(0, 2.1, 0).applyAxisAngle(new THREE.Vector3(1, 0, 0), 0.18);
    const az = new THREE.Vector3(0, 0, 0.08).applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.5);
    kb.box(rc, ax, ay, az, COL.plankDark);
    kb.box(rc.clone().add(new THREE.Vector3(0.0, 1.6, 0)), ax.clone().multiplyScalar(0.25), new THREE.Vector3(0, 0.08, 0), az.clone().multiplyScalar(1.6), COL.iron);
  }

  // ——— 腰板（两道粗的护舷材）和穿出船壳的横梁头：柯克船一眼认得出的地方 ———
  for (const side of [-1, 1]) {
    for (const vw of [0.6, 0.83]) {
      for (let i = 0; i < stations.length - 1; i++) {
        const xa = stations[i], xb = stations[i + 1];
        if (xa < XS + 0.5 || xb > XB - 0.6) continue;
        if (inBreach((xa + xb) / 2, vw, side, 0.05)) continue;
        const na = hullNormal(xa, vw, side), nb = hullNormal(xb, vw, side);
        const a = hullPt(xa, vw, side).addScaledVector(na, LAP + 0.07);
        const bb = hullPt(xb, vw, side).addScaledVector(nb, LAP + 0.07);
        B.hull.beam(a, bb, na, 0.2, 0.17, COL.wale);
      }
    }
    for (const xb of [-4.6, -2.2, 0.2, 2.6, 5.0]) {
      if (inBreach(xb, 0.72, side, 0.05)) continue;
      const n = hullNormal(xb, 0.72, side);
      const p0 = hullPt(xb, 0.72, side).addScaledVector(n, -0.1);
      const p1 = p0.clone().addScaledVector(n, 0.55);
      B.hull.beam(p0, p1, new THREE.Vector3(1, 0, 0), 0.26, 0.26, COL.wale);
    }
  }

  // ——— 肋骨 ———
  for (let x = -7.3; x <= 8.4; x += 0.62) {
    for (const side of [-1, 1]) {
      const pts = [];
      for (let i = 0; i <= 16; i++) {
        const v = i / 16;
        const n = hullNormal(x, Math.max(v, 0.02), side);
        pts.push({ v, p: hullPt(x, v, side).addScaledVector(n, -THICK - 0.1) });
      }
      // 破口里的肋骨断掉，只剩两头的残根
      let keep = pts.map((q) => !inBreach(x, q.v, side, -0.12));
      // 残根往洞里多伸一截，断口不齐
      let stub = Math.floor(rnd() * 2);
      for (let i = 1; i < keep.length; i++) if (!keep[i] && keep[i - 1] && stub-- > 0) keep[i] = true;
      for (let i = 0; i < pts.length - 1; i++) {
        if (!keep[i] || !keep[i + 1]) continue;
        B.rib.beam(pts[i].p, pts[i + 1].p, new THREE.Vector3(1, 0, 0), 0.15, 0.17, COL.rib.clone().multiplyScalar(0.9 + rnd() * 0.2));
      }
    }
    // 底部横肋
    const a = hullPt(x, 0.12, -1).add(new THREE.Vector3(0, 0.22, 0));
    const b = hullPt(x, 0.12, 1).add(new THREE.Vector3(0, 0.22, 0));
    B.rib.beam(a, b, new THREE.Vector3(1, 0, 0), 0.16, 0.2, COL.rib);
  }

  // ——— 主甲板（两道舱口，左舷中段有一块塌了）———
  const DX0 = -5.8, DX1 = 7.2;
  const deckCells = 34, deckStrips = 12;
  const inHatch = (x, z) => HATCHES.some((h) => Math.abs(x - h.x) < h.hx && Math.abs(z) < h.hz);
  const inDeckGap = (x, z) => x > GAP.x0 + vnoise(z * 2, 3, 5) * 0.45 && x < GAP.x1 - vnoise(z * 2, 4, 6) * 0.45;
  for (let s = 0; s < deckStrips; s++) {
    const shade = 0.88 + rnd() * 0.2;
    for (let c = 0; c < deckCells; c++) {
      const xa = DX0 + (DX1 - DX0) * (c / deckCells);
      const xb = DX0 + (DX1 - DX0) * ((c + 1) / deckCells);
      const wa = halfWidthAt(xa, deckY(xa)) - 0.12;
      const wb = halfWidthAt(xb, deckY(xb)) - 0.12;
      const fa0 = -1 + (2 * s) / deckStrips, fa1 = -1 + (2 * (s + 1)) / deckStrips;
      const zm = ((fa0 + fa1) / 2) * (wa + wb) / 2;
      const xm = (xa + xb) / 2;
      if (inHatch(xm, zm) || inDeckGap(xm, zm)) continue;
      const ya = deckY(xa), yb = deckY(xb);
      const p00 = new THREE.Vector3(xa, ya, fa0 * wa), p10 = new THREE.Vector3(xb, yb, fa0 * wb);
      const p11 = new THREE.Vector3(xb, yb, fa1 * wb - 0.02), p01 = new THREE.Vector3(xa, ya, fa1 * wa - 0.02);
      const col = COL.deck.clone().multiplyScalar(shade * (Math.floor(xa * 0.5 + s * 1.7) % 3 === 0 ? 0.92 : 1));
      const up = worldUp(new THREE.Vector3(0, 1, 0));
      if (up > 0.25) col.lerp(COL.algae, 0.25);
      B.deck.quad(p00, p01, p11, p10, col);
      const dn = new THREE.Vector3(0, -0.07, 0);
      B.deck.quad(p10.clone().add(dn), p11.clone().add(dn), p01.clone().add(dn), p00.clone().add(dn), COL.inner);
    }
  }
  // 舱口围板
  for (const h of HATCHES) {
    const y = deckY(h.x) + 0.15;
    const c = COL.plankDark;
    B.coaming.box(new THREE.Vector3(h.x - h.hx - 0.06, y, 0), new THREE.Vector3(0.06, 0, 0), new THREE.Vector3(0, 0.22, 0), new THREE.Vector3(0, 0, h.hz + 0.12), c);
    B.coaming.box(new THREE.Vector3(h.x + h.hx + 0.06, y, 0), new THREE.Vector3(0.06, 0, 0), new THREE.Vector3(0, 0.22, 0), new THREE.Vector3(0, 0, h.hz + 0.12), c);
    B.coaming.box(new THREE.Vector3(h.x, y, -h.hz - 0.06), new THREE.Vector3(h.hx, 0, 0), new THREE.Vector3(0, 0.22, 0), new THREE.Vector3(0, 0, 0.06), c);
    B.coaming.box(new THREE.Vector3(h.x, y, h.hz + 0.06), new THREE.Vector3(h.hx, 0, 0), new THREE.Vector3(0, 0.22, 0), new THREE.Vector3(0, 0, 0.06), c);
  }
  // 甲板梁
  for (let x = -5.4; x < 7; x += 1.25) {
    if (x > GAP.x0 - 0.3 && x < GAP.x1 + 0.3) continue; // 塌掉的那段，梁也断了
    const w = halfWidthAt(x, deckY(x)) - 0.1;
    B.rib.box(new THREE.Vector3(x, deckY(x) - 0.2, 0), new THREE.Vector3(0.1, 0, 0), new THREE.Vector3(0, 0.12, 0), new THREE.Vector3(0, 0, w), COL.rib);
  }
  // 舷边压条
  for (const side of [-1, 1]) {
    for (let i = 0; i < stations.length - 1; i++) {
      const xa = stations[i], xb = stations[i + 1];
      if (xa < XS + 0.4 || xb > XB - 0.3) continue;
      if (inBreach((xa + xb) / 2, 0.99, side, 0)) continue;
      const a = hullPt(xa, 1, side).add(new THREE.Vector3(0, 0.05, 0));
      const b = hullPt(xb, 1, side).add(new THREE.Vector3(0, 0.05, 0));
      B.hull.beam(a, b, new THREE.Vector3(0, 1, 0), 0.2, 0.12, COL.plankDark);
    }
  }

  // ——— 尾楼：有顶的船舱，前墙开门，左舷开窗 ———
  const AX0 = -9.6, AX1 = -5.8;
  const roofY = deckY(-7.5) + 2.35;
  {
    const cb = B.castle;
    // 舱底板
    for (let x = AX0; x < AX1 - 0.01; x += 0.5) {
      const w = halfWidthAt(x + 0.25, deckY(x + 0.25)) - 0.12;
      cb.box(new THREE.Vector3(x + 0.25, deckY(x + 0.25) - 0.03, 0), new THREE.Vector3(0.25, 0, 0), new THREE.Vector3(0, 0.04, 0), new THREE.Vector3(0, 0, w), COL.deck);
    }
    const wAt = (x) => Math.max(halfWidthAt(x, sheerY(x)), 0.6) - 0.05;
    // 两侧墙（舷墙往上加高），竖板拼成，左舷开窗
    for (const side of [-1, 1]) {
      for (let x = AX0; x < AX1 - 0.01; x += 0.42) {
        const xm = x + 0.21;
        const z = wAt(xm) * side;
        const y0 = sheerY(xm) - 0.1;
        const isWin = side < 0 && xm > -8.4 && xm < -6.8;
        const paint = Math.floor((xm - AX0) / 0.84) % 2 === 0 ? COL.paintRed : COL.paintOchre;
        const col = paint.clone().lerp(COL.plank, 0.62).multiplyScalar(0.85 + rnd() * 0.2);
        if (isWin) {
          cb.box(new THREE.Vector3(xm, (y0 + 4.9 + 0.2) / 2 + 0.1, z), new THREE.Vector3(0.2, 0, 0), new THREE.Vector3(0, (5.0 - y0) / 2 + 0.05, 0), new THREE.Vector3(0, 0, 0.06), col);
          cb.box(new THREE.Vector3(xm, (5.85 + roofY) / 2, z), new THREE.Vector3(0.2, 0, 0), new THREE.Vector3(0, (roofY - 5.85) / 2, 0), new THREE.Vector3(0, 0, 0.06), col);
        } else {
          cb.box(new THREE.Vector3(xm, (y0 + roofY) / 2, z), new THREE.Vector3(0.2, 0, 0), new THREE.Vector3(0, (roofY - y0) / 2, 0), new THREE.Vector3(0, 0, 0.06), col);
        }
      }
      // 窗框
      if (side < 0) {
        const z = wAt(-7.6) * side - 0.04;
        cb.box(new THREE.Vector3(-7.6, 5.0, z), new THREE.Vector3(0.85, 0, 0), new THREE.Vector3(0, 0.06, 0), new THREE.Vector3(0, 0, 0.1), COL.plankDark);
        cb.box(new THREE.Vector3(-7.6, 5.86, z), new THREE.Vector3(0.85, 0, 0), new THREE.Vector3(0, 0.06, 0), new THREE.Vector3(0, 0, 0.1), COL.plankDark);
      }
    }
    // 后墙（尾封板）
    {
      const w = wAt(AX0 + 0.1);
      cb.box(new THREE.Vector3(AX0, (sheerY(AX0) + roofY) / 2 - 0.4, 0), new THREE.Vector3(0.07, 0, 0), new THREE.Vector3(0, (roofY - sheerY(AX0)) / 2 + 0.5, 0), new THREE.Vector3(0, 0, w), COL.paintRed.clone().lerp(COL.plank, 0.5));
    }
    // 前墙：开门
    {
      const x = AX1;
      const w = wAt(x);
      const y0 = deckY(x);
      const doorW = 0.6, doorH = 1.75;
      const col = COL.paintOchre.clone().lerp(COL.plank, 0.5);
      // 门两侧
      const segW = (w - doorW) / 2;
      for (const s of [-1, 1]) {
        cb.box(new THREE.Vector3(x, (y0 + roofY) / 2, s * (doorW + segW)), new THREE.Vector3(0.07, 0, 0), new THREE.Vector3(0, (roofY - y0) / 2, 0), new THREE.Vector3(0, 0, segW), col);
      }
      cb.box(new THREE.Vector3(x, (y0 + doorH + roofY) / 2, 0), new THREE.Vector3(0.07, 0, 0), new THREE.Vector3(0, (roofY - y0 - doorH) / 2, 0), new THREE.Vector3(0, 0, doorW), col);
    }
    // 顶（尾楼甲板）
    for (let s = -5; s <= 5; s++) {
      const z = s * 0.36;
      const shade = 0.85 + rnd() * 0.2;
      cb.box(new THREE.Vector3((AX0 + AX1) / 2 - 0.1, roofY + 0.05, z), new THREE.Vector3((AX1 - AX0) / 2 + 0.3, 0, 0), new THREE.Vector3(0, 0.06, 0), new THREE.Vector3(0, 0, 0.17), COL.deck.clone().multiplyScalar(shade));
    }
    // 顶上一圈雉堞式护墙（城垛一样一齿一齿），前面断了一截
    const corners = [[AX0 - 0.15, -wAt(AX0 + 0.3) - 0.05], [AX1 + 0.25, -wAt(AX1) - 0.05], [AX1 + 0.25, wAt(AX1) + 0.05], [AX0 - 0.15, wAt(AX0 + 0.3) + 0.05]];
    crenellate(cb, corners, roofY + 0.08, 0.72, [1], rnd);
    // 尾楼里看得见、捞不到的货：一只木箱和一个铜烛台
    cb.box(new THREE.Vector3(-7.5, deckY(-7.5) + 0.35, -0.7), new THREE.Vector3(0.4, 0, 0), new THREE.Vector3(0, 0.33, 0), new THREE.Vector3(0, 0, 0.32), COL.plank);
    cb.box(new THREE.Vector3(-7.5, deckY(-7.5) + 0.35, -0.7), new THREE.Vector3(0.42, 0, 0), new THREE.Vector3(0, 0.05, 0), new THREE.Vector3(0, 0, 0.34), COL.iron);
    cb.cylinder(new THREE.Vector3(-6.9, deckY(-6.9), -1.1), new THREE.Vector3(-6.9, deckY(-6.9) + 0.6, -1.1), 0.06, 0.04, 6, new THREE.Color(0.8, 0.6, 0.3));
  }

  // ——— 首楼：抬高的平台和栏杆 ———
  const FX0 = 7.0, FX1 = 10.9;
  const fcY = sheerY(FX0) + 1.15;
  {
    const cb = B.castle;
    const wAt = (x) => Math.max(halfWidthAt(Math.min(x, XB - 0.3), Math.min(sheerY(x), fcY)) * 1.02, 0.25);
    for (let s = 0; s < 8; s++) {
      for (let x = FX0; x < FX1 - 0.01; x += 0.4) {
        const xm = x + 0.2;
        const w = wAt(xm) + 0.15;
        const f0 = -1 + (2 * s) / 8, f1 = -1 + (2 * (s + 1)) / 8;
        const p00 = new THREE.Vector3(x, fcY, f0 * w), p10 = new THREE.Vector3(x + 0.4, fcY, f0 * (wAt(x + 0.4) + 0.15));
        const p11 = new THREE.Vector3(x + 0.4, fcY, f1 * (wAt(x + 0.4) + 0.15)), p01 = new THREE.Vector3(x, fcY, f1 * w);
        const col = COL.deck.clone().multiplyScalar(0.85 + ((s * 7 + Math.floor(x * 3)) % 5) * 0.04);
        cb.quad(p00, p01, p11, p10, col);
        const dn = new THREE.Vector3(0, -0.08, 0);
        cb.quad(p10.clone().add(dn), p11.clone().add(dn), p01.clone().add(dn), p00.clone().add(dn), COL.inner);
      }
    }
    // 侧墙：从舷边到平台
    for (const side of [-1, 1]) {
      for (let x = FX0; x < FX1 - 0.3; x += 0.4) {
        const xm = x + 0.2;
        const z = (wAt(xm) + 0.1) * side;
        const y0 = sheerY(xm) - 0.2;
        const paint = Math.floor((xm - FX0) / 0.8) % 2 === 0 ? COL.paintRed : COL.paintOchre;
        cb.box(new THREE.Vector3(xm, (y0 + fcY) / 2, z), new THREE.Vector3(0.2, 0, 0), new THREE.Vector3(0, (fcY - y0) / 2, 0), new THREE.Vector3(0, 0, 0.06), paint.clone().lerp(COL.plank, 0.5));
      }
    }
    // 首楼护墙：同样一齿一齿
    {
      const pts = [];
      for (let x = FX0 + 0.05; x <= FX1 - 0.15; x += 0.6) pts.push([x, -(wAt(x) + 0.1)]);
      pts.push([FX1 + 0.05, 0]);
      for (let x = FX1 - 0.15; x >= FX0 + 0.05; x -= 0.6) pts.push([x, wAt(x) + 0.1]);
      crenellate(cb, pts, fcY, 0.62, [], rnd, false);
    }
    // 前桅残桩 + 船首斜桅
    B.mast.cylinder(new THREE.Vector3(8.6, fcY - 0.1, 0), new THREE.Vector3(8.6, fcY + 1.1, 0), 0.17, 0.15, 7, COL.plankDark, true, (i) => (i % 3 === 0 ? 0.25 : -0.1));
    B.mast.cylinder(new THREE.Vector3(10.6, fcY - 0.3, 0), new THREE.Vector3(12.4, fcY + 0.5, 0), 0.14, 0.11, 6, COL.plankDark, true, (i) => (i % 2 ? 0.2 : -0.1));
  }

  // ——— 主桅残桩：断口参差 ———
  B.mast.cylinder(new THREE.Vector3(0.5, 0.25, 0), new THREE.Vector3(0.5, deckY(0.5) + 2.3, 0), 0.32, 0.29, 9, new THREE.Color(0.5, 0.4, 0.3), true, (i) => [0.5, -0.2, 0.15, 0.7, -0.1, 0.3, -0.25, 0.1, 0.4][i]);
  // 桅底的铁箍
  B.mast.cylinder(new THREE.Vector3(0.5, deckY(0.5) + 0.3, 0), new THREE.Vector3(0.5, deckY(0.5) + 0.45, 0), 0.35, 0.35, 9, COL.iron, false);

  // ——— 舱里的淤泥面（世界里水平）———
  const floorInfo = buildFloor(B.floor, ship);
  // ——— 舱里的货：塌掉的甲板边下压着桶和箱，舱底散着压舱石、碎板、陶罐 ———
  buildHoldCargo(B.cargo, B.floor, floorInfo, ship, rnd);

  // ——— 组装网格 ———
  // 泡了几百年的木头：朝上的面长一层斑驳的藻、零星藤壶
  const woodMat = toon({ vertexColors: true, side: THREE.DoubleSide, moss: { color: 0x56683a, amount: 0.9 } });
  const meshes = {};
  const tags = { hull: TAG.HULL, rib: TAG.RIB, deck: TAG.DECK, coaming: TAG.COAMING, castle: TAG.CASTLE, mast: TAG.MAST, floor: TAG.FLOOR, cargo: TAG.CARGO };
  for (const key of Object.keys(B)) {
    if (B[key].empty) continue;
    const mesh = new THREE.Mesh(B[key].build(), key === 'floor' ? toon({ vertexColors: true, seabed: false }) : woodMat);
    mesh.castShadow = true;
    mesh.name = 'wreck-' + key;
    mesh.userData.tag = tags[key];
    ship.add(mesh);
    meshes[key] = mesh;
  }

  // ——— 放到坡上：让最低的船底埋进沙里 0.7 米 ———
  group.position.set(WRECK.x, 0, WRECK.z);
  group.updateMatrixWorld(true);
  let worst = Infinity;
  {
    const m = meshes.hull;
    const p = m.geometry.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i += 7) {
      v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld);
      const gap = v.y - seabedY(v.x, v.z);
      if (gap < worst) worst = gap;
    }
  }
  group.position.y = -worst - 0.75;
  group.updateMatrixWorld(true);

  return { group, ship, meshes, floorInfo, rnd };
}

// 沿折线立一圈护墙：每段分成一齿一齿，齿和缺口交替，上面压一道深色压顶
function crenellate(b, pts, y0, h, brokenSegs, rnd, closed = true) {
  const n = closed ? pts.length : pts.length - 1;
  let k = 0;
  for (let i = 0; i < n; i++) {
    const [x0, z0] = pts[i], [x1, z1] = pts[(i + 1) % pts.length];
    const len = Math.hypot(x1 - x0, z1 - z0);
    const steps = Math.max(1, Math.round(len / 0.42));
    for (let j = 0; j < steps; j++) {
      const t0 = j / steps, t1 = (j + 1) / steps;
      if (brokenSegs.includes(i) && t0 > 0.45) continue;
      const xa = x0 + (x1 - x0) * t0, za = z0 + (z1 - z0) * t0;
      const xb = x0 + (x1 - x0) * t1, zb = z0 + (z1 - z0) * t1;
      const merlon = (k++ % 2) === 0;
      const hh = merlon ? h : h * 0.55;
      const paint = (Math.floor(k / 2) % 2 === 0 ? COL.paintRed : COL.paintOchre).clone().lerp(COL.plank, 0.58).multiplyScalar(0.85 + rnd() * 0.2);
      const c = new THREE.Vector3((xa + xb) / 2, y0 + hh / 2, (za + zb) / 2);
      const ax = new THREE.Vector3((xb - xa) / 2, 0, (zb - za) / 2);
      const az = new THREE.Vector3(-(zb - za), 0, xb - xa).normalize().multiplyScalar(0.07);
      b.box(c, ax, new THREE.Vector3(0, hh / 2, 0), az, paint);
      b.box(new THREE.Vector3(c.x, y0 + hh + 0.04, c.z), ax.clone().multiplyScalar(1.02), new THREE.Vector3(0, 0.05, 0), az.clone().multiplyScalar(1.6), COL.wale);
    }
  }
}

// 舱里淤泥：沿每个肋位，用“水平面”切船舱截面，得到一条泥面弦
function buildFloor(b, ship) {
  const heel = WRECK.heel;
  const cosH = Math.cos(heel), sinH = Math.sin(heel);
  // 局部 (y,z) 在世界里的高度（忽略纵倾）：y cos − z sin
  const level = -0.15; // 泥面高度（相对龙骨，世界竖直方向）
  const chords = [];
  for (let x = -6.6; x <= 6.9; x += 0.5) {
    // 船舱截面：左舷甲板边 → 龙骨 → 右舷甲板边 → 沿甲板回来
    const poly = [];
    const dY = deckY(x);
    let vTop = 0;
    for (let i = 0; i <= 40; i++) { const v = i / 40; if (hullPt(x, v, 1).y <= dY) vTop = v; }
    for (let i = 24; i >= 0; i--) poly.push(hullPt(x, (vTop * i) / 24, -1).clone());
    for (let i = 1; i <= 24; i++) poly.push(hullPt(x, (vTop * i) / 24, 1).clone());
    const f = (p) => p.y * cosH - p.z * sinH - level;
    const hits = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], c = poly[(i + 1) % poly.length];
      const fa = f(a), fc = f(c);
      if ((fa < 0) !== (fc < 0)) {
        const t = fa / (fa - fc);
        hits.push(a.clone().lerp(c, t));
      }
    }
    if (hits.length >= 2) {
      hits.sort((p, q) => p.z - q.z);
      chords.push({ x, a: hits[0], b: hits[hits.length - 1] });
    }
  }
  const N = 8;
  for (let i = 0; i < chords.length - 1; i++) {
    const c0 = chords[i], c1 = chords[i + 1];
    for (let k = 0; k < N; k++) {
      const t0 = k / N, t1 = (k + 1) / N;
      const bump = (x, t) => (Math.sin(x * 2.1 + t * 7) * 0.5 + 0.5) * 0.12 * Math.sin(t * Math.PI);
      const P = (c, t) => {
        const p = c.a.clone().lerp(c.b, t);
        // 泥面向上（世界上方）鼓一点
        p.y += bump(c.x, t) * cosH;
        p.z -= bump(c.x, t) * sinH;
        return p;
      };
      const a = P(c0, t0), bb = P(c1, t0), cc = P(c1, t1), d = P(c0, t1);
      // 舱底背光：中间稍亮，贴着船壳的地方更暗
      const wall = Math.sin(((t0 + t1) / 2) * Math.PI);
      const col = COL.holdMud.clone().multiplyScalar((0.85 + ((i * 3 + k * 5) % 7) * 0.035) * (0.62 + wall * 0.38));
      b.quad(a, d, cc, bb, col);
    }
  }
  return { chords, level };
}

// 舱里的货。高的（桶、箱）只放在残留甲板的边下面，本来就下不了网；
// 舱底的低矮碎物（压舱石、碎板、碎陶罐）放进淤泥面里，网可以压着它们落下去。
function buildHoldCargo(tall, low, fi, ship, rnd) {
  const inv = ship.quaternion.clone().invert();
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(inv); // 船体局部里的“世界上方”
  const along = new THREE.Vector3(1, 0, 0).addScaledVector(up, -up.x).normalize();
  const across = up.clone().cross(along).normalize();
  const at = (x, t, lift = 0) => floorPoint(fi, x, t).addScaledVector(up, lift);
  const dirOf = (ang) => along.clone().multiplyScalar(Math.cos(ang)).addScaledVector(across, Math.sin(ang));
  const jit = (c, a) => c.clone().multiplyScalar(1 - a + rnd() * a * 2);
  // 躺倒的木桶：中间鼓、两头收，四道铁箍
  const cask = (b, x, t, ang, len = 0.82, r = 0.3, sink = 0.08) => {
    const d = dirOf(ang);
    const c = at(x, t, r - sink);
    const col = jit(COL.cask, 0.1);
    const e0 = c.clone().addScaledVector(d, -len / 2), e1 = c.clone().addScaledVector(d, len / 2);
    b.cylinder(c, e0, r, r * 0.84, 9, col, true);
    b.cylinder(c, e1, r, r * 0.84, 9, col, true);
    for (const f of [-0.36, -0.14, 0.14, 0.36]) {
      const h0 = c.clone().addScaledVector(d, f * len - 0.03), h1 = c.clone().addScaledVector(d, f * len + 0.03);
      const rr = r * (1 - Math.abs(f) * 0.42) + 0.012;
      b.cylinder(h0, h1, rr, rr, 9, COL.iron, false);
    }
  };
  // 散了架的板条箱：箱体 + 掉下来的几块板
  const crate = (b, x, t, ang, s = 0.32) => {
    const d = dirOf(ang), sd = up.clone().cross(d).normalize();
    const c = at(x, t, s * 0.8);
    const col = jit(COL.plank, 0.08);
    b.box(c, d.clone().multiplyScalar(s * 1.2), up.clone().multiplyScalar(s * 0.9), sd.clone().multiplyScalar(s), col);
    for (let k = -1; k <= 1; k++) {
      const p = c.clone().addScaledVector(up, s * 0.9 + 0.015).addScaledVector(sd, k * s * 0.62);
      b.beam(p.clone().addScaledVector(d, -s * 1.15), p.clone().addScaledVector(d, s * 1.15), up, s * 0.5, 0.03, col.clone().multiplyScalar(k ? 0.8 : 1.12));
    }
  };
  // 压舱石：一小堆歪歪扭扭的石块
  const stones = (x, t, n, spread = 0.5) => {
    for (let i = 0; i < n; i++) {
      const p = at(x + (rnd() - 0.5) * spread * 2, clamp(t + (rnd() - 0.5) * spread * 0.5, 0.02, 0.98), 0);
      const sz = 0.08 + rnd() * 0.1;
      const a = dirOf(rnd() * 6.3).multiplyScalar(sz * (1 + rnd() * 0.5));
      const u = up.clone().multiplyScalar(sz * (0.55 + rnd() * 0.35));
      const w = up.clone().cross(a).normalize().multiplyScalar(sz * (0.8 + rnd() * 0.4));
      low.box(p.addScaledVector(up, u.length() * 0.45), a, u, w, jit(COL.stone, 0.12));
    }
  };
  // 碎板：平躺在泥上
  const plank = (x, t, ang, len) => {
    const d = dirOf(ang);
    const c = at(x, t, 0.03);
    low.beam(c.clone().addScaledVector(d, -len / 2), c.clone().addScaledVector(d, len / 2), up, 0.17, 0.045, jit(COL.deck, 0.12));
  };
  // 碎陶罐：半截罐身 + 几片
  const jar = (x, t, ang) => {
    const d = dirOf(ang);
    const c = at(x, t, 0.13);
    low.cylinder(c.clone().addScaledVector(d, -0.18), c.clone().addScaledVector(d, 0.12), 0.1, 0.16, 8, COL.clay, false, (i) => (i % 3 === 0 ? -0.06 : 0.02));
    for (let i = 0; i < 4; i++) {
      const p = at(x + (rnd() - 0.5) * 0.7, clamp(t + (rnd() - 0.5) * 0.18, 0.02, 0.98), 0.02);
      const a = dirOf(rnd() * 6.3).multiplyScalar(0.07);
      low.box(p, a, up.clone().multiplyScalar(0.015), up.clone().cross(a).normalize().multiplyScalar(0.05), COL.clay.clone().multiplyScalar(0.9));
    }
  };

  // 船尾一侧，残甲板边下面
  cask(tall, 0.45, 0.8, 0.25);
  cask(tall, 0.3, 0.3, 1.35, 0.78, 0.29);
  crate(tall, 0.62, 0.55, 0.15);
  // 船头一侧
  cask(tall, 4.9, 0.25, -0.35);
  crate(tall, 4.85, 0.72, 0.5, 0.3);
  cask(tall, 5.15, 0.5, 1.2, 0.76, 0.27);
  // 舱底：低矮的碎物
  stones(1.35, 0.12, 6, 0.35);
  stones(2.2, 0.9, 5, 0.4);
  stones(3.55, 0.1, 6, 0.4);
  stones(4.05, 0.88, 4, 0.3);
  plank(2.15, 0.2, 0.35, 1.2);
  plank(3.75, 0.55, 1.75, 0.95);
  plank(1.4, 0.72, -0.5, 0.8);
  jar(3.6, 0.32, 2.2);
}

// 在淤泥面上找一点（局部坐标 x，沿弦 t∈0..1），返回局部坐标
export function floorPoint(floorInfo, x, t) {
  const ch = floorInfo.chords;
  let i = 0;
  while (i < ch.length - 2 && ch[i + 1].x < x) i++;
  const c0 = ch[i], c1 = ch[i + 1];
  const u = clamp((x - c0.x) / (c1.x - c0.x), 0, 1);
  const a = c0.a.clone().lerp(c1.a, u), b = c0.b.clone().lerp(c1.b, u);
  return a.lerp(b, t);
}

export function buildWreckCollider(wreck) {
  const tz = new TopZ(WRECK.x - 20, WRECK.z - 20, WRECK.x + 20, WRECK.z + 20, 0.12);
  // 先放淤泥面，再放结构；Z 缓冲自己取最高
  const order = ['floor', 'cargo', 'hull', 'rib', 'deck', 'coaming', 'castle', 'mast'];
  for (const k of order) if (wreck.meshes[k]) tz.addMesh(wreck.meshes[k], wreck.meshes[k].userData.tag);
  return tz;
}

export { HATCHES, BREACH, GAP, AX0, AX1, FX0, FX1 };
const AX0 = -9.6, AX1 = -5.8, FX0 = 7.0, FX1 = 10.9;

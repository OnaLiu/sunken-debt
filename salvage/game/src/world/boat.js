import * as THREE from 'three';
import { GeoBuilder } from '../util/builder.js';
import { toon } from '../render/materials.js';
import { smoothstep, clamp } from '../util/math.js';
import { NET_R, FUEL_MAX } from '../config.js';

// 打捞船：12 米的木壳工作船。局部 x 朝船头，y 朝上（0 = 吃水线），z 朝右舷。
export const BOAT = {
  deckY: 0.95,
  crane: new THREE.Vector3(0.6, 0, 0),
  pivotY: 2.3,
  wash: new THREE.Vector3(4.2, 0.95, 0),
  stowTip: new THREE.Vector3(4.2, 5.25, 0),
  hatch: { x: -1.6, z: 0, hx: 0.6, hz: 0.6 },
  tank: { x: -0.4, z: 1.45, hx: 0.45, hz: 0.3 },
  halfLen: 6.0,
};

export function halfB(x) {
  if (x <= 0.5) return 2.2 - 0.34 * Math.pow(clamp((-x - 2) / 4, 0, 1), 2);
  return 2.2 * Math.sqrt(Math.max(0, 1 - Math.pow((x - 0.5) / 5.75, 2.2)));
}
// 船舷压条顶面有多高（船局部 y）：网包从舷外吊进来要高过它
export function railY(x) {
  return sheer(clamp(x, -BOAT.halfLen, BOAT.halfLen)) + 0.13;
}
function sheer(x) {
  return 1.3 + 0.62 * Math.pow(smoothstep(1.0, 6.2, x), 1.5) + 0.12 * smoothstep(-3, -6, x);
}
function bottom(x) {
  return -1.0 + 1.45 * Math.pow(smoothstep(3.0, 6.25, x), 1.6) + 0.22 * smoothstep(-3.5, -6, x);
}
function hullP(x, v, side) {
  const th = v * Math.PI / 2;
  const z = halfB(x) * Math.pow(Math.sin(th), 0.65);
  const y = bottom(x) + (sheer(x) - bottom(x)) * Math.pow(1 - Math.cos(th), 1.15);
  return new THREE.Vector3(x, y, side * z);
}

const C = {
  bottom: new THREE.Color(0.5, 0.2, 0.15),
  boot: new THREE.Color(0.92, 0.9, 0.84),
  top: new THREE.Color(0.17, 0.36, 0.38),
  topLight: new THREE.Color(0.22, 0.44, 0.45),
  rail: new THREE.Color(0.48, 0.34, 0.22),
  bulwarkIn: new THREE.Color(0.82, 0.8, 0.74),
  deck: new THREE.Color(0.74, 0.61, 0.45),
  deckEdge: new THREE.Color(0.5, 0.36, 0.24),
  bulwarkRib: new THREE.Color(0.74, 0.72, 0.66),
  white: new THREE.Color(0.92, 0.9, 0.84),
  glass: new THREE.Color(0.2, 0.28, 0.34),
  glassHi: new THREE.Color(0.42, 0.55, 0.6),
  fender: new THREE.Color(0.16, 0.17, 0.19),
  roof: new THREE.Color(0.3, 0.33, 0.36),
  yellow: new THREE.Color(0.92, 0.7, 0.2),
  yellowDark: new THREE.Color(0.62, 0.45, 0.14),
  black: new THREE.Color(0.14, 0.14, 0.15),
  red: new THREE.Color(0.72, 0.2, 0.16),
  steel: new THREE.Color(0.45, 0.47, 0.5),
  rust: new THREE.Color(0.62, 0.3, 0.17),
  rope: new THREE.Color(0.74, 0.64, 0.45),
  water: new THREE.Color(0.32, 0.6, 0.62),
  wood: new THREE.Color(0.55, 0.4, 0.27),
};

export function buildBoat() {
  const root = new THREE.Group();
  root.name = 'boat';
  const body = new THREE.Group(); // 随浪起伏的部分
  root.add(body);
  const hb = new GeoBuilder();
  const db = new GeoBuilder();

  // ——— 船壳 ———
  const xs = [];
  for (let i = 0; i <= 32; i++) xs.push(-6.0 + 12.2 * (i / 32));
  const NV = 16;
  for (const side of [-1, 1]) {
    for (let i = 0; i < xs.length - 1; i++) {
      for (let j = 0; j < NV; j++) {
        const v0 = j / NV, v1 = (j + 1) / NV;
        const a = hullP(xs[i], v0, side), b = hullP(xs[i + 1], v0, side);
        const c = hullP(xs[i + 1], v1, side), d = hullP(xs[i], v1, side);
        const ym = (a.y + c.y) / 2;
        let col;
        if (ym < -0.04) col = C.bottom;
        else if (ym < 0.14) col = C.boot;
        else if (ym > sheer((xs[i] + xs[i + 1]) / 2) - 0.2) col = C.topLight;
        else col = C.top;
        if (side > 0) hb.quad(a, b, c, d, col); else hb.quad(d, c, b, a, col);
      }
    }
  }
  // 船尾封板
  {
    const x = -6.0;
    const pts = [];
    for (let j = 0; j <= NV; j++) pts.push(hullP(x, j / NV, 1));
    for (let j = 0; j < NV; j++) {
      const a = pts[j], b = pts[j + 1];
      const am = a.clone(); am.z = -am.z;
      const bm = b.clone(); bm.z = -bm.z;
      const ym = (a.y + b.y) / 2;
      const col = ym < -0.04 ? C.bottom : ym < 0.14 ? C.boot : C.top;
      hb.quad(am, a, b, bm, col);
    }
    // 船名牌位置的一道白边
    hb.box(new THREE.Vector3(-6.03, 0.85, 0), new THREE.Vector3(0.02, 0, 0), new THREE.Vector3(0, 0.12, 0), new THREE.Vector3(0, 0, 1.0), C.white);
  }
  // 舷墙内侧 + 压条
  for (const side of [-1, 1]) {
    for (let i = 0; i < xs.length - 1; i++) {
      const x0 = xs[i], x1 = xs[i + 1];
      const w0 = halfB(x0) - 0.12, w1 = halfB(x1) - 0.12;
      if (w0 < 0.05 && w1 < 0.05) continue;
      const a = new THREE.Vector3(x0, BOAT.deckY, side * w0), b = new THREE.Vector3(x1, BOAT.deckY, side * w1);
      const c = new THREE.Vector3(x1, sheer(x1), side * (halfB(x1) - 0.1)), d = new THREE.Vector3(x0, sheer(x0), side * (halfB(x0) - 0.1));
      if (side > 0) db.quad(d, c, b, a, C.bulwarkIn); else db.quad(a, b, c, d, C.bulwarkIn);
      const r0 = hullP(x0, 1, side).add(new THREE.Vector3(0, 0.04, -side * 0.05));
      const r1 = hullP(x1, 1, side).add(new THREE.Vector3(0, 0.04, -side * 0.05));
      db.beam(r0, r1, new THREE.Vector3(0, 1, 0), 0.2, 0.09, C.rail);
    }
  }
  // 甲板：一整片木板面，板缝、接头和钉眼在着色里画（船局部 x 顺着板走）
  const pk = new GeoBuilder();
  for (let i = 0; i < xs.length - 1; i++) {
    const x0 = xs[i], x1 = xs[i + 1];
    const w0 = halfB(x0) - 0.1, w1 = halfB(x1) - 0.1;
    const strips = 9;
    for (let s = 0; s < strips; s++) {
      const f0 = -1 + (2 * s) / strips, f1 = -1 + (2 * (s + 1)) / strips;
      const p00 = new THREE.Vector3(x0, BOAT.deckY, f0 * w0), p10 = new THREE.Vector3(x1, BOAT.deckY, f0 * w1);
      const p11 = new THREE.Vector3(x1, BOAT.deckY, f1 * w1), p01 = new THREE.Vector3(x0, BOAT.deckY, f1 * w0);
      // 舱口挖空
      const xm = (x0 + x1) / 2, zm = ((f0 + f1) / 2) * (w0 + w1) / 2;
      if (Math.abs(xm - BOAT.hatch.x) < BOAT.hatch.hx && Math.abs(zm - BOAT.hatch.z) < BOAT.hatch.hz) continue;
      pk.quad(p00, p01, p11, p10, C.deck);
    }
  }
  // 沿舷墙一圈压边板，颜色深一档，把甲板和舷墙分开
  for (const side of [-1, 1]) {
    for (let i = 0; i < xs.length - 1; i++) {
      const x0 = xs[i], x1 = xs[i + 1];
      const w0 = halfB(x0) - 0.1, w1 = halfB(x1) - 0.1;
      if (w0 < 0.08 && w1 < 0.08) continue;
      const a = new THREE.Vector3(x0, BOAT.deckY + 0.012, side * w0), b = new THREE.Vector3(x1, BOAT.deckY + 0.012, side * w1);
      const c = new THREE.Vector3(x1, BOAT.deckY + 0.012, side * Math.max(0, w1 - 0.2)), d = new THREE.Vector3(x0, BOAT.deckY + 0.012, side * Math.max(0, w0 - 0.2));
      if (side > 0) db.quad(a, b, c, d, C.deckEdge); else db.quad(d, c, b, a, C.deckEdge);
    }
  }
  // 舷墙内侧的肋柱和排水口：舷墙不再是一整片白
  for (const side of [-1, 1]) {
    for (let x = -4.6; x <= 4.8; x += 0.85) {
      const w = halfB(x) - 0.13;
      if (w < 0.3) continue;
      const top = sheer(x) - 0.05;
      const p0 = new THREE.Vector3(x, BOAT.deckY, side * (w - 0.02));
      const p1 = new THREE.Vector3(x, top, side * (halfB(x) - 0.13));
      db.beam(p0, p1, new THREE.Vector3(0, 0, side), 0.07, 0.05, C.bulwarkRib);
    }
    for (const x of [-3.9, -1.2, 1.4, 3.6]) {
      const w = halfB(x) - 0.115;
      db.box(new THREE.Vector3(x, BOAT.deckY + 0.07, side * w), new THREE.Vector3(0.16, 0, 0), new THREE.Vector3(0, 0.055, 0), new THREE.Vector3(0, 0, 0.012), C.black);
      // 排水口下面一道锈水印
      rustStreak(hb, x, side);
    }
  }

  // 舱口：围板、里面的黑、掀开的盖
  {
    const h = BOAT.hatch;
    const y = BOAT.deckY;
    const cc = C.wood;
    db.box(new THREE.Vector3(h.x, y + 0.17, h.z - h.hz - 0.05), new THREE.Vector3(h.hx + 0.1, 0, 0), new THREE.Vector3(0, 0.17, 0), new THREE.Vector3(0, 0, 0.05), cc);
    db.box(new THREE.Vector3(h.x, y + 0.17, h.z + h.hz + 0.05), new THREE.Vector3(h.hx + 0.1, 0, 0), new THREE.Vector3(0, 0.17, 0), new THREE.Vector3(0, 0, 0.05), cc);
    db.box(new THREE.Vector3(h.x - h.hx - 0.05, y + 0.17, h.z), new THREE.Vector3(0.05, 0, 0), new THREE.Vector3(0, 0.17, 0), new THREE.Vector3(0, 0, h.hz), cc);
    db.box(new THREE.Vector3(h.x + h.hx + 0.05, y + 0.17, h.z), new THREE.Vector3(0.05, 0, 0), new THREE.Vector3(0, 0.17, 0), new THREE.Vector3(0, 0, h.hz), cc);
    // 舱里：深色的底和两根梯子
    db.box(new THREE.Vector3(h.x, y - 0.9, h.z), new THREE.Vector3(h.hx, 0, 0), new THREE.Vector3(0, 0.02, 0), new THREE.Vector3(0, 0, h.hz), new THREE.Color(0.1, 0.09, 0.08));
    for (const s of [-1, 1]) db.box(new THREE.Vector3(h.x + s * (h.hx - 0.02), y - 0.45, h.z), new THREE.Vector3(0.02, 0, 0), new THREE.Vector3(0, 0.45, 0), new THREE.Vector3(0, 0, h.hz), new THREE.Color(0.16, 0.14, 0.12));
    // 前后两面舱壁：往舱口里看（C14 收工钻进舱口）是黑的，不透出船底下的海
    for (const s of [-1, 1]) db.box(new THREE.Vector3(h.x, y - 0.45, h.z + s * (h.hz - 0.02)), new THREE.Vector3(h.hx, 0, 0), new THREE.Vector3(0, 0.45, 0), new THREE.Vector3(0, 0, 0.02), new THREE.Color(0.08, 0.07, 0.06));
    // 掀开靠在后面的舱盖
    const lid = new THREE.Vector3(h.x - h.hx - 0.4, y + 0.55, h.z);
    db.box(lid, new THREE.Vector3(0.05, 0.02, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), -0.35), new THREE.Vector3(0, 0.62, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), -0.35), new THREE.Vector3(0, 0, h.hz + 0.1), C.wood.clone().multiplyScalar(0.85));
  }

  // 蟹的水槽
  {
    const t = BOAT.tank;
    const y = BOAT.deckY;
    const c = C.steel;
    db.box(new THREE.Vector3(t.x, y + 0.27, t.z - t.hz), new THREE.Vector3(t.hx, 0, 0), new THREE.Vector3(0, 0.27, 0), new THREE.Vector3(0, 0, 0.04), c);
    db.box(new THREE.Vector3(t.x, y + 0.27, t.z + t.hz), new THREE.Vector3(t.hx, 0, 0), new THREE.Vector3(0, 0.27, 0), new THREE.Vector3(0, 0, 0.04), c);
    db.box(new THREE.Vector3(t.x - t.hx, y + 0.27, t.z), new THREE.Vector3(0.04, 0, 0), new THREE.Vector3(0, 0.27, 0), new THREE.Vector3(0, 0, t.hz), c);
    db.box(new THREE.Vector3(t.x + t.hx, y + 0.27, t.z), new THREE.Vector3(0.04, 0, 0), new THREE.Vector3(0, 0.27, 0), new THREE.Vector3(0, 0, t.hz), c);
    db.box(new THREE.Vector3(t.x, y + 0.03, t.z), new THREE.Vector3(t.hx, 0, 0), new THREE.Vector3(0, 0.03, 0), new THREE.Vector3(0, 0, t.hz), new THREE.Color(0.2, 0.3, 0.32));
  }

  // 驾驶室
  {
    const x0 = -5.0, x1 = -2.5, hz = 1.35, y0 = BOAT.deckY, y1 = 3.1;
    const cx = (x0 + x1) / 2;
    // 下半截墙
    db.box(new THREE.Vector3(cx, (y0 + 2.0) / 2, 0), new THREE.Vector3((x1 - x0) / 2, 0, 0), new THREE.Vector3(0, (2.0 - y0) / 2, 0), new THREE.Vector3(0, 0, hz), C.white);
    // 窗带：窗框柱 + 玻璃
    db.box(new THREE.Vector3(cx, 2.55, 0), new THREE.Vector3((x1 - x0) / 2 - 0.02, 0, 0), new THREE.Vector3(0, 0.55, 0), new THREE.Vector3(0, 0, hz - 0.02), C.glass);
    const posts = [[x1, -hz], [x1, -0.45], [x1, 0.45], [x1, hz], [x0, -hz], [x0, hz], [cx, hz], [cx, -hz]];
    for (const [px, pz] of posts) db.box(new THREE.Vector3(px, 2.55, pz), new THREE.Vector3(0.06, 0, 0), new THREE.Vector3(0, 0.56, 0), new THREE.Vector3(0, 0, 0.06), C.white);
    // 屋顶
    db.box(new THREE.Vector3(cx - 0.05, y1 + 0.06, 0), new THREE.Vector3((x1 - x0) / 2 + 0.22, 0, 0), new THREE.Vector3(0, 0.07, 0), new THREE.Vector3(0, 0, hz + 0.15), C.roof);
    // 舱门（右舷侧）
    db.box(new THREE.Vector3(-3.3, 1.5, hz + 0.01), new THREE.Vector3(0.36, 0, 0), new THREE.Vector3(0, 0.55, 0), new THREE.Vector3(0, 0, 0.02), C.rail);
    db.box(new THREE.Vector3(-3.3, 1.52, hz + 0.02), new THREE.Vector3(0.4, 0, 0), new THREE.Vector3(0, 0.6, 0), new THREE.Vector3(0, 0, 0.012), C.white.clone().multiplyScalar(0.85));
    db.box(new THREE.Vector3(-3.3, 1.75, hz + 0.04), new THREE.Vector3(0.14, 0, 0), new THREE.Vector3(0, 0.14, 0), new THREE.Vector3(0, 0, 0.012), C.glass);
    db.box(new THREE.Vector3(-3.0, 1.45, hz + 0.05), new THREE.Vector3(0.035, 0, 0), new THREE.Vector3(0, 0.02, 0), new THREE.Vector3(0, 0, 0.025), C.yellow);
    // 窗台、窗上沿的一道船身色，前窗玻璃上两道斜的反光
    db.box(new THREE.Vector3(cx, 2.0, 0), new THREE.Vector3((x1 - x0) / 2 + 0.05, 0, 0), new THREE.Vector3(0, 0.035, 0), new THREE.Vector3(0, 0, hz + 0.05), C.white);
    db.box(new THREE.Vector3(cx, 3.02, 0), new THREE.Vector3((x1 - x0) / 2 + 0.03, 0, 0), new THREE.Vector3(0, 0.08, 0), new THREE.Vector3(0, 0, hz + 0.03), C.topLight);
    for (const [z0, z1] of [[-1.15, -0.65], [0.6, 1.1], [-0.3, 0.2]]) {
      const xf = x1 + 0.025;
      db.quad(new THREE.Vector3(xf, 2.1, z0), new THREE.Vector3(xf, 2.1, z0 + 0.14), new THREE.Vector3(xf, 2.9, z1 + 0.14), new THREE.Vector3(xf, 2.9, z1), C.glassHi);
    }
    for (const side of [-1, 1]) {
      for (const [xa, xb] of [[-4.75, -4.35], [-3.55, -3.15]]) {
        const zf = side * (hz + 0.025);
        const q = [new THREE.Vector3(xa, 2.1, zf), new THREE.Vector3(xa + 0.12, 2.1, zf), new THREE.Vector3(xb + 0.12, 2.9, zf), new THREE.Vector3(xb, 2.9, zf)];
        if (side > 0) db.quad(q[0], q[1], q[2], q[3], C.glassHi); else db.quad(q[3], q[2], q[1], q[0], C.glassHi);
      }
    }
    // 左舷墙上两个圆舷窗
    for (const x of [-4.5, -3.0]) {
      db.cylinder(new THREE.Vector3(x, 1.5, -hz), new THREE.Vector3(x, 1.5, -hz - 0.05), 0.16, 0.16, 10, C.steel, true);
      db.cylinder(new THREE.Vector3(x, 1.5, -hz - 0.02), new THREE.Vector3(x, 1.5, -hz - 0.065), 0.11, 0.11, 10, C.glass, true);
    }
    // 救生圈
    db.cylinder(new THREE.Vector3(-4.3, 1.55, -hz - 0.02), new THREE.Vector3(-4.3, 1.55, -hz - 0.08), 0.32, 0.32, 10, C.red, false);
    db.cylinder(new THREE.Vector3(-4.3, 1.55, -hz - 0.03), new THREE.Vector3(-4.3, 1.55, -hz - 0.09), 0.18, 0.18, 10, C.white, true);
    // 桅杆、灯、探照灯
    db.cylinder(new THREE.Vector3(-3.9, y1 + 0.1, 0), new THREE.Vector3(-3.9, 5.6, 0), 0.06, 0.05, 6, C.white);
    db.box(new THREE.Vector3(-3.9, 4.9, 0), new THREE.Vector3(0.04, 0, 0), new THREE.Vector3(0, 0.04, 0), new THREE.Vector3(0, 0, 0.6), C.white);
    db.box(new THREE.Vector3(-3.9, 5.28, 0), new THREE.Vector3(0.07, 0, 0), new THREE.Vector3(0, 0.035, 0), new THREE.Vector3(0, 0, 0.45), C.black);
    db.cylinder(new THREE.Vector3(-3.9, 5.18, 0), new THREE.Vector3(-3.9, 5.245, 0), 0.08, 0.08, 6, C.steel);
    db.box(new THREE.Vector3(-3.9, 5.62, 0), new THREE.Vector3(0.05, 0, 0), new THREE.Vector3(0, 0.05, 0), new THREE.Vector3(0, 0, 0.05), new THREE.Color(1.0, 0.85, 0.5));
    for (const z of [-0.55, 0.55]) db.box(new THREE.Vector3(-3.9, 4.98, z), new THREE.Vector3(0.05, 0, 0), new THREE.Vector3(0, 0.05, 0), new THREE.Vector3(0, 0, 0.04), z < 0 ? C.red : new THREE.Color(0.3, 0.7, 0.4));
    db.box(new THREE.Vector3(-2.9, y1 + 0.3, 0.8), new THREE.Vector3(0.2, 0, 0), new THREE.Vector3(0, 0.15, 0), new THREE.Vector3(0, 0, 0.15), C.black);
    // 顶上：一圈扶栏、救生筏筒、喇叭和天线
    {
      const ry = y1 + 0.13;
      const rx0 = x0 + 0.05, rx1 = x1 - 0.12, rz = hz;
      const corners = [[rx0, -rz], [rx1, -rz], [rx1, rz], [rx0, rz]];
      for (let k = 0; k < 4; k++) {
        const [ax, az] = corners[k], [bx, bz] = corners[(k + 1) % 4];
        db.beam(new THREE.Vector3(ax, ry + 0.38, az), new THREE.Vector3(bx, ry + 0.38, bz), new THREE.Vector3(0, 1, 0), 0.035, 0.035, C.white);
      }
      for (const [px, pz] of [...corners, [(rx0 + rx1) / 2, -rz], [(rx0 + rx1) / 2, rz]]) {
        db.beam(new THREE.Vector3(px, ry, pz), new THREE.Vector3(px, ry + 0.4, pz), new THREE.Vector3(1, 0, 0), 0.03, 0.03, C.white);
      }
      // 救生筏：白色筒子躺在两个架子上，两道红带
      const rfx = -3.2, rfz = -0.55;
      db.cylinder(new THREE.Vector3(rfx - 0.42, ry + 0.24, rfz), new THREE.Vector3(rfx + 0.42, ry + 0.24, rfz), 0.22, 0.22, 10, C.white, true);
      db.cylinder(new THREE.Vector3(rfx - 0.15, ry + 0.24, rfz), new THREE.Vector3(rfx - 0.1, ry + 0.24, rfz), 0.225, 0.225, 10, C.red, false);
      db.cylinder(new THREE.Vector3(rfx + 0.1, ry + 0.24, rfz), new THREE.Vector3(rfx + 0.15, ry + 0.24, rfz), 0.225, 0.225, 10, C.red, false);
      for (const dx of [-0.3, 0.3]) db.box(new THREE.Vector3(rfx + dx, ry + 0.05, rfz), new THREE.Vector3(0.03, 0, 0), new THREE.Vector3(0, 0.06, 0), new THREE.Vector3(0, 0, 0.2), C.steel);
      // 鞭状天线、喇叭
      db.cylinder(new THREE.Vector3(-2.75, ry, -1.1), new THREE.Vector3(-2.85, ry + 1.7, -1.1), 0.02, 0.012, 4, C.black);
      db.cylinder(new THREE.Vector3(-3.55, ry + 0.25, 0.75), new THREE.Vector3(-3.25, ry + 0.25, 0.75), 0.03, 0.08, 6, C.steel, true);
    }
    // 烟囱
    db.cylinder(new THREE.Vector3(-4.5, y1 + 0.1, -0.75), new THREE.Vector3(-4.55, 4.25, -0.75), 0.2, 0.2, 8, C.black);
    db.cylinder(new THREE.Vector3(-4.52, 3.7, -0.75), new THREE.Vector3(-4.53, 3.95, -0.75), 0.215, 0.215, 8, C.red, false);
  }
  // 船尾：缆绳卷（油在驾驶室顶上的两只油箱里，见 fuelTankShells）
  coil(db, new THREE.Vector3(-5.5, BOAT.deckY, 0), 0.38, C.rope);
  // 船头：系缆桩、锚机
  db.cylinder(new THREE.Vector3(5.6, BOAT.deckY, 0), new THREE.Vector3(5.6, BOAT.deckY + 0.35, 0), 0.08, 0.08, 6, C.black);
  db.box(new THREE.Vector3(5.6, BOAT.deckY + 0.35, 0), new THREE.Vector3(0.05, 0, 0), new THREE.Vector3(0, 0.04, 0), new THREE.Vector3(0, 0, 0.22), C.black);
  // 几只木箱
  db.box(new THREE.Vector3(-0.3, BOAT.deckY + 0.25, -1.45), new THREE.Vector3(0.3, 0, 0), new THREE.Vector3(0, 0.25, 0), new THREE.Vector3(0, 0, 0.28), C.wood);
  db.box(new THREE.Vector3(-0.95, BOAT.deckY + 0.2, -1.5), new THREE.Vector3(0.25, 0, 0), new THREE.Vector3(0, 0.2, 0), new THREE.Vector3(0, 0, 0.24), C.wood.clone().multiplyScalar(0.85));
  // 舷外挂着的护舷：旧轮胎色的圆筒，一根绳拴在舷边
  for (const side of [-1, 1]) {
    for (const x of [-1.9, 0.7, 3.1]) {
      const top = hullP(x, 1, side);
      const at = hullP(x, 0.72, side);
      const zo = side * (Math.abs(at.z) + 0.14);
      db.beam(new THREE.Vector3(x, top.y + 0.05, top.z), new THREE.Vector3(x, at.y + 0.22, zo), new THREE.Vector3(1, 0, 0), 0.025, 0.025, C.rope);
      db.cylinder(new THREE.Vector3(x, at.y - 0.2, zo), new THREE.Vector3(x, at.y + 0.22, zo), 0.13, 0.13, 8, C.fender, true);
      db.cylinder(new THREE.Vector3(x, at.y - 0.26, zo), new THREE.Vector3(x, at.y - 0.2, zo), 0.08, 0.13, 8, C.fender, false);
    }
  }
  // 木箱的箍条
  for (const [bx, by, bz, hx, hy, hz2] of [[-0.3, 0.25, -1.45, 0.3, 0.25, 0.28], [-0.95, 0.2, -1.5, 0.25, 0.2, 0.24]]) {
    for (const dx of [-hx * 0.6, hx * 0.6]) db.box(new THREE.Vector3(bx + dx, BOAT.deckY + by, bz), new THREE.Vector3(0.025, 0, 0), new THREE.Vector3(0, hy + 0.006, 0), new THREE.Vector3(0, 0, hz2 + 0.006), C.wood.clone().multiplyScalar(0.62));
  }
  fuelTankShells(db);
  // 船头灯柱
  for (const z of [-1.55, 1.55]) {
    db.cylinder(new THREE.Vector3(2.4, BOAT.deckY, z), new THREE.Vector3(2.4, BOAT.deckY + 1.6, z), 0.04, 0.04, 5, C.black);
    db.box(new THREE.Vector3(2.4, BOAT.deckY + 1.7, z), new THREE.Vector3(0.1, 0, 0), new THREE.Vector3(0, 0.12, 0), new THREE.Vector3(0, 0, 0.1), new THREE.Color(1.0, 0.85, 0.5));
  }

  const mat = toon({ vertexColors: true, spec: 0.0 });
  const hull = new THREE.Mesh(hb.build(), mat);
  const deck = new THREE.Mesh(db.build(), toon({ vertexColors: true, side: THREE.DoubleSide }));
  const planks = new THREE.Mesh(pk.build(), toon({ vertexColors: true, wood: { w: 0.24, len: 2.9, seam: 0.85, grain: 1 } }));
  hull.castShadow = deck.castShadow = true;
  planks.receiveShadow = true;
  body.add(hull, deck, planks);
  const fuel = buildFuelTanks();
  body.add(fuel.group);
  // 水槽里的水：半透明，放进去的蟹在水下看得见
  {
    const t = BOAT.tank;
    const w = new THREE.Mesh(new THREE.PlaneGeometry((t.hx - 0.03) * 2, (t.hz - 0.03) * 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.45, 0.78, 0.82), transparent: true, opacity: 0.3, depthWrite: false }));
    w.rotation.x = -Math.PI / 2;
    w.position.set(t.x, BOAT.deckY + 0.43, t.z);
    w.renderOrder = 3;
    w.name = 'tankWater';
    body.add(w);
  }

  // ——— 吊机 ———
  const crane = buildCrane();
  crane.root.position.set(BOAT.crane.x, BOAT.deckY, BOAT.crane.z);
  body.add(crane.root);

  // ——— 网架 ———
  const net = buildNetFrame();
  root.add(net.root); // 网架挂在世界里（由吊臂位置驱动），不跟着船身摇
  // 吊着网架的钢缆：从臂头滑轮垂到网架吊钩，网架晃、往下放都跟着拉直
  const hoist = buildHoist();
  root.add(hoist.mesh);

  return { root, body, crane, net, hoist, hull, deck, fuel };
}

function buildHoist() {
  const geo = new THREE.CylinderGeometry(0.035, 0.035, 1, 5, 1, true).translate(0, 0.5, 0);
  const mesh = new THREE.Mesh(geo, toon({ color: 0x2c3034, spec: 0.4, shin: 30 }));
  mesh.name = 'hoist';
  mesh.castShadow = true;
  mesh.frustumCulled = false;
  mesh.visible = false; // 网架挂上以后（第一次 set）才出现：效果页单摆的船上没有它
  const up = new THREE.Vector3(0, 1, 0), d = new THREE.Vector3();
  return {
    mesh,
    // a、b：船（root）局部里的两头（吊钩、臂头）
    set(a, b) {
      d.subVectors(b, a);
      const len = d.length();
      mesh.visible = len > 0.02;
      if (!mesh.visible) return;
      mesh.position.copy(a);
      mesh.quaternion.setFromUnitVectors(up, d.divideScalar(len));
      mesh.scale.set(1, len, 1);
    },
  };
}

// ——— 油箱（W01 油位）———
// 驾驶室顶上两只半透明的白塑料油箱，开船、下网时一抬眼就看得见：透过箱壁看得见柴油的油面。
// 后面那只先用，用空了再用前面那只（各装一半油）；花了油，油面缓缓降下去。
// 油的颜色跟右上油位管同一套档位：还够 4 网以上琥珀色，3 网发黄，2 网橙，1 网红、一闪一闪。
// 船尾往前看（开船的默认镜头）两只左右并排、不互相挡
const TANKS = [{ x: -4.5, z: 0.4 }, { x: -4.36, z: 0.99 }];
const TANK_R = 0.27, TANK_H = 0.82, TANK_Y = 3.23; // 立在驾驶室顶上（顶面 y = 3.1 + 0.13）
const FILL_Y = 0.03, FILL_H = TANK_H - 0.07;
const FUEL_COL = [
  ['#e9a940', '#fff0b8'],
  ['#f2d23a', '#fff8c8'],
  ['#ff8a36', '#ffe0b0'],
  ['#f0563c', '#ffd0b8'],
  ['#7a2418', '#a8442e'], // 剩 1 网时一闪一闪的暗的那一下
].map(([a, b]) => [new THREE.Color(a), new THREE.Color(b)]);

function fuelTankShells(db) {
  const shell = new THREE.Color(0.88, 0.88, 0.82);
  for (const t of TANKS) {
    const V = (dy, dx = 0, dz = 0) => new THREE.Vector3(t.x + dx, TANK_Y + dy, t.z + dz);
    db.cylinder(V(0), V(TANK_H), TANK_R, TANK_R, 10, shell, false);
    // 收口的肩和红盖子
    db.cylinder(V(TANK_H), V(TANK_H + 0.06), TANK_R, TANK_R * 0.72, 10, shell);
    db.cylinder(V(TANK_H + 0.05, 0.05, -0.04), V(TANK_H + 0.12, 0.05, -0.04), 0.06, 0.06, 6, C.red);
    // 底下的垫木
    db.box(V(0.03), new THREE.Vector3(TANK_R + 0.04, 0, 0), new THREE.Vector3(0, 0.03, 0), new THREE.Vector3(0, 0, 0.05), C.wood);
  }
}

function buildFuelTanks() {
  const group = new THREE.Group();
  group.name = 'fuelTanks';
  // 油：比箱壁略大一圈的筒，盖在箱壁外面看上去就是隔着白塑料透出来的油；顶上一道亮边是油面
  const fillGeo = new THREE.CylinderGeometry(TANK_R + 0.007, TANK_R + 0.007, 1, 10, 1, true).translate(0, 0.5, 0);
  const lineGeo = new THREE.CylinderGeometry(TANK_R + 0.011, TANK_R + 0.011, 0.055, 10, 1, true);
  const fillMat = toon({ color: 0xffffff, spec: 0.3, shin: 20 });
  const lineMat = toon({ color: 0xffffff });
  const tanks = TANKS.map((t) => {
    const fill = new THREE.Mesh(fillGeo, fillMat);
    const line = new THREE.Mesh(lineGeo, lineMat);
    fill.position.set(t.x, TANK_Y + FILL_Y, t.z);
    fill.scale.y = FILL_H;
    line.position.set(t.x, TANK_Y + FILL_Y + FILL_H, t.z);
    group.add(fill, line);
    return { fill, line };
  });
  let shown = -1, tier = -1;
  const setTier = (k) => {
    if (k === tier) return;
    tier = k;
    const [a, b] = FUEL_COL[k];
    fillMat.uniforms.uColor.value.copy(a);
    fillMat.uniforms.uEmissive.value.copy(a).multiplyScalar(0.55);
    lineMat.uniforms.uColor.value.copy(b);
    lineMat.uniforms.uEmissive.value.copy(b).multiplyScalar(0.7);
  };
  setTier(0);
  return {
    group,
    update(dt, fuel, netsLeft, time) {
      // 新的一趟（油加满了）直接满；花了油时油面追过去，一网的油大约一秒多降完
      if (shown < 0 || fuel > shown + 0.5) shown = fuel;
      else shown += (fuel - shown) * Math.min(1, dt * 2.2);
      const half = FUEL_MAX / 2;
      const lv = [clamp((shown - half) / half, 0, 1), clamp(shown / half, 0, 1)];
      tanks.forEach((t, i) => {
        const hgt = lv[i] * FILL_H;
        t.fill.visible = hgt > 0.004;
        t.fill.scale.y = Math.max(hgt, 0.001);
        t.line.visible = lv[i] > 0.002;
        t.line.position.y = TANK_Y + FILL_Y + Math.max(hgt - 0.0275, 0.0275);
      });
      const k = netsLeft >= 4 ? 0 : netsLeft === 3 ? 1 : netsLeft === 2 ? 2 : 3;
      setTier(k === 3 && Math.floor(time / 0.45) % 2 === 1 ? 4 : k);
    },
  };
}

// 舷侧一道往下淌的锈水印：贴着船壳外面，上宽下窄
function rustStreak(b, x, side) {
  const segs = 5;
  const v0 = 0.97, v1 = 0.62;
  for (let k = 0; k < segs; k++) {
    const t0 = k / segs, t1 = (k + 1) / segs;
    const va = v0 + (v1 - v0) * t0, vb = v0 + (v1 - v0) * t1;
    const wa = 0.07 * (1 - t0 * 0.7), wb = 0.07 * (1 - t1 * 0.7);
    const pa = hullP(x, va, side), pb = hullP(x, vb, side);
    const out = (p) => { const q = p.clone(); q.z += side * 0.012; return q; };
    const a = out(pa).add(new THREE.Vector3(-wa, 0, 0)), bq = out(pa).add(new THREE.Vector3(wa, 0, 0));
    const c = out(pb).add(new THREE.Vector3(wb, 0, 0)), d = out(pb).add(new THREE.Vector3(-wb, 0, 0));
    const col = C.rust.clone().lerp(C.top, 0.25 + t0 * 0.5);
    if (side > 0) b.quad(d, c, bq, a, col); else b.quad(a, bq, c, d, col);
  }
}

function coil(b, c, r, col) {
  for (let k = 0; k < 4; k++) {
    const rr = r - k * 0.06;
    const y = c.y + 0.04 + k * 0.05;
    for (let i = 0; i < 10; i++) {
      const a0 = (i / 10) * Math.PI * 2, a1 = ((i + 1) / 10) * Math.PI * 2;
      b.beam(new THREE.Vector3(c.x + Math.cos(a0) * rr, y, c.z + Math.sin(a0) * rr), new THREE.Vector3(c.x + Math.cos(a1) * rr, y, c.z + Math.sin(a1) * rr), new THREE.Vector3(0, 1, 0), 0.07, 0.06, col.clone().multiplyScalar(0.9 + (k % 2) * 0.12));
    }
  }
}

function buildCrane() {
  const root = new THREE.Group();
  const mat = toon({ vertexColors: true, spec: 0.25, shin: 30 });
  // 底座
  const pb = new GeoBuilder();
  pb.cylinder(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.75, 0), 0.5, 0.42, 10, C.yellowDark);
  pb.cylinder(new THREE.Vector3(0, 0.75, 0), new THREE.Vector3(0, 0.85, 0), 0.55, 0.55, 10, C.black);
  const pedestal = new THREE.Mesh(pb.build(), mat);
  root.add(pedestal);
  // 转台
  const turret = new THREE.Group();
  turret.position.y = 0.85;
  root.add(turret);
  const tb = new GeoBuilder();
  tb.box(new THREE.Vector3(-0.15, 0.32, 0), new THREE.Vector3(0.55, 0, 0), new THREE.Vector3(0, 0.32, 0), new THREE.Vector3(0, 0, 0.42), C.yellow);
  tb.box(new THREE.Vector3(-0.15, 0.66, 0), new THREE.Vector3(0.5, 0, 0), new THREE.Vector3(0, 0.03, 0), new THREE.Vector3(0, 0, 0.38), C.yellowDark);
  // 操纵杆
  tb.box(new THREE.Vector3(-0.55, 0.85, -0.3), new THREE.Vector3(0.02, 0, 0), new THREE.Vector3(0, 0.2, 0), new THREE.Vector3(0, 0, 0.02), C.black);
  tb.box(new THREE.Vector3(-0.55, 0.85, -0.18), new THREE.Vector3(0.02, 0, 0), new THREE.Vector3(0, 0.2, 0), new THREE.Vector3(0, 0, 0.02), C.black);
  // 吊臂铰点耳板
  for (const z of [-0.2, 0.2]) tb.box(new THREE.Vector3(0.15, 0.85, z), new THREE.Vector3(0.18, 0, 0), new THREE.Vector3(0, 0.25, 0), new THREE.Vector3(0, 0, 0.04), C.yellowDark);
  const turretMesh = new THREE.Mesh(tb.build(), mat);
  turret.add(turretMesh);
  // 吊臂：三节伸缩
  const boom = new THREE.Group();
  boom.position.set(0.15, 1.45 - 0.0, 0); // 铰点（相对转台）
  turret.add(boom);
  const secLen = 4.0;
  const sections = [];
  const sizes = [0.34, 0.27, 0.2];
  for (let k = 0; k < 3; k++) {
    const sb = new GeoBuilder();
    const w = sizes[k];
    sb.box(new THREE.Vector3(secLen / 2, 0, 0), new THREE.Vector3(secLen / 2, 0, 0), new THREE.Vector3(0, w / 2, 0), new THREE.Vector3(0, 0, w / 2), k === 0 ? C.yellow : k === 1 ? C.yellow.clone().multiplyScalar(0.94) : C.yellow.clone().multiplyScalar(0.88));
    // 黑黄警示纹
    for (let i = 0; i < 3; i++) sb.box(new THREE.Vector3(secLen - 0.15 - i * 0.22, 0, 0), new THREE.Vector3(0.06, 0, 0), new THREE.Vector3(0, w / 2 + 0.005, 0), new THREE.Vector3(0, 0, w / 2 + 0.005), C.black);
    const m = new THREE.Mesh(sb.build(), mat);
    m.castShadow = true;
    boom.add(m);
    sections.push(m);
  }
  // 头部滑轮
  const head = new THREE.Group();
  const hb = new GeoBuilder();
  hb.cylinder(new THREE.Vector3(0, 0, -0.1), new THREE.Vector3(0, 0, 0.1), 0.18, 0.18, 10, C.black);
  hb.box(new THREE.Vector3(0.05, 0, 0), new THREE.Vector3(0.2, 0, 0), new THREE.Vector3(0, 0.12, 0), new THREE.Vector3(0, 0, 0.12), C.yellowDark);
  head.add(new THREE.Mesh(hb.build(), mat));
  boom.add(head);
  // 液压缸
  const ram = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1, 6), toon({ color: 0x9aa0a6, spec: 0.5, shin: 40 }));
  turret.add(ram);
  [pedestal, turretMesh, head.children[0], ram].forEach((m) => (m.castShadow = true));
  return { root, turret, boom, sections, head, ram, secLen };
}

// 配重网架：一圈刷了防锈漆的钢环、八个铅坠、四根吊链、网衣（能收口）
function buildNetFrame() {
  const root = new THREE.Group();
  root.name = 'netframe';
  const ringMat = toon({ color: 0xb24a2c, spec: 0.3, shin: 20 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(NET_R, 0.075, 6, 28), ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.castShadow = true;
  root.add(ring);
  const lead = toon({ color: 0x55585c, spec: 0.3 });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.16), lead);
    w.position.set(Math.cos(a) * NET_R, -0.05, Math.sin(a) * NET_R);
    w.castShadow = true;
    root.add(w);
  }
  // 吊链
  const chainB = new GeoBuilder();
  const hook = new THREE.Vector3(0, 1.25, 0);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const p = new THREE.Vector3(Math.cos(a) * NET_R, 0.02, Math.sin(a) * NET_R);
    chainB.beam(p, hook, new THREE.Vector3(0, 1, 0), 0.04, 0.04, new THREE.Color(0.25, 0.25, 0.27));
  }
  chainB.cylinder(new THREE.Vector3(0, 1.2, 0), new THREE.Vector3(0, 1.45, 0), 0.09, 0.07, 6, new THREE.Color(0.2, 0.2, 0.2));
  const chains = new THREE.Mesh(chainB.build(), toon({ vertexColors: true }));
  chains.castShadow = true;
  root.add(chains);

  // 网衣：车床曲面，顶点每帧按收口程度和网兜鼓起程度更新
  const RAD = 24, LEV = 7;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array((RAD + 1) * (LEV + 1) * 3);
  const uv = new Float32Array((RAD + 1) * (LEV + 1) * 2);
  const idx = [];
  for (let j = 0; j <= LEV; j++) {
    for (let i = 0; i <= RAD; i++) {
      const k = j * (RAD + 1) + i;
      uv[k * 2] = i / RAD;
      uv[k * 2 + 1] = j / LEV;
      if (i < RAD && j < LEV) {
        const a = k, b = k + 1, c = k + RAD + 1, d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
    }
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(idx);
  const netMat = toon({ color: 0x3e4a3e, net: [RAD * 1.0, LEV * 2.2], side: THREE.DoubleSide });
  const skirt = new THREE.Mesh(geo, netMat);
  skirt.castShadow = true;
  skirt.frustumCulled = false;
  root.add(skirt);
  const state = { close: 0, bulge: 0.2, depth: 0.95 };
  function updateSkirt() {
    const p = geo.attributes.position.array;
    for (let j = 0; j <= LEV; j++) {
      const t = j / LEV;
      // 收口：越往下越收；鼓起：中段往外撑
      const bottomR = NET_R * (1 - state.close * 0.86);
      let r = NET_R + (bottomR - NET_R) * Math.pow(t, 1.4);
      r += Math.sin(t * Math.PI) * state.bulge * (0.4 + state.close * 0.5);
      const y = -t * (state.depth + state.close * 0.35);
      for (let i = 0; i <= RAD; i++) {
        const a = (i / RAD) * Math.PI * 2;
        const k = (j * (RAD + 1) + i) * 3;
        const wob = Math.sin(a * 3 + t * 4) * 0.03 * t;
        p[k] = Math.cos(a) * (r + wob);
        p[k + 1] = y;
        p[k + 2] = Math.sin(a) * (r + wob);
      }
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
  }
  updateSkirt();
  // 网兜里的东西挂在这里
  const bag = new THREE.Group();
  bag.position.y = -0.7;
  root.add(bag);
  return { root, ring, skirt, state, updateSkirt, bag, hookY: 1.45 };
}

// 由臂端目标（船局部坐标）求转台角、臂长、仰角
export function solveCrane(tipLocal) {
  const px = BOAT.crane.x + 0.15, pz = BOAT.crane.z, py = BOAT.deckY + 0.85 + 1.45;
  const dx = tipLocal.x - BOAT.crane.x, dz = tipLocal.z - pz;
  const yaw = Math.atan2(-dz, dx);
  const h = Math.max(0.01, Math.hypot(dx, dz) - 0.15);
  const v = tipLocal.y - py;
  const len = Math.hypot(h, v);
  const elev = Math.atan2(v, h);
  void px;
  return { yaw, len, elev };
}

// 把吊机摆到给定角度和长度
export function poseCrane(crane, yaw, len, elev) {
  crane.turret.rotation.y = yaw;
  crane.boom.rotation.z = elev;
  const L = crane.secLen;
  const e = Math.max(0, len - L);
  crane.sections[0].position.x = 0;
  crane.sections[1].position.x = e * 0.5;
  crane.sections[2].position.x = e;
  crane.head.position.x = len;
  // 液压缸：从转台前下方顶到第一节吊臂中部
  const base = new THREE.Vector3(0.45, 0.55, 0);
  const tipOnBoom = new THREE.Vector3(1.6 * Math.cos(elev), 1.45 + 1.6 * Math.sin(elev) - 0.15, 0).add(new THREE.Vector3(0.15, 0, 0));
  const mid = base.clone().add(tipOnBoom).multiplyScalar(0.5);
  crane.ram.position.copy(mid);
  const d = tipOnBoom.clone().sub(base);
  crane.ram.scale.set(1, d.length(), 1);
  crane.ram.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
}

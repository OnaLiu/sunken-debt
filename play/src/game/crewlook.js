// 船员的造型与动作（crew.js 引用）。
// 造型：还是方块风格的那五个人，轮廓、配色不变，只往细里做——倒角方块、上浅下深的顶点色；脸（眼睛带高光、眉、鼻、耳、嘴）、
//   领口、纽扣、口袋、接缝、反光条、背带扣；胳膊分上臂前臂（肘能弯）、连指手套（拇指分开）；腿分大腿小腿（膝能弯）、靴子有鞋底和翻边。
// 动作：每个动作给一套目标姿势（关节角，手脚也可以给目标点，用两节骨的解析 IK 换成关节角），
//   目标经双级平滑过去——换动作不跳帧、起步收步都是缓的；步态、呼吸、后坐这种快的抖动直接叠在平滑之后。
//   走路的步子按真实位移推进（脚踩实不打滑），骨盆高度受腿长约束（迈大步、下蹲时膝盖自然弯）。
import * as THREE from 'three';
import { Builder, cyl, sph, tor, lathe, rod, tube, col, M } from '../core/geo.js';
import { poseChore, choreProps } from './chores.js';

const PI = Math.PI, TAU = PI * 2;
// 表现用的随机数单独一条（不占用 Math.random：玩法里别的东西也在用它，别把那条序列打乱）
let _seed = 20261014;
export const rnd = () => { _seed = (_seed * 1664525 + 1013904223) >>> 0; return _seed / 4294967296; };
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
const frac = (x) => x - Math.floor(x);
const wrapA = (a) => { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; };
// 包络：atk 秒内升到 1，保持到 hold，end 时落回 0
const env3 = (t, atk, hold, end) => (t < 0 ? 0 : t < atk ? sstep(0, atk, t) : t < hold ? 1 : 1 - sstep(hold, end, t));

// 身体尺寸（hips 坐标；船长整体再放大 1.1）
const HIPY = 0.92, TY = 0.04, NY = 0.6, SY = 0.535; // 骨盆高、腰（躯干转轴）、脖子、肩
const UA = 0.29, FA = 0.27, HAND = 0.055; // 上臂、前臂、腕到掌心
const HX = 0.11, TL = 0.42, SL = 0.4, AH = 0.08; // 髋宽、大腿、小腿、脚踝离地

// ———— 造型工具 ————
const _tc = new THREE.Color();
const _wv = new THREE.Vector3();
// 切角矩形截面（八个点），ox/oz 平移
function rect8(w, d, c, y, oz = 0, ox = 0) {
  const x = w / 2, z = d / 2, cx = Math.min(c, x * 0.45), cz = Math.min(c, z * 0.45);
  return [[ox + x, y, oz + z - cz], [ox + x - cx, y, oz + z], [ox - x + cx, y, oz + z], [ox - x, y, oz + z - cz],
    [ox - x, y, oz - z + cz], [ox - x + cx, y, oz - z], [ox + x - cx, y, oz - z], [ox + x, y, oz - z + cz]];
}
// 一圈圈截面连成体，两头封口；三角形朝向按“从中轴往外”自动摆正（不用操心绕序）
function loft(rings) {
  const pos = [];
  const tri = (a, b, c, ox, oy, oz) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    if (nx * nx + ny * ny + nz * nz < 1e-14) return;
    if (nx * ox + ny * oy + nz * oz < 0) pos.push(a[0], a[1], a[2], c[0], c[1], c[2], b[0], b[1], b[2]);
    else pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
  };
  const ctr = rings.map((R) => { let x = 0, y = 0, z = 0; for (const p of R) { x += p[0]; y += p[1]; z += p[2]; } return [x / R.length, y / R.length, z / R.length]; });
  for (let r = 0; r < rings.length - 1; r++) {
    const A = rings[r], B = rings[r + 1], n = A.length, cx = (ctr[r][0] + ctr[r + 1][0]) / 2, cz = (ctr[r][2] + ctr[r + 1][2]) / 2;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const ox = (A[i][0] + A[j][0] + B[i][0] + B[j][0]) / 4 - cx, oz = (A[i][2] + A[j][2] + B[i][2] + B[j][2]) / 4 - cz;
      tri(A[i], A[j], B[j], ox, 0, oz); tri(A[i], B[j], B[i], ox, 0, oz);
    }
  }
  for (const [k, nb] of [[0, 1], [rings.length - 1, rings.length - 2]]) {
    const R = rings[k], c = ctr[k], up = Math.sign(c[1] - ctr[nb][1]) || 1;
    for (let i = 0; i < R.length; i++) tri(c, R[i], R[(i + 1) % R.length], 0, up, 0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return g;
}
// 倒角方块：w×h×d，c 倒角；tx/tz 顶面相对底面的缩放（上粗下细、收肩）
function bev(w, h, d, c = 0.018, o = {}) {
  const tx = o.tx ?? 1, tz = o.tz ?? 1, y0 = -h / 2, y1 = h / 2, cc = Math.min(c, h * 0.3);
  const W = (k) => w * (1 + (tx - 1) * k), Dd = (k) => d * (1 + (tz - 1) * k);
  // 小零件（扣子、眼睛、高光）用不倒角的方块，省三角形
  if (cc <= 0 || c < 0.007 || Math.max(w, h, d) < 0.05) { const r4 = (a, b, y) => [[a / 2, y, b / 2], [-a / 2, y, b / 2], [-a / 2, y, -b / 2], [a / 2, y, -b / 2]]; return loft([r4(W(0), Dd(0), y0), r4(W(1), Dd(1), y1)]); }
  return loft([rect8(W(0) - 2 * cc, Dd(0) - 2 * cc, c * 0.6, y0), rect8(W(cc / h), Dd(cc / h), c, y0 + cc),
    rect8(W(1 - cc / h), Dd(1 - cc / h), c, y1 - cc), rect8(W(1) - 2 * cc, Dd(1) - 2 * cc, c * 0.6, y1)]);
}
// 截面一层层给：[y, 宽, 深, 倒角, z 偏移, x 偏移]
const shape = (rows) => loft(rows.map(([y, w, d, c, oz = 0, ox = 0]) => rect8(w, d, c, y, oz, ox)));
// 顶点色：y 从 y0 到 y1，明度 f0 → f1（上浅下深）
function grad(hex, y0, y1, f0, f1) { const b = col(hex); return (x, y) => { const f = lerp(f0, f1, clamp((y - y0) / (y1 - y0), 0, 1)); return _tc.setRGB(b.r * f, b.g * f, b.b * f); }; }
const tone = (hex, f = 1) => col(hex).multiplyScalar(f);
const mixc = (a, b, t) => col(a).lerp(col(b), t);
function warp(g, fn) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { _wv.fromBufferAttribute(p, i); fn(_wv); p.setXYZ(i, _wv.x, _wv.y, _wv.z); } return g; }
// 两面都画（薄片：帽檐）
function twoSide(g) {
  const s = g.index ? g.toNonIndexed() : g, a = s.attributes.position.array, n = a.length, out = new Float32Array(n * 2);
  out.set(a);
  for (let i = 0; i < n; i += 9) { out.set(a.subarray(i, i + 3), n + i); out.set(a.subarray(i + 6, i + 9), n + i + 3); out.set(a.subarray(i + 3, i + 6), n + i + 6); }
  const r = new THREE.BufferGeometry(); r.setAttribute('position', new THREE.BufferAttribute(out, 3)); return r;
}

// 每个人的头发、手套、靴子、毛衣颜色（外衣、裤子、帽子、肤色仍在 crew.js 的 OUTFITS 里）
const EXTRA = {
  阿满: { hair: 0x2a2018, brow: 0x241a12, glove: 0xd8602a, boot: 0x3a3a30, cuff: 0x8e8664 },
  小秦: { hair: 0x161412, brow: 0x141210, glove: 0x25282b, boot: 0x34362e, cuff: 0x8e8664 },
  石头: { hair: 0x1e1a16, brow: 0x14100c, glove: 0x7a5a3a, boot: 0x2e2620, sweater: 0x6e6a60, thick: true },
  老蔡: { hair: 0x8a847a, brow: 0x9a948a, glove: null, boot: 0x2a221c, sweater: 0xb0a284, thick: true, old: true },
  老魏: { hair: 0xbcb6aa, brow: 0xaaa498, glove: null, boot: 0x141414, sweater: 0xd2c9b2 },
};
const GOLD = 0xd8b44a, REFL = 0xd8dcd6, STRAP = 0x2a2018, BRASS = 0xc89a3a;

// 拼一个人：在 s 上挂 g/hips/torso/head/armL/armR/legL/legR/nozzle，返回动作控制器
export function buildSailor(s, o, mat) {
  const X = EXTRA[o.name] || EXTRA.阿满;
  const carry = o.role === 'carry', cap = o.role === 'captain', wash = o.role === 'wash';
  const tw = carry ? 0.6 : 0.46, td = carry ? 0.36 : 0.3, aw = carry ? 0.17 : 0.13;
  const D = { tw, td, aw, SX: tw / 2 + aw / 2 + 0.005, FX: carry ? 0.135 : 0.115, carry, cap, wash };
  const mk = (fill) => { const b = new Builder(); fill(b); const m = new THREE.Mesh(b.build(), mat); m.castShadow = true; return m; };
  const grp = (parent, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  s.g = new THREE.Group();
  s.hips = grp(s.g, 0, HIPY, 0); s.hips.rotation.order = 'YXZ';
  // 裤腰（大腿根藏在里面）；搬运手的皮带露在短褂下沿
  s.hips.add(mk((b) => {
    b.add(bev(tw * 0.8, 0.2, td * 0.9, 0.035), grad(o.pants, -0.13, 0.07, 0.8, 0.95), M(0, -0.03, 0));
    if (carry) {
      b.add(bev(tw * 0.82, 0.05, td * 0.92 + 0.01, 0.02), grad(STRAP, -0.085, -0.035, 0.8, 1.1), M(0, -0.06, 0));
      b.add(bev(0.064, 0.048, 0.016, 0.006), col(BRASS), M(0, -0.06, td * 0.46 + 0.012));
      b.add(bev(0.03, 0.022, 0.016, 0.004), tone(STRAP, 0.8), M(0, -0.06, td * 0.46 + 0.017));
    }
  }));

  // ———— 躯干（转轴在腰） ————
  const rows = carry
    ? [[0.6, tw * 0.82, td * 0.8, 0.03], [0.552, tw, td * 0.98, 0.045], [0.4, tw, td * 1.04, 0.05], [0.16, tw * 0.95, td * 0.98, 0.045], [-0.07, tw * 0.93, td * 0.95, 0.04], [-0.08, tw * 0.85, td * 0.85, 0.03]]
    : [[0.6, tw * 0.8, td * 0.78, 0.03], [0.555, tw, td * 0.96, 0.04], [0.4, tw, td, 0.04], [0.16, tw * 0.9, td * 0.94, 0.035], [-0.06, tw * 0.88, td * 0.92, 0.03], [-0.07, tw * 0.8, td * 0.82, 0.025]];
  const zAt = (y) => { for (let i = 0; i < rows.length - 1; i++) { const [y0, , d0] = rows[i], [y1, , d1] = rows[i + 1]; if (y <= y0 && y >= y1) return lerp(d1, d0, (y - y1) / (y0 - y1)) / 2; } return td / 2; };
  s.torso = mk((b) => {
    // 第一块是衣身（截面从上往下给：第一个顶点在肩上，颜色就是外衣本色）
    b.add(shape(rows), grad(o.coat, 0.45, -0.08, 1.0, 0.8));
    if (cap) {
      // 船长：立领、浅色毛衣领口、驳头、双排金扣、肩章
      b.add(bev(0.11, 0.13, 0.02, 0.01, { tx: 1.4 }), grad(X.sweater, 0.47, 0.6, 0.8, 1.0), M(0, 0.535, zAt(0.53) - 0.004));
      b.add(bev(0.25, 0.115, 0.04, 0.012), grad(o.coat, 0.57, 0.69, 0.95, 1.25), M(0, 0.63, -0.085));
      for (const sd of [-1, 1]) {
        b.add(bev(0.04, 0.115, 0.17, 0.012), grad(o.coat, 0.57, 0.69, 0.95, 1.25), M(sd * 0.11, 0.63, -0.005, 0, 0, sd * 0.06));
        b.add(bev(0.08, 0.22, 0.018, 0.008, { tx: 1.25 }), tone(o.coat, 1.35), M(sd * 0.06, 0.47, zAt(0.47) + 0.004, 0, 0, -sd * 0.32));
        for (const y of [0.1, 0.22, 0.34]) b.add(bev(0.034, 0.034, 0.016, 0.007), grad(GOLD, y - 0.02, y + 0.02, 0.7, 1.15), M(sd * 0.072, y, zAt(y) + 0.006));
        b.add(bev(0.12, 0.024, 0.13, 0.01), tone(o.coat, 1.3), M(sd * (tw / 2 - 0.06), 0.602, 0));
        b.add(bev(0.016, 0.028, 0.132, 0.004), col(GOLD), M(sd * (tw / 2 - 0.004), 0.603, 0));
      }
    } else if (wash) {
      // 冲洗手：肩部接缝、门襟和按扣、胸前反光条、竖起的风雨领、胸袋
      b.add(bev(tw + 0.006, 0.014, td * 0.97 + 0.008, 0.04), tone(o.coat, 0.7), M(0, 0.47, 0));
      b.add(bev(tw + 0.014, 0.052, td + 0.016, 0.04), grad(REFL, 0.27, 0.33, 0.85, 1.12), M(0, 0.3, 0));
      b.add(bev(tw + 0.018, 0.012, td + 0.02, 0.04), tone(REFL, 0.62), M(0, 0.3, 0));
      b.add(bev(0.056, 0.62, 0.012, 0.004), grad(o.coat, -0.06, 0.6, 0.7, 0.86), M(0, 0.27, zAt(0.3) + 0.004));
      for (const y of [0.08, 0.19, 0.42, 0.53]) b.add(bev(0.026, 0.026, 0.012, 0.005), col(0x2a2a28), M(0, y, zAt(y) + 0.012));
      b.add(bev(0.27, 0.13, 0.04, 0.012, { tx: 1.08 }), grad(o.coat, 0.56, 0.7, 0.8, 1.04), M(0, 0.63, -0.09));
      for (const sd of [-1, 1]) b.add(bev(0.04, 0.13, 0.17, 0.012), grad(o.coat, 0.56, 0.7, 0.8, 1.04), M(sd * 0.125, 0.63, -0.008, 0, 0, -sd * 0.16));
      b.add(bev(0.1, 0.075, 0.014, 0.005), tone(o.coat, 0.88), M(-0.12, 0.395, zAt(0.4) + 0.005));
      b.add(bev(0.112, 0.03, 0.022, 0.006), tone(o.coat, 0.72), M(-0.12, 0.44, zAt(0.44) + 0.008));
    } else {
      // 搬运手：毛衣高领、门襟、两只胸袋、罗纹下摆、斜挎背带和铜扣
      b.add(bev(0.11, 0.13, 0.02, 0.008, { tx: 1.45 }), grad(X.sweater, 0.47, 0.6, 0.78, 1.0), M(0, 0.54, zAt(0.54) - 0.004));
      const rib = col(X.sweater), rib2 = tone(X.sweater, 0.76);
      b.add(bev(0.21, 0.08, 0.19, 0.04), (x, y, z, i) => (Math.floor(i / 6) % 2 ? rib : rib2), M(0, 0.63, 0));
      for (const sd of [-1, 1]) {
        b.add(bev(0.02, 0.44, 0.012, 0.004), tone(o.coat, 0.66), M(sd * 0.04, 0.25, zAt(0.3) + 0.004));
        b.add(bev(0.12, 0.1, 0.014, 0.005), tone(o.coat, 0.86), M(sd * 0.155, 0.34, zAt(0.34) + 0.005));
        b.add(bev(0.132, 0.034, 0.02, 0.006), tone(o.coat, 0.72), M(sd * 0.155, 0.4, zAt(0.4) + 0.008));
        b.add(bev(0.018, 0.018, 0.01, 0.003), col(BRASS), M(sd * 0.155, 0.392, zAt(0.4) + 0.019));
      }
      b.add(bev(tw * 0.93 + 0.01, 0.06, td * 0.95 + 0.012, 0.035), (x, y, z, i) => (Math.floor(i / 6) % 2 ? tone(o.coat, 0.78) : tone(o.coat, 0.66)), M(0, -0.04, 0));
      b.add(bev(0.075, 0.78, td * 1.04 + 0.04, 0.015), grad(STRAP, 0, 0.6, 0.85, 1.15), M(0.04, 0.3, 0, 0, 0, 0.5));
      const bx = 0.04 - Math.sin(0.5) * 0.13, by = 0.3 + Math.cos(0.5) * 0.13;
      b.add(bev(0.075, 0.062, 0.016, 0.006), grad(BRASS, by - 0.03, by + 0.03, 0.75, 1.2), M(bx, by, zAt(by) + 0.024, 0, 0, 0.5));
      b.add(bev(0.042, 0.03, 0.016, 0.004), tone(STRAP, 0.7), M(bx, by, zAt(by) + 0.028, 0, 0, 0.5));
    }
  });
  // 测试按第一个顶点读外衣颜色：钉死成本色
  { const c = col(o.coat), a = s.torso.geometry.attributes.color; a.setXYZ(0, c.r, c.g, c.b); }
  s.torso.position.y = TY; s.hips.add(s.torso);

  // ———— 长衣摆：船长到膝、冲洗手到大腿；左右两片各跟着大腿摆 ————
  const hem = [null, null];
  if (cap || wash) {
    const L = cap ? 0.53 : 0.36;
    for (const sd of [-1, 1]) {
      const w0 = tw / 2 + 0.03, w1 = tw / 2 + (cap ? 0.06 : 0.045), d0 = td + 0.04, d1 = td + (cap ? 0.1 : 0.07);
      const ox0 = sd * (w0 / 2 - 0.1), ox1 = sd * (w1 / 2 - 0.1);
      const m = mk((b) => {
        b.add(shape([[0.03, w0, d0, 0.03, 0, ox0], [-L + 0.02, w1, d1, 0.03, 0, ox1], [-L, w1 - 0.02, d1 - 0.02, 0.02, 0, ox1]]), grad(o.coat, 0.03, -L, 0.92, 0.72));
        const fz = (y) => lerp(d0, d1, clamp(-y / L, 0, 1)) / 2;
        if (cap) {
          b.add(bev(0.12, 0.034, 0.02, 0.007), tone(o.coat, 1.3), M(ox0 + sd * 0.01, -0.15, fz(-0.15) + 0.006));
          b.add(bev(0.024, 0.024, 0.012, 0.005), col(GOLD), M(ox0 + sd * 0.01, -0.155, fz(-0.15) + 0.018));
          b.add(bev(0.034, 0.034, 0.016, 0.007), col(GOLD), M(-sd * 0.1 + sd * 0.028, -0.02, fz(-0.02) + 0.006));
        } else {
          b.add(bev(w1 + 0.012, 0.046, d1 + 0.012, 0.03), grad(REFL, -L + 0.04, -L + 0.1, 0.85, 1.12), M(ox1, -L + 0.07, 0));
          b.add(bev(0.11, 0.03, 0.02, 0.006), tone(o.coat, 0.72), M(ox0 + sd * 0.02, -0.08, fz(-0.08) + 0.007));
        }
      });
      m.position.set(sd * 0.1, 0.03, 0);
      s.hips.add(m); hem[sd > 0 ? 1 : 0] = m;
    }
  }

  // ———— 头（转轴在脖子根）：脸、耳、发、帽子，全在一块里；眼睛、嘴另做，能眨、能张 ————
  const skin = o.skin;
  s.head = mk((b) => {
    b.add(bev(0.1, 0.1, 0.1, 0.02), tone(skin, 0.74), M(0, 0.02, -0.005));
    b.add(shape([[0.285, 0.2, 0.2, 0.03], [0.265, 0.24, 0.24, 0.035], [0.11, 0.24, 0.24, 0.035], [0.04, 0.22, 0.225, 0.035], [0.018, 0.17, 0.19, 0.03]]), grad(skin, 0.02, 0.27, 0.9, 1.08));
    for (const sd of [-1, 1]) {
      b.add(bev(0.03, 0.066, 0.052, 0.01), tone(skin, 0.9), M(sd * 0.128, 0.145, -0.012));
      b.add(bev(0.012, 0.034, 0.026, 0.004), tone(skin, 0.6), M(sd * 0.142, 0.143, -0.006));
      b.add(bev(0.04, 0.022, 0.008, 0.004), mixc(skin, 0xc85040, 0.13), M(sd * 0.076, 0.1, 0.118));
      b.add(bev(0.066, X.thick ? 0.025 : 0.018, 0.016, 0.005), col(X.brow), M(sd * 0.055, 0.194, 0.123, 0, 0, sd * (X.thick ? 0.15 : -0.05)));
    }
    b.add(bev(0.042, 0.064, 0.05, 0.012, { tx: 0.72, tz: 0.6 }), grad(skin, 0.09, 0.16, 0.86, 1.0), M(0, 0.128, 0.13));
    if (!carry) {
      b.add(bev(0.25, 0.12, 0.06, 0.02), grad(X.hair, 0.14, 0.27, 0.8, 1.0), M(0, 0.205, -0.106));
      for (const sd of [-1, 1]) b.add(bev(0.02, 0.085, 0.11, 0.008), col(X.hair), M(sd * 0.123, 0.205, -0.03));
    } else {
      b.add(bev(0.25, 0.06, 0.05, 0.02), col(X.hair), M(0, 0.22, -0.106));
      for (const sd of [-1, 1]) b.add(bev(0.018, 0.072, 0.05, 0.006), col(X.hair), M(sd * 0.123, 0.2, 0.06));
      // 胡茬（老蔡还留着灰八字胡）
      const stub = mixc(skin, X.hair, X.old ? 0.45 : 0.36);
      b.add(bev(0.238, 0.075, 0.03, 0.02), stub, M(0, 0.06, 0.106));
      for (const sd of [-1, 1]) b.add(bev(0.03, 0.08, 0.15, 0.01), stub, M(sd * 0.112, 0.08, 0.03));
      if (X.old) for (const sd of [-1, 1]) b.add(bev(0.06, 0.022, 0.022, 0.006), col(X.hair), M(sd * 0.03, 0.092, 0.128, 0, 0, -sd * 0.2));
    }
    if (cap) {
      // 络腮胡、唇须、烟斗
      const bc = grad(X.hair, -0.03, 0.14, 0.82, 1.0);
      b.add(shape([[0.125, 0.25, 0.07, 0.02, 0.1], [0.04, 0.25, 0.07, 0.025, 0.1], [-0.01, 0.2, 0.066, 0.025, 0.095], [-0.03, 0.13, 0.05, 0.02, 0.09]]), bc);
      for (const sd of [-1, 1]) {
        b.add(bev(0.035, 0.13, 0.16, 0.012), bc, M(sd * 0.118, 0.075, 0.02));
        b.add(bev(0.07, 0.027, 0.03, 0.008), tone(X.hair, 1.08), M(sd * 0.032, 0.094, 0.138, 0, 0, -sd * 0.22));
      }
      b.add(rod([0.045, 0.07, 0.14], [0.1, 0.046, 0.2], 0.008, 4), col(0x2a1a10));
      b.add(cyl(0.019, 0.015, 0.046, 6), grad(0x6a4428, 0.04, 0.09, 0.75, 1.1), M(0.105, 0.064, 0.205));
      b.add(cyl(0.015, 0.015, 0.005, 6), col(0x8a3a1a), M(0.105, 0.087, 0.205));
      // 大檐帽：平顶、金带、帽徽、黑亮的帽檐和金绳
      b.add(lathe([[0.168, 0.3], [0.2, 0.352], [0.208, 0.38], [0.196, 0.395], [0, 0.4]], 10), grad(o.hat, 0.3, 0.4, 0.9, 1.25), M(0, 0, 0.012, -0.05, 0, 0));
      b.add(cyl(0.175, 0.175, 0.052, 10), grad(GOLD, 0.26, 0.31, 0.72, 1.0), M(0, 0.283, 0));
      b.add(bev(0.052, 0.048, 0.016, 0.006), col(0xe8c45a), M(0, 0.346, 0.2, -0.3, 0, 0));
      b.add(bev(0.022, 0.026, 0.01, 0.003), col(o.coat), M(0, 0.346, 0.208, -0.3, 0, 0));
      b.add(bev(0.26, 0.022, 0.13, 0.02), grad(0x0a0c10, 0.25, 0.27, 0.8, 1.8), M(0, 0.262, 0.172, 0.3, 0, 0));
      b.add(bev(0.24, 0.012, 0.012, 0.004), col(GOLD), M(0, 0.281, 0.178));
    } else if (wash) {
      // 雨帽：圆帽冠、接缝箍、后檐又宽又往下垂；系带从帽檐顺着腮帮兜到下巴
      const hc = grad(o.hat, 0.1, 0.41, 0.66, 1.05);
      b.add(lathe([[0.2, 0.235], [0.192, 0.3], [0.168, 0.365], [0.12, 0.398], [0, 0.406]], 8), hc);
      b.add(cyl(0.204, 0.204, 0.03, 8), tone(o.hat, 0.76), M(0, 0.252, 0));
      const br = lathe([[0.17, 0.0], [0.33, -0.03], [0.336, -0.048], [0.17, -0.022]], 12);
      warp(br, (p) => { if (p.z < 0) { p.z *= 1.32; p.y -= 0.12 * Math.pow(-p.z / 0.44, 1.5); } else { p.z *= 0.86; p.y += 0.02 * p.z / 0.29; } });
      b.add(twoSide(br), hc, M(0, 0.262, -0.02));
      const st = tone(o.hat, 0.42);
      for (const sd of [-1, 1]) { b.add(rod([sd * 0.127, 0.25, 0.02], [sd * 0.113, 0.06, 0.07], 0.008, 4), st); b.add(rod([sd * 0.113, 0.06, 0.07], [0, 0.006, 0.086], 0.008, 4), st); }
    } else {
      // 毛线帽：圆顶、罗纹翻边、顶上一小撮
      const hc = grad(o.hat, 0.2, 0.44, 0.76, 1.08), rib = col(o.hat), rib2 = tone(o.hat, 0.74);
      b.add(sph(0.158, 10, 6), hc, M(0, 0.292, -0.005, 0, 0, 0, 1, 0.8, 1.03));
      b.add(cyl(0.164, 0.166, 0.075, 12), (x, y, z, i) => (Math.floor(i / 6) % 2 ? rib : rib2), M(0, 0.248, -0.005));
      b.add(bev(0.05, 0.032, 0.05, 0.012), tone(o.hat, 0.9), M(0, 0.418, -0.005));
    }
  });
  s.head.position.y = TY + NY; s.hips.add(s.head);
  const eyes = mk((b) => { for (const sd of [-1, 1]) { b.add(bev(0.034, 0.04, 0.014, 0.006), col(0x17130f), M(sd * 0.053, 0, 0.004)); b.add(bev(0.013, 0.013, 0.006, 0.002), col(0xf4f0e6), M(sd * 0.053 - 0.008, 0.009, 0.011)); } });
  eyes.position.set(0, 0.156, 0.12); eyes.castShadow = false; s.head.add(eyes);
  const mouth = mk((b) => b.add(bev(0.064, 0.016, 0.012, 0.005), col(0x4e2620)));
  mouth.position.set(0, cap ? 0.073 : 0.07, cap ? 0.137 : carry ? 0.124 : 0.121); mouth.castShadow = false; s.head.add(mouth);

  // ———— 胳膊：上臂（肩头圆一点）、前臂（袖口）、手（连指手套，拇指分开）、四指（能攥） ————
  const gc = X.glove != null ? X.glove : skin;
  const arm = (sd) => {
    const upper = grp(s.hips, sd * D.SX, TY + SY, 0);
    upper.add(mk((b) => {
      b.add(bev(aw + 0.02, 0.11, aw + 0.035, 0.035), grad(o.coat, -0.08, 0.05, 0.9, 1.02), M(0, -0.03, 0));
      b.add(bev(aw, UA + 0.02, aw + 0.01, 0.025, { tx: 1.06, tz: 1.04 }), grad(o.coat, -UA, 0, 0.8, 0.96), M(0, -UA / 2 - 0.005, 0));
      if (wash) b.add(bev(aw + 0.014, 0.042, aw + 0.024, 0.02), grad(REFL, -0.19, -0.15, 0.85, 1.12), M(0, -0.17, 0));
    }));
    const fore = grp(upper, 0, -UA, 0);
    fore.add(mk((b) => {
      b.add(bev(aw * 0.96, 0.07, aw * 0.96 + 0.012, 0.025), tone(o.coat, 0.84), M(0, 0, 0));
      b.add(bev(aw * 0.92, FA, aw * 0.92 + 0.01, 0.022, { tx: 1.05 }), grad(o.coat, -FA, 0, 0.72, 0.88), M(0, -FA / 2, 0));
      if (cap) for (const y of [-FA + 0.045, -FA + 0.075]) b.add(bev(aw * 0.92 + 0.012, 0.014, aw * 0.92 + 0.022, 0.012), col(GOLD), M(0, y, 0));
      if (carry) b.add(bev(aw * 0.92 + 0.014, 0.056, aw * 0.92 + 0.024, 0.02), (x, y, z, i) => (Math.floor(i / 6) % 2 ? tone(o.coat, 0.7) : tone(o.coat, 0.58)), M(0, -FA + 0.03, 0));
      if (wash) b.add(bev(aw * 0.92 + 0.008, 0.035, aw * 0.92 + 0.018, 0.015), tone(o.coat, 0.66), M(0, -FA + 0.02, 0));
    }));
    const hand = grp(fore, 0, -FA, 0);
    hand.add(mk((b) => {
      if (wash) b.add(bev(0.112, 0.1, 0.106, 0.025), grad(gc, -0.04, 0.06, 0.78, 1.0), M(0, 0.018, 0));
      else if (X.glove != null) b.add(bev(0.098, 0.045, 0.092, 0.015), tone(gc, 0.78), M(0, -0.004, 0));
      b.add(bev(0.088, 0.09, 0.056, 0.016), grad(gc, -0.1, 0, 0.86, 1.0), M(0, -0.05, 0));
      b.add(bev(0.034, 0.062, 0.036, 0.01), tone(gc, 0.94), M(-sd * 0.046, -0.05, 0.03, 0, 0, -sd * 0.45));
    }));
    const fing = grp(hand, 0, -0.092, 0);
    fing.add(mk((b) => b.add(bev(0.084, 0.062, 0.052, 0.016), grad(gc, -0.06, 0, 0.82, 0.96), M(0, -0.026, 0))));
    return { upper, fore, hand, fing };
  };
  const AL = arm(-1), AR = arm(1);
  s.armL = AL.upper; s.armR = AR.upper;

  // ———— 腿：大腿、小腿（雨靴翻边 / 卷裤脚）、脚（鞋底、鞋面、靴口） ————
  const leg = (sd) => {
    const thigh = grp(s.hips, sd * HX, -0.02, 0);
    thigh.add(mk((b) => {
      b.add(bev(0.172, TL + 0.07, 0.19, 0.03, { tx: 1.08, tz: 1.05 }), grad(o.pants, -TL, 0.03, 0.82, 1.0), M(0, -TL / 2 + 0.015, 0));
      if (carry) b.add(bev(0.014, 0.1, 0.09, 0.004), tone(o.pants, 1.18), M(sd * 0.09, -0.13, 0));
    }));
    const shin = grp(thigh, 0, -TL, 0);
    shin.add(mk((b) => {
      b.add(bev(0.16, 0.08, 0.174, 0.03), tone(o.pants, 0.84), M(0, 0, 0.005));
      if (wash) {
        b.add(bev(0.152, 0.12, 0.165, 0.02), grad(o.pants, -0.12, 0, 0.76, 0.86), M(0, -0.06, 0));
        b.add(bev(0.19, 0.075, 0.202, 0.022), grad(X.cuff, -0.16, -0.08, 0.8, 1.0), M(0, -0.12, 0));
        b.add(bev(0.17, SL - 0.13, 0.185, 0.025, { tx: 1.04 }), grad(X.boot, -SL, -0.14, 0.72, 1.0), M(0, -0.14 - (SL - 0.13) / 2, 0));
      } else {
        b.add(bev(0.15, SL - 0.02, 0.163, 0.022, { tx: 1.06 }), grad(o.pants, -SL, 0, 0.76, 0.9), M(0, -SL / 2, 0));
        if (carry) b.add(bev(0.172, 0.05, 0.184, 0.018), grad(mixc(o.pants, 0x8a8470, 0.4).getHex(), -SL + 0.05, -SL + 0.1, 0.9, 1.15), M(0, -SL + 0.08, 0));
      }
    }));
    const foot = grp(shin, 0, -SL, 0);
    foot.add(mk((b) => {
      const bc = X.boot;
      if (wash) b.add(bev(0.17, 0.085, 0.186, 0.022), col(bc), M(0, 0.0, 0));
      else { b.add(bev(0.15, 0.1, 0.166, 0.025), grad(bc, -0.05, 0.05, 0.85, 1.0), M(0, 0.0, -0.005)); b.add(bev(0.16, 0.026, 0.174, 0.01), tone(bc, 1.5), M(0, 0.046, -0.005)); }
      b.add(bev(0.158, 0.072, 0.235, 0.028, { tz: 0.85 }), grad(bc, -0.08, -0.01, 0.78, 1.08), M(0, -AH + 0.026 + 0.036, 0.045));
      b.add(bev(0.17, 0.026, 0.256, 0.012), col(0x15120f), M(0, -AH + 0.013, 0.047));
    }));
    return { thigh, shin, foot };
  };
  const LL = leg(-1), LR = leg(1);
  s.legL = LL.thigh; s.legR = LR.thigh;

  // ———— 道具 ————
  // 水枪：沿 +z，握把在原点，后面拖一截水管（挂在躯干上，双手按姿势去握）
  s.nozzle = new THREE.Group();
  s.nozzle.add(mk((b) => {
    b.add(cyl(0.024, 0.034, 0.3, 6), grad(0xc09440, -0.04, 0.04, 0.7, 1.2), M(0, 0, 0.2, PI / 2, 0, 0));
    b.add(cyl(0.046, 0.034, 0.07, 8), grad(0xb08a3a, -0.05, 0.05, 0.8, 1.25), M(0, 0, 0.38, PI / 2, 0, 0));
    b.add(cyl(0.048, 0.048, 0.1, 6), grad(0x2a2a28, -0.05, 0.05, 0.8, 1.3), M(0, 0, 0.0, PI / 2, 0, 0));
    b.add(bev(0.022, 0.11, 0.022, 0.006), col(0x2a2a28), M(0, 0.055, 0.12, -0.55, 0, 0));
    b.add(tube([[0, 0, -0.04], [0.03, -0.1, -0.16], [0.07, -0.38, -0.26], [0.12, -0.7, -0.22], [0.16, -0.92, -0.08]], 0.034, 5), grad(0x2e3a30, -0.9, 0, 0.7, 1.0));
  }));
  s.nozzle.visible = false; s.torso.add(s.nozzle);

  const P = { g: s.g, hips: s.hips, torso: s.torso, head: s.head, eyes, mouth, armL: AL, armR: AR, legL: LL, legR: LR, hem, nozzle: s.nozzle };
  return new SailorRig(s, P, D);
}

// ———— 两节骨解析 IK ————
// 根 S、目标 T、弯向 pole（同一坐标系）；静止时骨沿 -y。输出根骨四元数，返回弯曲角。
// 胳膊：前臂往骨的 +z 弯（肘尖朝 pole）；腿（flip）：骨的 +z 朝 pole（膝盖朝前），小腿往 -z 弯
const _d = new THREE.Vector3(), _n = new THREE.Vector3(), _pp = new THREE.Vector3(), _u = new THREE.Vector3();
const _bx = new THREE.Vector3(), _by = new THREE.Vector3(), _bz = new THREE.Vector3(), _bm = new THREE.Matrix4();
function ik2(S, T, pole, L1, L2, flip, outQ) {
  _d.subVectors(T, S);
  let dist = _d.length();
  if (dist < 1e-5) { _d.set(0, -1, 0); dist = 1e-5; }
  _n.copy(_d).divideScalar(dist);
  dist = clamp(dist, Math.abs(L1 - L2) + 1e-3, L1 + L2 - 1e-4);
  const a = Math.acos(clamp((L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist), -1, 1));
  _pp.copy(pole).addScaledVector(_n, -pole.dot(_n));
  if (_pp.lengthSq() < 1e-8) _pp.set(0, 0, 1).addScaledVector(_n, -_n.z);
  _pp.normalize();
  _u.copy(_n).multiplyScalar(Math.cos(a)).addScaledVector(_pp, Math.sin(a));
  const bend = Math.acos(clamp((L1 * L1 + L2 * L2 - dist * dist) / (2 * L1 * L2), -1, 1));
  _by.copy(_u).negate();
  _bz.copy(_pp).addScaledVector(_u, -_pp.dot(_u)).normalize();
  if (!flip) _bz.negate();
  _bx.crossVectors(_by, _bz);
  _bm.makeBasis(_bx, _by, _bz);
  outQ.setFromRotationMatrix(_bm);
  return PI - bend;
}

// ———— 动作 ————
// 标量通道：骨盆（高、俯仰、侧倾、扭转、前后、左右）、胸（俯仰、侧倾、扭转、耸肩）、头、肘/腕/握、两只脚（位置与俯仰）、手里东西的位置、嘴
const SC = ['py', 'pp', 'pr', 'pyw', 'pz', 'px', 'cp', 'cr', 'cyw', 'sh', 'hp', 'hyw', 'hr', 'le', 'lw', 'lg', 're', 'rw', 'rg',
  'flx', 'fly', 'flz', 'flp', 'frx', 'fry', 'frz', 'frp', 'hcx', 'hcy', 'hcz', 'mo'];
const GRP = SC.map((k) => (/^(hp|hyw|hr)$/.test(k) ? 1 : /^(le|lw|lg|re|rw|rg|hc)/.test(k) ? 2 : /^f[lr]/.test(k) ? 3 : k === 'mo' ? 4 : 0));
// 每个动作的平滑快慢 [身体, 头, 胳膊]
const RATE = { idle: [6, 4, 7], walk: [10, 7, 12], carry: [9, 7, 14], carryHeavy: [6, 5, 10], hose: [10, 7, 14], coil: [10, 7, 16],
  look: [6, 4, 8], operate: [8, 6, 12], crouch: [14, 10, 18], lower: [10, 7, 14], lean: [5, 4, 7], peer: [10, 8, 11], cheer: [24, 14, 26], nod: [10, 14, 12], climb: [12, 8, 14] };
const MOVING = new Set(['walk', 'carry', 'carryHeavy', 'climb']);
// 待机的手：各人有各人的习惯（垂手、搓手、叉腰、抱胳膊、背手）
const IDLE_STYLE = { 阿满: ['hang', 'rub', 'hang', 'hips'], 小秦: ['hang', 'hips', 'hang', 'rub'], 石头: ['cross', 'hang', 'hips', 'cross'], 老蔡: ['hips', 'hang', 'cross', 'hang'], 老魏: ['behind', 'behind', 'hang'] };

const _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _S = new THREE.Vector3(), _P = new THREE.Vector3(), _pole = new THREE.Vector3();
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _qC = new THREE.Quaternion(), _qa = new THREE.Quaternion();
const _e = new THREE.Euler(), _mi = new THREE.Matrix4(), _box = new THREE.Box3();
const _X = new THREE.Vector3(1, 0, 0), _Z = new THREE.Vector3(0, 0, 1);
const mkPose = () => { const o = {}; for (const k of SC) o[k] = 0; o.qa = [new THREE.Quaternion(), new THREE.Quaternion()]; return o; };

export class SailorRig {
  constructor(s, P, D) {
    this.s = s; this.P = P; this.D = D;
    this.T = mkPose(); this.A = mkPose(); this.B = mkPose(); this.F = mkPose();
    this.anim = null; this.ta = 0; this.ramp = 1; this.first = true;
    this.ph = rnd(); this.gw = 0; this.spd = 0; this.mv = 0; this.turnRate = 0; this.lx = null;
    const i = s.i;
    this.bph = i * 0.37; this.breathP = 3.4 + i * 0.27; this.br = 0; this.ex = 0;
    this.blinkT = 0.8 + i * 0.7; this.blinkD = 0; this.squint = 0;
    this.gl = { t: 1 + i * 0.9, yaw: 0, pitch: 0 };
    this.ws = 0; this.wsT = 2 + i; this.wsTo = 0;
    this.styles = IDLE_STYLE[s.name] || ['hang']; this.idleK = i % this.styles.length; this.idleT = 6 + i * 1.3;
    this.rec = 0; this.recV = 0; this.recT = 0.4;
    this.re = null; this.gest = null; this.kMul = 1;
    this.nzG = new THREE.Vector3(0.12, 0.08, 0.28); this.nzD = new THREE.Vector3(0, -0.5, 0.85).normalize();
    this.nzGt = this.nzG.clone(); this.nzDt = this.nzD.clone();
    this.vis = 0; this.glanceW = 0; this.wsW = 0; this.envW = 1; this.swingA = 0; this.gaitK = 0;
  }
  // 由 crew.js 的 Sailor.animate 每帧调用（g 的位置、朝向已经摆好）
  update(dt, E) {
    const s = this.s;
    this.measure(dt);
    if (s.anim !== this.anim) { this.anim = s.anim; this.ta = 0; this.ramp = this.first ? 1 : 0; }
    this.ta += dt; this.ramp = Math.min(1, this.ramp + dt / (s.anim === 'crouch' || s.anim === 'lower' ? 0.2 : 0.45));
    this.pose(dt, E);
    if (this.first) { this.first = false; for (const k of SC) this.A[k] = this.B[k] = this.T[k]; for (let i = 0; i < 2; i++) { this.A.qa[i].copy(this.T.qa[i]); this.B.qa[i].copy(this.T.qa[i]); } }
    this.smooth(dt);
    this.post(dt, E);
    this.apply(dt, E);
  }
  // 真实位移 → 速度、步相（脚步跟着地面走，不打滑）；原地转身走碎步
  measure(dt) {
    const s = this.s, sc = s.g.scale.x;
    if (this.lx == null) { this.lx = s.x; this.lz = s.z; this.lfa = s.face; }
    let dx = s.x - this.lx, dz = s.z - this.lz;
    const dfa = wrapA(s.face - this.lfa);
    this.lx = s.x; this.lz = s.z; this.lfa = s.face;
    if (dx * dx + dz * dz > 0.5) dx = dz = 0;
    const sf = Math.sin(s.face), cf = Math.cos(s.face);
    const fw = (dx * sf + dz * cf) / sc, sd = (dx * cf - dz * sf) / sc, dist = Math.hypot(fw, sd);
    if (dt > 0) {
      const k = 1 - Math.exp(-dt * 10);
      this.spd += (dist / dt - this.spd) * k;
      this.turnRate += (Math.abs(dfa) / dt - this.turnRate) * k;
    }
    const a = s.anim;
    this.cyc = a === 'carryHeavy' ? 0.62 : a === 'carry' ? 0.85 : 1.15;
    this.ph += (Math.abs(fw) >= Math.abs(sd) ? fw : Math.abs(sd)) / this.cyc;
    const turning = dist < 0.004 && this.turnRate > 1.3 && !this.re;
    if (turning) this.ph += Math.abs(dfa) * 0.16;
    this.mv = clamp(this.spd / 0.35, 0, 1);
    const want = Math.max(MOVING.has(a) || this.spd > 0.2 ? this.mv : 0, turning ? 0.6 : 0);
    if (dt > 0) this.gw += (want - this.gw) * (1 - Math.exp(-dt * 9));
  }
  // ———— 姿势小工具 ————
  // 正向：fwd 往前抬、out 往外张、tw 扭、el 肘弯、wr 腕、gr 握（0 张开 … 1 攥紧）
  fk(i, fwd, out, tw = 0, el = 0.2, wr = 0, gr = 0.35, q = this.T.qa[i]) {
    const sd = i ? 1 : -1;
    _e.set(-fwd, sd * tw, sd * out, 'XYZ'); q.setFromEuler(_e);
    if (q === this.T.qa[i]) this.hand(i, el, wr, gr);
  }
  hand(i, el, wr, gr) { const T = this.T; if (i) { T.re = el; T.rw = wr; T.rg = gr; } else { T.le = el; T.lw = wr; T.lg = gr; } }
  // 手伸到胸坐标里的一点（pole：肘尖朝哪）
  ikC(i, x, y, z, px, py, pz, wr = 0, gr = 0.7, q = this.T.qa[i]) {
    const sd = i ? 1 : -1;
    _S.set(sd * this.D.SX, SY + this.T.sh, 0); _P.set(x, y, z); _pole.set(px, py, pz);
    const el = ik2(_S, _P, _pole, UA, FA + HAND, false, q);
    if (q === this.T.qa[i]) this.hand(i, el, wr, gr);
    return el;
  }
  // 手伸到身体坐标（脚下为原点、+z 朝前）里的一点
  ikG(i, x, y, z, px, py, pz, wr, gr, q) { this.toChest(_v2.set(x, y, z)); return this.ikC(i, _v2.x, _v2.y, _v2.z, px, py, pz, wr, gr, q); }
  // 身体坐标 → 胸坐标（按目标姿势）
  toChest(v) {
    const T = this.T;
    v.x -= T.px; v.y -= HIPY + T.py; v.z -= T.pz;
    _e.set(T.pp, T.pyw, T.pr, 'YXZ'); _q.setFromEuler(_e).invert(); v.applyQuaternion(_q);
    v.y -= TY;
    _e.set(T.cp, T.cyw, T.cr, 'YXZ'); _q.setFromEuler(_e).invert(); v.applyQuaternion(_q);
    return v;
  }
  // 甲板坐标 → 身体坐标
  fromDeck(v, x, y, z) { const s = this.s, sc = s.g.scale.x, dx = x - s.x, dz = z - s.z, sf = Math.sin(s.face), cf = Math.cos(s.face); return v.set((dx * cf - dz * sf) / sc, y / sc, (dx * sf + dz * cf) / sc); }
  // 手里东西的中心（身体坐标给，换到胸坐标存进通道）
  holdAt(x, y, z) { this.toChest(_v.set(x, y, z)); this.T.hcx = _v.x; this.T.hcy = _v.y; this.T.hcz = _v.z; }
  holdSize() {
    const h = this.s.hold;
    if (!h) return [0.15, 0.12];
    if (h._hw == null) { _box.setFromObject(h.mesh); _box.getSize(_v); h._hw = clamp(Math.max(_v.x, _v.z) * 0.5, 0.1, 0.3); h._hh = clamp(_v.y * 0.5, 0.06, 0.3); }
    return [h._hw, h._hh];
  }
  neutral() {
    const T = this.T, D = this.D;
    T.py = -0.018; T.pp = 0; T.pr = 0; T.pyw = 0; T.pz = 0; T.px = 0;
    T.cp = 0.03; T.cr = 0; T.cyw = 0; T.sh = 0; T.hp = 0; T.hyw = 0; T.hr = 0;
    T.flx = -D.FX; T.fly = 0; T.flz = 0.012; T.flp = 0; T.frx = D.FX; T.fry = 0; T.frz = -0.012; T.frp = 0;
    T.mo = 0;
    this.fk(0, 0.04, 0.09, 0, 0.2, 0.05, 0.35); this.fk(1, 0.04, 0.09, 0, 0.2, 0.05, 0.35);
  }
  stance(lz, rz, w = this.D.FX, lp = 0, rp = 0) { const T = this.T; T.flz = lz; T.frz = rz; T.flx = -w; T.frx = w; T.flp = lp; T.frp = rp; }

  pose(dt, E) {
    const s = this.s, T = this.T, D = this.D, a = this.anim, ta = this.ta, t = s.at, sc = s.g.scale.x;
    this.neutral();
    choreProps(this); // 擦甲板的刷子、小锤、缆绳：不干这几样活时收起来（A5）
    const r = RATE[a] || RATE.idle; this.kB = r[0]; this.kH = r[1]; this.kA = r[2];
    this.vis = 0; this.glanceW = 0; this.wsW = 0; this.envW = 1; this.swingA = 0; this.gaitK = 0; this.squint = 0;
    const aimD = Math.max(0.6, Math.hypot(E.wx - s.x, E.wz - s.z) / sc);
    if (a === 'walk') {
      T.cp = 0.07 + 0.02 * this.spd; T.hp = -0.05; T.py = -0.02;
      this.fk(0, 0.02, 0.08, 0, 0.24, 0.05, 0.3); this.fk(1, 0.02, 0.08, 0, 0.24, 0.05, 0.3);
      this.swingA = 0.42 * clamp(this.spd / 1.6, 0.3, 1.2); this.glanceW = 0.35;
    } else if (a === 'carry' || a === 'carryHeavy') {
      // 抱着走：重的腰往后仰、步子小、两脚分得开
      const heavy = a === 'carryHeavy', h = s.hold, mid = h && h.mid;
      T.cp = heavy ? -0.17 : -0.05; T.pp = heavy ? -0.04 : 0; T.pz = heavy ? 0.05 : 0.03; T.py = heavy ? -0.06 : -0.03; T.hp = heavy ? 0.06 : -0.06;
      const [hw, hh] = this.holdSize();
      const up = heavy ? 0.82 : mid ? 0.95 : 1.05, fwd = heavy ? 0.36 : 0.42;
      this.holdAt(0, up / sc, fwd / sc);
      for (let i = 0; i < 2; i++) { const sd = i ? 1 : -1; this.ikC(i, T.hcx + sd * (hw + 0.012), T.hcy - (heavy ? hh * 0.55 : 0.01), T.hcz - 0.01, sd, -0.45, -0.35, heavy ? -0.2 : 0.15, 0.85); }
      if (heavy) { T.mo = 0.22; this.squint = 0.35; this.ex = Math.min(1, this.ex + dt * 0.25); }
      this.gaitK = heavy ? 2 : 1; this.glanceW = 0.15;
    } else if (a === 'crouch') {
      // 屈膝蹲下（不是光弯腰）：屁股往后坐、背挺着、两手往前伸
      this.stance(0.1, -0.05, D.FX + 0.035, 0, 0.35);
      T.py = -0.5; T.pz = -0.08; T.pp = 0.24; T.cp = 0.42; T.hp = -0.32;
      const task = s.task;
      if (s.hold) {
        this.holdAt(0, 0.42, 0.45);
        const [hw] = this.holdSize();
        for (let i = 0; i < 2; i++) { const sd = i ? 1 : -1; this.ikC(i, T.hcx + sd * (hw + 0.012), T.hcy, T.hcz, sd, -0.4, -0.4, 0.1, 0.85); }
      } else if (task && task.type === 'check') {
        // 蹲着查看：一只手搭膝，一只手去摸
        this.ikG(0, -0.12, 0.5, 0.26, -1, 0, -0.5, 0.4, 0.5);
        this.ikG(1, 0.1, 0.22 + 0.03 * Math.sin(t * 2.3), 0.5, 1, -0.3, -0.6, 0.6, 0.3 + 0.3 * Math.sin(t * 1.7));
        T.hr = 0.12 * Math.sin(t * 0.7); T.hp = -0.15;
      } else {
        this.holdAt(0, 0.2, 0.45);
        const g = sstep(0.15, 0.45, ta);
        for (let i = 0; i < 2; i++) { const sd = i ? 1 : -1; this.ikG(i, sd * 0.17, 0.26, 0.45, sd, -0.3, -0.5, 0.3, 0.2 + 0.65 * g); }
      }
      this.envW = 0.4;
    } else if (a === 'lower') {
      // 蹲在围板边，把东西越过围板放下去：手跟着东西走，够不着了就松手
      this.stance(0.12, -0.08, D.FX + 0.03, 0, 0.3);
      T.py = -0.3; T.pp = 0.18; T.cp = 0.45; T.hp = -0.25; T.pz = -0.04;
      const h = s.hold;
      let held = false;
      if (h && h.mesh) {
        const m = h.mesh.position, [hw] = this.holdSize();
        this.fromDeck(_v, m.x, m.y - 1.32 - s.y, m.z);
        if (_v.z < 0.85 && _v.y > 0.05) { held = true; const x = _v.x, y = _v.y, z = _v.z; for (let i = 0; i < 2; i++) { const sd = i ? 1 : -1; this.ikG(i, x + sd * (hw + 0.012), y, z, sd, -0.4, -0.4, 0.2, 0.8); } }
      }
      if (!held) for (let i = 0; i < 2; i++) { const sd = i ? 1 : -1; this.ikG(i, sd * 0.17, 0.6, 0.6, sd, -0.3, -0.6, 0.25, 0.05); }
      this.envW = 0.5;
    } else if (a === 'hose') this.poseHose(dt, E, aimD);
    else if (a === 'coil') {
      // 盘缆：弯腰，右手在缆绳卷上方一圈圈绕，左手捋着缆
      const th = TAU * ta / 1.3;
      this.stance(0.08, -0.08, D.FX + 0.04);
      T.py = -0.12 + 0.015 * Math.sin(th); T.pp = 0.14; T.cp = 0.3 + 0.04 * Math.sin(th); T.cyw = 0.08 * Math.cos(th); T.cr = 0.04 * Math.sin(th); T.hp = -0.12;
      this.ikG(1, 0.08 + 0.17 * Math.cos(th), 0.72 + 0.12 * Math.sin(th), 0.5 + 0.12 * Math.sin(th), 1, -0.4, -0.6, 0.3, 0.9);
      this.ikG(0, -0.1, 0.86 + 0.03 * Math.sin(th + 1), 0.36, -1, -0.5, -0.4, 0.1, 0.9);
    } else if (a === 'look') {
      // 瞭望：右手搭凉棚，左手叉腰，慢慢扫一圈
      this.ikC(1, 0.03, NY + 0.22, 0.17, 1, -0.1, -0.2, -0.3, 0.1);
      this.ikC(0, -(D.tw / 2 + 0.01), 0.05, 0.02, -1, 0.3, -0.4, 0.4, 0.6);
      T.hp = -0.08; T.hyw = 0.38 * Math.sin(t * 0.42 + s.i); T.cyw = 0.1 * Math.sin(t * 0.42 + s.i);
      this.wsW = 1;
    } else if (a === 'operate') {
      if (s.role === 'captain') {
        // 掌舵：双手握舵轮，船一转舵轮跟着打
        this.wheel = lerp(this.wheel || 0, clamp(E.turn * 2.4, -1.6, 1.6), 1 - Math.exp(-dt * 3));
        for (let i = 0; i < 2; i++) {
          const sd = i ? 1 : -1, al = (i ? 0.6 : PI - 0.6) - this.wheel;
          this.ikG(i, 0.16 * Math.cos(al), 1.1 + 0.16 * Math.sin(al) * 0.94, 0.42 + 0.16 * Math.sin(al) * 0.34, sd, -0.6, -0.4, 0.1, 1);
        }
        T.cp = 0.08; T.hp = -0.03; this.glanceW = 0.6;
      } else {
        // 操纵吊臂：两手扳杆，眼睛跟着吊臂头
        for (let i = 0; i < 2; i++) { const sd = i ? 1 : -1; this.ikG(i, sd * 0.13, 1.0, 0.42 + 0.035 * Math.sin(t * 1.7 + sd * 1.3), sd, -0.6, -0.4, 0.3, 1); }
        T.cp = 0.07;
        if (E.tip) { const [yw, pt] = this.dirTo(E.tip[0], 6, E.tip[1]); T.hyw = clamp(yw, -1, 1) * 0.8; T.cyw = clamp(yw, -1, 1) * 0.2; T.hp = clamp(pt, -0.6, 0.2); }
      }
      this.wsW = 0.5;
    } else if (a === 'lean') {
      // 靠在栏杆上：两手撑着栏杆，一只脚别在后面，看海
      const rd = clamp((2.66 - Math.abs(s.x)) / Math.max(0.3, Math.abs(Math.sin(s.face))), 0.28, 0.7) / sc;
      for (let i = 0; i < 2; i++) { const sd = i ? 1 : -1; this.ikG(i, sd * 0.2, 0.78 / sc, rd, sd, -0.5, -0.3, -0.5, 0.8); }
      T.cp = 0.3; T.pp = 0.1; T.pz = -0.07; T.frx = 0.02; T.frz = -0.1; T.frp = 0.55;
      T.hyw = 0.3 * Math.sin(t * 0.3 + s.i); T.hp = -0.06;
    } else if (a === 'peer') {
      // 凑过来看（B18）：两手撑着膝盖弯下腰，脖子伸着、头抬起来看展示台上的东西；单号的人过一会儿伸手指一指，双号的歪歪头
      this.stance(0.07, -0.07, D.FX + 0.05, 0.1, 0.1);
      const b = sstep(0, 0.35, ta);
      T.py = -0.16 * b; T.pp = 0.22 * b; T.pz = -0.05 * b; T.cp = 0.05 + 0.32 * b; T.hp = -0.05 - 0.38 * b; T.mo = 0.25 * b;
      const point = s.i % 2 === 1 && ta > 0.7;
      for (let i = 0; i < 2; i++) {
        const sd = i ? 1 : -1;
        if (i === 1 && point) this.fk(1, 1.15 + 0.06 * Math.sin(t * 5), 0.08, 0, 0.08, 0, 0.92);
        else this.ikG(i, sd * 0.16, 0.5 - 0.06 * b, 0.17 + 0.05 * b, sd, 0.2, -0.5, 0.3, 0.75);
      }
      if (!point) T.hr = 0.14 * b * Math.sin(t * 0.8 + s.i);
      this.glanceW = 0; this.wsW = 0;
    } else if (a === 'cheer') this.poseCheer(dt, E);
    else if (a === 'nod') {
      // 点头：叉腰点两下（搬运手先拍两下手）
      // 点头：叉腰点两下，再竖个大拇指（搬运手先拍两下手）
      T.cp = -0.05; T.hp = ta < 1.0 ? 0.24 * Math.max(0, Math.sin(ta * 7.5)) : 0.04; T.mo = 0.12; T.hyw = 0.08 * Math.sin(ta * 2);
      if (this.D.carry && ta < 0.7) { const c = 0.5 + 0.5 * Math.cos(ta * TAU * 3); for (let i = 0; i < 2; i++) { const sd = i ? 1 : -1; this.ikC(i, sd * (0.02 + 0.13 * c), 0.33, D.td / 2 + 0.17, sd, -0.5, -0.4, 0, 0); } }
      else for (let i = 0; i < 2; i++) { const sd = i ? 1 : -1; this.ikC(i, sd * (D.tw / 2 + 0.01), 0.05, 0.02, sd, 0.3, -0.4, 0.4, 0.6); }
      if (ta > 0.55) { this.ikC(1, 0.12, 0.36, D.td / 2 + 0.24, 1, -0.7, -0.2, 0, 1, _qa); this.T.qa[1].slerp(_qa, sstep(0.55, 0.8, ta)); T.re = lerp(T.re, 1.5, sstep(0.55, 0.8, ta)); T.rg = 1; T.rw = 0; T.cp = -0.08; }
    } else if (a === 'climb') {
      const c = Math.sin(t * 7);
      this.fk(0, 2.5 + c * 0.4, 0.15, 0, 0.5, 0, 0.9); this.fk(1, 2.5 - c * 0.4, 0.15, 0, 0.5, 0, 0.9);
      T.fly = Math.max(0, c) * 0.25; T.fry = Math.max(0, -c) * 0.25; T.flz = 0.15; T.frz = 0.15; T.cp = 0.1;
    } else if (!poseChore(this, a, dt, E)) this.poseIdle(dt, E); // 擦甲板、蹲着敲、倒手收缆（A5，chores.js）
    this.layers(dt, E);
  }
  // 待机：各人的手势习惯轮着换；呼吸、重心、转头在 layers 里
  poseIdle(dt, E) {
    const T = this.T, D = this.D, t = this.s.at;
    this.idleT -= dt;
    if (this.idleT <= 0) { this.idleT = 7 + rnd() * 6; this.idleK = (this.idleK + 1) % this.styles.length; }
    const st = this.styles[this.idleK];
    if (st === 'behind') for (let i = 0; i < 2; i++) { const sd = i ? 1 : -1; this.ikC(i, sd * 0.05, 0.1, -(D.td / 2 + 0.09), sd, -0.2, -0.8, -0.2, 0.6); }
    else if (st === 'cross') { this.ikC(0, 0.13, 0.33, D.td / 2 + 0.09, -1, -0.6, -0.2, 0.2, 0.6); this.ikC(1, -0.13, 0.37, D.td / 2 + 0.06, 1, -0.6, -0.2, 0.2, 0.6); T.cp = 0.0; }
    else if (st === 'hips') for (let i = 0; i < 2; i++) { const sd = i ? 1 : -1; this.ikC(i, sd * (D.tw / 2 + 0.01), 0.05, 0.02, sd, 0.3, -0.4, 0.4, 0.6); }
    else if (st === 'rub') { const r = Math.sin(t * 9) * 0.018; for (let i = 0; i < 2; i++) { const sd = i ? 1 : -1; this.ikC(i, sd * 0.035 + r, 0.24, D.td / 2 + 0.13, sd, -0.6, -0.3, 0, 0.3); } T.hp = 0.06; }
    else { const sw = Math.sin(t * 1.1 + this.s.i) * 0.03; this.fk(0, 0.05 + sw, 0.1, 0.1, 0.22, 0.05, 0.35); this.fk(1, 0.05 - sw, 0.1, 0.1, 0.22, 0.05, 0.35); }
    this.glanceW = 1; this.wsW = 1;
  }
  // 冲洗：前后脚撑开，一手握枪把、一手托着枪管，水压一阵阵往后顶；按了加快就弓步、双手压住、后坐明显
  poseHose(dt, E, aimD) {
    const T = this.T, D = this.D, t = this.s.at, on = E.spraying, fast = on && E.fast;
    this.vis |= 1;
    if (!on) { this.stance(0.1, -0.06, D.FX + 0.02); T.py = -0.03; T.cp = 0.06; }
    else if (!fast) { this.stance(0.19, -0.15, D.FX + 0.035, 0, 0.15); T.py = -0.045; T.cp = 0.15; T.pz = -0.03; T.hp = -0.08; }
    else { this.stance(0.32, -0.38, D.FX + 0.05, 0, 0.5); T.py = -0.11; T.cp = 0.24; T.pp = 0.06; T.pz = -0.04; T.hp = 0.1; T.mo = 0.35; this.squint = 0.3; this.ex = Math.min(1, this.ex + dt * 0.4); }
    // 枪口指着泥包（俯角按距离），慢慢左右扫
    const pitch = on ? Math.atan2(0.75, Math.max(0.5, aimD - 0.4)) : 0.75;
    const pc = pitch - T.cp - T.pp, yaw = on ? 0.14 * Math.sin(t * 1.6 + this.s.i * 2) : 0.15;
    this.nzDt.set(Math.sin(yaw) * Math.cos(pc), -Math.sin(pc), Math.cos(yaw) * Math.cos(pc));
    if (fast) this.nzGt.set(0.07, 0.03, 0.36); else if (on) this.nzGt.set(0.11, 0.09, 0.3); else this.nzGt.set(0.13, 0.06, 0.26);
    const G = this.nzGt, Dn = this.nzDt;
    this.ikC(1, G.x, G.y - 0.01, G.z, 1, -0.6, -0.5, 0, 0.9);
    if (fast) this.ikC(0, G.x + Dn.x * 0.2, G.y + Dn.y * 0.2 + 0.05, G.z + Dn.z * 0.2, -1, -0.2, -0.4, -0.6, 0.5);
    else this.ikC(0, G.x + Dn.x * 0.22, G.y + Dn.y * 0.22 - 0.03, G.z + Dn.z * 0.22, -1, -0.5, -0.3, 0.1, 0.8);
    this.hoseOn = on; this.hoseFast = fast;
  }
  // 欢呼：蹲一下起跳、双手举过头、头顶拍手，旁边有人就互相击掌，没人就挥拳
  poseCheer(dt, E) {
    const T = this.T, D = this.D, s = this.s, c = this.ta % 2.2;
    T.hp = -0.2; T.mo = 0.5;
    this.jump = 0;
    if (c < 0.16) { T.cp = 0.15; T.py = -0.12; this.fk(0, -0.5, 0.15, 0, 0.3, 0, 0.6); this.fk(1, -0.5, 0.15, 0, 0.3, 0, 0.6); }
    else if (c < 0.8) {
      const u = (c - 0.16) / 0.46;
      this.jump = u < 1 ? 4 * u * (1 - u) : 0; if (u >= 1) T.py = -0.1 * Math.sin(PI * (c - 0.62) / 0.18);
      T.mo = 0.9; T.cp = -0.05;
      this.fk(0, 2.75, 0.45, 0, 0.15, 0, 0); this.fk(1, 2.75, 0.45, 0, 0.15, 0, 0);
    } else if (c < 1.5) {
      const op = 0.5 + 0.5 * Math.cos(TAU * 3 * (c - 0.8));
      for (let i = 0; i < 2; i++) { const sd = i ? 1 : -1; this.ikC(i, sd * (0.02 + 0.16 * op), NY + 0.42, 0.1, sd, 0, -0.5, 0, 0); }
      T.py = -0.03 * op; T.mo = 0.7;
    } else if (c < 2.05) {
      const b = s.buddy;
      if (b) {
        // 击掌：转向对方，右手迎上去，两只手在两人中间碰一下
        const mx = (s.x + b.x) / 2, mz = (s.z + b.z) / 2;
        this.fromDeck(_v, mx, 0, mz);
        const yw = clamp(Math.atan2(_v.x, _v.z), -1.2, 1.2), reach = sstep(1.5, 1.72, c) * (1 - sstep(1.82, 2.05, c));
        T.pyw = yw * 0.4; T.cyw = yw * 0.5; T.hyw = yw * 0.1;
        const d = Math.min(0.55, Math.hypot(_v.x, _v.z));
        this.ikG(1, Math.sin(yw) * d * reach + 0.12, 1.75, Math.cos(yw) * d * reach, 1, -0.3, -0.5, -0.3, 0);
        this.ikC(0, -(D.tw / 2 + 0.01), 0.05, 0.02, -1, 0.3, -0.4, 0.4, 0.6);
      } else {
        const pump = Math.abs(Math.sin((c - 1.5) * TAU * 1.8));
        this.fk(1, 2.3, 0.3, 0, 1.4 - 1.1 * pump, 0, 1); this.ikC(0, -(D.tw / 2 + 0.01), 0.05, 0.02, -1, 0.3, -0.4, 0.4, 0.6);
        T.py = -0.04 * pump;
      }
      T.mo = 0.6;
    }
    this.ex = Math.min(1, this.ex + dt * 0.2);
  }
  // 方向（甲板坐标的一点，y 是离甲板的高度）→ 身体坐标里的偏航、俯仰
  dirTo(x, y, z) { this.fromDeck(_v, x, 0, z); const yaw = Math.atan2(_v.x, _v.z), h = Math.hypot(_v.x, _v.z); return [yaw, -Math.atan2(y - 1.7, Math.max(0.5, h))]; }

  // 叠加：转头看海/看吊臂、重心左右换、随船倾斜、受击反应、船长手势
  layers(dt, E) {
    const s = this.s, T = this.T, D = this.D;
    const gl = this.gl;
    gl.t -= dt;
    if (gl.t <= 0) {
      gl.t = 2.2 + rnd() * 4;
      const r = rnd();
      if (r < 0.3) { gl.yaw = 0; gl.pitch = 0; }
      else if (r < 0.62) { gl.yaw = (rnd() < 0.5 ? -1 : 1) * (0.55 + rnd() * 0.5); gl.pitch = -0.04; }
      else if (r < 0.85 && E.tip) { const [yw, pt] = this.dirTo(E.tip[0], 6, E.tip[1]); gl.yaw = clamp(yw, -1.1, 1.1); gl.pitch = clamp(pt, -0.5, 0.1); }
      else { gl.yaw = (rnd() - 0.5) * 0.6; gl.pitch = 0.12 + rnd() * 0.15; }
    }
    if (this.glanceW > 0) { T.hyw += gl.yaw * this.glanceW * 0.75; T.cyw += gl.yaw * this.glanceW * 0.2; T.hp += gl.pitch * this.glanceW; }
    // 重心左右换：吃重那边胯高一点，另一条腿放松、脚往前一点、脚跟抬起
    this.wsT -= dt;
    if (this.wsT <= 0) { this.wsT = 3 + rnd() * 4.5; this.wsTo = this.wsTo ? (rnd() < 0.35 ? 0 : -this.wsTo) : (rnd() < 0.5 ? -1 : 1); }
    this.ws += (this.wsTo - this.ws) * (1 - Math.exp(-dt * 1.8));
    if (this.wsW > 0) {
      const w = this.ws * this.wsW;
      T.px += w * 0.032; T.pr += w * 0.035; T.cr -= w * 0.03; T.hr += w * 0.02;
      if (w > 0) { T.flz += 0.05 * w; T.flx += 0.02 * w; T.flp += 0.12 * w; } else { T.frz -= 0.05 * w; T.frx += 0.02 * w; T.frp -= 0.12 * w; }
    }
    // 随船倾斜：往弯里倒、加速前倾、减速后仰；风大时也微微前倾
    const sf = Math.sin(s.face), cf = Math.cos(s.face);
    const lx = clamp(E.lat * 0.035, -0.22, 0.22), lz = clamp(E.lon * 0.03, -0.12, 0.12) + E.wind * 0.04;
    const bx = (lx * cf - lz * sf) * this.envW, bz = (lx * sf + lz * cf) * this.envW;
    T.pp += bz * 0.4; T.cp += bz * 0.6; T.pr -= bx * 0.4; T.cr -= bx * 0.6;
    const spread = Math.min(0.06, Math.abs(bx) * 0.25 + Math.abs(bz) * 0.15); T.flx -= spread; T.frx += spread;
    this.kMul = 1;
    if (this.re) this.reactLayer(dt);
    if (this.gest) this.gestLayer(dt, E);
    this.ex = Math.max(0, this.ex - dt / 6);
  }

  // ———— 受击类反应：crew.js 调 react() ————
  // stumble 往前冲一步张手稳住；brace 扶栏杆；fall 摔坐—爬起—拍裤子；flinch 一缩、抬手挡脸、退半步；startle 一愣、扭头看；shrug 耸耸肩
  react(type, o = {}) {
    const B = this.B, cur = this.re;
    if (cur && cur.type === 'fall' && type !== 'fall') return;
    if (cur && cur.type === type && cur.t < 0.3) return;
    const re = { type, t: -(o.delay || 0), str: o.str || 1, dx: 0, dz: 1, sx: 0, sz: 1 };
    const s = this.s;
    if (o.dz != null) { const sf = Math.sin(s.face), cf = Math.cos(s.face); re.dx = -o.dz * sf; re.dz = o.dz * cf; }
    if (o.x != null) { this.fromDeck(_v, o.x, 0, o.z); const L = Math.hypot(_v.x, _v.z) || 1; re.sx = _v.x / L; re.sz = _v.z / L; }
    re.foot = re.dz * (B.flz - B.frz) + re.dx * (B.flx - B.frx) < 0 ? -1 : 1;
    if (type === 'flinch') { re.foot = re.sz * (B.flz - B.frz) + re.sx * (B.flx - B.frx) > 0 ? -1 : 1; re.dur = 0.55 + 0.35 * re.str; }
    else if (type === 'startle') re.dur = 0.9;
    else if (type === 'look') re.dur = o.dur || 1.9;
    else if (type === 'shout') re.dur = 1.35;
    else if (type === 'fall') re.dur = 3.3;
    else if (type === 'shrug') { re.dur = o.dur || (o.soft ? 1.5 : 1.6); re.soft = !!o.soft; }
    else re.dur = 1.05;
    if (type === 'brace' && o.railX != null) { this.fromDeck(_v, o.railX, 0.78, o.railZ); re.rail = [_v.x, _v.y, _v.z]; re.side = _v.x > 0 ? 1 : 0; }
    re.keep = !!o.keepArms;
    this.re = re;
  }
  reactLayer(dt) {
    const re = this.re, T = this.T, D = this.D, s = this.s;
    re.t += dt;
    if (re.t > re.dur) { this.re = null; return; }
    if (re.t < 0) return;
    let u = re.t;
    const sdf = (i) => (i ? 1 : -1);
    const foot = (f, ddx, ddz, st, lift) => { if (f < 0) { T.flx += ddx * st; T.flz += ddz * st; T.fly += lift; } else { T.frx += ddx * st; T.frz += ddz * st; T.fry += lift; } };
    if (re.type === 'stumble' || re.type === 'brace' || (re.type === 'fall' && u < 0.32)) {
      const str = re.type === 'fall' ? 1.3 : re.str, w = env3(u, 0.07, re.type === 'fall' ? 0.4 : 0.45, 1.05) * str;
      T.pp += re.dz * 0.16 * w; T.pr -= re.dx * 0.14 * w; T.cp += re.dz * 0.26 * w; T.cr -= re.dx * 0.22 * w;
      T.px += re.dx * 0.05 * w; T.pz += re.dz * 0.05 * w; T.py -= 0.04 * w; T.hp -= re.dz * 0.18 * w; T.mo = Math.max(T.mo, 0.6 * Math.min(1, w));
      // 落后的那只脚往冲的方向迈一步，稳住后再收回来
      const st = sstep(0.06, 0.34, u) * (1 - sstep(0.72, 1.05, u)) * Math.min(1.3, str);
      const lift = Math.sin(clamp((u - 0.06) / 0.28, 0, 1) * PI) * 0.09 + Math.sin(clamp((u - 0.72) / 0.33, 0, 1) * PI) * 0.06;
      foot(re.foot, re.dx * 0.24, re.dz * 0.32, st, lift);
      if (!re.keep) {
        const wa = clamp(w, 0, 1);
        for (let i = 0; i < 2; i++) {
          const sd = sdf(i);
          if (re.type === 'brace' && re.rail && i === re.side) { this.ikG(i, re.rail[0], re.rail[1], re.rail[2], sd, -0.4, -0.4, -0.4, 1, _qa); this.T.qa[i].slerp(_qa, env3(u, 0.1, 0.8, 1.05)); if (i) T.rg = 1; else T.lg = 1; continue; }
          this.fk(i, 0.55 + re.dz * 0.3, 0.95, 0, 0, 0, 0, _qa); this.T.qa[i].slerp(_qa, wa);
          if (i) { T.re = lerp(T.re, 0.5, wa); T.rg = lerp(T.rg, 0, wa); } else { T.le = lerp(T.le, 0.5, wa); T.lg = lerp(T.lg, 0, wa); }
        }
      }
      this.kMul = 1 + 2.2 * env3(u, 0.02, 0.5, 0.9);
      this.squint = Math.max(this.squint, 0.4 * w);
      if (re.type !== 'fall') return;
    }
    if (re.type === 'fall') {
      // 有活要干（人被叫走了）就赶紧爬起来
      if (this.spd > 0.35 && u < 2.3) { re.t = u = 2.3; }
      const sit = sstep(0.2, 0.5, u) * (1 - sstep(1.55, 2.1, u));
      const kneel = sstep(1.5, 1.85, u) * (1 - sstep(2.05, 2.45, u));
      const dust = sstep(2.3, 2.45, u) * (1 - sstep(2.95, 3.3, u));
      const bump = u > 0.5 ? Math.exp(-(u - 0.5) * 7) : 0;
      if (sit > 0) {
        T.py = lerp(T.py, -0.78, sit); T.pz = lerp(T.pz, -0.04, sit); T.pp = lerp(T.pp, -0.28, sit); T.cp = lerp(T.cp, -0.08 - 0.25 * bump, sit);
        T.flz = lerp(T.flz, 0.44, sit); T.frz = lerp(T.frz, 0.34, sit); T.flx = lerp(T.flx, -0.17, sit); T.frx = lerp(T.frx, 0.18, sit);
        T.flp = lerp(T.flp, -0.7, sit); T.frp = lerp(T.frp, -0.45, sit); T.fly = lerp(T.fly, 0.0, sit); T.fry = lerp(T.fry, 0.02, sit);
        for (let i = 0; i < 2; i++) { const sd = sdf(i); this.ikG(i, sd * 0.28, 0.06, -0.2, sd, 0.3, -0.4, -0.8, 0.2, _qa); this.T.qa[i].slerp(_qa, sit); if (i) T.re = lerp(T.re, 0.1, sit); else T.le = lerp(T.le, 0.1, sit); }
        // 晃晃脑袋、哎哟一声
        const daze = sstep(0.6, 0.8, u) * (1 - sstep(1.3, 1.5, u));
        T.hyw += 0.28 * Math.sin(u * 13) * daze * sit; T.hp += 0.12 * sit; T.mo = Math.max(T.mo, (0.3 + 0.5 * bump) * sit);
        this.squint = Math.max(this.squint, 0.7 * bump);
      }
      if (kneel > 0) {
        T.py = lerp(T.py, -0.42, kneel); T.pz = lerp(T.pz, 0.0, kneel); T.pp = lerp(T.pp, 0.18, kneel); T.cp = lerp(T.cp, 0.32, kneel);
        T.flx = lerp(T.flx, -0.13, kneel); T.flz = lerp(T.flz, 0.3, kneel); T.flp = lerp(T.flp, 0, kneel); T.fly = lerp(T.fly, 0, kneel);
        T.frx = lerp(T.frx, 0.13, kneel); T.frz = lerp(T.frz, -0.36, kneel); T.frp = lerp(T.frp, 1.15, kneel); T.fry = lerp(T.fry, -0.02, kneel);
        this.ikG(0, -0.12, 0.42, 0.3, -1, 0, -0.6, 0.3, 0.7, _qa); this.T.qa[0].slerp(_qa, kneel);
        this.ikG(1, 0.14, 0.46, 0.12, 1, 0, -0.6, 0.3, 0.7, _qa); this.T.qa[1].slerp(_qa, kneel);
        T.hp = lerp(T.hp, -0.2, kneel);
      }
      if (dust > 0) {
        // 站起来拍拍裤子：一手拍屁股，一手拍大腿，回头看一眼
        const pat = Math.sin(u * 22);
        T.cp = lerp(T.cp, 0.26, dust); T.pp = lerp(T.pp, 0.06, dust); T.hp = lerp(T.hp, 0.3, dust); T.hyw = lerp(T.hyw, -0.35, dust);
        this.ikG(1, 0.13, 0.86 + 0.035 * pat, -0.17, 1, 0.2, -0.3, 0.4, 0.1, _qa); this.T.qa[1].slerp(_qa, dust);
        this.ikG(0, -0.13, 0.62 + 0.03 * Math.sin(u * 22 + 1.6), 0.13, -1, -0.2, -0.4, 0.4, 0.1, _qa); this.T.qa[0].slerp(_qa, dust);
      }
      this.kMul = 1.6; this.envW = 0;
      return;
    }
    if (re.type === 'flinch') {
      // 泥包砸下来：往反方向一缩、耸肩、扭脸、闭眼、抬手挡脸，退半步
      const w = env3(u, 0.05, 0.25 + 0.2 * re.str, re.dur) * Math.min(1, re.str);
      T.pp -= re.sz * 0.04 * w; T.pr += re.sx * 0.06 * w; T.cp += 0.12 * w; T.cr += re.sx * 0.12 * w; T.pz -= re.sz * 0.03 * w;
      T.py -= 0.09 * w; T.sh += 0.045 * w; T.hyw += -(Math.sign(re.sx) || 1) * 0.45 * w; T.hp += 0.18 * w; T.mo = Math.max(T.mo, 0.4 * w);
      for (let i = 0; i < 2; i++) { const sd = sdf(i); this.ikC(i, sd * 0.07 + re.sx * 0.06, NY + 0.16, D.td / 2 + 0.17, sd, -0.6, -0.3, -0.2, 0.15, _qa); this.T.qa[i].slerp(_qa, w); if (i) T.re = lerp(T.re, 1.9, w); else T.le = lerp(T.le, 1.9, w); }
      const st = sstep(0.04, 0.22, u) * (1 - sstep(re.dur - 0.3, re.dur, u));
      foot(re.foot, -re.sx * 0.12, -re.sz * 0.14, st, Math.sin(clamp((u - 0.04) / 0.18, 0, 1) * PI) * 0.06);
      this.squint = Math.max(this.squint, w);
      this.kMul = 1 + 2.5 * env3(u, 0.02, 0.3, 0.6);
      return;
    }
    if (re.type === 'startle') {
      const w = env3(u, 0.08, 0.5, 0.9) * re.str;
      T.hyw += clamp(Math.atan2(re.sx, re.sz), -1, 1) * 0.8 * w; T.cp -= 0.05 * w; T.sh += 0.02 * w;
      if (u < 0.12) this.squint = 1;
      this.kMul = 1.5;
    }
    // 转头看（W2 前方浅滩：船员都扭过去看船头那边）：头、胸、胯一起转过去，眯眼，看一会儿再转回来
    if (re.type === 'look') {
      const w = env3(u, 0.2, re.dur - 0.45, re.dur) * Math.min(1, re.str), yw = clamp(Math.atan2(re.sx, re.sz), -1.7, 1.7);
      T.hyw += yw * 0.7 * w; T.cyw += yw * 0.3 * w; T.pyw += yw * 0.12 * w; T.hp -= 0.06 * w; T.cp += 0.04 * w;
      this.squint = Math.max(this.squint, 0.35 * w);
    }
    // 喊（W2 再近：“浅了！”）：探身朝着那边，一只手拢在嘴边，另一只手指过去，嘴张两下（一长一短）
    if (re.type === 'shout') {
      const w = env3(u, 0.1, re.dur - 0.3, re.dur), yw = clamp(Math.atan2(re.sx, re.sz), -1.4, 1.4), pt = 0.12;
      T.cyw += yw * 0.35 * w; T.hyw += yw * 0.45 * w; T.cp += 0.12 * w; T.hp -= 0.14 * w; T.pz += 0.03 * w;
      const say = (u > 0.05 && u < 0.38 ? 1 : 0) + (u > 0.42 && u < 0.58 ? 0.7 : 0);
      T.mo = Math.max(T.mo, 0.95 * say * w);
      this.ikC(0, -0.07, NY + 0.1, D.td / 2 + 0.15, -1, -0.6, -0.3, 0.3, 0.3, _qa); this.T.qa[0].slerp(_qa, w); T.le = lerp(T.le, 2.1, w);
      const r = 0.62;
      this.ikG(1, D.SX + Math.sin(yw) * Math.cos(pt) * r, 1.47 + Math.sin(pt) * r, Math.cos(yw) * Math.cos(pt) * r, 1, -0.5, -0.3, -0.2, 0.1, _qa);
      this.T.qa[1].slerp(_qa, w); T.re = lerp(T.re, 0.15, w); T.rg = lerp(T.rg, 0.1, w);
      this.kMul = 1.6;
    }
    // 耸肩（C3 空网、C12 没油、F9 第一次空网）：扭头看过去，两肩一抬、两只手往两边一摊（手张开、手心朝上）、头一歪、嘴一撇，再放下
    // soft：只摇摇头、胸口一塌（叹口气），手不动
    if (re.type === 'shrug') {
      const w = env3(u, 0.2, re.dur - 0.45, re.dur), yw = clamp(Math.atan2(re.sx, re.sz), -1.3, 1.3);
      T.hyw += yw * 0.55 * w; T.cyw += yw * 0.2 * w;
      if (re.soft) {
        const sh = sstep(0.25, 0.4, u) * (1 - sstep(1.0, 1.25, u));
        T.hyw += 0.22 * Math.sin((u - 0.25) * 12) * sh; T.cp += 0.06 * w; T.hp += 0.12 * w; T.sh -= 0.02 * w;
        return;
      }
      const up = sstep(0.15, 0.35, u) * (1 - sstep(0.85, 1.15, u));
      T.sh += 0.1 * up; T.hr += 0.2 * up * (yw >= 0 ? -1 : 1); T.hp -= 0.04 * up; T.cp -= 0.03 * w; T.mo = Math.max(T.mo, 0.15 * up);
      for (let i = 0; i < 2; i++) {
        const sd = sdf(i);
        this.ikC(i, sd * (0.32 + 0.12 * up), 0.17 + 0.07 * up, D.td / 2 + 0.16 + 0.06 * up, sd * 0.7, -0.7, -0.3, -0.5, 0, _qa);
        this.T.qa[i].slerp(_qa, w);
        if (i) { T.re = lerp(T.re, 1.45, w); T.rw = lerp(T.rw, 1.3, w); T.rg = lerp(T.rg, 0, w); } else { T.le = lerp(T.le, 1.45, w); T.lw = lerp(T.lw, 1.3, w); T.lg = lerp(T.lg, 0, w); }
      }
      this.squint = Math.max(this.squint, 0.25 * w);
      this.kMul = 1.4;
    }
  }
  // ———— 船长的指挥手势：下网时指向臂端再打下放手势；开船时挥手 ————
  // quick：下网那一下的“放！”——不等上一个手势做完，抬手更快，0.35 秒就往下压两下（B4）
  gesture(type, o = {}) { if (!o.quick && this.gest && this.gest.t < this.gest.dur - 0.3) return; this.gest = { type, t: 0, dur: type === 'point' ? (o.quick ? 1.9 : 2.5) : 1.7, x: o.x, z: o.z, quick: !!o.quick }; }
  gestLayer(dt, E) {
    const g = this.gest, T = this.T;
    g.t += dt;
    if (g.t > g.dur) { this.gest = null; return; }
    const u = g.t;
    if (g.type === 'point') {
      const q = g.quick, w = q ? env3(u, 0.12, 1.5, 1.9) : env3(u, 0.3, 2.1, 2.5);
      const [yw0, pt0] = this.dirTo(g.x ?? 0, 6, g.z ?? -6);
      const yw = clamp(yw0, -1.4, 1.4), pt = clamp(-pt0, -0.1, 0.7);
      const s0 = q ? 0.35 : 1.3, sig = u > s0 && (!q || u < s0 + 0.7) ? Math.abs(Math.sin((u - s0) * 9)) * (q ? 0.5 : 0.35) : 0;
      const r = 0.6;
      this.ikG(1, this.D.SX + Math.sin(yw) * Math.cos(pt) * r, 1.47 + Math.sin(pt) * r - sig * 0.4, Math.cos(yw) * Math.cos(pt) * r, 1, -0.5, -0.3, -0.2 + sig, 0.1, _qa);
      T.qa[1].slerp(_qa, w); T.re = lerp(T.re, 0.15 + sig * 1.2, w); T.rg = lerp(T.rg, 0.1, w);
      T.hyw = lerp(T.hyw, yw * 0.8, w); T.hp = lerp(T.hp, -pt * 0.7, w); T.cyw += yw * 0.25 * w; T.mo = Math.max(T.mo, u > 0.4 && u < 1.0 ? 0.35 : 0);
    } else {
      const w = env3(u, 0.25, 1.3, 1.7);
      this.fk(1, 2.5, 0.55 + 0.35 * Math.sin(u * 15), 0, 0.5, 0, 0, _qa);
      T.qa[1].slerp(_qa, w); T.re = lerp(T.re, 0.5, w); T.rg = lerp(T.rg, 0, w); T.hp = lerp(T.hp, -0.1, w); T.mo = Math.max(T.mo, u > 0.3 && u < 1.0 ? 0.45 : 0);
    }
  }

  // ———— 双级平滑：目标 → A → B ————
  smooth(dt) {
    const T = this.T, A = this.A, B = this.B;
    const rm = (0.3 + 0.7 * this.ramp * this.ramp) * this.kMul;
    const al = this._al || (this._al = new Float32Array(5));
    al[0] = 1 - Math.exp(-dt * this.kB * rm); al[1] = 1 - Math.exp(-dt * this.kH * rm); al[2] = 1 - Math.exp(-dt * this.kA * rm); al[3] = 1 - Math.exp(-dt * 16 * rm); al[4] = 1 - Math.exp(-dt * 18);
    for (let i = 0; i < SC.length; i++) { const k = SC[i], a = al[GRP[i]]; A[k] += (T[k] - A[k]) * a; B[k] += (A[k] - B[k]) * a; }
    for (let i = 0; i < 2; i++) { A.qa[i].slerp(T.qa[i], al[2]); B.qa[i].slerp(A.qa[i], al[2]); }
    this.nzG.lerp(this.nzGt, al[2]); this.nzD.lerp(this.nzDt, al[2]).normalize();
  }
  // ———— 平滑之后直接叠的快动作：步态、呼吸、后坐、命中一顿、起跳 ————
  post(dt, E) {
    const B = this.B, F = this.F, s = this.s, t = s.at;
    for (const k of SC) F[k] = B[k];
    F.qa[0].copy(B.qa[0]); F.qa[1].copy(B.qa[1]);
    // 步态：左脚 ph=0 落地，右脚差半拍
    const gw = this.gw;
    if (gw > 0.002) {
      const K = this.gaitK, duty = K === 2 ? 0.66 : K === 1 ? 0.6 : 0.55, lift = K === 2 ? 0.05 : K === 1 ? 0.065 : 0.095;
      const S = duty * this.cyc / 2 * this.mv, wid = this.D.FX + (K === 2 ? 0.04 : K === 1 ? 0.02 : 0);
      for (let i = 0; i < 2; i++) {
        const p = frac(this.ph + (i ? 0.5 : 0));
        let z, y, pit;
        if (p < duty) { const u = p / duty; z = S * (1 - 2 * u); y = 0; pit = (u < 0.15 ? -0.3 * (1 - u / 0.15) : u > 0.65 ? 0.55 * ((u - 0.65) / 0.35) ** 2 : 0) * (0.3 + 0.7 * this.mv); }
        else { const u = (p - duty) / (1 - duty), e = u * u * (3 - 2 * u); z = -S + 2 * S * e; y = lift * Math.sin(PI * u); pit = lerp(0.55, -0.3, e) * (0.3 + 0.7 * this.mv); }
        const sd = i ? 1 : -1;
        if (i) { F.frx = lerp(F.frx, sd * wid, gw); F.fry = lerp(F.fry, y, gw); F.frz = lerp(F.frz, z, gw); F.frp = lerp(F.frp, pit, gw); }
        else { F.flx = lerp(F.flx, sd * wid, gw); F.fly = lerp(F.fly, y, gw); F.flz = lerp(F.flz, z, gw); F.flp = lerp(F.flp, pit, gw); }
      }
      const ph = this.ph * TAU, c1 = Math.cos(ph), s1 = Math.sin(ph), m = gw * this.mv;
      const sway = K === 2 ? 0.04 : K === 1 ? 0.03 : 0.022, yawA = K === 2 ? 0.05 : K === 1 ? 0.07 : 0.12;
      F.py += (-0.028 * Math.cos(2 * ph) - 0.012) * m; F.pyw += yawA * c1 * m; F.px -= sway * s1 * gw; F.pr -= (K === 2 ? 0.06 : 0.04) * s1 * gw;
      F.cyw -= yawA * 1.3 * c1 * m; F.cr += 0.5 * (K === 2 ? 0.06 : 0.04) * s1 * gw; F.hyw += yawA * 0.3 * c1 * m; F.hp += 0.03 * Math.cos(2 * ph) * m;
      // 反向摆臂：左脚在前时右手在前
      const sw = this.swingA * c1 * m;
      if (sw) { for (let i = 0; i < 2; i++) { const a = i ? sw : -sw; _q.setFromAxisAngle(_X, -a); F.qa[i].premultiply(_q); if (i) F.re += 0.25 * Math.max(0, a); else F.le += 0.25 * Math.max(0, a); } }
    }
    // 呼吸：胸口起伏；累了喘得快、嘴微张
    const bp = lerp(this.breathP, 1.6, this.ex);
    this.bph += dt / bp; const br = Math.sin(this.bph * TAU); this.br = br * (1 + this.ex);
    F.cp -= br * 0.014 * (1 + this.ex); F.sh += br * 0.008 * (1 + this.ex); F.hp += br * 0.008;
    if (this.ex > 0.35) F.mo = Math.max(F.mo, (br * 0.5 + 0.5) * 0.3 * this.ex);
    // 水枪后坐：水压一阵阵顶，加快时又密又狠
    if (this.anim === 'hose' && this.hoseOn) {
      this.recT -= dt;
      if (this.recT <= 0) { this.recT = this.hoseFast ? 0.22 + rnd() * 0.2 : 0.5 + rnd() * 0.5; this.recV -= this.hoseFast ? 3.2 : 1.3; }
    }
    this.recV += (-170 * this.rec - 13 * this.recV) * dt; this.rec += this.recV * dt;
    const vib = this.anim === 'hose' && this.hoseOn ? Math.sin(t * 47) * (this.hoseFast ? 0.012 : 0.005) + Math.sin(t * 31) * 0.004 : 0;
    this.kick = this.rec * 0.9 + vib;
    F.cp += this.rec * 0.9 + vib * 0.5; F.pz += this.rec * 0.25;
    // 起跳：身子、脚一起离地，腿收一下
    if (this.anim === 'cheer' && this.jump > 0) { const j = this.jump * 0.24; F.py += j; F.fly += j * 0.85; F.fry += j * 0.85; F.flp += 0.4 * this.jump; F.frp += 0.4 * this.jump; }
    // 腿够得着：骨盆不比腿长还高（大步、下蹲时膝盖自然弯）
    for (let i = 0; i < 2; i++) {
      const sd = i ? 1 : -1, fx = i ? F.frx : F.flx, fz = i ? F.frz : F.flz, fy = i ? F.fry : F.fly, fp = i ? F.frp : F.flp;
      const ay = AH + fy + (fp < 0 ? 0.07 * Math.sin(-fp) : 0.15 * Math.sin(fp));
      const dx = F.px + sd * HX - fx, dz = F.pz - fz, R2 = 0.812 * 0.812;
      const top = ay + Math.sqrt(Math.max(0.0004, R2 - dx * dx - dz * dz)) - (HIPY - 0.02);
      if (F.py > top) F.py = top;
    }
  }
  // ———— 摆骨架 ————
  apply(dt, E) {
    const F = this.F, P = this.P, s = this.s, D = this.D, t = s.at;
    P.hips.position.set(F.px, HIPY + F.py, F.pz);
    P.hips.rotation.set(F.pp, F.pyw, F.pr);
    _e.set(F.cp, F.cyw, F.cr, 'YXZ'); _qC.setFromEuler(_e);
    P.torso.quaternion.copy(_qC);
    const br = this.br; P.torso.scale.set(1 + br * 0.012, 1 + br * 0.006, 1 + br * 0.022);
    _v.set(0, NY, 0).applyQuaternion(_qC); P.head.position.set(_v.x, TY + _v.y, _v.z);
    _e.set(F.hp, F.hyw, F.hr, 'YXZ'); _q.setFromEuler(_e); P.head.quaternion.copy(_qC).multiply(_q);
    for (let i = 0; i < 2; i++) {
      const sd = i ? 1 : -1, A = i ? P.armR : P.armL;
      _v.set(sd * D.SX, SY + F.sh, 0).applyQuaternion(_qC); A.upper.position.set(_v.x, TY + _v.y, _v.z);
      A.upper.quaternion.copy(_qC).multiply(F.qa[i]);
      if (this.kick && this.anim === 'hose') { _q.setFromAxisAngle(_X, this.kick * 0.6); A.upper.quaternion.premultiply(_q2.copy(_qC).invert()).premultiply(_q).premultiply(_qC); }
      A.fore.rotation.x = -(i ? F.re : F.le);
      A.hand.rotation.x = -(i ? F.rw : F.lw);
      A.fing.rotation.z = -sd * 1.5 * clamp(i ? F.rg : F.lg, 0, 1);
    }
    // 腿：两节 IK；脚掌按目标俯仰摆平
    P.hips.updateMatrix(); _mi.copy(P.hips.matrix).invert();
    for (let i = 0; i < 2; i++) {
      const sd = i ? 1 : -1, L = i ? P.legR : P.legL;
      const fx = i ? F.frx : F.flx, fy = i ? F.fry : F.fly, fz = i ? F.frz : F.flz, fp = i ? F.frp : F.flp;
      _P.set(fx, AH + fy + (fp < 0 ? 0.07 * Math.sin(-fp) : 0.15 * Math.sin(fp)), fz).applyMatrix4(_mi);
      _pole.set(sd * 0.15, 0, 1);
      L.shin.rotation.x = ik2(L.thigh.position, _P, _pole, TL, SL, true, L.thigh.quaternion);
      _e.set(fp, sd * 0.09, 0, 'YXZ'); _q2.setFromEuler(_e);
      _q.copy(P.hips.quaternion).multiply(L.thigh.quaternion).multiply(L.shin.quaternion).invert();
      L.foot.quaternion.copy(_q).multiply(_q2);
      // 衣摆跟着大腿摆，风大时往后飘
      const hm = P.hem[i];
      if (hm) {
        _v.set(0, -1, 0).applyQuaternion(L.thigh.quaternion);
        const pit = Math.atan2(_v.z, -_v.y), rol = Math.atan2(_v.x, -_v.y);
        hm.rotation.set(-clamp(pit, -0.25, 1.3) * 0.48 + E.wind * (0.12 + 0.06 * Math.sin(t * 13 + i * 2)), 0, clamp(rol, -0.3, 0.3) * 0.5);
      }
    }
    // 眨眼（偶尔连眨两下）、眯眼、张嘴
    this.blinkT -= dt;
    if (this.blinkT <= 0) { this.blinkD = 0.13; this.blinkT = rnd() < 0.18 ? 0.28 : 2 + rnd() * 3.5; }
    let eo = 1; if (this.blinkD > 0) { this.blinkD -= dt; eo = 0.12; }
    P.eyes.scale.y = Math.min(eo, 1 - this.squint * 0.85);
    P.mouth.scale.set(1 - F.mo * 0.25, 1 + F.mo * 3.4, 1);
    // 道具
    P.nozzle.visible = !!(this.vis & 1);
    if (this.vis & 1) {
      P.nozzle.position.copy(this.nzG);
      P.nozzle.quaternion.setFromUnitVectors(_Z, this.nzD);
      if (this.kick) { _q.setFromAxisAngle(_X, this.kick * 0.6); P.nozzle.quaternion.premultiply(_q); _v.copy(this.nzG); _v.y -= SY; _v.applyQuaternion(_q); _v.y += SY; P.nozzle.position.copy(_v); }
    }
  }
  // 手里东西的中心（甲板坐标）：按平滑后的胸来摆，跟着身子起伏
  holdDeck(out) {
    const P = this.P, F = this.F;
    out.set(F.hcx, F.hcy, F.hcz);
    P.torso.updateMatrix(); out.applyMatrix4(P.torso.matrix);
    P.hips.updateMatrix(); out.applyMatrix4(P.hips.matrix);
    this.s.g.updateMatrix(); return out.applyMatrix4(this.s.g.matrix);
  }
  // 水枪口（甲板坐标）：水柱从这里出去；没拿水枪时返回 false
  tipDeck(out) {
    if (!(this.vis & 1)) return false;
    const P = this.P;
    P.nozzle.updateMatrix(); out.set(0, 0, 0.42).applyMatrix4(P.nozzle.matrix);
    P.torso.updateMatrix(); out.applyMatrix4(P.torso.matrix);
    P.hips.updateMatrix(); out.applyMatrix4(P.hips.matrix);
    this.s.g.updateMatrix(); out.applyMatrix4(this.s.g.matrix);
    return true;
  }
}

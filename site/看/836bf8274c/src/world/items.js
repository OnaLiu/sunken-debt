import * as THREE from 'three';
import { GeoBuilder } from '../util/builder.js';
import { toon } from '../render/materials.js';
import { mulberry32 } from '../util/math.js';
import { model as assetModel } from '../assets/assets.js';

// 打捞物的模型。每件都由“哑光”和“金属”两种材质拼成，两种材质都带泥壳：
// 海底时薄薄一层淤泥和附着，上甲板时厚泥包住，冲洗时一点点退掉。

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const col = (r, g, b) => new THREE.Color(r, g, b);

const PAL = {
  brass: col(0.88, 0.68, 0.3),
  brassDark: col(0.6, 0.42, 0.18),
  bronze: col(0.72, 0.5, 0.28),
  iron: col(0.36, 0.3, 0.27),
  rust: col(0.55, 0.32, 0.2),
  wood: col(0.5, 0.36, 0.22),
  woodDark: col(0.34, 0.24, 0.15),
  oak: col(0.42, 0.3, 0.19),
  clay: col(0.76, 0.44, 0.28),
  clayDark: col(0.56, 0.3, 0.2),
  glaze: col(0.36, 0.42, 0.3),
  copper: col(0.8, 0.46, 0.3),
  patina: col(0.38, 0.62, 0.52),
  rope: col(0.62, 0.52, 0.36),
  canvas: col(0.66, 0.6, 0.46),
  lead: col(0.5, 0.52, 0.55),
  silver: col(0.92, 0.93, 0.96),
  silverDark: col(0.62, 0.64, 0.68),
  wax: col(0.62, 0.16, 0.12),
  glass: col(0.55, 0.7, 0.66),
};

function lathe(b, prof, segs, color, y0 = 0, cx = 0, cz = 0, colorFn = null) {
  // prof: [[r, y], ...] 从下到上
  for (let j = 0; j < prof.length - 1; j++) {
    const [r0, h0] = prof[j], [r1, h1] = prof[j + 1];
    for (let i = 0; i < segs; i++) {
      const a0 = (i / segs) * Math.PI * 2, a1 = ((i + 1) / segs) * Math.PI * 2;
      const p00 = V(cx + Math.cos(a0) * r0, y0 + h0, cz + Math.sin(a0) * r0);
      const p10 = V(cx + Math.cos(a1) * r0, y0 + h0, cz + Math.sin(a1) * r0);
      const p11 = V(cx + Math.cos(a1) * r1, y0 + h1, cz + Math.sin(a1) * r1);
      const p01 = V(cx + Math.cos(a0) * r1, y0 + h1, cz + Math.sin(a0) * r1);
      const c = colorFn ? colorFn(j, i) : color;
      b.quad(p00, p01, p11, p10, c);
    }
  }
}

// 和 lathe 一样的形状，但每个面再切成 su×sv 小块（小块都在原来那个面上，外形一点不变），
// 好按小块上色：画花纹、附着、补丁。paint(j, i, u, v)：第 j 段、第 i 面、面里第 u 列第 v 行（从下往上）
function lathePaint(b, prof, segs, su, sv, paint) {
  for (let j = 0; j < prof.length - 1; j++) {
    const [r0, h0] = prof[j], [r1, h1] = prof[j + 1];
    const n = typeof sv === 'function' ? sv(j) : sv;
    for (let i = 0; i < segs; i++) {
      const a0 = (i / segs) * Math.PI * 2, a1 = ((i + 1) / segs) * Math.PI * 2;
      const P = [V(Math.cos(a0) * r0, h0, Math.sin(a0) * r0), V(Math.cos(a1) * r0, h0, Math.sin(a1) * r0), V(Math.cos(a1) * r1, h1, Math.sin(a1) * r1), V(Math.cos(a0) * r1, h1, Math.sin(a0) * r1)];
      const at = (u, v) => P[0].clone().lerp(P[1], u).lerp(P[3].clone().lerp(P[2], u), v);
      for (let u = 0; u < su; u++) {
        for (let v = 0; v < n; v++) {
          b.quad(at(u / su, v / n), at(u / su, (v + 1) / n), at((u + 1) / su, (v + 1) / n), at((u + 1) / su, v / n), paint(j, i, u, v, n));
        }
      }
    }
  }
}

// 一块凸多边形面（从中心扇开成三角形），正面朝着 n 那边：画贴在表面上的花纹、钉帽、板缝
function poly(b, pts, n, color) {
  if (pts.length === 3) {
    const [p, q, r] = pts;
    if (q.clone().sub(p).cross(r.clone().sub(p)).dot(n) >= 0) b.tri(p, q, r, color);
    else b.tri(p, r, q, color);
    return;
  }
  const c = pts.reduce((s, p) => s.add(p), V(0, 0, 0)).multiplyScalar(1 / pts.length);
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    if (q.clone().sub(p).cross(c.clone().sub(p)).dot(n) >= 0) b.tri(p, q, c, color);
    else b.tri(p, c, q, color);
  }
}

// 平放的小圆片（钉帽、钉眼、藤壶），朝上
function dot(b, x, y, z, r, color, n = 6) {
  poly(b, Array.from({ length: n }, (_, i) => V(x + Math.cos((i / n) * Math.PI * 2) * r, y, z + Math.sin((i / n) * Math.PI * 2) * r)), V(0, 1, 0), color);
}

const tone = (c, k) => c.clone().multiplyScalar(k);

// 一小段缆：方木，顶上斜着一道暗槽（三股拧的纹）；groove 为空就不画槽（扎绳那一道）
function ropeSeg(b, p0, p1, w, h, color, groove = tone(color, 0.66)) {
  const up = V(0, 1, 0);
  b.beam(p0, p1, up, w, h, color);
  const d = p1.clone().sub(p0), len = d.length();
  if (!groove || len < 0.02) return;
  d.normalize();
  const n = d.clone().cross(up).normalize(), y = V(0, h / 2 + 0.0004, 0), g = Math.min(0.012, len * 0.22);
  const A = p0.clone().addScaledVector(n, w * 0.45).add(y), B = p0.clone().addScaledVector(d, len * 0.72).addScaledVector(n, -w * 0.45).add(y);
  poly(b, [A, A.clone().addScaledVector(d, g), B.clone().addScaledVector(d, g), B], up, groove);
}

function ringXZ(b, c, R, r, segs, color, axis = 'y') {
  for (let i = 0; i < segs; i++) {
    const a0 = (i / segs) * Math.PI * 2, a1 = ((i + 1) / segs) * Math.PI * 2;
    let p0, p1;
    if (axis === 'y') { p0 = V(c.x + Math.cos(a0) * R, c.y, c.z + Math.sin(a0) * R); p1 = V(c.x + Math.cos(a1) * R, c.y, c.z + Math.sin(a1) * R); }
    else if (axis === 'x') { p0 = V(c.x, c.y + Math.cos(a0) * R, c.z + Math.sin(a0) * R); p1 = V(c.x, c.y + Math.cos(a1) * R, c.z + Math.sin(a1) * R); }
    else { p0 = V(c.x + Math.cos(a0) * R, c.y + Math.sin(a0) * R, c.z); p1 = V(c.x + Math.cos(a1) * R, c.y + Math.sin(a1) * R, c.z); }
    b.beam(p0, p1, axis === 'y' ? V(0, 1, 0) : axis === 'x' ? V(1, 0, 0) : V(0, 0, 1), r, r, color);
  }
}

// —— 各件模型 ——（返回 {matte, metal} 两个 GeoBuilder 填好的内容 + 高度 + 额外部件）
const BUILD = {
  tube(b) {
    // 黄铜信筒：沿 x 躺着
    const L = 0.72, R = 0.085;
    b.metal.cylinder(V(-L / 2, 0, 0), V(L / 2, 0, 0), R, R, 10, PAL.brass, false);
    b.metal.cylinder(V(L / 2, 0, 0), V(L / 2 + 0.07, 0, 0), R + 0.016, R + 0.012, 10, PAL.brassDark, true);
    b.metal.cylinder(V(-L / 2 - 0.06, 0, 0), V(-L / 2, 0, 0), R + 0.014, R + 0.016, 10, PAL.brassDark, false);
    b.metal.cylinder(V(-L / 2 - 0.06, 0, 0), V(-L / 2 - 0.1, 0, 0), R + 0.014, 0.03, 10, PAL.brass, true);
    for (const x of [-0.2, 0.0, 0.2]) b.metal.cylinder(V(x - 0.012, 0, 0), V(x + 0.012, 0, 0), R + 0.012, R + 0.012, 10, PAL.brassDark, false);
    // 侧面的帆船徽记（暗色三角）
    b.metal.tri(V(-0.08, 0.02, R + 0.004), V(0.06, 0.02, R + 0.004), V(-0.02, 0.075, R * 0.55 + 0.004), PAL.brassDark);
    b.metal.box(V(-0.01, -0.012, R + 0.003), V(0.08, 0, 0), V(0, 0.01, 0), V(0, 0, 0.003), PAL.brassDark);
    // 封蜡
    b.matte.box(V(L / 2 + 0.075, 0, 0), V(0.012, 0, 0), V(0, 0.04, 0), V(0, 0, 0.04), PAL.wax);
    // 背带环
    ringXZ(b.metal, V(0.1, R + 0.03, 0), 0.03, 0.012, 6, PAL.brassDark, 'x');
    return { h: 0.2, r: 0.42 };
  },
  pulley(b) {
    // 滑车：两片木颊板夹着铜滑轮（从上面的缝里看得见轮子和槽里的一截缆），一道铁箍从顶上兜下来，顶上吊环。
    // 新加的都在原来那块木头和轮子的范围里，外形和以前一样大
    const grain = [PAL.wood, PAL.wood.clone().multiplyScalar(0.88), PAL.wood.clone().multiplyScalar(1.06), PAL.woodDark];
    for (const sx of [-1, 1]) {
      // 颊板按高度分几条木纹，中间那条竖着的是铁箍
      const ys = [0, 0.07, 0.15, 0.21, 0.28];
      for (let k = 0; k < ys.length - 1; k++) {
        const yc = (ys[k] + ys[k + 1]) / 2, hy = (ys[k + 1] - ys[k]) / 2;
        for (const [z0, z1] of [[-0.1, -0.016], [0.016, 0.1]]) b.matte.box(V(sx * 0.046, yc, (z0 + z1) / 2), V(0.024, 0, 0), V(0, hy, 0), V(0, 0, (z1 - z0) / 2), grain[(k + (z0 > 0 ? 1 : 0)) % 3]);
      }
      b.metal.box(V(sx * 0.046, 0.14, 0), V(0.024, 0, 0), V(0, 0.14, 0), V(0, 0, 0.016), PAL.iron);
      // 轴头：垫圈和铆头
      b.metal.cylinder(V(sx * 0.07, 0.12, 0), V(sx * 0.0728, 0.12, 0), 0.026, 0.026, 8, PAL.rust, true);
    }
    // 颊板中间的缝：上下两块垫木把两片连起来
    b.matte.box(V(0, 0.262, 0), V(0.022, 0, 0), V(0, 0.018, 0), V(0, 0, 0.06), PAL.woodDark);
    b.matte.box(V(0, 0.012, 0), V(0.022, 0, 0), V(0, 0.012, 0), V(0, 0, 0.1), PAL.woodDark);
    // 铁箍兜过顶
    b.metal.box(V(0, 0.285, 0), V(0.066, 0, 0), V(0, 0.005, 0), V(0, 0, 0.014), PAL.iron);
    b.metal.cylinder(V(-0.075, 0.12, 0), V(0.075, 0.12, 0), 0.016, 0.016, 6, PAL.bronze, true);
    // 滑轮：外圈两道铜边、中间的槽暗下去（从顶上两头的开口看得见）
    b.metal.cylinder(V(-0.02, 0.12, 0), V(-0.012, 0.12, 0), 0.105, 0.105, 12, PAL.bronze, true);
    b.metal.cylinder(V(0.012, 0.12, 0), V(0.02, 0.12, 0), 0.105, 0.105, 12, PAL.bronze, true);
    b.metal.cylinder(V(-0.012, 0.12, 0), V(0.012, 0.12, 0), 0.092, 0.092, 12, PAL.brassDark, true);
    // 槽里压着的一截缆，从缝的前口垂出来，断头散开
    b.matte.beam(V(0, 0.222, -0.02), V(0, 0.214, 0.045), V(1, 0, 0), 0.016, 0.014, PAL.rope);
    b.matte.beam(V(0, 0.214, 0.045), V(0, 0.17, 0.088), V(1, 0, 0), 0.016, 0.014, PAL.rope);
    for (let k = 0; k < 3; k++) b.matte.beam(V(0, 0.17, 0.088), V((k - 1) * 0.008, 0.13 - k * 0.012, 0.094), V(0, 0, 1), 0.005, 0.005, PAL.rope);
    ringXZ(b.metal, V(0, 0.33, 0), 0.05, 0.016, 8, PAL.bronze, 'z');
    // 吊环下面的环眼座
    b.metal.box(V(0, 0.292, 0), V(0.012, 0, 0), V(0, 0.01, 0), V(0, 0, 0.02), PAL.rust);
    return { h: 0.38, r: 0.22 };
  },
  hinge(b) {
    // 舱门铜铰链：一片平躺、一片翘起，中间一根轴。轴是五节（两片铰页交替卷出来的），节缝里露出发黑的轴芯；
    // 平的那片上压着和信筒一样的帆船花（船身、桅杆、两面帆、底下一道浪），四颗一字螺钉，一字口朝向各不一样；
    // 翘起那片剩两颗螺钉、两个空钉眼（螺钉崩掉了）；两片的边磨得发暗，几块铜绿。
    // 新加的都贴在原来两片铰页和轴的范围里，外形和以前一样大
    const edge = tone(PAL.bronze, 0.72), slot = col(0.16, 0.1, 0.06), hole = col(0.08, 0.06, 0.05), green = PAL.patina, up = V(0, 1, 0);
    // 平页：上面 y = 0.016，花纹贴在 0.0168
    b.metal.box(V(-0.1, 0.008, 0), V(0.09, 0, 0), V(0, 0.008, 0), V(0, 0, 0.055), PAL.bronze);
    const Y = 0.0168, F = (x, z) => V(x, Y, z);
    poly(b.metal, [F(-0.188, -0.053), F(-0.012, -0.053), F(-0.012, -0.045), F(-0.188, -0.045)], up, edge);
    poly(b.metal, [F(-0.188, 0.045), F(-0.012, 0.045), F(-0.012, 0.053), F(-0.188, 0.053)], up, edge);
    poly(b.metal, [F(-0.188, -0.045), F(-0.18, -0.045), F(-0.18, 0.045), F(-0.188, 0.045)], up, edge);
    // 帆船：船身（梯形）、桅杆、主帆、前帆、底下一道浪
    poly(b.metal, [F(-0.146, 0.016), F(-0.058, 0.016), F(-0.07, 0.03), F(-0.132, 0.03)], up, PAL.brassDark);
    poly(b.metal, [F(-0.103, 0.016), F(-0.097, 0.016), F(-0.097, -0.036), F(-0.103, -0.036)], up, PAL.brassDark);
    poly(b.metal, [F(-0.106, 0.011), F(-0.138, 0.011), F(-0.106, -0.03)], up, PAL.brassDark);
    poly(b.metal, [F(-0.094, 0.011), F(-0.068, 0.011), F(-0.094, -0.022)], up, PAL.brassDark);
    for (let k = 0; k < 4; k++) poly(b.metal, [F(-0.15 + k * 0.024, 0.04), F(-0.138 + k * 0.024, 0.035), F(-0.126 + k * 0.024, 0.04), F(-0.138 + k * 0.024, 0.044)], up, tone(PAL.brassDark, 1.1));
    // 平页上的四颗螺钉：圆帽高出一点，一字口
    [[-0.165, -0.03, 0.3], [-0.165, 0.03, 1.4], [-0.035, -0.03, 2.2], [-0.035, 0.03, 0.8]].forEach(([x, z, a]) => {
      b.metal.cylinder(V(x, 0.016, z), V(x, 0.0215, z), 0.0095, 0.0085, 8, tone(PAL.brass, 0.92), true);
      b.metal.box(V(x, 0.0218, z), V(Math.cos(a) * 0.008, 0, Math.sin(a) * 0.008), V(0, 0.0004, 0), V(-Math.sin(a) * 0.0018, 0, Math.cos(a) * 0.0018), slot);
    });
    // 铜绿：靠边、靠螺钉的几块
    poly(b.metal, [F(-0.188, -0.01), F(-0.176, -0.016), F(-0.168, -0.004), F(-0.176, 0.01), F(-0.188, 0.006)], up, green);
    poly(b.metal, [F(-0.05, -0.044), F(-0.03, -0.044), F(-0.024, -0.038), F(-0.04, -0.033)], up, tone(green, 0.9));
    // 翘页：在它自己的坐标里摆（ax 沿着页子、an 是它朝上的那一面）
    const ax = V(1, 0, 0).applyAxisAngle(V(0, 0, 1), 0.35), an = V(0, 1, 0).applyAxisAngle(V(0, 0, 1), 0.35);
    const C2 = V(0.1, 0.03, 0), L = (x, z, h = 0.0088) => C2.clone().addScaledVector(ax, x).addScaledVector(an, h).add(V(0, 0, z));
    b.metal.box(C2, tone(ax, 0.09), tone(an, 0.008), V(0, 0, 0.055), PAL.bronze);
    poly(b.metal, [L(-0.088, -0.053), L(0.088, -0.053), L(0.088, -0.045), L(-0.088, -0.045)], an, edge);
    poly(b.metal, [L(-0.088, 0.045), L(0.088, 0.045), L(0.088, 0.053), L(-0.088, 0.053)], an, edge);
    poly(b.metal, [L(0.08, -0.045), L(0.088, -0.045), L(0.088, 0.045), L(0.08, 0.045)], an, edge);
    for (const [x, z, a] of [[-0.035, 0.03, 1.1], [0.055, -0.03, 2.6]]) {
      const n = 8, ring = (r, h) => Array.from({ length: n }, (_, i) => L(x + Math.cos((i / n) * 6.283) * r, z + Math.sin((i / n) * 6.283) * r, h));
      poly(b.metal, ring(0.009, 0.0092), an, tone(PAL.brass, 0.92));
      const cx = Math.cos(a) * 0.007, cz = Math.sin(a) * 0.007, px = -Math.sin(a) * 0.0016, pz = Math.cos(a) * 0.0016;
      poly(b.metal, [L(x - cx - px, z - cz - pz, 0.0096), L(x + cx - px, z + cz - pz, 0.0096), L(x + cx + px, z + cz + pz, 0.0096), L(x - cx + px, z - cz + pz, 0.0096)], an, slot);
    }
    for (const [x, z] of [[-0.035, -0.03], [0.055, 0.03]]) {
      const n = 8, ring = (r) => Array.from({ length: n }, (_, i) => L(x + Math.cos((i / n) * 6.283) * r, z + Math.sin((i / n) * 6.283) * r, 0.0092));
      poly(b.metal, ring(0.0105), an, edge);
      poly(b.metal, ring(0.0065), an, hole);
    }
    poly(b.metal, [L(0.06, 0.012), L(0.085, 0.004), L(0.088, 0.03), L(0.07, 0.034)], an, green);
    // 轴：发黑的轴芯，外面五节，节与节之间留一道缝
    b.metal.cylinder(V(0, 0.012, -0.059), V(0, 0.012, 0.059), 0.011, 0.011, 6, tone(PAL.brassDark, 0.55), true);
    for (let k = 0; k < 5; k++) {
      const z0 = -0.06 + k * 0.0246, z1 = z0 + 0.0216;
      const c = k % 2 ? PAL.bronze : tone(PAL.bronze, 0.86);
      b.metal.cylinder(V(0, 0.012, z0), V(0, 0.012, z1), 0.016, 0.016, 6, c, true);
      poly(b.metal, Array.from({ length: 6 }, (_, i) => V(Math.cos((i / 6) * 6.283) * 0.016, 0.012 + Math.sin((i / 6) * 6.283) * 0.016, z0)), V(0, 0, -1), c);
    }
    return { h: 0.06, r: 0.18 };
  },
  anchor(b) {
    // 熟铁锚：锚杆沿 x，锚臂在 xz 平面，木横杆垂直
    const iron = PAL.iron, rust = PAL.rust;
    b.metal.beam(V(-0.75, 0.06, 0), V(0.72, 0.06, 0), V(0, 1, 0), 0.085, 0.085, iron);
    // 锚冠和两条弯臂
    const arm = (s) => {
      const pts = [V(-0.75, 0.06, 0), V(-0.68, 0.06, s * 0.22), V(-0.52, 0.06, s * 0.4), V(-0.3, 0.06, s * 0.5)];
      for (let i = 0; i < pts.length - 1; i++) b.metal.beam(pts[i], pts[i + 1], V(0, 1, 0), 0.075, 0.08, i === 0 ? rust : iron);
      // 锚爪（三角铁板）
      const tip = pts[3];
      b.metal.tri(tip.clone().add(V(-0.12, 0.0, -s * 0.1)), tip.clone().add(V(0.16, 0.0, s * 0.04)), tip.clone().add(V(-0.06, 0.0, s * 0.14)), rust);
      b.metal.tri(tip.clone().add(V(-0.12, 0.012, -s * 0.1)), tip.clone().add(V(-0.06, 0.012, s * 0.14)), tip.clone().add(V(0.16, 0.012, s * 0.04)), rust);
    };
    arm(1);
    arm(-1);
    // 锚环
    ringXZ(b.metal, V(0.85, 0.06, 0), 0.13, 0.04, 10, iron, 'y');
    // 木横杆（一头烂掉一截），竖着
    b.matte.beam(V(0.56, 0.06, 0), V(0.56, 0.06, 0), V(0, 1, 0), 0.1, 0.1, PAL.woodDark);
    b.matte.box(V(0.56, 0.12, 0.08), V(0.06, 0, 0), V(0, 0.06, 0), V(0, 0, 0.55), PAL.woodDark);
    b.metal.box(V(0.56, 0.12, 0.42), V(0.065, 0, 0), V(0, 0.065, 0), V(0, 0, 0.025), iron);
    b.metal.box(V(0.56, 0.12, -0.25), V(0.065, 0, 0), V(0, 0.065, 0), V(0, 0, 0.025), iron);
    // 断缆：从锚环拖出去一截，断头散开
    const rp = [V(0.95, 0.06, 0), V(1.15, 0.05, 0.05), V(1.35, 0.05, 0.02), V(1.5, 0.05, -0.05)];
    for (let i = 0; i < rp.length - 1; i++) b.matte.beam(rp[i], rp[i + 1], V(0, 1, 0), 0.06, 0.06, PAL.rope);
    for (let k = 0; k < 4; k++) b.matte.beam(V(1.5, 0.05, -0.05), V(1.6 + k * 0.02, 0.05 + (k % 2) * 0.03, -0.1 + k * 0.05), V(0, 1, 0), 0.015, 0.015, PAL.rope);
    return { h: 0.2, r: 0.95 };
  },
  jar(b, seed) {
    const prof = [[0.05, 0], [0.12, 0.02], [0.17, 0.12], [0.205, 0.28], [0.19, 0.4], [0.13, 0.48], [0.07, 0.53], [0.065, 0.6], [0.08, 0.62], [0.06, 0.63]];
    // 罐身一格一格上色（外形不变）：肩上一道釉，釉下一圈褐色波纹带、上下两道线，肚子上拉坯的旋纹，
    // 下半截一侧长着藤壶和海藻（每只罐子不一样），口沿一处磕掉的缺口
    const rnd = mulberry32(Math.floor(seed * 1000) + 5);
    const side = rnd() * Math.PI * 2;
    const ink = col(0.3, 0.15, 0.09), ring = PAL.clay.clone().multiplyScalar(0.9), barn = col(0.86, 0.84, 0.74), weed = col(0.34, 0.46, 0.3);
    const growth = Array.from({ length: 12 * 3 * 6 }, () => rnd());
    const ZIG = [0, 1, 2, 1];
    lathePaint(b.matte, prof, 12, 3, (j) => (j === 3 ? 5 : j === 1 || j === 2 ? 4 : 1), (j, i, u, v) => {
      if (j === 0) return PAL.clayDark;
      if (j === 4) return u === 1 && i % 3 === 0 ? PAL.glaze.clone().multiplyScalar(0.82) : PAL.glaze;
      if (j === 5) return PAL.clayDark;
      if (j >= 7) return i === Math.floor(seed * 12) % 12 && u === 1 ? PAL.clayDark.clone().multiplyScalar(0.7) : PAL.clay;
      if (j === 3) {
        if (v === 0 || v === 4) return ink;
        return ZIG[(i * 3 + u) % 4] === v - 1 ? ink : PAL.clay;
      }
      if (j === 1 || j === 2) {
        // 朝着 side 那一边、越往下越多
        const a = ((i + (u + 0.5) / 3) / 12) * Math.PI * 2;
        const near = Math.cos(a - side), low = j === 1 ? 1 - v * 0.15 : 0.45 - v * 0.12;
        const r = growth[(i * 3 + u) * 6 + (j - 1) * 3 + Math.min(v, 2)];
        if (near > 0.2 && r < low * near * 0.75) return r < low * near * 0.3 ? barn : weed;
        if (j === 2 && v === 2) return ring;
      }
      return PAL.clay;
    });
    // 双耳
    for (const s of [-1, 1]) {
      const pts = [V(0, 0.5, s * 0.07), V(0, 0.56, s * 0.17), V(0, 0.47, s * 0.21), V(0, 0.38, s * 0.19)];
      for (let i = 0; i < pts.length - 1; i++) b.matte.beam(pts[i], pts[i + 1], V(1, 0, 0), 0.04, 0.03, PAL.clayDark);
    }
    // 软木塞，颈上缠两圈麻绳
    b.matte.cylinder(V(0, 0.6, 0), V(0, 0.66, 0), 0.058, 0.055, 8, col(0.66, 0.52, 0.34), true);
    for (const y of [0.556, 0.574]) ringXZ(b.matte, V(0, y, 0), 0.07, 0.012, 8, PAL.rope.clone().multiplyScalar(y > 0.56 ? 1 : 0.85), 'y');
    if (seed > 0.5) b.matte.box(V(0.0, 0.32, 0.2), V(0.03, 0, 0), V(0, 0.03, 0), V(0, 0, 0.006), PAL.clayDark);
    return { h: 0.66, r: 0.34, upright: true };
  },
  copperset(b) {
    // 五口铜锅一口套一口。每口锅都有锅里（暗一点的铜，锅底积一圈铜绿）和卷起来的亮锅沿，
    // 从上往下看是一圈套一圈的锅沿、锅壁，最里面那口看得见锅底；锅身是锤出来的，一小块一小块深浅不一，
    // 锅沿往下挂几道铜绿；最外那口锅底烧黑了。把手根上两颗铆钉、头上一个挂孔。
    // 捆着的麻绳一股一股拧的，十字当中打了个结。新加的都在原来几口锅和绳子的范围里，外形和以前一样大
    const rnd = mulberry32(31);
    const ham = Array.from({ length: 5 * 12 * 2 * 3 }, () => 0.86 + rnd() * 0.22);
    const inside = tone(PAL.copper, 0.6), rim = tone(PAL.copper, 1.14), soot = col(0.2, 0.15, 0.12), up = V(0, 1, 0);
    for (let k = 0; k < 5; k++) {
      const r = 0.3 - k * 0.04, y = k * 0.045;
      const prof = [[r * 0.75, y], [r, y + 0.04], [r * 1.02, y + 0.14], [r * 1.06, y + 0.15]];
      const base = k % 2 ? PAL.copper : tone(PAL.copper, 0.9);
      lathePaint(b.metal, prof, 12, 2, (j) => (j === 1 ? 3 : 1), (j, i, u, v) => {
        const drip = (i * 2 + u + k * 5) % 9 === 0, side = (i + k * 3) % 7 === 0;
        if (j === 0) return k === 0 ? soot : tone(base, 0.8);
        if (j === 2) return side ? PAL.patina : rim;
        if (side && v >= 1) return PAL.patina;
        if (drip && v >= 2 - ((i + k) % 2)) return tone(PAL.patina, 0.92);
        return tone(base, ham[((k * 12 + i) * 2 + u) * 3 + v]);
      });
      // 锅里：贴着锅壁往里一点，反过来朝里
      const inn = [[r * 0.75 - 0.006, y + 0.006], [r - 0.008, y + 0.042], [r * 1.02 - 0.008, y + 0.14], [r * 1.06 - 0.012, y + 0.15]];
      lathe(b.metal, inn.slice().reverse(), 12, inside, 0, 0, 0, (j, i) => (j === 2 && (i + k) % 4 === 0 ? tone(PAL.patina, 0.8) : (i + k) % 2 ? inside : tone(inside, 0.9)));
      // 卷边的锅沿：顶面和原来的锅口一样高
      ringXZ(b.metal, V(0, y + 0.15 - 0.006, 0), r * 1.06 - 0.006, 0.012, 12, rim);
    }
    // 最里面那口的锅底：一圈铜绿，当中暗铜
    const fr = 0.14 * 0.75 - 0.006, fy = 4 * 0.045 + 0.007;
    poly(b.metal, Array.from({ length: 12 }, (_, i) => V(Math.cos((i / 12) * 6.283) * fr, fy, Math.sin((i / 12) * 6.283) * fr)), up, tone(PAL.patina, 0.75));
    poly(b.metal, Array.from({ length: 12 }, (_, i) => V(Math.cos((i / 12) * 6.283) * fr * 0.65, fy + 0.0006, Math.sin((i / 12) * 6.283) * fr * 0.65)), up, tone(inside, 0.85));
    // 把手：根上两颗铆钉，头上一个挂孔
    b.metal.beam(V(0.3, 0.1, 0), V(0.48, 0.12, 0), V(0, 1, 0), 0.04, 0.025, tone(PAL.copper, 0.8));
    for (const z of [-0.011, 0.011]) dot(b.metal, 0.33, 0.1162, z, 0.006, rim, 6);
    dot(b.metal, 0.455, 0.1305, 0, 0.008, col(0.1, 0.07, 0.05), 6);
    // 捆绳十字：一段段深浅相间看得出拧纹，当中一个结
    const lay = [PAL.rope, tone(PAL.rope, 0.92), tone(PAL.rope, 1.06)];
    for (let s = 0; s < 12; s++) {
      const a = -0.33 + s * 0.055;
      ropeSeg(b.matte, V(a, 0.32, 0), V(a + 0.055, 0.32, 0), 0.04, 0.036, lay[s % 3]);
      ropeSeg(b.matte, V(0, 0.32, a), V(0, 0.32, a + 0.055), 0.04, 0.036, lay[(s + 1) % 3]);
    }
    b.matte.box(V(0, 0.32, 0), V(0.034, 0, 0), V(0, 0.0179, 0), V(0, 0, 0.034), tone(PAL.rope, 0.74));
    b.matte.box(V(0, 0.3204, 0), V(0.012, 0, 0.012), V(0, 0.0179, 0), V(-0.03, 0, 0.03), tone(PAL.rope, 0.95));
    return { h: 0.36, r: 0.42, upright: true };
  },
  rope(b) {
    // 缆绳卷：每圈都是三股拧的，一小段一小段深浅相间，一圈比一圈错开一格，看上去是斜着拧的纹；
    // 外圈有两处用细麻绳扎了一道（发黑）；最底下那圈泡在泥里久了，一侧长着海草、粘着几颗藤壶；
    // 甩出来的绳头散成三股，股头是浅色的新茬。新加的都在原来那几圈绳子的范围里，外形和以前一样大
    const rnd = mulberry32(53);
    const lay = [1, 0.92, 1.06], whip = col(0.27, 0.2, 0.13), weed = col(0.36, 0.42, 0.24), up = V(0, 1, 0);
    for (let k = 0; k < 5; k++) {
      const rr = 0.32 - k * 0.045;
      const y = 0.04 + k * 0.045;
      const base = tone(PAL.rope, 0.85 + (k % 2) * 0.12);
      for (let i = 0; i < 12; i++) {
        const a0 = (i / 12) * Math.PI * 2, a1 = ((i + 1) / 12) * Math.PI * 2;
        const p0 = V(Math.cos(a0) * rr, y, Math.sin(a0) * rr), p1 = V(Math.cos(a1) * rr, y, Math.sin(a1) * rr);
        for (let s = 0; s < 3; s++) {
          let c = tone(base, lay[(i * 3 + s + k) % 3]);
          const tied = (k === 0 && i === 2 && s === 1) || (k === 1 && i === 8 && s === 1);
          if (tied) c = whip;
          else if (k === 0 && i >= 6 && i <= 9 && rnd() < 0.55) c = base.clone().lerp(weed, 0.55 + rnd() * 0.3);
          ropeSeg(b.matte, p0.clone().lerp(p1, s / 3), p0.clone().lerp(p1, (s + 1) / 3), 0.075, 0.07, c, tied ? null : undefined);
        }
      }
    }
    // 底圈露在外面的那一窄条顶上：几颗藤壶
    for (const [a, d, r] of [[1.75, 0.338, 0.009], [1.92, 0.344, 0.007], [2.2, 0.336, 0.01], [2.45, 0.342, 0.006]]) {
      dot(b.matte, Math.cos(a + 1.6) * d, 0.0755, Math.sin(a + 1.6) * d, r, col(0.84, 0.82, 0.72), 6);
      dot(b.matte, Math.cos(a + 1.6) * d, 0.0758, Math.sin(a + 1.6) * d, r * 0.45, col(0.34, 0.3, 0.26), 4);
    }
    // 甩出来的绳头：中间扎一道，末梢散成三股
    const e0 = V(0.32, 0.04, 0), e1 = V(0.5, 0.03, 0.18), dir = e1.clone().sub(e0).normalize(), side = dir.clone().cross(up).normalize();
    const m = e0.clone().lerp(e1, 0.74);
    for (let s = 0; s < 4; s++) ropeSeg(b.matte, e0.clone().lerp(m, s / 4), e0.clone().lerp(m, (s + 1) / 4), 0.07, 0.07, s === 1 ? whip : tone(PAL.rope, lay[s % 3]), s === 1 ? null : undefined);
    for (const [o, h, c] of [[-0.021, -0.012, 1], [0, 0.014, 0.9], [0.021, -0.006, 1.06]]) {
      const tip = e1.clone().addScaledVector(side, o).add(V(0, h, 0));
      const mid = m.clone().addScaledVector(side, o * 0.5).add(V(0, h * 0.4, 0));
      b.matte.beam(m.clone().addScaledVector(dir, -0.01), mid, up, 0.03, 0.03, tone(PAL.rope, c));
      b.matte.beam(mid, tip, up, 0.028, 0.028, tone(PAL.rope, 1.22 * c));
    }
    return { h: 0.26, r: 0.36, upright: true };
  },
  barrel(b, seed) {
    // 箍桶：十四块桶板，块块深浅不一、带几道木纹，板缝是一道道暗线；桶肚子上一个塞着木塞的桶眼；
    // 桶口一圈板头的端面，盖板沉在里面一点，三块拼的；四道铁箍锈得深浅不一、箍上几颗铆钉，
    // 锈水顺着桶板往下淌；一侧长着藤壶和海草（躺在海底贴着泥的那面）。
    // 新加的都贴在原来的桶身、桶箍上，外形和以前一样大
    const prof = [[0.24, 0], [0.28, 0.12], [0.305, 0.4], [0.28, 0.68], [0.24, 0.8]];
    const rnd = mulberry32(Math.floor(seed * 1000) + 11);
    const SU = 6, rows = [3, 7, 7, 3];
    const stave = Array.from({ length: 14 }, () => 0.82 + rnd() * 0.22);
    const hash = Array.from({ length: 14 * SU * 20 }, () => rnd());
    const seam = tone(PAL.woodDark, 0.72), plug = col(0.62, 0.48, 0.3), hole = col(0.2, 0.13, 0.08);
    const barn = col(0.86, 0.84, 0.74), weed = col(0.34, 0.44, 0.28);
    const side = rnd() * Math.PI * 2;
    const hoops = [0.1, 0.32, 0.48, 0.7];
    lathePaint(b.matte, prof, 14, SU, (j) => rows[j], (j, i, u, v, n) => {
      if (u === 0) return seam;
      const y = prof[j][1] + ((prof[j + 1][1] - prof[j][1]) * (v + 0.5)) / n;
      const row = Math.round(y / 0.04 - 0.5), h = hash[(i * SU + u) * 20 + row];
      // 桶眼：第 3 块板正当中，木塞一圈暗缝
      if (i === 3 && u >= 2 && u <= 4 && (row === 9 || row === 10)) return u === 3 ? plug : hole;
      // 一侧长东西：两头多、肚子上少
      const a = ((i + (u + 0.5) / SU) / 14) * Math.PI * 2, near = Math.cos(a - side);
      const end = row < 3 || row > 16 ? 1 : 0.45;
      if (near > 0.3 && h < near * end * 0.32) return h < near * end * 0.12 ? barn : weed;
      // 锈水：从箍底下往下淌一两格
      for (const hy of hoops) {
        const lo = hy - 0.022;
        if (y < lo && lo - y < 0.09 && hash[(i * SU + u) * 20 + 19 - hoops.indexOf(hy)] < 0.2) {
          const len = hash[(i * SU + u) * 20 + 15 - hoops.indexOf(hy)] < 0.5 ? 0.045 : 0.085;
          if (lo - y < len) return PAL.wood.clone().lerp(PAL.rust, 0.65 - (lo - y) * 3);
        }
      }
      const t = stave[i] * (h < 0.1 ? 0.84 : h > 0.93 ? 1.08 : 1);
      return tone(PAL.wood, t);
    });
    // 桶口：板头一圈端面（浅），里面一圈暗的内壁，盖板沉下去 2.5 厘米
    const top = 0.8, R0 = 0.24, R1 = 0.215, hy = 0.775, up = V(0, 1, 0);
    for (let i = 0; i < 14; i++) {
      const a0 = (i / 14) * Math.PI * 2, a1 = ((i + 1) / 14) * Math.PI * 2, am = a0 + (a1 - a0) / SU;
      const P = (r, a, y) => V(Math.cos(a) * r, y, Math.sin(a) * r);
      poly(b.matte, [P(R1, a0, top), P(R0, a0, top), P(R0, am, top), P(R1, am, top)], up, seam);
      poly(b.matte, [P(R1, am, top), P(R0, am, top), P(R0, a1, top), P(R1, a1, top)], up, tone(PAL.wood, 1.18 * stave[i]));
    }
    lathe(b.matte, [[R1, top], [R1, hy]], 14, tone(PAL.woodDark, 0.6));
    poly(b.matte, Array.from({ length: 14 }, (_, i) => V(Math.cos((i / 14) * 6.283) * R1, hy - 0.002, Math.sin((i / 14) * 6.283) * R1)), up, seam);
    [[-R1, -0.074, 0.94], [-0.068, 0.068, 1.04], [0.074, R1, 0.88]].forEach(([x0, x1, t]) => {
      const pts = [];
      for (let s = 0; s <= 4; s++) { const x = x0 + ((x1 - x0) * s) / 4; pts.push(V(x, hy, Math.sqrt(Math.max(0, R1 * R1 - x * x)) * 0.985)); }
      for (let s = 4; s >= 0; s--) { const x = x0 + ((x1 - x0) * s) / 4; pts.push(V(x, hy, -Math.sqrt(Math.max(0, R1 * R1 - x * x)) * 0.985)); }
      poly(b.matte, pts, up, tone(PAL.oak, t));
    });
    // 铁箍：锈得深浅不一，铆钉一圈五颗
    hoops.forEach((y, k) => {
      // 两头的箍顺着桶身收口贴着板，肚子上的两道鼓出来一点
      const sr = (yy) => { let j = 0; while (j < prof.length - 2 && yy > prof[j + 1][1]) j++; const [r0, y0] = prof[j], [r1, y1] = prof[j + 1]; return r0 + ((r1 - r0) * (yy - y0)) / (y1 - y0); };
      const hp = y < 0.2 || y > 0.65 ? [[sr(y - 0.022) + 0.002, y - 0.022], [sr(y + 0.022) + 0.002, y + 0.022]] : [[0.309, y - 0.022], [0.309, y + 0.022]];
      lathePaint(b.metal, hp, 14, 2, 2, (j, i, u, v) => {
        if (v === 1 && u === 0 && (i + k) % 3 === 0) return tone(PAL.silverDark, 0.8);
        const h = hash[(i * 2 + u) * 4 + v + k * 3];
        return h < 0.22 ? col(0.32, 0.18, 0.11) : h > 0.8 ? tone(PAL.rust, 1.22) : PAL.rust;
      });
    });
    return { h: 0.8, r: 0.42, upright: true };
  },
  sack(b, seed) {
    const rnd = mulberry32(Math.floor(seed * 1000));
    const g = new THREE.IcosahedronGeometry(0.28, 1);
    const p = g.attributes.position;
    const v = new THREE.Vector3();
    const tris = [];
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      v.y *= 0.62;
      v.x *= 1.15;
      v.multiplyScalar(0.92 + rnd() * 0.14);
      tris.push(v.clone().add(V(0, 0.18, 0)));
    }
    // 每个面再切成六十四小块（都在原来的面上，外形不变），按位置上色：两道捆绳、顶上刷的商号记号（圈里一个十字）、
    // 一块补丁和它的针脚、帆布深浅
    const rope = col(0.44, 0.32, 0.19), mark = col(0.4, 0.22, 0.14), patch = PAL.canvas.clone().multiplyScalar(0.74), stitch = col(0.36, 0.28, 0.2);
    const paint = (c, base) => {
      const x = c.x, y = c.y - 0.18, z = c.z;
      if (Math.abs(x + 0.15) < 0.026 || Math.abs(x - 0.18) < 0.026) return y > -0.12 ? rope : rope.clone().multiplyScalar(0.85);
      if (y > 0.06) {
        const d = Math.hypot(x - 0.015, z);
        if (Math.abs(d - 0.1) < 0.018 || (d < 0.075 && (Math.abs(x - 0.015) < 0.016 || Math.abs(z) < 0.016))) return mark;
      }
      if (z > 0.12 && Math.abs(x) < 0.09 && y < 0.11 && y > -0.07) return Math.abs(x) > 0.068 || z < 0.142 || y > 0.088 || y < -0.048 ? stitch : patch;
      return base;
    };
    for (let i = 0; i < tris.length; i += 3) {
      const base = PAL.canvas.clone().multiplyScalar(0.88 + rnd() * 0.16);
      const A = tris[i], B = tris[i + 1], C = tris[i + 2];
      // 三角形按边八等分，切成六十四个小三角
      const N = 8;
      const P = (a, bb) => A.clone().multiplyScalar(1 - (a + bb) / N).addScaledVector(B, a / N).addScaledVector(C, bb / N);
      for (let a = 0; a < N; a++) {
        for (let bb = 0; bb < N - a; bb++) {
          const t = [P(a, bb), P(a + 1, bb), P(a, bb + 1)];
          b.matte.tri(t[0], t[1], t[2], paint(t[0].clone().add(t[1]).add(t[2]).multiplyScalar(1 / 3), base));
          if (a + bb < N - 1) {
            const q = [P(a + 1, bb), P(a + 1, bb + 1), P(a, bb + 1)];
            b.matte.tri(q[0], q[1], q[2], paint(q[0].clone().add(q[1]).add(q[2]).multiplyScalar(1 / 3), base));
          }
        }
      }
    }
    // 扎口和铅封：扎口上缠一道绳、袋口翻边颜色深，铅封上压着印
    // 扎口还是原来那一截圆台，中间一段换成绳的颜色
    const neck = (t) => [V(0.3 + 0.12 * t, 0.2 + 0.02 * t, 0), 0.07 - 0.02 * t];
    for (const [t0, t1, c] of [[0, 0.3, PAL.canvas.clone().multiplyScalar(0.8)], [0.3, 0.5, PAL.rope], [0.5, 0.88, PAL.canvas.clone().multiplyScalar(0.8)], [0.88, 1, PAL.canvas.clone().multiplyScalar(0.62)]]) {
      const [p0, r0] = neck(t0), [p1, r1] = neck(t1);
      b.matte.cylinder(p0, p1, r0, r1, 6, c, t1 === 1);
    }
    b.matte.beam(V(0.33, 0.21, 0), V(0.33, 0.1, 0.04), V(1, 0, 0), 0.015, 0.015, PAL.rope);
    b.metal.cylinder(V(0.33, 0.08, 0.02), V(0.33, 0.08, 0.06), 0.045, 0.045, 8, PAL.lead, true);
    b.metal.box(V(0.33, 0.08, 0.061), V(0.018, 0, 0), V(0, 0.006, 0), V(0, 0, 0.0015), col(0.3, 0.32, 0.35));
    b.metal.box(V(0.33, 0.08, 0.061), V(0.006, 0, 0), V(0, 0.018, 0), V(0, 0, 0.0015), col(0.3, 0.32, 0.35));
    return { h: 0.36, r: 0.36, upright: true };
  },
  chest(b) {
    // 铁箍小匣：盒身 + 铁箍；盖子另做（揭晓时打开）
    const W = 0.25, D = 0.17, H = 0.2;
    b.matte.box(V(0, H / 2, 0), V(W, 0, 0), V(0, H / 2, 0), V(0, 0, D), PAL.oak);
    // 板缝：四面各两道
    for (const y of [H * 0.36, H * 0.7]) {
      for (const sz of [-1, 1]) b.matte.box(V(0, y, sz * (D + 0.002)), V(W - 0.004, 0, 0), V(0, 0.004, 0), V(0, 0, 0.002), PAL.woodDark);
      for (const sx of [-1, 1]) b.matte.box(V(sx * (W + 0.002), y, 0), V(0.002, 0, 0), V(0, 0.004, 0), V(0, 0, D - 0.004), PAL.woodDark);
    }
    for (const x of [-0.17, 0, 0.17]) {
      b.metal.box(V(x, H / 2, D + 0.006), V(0.022, 0, 0), V(0, H / 2 + 0.004, 0), V(0, 0, 0.006), PAL.iron);
      b.metal.box(V(x, H / 2, -D - 0.006), V(0.022, 0, 0), V(0, H / 2 + 0.004, 0), V(0, 0, 0.006), PAL.iron);
      b.metal.box(V(x, 0.004, 0), V(0.022, 0, 0), V(0, 0.006, 0), V(0, 0, D + 0.006), PAL.iron);
      // 箍上的铆钉
      if (x !== 0) for (const y of [0.045, 0.155]) b.metal.box(V(x, y, D + 0.013), V(0.008, 0, 0), V(0, 0.008, 0), V(0, 0, 0.004), PAL.silverDark);
    }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.metal.box(V(sx * (W - 0.02), H / 2, sz * (D - 0.02)), V(0.03, 0, 0), V(0, H / 2 + 0.006, 0), V(0, 0, 0.03), PAL.iron);
    // 两侧提环
    for (const sx of [-1, 1]) {
      b.metal.box(V(sx * (W + 0.006), H * 0.62, 0), V(0.006, 0, 0), V(0, 0.022, 0), V(0, 0, 0.04), PAL.iron);
      ringXZ(b.metal, V(sx * (W + 0.02), H * 0.5, 0), 0.042, 0.012, 8, PAL.rust, 'x');
    }
    // 锁板和锁眼
    b.metal.box(V(0, H - 0.045, D + 0.012), V(0.048, 0, 0), V(0, 0.052, 0), V(0, 0, 0.006), PAL.rust);
    b.metal.box(V(0, H - 0.04, D + 0.019), V(0.008, 0, 0), V(0, 0.016, 0), V(0, 0, 0.002), col(0.08, 0.06, 0.05));
    b.metal.box(V(0, H - 0.02, D + 0.019), V(0.012, 0, 0), V(0, 0.006, 0), V(0, 0, 0.002), col(0.08, 0.06, 0.05));
    // 里面：银币匣（一个浅木托，银币堆成一个小丘，有的斜着）
    b.matte.box(V(0, H - 0.03, 0), V(W - 0.03, 0, 0), V(0, 0.01, 0), V(0, 0, D - 0.03), col(0.3, 0.2, 0.14));
    const rnd = mulberry32(17);
    const tones = [col(0.7, 0.72, 0.77), col(0.58, 0.6, 0.66), col(0.46, 0.48, 0.53), col(0.78, 0.77, 0.72)];
    for (let i = 0; i < 78; i++) {
      const fx = rnd() - 0.5, fz = rnd() - 0.5;
      const x = fx * (W * 2 - 0.08), z = fz * (D * 2 - 0.06);
      const mound = 0.05 * (1 - 4 * fx * fx) * (1 - 4 * fz * fz);
      const y = H - 0.02 + mound + rnd() * 0.012;
      const t = rnd();
      const c = t < 0.04 ? PAL.brass : tones[Math.floor(rnd() * tones.length)];
      // 斜着摞的：轴偏一点
      const tx = (rnd() - 0.5) * 0.012, tz = (rnd() - 0.5) * 0.012;
      b.metal.cylinder(V(x, y, z), V(x + tx, y + 0.008, z + tz), 0.022, 0.022, 7, c, true);
    }
    // 掉在匣子外头的几枚
    for (const [x, z, a] of [[0.06, D + 0.07, 0.3], [-0.1, D + 0.12, 1.2], [0.19, D + 0.05, 2], [-0.02, D + 0.18, 0.7]]) {
      b.metal.cylinder(V(x, 0.002, z), V(x + Math.cos(a) * 0.002, 0.01, z + Math.sin(a) * 0.002), 0.022, 0.022, 7, tones[(Math.round(a * 10)) % 3], true);
    }
    return { h: H + 0.06, r: 0.36, upright: true, lid: { W, D, H } };
  },
  seal(b) {
    // 大号的商号铜印，躺在地上：前头一块圆印台（印面朝 +x，糊着一层红封蜡，蜡上是铜铸的帆船和两个字母），
    // 后头一根车出来的铜柄、柄头一个圆球——从上面、侧面看都是一枚「图章」的样子（印台 + 柄），不是一团黄。
    // 印台比柄头的球大，躺着时印面微微朝上（约 11°）
    const S = 1.35, R0 = 0.085 * S, T = 0.05 * S, cy = R0;
    const tilt = 0.2, ct = Math.cos(tilt), st = Math.sin(tilt);
    // 整枚以中点为原点（印面到柄头约 0.35 米），绕印台底边那条线微微抬起印面
    const P = (x, y, z) => {
      const X = x + 0.12 * S, Y = y;
      return V(X * ct - Y * st, X * st + Y * ct - 0.026 * S, z);
    };
    const A = (x, y, z) => V(x * ct - y * st, x * st + y * ct, z); // 方向（半轴）只转不挪
    const cyl = (x0, x1, r0, r1, seg, c, cap, mat = b.metal) => mat.cylinder(P(x0, cy, 0), P(x1, cy, 0), r0, r1, seg, c, cap);
    // 印台：前面是印面，后面倒一圈角接柄
    cyl(-T, 0, R0, R0, 12, PAL.brass, false);
    cyl(-T, -T - 0.014 * S, R0, 0.05 * S, 12, PAL.brassDark, true);
    // 柄：颈、腰箍、柄身、圆球
    const prof = [[0.05, 0], [0.026, 0.02], [0.021, 0.05], [0.032, 0.062], [0.032, 0.074], [0.022, 0.086], [0.026, 0.12], [0.036, 0.135], [0.042, 0.155], [0.036, 0.175], [0.018, 0.188], [0.0, 0.192]];
    for (let j = 0; j < prof.length - 1; j++) {
      const [r0, d0] = prof[j], [r1, d1] = prof[j + 1];
      cyl(-T - (0.014 + d0) * S, -T - (0.014 + d1) * S, r0 * S, Math.max(0.001, r1 * S), 10, j === 3 || j >= 7 ? PAL.brass : PAL.brassDark, j === prof.length - 2);
    }
    // 印面：一层红封蜡，一圈铜边
    cyl(0, 0.006 * S, R0 - 0.006 * S, R0 - 0.006 * S, 12, PAL.wax, true, b.matte);
    cyl(0, 0.009 * S, R0, R0 - 0.004 * S, 12, PAL.brassDark, false);
    // 印面上的浮雕（贴在蜡面外 2 毫米）：帆船（船身、桅杆、两面帆）和下面两个字母
    const X = 0.0085 * S;
    const bar = (z, y, hz, hy, a = 0) => b.metal.box(P(X, cy + y * S, z * S), A(0.0022 * S, 0, 0), A(0, Math.cos(a) * hy * S, Math.sin(a) * hy * S), A(0, -Math.sin(a) * hz * S, Math.cos(a) * hz * S), PAL.brass);
    const tri = (pts) => {
      const [a, c, d] = pts.map(([z, y]) => P(X + 0.002 * S, cy + y * S, z * S));
      const n = c.clone().sub(a).cross(d.clone().sub(a));
      if (n.x >= 0) b.metal.tri(a, c, d, PAL.brass); else b.metal.tri(a, d, c, PAL.brass);
    };
    bar(0, -0.016, 0.04, 0.007);
    bar(0, -0.026, 0.028, 0.005);
    bar(0, 0.012, 0.0025, 0.03);
    tri([[0.004, 0.04], [0.004, -0.007], [0.036, -0.007]]);
    tri([[-0.004, 0.034], [-0.004, -0.007], [-0.03, -0.007]]);
    // 两个字母（一个 V、一个 C 样的弯）
    bar(-0.021, -0.05, 0.0022, 0.011, 0.35);
    bar(-0.013, -0.05, 0.0022, 0.011, -0.35);
    bar(0.016, -0.05, 0.0022, 0.009);
    bar(0.022, -0.041, 0.006, 0.0022);
    bar(0.022, -0.059, 0.006, 0.0022);
    // 揭晓时印面要斜对着镜头（reveal.js 按 face 转它）；高度按躺着算
    return { h: 2 * R0 + 0.02, r: 0.2, upright: false, face: [ct, st, 0] };
  },
  lantern(b) {
    const H = 0.62;
    // 底座、顶盖、四根立柱、残存的一面玻璃
    b.metal.cylinder(V(0, 0, 0), V(0, 0.06, 0), 0.17, 0.16, 8, PAL.bronze, true);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      b.metal.beam(V(Math.cos(a) * 0.14, 0.06, Math.sin(a) * 0.14), V(Math.cos(a) * 0.12, H - 0.12, Math.sin(a) * 0.12), V(0, 0, 1), 0.025, 0.025, PAL.bronze);
    }
    lathe(b.metal, [[0.16, H - 0.12], [0.17, H - 0.1], [0.1, H - 0.02], [0.04, H + 0.04], [0, H + 0.05]], 8, PAL.bronze);
    ringXZ(b.metal, V(0, H + 0.1, 0), 0.05, 0.016, 8, PAL.bronzeDark || PAL.brassDark, 'x');
    b.matte.box(V(0, 0.28, 0.135), V(0.09, 0, 0), V(0, 0.17, 0), V(0, 0, 0.004), PAL.glass);
    // 碎玻璃边
    b.matte.tri(V(-0.1, 0.06, -0.13), V(-0.02, 0.06, -0.13), V(-0.08, 0.2, -0.13), PAL.glass);
    // 灯座里的烛台
    b.metal.cylinder(V(0, 0.06, 0), V(0, 0.16, 0), 0.03, 0.025, 6, PAL.brassDark, true);
    return { h: H + 0.12, r: 0.4, upright: true };
  },
  plank(b, seed) {
    const rnd = mulberry32(Math.floor(seed * 999));
    const L = 1.7, W = 0.12, T = 0.03;
    b.matte.box(V(0, T, 0), V(L / 2, 0, 0), V(0, T, 0), V(0, 0, W), PAL.oak.clone().multiplyScalar(0.95 + rnd() * 0.1));
    // 断头参差
    b.matte.tri(V(L / 2, T * 2, -W), V(L / 2 + 0.16, T * 2, -W * 0.3), V(L / 2, T * 2, W * 0.4), PAL.oak);
    for (let i = 0; i < 4; i++) b.matte.box(V(-0.6 + i * 0.32, T * 2 + 0.001, 0), V(0.012, 0, 0), V(0, 0.001, 0), V(0, 0, 0.012), PAL.woodDark);
    return { h: 0.06, r: 0.95 };
  },
  stave(b) {
    for (let i = 0; i < 6; i++) {
      const t0 = i / 6, t1 = (i + 1) / 6;
      const y0 = Math.sin(t0 * Math.PI) * 0.06, y1 = Math.sin(t1 * Math.PI) * 0.06;
      b.matte.beam(V(-0.4 + t0 * 0.8, y0 + 0.02, 0), V(-0.4 + t1 * 0.8, y1 + 0.02, 0), V(0, 1, 0), 0.09, 0.025, PAL.wood);
    }
    b.metal.box(V(0.2, 0.08, 0), V(0.02, 0, 0), V(0, 0.01, 0), V(0, 0, 0.05), PAL.rust);
    return { h: 0.1, r: 0.45 };
  },
  ropebit(b) {
    // 断缆头：三股拧的缆，一小段一小段深浅相间看得出拧纹；完好的那头用细麻绳扎了一道，绳头泡得发黑；
    // 身上粘着一颗藤壶、一缕海草；崩断的那头三股散开，股头炸出一撮浅色的新纤维（断口是新的，比缆身浅）。
    // 新加的都在原来那根缆和散开的纤维的范围里，外形和以前一样大
    const pts = [V(-0.35, 0.04, 0), V(-0.15, 0.04, 0.06), V(0.05, 0.035, 0.02), V(0.25, 0.04, -0.05)];
    const lay = [1, 0.92, 1.06], whip = col(0.27, 0.2, 0.13), weed = col(0.34, 0.44, 0.26), up = V(0, 1, 0);
    let n = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      for (let k = 0; k < 5; k++) {
        let c = tone(PAL.rope, lay[n++ % 3]);
        if (i === 0 && k === 0) c = tone(c, 0.62);
        else if (i === 0 && k === 1) c = whip;
        else if (i === 1 && k >= 3) c = c.lerp(weed, 0.35);
        ropeSeg(b.matte, pts[i].clone().lerp(pts[i + 1], k / 5), pts[i].clone().lerp(pts[i + 1], (k + 1) / 5), 0.07, 0.07, c, i === 0 && k === 1 ? null : undefined);
      }
    }
    // 藤壶和一缕海草
    const bp = pts[2].clone().lerp(pts[3], 0.45);
    dot(b.matte, bp.x, bp.y + 0.0355, bp.z, 0.013, col(0.84, 0.82, 0.72), 6);
    dot(b.matte, bp.x, bp.y + 0.0358, bp.z, 0.005, col(0.32, 0.28, 0.24), 4);
    const w0 = pts[1].clone().lerp(pts[2], 0.5).add(V(0, 0.036, 0.012)), w1 = pts[1].clone().lerp(pts[2], 0.95).add(V(0, 0.036, -0.004));
    b.matte.beam(w0, w1, up, 0.012, 0.003, tone(weed, 0.8));
    // 断口：三股散开，纤维根上是缆的颜色，梢上是浅色的新茬
    const base = pts[3], E = Array.from({ length: 5 }, (_, k) => V(0.36 + k * 0.015, 0.04 + (k % 2) * 0.025, -0.12 + k * 0.05));
    const back = base.clone().lerp(pts[2], 0.12);
    for (const k of [0, 2, 4]) b.matte.beam(back, base.clone().lerp(E[k], 0.42), up, 0.028, 0.028, tone(PAL.rope, lay[k % 3]));
    for (let k = 0; k < 5; k++) {
      const m = base.clone().lerp(E[k], 0.55);
      b.matte.beam(base, m, up, 0.016, 0.016, tone(PAL.rope, 0.95));
      b.matte.beam(m, E[k], up, 0.016, 0.016, tone(PAL.rope, 1.25));
      if (k < 4) b.matte.beam(base.clone().lerp(E[k], 0.4), base.clone().lerp(E[k].clone().lerp(E[k + 1], 0.5), 0.85), up, 0.01, 0.01, tone(PAL.rope, 1.32));
    }
    return { h: 0.1, r: 0.4 };
  },
  shards(b, seed) {
    // 碎陶片：一片片边上崩了几个口，有厚度，断口一圈是浅色的新茬，片子微微拱起（从圆罐子上崩下来的）；
    // 朝上那面带着和船上陶罐一样的花：有的一角是肩上的青釉，有的是一道褐色波纹带，有的是拉坯的旋纹，有的是罐子里面朝上。
    // 几片还在原来的位置、原来那几块的范围里
    const rnd = mulberry32(Math.floor(seed * 777)), rn2 = mulberry32(Math.floor(seed * 777) + 3);
    const ink = col(0.3, 0.15, 0.09), ring = tone(PAL.clay, 0.86), fresh = col(0.92, 0.66, 0.48), up = V(0, 1, 0), dn = V(0, -1, 0);
    const T0 = Math.floor(seed * 4);
    for (let i = 0; i < 4; i++) {
      const cx = (rnd() - 0.5) * 0.4, cz = (rnd() - 0.5) * 0.4;
      const a = rnd() * 6.28;
      const r = 0.07 + rnd() * 0.05;
      const C = [0, 2.1, 4.2].map((da, k) => V(cx + Math.cos(a + da) * r, k === 1 ? 0.05 : 0.02, cz + Math.sin(a + da) * r));
      const mid = C[0].clone().add(C[1]).add(C[2]).multiplyScalar(1 / 3);
      // 轮廓：三个角之间各崩一个口（往里收），有一个角崩掉一块
      const chip = Math.floor(rn2() * 3), out = [];
      for (let k = 0; k < 3; k++) {
        const p = C[k], q = C[(k + 1) % 3], o = C[(k + 2) % 3];
        if (k === chip) { out.push(p.clone().lerp(o, 0.1), p.clone().lerp(q, 0.1)); } else out.push(p.clone());
        out.push(p.clone().lerp(q, 0.4 + rn2() * 0.2).lerp(mid, 0.06 + rn2() * 0.1));
      }
      // 朝上那面：拱起一点；按花纹方向一小块一小块上色
      const lift = (p) => { const d = Math.hypot(p.x - mid.x, p.z - mid.z) / r; return V(p.x, p.y + 0.005 * Math.max(0, 1 - d * d), p.z); };
      const ba = rn2() * Math.PI, bx = Math.cos(ba), bz = Math.sin(ba);
      const type = (i + T0) % 4;
      const paint = (p) => {
        const t = ((p.x - mid.x) * bx + (p.z - mid.z) * bz) / r, w = (-(p.x - mid.x) * bz + (p.z - mid.z) * bx) / r;
        if (type === 0) return t > 0.18 ? PAL.glaze : t > 0.04 ? ink : PAL.clay;
        if (type === 1) {
          // 一道褐色波纹带：下沿直，上沿一齿一齿
          const z = Math.abs((((w * 1.6) % 1) + 1) % 1 - 0.5) * 2;
          return t > -0.2 && t < 0.02 + z * 0.22 ? ink : PAL.clay;
        }
        if (type === 2) return Math.floor((t + 1) * 4.5) % 2 ? ring : PAL.clay;
        return Math.floor((t + 1) * 5) % 2 ? PAL.clayDark : tone(PAL.clayDark, 0.86);
      };
      const sub = (A, B, Cc, lv) => {
        if (lv === 0) { const c = A.clone().add(B).add(Cc).multiplyScalar(1 / 3); poly(b.matte, [lift(A), lift(B), lift(Cc)], up, paint(c)); return; }
        const ab = A.clone().lerp(B, 0.5), bc = B.clone().lerp(Cc, 0.5), ca = Cc.clone().lerp(A, 0.5);
        sub(A, ab, ca, lv - 1); sub(ab, B, bc, lv - 1); sub(ca, bc, Cc, lv - 1); sub(ab, bc, ca, lv - 1);
      };
      for (let k = 0; k < out.length; k++) sub(mid, out[k], out[(k + 1) % out.length], 2);
      if (type === 3) dot(b.matte, mid.x, mid.y + 0.0065, mid.z, 0.011, col(0.84, 0.82, 0.72), 6);
      // 断口一圈浅色的新茬，底面暗
      for (let k = 0; k < out.length; k++) {
        const p = lift(out[k]), q = lift(out[(k + 1) % out.length]);
        const n = p.clone().add(q).multiplyScalar(0.5).sub(mid).setY(0);
        poly(b.matte, [p, q, q.clone().add(V(0, -0.01, 0)), p.clone().add(V(0, -0.01, 0))], n, fresh);
      }
      poly(b.matte, out.map((p) => p.clone().add(V(0, -0.01, 0))), dn, PAL.clayDark);
    }
    return { h: 0.06, r: 0.4 };
  },
};
BUILD.tube2 = BUILD.tube;
BUILD.jar2 = BUILD.jar;

const MUD = {
  sand: { color: 0x8a7a5c },
  wreck: { color: 0x4a3e2c },
};

// 做好了素材的捞获（素材/规格.md）：模型用素材，泥壳、闪光、描边、揭晓时的大小和朝向（info）照旧
const ASSET = {
  tube: '捞获-黄铜信筒', tube2: '捞获-黄铜信筒', jar: '捞获-双耳陶罐', jar2: '捞获-双耳陶罐-指印', rope: '捞获-旧缆绳卷', // 不是玩家看的：素材的文件名
  copperset: '捞获-一摞铜锅', barrel: '捞获-箍桶', seal: '捞获-商号铜印', sack: '捞获-封铅货袋', chest: '捞获-银币匣', lantern: '捞获-船尾铜灯', // 不是玩家看的：素材的文件名
};
// info（高、半径、立着还是躺着、印面朝向、匣盖尺寸）只看形状，和代码画的那一份一样：按代码那一份算一次记下
const INFO = {};
function infoOf(kind, seed) {
  if (!INFO[kind]) INFO[kind] = BUILD[kind]({ matte: new GeoBuilder(), metal: new GeoBuilder() }, seed);
  return INFO[kind];
}

function itemMat(kind, metal, seed, opts, mudColor, map) {
  return toon({
    map,
    spec: metal ? 0.65 : 0.0,
    shin: metal ? 26 : 20,
    glint: metal,
    clear: metal ? opts.clear : undefined,
    item: true,
    mud: { amount: opts.mud ?? 0.3, inflate: opts.inflate ?? 0.0, seed: seed * 40 + (metal ? 7 : 0), scale: kind === 'anchor' ? 3.2 : 6.5, color: mudColor, crust: 1 },
  });
}

function buildFromAsset(kind, am, opts, seed) {
  const info = infoOf(kind, seed);
  const group = new THREE.Group();
  const mudColor = (opts.mudColor ?? MUD.wreck.color);
  const mats = [];
  for (const part of am.parts) {
    const m = itemMat(kind, part.metal, seed, opts, mudColor, part.map);
    const mesh = new THREE.Mesh(part.geometry, m);
    mesh.castShadow = true;
    mats.push(m);
    group.add(mesh);
  }
  let lid = null;
  const mv = am.moving.lid;
  if (mv) {
    // 匣盖：节点原点就是铰链，绕 x 转（和代码画的那一份同一个位置、同一个转法）
    lid = new THREE.Group();
    lid.position.copy(mv.pos);
    for (const part of mv.parts) {
      const m = part.metal
        ? toon({ map: part.map, spec: 0.5, shin: 26, item: true, mud: { amount: opts.mud ?? 0.3, inflate: 0, seed: 5.1, scale: 6.5, color: mudColor, crust: 1 } })
        : toon({ map: part.map, item: true, mud: { amount: opts.mud ?? 0.3, inflate: 0, seed: 3.3, scale: 6.5, color: mudColor, crust: 1 } });
      const mesh = new THREE.Mesh(part.geometry, m);
      mesh.castShadow = true;
      mats.push(m);
      lid.add(mesh);
    }
    group.add(lid);
  }
  return { group, mats, info, lid };
}

export function buildItemModel(kind, opts = {}) {
  const seed = opts.seed ?? 0.37;
  const am = ASSET[kind] && assetModel(ASSET[kind]);
  if (am) return buildFromAsset(kind, am, opts, seed);
  const b = { matte: new GeoBuilder(), metal: new GeoBuilder() };
  const info = BUILD[kind](b, seed);
  const group = new THREE.Group();
  const mudColor = (opts.mudColor ?? MUD.wreck.color);
  const mats = [];
  const mk = (gb, metal) => {
    if (gb.empty) return null;
    const m = toon({
      vertexColors: true,
      spec: metal ? 0.65 : 0.0,
      shin: metal ? 26 : 20,
      glint: metal,
      clear: metal ? opts.clear : undefined,
      item: true,
      mud: { amount: opts.mud ?? 0.3, inflate: opts.inflate ?? 0.0, seed: seed * 40 + (metal ? 7 : 0), scale: kind === 'anchor' ? 3.2 : 6.5, color: mudColor, crust: 1 },
    });
    const mesh = new THREE.Mesh(gb.build(), m);
    mesh.castShadow = true;
    mats.push(m);
    group.add(mesh);
    return mesh;
  };
  mk(b.matte, false);
  mk(b.metal, true);
  let lid = null;
  if (info.lid) {
    // 匣盖：绕后边的铰链转
    const lb = new GeoBuilder();
    const { W, D } = info.lid;
    lb.box(V(0, 0.03, D), V(W + 0.01, 0, 0), V(0, 0.03, 0), V(0, 0, D + 0.01), PAL.oak.clone().multiplyScalar(0.92));
    // 盖子里衬一层暗红布，开盖时看得见
    lb.box(V(0, -0.003, D), V(W - 0.02, 0, 0), V(0, 0.003, 0), V(0, 0, D - 0.02), col(0.42, 0.1, 0.1));
    // 盖顶两道板缝
    for (const z of [D * 0.66, D * 1.34]) lb.box(V(0, 0.061, z), V(W + 0.008, 0, 0), V(0, 0.002, 0), V(0, 0, 0.004), PAL.woodDark);
    const lm = new GeoBuilder();
    for (const x of [-0.17, 0, 0.17]) lm.box(V(x, 0.062, D), V(0.022, 0, 0), V(0, 0.006, 0), V(0, 0, D + 0.016), PAL.iron);
    lm.box(V(0, 0.03, 2 * D + 0.016), V(0.04, 0, 0), V(0, 0.035, 0), V(0, 0, 0.006), PAL.rust);
    // 搭扣：从盖沿垂下来扣进锁板
    lm.box(V(0, -0.015, 2 * D + 0.02), V(0.014, 0, 0), V(0, 0.03, 0), V(0, 0, 0.004), PAL.iron);
    lid = new THREE.Group();
    lid.position.set(0, info.lid.H, -D);
    const lmat = toon({ vertexColors: true, item: true, mud: { amount: opts.mud ?? 0.3, inflate: 0, seed: 3.3, scale: 6.5, color: mudColor, crust: 1 } });
    const lmat2 = toon({ vertexColors: true, spec: 0.5, shin: 26, item: true, mud: { amount: opts.mud ?? 0.3, inflate: 0, seed: 5.1, scale: 6.5, color: mudColor, crust: 1 } });
    const m1 = new THREE.Mesh(lb.build(), lmat);
    const m2 = new THREE.Mesh(lm.build(), lmat2);
    m1.castShadow = m2.castShadow = true;
    lid.add(m1, m2);
    mats.push(lmat, lmat2);
    group.add(lid);
  }
  return { group, mats, info, lid };
}

export function setItemMud(model, amount, inflate) {
  for (const m of model.mats) {
    m.uniforms.uMud.value = amount;
    if (inflate !== undefined) m.uniforms.uMudInflate.value = inflate;
  }
}

export function setItemGlint(model, g) {
  for (const m of model.mats) if (m.uniforms.uGlint) m.uniforms.uGlint.value = g;
}

// 合成时描不描轮廓：躺在海底、能捞的时候描
export function setItemMark(model, on) {
  for (const m of model.mats) if (m.uniforms.uItemMark) m.uniforms.uItemMark.value = on ? 1 : 0;
}

export { MUD };

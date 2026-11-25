// 海底装饰与线索：船板、桁、露头木构件、断桅；贴地痕迹（拖痕、刮痕、网痕、压痕、泥丘）；水上地标与出发港口的码头景
import * as THREE from 'three';
import { Builder, box, cyl, cone, rod, col, M, shade, rock, tor } from '../core/geo.js';
import { heightAt } from './layout.js';
import { worldMat, basicWaterMat, patchMaterial } from '../render/materials.js';
import { RNG } from '../core/rng.js';
import { noise2 } from '../core/noise.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// 船板等：返回加入 builder 的几何（世界坐标），以及是否算固体（进顶面栅格）
export function addDebris(b, d, surf, rng) {
  const y0 = surf(d.x, d.z);
  const c = Math.cos(d.yaw), s = Math.sin(d.yaw);
  const wood = col(0x5a4630), dark = col(0x3a2c1d);
  if (d.kind === 'plank') {
    const L = d.len;
    // 沿地面贴合：两端分别取高
    const ax = d.x - s * L / 2, az = d.z - c * L / 2, bx = d.x + s * L / 2, bz = d.z + c * L / 2;
    const ya = surf(ax, az), yb = surf(bx, bz);
    const pitch = Math.atan2(yb - ya, L);
    b.add(box(0.32, 0.07, L), shade(wood, 0.85 + rng.next() * 0.3), M(d.x, (ya + yb) / 2 + 0.01, d.z, -pitch, d.yaw, rng.range(-0.15, 0.15)));
    for (let k = 0; k < 3; k++) b.add(box(0.05, 0.03, 0.05), col(0x3a3430), M(d.x + s * (k - 1) * L * 0.35, (ya + yb) / 2 + 0.05, d.z + c * (k - 1) * L * 0.35));
    return false;
  }
  if (d.kind === 'spar') {
    const L = d.len;
    const r = 0.17;
    const ax = d.x - s * L / 2, az = d.z - c * L / 2, bx = d.x + s * L / 2, bz = d.z + c * L / 2;
    b.add(rod(V(ax, surf(ax, az) + r * 0.6, az), V(bx, surf(bx, bz) + r * 0.6, bz), r, 6), shade(wood, 0.8));
    return true;
  }
  if (d.kind === 'timber') {
    // 半埋木构件，一端翘出泥面
    const L = d.len;
    b.add(box(0.36, 0.3, L), shade(dark, 1.1), M(d.x, y0 - 0.1, d.z, d.tilt || 0.4, d.yaw, 0.1));
    for (let k = 0; k < 2; k++) b.add(box(0.06, 0.06, 0.06), col(0x2a2622), M(d.x + s * (0.4 + k * 0.4), y0 + 0.2 + k * 0.2, d.z + c * (0.4 + k * 0.4)));
    return true;
  }
  if (d.kind === 'mastTop') {
    const L = d.len;
    const ax = d.x - s * L / 2, az = d.z - c * L / 2, bx = d.x + s * L / 2, bz = d.z + c * L / 2;
    const A = V(ax, surf(ax, az) + d.r, az), B = V(bx, surf(bx, bz) + d.r, bz);
    b.add(rod(A, B, d.r, 7), col(0x5e4a33));
    // 桅顶平台残片与横桁
    const top = B.clone().lerp(A, 0.12);
    b.add(cyl(0.7, 0.75, 0.25, 8), shade(wood, 0.9), M(top.x, top.y + 0.1, top.z, 0, 0, 1.4));
    const yc = A.clone().lerp(B, 0.55);
    b.add(rod(V(yc.x - c * 3.2, yc.y + 0.2, yc.z + s * 3.2), V(yc.x + c * 3.2, surf(yc.x + c * 3.2, yc.z - s * 3.2) + 0.15, yc.z - s * 3.2), 0.12, 5), shade(wood, 0.85));
    // 帆索残段
    for (let k = 0; k < 5; k++) {
      const p = A.clone().lerp(B, 0.2 + k * 0.15);
      const q = V(p.x + rng.range(-2.4, 2.4), 0, p.z + rng.range(-2.4, 2.4)); q.y = surf(q.x, q.z) + 0.03;
      b.add(rod(p, q, 0.03, 3), col(0x2d261c));
    }
    // 残帆一角
    const sp = A.clone().lerp(B, 0.5);
    const sail = new Builder();
    sail.quad(V(0, 0, 0), V(2.2, 0.1, 0.2), V(2.6, 0.05, 2.0), V(0.3, 0.12, 2.4), col(0x8f856a));
    b.add(sail.build(), null, M(sp.x, surf(sp.x, sp.z) + 0.06, sp.z, 0, d.yaw + 0.7, 0));
    return true;
  }
  return false;
}

// 贴地痕迹：顶点色带 alpha 的条带/圆片
const decalMatCache = {};
export function decalMaterial() {
  if (decalMatCache.m) return decalMatCache.m;
  const m = new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
  patchMaterial(m, { key: 'decal' });
  decalMatCache.m = m;
  return m;
}

// 生成条带（a→b，宽 w），color(t,u)->[r,g,b,a]
export function stripDecal(ax, az, bx, bz, w, colorFn, surf, segs = 20) {
  const pos = [], colr = [], idx = [];
  const L = Math.hypot(bx - ax, bz - az) || 1;
  const nx = -(bz - az) / L, nz = (bx - ax) / L;
  const nu = 4;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    for (let j = 0; j <= nu; j++) {
      const u = j / nu - 0.5;
      const x = ax + (bx - ax) * t + nx * u * w, z = az + (bz - az) * t + nz * u * w;
      pos.push(x, surf(x, z) + 0.03, z);
      const c = colorFn(t, u * 2);
      colr.push(c[0], c[1], c[2], c[3]);
    }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < nu; j++) {
    const a = i * (nu + 1) + j, b2 = a + 1, c2 = a + nu + 1, d2 = c2 + 1;
    idx.push(a, c2, b2, b2, c2, d2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 4));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
export function discDecal(cx, cz, r, colorFn, surf, rings = 6, segs = 18) {
  const pos = [], colr = [], idx = [];
  pos.push(cx, surf(cx, cz) + 0.035, cz);
  let c0 = colorFn(0, 0); colr.push(c0[0], c0[1], c0[2], c0[3]);
  for (let i = 1; i <= rings; i++) for (let j = 0; j < segs; j++) {
    const a = j / segs * Math.PI * 2, rr = r * i / rings;
    const x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr;
    pos.push(x, surf(x, z) + 0.035, z);
    const c = colorFn(i / rings, a); colr.push(c[0], c[1], c[2], c[3]);
  }
  for (let j = 0; j < segs; j++) idx.push(0, 1 + ((j + 1) % segs), 1 + j);
  for (let i = 1; i < rings; i++) for (let j = 0; j < segs; j++) {
    const a = 1 + (i - 1) * segs + j, b2 = 1 + (i - 1) * segs + (j + 1) % segs;
    const c2 = 1 + i * segs + j, d2 = 1 + i * segs + (j + 1) % segs;
    idx.push(a, b2, c2, b2, d2, c2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 4));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function markGeometry(m, surf) {
  if (m.kind === 'furrow') return stripDecal(m.ax, m.az, m.bx, m.bz, m.w, (t, u) => [0.32, 0.27, 0.2, (1 - Math.abs(u) ** 2) * 0.55 * Math.min(1, t * 4)], surf, 30);
  if (m.kind === 'drag') return stripDecal(m.ax, m.az, m.bx, m.bz, m.w, (t, u) => [0.42, 0.36, 0.26, (1 - Math.abs(u)) * 0.3 * (1 - t * 0.6)], surf, 24);
  if (m.kind === 'scratch') return stripDecal(m.ax, m.az, m.bx, m.bz, 0.35, (t, u) => [0.3, 0.25, 0.18, (Math.abs(Math.sin(u * 7)) > 0.6 ? 0.55 : 0.1)], surf, 8);
  if (m.kind === 'netmark') return discDecal(m.x, m.z, m.r, (t, a) => { const ring = Math.exp(-Math.pow((t - 0.9) * 6, 2)); return [0.24, 0.2, 0.15, Math.min(0.75, ring * 0.7 + 0.22 * (1 - t))]; }, surf, 7, 24);
  if (m.kind === 'imprint') return discDecal(m.x, m.z, m.r, (t) => [0.2, 0.17, 0.13, 0.65 * (1 - t * t)], surf, 4, 14);
  return null;
}

// 埋藏物上方的泥丘（可辨的隆起），实心几何
export function addMound(b, x, z, r, surf, mud = 0x6a5a44) {
  const y = surf(x, z);
  b.add(new THREE.SphereGeometry(r, 9, 4, 0, Math.PI * 2, 0, Math.PI / 2), shade(col(mud), 0.9), M(x, y - r * 0.12, z, 0, 0, 0, 1, 0.3, 1));
}

// —— 水上地标 ——
export function buildLandmark(lm, rng) {
  const b = new Builder();
  const y0 = Math.max(heightAt(lm.x, lm.z), -12);
  if (lm.kind === 'buoy') {
    b.add(cyl(0.55, 0.7, 1.4, 8), col(lm.color || 0xb03a2a), M(0, 0.2, 0));
    b.add(cone(0.45, 1.2, 8), col(lm.color || 0xb03a2a), M(0, 1.5, 0));
    b.add(box(0.7, 0.12, 0.12), col(0x222222), M(0, 2.0, 0));
    b.add(cyl(0.05, 0.05, 10, 4), col(0x3a3a34), M(0, -5, 0));
  } else if (lm.kind === 'tower') {
    const h = heightAt(lm.x, lm.z);
    for (let i = 0; i < 6; i++) b.add(cyl(3.2 - i * 0.12, 3.3 - i * 0.12, 2.2, 10), shade(col(0x8a8476), 0.9 + (i % 2) * 0.1), M(0, h + 1.1 + i * 2.2, 0));
    for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; if (k === 2 || k === 5) continue; b.add(box(1.0, 1.3 + (k % 3) * 0.6, 0.8), col(0x7a7468), M(Math.cos(a) * 2.8, h + 14.2, Math.sin(a) * 2.8, 0, -a, 0)); }
    b.add(box(1.0, 1.8, 0.4), col(0x1e1c18), M(0, h + 6, 3.0));
  } else if (lm.kind === 'stack') {
    for (let i = 0; i < 2; i++) {
      const hgt = 14 + i * 5;
      const r = 4;
      b.add(rock(r, rng, 1, hgt / r), shade(col(0x7a7466), 0.85 + rng.next() * 0.25), M(i * 5 - 2, y0 + hgt * 0.45 - 2, rng.range(-3, 3)));
    }
  }
  return b.build();
}

// —— 出发港口的码头（开局身后的景，不能靠泊）：栈桥、仓房、吊杆、油罐、灯 ——
// 一样样东西摆出来：一条条带缝的桥板、侧梁和桩、带帽的系缆桩、挂在桩上的旧轮胎；桥头马灯杆、货箱油桶；
// 仓房有门窗、檐口、烟囱、墙板线；油罐有箍、爬梯，一根油管顺着栈桥拉到泊位边上
export function buildPort(p, rng) {
  const b = new Builder();
  const wood = col(0x6e5a40), dark = col(0x3e3226), roof = col(0x7a3b2a), wall = col(0xcbbf9e), stone = col(0x8a8476), iron = col(0x3a3430);
  // 栈桥（向南伸出）：每块板明暗不一，板缝透下去
  const L = 26, n = 34;
  for (let i = 0; i < n; i++) {
    const z = (i + 0.5) * L / n, f = 0.82 + rng.next() * 0.28;
    b.add(box(4.2 + rng.range(-0.05, 0.05), 0.2, L / n - 0.07), shade(wood, f), M(rng.range(-0.04, 0.04), 1.42, z, 0, rng.range(-0.012, 0.012), 0));
    if (rng.next() < 0.18) b.add(box(0.06, 0.03, 0.06), iron, M(-1.6, 1.53, z)), b.add(box(0.06, 0.03, 0.06), iron, M(1.6, 1.53, z));
  }
  for (const x of [-2.0, 2.0]) b.add(box(0.22, 0.4, L + 0.4), shade(dark, 1.1), M(x, 1.15, L / 2));
  for (let i = 0; i <= 9; i++) for (const x of [-1.9, 1.9]) {
    b.add(cyl(0.18, 0.21, 7, 7), shade(wood, 0.72 + (i % 3) * 0.05), M(x, -2.0, i * L / 9));
    b.add(cyl(0.22, 0.22, 0.5, 7), col(0x2e4a3a), M(x, -0.2, i * L / 9)); // 潮线上的绿苔
    if (i > 0) b.add(rod(V(x, 0.8, (i - 1) * L / 9), V(x, -2.4, i * L / 9), 0.06, 4), shade(dark, 0.9)); // 斜撑
  }
  // 旧轮胎护舷（挂在东侧桩上）与系泊桩（带帽）
  for (const z of [5.8, 14.5, 23.2]) { b.add(tor(0.42, 0.16, 6, 12), col(0x1c1c1c), M(2.25, 0.85, z, 0, Math.PI / 2, 0)); b.add(rod(V(2.15, 1.35, z), V(2.25, 1.2, z), 0.03, 3), iron); }
  for (const z of [8, 17, 25]) { b.add(cyl(0.22, 0.24, 0.7, 8), iron, M(1.7, 1.85, z)); b.add(cyl(0.3, 0.3, 0.1, 8), shade(iron, 1.2), M(1.7, 2.25, z)); }
  // 桥头马灯杆：灯罩、玻璃、帽
  b.add(cyl(0.09, 0.11, 4.2, 6), col(0x2a2a26), M(-1.7, 3.6, L - 0.6));
  b.add(box(0.7, 0.08, 0.08), col(0x2a2a26), M(-1.45, 5.55, L - 0.6));
  b.add(box(0.42, 0.55, 0.42), col(0xf6d88a), M(-1.15, 5.15, L - 0.6));
  b.add(cone(0.36, 0.3, 4), col(0x22221e), M(-1.15, 5.58, L - 0.6, 0, Math.PI / 4, 0));
  // 桥上摆的货：箱子、油桶、盘起来的缆
  const crate = (x, z, s, yaw) => { b.add(box(s, s * 0.8, s), shade(col(0x8a6a44), 0.9 + rng.next() * 0.2), M(x, 1.52 + s * 0.4, z, 0, yaw, 0)); b.add(box(s + 0.02, 0.06, s + 0.02), dark, M(x, 1.52 + s * 0.68, z, 0, yaw, 0)); };
  crate(-1.2, 3.2, 0.8, 0.2); crate(-1.15, 4.1, 0.6, -0.15); crate(-1.3, 3.5, 0.55, 0.6);
  for (const [x, z, c] of [[1.2, 2.6, 0x3a5a6a], [1.35, 3.4, 0x7a3a2a]]) { b.add(cyl(0.3, 0.3, 0.86, 10), col(c), M(x, 1.95, z)); for (const y of [1.7, 2.2]) b.add(cyl(0.31, 0.31, 0.05, 10), shade(col(c), 0.6), M(x, y, z)); }
  b.add(tor(0.32, 0.09, 5, 12), col(0x8a7448), M(-1.0, 1.62, 12, Math.PI / 2, 0, 0)); b.add(tor(0.22, 0.08, 5, 12), col(0x8a7448), M(-1.0, 1.78, 12, Math.PI / 2, 0, 0));
  // 岸上建筑
  const shore = heightAt(0, -12);
  for (let k = 0; k < 4; k++) {
    const x = -16 + k * 10 + rng.range(-1, 1), z = -14 - rng.range(0, 7), h = 4 + rng.next() * 2.5;
    const gy = Math.max(heightAt(p.x + x, p.z + z), 0.6);
    const wc = shade(wall, 0.9 + rng.next() * 0.15);
    b.add(box(7, h, 6), wc, M(x, gy + h / 2, z));
    b.add(box(7.2, 0.5, 6.2), shade(stone, 0.8), M(x, gy + 0.25, z)); // 石勒脚
    for (let j = 1; j < 4; j++) b.add(box(7.04, 0.05, 6.04), shade(wc, 0.86), M(x, gy + j * h / 4, z)); // 墙板线
    for (const sx of [-1, 1]) b.add(box(0.18, h, 0.18), shade(wood, 0.8), M(x + sx * 3.45, gy + h / 2, z + 2.95)); // 角柱
    b.add(box(7.6, 0.3, 4.2), roof, M(x, gy + h + 1.0, z - 1.4, 0.55, 0, 0));
    b.add(box(7.6, 0.3, 4.2), shade(roof, 0.85), M(x, gy + h + 1.0, z + 1.4, -0.55, 0, 0));
    b.add(box(7.7, 0.22, 0.3), shade(roof, 0.6), M(x, gy + h + 2.2, z)); // 屋脊
    b.add(box(0.7, 1.6, 0.7), shade(stone, 0.95), M(x + 2.0, gy + h + 2.0, z - 0.8)); // 烟囱
    b.add(box(1.4, 2.4, 0.12), col(0x3a2c20), M(x, gy + 1.2, z + 3.05)); // 门框
    b.add(box(1.1, 2.1, 0.12), col(0x5a3a26), M(x, gy + 1.08, z + 3.08));
    for (const sx of [-2.2, 2.2]) { b.add(box(1.1, 0.95, 0.1), col(0x2a2c26), M(x + sx, gy + h * 0.62, z + 3.04)); b.add(box(1.2, 0.08, 0.16), shade(wood, 0.9), M(x + sx, gy + h * 0.62 - 0.52, z + 3.1)); b.add(box(0.06, 0.95, 0.12), wc, M(x + sx, gy + h * 0.62, z + 3.07)); }
  }
  // 码头吊杆（立柱、吊臂、钢缆、吊钩）
  b.add(cyl(0.3, 0.38, 8, 8), col(0x4a4038), M(-4, 4.5, -2));
  b.add(cyl(0.55, 0.6, 0.5, 8), shade(stone, 0.8), M(-4, 0.75, -2));
  b.add(rod(V(-4, 8, -2), V(-1, 9, 9), 0.18, 6), col(0x8a6a2a));
  b.add(rod(V(-4, 8.6, -2), V(-1, 9, 9), 0.035, 3), iron);
  b.add(rod(V(-1, 9, 9), V(-1, 6.2, 9), 0.025, 3), iron);
  b.add(tor(0.12, 0.035, 4, 8, Math.PI * 1.4), iron, M(-1, 6.05, 9));
  // 油罐：箍、爬梯、管子顺着栈桥拉到泊位
  for (const [x, c] of [[6, 0x8a3a2a], [9.3, 0x7a3a2a]]) {
    b.add(cyl(1.4, 1.4, 3, 14), col(c), M(x, 2.2, -4));
    for (const y of [1.1, 2.2, 3.3]) b.add(cyl(1.43, 1.43, 0.07, 14), shade(col(c), 0.62), M(x, y, -4));
    b.add(cyl(1.0, 1.42, 0.35, 14), shade(col(c), 0.85), M(x, 3.88, -4));
    for (const y of [0.9, 1.5, 2.1, 2.7, 3.3]) b.add(box(0.5, 0.05, 0.05), iron, M(x, y, -2.55));
    for (const sx of [-0.25, 0.25]) b.add(box(0.05, 3.0, 0.05), iron, M(x + sx, 2.2, -2.55));
  }
  b.add(rod(V(6, 0.9, -2.6), V(2.5, 1.0, 0.2), 0.08, 5), col(0x1e1e1c));
  b.add(rod(V(2.5, 1.0, 0.2), V(1.8, 1.6, L - 2), 0.08, 5), col(0x1e1e1c));
  b.add(cyl(0.16, 0.16, 0.5, 6), col(0xc9a24a), M(1.8, 1.85, L - 2));
  // 石堤
  for (let i = 0; i < 8; i++) b.add(rock(1.6, rng, 1, 0.8), shade(stone, 0.9 + rng.next() * 0.2), M(-8 - i * 1.5, 0.3, -2 + i * 2.2));
  return b.build();
}
